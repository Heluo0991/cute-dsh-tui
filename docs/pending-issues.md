# CuteDshTui 交接与待办清单

> **新对话请先完整读本文件，再动代码。** 本文件是当前会话的交接书，
> 包含项目链路、已完成事项、当前待办和验证方式。除非待办条目明确要求，
> 不要重新通读仓库；按“关键文件”做定向查看即可。

## 0. 上下文节约约定

- 仓库在 `/mnt/g/dsh/dsh-tui`，当前为 WSL 混合环境：源码留在 Windows 挂载盘，
  WSL 只跑 git/tsc/纯 Node；tsx 回归由 `scripts/wsl-verify.sh` 自动经
  Windows `node.exe` 调用。
- **禁止在 WSL 中执行 `pnpm install`**，会破坏 Windows 平台的
  `node_modules`。详见 `docs/development-wsl.md`。
- `logs.txt` 是本地用户转录，已在 `.gitignore`，不要提交、不要引用内容。
- 声称“验证通过”前至少运行对应脚本；完整门禁是
  `./scripts/wsl-verify.sh all`。
- 依赖真源是 `pnpm-lock.yaml`；`package-lock.json` 只允许在版本号同步时
  更新 root `version`，不要顺手改依赖树。

## 1. 项目链路（简版）

```text
npm 包 @heluo0991/cute-dsh-tui (package.json)
  → bin: cute-dsh-tui.js / launch-options.js / lib/types/profileManager.js
  → 创建 $DSH_HOME/profiles/cute-dsh-tui（DSH profile）
  → cordis.patch.yml（服务叠加层）
  → src/index.ts（插件入口） → src/plugin.ts（生命周期）
  → src/channel.ts（DSH 会话事件 → UI 状态）
  → src/screens/Chat.tsx（键盘/模式编排）
  → src/components/*（视图） → src/ui.ts → src/ink/*（vendored 渲染器）
```

关键文件：
- 输入：`src/components/PromptInput.tsx`、`src/utils/inputHighlight.ts`
- 命令：`src/commands.ts`、`src/screens/Chat.tsx` 的 `runCommand`
- 状态栏：`src/screens/StatusLine.tsx`、`src/screens/StatusMetrics.ts`
- 工具卡/diff：`src/components/messages/AssistantToolUseMessage.tsx`
- 凭据：`src/credentials.ts`、`src/sessionCredential.ts`、`src/plugin.ts`
- profile/launcher：`src/profileManager.ts`、根 `cute-dsh-tui.js`
- 回归脚本：`scripts/verify-*.{mjs,ts,tsx}`、`scripts/wsl-verify.sh`

## 2. 当前 git 状态

- 分支：`personal/customization`
- HEAD：`3f00a5e`（见下）
- `origin/personal/customization` 落后本地 5 个提交（尚未推送）：
  ```text
  d3b6492 feat: polish TUI UX, fix credentials/keybindings, harden launcher and CI
  104a022 fix: isolate npm dry-run cache for WSL read-only roots
  5e163ef ci: tolerate CRLF when checking generated lib artifacts on Windows
  4c96506 docs: add pending issues checklist and BTW diagnosis
  3f00a5e fix: dispatch slash commands during working turns and defer BTW view
  ```
- 版本策略：发布由 `v*` git tag 触发，CI 校验 tag 与 `package.json.version`
  完全一致。当前待办第 9 项会同步版本号；**未准备发布时不要创建 v* tag**。

## 3. 已经解决并提交的问题

1. WSL 混合工具链：`scripts/wsl-env.sh`、`scripts/wsl-verify.sh`、
   `docs/development-wsl.md`。
2. 输入栏三级语义高亮：`/命令`、参数、`@引用`；CJK 安全换行和光标映射。
3. 补全菜单：选中背景、匹配前缀高亮、底部操作提示。
4. HelpMenu：i18n、修正 Shift+Tab 说明、命令列表上限。
5. 键位：Ctrl+G 显示旧消息，Ctrl+E 归编辑器；Ctrl+Backspace/Delete 删词；
   Alt+Left/Right 按词移动。
6. `/login` 拒绝保存后当前会话真实生效，退出/reload 恢复原凭据。
7. 剪贴板：Windows/macOS/Linux 适配器 + 终端原生粘贴回退。
8. 全量 i18n 迁移 + `scripts/verify-i18n.mjs` 静态防回归。
9. launcher：pnpm 成功静默、失败输出、超时、build-script 白名单；
   profile 损坏 manifest 备份重建；node-pty 平台化错误提示。
10. CI：Windows 矩阵、lib 产物一致性闸门（CRLF 兼容）。
11. npm 包：删除不存在的 `./src/*` export；`verify-package-exports.mjs`
    校验 exports/bin/patch 均在 tarball 内。
12. BTW：working 中 `/btw <问题>` 先 dispatch 命令，不再被 steer；
    BTW 主回合运行时后台启动、回合结束后自动打开，不抢主视图。
13. 文档：`docs/development-wsl.md`、`docs/release-checklist.md`、
    `docs/upstream-policy.md` 和本清单。

## 4. 待办清单

### 1. Diff 显示增强
- 文件：`src/components/messages/AssistantToolUseMessage.tsx`
- 目标：新增行绿色背景 + `+N lines`；删除行红色背景 + `-N lines`；
  hunk 显示 `+A/-D`；保留 CJK/截断/折叠与 `repro-toolcards` 回归。
