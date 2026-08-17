# V2 runtime-boundary handoff

Date: 2026-08-17
Branch: `refactor/runtime-boundary`

## Status

Experimental read-only session-event projection is implemented and committed locally.

Commits:

- `feat: add experimental v2 read-only session projection`
- `docs: mark v2 read-only projection committed in TODO`
- `docs: add v2 runtime-boundary handoff report`
- `test: include status notifications in session event client projection`

## What changed

- Added `--experimental-v2` launcher flag; default v1 launch path is unchanged.
- Added `src/sessionEventProjection.ts`:
  - bounded client-side session-event projector
  - no DSH or React dependency
  - handles user/assistant/tool/status events
  - coalesces streaming chunks without per-token React updates
- Added `src/experimentalProjection.tsx`:
  - experimental read-only TUI client
  - launches core bridge through `CoreClient`
  - opens/resumes a session, replays initial events, subscribes to live notifications
  - does not send prompts
- Added tests and fixtures:
  - `scripts/verify-session-event-projection.ts`
  - `scripts/verify-session-event-client.ts`
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
- `pnpm verify:core-protocol` passes.
- `pnpm verify:core-client` passes.
- `pnpm verify:core-bridge` passes.
- `pnpm verify:launcher` passes.
- `git diff --check` passes.

## Remaining before next feature work

- Run `cute-dsh-tui --experimental-v2` or `cdsh --experimental-v2` in a real TTY and confirm replay, live notifications, read-only behavior, and clean exit.

## Next step

Continue with `TODO.md` -> migration step 4:

- prompt
- cancellation
- approvals
- user questions
- session operations
- model/preset/permission actions

Keep all new v2 methods behind the explicit experimental path; do not change the default v1 launcher.
