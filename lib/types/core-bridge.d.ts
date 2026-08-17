import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
import { CoreProtocolTransport } from './core-protocol.js';
export declare const name = "cute-dsh-tui-core-bridge";
export declare const inject: string[];
/** Deployment-selected defaults for sessions opened by the v2 bridge. */
export interface CoreBridgeConfig {
    provider?: string;
    model?: string;
}
/** Runtime-only transport injection for bridge regressions; production uses stdio. */
export interface CoreBridgeRuntimeConfig extends CoreBridgeConfig {
    transport?: CoreProtocolTransport;
}
export declare const Config: Schema<CoreBridgeConfig>;
/**
 * DSH-facing half of the v2 split. It owns one active harness Agent and
 * exposes its durable session events through stdout-only JSON-RPC. The TUI
 * client owns all rendering and must never import this module.
 */
export declare function apply(ctx: Context, config: CoreBridgeRuntimeConfig): Promise<void>;
//# sourceMappingURL=core-bridge.d.ts.map