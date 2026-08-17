import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { CoreClient } from '../src/core-client.js'
import { SessionEventProjector } from '../src/sessionEventProjection.js'
import type { JsonValue } from '../src/core-protocol.js'

const fixture = fileURLToPath(new URL('./fixtures/fake-core-events.ts', import.meta.url))
const client = new CoreClient({
  command: process.execPath,
  args: ['--import', 'tsx/esm', fixture],
  cwd: process.cwd(),
})

const notifications: Array<{ method: string; params: unknown }> = []
const unsubscribe = client.onNotification((method, params) => notifications.push({ method, params }))

assert.deepEqual(await client.start(), { name: 'fake-core-events', version: 'test' })
const opened = await client.request('session/open', { cwd: process.cwd() }) as { events?: JsonValue[] }
assert.ok(Array.isArray(opened.events))

const projector = new SessionEventProjector()
for (const event of opened.events ?? []) projector.push(event)
for (const notification of notifications) {
  if (notification.method === 'session/event' && isObject(notification.params)) {
    const params = notification.params as { event?: JsonValue }
    if (params.event !== undefined) projector.push(params.event)
  } else if (notification.method === 'session/status' && isObject(notification.params)) {
    const params = notification.params as { sessionId?: JsonValue; status?: JsonValue }
    projector.pushStatus(params.sessionId, params.status)
  }
}

const lines = projector.snapshot()
assert.ok(lines.some(line => line.kind === 'user' && line.text.includes('projected user text')))
assert.ok(lines.some(line => line.kind === 'assistant' && line.text.includes('projected assistant text')))
assert.ok(lines.some(line => line.kind === 'status' && line.text.includes('idle')))

await client.close()
unsubscribe()
assert.equal(client.stderrTail(), '')

console.log('session event client projection verification passed')

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
