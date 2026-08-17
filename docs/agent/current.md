# Current maintenance state

Run `pnpm agent:status` before relying on any Git, version, tag, or remote
state. Do not write commit hashes or package versions into this file.

## Active work

The `refactor/runtime-boundary` branch is establishing v2's out-of-process
core/TUI split. The transport, session-event bridge, explicit child-process
client, and read-only session-event projection are isolated in
`src/core-protocol.ts`, `src/core-bridge.ts`, `src/core-client.ts`,
`src/sessionEventProjection.ts`, and `src/experimentalProjection.tsx`; none is
called by the default v1 launcher. The experimental projection is reachable
only through `cute-dsh-tui --experimental-v2` / `cdsh --experimental-v2`
(not the official `dsh` binary) and preserves v1 as the default until feature
parity is verified. The bridge has a real-DSH
temporary-profile smoke test; the Windows development-profile link repair is
separately verified. The next v2 increment is prompt/cancellation/approval and
the remaining interactive session operations. See
`docs/architecture/v2-runtime-boundary.md`. The next-step checklist is in
`TODO.md`.

## Manual follow-up

- In a real TTY, verify `/btw <question>` while the main agent is occupied by
  a command that runs for roughly 30 seconds. The headless regression covers
  dispatch and view deferral, but not this live terminal acceptance case.
- In a real TTY, `cute-dsh-tui --experimental-v2` / `cdsh --experimental-v2`
  now starts successfully and shows the read-only projection header. Still
  confirm replaying existing session events, appending live notifications, and
  clean `q` exit.

## Documentation migration

`docs/pending-issues.md` remains a preserved historical handoff. New current
work belongs here; keep the pending-issues file focused on backlog/history and
do not update its old Git snapshot as if it were live state.
