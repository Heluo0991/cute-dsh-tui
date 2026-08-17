import type { Readable, Writable } from 'node:stream';
/** Wire-major version for the out-of-process CuteDshTui core protocol. */
export declare const CORE_PROTOCOL_VERSION = 1;
export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonValue[] | {
    [key: string]: JsonValue;
};
export type JsonObject = {
    [key: string]: JsonValue;
};
export interface JsonRpcRequest {
    jsonrpc: '2.0';
    id: string;
    method: string;
    params?: JsonValue;
}
export interface JsonRpcNotification {
    jsonrpc: '2.0';
    method: string;
    params?: JsonValue;
}
export interface JsonRpcFailure {
    code: number;
    message: string;
    data?: JsonValue;
}
export interface JsonRpcResponse {
    jsonrpc: '2.0';
    id: string;
    result?: JsonValue;
    error?: JsonRpcFailure;
}
export type JsonRpcFrame = JsonRpcRequest | JsonRpcNotification | JsonRpcResponse;
/** Error returned when the peer rejects a JSON-RPC request. */
export declare class CoreProtocolResponseError extends Error {
    readonly code: number;
    readonly data: JsonValue | undefined;
    constructor(code: number, message: string, data: JsonValue | undefined);
}
/** Error returned when the core process closes before a request settles. */
export declare class CoreProtocolClosedError extends Error {
    constructor(message?: string);
}
/** Error returned when a request has no response within its caller-owned bound. */
export declare class CoreProtocolTimeoutError extends Error {
    constructor(method: string, timeoutMs: number);
}
type RequestHandler = (request: JsonRpcRequest) => void | Promise<void>;
type NotificationHandler = (notification: JsonRpcNotification) => void;
/**
 * Newline-delimited JSON-RPC transport for the future TUI/core process split.
 * It owns only framing and request correlation: the caller owns child-process
 * lifecycle and the semantics of every named method.
 */
export declare class CoreProtocolTransport {
    private readonly input;
    private readonly output;
    private buffer;
    private readonly pending;
    private readonly notificationHandlers;
    private requestHandler;
    private started;
    private closed;
    constructor(input: Readable, output: Writable);
    /** Begin receiving frames. Calling start twice is harmless. */
    start(): void;
    /** Stop receiving frames and reject every in-flight request exactly once. */
    close(reason?: string): void;
    /** Install the one server-side request handler for this transport. */
    onRequest(handler: RequestHandler): () => void;
    /** Subscribe to peer notifications. */
    onNotification(handler: NotificationHandler): () => void;
    /** Send a request and await its correlated response. */
    request(method: string, params?: JsonValue, timeoutMs?: number): Promise<JsonValue | undefined>;
    /** Send a one-way notification. */
    notify(method: string, params?: JsonValue): void;
    /** Respond to a peer request. */
    respond(id: string, result?: JsonValue): void;
    /** Reject a peer request with a JSON-RPC error. */
    reject(id: string, error: JsonRpcFailure): void;
    private readonly onData;
    private readonly onInputEnd;
    private readonly onInputError;
    private receive;
    private write;
}
export {};
//# sourceMappingURL=core-protocol.d.ts.map