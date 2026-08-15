# 配置参考

[文档索引](README.md) · [English](configuration.en.md)

## Profile 与补丁层

通过 npm/profile 机制安装后，用户配置位于：

```text
$DSH_HOME/profiles/cute-dsh-tui/cordis.patch.yml
```

`DSH_HOME` 未设置时通常为 `~/.dsh`。该文件是顶层 YAML 数组，可使用 DSH
支持的 `!!js` 表达式。

Profile 启动按顺序叠加 `dsh-base`、已安装 bundle、`@heluo0991/cute-dsh-tui`
的包内 `cordis.patch.yml`，最后再应用用户补丁。用户配置通常通过相同 `id` 覆盖已有行；
只有确实新增服务时才使用 `insert`。

> 覆盖某一行时，`config` 是整块替换，不是逐字段深合并。需要继续生效的字段必须
> 在用户补丁中全部重写。

## TUI 配置

下面是完整的常用覆盖示例：

```yaml
- id: cute-dsh-tui
  config:
    provider: deepseek-official
    model: deepseek-v4-flash
    cwd: !!js process.cwd()
    effort: max
    activity: true
    activityFrames: claude
    contextBar: true
    fullscreen: false
    preset: !!js process.env.CUTE_DSH_TUI_PRESET ?? undefined
    sessionId: !!js process.env.CUTE_DSH_TUI_RESUME_SESSION ?? undefined
```

| 字段 | 默认/来源 | 说明 |
| --- | --- | --- |
| `provider` | `deepseek-official` | DSH 模型路由名称 |
| `model` | `deepseek-v4-flash` | 启动模型；`/model` 可通过 session fork 实时切换 |
| `cwd` | `process.cwd()` | Agent 工作目录与文件策略根目录 |
| `effort` | 配置层通常为 `max` | 每个请求实际生效的推理等级（按模型档位校验，deepseek 仅 off/high/max，非法档位静默回落默认；优先于 `/model` 持久化选择），兼作顶栏启动显示 |
| `activity` | `true` | 是否显示实时工作状态行 |
| `activityFrames` | 持久化选择或 `claude` | 工作状态动画预设；也可通过 `/activity` 修改 |
| `contextBar` | `true` | 输入框下方的分段上下文进度条；`false` 隐藏该行 |
| `fullscreen` | `false` | `true` 使用 alternate screen、应用内滚动和鼠标选区；`false` 使用 inline 模式 |
| `preset` | 名册默认 `standard` | 新会话 Agent preset；显式配置优先于持久化偏好 |
| `sessionId` | 未设置 | 要恢复的会话 ID，通常由 `cdsh --resume` 注入 |

## 工作状态行

`dsh-working-activity` 随包安装，并由本包 patch 插入。只需要按 ID 覆盖参数：

```yaml
- id: working-activity
  config:
    publishIntervalMs: 500
```

不要再次 `insert` 同名行，也不要对同一 profile 单独执行
`dsh plugin ... add dsh-working-activity`。

## Agent Preset

每个会话通过 `@deepseek-ai/dsh-agent-presets` 组合模型可见的工具和提示词：

| ID | 名称 | 能力 |
| --- | --- | --- |
| `standard` | 标准模式（默认） | 编辑、Shell、检索、Skills、计划、Goals、子代理与工作流 |
| `code` | PTC 模式 | 标准能力，加 Code Mode SDK 呈现工具，可用 TypeScript 组合多步操作 |
| `minimal` | 极简模式 | 仅持久 Bash 与 `str_replace_editor`，不带 compaction |
| `cordis` | 创造模式 | 标准能力，加运行时检查与插件实验工具 |

使用方式：

- `/preset` 打开选择器。
- `/preset <id>` 直接选择；`/preset status` 查看当前状态。
- 空白会话可以原地切换。已经产生对话的会话遵循官方 blank-only 规则，选择只会
  保存为新默认值，在 `/new` 或下一次启动时生效。
- 默认值保存在 `~/.cute-dsh-tui/agent-preset.json`。
- 优先级为：显式 `config.preset` 或 `CUTE_DSH_TUI_PRESET`，然后持久化偏好，最后名册
  默认值 `standard`。
- 恢复旧会话时，以该会话日志记录的 preset 为准，不读取当前默认值覆盖它。

自定义 preset 放在 `$DSH_HOME/.agent-presets/<name>/`，目录中应包含
`agent.cordis.yml`。默认 `DSH_HOME` 下的路径即 `~/.dsh/.agent-presets/`。

