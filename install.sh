#!/bin/sh
# CuteDshTui repository helper for POSIX sh (macOS and Linux).
# It intentionally installs only into a DSH profile; the normal npm package
# entry point is `cute-dsh-tui`, which bootstraps this profile automatically.
set -eu

if ! command -v dsh >/dev/null 2>&1; then
  echo "dsh CLI was not found. Install the official CLI first:" >&2
  echo "  npm install -g @deepseek-ai/dsh" >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm 10+ is required because dsh plugin delegates profile installation to it:" >&2
  echo "  npm install -g pnpm@latest"
  exit 1
fi

pnpm_major="$(pnpm --version | cut -d. -f1)"
case "$pnpm_major" in
  ''|*[!0-9]*)
    echo "Could not determine the installed pnpm version. Install pnpm 10 or newer:" >&2
    echo "  npm install -g pnpm@latest" >&2
    exit 1
    ;;
esac
if [ "$pnpm_major" -lt 10 ]; then
  echo "pnpm $pnpm_major is too old; CuteDshTui requires pnpm 10 or newer:" >&2
  echo "  npm install -g pnpm@latest" >&2
  exit 1
fi

dsh plugin --profile cute-dsh-tui add @heluo0991/cute-dsh-tui
echo
echo "Installed. Start with: dsh --profile cute-dsh-tui"
echo "The globally installed portable command is: cute-dsh-tui"
echo
echo "Do not separately add dsh-working-activity to this profile; CuteDshTui mounts it."
echo "To override its cadence, edit \$DSH_HOME/profiles/cute-dsh-tui/cordis.patch.yml:"
echo "  - id: working-activity"
echo "    config:"
echo "      publishIntervalMs: 500"
