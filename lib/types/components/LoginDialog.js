import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Text, useInput } from '../ui.js';
import { t } from '../i18n.js';
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
                setError(t('login-error-empty'));
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
    return (_jsxs(Pane, { color: "permission", children: [_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: "remember", bold: true, children: t('login-title') }), _jsx(Text, { wrap: "wrap", children: t('login-body') }), _jsx(Text, { children: `${t('login-api-key-label')}  ${shown}` }), saving && _jsx(Text, { color: "warning", wrap: "wrap", children: t('login-save-warning') }), error !== null && _jsx(Text, { color: "error", children: error })] }), _jsx(Text, { dimColor: true, italic: true, children: _jsxs(Byline, { children: [_jsx(KeyboardShortcutHint, { shortcut: "Enter", action: t('login-action-continue'), bold: true }), _jsx(KeyboardShortcutHint, { shortcut: "Esc", action: t('login-action-cancel') })] }) })] }));
}
export function CredentialSaveConfirm({ onConfirm, onDecline, }) {
    useInput((input, key) => {
        if (key.return)
            onConfirm();
        else if (key.escape || (key.ctrl && input === 'c'))
            onDecline();
    }, { isActive: true });
    return (_jsx(Pane, { color: "warning", children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: "warning", bold: true, children: t('login-save-title') }), _jsx(Text, { wrap: "wrap", children: t('login-save-body') }), _jsx(Text, { dimColor: true, children: t('login-save-hint') })] }) }));
}
export function CredentialDeleteConfirm({ onConfirm, onCancel, }) {
    useInput((input, key) => {
        if (key.return)
            onConfirm();
        else if (key.escape || (key.ctrl && input === 'c'))
            onCancel();
    }, { isActive: true });
    return (_jsx(Pane, { color: "warning", children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: "warning", bold: true, children: t('login-delete-title') }), _jsx(Text, { wrap: "wrap", children: t('login-delete-body') }), _jsx(Text, { dimColor: true, children: t('login-delete-hint') })] }) }));
}
