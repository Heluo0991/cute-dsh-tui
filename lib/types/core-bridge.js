import { randomUUID } from 'node:crypto';
import { SessionId } from '@deepseek-ai/dsh-session';
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import Schema from '@deepseek-ai/schemastery';
import { CORE_PROTOCOL_VERSION, CoreProtocolTransport, } from './core-protocol.js';
export const name = 'cute-dsh-tui-core-bridge';
export const inject = ['agents'];
export const Config = Schema.object({
    provider: Schema.string().required(false),
    model: Schema.string().required(false),
});
/**
 * DSH-facing half of the v2 split. It owns one active harness Agent and
 * exposes its durable session events through stdout-only JSON-RPC. The TUI
 * client owns all rendering and must never import this module.
 */
export async function apply(ctx, config) {
    const transport = config.transport ?? new CoreProtocolTransport(process.stdin, process.stdout);
    let active;
    let closing = false;
    const closeActive = async () => {
        const session = active;
        active = undefined;
        if (session !== undefined)
            await session.handle.dispose();
    };
    const close = async () => {
        if (closing)
            return;
        closing = true;
        transport.close('core bridge is shutting down');
        await closeActive();
    };
    ctx.on('session/event', (session, event) => {
        if (session !== active?.agent.session)
            return;
        transport.notify('session/event', {
            sessionId: session.header.id,
            event: event,
        });
    });
    ctx.on('agent/status', ({ agent, status }) => {
        if (agent !== active?.agent)
            return;
        transport.notify('session/status', { sessionId: agent.session.id, status });
    });
    ctx.on('agent/disposed', ({ agent }) => {
        if (agent !== active?.agent)
            return;
        transport.notify('session/status', { sessionId: agent.session.id, status: 'disposed' });
    });
    transport.onRequest(async (request) => {
        if (request.method === 'initialize') {
            const params = objectParams(request.params);
            const version = params.protocolVersion;
            if (version !== CORE_PROTOCOL_VERSION) {
                transport.reject(request.id, {
                    code: -32001,
                    message: `unsupported core protocol version: ${String(version)}`,
                    data: { supportedProtocolVersion: CORE_PROTOCOL_VERSION },
                });
                return;
            }
            transport.respond(request.id, {
                protocolVersion: CORE_PROTOCOL_VERSION,
                server: { name: 'cute-dsh-tui-core-bridge', version: '0.1.0' },
            });
            return;
        }
        if (request.method === 'session/open') {
            const params = objectParams(request.params);
            const cwd = requiredString(params, 'cwd');
            const requestedSessionId = optionalString(params, 'sessionId');
            const provider = optionalString(params, 'provider') ?? config.provider;
            const model = optionalString(params, 'model') ?? config.model;
            await closeActive();
            active = await openAgent(ctx, { cwd, requestedSessionId, provider, model });
            transport.respond(request.id, {
                sessionId: active.agent.session.id,
                status: active.agent.status,
                events: active.agent.session.events,
            });
            return;
        }
        if (request.method === 'session/prompt') {
            const session = requireActive(active);
            const params = objectParams(request.params);
            requireSession(params, session.agent.session.id);
            const text = requiredString(params, 'text');
            if (text.trim() === '')
                throw new Error('session/prompt text must not be empty');
            const message = createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } });
            session.agent.followup(message);
            transport.respond(request.id, { messageId: message.id });
            return;
        }
        if (request.method === 'session/cancel') {
            const session = requireActive(active);
            requireSession(objectParams(request.params), session.agent.session.id);
            session.agent.cancel({ kind: 'user' }, { keepInbox: true });
            transport.respond(request.id, {});
            return;
        }
        if (request.method === 'shutdown') {
            transport.respond(request.id, {});
            await close();
            void ctx.root.fiber.dispose();
            return;
        }
        transport.reject(request.id, { code: -32601, message: `method not found: ${request.method}` });
    });
    transport.start();
    ctx.effect(() => () => close());
}
async function openAgent(ctx, options) {
    const agentOptions = {
        ...options.provider === undefined ? {} : { provider: options.provider },
        ...options.model === undefined ? {} : { model: options.model },
    };
    if (options.requestedSessionId !== undefined) {
        const handle = await ctx.agents.resume({
            resumeSessionId: SessionId(options.requestedSessionId),
            agentOptions,
        });
        return { agent: handle.agent, handle };
    }
    const handle = await ctx.agents.create({
        sessionId: SessionId(randomUUID()),
        meta: { cwd: options.cwd },
        agentOptions,
    });
    return { agent: handle.agent, handle };
}
function objectParams(value) {
    if (value === undefined)
        return {};
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        throw new Error('request params must be an object');
    return value;
}
function requiredString(params, key) {
    const value = params[key];
    if (typeof value !== 'string' || value === '')
        throw new Error(`${key} must be a non-empty string`);
    return value;
}
function optionalString(params, key) {
    const value = params[key];
    if (value === undefined)
        return undefined;
    if (typeof value !== 'string' || value === '')
        throw new Error(`${key} must be a non-empty string when provided`);
    return value;
}
function requireActive(active) {
    if (active === undefined)
        throw new Error('no session is open');
    return active;
}
function requireSession(params, id) {
    if (requiredString(params, 'sessionId') !== id)
        throw new Error('the requested session is not active');
}
