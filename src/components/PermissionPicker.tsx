import React from 'react'
import { Box, Text } from '../ui.js'
import { t } from '../i18n.js'
import { Pane } from './design-system/Pane.js'
import { Select } from './Select.js'
import { Byline } from './design-system/Byline.js'
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js'
import type { PermissionOption } from '../channel.js'

/** Selects DSH's current-session sandbox and approval bundle. */
export function PermissionPicker({
  options,
  focusIndex,
  currentPreset,
}: {
  options: readonly PermissionOption[]
  focusIndex: number
  currentPreset: string
}): React.ReactNode {
  return (
    <Pane color="permission">
      <Box flexDirection="column">
        <Box flexDirection="column" marginBottom={1}>
          <Text color="remember" bold>{t('permission-picker-title')}</Text>
          <Text dimColor>{t('permission-picker-subtitle')}</Text>
        </Box>
        <Select
          options={options.map(option => ({
            value: option.id,
            label: option.name,
            description: option.description,
          }))}
          focusIndex={focusIndex}
          selectedValue={currentPreset}
        />
      </Box>
      <Text dimColor italic>
        <Byline>
          <KeyboardShortcutHint shortcut="Enter" action={t('action-confirm')} bold />
          <KeyboardShortcutHint shortcut="Esc" action={t('action-exit')} />
        </Byline>
      </Text>
    </Pane>
  )
}

/** Explicit interlock before a session gains unrestricted access. */
export function FullAccessConfirm({
  fromYoloResume,
}: {
  /** Distinguishes the launcher-driven confirmation from a manual switch. */
  fromYoloResume: boolean
}): React.ReactNode {
  return (
    <Pane color="warning">
      <Box flexDirection="column" gap={1}>
        <Text color="warning" bold>{t('full-access-title')}</Text>
        <Text wrap="wrap">{t('full-access-body')}</Text>
        {fromYoloResume && (
          <Text color="warning" wrap="wrap">{t('full-access-yolo-body')}</Text>
        )}
      </Box>
      <Text dimColor italic>
        <Byline>
          <KeyboardShortcutHint shortcut="Enter" action={t('action-enable-full')} bold />
          <KeyboardShortcutHint shortcut="Esc" action={t('action-keep-permission')} />
        </Byline>
      </Text>
    </Pane>
  )
}
