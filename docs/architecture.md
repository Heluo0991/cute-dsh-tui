# 架构与限制

[文档索引](README.md) · [English](architecture.en.md)

## 运行链路

```text
Cordis profile
  -> src/index.ts（插件契约与 Schema）
  -> src/plugin.ts（服务、Agent、React 生命周期）
  -> DSH Agent / session / tool services
  -> src/channel.ts（session/event -> Channel）
  -> src/screens/Chat.tsx（键盘与模式编排）
  -> src/components/*（视图）
  -> src/ui.ts（主题化 renderer facade）
  -> src/ink/* + Yoga（布局、终端协议、差分输出）
  -> ANSI terminal
```

## 模块边界

| 模块 | 所有权 |
| --- | --- |
| `src/index.ts` | Cordis 插件名称、注入声明、配置接口与 Schema；保持入口轻量并延迟加载 runtime |
| `src/plugin.ts` | TTY 检查、问卷与 Skills 注册、Agent 创建/恢复、React 挂载、统一退出清理 |
| `src/channel.ts` | 将 DSH 持久化事件投影为 transcript；提供 submit、steer、resume、rewind、model/preset 等动作 |
| `src/screens/Chat.tsx` | modal 优先级、全局按键、滚动/搜索/选择状态、slash command 分发 |
| `src/components/` | 用户界面和 design-system；不直接拥有 Agent 或 session 真相 |
| `src/ui.ts` | 主题化 `Box`/`Text`、render、选择、滚动等公共 facade |
| `src/ink/` | 移植的 Ink renderer、终端协议、事件、选择与 Yoga 桥接；属于敏感底层设施 |
| `src/native-ts/yoga-layout/` | 纯 JS/TS 布局实现 |
| `cordis.patch.yml` | profile bundle 层；决定服务行、覆盖关系与挂载顺序 |

不要在组件中复制 DSH Agent、session 或 tool 服务。需要新能力时，优先通过已有
service、registry 或 channel seam 接入。

## Session 是真源

`channel.ts` 不把 React 本地数组当作对话真相。DSH `session/event` 日志负责：

- 初始历史回放与增量流式事件；
- assistant/reasoning/tool 行的关联与 sequence anchor；
- rewind 的 turn 边界；
- resume、export、compact 和 fork 后的重建。

Channel 只保留适合当前 TUI 的投影。长会话超过窗口后，旧行会折叠为短预览；完整
内容仍在 session log 中，需要时从事件恢复。工具结果按 `callId` 关联，不能只按
数组位置猜测。

## 渲染与长会话性能

- **差分输出**：每帧只写屏幕变化，并使用终端能力探测决定同步输出、光标策略和
  Windows Terminal 兼容路径。
- **虚拟化消息列表**：屏幕外行使用上一次测量的固定高度占位，不参与完整子树布局。
- **回放合并**：历史回放时合并连续 token chunk，避免长流式消息触发二次字符串增长。
- **有界缓存**：transcript、渲染节点和测量缓存有上限；移除上限前必须有测量证据。
- **显示宽度**：ANSI、组合字符、emoji 和东亚宽字符都按 terminal cell width 处理，
  不能用普通 JavaScript `string.length` 代替。

改动 `src/ink/` 或 Yoga 时，至少运行 CI 的问卷/工具卡回归，并按影响范围运行
scroll、resize、copy-on-select 或 PTY 脚本。不要用普通 `console.log` 向活动 TUI 的
stdout 打印诊断；使用 stderr 的 `CUTE_DSH_TUI_DEBUG` 或 `CUTE_DSH_TUI_RENDER_LOG`。

## Inline 与 fullscreen

- **Inline（默认）**：内容留在主屏，终端模拟器管理 scrollback 和原生文本选区。
- **Fullscreen**：`AlternateScreen` 切换到备用屏，TUI 自己管理滚动、鼠标选区、OSC 52
  复制和退出时的屏幕恢复。

