/**
 * i18n regression for UI source (not vendored ink): blocks the hardcoded
 * user-visible strings and shortcut actions that were migrated to `t()`, and
 * blocks the two raw notification call shapes that must always use i18n.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const sources = [
  'src/screens',
  'src/components',
  'src/channel.ts',
  'src/plugin.ts',
]
const forbidden = [
  'Approval required',
  'No matching commands',
  'Search history',
  'Toggle thinking mode',
  'Reasoning depth · step 2 of 2',
  'Enable full access?',
  'Pick a message to rewind',
  'Injected context',
  'shift+tab to cycle effort',
  'Permission switch failed 路',
  'channel.notify(\'',
  'state.notify(\'',
]

const files = sources.flatMap(rel => {
  const path = join(root, rel)
  if (path.endsWith('.ts')) return [path]
  // Directories are intentionally shallow (the checked source folders are
  // not nested).
  return []
})
for (const dir of ['src/screens', 'src/components']) {
  const { readdirSync } = await import('node:fs')
  for (const name of readdirSync(join(root, dir))) {
    if (!name.endsWith('.tsx') && !name.endsWith('.ts')) continue
    files.push(join(root, dir, name))
  }
}

let failed = 0
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  for (const needle of forbidden) {
    if (!text.includes(needle)) continue
    console.log(`FAIL: ${file.replace(root, '')} contains ${JSON.stringify(needle)}`)
    failed++
  }
}
const actionLiteral = /<KeyboardShortcutHint[^>]*\saction="[A-Za-z][^"]*"/
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  if (actionLiteral.test(text)) {
    const match = text.match(actionLiteral)?.[0] ?? ''
    console.log(`FAIL: ${file.replace(root, '')} has unlocalized shortcut action: ${match}`)
    failed++
  }
}

if (failed > 0) {
  console.log(`\n${failed} i18n regression(s) found`)
  process.exit(1)
}
console.log('i18n regression verification passed')
