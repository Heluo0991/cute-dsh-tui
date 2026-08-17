# CuteDshTui agent entry point

This repository is a single-package ESM TypeScript terminal UI for DeepSeek
Harness. The TUI is a profile plugin with a bundled, pinned DSH runtime; it
does not use a caller's `dsh` executable, but it may share the caller's
`DSH_HOME` state.

## Start here

1. Run `pnpm agent:status`.
2. Read `docs/agent/README.md` and `docs/agent/current.md`.
3. Use `docs/agent/module-map.md` to locate the task surface, then read only
   the relevant source, direct dependencies, and focused regression scripts.

Do not enumerate or read the entire repository merely to become familiar with
it. `docs/pending-issues.md` is a historical handoff snapshot, not current
Git or release state.

## Safety and delivery

- Treat `src/channel.ts`, `src/ink/`, `src/native-ts/yoga-layout/`, and
  `cordis.patch.yml` as high-risk surfaces; read their listed invariants first.
- Never run `pnpm install` from WSL against this Windows-backed checkout.
- Edit `src/`, never `lib/types/`; run `pnpm build` and commit the generated
  `lib/types/` output after a source change.
- Stage explicit paths only. Never discard unrelated work.
- A user-authorized completed task may end in a local Git commit. Never push,
  create a tag, publish to npm, or create a remote release unless explicitly
  asked in that task.
- For release preparation, follow `docs/agent/release-local.md` exactly.
