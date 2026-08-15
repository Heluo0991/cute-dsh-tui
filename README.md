<p align="center">
  <img src="https://raw.githubusercontent.com/Heluo0991/cute-dsh-tui/e75fc5d/docs/assets/readme-terminal-banner.svg" alt="CuteDshTui 终端像素角色与 DeepSeek Harness 艺术字" width="100%">
</p>

<h1 align="center">CuteDshTui</h1>

<p align="center">
  为 DeepSeek Harness 打造的终端原生交互界面。<br>
  Windows、Linux、macOS 任意项目目录均可用 <code>cdsh</code> 启动。
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@heluo0991/cute-dsh-tui"><img alt="npm" src="https://img.shields.io/npm/v/@heluo0991/cute-dsh-tui?style=flat-square&color=6aaeff"></a>
  <a href="https://github.com/Heluo0991/cute-dsh-tui"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-Heluo0991%2Fcute--dsh--tui-263146?style=flat-square"></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-7da1de?style=flat-square"></a>
  <a href="README_EN.md"><img alt="English README" src="https://img.shields.io/badge/README-English-abc2ec?style=flat-square"></a>
</p>

> 独立维护的社区项目，不隶属于或代表 DeepSeek Harness。

## 特性

- 原生终端对话、Markdown、工具卡片、文件引用与命令补全。
- 启动时的 Messages 艺术字、像素角色与一次性扫光；稳定后不持续重绘。
- `/model` 两级选择模型与推理深度；Max 切换时输入框短暂显示光效。
- `/resume`、`/new`、`/compact`、`/export` 与 fork 感知的会话恢复。
- `/btw <问题>` 处理旁路提问；`/plugin` 管理当前 profile 的插件。
- 可见的 thinking/activity、上下文、审批、主题与 Agent preset。

## TUI 演示截图

真实启动首屏：像素角色与终端艺术字均由 TUI 渲染。

<p align="center">
  <img src="docs/assets/screenshot.png" alt="CuteDshTui 实际运行的启动首屏" width="100%">
</p>

## 部署

### 新用户：一条安装命令即可

前提：Node.js `^22.19 || >=24` 与交互式 TTY。CuteDshTui 自带其所需的 DSH 与 pnpm 运行时，不会覆盖官方 `dsh` 命令。

```sh
npm install -g @heluo0991/cute-dsh-tui
cdsh
```

安装完成后，进入任意项目目录执行 `cdsh` 即可。首次启动会创建隔离的 `cute-dsh-tui` profile 并安装当前版本；无需复制 `.cmd` 文件、手动配置 PATH 或全局安装 pnpm。`cute-dsh-tui` 仍保留为兼容别名。

### 已有 DSH 用户

官方 `dsh` 完全保留，安装 CuteDshTui 后直接运行：

```sh
npm install -g @heluo0991/cute-dsh-tui
cdsh
```

你仍可用原来的 `dsh plugin --profile <名称> ...` 管理其他 DSH profile。CuteDshTui 的 profile 位于 `$DSH_HOME/profiles/cute-dsh-tui`；DSH JSONL 会话仍位于 `$DSH_HOME/sessions`；界面偏好位于 `~/.cute-dsh-tui`。

## API key 与 `/login`

推荐首次进入 TUI 后输入 `/login`，在掩码输入框粘贴 DeepSeek API key。

- 当前终端已经有 `DEEPSEEK_API_KEY`：DSH 会将其视为只读的启动来源；`/login` 显示状态。请在 shell 中更新变量并重启 `cdsh`，避免界面显示与实际模型凭证不一致。
- 当前终端没有密钥：输入后会询问是否保存。确认后 Windows 写入当前用户环境变量；macOS/Linux 由 DSH 写入权限仅限当前用户的 `$DSH_HOME/.credentials.yaml`，`cdsh` 与官方 `dsh` 都可读取它。
- 拒绝保存：密钥只在本次会话有效，退出即失效。`/logout` 会清除本次会话，并可确认删除由 CuteDshTui 保存的密钥；它不会删除 shell 自己提供的密钥。
- 显式环境变量优先级最高，适合 CI、临时切换和密钥管理工具注入。

只想给当前终端临时设置时：

```sh
# Linux/macOS
export DEEPSEEK_API_KEY='your-key'
```

```powershell
# 当前 Windows PowerShell 窗口
$env:DEEPSEEK_API_KEY = 'your-key'
```

Windows 也可手动执行 `setx DEEPSEEK_API_KEY "your-key"` 写入用户环境变量；它只会影响随后新开的终端。不要把密钥提交到 Git、写入项目文件，或写入系统级环境变量（会扩大可读取范围）。

## 使用指南

从目标项目目录启动；当前目录就是 Agent 的默认工作区。

| 目标 | 命令或快捷键 |
| --- | --- |
| 查看全部命令 | `/help` |
| 登录或更新本次会话密钥 | `/login` |
| 选择模型与推理深度 | `/model` |
| 恢复最近或指定会话 | `/resume` 或 `cdsh --resume` |
| 新开、压缩、导出会话 | `/new`、`/compact`、`/export` |
| 不污染主对话地追问 | `/btw <问题>` |
| 查看或管理 profile 插件 | `/plugin list`、`/plugin search <词>` |
| 变更权限 | `Shift+Tab` 循环，或 `/permission` 精确选择 |
| 调整外观和语言 | `/theme`、`/lang`、`/activity` |

`--continue`（或 `-c`）恢复最近会话；`--yolo` 请求 `danger-full-access`。设置 `CUTE_DSH_TUI_WORKSPACE=/path/to/project` 可从任意目录启动指定项目，三种操作系统行为一致。

## 更新与平台支持

TUI 内使用 `/update` 更新当前 profile；也可以重新执行：

```sh
npm install -g @heluo0991/cute-dsh-tui@latest
```

`cdsh` 是纯 Node CLI，不依赖 Windows 批处理文件，支持 Windows、Linux、macOS 的 x64/arm64 Node 平台。`cute-dsh-tui.cmd` 仅为仓库检出时的旧兼容入口保留。

详细文档：[安装与快速开始](docs/getting-started.md) · [交互参考](docs/interaction.md) · [配置参考](docs/configuration.md) · [架构说明](docs/architecture.md)

## 开发

```sh
git clone https://github.com/Heluo0991/cute-dsh-tui.git
cd cute-dsh-tui
pnpm install --frozen-lockfile
pnpm run build
pnpm run smoke
```

发布前运行 `pnpm run verify:permissions`、`pnpm run verify:launcher`、`pnpm run verify:inline-thinking` 与 `npm pack --dry-run`。

## 许可与致谢

本项目采用 [MIT License](LICENSE)。CuteDshTui 最早沿用了 [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) 的 fork 框架，并在此基础上独立演进；感谢原项目及贡献者。

发行内容保留必要的上游版权与许可说明。
