import { type JsonValue } from './core-protocol.js';
/** Explicit child-process launch input. Runtime discovery belongs to the launcher. */
export interface CoreLaunchSpec {
    command: string;
    args: readonly string[];
    cwd?: string;
    env?: NodeJS.ProcessEnv;
}
export interface CoreServerInfo {
    name: string;
    version: string;
}
export interface CoreClientOptions {
    handshakeTimeoutMs?: number;
    shutdownTimeoutMs?: number;
}
/** Handler for JSON-RPC requests initiated by the core process (e.g. approvals). */
export type CoreClientRequestHandler = (method: string, params: JsonValue | undefined) => JsonValue | undefined | Promise<JsonValue | undefined>;
/**
 * TUI-facing client for one owned core process. It knows nothing about DSH or
 * React: callers provide an explicit executable and interpret named methods.
 */
export declare class CoreClient {
    private readonly launch;
    private readonly options;
    private child;
    private transport;
    private readonly notificationHandlers;
    private requestHandler;
    private stderr;
    private exit;
    private started;
    private closed;
    private serverInfo;
    constructor(launch: CoreLaunchSpec, options?: CoreClientOptions);
    /** Start the child and complete the version handshake before returning. */
    start(): Promise<CoreServerInfo>;
    /** Send a typed-at-the-wire-boundary request after a successful handshake. */
    request(method: string, params?: JsonValue, timeoutMs?: number): Promise<JsonValue | undefined>;
    /** Subscribe to server notifications such as session events and status changes. */
    onNotification(handler: (method: string, params: JsonValue | undefined) => void): () => void;
    /** Handle JSON-RPC requests initiated by the core process (approvals, questions). */
    onRequest(handler: CoreClientRequestHandler): () => void;
    /** Bounded stderr tail for launch and transport diagnostics. */
    stderrTail(): string;
    /** Gracefully ask the core to stop, then reap the owned child if needed. */
    close(): Promise<void>;
    private handleRequest;
    private appendStderr;
    private closeAfterFailedStart;
}
//# sourceMappingURL=core-client.d.ts.map