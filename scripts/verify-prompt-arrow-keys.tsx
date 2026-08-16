/**
 * Headless regression for visual-line Up/Down in PromptInput: a single long
 * value soft-wraps into two visual rows; ↑ moves from the second visual row
 * to the first, and only a further ↑ from the FIRST visual row reaches the
 * history fallback. ↓ mirrors this from the last visual row. The caret is
 * observed through the renderer's inverse block-cursor declaration.
 */
process.env.FORCE_COLOR = '3'

const { PassThrough, Writable } = await import('node:stream')
const React = await import('react')
const { render } = await import('../src/ui.js')
const { PromptInput } = await import('../src/components/PromptInput.js')

function makeStreams() {
  const stdout = new Writable({
    write(chunk, _enc, cb) {
      stdout.frames.push(String(chunk))
      cb()
    },
  }) as Writable & { columns: number; rows: number; isTTY: boolean; frames: string[] }
  // columns=12 keeps the input width at its 10-cell minimum, so the typed
  // 12-char value wraps exactly into `abcdefghij` + `kl`.
  stdout.columns = 12
  stdout.rows = 20
  stdout.isTTY = true
  stdout.frames = []
  const stderr = new Writable({ write(_c, _e, cb) { cb() } }) as Writable & { isTTY: boolean }
  stderr.isTTY = true
  const stdin = new PassThrough() as PassThrough & {
    isTTY: boolean
    setRawMode: () => PassThrough
    setEncoding: () => PassThrough
    ref: () => PassThrough
    unref: () => PassThrough
  }
  stdin.isTTY = true
  stdin.setRawMode = () => stdin
  stdin.setEncoding = () => stdin
  stdin.ref = () => stdin
  stdin.unref = () => stdin
  return { stdout, stderr, stdin }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

let failed = 0
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`)
  if (!ok) failed++
}

const { stdout, stderr, stdin } = makeStreams()
const channel = {
  working: false,
  commandList: [] as { name: string; description: string }[],
  notifications: [] as unknown[],
  pending: [] as unknown[],
  notify() {},
  submit() {},
  listFiles: async () => [] as string[],
}

const app = await render(
  React.createElement(PromptInput, {
    channel,
    helpOpen: false,
    onToggleHelp() {},
    onRunCommand: () => false,
    selectionActive: false,
  }),
  { stdout, stderr, stdin, exitOnCtrlC: false, patchConsole: false },
)
await sleep(400)

stdin.write('abcdefghijkl')
await sleep(400)
const typed = stdout.frames.join('')
check('long value soft-wraps into two visual rows', typed.includes('abcdefghij') && typed.includes('kl'))

stdout.frames = []
stdin.write('\x1b[A')
await sleep(400)
const up = stdout.frames.join('')
check('↑ moves within the soft wrap (declared caret redraw)', up.includes('\x1b[7m'))

stdout.frames = []
stdin.write('\x1b[A')
await sleep(400)
check('↑ from the first visual row enters history (no move, empty history)', stdout.frames.join('') === '')

stdout.frames = []
stdin.write('\x1b[B')
await sleep(400)
const down = stdout.frames.join('')
check('↓ moves back within the soft wrap (declared caret redraw)', down.includes('\x1b[7m'))

stdout.frames = []
stdin.write('\x1b[B')
await sleep(400)
check('↓ from the last visual row enters history (no move, empty history)', stdout.frames.join('') === '')

await app.unmount()
console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILURES`)
process.exit(failed === 0 ? 0 : 1)
