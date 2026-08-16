import React from 'react'
import { Box, Text } from '../ui.js'
import { t } from '../i18n.js'
import { Pane } from './design-system/Pane.js'
import { Byline } from './design-system/Byline.js'
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js'
import type { ApprovalSnapshot } from '../approvals.js'

/** One-shot DSH approval UI. Keyboard routing is owned by Chat. */
export function ApprovalPanel({
  approval,
}: {
  approval: ApprovalSnapshot
}): React.ReactNode {
  return (
    <Pane color="warning">
      <Box flexDirection="column" gap={1}>
        <Text color="warning" bold>{t('approval-title')}</Text>
        <Text>
          {t('approval-tool')}: <Text bold>{approval.toolName}</Text>
        </Text>
        {approval.reason !== undefined && approval.reason !== '' && (
          <Text wrap="wrap">{t('approval-reason')}: {approval.reason}</Text>
        )}
        {approval.callId !== undefined && (
          <Text dimColor>{t('approval-call')}: {approval.callId}</Text>
        )}
        {approval.queued > 0 && (
          <Text dimColor>{t('approval-queued', { count: approval.queued })}</Text>
        )}
      </Box>
      <Text dimColor italic>
        <Byline>
          <KeyboardShortcutHint shortcut="Enter" action={t('action-allow-once')} bold />
          <KeyboardShortcutHint shortcut="D" action={t('action-deny')} />
          <KeyboardShortcutHint shortcut="Esc" action={t('action-cancel')} />
        </Byline>
      </Text>
    </Pane>
  )
}
