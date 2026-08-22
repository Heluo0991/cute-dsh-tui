export interface ProcessInvocation {
    command: string;
    args: string[];
}
/** Invoke the user's locally-installed DSH runtime by its JS entry so no
 *  shell shim is needed on any platform. */
export declare function bundledDshInvocation(args: readonly string[]): ProcessInvocation;
/** Invoke the user's pnpm by its JavaScript entry so Windows never needs
 *  `shell: true`. */
export declare function bundledPnpmInvocation(args: readonly string[]): ProcessInvocation;
export declare function profileDirectory(dshHome: string, profile: string): string;
/** Create exactly the profile scaffold DSH's plugin command would create. */
export declare function ensureProfile(profileDir: string): void;
/** The profile uses pnpm's hoisted linker, so this covers both a prebuilt
 * platform module and Linux's node-gyp output. */
export declare function profileHasNativePty(profileDir: string): boolean;
/**
 * Reconcile bundle layers after a pnpm mutation. This mirrors DSH's public
 * `plugin` subcommand while avoiding its Windows shell invocation.
 */
export declare function reconcileProfileBundles(profileDir: string): void;
/** Run one pnpm profile mutation without invoking a shell on any platform. */
export declare function runBundledPnpm(profileDir: string, args: readonly string[]): number;
/** Async counterpart used by in-TUI plugin management after unmounting. */
export declare function runBundledPnpmAsync(profileDir: string, args: readonly string[]): Promise<number>;
/** The directory holding the resolved DSH runtime entry, useful for
 *  diagnostics. */
export declare function bundledRuntimeDirectory(): string;
//# sourceMappingURL=profileManager.d.ts.map