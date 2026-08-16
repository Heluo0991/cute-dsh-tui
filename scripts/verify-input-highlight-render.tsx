/**
 * Headless render regression for the semantic input highlighter.
 * Types `/model` with an empty command list (unknown slash → warning color)
 * and `hi @a` (mention → professional blue); asserts the matching SGR
 * truecolor values are emitted by the prompt itself.
 */
process.env.FORCE_COLOR = '3'

const { Writable, PassThrough } = await import('node:stream')
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
  stdout.columns = 100
  stdout.rows = 28
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

const baseChannel = {
  working: false,
  commandList: [] as { name: string; description: string }[],
  notifications: [] as unknown[],
  pending: [] as unknown[],
  notify() {},
  submit() {},
  listFiles: async () => [] as string[],
}

// Unknown slash commands render in the warning palette (#D8B270).
{
  const { stdout, stderr, stdin } = makeStreams()
  const instance = await render(
    React.createElement(PromptInput, {
      channel: baseChannel,
      helpOpen: false,
      onToggleHelp() {},
      onRunCommand: () => false,
      selectionActive: false,
    }),
    { stdout, stderr, stdin, exitOnCtrlC: false, patchConsole: false },
  )
  await sleep(500)
  stdin.write('/model')
  await sleep(400)
  const raw = stdout.frames.join('')
  check('unknown slash emits warning SGR', raw.includes('38;2;216;178;112'))
  instance.unmount()
}

// Mentions render in professional blue (#7DA1DE).
{
  const { stdout, stderr, stdin } = makeStreams()
  const instance = await render(
    React.createElement(PromptInput, {
      channel: baseChannel,
      helpOpen: false,
      onToggleHelp() {},
      onRunCommand: () => false,
      selectionActive: false,
    }),
    { stdout, stderr, stdin, exitOnCtrlC: false, patchConsole: false },
  )
  await sleep(500)
  stdin.write('hi @a')
  await sleep(400)
  const raw = stdout.frames.join('')
  check('mention emits professional blue SGR', raw.includes('38;2;125;161;222'))
  instance.unmount()
}

process.exit(failed)
