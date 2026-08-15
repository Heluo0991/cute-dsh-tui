import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const DIRECTORY = join(homedir(), '.cute-dsh-tui');
const WINDOWS_MARKER_FILE = join(DIRECTORY, 'credential-source.json');
/** Whether this application, rather than an inherited environment, owns a saved key. */
export function hasSavedApiKey() {
    return process.platform === 'win32' && existsSync(WINDOWS_MARKER_FILE);
}
function ensureDirectory() {
    mkdirSync(DIRECTORY, { recursive: true, mode: 0o700 });
}
/**
 * Persist a key only after an explicit UI confirmation. Windows uses its
 * user-level environment; macOS/Linux keep a mode-600 app-private file that
 * `cdsh` loads. The caller must also set process.env for immediate use.
 */
export function saveApiKey(key) {
    if (key.trim() === '')
        return false;
    try {
        ensureDirectory();
        if (process.platform === 'win32') {
            const result = spawnSync('setx.exe', ['DEEPSEEK_API_KEY', key], {
                stdio: 'ignore',
                windowsHide: true,
            });
            if (result.error !== undefined || result.status !== 0)
                return false;
            writeFileSync(WINDOWS_MARKER_FILE, `${JSON.stringify({ source: 'windows-user-environment' })}\n`, {
                encoding: 'utf8',
                mode: 0o600,
            });
            return true;
        }
        // macOS/Linux persistence is delegated to DSH's credential provider.
        // It writes its owner-only store and makes a change visible to the active
        // LLM adapter without injecting a second secret into process.env.
        return true;
    }
    catch {
        return false;
    }
}
/** Remove only credentials previously saved through CuteDshTui. */
export function clearSavedApiKey() {
    try {
        if (process.platform === 'win32') {
            if (!existsSync(WINDOWS_MARKER_FILE))
                return true;
            const result = spawnSync('reg.exe', ['delete', 'HKCU\\Environment', '/v', 'DEEPSEEK_API_KEY', '/f'], {
                stdio: 'ignore',
                windowsHide: true,
            });
            // Exit 1 also means the value is already absent, which is the desired end state.
            if (result.error !== undefined)
                return false;
            rmSync(WINDOWS_MARKER_FILE, { force: true });
            return true;
        }
        // The DSH provider performs the actual POSIX credential deletion.
        return true;
    }
    catch {
        return false;
    }
}
