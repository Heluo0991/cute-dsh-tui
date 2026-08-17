import { spawn } from 'node:child_process';
import { CORE_PROTOCOL_VERSION, CoreProtocolClosedError, CoreProtocolTransport, } from './core-protocol.js';
const DEFAULT_HANDSHAKE_TIMEOUT_MS = 10_000;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 1_000;
const STDERR_LIMIT = 16_000;
/**
 * TUI-facing client for one owned core process. It knows nothing about DSH or
 * React: callers provide an explicit executable and interpret named methods.
 */
export class CoreClient {
    launch;
    options;
    child;
    transport;
    notificationHandlers = new Set();
    requestHandler;
    stderr = '';
    exit;
    started = false;
    closed = false;
    serverInfo;
    constructor(launch, options = {}) {
        this.launch = launch;
        this.options = options;
    }
    /** Start the child and complete the version handshake before returning. */
    async start() {
        if (this.serverInfo !== undefined)
            return this.serverInfo;
        if (this.started)
            throw new Error('core client is already starting');
        this.started = true;
        try {
            const child = spawn(this.launch.command, [...this.launch.args], {
                cwd: this.launch.cwd,
                env: this.launch.env,
                stdio: ['pipe', 'pipe', 'pipe'],
                windowsHide: true,
            });
            this.child = child;
            this.exit = new Promise(resolve => child.once('exit', code => resolve(code)));
            child.stderr.on('data', (chunk) => this.appendStderr(chunk.toString('utf8')));
            const transport = new CoreProtocolTransport(child.stdout, child.stdin);
            this.transport = transport;
            transport.onNotification(notification => {
                for (const handler of this.notificationHandlers)
                    handler(notification.method, notification.params);
            });
            transport.onRequest(request => this.handleRequest(request));
            transport.start();
            await onceSpawned(child);
            const result = await transport.request('initialize', { protocolVersion: CORE_PROTOCOL_VERSION }, this.options.handshakeTimeoutMs ?? DEFAULT_HANDSHAKE_TIMEOUT_MS);
            this.serverInfo = parseInitializeResult(result);
            return this.serverInfo;
        }
        catch (error) {
            const detail = this.stderrTail().trim();
            await this.closeAfterFailedStart();
            if (detail !== '') {
                const message = error instanceof Error ? error.message : String(error);
                throw new Error(`core failed during initialize: ${message}\n${detail}`, { cause: error });
            }
            throw error;
        }
    }
    /** Send a typed-at-the-wire-boundary request after a successful handshake. */
    request(method, params, timeoutMs) {
        if (this.serverInfo === undefined)
            return Promise.reject(new Error('core client has not completed initialize'));
        if (this.closed)
            return Promise.reject(new CoreProtocolClosedError());
        return this.transport.request(method, params, timeoutMs);
    }
    /** Subscribe to server notifications such as session events and status changes. */
    onNotification(handler) {
        this.notificationHandlers.add(handler);
        return () => this.notificationHandlers.delete(handler);
    }
    /** Handle JSON-RPC requests initiated by the core process (approvals, questions). */
    onRequest(handler) {
        this.requestHandler = handler;
        return () => {
            if (this.requestHandler === handler)
                this.requestHandler = undefined;
        };
    }
    /** Bounded stderr tail for launch and transport diagnostics. */
    stderrTail() {
        return this.stderr;
    }
    /** Gracefully ask the core to stop, then reap the owned child if needed. */
    async close() {
        if (this.closed)
            return;
        this.closed = true;
        const transport = this.transport;
        const child = this.child;
        if (transport !== undefined && this.serverInfo !== undefined) {
            try {
                await transport.request('shutdown', undefined, this.options.shutdownTimeoutMs ?? DEFAULT_SHUTDOWN_TIMEOUT_MS);
            }
            catch {
                // A failed graceful shutdown still reaches the owned-process reap below.
            }
        }
        transport?.close('core client closed');
        child?.stdin.end();
        if (child !== undefined && this.exit !== undefined) {
            const exited = await waitForExit(this.exit, this.options.shutdownTimeoutMs ?? DEFAULT_SHUTDOWN_TIMEOUT_MS);
            if (!exited) {
                child.kill('SIGTERM');
                if (!await waitForExit(this.exit, this.options.shutdownTimeoutMs ?? DEFAULT_SHUTDOWN_TIMEOUT_MS))
                    child.kill('SIGKILL');
            }
        }
    }
    async handleRequest(request) {
        const handler = this.requestHandler;
        const transport = this.transport;
        if (handler === undefined || transport === undefined) {
            transport?.reject(request.id, { code: -32601, message: `method not found: ${request.method}` });
            return;
        }
        try {
            const result = await handler(request.method, request.params);
            transport.respond(request.id, result === undefined ? {} : result);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            transport.reject(request.id, { code: -32603, message });
        }
    }
    appendStderr(chunk) {
        this.stderr = (this.stderr + chunk).slice(-STDERR_LIMIT);
    }
    async closeAfterFailedStart() {
        this.serverInfo = undefined;
        this.closed = false;
        await this.close();
    }
}
function onceSpawned(child) {
    return new Promise((resolve, reject) => {
        child.once('spawn', resolve);
        child.once('error', reject);
    });
}
function parseInitializeResult(value) {
    if (!isObject(value) || value.protocolVersion !== CORE_PROTOCOL_VERSION || !isObject(value.server)) {
        throw new Error('core returned an invalid initialize response');
    }
    if (typeof value.server.name !== 'string' || typeof value.server.version !== 'string') {
        throw new Error('core returned invalid server metadata');
    }
    return { name: value.server.name, version: value.server.version };
}
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
async function waitForExit(exit, timeoutMs) {
    let timer;
    const completed = await Promise.race([
        exit.then(() => true),
        new Promise(resolve => {
            timer = setTimeout(() => resolve(false), timeoutMs);
        }),
    ]);
    if (timer !== undefined)
        clearTimeout(timer);
    return completed;
}
