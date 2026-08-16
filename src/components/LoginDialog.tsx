import React from 'react'
import { Box, Text, useInput } from '../ui.js'
import { t } from '../i18n.js'
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
        setError(t('login-error-empty'))
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
        <Text color="remember" bold>{t('login-title')}</Text>
        <Text wrap="wrap">{t('login-body')}</Text>
        <Text>{`${t('login-api-key-label')}  ${shown}`}</Text>
        {saving && <Text color="warning" wrap="wrap">{t('login-save-warning')}</Text>}
        {error !== null && <Text color="error">{error}</Text>}
      </Box>
      <Text dimColor italic>
        <Byline>
          <KeyboardShortcutHint shortcut="Enter" action={t('login-action-continue')} bold />
          <KeyboardShortcutHint shortcut="Esc" action={t('login-action-cancel')} />
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
        <Text color="warning" bold>{t('login-save-title')}</Text>
        <Text wrap="wrap">{t('login-save-body')}</Text>
        <Text dimColor>{t('login-save-hint')}</Text>
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
        <Text color="warning" bold>{t('login-delete-title')}</Text>
        <Text wrap="wrap">{t('login-delete-body')}</Text>
        <Text dimColor>{t('login-delete-hint')}</Text>
      </Box>
    </Pane>
  )
}
