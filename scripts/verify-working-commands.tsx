/**
 * Regression for `/btw`-style slash commands while the main turn is running:
 * Enter must dispatch the command instead of steering the raw text into the
 * running turn. Plain non-command text must still steer.
 */
process.env.FORCE_COLOR = '3'

const { Writable, PassThrough } = await import('node:stream')
const React = await import('react')
const { render } = await import('../src/ui.js')
const { PromptInput } = await import('../src/components/PromptInput.js')
const { LOCAL_COMMANDS } = await import('../src/commands.js')

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

async function mount() {
  const streams = makeStreams()
  const sent: string[] = []
  const steered: string[] = []
  const ran: Array<{ name: string; raw: string }> = []
  const channel = {
    working: true,
    commandList: LOCAL_COMMANDS,
    notifications: [] as unknown[],
    pending: [] as unknown[],
    notify() {},
    submit(text: string) { sent.push(text) },
    steer(text: string) { steered.push(text) },
    listFiles: async () => [] as string[],
  }
  const instance = await render(
    React.createElement(PromptInput, {
      channel,
      helpOpen: false,
      onToggleHelp() {},
      onRunCommand(name, raw) {
        ran.push({ name, raw })
        return true
      },
      selectionActive: false,
    }),
    { stdout: streams.stdout, stderr: streams.stderr, stdin: streams.stdin, exitOnCtrlC: false, patchConsole: false },
  )
  await sleep(300)
  return { streams, instance, sent, steered, ran }
}

// 1. /btw while working: command wins over steer.
{
  const { streams, instance, sent, steered, ran } = await mount()
  streams.stdin.write('/btw hello')
  await sleep(250)
  streams.stdin.write('\r')
  await sleep(300)
  check('working /btw reaches onRunCommand', ran.length === 1 && ran[0]?.name === 'btw' && ran[0]?.raw === ' hello')
  check('working /btw is not steered', steered.length === 0)
  check('working /btw is not submitted as text', sent.length === 0)
  instance.unmount()
}

// 2. Plain text while working still steers.
{
  const { streams, instance, sent, steered, ran } = await mount()
  streams.stdin.write('steer me')
  await sleep(250)
  streams.stdin.write('\r')
  await sleep(300)
  check('plain text still steers while working', steered.length === 1 && steered[0] === 'steer me')
  check('plain text does not run a command', ran.length === 0)
  check('plain text does not use normal submit', sent.length === 0)
  instance.unmount()
}

process.exit(failed)
