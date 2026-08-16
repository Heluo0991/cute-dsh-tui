import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text, useAnimationFrame } from '../../ui.js';
import { t } from '../../i18n.js';
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';
import { Markdown } from '../Markdown.js';
import { formatDuration } from '../../cc/format.js';
/**
 * Thinking block: folded `∴ Thinking (ctrl+o to expand)`, expanded shows the
 * full reasoning text indented under `∴ Thinking…` (ported from the leak's
 * `messages/AssistantThinkingMessage.tsx`). When the channel records the
 * reasoning duration, the label carries it (`∴ Thinking · 12s …`) — cute-dsh-tui's
 * take on making thinking time visible in the transcript.
 */
export function AssistantThinkingMessage({ thinking, addMargin, verbose, durationMs, streaming = false, isSelected = false, onClick, }) {
    const [animationRef, time] = useAnimationFrame(streaming ? 120 : null);
    if (!thinking && !streaming)
        return null;
    const frame = ['·', '•', '●', '•'][Math.floor(time / 120) % 4];
    const duration = durationMs !== undefined && durationMs >= 1000
        ? ` · ${formatDuration(durationMs)}`
        : '';
    if (!verbose) {
        return (_jsx(Box, { ref: animationRef, marginTop: addMargin ? 1 : 0, backgroundColor: isSelected ? 'messageActionsBackground' : undefined, onClick: onClick, children: _jsxs(Text, { dimColor: true, italic: true, children: [streaming ? _jsxs(Text, { color: "claude", children: [frame, " ", t('thinking-label')] }) : `∴ ${t('thinking-label')}`, duration, ' ', _jsx(Text, { dimColor: true, children: _jsx(KeyboardShortcutHint, { shortcut: "ctrl+o", action: t('action-expand'), parens: true }) })] }) }));
    }
    return (_jsxs(Box, { ref: animationRef, flexDirection: "column", gap: 1, marginTop: addMargin ? 1 : 0, width: "100%", backgroundColor: isSelected ? 'messageActionsBackground' : undefined, onClick: onClick, children: [_jsxs(Text, { dimColor: true, italic: true, children: [streaming ? _jsxs(Text, { color: "claude", children: [frame, " ", t('thinking-label')] }) : `∴ ${t('thinking-label')}`, duration, "\u2026"] }), _jsx(Box, { paddingLeft: 2, children: _jsx(Markdown, { dimColor: true, children: thinking }) })] }));
}
