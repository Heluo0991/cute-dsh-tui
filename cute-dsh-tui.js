#!/usr/bin/env node
/**
 * Portable CuteDshTui launcher.
 *
 * It verifies the DSH CLI, creates the cute-dsh-tui profile on first use, handles
 * TUI-owned launch flags, then forwards the remaining arguments to
 * `dsh --profile cute-dsh-tui`.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LAUNCHER_USAGE, applyLaunchEnvironment, parseLaunchArgs, resolveLaunchWorkspace } from './launch-options.js'

const here = fileURLToPath(new URL('.', import.meta.url))
const ownVersion = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8')).version
const PACKAGE = '@heluo0991/cute-dsh-tui'
const PROFILE = 'cute-dsh-tui'
// Set only by the repository's legacy `dsh` shim. A published executable must
// always install the exact npm version; local development must instead load
// the working tree, which can legitimately be ahead of npm during a release.
const devPackagePath = process.env.CUTE_DSH_TUI_DEV_PATH
const packageSpec = devPackagePath
  ? `link:${devPackagePath.replaceAll('\\', '/')}`
  : `${PACKAGE}@${ownVersion}`

// React's development renderer retains unbounded performance measures during
// long sessions, so production is the safe default for every entry point.
process.env.NODE_ENV ??= 'production'

const isWin = process.platform === 'win32'
const shellOpt = isWin ? { shell: true } : {}
// The local G:\DSH command shim pins this to its isolated RC6 runtime. A
// normal package installation keeps the portable `dsh` default.
const dshBin = process.env.CUTE_DSH_TUI_DSH_BIN || process.env.DSH_TUI_DSH_BIN || 'dsh'

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
  const version = spawnSync(dshBin, ['--version'], { stdio: 'inherit', ...shellOpt })
  if (version.error) {
    console.error(`[cute-dsh-tui] failed to run dsh: ${version.error.message}`)
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

// Verify the DSH CLI before attempting profile bootstrap.
const probe = spawnSync(dshBin, ['--version'], { stdio: 'pipe', ...shellOpt })
if (probe.error || probe.status !== 0) {
  console.error('[cute-dsh-tui] dsh CLI was not found. Install it first:')
  console.error('  npm install -g @deepseek-ai/dsh')
  console.error('[cute-dsh-tui] Then open a new terminal if your global npm bin directory is not on PATH.')
  process.exit(1)
}

// Ensure the profile exists. This keeps the published `cute-dsh-tui` command
// self-contained while the local wrapper uses the same isolated profile.
const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh')
const profileDir = join(dshHome, 'profiles', PROFILE)
const installedPackageDir = join(profileDir, 'node_modules', '@heluo0991', 'cute-dsh-tui')
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
if (!existsSync(installedPackageDir) || (devPackagePath && !linkedToDevelopmentTree)) {
  const pnpmProbe = spawnSync('pnpm', ['--version'], { encoding: 'utf8', ...shellOpt })
  const pnpmVersion = typeof pnpmProbe.stdout === 'string' ? pnpmProbe.stdout.trim() : ''
  const pnpmMajor = Number.parseInt(pnpmVersion.split('.')[0] ?? '', 10)
  if (pnpmProbe.error || pnpmProbe.status !== 0 || !Number.isInteger(pnpmMajor) || pnpmMajor < 10) {
    console.error('[cute-dsh-tui] pnpm 10 or newer is required for the first profile install:')
    console.error('  npm install -g pnpm@latest')
    console.error('  # or: corepack enable pnpm')
    process.exit(1)
  }
  console.log(`[cute-dsh-tui] initializing ${PROFILE} profile (${packageSpec})...`)
  const add = spawnSync(
    dshBin,
    ['plugin', '--profile', PROFILE, 'add', packageSpec],
    { stdio: 'inherit', ...shellOpt },
  )
  if (add.status !== 0) {
    console.error('[cute-dsh-tui] profile installation failed. Retry manually with:')
    console.error(`  dsh plugin --profile ${PROFILE} add ${packageSpec}`)
    process.exit(add.status ?? 1)
  }
}

const child = spawn(dshBin, ['--profile', PROFILE, ...launch.dshArgs], {
  stdio: 'inherit',
  env: process.env,
  ...shellOpt,
})
child.on('error', (error) => {
  console.error(`[cute-dsh-tui] launch failed: ${error.message}`)
  process.exit(1)
})
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 0)
})
