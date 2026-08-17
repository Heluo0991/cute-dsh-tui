import { CORE_PROTOCOL_VERSION, CoreProtocolTransport } from '../../src/core-protocol.js'

const transport = new CoreProtocolTransport(process.stdin, process.stdout)
transport.onRequest(request => {
  if (request.method === 'initialize') {
    transport.respond(request.id, {
      protocolVersion: CORE_PROTOCOL_VERSION,
      server: { name: 'fake-core-events', version: 'test' },
    })
    return
  }
  if (request.method === 'session/open') {
    transport.notify('session/status', { sessionId: 'fake-session', status: 'idle' })
    transport.notify('session/event', {
      sessionId: 'fake-session',
      event: {
        type: 'user/message',
        seq: 1,
        time: 1,
        data: {
          content: [{ type: 'text', text: 'projected user text' }],
          source: { kind: 'user' },
        },
      },
    })
    transport.respond(request.id, {
      sessionId: 'fake-session',
      status: 'idle',
      events: [{
        type: 'user/message',
        seq: 1,
        time: 1,
        data: {
          content: [{ type: 'text', text: 'projected user text' }],
          source: { kind: 'user' },
        },
      }, {
        type: 'assistant/message',
        seq: 2,
        time: 2,
        data: {
          turn: 1,
          step: 1,
          message: {
            content: [{ type: 'text', text: 'projected assistant text' }],
            source: { kind: 'model' },
          },
        },
      }],
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
