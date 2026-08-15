import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from '../ui.js';
import { Pane } from './design-system/Pane.js';
import { Select } from './Select.js';
import { Byline } from './design-system/Byline.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
/** Selects DSH's current-session sandbox and approval bundle. */
export function PermissionPicker({ options, focusIndex, currentPreset, }) {
    return (_jsxs(Pane, { color: "permission", children: [_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { color: "remember", bold: true, children: "Permissions" }), _jsx(Text, { dimColor: true, children: "Applies to this session and its future tool calls." })] }), _jsx(Select, { options: options.map(option => ({
                            value: option.id,
                            label: option.name,
                            description: option.description,
                        })), focusIndex: focusIndex, selectedValue: currentPreset })] }), _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "confirm", bold: true }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: "exit" })] }) })] }));
}
/** Explicit interlock before a session gains unrestricted access. */
export function FullAccessConfirm({ fromYoloResume, }) {
    return (_jsxs(Pane, { color: "warning", children: [_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: "warning", bold: true, children: "Enable full access?" }), _jsx(Text, { wrap: "wrap", children: "Full access removes the workspace boundary and disables approval prompts for this session. Commands may read, modify, or execute outside the current project." }), fromYoloResume && (_jsx(Text, { color: "warning", wrap: "wrap", children: "This resumed session was previously restricted. `--yolo` requested an upgrade; confirm to apply it now." }))] }), _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "enable full access", bold: true }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: "keep current permission" })] }) })] }));
}
