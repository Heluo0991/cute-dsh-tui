import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from '../ui.js';
import { t } from '../i18n.js';
import { stringWidth } from '../ink/stringWidth.js';
import { truncateToWidth } from '../ink/truncateToWidth.js';
/**
 * The `@` file-completion overlay in CC's suggestion style: `+` icon prefix
 * (CC's file suggestions) + name column + description. The selected row
 * renders in the theme's `suggestion` color, others dim.
 */
export function FileSuggestions({ files, selectedIndex, columns, }) {
    if (files.length === 0)
        return null;
    const maxVisible = 6;
    const startIndex = Math.max(0, Math.min(selectedIndex - Math.floor(maxVisible / 2), files.length - maxVisible));
    const visible = files.slice(startIndex, startIndex + maxVisible);
    return (_jsxs(Box, { flexDirection: "column", children: [visible.map(file => {
                const isSelected = file === files[selectedIndex];
                const isDir = file.endsWith('/');
                const name = isDir ? file.slice(0, -1) : file;
                const descriptionWidth = Math.max(0, columns - 24);
                const description = isDir ? 'directory' : 'file';
                return (_jsx(Box, { width: "100%", paddingLeft: 1, paddingRight: 1, backgroundColor: isSelected ? 'selectionBg' : undefined, children: _jsxs(Text, { wrap: "truncate", children: [_jsxs(Text, { color: isSelected ? 'suggestion' : undefined, dimColor: !isSelected, bold: isSelected, children: ["+ ", name] }), _jsxs(Text, { color: isSelected ? 'suggestion' : undefined, dimColor: !isSelected, children: [' '.repeat(Math.max(1, 20 - stringWidth(name))), stringWidth(description) > descriptionWidth
                                        ? truncateToWidth(description, descriptionWidth - 1) + '…'
                                        : description] })] }) }, file));
            }), _jsx(Box, { paddingLeft: 1, marginTop: 0, children: _jsx(Text, { dimColor: true, children: t('suggestions-file-hint') }) })] }));
}
