import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'
import { apply } from '../lib/types/core-bridge.js'
import { CORE_PROTOCOL_VERSION, CoreProtocolTransport } from '../lib/types/core-protocol.js'

const leftToRight = new PassThrough()
const rightToLeft = new PassThrough()
const client = new CoreProtocolTransport(rightToLeft, leftToRight)
const bridge = new CoreProtocolTransport(leftToRight, rightToLeft)
client.start()

const listeners = new Map()
const cleanups = []
let nextAgentId = 0
let userQuestionProvider

const makeAgent = (id, events = []) => {
  const agent = {
    id,
    session: {
      id,
      header: { id, cwd: '/workspace' },
      events: [...events],
      append(type, data) {
        this.events.push({ type, data, seq: this.events.length })
      },
    },
    status: 'idle',
    options: { provider: 'deepseek', model: 'deepseek-chat' },
    ctx: {},
    followup(message) {
      this.lastMessageId = message.id
    },
    cancel() {
      this.cancelled = true
    },
  }
  const handle = {
    agent,
    async dispose() {
      agent.disposed = true
    },
  }
  return { agent, handle }
}

const first = makeAgent('session-a', [
  { seq: 0, type: 'turn/start', data: {} },
  { seq: 1, type: 'user/message', data: {} },
  { seq: 2, type: 'turn/end', data: {} },
  { seq: 3, type: 'turn/start', data: {} },
  { seq: 4, type: 'user/message', data: {} },
  { seq: 5, type: 'turn/end', data: {} },
])
let current = first.handle

const fakeContext = {
  logger: {
    warn() {},
  },
  agents: {
    async create(options) {
      const count = ++nextAgentId
      if (count === 1) {
        current = first.handle
        return first.handle
      }
      const id = `session-created-${count - 1}`
      const made = makeAgent(id)
      current = made.handle
      return made.handle
    },
    async resume(options) {
      const made = makeAgent(String(options.resumeSessionId))
      current = made.handle
      return made.handle
    },
  },
  sessions: {
    fork() {
      return { events: [{ seq: 1, type: 'user/message', data: {} }] }
    },
  },
  sessionPersistence: {
    async list() {
      return [{
        id: 'session-a',
        cwd: '/workspace',
        createdAt: 1,
        parentSession: undefined,
        origin: undefined,
        agentPreset: undefined,
      }]
    },
    async load() {
      return {
        meta: { agentPreset: undefined },
        events: [],
      }
    },
  },
  agentPresets: {
    defaultId: 'standard',
    async list() {
      return [{ id: 'standard', name: 'Standard', isDefault: true }]
    },
    async resolve(id) {
      if (id === undefined || id === 'standard') return { id: 'standard' }
      throw new Error(`unknown preset: ${id}`)
    },
    async recompose() {
      return { id: 'standard' }
    },
  },
  permissionPresets: {
    names: ['workspace-write'],
    optionOf(id) {
      return { name: 'Workspace Write', description: 'Allow workspace writes' }
    },
    set(session, name) {
      session.permissionSet = name
    },
  },
  llm: {
    listProviders() {
      return [{ id: 'deepseek' }]
    },
    async listModels(provider) {
      assert.equal(provider, 'deepseek')
      return [{ id: 'deepseek-chat' }]
    },
  },
  userQuestions: {
    registerProvider(provider) {
      userQuestionProvider = provider
      return () => undefined
    },
  },
  get(key) {
    if (key === 'sessions') return this.sessions
    if (key === 'sessionPersistence') return this.sessionPersistence
    if (key === 'agentPresets') return this.agentPresets
    if (key === 'permissionPresets') return this.permissionPresets
    if (key === 'llm') return this.llm
    if (key === 'userQuestions') return this.userQuestions
    return undefined
  },
  on(name, handler) {
    const entries = listeners.get(name) ?? []
    entries.push(handler)
    listeners.set(name, entries)
    return () => undefined
  },
  effect(cleanup) {
    cleanups.push(cleanup)
  },
  root: { fiber: { dispose: async () => undefined } },
}

