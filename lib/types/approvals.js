/**
 * UI-side answerer for DSH's one-shot approval seam.  The harness calls the
 * composed `approval/request` waterfall while a tool turn is open; this store
 * keeps that promise pending while the terminal renders a small allow/reject
 * panel.  It intentionally offers no "allow always": DSH's contract is
 * one-shot approval only.
 */
/**
 * FIFO store for one-shot approval requests.  The current agent normally
 * blocks before it can issue another approval, but a queue keeps the UI safe
 * for concurrent delegated work as well.
 */
export class ApprovalStore {
    queue = [];
    active;
    listeners = new Set();
    nextId = 0;
    snapshot = null;
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    getSnapshot() {
        return this.snapshot;
    }
    /** Park a DSH request until the terminal user makes a one-shot decision. */
    ask(request) {
        // AbortSignal does not replay an already-fired abort event to a listener
        // added later. Treat an already-cancelled call as closed rather than
        // leaving its harness waterfall unresolved.
        if (request.signal?.aborted)
            return Promise.resolve('cancelled');
        return new Promise(resolve => {
            const pending = {
                request,
                id: ++this.nextId,
                resolve,
                onAbort: () => this.withdraw(pending, 'cancelled'),
            };
            request.signal?.addEventListener('abort', pending.onAbort, { once: true });
            this.queue.push(pending);
            this.startNext();
        });
    }
    allowCurrent() {
        this.settleActive('allowed-once');
    }
    rejectCurrent() {
        this.settleActive('rejected');
    }
    cancelCurrent() {
        this.settleActive('cancelled');
    }
    /** Close every outstanding request while the TUI tears down. */
    cancelAll() {
        const active = this.active;
        this.active = undefined;
        if (active !== undefined)
            this.finish(active, 'cancelled');
        for (const pending of this.queue.splice(0))
            this.finish(pending, 'cancelled');
        this.rebuildSnapshot();
        this.emit();
    }
    settleActive(outcome) {
        const pending = this.active;
        if (pending === undefined)
            return;
        this.active = undefined;
        this.finish(pending, outcome);
        this.startNext();
    }
    withdraw(pending, outcome) {
        if (this.active === pending) {
            this.active = undefined;
            this.finish(pending, outcome);
            this.startNext();
            return;
        }
        const index = this.queue.indexOf(pending);
        if (index < 0)
            return;
        this.queue.splice(index, 1);
        this.finish(pending, outcome);
        this.rebuildSnapshot();
        this.emit();
    }
    startNext() {
        if (this.active === undefined)
            this.active = this.queue.shift();
        this.rebuildSnapshot();
        this.emit();
    }
    finish(pending, outcome) {
        pending.request.signal?.removeEventListener('abort', pending.onAbort);
        pending.resolve(outcome);
    }
    rebuildSnapshot() {
        const pending = this.active;
        this.snapshot = pending === undefined ? null : {
            key: String(pending.id),
            toolName: pending.request.toolName,
            ...(pending.request.reason === undefined ? {} : { reason: pending.request.reason }),
            ...(pending.request.callId === undefined ? {} : { callId: String(pending.request.callId) }),
            queued: this.queue.length,
        };
    }
    emit() {
        for (const listener of this.listeners)
            listener();
    }
}
