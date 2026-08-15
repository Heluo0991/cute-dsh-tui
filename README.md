<p align="center">
  <img src="docs/assets/Cutedeepseek-pixelart.png" alt="CuteDshTui 像素角色" width="180">
</p>

<p align="center">
  <img src="docs/assets/first-screen.png" alt="CuteDshTui 首屏：Messages 艺术字与像素角色" width="100%">
</p>

<h1 align="center">CuteDshTui</h1>

<p align="center">
  为 DeepSeek Harness 打造的终端原生交互界面。<br>
  从任何兼容 Node 的 Windows、Linux 或 macOS 终端直接启动。
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@heluo0991/cute-dsh-tui"><img alt="npm" src="https://img.shields.io/npm/v/@heluo0991/cute-dsh-tui?style=flat-square&color=6aaeff"></a>
  <a href="https://github.com/Heluo0991/cute-dsh-tui"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-Heluo0991%2Fcute--dsh--tui-263146?style=flat-square"></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-7da1de?style=flat-square"></a>
  <a href="README_EN.md"><img alt="English README" src="https://img.shields.io/badge/README-English-abc2ec?style=flat-square"></a>
</p>

> 独立维护的社区项目；不隶属于、也不代表 DeepSeek Harness。

## 你会得到什么

- 原生终端对话、Markdown、工具卡片、文件引用与命令补全。
- 顶部的 Messages 艺术字、CuteDeepSeek 像素角色与启动扫光；首屏静止后不持续重绘。
- `/model` 两级选择模型与推理深度，`Max` 切换会短暂显示输入框边缘光效。
- `/resume`、`/new`、`/compact`、`/export`，以及按 fork 谱系整理的会话恢复。
- `/btw <问题>` 并行旁路提问；`/plugin` 管理当前 profile 的插件。
- 可见的思考状态、工作活动、上下文、权限/审批、主题与 Agent preset。

## 部署

### 第一次使用：还没有 DSH

前置条件：Node.js `^22.19 || >=24`、交互式终端 TTY，以及 DeepSeek API Key。
以下命令在 Windows、Linux 与 macOS 都适用：

```sh
npm install -g @deepseek-ai/dsh @heluo0991/cute-dsh-tui pnpm@latest
cute-dsh-tui
```

第一次运行会自动创建 `cute-dsh-tui` profile 并安装当前版本插件。之后只需进入你的项目目录并运行 `cute-dsh-tui`。

在 Linux/macOS 当前 shell 设置密钥：

```sh
export DEEPSEEK_API_KEY='your-key'
```

在 Windows PowerShell 当前窗口设置密钥：

```powershell
$env:DEEPSEEK_API_KEY = 'your-key'
```

### 已经安装 DSH：添加 CuteDshTui 插件

`dsh plugin` 使用 pnpm 管理 profile；请确保 pnpm 为 10 或更新版本。

```sh
npm install -g pnpm@latest   # 若尚未安装 pnpm
dsh plugin --profile cute-dsh-tui add @heluo0991/cute-dsh-tui
dsh --profile cute-dsh-tui
```

这条路径不会改动你的其他 DSH profile。配置位于 `$DSH_HOME/profiles/cute-dsh-tui/cordis.patch.yml`，会话保持在 `$DSH_HOME/sessions`，界面偏好保存在 `~/.cute-dsh-tui`。

### 更新

在 TUI 中使用 `/update`，或在终端执行：

```sh
dsh plugin --profile cute-dsh-tui update --latest @heluo0991/cute-dsh-tui
```

## 使用指南

启动前先 `cd` 到目标项目目录；当前目录即 Agent 的默认工作区。

| 想做什么 | 操作 |
| --- | --- |
| 查看全部可用命令 | `/help` |
| 选模型与推理深度 | `/model` |
| 恢复最近或指定会话 | `/resume`，或 `cute-dsh-tui --resume` |
| 新开会话、压缩、导出 | `/new`、`/compact`、`/export` |
| 不污染主对话地追问 | `/btw <问题>` |
| 查看或管理 profile 插件 | `/plugin list`、`/plugin search <词>` |
| 变更权限 | `Shift+Tab` 循环，或 `/permission` 精确选择 |
| 调整外观和语言 | `/theme`、`/lang`、`/activity` |

`--continue`（或 `-c`）恢复最近会话；`--yolo` 请求 `danger-full-access`。使用 `CUTE_DSH_TUI_WORKSPACE=/path/to/project` 可以从任意目录启动指定项目；该变量在 Windows、Linux 与 macOS 一致可用。

## 平台支持

CuteDshTui 的发布入口是 Node CLI，而不是 Windows 批处理。Windows、Linux、macOS 只要具备兼容 Node、npm、pnpm、DSH 和 TTY 即可原生运行；CI 会在 Ubuntu 与 macOS 上验证构建与无凭证安装流程。Windows 的 `cute-dsh-tui.cmd` 仅为仓库检出场景保留的兼容包装。

完整文档：[安装与快速开始](docs/getting-started.md) · [交互参考](docs/interaction.md) · [配置参考](docs/configuration.md) · [架构说明](docs/architecture.md)

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

本项目采用 [MIT License](LICENSE)。CuteDshTui 最初沿用了 [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) 的 fork 框架，并在其基础上独立演进；感谢原项目与贡献者的工作。

发行内容保留所需的上游版权与许可说明。
