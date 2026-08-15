export type PluginAction = {
    verb: 'add';
    target: string;
} | {
    verb: 'remove';
    target: string;
} | {
    verb: 'update';
    target?: string;
};
export declare function parsePluginAction(input: string): PluginAction | undefined;
export declare function pluginArgs(action: PluginAction): string[];
/** Read the profile manifest only; this is intentionally not an npm registry search. */
export declare function profileDependencies(profile: string | undefined): string[];
//# sourceMappingURL=pluginManager.d.ts.map