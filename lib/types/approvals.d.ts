/**
 * UI-side answerer for DSH's one-shot approval seam.  The harness calls the
 * composed `approval/request` waterfall while a tool turn is open; this store
 * keeps that promise pending while the terminal renders a small allow/reject
 * panel.  It intentionally offers no "allow always": DSH's contract is
 * one-shot approval only.
 */
import type { ApprovalOutcome, ApprovalRequest } from '@deepseek-ai/dsh-user-approval';
/** Stable data rendered by the approval panel. */
export interface ApprovalSnapshot {
    readonly key: string;
    readonly toolName: string;
    readonly reason?: string;
    readonly callId?: string;
    /** Number of later approvals waiting behind this one. */
    readonly queued: number;
}
/**
 * FIFO store for one-shot approval requests.  The current agent normally
 * blocks before it can issue another approval, but a queue keeps the UI safe
 * for concurrent delegated work as well.
 */
export declare class ApprovalStore {
    private readonly queue;
    private active;
    private readonly listeners;
    private nextId;
    private snapshot;
    subscribe(listener: () => void): () => void;
    getSnapshot(): ApprovalSnapshot | null;
    /** Park a DSH request until the terminal user makes a one-shot decision. */
    ask(request: ApprovalRequest): Promise<ApprovalOutcome>;
    allowCurrent(): void;
    rejectCurrent(): void;
    cancelCurrent(): void;
    /** Close every outstanding request while the TUI tears down. */
    cancelAll(): void;
    private settleActive;
    private withdraw;
    private startNext;
    private finish;
    private rebuildSnapshot;
    private emit;
}
//# sourceMappingURL=approvals.d.ts.map