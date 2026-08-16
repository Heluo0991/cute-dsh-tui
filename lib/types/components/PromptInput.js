import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { t } from '../i18n.js';
import { Box, Text, useAnimationFrame, useInput, useTerminalSize } from '../ui.js';
import { useDeclaredCursor } from '../ink/hooks/use-declared-cursor.js';
import { stringWidth } from '../ink/stringWidth.js';
import { formatClipboardInsert, readClipboard } from '../utils/clipboard.js';
import { canAcceptCommandSuggestion, filterCommands, parseCommandName } from '../commands.js';
import { appendHistory } from '../history.js';
import { mentionAtCaret } from '../utils/mentions.js';
import { moveCursorVertically, tokenizePromptInput, wrapToWidthRanges, } from '../utils/inputHighlight.js';
import { CommandSuggestions } from './CommandSuggestions.js';
import { FileSuggestions } from './FileSuggestions.js';
import { HelpMenu } from './HelpMenu.js';
import { modelSwitchBorderColors } from './modelSwitchGlow.js';
const HISTORY_LIMIT = 50;
/** Index of the word boundary at or before `cursor` (readline alt+b). */
function wordBoundaryLeft(text, cursor) {
    let index = cursor;
    while (index > 0 && /\s/.test(text[index - 1]))
        index--;
    while (index > 0 && !/\s/.test(text[index - 1]))
        index--;
    return index;
}
/** Index of the word boundary after `cursor` (readline alt+f). */
function wordBoundaryRight(text, cursor) {
    const length = text.length;
    let index = cursor;
    while (index < length && !/\s/.test(text[index]))
        index++;
    while (index < length && /\s/.test(text[index]))
        index++;
    return index;
}
/**
 * The empty input deliberately shows NO placeholder text: terminal emulators
 * paint the IME preedit (pinyin) at the physical cursor, which the app parks
 * on the caret's cell, and the app receives no input events while a
 * composition is active (Windows Terminal suppresses key events during TSF
 * composition) — so it can never hide a placeholder in time. Keeping the row
 * blank while empty is what guarantees the preedit has nothing to overlay.
 */
/** Max input rows before the visible viewport starts scrolling (CC's
 *  maxVisibleLines behavior — the box keeps a stable height). */
const MAX_VISIBLE_LINES = 5;
/** Theme colors for the input tokenizer. No new theme keys are required. */
const HIGHLIGHT_STYLES = {
    text: {},
    command: { color: 'suggestion', bold: true },
    'command-unknown': { color: 'warning' },
    argument: { color: 'inactiveShimmer' },
    mention: { color: 'professionalBlue' },
};
/** The source ranges of one visual row that overlap the token list. */
function spansForLine(line, tokens) {
    const spans = [];
    for (const token of tokens) {
        const start = Math.max(token.start, line.start);
        const end = Math.min(token.end, line.end);
        if (end <= start)
            continue;
        spans.push({ start, end, kind: token.kind });
    }
    return spans;
}
/**
 * Render one highlighted visual row. The caret row additionally inverts the
 * single character at `caret`, or renders a trailing inverse blank when the
 * caret sits at the row end (the old plain-text renderer's exact contract).
 */
