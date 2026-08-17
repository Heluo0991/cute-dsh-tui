# High-risk invariants

## Session and Channel

- Durable DSH session events are the transcript source of truth. React rows
  are a bounded projection and must be reconstructable by replay.
- Match tool results to calls by `callId`; retain event sequence anchors for
  rewind and replay.
- Resume, rewind, new-session, and model switching replace an agent. Reset or
  replay every session-scoped projection together: rows, goals, todos, title,
  pending messages, metrics, permissions, and loaded context.
- Streaming events use the frame-coalesced emitter. Do not emit a React update
  synchronously for each token.

## Cordis and lifecycle

- Keep `src/index.ts` lightweight and preserve its lazy runtime import.
- Use existing DSH services and registries; do not reimplement Agent, session,
  tools, persistence, or permissions in components.
- A `cordis.patch.yml` config override replaces the complete target config.
  Preserve row IDs and ordering; use `insert` only for genuinely new services.
- Register resources through `ctx.effect`/`ctx.on` and preserve the exit funnel:
  context teardown unmounts the UI, while a user exit restores the terminal
  and then exits the process.

## Terminal and long-running behavior

- Width means terminal display cells, never JavaScript string length.
- Preserve bounded transcript/render/measurement caches and virtualization.
- Do not write diagnostics to stdout while the TUI is active; use the existing
  stderr debug paths.
- Any input, scroll, resize, mouse, cursor, or cleanup change needs both
  inline and fullscreen consideration, including Windows ConPTY behavior.

## Configuration and distribution

- `cordis.patch.yml` is the shipped profile composition. `cordis.yml` is a
  separate bare-composition example and must not silently drift when behavior
  it documents changes.
- `lib/types/` is generated and committed. Build after a `src/` change.
- `pnpm-lock.yaml` owns dependency resolution. `package-lock.json` must not
  receive incidental dependency-tree churn.
