# 待解决清单（CuteDshTui）

> 由当前实施会话维护。已完成并提交的历史工作见 git log；本文件只列尚未落地的项目。

## 0. 上下文控制

- 当前会话上下文曾达到 402k，不再整文件重读；以 git HEAD、本清单和定向
  grep/sed 为准。
- 后续每完成一项，删除对应条目并提交，保持本文件是唯一“活清单”。

## 1. Diff 展示增强

**现状**：`AssistantToolUseMessage.tsx` 的 `diffLines()` 只输出 `- / +` 行，
颜色只作用文字；没有绿色/红色背景，也没有每个文件/hunk 的增删行数统计。

**目标**：
- 新增行：绿色背景 + `+N lines`；
- 删除行：红色背景 + `-N lines`；
- 混合 hunk 显示 `+A/-D`；
- 保留现有 CJK 宽度、截断、折叠和 `repro-toolcards` 回归。

## 2. 代码内容换行与折叠

**现状**：`viewLines()` 把 diff 与普通文本转成行，`capLines()` 折叠；
需要确认多行代码的换行忠实渲染，并对超长代码块做更明显的可展开折叠。

## 3. 状态栏信息补全

**现状**：`StatusLine.tsx` 有 model/tokens/cache/git/cwd/title，但没有权限
等级和模式。

**目标**：
- 显示当前权限：readonly / workspace / fullaccess；
- 显示模式：普通 / verbose / 其他活动模式；
- git 分支、会话标题保留；
- 品牌显示统一为 `CuteDshTui`，不再出现 `dsh-tui`。

## 4. WebUI 管理面板命令

**现状**：DSH CLI 提供 `dsh web`。TUI 内没有对应 slash command。

**目标**：新增 `/webui`（或类似命令），启动/显示 WebUI 链接，但不把该命令
或链接写入对话内容。

## 5. Ctrl+O 展开时 `/` 触发第二输入行

**现状**：当前源码中 transcript 搜索已绑定 Ctrl+F，`/` 预留给命令。
需写 headless 回归验证“expanded 模式下按 `/` 只进入 PromptInput，不出现
TranscriptSearchBar”，并确认用户看到的现象是否来自旧安装版本。

## 6. Goal 完成后仍被反复投喂轮次

**结论**：不是仓库 `/goal` 插件逻辑问题；是外部 goal loop 在 goal complete
后继续注入 `goal_round`。日志见用户提供的 `logs.txt`（不入库）。
**对策**：完成后续清单前不再声明 GOAL COMPLETE；每轮以实际 diff 为准。

## 7. 输入框方向键视觉行移动

**现状**：`PromptInput.tsx` 的 Up/Down 只处理逻辑换行；单逻辑行长到软换行时，
按上/下不会在视觉行间移动，而是进入历史。

**目标**：基于 `wrapToWidthRanges` 实现视觉行上下移动；仅在首/末视觉行时
才进入历史，并补 headless 回归。

## 8. `/btw` 运行中主对话视图被切走

**现状**：`/btw <问题>` 成功后立刻 `setBtwOpenId(id)`，整个 Chat 渲染切换为
BtwPane，主对话在后台继续但用户看不到，容易被误认为“主 agent 被打断”。

**结论**：不是 minimal 模式缺少子代理；BTW 使用 `agents.create(origin:
'subagent')`，不依赖 subagent 服务。minimal 的 preset 仍可创建子会话。

**目标**：主回合运行时启动 BTW 不立即抢走主视图；回合结束后再自动打开，或
提供明确的“后台 BTW 已启动”提示与切换入口。
