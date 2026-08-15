import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join } from 'node:path'

const require = createRequire(import.meta.url)

const PROFILE_PATCH_TEMPLATE = `# Your patch layer for this dsh profile, applied after every bundle layer:\n# a top-level YAML array of loader patch entries (id-targeted config\n# overrides, disables, and insert lists; \`!!js\` expressions allowed).\n[]\n`
const PROFILE_PNPM_WORKSPACE = `packages:\n  - .\n\nnodeLinker: hoisted\nautoInstallPeers: false\n\n# node-pty has prebuilds on macOS/Windows and compiles on Linux.  pnpm 10
# requires explicit consent before it may run that native install script.
allowBuilds:\n  node-pty: true\n`
const DEFAULT_BUNDLES = ['@deepseek-ai/dsh-base']
const NATIVE_PTY_PACKAGE = 'node-pty'
const NATIVE_PTY_VERSION = '1.1.0'

type ProfileManifest = {
  name?: string
  private?: boolean
  dependencies?: Record<string, string>
  dsh?: { profile?: { bundles?: string[] } }
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
  return {
    command: process.execPath,
    // pnpm exports only its package manifest; derive the shipped bin from
    // that public entry instead of reaching through an unexported subpath.
    args: [join(dirname(require.resolve('pnpm')), 'bin', 'pnpm.cjs'), ...args],
  }
}

export function profileDirectory(dshHome: string, profile: string): string {
  if (profile === '' || /[\\/]/.test(profile) || profile === '.' || profile === '..' || profile === 'node_modules') {
    throw new Error(`invalid DSH profile name: ${JSON.stringify(profile)}`)
  }
  return join(dshHome, 'profiles', profile)
}

/** Create exactly the profile scaffold DSH's plugin command would create. */
export function ensureProfile(profileDir: string): void {
  mkdirSync(profileDir, { recursive: true })
  const manifestPath = join(profileDir, 'package.json')
  let manifest: ProfileManifest
  if (!existsSync(manifestPath)) {
    manifest = {
      name: `dsh-profile-${basename(profileDir)}`,
      private: true,
      // Keep this direct: pnpm 10 can decline lifecycle scripts for a
      // transitive native dependency, leaving Linux without pty.node.
      dependencies: { [NATIVE_PTY_PACKAGE]: NATIVE_PTY_VERSION },
      dsh: { profile: { bundles: [...DEFAULT_BUNDLES] } },
    }
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  } else {
    manifest = readManifest(profileDir)
    if (manifest.dependencies?.[NATIVE_PTY_PACKAGE] === undefined) {
      manifest.dependencies = { ...manifest.dependencies, [NATIVE_PTY_PACKAGE]: NATIVE_PTY_VERSION }
      writeManifest(profileDir, manifest)
    }
  }
  const patchPath = join(profileDir, 'cordis.patch.yml')
  if (!existsSync(patchPath)) writeFileSync(patchPath, PROFILE_PATCH_TEMPLATE, 'utf8')
  const workspacePath = join(profileDir, 'pnpm-workspace.yaml')
  if (!existsSync(workspacePath)) writeFileSync(workspacePath, PROFILE_PNPM_WORKSPACE, 'utf8')
  else ensureNodePtyBuildPermission(workspacePath)
}

/** Preserve a user workspace configuration while granting the one native build
 * required by DSH's local shell provider. */
function ensureNodePtyBuildPermission(workspacePath: string): void {
  const current = readFileSync(workspacePath, 'utf8')
  if (/^\s*node-pty\s*:/m.test(current)) return

  const allowBuilds = /^allowBuilds:\s*\r?\n(?:^[ \t]+[^\r\n]*(?:\r?\n|$))*/m.exec(current)
  if (allowBuilds !== null) {
    const block = allowBuilds[0]
    const ending = block.endsWith('\n') ? '' : '\n'
    writeFileSync(workspacePath, current.replace(block, `${block}${ending}  node-pty: true\n`), 'utf8')
    return
  }

  writeFileSync(workspacePath, `${current.trimEnd()}\n\nallowBuilds:\n  node-pty: true\n`, 'utf8')
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

/** Run one pnpm profile mutation without invoking a shell on any platform. */
export function runBundledPnpm(profileDir: string, args: readonly string[]): number {
  ensureProfile(profileDir)
  const invocation = bundledPnpmInvocation(args)
  const result = spawnSync(invocation.command, invocation.args, { cwd: profileDir, stdio: 'inherit' })
  if (result.error !== undefined) throw result.error
  if (result.status === 0) reconcileProfileBundles(profileDir)
  return result.status ?? 1
}

/** Async counterpart used by in-TUI plugin management after unmounting. */
export function runBundledPnpmAsync(profileDir: string, args: readonly string[]): Promise<number> {
  ensureProfile(profileDir)
  const invocation = bundledPnpmInvocation(args)
  return new Promise(resolve => {
    const child = spawn(invocation.command, invocation.args, { cwd: profileDir, stdio: 'inherit' })
    child.once('error', error => {
      process.stderr.write(`cute-dsh-tui: failed to run bundled pnpm: ${error.message}\n`)
      resolve(127)
    })
    child.once('close', code => {
      if (code === 0) {
        try {
          reconcileProfileBundles(profileDir)
        } catch (error) {
          process.stderr.write(`cute-dsh-tui: could not reconcile profile bundles: ${error instanceof Error ? error.message : String(error)}\n`)
          resolve(1)
          return
        }
      }
      resolve(code ?? 1)
    })
  })
}

/** The directory holding a resolved package script, useful for diagnostics. */
export function bundledRuntimeDirectory(): string {
  return dirname(require.resolve('@deepseek-ai/dsh/lib/bin.js'))
}
