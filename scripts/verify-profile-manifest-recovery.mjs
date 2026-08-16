/**
 * Profile bootstrap recovery regression: a profile package.json that no
 * longer parses must be backed up (never deleted), then rebuilt to the
 * default scaffold so `cdsh` can self-heal instead of dying with a JSON
 * stack trace.
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ensureProfile } from '../lib/types/profileManager.js'

const directory = mkdtempSync(join(tmpdir(), 'cute-dsh-tui-corrupt-profile-'))

try {
  writeFileSync(join(directory, 'package.json'), '{ definitely not json', 'utf8')
  ensureProfile(directory)

  const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))
  assert.equal(manifest.dependencies?.['node-pty'], '1.1.0')
  assert.ok(manifest.pnpm?.onlyBuiltDependencies?.includes('node-pty'))
  assert.ok(manifest.pnpm?.ignoredBuiltDependencies?.includes('code-excerpt'))

  const backups = readdirSync(directory).filter(name => name.startsWith('package.json.corrupt-'))
  assert.equal(backups.length, 1, 'the corrupt manifest must be preserved exactly once')
  const backup = readFileSync(join(directory, backups[0]), 'utf8')
  assert.equal(backup, '{ definitely not json')

  assert.ok(readFileSync(join(directory, 'cordis.patch.yml'), 'utf8').includes('patch layer'))
  assert.ok(readFileSync(join(directory, 'pnpm-workspace.yaml'), 'utf8').includes('nodeLinker: hoisted'))
  console.log('profile manifest recovery verification passed')
} finally {
  rmSync(directory, { recursive: true, force: true })
}
