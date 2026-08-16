/**
 * cute-dsh-tui localization — UI strings for Chinese (`zh`, the default) and
 * English (`en`).
 *
 * Resolution order mirrors the `/theme` mechanism (see themePrefs.ts):
 *
 *   1. `CUTE_DSH_TUI_LANG` env var (`en` / `zh`) — pinned at process start
 *   2. `lang` cordis.yml config key (see Config in index.ts)
 *   3. the persisted `/lang` choice in `~/.cute-dsh-tui/lang.json`
 *   4. the OS locale guess (`LC_ALL` / `LC_MESSAGES` / `LANG`)
 *   5. `zh` (the original hard-coded language)
 *
 * `/lang` switches at runtime and hot-swaps the whole UI. The dictionary is
 * a flat key → per-language string map; `t(key, params)` substitutes
 * `{{name}}` placeholders with the given params. Missing keys render the
 * key itself so a typo is visible in the UI instead of silently blank.
 */
export type Lang = 'zh' | 'en';
/** The languages shipped with the plugin, in display order. */
export declare const LANGS: readonly ["zh", "en"];
declare const dict: {
    readonly 'activity-indicator-already': {
        readonly zh: "指示器已是：{{name}}";
        readonly en: "Indicator already set: {{name}}";
    };
    readonly 'activity-indicator-switched': {
        readonly zh: "指示器已切换：{{name}}（已保存）";
        readonly en: "Indicator switched: {{name}} (saved)";
    };
    readonly 'activity-pref-write-failed': {
        readonly zh: "无法写入 ~/.cute-dsh-tui/working-activity.json，切换未保存";
        readonly en: "Cannot write ~/.cute-dsh-tui/working-activity.json, switch not saved";
    };
    readonly 'model-pref-write-failed': {
        readonly zh: "无法写入 ~/.cute-dsh-tui/model.json，模型选择不会保存到重启后";
        readonly en: "Cannot write ~/.cute-dsh-tui/model.json, the model choice will not survive a restart";
    };
    readonly 'model-route-invalid': {
        readonly zh: "持久化的模型路由 {{provider}}/{{model}} 不在该 provider 的模型列表中，已整体回退到 {{fallback}}";
        readonly en: "Persisted model route {{provider}}/{{model}} is not advertised by that provider; fell back to {{fallback}}";
    };
    readonly 'unknown-activity-preset': {
        readonly zh: "未知预设「{{name}}」· /activity frames 查看全部";
        readonly en: "Unknown preset \"{{name}}\" · /activity frames to view all";
    };
    readonly 'preset-unavailable': {
        readonly zh: "Preset 不可用——当前组合未挂载 agent-presets 名册";
        readonly en: "Preset unavailable — the agent-presets roster is not mounted";
    };
    readonly 'preset-agent-running': {
        readonly zh: "Agent 运行中，无法切换 preset";
        readonly en: "Agent is running, cannot switch preset";
    };
    readonly 'preset-not-found': {
        readonly zh: "Preset「{{id}}」不存在 · {{err}}";
        readonly en: "Preset \"{{id}}\" not found · {{err}}";
    };
    readonly 'preset-load-failed': {
        readonly zh: "Preset「{{id}}」无法加载 · {{broken}}";
        readonly en: "Preset \"{{id}}\" failed to load · {{broken}}";
    };
    readonly 'preset-already-current': {
        readonly zh: "当前 preset 已是：{{id}}";
        readonly en: "Current preset already: {{id}}";
    };
    readonly 'preset-pref-write-failed': {
        readonly zh: "无法写入 ~/.cute-dsh-tui/agent-preset.json，选择未保存";
        readonly en: "Cannot write ~/.cute-dsh-tui/agent-preset.json, selection not saved";
    };
    readonly 'preset-locked-saved-default': {
        readonly zh: "会话已开始，preset 已锁定（当前：{{current}}）· 已保存为默认：{{id}}（/new 或下次启动生效）";
        readonly en: "Session already started, preset locked (current: {{current}}) · Saved as default: {{id}} (applies on /new or next start)";
    };
    readonly 'preset-switch-failed': {
        readonly zh: "Preset 切换失败 · {{err}}";
        readonly en: "Preset switch failed · {{err}}";
    };
    readonly 'preset-switched-pref-failed': {
        readonly zh: "Preset 已切换：{{id}}，但默认偏好写入失败（重启后不保留）";
        readonly en: "Preset switched: {{id}}, but writing the default preference failed (won't persist after restart)";
    };
    readonly 'preset-switched-saved': {
        readonly zh: "Preset 已切换：{{id}}（已保存为默认）";
        readonly en: "Preset switched: {{id}} (saved as default)";
    };
    readonly 'mcp-none-configured': {
        readonly zh: "未配置 MCP 服务器。";
        readonly en: "No MCP servers configured.";
    };
    readonly 'mcp-insert-hint': {
        readonly zh: "在 profile 补丁层（~/.dsh/profiles/cute-dsh-tui/cordis.patch.yml）insert 一行即可，例：";
        readonly en: "Insert one line in the profile patch layer (~/.dsh/profiles/cute-dsh-tui/cordis.patch.yml), e.g.:";
    };
    readonly 'mcp-readme-hint': {
        readonly zh: "详见仓库 README 的 MCP 章节。";
        readonly en: "See the MCP section of the repo README.";
    };
    readonly 'mcp-server-tools': {
        readonly zh: "{{server}}（{{count}} 个工具）: {{tools}}";
        readonly en: "{{server}} ({{count}} tools): {{tools}}";
    };
    readonly 'child-stderr-line': {
        readonly zh: "子进程 stderr: {{line}}";
        readonly en: "Subprocess stderr: {{line}}";
    };
    readonly 'child-stderr-line-repeat': {
        readonly zh: "子进程 stderr: {{line}}（重复 {{count}} 次）";
        readonly en: "Subprocess stderr: {{line}} (repeated {{count}}×)";
    };
    readonly 'export-title': {
        readonly zh: "# cute-dsh-tui 会话导出";
        readonly en: "# cute-dsh-tui session export";
    };
    readonly 'export-time': {
        readonly zh: "- 导出时间: {{time}}";
        readonly en: "- Exported: {{time}}";
    };
    readonly 'export-model': {
        readonly zh: "- 模型: {{model}}";
        readonly en: "- Model: {{model}}";
    };
    readonly 'export-session': {
        readonly zh: "- 会话: {{id}}";
        readonly en: "- Session: {{id}}";
    };
    readonly 'export-dir': {
        readonly zh: "- 目录: {{cwd}}";
        readonly en: "- Directory: {{cwd}}";
    };
    readonly 'mentions-attached': {
        readonly zh: "已附加 {{count}} 个文件引用";
        readonly en: "Attached {{count}} file reference(s)";
    };
    readonly 'mentions-missing': {
        readonly zh: "未找到引用: {{paths}}";
        readonly en: "References not found: {{paths}}";
    };
    readonly 'send-failed': {
        readonly zh: "发送失败 · {{err}}";
        readonly en: "Send failed · {{err}}";
    };
    readonly 'export-user-section': {
        readonly zh: "## 用户";
        readonly en: "## User";
    };
    readonly 'export-thinking-section': {
        readonly zh: "## 思考";
        readonly en: "## Thinking";
    };
    readonly 'export-assistant-section': {
        readonly zh: "## 助手";
        readonly en: "## Assistant";
    };
    readonly 'export-tool-section': {
        readonly zh: "## 工具 · {{name}}";
        readonly en: "## Tool · {{name}}";
    };
    readonly 'export-result-section': {
        readonly zh: "### 结果";
        readonly en: "### Result";
    };
    readonly 'agentsmd-project': {
        readonly zh: "## 项目";
        readonly en: "## Project";
    };
    readonly 'agentsmd-project-body': {
        readonly zh: "（在此描述项目的目标、结构与约定——这份文件会注入给每个 agent 作为工作区上下文。）";
        readonly en: "(Describe the project's goals, structure and conventions here — this file is injected to every agent as workspace context.)";
    };
    readonly 'agentsmd-conventions': {
        readonly zh: "## 约定";
        readonly en: "## Conventions";
    };
    readonly 'agentsmd-convention-read': {
        readonly zh: "- 改动前先阅读相关模块";
        readonly en: "- Read the relevant modules before making changes";
    };
    readonly 'agentsmd-convention-style': {
        readonly zh: "- 保持与现有代码风格一致";
        readonly en: "- Keep consistent with the existing code style";
    };
    readonly 'clear-session-done': {
        readonly zh: "会话已清空";
        readonly en: "Session cleared";
    };
    readonly 'doctor-api-key': {
        readonly zh: "API key: {{state}}";
        readonly en: "API key: {{state}}";
    };
    readonly 'doctor-key-configured': {
        readonly zh: "已配置";
        readonly en: "configured";
    };
    readonly 'doctor-key-missing': {
        readonly zh: "未配置（DEEPSEEK_API_KEY）";
        readonly en: "not configured (DEEPSEEK_API_KEY)";
    };
    readonly 'doctor-model': {
        readonly zh: "模型: {{model}} · 提供方: {{provider}}";
        readonly en: "Model: {{model}} · Provider: {{provider}}";
    };
    readonly 'doctor-cwd': {
        readonly zh: "工作目录: {{cwd}}";
        readonly en: "Working directory: {{cwd}}";
    };
    readonly 'doctor-context-window': {
        readonly zh: "上下文窗口: {{window}} tokens";
        readonly en: "Context window: {{window}} tokens";
    };
    readonly 'doctor-unknown': {
        readonly zh: "未知";
        readonly en: "unknown";
    };
    readonly 'doctor-session': {
        readonly zh: "会话: {{id}}";
        readonly en: "Session: {{id}}";
    };
    readonly 'doctor-config': {
        readonly zh: "配置: {{candidate}} {{state}}";
        readonly en: "Config: {{candidate}} {{state}}";
    };
    readonly 'doctor-config-missing': {
        readonly zh: "（不存在）";
        readonly en: "(missing)";
    };
    readonly 'doctor-storage': {
        readonly zh: "会话存储: {{dir}} {{state}}";
        readonly en: "Session storage: {{dir}} {{state}}";
    };
    readonly 'doctor-storage-uninit': {
        readonly zh: "（未初始化）";
        readonly en: "(not initialized)";
    };
    readonly 'subagent-not-mounted': {
        readonly zh: "子代理服务未挂载（leaf 未启用 subagent）";
        readonly en: "Subagent service not mounted (leaf has no subagent)";
    };
    readonly 'subagent-none': {
        readonly zh: "当前会话暂无子代理";
        readonly en: "No subagents in the current session";
    };
    readonly 'subagent-resumable': {
        readonly zh: "可续";
        readonly en: "resumable";
    };
    readonly 'subagent-oneshot': {
        readonly zh: "一次性";
        readonly en: "one-shot";
    };
    readonly 'subagent-row': {
        readonly zh: "{{mode}} {{label}}{{activity}} · {{id}}";
        readonly en: "{{mode}} {{label}}{{activity}} · {{id}}";
    };
    readonly 'subagent-running': {
        readonly zh: " 运行中";
        readonly en: " running";
    };
    readonly 'subagent-archived': {
        readonly zh: " 已归档";
        readonly en: " archived";
    };
    readonly 'subagent-query-failed': {
        readonly zh: "查询失败 · {{err}}";
        readonly en: "Query failed · {{err}}";
    };
    readonly 'agent-preset-switched': {
        readonly zh: "Agent preset 已切换：{{preset}}";
        readonly en: "Agent preset switched: {{preset}}";
    };
    readonly 'questionnaire-answered': {
        readonly zh: "📋 问卷已答 · {{total}} 题";
        readonly en: "📋 Questionnaire answered · {{total}} questions";
    };
    readonly 'theme-sakura-name': {
        readonly zh: "樱花粉";
        readonly en: "Sakura Pink";
    };
    readonly 'context-truncated': {
        readonly zh: "…（已截断）";
        readonly en: "… (truncated)";
    };
    readonly 'context-sections': {
        readonly zh: "系统提示词 {{n}} 段";
        readonly en: "System prompt {{n}} sections";
    };
    readonly 'context-files': {
        readonly zh: "工作区指令 ×{{n}}";
        readonly en: "Workspace instructions ×{{n}}";
    };
    readonly 'context-runtime': {
        readonly zh: "运行时上下文 {{n}} 项";
        readonly en: "Runtime context {{n}} items";
    };
    readonly 'context-skills': {
        readonly zh: "技能 {{n}}";
        readonly en: "Skills {{n}}";
    };
    readonly 'context-tools': {
        readonly zh: "工具 {{n}}";
        readonly en: "Tools {{n}}";
    };
    readonly 'skill-audit-prompt': {
        readonly zh: "请使用 audit 技能对当前项目做一次全面的代码审计，找出安全、正确性与质量问题。";
        readonly en: "Use the audit skill to do a thorough code audit of the current project, finding security, correctness and quality issues.";
    };
    readonly 'skill-bug-prompt': {
        readonly zh: "请使用 bug 技能协助我记录一份完整的 bug 报告（现象、复现步骤、期望行为）。";
        readonly en: "Use the bug skill to help me write a complete bug report (symptoms, reproduction steps, expected behavior).";
    };
    readonly 'skill-practice-prompt': {
        readonly zh: "请使用 practice 技能陪我进行一轮编程练习。";
        readonly en: "Use the practice skill to run a round of programming practice with me.";
    };
    readonly 'skill-review-prompt': {
        readonly zh: "请使用 review 技能对当前项目做一次全面的代码评审。";
        readonly en: "Use the review skill to do a thorough code review of the current project.";
    };
    readonly 'skill-pr-comments-prompt': {
        readonly zh: "请使用 pr-comments 技能审查当前分支的拉取请求评论并给出改进建议。";
        readonly en: "Use the pr-comments skill to review pull request comments on the current branch and suggest improvements.";
    };
    readonly 'skill-release-notes-prompt': {
        readonly zh: "请使用 release-notes 技能为当前项目生成发布说明。";
        readonly en: "Use the release-notes skill to generate release notes for the current project.";
    };
    readonly 'skill-vuln-check-prompt': {
        readonly zh: "请使用 vuln-check 技能对当前项目做一次安全漏洞检查。";
        readonly en: "Use the vuln-check skill to run a security vulnerability check on the current project.";
    };
    readonly 'exit-ctrl-c-again': {
        readonly zh: "再按一次 Ctrl+C 退出";
        readonly en: "Press Ctrl+C again to exit";
    };
    readonly 'yolo-upgrade-unavailable': {
        readonly zh: "Yolo 升级不可用：未挂载权限服务";
        readonly en: "Yolo upgrade unavailable: permission service is not loaded";
    };
    readonly 'permission-unavailable-profile': {
        readonly zh: "当前 profile 未提供权限切换";
        readonly en: "Permission switching unavailable in this profile";
    };
    readonly 'permission-switch-running': {
        readonly zh: "回合运行中无法切换权限";
        readonly en: "Cannot switch permissions while a turn is running";
    };
    readonly 'permission-no-presets': {
        readonly zh: "当前 profile 没有可用的权限预设";
        readonly en: "No permission presets are available in this profile";
    };
    readonly 'new-session-started': {
        readonly zh: "新会话已开始";
        readonly en: "New session started";
    };
    readonly 'btw-none-yet': {
        readonly zh: "还没有 BTW 旁路会话。使用 /btw <问题>。";
        readonly en: "No BTW conversation yet. Use /btw <question>.";
    };
    readonly 'plugin-no-matches': {
        readonly zh: "没有匹配的已安装或已加载插件。`/plugin search` 只过滤本地列表，不会搜索 npm。";
        readonly en: "No matching installed or loaded plugins. `/plugin search` filters this local list; it does not search npm.";
    };
    readonly 'plugin-usage': {
        readonly zh: "用法: /plugin [list|search <词>|add <spec>|remove <包>|update [包]]";
        readonly en: "Usage: /plugin [list|search <text>|add <spec>|remove <package>|update [package]]";
    };
    readonly 'plugin-profile-required': {
        readonly zh: "插件变更需要通过 dsh --profile <名称> 启动。";
        readonly en: "Plugin changes require launching with dsh --profile <name>.";
    };
    readonly 'login-inherited-source': {
        readonly zh: "来源：启动环境变量（本次会话只读）。";
        readonly en: "Source: launch environment (read-only for this running session).";
    };
    readonly 'login-inherited-change-hint': {
        readonly zh: "如需更换，请在 shell 中更新 DEEPSEEK_API_KEY 并重启 cdsh。";
        readonly en: "To change it, update DEEPSEEK_API_KEY in the shell and restart cdsh.";
    };
    readonly 'logout-env-key': {
        readonly zh: "API key 来自启动环境变量。请在 shell 中清除后重启 cdsh。";
        readonly en: "The API key came from the launch environment. Clear it in the shell and restart cdsh.";
    };
    readonly 'logout-cleared-no-saved': {
        readonly zh: "已清除本次会话的 API key；未改动 CuteDshTui 保存的凭证。";
        readonly en: "API key cleared for this session. No CuteDshTui-saved credential was changed.";
    };
    readonly 'permissions-unavailable': {
        readonly zh: "当前 profile 未提供权限切换。";
        readonly en: "Permission switching is unavailable in this profile.";
    };
    readonly 'permissions-use-hint': {
        readonly zh: "使用 /permission 切换当前会话。";
        readonly en: "Use /permission to switch the current session.";
    };
    readonly 'rewind-none': {
        readonly zh: "还没有可回退的消息";
        readonly en: "Nothing to rewind yet";
    };
    readonly 'rewound-edit-resend': {
        readonly zh: "已回退——编辑后按 Enter 重新发送";
        readonly en: "Rewound — edit and press Enter to resend";
    };
    readonly 'yolo-enabled-resumed': {
        readonly zh: "已为这个恢复的会话启用 Yolo 升级";
        readonly en: "Yolo upgrade enabled for this resumed session";
    };
    readonly 'yolo-declined-preserved': {
        readonly zh: "已拒绝 Yolo 升级；保留该会话原有权限";
        readonly en: "Yolo upgrade declined; preserved this session's existing permission";
    };
    readonly 'session-resumed': {
        readonly zh: "会话已恢复";
        readonly en: "Session resumed";
    };
    readonly 'logout-saved-kept': {
        readonly zh: "已清除会话 API key，保留已保存凭证。";
        readonly en: "Session API key cleared. The saved credential was kept.";
    };
    readonly 'credential-saved-applied': {
        readonly zh: "API key 已保存供以后 cdsh 启动使用，并已应用到本次会话。";
        readonly en: "API key saved for future cdsh launches and applied to this session.";
    };
    readonly 'credential-save-failed': {
        readonly zh: "无法保存或应用 API key。请检查终端错误信息后重试。";
        readonly en: "Could not save or apply the API key. Check the terminal error message and try again.";
    };
    readonly 'credential-removed': {
        readonly zh: "已移除 CuteDshTui 保存的凭证。";
        readonly en: "Saved CuteDshTui credential removed.";
    };
    readonly 'credential-remove-failed': {
        readonly zh: "无法移除已保存凭证。";
        readonly en: "Could not remove the saved credential.";
    };
    readonly 'plugin-confirm-title': {
        readonly zh: "确认插件变更";
        readonly en: "Confirm plugin change";
    };
    readonly 'plugin-confirm-hint': {
        readonly zh: "这将重启 CuteDshTui 并恢复当前主会话。Enter 继续 · Esc 取消。";
        readonly en: "This will restart CuteDshTui and restore the current main session. Enter to continue · Esc to cancel.";
    };
    readonly 'context-loaded': {
        readonly zh: "已加载上下文";
        readonly en: "Context loaded";
    };
    readonly 'copied-chars': {
        readonly zh: "已复制 {{n}} 个字符";
        readonly en: "Copied {{n}} characters";
    };
    readonly 'activity-usage-name': {
        readonly zh: "/activity frames <名>";
        readonly en: "/activity frames <name>";
    };
    readonly 'activity-current-preset': {
        readonly zh: "当前预设  {{name}}";
        readonly en: "Current preset  {{name}}";
    };
    readonly 'activity-switch-hint': {
        readonly zh: "切换      /activity（选择器）或 /activity frames <名>";
        readonly en: "Switch      /activity (picker) or /activity frames <name>";
    };
    readonly 'activity-persist-hint': {
        readonly zh: "持久化    ~/.cute-dsh-tui/working-activity.json（重启后仍生效）";
        readonly en: "Persisted    ~/.cute-dsh-tui/working-activity.json (survives restart)";
    };
    readonly 'activity-current-direct': {
        readonly zh: "当前预设：{{name}} · /activity frames <名> 直接切换：";
        readonly en: "Current preset: {{name}} · /activity frames <name> to switch directly:";
    };
    readonly 'activity-random-each': {
        readonly zh: "每次随机";
        readonly en: "random each time";
    };
    readonly 'activity-current-marker': {
        readonly zh: "  ← 当前";
        readonly en: "  ← current";
    };
    readonly 'activity-usage': {
        readonly zh: "用法：/activity | /activity frames <名> | /activity status";
        readonly en: "Usage: /activity | /activity frames <name> | /activity status";
    };
    readonly 'preset-current': {
        readonly zh: "当前 preset  {{name}}";
        readonly en: "Current preset  {{name}}";
    };
    readonly 'preset-roster-missing': {
        readonly zh: "（未挂载名册）";
        readonly en: "(roster not mounted)";
    };
    readonly 'preset-switch-hint': {
        readonly zh: "切换        /preset（选择器）或 /preset <id>";
        readonly en: "Switch        /preset (picker) or /preset <id>";
    };
    readonly 'preset-persist-hint': {
        readonly zh: "持久化      ~/.cute-dsh-tui/agent-preset.json（重启后仍生效；cordis.yml preset 优先）";
        readonly en: "Persisted      ~/.cute-dsh-tui/agent-preset.json (survives restart; cordis.yml preset wins)";
    };
    readonly 'preset-lock-hint': {
        readonly zh: "锁定规则    已开始的会话不可切换（官方 blank-only 规则）";
        readonly en: "Lock rule     started sessions cannot switch (official blank-only rule)";
    };
    readonly 'preset-roster-unmounted': {
        readonly zh: "当前组合未挂载 agent-presets 名册（preset 不可用）";
        readonly en: "The agent-presets roster is not mounted (presets unavailable)";
    };
    readonly 'theme-name-arg': {
        readonly zh: "/theme <名字>";
        readonly en: "/theme <name>";
    };
    readonly 'theme-current': {
        readonly zh: "当前主题  {{name}}";
        readonly en: "Current theme  {{name}}";
    };
    readonly 'theme-switch-hint': {
        readonly zh: "切换      /theme（选择器）或 /theme <名字>";
        readonly en: "Switch      /theme (picker) or /theme <name>";
    };
    readonly 'theme-persist-hint': {
        readonly zh: "持久化    ~/.cute-dsh-tui/theme.json（重启后仍生效；CUTE_DSH_TUI_THEME 优先）";
        readonly en: "Persisted    ~/.cute-dsh-tui/theme.json (survives restart; CUTE_DSH_TUI_THEME wins)";
    };
    readonly 'theme-custom-hint': {
        readonly zh: "自定义    ~/.cute-dsh-tui/themes/<名字>.json（见 README「自定义主题」）";
        readonly en: "Custom      ~/.cute-dsh-tui/themes/<name>.json (see README \"Custom themes\")";
    };
    readonly 'theme-switched-saved': {
        readonly zh: "主题已切换：{{name}}（已保存）";
        readonly en: "Theme switched: {{name}} (saved)";
    };
    readonly 'theme-unknown': {
        readonly zh: "未知主题「{{name}}」· /theme 查看全部";
        readonly en: "Unknown theme \"{{name}}\" · /theme to view all";
    };
    readonly 'status-model': {
        readonly zh: "模型   {{model}}";
        readonly en: "Model   {{model}}";
    };
    readonly 'status-working': {
        readonly zh: "工作中";
        readonly en: "working";
    };
    readonly 'status-idle': {
        readonly zh: "空闲";
        readonly en: "idle";
    };
    readonly 'status-state': {
        readonly zh: "状态   {{state}}";
        readonly en: "Status   {{state}}";
    };
    readonly 'status-session': {
        readonly zh: "会话   {{id}}";
        readonly en: "Session   {{id}}";
    };
    readonly 'status-dir': {
        readonly zh: "目录   {{cwd}}";
        readonly en: "Directory   {{cwd}}";
    };
    readonly 'cost-cache-rate': {
        readonly zh: "缓存率 {{rate}}% · {{read}} 读 / {{write}} 写";
        readonly en: "Cache rate {{rate}}% · {{read}} read / {{write}} write";
    };
    readonly 'cost-context': {
        readonly zh: "上下文 {{pct}}%";
        readonly en: "Context {{pct}}%";
    };
    readonly 'status-title': {
        readonly zh: "标题   {{title}}";
        readonly en: "Title   {{title}}";
    };
    readonly 'cost-cache-hit-rate': {
        readonly zh: "缓存命中率 {{rate}}% · 缓存 {{read}} 读 / {{write}} 写";
        readonly en: "Cache hit rate {{rate}}% · cache {{read}} read / {{write}} write";
    };
    readonly 'cost-note': {
        readonly zh: "注：DSH 不提供 API 费用计量，以上为 token 用量（按 provider 账单计费）";
        readonly en: "Note: DSH provides no API cost metering; the above is token usage (billed by your provider)";
    };
    readonly 'doctor-example-config': {
        readonly zh: "示例配置  {{path}}";
        readonly en: "Example config  {{path}}";
    };
    readonly 'doctor-user-config': {
        readonly zh: "用户配置  {{path}}";
        readonly en: "User config  {{path}}";
    };
    readonly 'doctor-launch-hint': {
        readonly zh: "启动方式  cdsh（官方 dsh 保持可用）";
        readonly en: "Launch      cdsh (official dsh remains available)";
    };
    readonly 'doctor-route-hint': {
        readonly zh: "模型路由  由 cordis.yml 或持久化选择决定（/model 通过会话 fork 切换）";
        readonly en: "Model route  set by cordis.yml or persisted selection (/model switches through a session fork)";
    };
    readonly 'export-failed': {
        readonly zh: "导出失败（无法写入工作目录）";
        readonly en: "Export failed (cannot write to working directory)";
    };
    readonly 'export-saved': {
        readonly zh: "已导出: {{target}}";
        readonly en: "Exported: {{target}}";
    };
    readonly 'agentsmd-create-failed': {
        readonly zh: "创建 AGENTS.md 失败";
        readonly en: "Failed to create AGENTS.md";
    };
    readonly 'agentsmd-exists': {
        readonly zh: "AGENTS.md 已存在，未覆盖";
        readonly en: "AGENTS.md already exists, not overwritten";
    };
    readonly 'agentsmd-created': {
        readonly zh: "已创建 {{result}}";
        readonly en: "Created {{result}}";
    };
    readonly 'login-api-key': {
        readonly zh: "API key: {{key}}";
        readonly en: "API key: {{key}}";
    };
    readonly 'login-key-missing': {
        readonly zh: "未配置（DEEPSEEK_API_KEY）";
        readonly en: "not configured (DEEPSEEK_API_KEY)";
    };
    readonly 'login-base-url': {
        readonly zh: "Base URL: {{url}}";
        readonly en: "Base URL: {{url}}";
    };
    readonly 'login-official-endpoint': {
        readonly zh: "官方端点";
        readonly en: "official endpoint";
    };
    readonly 'login-source-hint': {
        readonly zh: "来源：启动环境变量 → DSH 加密凭证存储";
        readonly en: "Source: launch environment → DSH credential store";
    };
    readonly 'login-logout-hint': {
        readonly zh: "DSH 凭证可来自环境变量或已保存的凭证存储。/logout 只会移除 CuteDshTui 保存的凭证。";
        readonly en: "DSH credentials may come from the environment or saved credential store. /logout removes only credentials saved by CuteDshTui.";
    };
    readonly 'login-session-applied': {
        readonly zh: "API key 已用于本次 CuteDshTui 会话。";
        readonly en: "API key set for this CuteDshTui session only.";
    };
    readonly 'login-session-applied-exit': {
        readonly zh: "API key 已用于本次会话；退出 TUI 时恢复原状态。";
        readonly en: "API key set for this session only. It is restored when the TUI exits.";
    };
    readonly 'login-session-failed': {
        readonly zh: "无法应用本次会话专用的 API key。";
        readonly en: "Could not apply the session-only API key.";
    };
    readonly 'login-session-unavailable': {
        readonly zh: "当前启动方式不支持仅本次会话的 API key。";
        readonly en: "Session-only API keys are unavailable in this launch mode.";
    };
    readonly 'login-release-failed': {
        readonly zh: "无法释放本次会话专用的 API key。";
        readonly en: "Could not release the session-only API key.";
    };
    readonly 'login-title': {
        readonly zh: "连接 DeepSeek";
        readonly en: "Connect DeepSeek";
    };
    readonly 'login-body': {
        readonly zh: "粘贴 DeepSeek API key。输入已掩码、不会进入命令历史，并立即应用到本次会话。";
        readonly en: "Paste a DeepSeek API key. It is masked, never added to command history, and applies immediately to this session.";
    };
    readonly 'login-api-key-label': {
        readonly zh: "API key";
        readonly en: "API key";
    };
    readonly 'login-save-warning': {
        readonly zh: "当前终端没有 key。下一屏确认后才会保存，供以后 cdsh 启动使用。";
        readonly en: "No key exists in this terminal. Confirm on the next screen to save it for future cdsh launches.";
    };
    readonly 'login-error-empty': {
        readonly zh: "请先输入 API key。";
        readonly en: "Enter an API key first.";
    };
    readonly 'login-action-continue': {
        readonly zh: "继续";
        readonly en: "continue";
    };
    readonly 'login-action-cancel': {
        readonly zh: "取消";
        readonly en: "cancel";
    };
    readonly 'login-save-title': {
        readonly zh: "保存 API key 供以后 cdsh 启动使用？";
        readonly en: "Save API key for future cdsh launches?";
    };
    readonly 'login-save-body': {
        readonly zh: "Windows 会保存为用户环境变量。macOS/Linux 通过 DSH 的仅属主凭证存储保存，立即生效并供以后 cdsh 启动复用。";
        readonly en: "Windows saves it as your user environment variable. macOS/Linux save it through DSH's owner-only credential store, which is applied immediately and reused by later cdsh launches.";
    };
    readonly 'login-save-hint': {
        readonly zh: "Enter 保存 · Esc 仅本次会话使用";
        readonly en: "Enter saves · Esc keeps it for this session only";
    };
    readonly 'login-delete-title': {
        readonly zh: "忘记已保存的 API key？";
        readonly en: "Forget the saved API key?";
    };
    readonly 'login-delete-body': {
        readonly zh: "这将移除 CuteDshTui 之前保存的凭证；shell 提供的 key 永远不会被改动。";
        readonly en: "This removes the credential previously saved by CuteDshTui. Keys supplied by your shell are never changed.";
    };
    readonly 'login-delete-hint': {
        readonly zh: "Enter 移除 · Esc 保留";
        readonly en: "Enter removes it · Esc keeps it";
    };
    readonly 'btw-pane-title': {
        readonly zh: "BTW · 旁路会话";
        readonly en: "BTW · side conversation";
    };
    readonly 'btw-pane-hint': {
        readonly zh: "已复制上下文 · 主会话不受影响 · Esc 返回 · Ctrl+C 停止 · Ctrl+O 详情";
        readonly en: "Forked context · main conversation is unchanged · Esc returns · Ctrl+C stops · Ctrl+O details";
    };
    readonly 'btw-working': {
        readonly zh: "旁路会话正在工作…";
        readonly en: "Working in side conversation…";
    };
    readonly 'btw-placeholder': {
        readonly zh: "继续追问…";
        readonly en: "Ask a follow-up…";
    };
    readonly 'action-navigate': {
        readonly zh: "移动";
        readonly en: "navigate";
    };
    readonly 'action-select': {
        readonly zh: "选择";
        readonly en: "select";
    };
    readonly 'action-cancel': {
        readonly zh: "取消";
        readonly en: "cancel";
    };
    readonly 'action-confirm': {
        readonly zh: "确认";
        readonly en: "confirm";
    };
    readonly 'action-exit': {
        readonly zh: "退出";
        readonly en: "exit";
    };
    readonly 'action-back': {
        readonly zh: "返回";
        readonly en: "back";
    };
    readonly 'action-switch-model': {
        readonly zh: "切换模型";
        readonly en: "switch model";
    };
    readonly 'action-choose-depth': {
        readonly zh: "选择深度";
        readonly en: "choose depth";
    };
    readonly 'action-rewind': {
        readonly zh: "回退";
        readonly en: "rewind";
    };
    readonly 'action-allow-once': {
        readonly zh: "允许一次";
        readonly en: "allow once";
    };
    readonly 'action-deny': {
        readonly zh: "拒绝";
        readonly en: "deny";
    };
    readonly 'action-enable-full': {
        readonly zh: "启用完整访问";
        readonly en: "enable full access";
    };
    readonly 'action-keep-permission': {
        readonly zh: "保持当前权限";
        readonly en: "keep current permission";
    };
    readonly 'action-expand': {
        readonly zh: "展开";
        readonly en: "expand";
    };
    readonly 'action-expand-collapse-fork': {
        readonly zh: "展开/折叠 fork 组";
        readonly en: "expand/collapse fork group";
    };
    readonly 'injected-context-label': {
        readonly zh: "注入的上下文";
        readonly en: "Injected context";
    };
    readonly 'thinking-label': {
        readonly zh: "思考";
        readonly en: "Thinking";
    };
    readonly 'approval-title': {
        readonly zh: "需要审批";
        readonly en: "Approval required";
    };
    readonly 'approval-tool': {
        readonly zh: "工具";
        readonly en: "Tool";
    };
    readonly 'approval-reason': {
        readonly zh: "原因";
        readonly en: "Reason";
    };
    readonly 'approval-call': {
        readonly zh: "调用";
        readonly en: "Call";
    };
    readonly 'approval-queued': {
        readonly zh: "另有 {{count}} 个审批请求排队。";
        readonly en: "{{count}} additional approval request(s) queued.";
    };
    readonly 'history-title': {
        readonly zh: "搜索历史";
        readonly en: "Search history";
    };
    readonly 'history-placeholder': {
        readonly zh: "输入以搜索…";
        readonly en: "Type to search…";
    };
    readonly 'history-no-matches': {
        readonly zh: "无匹配命令";
        readonly en: "No matching commands";
    };
    readonly 'history-age-now': {
        readonly zh: "刚刚";
        readonly en: "now";
    };
    readonly 'history-age-minutes': {
        readonly zh: "{{n}} 分钟前";
        readonly en: "{{n}}m ago";
    };
    readonly 'history-age-hours': {
        readonly zh: "{{n}} 小时前";
        readonly en: "{{n}}h ago";
    };
    readonly 'history-age-days': {
        readonly zh: "{{n}} 天前";
        readonly en: "{{n}}d ago";
    };
    readonly 'interrupted-label': {
        readonly zh: "已打断";
        readonly en: "Interrupted";
    };
    readonly 'interrupted-question': {
        readonly zh: "· 你希望 DeepSeek 接下来做什么？";
        readonly en: "· What should DeepSeek do instead?";
    };
    readonly 'permission-picker-title': {
        readonly zh: "权限";
        readonly en: "Permissions";
    };
    readonly 'permission-picker-subtitle': {
        readonly zh: "作用于本次会话及其后续工具调用。";
        readonly en: "Applies to this session and its future tool calls.";
    };
    readonly 'full-access-title': {
        readonly zh: "启用完整访问？";
        readonly en: "Enable full access?";
    };
    readonly 'full-access-body': {
        readonly zh: "完整访问会移除工作区边界，并关闭本次会话的审批提示；命令可以读取、修改或执行项目之外的内容。";
        readonly en: "Full access removes the workspace boundary and disables approval prompts for this session. Commands may read, modify, or execute outside the current project.";
    };
    readonly 'full-access-yolo-body': {
        readonly zh: "这个恢复的会话此前受限。`--yolo` 请求升级权限；确认后立即应用。";
        readonly en: "This resumed session was previously restricted. `--yolo` requested an upgrade; confirm to apply it now.";
    };
    readonly 'rewind-picker-title': {
        readonly zh: "回退";
        readonly en: "Rewind";
    };
    readonly 'rewind-picker-subtitle': {
        readonly zh: "选择要回退到的消息";
        readonly en: "Pick a message to rewind the conversation to";
    };
    readonly 'rewind-picker-confirm': {
        readonly zh: "回退会话到这条消息？";
        readonly en: "Rewind conversation to this message?";
    };
    readonly 'rewind-row-description': {
        readonly zh: "会话从这里重新开始";
        readonly en: "conversation restarts here";
    };
    readonly 'rewind-row-last': {
        readonly zh: "最后一条消息";
        readonly en: "last message";
    };
    readonly 'rewind-no-rows': {
        readonly zh: "没有可回退的消息";
        readonly en: "No messages to rewind to";
    };
    readonly 'thinking-toggle-title': {
        readonly zh: "切换思考模式";
        readonly en: "Toggle thinking mode";
    };
    readonly 'thinking-toggle-subtitle': {
        readonly zh: "启用或禁用本次会话的扩展思考。";
        readonly en: "Enable or disable thinking for this session.";
    };
    readonly 'thinking-enabled': {
        readonly zh: "启用";
        readonly en: "Enabled";
    };
    readonly 'thinking-disabled': {
        readonly zh: "禁用";
        readonly en: "Disabled";
    };
    readonly 'thinking-enabled-desc': {
        readonly zh: "DeepSeek 回答前先进行思考";
        readonly en: "DeepSeek will think before responding";
    };
    readonly 'thinking-disabled-desc': {
        readonly zh: "DeepSeek 不进行扩展思考，直接回答";
        readonly en: "DeepSeek will respond without extended thinking";
    };
    readonly 'thinking-warning': {
        readonly zh: "会话中途切换思考模式会增加延迟并可能降低质量。建议在会话开始时设置。";
        readonly en: "Changing thinking mode mid-conversation will increase latency and may reduce quality. For best results, set this at the start of a session.";
    };
    readonly 'thinking-confirm-question': {
        readonly zh: "确认继续吗？";
        readonly en: "Do you want to proceed?";
    };
    readonly 'effort-picker-title': {
        readonly zh: "推理深度 · 第 2 步 / 共 2 步";
        readonly en: "Reasoning depth · step 2 of 2";
    };
    readonly 'logo-tip-label': {
        readonly zh: "提示: ";
        readonly en: "Tip: ";
    };
    readonly 'permissions-root-hint': {
        readonly zh: "当前文件系统策略以工作目录为根：{{cwd}}";
        readonly en: "Current filesystem policy is rooted at the working directory: {{cwd}}";
    };
    readonly 'permissions-path-hint': {
        readonly zh: "模型工具相对路径均解析自该目录；跨目录访问由 fs-policy 拦截。";
        readonly en: "Relative paths of model tools resolve from this directory; cross-directory access is blocked by fs-policy.";
    };
    readonly 'update-unavailable': {
        readonly zh: "当前运行方式不支持自动更新（需经 dsh --profile 启动），请在终端执行 dsh plugin --profile <name> update @heluo0991/cute-dsh-tui";
        readonly en: "Automatic update is unavailable in this launch mode (needs dsh --profile). Run dsh plugin --profile <name> update @heluo0991/cute-dsh-tui in a terminal.";
    };
    readonly 'update-working': {
        readonly zh: "当前回合仍在运行，请等待完成后再更新 TUI。";
        readonly en: "The current turn is still running. Wait for it to finish before updating the TUI.";
    };
    readonly 'update-starting': {
        readonly zh: "正在更新 @heluo0991/cute-dsh-tui，完成后会自动重启并恢复当前会话……";
        readonly en: "Updating @heluo0991/cute-dsh-tui. The TUI will restart and resume this session when finished…";
    };
    readonly 'update-available': {
        readonly zh: "发现新版本：v{{latest}}（当前 v{{current}}）· 输入 /update 更新 TUI";
        readonly en: "New version available: v{{latest}} (current v{{current}}) · type /update to update the TUI";
    };
    readonly 'update-already-latest': {
        readonly zh: "当前已是最新版本（v{{current}}）。";
        readonly en: "Already on the latest version (v{{current}}).";
    };
    readonly 'update-check-failed': {
        readonly zh: "无法确认新版本（网络或 registry 不可达），已尝试直接更新……";
        readonly en: "Could not confirm a newer version (network or registry unreachable); attempting the update anyway…";
    };
    readonly 'terminal-setup-hint': {
        readonly zh: "推荐 Windows Terminal（≥110 列、等宽字体、TrueColor）。";
        readonly en: "Recommended: Windows Terminal (≥110 columns, monospace, TrueColor).";
    };
    readonly 'terminal-paste-hint': {
        readonly zh: "Ctrl+V 粘贴文本/文件路径；Ctrl+Shift+V 终端原生粘贴；右键粘贴同样可用。";
        readonly en: "Ctrl+V pastes text/file paths; Ctrl+Shift+V is native terminal paste; right-click paste also works.";
    };
    readonly 'theme-switch-failed': {
        readonly zh: "主题「{{name}}」切换失败（无法写入 ~/.cute-dsh-tui/theme.json）";
        readonly en: "Theme \"{{name}}\" switch failed (cannot write ~/.cute-dsh-tui/theme.json)";
    };
    readonly 'interrupt-delivered': {
        readonly zh: "已打断当前回合，{{n}} 条消息立即处理";
        readonly en: "Interrupted current turn, {{n}} messages processed immediately";
    };
    readonly 'activity-ctx-warn': {
        readonly zh: "⚠ 上下文";
        readonly en: "⚠ ctx ";
    };
    readonly 'activity-random-each-preset': {
        readonly zh: "每次随机一个预设";
        readonly en: "random preset each time";
    };
    readonly 'preset-default-tag': {
        readonly zh: "（默认）";
        readonly en: " (default)";
    };
    readonly 'preset-broken-tag': {
        readonly zh: "（无法加载）";
        readonly en: " (failed to load)";
    };
    readonly 'effort-unavailable': {
        readonly zh: "推理等级切换不可用（llm 服务未挂载）";
        readonly en: "Reasoning effort switching unavailable (llm service not mounted)";
    };
    readonly 'effort-read-failed': {
        readonly zh: "推理等级读取失败 · {{error}}";
        readonly en: "Failed to read reasoning efforts · {{error}}";
    };
    readonly 'effort-single-tier': {
        readonly zh: "当前模型只有一档推理等级（{{name}}）";
        readonly en: "Current model has a single reasoning effort ({{name}})";
    };
    readonly 'effort-unsupported': {
        readonly zh: "当前模型不支持推理等级切换";
        readonly en: "Current model does not support reasoning effort switching";
    };
    readonly 'effort-switched': {
        readonly zh: "推理强度 → {{name}}";
        readonly en: "Reasoning effort → {{name}}";
    };
    readonly 'rewind-unavailable': {
        readonly zh: "回退不可用——未加载会话服务";
        readonly en: "Rewind unavailable — session services not loaded";
    };
    readonly 'rewind-settling': {
        readonly zh: "当前回合仍在收尾，暂不能回退，请稍后再试";
        readonly en: "Cannot rewind — the turn is still settling, try again in a moment";
    };
    readonly 'rewind-failed': {
        readonly zh: "回退失败——无法创建替代会话";
        readonly en: "Rewind failed — could not create the replacement session";
    };
    readonly 'resume-running': {
        readonly zh: "回合运行中无法恢复会话";
        readonly en: "Cannot resume while a turn is running";
    };
    readonly 'resume-unavailable': {
        readonly zh: "恢复不可用——未加载 agents 服务";
        readonly en: "Resume unavailable — agents service not loaded";
    };
    readonly 'new-session-running': {
        readonly zh: "回合运行中无法开始新会话";
        readonly en: "Cannot start a new session while a turn is running";
    };
    readonly 'new-session-unavailable': {
        readonly zh: "新会话不可用——未加载 agents 服务";
        readonly en: "New session unavailable — agents service not loaded";
    };
    readonly 'model-switch-running': {
        readonly zh: "回合运行中无法切换模型";
        readonly en: "Cannot switch models while a turn is running";
    };
    readonly 'model-switch-unavailable': {
        readonly zh: "模型切换不可用——未加载会话服务";
        readonly en: "Model switch unavailable — session services not loaded";
    };
    readonly 'reasoning-pref-failed': {
        readonly zh: "推理深度已切换，但偏好写入失败（重启后不保留）";
        readonly en: "Reasoning depth changed, but the preference could not be saved";
    };
    readonly 'btw-unavailable': {
        readonly zh: "BTW 不可用：未加载会话服务";
        readonly en: "BTW is unavailable: session services are not loaded";
    };
    readonly 'btw-needs-main-turn': {
        readonly zh: "BTW 需要主会话至少完成一个回合后才能并行运行";
        readonly en: "BTW needs one completed main turn before it can run in parallel";
    };
    readonly 'btw-cancelled': {
        readonly zh: "BTW 已取消";
        readonly en: "BTW cancelled";
    };
    readonly 'permission-command-unavailable': {
        readonly zh: "权限切换不可用：未加载命令服务";
        readonly en: "Permission switching unavailable: command service not loaded";
    };
    readonly 'permission-command-not-registered': {
        readonly zh: "权限切换不可用：DSH /permission 未注册";
        readonly en: "Permission switching unavailable: DSH /permission is not registered";
    };
    readonly 'permission-switch-failed': {
        readonly zh: "权限切换失败 · {{error}}";
        readonly en: "Permission switch failed · {{error}}";
    };
    readonly 'compact-unavailable': {
        readonly zh: "压缩不可用——当前组合没有 compaction 服务";
        readonly en: "Compaction unavailable · no compaction service in this leaf";
    };
    readonly 'compact-running': {
        readonly zh: "回合运行中无法压缩";
        readonly en: "Cannot compact while a turn is running";
    };
    readonly compacting: {
        readonly zh: "正在压缩会话…";
        readonly en: "Compacting conversation…";
    };
    readonly 'compacted-notice': {
        readonly zh: "会话已压缩";
        readonly en: "Conversation compacted";
    };
    readonly 'interrupted-what-instead': {
        readonly zh: "已打断 · 你希望接下来做什么？";
        readonly en: "Interrupted · What should Claude do instead?";
    };
    readonly 'context-low': {
        readonly zh: "上下文偏低（剩余 {{percent}}%）· 可运行 /clear 或开始新会话";
        readonly en: "Context low ({{percent}}% remaining) · Run /clear or start a new session";
    };
    readonly 'rewind-to-point-failed': {
        readonly zh: "无法回退到该位置 · {{error}}";
        readonly en: "Cannot rewind to this point · {{error}}";
    };
    readonly 'resume-failed': {
        readonly zh: "恢复失败 · {{error}}";
        readonly en: "Resume failed · {{error}}";
    };
    readonly 'new-session-failed': {
        readonly zh: "新会话失败 · {{error}}";
        readonly en: "New session failed · {{error}}";
    };
    readonly 'model-switch-fork-failed': {
        readonly zh: "无法切换模型 · {{error}}";
        readonly en: "Cannot switch models · {{error}}";
    };
    readonly 'model-switch-failed': {
        readonly zh: "模型切换失败 · {{error}}";
        readonly en: "Model switch failed · {{error}}";
    };
    readonly 'btw-fork-failed': {
        readonly zh: "BTW 无法派生会话：{{error}}";
        readonly en: "BTW could not fork this conversation: {{error}}";
    };
    readonly 'unknown-permission-preset': {
        readonly zh: "未知权限预设：{{preset}}";
        readonly en: "Unknown permission preset: {{preset}}";
    };
    readonly 'compacted-done': {
        readonly zh: "会话已压缩";
        readonly en: "Conversation compacted";
    };
    readonly 'compact-nothing': {
        readonly zh: "没有可压缩的内容";
        readonly en: "Nothing to compact";
    };
    readonly 'compaction-failed': {
        readonly zh: "压缩失败 · {{error}}";
        readonly en: "Compaction failed · {{error}}";
    };
    readonly 'logo-tagline': {
        readonly zh: "探索未至之境！";
        readonly en: "Explore the uncharted!";
    };
    readonly 'logo-tip-model': {
        readonly zh: "切换模型";
        readonly en: "switch model";
    };
    readonly 'logo-tip-help': {
        readonly zh: "查看命令";
        readonly en: "view commands";
    };
    readonly 'logo-tip-tab': {
        readonly zh: "自动补全";
        readonly en: "autocomplete";
    };
    readonly 'input-sent-after-turn': {
        readonly zh: "已发送，当前回合结束后处理";
        readonly en: "Sent, processed after the current turn";
    };
    readonly 'input-interrupted-next': {
        readonly zh: "已插话 · 下一步立即处理";
        readonly en: "Interrupted · processed next";
    };
    readonly 'input-queued-after-turn': {
        readonly zh: "已排队 · 回合结束后处理";
        readonly en: "Queued · processed after the turn";
    };
    readonly 'input-cannot-retract': {
        readonly zh: "无法撤回：消息可能已被处理，或当前版本不支持";
        readonly en: "Cannot retract: the message may already be processed, or this version doesn't support it";
    };
    readonly 'input-retracted': {
        readonly zh: "已撤回，可编辑后重新发送";
        readonly en: "Retracted, editable and resendable";
    };
    readonly 'input-empty': {
        readonly zh: "输入为空，没有可发送的内容";
        readonly en: "Empty input, nothing to send";
    };
    readonly 'input-interrupt-immediate': {
        readonly zh: "已打断当前回合，正在立即处理";
        readonly en: "Interrupted current turn, processing immediately";
    };
    readonly 'input-clipboard-empty': {
        readonly zh: "剪贴板为空";
        readonly en: "Clipboard is empty";
    };
    readonly 'input-esc-again-rewind': {
        readonly zh: "再按 Esc 回退";
        readonly en: "Press Esc again to rewind";
    };
    readonly 'input-esc-again-clear': {
        readonly zh: "再按 Esc 清空";
        readonly en: "Press Esc again to clear";
    };
    readonly 'input-pending-steer-label': {
        readonly zh: "插话 · 下一步送达";
        readonly en: "Steer · delivered next";
    };
    readonly 'input-pending-queue-label': {
        readonly zh: "排队 · 回合结束后送达";
        readonly en: "Queued · delivered after the turn";
    };
    readonly 'input-pending-actions-hint': {
        readonly zh: "撤回 · Esc 打断并立即发送";
        readonly en: "Retract · Esc interrupts and sends immediately";
    };
    readonly 'help-shortcut-slash': {
        readonly zh: "/ 打开命令";
        readonly en: "/ for commands";
    };
    readonly 'help-shortcut-question': {
        readonly zh: "? 打开帮助";
        readonly en: "? for this help";
    };
    readonly 'help-shortcut-verbose': {
        readonly zh: "ctrl+o 切换详情";
        readonly en: "ctrl+o for verbose output";
    };
    readonly 'help-shortcut-context': {
        readonly zh: "ctrl+t 切换上下文";
        readonly en: "ctrl+t to toggle context";
    };
    readonly 'help-shortcut-history': {
        readonly zh: "ctrl+r 搜索历史";
        readonly en: "ctrl+r to search history";
    };
    readonly 'help-shortcut-interrupt': {
        readonly zh: "ctrl+c 中断";
        readonly en: "ctrl+c to interrupt";
    };
    readonly 'help-shortcut-exit': {
        readonly zh: "ctrl+d 退出";
        readonly en: "ctrl+d to exit";
    };
    readonly 'help-shortcut-redraw': {
        readonly zh: "ctrl+l 重绘";
        readonly en: "ctrl+l to redraw";
    };
    readonly 'help-shortcut-show-older': {
        readonly zh: "ctrl+g 显示/折叠旧消息";
        readonly en: "ctrl+g to show/fold old messages";
    };
    readonly 'help-edit-esc': {
        readonly zh: "esc 清空输入";
        readonly en: "esc to clear input";
    };
    readonly 'help-edit-history': {
        readonly zh: "↑/↓ 浏览历史";
        readonly en: "↑/↓ for history";
    };
    readonly 'help-edit-cursor': {
        readonly zh: "←/→ 移动光标";
        readonly en: "←/→ to move cursor";
    };
    readonly 'help-edit-word': {
        readonly zh: "ctrl+←/→ 按词跳转";
        readonly en: "ctrl+←/→ for word jumps";
    };
    readonly 'help-edit-tab': {
        readonly zh: "tab 补全命令";
        readonly en: "tab to complete command";
    };
    readonly 'help-edit-permission': {
        readonly zh: "shift+tab 循环权限";
        readonly en: "shift+tab to cycle permission";
    };
    readonly 'help-edit-delete-word-left': {
        readonly zh: "ctrl+backspace 删前词";
        readonly en: "ctrl+backspace delete word";
    };
    readonly 'help-edit-delete-word-right': {
        readonly zh: "ctrl+delete 删后词";
        readonly en: "ctrl+delete word after";
    };
    readonly 'help-commands-title': {
        readonly zh: "命令：";
        readonly en: "commands:";
    };
    readonly 'help-commands-more': {
        readonly zh: "…另有 {{count}} 个命令，输入 / 查看并补全";
        readonly en: "…{{count}} more commands; type / to complete";
    };
    readonly 'suggestions-command-hint': {
        readonly zh: "↑/↓ 选择 · tab 补全 · enter 执行 · esc 关闭";
        readonly en: "↑/↓ select · tab complete · enter run · esc close";
    };
    readonly 'suggestions-file-hint': {
        readonly zh: "↑/↓ 选择 · tab 插入 · enter 插入 · esc 仅关闭本引用";
        readonly en: "↑/↓ select · tab insert · enter insert · esc close this reference";
    };
    readonly 'status-hint-selection': {
        readonly zh: "esc 返回输入";
        readonly en: "esc to return to input";
    };
    readonly 'status-hint-interrupt': {
        readonly zh: "esc 中断";
        readonly en: "esc to interrupt";
    };
    readonly 'status-hint-help': {
        readonly zh: "? 查看快捷键";
        readonly en: "? for shortcuts";
    };
    readonly 'status-cache-label': {
        readonly zh: "缓存";
        readonly en: "cache";
    };
    readonly 'search-no-matches': {
        readonly zh: "无匹配 ";
        readonly en: "no matches ";
    };
    readonly 'permissions-current-preset': {
        readonly zh: "当前预设: {{preset}}";
        readonly en: "Current preset: {{preset}}";
    };
    readonly 'frame-blink': {
        readonly zh: "眨眼";
        readonly en: "blink";
    };
    readonly 'frame-fin-1': {
        readonly zh: "动腹鳍1";
        readonly en: "fin1";
    };
    readonly 'frame-fin-2': {
        readonly zh: "动腹鳍2";
        readonly en: "fin2";
    };
    readonly 'frame-spout-1': {
        readonly zh: "喷水花1";
        readonly en: "spout1";
    };
    readonly 'frame-spout-2': {
        readonly zh: "喷水花2";
        readonly en: "spout2";
    };
    readonly 'frame-spout-3': {
        readonly zh: "喷水花3";
        readonly en: "spout3";
    };
    readonly 'frame-spout-4': {
        readonly zh: "喷水花4";
        readonly en: "spout4";
    };
    readonly 'frame-spout-5': {
        readonly zh: "喷水花5";
        readonly en: "spout5";
    };
    readonly 'frame-spout-6': {
        readonly zh: "喷水花6";
        readonly en: "spout6";
    };
    readonly 'frame-tail-1': {
        readonly zh: "摆尾巴1";
        readonly en: "tail1";
    };
    readonly 'frame-tail-2': {
        readonly zh: "摆尾巴2";
        readonly en: "tail2";
    };
    readonly 'frame-tail-3': {
        readonly zh: "摆尾巴3";
        readonly en: "tail3";
    };
    readonly 'load-earlier': {
        readonly zh: " ↑ 加载更早消息（会话日志完整，/export 导出全文） ";
        readonly en: " ↑ load earlier messages (full session log; /export for full text) ";
    };
    readonly 'show-previous-messages': {
        readonly zh: " ctrl+g 显示 {{count}} 条较早消息 ";
        readonly en: " ctrl+g to show {{count}} previous messages ";
    };
    readonly 'resume-none-in-cwd': {
        readonly zh: "当前目录没有可恢复的历史会话";
        readonly en: "No resumable sessions in the current directory";
    };
    readonly 'compact-summary-folded': {
        readonly zh: "摘要已折叠";
        readonly en: "Summary folded";
    };
    readonly 'theme-builtin-base': {
        readonly zh: "内置 · {{name}} 基底";
        readonly en: "Built-in · {{name}} base";
    };
    readonly 'theme-user-base': {
        readonly zh: "{{base}} 基底 · ~/.cute-dsh-tui/themes/{{name}}.json";
        readonly en: "{{base}} base · ~/.cute-dsh-tui/themes/{{name}}.json";
    };
    readonly 'context-panel-collapse': {
        readonly zh: "折叠";
        readonly en: "Collapse";
    };
    readonly 'context-panel-expand': {
        readonly zh: "展开";
        readonly en: "Expand";
    };
    readonly 'context-panel-sections': {
        readonly zh: "系统提示词 · {{n}} 段";
        readonly en: "System prompt · {{n}} sections";
    };
    readonly 'context-panel-files': {
        readonly zh: "工作区指令 · {{n}} 个文件";
        readonly en: "Workspace instructions · {{n}} files";
    };
    readonly 'context-panel-runtime': {
        readonly zh: "运行时上下文 · {{n}} 项";
        readonly en: "Runtime context · {{n}} items";
    };
    readonly 'context-panel-skills': {
        readonly zh: "技能 · {{n}}";
        readonly en: "Skills · {{n}}";
    };
    readonly 'context-panel-tools': {
        readonly zh: "工具 · {{n}}";
        readonly en: "Tools · {{n}}";
    };
    readonly 'question-select-or-answer': {
        readonly zh: "至少选择一个选项，或在最后一行输入回答";
        readonly en: "Select at least one option, or type an answer on the last line";
    };
    readonly 'question-answer-or-check': {
        readonly zh: "输入回答或勾选选项后再提交";
        readonly en: "Type an answer or check options before submitting";
    };
    readonly 'question-type-answer-first': {
        readonly zh: "先输入回答内容再提交";
        readonly en: "Type your answer before submitting";
    };
    readonly 'question-header-progress': {
        readonly zh: " 📋 提问 · 第 {{position}}/{{total}} 题{{remaining}} ";
        readonly en: " 📋 Question {{position}}/{{total}} {{remaining}} ";
    };
    readonly 'question-remaining-more': {
        readonly zh: " · 还剩 {{n}} 题";
        readonly en: " · {{n}} left";
    };
    readonly 'question-hint-type': {
        readonly zh: "输入回答";
        readonly en: "Type answer";
    };
    readonly 'question-hint-enter': {
        readonly zh: "Enter 提交";
        readonly en: "Enter submit";
    };
    readonly 'question-hint-back': {
        readonly zh: "↑ 返回选项";
        readonly en: "↑ back to options";
    };
    readonly 'question-hint-esc': {
        readonly zh: "Esc 中断";
        readonly en: "Esc cancel";
    };
    readonly 'question-hint-selected': {
        readonly zh: "已选 {{n}}";
        readonly en: "Selected {{n}}";
    };
    readonly 'question-hint-select': {
        readonly zh: "↑/↓ 选择";
        readonly en: "↑/↓ select";
    };
    readonly 'question-hint-multi': {
        readonly zh: "Space 多选";
        readonly en: "Space multi-select";
    };
    readonly 'question-hint-attach': {
        readonly zh: "输入文字附带回答";
        readonly en: "Type text to attach an answer";
    };
    readonly 'question-custom-tab': {
        readonly zh: "自定义回答";
        readonly en: "Custom answer";
    };
    readonly 'question-attached-label': {
        readonly zh: "（附加：{{label}}）";
        readonly en: "(attached: {{label}})";
    };
    readonly 'question-direct-input': {
        readonly zh: "直接输入…";
        readonly en: "Type directly…";
    };
    readonly 'lang-current': {
        readonly zh: "当前语言  {{lang}}";
        readonly en: "Current language  {{lang}}";
    };
    readonly 'lang-switch-hint': {
        readonly zh: "切换      /lang en | /lang zh";
        readonly en: "Switch      /lang en | /lang zh";
    };
    readonly 'lang-persist-hint': {
        readonly zh: "持久化    ~/.cute-dsh-tui/lang.json（重启后仍生效；CUTE_DSH_TUI_LANG 优先）";
        readonly en: "Persisted    ~/.cute-dsh-tui/lang.json (survives restart; CUTE_DSH_TUI_LANG wins)";
    };
    readonly 'lang-switched': {
        readonly zh: "语言已切换：{{lang}}（已保存）";
        readonly en: "Language switched: {{lang}} (saved)";
    };
    readonly 'lang-unknown': {
        readonly zh: "未知语言「{{lang}}」· /lang 查看全部（en / zh）";
        readonly en: "Unknown language \"{{lang}}\" · /lang to view all (en / zh)";
    };
    readonly 'lang-switch-failed': {
        readonly zh: "语言「{{lang}}」切换失败（无法写入 ~/.cute-dsh-tui/lang.json）";
        readonly en: "Language \"{{lang}}\" switch failed (cannot write ~/.cute-dsh-tui/lang.json)";
    };
};
export type I18nKey = keyof typeof dict;
export type I18nParams = Record<string, string | number>;
/** Emitted on every language switch so React screens can re-render. */
type Listener = () => void;
/** Subscribe to language switches (mirrors themePrefs subscription style). */
export declare function subscribeLang(listener: Listener): () => void;
/** The currently active language. */
export declare function getLang(): Lang;
/** Switch the active language and notify subscribers. */
export declare function setLang(lang: Lang): void;
/** Is a string a valid shipped language code? */
export declare function isLang(value: unknown): value is Lang;
/**
 * Translate a dictionary key into the active language, substituting
 * `{{name}}` placeholders with params. Missing keys render the key itself
 * so a typo is visible instead of silently blank.
 * @param key - Dictionary key (see dict).
 * @param params - Placeholder values.
 */
export declare function t(key: I18nKey, params?: I18nParams): string;
/**
 * Parse a persisted `{ lang }` value; anything else yields undefined.
 * @param text - Raw file contents.
 */
export declare function parseLangPref(text: string): Lang | undefined;
/** The persisted `/lang` choice, or undefined when unset or invalid. */
export declare function readLangPref(dir?: string): Lang | undefined;
/** Persist the chosen language (best effort). */
export declare function writeLangPref(lang: Lang, dir?: string): boolean;
/**
 * Guess the user's language from the OS locale (`LC_ALL`, `LC_MESSAGES`,
 * `LANG`), defaulting to `zh`. Only consulted when nothing else (env var,
 * cordis.yml `lang`, persisted `/lang` choice) pinned a language.
 */
export declare function detectLocaleLang(): Lang;
/**
 * Resolve the startup language: the persisted `/lang` choice, else the OS
 * locale guess, else `zh` (the original hard-coded language). The env var /
 * config precedence lives in plugin.apply (see {@link resolveStartupLang}
 * consumers).
 */
export declare function resolveStartupLang(): Lang;
export {};
//# sourceMappingURL=i18n.d.ts.map