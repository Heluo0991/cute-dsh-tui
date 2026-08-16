import React from 'react'
import { Box, ScrollBox, Text, type ScrollBoxHandle } from '../ui.js'
import { t } from '../i18n.js'
import type { BtwThread } from '../channel.js'
import { Pane } from './design-system/Pane.js'
import { MessageList } from './MessageList.js'

/**
 * A child session is a real conversation, not a condensed activity log. Keep
 * the main message renderer here so Markdown, thinking blocks, and tool cards
 * retain the same fidelity as the parent transcript.
 */
export function BtwPane({
  thread,
  draft,
  expanded,
}: {
  thread: BtwThread
  draft: string
  expanded: boolean
}): React.ReactNode {
  const [handle, setHandle] = React.useState<ScrollBoxHandle | null>(null)
  const [expandedRows, setExpandedRows] = React.useState<ReadonlySet<number>>(() => new Set())
  const toggleRow = React.useCallback((rowId: number) => {
    setExpandedRows(previous => {
      const next = new Set(previous)
      if (next.has(rowId)) next.delete(rowId)
      else next.add(rowId)
      return next
    })
  }, [])

  return (
    <Box flexDirection="column" flexGrow={1} width="100%">
      <Pane color="permission">
        <Text color="remember" bold>{t('btw-pane-title')}</Text>
        <Text dimColor>  {t('btw-pane-hint')}</Text>
      </Pane>
      <ScrollBox ref={setHandle} flexDirection="column" flexGrow={1} flexShrink={1} stickyScroll>
        <MessageList
          rows={thread.rows}
          expanded={expanded}
          expandedRows={expandedRows}
          selectedId={null}
          onToggleRow={toggleRow}
          model="DeepSeek"
          showAll
          onToggleAll={() => {}}
          scrollHandle={handle}
        />
        {thread.working && <Text color="remember">{t('btw-working')}</Text>}
      </ScrollBox>
      <Box borderStyle="round" borderColor="permission" paddingX={1} flexShrink={0}>
        <Text color="permission">❯ </Text>
        <Text>{draft}</Text>
        <Text color="subtle">{draft === '' ? t('btw-placeholder') : ''}</Text>
      </Box>
    </Box>
  )
}
