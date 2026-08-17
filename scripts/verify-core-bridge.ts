import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'
import { apply } from '../src/core-bridge.js'
import { CORE_PROTOCOL_VERSION, CoreProtocolTransport } from '../src/core-protocol.js'

const leftToRight = new PassThrough()
const rightToLeft = new PassThrough()
const client = new CoreProtocolTransport(rightToLeft, leftToRight)
const bridge = new CoreProtocolTransport(leftToRight, rightToLeft)
client.start()

const listeners = new Map<string, Array<(payload: any, event?: any) => void>>()
const cleanups: Array<() => void | Promise<void>> = []
const agent = {
  id: 'session-a',
  session: { id: 'session-a', header: { id: 'session-a' }, events: [] as unknown[] },
  status: 'idle',
  followup(message: { id: string }) {
    this.lastMessageId = message.id
  },
  cancel() {
    this.cancelled = true
  },
} as any
const handle = {
  agent,
  async dispose() {
    agent.disposed = true
  },
}
const fakeContext = {
  agents: {
    async create(options: any) {
      assert.equal(options.meta.cwd, '/workspace')
      return handle
    },
    async resume() {
      throw new Error('resume is not part of this creation regression')
    },
  },
  on(name: string, handler: (payload: any, event?: any) => void) {
    const entries = listeners.get(name) ?? []
    entries.push(handler)
    listeners.set(name, entries)
    return () => undefined
  },
  effect(cleanup: () => void | Promise<void>) {
    cleanups.push(cleanup)
  },
  root: { fiber: { dispose: async () => undefined } },
} as any

await apply(fakeContext, { transport: bridge, provider: 'deepseek-official' })

assert.deepEqual(await client.request('initialize', { protocolVersion: CORE_PROTOCOL_VERSION }), {
  protocolVersion: CORE_PROTOCOL_VERSION,
  server: { name: 'cute-dsh-tui-core-bridge', version: '0.1.0' },
})
const opened = await client.request('session/open', { cwd: '/workspace' }) as any
assert.equal(opened.sessionId, 'session-a')
assert.equal(opened.status, 'idle')
assert.deepEqual(opened.events, [])

const events: any[] = []
const unsubscribe = client.onNotification(notification => events.push(notification))
for (const listener of listeners.get('session/event') ?? []) {
  listener(agent.session, { type: 'user/message', data: { text: 'persisted' } })
}
for (const listener of listeners.get('agent/status') ?? []) {
  listener({ agent, status: 'running' })
}
assert.deepEqual(events, [
  {
    jsonrpc: '2.0',
    method: 'session/event',
    params: { sessionId: 'session-a', event: { type: 'user/message', data: { text: 'persisted' } } },
  },
  {
    jsonrpc: '2.0',
    method: 'session/status',
    params: { sessionId: 'session-a', status: 'running' },
  },
])

const prompted = await client.request('session/prompt', { sessionId: 'session-a', text: 'hello' }) as any
assert.equal(typeof prompted.messageId, 'string')
assert.equal(agent.lastMessageId, prompted.messageId)
await client.request('session/cancel', { sessionId: 'session-a' })
assert.equal(agent.cancelled, true)
await client.request('shutdown')
assert.equal(agent.disposed, true)
for (const cleanup of cleanups) await cleanup()
unsubscribe()
client.close()

console.log('core bridge verification passed')
