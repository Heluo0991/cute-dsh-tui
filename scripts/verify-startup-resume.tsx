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

const session = {
  id: 'saved-session',
  title: 'Resume this saved session',
  cwd: 'C:/code/another-project',
  createdAt: 1,
  updatedAt: 2,
}
let pickerWasRequested = false
const channel = {
  version: 0,
  rows: [],
  status: 'idle',
  sessionTitle: '',
  agentId: 'live-session',
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
  subscribe: () => () => {},
  submit: () => {},
  cancel: () => {},
  clear: () => {},
  notify: () => {},
  listModels: () => Promise.resolve([]),
  listSessions: () => {
    pickerWasRequested = true
    return Promise.resolve([session])
  },
  setResumeTarget: () => {},
} as never

const stdout = new FakeStdout()
const instance = await render(
  <Chat
    channel={channel}
    questionStore={new QuestionStore()}
    openResumePickerOnStart
  />,
  {
    stdout,
    stdin: new FakeStdin(),
    stderr: new FakeStderr(),
    exitOnCtrlC: false,
    patchConsole: false,
  },
)

await new Promise(resolve => setTimeout(resolve, 700))
const text = stdout.frames
  .join('')
  .replace(/\x1b\[(\d+)C/g, (_, n) => ' '.repeat(Number(n)))
  .replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '')

assert.equal(pickerWasRequested, true)
assert.match(text, /Resume/)

await instance.unmount()
console.log('startup resume picker verification passed')
