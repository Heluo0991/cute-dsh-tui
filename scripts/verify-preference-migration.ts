import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { migrateLegacyPreferences } from '../src/preferences.js'

const root = mkdtempSync(join(tmpdir(), 'cute-dsh-tui-prefs-'))
const legacy = join(root, '.dsh-cc')
const preferences = join(root, '.cute-dsh-tui')

try {
  mkdirSync(join(legacy, 'themes'), { recursive: true })
  writeFileSync(join(legacy, 'theme.json'), '{"theme":"dark"}')
  writeFileSync(join(legacy, 'model.json'), '{"provider":"deepseek","model":"v4"}')
  writeFileSync(join(legacy, 'history.jsonl'), '{"text":"hello"}\n')
  writeFileSync(join(legacy, 'resume.txt'), 'resume-id')
  writeFileSync(join(legacy, 'themes', 'night.json'), '{"base":"dark"}')
  mkdirSync(join(legacy, 'sessions'))
  writeFileSync(join(legacy, 'sessions', 'must-not-copy.jsonl'), '{}')

  assert.equal(migrateLegacyPreferences({ legacyDir: legacy, preferencesDir: preferences }), true)
  assert.equal(readFileSync(join(preferences, 'resume.txt'), 'utf8'), 'resume-id')
  assert.equal(existsSync(join(preferences, 'themes', 'night.json')), true)
  assert.equal(existsSync(join(preferences, 'sessions')), false)

  writeFileSync(join(preferences, 'theme.json'), '{"theme":"light"}')
  assert.equal(migrateLegacyPreferences({ legacyDir: legacy, preferencesDir: preferences }), false)
  assert.equal(readFileSync(join(preferences, 'theme.json'), 'utf8'), '{"theme":"light"}')
} finally {
  rmSync(root, { recursive: true, force: true })
}

console.log('preference migration verification passed')
