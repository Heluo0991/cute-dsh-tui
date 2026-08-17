# Interaction and Commands

[Documentation index](README.md) · [简体中文](interaction.md)

## Input and global shortcuts

| Key | Behavior |
| --- | --- |
| `Enter` | Send while idle; steer text into the running turn at its next step boundary; confirm an open menu |
| `Tab` | Complete a `/` command or `@` file; while the model is working, queue non-empty input as a post-turn follow-up |
| `Ctrl+Enter` | Interrupt the running turn and process the input immediately |
| `Shift+Enter` | Insert a newline at the caret |
| `Shift+Tab` | Cycle the current session permission preset; `danger-full-access` still requires confirmation |
| `Alt/Option+Up` | Pull the latest undelivered message back into the editor |
| `Up/Down` | Select menu items; in ordinary input, move by visual row (including soft-wrapped lines); history is reached at the first/last visual row |
| `Ctrl+V` | Insert system clipboard text; files/images copied in Windows Explorer insert paths |
| `Esc` | Close the active menu, selection, or modal; clear input; interrupt a working model; double-tap on empty input to rewind |
| `Ctrl+C` | Interrupt while working; clear non-empty idle input; press twice on empty input to exit |
| `Ctrl+D` | Press twice while idle to exit |
| `Ctrl+O` | Toggle transcript/verbose detail, including full reasoning and tool arguments/output |
| `Ctrl+B` | Switch between the main view and the latest BTW view |
| `Ctrl+T` | Expand or collapse the startup loaded-context panel |
| `Ctrl+R` | Open input-history search; repeat or press `Down` for the next result |
| `Ctrl+L` | Clear and force a physical terminal redraw |
| `Ctrl+G` | Expand or fold the older messages hidden in long transcripts |
| `?` | Open shortcut and command help when the input is empty |
| `Shift+Up` | Enter message selection; arrows move, `Enter` expands one row, `Esc` exits |

`/` always opens slash-command completion. In the `Ctrl+O` transcript view,
full-session search is opened with `Ctrl+F`; use `n` and `N` to move forward
and backward through matches.

`/model` first selects a model route (such as Flash or Pro), then shows the reasoning depths available for that route. The session fork is created only after the second-stage confirmation; choosing `Max` briefly adds a sky-blue animated prompt effect.

## Editing keys

| Key | Behavior |
| --- | --- |
| `Left/Right` | Move by character |
| `Ctrl+Left/Right` (or `Alt+Left/Right`) | Move by word |
| `Home/End` | Move to the start/end of the current logical line |
| `Ctrl+A` / `Ctrl+E` | In the editor, move to the start/end of the current logical line |
| `Ctrl+U` | Delete before the caret |
| `Ctrl+K` | Delete after the caret |
| `Ctrl+W` / `Ctrl+Backspace` | Delete the preceding word |
| `Ctrl+Delete` | Delete the following word |

Bracketed paste from right-click or the terminal's native paste command is
inserted verbatim, including newlines, and is never mistaken for an Enter key.

## @ file references

Typing `@` at **any position** of the message opens file completion: keep typing
path fragments to filter, `Tab`/`Enter` to pick, and directories can be entered
further. When you send, the selected file content or directory listing is attached
to the message automatically (0.3.7+).

On `Ctrl+V`, files/images copied from Windows Explorer are inserted as file paths
(quoted automatically when they contain spaces) instead of pasting the path text.

### Input syntax highlighting

The editor highlights text in real time: recognized `/commands` and subcommands
use the theme accent, an unrecognized slash prefix uses the warning color,
command arguments are dimmed, and `@file references` anywhere in the message
use blue. Highlighting is display-only; the submitted text stays unchanged.

### Clipboard platform support

| Platform | `Ctrl+V` source |
| --- | --- |
| Windows | PowerShell `Get-Clipboard`, including file paths |
| macOS | `pbpaste`, text |
| Linux | `wl-paste` → `xclip` → `xsel`, text |
| All platforms | Falls back to `Ctrl+Shift+V` / right-click native terminal paste |

## Interface language

`/lang` toggles the UI between Simplified Chinese and English (affects all UI
strings); the choice persists across restarts (0.3.7+).

## Message delivery semantics

While the model is working, three paths have different placement:

| Action | Placement |
| --- | --- |
| `Enter` | Steer: deliver to the running turn at its next step boundary |
| `Tab` | Follow-up: wait until the current turn finishes |
| `Ctrl+Enter` | Interrupt: stop the turn and deliver immediately |

Undelivered messages appear above the editor. `Alt/Option+Up` retrieves the
latest one. Pressing `Esc` while pending messages exist interrupts and
redelivers them immediately.

## Session workflows

### Resume

`/resume` lists recent resumable sessions for the current working directory.
Titles come from the first user message, and entries are ordered by most recent
use. Confirming switches the Agent and replays persisted events. The same
picker opens immediately with `dsh --resume`; use `dsh --resume <session-id>`
for an exact session, or `dsh --resume --last` (or `dsh -c`) for the previous
session.

### Rewind

Double-tap `Esc` on an empty editor to open the user-message list. After a
selection is confirmed, the TUI:

1. Finds the beginning of the turn containing that message.
2. Creates a branch session through DSH session fork.
3. Replays history before the boundary.
4. Restores the original message to the editor for revision and resubmission.

