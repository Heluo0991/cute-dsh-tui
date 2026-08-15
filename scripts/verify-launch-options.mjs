import assert from 'node:assert/strict'
import { applyLaunchEnvironment, parseLaunchArgs } from '../bin/launch-options.js'

const lastSession = 'last-session-123'
const parse = args => parseLaunchArgs(args, { readLastSession: () => lastSession })

{
  const result = parse(['--resume'])
  assert.deepEqual(result.dshArgs, [])
  assert.equal(result.environment.DSH_CC_OPEN_RESUME_PICKER, '1')
  assert.equal(result.environment.DSH_CC_RESUME_SESSION, undefined)
}

{
  const result = parse(['--resume', 'session-abc', '--patch', 'extra.yml'])
  assert.deepEqual(result.dshArgs, ['--patch', 'extra.yml'])
  assert.equal(result.environment.DSH_CC_RESUME_SESSION, 'session-abc')
  assert.equal(result.environment.DSH_CC_OPEN_RESUME_PICKER, undefined)
}

{
  const result = parse(['--resume', '--last'])
  assert.equal(result.environment.DSH_CC_RESUME_SESSION, lastSession)
  assert.equal(result.environment.DSH_CC_OPEN_RESUME_PICKER, undefined)
}

{
  const result = parse(['-c'])
  assert.equal(result.environment.DSH_CC_RESUME_SESSION, lastSession)
}

{
  const result = parse(['--resume', '--all'])
  assert.match(result.error ?? '', /intentionally unsupported/)
  assert.deepEqual(result.dshArgs, [])
}

{
  const result = parse(['--yolo', '--dump-config'])
  assert.deepEqual(result.dshArgs, ['--dump-config'])
  assert.equal(result.environment.DSH_PERMISSION_MODE, 'danger-full-access')
  assert.equal(result.environment.DSH_CC_YOLO, '1')
}

{
  const target = {
    DSH_CC_RESUME_SESSION: 'stale-session',
    DSH_CC_OPEN_RESUME_PICKER: '1',
  }
  applyLaunchEnvironment(parse(['--resume', 'exact-session']).environment, target)
  assert.equal(target.DSH_CC_RESUME_SESSION, 'exact-session')
  assert.equal('DSH_CC_OPEN_RESUME_PICKER' in target, false)
}

console.log('launch option verification passed')
