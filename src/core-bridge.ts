import { randomUUID } from 'node:crypto'
import { SessionId, type SessionEvent, type SessionHeader } from '@deepseek-ai/dsh-session'
import type { Agent, AgentHandle, AgentStatus } from '@deepseek-ai/dsh-agent'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { composePreset, resolvePersistedPreset, runningPresetOf } from './presets.js'
import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import {
  CORE_PROTOCOL_VERSION,
  CoreProtocolTransport,
  type JsonObject,
  type JsonValue,
} from './core-protocol.js'

export const name = 'cute-dsh-tui-core-bridge'
export const inject = ['agents']

/** Deployment-selected defaults for sessions opened by the v2 bridge. */
export interface CoreBridgeConfig {
  provider?: string
  model?: string
}

/** Runtime-only transport injection for bridge regressions; production uses stdio. */
export interface CoreBridgeRuntimeConfig extends CoreBridgeConfig {
  transport?: CoreProtocolTransport
}

export const Config: Schema<CoreBridgeConfig> = Schema.object({
  provider: Schema.string().required(false),
  model: Schema.string().required(false),
})

type ActiveSession = {
  agent: Agent
  handle: AgentHandle
}

/**
 * DSH-facing half of the v2 split. It owns one active harness Agent and
 * exposes its durable session events through stdout-only JSON-RPC. The TUI
 * client owns all rendering and must never import this module.
 */
