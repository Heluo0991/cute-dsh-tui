import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from '../ui.js';
import { t } from '../i18n.js';
import { useTerminalFocus } from '../ink/hooks/use-terminal-focus.js';
import { Pane } from './design-system/Pane.js';
import { ListItem } from './design-system/ListItem.js';
import { Byline } from './design-system/Byline.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
import { SearchBox } from './SearchBox.js';
import { historyEntryId } from '../history.js';
/**
 * The ctrl+r history search dialog, in the shape of the leak's
 * HistorySearchDialog/FuzzyPicker: a permission-colored Pane with a bold
 * title, the ⌕ SearchBox, the filtered history as ListItem rows (newest
 * first), and the ↑/↓ · Enter · Esc hint line. Keyboard handling lives in
 * the caller (Chat).
 */
export function HistorySearchDialog({ query, cursorOffset, matches, focusIndex, }) {
    const isTerminalFocused = useTerminalFocus();
    return (_jsx(Pane, { color: "permission", children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { bold: true, color: "permission", children: t('history-title') }), _jsx(SearchBox, { query: query, cursorOffset: cursorOffset, isFocused: true, isTerminalFocused: isTerminalFocused, placeholder: t('history-placeholder') }), matches.length === 0 ? (_jsx(Text, { dimColor: true, children: t('history-no-matches') })) : (matches.map((entry, index) => (_jsx(ListItem, { isFocused: index === focusIndex, description: formatRelativeAge(entry.ts), children: entry.text }, historyEntryId(entry))))), _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "\u2191/\u2193", action: t('action-navigate') }), _jsx(KeyboardShortcutHint, { shortcut: "Enter", action: t('action-select'), bold: true }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: t('action-cancel') })] }) })] }) }));
}
/** "now", "5m ago", "2h ago", "3d ago" — like CC's formatRelativeTimeAgo. */
function formatRelativeAge(ts) {
    const elapsed = Date.now() - ts;
    if (elapsed < 60_000)
        return t('history-age-now');
    if (elapsed < 3_600_000)
        return t('history-age-minutes', { n: Math.floor(elapsed / 60_000) });
    if (elapsed < 86_400_000)
        return t('history-age-hours', { n: Math.floor(elapsed / 3_600_000) });
    return t('history-age-days', { n: Math.floor(elapsed / 86_400_000) });
}
