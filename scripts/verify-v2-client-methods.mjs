import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { CoreClient } from '../lib/types/core-client.js'
import { ExperimentalCoreClient } from '../lib/types/experimentalCoreClient.js'

const fixture = fileURLToPath(new URL('./fixtures/fake-core-interactive.mjs', import.meta.url))
const client = new ExperimentalCoreClient(
  new CoreClient({
    command: process.execPath,
    args: [fixture],
    cwd: process.cwd(),
  }),
  process.cwd(),
)

assert.deepEqual(await client.start(), { name: 'fake-core-interactive', version: 'test' })

const opened = await client.open()
assert.equal(opened.sessionId, 'session-new')
assert.equal(client.activeSessionId, 'session-new')

const messageId = await client.prompt('hello')
assert.equal(messageId, 'message-1')
await client.cancel()

const sessions = await client.listSessions()
assert.equal(sessions.length, 1)
assert.equal(sessions[0]?.id, 'session-a')

const rewound = await client.rewind(4)
assert.equal(rewound?.sessionId, 'session-rewound')
assert.equal(client.activeSessionId, 'session-rewound')

const switched = await client.switchModel('deepseek', 'deepseek-reasoner')
assert.equal(switched?.sessionId, 'session-model')
assert.equal(client.activeSessionId, 'session-model')

assert.equal(await client.switchPreset('standard'), true)
assert.equal(await client.switchPermission('workspace-write'), true)

const models = await client.listModels()
assert.deepEqual(models, [{ provider: 'deepseek', model: 'deepseek-chat' }])

const presets = await client.listPresets()
assert.equal(presets.length, 1)
assert.equal(presets[0]?.id, 'standard')
assert.equal(presets[0]?.isDefault, true)

const permissions = await client.listPermissions()
assert.equal(permissions.length, 1)
assert.equal(permissions[0]?.id, 'workspace-write')

const created = await client.newSession()
assert.equal(created.sessionId, 'session-new')
assert.equal(client.activeSessionId, 'session-new')

const resumed = await client.resume('session-resumed')
assert.equal(resumed.sessionId, 'session-resumed')
assert.equal(client.activeSessionId, 'session-resumed')

await client.close()

// The typed facade also exposes specific approval/question request handlers.
const requestFixture = fileURLToPath(new URL('./fixtures/fake-core-request.mjs', import.meta.url))
const client2 = new ExperimentalCoreClient(
  new CoreClient({
    command: process.execPath,
    args: [requestFixture],
    cwd: process.cwd(),
  }),
  process.cwd(),
)
client2.onApprovalRequest(params => {
  assert.equal(params.toolName, 'bash')
  return 'allowed-once'
})
client2.onUserQuestion(params => {
  assert.equal(params.questions[0]?.id, 'q1')
  return { answers: [{ id: 'q1', selected: ['Yes'] }] }
})
assert.deepEqual(await client2.start(), { name: 'fake-core-request', version: 'test' })
const rawOpened = await client2.client.request('session/open', { cwd: process.cwd() })
assert.equal(rawOpened.approvalOutcome, 'allowed-once')
assert.deepEqual(rawOpened.questionAnswer, { answers: [{ id: 'q1', selected: ['Yes'] }] })
await client2.close()

console.log('v2 client methods verification passed')
