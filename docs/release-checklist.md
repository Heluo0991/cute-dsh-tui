# 发布检查清单

[文档索引](README.md)

发布入口：推送 `v*` 标签；`publish.yml` 会校验标签与 `package.json.version`
一致，然后发布 npm 包。提交标签前逐项确认：

## 代码与产物

- [ ] `pnpm build` 通过，且 `git diff --exit-code -- lib` 干净（CI 已强制）。
- [ ] `./scripts/wsl-verify.sh all`（或 CI 等价矩阵）全部通过。
- [ ] `node scripts/verify-package-exports.mjs` 通过：所有 `exports` / `bin` /
      `cordis.patch.yml` 目标都在 tarball 内。
- [ ] `npm pack --dry-run` 的包体与文件清单已人工扫一眼，无意外文件。
- [ ] `git diff --check` 无空白错误。

## 行为验证

- [ ] 输入栏 `/命令`、参数、`@引用` 高亮在 inline 与 fullscreen 各看一次。
- [ ] `Ctrl+G` 显示/折叠旧消息；`Ctrl+E` 只移动光标。
- [ ] `/login` 拒绝保存后当前会话可发消息；退出后凭据恢复原状态。
- [ ] 首次 `cdsh` profile 引导输出安静，失败时能看到最后输出。
- [ ] Windows Terminal 与一个 Linux/macOS 终端分别走一遍安装/启动/退出。

## 文档

- [ ] README 与 README_EN 的特性、命令、键位描述一致。
- [ ] `docs/interaction.*.md` 的键位与帮助菜单一致。
- [ ] `docs/configuration.*.md` 的环境变量表包含本次新增变量。
- [ ] 本次修复/新功能在 `docs/` 中有用户可见说明。

## 发布

- [ ] `package.json.version` 已更新，`git tag v<version>` 与之完全一致。
- [ ] 不更新 `package-lock.json`（仓库约定：pnpm-lock 是依赖真源）。
- [ ] 标签推送后关注 `publish.yml` 的 npm provenance 输出。
