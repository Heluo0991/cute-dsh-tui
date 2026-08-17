import { randomUUID } from 'node:crypto';
/** Wire-major version for the out-of-process CuteDshTui core protocol. */
export const CORE_PROTOCOL_VERSION = 1;
/** Error returned when the peer rejects a JSON-RPC request. */
export class CoreProtocolResponseError extends Error {
    code;
    data;
    constructor(code, message, data) {
        super(message);
        this.code = code;
        this.data = data;
        this.name = 'CoreProtocolResponseError';
    }
}
/** Error returned when the core process closes before a request settles. */
export class CoreProtocolClosedError extends Error {
    constructor(message = 'core protocol transport is closed') {
        super(message);
        this.name = 'CoreProtocolClosedError';
    }
}
/** Error returned when a request has no response within its caller-owned bound. */
export class CoreProtocolTimeoutError extends Error {
    constructor(method, timeoutMs) {
        super(`core protocol request timed out: ${method} (${timeoutMs}ms)`);
        this.name = 'CoreProtocolTimeoutError';
    }
}
/**
 * Newline-delimited JSON-RPC transport for the future TUI/core process split.
 * It owns only framing and request correlation: the caller owns child-process
 * lifecycle and the semantics of every named method.
 */
export class CoreProtocolTransport {
    input;
    output;
    buffer = '';
    pending = new Map();
    notificationHandlers = new Set();
    requestHandler;
    started = false;
    closed = false;
    constructor(input, output) {
        this.input = input;
        this.output = output;
    }
    /** Begin receiving frames. Calling start twice is harmless. */
    start() {
        if (this.closed)
            throw new CoreProtocolClosedError();
        if (this.started)
            return;
        this.started = true;
        this.input.on('data', this.onData);
        this.input.once('end', this.onInputEnd);
        this.input.once('error', this.onInputError);
    }
    /** Stop receiving frames and reject every in-flight request exactly once. */
    close(reason = 'core protocol transport is closed') {
        if (this.closed)
            return;
        this.closed = true;
        this.started = false;
        this.input.off('data', this.onData);
        this.input.off('end', this.onInputEnd);
        this.input.off('error', this.onInputError);
        const error = new CoreProtocolClosedError(reason);
        for (const [id, pending] of this.pending) {
            this.pending.delete(id);
            if (pending.timer !== undefined)
                clearTimeout(pending.timer);
            pending.reject(error);
        }
    }
    /** Install the one server-side request handler for this transport. */
    onRequest(handler) {
        if (this.requestHandler !== undefined)
            throw new Error('core protocol request handler is already registered');
        this.requestHandler = handler;
        return () => {
            if (this.requestHandler === handler)
                this.requestHandler = undefined;
        };
    }
    /** Subscribe to peer notifications. */
    onNotification(handler) {
        this.notificationHandlers.add(handler);
        return () => this.notificationHandlers.delete(handler);
    }
    /** Send a request and await its correlated response. */
    request(method, params, timeoutMs) {
        if (this.closed)
            return Promise.reject(new CoreProtocolClosedError());
        const id = randomUUID();
        return new Promise((resolve, reject) => {
            const pending = { method, resolve, reject, timer: undefined };
            if (timeoutMs !== undefined) {
                pending.timer = setTimeout(() => {
                    if (!this.pending.delete(id))
                        return;
                    reject(new CoreProtocolTimeoutError(method, timeoutMs));
                }, timeoutMs);
            }
            this.pending.set(id, pending);
            try {
                this.write({ jsonrpc: '2.0', id, method, ...params === undefined ? {} : { params } });
            }
            catch (error) {
                this.pending.delete(id);
                if (pending.timer !== undefined)
                    clearTimeout(pending.timer);
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        });
    }
    /** Send a one-way notification. */
    notify(method, params) {
        if (this.closed)
            throw new CoreProtocolClosedError();
        this.write({ jsonrpc: '2.0', method, ...params === undefined ? {} : { params } });
    }
    /** Respond to a peer request. */
    respond(id, result) {
        if (this.closed)
            throw new CoreProtocolClosedError();
        this.write({ jsonrpc: '2.0', id, ...result === undefined ? {} : { result } });
    }
    /** Reject a peer request with a JSON-RPC error. */
    reject(id, error) {
        if (this.closed)
            throw new CoreProtocolClosedError();
        this.write({ jsonrpc: '2.0', id, error });
    }
    onData = (chunk) => {
        this.buffer += chunk.toString();
        for (;;) {
            const end = this.buffer.indexOf('\n');
            if (end === -1)
                return;
            const line = this.buffer.slice(0, end).trim();
            this.buffer = this.buffer.slice(end + 1);
            if (line.length === 0)
                continue;
            this.receive(line);
        }
    };
    onInputEnd = () => this.close('core protocol input closed');
    onInputError = (error) => this.close(`core protocol input failed: ${error.message}`);
    receive(line) {
        let value;
        try {
            value = JSON.parse(line);
        }
        catch {
            return;
        }
        if (!isFrame(value))
            return;
        if (isResponse(value)) {
            const pending = this.pending.get(value.id);
            if (pending === undefined)
                return;
            this.pending.delete(value.id);
            if (pending.timer !== undefined)
                clearTimeout(pending.timer);
            if (value.error !== undefined)
                pending.reject(new CoreProtocolResponseError(value.error.code, value.error.message, value.error.data));
            else
                pending.resolve(value.result);
            return;
        }
        if (isRequest(value)) {
            if (this.requestHandler === undefined) {
                this.reject(value.id, { code: -32601, message: `method not found: ${value.method}` });
                return;
            }
            void Promise.resolve(this.requestHandler(value)).catch(error => {
                const message = error instanceof Error ? error.message : String(error);
                this.reject(value.id, { code: -32603, message });
            });
            return;
        }
        for (const handler of this.notificationHandlers)
            handler(value);
    }
    write(frame) {
        const line = `${JSON.stringify(frame)}\n`;
        if (!this.output.write(line)) {
            // Backpressure is owned by Node's writable stream. The frame has still
            // been accepted, so waiting here would turn a notification into a hang.
        }
    }
}
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isJsonValue(value) {
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
        return true;
    if (Array.isArray(value))
        return value.every(isJsonValue);
    return isObject(value) && Object.values(value).every(isJsonValue);
}
function isFrame(value) {
    if (!isObject(value) || value.jsonrpc !== '2.0')
        return false;
    const hasMethod = typeof value.method === 'string';
    const hasId = typeof value.id === 'string';
    if ('method' in value && !hasMethod || 'id' in value && !hasId)
        return false;
    if ('params' in value && !isJsonValue(value.params))
        return false;
    if (hasMethod)
        return !('result' in value) && !('error' in value);
    if (!hasId || !('result' in value || 'error' in value) || 'result' in value && 'error' in value)
        return false;
    if ('result' in value && !isJsonValue(value.result))
        return false;
    if ('error' in value) {
        if (!isObject(value.error) || typeof value.error.code !== 'number' || typeof value.error.message !== 'string')
            return false;
        if ('data' in value.error && !isJsonValue(value.error.data))
            return false;
    }
    return true;
}
function isRequest(value) {
    return 'id' in value && 'method' in value;
}
function isResponse(value) {
    return 'id' in value && !('method' in value);
}
