import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { CoreClient } from '../src/core-client.js'
import { SessionEventProjector } from '../src/sessionEventProjection.js'
import { createNotificationBuffer, processNotificationRecords } from '../src/experimentalNotificationBuffer.js'
import type { JsonValue } from '../src/core-protocol.js'

const fixture = fileURLToPath(new URL('./fixtures/fake-core-events.ts', import.meta.url))
const client = new CoreClient({
  command: process.execPath,
  args: ['--import', 'tsx/esm', fixture],
  cwd: process.cwd(),
})

// Install the listener before session/open, matching the production flow.
const buffer = createNotificationBuffer(client)

assert.deepEqual(await client.start(), { name: 'fake-core-events', version: 'test' })
const opened = await client.request('session/open', { cwd: process.cwd() }) as { events?: JsonValue[] }
assert.ok(Array.isArray(opened.events))

const projector = new SessionEventProjector()
const initialSeqs = new Set<number>()
for (const event of opened.events ?? []) {
  projector.push(event)
  if (typeof event === 'object' && event !== null && !Array.isArray(event) && typeof (event as { seq?: unknown }).seq === 'number') {
    initialSeqs.add((event as { seq: number }).seq)
  }
}
processNotificationRecords(projector, buffer.drain(), initialSeqs)

const lines = projector.snapshot()
assert.ok(lines.some(line => line.kind === 'user' && line.text.includes('projected user text')))
assert.ok(lines.some(line => line.kind === 'assistant' && line.text.includes('projected assistant text')))
assert.ok(lines.some(line => line.kind === 'status' && line.text.includes('idle')))

buffer.close()
await client.close()
assert.equal(client.stderrTail(), '')

console.log('session event client projection verification passed')
