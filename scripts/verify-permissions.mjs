import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ApprovalStore } from '../lib/types/approvals.js'
import { LOCAL_COMMANDS } from '../lib/types/commands.js'

const request = (toolName, options = {}) => ({
  agent: { id: 'verify-agent' },
  toolName,
  ...options,
})

// The approval seam must present one request at a time, preserve order, and
// settle harness promises on every user/teardown path.
{
  const store = new ApprovalStore()
  const snapshots = []
  const unsubscribe = store.subscribe(() => snapshots.push(store.getSnapshot()))
  const first = store.ask(request('fs/write', { reason: 'write a file', callId: 'call-1' }))
  const second = store.ask(request('bash', { reason: 'run a command', callId: 'call-2' }))

  assert.deepEqual(store.getSnapshot(), {
    key: '1', toolName: 'fs/write', reason: 'write a file', callId: 'call-1', queued: 1,
  })
  store.allowCurrent()
  assert.equal(await first, 'allowed-once')
  assert.deepEqual(store.getSnapshot(), {
    key: '2', toolName: 'bash', reason: 'run a command', callId: 'call-2', queued: 0,
  })
  store.rejectCurrent()
  assert.equal(await second, 'rejected')
  assert.equal(store.getSnapshot(), null)
  assert.ok(snapshots.length >= 3)
  unsubscribe()
}

{
  const store = new ApprovalStore()
  const controller = new AbortController()
  const pending = store.ask(request('bash', { signal: controller.signal }))
  controller.abort()
  assert.equal(await pending, 'cancelled')
  assert.equal(store.getSnapshot(), null)
  assert.equal(await store.ask(request('fs/read', { signal: controller.signal })), 'cancelled')
}

{
  const store = new ApprovalStore()
  const active = store.ask(request('bash'))
  const queued = store.ask(request('fs/write'))
  store.cancelAll()
  assert.deepEqual(await Promise.all([active, queued]), ['cancelled', 'cancelled'])
}

const names = new Set(LOCAL_COMMANDS.map(command => command.name))
assert.equal(names.has('permission'), true)
assert.equal(names.has('permissions'), true)
for (const removed of ['vim', 'connect', 'hooks', 'memory']) {
  assert.equal(names.has(removed), false, `${removed} must not remain a local placeholder`)
}

const patch = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
assert.match(patch, /workspace-write/)
assert.match(patch, /DSH_CC_YOLO === '1'/)
assert.doesNotMatch(patch, /process\.platform === 'win32'/)

console.log('permission and approval verification passed')