export async function apply(ctx: Context, config: CoreBridgeRuntimeConfig): Promise<void> {
  const transport = config.transport ?? new CoreProtocolTransport(process.stdin, process.stdout)
  let active: ActiveSession | undefined
  let closing = false

  const closeActive = async (): Promise<void> => {
    const session = active
    active = undefined
    if (session !== undefined) await session.handle.dispose()
  }

  const replaceActive = async (next: ActiveSession): Promise<void> => {
    const previous = active
    active = next
    if (previous !== undefined) await previous.handle.dispose().catch(() => {})
  }

  const close = async (): Promise<void> => {
    if (closing) return
    closing = true
    transport.close('core bridge is shutting down')
    await closeActive()
  }

  const sessionResponse = (session: ActiveSession): JsonObject => ({
    sessionId: session.agent.session.id,
    status: session.agent.status,
    events: session.agent.session.events as unknown as JsonValue,
  })

  // Forward DSH user questions to the TUI client. The client is responsible
  // for rendering a questionnaire and returning the structured answer.
  const userQuestions = ctx.get('userQuestions') as
    | { registerProvider(provider: { ask(request: unknown): Promise<unknown> }): () => void }
    | undefined
  if (userQuestions !== undefined) {
    userQuestions.registerProvider({
      ask: async request => {
        const params: JsonObject = {
          ...(active === undefined ? {} : { sessionId: active.agent.session.id }),
          questions: (request as { questions?: JsonValue }).questions ?? [],
        }
        return transport.request('user-question/ask', params)
      },
    })
  }

  // Forward DSH approval requests for the active agent to the TUI client.
  // Any transport failure fails closed to 'unavailable', matching DSH's
  // approval service contract.
  ctx.on('approval/request', (request, next) => {
    if (request.agent !== active?.agent) return next()
    const params: JsonObject = {
      sessionId: request.agent.session.id,
      toolName: request.toolName,
      ...(request.callId === undefined ? {} : { callId: String(request.callId) }),
      ...(request.reason === undefined ? {} : { reason: request.reason }),
    }
    return transport.request('approval/request', params).then(
      outcome => {
        if (outcome === 'allowed-once' || outcome === 'rejected' || outcome === 'cancelled' || outcome === 'unavailable') {
          return outcome
        }
        return 'unavailable'
      },
      () => 'unavailable',
    )
  })

  ctx.on('session/event', (session, event: SessionEvent) => {
    if (session !== active?.agent.session) return
    transport.notify('session/event', {
      sessionId: session.header.id,
      event: event as unknown as JsonValue,
    })
  })
  ctx.on('agent/status', ({ agent, status }) => {
    if (agent !== active?.agent) return
    transport.notify('session/status', { sessionId: agent.session.id, status })
  })
  ctx.on('agent/disposed', ({ agent }) => {
    if (agent !== active?.agent) return
    transport.notify('session/status', { sessionId: agent.session.id, status: 'disposed' })
  })

  transport.onRequest(async request => {
    if (request.method === 'initialize') {
      const params = objectParams(request.params)
      const version = params.protocolVersion
      if (version !== CORE_PROTOCOL_VERSION) {
        transport.reject(request.id, {
          code: -32001,
          message: `unsupported core protocol version: ${String(version)}`,
          data: { supportedProtocolVersion: CORE_PROTOCOL_VERSION },
        })
        return
      }
      transport.respond(request.id, {
        protocolVersion: CORE_PROTOCOL_VERSION,
        server: { name: 'cute-dsh-tui-core-bridge', version: '0.1.0' },
      })
      return
    }
    if (request.method === 'session/open' || request.method === 'session/new' || request.method === 'session/resume') {
      const params = objectParams(request.params)
      const cwd = requiredString(params, 'cwd')
      const provider = optionalString(params, 'provider') ?? config.provider
      const model = optionalString(params, 'model') ?? config.model
      let requestedSessionId: string | undefined
      if (request.method === 'session/resume') {
        requestedSessionId = requiredString(params, 'sessionId')
      } else if (request.method === 'session/open') {
        requestedSessionId = optionalString(params, 'sessionId')
      }
      await closeActive()
      active = await openAgent(ctx, { cwd, requestedSessionId, provider, model })
      transport.respond(request.id, sessionResponse(active))
      return
    }
    if (request.method === 'session/prompt') {
      const session = requireActive(active)
      const params = objectParams(request.params)
      requireSession(params, session.agent.session.id)
      const text = requiredString(params, 'text')
      if (text.trim() === '') throw new Error('session/prompt text must not be empty')
      const message = createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } })
      session.agent.followup(message)
      transport.respond(request.id, { messageId: message.id })
      return
    }
    if (request.method === 'session/cancel') {
      const session = requireActive(active)
      requireSession(objectParams(request.params), session.agent.session.id)
      session.agent.cancel({ kind: 'user' }, { keepInbox: true })
      transport.respond(request.id, {})
      return
    }
    if (request.method === 'session/list') {
      const params = objectParams(request.params)
      const cwd = optionalString(params, 'cwd')
      transport.respond(request.id, await listSessions(ctx, cwd))
      return
    }
    if (request.method === 'session/rewind') {
      const session = requireActive(active)
      const params = objectParams(request.params)
      requireSession(params, session.agent.session.id)
      if (session.agent.status === 'running') throw new Error('session/rewind is unavailable while the agent is running')
      const seq = requiredNumber(params, 'seq')
      const sessions = ctx.get('sessions') as
        | { fork(source: unknown, boundary?: number): { events: readonly SessionEvent[] } }
        | undefined
      if (sessions === undefined) throw new Error('session/rewind is unavailable: no session store')
      const boundary = rewindBoundary(session.agent.session.events, seq)
      if (boundary < 0) throw new Error('cannot rewind to the very first message')
      const seed = sessions.fork(session.agent.session, boundary).events
      const next = await openForkedAgent(ctx, {
        cwd: session.agent.session.header.cwd ?? process.cwd(),
        seed,
        parentSession: session.agent.session.id,
        provider: session.agent.options.provider,
        model: session.agent.options.model,
        agentPreset: runningPresetOf(session.agent.session),
      })
      await replaceActive(next)
      transport.respond(request.id, sessionResponse(next))
      return
    }
    if (request.method === 'model/switch') {
      const session = requireActive(active)
      const params = objectParams(request.params)
      requireSession(params, session.agent.session.id)
      if (session.agent.status === 'running') throw new Error('model/switch is unavailable while the agent is running')
      const provider = requiredString(params, 'provider')
      const model = requiredString(params, 'model')
      const sessions = ctx.get('sessions') as
        | { fork(source: unknown, boundary?: number): { events: readonly SessionEvent[] } }
        | undefined
      if (sessions === undefined) throw new Error('model/switch is unavailable: no session store')
      const seed = sessions.fork(session.agent.session).events
      const next = await openForkedAgent(ctx, {
        cwd: session.agent.session.header.cwd ?? process.cwd(),
        seed,
        parentSession: session.agent.session.id,
        provider,
        model,
        agentPreset: runningPresetOf(session.agent.session),
      })
      await replaceActive(next)
      transport.respond(request.id, sessionResponse(next))
      return
    }
    if (request.method === 'model/list') {
      transport.respond(request.id, await listModels(ctx))
      return
    }
    if (request.method === 'preset/list') {
      transport.respond(request.id, await listPresets(ctx))
      return
    }
    if (request.method === 'preset/switch') {
      const session = requireActive(active)
      const params = objectParams(request.params)
      requireSession(params, session.agent.session.id)
      const presetId = requiredString(params, 'presetId')
      const presets = ctx.get('agentPresets') as
        | {
          resolve(id: string): Promise<{ id: string; broken?: string }>
          recompose(agentCtx: unknown, id: string): Promise<{ id: string }>
        }
        | undefined
      if (presets === undefined) {
        transport.respond(request.id, { ok: false, error: 'agent presets are unavailable' })
        return
      }
      if (session.agent.status === 'running') {
        transport.respond(request.id, { ok: false, error: 'cannot switch preset while the agent is running' })
        return
      }
      let resolved: { id: string; broken?: string }
      try {
        resolved = await presets.resolve(presetId)
      } catch (error) {
        transport.respond(request.id, { ok: false, error: errorMessage(error) })
        return
      }
      if (resolved.broken !== undefined) {
        transport.respond(request.id, { ok: false, error: resolved.broken })
        return
      }
      const blank = !session.agent.session.events.some(event => event.type === 'turn/start')
      if (!blank) {
        transport.respond(request.id, { ok: false, error: 'only a blank session can switch preset' })
        return
      }
      try {
        await presets.recompose(session.agent.ctx, presetId)
        const appendable = session.agent.session as unknown as { append(type: string, data: unknown): void }
        appendable.append('agent-preset/selected', { agentPreset: resolved.id })
      } catch (error) {
        transport.respond(request.id, { ok: false, error: errorMessage(error) })
        return
      }
      transport.respond(request.id, { ok: true })
      return
    }
    if (request.method === 'permission/list') {
      transport.respond(request.id, await listPermissions(ctx))
      return
    }
    if (request.method === 'permission/switch') {
      const session = requireActive(active)
      const params = objectParams(request.params)
      requireSession(params, session.agent.session.id)
      const presetId = requiredString(params, 'presetId')
      const permissionPresets = ctx.get('permissionPresets') as
        | {
          readonly names: readonly string[]
          set(session: unknown, name: string): void
        }
        | undefined
      if (permissionPresets === undefined) {
        transport.respond(request.id, { ok: false, error: 'permission presets are unavailable' })
        return
      }
      if (!permissionPresets.names.includes(presetId)) {
        transport.respond(request.id, { ok: false, error: `unknown permission preset: ${presetId}` })
        return
      }
      try {
        permissionPresets.set(session.agent.session, presetId)
      } catch (error) {
        transport.respond(request.id, { ok: false, error: errorMessage(error) })
        return
      }
      transport.respond(request.id, { ok: true })
      return
    }
    if (request.method === 'shutdown') {
      transport.respond(request.id, {})
      await close()
      void ctx.root.fiber.dispose()
      return
    }
    transport.reject(request.id, { code: -32601, message: `method not found: ${request.method}` })
  })

  transport.start()
  ctx.effect(() => () => close())
}

