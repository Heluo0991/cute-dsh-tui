import React, { useEffect, useRef, useState } from 'react'
import { Box, Text, render, useApp, useInput } from './ui.js'
import { CoreClient, type CoreLaunchSpec } from './core-client.js'
import { SessionEventProjector, type ProjectedLine } from './sessionEventProjection.js'
import {
  createNotificationBuffer,
  processNotificationRecords,
  type NotificationBuffer,
} from './experimentalNotificationBuffer.js'
import {
  ExperimentalCoreClient,
  type ApprovalRequestParams,
  type SessionSnapshot,
  type UserQuestionParams,
} from './experimentalCoreClient.js'
import { ApprovalPanel } from './components/ApprovalPanel.js'
import { AskUserQuestionPanel } from './components/questions/AskUserQuestionPanel.js'
import { Pane } from './components/design-system/Pane.js'
import { Select } from './components/Select.js'
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
 * Experimental interactive v2 projection. It owns only the TUI/client side:
 * launch the explicit core process, open a session, replay its durable events,
 * project live session/event notifications as bounded text rows, and send
 * prompts / cancellations / approvals / questions / session actions through
 * the typed experimental client facade.
 *
 * The client notification listener is installed before `session/open` so any
 * event emitted by the core while the session is being opened is buffered and
 * replayed after the open response arrives.
 */
export async function runExperimentalProjection(options: ExperimentalProjectionOptions): Promise<void> {
  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    throw new Error('experimental v2 projection requires an interactive terminal (stdout and stdin must be TTYs)')
  }

  const coreClient = new CoreClient(options.launch)
  const client = new ExperimentalCoreClient(coreClient, options.cwd ?? process.cwd())
  const buffer = createNotificationBuffer(coreClient)
  try {
    await client.start()
    const opened = await client.open({
      sessionId: options.sessionId,
      provider: options.provider,
      model: options.model,
    })
    const projector = new SessionEventProjector({ limit: options.limit })
    applySnapshot(projector, opened)
    // Replay anything the core emitted while session/open was in flight.
    processNotificationRecords(projector, buffer.drain(), initialSeqs(opened.events))

    const instance = await render(
      <ExperimentalApp client={client} projector={projector} buffer={buffer} />,
      { exitOnCtrlC: false },
    )
    await instance.waitUntilExit()
    buffer.close()
    await client.close()
  } catch (error) {
    buffer.close()
    await client.close()
    throw error
  }
}

interface PickerItem {
  readonly value: string
  readonly label: string
  readonly description?: string
}

interface PickerState {
  readonly title: string
  readonly items: readonly PickerItem[]
  readonly focus: number
  readonly onSelect: (value: string) => void | Promise<void>
}

interface QuestionItem {
  readonly id: string
  readonly question: string
  readonly header?: string
  readonly detail?: string
  readonly options?: ReadonlyArray<{ readonly label: string; readonly description?: string }>
  readonly multiSelect?: boolean
}

interface QuestionModal {
  readonly items: readonly QuestionItem[]
  readonly index: number
  readonly answers: Array<{ readonly id: string; readonly selected: string[]; readonly custom?: string }>
}

