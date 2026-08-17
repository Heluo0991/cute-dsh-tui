import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { CoreClient } from '../lib/types/core-client.js'

const fixture = fileURLToPath(new URL('./fixtures/fake-core-request.mjs', import.meta.url))
const client = new CoreClient({
  command: process.execPath,
  args: [fixture],
  cwd: process.cwd(),
})

assert.deepEqual(await client.start(), { name: 'fake-core-request', version: 'test' })

const unsubscribe = client.onRequest((method, params) => {
  if (method === 'approval/request') {
    assert.equal(params?.toolName, 'bash')
    return 'allowed-once'
  }
  if (method === 'user-question/ask') {
    assert.equal(params?.questions?.[0]?.id, 'q1')
    return { answers: [{ id: 'q1', selected: ['Yes'] }] }
  }
  throw new Error(`unexpected request: ${method}`)
})

const opened = await client.request('session/open', { cwd: process.cwd() })
assert.equal(opened.approvalOutcome, 'allowed-once')
assert.deepEqual(opened.questionAnswer, { answers: [{ id: 'q1', selected: ['Yes'] }] })

unsubscribe()
await client.close()
assert.equal(client.stderrTail(), '')

console.log('core client request handler verification passed')
