import React from 'react'
import { Text } from '../ui.js'
import { t } from '../i18n.js'

/**
 * The dim "interrupted" row shown when the user stops a turn, ported from
 * the leak's `InterruptedByUser.tsx`.
 */
export function InterruptedByUser(): React.ReactNode {
  return (
    <>
      <Text dimColor>{t('interrupted-label')} </Text>
      <Text dimColor>{t('interrupted-question')}</Text>
    </>
  )
}
