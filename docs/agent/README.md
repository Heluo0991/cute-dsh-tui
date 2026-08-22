# Agent maintenance guide

This is the maintained entry point for coding agents. It complements the user
documentation and does not replace the code, tests, or DSH session log as a
source of truth.

## Reading protocol

1. Run `pnpm agent:status` for branch, worktree, package version, lockfile
   version, latest local tag, and ahead/behind state.
2. Read `current.md` for active work and manual verification still outstanding.
3. Read the matching row in `module-map.md`, then inspect the entry file,
   direct dependencies, and focused tests named there.
4. Read `invariants.md` before touching a high-risk surface.

Expand the reading scope only when the task requires it. The code and focused
tests win when this guide is stale; repair the guide in the same change when a
long-lived fact changes.

## Source of truth by subject

| Subject | Source of truth |
| --- | --- |
| Runtime behavior | `src/`, DSH service contracts, focused regressions |
| Conversation history | Durable DSH session events, not React state |
| Current branch/version/tag state | `pnpm agent:status` / Git |
| Open maintenance work | `current.md`; consult `docs/pending-issues.md` only for historical context |
| Release preparation | `release-local.md` and `docs/release-checklist.md` |
| Historical rationale and prior fixes | `docs/pending-issues.md`, Git history |

## Project boundary

CuteDshTui owns the launcher, Cordis profile overlay, TUI, event projection,
preferences, packaged skills, and terminal renderer. DeepSeek Harness owns
the Agent, tools, model execution, session persistence, credentials, and
permission services. The package runs the user's locally-installed DSH kernel
(resolved from `PATH`, or pinned via `CUTE_DSH_TUI_DSH_BIN`) and creates an
isolated `cute-dsh-tui` profile under `DSH_HOME`; the profile plugin resolves
its DSH runtime packages from that same kernel through the profile-boot heal
step, so DSH-scoped packages are declared as optional peer dependencies rather
than shipped. It shares DSH sessions and credentials only when both launches
use the same `DSH_HOME`.

Because the runtime kernel is the caller's local install, upstream
compatibility is an explicit maintenance concern: the DSH-scoped peer ranges
must track the kernel version the TUI is validated against.