async function openAgent(
  ctx: Context,
  options: { cwd: string; requestedSessionId?: string; provider?: string; model?: string },
): Promise<ActiveSession> {
  const agentOptions = {
    ...options.provider === undefined ? {} : { provider: options.provider },
    ...options.model === undefined ? {} : { model: options.model },
  }
  if (options.requestedSessionId !== undefined) {
    const persistedPreset = await resolvePersistedPreset(ctx, SessionId(options.requestedSessionId))
    const composition = await composePreset(ctx, persistedPreset)
    const handle = await ctx.agents.resume({
      resumeSessionId: SessionId(options.requestedSessionId),
      agentOptions,
      ...(composition.setup === undefined ? {} : { setup: composition.setup }),
    })
    return { agent: handle.agent, handle }
  }
  const composition = await composePreset(ctx)
  const handle = await ctx.agents.create({
    sessionId: SessionId(randomUUID()),
    meta: {
      cwd: options.cwd,
      ...(composition.agentPreset === undefined ? {} : { agentPreset: composition.agentPreset }),
    },
    agentOptions,
    ...(composition.setup === undefined ? {} : { setup: composition.setup }),
  })
  return { agent: handle.agent, handle }
}

async function openForkedAgent(
  ctx: Context,
  options: {
    cwd: string
    seed: readonly SessionEvent[]
    parentSession: SessionId
    provider?: string
    model?: string
    agentPreset?: string
  },
): Promise<ActiveSession> {
  const agentOptions = {
    ...options.provider === undefined ? {} : { provider: options.provider },
    ...options.model === undefined ? {} : { model: options.model },
  }
  const composition = await composePreset(ctx, options.agentPreset)
  const handle = await ctx.agents.create({
    sessionId: SessionId(randomUUID()),
    seed: options.seed,
    meta: {
      cwd: options.cwd,
      parentSession: options.parentSession,
      seedLength: options.seed.length,
      ...(composition.agentPreset === undefined ? {} : { agentPreset: composition.agentPreset }),
    },
    agentOptions,
    ...(composition.setup === undefined ? {} : { setup: composition.setup }),
  })
  return { agent: handle.agent, handle }
}

