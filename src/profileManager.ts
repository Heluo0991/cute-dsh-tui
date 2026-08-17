import { spawn, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join } from 'node:path'

const require = createRequire(import.meta.url)

const PROFILE_PATCH_TEMPLATE = `# Your patch layer for this dsh profile, applied after every bundle layer:\n# a top-level YAML array of loader patch entries (id-targeted config\n# overrides, disables, and insert lists; \`!!js\` expressions allowed).\n[]\n`
const PROFILE_PNPM_WORKSPACE = `packages:\n  - .\n\nnodeLinker: hoisted\nautoInstallPeers: false\n`
const DEFAULT_BUNDLES = ['@deepseek-ai/dsh-base']
const NATIVE_PTY_PACKAGE = 'node-pty'
const NATIVE_PTY_VERSION = '1.1.0'
/** Production dependencies whose prepare scripts are not needed by cdsh.
 * Declaring them keeps pnpm 10 from printing its "Ignored build scripts"
 * warning box on every profile bootstrap. */
const IGNORED_BUILT_DEPENDENCIES = [
  '@alcalzone/ansi-tokenize',
  'code-excerpt',
  'signal-exit',
]
const PNPM_TIMEOUT_MS = 180_000
const PNPM_OUTPUT_LIMIT = 120_000

type ProfileManifest = {
  name?: string
  private?: boolean
  dependencies?: Record<string, string>
  dsh?: { profile?: { bundles?: string[] } }
  pnpm?: {
    onlyBuiltDependencies?: string[]
    ignoredBuiltDependencies?: string[]
  }
}

export interface ProcessInvocation {
  command: string
  args: string[]
}

/** Resolve the packaged DSH executable instead of looking up the user's `dsh`. */
export function bundledDshInvocation(args: readonly string[]): ProcessInvocation {
  return {
    command: process.execPath,
    args: [require.resolve('@deepseek-ai/dsh/lib/bin.js'), ...args],
  }
}

/** Resolve pnpm's JavaScript entry point so Windows never needs `shell: true`. */
export function bundledPnpmInvocation(args: readonly string[]): ProcessInvocation {
  const reporter = args.some(arg => arg.startsWith('--reporter'))
    ? []
    : ['--reporter=append-only']
  return {
    command: process.execPath,
    // pnpm exports only its package manifest; derive the shipped bin from
    // that public entry instead of reaching through an unexported subpath.
    args: [join(dirname(require.resolve('pnpm')), 'bin', 'pnpm.cjs'), ...reporter, ...args],
  }
}

export function profileDirectory(dshHome: string, profile: string): string {
  if (profile === '' || /[\\/]/.test(profile) || profile === '.' || profile === '..' || profile === 'node_modules') {
    throw new Error(`invalid DSH profile name: ${JSON.stringify(profile)}`)
  }
  return join(dshHome, 'profiles', profile)
}

/**
 * Repair a profile dependency as an explicit directory link for local
 * development. pnpm 10 serializes a Windows cross-volume `link:` target as a
 * relative path, so the generated profile link can otherwise point at a
 * literal `G:` child of the profile. This helper only replaces an existing
 * symlink/junction; it refuses to remove a real installed package.
 */
