import React, { useEffect, useState } from 'react'
import { Box, Text, render, useApp, useInput } from './ui.js'
import { CoreClient, type CoreLaunchSpec } from './core-client.js'
import { SessionEventProjector, type ProjectedLine } from './sessionEventProjection.js'
import type { JsonObject, JsonValue } from './core-protocol.js'

export interface ExperimentalProjectionOptions {
  readonly launch: CoreLaunchSpec
  readonly cwd?: string
  readonly sessionId?: string
  readonly provider?: string
  readonly model?: string
  readonly limit?: number
}

/**
 * Experimental read-only v2 projection. It owns only the TUI/client side:
 * launch the explicit core process, open a session, replay its durable events,
 * and project live session/event notifications as bounded text rows.
 */
export async function runExperimentalProjection(options: ExperimentalProjectionOptions): Promise<void> {
  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    throw new Error('experimental v2 projection requires an interactive terminal (stdout and stdin must be TTYs)')
  }

  const client = new CoreClient(options.launch)
  try {
    await client.start()
    const params: JsonObject = { cwd: options.cwd ?? process.cwd() }
    if (options.sessionId !== undefined) params.sessionId = options.sessionId
    if (options.provider !== undefined) params.provider = options.provider
    if (options.model !== undefined) params.model = options.model
    const opened = await client.request('session/open', params)
    const events = readEvents(opened)
    const projector = new SessionEventProjector({ limit: options.limit })
    for (const event of events) projector.push(event)

    const instance = await render(
      <ProjectionApp client={client} projector={projector} />,
      { exitOnCtrlC: true },
    )
    await instance.waitUntilExit()
    await client.close()
  } catch (error) {
    await client.close()
    throw error
  }
}

function ProjectionApp({
  client,
  projector,
}: {
  client: CoreClient
  projector: SessionEventProjector
}) {
  const { exit } = useApp()
  const [lines, setLines] = useState<readonly ProjectedLine[]>(() => projector.snapshot())

  useInput(input => {
    if (input === 'q' || input === 'Q') exit()
  })

  useEffect(() => {
    return client.onNotification((method, params) => {
      if (method === 'session/event' && isObject(params)) {
        const event = isObject(params.event) ? params.event : undefined
        if (event !== undefined) {
          projector.push(event)
          // Avoid a React update per streaming token; the final
          // assistant/message or tool/result renders the accumulated row.
          if (event.type !== 'assistant/chunk') setLines(projector.snapshot())
        }
        return
      }
      if (method === 'session/status' && isObject(params)) {
        projector.pushStatus(params.sessionId, params.status)
        setLines(projector.snapshot())
      }
    })
  }, [client, projector])

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>experimental v2 read-only session projection</Text>
      <Box flexDirection="column" marginTop={1}>
        {lines.map(line => (
          <Text key={line.key} wrap="wrap">{line.text}</Text>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press q to quit — read-only, no prompts are sent</Text>
      </Box>
    </Box>
  )
}

function readEvents(value: JsonValue | undefined): JsonValue[] {
  if (!isObject(value)) return []
  return Array.isArray(value.events) ? value.events : []
}

function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
