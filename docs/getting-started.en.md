# Install and quick start

[Documentation index](README_EN.md) · [中文](getting-started.md)

## Requirements

- Node.js `^22.19 || >=24`.
- An interactive terminal TTY; the TUI cannot run with stdout redirected.
- A DeepSeek API key, plus `DEEPSEEK_BASE_URL` for a compatible endpoint when needed.

## Recommended deployment: `cdsh`

On Windows, Linux, and macOS, install once and run `cdsh` from any directory. It does not take over the official `dsh` command, need a global pnpm install, or require copied launch scripts.

```sh
npm install -g @heluo0991/cute-dsh-tui
cdsh
```

Linux compiles the local terminal bridge for `node-pty`. If a minimal image reports a `pty.node` error, install the prerequisites once:

```sh
sudo apt-get install -y build-essential python3
cdsh
```

The launcher permits and retries this native build automatically; no manual pnpm command is required.

The first launch creates `$DSH_HOME/profiles/cute-dsh-tui` (normally `~/.dsh/profiles/cute-dsh-tui`) and installs the current version with the bundled DSH/pnpm runtime. Thereafter, enter a project directory and run `cdsh`; that directory is the Agent workspace.

`cute-dsh-tui` remains a compatibility alias, but new documentation uses `cdsh`.

## Existing DSH users

Install this package and run `cdsh`; the official `dsh` executable and its other profiles remain unchanged.

```sh
npm install -g @heluo0991/cute-dsh-tui
cdsh
```

Use `dsh plugin --profile <name> ...` when deliberately managing your other official profiles. Do not add the legacy TUI and CuteDshTui to one profile.

## API key

The recommended interactive path is `/login` inside the TUI:

1. Paste the key into the masked field; it never enters ordinary command history.
2. When the launch terminal already has `DEEPSEEK_API_KEY`, DSH treats it as a read-only launch source; `/login` shows its status. Change the variable in the shell and restart `cdsh`.
3. Without that variable, the TUI asks before saving: Windows writes a user environment variable; macOS/Linux use DSH's owner-only `$DSH_HOME/.credentials.yaml` store, available to both `cdsh` and official `dsh`.
4. Declining save keeps the key only for this session. `/logout` clears the session and can remove a key previously saved by CuteDshTui.

An explicit environment variable has priority over saved configuration, which is useful for CI, containers, and secret managers.

```sh
export DEEPSEEK_API_KEY='your-key' # current Linux/macOS shell
```

```powershell
$env:DEEPSEEK_API_KEY = 'your-key' # current Windows PowerShell window
setx DEEPSEEK_API_KEY "your-key"  # future Windows terminals
```

`setx` does not update the current PowerShell. Open a new terminal or use `/login` for immediate use. Do not use a system-wide variable, commit a key, or put it in a project `.env` file.

## Common launch flags

```sh
cdsh --resume
cdsh --resume <session-id>
cdsh --continue
cdsh --yolo
```

Use `CUTE_DSH_TUI_WORKSPACE=/path/to/project cdsh` to choose a workspace from elsewhere. In PowerShell: `$env:CUTE_DSH_TUI_WORKSPACE='C:\path\to\project'; cdsh`.

## Update and troubleshooting

Use `/update` inside the TUI or run `npm install -g @heluo0991/cute-dsh-tui@latest`.

- `cdsh` is missing: reopen the terminal so npm's global bin directory is on PATH.
- First install failed: check npm registry access and Node version, then retry `cdsh`.
- No credential: use `/login`, or ensure `DEEPSEEK_API_KEY` exists in the same shell that starts `cdsh`.
- Diagnostics: use `/doctor`, or `CUTE_DSH_TUI_DEBUG=1 cdsh`.
