/**
 * Install a CoreClient notification listener before an operation such as
 * `session/open`, so notifications emitted while the request is in flight are
 * buffered instead of lost. The TUI can drain the buffer after the response is
 * processed and then subscribe for live updates.
 */
export function createNotificationBuffer(client) {
    const pending = [];
    const listeners = new Set();
    const unsubscribe = client.onNotification((method, params) => {
        pending.push({ method, params });
        for (const listener of listeners)
            listener();
    });
    return {
        drain() {
            return pending.splice(0);
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        close() {
            unsubscribe();
            listeners.clear();
        },
    };
}
/**
 * Apply buffered notifications to a projector. When `initialSeqs` is provided,
 * session events already present in the `session/open` response snapshot are
 * skipped to avoid duplicate projection rows.
 */
export function processNotificationRecords(projector, records, initialSeqs) {
    let changed = false;
    for (const record of records) {
        if (record.method === 'session/event' && isObject(record.params)) {
            const event = isObject(record.params.event) ? record.params.event : undefined;
            if (event === undefined)
                continue;
            const seq = typeof event.seq === 'number' ? event.seq : undefined;
            if (seq !== undefined && initialSeqs?.has(seq))
                continue;
            projector.push(event);
            // Avoid a React update per streaming token; the final
            // assistant/message or tool/result renders the accumulated row.
            if (event.type !== 'assistant/chunk')
                changed = true;
            continue;
        }
        if (record.method === 'session/status' && isObject(record.params)) {
            const params = record.params;
            projector.pushStatus(params.sessionId, params.status);
            changed = true;
        }
    }
    return changed;
}
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