- 状态：已完成。hunk 首行 `+A/-D`，多行 hunk 增加 `+N lines`/`-N lines`
  标记，add/del 行使用主题 `diffAdded`/`diffRemoved` 背景；
  `repro-toolcards.tsx` 已补背景色与计数断言。

### 2. 代码换行与折叠
- 文件：同上，`viewLines()` / `capLines()`。
- 目标：多行代码忠实显示换行；超长代码块明显可展开。
- 状态：已完成。structured/raw/terminal 正文统一 `contentTextLines`（保留
  内部空行与行首空白）；`capLines()` 按软换行后的视觉行数折叠，超长单行
  代码块会追加 `… (ctrl+o to expand)` 提示。

### 3. 状态栏补全
- 文件：`src/screens/StatusLine.tsx`；必要时 `Chat.tsx` 传参。
- 目标：显示权限等级（readonly/workspace/fullaccess）、当前模式；
  保留 git 分支和会话标题；品牌统一 `CuteDshTui`。
- 状态：已完成。左组加入 `CuteDshTui` 品牌、`channel.agentPreset` 当前
  模式与权限等级（readonly/workspace/fullaccess，fullaccess 琥珀色）；
  右组继续保留 git 分支、cwd 与会话标题。新增 `verify-status-line.tsx`。

### 4. WebUI 管理面板命令
- 背景：DSH CLI 有 `dsh web` 命令；TUI 暂无入口。
- 目标：新增 `/webui`（或等价命令），显示 WebUI 链接/管理入口，
  **不写入对话内容**。
- 状态：已完成。`/webui` 显示默认 `http://127.0.0.1:3080`（可用
  `DSH_WEB_URL` 覆盖）、终端启动方式 `dsh web`、`--port` 与 loopback
  限制说明；仅 `pushLocal` 本地报告，不 submit/steer 给模型。确认结论：
  web profile 是独立进程，TUI 进程内不能直接 boot，因此命令只展示入口。

### 5. Ctrl+O 展开时 `/` 第二输入行
- 当前源码：`/` 只给 slash command，transcript 搜索是 Ctrl+F。
- 待办：写 headless 回归证明 expanded 下按 `/` 只进 PromptInput，不出现
  TranscriptSearchBar；并确认用户复现来自旧安装版本还是当前源码。
- 状态：已完成。新增 `verify-slash-expanded.tsx`：先按 Ctrl+O，再按 `/`
  只进入 PromptInput；随后用 Ctrl+F 验证搜索栏检测器有效。结论：当前
  源码无该 bug，用户复现应来自旧安装版本。

### 6. Goal Complete 后仍被 goal loop 驱动
- 结论：不是仓库 `/goal` 代码问题；是外部 goal_round 机制持续注入。
- 对策：在待办清空前不声明 GOAL COMPLETE；每轮以实际 git diff 为准。
- 状态：外部问题，无本地代码改动。

### 7. 输入框方向键按视觉行移动
- 文件：`src/components/PromptInput.tsx` 的 Up/Down 分支。
- 现状：只按逻辑 `\n` 换行移动；单行长文本软换行时上下键进入历史。
- 目标：基于 `wrapToWidthRanges` 实现视觉行移动，首/末视觉行才进入历史；
  补 headless 回归。
- 状态：已完成。`inputHighlight.ts` 新增 `moveCursorVertically` /
  `cursorAtVisualColumn`（宽字符不可劈开），PromptInput Up/Down 改用视觉
  行；首/末视觉行才进入历史。回归：`verify-input-highlight.ts` 纯函数
  断言 + `verify-prompt-arrow-keys.tsx` headless 真实按键断言。

### 8. BTW 抢视图 / 主回合中无法执行 `/btw`
- **已修复**：见第 3 节第 12 条，提交 `3f00a5e`。
- 剩余验证：真实 TTY 上再跑一次 30s 命令期间 `/btw`（本会话未做，
  仍需手动验收）。

### 9. npm 版本号与 git 提交同步
- 现状：`package.json` 与 `package-lock.json` root 版本均为 `1.2.0`。
- 目标：已随提交 `52c9c1c` 完成；**不创建 tag**，待用户决定发布时再
  `git tag v1.2.0`。
- 状态：已完成。

## 5. 验证门禁

```sh
./scripts/wsl-verify.sh all     # 完整本地门禁
./scripts/wsl-verify.sh tsc     # 仅类型
./scripts/wsl-verify.sh node    # 纯 Node 回归
./scripts/wsl-verify.sh tsx     # tsx 回归（Windows node.exe）
./scripts/wsl-verify.sh pack    # npm pack + exports 校验
```

修改以下区域时额外运行对应回归：
- 输入/高亮：`verify-input-highlight*.ts`、`verify-prompt-arrow-keys.tsx`、
  `verify-working-commands.tsx`、`verify-slash-expanded.tsx`
- 工具卡/diff：`repro-toolcards.tsx`、`verify-cjk-truncate.tsx`
- 状态栏：`verify-status-line.tsx`、`repro-toolcards.tsx`、
  `verify-cjk-truncate.tsx`
- 权限/凭据：`verify-session-credential.ts`、`verify-permissions.mjs`
- launcher/profile：`verify-profile-manifest-recovery.mjs`、
  `verify-profile-native-build.mjs`、`verify-package-exports.mjs`

## 6. 新对话建议开局步骤

1. `git status --porcelain && git log origin/personal/customization..HEAD --oneline`
2. 读本文件待办，挑选一项。
3. 定向查看对应文件，改完运行第 5 节门禁。
4. 提交时更新本清单状态（已修复则删除/标记）。
5. 除非用户明确要求，不推送、不创建 `v*` tag。
