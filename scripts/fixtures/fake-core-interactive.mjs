import { CORE_PROTOCOL_VERSION, CoreProtocolTransport } from '../../lib/types/core-protocol.js'

const transport = new CoreProtocolTransport(process.stdin, process.stdout)
transport.onRequest(request => {
  if (request.method === 'initialize') {
    transport.respond(request.id, {
      protocolVersion: CORE_PROTOCOL_VERSION,
      server: { name: 'fake-core-interactive', version: 'test' },
    })
    return
  }
  if (request.method === 'session/open' || request.method === 'session/new' || request.method === 'session/resume') {
    const params = (request.params ?? {})
    transport.respond(request.id, {
      sessionId: params.sessionId ?? 'session-new',
      status: 'idle',
      events: [],
    })
    return
  }
  if (request.method === 'session/prompt') {
    transport.respond(request.id, { messageId: 'message-1' })
    return
  }
  if (request.method === 'session/cancel') {
    transport.respond(request.id, {})
    return
  }
  if (request.method === 'session/list') {
    transport.respond(request.id, [{
      id: 'session-a',
      cwd: '/workspace',
      createdAt: 1,
    }])
    return
  }
  if (request.method === 'session/rewind') {
    transport.respond(request.id, {
      sessionId: 'session-rewound',
      status: 'idle',
      events: [],
    })
    return
  }
  if (request.method === 'model/switch') {
    transport.respond(request.id, {
      sessionId: 'session-model',
      status: 'idle',
      events: [],
    })
    return
  }
  if (request.method === 'model/list') {
    transport.respond(request.id, [
      { provider: 'deepseek', model: 'deepseek-chat' },
    ])
    return
  }
  if (request.method === 'preset/list') {
    transport.respond(request.id, [
      { id: 'standard', name: 'Standard', isDefault: true },
    ])
    return
  }
  if (request.method === 'preset/switch') {
    transport.respond(request.id, { ok: true })
    return
  }
  if (request.method === 'permission/list') {
    transport.respond(request.id, [
      { id: 'workspace-write', name: 'Workspace Write', description: 'Allow workspace writes' },
    ])
    return
  }
  if (request.method === 'permission/switch') {
    transport.respond(request.id, { ok: true })
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
