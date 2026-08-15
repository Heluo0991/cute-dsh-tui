import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, ScrollBox, Text } from '../ui.js';
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
    return (_jsxs(Box, { flexDirection: "column", flexGrow: 1, width: "100%", children: [_jsxs(Pane, { color: "permission", children: [_jsx(Text, { color: "remember", bold: true, children: "BTW \u00B7 side conversation" }), _jsx(Text, { dimColor: true, children: "  Forked context \u00B7 main conversation is unchanged \u00B7 Esc returns \u00B7 Ctrl+C stops \u00B7 Ctrl+O details" })] }), _jsxs(ScrollBox, { ref: setHandle, flexDirection: "column", flexGrow: 1, flexShrink: 1, stickyScroll: true, children: [_jsx(MessageList, { rows: thread.rows, expanded: expanded, expandedRows: expandedRows, selectedId: null, onToggleRow: toggleRow, model: "DeepSeek", showAll: true, onToggleAll: () => { }, scrollHandle: handle }), thread.working && _jsx(Text, { color: "remember", children: "Working in side conversation\u2026" })] }), _jsxs(Box, { borderStyle: "round", borderColor: "permission", paddingX: 1, flexShrink: 0, children: [_jsx(Text, { color: "permission", children: "\u276F " }), _jsx(Text, { children: draft }), _jsx(Text, { color: "subtle", children: draft === '' ? 'Ask a follow-up…' : '' })] })] }));
}
