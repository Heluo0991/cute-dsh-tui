import React from 'react'
import { Box, Text } from '../ui.js'
import { t } from '../i18n.js'
import type { LlmModelInfo } from '@deepseek-ai/dsh-llm'
import { Pane } from './design-system/Pane.js'
import { ListItem } from './design-system/ListItem.js'
import { Byline } from './design-system/Byline.js'
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js'

/**
 * Model picker in the CC ModelPicker style: a permission-colored Pane with
 * the model list as Select rows (❯ focus pointer, ✓ on the active model,
 * descriptions), plus the Enter/Esc hint line. This is step one of `/model`:
 * after choosing a model route, the next pane chooses that route's reasoning
 * depth before the session fork is created.
 */
export function ModelPicker({
  models,
  focusIndex,
  currentModel,
}: {
  models: readonly LlmModelInfo[]
  focusIndex: number
  currentModel: string
}): React.ReactNode {
  return (
    <Pane color="permission">
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="remember" bold>
            Model · step 1 of 2
          </Text>
        </Box>
        {models.map((model, index) => (
          <ListItem
            key={`${model.provider}/${model.id}`}
            isFocused={index === focusIndex}
            isSelected={`${model.provider}/${model.id}` === currentModel}
            description={model.description}
          >
            {model.provider} / {model.name}
          </ListItem>
        ))}
      </Box>
      <Text dimColor italic>
        <Byline>
          <KeyboardShortcutHint shortcut="Enter" action={t('action-choose-depth')} bold />
          <KeyboardShortcutHint shortcut="Esc" action={t('action-exit')} />
        </Byline>
      </Text>
    </Pane>
  )
}
