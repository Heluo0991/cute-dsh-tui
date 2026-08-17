# Current maintenance state

Run `pnpm agent:status` before relying on any Git, version, tag, or remote
state. Do not write commit hashes or package versions into this file.

## Active work

The `refactor/runtime-boundary` branch is establishing v2's out-of-process
core/TUI split. The initial JSON-RPC line transport is isolated in
`src/core-protocol.ts`; it is not called by the v1 launcher. Continue with the
bridge process and experimental read-only event projection, preserving v1 as
the default until feature parity is verified. See
`docs/architecture/v2-runtime-boundary.md`.

## Manual follow-up

- In a real TTY, verify `/btw <question>` while the main agent is occupied by
  a command that runs for roughly 30 seconds. The headless regression covers
  dispatch and view deferral, but not this live terminal acceptance case.

## Documentation migration

`docs/pending-issues.md` remains a preserved historical handoff. New current
work belongs here; keep the pending-issues file focused on backlog/history and
do not update its old Git snapshot as if it were live state.
