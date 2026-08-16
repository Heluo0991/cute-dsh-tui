import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from '../ui.js';
import { t } from '../i18n.js';
import { Pane } from './design-system/Pane.js';
import { Select } from './Select.js';
import { Byline } from './design-system/Byline.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
/** Selects DSH's current-session sandbox and approval bundle. */
export function PermissionPicker({ options, focusIndex, currentPreset, }) {
    return (_jsxs(Pane, { color: "permission", children: [_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { color: "remember", bold: true, children: t('permission-picker-title') }), _jsx(Text, { dimColor: true, children: t('permission-picker-subtitle') })] }), _jsx(Select, { options: options.map(option => ({
                            value: option.id,
                            label: option.name,
                            description: option.description,
                        })), focusIndex: focusIndex, selectedValue: currentPreset })] }), _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: t('action-confirm'), bold: true }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: t('action-exit') })] }) })] }));
}
/** Explicit interlock before a session gains unrestricted access. */
export function FullAccessConfirm({ fromYoloResume, }) {
    return (_jsxs(Pane, { color: "warning", children: [_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: "warning", bold: true, children: t('full-access-title') }), _jsx(Text, { wrap: "wrap", children: t('full-access-body') }), fromYoloResume && (_jsx(Text, { color: "warning", wrap: "wrap", children: t('full-access-yolo-body') }))] }), _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: t('action-enable-full'), bold: true }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: t('action-keep-permission') })] }) })] }));
}
