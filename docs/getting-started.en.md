# Getting Started

[Documentation index](README.md) · [简体中文](getting-started.md)

## Prerequisites

- Node.js `^22.19 || >=24`; CI uses Node 24.
- The official DeepSeek Harness CLI: `@deepseek-ai/dsh`.
- `pnpm` **10 or newer** (CI uses 11); `dsh plugin` delegates profile
  installation to pnpm. pnpm 9 hoists transitive dependencies differently,
  leaving `dsh-working-activity` unresolvable inside the profile — the TUI
  then exits right after startup with almost no error output (issue #60,
  see Troubleshooting below).
- An interactive terminal TTY. `cute-dsh-tui` cannot start with stdout redirected.
- `DEEPSEEK_API_KEY`. Set `DEEPSEEK_BASE_URL` as well when using a compatible
  custom endpoint.

macOS/Linux:

```sh
export DEEPSEEK_API_KEY='your-key'
```

PowerShell:

```powershell
$env:DEEPSEEK_API_KEY = 'your-key'
```

Never commit a real credential. A normal profile launch reads the environment
variable directly.

## Install

### New user: one global install

```sh
# The DSH CLI, CuteDshTui shortcut, and the profile package manager
npm install -g @deepseek-ai/dsh @heluo0991/cute-dsh-tui pnpm@latest

# First launch creates the profile and adds this exact package version
cute-dsh-tui
```

### Existing DSH user: add the plugin

```sh
npm install -g pnpm@latest  # only when pnpm is not already 10+
dsh plugin --profile cute-dsh-tui add @heluo0991/cute-dsh-tui
dsh --profile cute-dsh-tui
```

From a checkout, the repository helper wraps the profile command:

```sh
sh install.sh
```

`install.sh` is a POSIX `sh` helper for a checkout. It checks for `dsh` and
pnpm 10+, then runs the profile plugin command. It does not copy source files
or require a local build. On Windows, use the PowerShell commands above or the
global `cute-dsh-tui` command instead.

## Migrate from the former package

Earlier releases used `@deepseek-harness-tui/dsh-tui` and a different
profile. The current identity is `@heluo0991/cute-dsh-tui` in a
`cute-dsh-tui` profile. Create the new profile with:

```sh
dsh plugin --profile cute-dsh-tui add @heluo0991/cute-dsh-tui
dsh --profile cute-dsh-tui
```

On its first launch, CuteDshTui copies the theme, model, preset, language,
activity style, history, and resume marker from `~/.dsh-cc` only when
`~/.cute-dsh-tui` does not yet exist. It never modifies or deletes the old
directory, and it does not copy DSH JSONL sessions: those remain in
`$DSH_HOME/sessions`. Do not add both packages to the same profile.

## What installation does

On the first `dsh plugin --profile cute-dsh-tui add @heluo0991/cute-dsh-tui`, the official CLI:

1. Initializes `$DSH_HOME/profiles/cute-dsh-tui/`. When `DSH_HOME` is unset, the
   default root is normally `~/.dsh`.
2. Uses `@deepseek-ai/dsh-base` as the first profile bundle.
3. Installs `@heluo0991/cute-dsh-tui` inside the profile with pnpm.
4. Reads the package's `dsh.bundle.patch` metadata and adds its
   `cordis.patch.yml` as a composition layer.

The important startup order is:

```text
dsh-base -> other bundles -> @heluo0991/cute-dsh-tui patch -> user profile patch
```

The base supplies agent, model, session, filesystem, shell, policy, and
registry services. The plugin patch overrides or inserts the TUI, agent-preset
roster, SQLite session persistence, and live activity row.

`dsh-working-activity` is already a dependency of this package and is inserted
by the `cute-dsh-tui` patch. Do not separately add `dsh-working-activity` to the
same profile or duplicate rows may be mounted.

## Start the TUI

```sh
dsh --profile cute-dsh-tui
```

The process starts in the current directory, which is also the Agent's default
workspace. Change into the target project before starting it.

On Windows, the checkout also provides:

```bat
cute-dsh-tui.cmd
cute-dsh-tui.cmd --resume
```

The portable `cute-dsh-tui` command mirrors the complete session workflow on
all three platforms:

