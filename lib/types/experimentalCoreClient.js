/**
 * Typed TUI-client facade for the v2 experimental core protocol. It wraps the
 * transport-only {@link CoreClient} with DSH-facing method names while keeping
 * the renderer free of DSH package imports.
 */
export class ExperimentalCoreClient {
    client;
    cwd;
    sessionId;
    genericHandler;
    approvalHandler;
    questionHandler;
    requestUnsubscribe;
    constructor(client, cwd) {
        this.client = client;
        this.cwd = cwd;
    }
    /** Start the child and complete the version handshake. */
    start() {
        return this.client.start();
    }
    /** Subscribe to core notifications such as session events and status. */
    onNotification(handler) {
        return this.client.onNotification(handler);
    }
    /** Handle any core-initiated request not covered by the specific helpers. */
    onRequest(handler) {
        this.genericHandler = handler;
        this.installRequestHandler();
        return () => {
            if (this.genericHandler === handler)
                this.genericHandler = undefined;
        };
    }
    /** Handle core-initiated approval requests. */
    onApprovalRequest(handler) {
        this.approvalHandler = handler;
        this.installRequestHandler();
        return () => {
            if (this.approvalHandler === handler)
                this.approvalHandler = undefined;
        };
    }
    /** Handle core-initiated user-question requests. */
    onUserQuestion(handler) {
        this.questionHandler = handler;
        this.installRequestHandler();
        return () => {
            if (this.questionHandler === handler)
                this.questionHandler = undefined;
        };
    }
    /** Close the owned core process. */
    close() {
        return this.client.close();
    }
    /** The session id of the last successful open/new/resume/rewind/model switch. */
    get activeSessionId() {
        return this.sessionId;
    }
    /** Open an existing session or create a new one when `sessionId` is absent. */
    async open(options = {}) {
        const result = await this.requestSession('session/open', options);
        this.sessionId = result.sessionId;
        return result;
    }
    /** Create a brand-new session. */
    async newSession(options = {}) {
        const result = await this.requestSession('session/new', options);
        this.sessionId = result.sessionId;
        return result;
    }
    /** Resume a persisted session. */
    async resume(sessionId, options = {}) {
        const result = await this.requestSession('session/resume', { ...options, sessionId });
        this.sessionId = result.sessionId;
        return result;
    }
    /** Send a user prompt to the active session. Returns the durable message id. */
    async prompt(text) {
        const value = await this.client.request('session/prompt', {
            sessionId: this.requireSessionId(),
            text,
        });
        if (!isObject(value) || typeof value.messageId !== 'string') {
            throw new Error('session/prompt returned an invalid response');
        }
        return value.messageId;
    }
    /** Cancel the active agent's in-flight turn. */
    async cancel() {
        await this.client.request('session/cancel', { sessionId: this.requireSessionId() });
    }
    /** List persisted sessions, optionally filtered to this client's cwd. */
    async listSessions() {
        const value = await this.client.request('session/list', { cwd: this.cwd });
        return Array.isArray(value) ? value.map(parseSessionSummary) : [];
    }
    /** Rewind the active conversation to a past user-message seq. */
    async rewind(seq) {
        const value = await this.client.request('session/rewind', {
            sessionId: this.requireSessionId(),
            seq,
        });
        if (value === null)
            return null;
        const result = parseSessionSnapshot(value);
        this.sessionId = result.sessionId;
        return result;
    }
    /** Fork the active conversation and continue it with a different model route. */
    async switchModel(provider, model) {
        const value = await this.client.request('model/switch', {
            sessionId: this.requireSessionId(),
            provider,
            model,
        });
        if (value === null)
            return null;
        const result = parseSessionSnapshot(value);
        this.sessionId = result.sessionId;
        return result;
    }
    /** Switch a blank session's agent preset. */
    async switchPreset(presetId) {
        const value = await this.client.request('preset/switch', {
            sessionId: this.requireSessionId(),
            presetId,
        });
        return isObject(value) && value.ok === true;
    }
    /** Switch the active session's permission preset. */
    async switchPermission(presetId) {
        const value = await this.client.request('permission/switch', {
            sessionId: this.requireSessionId(),
            presetId,
        });
        return isObject(value) && value.ok === true;
    }
    /** List model routes advertised by the core LLM service. */
    async listModels() {
        const value = await this.client.request('model/list');
        return Array.isArray(value) ? value.map(parseModelSummary) : [];
    }
    /** List agent-preset roster entries. */
    async listPresets() {
        const value = await this.client.request('preset/list');
        return Array.isArray(value) ? value.map(parsePresetSummary) : [];
    }
    /** List permission presets. */
    async listPermissions() {
        const value = await this.client.request('permission/list');
        return Array.isArray(value) ? value.map(parsePermissionSummary) : [];
    }
    installRequestHandler() {
        if (this.requestUnsubscribe !== undefined)
            return;
        this.requestUnsubscribe = this.client.onRequest((method, params) => this.dispatch(method, params));
    }
    async dispatch(method, params) {
        if (method === 'approval/request') {
            if (this.approvalHandler === undefined)
                throw new Error(`method not found: ${method}`);
            return this.approvalHandler(parseApprovalParams(params));
        }
        if (method === 'user-question/ask') {
            if (this.questionHandler === undefined)
                throw new Error(`method not found: ${method}`);
            return this.questionHandler(parseUserQuestionParams(params));
        }
        if (this.genericHandler !== undefined)
            return this.genericHandler(method, params);
        throw new Error(`method not found: ${method}`);
    }
    requireSessionId() {
        if (this.sessionId === undefined)
            throw new Error('no session is open');
        return this.sessionId;
    }
    async requestSession(method, options) {
        const params = { cwd: this.cwd };
        if (options.sessionId !== undefined)
            params.sessionId = options.sessionId;
        if (options.provider !== undefined)
            params.provider = options.provider;
        if (options.model !== undefined)
            params.model = options.model;
        const value = await this.client.request(method, params);
        return parseSessionSnapshot(value);
    }
}
function parseSessionSnapshot(value) {
    if (!isObject(value) || typeof value.sessionId !== 'string' || typeof value.status !== 'string' || !Array.isArray(value.events)) {
        throw new Error('core returned an invalid session snapshot');
    }
    return {
        sessionId: value.sessionId,
        status: value.status,
        events: value.events,
    };
}
function parseSessionSummary(value) {
    if (!isObject(value) || typeof value.id !== 'string') {
        throw new Error('session/list returned an invalid record');
    }
    return {
        id: value.id,
        ...(typeof value.createdAt === 'number' ? { createdAt: value.createdAt } : {}),
        ...(typeof value.cwd === 'string' ? { cwd: value.cwd } : {}),
        ...(typeof value.parentSession === 'string' ? { parentSession: value.parentSession } : {}),
        ...(typeof value.origin === 'string' ? { origin: value.origin } : {}),
        ...(typeof value.agentPreset === 'string' ? { agentPreset: value.agentPreset } : {}),
    };
}
function parseModelSummary(value) {
    if (!isObject(value) || typeof value.provider !== 'string' || typeof value.model !== 'string') {
        throw new Error('model/list returned an invalid record');
    }
    return { provider: value.provider, model: value.model };
}
function parsePresetSummary(value) {
    if (!isObject(value) || typeof value.id !== 'string') {
        throw new Error('preset/list returned an invalid record');
    }
    return {
        id: value.id,
        ...(typeof value.name === 'string' ? { name: value.name } : {}),
        ...(typeof value.description === 'string' ? { description: value.description } : {}),
        ...(typeof value.broken === 'string' ? { broken: value.broken } : {}),
        isDefault: value.isDefault === true,
    };
}
function parsePermissionSummary(value) {
    if (!isObject(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.description !== 'string') {
        throw new Error('permission/list returned an invalid record');
    }
    return { id: value.id, name: value.name, description: value.description };
}
function parseApprovalParams(value) {
    if (!isObject(value) || typeof value.toolName !== 'string') {
        throw new Error('approval/request carried invalid params');
    }
    return {
        ...(typeof value.sessionId === 'string' ? { sessionId: value.sessionId } : {}),
        toolName: value.toolName,
        ...(typeof value.callId === 'string' ? { callId: value.callId } : {}),
        ...(typeof value.reason === 'string' ? { reason: value.reason } : {}),
    };
}
function parseUserQuestionParams(value) {
    if (!isObject(value) || !Array.isArray(value.questions)) {
        throw new Error('user-question/ask carried invalid params');
    }
    return {
        ...(typeof value.sessionId === 'string' ? { sessionId: value.sessionId } : {}),
        questions: value.questions,
    };
}
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
