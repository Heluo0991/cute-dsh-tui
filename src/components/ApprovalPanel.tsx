import React from 'react'
import { Box, Text } from '../ui.js'
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
        <Text color="warning" bold>Approval required</Text>
        <Text>
          Tool: <Text bold>{approval.toolName}</Text>
        </Text>
        {approval.reason !== undefined && approval.reason !== '' && (
          <Text wrap="wrap">Reason: {approval.reason}</Text>
        )}
        {approval.callId !== undefined && (
          <Text dimColor>Call: {approval.callId}</Text>
        )}
        {approval.queued > 0 && (
          <Text dimColor>{approval.queued} additional approval request(s) queued.</Text>
        )}
      </Box>
      <Text dimColor italic>
        <Byline>
          <KeyboardShortcutHint shortcut="Enter" action="allow once" bold />
          <KeyboardShortcutHint shortcut="D" action="deny" />
          <KeyboardShortcutHint shortcut="Esc" action="cancel" />
        </Byline>
      </Text>
    </Pane>
  )
}
