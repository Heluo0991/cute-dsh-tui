import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ensureProfile } from '../lib/types/profileManager.js'

const directory = mkdtempSync(join(tmpdir(), 'cute-dsh-tui-profile-'))

try {
  ensureProfile(directory)
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))
  assert.equal(manifest.dependencies?.['node-pty'], '1.1.0')
  assert.ok(manifest.pnpm?.onlyBuiltDependencies?.includes('node-pty'))
  assert.ok(manifest.pnpm?.ignoredBuiltDependencies?.includes('code-excerpt'))
  assert.ok(manifest.pnpm?.ignoredBuiltDependencies?.includes('signal-exit'))
  assert.ok(manifest.pnpm?.ignoredBuiltDependencies?.includes('@alcalzone/ansi-tokenize'))
  console.log('profile native-build policy verification passed')
} finally {
  rmSync(directory, { recursive: true, force: true })
}
