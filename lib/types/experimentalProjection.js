import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Box, Text, render, useApp, useInput } from './ui.js';
import { CoreClient } from './core-client.js';
import { SessionEventProjector } from './sessionEventProjection.js';
import { createNotificationBuffer, processNotificationRecords, } from './experimentalNotificationBuffer.js';
/**
 * Experimental read-only v2 projection. It owns only the TUI/client side:
 * launch the explicit core process, open a session, replay its durable events,
 * and project live session/event notifications as bounded text rows.
 *
 * The client notification listener is installed before `session/open` so any
 * event emitted by the core while the session is being opened is buffered and
 * replayed after the open response arrives.
 */
export async function runExperimentalProjection(options) {
    if (!process.stdout.isTTY || !process.stdin.isTTY) {
        throw new Error('experimental v2 projection requires an interactive terminal (stdout and stdin must be TTYs)');
    }
    const client = new CoreClient(options.launch);
    const buffer = createNotificationBuffer(client);
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
        const initialSeqs = new Set();
        for (const event of events) {
            projector.push(event);
            const seq = isObject(event) && typeof event.seq === 'number' ? event.seq : undefined;
            if (seq !== undefined)
                initialSeqs.add(seq);
        }
        // Replay anything the core emitted while session/open was in flight.
        processNotificationRecords(projector, buffer.drain(), initialSeqs);
        const instance = await render(_jsx(ProjectionApp, { projector: projector, buffer: buffer }), { exitOnCtrlC: true });
        await instance.waitUntilExit();
        buffer.close();
        await client.close();
    }
    catch (error) {
        buffer.close();
        await client.close();
        throw error;
    }
}
function ProjectionApp({ projector, buffer, }) {
    const { exit } = useApp();
    const [lines, setLines] = useState(() => projector.snapshot());
    useInput(input => {
        if (input === 'q' || input === 'Q')
            exit();
    });
    useEffect(() => {
        const processPending = () => {
            const records = buffer.drain();
            if (records.length === 0)
                return;
            if (processNotificationRecords(projector, records)) {
                setLines(projector.snapshot());
            }
        };
        processPending();
        return buffer.subscribe(processPending);
    }, [buffer, projector]);
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
