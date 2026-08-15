import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from '../ui.js';
import { Pane } from './design-system/Pane.js';
import { ListItem } from './design-system/ListItem.js';
import { Byline } from './design-system/Byline.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
/**
 * Model picker in the CC ModelPicker style: a permission-colored Pane with
 * the model list as Select rows (❯ focus pointer, ✓ on the active model,
 * descriptions), plus the Enter/Esc hint line. This is step one of `/model`:
 * after choosing a model route, the next pane chooses that route's reasoning
 * depth before the session fork is created.
 */
export function ModelPicker({ models, focusIndex, currentModel, }) {
    return (_jsxs(Pane, { color: "permission", children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: "remember", bold: true, children: "Model \u00B7 step 1 of 2" }) }), models.map((model, index) => (_jsxs(ListItem, { isFocused: index === focusIndex, isSelected: `${model.provider}/${model.id}` === currentModel, description: model.description, children: [model.provider, " / ", model.name] }, `${model.provider}/${model.id}`)))] }), _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "choose depth", bold: true }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: "exit" })] }) })] }));
}
