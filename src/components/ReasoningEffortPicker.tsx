import React from 'react'
import { Box, Text } from '../ui.js'
import { t } from '../i18n.js'
import type { LlmModelInfo } from '@deepseek-ai/dsh-llm'
import type { ReasoningEffortOption } from '../channel.js'
import { Pane } from './design-system/Pane.js'
import { ListItem } from './design-system/ListItem.js'
import { Byline } from './design-system/Byline.js'
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js'

/** Second stage of `/model`: select one adapter-supported reasoning depth. */
export function ReasoningEffortPicker({
  model,
  efforts,
  focusIndex,
  currentEffort,
}: {
  model: LlmModelInfo
  efforts: readonly ReasoningEffortOption[]
  focusIndex: number
  currentEffort: string | undefined
}): React.ReactNode {
  return (
    <Pane color="permission">
      <Box flexDirection="column">
        <Box flexDirection="column" marginBottom={1}>
          <Text color="remember" bold>{t('effort-picker-title')}</Text>
          <Text dimColor>{model.name}</Text>
        </Box>
        {efforts.map((effort, index) => (
          <ListItem
            key={effort.id}
            isFocused={index === focusIndex}
            isSelected={effort.id === currentEffort}
            description={effort.description}
          >
            {effort.name}
          </ListItem>
        ))}
      </Box>
      <Text dimColor italic>
        <Byline>
          <KeyboardShortcutHint shortcut="Enter" action={t('action-switch-model')} bold />
          <KeyboardShortcutHint shortcut="Esc" action={t('action-back')} />
        </Byline>
      </Text>
    </Pane>
  )
}
