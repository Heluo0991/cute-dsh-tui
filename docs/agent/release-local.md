# Local release preparation

This repository's remote release is deliberately manual. An agent may prepare
the local release commit when asked, but it must not create a tag, push, or
publish to npm.

## Version-only preparation

When asked to prepare version `X.Y.Z`:

1. Update `package.json.version`.
2. Update only `package-lock.json.version` and
   `package-lock.json.packages[""].version` to the same value.
3. Do not modify `pnpm-lock.yaml` for a version-only release. Do not churn the
   `package-lock.json` dependency tree.
4. Run `pnpm verify:package-version`, `node scripts/verify-package-exports.mjs`,
   and `npm pack --dry-run`; run other focused checks required by the release.
5. Inspect `git diff --check`, staged paths, and `git status`, then create the
   requested local commit using explicit paths.

Report the version and commit SHA to the user. The user owns the later
`git tag vX.Y.Z`, push, and npm publication.

## Dependency preparation

When dependencies change, update `pnpm-lock.yaml` intentionally and inspect
the full lockfile diff. Update `package-lock.json` only if the task explicitly
includes npm-install compatibility. Run the package and profile checks that
cover the affected DSH integration.
