import { extractMentions } from './mentions.js';
import { stringWidth } from '../ink/stringWidth.js';
function overlay(tokens, range, kind) {
    const next = [];
    for (const token of tokens) {
        if (token.end <= range.start || token.start >= range.end) {
            next.push(token);
            continue;
        }
        if (token.start < range.start) {
            next.push({
                start: token.start,
                end: range.start,
                text: token.text.slice(0, range.start - token.start),
                kind: token.kind,
            });
        }
        next.push({ start: range.start, end: range.end, text: range.text, kind });
        if (token.end > range.end) {
            next.push({
                start: range.end,
                end: token.end,
                text: token.text.slice(range.end - token.start),
                kind: token.kind,
            });
        }
    }
    return next;
}
function mergeAdjacent(tokens) {
    const merged = [];
    for (const token of tokens) {
        if (token.end <= token.start)
            continue;
        const previous = merged[merged.length - 1];
        if (previous !== undefined && previous.end === token.start && previous.kind === token.kind) {
            previous.end = token.end;
            previous.text += token.text;
            continue;
        }
        merged.push({ ...token });
    }
    return merged;
}
/**
 * Classify a prompt value into contiguous semantic tokens.
 *
 * Slash classification only inspects the first logical line; the overlay and
 * dispatcher share that contract (multi-line slash input is ordinary text).
 * `@` mentions are recognized anywhere and win over slash argument coloring.
 */
export function tokenizePromptInput(value, commands) {
    if (value.length === 0)
        return [];
    let tokens = [{ start: 0, end: value.length, text: value, kind: 'text' }];
    // `/name…` on the first line: highlight the full typed command token as
    // known when it is an exact command or a prefix of at least one command;
    // otherwise mark it unknown so a typo is visible before Enter.
    if (value.startsWith('/')) {
        const match = /^\/([a-zA-Z0-9_-]*)/.exec(value);
        if (match !== null && match[1] !== undefined) {
            const name = match[1];
            const lower = name.toLowerCase();
            const exact = commands.find(command => command.name.toLowerCase() === lower);
            const prefixMatches = commands.filter(command => command.name.toLowerCase().startsWith(lower));
            const known = exact !== undefined || prefixMatches.length > 0;
            const range = {
                start: 0,
                end: match[0].length,
                text: match[0],
                kind: known ? 'command' : 'command-unknown',
            };
            tokens = overlay(tokens, range, range.kind);
            // The remainder of the first line is argument text. For commands with
            // a subcommand table, the first argument is re-classified as command
            // when it matches a known child (`/plugin add`); the child overlay is
            // applied last so it wins over the argument range.
            const firstLineEnd = value.indexOf('\n');
            const firstLineLength = firstLineEnd === -1 ? value.length : firstLineEnd;
            if (firstLineLength > range.end) {
                tokens = overlay(tokens, {
                    start: range.end,
                    end: firstLineLength,
                    text: value.slice(range.end, firstLineLength),
                    kind: 'argument',
                }, 'argument');
            }
            if (firstLineLength > range.end && exact?.subcommands !== undefined) {
                const childMatch = /^\s+([a-zA-Z0-9_-]+)/.exec(value.slice(range.end, firstLineLength));
                if (childMatch !== null && childMatch[1] !== undefined) {
                    const child = exact.subcommands.find(entry => entry.name.toLowerCase() === childMatch[1].toLowerCase());
                    if (child !== undefined) {
                        const childStart = range.end + (childMatch.index ?? 0);
                        const childRange = {
                            start: childStart,
                            end: childStart + childMatch[0].length,
                            text: childMatch[0],
                            kind: 'command',
                        };
                        tokens = overlay(tokens, childRange, 'command');
                    }
                }
            }
        }
    }
    for (const mention of extractMentions(value)) {
        tokens = overlay(tokens, {
            start: mention.start,
            end: mention.end,
            text: value.slice(mention.start, mention.end),
            kind: 'mention',
        }, 'mention');
    }
    return mergeAdjacent(tokens);
}
/**
 * Hard-wrap text into visual rows of at most `width` display columns,
 * mirroring PromptInput's old `wrapToWidth` exactly while also returning the
 * source range each row covers.
 */
export function wrapToWidthRanges(text, width) {
    const rows = [];
    let sourceIndex = 0;
    const lines = text.split('\n');
    for (const rawLine of lines) {
        if (rawLine === '') {
            rows.push({ text: '', start: sourceIndex, end: sourceIndex });
            sourceIndex += 1;
            continue;
        }
        let current = '';
        let currentWidth = 0;
        let currentStart = sourceIndex;
        for (const ch of rawLine) {
            const charWidth = stringWidth(ch);
            if (currentWidth + charWidth > width && current !== '') {
                rows.push({ text: current, start: currentStart, end: sourceIndex });
                current = ch;
                currentWidth = charWidth;
                currentStart = sourceIndex;
            }
            else {
                current += ch;
                currentWidth += charWidth;
            }
            sourceIndex += ch.length;
        }
        rows.push({ text: current, start: currentStart, end: sourceIndex });
        sourceIndex += 1;
    }
    return rows;
}
