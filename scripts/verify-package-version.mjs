#!/usr/bin/env node
/** Verify the release-version fields that agents may update locally. */
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'))
const root = lock.packages?.['']
const failures = []

if (typeof pkg.version !== 'string' || pkg.version.length === 0) {
  failures.push('package.json has no non-empty version')
}
if (lock.version !== pkg.version) {
  failures.push(`package-lock.json version ${String(lock.version)} does not match package.json ${String(pkg.version)}`)
}
if (root?.version !== pkg.version) {
  failures.push(`package-lock.json packages[\"\"].version ${String(root?.version)} does not match package.json ${String(pkg.version)}`)
}

if (failures.length > 0) {
  for (const failure of failures) process.stderr.write(`verify-package-version: ${failure}\n`)
  process.exit(1)
}

process.stdout.write(`verify-package-version: ${pkg.version} is synchronized\n`)
