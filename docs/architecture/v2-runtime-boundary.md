# V2 runtime boundary

V1 runs the Cordis TUI plugin and DeepSeek Harness in one Node.js process. Its package dependency graph therefore contains both CuteDshTui's React renderer and the Harness UI dependencies. V2 separates them into a TUI client process and a core process connected only by newline-delimited JSON-RPC on stdio.

The default v1 launch path remains unchanged until the v2 path reaches feature parity. The `refactor/runtime-boundary` branch contains isolated, reversible increments; each increment must retain a passing v1 build and focused regression checks. The read-only experimental projection is reachable through `--experimental-v2`, never through the default path.

## Ownership

| Process | Owns | Must not import |
| --- | --- | --- |
| TUI client | terminal renderer, React, TUI preferences, key handling, display projection | `@deepseek-ai/dsh-*`, Cordis, WeiUI |
| Core bridge | DSH/Cordis composition, agent lifecycle, credentials, persistence, tools, approvals | React, TUI renderer, terminal escape handling |
| Launcher | locate a compatible core, provision a separately stored fallback runtime, spawn and reap processes | agent/session implementation |

`DSH_HOME` remains the user-owned state root. The core receives the caller's value unchanged, so an existing user keeps credentials and JSONL sessions. CuteDshTui-owned preferences remain under `~/.cute-dsh-tui`. A managed fallback runtime is installed outside both the global npm package and the DSH profile, under a CuteDshTui-owned runtime cache.

## Wire requirements

`src/core-protocol.ts` supplies the transport primitive. It is dependency-free except for Node.js built-ins and is not reachable from the default v1 launcher. The bridge protocol must provide an explicit version handshake, request/response correlation, server notifications, timeout/EOF handling, and no stdout output other than protocol frames.

Full DSH session-event envelopes cross the wire; React rows remain a replayable, bounded client-side projection. The wire must not transport rendered rows or import DSH event classes into the TUI package.

The official Harness main branch has an SDK JSON-RPC server with matching event semantics, but its server package is not currently published on npm. V2 therefore keeps an adapter seam: use the official server when a published compatible runtime is found, otherwise run CuteDshTui's versioned bridge against its managed DSH runtime. ACP is not a substitute because it intentionally omits session replay, tool activity, reasoning, plans, titles, and interactive state.

## Migration order

1. Transport and handshake primitives, with no v1 behavior change.
2. Separate core bridge process that creates/attaches sessions and streams durable events. `src/core-bridge.ts` and `core-bridge.patch.yml` are the initial server; the default launcher does not select them, while the experimental projection does.
3. Read-only TUI projection through the client transport, behind an explicit experimental launcher mode. Implemented by `src/sessionEventProjection.ts` and `src/experimentalProjection.tsx` under `--experimental-v2`; `src/core-client.ts` owns only explicit child launch, handshake, protocol transport, stderr tailing, and bounded reaping.
4. Prompt, cancellation, approval, questions, session operations, and model/preset/permission actions.
5. Move DSH dependencies out of the published TUI package and make managed-runtime installation the fallback only.
6. Promote after real-TTY, Windows ConPTY, resume, uninstall, and cross-version compatibility tests pass.

No stage may silently fall back from an incompatible external core to a different core for an existing session. Compatibility is checked before a session opens and reported on stderr.

`verify-core-bridge-dsh.ts` exercises the current bridge against the bundled DSH runtime through a newly created temporary `DSH_HOME`; it creates no model request and removes the complete temporary profile afterwards. `verify-session-event-projection.ts` exercises the bounded client-side projection with raw JSON envelopes, and `verify-session-event-client.ts` exercises the same projection through the explicit `CoreClient` transport with a fake core.
