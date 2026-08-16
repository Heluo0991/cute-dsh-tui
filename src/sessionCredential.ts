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

const DEEPSEEK_KEY_REF = 'DEEPSEEK_API_KEY'

export interface CredentialProviderLike {
  resolve(ref: string): Promise<{ value: string; source: string } | undefined>
  set(ref: string, value: string): Promise<void>
  unset(ref: string): Promise<void>
}

interface PreviousCredential {
  kind: 'stored'
  value: string
  source: string
}

export interface SessionCredentialLease {
  /** Apply `key` for this session, remembering the prior stored value. */
  apply(key: string): Promise<boolean>
  /** Restore the prior credential state; no-op when no lease is active. */
  release(): Promise<boolean>
}

/**
 * Create a lease whose provider is resolved lazily for every operation.
 * During Cordis composition `ctx.get('credentials')` can be empty even
 * though the provider starts later in the same runtime; resolving at call
 * time keeps the first `/login` honest.
 */
export function createSessionCredentialLease(
  loadProvider: () => CredentialProviderLike | undefined,
  ref: string = DEEPSEEK_KEY_REF,
): SessionCredentialLease {
  let previous: PreviousCredential | undefined
  let active = false

  return {
    async apply(key: string): Promise<boolean> {
      const trimmed = key.trim()
      if (trimmed === '') return false
      const provider = loadProvider()
      if (provider === undefined) return false
      if (active) await this.release()
      const current = await provider.resolve(ref)
      await provider.set(ref, trimmed)
      previous =
        current === undefined || current.source === 'env'
          ? undefined
          : { kind: 'stored', value: current.value, source: current.source }
      active = true
      return true
    },
    async release(): Promise<boolean> {
      if (!active) return true
      const provider = loadProvider()
      if (provider === undefined) return false
      if (previous?.kind === 'stored' && previous.source === 'file') {
        await provider.set(ref, previous.value)
      } else {
        // The lease replaced an absent, environment, or project/user .env
        // value. Unsetting the managed entry lets those lower-precedence
        // sources resolve again; an absent prior state stays absent.
        await provider.unset(ref)
      }
      previous = undefined
      active = false
      return true
    },
  }
}
