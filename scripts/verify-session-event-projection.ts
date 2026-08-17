import assert from 'node:assert/strict'
import { SessionEventProjector } from '../src/sessionEventProjection.js'

const projector = new SessionEventProjector({ limit: 10 })

projector.push({
  type: 'user/message',
  seq: 1,
  time: 1,
  data: {
    content: [{ type: 'text', text: 'hello from user' }],
    source: { kind: 'user' },
  },
})
projector.push({
  type: 'assistant/chunk',
  seq: 2,
  time: 2,
  data: { turn: 1, step: 1, chunk: { type: 'text-delta', text: 'Hel' } },
})
projector.push({
  type: 'assistant/chunk',
  seq: 3,
  time: 3,
  data: { turn: 1, step: 1, chunk: { type: 'text-delta', text: 'lo' } },
})
projector.push({
  type: 'assistant/message',
  seq: 4,
  time: 4,
  data: {
    turn: 1,
    step: 1,
    message: {
      content: [{ type: 'text', text: 'Hello' }],
      source: { kind: 'model' },
    },
  },
})
projector.push({
  type: 'tool/call',
  seq: 5,
  time: 5,
  data: { turn: 1, step: 1, callId: 'call_1', name: 'bash', arguments: '{"command":"ls"}' },
})
projector.push({
  type: 'tool/result',
  seq: 6,
  time: 6,
  data: {
    turn: 1,
    step: 1,
    message: {
      content: [{
        type: 'tool-result',
        toolCallId: 'call_1',
        content: [{ type: 'text', text: 'file1\nfile2' }],
      }],
      source: { kind: 'tool' },
    },
  },
})
projector.pushStatus('session-a', 'running')

const lines = projector.snapshot()
assert.ok(lines.some(line => line.kind === 'user' && line.text.includes('hello from user')))
assert.ok(lines.some(line => line.kind === 'assistant' && line.text.includes('Hello')))
assert.ok(lines.some(line => line.kind === 'tool' && line.text.includes('▶ bash')))
assert.ok(lines.some(line => line.kind === 'tool' && line.text.includes('file1')))
assert.ok(lines.some(line => line.kind === 'status' && line.text.includes('running')))

for (let index = 0; index < 20; index += 1) {
  projector.push({ type: 'meta', seq: 100 + index, time: 100 + index, data: { index } })
}
assert.equal(projector.snapshot().length, 10)

console.log('session event projection verification passed')
