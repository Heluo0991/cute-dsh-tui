/**
 * Publish-shape regression: every package.json `exports` target and bin
 * target must exist in the actual npm tarball. This catches declarations
 * like `./src/*` whose source directory is absent from `files`.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
// WSL roots can be read-only while $HOME/.npm is still on that filesystem.
// A dry-run pack never needs a shared cache, so isolate it under tmpdir
// unless the caller explicitly configured one.
const npmCache = process.env.npm_config_cache ?? join(tmpdir(), 'cute-dsh-tui-npm-cache')
mkdirSync(npmCache, { recursive: true })
const stdout = execFileSync(npmCommand, ['pack', '--dry-run', '--json'], {
  encoding: 'utf8',
  env: { ...process.env, npm_config_cache: npmCache },
  maxBuffer: 16 * 1024 * 1024,
  // npm.cmd is a batch shim; Node's spawnSync cannot always execute .cmd
  // directly on Windows, so route it through the shell there.
  shell: process.platform === 'win32',
})
const [packed] = JSON.parse(stdout)
const files = new Set(packed.files.map(file => file.path))

let failed = 0
const check = (name, ok) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`)
  if (!ok) failed++
}

const collectTargets = (value, targets = []) => {
  if (typeof value === 'string') {
    targets.push(value)
  } else if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) collectTargets(child, targets)
  }
  return targets
}

for (const target of collectTargets(packageJson.exports)) {
  const path = target.replace(/^\.\//, '')
  if (path.includes('*')) {
    const prefix = path.slice(0, path.indexOf('*'))
    check(`wildcard export ${target} has packed files`, [...files].some(file => file.startsWith(prefix)))
  } else {
    check(`export ${target} is packed`, files.has(path))
  }
}

for (const target of Object.values(packageJson.bin ?? {})) {
  const path = target.replace(/^\.\//, '')
  check(`bin ${target} is packed`, files.has(path))
}

const patch = packageJson.dsh?.bundle?.patch
if (patch !== undefined) {
  check(`dsh bundle patch ${patch} is packed`, files.has(patch.replace(/^\.\//, '')))
}

console.log(`checked ${files.size} packed files`)
process.exit(failed)
