import React from 'react'
import { Box, Text, useTerminalSize } from '../../ui.js'
import { stringWidth } from '../../ink/stringWidth.js'
import { useAnimationFrame } from '../../ink/hooks/use-animation-frame.js'
import type { ToolCallView, ToolFileDiff, ToolResultView, ToolRow } from '../../channel.js'
import { ToolUseLoader } from '../ToolUseLoader.js'
import { formatDuration } from '../../cc/format.js'

type Props = {
  tool: ToolRow
  /** Adds the top margin between messages (CC: addMargin). */
  addMargin: boolean
  /** Ctrl+O verbose: show full args/result instead of previews. */
  verbose: boolean
  /** Message-selection mode highlight. */
  isSelected?: boolean
  /** Row expanded on its own (persistent hover-grey background, CC). */
  isExpanded?: boolean
}

/** Tool display names: DSH emits lowercase tool ids (`bash`); Claude Code
 *  shows capitalized names (`Bash`). Map the common ones, fall back to the
 *  id with its first letter uppercased. */
function displayName(name: string): string {
  const KNOWN: Record<string, string> = {
    bash: 'Bash',
    powershell: 'PowerShell',
    read: 'Read',
    glob: 'Glob',
    grep: 'Grep',
    write: 'Write',
    edit: 'Edit',
    todo_write: 'TodoWrite',
    subagent: 'Task',
    web_search: 'WebSearch',
  }
  const mapped = KNOWN[name]
  if (mapped) return mapped
  if (name.length === 0) return name
  return name[0]!.toUpperCase() + name.slice(1)
}

// --- structured body lines --------------------------------------------------
// The tool's presentation view (dsh-tools presentCall/presentResult, captured
// by the channel) becomes per-line render intents here. CC convention: the
// body hangs under a `  ⎿  ` gutter (first line) / blank continuation, so
// tool output is visually nested under its header instead of flush-left.

type BodyTone = 'add' | 'del' | 'dim' | 'plain' | 'error'
type BodyLine = { readonly text: string; readonly tone: BodyTone }

/** CC's collapsed text body keeps 3 lines (renderTruncatedContent). */
const TEXT_BODY_MAX_LINES = 3
/** Diff bodies cap at the upstream chat row's 8 (dsh-client-ui-tool's
 *  CHAT_DIFF_MAX_LINES) — denser information than log output. */
const DIFF_BODY_MAX_LINES = 8

const GUTTER_FIRST = '  ⎿  '
const GUTTER_REST = '     '

const add = (text: string): BodyLine => ({ text, tone: 'add' })
const del = (text: string): BodyLine => ({ text, tone: 'del' })
const dim = (text: string): BodyLine => ({ text, tone: 'dim' })
const plain = (text: string): BodyLine => ({ text, tone: 'plain' })

/** Text → display lines (upstream contentLines rule): empty text is zero
 *  lines; one trailing newline is a terminator, not a line; interior blank
 *  lines and per-line whitespace survive verbatim so multi-line code keeps
 *  its original shape. */
function contentTextLines(text: string): string[] {
  if (text === '') return []
  return (text.endsWith('\n') ? text.slice(0, -1) : text).split('\n')
}

/** One side's text → display lines; delegates to the shared newline rule. */
const sideLines = contentTextLines

/** Diff hunks → add/del rows with counts. Each hunk opens with a compact
 *  `+A/-D` stat row (upstream DiffBlock's footer, folded into the hunk so a
 *  multi-file card keeps its per-hunk attribution); larger hunks also get
 *  `+N lines` / `-N lines` markers before their lines. With several hunks a
 *  path row separates files and `⋯` separates scattered hunks of one file. */
function diffLines(diffs: readonly ToolFileDiff[]): BodyLine[] {
  const out: BodyLine[] = []
  let prevPath: string | undefined
  for (const diff of diffs) {
    if (diffs.length > 1) {
      if (diff.path !== prevPath) out.push(plain(diff.path))
      else out.push(dim('⋯'))
    }
    prevPath = diff.path
    const oldLines = diff.oldText === null ? [] : sideLines(diff.oldText)
    const newLines = sideLines(diff.newText)
    if (oldLines.length > 0 || newLines.length > 0) {
      const stats = oldLines.length > 0
        ? `+${newLines.length}/-${oldLines.length}`
        : `+${newLines.length}`
      out.push(dim(stats))
    }
    if (newLines.length > 1) out.push(add(`+${newLines.length} lines`))
    if (oldLines.length > 1) out.push(del(`-${oldLines.length} lines`))
    for (const line of oldLines) out.push(del(`- ${line}`))
    for (const line of newLines) out.push(add(`+ ${line}`))
  }
  return out
}

/** Join the text blocks of a view's content payload (read/generic cards). */
function contentLines(content: ReadonlyArray<{ readonly type: string; readonly text?: string }> | undefined): BodyLine[] {
  const text = (content ?? []).map(block => (block.type === 'text' ? block.text ?? '' : '')).join('')
  return contentTextLines(text).map(dim)
}

