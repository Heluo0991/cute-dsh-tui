import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from '../ui.js';
import { t } from '../i18n.js';
import { Pane } from './design-system/Pane.js';
import { Select } from './Select.js';
import { Byline } from './design-system/Byline.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
/**
 * The `/thinking` dialog, ported from the leak's ThinkingToggle.tsx: a
 * permission-colored Pane with a bold title, the Enabled/Disabled select
 * (with CC's option descriptions), and the Enter/Esc hint line.
 *
 * When `confirmationPending` is set (mid-conversation toggle), the select is
 * replaced by CC's yellow warning block and the hint line becomes
 * Enter confirm / Esc cancel; keyboard handling lives in the caller (Chat).
 */
export function ThinkingToggle({ currentValue, focusIndex, confirmationPending, }) {
    const options = [
        {
            value: 'true',
            label: t('thinking-enabled'),
            description: t('thinking-enabled-desc'),
        },
        {
            value: 'false',
            label: t('thinking-disabled'),
            description: t('thinking-disabled-desc'),
        },
    ];
    return (_jsxs(Pane, { color: "permission", children: [_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { marginBottom: 1, flexDirection: "column", children: [_jsx(Text, { color: "remember", bold: true, children: t('thinking-toggle-title') }), _jsx(Text, { dimColor: true, children: t('thinking-toggle-subtitle') })] }), confirmationPending !== null ? (_jsxs(Box, { flexDirection: "column", marginBottom: 1, gap: 1, children: [_jsx(Text, { color: "warning", children: t('thinking-warning') }), _jsx(Text, { color: "warning", children: t('thinking-confirm-question') })] })) : (_jsx(Box, { flexDirection: "column", marginBottom: 1, children: _jsx(Select, { options: options, focusIndex: focusIndex, selectedValue: currentValue ? 'true' : 'false', visibleOptionCount: 2 }) }))] }), _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: t('action-confirm'), bold: true }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: confirmationPending !== null ? t('action-cancel') : t('action-exit') })] }) })] }));
}
