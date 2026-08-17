# Current maintenance state

Run `pnpm agent:status` before relying on any Git, version, tag, or remote
state. Do not write commit hashes or package versions into this file.

## Active work

The `refactor/runtime-boundary` branch is establishing v2's out-of-process
core/TUI split. The transport, session-event bridge, explicit child-process
client, and the experimental session projection are isolated in
`src/core-protocol.ts`, `src/core-bridge.ts`, `src/core-client.ts`,
`src/sessionEventProjection.ts`, `src/experimentalNotificationBuffer.ts`, and
`src/experimentalProjection.tsx`; none is called by the default v1 launcher.
The notification listener is installed before `session/open` and buffers
in-flight events to prevent loss. The experimental projection is reachable
only through `cute-dsh-tui --experimental-v2` / `cdsh --experimental-v2`
(not the official `dsh` binary) and preserves v1 as the default until feature
parity is verified. The bridge has a real-DSH
temporary-profile smoke test; the Windows development-profile link repair is
separately verified. The Windows native `node_modules` reinstall is complete, and the v1 launcher
starts normally on Windows. Step 4's first increment is in progress: a typed
TUI-client facade (`src/experimentalCoreClient.ts`), client request handling
for core-initiated approvals/questions, and the interactive core-bridge RPC
methods (`session/new`, `session/resume`, `session/list`, `session/rewind`,
`model/*`, `preset/*`, `permission/*`) are implemented behind the explicit
experimental path. The experimental TUI screen now uses the typed client
facade: it can send prompts, cancel, answer approval/question requests, and
run session/model/preset/permission commands interactively. Real-TTY
acceptance for this interactive v2 path is complete. See
`docs/architecture/v2-runtime-boundary.md`. The next-step checklist is in
`TODO.md`.

## Manual follow-up

- In a real TTY, verify `/btw <question>` while the main agent is occupied by
  a command that runs for roughly 30 seconds. The headless regression covers
  dispatch and view deferral, but not this live terminal acceptance case.
- In a real TTY, `cute-dsh-tui --experimental-v2` / `cdsh --experimental-v2`
  is fully accepted: starts, replays existing session events, appends live
  notifications, sends prompts, cancels, answers approvals/questions, performs
  session/model/preset/permission actions, and exits cleanly while reaping the
  core child. The read-only acceptance is complete; the interactive acceptance is also complete.

## Documentation migration

`docs/pending-issues.md` remains a preserved historical handoff. New current
work belongs here; keep the pending-issues file focused on backlog/history and
do not update its old Git snapshot as if it were live state.