function renderHighlightedLine(value, line, tokens, caret) {
    const nodes = [];
    const spans = spansForLine(line, tokens);
    for (const span of spans) {
        let position = span.start;
        const style = HIGHLIGHT_STYLES[span.kind];
        if (caret !== null && caret >= position && caret < span.end) {
            if (position < caret) {
                nodes.push(_jsx(Text, { color: style.color, bold: style.bold, children: value.slice(position, caret) }, `${position}-before`));
            }
            const caretEnd = Math.min(caret + 1, span.end);
            nodes.push(_jsx(Text, { color: style.color, bold: style.bold, inverse: true, children: value.slice(caret, caretEnd) }, `${caret}-caret`));
            position = caretEnd;
        }
        if (position < span.end) {
            nodes.push(_jsx(Text, { color: style.color, bold: style.bold, children: value.slice(position, span.end) }, `${position}-after`));
        }
    }
    if (caret !== null && caret >= line.end) {
        nodes.push(_jsx(Text, { inverse: true, children: " " }, `${line.end}-trailing-caret`));
    }
    return nodes;
}
/**
 * Claude Code style prompt input: rounded border box (top+bottom borders
 * only), `❯ ` prompt char (dimmed while a turn is working), the text with a
 * block cursor at the cursor position, and below it the slash-command
 * suggestion overlay (name column + description, selected row in the
 * `suggestion` color — ported from the leak's PromptInputFooterSuggestions).
 *
 * Empty input: a solid block caret on a blank cell and nothing else — no
 * placeholder text, so the terminal-painted IME preedit (pinyin) at the
 * parked cursor can never be overlaid on anything.
 *
 * Multi-line: Shift+Enter inserts a newline; ↑/↓ move between lines while
 * the input spans multiple lines (history/command selection otherwise); the
 * visible window scrolls to keep the caret row on screen past
 * MAX_VISIBLE_LINES. Enter submits, backspace/delete edit, ←/→ move the
 * cursor, Tab completes the selected command, Escape clears (or closes the
 * help menu), `?` toggles the help menu. Windows ConPTY pipelines deliver
 * whole lines with the Enter key lost: a trailing CR/LF in the input marks
 * a complete line to submit.
 *
 * Enter submits immediately even while the model is streaming — as a STEER
 * (Codex/pi semantics): the message is injected at the next step boundary
 * of the running turn and the agent continues without aborting; Tab instead
 * queues the message for after the turn (followup). Both appear in a
 * pending preview above the input until delivered. Alt+Up pulls the last
 * pending message back for editing; Esc (with pending messages while
 * working) interrupts the turn and delivers them right away; Ctrl+Enter
 * aborts the turn and sends the current input immediately.
 */
