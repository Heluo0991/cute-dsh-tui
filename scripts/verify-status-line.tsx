/**
 * Status-line regression: the footer carries the unified `CuteDshTui` brand,
 * the compact permission level (`readonly` / `workspace` / `fullaccess`), the
 * current agent-preset mode, and still keeps the git branch and session
 * title visible.
 */
process.env.FORCE_COLOR = '3'

const { Writable } = await import('node:stream')
const React = await import('react')
const { render } = await import('../src/ui.js')
const { StatusLine } = await import('../src/screens/StatusLine.js')

class FakeStdout extends Writable {
  columns = 150
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const stripAnsi = (text: string) => text.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '')

let failures = 0
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`)
  if (!ok) failures++
}

const channel = {
  version: 0,
  rows: [],
  status: 'idle',
  sessionTitle: 'session-title-check',
  agentId: 'session-1',
  model: 'deepseek-chat',
  provider: 'deepseek-official',
  tokens: { input: 1200, output: 300 },
  cwd: 'C:/code/demo',
  gitBranch: 'main',
  working: false,
  spinnerMode: 'requesting',
  responseChars: 0,
  activeToolCount: 0,
  turnStart: 0,
  lastUserText: '',
  notifications: [],
  contextWindow: 128000,
  reasoningEffort: 'max',
  lastUsage: { input: 1200, output: 300, cacheRead: 400, cacheWrite: 0 },
  tps: 18,
  tpsSamples: [],
  workingActivity: undefined,
  activityFrames: undefined,
  activityEnabled: false,
  contextBarEnabled: false,
  goal: undefined,
  todos: [],
  loadedContext: undefined,
  pending: [],
  commandList: [],
  permissions: { current: 'workspace-write', options: [] },
  btwThreads: [],
  contextSegments: { system: 100, prompt: 50, assistant: 200, thinking: 0, tools: 0 },
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
  agentPreset: 'standard',
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
const app = await render(
  React.createElement(StatusLine, { channel }),
  { stdout, stderr: new FakeStderr(), exitOnCtrlC: false, patchConsole: false },
)
await sleep(300)

let raw = stripAnsi(stdout.frames.join(''))
check('statusline brands CuteDshTui', raw.includes('CuteDshTui'))
check('statusline keeps the model route', raw.includes('deepseek-chat'))
check('statusline shows the agent-preset mode', raw.includes('standard'))
check('statusline shows the compact permission level', raw.includes('workspace'))
check('statusline keeps the git branch', raw.includes('main'))
check('statusline keeps the session title', raw.includes('session-title-check'))

stdout.frames = []
app.rerender(React.createElement(StatusLine, {
  channel: {
    ...(channel as unknown as Record<string, unknown>),
    agentPreset: 'code',
    permissions: { current: 'danger-full-access', options: [] },
  } as never,
}))
await sleep(300)
raw = stripAnsi(stdout.frames.join(''))
check('statusline follows the live mode', raw.includes('code'))
check('statusline maps danger-full-access to fullaccess', raw.includes('fullaccess'))

await app.unmount()
console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