function ExperimentalApp({
  client,
  projector,
  buffer,
}: {
  client: ExperimentalCoreClient
  projector: SessionEventProjector
  buffer: NotificationBuffer
}) {
  const { exit } = useApp()
  const [lines, setLines] = useState<readonly ProjectedLine[]>(() => projector.snapshot())
  const [input, setInput] = useState('')
  const [cursor, setCursor] = useState(0)
  const [notice, setNotice] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [approval, setApproval] = useState<ApprovalRequestParams | null>(null)
  const [question, setQuestion] = useState<QuestionModal | null>(null)
  const [picker, setPicker] = useState<PickerState | null>(null)

  const approvalResolverRef = useRef<((outcome: 'allowed-once' | 'rejected' | 'cancelled' | 'unavailable') => void) | null>(null)
  const questionResolverRef = useRef<((answer: JsonValue) => void) | null>(null)
  const questionRejectRef = useRef<((error: unknown) => void) | null>(null)

  useEffect(() => {
    const unsubApproval = client.onApprovalRequest(params => {
      return new Promise<'allowed-once' | 'rejected' | 'cancelled' | 'unavailable'>(resolve => {
        approvalResolverRef.current = resolve
        setApproval(params)
      })
    })
    const unsubQuestion = client.onUserQuestion(params => {
      return new Promise<JsonValue>((resolve, reject) => {
        const items = parseQuestions(params.questions)
        if (items.length === 0) {
          reject(new Error('user-question request contained no questions'))
          return
        }
        questionResolverRef.current = resolve
        questionRejectRef.current = reject
        setQuestion({
          items,
          index: 0,
          answers: [],
        })
      })
    })
    return () => {
      unsubApproval()
      unsubQuestion()
    }
  }, [client])

  useEffect(() => {
    const processPending = (): void => {
      const records = buffer.drain()
      if (records.length === 0) return
      if (processNotificationRecords(projector, records)) {
        setLines(projector.snapshot())
      }
    }
    processPending()
    return buffer.subscribe(processPending)
  }, [buffer, projector])

  const applySnapshot = (snapshot: SessionSnapshot): void => {
    projector.clear()
    for (const event of snapshot.events) projector.push(event)
    processNotificationRecords(projector, buffer.drain(), initialSeqs(snapshot.events))
    setLines(projector.snapshot())
    setNotice(`session ${snapshot.sessionId} (${snapshot.status})`)
  }

  const errorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error)

  const submitApproval = (outcome: 'allowed-once' | 'rejected' | 'cancelled' | 'unavailable'): void => {
    approvalResolverRef.current?.(outcome)
    approvalResolverRef.current = null
    setApproval(null)
  }

  const cancelQuestion = (): void => {
    questionRejectRef.current?.(new Error('ask_user_question was interrupted before the user answered'))
    questionRejectRef.current = null
    questionResolverRef.current = null
    setQuestion(null)
  }

  const answerQuestion = (selection: { selected: string[]; custom?: string }): void => {
    if (question === null) return
    const current = question.items[question.index]
    if (current === undefined) return
    const answers = [
      ...question.answers,
      {
        id: current.id,
        selected: [...selection.selected],
        ...(selection.custom !== undefined && selection.custom !== '' ? { custom: selection.custom } : {}),
      },
    ]
    if (question.index + 1 >= question.items.length) {
      questionResolverRef.current?.({ answers })
      questionResolverRef.current = null
      questionRejectRef.current = null
      setQuestion(null)
      return
    }
    setQuestion({
      ...question,
      index: question.index + 1,
      answers,
    })
  }

  const runCommand = async (raw: string): Promise<void> => {
    const parts = raw.slice(1).trim().split(/\s+/).filter(Boolean)
    const name = parts[0]?.toLowerCase() ?? ''
    const args = parts.slice(1)
    setBusy(true)
    try {
      switch (name) {
        case 'help':
          setNotice('Commands: /new /resume [id] /list /rewind <seq> /model /preset /permission /cancel /quit')
          break
        case 'new': {
          const snapshot = await client.newSession()
          applySnapshot(snapshot)
          break
        }
        case 'resume': {
          if (args[0] !== undefined) {
            const snapshot = await client.resume(args[0])
            applySnapshot(snapshot)
          } else {
            const sessions = await client.listSessions()
            setPicker({
              title: 'Resume session',
              items: sessions.map(session => ({
                value: session.id,
                label: session.id,
                description: session.cwd ?? undefined,
              })),
              focus: 0,
              onSelect: async sessionId => {
                const snapshot = await client.resume(sessionId)
                applySnapshot(snapshot)
              },
            })
          }
          break
        }
        case 'list': {
          const sessions = await client.listSessions()
          setNotice(sessions.length === 0 ? 'No sessions found' : sessions.map(session => session.id).join('\n'))
          break
        }
        case 'rewind': {
          const seq = Number(args[0])
          if (!Number.isFinite(seq)) {
            setNotice('Usage: /rewind <seq>')
            break
          }
          const snapshot = await client.rewind(seq)
          if (snapshot === null) setNotice('Cannot rewind to that point')
          else applySnapshot(snapshot)
          break
        }
        case 'model': {
          const models = await client.listModels()
          setPicker({
            title: 'Switch model',
            items: models.map(model => ({
              value: `${model.provider}/${model.model}`,
              label: `${model.provider}/${model.model}`,
            })),
            focus: 0,
            onSelect: async value => {
              const [provider, model] = splitModel(value)
              const snapshot = await client.switchModel(provider, model)
              if (snapshot !== null) applySnapshot(snapshot)
            },
          })
          break
        }
        case 'preset': {
          const presets = await client.listPresets()
          setPicker({
            title: 'Switch agent preset',
            items: presets.map(preset => ({
              value: preset.id,
              label: preset.name ?? preset.id,
              description: preset.description ?? preset.broken,
            })),
            focus: 0,
            onSelect: async presetId => {
              const ok = await client.switchPreset(presetId)
              setNotice(ok ? 'Agent preset switched' : 'Agent preset switch failed')
            },
          })
          break
        }
        case 'permission': {
          const permissions = await client.listPermissions()
          setPicker({
            title: 'Switch permission preset',
            items: permissions.map(permission => ({
              value: permission.id,
              label: permission.name,
              description: permission.description,
            })),
            focus: 0,
            onSelect: async permissionId => {
              const ok = await client.switchPermission(permissionId)
              setNotice(ok ? 'Permission preset switched' : 'Permission preset switch failed')
            },
          })
          break
        }
        case 'cancel':
          await client.cancel()
          setNotice('Cancellation sent')
          break
        case 'quit':
        case 'exit':
          exit()
          break
        default:
          setNotice(`Unknown command: /${name}`)
      }
    } catch (error) {
      setNotice(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const submitInput = async (): Promise<void> => {
    const text = input.trim()
    if (text === '' || busy) return
    setInput('')
    setCursor(0)
    if (text.startsWith('/')) {
      await runCommand(text)
      return
    }
    setBusy(true)
    try {
      await client.prompt(text)
      setNotice('Prompt sent')
    } catch (error) {
      setNotice(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const runPickerSelect = (): void => {
    if (picker === null) return
    const item = picker.items[picker.focus]
    if (item === undefined) return
    let action: void | Promise<void>
    try {
      action = picker.onSelect(item.value)
    } catch (error) {
      setNotice(errorMessage(error))
      return
    }
    setPicker(null)
    setBusy(true)
    Promise.resolve(action)
      .catch(error => setNotice(errorMessage(error)))
      .finally(() => setBusy(false))
  }

  const insertText = (text: string): void => {
    setInput(value => value.slice(0, cursor) + text + value.slice(cursor))
    setCursor(position => position + text.length)
  }

  useInput((inputText, key) => {
    if (key.ctrl && (inputText === 'c' || inputText === 'q')) {
      if (approval !== null) {
        submitApproval('cancelled')
      } else if (question !== null) {
        cancelQuestion()
      } else if (picker !== null) {
        setPicker(null)
      } else if (input !== '') {
        setInput('')
        setCursor(0)
      } else {
        exit()
      }
      return
    }

    if (approval !== null) {
      if (key.return || inputText === 'a' || inputText === 'y' || inputText === 'Y') {
        submitApproval('allowed-once')
      } else if (inputText === 'd' || inputText === 'D' || inputText === 'n' || inputText === 'N') {
        submitApproval('rejected')
      } else if (key.escape) {
        submitApproval('cancelled')
      }
      return
    }

    if (question !== null) {
      // AskUserQuestionPanel owns keyboard input while a question is open.
      return
    }

    if (picker !== null) {
      if (key.upArrow) {
        setPicker(state => state === null ? state : { ...state, focus: Math.max(0, state.focus - 1) })
      } else if (key.downArrow) {
        setPicker(state => state === null ? state : { ...state, focus: Math.min(state.items.length - 1, state.focus + 1) })
      } else if (key.return) {
        runPickerSelect()
      } else if (key.escape) {
        setPicker(null)
      }
      return
    }

    if (key.return) {
      void submitInput()
      return
    }
    if (key.backspace) {
      if (cursor > 0) {
        setInput(value => value.slice(0, cursor - 1) + value.slice(cursor))
        setCursor(position => position - 1)
      }
      return
    }
    if (key.delete) {
      if (cursor < input.length) {
        setInput(value => value.slice(0, cursor) + value.slice(cursor + 1))
      }
      return
    }
    if (key.leftArrow) {
      setCursor(position => Math.max(0, position - 1))
      return
    }
    if (key.rightArrow) {
      setCursor(position => Math.min(input.length, position + 1))
      return
    }
    if (key.home) {
      setCursor(0)
      return
    }
    if (key.end) {
      setCursor(input.length)
      return
    }
    if (key.escape) {
      if (input !== '') {
        setInput('')
        setCursor(0)
      }
      return
    }
    if (!key.ctrl && !key.meta && inputText) {
      insertText(inputText)
    }
  })

  const currentQuestion = question?.items[question.index]

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>experimental v2 interactive session projection</Text>
      <Box flexDirection="column" marginTop={1}>
        {lines.map(line => (
          <Text key={line.key} wrap="wrap">{line.text}</Text>
        ))}
      </Box>

      {approval !== null && (
        <Box marginTop={1}>
          <ApprovalPanel approval={{
            key: approval.callId ?? approval.toolName,
            toolName: approval.toolName,
            reason: approval.reason,
            callId: approval.callId,
            queued: 0,
          }} />
        </Box>
      )}

      {question !== null && currentQuestion !== undefined && (
        <Box key={`${question.index}-${currentQuestion.id}`} marginTop={1}>
          <AskUserQuestionPanel
            question={{
              question: currentQuestion.question,
              header: currentQuestion.header,
              detail: currentQuestion.detail,
              options: currentQuestion.options,
              multiSelect: currentQuestion.multiSelect,
            }}
            position={question.index + 1}
            total={question.items.length}
            answered={question.answers.length}
            onAnswer={answerQuestion}
            onCancel={cancelQuestion}
          />
        </Box>
      )}

      {picker !== null && (
        <Box marginTop={1}>
          <Pane color="permission">
            <Box flexDirection="column">
              <Box marginBottom={1}>
                <Text color="remember" bold>{picker.title}</Text>
              </Box>
              <Select
                options={picker.items.map(item => ({
                  value: item.value,
                  label: item.label,
                  description: item.description,
                }))}
                focusIndex={picker.focus}
                selectedValue={undefined}
              />
              <Box marginTop={1}>
                <Text dimColor>Enter to select · Esc to cancel</Text>
              </Box>
            </Box>
          </Pane>
        </Box>
      )}

      {notice !== undefined && (
        <Box marginTop={1}>
          <Text dimColor wrap="wrap">{notice}</Text>
        </Box>
      )}

      <Box marginTop={1} flexDirection="row">
        <Text bold>{busy ? '… ' : '> '}</Text>
        <Text>{input.slice(0, cursor)}</Text>
        <Text inverse>{input[cursor] ?? ' '}</Text>
        <Text>{input.slice(cursor + 1)}</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Enter send · /help for commands · Ctrl+C quit</Text>
      </Box>
    </Box>
  )
}

function applySnapshot(projector: SessionEventProjector, snapshot: SessionSnapshot): void {
  projector.clear()
  for (const event of snapshot.events) projector.push(event)
}

function initialSeqs(events: readonly JsonValue[]): Set<number> {
  const seqs = new Set<number>()
  for (const event of events) {
    if (isObject(event) && typeof event.seq === 'number') seqs.add(event.seq)
  }
  return seqs
}

function parseQuestions(value: JsonValue): QuestionItem[] {
  if (!Array.isArray(value)) return []
  const items: QuestionItem[] = []
  for (const raw of value) {
    const item = isObject(raw) ? raw : undefined
    if (item === undefined) continue
    const id = typeof item.id === 'string' ? item.id : ''
    const question = typeof item.question === 'string' ? item.question : ''
    if (id === '' || question === '') continue
    const options = Array.isArray(item.options)
      ? item.options
        .map(option => {
          if (!isObject(option)) return undefined
          const label = typeof option.label === 'string' ? option.label : ''
          if (label === '') return undefined
          return {
            label,
            ...(typeof option.description === 'string' ? { description: option.description } : {}),
          }
        })
        .filter((option): option is { label: string; description?: string } => option !== undefined)
      : undefined
    items.push({
      id,
      question,
      ...(typeof item.header === 'string' ? { header: item.header } : {}),
      ...(typeof item.detail === 'string' ? { detail: item.detail } : {}),
      ...(options !== undefined && options.length > 0 ? { options } : {}),
      ...(item.multiSelect === true ? { multiSelect: true } : {}),
    })
  }
  return items
}

function splitModel(value: string): [string, string] {
  const index = value.indexOf('/')
  if (index === -1) return [value, value]
  return [value.slice(0, index), value.slice(index + 1)]
}

function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
