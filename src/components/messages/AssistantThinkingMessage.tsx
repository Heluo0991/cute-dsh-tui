import React from 'react'
import { Box, Text, useAnimationFrame } from '../../ui.js'
import { t } from '../../i18n.js'
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js'
import { Markdown } from '../Markdown.js'
import { formatDuration } from '../../cc/format.js'

type Props = {
  thinking: string
  /** Adds the top margin between messages (CC: addMargin). */
  addMargin: boolean
  /** True when Ctrl+O transcript/verbose mode is on — show the full text. */
  verbose: boolean
  /** Thinking wall-clock duration once the reasoning block settled (ms). */
  durationMs?: number
  /** True only while the model is emitting reasoning deltas. */
  streaming?: boolean
  /** Message-selection mode highlight. */
  isSelected?: boolean
  onClick?(): void
}

/**
 * Thinking block: folded `∴ Thinking (ctrl+o to expand)`, expanded shows the
 * full reasoning text indented under `∴ Thinking…` (ported from the leak's
 * `messages/AssistantThinkingMessage.tsx`). When the channel records the
 * reasoning duration, the label carries it (`∴ Thinking · 12s …`) — cute-dsh-tui's
 * take on making thinking time visible in the transcript.
 */
export function AssistantThinkingMessage({
  thinking,
  addMargin,
  verbose,
  durationMs,
  streaming = false,
  isSelected = false,
  onClick,
}: Props): React.ReactNode {
  const [animationRef, time] = useAnimationFrame(streaming ? 120 : null)
  if (!thinking && !streaming) return null

  const frame = ['·', '•', '●', '•'][Math.floor(time / 120) % 4]

  const duration =
    durationMs !== undefined && durationMs >= 1000
      ? ` · ${formatDuration(durationMs)}`
      : ''

  if (!verbose) {
    return (
      <Box
        ref={animationRef}
        marginTop={addMargin ? 1 : 0}
        backgroundColor={isSelected ? 'messageActionsBackground' : undefined}
        onClick={onClick}
      >
        <Text dimColor italic>
          {streaming ? <Text color="claude">{frame} {t('thinking-label')}</Text> : `∴ ${t('thinking-label')}`}{duration}{' '}
          <Text dimColor>
            <KeyboardShortcutHint shortcut="ctrl+o" action={t('action-expand')} parens />
          </Text>
        </Text>
      </Box>
    )
  }

  return (
    <Box
      ref={animationRef}
      flexDirection="column"
      gap={1}
      marginTop={addMargin ? 1 : 0}
      width="100%"
      backgroundColor={isSelected ? 'messageActionsBackground' : undefined}
      onClick={onClick}
    >
      <Text dimColor italic>
        {streaming ? <Text color="claude">{frame} {t('thinking-label')}</Text> : `∴ ${t('thinking-label')}`}{duration}…
      </Text>
      <Box paddingLeft={2}>
        <Markdown dimColor>{thinking}</Markdown>
      </Box>
    </Box>
  )
}
