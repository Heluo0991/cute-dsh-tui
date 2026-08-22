# 安装与快速开始

[文档索引](README.md) · [English](getting-started.en.md)

## 前置条件

- Node.js `^22.19 || >=24`。
- 支持交互输入的终端 TTY；不能把 stdout 重定向后运行 TUI。
- DeepSeek API key，或兼容端点所需的 `DEEPSEEK_BASE_URL`。
- 已安装 DeepSeek Harness 内核（`@deepseek-ai/dsh`）使 `dsh` 在 `PATH` 上，且
  `pnpm` 在 `PATH` 上。CuteDshTui 运行你本地安装的内核，而不再自带内核；如需
  固定，可用 `CUTE_DSH_TUI_DSH_BIN` / `CUTE_DSH_TUI_PNPM` 覆盖。

## 推荐部署：`cdsh`

无论 Windows、Linux 还是 macOS，先安装内核与 CuteDshTui，然后即可从任意目录直接运行 `cdsh`。它不会占用官方 `dsh` 命令，也不要求复制启动脚本。

```sh
npm install -g @deepseek-ai/dsh pnpm
npm install -g @heluo0991/cute-dsh-tui
cdsh
```

> npm 7+ 可能打印多条 `ERESOLVE overriding peer dependency` 警告：DSH 的 Web UI
> 客户端包声明 `react ^18`，而 CuteDshTui 的渲染器需要 React 19。这些 Web UI 包
> 不参与 TUI 运行，安装仍成功，警告可忽略。若想隐藏：
> `npm install -g @heluo0991/cute-dsh-tui --legacy-peer-deps`（或在用户 `~/.npmrc`
> 写入 `legacy-peer-deps=true`，但该设置会影响所有 npm 项目，需自行权衡）。

Linux 会为 `node-pty` 编译本机终端桥接模块。若最小化镜像缺少编译工具并报 `pty.node` 错误，执行：

```sh
sudo apt-get install -y build-essential python3
cdsh
```

启动器已允许并自动重试该原生构建；不需要手动运行 pnpm。

第一次执行会在 `$DSH_HOME/profiles/cute-dsh-tui`（默认 `~/.dsh/profiles/cute-dsh-tui`）创建 profile，并使用你本地的 DSH/pnpm 运行时安装本版本；profile 插件所需的 DSH 包由本地安装的内核解析。之后进入项目目录后运行 `cdsh` 即可；当前目录会成为 Agent 工作区。

`cute-dsh-tui` 仍可用作兼容命令，但新文档和支持流程一律使用 `cdsh`。

## 已安装官方 DSH 的用户

安装本包并运行 `cdsh` 即可创建独立 profile，原有的 `dsh` 与其他 profile 不会被修改：

```sh
npm install -g @heluo0991/cute-dsh-tui
cdsh
```

若你明确想用官方命令管理其他 profile，继续使用 `dsh plugin --profile <名称> ...`。不要把旧 TUI 包和 CuteDshTui 加到同一个 profile。

## API key

最安全且最简单的交互路径是在 TUI 中输入 `/login`：

1. 在掩码输入框粘贴 API key；该输入不会写入普通命令历史。
2. 如果启动终端已有 `DEEPSEEK_API_KEY`，DSH 将其视为只读启动来源；`/login` 显示状态。请在 shell 中更改变量并重启 `cdsh`。
3. 如果没有该变量，TUI 询问是否保存：确认后 Windows 写入当前用户环境变量；macOS/Linux 由 DSH 写入仅当前用户可读的 `$DSH_HOME/.credentials.yaml`，`cdsh` 与官方 `dsh` 后续都可使用。
4. 拒绝保存则只在本次会话有效；`/logout` 可清除本次会话，并可确认删除由 CuteDshTui 保存的密钥。

显式环境变量优先于保存配置，适合 CI、容器与密钥管理工具。

```sh
# Linux/macOS：仅当前 shell
export DEEPSEEK_API_KEY='your-key'
```

```powershell
# Windows PowerShell：仅当前窗口
$env:DEEPSEEK_API_KEY = 'your-key'

# Windows：后续新开终端的用户环境变量
setx DEEPSEEK_API_KEY "your-key"
```

`setx` 不会回写当前 PowerShell；请新开终端或用 `/login` 立即生效。不要使用系统级变量、将密钥写入仓库或 `.env` 项目文件。

## 常用启动参数

```sh
cdsh --resume              # 打开恢复选择器
cdsh --resume <session-id> # 恢复指定会话
cdsh --continue            # 恢复最近会话
cdsh --yolo                # 请求完整权限，TUI 会显示确认流程
```

`CUTE_DSH_TUI_WORKSPACE` 可让你从别处启动指定工作目录：

```sh
CUTE_DSH_TUI_WORKSPACE=/path/to/project cdsh
```

PowerShell：`$env:CUTE_DSH_TUI_WORKSPACE='C:\path\to\project'; cdsh`。

## 更新

在 TUI 内使用 `/update`，或更新全局入口：

```sh
npm install -g @heluo0991/cute-dsh-tui@latest
```

`/update` 保留当前会话并重启；如果网络或 registry 不可达，更新不会破坏已安装版本。

## 排错

- `cdsh` 找不到：关闭并重新打开终端，让 npm 全局 bin 目录进入 PATH。
- 首次安装失败：检查 npm registry 网络和 Node 版本；重新执行 `cdsh` 会安全重试。
- 未配置凭证：用 `/login`，或确认启动 `cdsh` 的同一 shell 中存在 `DEEPSEEK_API_KEY`。
- 需要诊断：TUI 内使用 `/doctor`；调试输出可设 `CUTE_DSH_TUI_DEBUG=1 cdsh`。
