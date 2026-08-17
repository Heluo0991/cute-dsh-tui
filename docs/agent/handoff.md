# V2 runtime-boundary handoff

Date: 2026-08-17
Branch: `refactor/runtime-boundary`

## Status

Step 3 (experimental read-only session-event projection) is complete: implemented, committed, automated tests pass, and real TTY acceptance is done.

Commits:

- `feat: add experimental v2 read-only session projection`
- `docs: mark v2 read-only projection committed in TODO`
- `docs: add v2 runtime-boundary handoff report`
- `test: include status notifications in session event client projection`
- `docs: mark v2 verification complete and refresh handoff`
- `docs: clarify experimental flag is CuteDshTui launcher option, not official dsh flag`
- `fix: auto-detect dev checkout and pass --expose-internals for experimental core`
- `fix: buffer notifications emitted during session/open and add regression test`
- `fix: always repair dev profile link and pass --expose-internals to all DSH children`

## What changed

- Added `--experimental-v2` launcher flag; default v1 launch path is unchanged.
- Added `src/sessionEventProjection.ts`:
  - bounded client-side session-event projector
  - no DSH or React dependency
  - handles user/assistant/tool/status events
  - coalesces streaming chunks without per-token React updates
- Added `src/experimentalNotificationBuffer.ts`:
  - installs the client notification listener before `session/open`
  - buffers in-flight notifications so core events emitted during open are not lost
  - suppresses duplicates already present in the `session/open` response snapshot
- Added `src/experimentalProjection.tsx`:
  - experimental read-only TUI client
  - launches core bridge through `CoreClient`
  - opens/resumes a session, replays initial events, subscribes to live notifications
  - does not send prompts
- Added tests and fixtures:
  - `scripts/verify-session-event-projection.ts`
  - `scripts/verify-session-event-client.ts`
  - `scripts/verify-session-open-buffer.ts`
  - `scripts/fixtures/fake-core-events.ts`
- Updated docs:
  - `docs/agent/current.md`
  - `docs/agent/module-map.md`
  - `docs/architecture/v2-runtime-boundary.md`
- Added `TODO.md` for the remaining v2 work.

## Verification performed

- `tsc -p tsconfig.json` passes.
- `pnpm verify:session-event-projection` passes.
- `pnpm verify:session-event-client` passes.
- `pnpm verify:session-open-buffer` passes.
- `pnpm verify:core-protocol` passes.
- `pnpm verify:core-client` passes.
- `pnpm verify:core-bridge` passes.
- `pnpm verify:launcher` passes.
- `git diff --check` passes.
- Real TTY launch on Windows with `node bin\dsh-tui.js --experimental-v2` succeeds and shows the read-only projection header.
- Real TTY acceptance is complete: replay, live notifications, read-only behavior, and clean `q` exit with core child reaping all confirmed.
- v1 launcher starts normally on Windows after reinstalling `node_modules` natively.

## Windows native note

- The Windows native `node_modules` reinstall is complete (`pnpm install`, `pnpm rebuild node-pty`); `sharp`, `koffi`, and `node-pty` now have win32 binaries available.

## Remaining before next feature work

None for step 3. Real TTY acceptance is complete:

- replaying existing session events (`--continue` / `--resume <session-id>`)
- appending live notifications during an active session
- pressing `q` exits cleanly and reaps the core child

## Next step

Continue with `TODO.md` -> migration step 4:

- prompt
- cancellation
- approvals
- user questions
- session operations
- model/preset/permission actions

Keep all new v2 methods behind the explicit experimental path; do not change the default v1 launcher.
