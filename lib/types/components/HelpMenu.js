import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from '../ui.js';
import { t } from '../i18n.js';
/**
 * The `?` help menu, ported from the leak's `PromptInputHelpMenu.tsx`
 * (three-column shortcut layout, trimmed to the keys cute-dsh-tui actually binds).
 * The command column lists the merged slash-command surface: built-in
 * commands plus plugin-registered ones from the DSH registry (plan/goal/…).
 * All labels are localized; keep the shortcut table in sync with
 * docs/interaction.md and the Chat/PromptInput useInput handlers.
 */
const MAX_HELP_COMMANDS = 24;
export function HelpMenu({ commands, }) {
    const visibleCommands = commands.slice(0, MAX_HELP_COMMANDS);
    const hiddenCount = commands.length - visibleCommands.length;
    const shortcutColumn = [
        'help-shortcut-slash',
        'help-shortcut-question',
        'help-shortcut-verbose',
        'help-shortcut-context',
        'help-shortcut-history',
        'help-shortcut-interrupt',
        'help-shortcut-exit',
        'help-shortcut-redraw',
        'help-shortcut-show-older',
        'help-shortcut-btw',
    ];
    const editColumn = [
        'help-edit-esc',
        'help-edit-history',
        'help-edit-cursor',
        'help-edit-word',
        'help-edit-tab',
        'help-edit-permission',
        'help-edit-delete-word-left',
        'help-edit-delete-word-right',
    ];
    return (_jsxs(Box, { paddingX: 2, flexDirection: "row", gap: 4, children: [_jsx(Box, { flexDirection: "column", width: 26, flexShrink: 0, children: shortcutColumn.map(key => (_jsx(Text, { dimColor: true, wrap: "truncate-end", children: t(key) }, key))) }), _jsx(Box, { flexDirection: "column", width: 24, flexShrink: 0, children: editColumn.map(key => (_jsx(Text, { dimColor: true, wrap: "truncate-end", children: t(key) }, key))) }), _jsxs(Box, { flexDirection: "column", flexShrink: 1, children: [_jsx(Text, { dimColor: true, children: t('help-commands-title') }), visibleCommands.map(command => (_jsxs(Text, { dimColor: true, wrap: "truncate-end", children: ["/", command.name, " \u2014 ", command.description] }, command.name))), hiddenCount > 0 && (_jsx(Text, { dimColor: true, wrap: "truncate-end", children: t('help-commands-more', { count: hiddenCount }) }))] })] }));
}
