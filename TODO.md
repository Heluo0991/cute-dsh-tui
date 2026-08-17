# V2 runtime-boundary TODO

Current branch: `refactor/runtime-boundary`
Status: step 4 (interactive v2 session operations) is complete, including real-TTY acceptance.

## Immediate handoff checks

- [x] Run `pnpm verify:session-event-projection`
- [x] Run `pnpm verify:session-event-client`
- [x] Run `pnpm verify:session-open-buffer`
- [x] Run `pnpm verify:core-protocol`
- [x] Run `pnpm verify:core-client`
- [x] Run `pnpm verify:core-bridge`
- [x] Run `pnpm verify:launcher`
- [x] If running Windows Node against a WSL-created `node_modules`, reinstall dependencies on Windows first (`pnpm install`, `pnpm rebuild node-pty`)
- [x] v1 launcher starts normally on Windows
- [x] In a real TTY launch `cute-dsh-tui --experimental-v2` or `cdsh --experimental-v2` successfully
  - [x] TUI starts and shows the read-only projection header
  - [x] replays existing session events
  - [x] appends live notifications
  - [x] does not send prompts
  - [x] `q` exits cleanly and reaps the core child

## Next implementation: v2 interactive session operations (migration step 4)

- [x] Design and add TUI-client methods for:
  - [x] `session/prompt`
  - [x] `session/cancel`
  - [x] approvals
  - [x] user questions
  - [x] session operations (new/resume/list/rewind)
  - [x] model/preset/permission actions
- [x] Keep every new method behind the explicit experimental path; do not change v1 default launch.
- [x] Add focused verify scripts for each new method using fake core / bridge regressions.
- [x] Update `docs/agent/current.md`, `docs/agent/module-map.md`, and `docs/architecture/v2-runtime-boundary.md` after each increment.

### Step 4 remaining (next increment)

- [x] Wire the typed client methods and approval/question request handlers into the experimental TUI screen so `--experimental-v2` can send prompts, cancel, answer approvals/questions, and perform session/model/preset/permission actions interactively.
- [x] Add real-TTY acceptance for the interactive v2 path.

## Later steps

- [ ] Move DSH dependencies out of the published TUI package; managed-runtime installation becomes the fallback only.
- [ ] Pass real-TTY, Windows ConPTY, resume, uninstall, and cross-version compatibility tests before promoting v2.
- [ ] Decide when to switch the default launcher to v2 (only after feature parity).

## Housekeeping

- [x] Commit the current experimental read-only projection work when the user authorizes it.
- [ ] Keep `lib/types/` build artifacts in sync after every `src/` change.
