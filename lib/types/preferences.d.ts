export declare const LEGACY_PREFERENCES_DIR: string;
export declare const PREFERENCES_DIR: string;
/**
 * Copy the former dsh-TUI preferences once, without modifying the old data.
 * DSH session JSONL data deliberately stays under $DSH_HOME/sessions and is
 * therefore not part of this migration.
 */
export declare function migrateLegacyPreferences({ legacyDir, preferencesDir, }?: {
    legacyDir?: string;
    preferencesDir?: string;
}): boolean;
//# sourceMappingURL=preferences.d.ts.map