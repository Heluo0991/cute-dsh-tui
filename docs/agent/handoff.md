# V2 runtime-boundary handoff

Date: 2026-08-17
Branch: `refactor/runtime-boundary`

## Status

Step 4 (interactive v2 session operations) is complete: implemented, committed,
automated tests pass, and real TTY acceptance is done.

## Branch map

- v2 development: `refactor/runtime-boundary`
- v1 maintenance: `personal/customization`
- The v2 branch was created from `personal/customization` (`72da7de`).

When v1 maintenance has moved forward and v2 work resumes:

```bash
git switch refactor/runtime-boundary
git merge personal/customization
```

## Step 3 background

Step 3 established the experimental read-only session-event projection:

- `src/sessionEventProjection.ts`
- `src/experimentalNotificationBuffer.ts`
- `src/experimentalProjection.tsx` (read-only at that point)
- `--experimental-v2` launcher flag; default v1 path unchanged.

## What changed in Step 4

- `src/core-client.ts`:
  - added `onRequest()` so the TUI client can answer core-initiated JSON-RPC requests
- `src/experimentalCoreClient.ts` (new):
  - typed TUI-client facade for `session/prompt`, `session/cancel`, approvals, user questions, session operations, model/preset/permission actions
  - `onApprovalRequest()` / `onUserQuestion()` convenience handlers
- `src/core-bridge.ts`:
  - added interactive RPC methods: `session/new`, `session/resume`, `session/list`, `session/rewind`, `model/list`, `model/switch`, `preset/list`, `preset/switch`, `permission/list`, `permission/switch`
  - forwards DSH `approval/request` and `userQuestions.ask` to the TUI client
  - applies agent-preset composition on create/resume/rewind/model-switch so preset tools such as `ask_user_question` are mounted
- `src/experimentalProjection.tsx`:
  - upgraded from read-only projection to an interactive v2 TUI
  - supports prompts, cancellation, approval panel, question panel, pickers, and slash commands
- Verification scripts and fixtures:
  - `scripts/verify-core-client-request-handler.mjs`
  - `scripts/verify-core-bridge-interactive.mjs`
  - `scripts/verify-v2-client-methods.mjs`
  - `scripts/fixtures/fake-core-request.mjs`
  - `scripts/fixtures/fake-core-interactive.mjs`
- Docs:
  - `docs/agent/current.md`
  - `docs/agent/module-map.md`
  - `docs/architecture/v2-runtime-boundary.md`
  - `TODO.md`

## Verification performed

- `tsc -p tsconfig.json` passes.
- `pnpm verify:core-client-request-handler` passes.
- `pnpm verify:core-bridge-interactive` passes.
- `pnpm verify:v2-client-methods` passes.
- `pnpm verify:launcher` passes.
- `pnpm verify:package-exports` passes.
- `git diff --check` passes.
- Real TTY acceptance is complete:
  - `--experimental-v2` starts and shows the interactive v2 TUI
  - replays existing session events
  - sends prompts and appends live notifications
  - cancels
  - answers approval requests with the approval panel
  - answers `ask_user_question` with the interactive question panel
  - performs session/model/preset/permission actions
  - exits cleanly and reaps the core child

## Known limitations before v2 promotion

- The experimental TUI is a simplified front end; it does not yet have full v1 UI parity (full Markdown/tool-card rendering, status line, themes, i18n, advanced scrolling/virtualization).
- `--experimental-v2` still needs provider/model to be supplied (for example via `CUTE_DSH_TUI_CORE_PROVIDER` / `CUTE_DSH_TUI_CORE_MODEL`) unless later model-route resolution is wired into the bridge.
- Default launcher remains v1.

## Next step

Continue with `TODO.md`:

- Step 5: move DSH dependencies out of the published TUI package; managed-runtime installation becomes the fallback only.
- Step 6: pass real-TTY, Windows ConPTY, resume, uninstall, and cross-version compatibility tests before promoting v2.
- Step 7: decide when to switch the default launcher to v2 (only after feature parity).

Keep all new v2 methods behind the explicit experimental path; do not change the default v1 launcher.