/** Per-card body lines; unknown/absent shapes yield [] so the caller falls
 *  back to the raw result text. */
function viewLines(view: ToolCallView | ToolResultView): BodyLine[] {
  switch (view.card) {
    case 'diff':
      return diffLines(view.diffs)
    case 'terminal': {
      // The call-side terminal card has no output yet; only presentResult's
      // does. `in` narrows the call/result union without extra types.
      const output = ('output' in view ? view.output : undefined) ?? ''
      const lines: BodyLine[] = contentTextLines(output).map(dim)
      if ('exitCode' in view && view.exitCode !== undefined && view.exitCode !== 0) {
        lines.push({ text: `Exit code ${view.exitCode}`, tone: 'error' })
      }
      if ('signal' in view && view.signal !== undefined) {
        lines.push({ text: `Killed by signal ${view.signal}`, tone: 'error' })
      }
      return lines
    }
    case 'read':
      return contentLines('content' in view ? view.content : undefined)
    case 'generic':
      return contentLines('content' in view ? view.content : undefined)
    case 'search': {
      if (view.shape === 'paths') {
        const lines = view.paths.map(plain)
        if (view.truncated) lines.push(dim(`… (${view.total} total)`))
        return lines
      }
      const lines: BodyLine[] = []
      for (const file of view.files) {
        lines.push(plain(file.path))
        for (const match of file.matches) {
          lines.push(dim(`${match.lineNumber}: ${match.line}`))
        }
      }
      if (view.truncated) lines.push(dim(`… (${view.total} total)`))
      return lines
    }
    default:
      return []
  }
}

/** Rendered height of a body: one row per logical line plus the visual rows
 *  produced by soft wrapping (CJK-safe width arithmetic). */
function visualLineCount(lines: BodyLine[], width: number): number {
  return lines.reduce(
    (total, line) =>
      total + Math.max(1, Math.ceil(stringWidth(line.text) / width)),
    0,
  )
}

/**
 * Collapsed bodies fold past the card's line budget; verbose (Ctrl+O) is
 * always uncapped. The budget counts the visual rows soft wrapping will
 * actually paint (not just logical `\n` lines), so an overlong single-line
 * code block still gets an explicit expand hint instead of silently filling
 * the transcript. Mirrors wrapText's "one extra line is shown directly".
 */
function capLines(
  lines: BodyLine[],
  max: number,
  verbose: boolean,
  columns: number,
): BodyLine[] {
  if (verbose || lines.length === 0) return lines
  // Gutter (5 cells) + the card's own horizontal chrome; never narrower
  // than a readable ten-cell sliver on tiny terminals.
  const bodyWidth = Math.max(10, columns - 7)
  if (visualLineCount(lines, bodyWidth) <= max) return lines
  // A block with few logical lines but huge soft-wrapped lines cannot be
  // cut further — keep its text and append the expand hint.
  if (lines.length <= max) {
    return [...lines, dim('… (ctrl+o to expand)')]
  }
  let shown = 0
  let usedRows = 0
  for (const line of lines) {
    const rows = Math.max(1, Math.ceil(stringWidth(line.text) / bodyWidth))
    if (shown > 0 && usedRows + rows > max) break
    shown += 1
    usedRows += rows
  }
  // One extra SHORT logical line is shown directly (wrapText's old rule);
  // a remaining soft-wrapped monster still gets folded behind the hint.
  if (
    lines.length - shown === 1 &&
    visualLineCount(lines.slice(shown), bodyWidth) === 1
  ) {
    return lines
  }
  return [
    ...lines.slice(0, shown),
    dim(`… +${lines.length - shown} lines (ctrl+o to expand)`),
  ]
}

/** Header title from the presentation view: terminal cards keep the
 *  `Name(command)` shape; everything else renders the tool's own title
 *  (`Edit /path`, `Read /path (1 - 100)`) with the first word bold. The
 *  result view's title replaces the call view's only when present — a
 *  settled terminal card carries output but no title of its own. */
function HeaderTitle({ name, title, isTerminal, displayArgs }: {
  name: string
  title: string | undefined
  isTerminal: boolean
  displayArgs: string
}): React.ReactNode {
  if (title === undefined) {
    return (
      <>
        <Box flexShrink={0}>
          <Text bold wrap="truncate-end">{name}</Text>
        </Box>
        {displayArgs !== '' && (
          <Box flexWrap="nowrap">
            <Text>({displayArgs})</Text>
          </Box>
        )}
      </>
    )
  }
  if (isTerminal) {
    return (
      <>
        <Box flexShrink={0}>
          <Text bold wrap="truncate-end">{name}</Text>
        </Box>
        <Box flexWrap="nowrap">
          <Text>({title})</Text>
        </Box>
      </>
    )
  }
  const trimmed = title.trim()
  if (trimmed === '') {
    return (
      <Box flexShrink={0}>
        <Text bold wrap="truncate-end">{name}</Text>
      </Box>
    )
  }
  const space = trimmed.indexOf(' ')
  const head = space === -1 ? trimmed : trimmed.slice(0, space)
  const tail = space === -1 ? '' : trimmed.slice(space)
  return (
    <Box flexWrap="nowrap">
      <Text bold wrap="truncate-end">
        {head}
        <Text bold={false}>{tail}</Text>
      </Text>
    </Box>
  )
}

