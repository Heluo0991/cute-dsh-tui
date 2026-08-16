/**
 * Session-only credential lease over DSH's credential seam.
 *
 * dsh-credentials-local only exposes durable `set`/`unset` operations; there
 * is no ephemeral layer. `/login` without "save for later" therefore leases
 * the managed credential for the lifetime of this TUI process and restores
 * the previously resolved value on release. A normal exit releases the
 * lease; a hard kill may leave the lease behind, which is the closest
 * behavior the current provider can offer without a keychain backend.
 */
export interface CredentialProviderLike {
    resolve(ref: string): Promise<{
        value: string;
        source: string;
    } | undefined>;
    set(ref: string, value: string): Promise<void>;
    unset(ref: string): Promise<void>;
}
export interface SessionCredentialLease {
    /** Apply `key` for this session, remembering the prior stored value. */
    apply(key: string): Promise<boolean>;
    /** Restore the prior credential state; no-op when no lease is active. */
    release(): Promise<boolean>;
}
/**
 * Create a lease whose provider is resolved lazily for every operation.
 * During Cordis composition `ctx.get('credentials')` can be empty even
 * though the provider starts later in the same runtime; resolving at call
 * time keeps the first `/login` honest.
 */
export declare function createSessionCredentialLease(loadProvider: () => CredentialProviderLike | undefined, ref?: string): SessionCredentialLease;
//# sourceMappingURL=sessionCredential.d.ts.map