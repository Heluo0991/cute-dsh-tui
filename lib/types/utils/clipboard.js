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
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
const PS_SCRIPT = [
    "$ErrorActionPreference='SilentlyContinue'",
    '[Console]::OutputEncoding=[System.Text.Encoding]::UTF8',
    '$files=$null',
    'try { $files = Get-Clipboard -Format FileDropList -ErrorAction Stop } catch {}',
    'if($files){foreach($f in $files){Write-Output ("FILE:"+$f.FullName)}}',
    'if(-not $files){$t=Get-Clipboard -Raw; if($null -ne $t){Write-Output ("TEXT64:"+[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($t)))}}',
].join('; ');
/**
 * Read the Windows clipboard: file paths when Explorer copied files,
 * otherwise the plain text. Returns null when the clipboard holds neither.
 * Clipboard access is retried — another process (e.g. Explorer) briefly
 * holding the clipboard open makes OpenClipboard fail with a transient
 * error.
 *
 * @returns `{ kind: 'files'; paths: string[] }` for file drops,
 *   `{ kind: 'text'; text: string }` for text, or null when empty/blocked.
 */
function readWindowsClipboard() {
    return new Promise(resolve => {
        let attempts = 0;
        const attempt = () => {
            attempts += 1;
            const child = execFile('powershell', ['-NoProfile', '-NonInteractive', '-Command', PS_SCRIPT], { encoding: 'utf8', windowsHide: true, timeout: 3000 }, (error, stdout) => {
                if (error) {
                    if (attempts < 3) {
                        // Transient clipboard lock — retry shortly.
                        setTimeout(attempt, 150);
                        return;
                    }
                    resolve(null);
                    return;
                }
                const files = [];
                const texts = [];
                for (const line of stdout.split(/\r?\n/)) {
                    if (line.startsWith('FILE:'))
                        files.push(line.slice(5));
                    else if (line.startsWith('TEXT64:')) {
                        texts.push(Buffer.from(line.slice(7), 'base64').toString('utf8'));
                    }
                }
                if (files.length > 0)
                    resolve({ kind: 'files', paths: files });
                else if (texts.length > 0)
                    resolve({ kind: 'text', text: texts.join('\n') });
                else
                    resolve(null);
            });
            // The app must never be held hostage by a stuck PowerShell.
            child.unref();
        };
        attempt();
    });
}
/** One POSIX clipboard command; stdout-only adapters return text. */
function readTextClipboard(command, args = []) {
    return new Promise(resolve => {
        const child = execFile(command, [...args], { encoding: 'utf8', timeout: 3000, maxBuffer: 1024 * 1024 }, (error, stdout) => {
            if (error !== null || stdout.length === 0) {
                resolve(null);
                return;
            }
            resolve({ kind: 'text', text: stdout.replace(/\r\n/g, '\n').replace(/\r/g, '\n') });
        });
        child.unref();
    });
}
async function readLinuxClipboard() {
    if (existsSync('/usr/bin/wl-paste') || existsSync('/usr/local/bin/wl-paste')) {
        const text = await readTextClipboard('wl-paste', ['--no-newline']);
        if (text !== null)
            return text;
    }
    for (const command of ['xclip', 'xsel']) {
        if (!existsSync(`/usr/bin/${command}`) && !existsSync(`/usr/local/bin/${command}`))
            continue;
        const args = command === 'xclip'
            ? ['-selection', 'clipboard', '-o']
            : ['--clipboard', '--output'];
        const text = await readTextClipboard(command, args);
        if (text !== null)
            return text;
    }
    return null;
}
/**
 * Read the platform clipboard as text (plus file paths on Windows Explorer
 * file drops). Returns null when empty, blocked, or no adapter is installed.
 */
export function readClipboard() {
    if (process.platform === 'win32')
        return readWindowsClipboard();
    if (process.platform === 'darwin')
        return readTextClipboard('pbpaste');
    return readLinuxClipboard();
}
/**
 * Render pasted clipboard content for insertion into the prompt: file paths
 * quoted when they contain whitespace, joined with single spaces.
 * @param content - Clipboard content as read by {@link readClipboard}.
 * @returns The prompt-ready text: quoted, space-joined paths, or the text
 *   with line endings normalized.
 */
export function formatClipboardInsert(content) {
    if (content.kind === 'files') {
        return content.paths
            .map(path => (/\s/.test(path) ? `"${path}"` : path))
            .join(' ');
    }
    return content.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
