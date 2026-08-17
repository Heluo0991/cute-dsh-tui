import type { CoreClient, CoreClientRequestHandler } from './core-client.js'
import type { JsonObject, JsonValue } from './core-protocol.js'

/** Snapshot returned after a session is opened, created, resumed, or forked. */
export interface SessionSnapshot {
  readonly sessionId: string
  readonly status: string
  readonly events: JsonValue[]
}

/** One persisted session header surfaced by `session/list`. */
export interface SessionSummary {
  readonly id: string
  readonly createdAt?: number
  readonly cwd?: string
  readonly parentSession?: string
  readonly origin?: string
  readonly agentPreset?: string
}

/** One model advertised by the core's LLM service. */
export interface ModelSummary {
  readonly provider: string
  readonly model: string
}

/** One agent-preset roster entry. */
export interface PresetSummary {
  readonly id: string
  readonly name?: string
  readonly description?: string
  readonly broken?: string
  readonly isDefault: boolean
}

/** One permission preset. */
export interface PermissionSummary {
  readonly id: string
  readonly name: string
  readonly description: string
}

/** Parameters forwarded from the core for an approval request. */
export interface ApprovalRequestParams {
  readonly sessionId?: string
  readonly toolName: string
  readonly callId?: string
  readonly reason?: string
}

/** Parameters forwarded from the core for a user-question request. */
export interface UserQuestionParams {
  readonly sessionId?: string
  readonly questions: JsonValue[]
}

/** The closed vocabulary accepted by DSH approval requests. */
export type ApprovalOutcome = 'allowed-once' | 'rejected' | 'cancelled' | 'unavailable'

/**
 * Typed TUI-client facade for the v2 experimental core protocol. It wraps the
 * transport-only {@link CoreClient} with DSH-facing method names while keeping
 * the renderer free of DSH package imports.
 */
export class ExperimentalCoreClient {
  private sessionId: string | undefined
  private genericHandler: CoreClientRequestHandler | undefined
  private approvalHandler: ((params: ApprovalRequestParams) => ApprovalOutcome | Promise<ApprovalOutcome>) | undefined
  private questionHandler: ((params: UserQuestionParams) => JsonValue | Promise<JsonValue>) | undefined
  private requestUnsubscribe: (() => void) | undefined

  constructor(
    private readonly client: CoreClient,
    private readonly cwd: string,
  ) {}

  /** Start the child and complete the version handshake. */
  start(): Promise<{ name: string; version: string }> {
    return this.client.start()
  }

  /** Subscribe to core notifications such as session events and status. */
  onNotification(handler: (method: string, params: JsonValue | undefined) => void): () => void {
    return this.client.onNotification(handler)
  }

  /** Handle any core-initiated request not covered by the specific helpers. */
  onRequest(handler: CoreClientRequestHandler): () => void {
    this.genericHandler = handler
    this.installRequestHandler()
    return () => {
      if (this.genericHandler === handler) this.genericHandler = undefined
    }
  }

  /** Handle core-initiated approval requests. */
  onApprovalRequest(
    handler: (params: ApprovalRequestParams) => ApprovalOutcome | Promise<ApprovalOutcome>,
  ): () => void {
    this.approvalHandler = handler
    this.installRequestHandler()
    return () => {
      if (this.approvalHandler === handler) this.approvalHandler = undefined
    }
  }

  /** Handle core-initiated user-question requests. */
  onUserQuestion(
    handler: (params: UserQuestionParams) => JsonValue | Promise<JsonValue>,
  ): () => void {
    this.questionHandler = handler
    this.installRequestHandler()
    return () => {
      if (this.questionHandler === handler) this.questionHandler = undefined
    }
  }

  /** Close the owned core process. */
  close(): Promise<void> {
    return this.client.close()
  }

  /** The session id of the last successful open/new/resume/rewind/model switch. */
  get activeSessionId(): string | undefined {
    return this.sessionId
  }

