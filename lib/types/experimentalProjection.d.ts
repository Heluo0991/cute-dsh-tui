import { type CoreLaunchSpec } from './core-client.js';
export interface ExperimentalProjectionOptions {
    readonly launch: CoreLaunchSpec;
    readonly cwd?: string;
    readonly sessionId?: string;
    readonly provider?: string;
    readonly model?: string;
    readonly limit?: number;
}
/**
 * Experimental read-only v2 projection. It owns only the TUI/client side:
 * launch the explicit core process, open a session, replay its durable events,
 * and project live session/event notifications as bounded text rows.
 */
export declare function runExperimentalProjection(options: ExperimentalProjectionOptions): Promise<void>;
//# sourceMappingURL=experimentalProjection.d.ts.map