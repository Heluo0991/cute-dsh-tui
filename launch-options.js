import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const RESUME_FILE = join(homedir(), '.cute-dsh-tui', 'resume.txt')

/** Help shown by both the packaged `cute-dsh-tui` launcher and the local `dsh` shim. */
export const LAUNCHER_USAGE = `Usage: dsh [launcher options] [dsh options]

  dsh                              Start CuteDshTui in the current directory.
  dsh --resume                     Choose a saved session for the current directory.
  dsh --resume <session-id>        Restore one session by its exact ID.
  dsh --resume --last              Restore the most recently used session.
  dsh --continue, dsh -c           Alias for --resume --last.
  dsh --yolo                       Run with danger-full-access and no approvals.
  dsh --experimental-v2            Run CuteDshTui's read-only experimental v2 projection.

  dsh --patch <path>               Forward an extra DSH patch overlay.
  dsh --dump-config                Forward a DSH diagnostic option.

Set CUTE_DSH_TUI_WORKSPACE to start from another working directory on Windows,
macOS, or Linux.

Launcher options are owned by CuteDshTui and are consumed before the official
DSH runtime is spawned; they are not official DSH flags. If your dsh is the
official CLI, use cute-dsh-tui or cdsh instead.
`

/**
 * Resolve the optional workspace override before spawning DSH.  Keeping this
 * platform-neutral is important: npm's generated POSIX bin shim invokes the
 * same JavaScript file as the Windows .cmd wrapper.
 */
export function resolveLaunchWorkspace(
  workspace = process.env.CUTE_DSH_TUI_WORKSPACE,
  cwd = process.cwd(),
) {
  return workspace?.trim() ? resolve(cwd, workspace) : cwd
}

function readLastSessionFromDisk() {
  try {
    const sessionId = readFileSync(RESUME_FILE, 'utf8').trim()
    return sessionId.length === 0 ? undefined : sessionId
  } catch {
    return undefined
  }
}

/**
 * Parse the small set of TUI-owned launch options without forwarding them to
 * DSH. Everything else remains a DSH CLI option. Keeping this parser pure
 * makes the Windows shim and the portable package entry point agree.
 */
export function parseLaunchArgs(argv, { readLastSession = readLastSessionFromDisk } = {}) {
  const dshArgs = []
  const environment = {}
  let showHelp = false
  let showVersion = false
  let error

  const clearPicker = () => {
    environment.CUTE_DSH_TUI_OPEN_RESUME_PICKER = undefined
  }
  const resumeExact = (sessionId) => {
    clearPicker()
    environment.CUTE_DSH_TUI_RESUME_SESSION = sessionId
  }
  const resumeLast = () => {
    clearPicker()
    environment.CUTE_DSH_TUI_RESUME_SESSION = readLastSession()
  }
  const openPicker = () => {
    environment.CUTE_DSH_TUI_RESUME_SESSION = undefined
    environment.CUTE_DSH_TUI_OPEN_RESUME_PICKER = '1'
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--') {
      dshArgs.push(...argv.slice(index))
      break
    }
    if (arg === '--help' || arg === '-h') {
      showHelp = true
      continue
    }
    if (arg === '--version') {
      showVersion = true
      continue
    }
    if (arg === '--yolo' || arg === '--dangerously-bypass-approvals-and-sandbox') {
      environment.DSH_PERMISSION_MODE = 'danger-full-access'
      environment.CUTE_DSH_TUI_YOLO = '1'
      continue
    }
    if (arg === '--experimental-v2') {
      environment.CUTE_DSH_TUI_EXPERIMENTAL_V2 = '1'
      continue
    }
    if (arg === '--continue' || arg === '-c') {
      resumeLast()
      continue
    }
    if (arg === '--resume' || arg === '-r') {
      const next = argv[index + 1]
      if (next === '--last' || next === '-l') {
        resumeLast()
        index += 1
      } else if (next === '--all') {
        error = '`dsh --resume --all` is intentionally unsupported: sessions are scoped to the current working directory.'
        index += 1
      } else if (next !== undefined && !next.startsWith('-')) {
        resumeExact(next)
        index += 1
      } else {
        openPicker()
      }
      continue
    }
    dshArgs.push(arg)
  }

  return { dshArgs, environment, showHelp, showVersion, error }
}

/** Apply parser output to a process-like environment object. */
export function applyLaunchEnvironment(environment, target = process.env) {
  for (const [name, value] of Object.entries(environment)) {
    if (value === undefined) delete target[name]
    else target[name] = value
  }
}