两种模式共享 Channel 与 React 视图，但终端协议路径不同。涉及输入、滚动、鼠标、
光标、resize 或清理的改动必须分别验证，尤其要覆盖窄终端和 Windows ConPTY。

## 持久化位置

| 路径 | 内容 |
| --- | --- |
| `$DSH_HOME/sessions` | profile patch 默认的 DSH SQLite 会话事件 |
| `~/.cute-dsh-tui/resume.txt` | `cdsh --resume` 和退出提示使用的最近 session ID |
| `~/.cute-dsh-tui/last-used.json` | `/resume` 最近使用排序元数据 |
| `~/.cute-dsh-tui/theme.json` | 当前主题选择 |
| `~/.cute-dsh-tui/themes/` | 用户自定义主题 JSON |
| `~/.cute-dsh-tui/working-activity.json` | 工作状态动画选择 |
| `~/.cute-dsh-tui/agent-preset.json` | 新会话默认 Agent preset |

profile 可通过 `CUTE_DSH_TUI_SESSION_ROOT` 改写 SQLite 路径；直接运行根目录的
`cordis.yml` 时，该变量改写的是 JSONL 根目录（默认 `$DSH_HOME/sessions`）。
偏好文件是可选状态：损坏或缺失时回退，不应阻止 TUI 启动。

## 权限与安全边界

`CuteDshTui` 本身不提供独立沙箱；实际能力由 `cordis.patch.yml` 挂载的 DSH 服务决定。
它消费 `permissionPresets` 与 `dsh-user-approval`：`/permission` 调用 DSH 原生命令来
切换当前会话预设，工具升级请求则在 TUI 中等待一次性允许、拒绝或取消。

- 所有平台默认 `DSH_PERMISSION_MODE=workspace-write`，审批策略为 `ask`。
- Windows DSH RC6 使用 PowerShell/Windows ACL sandbox，而不是自动退回全权限。
- `dsh --yolo` 是显式 `danger-full-access + never` 选择。恢复旧会话时，TUI 不会静默
  改写会话策略，而会显示确认面板。
- `DEEPSEEK_API_KEY` 只应来自环境变量或受控的运行时注入；状态命令只显示是否设置
  或脱敏片段。
- MCP、Shell、文件工具和自定义 preset 都会扩展模型可见能力，应当视为同一权限域
  内的代码执行入口。

在不可信仓库中运行前，检查实际 profile patch，而不是只看 TUI 的视觉界面。

## 运行行为

- plugin source 写入的动态模型上下文显示为独立、可展开的 transcript 行，并保留插件
  来源；其 token 计入 prompt 分段。
- `/model` 通过 session fork 切换，不是原位修改；旧会话会留在 `/resume`。
- Windows `Ctrl+V` 依赖 PowerShell `Get-Clipboard`；剪贴板被其他程序锁定时可能静默
  失败并显示为空。
- 退出路径优先恢复终端并结束进程，不等待 Agent 异步落盘；持久化插件负责兜底。

## 已知限制

- 没有一套需要真实模型凭证的自动化全流程测试；CI 使用 headless renderer 与假服务，
  真实模型集成仍需要在目标终端手动验证。

## 调试与验证

| 目的 | 方式 |
| --- | --- |
| 环境与 profile | TUI 内运行 `/doctor`、`/config`、`/permissions`、`/permission` |
| stderr 调试 | `CUTE_DSH_TUI_DEBUG=1 dsh --profile cute-dsh-tui` |
| 原始 ANSI 帧 | `CUTE_DSH_TUI_RENDER_LOG=/path/to/render.log dsh --profile cute-dsh-tui` |
| 主题回归 | `node --import tsx/esm scripts/verify-themes.mjs` |

`CUTE_DSH_TUI_RENDER_LOG` 和会话导出可能包含敏感内容，分享前必须脱敏。
