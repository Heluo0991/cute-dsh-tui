import assert from 'node:assert/strict'
import { existsSync, lstatSync, mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { linkProfileDependency } from '../lib/types/profileManager.js'

const directory = mkdtempSync(join(tmpdir(), 'cute-dsh-tui-profile-link-'))

try {
  const profileDir = join(directory, 'profile')
  const target = join(directory, 'development-package')
  mkdirSync(target, { recursive: true })
  writeFileSync(join(target, 'package.json'), '{"name":"@heluo0991/cute-dsh-tui"}\n', 'utf8')
  const packageDir = join(profileDir, 'node_modules', '@heluo0991', 'cute-dsh-tui')
  mkdirSync(join(profileDir, 'node_modules', '@heluo0991'), { recursive: true })
  // An existing link, never an installed directory, is safe for the helper to replace.
  const badTarget = join(directory, 'wrong-development-package')
  mkdirSync(badTarget, { recursive: true })
  symlinkSync(badTarget, packageDir, process.platform === 'win32' ? 'junction' : 'dir')
  linkProfileDependency(profileDir, '@heluo0991/cute-dsh-tui', target)
  assert.ok(existsSync(packageDir))
  assert.ok(lstatSync(packageDir).isSymbolicLink())
  assert.equal(realpathSync(packageDir), realpathSync(target))
  console.log('profile development link verification passed')
} finally {
  rmSync(directory, { recursive: true, force: true })
}
