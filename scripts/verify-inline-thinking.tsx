import assert from 'node:assert/strict'

process.env.FORCE_COLOR = '3'
process.env.CUTE_DSH_TUI_THEME = 'dark'

const [{ PassThrough, Writable }, React, { render, ThemeProvider }, { AssistantThinkingMessage }, { LogoV2 }] = await Promise.all([
  import('node:stream'),
  import('react'),
  import('../src/ui.js'),
  import('../src/components/messages/AssistantThinkingMessage.js'),
  import('../src/components/LogoV2.js'),
])

class FakeStdout extends Writable {
  columns = 100
  rows = 24
  isTTY = true
  readonly frames: string[] = []
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
  setRawMode() { return this }
  ref() { return this }
  unref() { return this }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const plain = (frames: readonly string[]) => frames.join('')
  .replace(/\x1b\[(\d+)C/g, (_match, count) => ' '.repeat(Number(count)))
  .replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '')
  .replace(/\x1b\]9;[^\x07]*\x07/g, '')

const secret = 'PRIVATE_REASONING_MUST_STAY_FOLDED'
const liveOut = new FakeStdout()
const live = await render(
  <ThemeProvider>
    <AssistantThinkingMessage thinking={secret} addMargin={false} verbose={false} streaming />
  </ThemeProvider>,
  { stdout: liveOut, stdin: new FakeStdin(), stderr: new FakeStderr(), exitOnCtrlC: false, patchConsole: false },
)
await sleep(420)
const liveText = plain(liveOut.frames)
assert.match(liveText, /Thinking/)
assert.doesNotMatch(liveText, new RegExp(secret))
assert.ok(liveOut.frames.length >= 3, 'streaming Thinking should repaint for its small animation')
await live.unmount()

const expandedOut = new FakeStdout()
const expanded = await render(
  <ThemeProvider>
    <AssistantThinkingMessage thinking={secret} addMargin={false} verbose durationMs={1_200} />
  </ThemeProvider>,
  { stdout: expandedOut, stdin: new FakeStdin(), stderr: new FakeStderr(), exitOnCtrlC: false, patchConsole: false },
)
await sleep(120)
assert.match(plain(expandedOut.frames), new RegExp(secret))
await expanded.unmount()

function InlineHeaderHarness() {
  const [animateIntro, setAnimateIntro] = React.useState(true)
  React.useEffect(() => {
    const timer = setTimeout(() => setAnimateIntro(false), 240)
    return () => clearTimeout(timer)
  }, [])
  return <LogoV2 model="deepseek-v4-flash" cwd="C:/demo" animateIntro={animateIntro} />
}

const headerOut = new FakeStdout()
const header = await render(
  <ThemeProvider><InlineHeaderHarness /></ThemeProvider>,
  { stdout: headerOut, stdin: new FakeStdin(), stderr: new FakeStderr(), exitOnCtrlC: false, patchConsole: false },
)
await sleep(520)
const frozenFrameCount = headerOut.frames.length
await sleep(280)
assert.equal(headerOut.frames.length, frozenFrameCount, 'inline header must stop repainting after transcript begins')
await header.unmount()

console.log('inline Thinking folding verification passed')
