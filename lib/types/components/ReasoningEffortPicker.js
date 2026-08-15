import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from '../ui.js';
import { Pane } from './design-system/Pane.js';
import { ListItem } from './design-system/ListItem.js';
import { Byline } from './design-system/Byline.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
/** Second stage of `/model`: select one adapter-supported reasoning depth. */
export function ReasoningEffortPicker({ model, efforts, focusIndex, currentEffort, }) {
    return (_jsxs(Pane, { color: "permission", children: [_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { color: "remember", bold: true, children: "Reasoning depth \u00B7 step 2 of 2" }), _jsx(Text, { dimColor: true, children: model.name })] }), efforts.map((effort, index) => (_jsx(ListItem, { isFocused: index === focusIndex, isSelected: effort.id === currentEffort, description: effort.description, children: effort.name }, effort.id)))] }), _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "switch model", bold: true }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: "back" })] }) })] }));
}
