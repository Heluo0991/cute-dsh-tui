import React from 'react'
import { Box, Text } from '../ui.js'
import { t } from '../i18n.js'
import { Pane } from './design-system/Pane.js'
import { Select } from './Select.js'
import { Byline } from './design-system/Byline.js'
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js'

/**
 * The `/thinking` dialog, ported from the leak's ThinkingToggle.tsx: a
 * permission-colored Pane with a bold title, the Enabled/Disabled select
 * (with CC's option descriptions), and the Enter/Esc hint line.
 *
 * When `confirmationPending` is set (mid-conversation toggle), the select is
 * replaced by CC's yellow warning block and the hint line becomes
 * Enter confirm / Esc cancel; keyboard handling lives in the caller (Chat).
 */
export function ThinkingToggle({
  currentValue,
  focusIndex,
  confirmationPending,
}: {
  currentValue: boolean
  focusIndex: number
  /** Set while a mid-conversation toggle awaits Enter confirmation. */
  confirmationPending: boolean | null
}): React.ReactNode {
  const options = [
    {
      value: 'true',
      label: t('thinking-enabled'),
      description: t('thinking-enabled-desc'),
    },
    {
      value: 'false',
      label: t('thinking-disabled'),
      description: t('thinking-disabled-desc'),
    },
  ]

  return (
    <Pane color="permission">
      <Box flexDirection="column">
        <Box marginBottom={1} flexDirection="column">
          <Text color="remember" bold>{t('thinking-toggle-title')}</Text>
          <Text dimColor>{t('thinking-toggle-subtitle')}</Text>
        </Box>

        {confirmationPending !== null ? (
          <Box flexDirection="column" marginBottom={1} gap={1}>
            <Text color="warning">{t('thinking-warning')}</Text>
            <Text color="warning">{t('thinking-confirm-question')}</Text>
          </Box>
        ) : (
          <Box flexDirection="column" marginBottom={1}>
            <Select
              options={options}
              focusIndex={focusIndex}
              selectedValue={currentValue ? 'true' : 'false'}
              visibleOptionCount={2}
            />
          </Box>
        )}
      </Box>
      <Text dimColor italic>
        <Byline>
          <KeyboardShortcutHint shortcut="Enter" action={t('action-confirm')} bold />
          <KeyboardShortcutHint
            shortcut="Esc"
            action={confirmationPending !== null ? t('action-cancel') : t('action-exit')}
          />
        </Byline>
      </Text>
    </Pane>
  )
}
