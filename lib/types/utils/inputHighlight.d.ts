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
/**
 * Hard-wrap text into visual rows of at most `width` display columns,
 * mirroring PromptInput's old `wrapToWidth` exactly while also returning the
 * source range each row covers.
 */
export declare function wrapToWidthRanges(text: string, width: number): WrappedInputLine[];
//# sourceMappingURL=inputHighlight.d.ts.map