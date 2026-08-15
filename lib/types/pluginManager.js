import { readFileSync } from 'node:fs';
import { join } from 'node:path';
export function parsePluginAction(input) {
    const [verb, ...rest] = input.trim().split(/\s+/).filter(Boolean);
    if (verb === 'add' && rest.length === 1)
        return { verb, target: rest[0] };
    if (verb === 'remove' && rest.length === 1)
        return { verb, target: rest[0] };
    if (verb === 'update' && rest.length <= 1)
        return rest[0] ? { verb, target: rest[0] } : { verb };
    return undefined;
}
export function pluginArgs(action) {
    return [action.verb, ...(action.target === undefined ? [] : [action.target])];
}
/** Read the profile manifest only; this is intentionally not an npm registry search. */
export function profileDependencies(profile) {
    if (profile === undefined)
        return [];
    const home = process.env.DSH_HOME?.trim() || join(process.env.USERPROFILE || process.env.HOME || '', '.dsh');
    try {
        const raw = JSON.parse(readFileSync(join(home, 'profiles', profile, 'package.json'), 'utf8'));
        if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
            return [];
        const deps = raw.dependencies;
        return deps !== null && typeof deps === 'object' && !Array.isArray(deps)
            ? Object.keys(deps).sort()
            : [];
    }
    catch {
        return [];
    }
}
