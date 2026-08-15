import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
export const LEGACY_PREFERENCES_DIR = join(homedir(), '.dsh-cc');
export const PREFERENCES_DIR = join(homedir(), '.cute-dsh-tui');
const PREFERENCE_FILES = [
    'theme.json',
    'model.json',
    'agent-preset.json',
    'lang.json',
    'effort.json',
    'working-activity.json',
    'history.jsonl',
    'resume.txt',
    'last-used.json',
];
/**
 * Copy the former dsh-TUI preferences once, without modifying the old data.
 * DSH session JSONL data deliberately stays under $DSH_HOME/sessions and is
 * therefore not part of this migration.
 */
export function migrateLegacyPreferences({ legacyDir = LEGACY_PREFERENCES_DIR, preferencesDir = PREFERENCES_DIR, } = {}) {
    if (existsSync(preferencesDir) || !existsSync(legacyDir))
        return false;
    try {
        mkdirSync(preferencesDir);
        for (const file of PREFERENCE_FILES) {
            const source = join(legacyDir, file);
            if (existsSync(source) && lstatSync(source).isFile()) {
                copyFileSync(source, join(preferencesDir, file));
            }
        }
        const legacyThemes = join(legacyDir, 'themes');
        if (existsSync(legacyThemes) && lstatSync(legacyThemes).isDirectory()) {
            const themesDir = join(preferencesDir, 'themes');
            mkdirSync(themesDir);
            for (const entry of readdirSync(legacyThemes, { withFileTypes: true })) {
                if (entry.isFile())
                    copyFileSync(join(legacyThemes, entry.name), join(themesDir, entry.name));
            }
        }
        return true;
    }
    catch {
        // Preferences are best-effort. A later preference write can still create
        // the new directory; never block the TUI because migration was unavailable.
        return false;
    }
}
