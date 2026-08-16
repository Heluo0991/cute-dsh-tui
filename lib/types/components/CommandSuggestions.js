import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from '../ui.js';
import { t } from '../i18n.js';
import { stringWidth } from '../ink/stringWidth.js';
import { truncateToWidth } from '../ink/truncateToWidth.js';
/**
 * The slash-command suggestion overlay, ported from the leak's
 * `PromptInputFooterSuggestions.tsx` (command layout only): a name column
 * padded to a fixed width, optional `[tag]`, then a truncated description.
 * The selected row renders in the theme's `suggestion` color, others dim.
 */
export function CommandSuggestions({ commands, selectedIndex, columns, query = '', }) {
    if (commands.length === 0)
        return null;
    // Cap the command name column at 40% of terminal width to ensure the
    // description has space (same as the leak).
    const maxNameWidth = Math.floor(columns * 0.4);
    const nameWidth = Math.min(Math.max(...commands.map(c => stringWidth(c.name))) + 5, maxNameWidth);
    const maxVisible = 5;
    const startIndex = Math.max(0, Math.min(selectedIndex - Math.floor(maxVisible / 2), commands.length - maxVisible));
    const visible = commands.slice(startIndex, startIndex + maxVisible);
    return (_jsxs(Box, { flexDirection: "column", children: [visible.map(command => {
                const isSelected = command.name === commands[selectedIndex]?.name;
                const padded = command.name +
                    ' '.repeat(Math.max(0, nameWidth - stringWidth(command.name)));
                // filterCommands guarantees a prefix match; highlight exactly the
                // typed run (slash + following text) without changing column widths.
                const typed = query.replace(/^\//, '').toLowerCase();
                const matchLength = command.name.toLowerCase().startsWith(typed)
                    ? Math.min(typed.length, command.name.length)
                    : 0;
                const tagText = command.tag ? `[${command.tag}] ` : '';
                const tagWidth = stringWidth(tagText);
                const descriptionWidth = Math.max(0, columns - nameWidth - tagWidth - 4);
                const description = stringWidth(command.description) > descriptionWidth
                    ? truncateToWidth(command.description, descriptionWidth - 1) + '…'
                    : command.description;
                return (_jsx(Box, { width: "100%", paddingLeft: 1, paddingRight: 1, backgroundColor: isSelected ? 'selectionBg' : undefined, children: _jsxs(Text, { wrap: "truncate", children: [_jsx(Text, { color: isSelected ? 'suggestion' : undefined, dimColor: !isSelected, bold: isSelected, children: matchLength > 0 ? padded.slice(0, matchLength) : '' }), matchLength > 0 && (_jsx(Text, { color: isSelected ? 'suggestion' : 'inactiveShimmer', dimColor: !isSelected, children: padded.slice(matchLength) })), matchLength === 0 && (_jsx(Text, { color: isSelected ? 'suggestion' : undefined, dimColor: !isSelected, children: padded })), tagText ? _jsx(Text, { dimColor: true, children: tagText }) : null, _jsx(Text, { color: isSelected ? 'suggestion' : undefined, dimColor: !isSelected, children: description })] }) }, command.name));
            }), _jsx(Box, { paddingLeft: 1, marginTop: 0, children: _jsx(Text, { dimColor: true, children: t('suggestions-command-hint') }) })] }));
}
