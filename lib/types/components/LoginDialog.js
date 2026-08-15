import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Text, useInput } from '../ui.js';
import { Pane } from './design-system/Pane.js';
import { Byline } from './design-system/Byline.js';
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
export function LoginDialog({ saving, onSubmit, onCancel, }) {
    const [value, setValue] = React.useState('');
    const [cursor, setCursor] = React.useState(0);
    const [error, setError] = React.useState(null);
    useInput((input, key) => {
        if (key.escape || (key.ctrl && input === 'c')) {
            onCancel();
            return;
        }
        if (key.return) {
            if (value.trim() === '') {
                setError('Enter an API key first.');
            }
            else {
                onSubmit(value);
            }
            return;
        }
        if (key.backspace) {
            setValue(current => current.slice(0, Math.max(0, cursor - 1)) + current.slice(cursor));
            setCursor(current => Math.max(0, current - 1));
            return;
        }
        if (key.delete) {
            setValue(current => current.slice(0, cursor) + current.slice(cursor + 1));
            return;
        }
        if (key.leftArrow) {
            setCursor(current => Math.max(0, current - 1));
            return;
        }
        if (key.rightArrow) {
            setCursor(current => Math.min(value.length, current + 1));
            return;
        }
        if (key.home) {
            setCursor(0);
            return;
        }
        if (key.end) {
            setCursor(value.length);
            return;
        }
        if (!key.ctrl && !key.meta && input) {
            setValue(current => current.slice(0, cursor) + input + current.slice(cursor));
            setCursor(current => current + input.length);
            setError(null);
        }
    }, { isActive: true });
    const masked = '•'.repeat(value.length);
    const shown = cursor < masked.length ? `${masked.slice(0, cursor)}█${masked.slice(cursor + 1)}` : `${masked}█`;
    return (_jsxs(Pane, { color: "permission", children: [_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: "remember", bold: true, children: "Connect DeepSeek" }), _jsx(Text, { wrap: "wrap", children: "Paste a DeepSeek API key. It is masked, never added to command history, and applies immediately to this session." }), _jsx(Text, { children: `API key  ${shown}` }), saving && _jsx(Text, { color: "warning", wrap: "wrap", children: "No key exists in this terminal. Confirm on the next screen to save it for future cdsh launches." }), error !== null && _jsx(Text, { color: "error", children: error })] }), _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: "continue", bold: true }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: "cancel" })] }) })] }));
}
export function CredentialSaveConfirm({ onConfirm, onDecline, }) {
    useInput((input, key) => {
        if (key.return)
            onConfirm();
        else if (key.escape || (key.ctrl && input === 'c'))
            onDecline();
    }, { isActive: true });
    return (_jsx(Pane, { color: "warning", children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: "warning", bold: true, children: "Save API key for future cdsh launches?" }), _jsx(Text, { wrap: "wrap", children: "Windows saves it as your user environment variable. macOS/Linux save it through DSH's owner-only credential store, which is applied immediately and reused by later cdsh launches." }), _jsx(Text, { dimColor: true, children: "Enter saves \u00B7 Esc keeps it for this session only." })] }) }));
}
export function CredentialDeleteConfirm({ onConfirm, onCancel, }) {
    useInput((input, key) => {
        if (key.return)
            onConfirm();
        else if (key.escape || (key.ctrl && input === 'c'))
            onCancel();
    }, { isActive: true });
    return (_jsx(Pane, { color: "warning", children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: "warning", bold: true, children: "Forget the saved API key?" }), _jsx(Text, { wrap: "wrap", children: "This removes the credential previously saved by CuteDshTui. Keys supplied by your shell are never changed." }), _jsx(Text, { dimColor: true, children: "Enter removes it \u00B7 Esc keeps it." })] }) }));
}