  /** Open an existing session or create a new one when `sessionId` is absent. */
  async open(options: { sessionId?: string; provider?: string; model?: string } = {}): Promise<SessionSnapshot> {
    const result = await this.requestSession('session/open', options)
    this.sessionId = result.sessionId
    return result
  }

  /** Create a brand-new session. */
  async newSession(options: { provider?: string; model?: string } = {}): Promise<SessionSnapshot> {
    const result = await this.requestSession('session/new', options)
    this.sessionId = result.sessionId
    return result
  }

  /** Resume a persisted session. */
  async resume(sessionId: string, options: { provider?: string; model?: string } = {}): Promise<SessionSnapshot> {
    const result = await this.requestSession('session/resume', { ...options, sessionId })
    this.sessionId = result.sessionId
    return result
  }

  /** Send a user prompt to the active session. Returns the durable message id. */
  async prompt(text: string): Promise<string> {
    const value = await this.client.request('session/prompt', {
      sessionId: this.requireSessionId(),
      text,
    })
    if (!isObject(value) || typeof value.messageId !== 'string') {
      throw new Error('session/prompt returned an invalid response')
    }
    return value.messageId
  }

  /** Cancel the active agent's in-flight turn. */
  async cancel(): Promise<void> {
    await this.client.request('session/cancel', { sessionId: this.requireSessionId() })
  }

  /** List persisted sessions, optionally filtered to this client's cwd. */
  async listSessions(): Promise<SessionSummary[]> {
    const value = await this.client.request('session/list', { cwd: this.cwd })
    return Array.isArray(value) ? value.map(parseSessionSummary) : []
  }

  /** Rewind the active conversation to a past user-message seq. */
  async rewind(seq: number): Promise<SessionSnapshot | null> {
    const value = await this.client.request('session/rewind', {
      sessionId: this.requireSessionId(),
      seq,
    })
    if (value === null) return null
    const result = parseSessionSnapshot(value)
    this.sessionId = result.sessionId
    return result
  }

  /** Fork the active conversation and continue it with a different model route. */
  async switchModel(provider: string, model: string): Promise<SessionSnapshot | null> {
    const value = await this.client.request('model/switch', {
      sessionId: this.requireSessionId(),
      provider,
      model,
    })
    if (value === null) return null
    const result = parseSessionSnapshot(value)
    this.sessionId = result.sessionId
    return result
  }

  /** Switch a blank session's agent preset. */
  async switchPreset(presetId: string): Promise<boolean> {
    const value = await this.client.request('preset/switch', {
      sessionId: this.requireSessionId(),
      presetId,
    })
    return isObject(value) && value.ok === true
  }

  /** Switch the active session's permission preset. */
  async switchPermission(presetId: string): Promise<boolean> {
    const value = await this.client.request('permission/switch', {
      sessionId: this.requireSessionId(),
      presetId,
    })
    return isObject(value) && value.ok === true
  }

  /** List model routes advertised by the core LLM service. */
  async listModels(): Promise<ModelSummary[]> {
    const value = await this.client.request('model/list')
    return Array.isArray(value) ? value.map(parseModelSummary) : []
  }

  /** List agent-preset roster entries. */
  async listPresets(): Promise<PresetSummary[]> {
    const value = await this.client.request('preset/list')
    return Array.isArray(value) ? value.map(parsePresetSummary) : []
  }

  /** List permission presets. */
  async listPermissions(): Promise<PermissionSummary[]> {
    const value = await this.client.request('permission/list')
    return Array.isArray(value) ? value.map(parsePermissionSummary) : []
  }

  private installRequestHandler(): void {
    if (this.requestUnsubscribe !== undefined) return
    this.requestUnsubscribe = this.client.onRequest((method, params) => this.dispatch(method, params))
  }