从 0.3 起，模型侧工具、plan、compaction、delegation 等由 preset 自己组合。
Profile 模式不再使用旧的 `CUTE_DSH_TUI_COMPACT_RATIO`、
`CUTE_DSH_TUI_COMPACT_RETAIN` 或旧版 TUI 的深度限制；这些策略应在 preset 中配置。

## MCP

官方 `@deepseek-ai/dsh-mcp-client` 同时支持 stdio 与 streamable HTTP。
每个服务挂载后，工具以 `mcp__<server>__<tool>` 注册并自动进入模型工具集。

在用户 `cordis.patch.yml` 中插入：

```yaml
- insert:
    - id: mcp-context7
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        transport: stdio
        serverName: context7
        command: npx
        args: ['-y', '@upstash/context7-mcp']

    - id: mcp-remote
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        transport: streamable-http
        serverName: remote
        url: https://example.com/mcp
        headers:
          Authorization: !!js process.env.MCP_TOKEN
```

运行 `/mcp` 查看已连接服务与工具数量。完整字段以
[DeepSeek Harness 配置目录](https://deepseek-harness.github.io/deepseek-harness/reference/config-catalog#deepseek-ai-dsh-mcp-client)
为准。

## 环境变量

| 变量 | 用途 |
| --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek 凭证；运行模型的必需项 |
| `DEEPSEEK_BASE_URL` | 覆盖 DeepSeek 兼容 API 端点 |
| `CUTE_DSH_TUI_PERSONA` | 覆盖组合注入的 Agent persona |
| `CUTE_DSH_TUI_PRESET` | 覆盖新会话默认 Agent preset |
| `CUTE_DSH_TUI_THEME` | 锁定内置或自定义主题，优先于持久化选择 |
| `CUTE_DSH_TUI_DISABLE_MOUSE` | 在 fullscreen 模式临时关闭鼠标处理 |
| `CUTE_DSH_TUI_RESUME_SESSION` | 启动时恢复指定会话，通常由启动器设置 |
| `CUTE_DSH_TUI_OPEN_RESUME_PICKER` | 启动时打开会话选择器（由 `dsh --resume` 设置） |
| `CUTE_DSH_TUI_SESSION_ROOT` | 覆盖会话持久化位置；profile 安装时是 SQLite 数据库路径，裸 `cordis.yml` 启动时是 JSONL 根目录 |
| `DSH_PERMISSION_MODE` | 所有平台的启动期 sandbox policy 覆盖，例如 `workspace-write` 或 `danger-full-access`；通常应优先使用会话内 `/permission` |
| `CUTE_DSH_TUI_YOLO` | 强制 danger-full-access 并跳过审批（由 `dsh --yolo` 设置） |
| `CUTE_DSH_TUI_WORKSPACE` | `cute-dsh-tui` 在 Windows、Linux、macOS 上采用的工作目录 |
| `CUTE_DSH_TUI_DEBUG` | 启用写往 stderr 的 cute-dsh-tui 调试日志 |
| `CUTE_DSH_TUI_RENDER_LOG` | 指定文件路径，记录原始 ANSI 渲染帧用于取证 |

`CUTE_DSH_TUI_RENDER_LOG` 可能捕获屏幕上可见的提示词、工具参数和输出，不应上传到
公开 issue，除非已经检查并脱敏。

## 组合约束

- `user-interaction` 服务通常由 `dsh-base` 提供。本插件会在裸装时兜底创建，
  但 profile patch 不应重复插入。
- 自定义插入 subagent provider 时，核心 `subagent` 服务必须先挂载。
- 自定义覆盖 `plan-mode` 时，`section` 必须是非空文本。
- Profile 使用本包的 SQLite `sessions` 行，并禁用 base 的 JSONL 持久化，避免
  同一会话出现两个写入所有者。
- `cordis.yml` 是裸组合示例，服务拓扑可能与 profile patch 不同。正常安装和用户
  覆盖应以 `cordis.patch.yml` 为准。

`CUTE_DSH_TUI_SESSION_ROOT` 的解释也随组合而变：`dsh --profile cute-dsh-tui` 使用本包 patch
插入的 SQLite 行，默认文件为 `$DSH_HOME/sessions`；直接运行
`dsh --config cordis.yml` 时，示例挂载的是 JSONL 持久化，默认目录为
`$DSH_HOME/sessions`。两种启动方式不要混用同一个已有数据目录。

权限相关配置与平台差异见[架构与限制](architecture.md#权限与安全边界)。
