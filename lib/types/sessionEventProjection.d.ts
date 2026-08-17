import type { JsonValue } from './core-protocol.js';
export type ProjectedLineKind = 'user' | 'assistant' | 'reasoning' | 'tool' | 'status' | 'system';
export interface ProjectedLine {
    readonly key: string;
    readonly kind: ProjectedLineKind;
    readonly text: string;
    readonly seq: number;
    readonly time: number;
}
export interface SessionEventProjectorOptions {
    readonly limit?: number;
}
/**
 * Bounded client-side projection of raw DSH session-event envelopes. This
 * module is intentionally free of DSH and React imports: the TUI side of the
 * v2 split can consume JSON-RPC frames and replay/append events without
 * depending on core packages.
 */
export declare class SessionEventProjector {
    private lines;
    private readonly limit;
    private statusSeq;
    constructor(options?: SessionEventProjectorOptions);
    push(event: JsonValue): void;
    pushStatus(sessionId: JsonValue | undefined, status: JsonValue | undefined): void;
    snapshot(): readonly ProjectedLine[];
    clear(): void;
    private addLine;
    private upsert;
    private append;
    private update;
}
//# sourceMappingURL=sessionEventProjection.d.ts.map