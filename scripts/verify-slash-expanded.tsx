/**
 * Regression for the old `/` double-input-row bug: in Ctrl+O expanded
 * transcript mode, typing `/` must ONLY reach PromptInput's slash-command
 * editor. The transcript search bar is bound to Ctrl+F, never `/`.
 *
 * The test first proves its search-bar detector against Ctrl+F so the
 * absence check on `/` is meaningful rather than a blind substring probe.
 */
process.env.FORCE_COLOR = '3'

const { PassThrough, Writable } = await import('node:stream')
const React = await import('react')
const { render } = await import('../src/ui.js')
const { Chat } = await import('../src/screens/Chat.js')
const { QuestionStore } = await import('../src/questions.js')
const { ApprovalStore } = await import('../src/approvals.js')
const { LOCAL_COMMANDS } = await import('../src/commands.js')

class FakeStdout extends Writable {
  columns = 120
  rows = 32
  isTTY = true
  frames: string[] = []

  _write(chunk: unknown, _encoding: BufferEncoding, callback: () => void) {
    this.frames.push(String(chunk))
    callback()
  }
}

class FakeStderr extends Writable {
  isTTY = true
  _write(_chunk: unknown, _encoding: BufferEncoding, callback: () => void) {
    callback()
  }
}

class FakeStdin extends PassThrough {
  isTTY = true
  setRawMode() {
    return this
  }
  ref() {
    return this
  }
  unref() {
    return this
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function currentLines(stdout: FakeStdout): string[] {
  return stdout.frames
    .join('')
    .replace(/\x1b\[(\d+)C/g, (_match, count: string) => ' '.repeat(Number(count)))
    .replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '')
    .split(/\r?\n/)
}

/** TranscriptSearchBar's empty-query content row: two-space padding, slash,
 *  then the inverse block-cursor cell. PromptInput rows always carry `❯`. */
const SEARCH_BAR_RE = /^ {2,3}\/ $/
const PROMPT_SLASH_RE = /❯ \//

let failures = 0
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`)
  if (!ok) failures++
}

const channel = {
  version: 0,
  rows: [],
  status: 'idle',
  sessionTitle: '',
  agentId: 'expanded-slash-session',
  model: 'deepseek-chat',
  provider: 'deepseek-official',
  tokens: { input: 0, output: 0 },
  cwd: 'C:/code/demo',
  gitBranch: undefined,
  working: false,
  spinnerMode: 'requesting',
  responseChars: 0,
  activeToolCount: 0,
  turnStart: 0,
  lastUserText: '',
  notifications: [],
  contextWindow: 128000,
  reasoningEffort: undefined,
  lastUsage: undefined,
  tps: undefined,
  tpsSamples: [],
  workingActivity: undefined,
  activityFrames: undefined,
  activityEnabled: false,
  contextBarEnabled: false,
  goal: undefined,
  todos: [],
  loadedContext: undefined,
  pending: [],
  commandList: LOCAL_COMMANDS,
  permissions: undefined,
  btwThreads: [],
  contextSegments: { system: 0, prompt: 0, assistant: 0, thinking: 0, tools: 0 },
  subscribe: () => () => {},
  submit() {},
  steer() {},
  removePending() { return false },
  cancel() {},
  interruptAndDeliver() { return 0 },
  rewindTo() { return Promise.resolve(null) },
  resumeTo() { return Promise.resolve(false) },
  newSession() { return Promise.resolve(false) },
  switchModel() { return Promise.resolve(false) },
  cycleEffort() { return Promise.resolve() },
  agentPreset: undefined,
  listPresets() { return Promise.resolve([]) },
  switchPreset() { return Promise.resolve(false) },
  clear() {},
  loadOlder() { return 0 },
  notify() {},
  setActivityFrames() { return false },
  listModels() { return Promise.resolve([]) },
  listModelEfforts() { return Promise.resolve([]) },
  listFiles() { return Promise.resolve([]) },
  listSessions() { return Promise.resolve([]) },
  setResumeTarget() {},
  compact() {},
  pushLocal() {},
  mcpStatus() { return [] },
  exportSession() { return null },
  initWorkspace() { return null },
  listSubagents() { return Promise.resolve([]) },
  runExternalCommand() { return Promise.resolve('') },
  switchPermission() { return Promise.resolve(false) },
  startBtw() { return Promise.resolve(undefined) },
  cancelBtw() {},
  submitBtw() {},
  listLoadedPlugins() { return [] },
} as never

const stdout = new FakeStdout()
const stdin = new FakeStdin()
const app = await render(
  React.createElement(Chat, {
    channel,
    questionStore: new QuestionStore(),
    approvalStore: new ApprovalStore(),
  }),
  { stdout, stderr: new FakeStderr(), stdin, exitOnCtrlC: false, patchConsole: false },
)
await sleep(700)

// Enter expanded transcript mode.
stdout.frames = []
stdin.write('\x0f')
await sleep(300)

// Slash must land in PromptInput, not open TranscriptSearchBar.
stdout.frames = []
stdin.write('/')
await sleep(400)
let lines = currentLines(stdout)
check('expanded slash reaches PromptInput', lines.some(line => PROMPT_SLASH_RE.test(line)))
check('expanded slash does NOT open the search bar', !lines.some(line => SEARCH_BAR_RE.test(line)))

// Detector sanity: Ctrl+F still opens the transcript search bar.
stdout.frames = []
stdin.write('\x06')
await sleep(400)
lines = currentLines(stdout)
check('ctrl+f still opens the search bar', lines.some(line => SEARCH_BAR_RE.test(line)))

await app.unmount()
console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