export function linkProfileDependency(profileDir: string, packageName: string, targetDirectory: string): void {
  const segments = packageName.split('/')
  if (segments.length > 2 || segments.some(segment => segment === '' || segment === '.' || segment === '..' || /[\\/]/.test(segment))) {
    throw new Error(`invalid package name for profile link: ${JSON.stringify(packageName)}`)
  }
  const target = realpathSync(targetDirectory)
  const packageDir = join(profileDir, 'node_modules', ...segments)
  let existing: ReturnType<typeof lstatSync> | undefined
  try {
    existing = lstatSync(packageDir)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  if (existing !== undefined) {
    if (!existing.isSymbolicLink()) {
      throw new Error(`refusing to replace non-link profile dependency: ${packageDir}`)
    }
    unlinkSync(packageDir)
  }
  mkdirSync(dirname(packageDir), { recursive: true })
  symlinkSync(target, packageDir, process.platform === 'win32' ? 'junction' : 'dir')
}

function defaultProfileManifest(profileDir: string): ProfileManifest {
  return {
    name: `dsh-profile-${basename(profileDir)}`,
    private: true,
    // Keep this direct: pnpm 10 can decline lifecycle scripts for a
    // transitive native dependency, leaving Linux without pty.node.
    dependencies: { [NATIVE_PTY_PACKAGE]: NATIVE_PTY_VERSION },
    // pnpm 10 reads this build allow-list from the project manifest, not
    // pnpm-workspace.yaml (where newer pnpm versions support allowBuilds).
    pnpm: {
      onlyBuiltDependencies: [NATIVE_PTY_PACKAGE],
      ignoredBuiltDependencies: IGNORED_BUILT_DEPENDENCIES,
    },
    dsh: { profile: { bundles: [...DEFAULT_BUNDLES] } },
  }
}

function isJsonSyntaxError(error: unknown): boolean {
  return error instanceof SyntaxError
}

/**
 * Preserve a manifest that cannot be parsed before `ensureProfile` rebuilds
 * the default scaffold. The backup keeps the user's broken file for manual
 * repair instead of silently discarding it.
 */
function backupCorruptManifest(profileDir: string): string {
  const manifestPath = join(profileDir, 'package.json')
  const backupPath = join(profileDir, `package.json.corrupt-${Date.now()}.bak`)
  copyFileSync(manifestPath, backupPath)
  return backupPath
}

/** Create exactly the profile scaffold DSH's plugin command would create. */
export function ensureProfile(profileDir: string): void {
  mkdirSync(profileDir, { recursive: true })
  const manifestPath = join(profileDir, 'package.json')
  let manifest: ProfileManifest
  if (!existsSync(manifestPath)) {
    manifest = defaultProfileManifest(profileDir)
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  } else {
    try {
      manifest = readManifest(profileDir)
    } catch (error) {
      if (!isJsonSyntaxError(error)) throw error
      const backupPath = backupCorruptManifest(profileDir)
      process.stderr.write(
        `[cute-dsh-tui] profile package.json is invalid and was backed up to:\n  ${backupPath}\n  Rebuilding the default profile scaffold; reinstall any custom profile plugins afterwards.\n`,
      )
      manifest = defaultProfileManifest(profileDir)
      writeManifest(profileDir, manifest)
    }
    let changed = false
    if (manifest.dependencies?.[NATIVE_PTY_PACKAGE] === undefined) {
      manifest.dependencies = { ...manifest.dependencies, [NATIVE_PTY_PACKAGE]: NATIVE_PTY_VERSION }
      changed = true
    }
    if (!manifest.pnpm?.onlyBuiltDependencies?.includes(NATIVE_PTY_PACKAGE)) {
      manifest.pnpm = {
        ...manifest.pnpm,
        onlyBuiltDependencies: [...new Set([...(manifest.pnpm?.onlyBuiltDependencies ?? []), NATIVE_PTY_PACKAGE])],
      }
      changed = true
    }
    const ignored = new Set(manifest.pnpm?.ignoredBuiltDependencies ?? [])
    for (const name of IGNORED_BUILT_DEPENDENCIES) {
      if (!ignored.has(name)) {
        ignored.add(name)
        changed = true
      }
    }
    if (changed && manifest.pnpm !== undefined) {
      manifest.pnpm = {
        ...manifest.pnpm,
        ignoredBuiltDependencies: [...ignored],
      }
    }
    if (changed) writeManifest(profileDir, manifest)
  }
  const patchPath = join(profileDir, 'cordis.patch.yml')
  if (!existsSync(patchPath)) writeFileSync(patchPath, PROFILE_PATCH_TEMPLATE, 'utf8')
  const workspacePath = join(profileDir, 'pnpm-workspace.yaml')
  if (!existsSync(workspacePath)) writeFileSync(workspacePath, PROFILE_PNPM_WORKSPACE, 'utf8')
}

/** The profile uses pnpm's hoisted linker, so this covers both a prebuilt
 * platform module and Linux's node-gyp output. */
export function profileHasNativePty(profileDir: string): boolean {
  const packageDir = join(profileDir, 'node_modules', 'node-pty')
  return [
    join(packageDir, 'build', 'Release', 'pty.node'),
    join(packageDir, 'prebuilds', `${process.platform}-${process.arch}`, 'pty.node'),
  ].some(existsSync)
}

function readManifest(profileDir: string): ProfileManifest {
  return JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8')) as ProfileManifest
}

function writeManifest(profileDir: string, manifest: ProfileManifest): void {
  writeFileSync(join(profileDir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

function packageExportsPatch(profileDir: string, name: string): boolean {
  try {
    const profileRequire = createRequire(join(profileDir, 'package.json'))
    const manifestPath = profileRequire.resolve(`${name}/package.json`)
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      dsh?: { bundle?: { patch?: unknown } }
    }
    return manifest.dsh?.bundle?.patch !== undefined
  } catch {
    return false
  }
}

/**
 * Reconcile bundle layers after a pnpm mutation. This mirrors DSH's public
 * `plugin` subcommand while avoiding its Windows shell invocation.
 */
export function reconcileProfileBundles(profileDir: string): void {
  const manifest = readManifest(profileDir)
  const dependencies = Object.keys(manifest.dependencies ?? {})
  const bundles = manifest.dsh?.profile?.bundles ?? [...DEFAULT_BUNDLES]
  const retained = bundles.filter(name => DEFAULT_BUNDLES.includes(name) || (
    dependencies.includes(name) && packageExportsPatch(profileDir, name)
  ))
  for (const dependency of dependencies) {
    if (packageExportsPatch(profileDir, dependency) && !retained.includes(dependency)) retained.push(dependency)
  }
  manifest.dsh = { ...manifest.dsh, profile: { ...manifest.dsh?.profile, bundles: retained } }
  writeManifest(profileDir, manifest)
}

function pnpmChildEnvironment(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    // Launcher output stays professional: pnpm's audit/fund/update-notifier
    // notices are never actionable during a profile bootstrap.
    npm_config_audit: 'false',
    npm_config_fund: 'false',
    npm_config_update_notifier: 'false',
  }
}

function verbosePnpm(): boolean {
  return process.env.CUTE_DSH_TUI_DEBUG === '1' || process.env.CUTE_DSH_TUI_VERBOSE === '1'
}

/**
 * pnpm output policy: quiet on success, full captured output on failure or
 * when `CUTE_DSH_TUI_DEBUG=1` / `CUTE_DSH_TUI_VERBOSE=1`. Warnings such as
 * ignored-build boxes or deprecations are classified noise; errors must
 * never be hidden.
 */
function writePnpmOutput(stdout: string, stderr: string, code: number | null): void {
  if (code === 0 && !verbosePnpm()) return
  const tail = (text: string): string =>
    text.length > PNPM_OUTPUT_LIMIT
      ? `…${text.slice(-PNPM_OUTPUT_LIMIT)}`
      : text
  if (stdout.length > 0) process.stdout.write(tail(stdout))
  if (stderr.length > 0) process.stderr.write(tail(stderr))
}

/** Run one pnpm profile mutation without invoking a shell on any platform. */
export function runBundledPnpm(profileDir: string, args: readonly string[]): number {
  ensureProfile(profileDir)
  const invocation = bundledPnpmInvocation(args)
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: profileDir,
    encoding: 'utf8',
    env: pnpmChildEnvironment(),
    maxBuffer: 16 * 1024 * 1024,
    timeout: PNPM_TIMEOUT_MS,
  })
  if (result.error !== undefined) {
    if ((result.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
      throw new Error(`bundled pnpm timed out after ${PNPM_TIMEOUT_MS / 1000}s; check the registry/proxy and retry`)
    }
    throw result.error
  }
  const code = result.status ?? 1
  writePnpmOutput(result.stdout ?? '', result.stderr ?? '', result.status)
  if (result.signal !== null && result.signal !== undefined) {
    process.stderr.write(`cute-dsh-tui: bundled pnpm was stopped by signal ${result.signal}\n`)
    return 124
  }
  if (code === 0) reconcileProfileBundles(profileDir)
  return code
}

/** Async counterpart used by in-TUI plugin management after unmounting. */
export function runBundledPnpmAsync(profileDir: string, args: readonly string[]): Promise<number> {
  ensureProfile(profileDir)
  const invocation = bundledPnpmInvocation(args)
  return new Promise(resolve => {
    const child = spawn(invocation.command, invocation.args, {
      cwd: profileDir,
      env: pnpmChildEnvironment(),
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
    }, PNPM_TIMEOUT_MS)
    const collect = (target: 'stdout' | 'stderr', chunk: Buffer): void => {
      const buffer = target === 'stdout' ? stdout : stderr
      const next = buffer + chunk.toString('utf8')
      if (target === 'stdout') stdout = next.slice(-PNPM_OUTPUT_LIMIT)
      else stderr = next.slice(-PNPM_OUTPUT_LIMIT)
    }
    child.stdout?.on('data', (chunk: Buffer) => collect('stdout', chunk))
    child.stderr?.on('data', (chunk: Buffer) => collect('stderr', chunk))
    child.once('error', error => {
      clearTimeout(timer)
      process.stderr.write(`cute-dsh-tui: failed to run bundled pnpm: ${error.message}\n`)
      resolve(127)
    })
    child.once('close', code => {
      clearTimeout(timer)
      const exitCode = timedOut ? 124 : (code ?? 1)
      if (timedOut) {
        stderr += `\ncute-dsh-tui: bundled pnpm timed out after ${PNPM_TIMEOUT_MS / 1000}s\n`
      }
      if (exitCode === 0) {
        try {
          reconcileProfileBundles(profileDir)
        } catch (error) {
          process.stderr.write(`cute-dsh-tui: could not reconcile profile bundles: ${error instanceof Error ? error.message : String(error)}\n`)
          resolve(1)
          return
        }
      }
      writePnpmOutput(stdout, stderr, exitCode)
      resolve(exitCode)
    })
  })
}

/** The directory holding a resolved package script, useful for diagnostics. */
export function bundledRuntimeDirectory(): string {
  return dirname(require.resolve('@deepseek-ai/dsh/lib/bin.js'))
}
