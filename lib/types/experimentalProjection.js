import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Box, Text, render, useApp, useInput } from './ui.js';
import { CoreClient } from './core-client.js';
import { SessionEventProjector } from './sessionEventProjection.js';
/**
 * Experimental read-only v2 projection. It owns only the TUI/client side:
 * launch the explicit core process, open a session, replay its durable events,
 * and project live session/event notifications as bounded text rows.
 */
export async function runExperimentalProjection(options) {
    if (!process.stdout.isTTY || !process.stdin.isTTY) {
        throw new Error('experimental v2 projection requires an interactive terminal (stdout and stdin must be TTYs)');
    }
    const client = new CoreClient(options.launch);
    try {
        await client.start();
        const params = { cwd: options.cwd ?? process.cwd() };
        if (options.sessionId !== undefined)
            params.sessionId = options.sessionId;
        if (options.provider !== undefined)
            params.provider = options.provider;
        if (options.model !== undefined)
            params.model = options.model;
        const opened = await client.request('session/open', params);
        const events = readEvents(opened);
        const projector = new SessionEventProjector({ limit: options.limit });
        for (const event of events)
            projector.push(event);
        const instance = await render(_jsx(ProjectionApp, { client: client, projector: projector }), { exitOnCtrlC: true });
        await instance.waitUntilExit();
        await client.close();
    }
    catch (error) {
        await client.close();
        throw error;
    }
}
function ProjectionApp({ client, projector, }) {
    const { exit } = useApp();
    const [lines, setLines] = useState(() => projector.snapshot());
    useInput(input => {
        if (input === 'q' || input === 'Q')
            exit();
    });
    useEffect(() => {
        return client.onNotification((method, params) => {
            if (method === 'session/event' && isObject(params)) {
                const event = isObject(params.event) ? params.event : undefined;
                if (event !== undefined) {
                    projector.push(event);
                    // Avoid a React update per streaming token; the final
                    // assistant/message or tool/result renders the accumulated row.
                    if (event.type !== 'assistant/chunk')
                        setLines(projector.snapshot());
                }
                return;
            }
            if (method === 'session/status' && isObject(params)) {
                projector.pushStatus(params.sessionId, params.status);
                setLines(projector.snapshot());
            }
        });
    }, [client, projector]);
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { bold: true, children: "experimental v2 read-only session projection" }), _jsx(Box, { flexDirection: "column", marginTop: 1, children: lines.map(line => (_jsx(Text, { wrap: "wrap", children: line.text }, line.key))) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "Press q to quit \u2014 read-only, no prompts are sent" }) })] }));
}
function readEvents(value) {
    if (!isObject(value))
        return [];
    return Array.isArray(value.events) ? value.events : [];
}
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
