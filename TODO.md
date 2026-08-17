# V2 runtime-boundary TODO

Current branch: `refactor/runtime-boundary`
Status: experimental read-only session-event projection is implemented and committed locally.

## Immediate handoff checks

- [x] Run `pnpm verify:session-event-projection`
- [x] Run `pnpm verify:session-event-client`
- [x] Run `pnpm verify:core-protocol`
- [x] Run `pnpm verify:core-client`
- [x] Run `pnpm verify:core-bridge`
- [x] Run `pnpm verify:launcher`
- [x] In a real TTY launch `cute-dsh-tui --experimental-v2` or `cdsh --experimental-v2` successfully
  - [x] TUI starts and shows the read-only projection header
  - [ ] replays existing session events
  - [ ] appends live notifications
  - [x] does not send prompts
  - [ ] `q` exits cleanly and reaps the core child

## Next implementation: v2 interactive session operations (migration step 4)

- [ ] Design and add TUI-client methods for:
  - [ ] `session/prompt`
  - [ ] `session/cancel`
  - [ ] approvals
  - [ ] user questions
  - [ ] session operations (new/resume/list/rewind?)
  - [ ] model/preset/permission actions
- [ ] Keep every new method behind the explicit experimental path; do not change v1 default launch.
- [ ] Add focused verify scripts for each new method using fake core / bridge regressions.
- [ ] Update `docs/agent/current.md`, `docs/agent/module-map.md`, and `docs/architecture/v2-runtime-boundary.md` after each increment.

## Later steps

- [ ] Move DSH dependencies out of the published TUI package; managed-runtime installation becomes the fallback only.
- [ ] Pass real-TTY, Windows ConPTY, resume, uninstall, and cross-version compatibility tests before promoting v2.
- [ ] Decide when to switch the default launcher to v2 (only after feature parity).

## Housekeeping

- [x] Commit the current experimental read-only projection work when the user authorizes it.
- [ ] Keep `lib/types/` build artifacts in sync after every `src/` change.
