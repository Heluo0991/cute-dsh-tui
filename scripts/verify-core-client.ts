import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { CoreClient } from '../src/core-client.js'

const fixture = fileURLToPath(new URL('./fixtures/fake-core.ts', import.meta.url))
const client = new CoreClient({
  command: process.execPath,
  args: ['--import', 'tsx/esm', fixture],
  cwd: process.cwd(),
})

const notifications: Array<{ method: string; params: unknown }> = []
const unsubscribe = client.onNotification((method, params) => notifications.push({ method, params }))
assert.deepEqual(await client.start(), { name: 'fake-core', version: 'test' })
assert.deepEqual(await client.request('session/open', { cwd: process.cwd() }), {
  sessionId: 'fake-session',
  status: 'idle',
  events: [],
})
assert.deepEqual(notifications, [{
  method: 'session/status',
  params: { sessionId: 'fake-session', status: 'idle' },
}])
await client.close()
unsubscribe()
assert.equal(client.stderrTail(), '')

console.log('core client verification passed')
