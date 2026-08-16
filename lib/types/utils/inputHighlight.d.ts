/**
 * Semantic input highlighting for PromptInput.
 *
 * The tokenizer is deliberately small and width-aware: it only classifies
 * slash commands, their arguments, and `@` file mentions. Rendering code in
 * PromptInput consumes character ranges (UTF-16 indices, matching the
 * editor's cursor arithmetic) and maps them back onto width-wrapped visual
 * rows so CJK and emoji keep the exact same layout as the plain-text path.
 */
import type { LocalCommand } from '../commands.js';
export type InputTokenKind = 'text' | 'command' | 'command-unknown' | 'argument' | 'mention';
export interface InputToken {
    /** Start offset in the source string (UTF-16 code units). */
    start: number;
    /** End offset in the source string (exclusive). */
    end: number;
    text: string;
    kind: InputTokenKind;
}
/** One hard-wrapped visual row plus the source range it represents. */
export interface WrappedInputLine {
    text: string;
    start: number;
    end: number;
}
/**
 * Classify a prompt value into contiguous semantic tokens.
 *
 * Slash classification only inspects the first logical line; the overlay and
 * dispatcher share that contract (multi-line slash input is ordinary text).
 * `@` mentions are recognized anywhere and win over slash argument coloring.
 */
export declare function tokenizePromptInput(value: string, commands: readonly LocalCommand[]): InputToken[];
/** Where the caret sits in the wrapped layout (row index + display column). */
export interface VisualCursorPosition {
    line: number;
    column: number;
}
/**
 * Caret position in visual-row space. Uses the same wrapToWidthRanges
 * projection as the renderer, so soft-wrapped long lines count as distinct
 * rows and CJK characters count as two columns.
 */
export declare function visualCursorPosition(value: string, cursor: number, width: number): VisualCursorPosition;
/**
 * Map a visual column back to the UTF-16 caret offset inside one wrapped
 * row. Wide characters are atomic: a target column that would land inside
 * one returns the offset before it, never a mid-glyph cursor.
 */
export declare function cursorAtVisualColumn(line: WrappedInputLine, column: number): number;
/** Direction for visual-row caret movement. */
export type VerticalCursorDirection = 'up' | 'down';
/**
 * Move the caret to the nearest visual row above/below, preserving the
 * current display column. Returns the new caret and whether the requested
 * edge was already reached (the caller then falls back to history/overlay
 * navigation — only the first/last visual row leaves the input).
 */
export declare function moveCursorVertically(value: string, cursor: number, width: number, direction: VerticalCursorDirection): {
    cursor: number;
    atEdge: boolean;
};
/**
 * Hard-wrap text into visual rows of at most `width` display columns,
 * mirroring PromptInput's old `wrapToWidth` exactly while also returning the
 * source range each row covers.
 */
export declare function wrapToWidthRanges(text: string, width: number): WrappedInputLine[];
//# sourceMappingURL=inputHighlight.d.ts.map