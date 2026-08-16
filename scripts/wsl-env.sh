#!/bin/sh
# WSL-friendly environment for working on the mounted Windows checkout.
#
# Usage:  . ./scripts/wsl-env.sh
#
# This script only exports cache locations. It deliberately does NOT run
# `pnpm install`: this checkout's node_modules is installed by Windows and
# contains Windows-native optional binaries (esbuild, node-pty, …). A WSL
# install would replace them and break the Windows side. Use
# scripts/wsl-verify.sh for the supported mixed-toolchain verification flow.

if [ ! -f /proc/sys/fs/binfmt_misc/WSLInterop ]; then
  echo "[wsl-env] not running under WSL; caches are left unchanged" >&2
  return 0 2>/dev/null || exit 0
fi

# The WSL root filesystem can be read-only (observed on this machine) while
# /tmp is a writable tmpfs. Point npm/pnpm scratch state at /tmp unless the
# caller already made an explicit choice.
: "${npm_config_cache:=/tmp/cute-dsh-tui-npm-cache}"
: "${PNPM_STORE_DIR:=/tmp/cute-dsh-tui-pnpm-store}"
export npm_config_cache
export PNPM_STORE_DIR

mkdir -p "$npm_config_cache" "$PNPM_STORE_DIR" 2>/dev/null || {
  echo "[wsl-env] cannot create cache directories under /tmp" >&2
  return 1 2>/dev/null || exit 1
}

if [ -d node_modules/.pnpm/@esbuild+win32-x64@0.28.2 ] &&
   [ ! -d node_modules/.pnpm/@esbuild+linux-x64@0.28.2 ]; then
  echo "[wsl-env] node_modules is Windows-installed; tsx scripts must run via Windows node.exe (see scripts/wsl-verify.sh)" >&2
fi

echo "[wsl-env] npm cache: $npm_config_cache"
echo "[wsl-env] pnpm store: $PNPM_STORE_DIR"