/**
 * Tool-call card: `● Edit /path` header with a blinking status dot, then the
 * structured body under a `  ⎿  ` gutter — diff hunks in red/green, terminal
 * output, read content — instead of the raw result dump (ported from the
 * leak's `AssistantToolUseMessage.tsx` + the dsh-tools presentation views the
 * channel captures per call).
 */
export function AssistantToolUseMessage({
  tool,
  addMargin,
  verbose,
  isSelected = false,
  isExpanded = false,
}: Props): React.ReactNode {
  const { columns } = useTerminalSize()
  const isRunning = tool.status === 'running'
  const isError = tool.status === 'error'
  const displayArgs = verbose ? tool.argsFull ?? tool.argsText : tool.argsText
  const result = tool.resultFull ?? tool.resultText
  const name = displayName(tool.name)
  const minWidth = stringWidth(name) + 2
  // The settled view carries the applied diff / actual output; while running,
  // the call view already shows the pending change (CC's pending Edit diff).
  const view = tool.resultView ?? tool.callView
  // presentResult may omit a title (terminal results carry output, not a
  // command) — then the call view's title stands.
  const headerTitle = tool.resultView?.title ?? tool.callView?.title
  const headerIsTerminal = view?.card === 'terminal'

  // Live elapsed clock while the call runs (CC's bash elapsed timer): the
  // 1s tick re-renders the card; elapsed derives from wall-clock refs.
  const [viewportRef] = useAnimationFrame(isRunning ? 1000 : null)
  const elapsedMs = isRunning
    ? tool.startedAt !== undefined
      ? Date.now() - tool.startedAt
      : undefined
    : tool.durationMs
  const elapsedText = elapsedMs !== undefined ? ` · ${formatDuration(elapsedMs)}` : ''

  // Body lines: the structured view first, raw result text as the fallback
  // (tools without a presenter, or a folded row awaiting loadOlder).
  let body: BodyLine[] = []
  if (isError) {
    if (tool.errorText) body = [{ text: tool.errorText, tone: 'error' }]
  } else {
    if (view !== undefined) body = viewLines(view)
    if (body.length === 0 && result) {
      body = contentTextLines(result).map(dim)
    }
    if (isRunning && body.length === 0) {
      body = [dim(`Running… (${formatDuration(Math.max(0, Date.now() - (tool.startedAt ?? Date.now())))})`)]
    }
  }
  const cap = view?.card === 'diff' ? DIFF_BODY_MAX_LINES : TEXT_BODY_MAX_LINES
  const lines = capLines(body, cap, verbose, columns)

  return (
    <Box
      ref={viewportRef}
      flexDirection="row"
      justifyContent="space-between"
      marginTop={addMargin ? 1 : 0}
      width="100%"
      backgroundColor={
        isSelected
          ? 'messageActionsBackground'
          : isExpanded
            ? 'userMessageBackgroundHover'
            : undefined
      }
    >
      <Box flexDirection="column" flexGrow={1}>
        <Box flexDirection="row" flexWrap="nowrap" minWidth={minWidth}>
          <ToolUseLoader
            shouldAnimate={isRunning}
            isUnresolved={isRunning}
            isError={isError}
          />
          <HeaderTitle name={name} title={headerTitle} isTerminal={headerIsTerminal} displayArgs={displayArgs} />
          {!isRunning && (
            <Box flexWrap="nowrap">
              <Text dimColor>{elapsedText}</Text>
            </Box>
          )}
        </Box>
        {lines.map((line, index) => (
          <Box
            key={index}
            flexDirection="row"
            width="100%"
            backgroundColor={
              line.tone === 'add'
                ? 'diffAdded'
                : line.tone === 'del'
                  ? 'diffRemoved'
                  : undefined
            }
          >
            <Box width={5} flexShrink={0}>
              <Text dimColor>{index === 0 ? GUTTER_FIRST : GUTTER_REST}</Text>
            </Box>
            <Box flexGrow={1}>
              <Text
                color={
                  line.tone === 'add'
                    ? 'diffAddedWord'
                    : line.tone === 'del'
                      ? 'diffRemovedWord'
                      : line.tone === 'error'
                        ? 'error'
                        : undefined
                }
                dimColor={line.tone === 'dim'}
                wrap="wrap"
              >
                {line.text === '' ? ' ' : line.text}
              </Text>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
