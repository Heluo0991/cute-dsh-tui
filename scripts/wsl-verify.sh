#!/bin/sh
# Mixed WSL verification runner.
#
# On a mounted Windows checkout, plain Node scripts and tsc use the Linux
# Node runtime, while tsx scripts run through the Windows node.exe so the
# Windows-installed esbuild native binary is available. On non-WSL systems
# everything runs through the local Node runtime.
set -eu

cd "$(dirname "$0")/.."

export npm_config_cache="${npm_config_cache:-/tmp/cute-dsh-tui-npm-cache}"
export PNPM_STORE_DIR="${PNPM_STORE_DIR:-/tmp/cute-dsh-tui-pnpm-store}"
mkdir -p "$npm_config_cache" "$PNPM_STORE_DIR"

WIN_NODE="${WIN_NODE:-/mnt/c/Program Files/nodejs/node.exe}"
is_wsl=false
if [ -f /proc/sys/fs/binfmt_misc/WSLInterop ]; then
  is_wsl=true
fi

win_path() {
  case "$1" in
    /mnt/*) printf '%s' "$1" | sed 's#^/mnt/\([a-zA-Z]\)/#\1:/#' | tr '/' '\\' ;;
    *) printf '%s' "$1" ;;
  esac
}

run_tsx() {
  script="$1"
  if $is_wsl; then
    if [ ! -x "$WIN_NODE" ]; then
      echo "[wsl-verify] Windows node.exe not found at $WIN_NODE; set WIN_NODE=... or run in Windows Terminal" >&2
      exit 127
    fi
    tsx_cli="$(win_path "$PWD/node_modules/tsx/dist/cli.mjs")"
    target_path="$(win_path "$PWD/$script")"
    "$WIN_NODE" "$tsx_cli" "$target_path"
  else
    node --import tsx/esm "$script"
  fi
}

run_node() {
  node "$1"
}

section() {
  echo
  echo "=== $1 ==="
}

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  echo "Usage: $0 [tsc|pack|node|tsx|all]"
  echo "  tsc   typecheck only (npx tsc --noEmit)"
  echo "  pack  npm pack --dry-run with WSL-safe cache"
  echo "  node  plain-node regression scripts"
  echo "  tsx   tsx regression scripts via the platform-appropriate runtime"
  echo "  all   everything above (default)"
  exit 0
fi

target="${1:-all}"

if [ "$target" = "all" ] || [ "$target" = "tsc" ]; then
  section "tsc --noEmit"
  npx tsc -p tsconfig.json --noEmit
fi

if [ "$target" = "all" ] || [ "$target" = "node" ]; then
  section "plain-node regressions"
  run_node scripts/verify-launch-options.mjs
  run_node scripts/verify-update.mjs
  run_node scripts/verify-channel-goal-todo.mjs
  run_node scripts/verify-model-route.mjs
  run_node scripts/verify-profile-manifest-recovery.mjs
  run_node scripts/verify-i18n.mjs
fi

if [ "$target" = "all" ] || [ "$target" = "tsx" ]; then
  section "tsx regressions"
  run_tsx scripts/verify-submit.mjs
  run_tsx scripts/verify-compact.mjs
  run_tsx scripts/verify-session-credential.ts
  run_tsx scripts/verify-input-highlight.ts
  run_tsx scripts/verify-input-highlight-render.tsx
  run_tsx scripts/verify-cjk-truncate.tsx
  run_tsx scripts/repro-askpanel.tsx
  run_tsx scripts/repro-toolcards.tsx
fi

if [ "$target" = "all" ] || [ "$target" = "pack" ]; then
  section "package exports / npm pack --dry-run"
  node scripts/verify-package-exports.mjs
fi

echo
echo "[wsl-verify] done"