async function listSessions(ctx: Context, cwd?: string): Promise<JsonValue[]> {
  const persistence = ctx.get('sessionPersistence') as
    | { list(signal?: AbortSignal): Promise<readonly SessionHeader[]> }
    | undefined
  if (persistence === undefined) return []
  try {
    const headers = await persistence.list()
    const normalizedCwd = cwd?.replace(/\/+$/, '')
    return headers
      .filter(header => header.origin !== 'subagent')
      .filter(header => normalizedCwd === undefined || (header.cwd ?? '').replace(/\/+$/, '') === normalizedCwd)
      .map(header => ({
        id: header.id,
        ...(header.createdAt === undefined ? {} : { createdAt: header.createdAt }),
        ...(header.cwd === undefined ? {} : { cwd: header.cwd }),
        ...(header.parentSession === undefined ? {} : { parentSession: header.parentSession }),
        ...(header.origin === undefined ? {} : { origin: header.origin }),
        ...(header.agentPreset === undefined ? {} : { agentPreset: header.agentPreset }),
      }))
  } catch {
    return []
  }
}

async function listModels(ctx: Context): Promise<JsonValue[]> {
  const llm = ctx.get('llm') as
    | {
      listProviders(): readonly { id: string }[]
      listModels(provider: string): Promise<readonly { id: string }[]>
    }
    | undefined
  if (llm === undefined) return []
  try {
    const providers = llm.listProviders()
    const lists = await Promise.all(providers.map(provider => llm.listModels(provider.id).catch(() => [])))
    return providers.flatMap((provider, index) =>
      lists[index]?.map(model => ({ provider: provider.id, model: model.id })) ?? [],
    )
  } catch {
    return []
  }
}

async function listPresets(ctx: Context): Promise<JsonValue[]> {
  const presets = ctx.get('agentPresets') as
    | {
      readonly defaultId: string
      list(): Promise<readonly { id: string; name?: string; description?: string; broken?: string }[]>
    }
    | undefined
  if (presets === undefined) return []
  try {
    const list = await presets.list()
    return list.map(preset => ({
      id: preset.id,
      ...(preset.name === undefined ? {} : { name: preset.name }),
      ...(preset.description === undefined ? {} : { description: preset.description }),
      ...(preset.broken === undefined ? {} : { broken: preset.broken }),
      isDefault: preset.id === presets.defaultId,
    }))
  } catch {
    return []
  }
}

function listPermissions(ctx: Context): JsonValue[] {
  const permissionPresets = ctx.get('permissionPresets') as
    | {
      readonly names: readonly string[]
      optionOf(name: string): { name: string; description?: string }
    }
    | undefined
  if (permissionPresets === undefined) return []
  return permissionPresets.names.map(id => {
    const option = permissionPresets.optionOf(id)
    return {
      id,
      name: option.name,
      description: option.description ?? id,
    }
  })
}

function rewindBoundary(events: readonly SessionEvent[], rowSeq: number): number {
  let boundary = rowSeq
  for (let i = rowSeq; i >= 0; i--) {
    const event = events[i]
    if (event === undefined) break
    if (event.type === 'turn/start') {
      boundary = event.seq - 1
      break
    }
    if (event.type === 'turn/end') break
  }
  return boundary
}

function objectParams(value: JsonValue | undefined): JsonObject {
  if (value === undefined) return {}
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('request params must be an object')
  return value
}

function requiredString(params: JsonObject, key: string): string {
  const value = params[key]
  if (typeof value !== 'string' || value === '') throw new Error(`${key} must be a non-empty string`)
  return value
}

function requiredNumber(params: JsonObject, key: string): number {
  const value = params[key]
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error(`${key} must be a non-negative integer`)
  return value
}

function optionalString(params: JsonObject, key: string): string | undefined {
  const value = params[key]
  if (value === undefined) return undefined
  if (typeof value !== 'string' || value === '') throw new Error(`${key} must be a non-empty string when provided`)
  return value
}

function requireActive(active: ActiveSession | undefined): ActiveSession {
  if (active === undefined) throw new Error('no session is open')
  return active
}

function requireSession(params: JsonObject, id: string): void {
  if (requiredString(params, 'sessionId') !== id) throw new Error('the requested session is not active')
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
