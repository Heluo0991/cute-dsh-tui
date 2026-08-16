# 与 upstream 的关系与同步策略

[文档索引](README.md)

- `upstream` = <https://github.com/ccch1mneyyy/dsh-TUI.git>，本项目早期的 fork
  来源。
- `origin` = <https://github.com/Heluo0991/cute-dsh-tui.git>，本项目实际开发与
  npm 发布仓库。
- `upstream` 不参与运行时依赖解析；删除 remote 不影响 `cdsh` 启动。

## 当前基线

`personal/customization` 的分叉点是 `7bf8648`（upstream v0.5.0），本地 `main`
保留该基线作为参照。个人分支在其上独立演进。

## 同步原则

1. **独立演进**：不以 rebase 到 upstream 为目标；自己的功能历史保持可读。
2. **按需 cherry-pick**：网络可用时执行
   ```sh
   git fetch upstream
   git log --oneline HEAD..upstream/main
   ```
   人工评审后只挑选适用的修复，使用 `git cherry-pick -x <commit>` 保留来源。
3. **敏感区域加回归**：vendored `src/ink/`、Yoga、channel 投影相关 pick 必须
   跑 `./scripts/wsl-verify.sh all`，必要时补对应 `verify-*` 脚本。
4. **不接受整体覆盖**：`main` 是基线镜像，不反向覆盖
   `personal/customization`。
5. **保持双锁文件约定**：依赖变更只更新 `pnpm-lock.yaml`；`package-lock.json`
   继续作为 npm 用户跟踪，不作为真源。

## 季度评审

每季度检查一次 upstream 的 issue 与 release notes，记录值得吸收的安全/兼容性
修复；无关重构不追。
