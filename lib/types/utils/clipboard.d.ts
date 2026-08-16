/**
 * Clipboard access for Ctrl+V paste. The TUI runs in raw mode, so the
 * console never performs its own paste for Ctrl+V — the key arrives at the
 * app and the clipboard is read here.
 *
 * - Windows: PowerShell `Get-Clipboard`; file drops (Explorer copy) insert
 *   paths, anything else comes back as text. Text is base64-encoded on the
 *   PowerShell side so the line-oriented stdout parse survives multi-line
 *   clipboard content; CJK survives because base64 is pure ASCII.
 * - macOS: `pbpaste` (text only).
 * - Linux: `wl-paste`, then `xclip`, then `xsel` (text only). On WSL the
 *   Linux tools are tried first; native terminal paste (Ctrl+Shift+V or
 *   right-click) remains the universal fallback when no adapter exists.
 */
export type ClipboardContent = {
    kind: 'files';
    paths: string[];
} | {
    kind: 'text';
    text: string;
} | null;
/**
 * Read the platform clipboard as text (plus file paths on Windows Explorer
 * file drops). Returns null when empty, blocked, or no adapter is installed.
 */
export declare function readClipboard(): Promise<ClipboardContent>;
/**
 * Render pasted clipboard content for insertion into the prompt: file paths
 * quoted when they contain whitespace, joined with single spaces.
 * @param content - Clipboard content as read by {@link readClipboard}.
 * @returns The prompt-ready text: quoted, space-joined paths, or the text
 *   with line endings normalized.
 */
export declare function formatClipboardInsert(content: {
    kind: 'files';
    paths: string[];
} | {
    kind: 'text';
    text: string;
}): string;
//# sourceMappingURL=clipboard.d.ts.map