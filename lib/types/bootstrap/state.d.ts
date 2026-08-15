/**
 * Interaction-time telemetry stubs consumed by the ported Ink core
 * (ink/ink.tsx, ink/components/App.tsx, ink/components/ScrollBox.tsx). The
 * original functions fed Claude Code's session-activity tracking; cute-dsh-tui
 * does not track interaction time.
 */
/** No-op interaction-time flush stub; cute-dsh-tui does not track interaction time. */
export declare function flushInteractionTime(): void;
/** No-op interaction-time update stub; cute-dsh-tui does not track interaction time. */
export declare function updateLastInteractionTime(): void;
/** No-op scroll-activity stub; cute-dsh-tui does not track interaction time. */
export declare function markScrollActivity(): void;
//# sourceMappingURL=state.d.ts.map