# WSL 混合开发环境

[文档索引](README.md)

本仓库通常在 Windows 上安装依赖并运行 TUI，但日常检查可以使用 WSL 的 bash
工具链。两种环境共享同一份检出，**不要**在 WSL 中重跑 `pnpm install`。

## 为什么不能直接在 WSL 安装依赖

- 仓库位于 `/mnt/g`（9p 挂载），共享给 Windows 与 WSL。
- 当前 `node_modules` 由 Windows 的 pnpm 安装，包含 `@esbuild/win32-x64` 等
  平台二进制。若在 WSL 中重装，平台包会互相覆盖，Windows 侧工具随即损坏。
- 本机 WSL 的 `/` 可能只读，npm 默认缓存 `~/.npm` 不可写；可写位置只有
  `/tmp` 与 `/mnt/*`。

## 受支持的混合验证

```sh
. ./scripts/wsl-env.sh       # 设置 /tmp 下的 npm/pnpm 缓存并给出平台提示
./scripts/wsl-verify.sh      # 完整验证：tsc + 纯 Node 回归 + tsx 回归 + npm pack
./scripts/wsl-verify.sh tsc  # 仅类型检查
./scripts/wsl-verify.sh node # 仅纯 Node 回归
./scripts/wsl-verify.sh tsx  # 仅 tsx 回归（经 Windows node.exe 运行）
./scripts/wsl-verify.sh pack # 仅 npm pack 与 exports 检查
```

运行规则：

| 命令类别 | WSL 使用 |
| --- | --- |
| `git` / `tsc` / 纯 Node 脚本 | WSL 的 Linux Node |
| `tsx` 脚本 | `/mnt/c/Program Files/nodejs/node.exe`（可设置 `WIN_NODE` 覆盖） |
| `npm pack --dry-run` | Linux Node + `npm_config_cache=/tmp/...` |
| `pnpm install` | **不执行**；只允许在 Windows 侧执行 |

如果 Windows Node 不在默认路径：

```sh
WIN_NODE='/mnt/c/Program Files/nodejs/node.exe' ./scripts/wsl-verify.sh tsx
```

## 判断当前 node_modules 平台

`scripts/wsl-env.sh` 会检查 `node_modules/.pnpm` 下是否存在
`@esbuild+win32-x64` 而不是 `@esbuild+linux-x64`，并打印提示。误在 WSL 重装
后，`node_modules/.pnpm` 的平台包会变成 Linux 包，Windows 侧需要重新
`pnpm install --frozen-lockfile` 恢复。

## 与 CI 的分工

WSL 混合验证用于本地快速反馈；它不能替代 CI 的原生 Linux/macOS/Windows
矩阵。所有变更仍以 GitHub Actions 为准。