  private async dispatch(method: string, params: JsonValue | undefined): Promise<JsonValue | undefined> {
    if (method === 'approval/request') {
      if (this.approvalHandler === undefined) throw new Error(`method not found: ${method}`)
      return this.approvalHandler(parseApprovalParams(params))
    }
    if (method === 'user-question/ask') {
      if (this.questionHandler === undefined) throw new Error(`method not found: ${method}`)
      return this.questionHandler(parseUserQuestionParams(params))
    }
    if (this.genericHandler !== undefined) return this.genericHandler(method, params)
    throw new Error(`method not found: ${method}`)
  }

  private requireSessionId(): string {
    if (this.sessionId === undefined) throw new Error('no session is open')
    return this.sessionId
  }

  private async requestSession(
    method: string,
    options: { sessionId?: string; provider?: string; model?: string; cwd?: string },
  ): Promise<SessionSnapshot> {
    const params: JsonObject = { cwd: this.cwd }
    if (options.sessionId !== undefined) params.sessionId = options.sessionId
    if (options.provider !== undefined) params.provider = options.provider
    if (options.model !== undefined) params.model = options.model
    const value = await this.client.request(method, params)
    return parseSessionSnapshot(value)
  }
}

function parseSessionSnapshot(value: JsonValue | undefined): SessionSnapshot {
  if (!isObject(value) || typeof value.sessionId !== 'string' || typeof value.status !== 'string' || !Array.isArray(value.events)) {
    throw new Error('core returned an invalid session snapshot')
  }
  return {
    sessionId: value.sessionId,
    status: value.status,
    events: value.events,
  }
}

function parseSessionSummary(value: JsonValue): SessionSummary {
  if (!isObject(value) || typeof value.id !== 'string') {
    throw new Error('session/list returned an invalid record')
  }
  return {
    id: value.id,
    ...(typeof value.createdAt === 'number' ? { createdAt: value.createdAt } : {}),
    ...(typeof value.cwd === 'string' ? { cwd: value.cwd } : {}),
    ...(typeof value.parentSession === 'string' ? { parentSession: value.parentSession } : {}),
    ...(typeof value.origin === 'string' ? { origin: value.origin } : {}),
    ...(typeof value.agentPreset === 'string' ? { agentPreset: value.agentPreset } : {}),
  }
}

function parseModelSummary(value: JsonValue): ModelSummary {
  if (!isObject(value) || typeof value.provider !== 'string' || typeof value.model !== 'string') {
    throw new Error('model/list returned an invalid record')
  }
  return { provider: value.provider, model: value.model }
}

function parsePresetSummary(value: JsonValue): PresetSummary {
  if (!isObject(value) || typeof value.id !== 'string') {
    throw new Error('preset/list returned an invalid record')
  }
  return {
    id: value.id,
    ...(typeof value.name === 'string' ? { name: value.name } : {}),
    ...(typeof value.description === 'string' ? { description: value.description } : {}),
    ...(typeof value.broken === 'string' ? { broken: value.broken } : {}),
    isDefault: value.isDefault === true,
  }
}

function parsePermissionSummary(value: JsonValue): PermissionSummary {
  if (!isObject(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.description !== 'string') {
    throw new Error('permission/list returned an invalid record')
  }
  return { id: value.id, name: value.name, description: value.description }
}

function parseApprovalParams(value: JsonValue | undefined): ApprovalRequestParams {
  if (!isObject(value) || typeof value.toolName !== 'string') {
    throw new Error('approval/request carried invalid params')
  }
  return {
    ...(typeof value.sessionId === 'string' ? { sessionId: value.sessionId } : {}),
    toolName: value.toolName,
    ...(typeof value.callId === 'string' ? { callId: value.callId } : {}),
    ...(typeof value.reason === 'string' ? { reason: value.reason } : {}),
  }
}

function parseUserQuestionParams(value: JsonValue | undefined): UserQuestionParams {
  if (!isObject(value) || !Array.isArray(value.questions)) {
    throw new Error('user-question/ask carried invalid params')
  }
  return {
    ...(typeof value.sessionId === 'string' ? { sessionId: value.sessionId } : {}),
    questions: value.questions as JsonValue[],
  }
}

function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
