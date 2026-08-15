import { isEnvTruthy } from './envUtils.js'

/**
 * Whether mouse click handling is disabled for the ported Ink core. cute-dsh-tui
 * reads its own env flag (`CUTE_DSH_TUI_DISABLE_MOUSE`); the original module
 * consulted Claude Code's fullscreen state.
 * @returns True when CUTE_DSH_TUI_DISABLE_MOUSE is set to a truthy value.
 */
export function isMouseClicksDisabled(): boolean {
  return isEnvTruthy(process.env.CUTE_DSH_TUI_DISABLE_MOUSE)
}
