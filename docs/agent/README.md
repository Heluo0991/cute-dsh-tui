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
permission services. The package ships a pinned DSH dependency baseline and
creates an isolated `cute-dsh-tui` profile under `DSH_HOME`; it shares DSH
sessions and credentials only when both launches use the same `DSH_HOME`.

The package does not automatically follow a caller's globally installed DSH
version. Upstream compatibility is an explicit maintenance concern.