```text
dsh --resume                  open the current-directory session picker
dsh --resume <session-id>     resume one exact session
dsh --resume --last           resume the most recently used session
dsh --continue  (or dsh -c)   alias for --resume --last
dsh --yolo                    request danger-full-access with no approvals
```

`--resume` and `/resume` both use DSH's durable session index. Set
`CUTE_DSH_TUI_WORKSPACE` to override the working directory on Windows, Linux,
or macOS.

## Update to the latest version

The project moves fast. Updating reuses the install command with an explicit
`@latest`:

```sh
dsh plugin --profile cute-dsh-tui add @heluo0991/cute-dsh-tui@latest
```

- Without `@latest`, pnpm resolves within the version range already recorded
  in the profile's `package.json` (for example `^0.1.4`) and may stay on an
  old line — the usual reason "re-running the install command" appears to
  change nothing.
- To confirm: the startup banner shows the running version
  (`✦ cute-dsh-tui vX.Y.Z`).
- Your `cordis.patch.yml` override layer survives updates untouched. Session
  storage may move between versions (since 0.3.7, `/resume` uses the JSONL
  session store shared with dsh web), so older sessions missing from the
  list after a major update is expected — the underlying data is not
  deleted.

## Profile configuration

The user override file is:

```text
$DSH_HOME/profiles/cute-dsh-tui/cordis.patch.yml
```

When overriding a row, its `config` block is replaced as a whole rather than
deep-merged. Repeat every key you want to keep. See
[Configuration](configuration.en.md) for examples.

The root `cordis.yml` is a bare-composition example. A normal npm/profile
installation uses `cordis.patch.yml`; do not copy the root configuration into
the profile.

## Develop from source

```sh
git clone https://github.com/Heluo0991/cute-dsh-tui.git
cd CuteDshTui
pnpm install --frozen-lockfile
pnpm build
pnpm smoke
```

`pnpm build` runs `tsc -p tsconfig.json` and emits `src/` into `lib/types/`.
Those generated files are committed and published, so source changes must be
followed by a rebuild.

CI also runs three rendering regressions:

```sh
node --import tsx/esm scripts/repro-askpanel.tsx
node --import tsx/esm scripts/verify-askpanel-layout.tsx
node --import tsx/esm scripts/repro-toolcards.tsx
```

The `pnpm tui` script invokes `scripts/run.ts`, which assumes the package lives
inside a DeepSeek Harness monorepo with a `packages/*` layout. It is not a
portable launcher for this standalone repository. For a real integration
check, install the package into a profile and run it in a TTY.


## Troubleshooting

### `cute-dsh-tui requires an interactive terminal`

stdout is not a TTY. Start the process directly in a terminal rather than
redirecting its main output to another command or file.

### `dsh` or `pnpm` cannot be found

Make sure the global npm bin directory is on `PATH`, then open a new terminal.
`install.sh` checks both commands before installation.

### The TUI exits right back to the shell with almost no error (pnpm 9)

In a profile installed by pnpm 9, the transitive dependency
`dsh-working-activity` is not hoisted where the loader can resolve it; the
failed module resolution tears down the whole plugin tree, and the TUI prints
the resume hint and exits (issue #60). Upgrade pnpm to 10+ and reinstall:

```sh
npm install -g pnpm@latest
dsh plugin --profile cute-dsh-tui add @heluo0991/cute-dsh-tui@latest
```

### The model reports missing credentials

Confirm that `DEEPSEEK_API_KEY` is set in the same shell that starts `dsh`.
Check `DEEPSEEK_BASE_URL` too when using a custom endpoint.

### The activity row appears twice

Check whether `dsh-working-activity` was added separately to the profile. Keep
the row inserted by the cc-tui patch and remove the duplicate bundle entry.

### The TUI is misaligned or leaves terminal state behind

Run `/doctor`, record the terminal and mode, then consult
[Interaction and commands](interaction.en.md) and
[Architecture and limitations](architecture.en.md). `CUTE_DSH_TUI_RENDER_LOG` can
capture raw frames for rendering bugs, but those frames may contain visible
conversation content and should be handled as sensitive data.
