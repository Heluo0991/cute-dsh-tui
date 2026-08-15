import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export type PluginAction =
  | { verb: 'add'; target: string }
  | { verb: 'remove'; target: string }
  | { verb: 'update'; target?: string }

export function parsePluginAction(input: string): PluginAction | undefined {
  const [verb, ...rest] = input.trim().split(/\s+/).filter(Boolean)
  if (verb === 'add' && rest.length === 1) return { verb, target: rest[0]! }
  if (verb === 'remove' && rest.length === 1) return { verb, target: rest[0]! }
  if (verb === 'update' && rest.length <= 1) return rest[0] ? { verb, target: rest[0] } : { verb }
  return undefined
}

export function pluginArgs(action: PluginAction): string[] {
  return [action.verb, ...(action.target === undefined ? [] : [action.target])]
}

/** Read the profile manifest only; this is intentionally not an npm registry search. */
export function profileDependencies(profile: string | undefined): string[] {
  if (profile === undefined) return []
  const home = process.env.DSH_HOME?.trim() || join(process.env.USERPROFILE || process.env.HOME || '', '.dsh')
  try {
    const raw: unknown = JSON.parse(readFileSync(join(home, 'profiles', profile, 'package.json'), 'utf8'))
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return []
    const deps = (raw as { dependencies?: unknown }).dependencies
    return deps !== null && typeof deps === 'object' && !Array.isArray(deps)
      ? Object.keys(deps as Record<string, unknown>).sort()
      : []
  } catch {
    return []
  }
}
