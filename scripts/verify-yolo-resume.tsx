import assert from 'node:assert/strict'

process.env.FORCE_COLOR = '0'

const [{ PassThrough, Writable }, React, { render }, { Chat }, { QuestionStore }] = await Promise.all([
  import('node:stream'),
  import('react'),
  import('../src/ui.js'),
  import('../src/screens/Chat.js'),
  import('../src/questions.js'),
])

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
  _write(_chunk: unknown, _encoding: BufferEncoding, callback: () => void) { callback() }
}

class FakeStdin extends PassThrough {
  isTTY = true
  setRawMode() { return this }
  ref() { return this }
  unref() { return this }
}

const plainText = (frames: readonly string[]) => frames
  .join('')
  .replace(/\x1b\[(\d+)C/g, (_, n) => ' '.repeat(Number(n)))
  .replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '')

const listeners = new Set<() => void>()
const options = [
  { id: 'read-only', name: 'Read only', description: 'Read files only' },
  { id: 'workspace-write', name: 'Workspace write', description: 'Write inside workspace' },
  { id: 'danger-full-access', name: 'Full access', description: 'No sandbox or approval prompts' },
]
let switches = 0
const channel = {
  version: 0,
  rows: [],
  status: 'idle',
  sessionTitle: '',
  agentId: 'temporary-yolo-session',
  model: 'deepseek-v4-flash',
  tokens: { input: 0, output: 0 },
  cwd: 'C:/code/current-project',
  gitBranch: undefined,
  working: false,
  spinnerMode: 'requesting',
  responseChars: 0,
  activeToolCount: 0,
  turnStart: 0,
  lastUserText: '',
  pending: [],
  commandList: [],
  notifications: [],
  permissions: { current: 'danger-full-access', options },
  subscribe: (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener) },
  submit: () => {},
  cancel: () => {},
  clear: () => {},
  notify: () => {},
  listModels: () => Promise.resolve([]),
  listSessions: () => Promise.resolve([]),
  setResumeTarget: () => {},
  switchPermission: () => { switches += 1; return Promise.resolve(true) },
} as never

const stdout = new FakeStdout()
const stdin = new FakeStdin()
const instance = await render(
  <Chat
    channel={channel}
    questionStore={new QuestionStore()}
    yoloResumeUpgrade
  />,
  { stdout, stdin, stderr: new FakeStderr(), exitOnCtrlC: false, patchConsole: false },
)

await new Promise(resolve => setTimeout(resolve, 500))
assert.doesNotMatch(plainText(stdout.frames), /Enable full access\?/) // temporary yolo session is already full

;(channel as { agentId: string; permissions: unknown; version: number }).agentId = 'resumed-restricted-session'
;(channel as { agentId: string; permissions: unknown; version: number }).permissions = { current: 'workspace-write', options }
;(channel as { version: number }).version += 1
for (const listener of listeners) listener()
await new Promise(resolve => setTimeout(resolve, 500))
assert.match(plainText(stdout.frames), /Enable full access\?/)

// Esc declines the restored-session upgrade and must not invoke the command.
stdin.write('\x1b')
await new Promise(resolve => setTimeout(resolve, 200))
assert.equal(switches, 0)

await instance.unmount()
console.log('yolo resume upgrade verification passed')
