export interface ProcessInvocation {
    command: string;
    args: string[];
}
/** Resolve the packaged DSH executable instead of looking up the user's `dsh`. */
export declare function bundledDshInvocation(args: readonly string[]): ProcessInvocation;
/** Resolve pnpm's JavaScript entry point so Windows never needs `shell: true`. */
export declare function bundledPnpmInvocation(args: readonly string[]): ProcessInvocation;
export declare function profileDirectory(dshHome: string, profile: string): string;
/** Create exactly the profile scaffold DSH's plugin command would create. */
export declare function ensureProfile(profileDir: string): void;
/**
 * Reconcile bundle layers after a pnpm mutation. This mirrors DSH's public
 * `plugin` subcommand while avoiding its Windows shell invocation.
 */
export declare function reconcileProfileBundles(profileDir: string): void;
/** Run one pnpm profile mutation without invoking a shell on any platform. */
export declare function runBundledPnpm(profileDir: string, args: readonly string[]): number;
/** Async counterpart used by in-TUI plugin management after unmounting. */
export declare function runBundledPnpmAsync(profileDir: string, args: readonly string[]): Promise<number>;
/** The directory holding a resolved package script, useful for diagnostics. */
export declare function bundledRuntimeDirectory(): string;
//# sourceMappingURL=profileManager.d.ts.map