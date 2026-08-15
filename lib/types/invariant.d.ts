/**
 * Package-owned invariant companion for `@heluo0991/cute-dsh-tui`.
 *
 * The vendored Ink core under `src/ink` is third-party code written against
 * looser compiler flags; the relaxed `tsconfig` options exist only for that
 * subtree and must not spread to new code.
 * @module @heluo0991/cute-dsh-tui/invariant
 */
import type { Context } from '@deepseek-ai/cordis';
/** Cordis companion plugin name. */
export declare const name = "cute-dsh-tui-invariant";
/** Service required before the companion can reserve package ownership. */
export declare const inject: string[];
/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export declare const apply: (ctx: Context) => Promise<() => void>;
//# sourceMappingURL=invariant.d.ts.map