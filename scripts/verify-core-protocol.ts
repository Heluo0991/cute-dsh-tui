import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'
import {
  CoreProtocolClosedError,
  CoreProtocolResponseError,
  CoreProtocolTimeoutError,
  CoreProtocolTransport,
} from '../src/core-protocol.js'

function pair(): [CoreProtocolTransport, CoreProtocolTransport] {
  const leftToRight = new PassThrough()
  const rightToLeft = new PassThrough()
  const left = new CoreProtocolTransport(rightToLeft, leftToRight)
  const right = new CoreProtocolTransport(leftToRight, rightToLeft)
  left.start()
  right.start()
  return [left, right]
}

{
  const [client, server] = pair()
  server.onRequest(request => {
    assert.equal(request.method, 'initialize')
    server.respond(request.id, { protocolVersion: 1, server: 'test-core' })
  })
  assert.deepEqual(await client.request('initialize', { protocolVersion: 1 }), {
    protocolVersion: 1,
    server: 'test-core',
  })
  client.close()
  server.close()
}

{
  const [client, server] = pair()
  server.onRequest(request => server.reject(request.id, { code: 42, message: 'expected refusal', data: { retry: false } }))
  await assert.rejects(
    client.request('session/prompt', { text: 'hello' }),
    error => error instanceof CoreProtocolResponseError && error.code === 42 && error.data?.retry === false,
  )
  client.close()
  server.close()
}

{
  const [client, server] = pair()
  server.onRequest(() => {})
  await assert.rejects(client.request('never-answers', undefined, 1), CoreProtocolTimeoutError)
  client.close()
  server.close()
}

{
  const [client, server] = pair()
  server.onRequest(() => {})
  const waiting = client.request('wait')
  client.close('test shutdown')
  await assert.rejects(waiting, CoreProtocolClosedError)
  server.close()
}

console.log('core protocol verification passed')
