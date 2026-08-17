#!/usr/bin/env node
/**
 * Print the live repository facts needed for an agent handoff. This script is
 * deliberately read-only: it never fetches, mutates Git state, or contacts a
 * registry.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const json = process.argv.includes('--json')

function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return undefined
  }
}

function packageInfo() {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'))
  return {
    packageVersion: pkg.version,
    lockVersion: lock.version,
    lockRootVersion: lock.packages?.['']?.version,
  }
}

const branch = git(['branch', '--show-current']) ?? '(detached)'
const head = git(['rev-parse', '--short', 'HEAD']) ?? '(unknown)'
const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'])
const counts = upstream === undefined
  ? undefined
  : git(['rev-list', '--left-right', '--count', `${upstream}...HEAD`])
const [behind, ahead] = counts?.split(/\s+/).map(Number) ?? []
const dirtyEntries = (git(['status', '--porcelain']) ?? '').split('\n').filter(Boolean)
const version = packageInfo()
const latestTag = git(['describe', '--tags', '--abbrev=0']) ?? '(no reachable tag)'

const status = {
  branch,
  head,
  upstream: upstream ?? '(none)',
  ahead: Number.isFinite(ahead) ? ahead : undefined,
  behind: Number.isFinite(behind) ? behind : undefined,
  worktree: dirtyEntries.length === 0 ? 'clean' : 'dirty',
  changedPaths: dirtyEntries.length,
  latestTag,
  ...version,
  packageVersionMatchesLock:
    version.packageVersion === version.lockVersion
    && version.packageVersion === version.lockRootVersion,
}

if (json) {
  process.stdout.write(`${JSON.stringify(status, null, 2)}\n`)
} else {
  process.stdout.write([
    'CuteDshTui agent status',
    `branch: ${status.branch}`,
    `HEAD: ${status.head}`,
    `upstream: ${status.upstream}`,
    `ahead/behind: ${status.ahead ?? '?'} / ${status.behind ?? '?'}`,
    `worktree: ${status.worktree}${status.worktree === 'dirty' ? ` (${status.changedPaths} paths)` : ''}`,
    `package version: ${status.packageVersion}`,
    `package-lock versions: ${status.lockVersion} / ${status.lockRootVersion ?? '(missing root package)'}`,
    `version consistency: ${status.packageVersionMatchesLock ? 'ok' : 'MISMATCH'}`,
    `latest local tag: ${status.latestTag}`,
  ].join('\n') + '\n')
}
