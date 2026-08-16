import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from '../ui.js';
import { t } from '../i18n.js';
import { Pane } from './design-system/Pane.js';
import { Byline } from './design-system/Byline.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
/** One-shot DSH approval UI. Keyboard routing is owned by Chat. */
export function ApprovalPanel({ approval, }) {
    return (_jsxs(Pane, { color: "warning", children: [_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: "warning", bold: true, children: t('approval-title') }), _jsxs(Text, { children: [t('approval-tool'), ": ", _jsx(Text, { bold: true, children: approval.toolName })] }), approval.reason !== undefined && approval.reason !== '' && (_jsxs(Text, { wrap: "wrap", children: [t('approval-reason'), ": ", approval.reason] })), approval.callId !== undefined && (_jsxs(Text, { dimColor: true, children: [t('approval-call'), ": ", approval.callId] })), approval.queued > 0 && (_jsx(Text, { dimColor: true, children: t('approval-queued', { count: approval.queued }) }))] }), _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: t('action-allow-once'), bold: true }), _jsx(KeyboardShortcutHint, { shortcut: "D", action: t('action-deny') }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: t('action-cancel') })] }) })] }));
}