### BTW side conversations

`/btw <question>` starts a side conversation. If the main conversation is
working, it starts in the background and opens automatically after the current
turn, without stealing the main view.

- `Ctrl+B` switches between the main view and the latest BTW view; this is the
  only shortcut for switching views.
- `Esc` matches the main conversation: it stops the current BTW turn while
  working, or clears the current draft when idle.
- `Ctrl+C` also stops BTW; `Ctrl+O` toggles verbose/compact details.
- When a completed BTW exists in the main view, the status line shows a
  `Ctrl+B to view` hint.

### Model and preset

`/model` switches through a session fork at the end of current history because
DSH has no in-place model-switch API. Old sessions remain on disk, while `/resume` folds a fork lineage to its newest resumable leaf by default; Right expands historical versions and rewind branches, Left collapses them.

`/preset` switches in place only for a blank session. In a started session,
the choice becomes the default for the next `/new` or launch. See
[Configuration](configuration.en.md#agent-presets).

### Permissions and approvals

`/permission` opens the native DSH permission-preset picker, or
`/permission <id>` selects one directly. The change applies only to the
current session and its future tool calls; `/permissions` reports the current
preset. Selecting `danger-full-access` requires an explicit `Enter`
confirmation. New sessions default to `workspace-write + ask`.

When a tool requests one-shot escalation, the approval panel owns the keyboard:
`Enter` allows once, `D` denies, and `Esc` or `Ctrl+C` cancels. The TUI never
persists an “always allow” decision.

Dynamic context injected by a plugin source appears as an expandable
transcript row with source attribution. It is not a human message, but it does
count in the prompt-token segment.

## Fullscreen and mouse

`fullscreen: false` is the default inline mode, where the terminal emulator
owns native scrollback and selection.

`fullscreen: true` uses the alternate screen and enables in-app mouse handling:

| Action | Behavior |
| --- | --- |
| Wheel | Scroll the transcript |
| Drag | Select text, copy on release, then clear the selection |
| Double/triple click | Select and copy a word/line |
| `Esc` | Cancel an active drag without copying |

Copy prefers OSC 52. Local fallbacks include `wl-copy`, `xclip`, and `xsel`;
tmux uses `load-buffer -w`. Set `CUTE_DSH_TUI_DISABLE_MOUSE=1` to temporarily disable
fullscreen mouse handling.

## `ask_user_question` questionnaires

When the model invokes the questionnaire tool, its panel temporarily owns the
keyboard:

| Key | Behavior |
| --- | --- |
| `Up/Down` | Move through options |
| `Space` | Toggle a multi-select option |
| `Tab` | Switch to a custom text answer |
| `Enter` | Submit the current question |
| `Esc` | Cancel; the model receives `ASK_ABORTED` |

Batched questions and concurrent subagent questions are shown one at a time in
FIFO order. A compact Q&A summary is added to the local transcript afterward.

## Slash commands

The command menu merges local commands with the DSH command registry. Type `/`
to inspect the complete surface available in the current composition.

| Group | Commands |
| --- | --- |
| Sessions | `/new`, `/resume`, `/btw <question>`, `/clear`, `/compact`, `/export` |
| Status | `/status`, `/cost`, `/webui`, `/config`, `/doctor`, `/init`, `/agents` |
| Model and display | `/model`, `/thinking`, `/tokens`, `/activity`, `/preset`, `/theme`, `/lang` |
| Account and policy | `/login`, `/logout`, `/permission`, `/permissions`, `/add-dir`, `/mcp` |
| Packaged skills | `/audit`, `/bug`, `/practice`, `/review`, `/pr_comments`, `/release-notes`, `/vuln-check` |
| Other | `/plugin [list\|search\|add\|remove\|update]`, `/update`, `/terminal-setup`, `/help`, `/exit` |
| Registry | `/plan`, `/goal`, and any other command registered by the DSH composition |

Additional forms:

- `/activity` opens the animation picker; `/activity frames <name>` selects
  directly; `/activity status` reports the current choice.
- `/preset <id>` and `/preset status` are described in the configuration guide.
- `/permission` opens the current-session permission presets;
  `/permission <id>` chooses one directly and `/permissions` reports policy.
- `/theme <name>` and `/theme status` are described in the theme guide.
- `/lang` toggles the interface language (see “Interface language”).
- `/webui` shows the default WebUI URL and how to start it from a terminal
  (`dsh web`); it sends nothing to the model.
- After startup, the TUI checks npm for a newer version in the background and
  shows a notification when one is available. The check follows the npm
  registry configuration (`NPM_CONFIG_REGISTRY` or `~/.npmrc`), so mirror
  users see the versions their package manager actually installs. `/update`
  updates the installed `@heluo0991/cute-dsh-tui`, then restarts and
  resumes the current session automatically; wait for an active turn to finish first. It is only
  available under a `dsh --profile <name>` launch (source checkouts get an
  unavailable notice), and an already-latest install is reported as such
  without restarting.
- `/plan [off|message]` and `/goal ...` are handled by DSH command plugins and
  recorded as session events.
- Skill commands submit activation prompts. The actual skill is loaded through
  the DSH skill registry. Packaged `skills/` register at startup and may be
  overridden by same-name project or user skills.
