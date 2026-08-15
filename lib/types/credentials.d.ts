/** Whether this application, rather than an inherited environment, owns a saved key. */
export declare function hasSavedApiKey(): boolean;
/**
 * Persist a key only after an explicit UI confirmation. Windows uses its
 * user-level environment; macOS/Linux keep a mode-600 app-private file that
 * `cdsh` loads. The caller must also set process.env for immediate use.
 */
export declare function saveApiKey(key: string): boolean;
/** Remove only credentials previously saved through CuteDshTui. */
export declare function clearSavedApiKey(): boolean;
//# sourceMappingURL=credentials.d.ts.map