export function PromptInput({ channel, helpOpen, onToggleHelp, onRunCommand, selectionActive, fillText, onFillConsumed, onRewindRequest, onCyclePermission, controllerRef, modelSwitching = false, active = true, }) {
    const [value, setValue] = React.useState('');
    const [cursor, setCursor] = React.useState(0);
    // Publish the live controller (fresh closure over `value` every render).
    // clear() mirrors the double-tap-Esc clear: text + caret reset.
    React.useEffect(() => {
        if (!controllerRef)
            return;
        controllerRef.current = {
            hasText: () => value.length > 0,
            clear: () => {
                setValue('');
                setCursor(0);
            },
        };
        return () => {
            controllerRef.current = null;
        };
    });
    const [selectedCommand, setSelectedCommand] = React.useState(0);
    const history = React.useRef([]);
    const historyIndex = React.useRef(-1);
    // ctrl+r history fill: replace the input when a new fill arrives, then
    // tell the caller to clear it.
    const lastFill = React.useRef(null);
    React.useEffect(() => {
        if (fillText && fillText !== lastFill.current) {
            lastFill.current = fillText;
            setValue(fillText);
            setCursor(fillText.length);
            onFillConsumed?.();
        }
    }, [fillText, onFillConsumed]);
    // Double-tap Esc to clear (CC semantics).
    const escPendingRef = React.useRef(false);
    const escTimerRef = React.useRef(null);
    /** True while a Ctrl+V clipboard read is in flight (ignore repeat keys). */
    const clipboardBusyRef = React.useRef(false);
    /** Enter dedupe window: cmd pipelines can deliver one Enter as `\r`+`\n`. */
    const lastEnterAtRef = React.useRef(0);
    React.useEffect(() => {
        return () => {
            if (escTimerRef.current)
                clearTimeout(escTimerRef.current);
        };
    }, []);
    const { columns } = useTerminalSize();
    // The renderer hard-wraps the prompt at this width; vertical caret movement
    // uses the same projection so soft-wrapped rows behave like physical rows.
    const inputWidth = Math.max(10, columns - 3);
    // Subscribe only during an eligible model switch. Once the request settles,
    // the prompt no longer receives animation frames.
    const [glowRef, glowTime] = useAnimationFrame(modelSwitching ? 60 : null);
    const switchBorderColors = modelSwitching ? modelSwitchBorderColors(glowTime) : null;
    const suggestions = value.startsWith('/')
        ? filterCommands(value, channel.commandList)
        : [];
    const overlayOpen = suggestions.length > 0 &&
        !helpOpen &&
        !selectionActive &&
        !value.includes('\n');
    // `@` file completion (issue #15): the trigger is the mention token at the
    // CARET, so `@` works mid-message (`看看 @src/a.ts 这个`), not only when it
    // is the input's first character. The cwd listing loads when the trigger
    // appears.
    const [fileList, setFileList] = React.useState([]);
    const [fileSelected, setFileSelected] = React.useState(0);
    const fileRequest = React.useRef(0);
    const mention = mentionAtCaret(value, cursor);
    const atTrigger = mention !== undefined;
    React.useEffect(() => {
        const request = ++fileRequest.current;
        if (!atTrigger)
            return;
        void channel.listFiles().then(list => {
            // Fast typing can close/reopen the mention trigger before an earlier
            // directory walk settles; only the latest request may populate the menu.
            if (request === fileRequest.current)
                setFileList(list);
        });
    }, [atTrigger, channel]);
    const atRest = (mention?.query ?? '').toLowerCase();
    // Match the relative path prefix OR the basename (CC's IDE suggestions do
    // both): `@src/ink` and `@ink` both find `src/ink/Box.js`.
    const fileMatches = atTrigger
        ? fileList
            .filter(file => {
            const lower = file.toLowerCase();
            if (lower.startsWith(atRest))
                return true;
            if (atRest.includes('/'))
                return false;
            const base = lower.split('/').pop() ?? '';
            return base.startsWith(atRest);
        })
            .sort((a, b) => {
            const dirOrder = Number(b.endsWith('/')) - Number(a.endsWith('/'));
            if (dirOrder !== 0)
                return dirOrder;
            const aBase = (a.split('/').pop() ?? a).toLowerCase();
            const bBase = (b.split('/').pop() ?? b).toLowerCase();
            return aBase < bBase ? -1 : aBase > bBase ? 1 : 0;
        })
        : [];
    // Esc dismisses the overlay for the token being edited (it reopens once the
    // text changes); it must NOT clear a mid-message input.
    const fileEscRef = React.useRef(-1);
    React.useEffect(() => {
        fileEscRef.current = -1;
    }, [value]);
    const fileOverlayOpen = fileMatches.length > 0 &&
        !helpOpen &&
        !selectionActive &&
        fileEscRef.current !== mention?.start;
    /**
     * Accept the selected file suggestion: replace ONLY the mention token at
     * the caret (prefix/suffix text survives), quoting whitespace paths. A
     * directory inserts `@dir/` without a trailing space so completion
     * continues into it; a file completes the token with a space.
     */
    const acceptFile = (file) => {
        if (!mention)
            return;
        const body = /\s/.test(file) ? `@"${file}"` : `@${file}`;
        const insert = file.endsWith('/') ? body : `${body} `;
        const next = value.slice(0, mention.start) + insert + value.slice(mention.end);
        setInput(next, mention.start + insert.length);
        setFileSelected(0);
    };
    const submitText = (text, notice) => {
        const trimmed = text.trim();
        if (!trimmed)
            return;
        history.current.push(trimmed);
        if (history.current.length > HISTORY_LIMIT)
            history.current.shift();
        historyIndex.current = -1;
        setValue('');
        setCursor(0);
        setSelectedCommand(0);
        appendHistory(trimmed);
        channel.submit(trimmed);
        if (notice) {
            channel.notify(notice, { timeoutMs: 2500 });
        }
        else if (channel.working) {
            // While the model is streaming, the message joins the DSH inbox and is
            // processed after the current turn — say so, or it looks "lost".
            channel.notify(t('input-sent-after-turn'), { timeoutMs: 2500 });
        }
    };
    /**
     * Enter while the model is working = STEER (Codex/pi semantics): the
     * message is injected at the next step boundary of the RUNNING turn and
     * the agent continues without aborting — the "immediate" send.
     */
    const steerSend = (text) => {
        const trimmed = text.trim();
        if (!trimmed)
            return;
        history.current.push(trimmed);
        if (history.current.length > HISTORY_LIMIT)
            history.current.shift();
        historyIndex.current = -1;
        setValue('');
        setCursor(0);
        setSelectedCommand(0);
        appendHistory(trimmed);
        channel.steer(trimmed);
        channel.notify(t('input-interrupted-next'), { timeoutMs: 2500 });
    };
    /**
     * Tab while the model is working = plain queue (followup): the message
     * waits for the running turn to end, then is processed in order.
     */
    const queueSend = (text) => {
        const trimmed = text.trim();
        if (!trimmed)
            return;
        history.current.push(trimmed);
        if (history.current.length > HISTORY_LIMIT)
            history.current.shift();
        historyIndex.current = -1;
        setValue('');
        setCursor(0);
        setSelectedCommand(0);
        appendHistory(trimmed);
        channel.submit(trimmed);
        channel.notify(t('input-queued-after-turn'), { timeoutMs: 2500 });
    };
    /**
     * Alt+Up: pull the last pending message back into the input for editing
     * (never interrupts the running turn). Refused when the running dsh-agent
     * cannot withdraw inbox messages (released package without the inbox API).
     */
    const pullBackLast = () => {
        const item = channel.pending[channel.pending.length - 1];
        if (!item)
            return;
        if (!channel.removePending(item.id)) {
            channel.notify(t('input-cannot-retract'), { color: 'warning', timeoutMs: 2500 });
            return;
        }
        setValue(item.text);
        setCursor(item.text.length);
        setSelectedCommand(0);
        setFileSelected(0);
        channel.notify(t('input-retracted'), { timeoutMs: 2000 });
    };
    /**
     * Ctrl+Enter: abort the running turn and send the input immediately — the
     * model stops what it is doing and starts on this message right away.
     */
    const interruptSend = () => {
        const trimmed = value.trim();
        if (!trimmed) {
            channel.notify(t('input-empty'), { color: 'warning' });
            return;
        }
        // Abort the running turn and deliver: previously queued pending
        // messages first (FIFO), then the current input — all processed
        // immediately once the abort settles.
        const count = channel.interruptAndDeliver([...channel.pending.map(item => item.text), value]);
        if (count === 0)
            return;
        history.current.push(trimmed);
        if (history.current.length > HISTORY_LIMIT)
            history.current.shift();
        historyIndex.current = -1;
        setValue('');
        setCursor(0);
        setSelectedCommand(0);
        setFileSelected(0);
        appendHistory(trimmed);
        channel.notify(t('input-interrupt-immediate'), { timeoutMs: 2500 });
    };
    /**
     * Execute a slash command (built-in or plugin-registered) when the input
     * resolves to one: the name parses as the first token so `/plan off`
     * dispatches `plan` with its argument text, and the merged command list
     * (locals + registry) decides whether the line is a command at all.
     */
    const tryRunCommand = (text) => {
        if (!text.startsWith('/'))
            return false;
        const parsed = parseCommandName(text);
        if (parsed === undefined)
            return false;
        const known = channel.commandList.some(command => command.name === parsed.name);
        if (!known)
            return false;
        const handled = onRunCommand(parsed.name, parsed.rawInput);
        if (handled) {
            history.current.push(text.trim());
            if (history.current.length > HISTORY_LIMIT)
                history.current.shift();
            historyIndex.current = -1;
            setValue('');
            setCursor(0);
            setSelectedCommand(0);
            appendHistory(text.trim());
        }
        return handled;
    };
    const setInput = (next, cursorOffset = next.length) => {
        setValue(next);
        setCursor(Math.max(0, Math.min(cursorOffset, next.length)));
    };
    useInput((input, key, event) => {
        if (selectionActive || !active)
            return;
        /** Insert text at the caret (typing, paste) and dismiss overlays. */
        const insertAtCaret = (text) => {
            if (helpOpen)
                onToggleHelp();
            const next = value.slice(0, cursor) + text + value.slice(cursor);
            setValue(next);
            setCursor(cursor + text.length);
            setSelectedCommand(0);
            setFileSelected(0);
        };
        // Bracketed paste (terminal paste — Ctrl+Shift+V / right-click): insert
        // verbatim at the caret. Paste content may contain newlines — that is
        // NOT Enter — so this branch runs before the whole-line submit rule.
        if (event?.isPasted && input.length > 0) {
            insertAtCaret(input.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));
            return;
        }
        // Ctrl+V: raw mode hands the key to the app, so the clipboard is read
        // here — text, or file paths when Explorer copied files (pasted files
        // insert their paths).
        if (key.ctrl && input === 'v') {
            if (clipboardBusyRef.current)
                return;
            clipboardBusyRef.current = true;
            void readClipboard().then(content => {
                clipboardBusyRef.current = false;
                if (content === null) {
                    channel.notify(t('input-clipboard-empty'), { color: 'warning' });
                    return;
                }
                insertAtCaret(formatClipboardInsert(content));
            });
            return;
        }
        /**
         * Unified Enter semantics (both the parsed `return` key and the raw
         * CR/LF line from Windows cmd pipelines):
         * - command menu open → run the SELECTED command (never send `/mo`);
         * - slash command (e.g. `/btw …`) → dispatch FIRST, even while a turn
         *   is running; only non-command text is steered;
         * - model working + plain text → STEER into the running turn (next step
         *   boundary, agent continues — the "immediate" send);
         * - otherwise → submit directly (or run a unique command).
         */
        const handleEnter = () => {
            // A single Enter can arrive as two events in cmd pipelines (`\r`
            // parsed as return + a raw `\n` line): collapse them so one keypress
            // never sends the message twice.
            const now = Date.now();
            if (now - lastEnterAtRef.current < 80)
                return;
            lastEnterAtRef.current = now;
            if (overlayOpen) {
                const command = suggestions[selectedCommand];
                if (command && canAcceptCommandSuggestion(value, command)) {
                    tryRunCommand(`/${command.name}`);
                    return;
                }
            }
            // File-completion overlay open → Enter accepts the selection (same
            // contract as the command menu: the overlay owns Enter while open).
            if (fileOverlayOpen) {
                const file = fileMatches[fileSelected];
                if (file) {
                    acceptFile(file);
                    return;
                }
            }
            // Slash commands must keep working while a turn runs; only plain text
            // falls through to the working-turn steer path below.
            if (!tryRunCommand(value)) {
                if (channel.working && value.trim() !== '') {
                    steerSend(value);
                    return;
                }
                submitText(value);
            }
        };
        // Whole-line input from Windows ConPTY pipelines (cmd batch -> node):
        // the trailing CR/LF marks a complete line to submit. A bare Enter
        // arrives as `\r`/`\n`/`\r\n` — treat it as Enter, NOT a direct
        // submit. Only real multi-char piped lines keep the legacy
        // direct-submit path.
        if (input.includes('\n') || input.includes('\r')) {
            if (/^[\r\n]+$/.test(input)) {
                handleEnter();
                return;
            }
            const line = (value + input).trim();
            if (line.startsWith('/')) {
                const matches = filterCommands(line, channel.commandList);
                if (matches.length === 1 && canAcceptCommandSuggestion(line, matches[0])) {
                    tryRunCommand(`/${matches[0].name}`);
                    return;
                }
            }
            if (!tryRunCommand(line))
                submitText(line);
            return;
        }
        if (key.return && key.ctrl) {
            // Ctrl+Enter: interrupt the running turn and process this message
            // immediately (Windows Terminal sends CSI 13;5u / 13;1;5u).
            interruptSend();
            return;
        }
        if (key.return && key.shift) {
            // Insert a newline at the caret (multi-line input).
            const next = value.slice(0, cursor) + '\n' + value.slice(cursor);
            setValue(next);
            setCursor(cursor + 1);
            setSelectedCommand(0);
            return;
        }
        if (key.return) {
            handleEnter();
            return;
        }
        // Shift+Tab cycles the session permission preset. It must precede the
        // plain-Tab arms — the parser reports backtab as key.tab + key.shift.
        if (key.tab && key.shift) {
            onCyclePermission?.();
            return;
        }
        if (key.tab && fileOverlayOpen) {
            const file = fileMatches[fileSelected];
            if (file)
                acceptFile(file);
            return;
        }
        if (key.tab && overlayOpen) {
            const command = suggestions[selectedCommand];
            if (command)
                setInput(`/${command.name} `);
            return;
        }
        // Tab while the model is working = queue for AFTER the turn (followup),
        // distinct from Enter's steer (Codex's "tab to queue message").
        if (key.tab && channel.working && value.trim() !== '') {
            queueSend(value);
            return;
        }
        if (key.meta && key.upArrow) {
            // Alt+Up: pull the last pending message back for editing (pi/Codex).
            pullBackLast();
            return;
        }
        if (key.upArrow) {
            if (fileOverlayOpen) {
                setFileSelected(index => index <= 0 ? fileMatches.length - 1 : index - 1);
                return;
            }
            const vertical = moveCursorVertically(value, cursor, inputWidth, 'up');
            if (!vertical.atEdge) {
                setCursor(vertical.cursor);
                return;
            }
            if (overlayOpen) {
                setSelectedCommand(index => index <= 0 ? suggestions.length - 1 : index - 1);
                return;
            }
            if (history.current.length === 0)
                return;
            historyIndex.current = historyIndex.current < 0
                ? history.current.length - 1
                : Math.max(0, historyIndex.current - 1);
            const entry = history.current[historyIndex.current] ?? '';
            setValue(entry);
            setCursor(entry.length);
            return;
        }
        if (key.downArrow) {
            if (fileOverlayOpen) {
                setFileSelected(index => index >= fileMatches.length - 1 ? 0 : index + 1);
                return;
            }
            const vertical = moveCursorVertically(value, cursor, inputWidth, 'down');
            if (!vertical.atEdge) {
                setCursor(vertical.cursor);
                return;
            }
            if (overlayOpen) {
                setSelectedCommand(index => index >= suggestions.length - 1 ? 0 : index + 1);
                return;
            }
            if (historyIndex.current < 0)
                return;
            historyIndex.current += 1;
            const entry = historyIndex.current >= history.current.length
                ? ''
                : (history.current[historyIndex.current] ?? '');
            setValue(entry);
            setCursor(entry.length);
            return;
        }
        if (key.leftArrow) {
            setCursor(previous => Math.max(0, previous - 1));
            return;
        }
        if (key.rightArrow) {
            setCursor(previous => Math.min(value.length, previous + 1));
            return;
        }
        if ((key.ctrl || key.meta) && key.leftArrow) {
            // Jump to the previous word boundary (readline alt+b).
            setCursor(previous => wordBoundaryLeft(value, previous));
            return;
        }
        if ((key.ctrl || key.meta) && key.rightArrow) {
            // Jump to the next word boundary (readline alt+f).
            setCursor(previous => wordBoundaryRight(value, previous));
            return;
        }
        if (key.backspace && key.ctrl) {
            // Delete the word before the caret, including its leading whitespace
            // run (readline/CC convention).
            if (cursor === 0)
                return;
            const before = value.slice(0, cursor);
            let end = before.length;
            while (end > 0 && /\s/.test(before[end - 1]))
                end--;
            let start = end;
            while (start > 0 && !/\s/.test(before[start - 1]))
                start--;
            setValue(value.slice(0, start) + value.slice(cursor));
            setCursor(start);
            return;
        }
        if (key.delete && key.ctrl) {
            // Delete the word after the caret, including its trailing whitespace.
            if (cursor >= value.length)
                return;
            const after = value.slice(cursor);
            let end = 0;
            while (end < after.length && !/\s/.test(after[end]))
                end++;
            while (end < after.length && /\s/.test(after[end]))
                end++;
            setValue(value.slice(0, cursor) + after.slice(end));
            return;
        }
        if (key.backspace) {
            if (cursor === 0)
                return;
            setValue(value.slice(0, cursor - 1) + value.slice(cursor));
            setCursor(cursor - 1);
            return;
        }
        if (key.delete) {
            if (cursor >= value.length)
                return;
            setValue(value.slice(0, cursor) + value.slice(cursor + 1));
            return;
        }
        if (key.home) {
            // Start of the current line.
            const lineStart = value.lastIndexOf('\n', cursor - 1) + 1;
            setCursor(lineStart);
            return;
        }
        if (key.end) {
            // End of the current line.
            const nextLine = value.indexOf('\n', cursor);
            setCursor(nextLine === -1 ? value.length : nextLine);
            return;
        }
        if (key.ctrl && input === 'a') {
            const lineStart = value.lastIndexOf('\n', cursor - 1) + 1;
            setCursor(lineStart);
            return;
        }
        if (key.ctrl && input === 'e') {
            const nextLine = value.indexOf('\n', cursor);
            setCursor(nextLine === -1 ? value.length : nextLine);
            return;
        }
        if (key.ctrl && input === 'u') {
            // Delete to start of line.
            const lineStart = value.lastIndexOf('\n', cursor - 1) + 1;
            setValue(value.slice(0, lineStart) + value.slice(cursor));
            setCursor(lineStart);
            return;
        }
        if (key.ctrl && input === 'k') {
            // Delete to end of line.
            const nextLine = value.indexOf('\n', cursor);
            const end = nextLine === -1 ? value.length : nextLine;
            setValue(value.slice(0, cursor) + value.slice(end));
            return;
        }
        if (key.ctrl && input === 'w') {
            // Delete the word before the cursor (CC/readline behavior): skip
            // trailing whitespace, then the whitespace-delimited word.
            const before = value.slice(0, cursor);
            let end = before.length;
            while (end > 0 && /\s/.test(before[end - 1]))
                end--;
            let start = end;
            while (start > 0 && !/\s/.test(before[start - 1]))
                start--;
            setValue(value.slice(0, start) + value.slice(cursor));
            setCursor(start);
            return;
        }
        if (key.escape) {
            if (helpOpen) {
                onToggleHelp();
                return;
            }
            // A single Esc closes the open command menu first (CC/pi behavior);
            // the double-tap-clear semantics only apply to ordinary input.
            if (overlayOpen) {
                setValue('');
                setCursor(0);
                setSelectedCommand(0);
                setFileSelected(0);
                return;
            }
            // File overlay: Esc dismisses the menu for THIS token only — clearing
            // the input would nuke a mid-message `@` mention's surrounding text.
            if (fileOverlayOpen) {
                fileEscRef.current = mention?.start ?? -1;
                return;
            }
            // With pending messages while working, Esc = interrupt and deliver
            // them right away (Codex's "interrupt and send immediately"): the
            // turn is aborted and each message is re-queued once it settles.
            if (channel.working && channel.pending.length > 0) {
                const count = channel.interruptAndDeliver(channel.pending.map(item => item.text));
                channel.notify(t('interrupt-delivered', { n: count }), {
                    timeoutMs: 2500,
                });
                return;
            }
            // A single Esc clears the current input (if any); the double-tap
            // path below handles rewind/clear on an already-empty input.
            if (value.length > 0) {
                setValue('');
                setCursor(0);
                setSelectedCommand(0);
                setFileSelected(0);
                return;
            }
            // Double-tap Esc: clear the input when it has content; when empty,
            // open the rewind picker (CC's "Double-tap esc to rewind the code
            // and/or conversation to a previous point in time").
            if (escPendingRef.current) {
                escPendingRef.current = false;
                if (escTimerRef.current)
                    clearTimeout(escTimerRef.current);
                if (value.length === 0) {
                    onRewindRequest?.();
                }
                else {
                    setValue('');
                    setCursor(0);
                }
                return;
            }
            escPendingRef.current = true;
            channel.notify(value.length === 0
                ? t('input-esc-again-rewind')
                : t('input-esc-again-clear'));
            escTimerRef.current = setTimeout(() => {
                escPendingRef.current = false;
            }, 3000);
            return;
        }
        if (input === '?' && value.length === 0) {
            onToggleHelp();
            return;
        }
        if (input && !key.ctrl && !key.meta && !key.tab && !key.escape) {
            // Typing anything else dismisses the help menu (CC behavior).
            if (helpOpen)
                onToggleHelp();
            const next = value.slice(0, cursor) + input + value.slice(cursor);
            setValue(next);
            setCursor(cursor + input.length);
            setSelectedCommand(0);
            setFileSelected(0);
        }
    });
    // === Render: hard-wrap every logical line at the input width, then show
    // the window of visual lines with the caret row always visible (CC's
    // maxVisibleLines behavior with automatic wrapping). Wrapping now returns
    // source ranges so semantic highlighting can be sliced per visual row.
    const visualLines = wrapToWidthRanges(value, inputWidth);
    const caretVisualLine = wrapToWidthRanges(value.slice(0, cursor), inputWidth).length - 1;
    const windowStart = Math.max(0, Math.min(caretVisualLine - MAX_VISIBLE_LINES + 1, visualLines.length - MAX_VISIBLE_LINES));
    const visibleLines = visualLines.slice(windowStart, windowStart + MAX_VISIBLE_LINES);
    const inputTokens = React.useMemo(() => tokenizePromptInput(value, channel.commandList), [value, channel.commandList]);
    // Visual column of the physical cursor declaration — CJK characters
    // occupy TWO terminal columns, so the raw char count would park the
    // cursor mid-character and Windows Terminal would paint the IME preedit
    // (pinyin) over the surrounding text.
    const caretVisualCol = () => {
        const before = value.slice(0, cursor);
        const rows = wrapToWidthRanges(before, inputWidth);
        const last = rows[rows.length - 1];
        return last === undefined ? 0 : stringWidth(last.text);
    };
    const rendered = visibleLines.map((line, index) => {
        const absoluteLine = windowStart + index;
        const caret = absoluteLine === caretVisualLine ? cursor : null;
        return (_jsx(Text, { wrap: "truncate-end", children: renderHighlightedLine(value, line, inputTokens, caret) }, absoluteLine));
    });
    const lastNotification = channel.notifications[channel.notifications.length - 1];
    // Park the native terminal cursor at the input caret (via the renderer's
    // cursor-declaration mechanism). Terminal emulators render IME preedit
    // text and screen-reader focus at the physical cursor, so parking it at
    // the caret makes CJK/IME composition appear inline at the input instead
    // of at the screen's bottom row; in line-mode terminals the console echo
    // of typed characters lands at the same spot. `line`/`column` are
    // relative to the value box the ref attaches to.
    const valueBoxRef = useDeclaredCursor({
        line: caretVisualLine - windowStart,
        column: caretVisualCol(),
        active: !selectionActive,
    });
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [lastNotification && (_jsx(Box, { position: "absolute", marginTop: -1, height: 1, width: "100%", paddingLeft: 2, paddingRight: 1, flexDirection: "column", justifyContent: "flex-end", overflow: "hidden", children: _jsx(Box, { justifyContent: "flex-end", children: _jsx(Text, { color: lastNotification.color, dimColor: !lastNotification.color, wrap: "truncate", children: lastNotification.text }) }) })), helpOpen && (_jsx(Box, { marginBottom: 1, children: _jsx(HelpMenu, { commands: channel.commandList }) })), channel.pending.length > 0 && (_jsxs(Box, { flexDirection: "column", paddingLeft: 2, paddingBottom: 1, children: [channel.pending.some(item => item.placement === 'steer') && (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { dimColor: true, children: ["\u26A1 ", t('input-pending-steer-label')] }), channel.pending
                                .filter(item => item.placement === 'steer')
                                .map(item => (_jsxs(Text, { dimColor: true, wrap: "truncate", children: ['  ', "\u21B3 ", item.text] }, item.id)))] })), channel.pending.some(item => item.placement === 'followup') && (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { dimColor: true, children: ["\u23F3 ", t('input-pending-queue-label')] }), channel.pending
                                .filter(item => item.placement === 'followup')
                                .map(item => (_jsxs(Text, { dimColor: true, wrap: "truncate", children: ['  ', "\u21B3 ", item.text] }, item.id)))] })), _jsxs(Text, { dimColor: true, children: ["Alt+\u2191 ", t('input-pending-actions-hint')] })] })), fileOverlayOpen && (_jsx(Box, { paddingLeft: 2, paddingBottom: 1, children: _jsx(FileSuggestions, { files: fileMatches, selectedIndex: fileSelected, columns: columns }) })), overlayOpen && (_jsx(Box, { paddingLeft: 2, paddingBottom: 1, children: _jsx(CommandSuggestions, { commands: suggestions, selectedIndex: selectedCommand, columns: columns, query: value }) })), _jsx(Box, { ref: glowRef, flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", borderColor: switchBorderColors?.top ?? 'promptBorder', borderTopColor: switchBorderColors?.top, borderRightColor: switchBorderColors?.right, borderBottomColor: switchBorderColors?.bottom, borderLeftColor: switchBorderColors?.left, borderStyle: "round", borderLeft: modelSwitching, borderRight: modelSwitching, borderBottom: true, width: "100%", children: _jsxs(Box, { flexDirection: "row", alignItems: "flex-start", width: "100%", children: [_jsx(Text, { dimColor: channel.working, children: "\u276F " }), _jsx(Box, { ref: valueBoxRef, flexGrow: 1, flexShrink: 1, children: value.length === 0 ? (_jsx(Text, { inverse: true, children: " " })) : (_jsx(Box, { flexDirection: "column", children: rendered })) })] }) })] }));
}
