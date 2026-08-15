import React from 'react'
import { Box, Text } from '../ui.js'
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
          <Text color="remember" bold>Permissions</Text>
          <Text dimColor>Applies to this session and its future tool calls.</Text>
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
          <KeyboardShortcutHint shortcut="Enter" action="confirm" bold />
          <KeyboardShortcutHint shortcut="Esc" action="exit" />
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
        <Text color="warning" bold>Enable full access?</Text>
        <Text wrap="wrap">
          Full access removes the workspace boundary and disables approval prompts
          for this session. Commands may read, modify, or execute outside the
          current project.
        </Text>
        {fromYoloResume && (
          <Text color="warning" wrap="wrap">
            This resumed session was previously restricted. `--yolo` requested
            an upgrade; confirm to apply it now.
          </Text>
        )}
      </Box>
      <Text dimColor italic>
        <Byline>
          <KeyboardShortcutHint shortcut="Enter" action="enable full access" bold />
          <KeyboardShortcutHint shortcut="Esc" action="keep current permission" />
        </Byline>
      </Text>
    </Pane>
  )
}
