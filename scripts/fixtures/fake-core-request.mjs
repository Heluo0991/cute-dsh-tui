import { CORE_PROTOCOL_VERSION, CoreProtocolTransport } from '../../lib/types/core-protocol.js'

const transport = new CoreProtocolTransport(process.stdin, process.stdout)
transport.onRequest(async request => {
  if (request.method === 'initialize') {
    transport.respond(request.id, {
      protocolVersion: CORE_PROTOCOL_VERSION,
      server: { name: 'fake-core-request', version: 'test' },
    })
    return
  }
  if (request.method === 'session/open') {
    const outcome = await transport.request('approval/request', {
      sessionId: 'fake-session',
      toolName: 'bash',
      reason: 'test approval',
    })
    const answer = await transport.request('user-question/ask', {
      sessionId: 'fake-session',
      questions: [{ id: 'q1', question: 'Continue?', options: [{ label: 'Yes' }] }],
    })
    transport.respond(request.id, {
      sessionId: 'fake-session',
      status: 'idle',
      events: [],
      approvalOutcome: outcome,
      questionAnswer: answer,
    })
    return
  }
  if (request.method === 'shutdown') {
    transport.respond(request.id, {})
    transport.close('fake core shutdown')
    process.exit(0)
    return
  }
  transport.reject(request.id, { code: -32601, message: `method not found: ${request.method}` })
})
transport.start()
