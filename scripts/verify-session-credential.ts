/**
 * Session-only credential lease regression.
 *
 * The lease must:
 *  - apply a key through a lazy provider and release to absent state;
 *  - restore a previously stored (source === 'file') value;
 *  - NOT restore an environment/project/user .env value as a managed file
 *    entry (unset lets the lower layer resolve again);
 *  - remain a no-op when nothing was applied.
 */
import { createSessionCredentialLease, type CredentialProviderLike } from '../src/sessionCredential.js'

let failed = 0
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`)
  if (!ok) failed++
}

class FakeProvider implements CredentialProviderLike {
  store = new Map<string, { value: string; source: string }>()
  calls: string[] = []
  async resolve(ref: string) {
    this.calls.push(`resolve:${ref}`)
    return this.store.get(ref)
  }
  async set(ref: string, value: string) {
    this.calls.push(`set:${ref}`)
    this.store.set(ref, { value, source: 'file' })
  }
  async unset(ref: string) {
    this.calls.push(`unset:${ref}`)
    this.store.delete(ref)
  }
}

// 1. absent -> session key -> absent.
{
  const provider = new FakeProvider()
  const lease = createSessionCredentialLease(() => provider)
  const ok = await lease.apply('  sk-session  ')
  check('apply trims and writes the session key', ok && provider.store.get('DEEPSEEK_API_KEY')?.value === 'sk-session')
  const released = await lease.release()
  check('release restores absent state', released && provider.store.size === 0)
  const noop = await lease.release()
  check('second release is a no-op', noop)
}

// 2. stored file credential survives a session-only lease.
{
  const provider = new FakeProvider()
  provider.store.set('DEEPSEEK_API_KEY', { value: 'sk-saved', source: 'file' })
  const lease = createSessionCredentialLease(() => provider)
  await lease.apply('sk-session')
  await lease.release()
  check('previous stored value is restored', provider.store.get('DEEPSEEK_API_KEY')?.value === 'sk-saved')
}

// 3. lower-precedence env value returns through unset, not a file write.
{
  const provider = new FakeProvider()
  provider.store.set('DEEPSEEK_API_KEY', { value: 'sk-project', source: 'project-env' })
  const lease = createSessionCredentialLease(() => provider)
  await lease.apply('sk-session')
  await lease.release()
  check('project-env fallback is not copied into the managed store', provider.store.size === 0)
}

// 4. missing provider fails closed and never pretends success.
{
  const lease = createSessionCredentialLease(() => undefined)
  check('apply without provider returns false', !(await lease.apply('sk-x')))
  check('release without provider is still a no-op success', await lease.release())
}

// 5. an empty key is rejected before touching the provider.
{
  const provider = new FakeProvider()
  const lease = createSessionCredentialLease(() => provider)
  check('blank key is rejected', !(await lease.apply('   ')) && provider.calls.length === 0)
}

process.exit(failed)
