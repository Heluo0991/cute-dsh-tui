#!/usr/bin/env node
/**
 * Portable CuteDshTui launcher.
 *
 * It uses its packaged DSH runtime, creates the cute-dsh-tui profile on first use, handles
 * TUI-owned launch flags, then forwards the remaining arguments to
 * `dsh --profile cute-dsh-tui`.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LAUNCHER_USAGE, applyLaunchEnvironment, parseLaunchArgs, resolveLaunchWorkspace } from './launch-options.js'
import { bundledDshInvocation, linkProfileDependency, profileDirectory, profileHasNativePty, reconcileProfileBundles, runBundledPnpm } from './lib/types/profileManager.js'

const here = fileURLToPath(new URL('.', import.meta.url))
const ownVersion = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8')).version
const PACKAGE = '@heluo0991/cute-dsh-tui'
const PROFILE = 'cute-dsh-tui'
// Set by the repository's legacy `dsh` shim or auto-detected when this file is
// run from a development checkout. A published executable must always install
// the exact npm version; local development must instead load the working tree,
// which can legitimately be ahead of npm during a release.
const isDevelopmentCheckout = existsSync(join(here, '.git')) && existsSync(join(here, 'package.json'))
const devPackagePath = process.env.CUTE_DSH_TUI_DEV_PATH ?? (isDevelopmentCheckout ? here : undefined)
const packageSpec = devPackagePath
  ? `link:${devPackagePath.replaceAll('\\', '/')}`
  : `${PACKAGE}@${ownVersion}`

// React's development renderer retains unbounded performance measures during
// long sessions, so production is the safe default for every entry point.
process.env.NODE_ENV ??= 'production'

const launch = parseLaunchArgs(process.argv.slice(2))
if (launch.showHelp) {
  process.stdout.write(LAUNCHER_USAGE)
  process.exit(0)
}
if (launch.error !== undefined) {
  console.error(`[cute-dsh-tui] ${launch.error}`)
  process.exit(2)
}
if (launch.showVersion) {
  const invocation = bundledDshInvocation(['--version'])
  const version = spawnSync(invocation.command, invocation.args, { stdio: 'inherit' })
  if (version.error) {
    console.error(`[cute-dsh-tui] failed to run the bundled DSH runtime: ${version.error.message}`)
    process.exit(1)
  }
  process.exit(version.status ?? 1)
}
applyLaunchEnvironment(launch.environment)

// npm's POSIX shim and the repository's Windows wrapper both arrive here.
// Resolve the workspace once in Node so CUTE_DSH_TUI_WORKSPACE is not a
// Windows-only contract and the resumed session stays scoped to that folder.
const workspace = resolveLaunchWorkspace()
try {
  if (!statSync(workspace).isDirectory()) throw new Error('not a directory')
  process.chdir(workspace)
} catch {
  console.error(`[cute-dsh-tui] CUTE_DSH_TUI_WORKSPACE is not a readable directory: ${workspace}`)
  process.exit(2)
}

// Verify the bundled DSH runtime before attempting profile bootstrap.
const probeInvocation = bundledDshInvocation(['--version'])
const probe = spawnSync(probeInvocation.command, probeInvocation.args, { stdio: 'pipe' })
if (probe.error || probe.status !== 0) {
  console.error('[cute-dsh-tui] bundled DSH runtime was not available. Reinstall CuteDshTui:')
  console.error(`  npm install -g ${PACKAGE}`)
  process.exit(1)
}

// Ensure the profile exists. This keeps the published `cute-dsh-tui` command
// self-contained while the local wrapper uses the same isolated profile.
const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh')
const profileDir = profileDirectory(dshHome, PROFILE)
const installedPackageDir = join(profileDir, 'node_modules', '@heluo0991', 'cute-dsh-tui')
const installedProfileVersion = (() => {
  if (!existsSync(installedPackageDir)) return undefined
  try {
    return JSON.parse(readFileSync(join(installedPackageDir, 'package.json'), 'utf8')).version
  } catch {
    return undefined
  }
})()
const linkedToDevelopmentTree = (() => {
  if (!devPackagePath || !existsSync(installedPackageDir)) return false
  try {
    return realpathSync(installedPackageDir) === realpathSync(devPackagePath)
  } catch {
    return false
  }
})()

// The development shim links the profile into this working tree. Normal npm
// installs retain their exact-version behavior and never take this branch.
// A global npm update must also update the isolated profile: DSH loads the
// plugin from this profile, not from the global launcher package.
const profileNeedsPackageInstall = !existsSync(installedPackageDir)
  || (devPackagePath ? !linkedToDevelopmentTree : installedProfileVersion !== ownVersion)
if (profileNeedsPackageInstall) {
  const action = existsSync(installedPackageDir) ? 'updating' : 'initializing'
  console.log(`[cute-dsh-tui] ${action} ${PROFILE} profile (${packageSpec})...`)
  let addCode
  try {
    addCode = runBundledPnpm(profileDir, ['add', packageSpec])
  } catch (error) {
    console.error(`[cute-dsh-tui] bundled profile installation failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
  if (addCode !== 0) {
    console.error('[cute-dsh-tui] profile installation failed. Retry manually with:')
    console.error(`  cdsh  # then retry after checking npm registry access`)
    process.exit(addCode)
  }
  if (devPackagePath) {
    try {
      linkProfileDependency(profileDir, PACKAGE, devPackagePath)
      // `runBundledPnpm()` reconciles before the Windows link repair above;
      // run it again so the repaired package is included as a DSH bundle.
      reconcileProfileBundles(profileDir)
    } catch (error) {
      console.error(`[cute-dsh-tui] development profile link failed: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    }
  }
}

// Older 1.1.1 profiles were created before pnpm was explicitly permitted to
// build node-pty.  Repair that profile before DSH loads its plugin tree, where
// an absent pty.node would otherwise surface as an opaque shell-provider error.
// pnpm records lifecycle scripts skipped at install time as "pending".  Build
// that queue first, then use a forced install only as a fallback for profiles
// created by older pnpm versions.
if (!profileHasNativePty(profileDir)) {
  console.log('[cute-dsh-tui] preparing the native terminal bridge...')
  let rebuildCode
  try {
    rebuildCode = runBundledPnpm(profileDir, ['rebuild', 'node-pty', '--reporter=append-only'])
    if (rebuildCode !== 0 || !profileHasNativePty(profileDir)) {
      console.log('[cute-dsh-tui] retrying native terminal setup...')
      rebuildCode = runBundledPnpm(profileDir, ['install', '--force', '--ignore-scripts=false', '--reporter=append-only'])
    }
  } catch (error) {
    console.error(`[cute-dsh-tui] native terminal setup failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
  if (rebuildCode !== 0 || !profileHasNativePty(profileDir)) {
    console.error('[cute-dsh-tui] node-pty is required for the local shell but could not be built.')
    if (process.platform === 'linux') {
      console.error('On Debian/Ubuntu run: sudo apt-get install -y build-essential python3; then run cdsh again.')
      console.error('On Alpine run: apk add --no-cache build-base python3; then run cdsh again.')
    } else if (process.platform === 'darwin') {
      console.error('Run: xcode-select --install; then run cdsh again.')
    } else {
      console.error('Reinstall @heluo0991/cute-dsh-tui and run cdsh again.')
    }
    console.error('If the error above is a network/registry/proxy failure, fix that first — the compiler toolchain may already be fine.')
    process.exit(rebuildCode || 1)
  }
}

if (process.env.CUTE_DSH_TUI_EXPERIMENTAL_V2 === '1') {
  const { runExperimentalProjection } = await import('./lib/types/experimentalProjection.js')
  const require = createRequire(import.meta.url)
  // The DSH profile composition includes Cordis HMR, which needs Node's
  // internal loader hooks. Keep this flag on the experimental core child
  // only; the default v1 launch path is unchanged.
  const invocation = {
    command: process.execPath,
    args: [
      '--expose-internals',
      require.resolve('@deepseek-ai/dsh/lib/bin.js'),
      '--profile',
      PROFILE,
      '--patch',
      join(here, 'core-bridge.patch.yml'),
    ],
  }
  try {
    await runExperimentalProjection({
      launch: {
        command: invocation.command,
        args: invocation.args,
        cwd: process.cwd(),
        env: process.env,
      },
      cwd: process.cwd(),
      sessionId: process.env.CUTE_DSH_TUI_RESUME_SESSION || undefined,
    })
    process.exit(0)
  } catch (error) {
    console.error(`[cute-dsh-tui] experimental v2 projection failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

const launchInvocation = bundledDshInvocation(['--profile', PROFILE, ...launch.dshArgs])
const child = spawn(launchInvocation.command, launchInvocation.args, {
  stdio: 'inherit',
  env: process.env,
})
child.on('error', (error) => {
  console.error(`[cute-dsh-tui] launch failed: ${error.message}`)
  process.exit(1)
})
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 0)
})
