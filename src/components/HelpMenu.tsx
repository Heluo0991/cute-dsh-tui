import React from 'react'
import { Box, Text } from '../ui.js'
import { t } from '../i18n.js'
import type { LocalCommand } from '../commands.js'

/**
 * The `?` help menu, ported from the leak's `PromptInputHelpMenu.tsx`
 * (three-column shortcut layout, trimmed to the keys cute-dsh-tui actually binds).
 * The command column lists the merged slash-command surface: built-in
 * commands plus plugin-registered ones from the DSH registry (plan/goal/…).
 * All labels are localized; keep the shortcut table in sync with
 * docs/interaction.md and the Chat/PromptInput useInput handlers.
 */
const MAX_HELP_COMMANDS = 24

export function HelpMenu({
  commands,
}: {
  commands: readonly LocalCommand[]
}): React.ReactNode {
  const visibleCommands = commands.slice(0, MAX_HELP_COMMANDS)
  const hiddenCount = commands.length - visibleCommands.length
  const shortcutColumn = [
    'help-shortcut-slash',
    'help-shortcut-question',
    'help-shortcut-verbose',
    'help-shortcut-context',
    'help-shortcut-history',
    'help-shortcut-interrupt',
    'help-shortcut-exit',
    'help-shortcut-redraw',
    'help-shortcut-show-older',
    'help-shortcut-btw',
  ] as const
  const editColumn = [
    'help-edit-esc',
    'help-edit-history',
    'help-edit-cursor',
    'help-edit-word',
    'help-edit-tab',
    'help-edit-permission',
    'help-edit-delete-word-left',
    'help-edit-delete-word-right',
  ] as const

  return (
    <Box paddingX={2} flexDirection="row" gap={4}>
      <Box flexDirection="column" width={26} flexShrink={0}>
        {shortcutColumn.map(key => (
          <Text key={key} dimColor wrap="truncate-end">{t(key)}</Text>
        ))}
      </Box>
      <Box flexDirection="column" width={24} flexShrink={0}>
        {editColumn.map(key => (
          <Text key={key} dimColor wrap="truncate-end">{t(key)}</Text>
        ))}
      </Box>
      <Box flexDirection="column" flexShrink={1}>
        <Text dimColor>{t('help-commands-title')}</Text>
        {visibleCommands.map(command => (
          <Text key={command.name} dimColor wrap="truncate-end">
            /{command.name} — {command.description}
          </Text>
        ))}
        {hiddenCount > 0 && (
          <Text dimColor wrap="truncate-end">
            {t('help-commands-more', { count: hiddenCount })}
          </Text>
        )}
      </Box>
    </Box>
  )
}
