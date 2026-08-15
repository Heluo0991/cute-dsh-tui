import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from '../ui.js';
import { Pane } from './design-system/Pane.js';
import { Byline } from './design-system/Byline.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
/** One-shot DSH approval UI. Keyboard routing is owned by Chat. */
export function ApprovalPanel({ approval, }) {
    return (_jsxs(Pane, { color: "warning", children: [_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: "warning", bold: true, children: "Approval required" }), _jsxs(Text, { children: ["Tool: ", _jsx(Text, { bold: true, children: approval.toolName })] }), approval.reason !== undefined && approval.reason !== '' && (_jsxs(Text, { wrap: "wrap", children: ["Reason: ", approval.reason] })), approval.callId !== undefined && (_jsxs(Text, { dimColor: true, children: ["Call: ", approval.callId] })), approval.queued > 0 && (_jsxs(Text, { dimColor: true, children: [approval.queued, " additional approval request(s) queued."] }))] }), _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "allow once", bold: true }), _jsx(KeyboardShortcutHint, { shortcut: "D", action: "deny" }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: "cancel" })] }) })] }));
}
