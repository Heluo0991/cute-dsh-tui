import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { CoreClient } from '../src/core-client.js'
import { bundledDshInvocation, linkProfileDependency, profileDirectory, reconcileProfileBundles, runBundledPnpm } from '../src/profileManager.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const temporaryRoot = mkdtempSync(join(tmpdir(), 'cute-dsh-tui-core-bridge-'))
const dshHome = join(temporaryRoot, 'dsh-home')
const profile = 'cute-dsh-tui'
const profileDir = profileDirectory(dshHome, profile)
let client: CoreClient | undefined

try {
  const installCode = runBundledPnpm(profileDir, ['add', `link:${pathToFileURL(root).pathname}`])
  assert.equal(installCode, 0, 'the temporary profile must install the working tree')
  linkProfileDependency(profileDir, '@heluo0991/cute-dsh-tui', root)
  reconcileProfileBundles(profileDir)
  const profileRequire = createRequire(join(profileDir, 'package.json'))
  assert.ok(
    existsSync(profileRequire.resolve('@heluo0991/cute-dsh-tui/package.json')),
    'the DSH profile resolver must resolve the linked working tree',
  )

  const invocation = bundledDshInvocation([
    '--profile',
    profile,
    '--patch',
    join(root, 'core-bridge.patch.yml'),
  ])
  client = new CoreClient({
    command: invocation.command,
    args: invocation.args,
    cwd: root,
    env: { ...process.env, DSH_HOME: dshHome },
  }, { handshakeTimeoutMs: 30_000 })
  const server = await client.start()
  assert.equal(server.name, 'cute-dsh-tui-core-bridge')
  const opened = await client.request('session/open', { cwd: root }) as { sessionId?: unknown; status?: unknown; events?: unknown }
  assert.equal(typeof opened.sessionId, 'string')
  assert.equal(opened.status, 'idle')
  assert.ok(Array.isArray(opened.events))
  await client.close()
  client = undefined
  console.log('real DSH core bridge verification passed')
} catch (error) {
  const manifest = existsSync(join(profileDir, 'package.json'))
    ? readFileSync(join(profileDir, 'package.json'), 'utf8')
    : '(profile manifest was not created)'
  const packageScope = join(profileDir, 'node_modules', '@heluo0991')
  const links = existsSync(packageScope)
    ? readdirSync(packageScope).map(name => {
      const path = join(packageScope, name)
      try {
        return `${name} -> ${readlinkSync(path)}`
      } catch {
        return name
      }
    }).join(', ')
    : '(package scope was not created)'
  process.stderr.write(`core bridge profile diagnostics:\n${manifest}\nnode_modules/@heluo0991: ${links}\n`)
  throw error
} finally {
  await client?.close()
  rmSync(temporaryRoot, { recursive: true, force: true })
}
