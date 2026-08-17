import type { CoreClient } from './core-client.js';
import type { JsonValue } from './core-protocol.js';
import type { SessionEventProjector } from './sessionEventProjection.js';
export type NotificationRecord = {
    readonly method: string;
    readonly params: JsonValue | undefined;
};
export interface NotificationBuffer {
    drain(): NotificationRecord[];
    subscribe(listener: () => void): () => void;
    close(): void;
}
/**
 * Install a CoreClient notification listener before an operation such as
 * `session/open`, so notifications emitted while the request is in flight are
 * buffered instead of lost. The TUI can drain the buffer after the response is
 * processed and then subscribe for live updates.
 */
export declare function createNotificationBuffer(client: CoreClient): NotificationBuffer;
/**
 * Apply buffered notifications to a projector. When `initialSeqs` is provided,
 * session events already present in the `session/open` response snapshot are
 * skipped to avoid duplicate projection rows.
 */
export declare function processNotificationRecords(projector: SessionEventProjector, records: readonly NotificationRecord[], initialSeqs?: ReadonlySet<number>): boolean;
//# sourceMappingURL=experimentalNotificationBuffer.d.ts.map