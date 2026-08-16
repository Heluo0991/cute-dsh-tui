import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, ScrollBox, Text } from '../ui.js';
import { t } from '../i18n.js';
import { Pane } from './design-system/Pane.js';
import { MessageList } from './MessageList.js';
/**
 * A child session is a real conversation, not a condensed activity log. Keep
 * the main message renderer here so Markdown, thinking blocks, and tool cards
 * retain the same fidelity as the parent transcript.
 */
export function BtwPane({ thread, draft, expanded, }) {
    const [handle, setHandle] = React.useState(null);
    const [expandedRows, setExpandedRows] = React.useState(() => new Set());
    const toggleRow = React.useCallback((rowId) => {
        setExpandedRows(previous => {
            const next = new Set(previous);
            if (next.has(rowId))
                next.delete(rowId);
            else
                next.add(rowId);
            return next;
        });
    }, []);
    return (_jsxs(Box, { flexDirection: "column", flexGrow: 1, width: "100%", children: [_jsxs(Pane, { color: "permission", children: [_jsx(Text, { color: "remember", bold: true, children: t('btw-pane-title') }), _jsxs(Text, { dimColor: true, children: ["  ", t('btw-pane-hint')] })] }), _jsxs(ScrollBox, { ref: setHandle, flexDirection: "column", flexGrow: 1, flexShrink: 1, stickyScroll: true, children: [_jsx(MessageList, { rows: thread.rows, expanded: expanded, expandedRows: expandedRows, selectedId: null, onToggleRow: toggleRow, model: "DeepSeek", showAll: true, onToggleAll: () => { }, scrollHandle: handle }), thread.working && _jsx(Text, { color: "remember", children: t('btw-working') })] }), _jsxs(Box, { borderStyle: "round", borderColor: "permission", paddingX: 1, flexShrink: 0, children: [_jsx(Text, { color: "permission", children: "\u276F " }), _jsx(Text, { children: draft }), _jsx(Text, { color: "subtle", children: draft === '' ? t('btw-placeholder') : '' })] })] }));
}
