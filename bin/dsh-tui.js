#!/usr/bin/env node
/**
 * Portable dsh-TUI launcher.
 *
 * It verifies the DSH CLI, creates the dsh-tui profile on first use, handles
 * TUI-owned launch flags, then forwards the remaining arguments to
 * `dsh --profile dsh-tui`.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LAUNCHER_USAGE, applyLaunchEnvironment, parseLaunchArgs } from './launch-options.js'

const here = fileURLToPath(new URL('.', import.meta.url))
const ownVersion = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8')).version
const PACKAGE = '@deepseek-harness-tui/dsh-tui'
const PROFILE = 'dsh-tui'

// React's development renderer retains unbounded performance measures during
// long sessions, so production is the safe default for every entry point.
process.env.NODE_ENV ??= 'production'

const isWin = process.platform === 'win32'
const shellOpt = isWin ? { shell: true } : {}
// The local G:\DSH command shim pins this to its isolated RC6 runtime. A
// normal package installation keeps the portable `dsh` default.
const dshBin = process.env.DSH_TUI_DSH_BIN || 'dsh'

const launch = parseLaunchArgs(process.argv.slice(2))
if (launch.showHelp) {
  process.stdout.write(LAUNCHER_USAGE)
  process.exit(0)
}
if (launch.error !== undefined) {
  console.error(`[dsh-tui] ${launch.error}`)
  process.exit(2)
}
if (launch.showVersion) {
  const version = spawnSync(dshBin, ['--version'], { stdio: 'inherit', ...shellOpt })
  if (version.error) {
    console.error(`[dsh-tui] failed to run dsh: ${version.error.message}`)
    process.exit(1)
  }
  process.exit(version.status ?? 1)
}
applyLaunchEnvironment(launch.environment)

// Verify the DSH CLI before attempting profile bootstrap.
const probe = spawnSync(dshBin, ['--version'], { stdio: 'pipe', ...shellOpt })
if (probe.error || probe.status !== 0) {
  console.error('[dsh-tui] dsh CLI was not found. Install it first:')
  console.error('  npm install -g @deepseek-ai/dsh')
  process.exit(1)
}

// Ensure the profile exists. This keeps the published `dsh-tui` command
// self-contained while the local wrapper uses the same isolated profile.
const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh')
const profileDir = join(dshHome, 'profiles', PROFILE)
if (!existsSync(join(profileDir, 'node_modules', '@deepseek-harness-tui', 'dsh-tui'))) {
  const pnpmProbe = spawnSync('pnpm', ['--version'], { stdio: 'pipe', ...shellOpt })
  if (pnpmProbe.error || pnpmProbe.status !== 0) {
    console.error('[dsh-tui] pnpm is required for the first profile install:')
    console.error('  npm install -g pnpm')
    process.exit(1)
  }
  console.log(`[dsh-tui] initializing ${PROFILE} profile (${PACKAGE}@${ownVersion})...`)
  const add = spawnSync(
    dshBin,
    ['plugin', '--profile', PROFILE, 'add', `${PACKAGE}@${ownVersion}`],
    { stdio: 'inherit', ...shellOpt },
  )
  if (add.status !== 0) {
    console.error('[dsh-tui] profile installation failed. Retry manually with:')
    console.error(`  dsh plugin --profile ${PROFILE} add ${PACKAGE}@${ownVersion}`)
    process.exit(add.status ?? 1)
  }
}

const child = spawn(dshBin, ['--profile', PROFILE, ...launch.dshArgs], {
  stdio: 'inherit',
  env: process.env,
  ...shellOpt,
})
child.on('error', (error) => {
  console.error(`[dsh-tui] launch failed: ${error.message}`)
  process.exit(1)
})
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 0)
})
