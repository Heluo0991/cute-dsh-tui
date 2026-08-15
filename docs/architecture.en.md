# Architecture and Limitations

[Documentation index](README.md) · [简体中文](architecture.md)

## Runtime path

```text
Cordis profile
  -> src/index.ts (plugin contract and Schema)
  -> src/plugin.ts (services, Agent, and React lifecycle)
  -> DSH Agent / session / tool services
  -> src/channel.ts (session/event -> Channel)
  -> src/screens/Chat.tsx (keyboard and mode orchestration)
  -> src/components/* (views)
  -> src/ui.ts (themed renderer facade)
  -> src/ink/* + Yoga (layout, terminal protocol, differential output)
  -> ANSI terminal
```

## Module ownership

| Module | Owns |
| --- | --- |
| `src/index.ts` | Cordis plugin name, injection declaration, config interface, and Schema; keep the entry small and lazy |
| `src/plugin.ts` | TTY guard, questionnaire/skill registration, Agent create/resume, React mount, and the single cleanup funnel |
| `src/channel.ts` | DSH event projection plus submit, steer, resume, rewind, model, and preset actions |
| `src/screens/Chat.tsx` | Modal precedence, global keys, scroll/search/selection state, and slash dispatch |
| `src/components/` | User views and design-system primitives; no Agent or session source of truth |
| `src/ui.ts` | Themed `Box`/`Text`, render, selection, scroll, and other public TUI primitives |
| `src/ink/` | Ported Ink renderer, terminal protocol, events, selection, and Yoga bridge; sensitive infrastructure |
| `src/native-ts/yoga-layout/` | Pure JS/TS layout implementation |
| `cordis.patch.yml` | Profile bundle layer, service rows, overrides, and mount ordering |

Do not duplicate DSH Agent, session, or tool services in a component. Connect new
capability through an existing service, registry, or channel seam.

## The session log is the source of truth

`channel.ts` does not treat a React-local array as conversation truth. DSH
`session/event` records own:

- initial replay and incremental streaming events;
- assistant/reasoning/tool association and sequence anchors;
- rewind turn boundaries;
- reconstruction after resume, export, compact, and fork.

The Channel keeps a TUI-sized projection. Once a long transcript exceeds its
window, older rows fold into short previews while the complete content remains
in the session log and can be restored from events. Tool results are associated
by `callId`, never guessed from array position.

## Rendering and long-session performance

- **Differential output**: each frame writes only screen changes and uses
  capability detection to choose synchronized output, cursor, and Windows
  Terminal paths.
- **Message virtualization**: off-screen rows use the last measured fixed-height
  placeholder and do not participate in the full layout subtree.
- **Replay coalescing**: consecutive token chunks are merged during history
  replay, avoiding repeated string growth for long streamed messages.
- **Bounded caches**: transcript, render-node, and measurement caches are bounded;
  removing a bound requires measured evidence.
- **Display-cell width**: ANSI escapes, combining marks, emoji, and East Asian
  wide characters use terminal cell width, not JavaScript `string.length`.

When changing `src/ink/` or Yoga, run the CI questionnaire/tool-card regressions
and the affected scroll, resize, copy-on-select, or PTY harness. Do not print
diagnostics to an active TUI's stdout; use stderr `CUTE_DSH_TUI_DEBUG` or
`CUTE_DSH_TUI_RENDER_LOG`.

## Inline and fullscreen modes

- **Inline (default)**: content remains on the main screen, and the terminal
  emulator owns scrollback and native text selection.
- **Fullscreen**: `AlternateScreen` switches to the alternate screen, where the
  TUI owns scrolling, mouse selection, OSC 52 copy, and screen restoration.

Both modes share the Channel and React views but use different terminal protocol
paths. Changes involving input, scrolling, mouse, cursor, resize, or cleanup
must be checked in both modes, especially on narrow terminals and Windows
ConPTY.

## Persistence locations

| Path | Contents |
| --- | --- |
| `$DSH_HOME/sessions` | DSH SQLite session events from the profile patch |
| `~/.cute-dsh-tui/resume.txt` | Recent session ID used by `cute-dsh-tui --resume` and the exit hint |
| `~/.cute-dsh-tui/last-used.json` | `/resume` recency metadata |
| `~/.cute-dsh-tui/theme.json` | Current theme selection |
| `~/.cute-dsh-tui/themes/` | User theme JSON files |
| `~/.cute-dsh-tui/working-activity.json` | Activity animation selection |
| `~/.cute-dsh-tui/agent-preset.json` | Default Agent preset for new sessions |

`CUTE_DSH_TUI_SESSION_ROOT` can override the SQLite path in the profile composition;
when the root `cordis.yml` is launched directly, the same variable overrides
the JSONL root (default `$DSH_HOME/sessions`). Preference files are optional
state: malformed or missing files fall back silently rather than preventing
startup.

## Permissions and security boundary

`CuteDshTui` does not provide a separate sandbox. Effective capability comes from
the DSH services mounted by `cordis.patch.yml`. It consumes `permissionPresets`
and `dsh-user-approval`: `/permission` invokes the native DSH command for the
current session, while escalation requests wait for a one-shot allow, deny, or
cancel decision in the terminal.

- On every platform, `DSH_PERMISSION_MODE` defaults to `workspace-write` and
  approval defaults to `ask`.
- Windows DSH RC6 uses its PowerShell/Windows ACL sandbox rather than falling
  back to full access automatically.
- `dsh --yolo` explicitly selects `danger-full-access + never`. When it
  restores an older session, the TUI asks before upgrading that session.
- `DEEPSEEK_API_KEY` should come from the environment or controlled runtime
  injection. Status output only reports presence or a redacted fragment.
- MCP, shell, filesystem tools, and custom presets expand what the model can
  access and should be treated as code-execution surfaces in the same policy
  domain.

Inspect the active profile patch before running in an untrusted repository; the
visual TUI alone does not describe the effective policy.

## Runtime behavior

- Dynamic plugin-source context is shown as its own expandable transcript row
  with producer attribution; its tokens count in the prompt segment.
- `/model` switches through a session fork rather than an in-place update; the
  old session remains in `/resume`.
- Windows `Ctrl+V` depends on PowerShell `Get-Clipboard`; another process can
  lock the clipboard and make the operation appear empty.
- Exit restores the terminal and ends the process without waiting for the
  Agent's asynchronous flush; the persistence plugin is the fallback.

## Known limitations

- There is no automated full-flow suite that requires real model credentials;
  CI uses headless rendering and fake services, while live model integration
  still needs a manual check in the target terminal.

## Debugging and verification

| Goal | Method |
| --- | --- |
| Environment and profile | Run `/doctor`, `/config`, `/permissions`, and `/permission` inside the TUI |
| stderr diagnostics | `CUTE_DSH_TUI_DEBUG=1 dsh --profile cute-dsh-tui` |
| Raw ANSI frames | `CUTE_DSH_TUI_RENDER_LOG=/path/to/render.log dsh --profile cute-dsh-tui` |
| Theme regression | `node --import tsx/esm scripts/verify-themes.mjs` |

`CUTE_DSH_TUI_RENDER_LOG` and session exports may contain sensitive content. Redact
them before sharing.
