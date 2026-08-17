import type { CoreClient, CoreClientRequestHandler } from './core-client.js';
import type { JsonValue } from './core-protocol.js';
/** Snapshot returned after a session is opened, created, resumed, or forked. */
export interface SessionSnapshot {
    readonly sessionId: string;
    readonly status: string;
    readonly events: JsonValue[];
}
/** One persisted session header surfaced by `session/list`. */
export interface SessionSummary {
    readonly id: string;
    readonly createdAt?: number;
    readonly cwd?: string;
    readonly parentSession?: string;
    readonly origin?: string;
    readonly agentPreset?: string;
}
/** One model advertised by the core's LLM service. */
export interface ModelSummary {
    readonly provider: string;
    readonly model: string;
}
/** One agent-preset roster entry. */
export interface PresetSummary {
    readonly id: string;
    readonly name?: string;
    readonly description?: string;
    readonly broken?: string;
    readonly isDefault: boolean;
}
/** One permission preset. */
export interface PermissionSummary {
    readonly id: string;
    readonly name: string;
    readonly description: string;
}
/** Parameters forwarded from the core for an approval request. */
export interface ApprovalRequestParams {
    readonly sessionId?: string;
    readonly toolName: string;
    readonly callId?: string;
    readonly reason?: string;
}
/** Parameters forwarded from the core for a user-question request. */
export interface UserQuestionParams {
    readonly sessionId?: string;
    readonly questions: JsonValue[];
}
/** The closed vocabulary accepted by DSH approval requests. */
export type ApprovalOutcome = 'allowed-once' | 'rejected' | 'cancelled' | 'unavailable';
/**
 * Typed TUI-client facade for the v2 experimental core protocol. It wraps the
 * transport-only {@link CoreClient} with DSH-facing method names while keeping
 * the renderer free of DSH package imports.
 */
export declare class ExperimentalCoreClient {
    private readonly client;
    private readonly cwd;
    private sessionId;
    private genericHandler;
    private approvalHandler;
    private questionHandler;
    private requestUnsubscribe;
    constructor(client: CoreClient, cwd: string);
    /** Start the child and complete the version handshake. */
    start(): Promise<{
        name: string;
        version: string;
    }>;
    /** Subscribe to core notifications such as session events and status. */
    onNotification(handler: (method: string, params: JsonValue | undefined) => void): () => void;
    /** Handle any core-initiated request not covered by the specific helpers. */
    onRequest(handler: CoreClientRequestHandler): () => void;
    /** Handle core-initiated approval requests. */
    onApprovalRequest(handler: (params: ApprovalRequestParams) => ApprovalOutcome | Promise<ApprovalOutcome>): () => void;
    /** Handle core-initiated user-question requests. */
    onUserQuestion(handler: (params: UserQuestionParams) => JsonValue | Promise<JsonValue>): () => void;
    /** Close the owned core process. */
    close(): Promise<void>;
    /** The session id of the last successful open/new/resume/rewind/model switch. */
    get activeSessionId(): string | undefined;
    /** Open an existing session or create a new one when `sessionId` is absent. */
    open(options?: {
        sessionId?: string;
        provider?: string;
        model?: string;
    }): Promise<SessionSnapshot>;
    /** Create a brand-new session. */
    newSession(options?: {
        provider?: string;
        model?: string;
    }): Promise<SessionSnapshot>;
    /** Resume a persisted session. */
    resume(sessionId: string, options?: {
        provider?: string;
        model?: string;
    }): Promise<SessionSnapshot>;
    /** Send a user prompt to the active session. Returns the durable message id. */
    prompt(text: string): Promise<string>;
    /** Cancel the active agent's in-flight turn. */
    cancel(): Promise<void>;
    /** List persisted sessions, optionally filtered to this client's cwd. */
    listSessions(): Promise<SessionSummary[]>;
    /** Rewind the active conversation to a past user-message seq. */
    rewind(seq: number): Promise<SessionSnapshot | null>;
    /** Fork the active conversation and continue it with a different model route. */
    switchModel(provider: string, model: string): Promise<SessionSnapshot | null>;
    /** Switch a blank session's agent preset. */
    switchPreset(presetId: string): Promise<boolean>;
    /** Switch the active session's permission preset. */
    switchPermission(presetId: string): Promise<boolean>;
    /** List model routes advertised by the core LLM service. */
    listModels(): Promise<ModelSummary[]>;
    /** List agent-preset roster entries. */
    listPresets(): Promise<PresetSummary[]>;
    /** List permission presets. */
    listPermissions(): Promise<PermissionSummary[]>;
    private installRequestHandler;
    private dispatch;
    private requireSessionId;
    private requestSession;
}
//# sourceMappingURL=experimentalCoreClient.d.ts.map