await apply(fakeContext, { transport: bridge, provider: 'deepseek', model: 'deepseek-chat' })

assert.deepEqual(await client.request('initialize', { protocolVersion: CORE_PROTOCOL_VERSION }), {
  protocolVersion: CORE_PROTOCOL_VERSION,
  server: { name: 'cute-dsh-tui-core-bridge', version: '0.1.0' },
})

const opened = await client.request('session/open', { cwd: '/workspace' })
assert.equal(opened.sessionId, 'session-a')
assert.equal(opened.status, 'idle')
assert.deepEqual(opened.events, first.agent.session.events)

const prompted = await client.request('session/prompt', { sessionId: 'session-a', text: 'hello' })
assert.equal(typeof prompted.messageId, 'string')
assert.equal(first.agent.lastMessageId, prompted.messageId)

await client.request('session/cancel', { sessionId: 'session-a' })
assert.equal(first.agent.cancelled, true)

const listed = await client.request('session/list', { cwd: '/workspace' })
assert.equal(listed.length, 1)
assert.equal(listed[0].id, 'session-a')

const created = await client.request('session/new', { cwd: '/workspace' })
assert.equal(created.sessionId, 'session-created-1')
assert.equal(created.status, 'idle')

const resumed = await client.request('session/resume', { cwd: '/workspace', sessionId: 'session-resumed' })
assert.equal(resumed.sessionId, 'session-resumed')

const rewound = await client.request('session/rewind', { sessionId: 'session-resumed', seq: 4 })
assert.equal(rewound.sessionId, 'session-created-2')

const switched = await client.request('model/switch', { sessionId: 'session-created-2', provider: 'deepseek', model: 'deepseek-reasoner' })
assert.equal(switched.sessionId, 'session-created-3')

const models = await client.request('model/list')
assert.deepEqual(models, [{ provider: 'deepseek', model: 'deepseek-chat' }])

const presets = await client.request('preset/list')
assert.equal(presets.length, 1)
assert.equal(presets[0].id, 'standard')

const presetSwitched = await client.request('preset/switch', { sessionId: 'session-created-3', presetId: 'standard' })
assert.equal(presetSwitched.ok, true)

const permissions = await client.request('permission/list')
assert.equal(permissions.length, 1)
assert.equal(permissions[0].id, 'workspace-write')

const permissionSwitched = await client.request('permission/switch', { sessionId: 'session-created-3', presetId: 'workspace-write' })
assert.equal(permissionSwitched.ok, true)

// Core-initiated approval requests are forwarded to the TUI client.
const approvalHandler = listeners.get('approval/request')[0]
assert.ok(approvalHandler)
const approvalUnsubscribe = client.onRequest(request => {
  assert.equal(request.method, 'approval/request')
  assert.equal(request.params.toolName, 'bash')
  client.respond(request.id, 'allowed-once')
})
const approvalOutcome = await approvalHandler(
  { agent: current.agent, toolName: 'bash', callId: 'call-1', reason: 'test' },
  () => Promise.resolve('unavailable'),
)
assert.equal(approvalOutcome, 'allowed-once')
approvalUnsubscribe()

// Core-initiated user questions are forwarded to the TUI client.
assert.ok(userQuestionProvider)
const questionUnsubscribe = client.onRequest(request => {
  assert.equal(request.method, 'user-question/ask')
  assert.equal(request.params.questions[0].id, 'q1')
  client.respond(request.id, { answers: [{ id: 'q1', selected: ['Yes'] }] })
})
const answer = await userQuestionProvider.ask({
  questions: [{ id: 'q1', question: 'Continue?', options: [{ label: 'Yes' }] }],
})
assert.deepEqual(answer, { answers: [{ id: 'q1', selected: ['Yes'] }] })
questionUnsubscribe()

await client.request('shutdown')
for (const cleanup of cleanups) await cleanup()
client.close()

console.log('core bridge interactive verification passed')
