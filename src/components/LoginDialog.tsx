import React from 'react'
import { Box, Text, useInput } from '../ui.js'
import { Pane } from './design-system/Pane.js'
import { Byline } from './design-system/Byline.js'
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js'

export function LoginDialog({
  saving,
  onSubmit,
  onCancel,
}: {
  saving: boolean
  onSubmit: (key: string) => void
  onCancel: () => void
}): React.ReactNode {
  const [value, setValue] = React.useState('')
  const [cursor, setCursor] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      onCancel()
      return
    }
    if (key.return) {
      if (value.trim() === '') {
        setError('Enter an API key first.')
      } else {
        onSubmit(value)
      }
      return
    }
    if (key.backspace) {
      setValue(current => current.slice(0, Math.max(0, cursor - 1)) + current.slice(cursor))
      setCursor(current => Math.max(0, current - 1))
      return
    }
    if (key.delete) {
      setValue(current => current.slice(0, cursor) + current.slice(cursor + 1))
      return
    }
    if (key.leftArrow) {
      setCursor(current => Math.max(0, current - 1))
      return
    }
    if (key.rightArrow) {
      setCursor(current => Math.min(value.length, current + 1))
      return
    }
    if (key.home) {
      setCursor(0)
      return
    }
    if (key.end) {
      setCursor(value.length)
      return
    }
    if (!key.ctrl && !key.meta && input) {
      setValue(current => current.slice(0, cursor) + input + current.slice(cursor))
      setCursor(current => current + input.length)
      setError(null)
    }
  }, { isActive: true })

  const masked = '•'.repeat(value.length)
  const shown = cursor < masked.length ? `${masked.slice(0, cursor)}█${masked.slice(cursor + 1)}` : `${masked}█`
  return (
    <Pane color="permission">
      <Box flexDirection="column" gap={1}>
        <Text color="remember" bold>Connect DeepSeek</Text>
        <Text wrap="wrap">
          Paste a DeepSeek API key. It is masked, never added to command history, and applies immediately to this session.
        </Text>
        <Text>{`API key  ${shown}`}</Text>
        {saving && <Text color="warning" wrap="wrap">No key exists in this terminal. Confirm on the next screen to save it for future cdsh launches.</Text>}
        {error !== null && <Text color="error">{error}</Text>}
      </Box>
      <Text dimColor italic>
        <Byline>
          <KeyboardShortcutHint shortcut="Enter" action="continue" bold />
          <KeyboardShortcutHint shortcut="Esc" action="cancel" />
        </Byline>
      </Text>
    </Pane>
  )
}

export function CredentialSaveConfirm({
  onConfirm,
  onDecline,
}: {
  onConfirm: () => void
  onDecline: () => void
}): React.ReactNode {
  useInput((input, key) => {
    if (key.return) onConfirm()
    else if (key.escape || (key.ctrl && input === 'c')) onDecline()
  }, { isActive: true })
  return (
    <Pane color="warning">
      <Box flexDirection="column" gap={1}>
        <Text color="warning" bold>Save API key for future cdsh launches?</Text>
        <Text wrap="wrap">
          Windows saves it as your user environment variable. macOS/Linux save it through DSH's owner-only credential store, which is applied immediately and reused by later cdsh launches.
        </Text>
        <Text dimColor>Enter saves · Esc keeps it for this session only.</Text>
      </Box>
    </Pane>
  )
}

export function CredentialDeleteConfirm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}): React.ReactNode {
  useInput((input, key) => {
    if (key.return) onConfirm()
    else if (key.escape || (key.ctrl && input === 'c')) onCancel()
  }, { isActive: true })
  return (
    <Pane color="warning">
      <Box flexDirection="column" gap={1}>
        <Text color="warning" bold>Forget the saved API key?</Text>
        <Text wrap="wrap">This removes the credential previously saved by CuteDshTui. Keys supplied by your shell are never changed.</Text>
        <Text dimColor>Enter removes it · Esc keeps it.</Text>
      </Box>
    </Pane>
  )
}
