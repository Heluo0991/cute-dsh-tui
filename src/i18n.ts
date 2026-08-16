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

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export type Lang = 'zh' | 'en'

const PREFS_DIR = join(homedir(), '.cute-dsh-tui')

/** The languages shipped with the plugin, in display order. */
export const LANGS = ['zh', 'en'] as const

const dict = {
  // ── channel.ts ───────────────────────────────────────────────────────
  'activity-indicator-already': { zh: '指示器已是：{{name}}', en: 'Indicator already set: {{name}}' },
  'activity-indicator-switched': { zh: '指示器已切换：{{name}}（已保存）', en: 'Indicator switched: {{name}} (saved)' },
  'activity-pref-write-failed': { zh: '无法写入 ~/.cute-dsh-tui/working-activity.json，切换未保存', en: 'Cannot write ~/.cute-dsh-tui/working-activity.json, switch not saved' },
  'model-pref-write-failed': { zh: '无法写入 ~/.cute-dsh-tui/model.json，模型选择不会保存到重启后', en: 'Cannot write ~/.cute-dsh-tui/model.json, the model choice will not survive a restart' },
  'model-route-invalid': { zh: '持久化的模型路由 {{provider}}/{{model}} 不在该 provider 的模型列表中，已整体回退到 {{fallback}}', en: 'Persisted model route {{provider}}/{{model}} is not advertised by that provider; fell back to {{fallback}}' },
  'unknown-activity-preset': { zh: '未知预设「{{name}}」· /activity frames 查看全部', en: 'Unknown preset "{{name}}" · /activity frames to view all' },
  'preset-unavailable': { zh: 'Preset 不可用——当前组合未挂载 agent-presets 名册', en: 'Preset unavailable — the agent-presets roster is not mounted' },
  'preset-agent-running': { zh: 'Agent 运行中，无法切换 preset', en: 'Agent is running, cannot switch preset' },
  'preset-not-found': { zh: 'Preset「{{id}}」不存在 · {{err}}', en: 'Preset "{{id}}" not found · {{err}}' },
  'preset-load-failed': { zh: 'Preset「{{id}}」无法加载 · {{broken}}', en: 'Preset "{{id}}" failed to load · {{broken}}' },
  'preset-already-current': { zh: '当前 preset 已是：{{id}}', en: 'Current preset already: {{id}}' },
  'preset-pref-write-failed': { zh: '无法写入 ~/.cute-dsh-tui/agent-preset.json，选择未保存', en: 'Cannot write ~/.cute-dsh-tui/agent-preset.json, selection not saved' },
  'preset-locked-saved-default': { zh: '会话已开始，preset 已锁定（当前：{{current}}）· 已保存为默认：{{id}}（/new 或下次启动生效）', en: 'Session already started, preset locked (current: {{current}}) · Saved as default: {{id}} (applies on /new or next start)' },
  'preset-switch-failed': { zh: 'Preset 切换失败 · {{err}}', en: 'Preset switch failed · {{err}}' },
  'preset-switched-pref-failed': { zh: 'Preset 已切换：{{id}}，但默认偏好写入失败（重启后不保留）', en: 'Preset switched: {{id}}, but writing the default preference failed (won\'t persist after restart)' },
  'preset-switched-saved': { zh: 'Preset 已切换：{{id}}（已保存为默认）', en: 'Preset switched: {{id}} (saved as default)' },
  'mcp-none-configured': { zh: '未配置 MCP 服务器。', en: 'No MCP servers configured.' },
  'mcp-insert-hint': { zh: '在 profile 补丁层（~/.dsh/profiles/cute-dsh-tui/cordis.patch.yml）insert 一行即可，例：', en: 'Insert one line in the profile patch layer (~/.dsh/profiles/cute-dsh-tui/cordis.patch.yml), e.g.:' },
  'mcp-readme-hint': { zh: '详见仓库 README 的 MCP 章节。', en: 'See the MCP section of the repo README.' },
  'mcp-server-tools': { zh: '{{server}}（{{count}} 个工具）: {{tools}}', en: '{{server}} ({{count}} tools): {{tools}}' },
  'child-stderr-line': { zh: '子进程 stderr: {{line}}', en: 'Subprocess stderr: {{line}}' },
  'child-stderr-line-repeat': { zh: '子进程 stderr: {{line}}（重复 {{count}} 次）', en: 'Subprocess stderr: {{line}} (repeated {{count}}×)' },
  'export-title': { zh: '# cute-dsh-tui 会话导出', en: '# cute-dsh-tui session export' },
  'export-time': { zh: '- 导出时间: {{time}}', en: '- Exported: {{time}}' },
  'export-model': { zh: '- 模型: {{model}}', en: '- Model: {{model}}' },
  'export-session': { zh: '- 会话: {{id}}', en: '- Session: {{id}}' },
  'export-dir': { zh: '- 目录: {{cwd}}', en: '- Directory: {{cwd}}' },
  'mentions-attached': { zh: '已附加 {{count}} 个文件引用', en: 'Attached {{count}} file reference(s)' },
  'mentions-missing': { zh: '未找到引用: {{paths}}', en: 'References not found: {{paths}}' },
  'send-failed': { zh: '发送失败 · {{err}}', en: 'Send failed · {{err}}' },
  'export-user-section': { zh: '## 用户', en: '## User' },
  'export-thinking-section': { zh: '## 思考', en: '## Thinking' },
  'export-assistant-section': { zh: '## 助手', en: '## Assistant' },
  'export-tool-section': { zh: '## 工具 · {{name}}', en: '## Tool · {{name}}' },
  'export-result-section': { zh: '### 结果', en: '### Result' },
  'agentsmd-project': { zh: '## 项目', en: '## Project' },
  'agentsmd-project-body': { zh: '（在此描述项目的目标、结构与约定——这份文件会注入给每个 agent 作为工作区上下文。）', en: '(Describe the project\'s goals, structure and conventions here — this file is injected to every agent as workspace context.)' },
  'agentsmd-conventions': { zh: '## 约定', en: '## Conventions' },
  'agentsmd-convention-read': { zh: '- 改动前先阅读相关模块', en: '- Read the relevant modules before making changes' },
  'agentsmd-convention-style': { zh: '- 保持与现有代码风格一致', en: '- Keep consistent with the existing code style' },
  'clear-session-done': { zh: '会话已清空', en: 'Session cleared' },
  'doctor-api-key': { zh: 'API key: {{state}}', en: 'API key: {{state}}' },
  'doctor-key-configured': { zh: '已配置', en: 'configured' },
  'doctor-key-missing': { zh: '未配置（DEEPSEEK_API_KEY）', en: 'not configured (DEEPSEEK_API_KEY)' },
  'doctor-model': { zh: '模型: {{model}} · 提供方: {{provider}}', en: 'Model: {{model}} · Provider: {{provider}}' },
  'doctor-cwd': { zh: '工作目录: {{cwd}}', en: 'Working directory: {{cwd}}' },
  'doctor-context-window': { zh: '上下文窗口: {{window}} tokens', en: 'Context window: {{window}} tokens' },
  'doctor-unknown': { zh: '未知', en: 'unknown' },
  'doctor-session': { zh: '会话: {{id}}', en: 'Session: {{id}}' },
  'doctor-config': { zh: '配置: {{candidate}} {{state}}', en: 'Config: {{candidate}} {{state}}' },
  'doctor-config-missing': { zh: '（不存在）', en: '(missing)' },
  'doctor-storage': { zh: '会话存储: {{dir}} {{state}}', en: 'Session storage: {{dir}} {{state}}' },
  'doctor-storage-uninit': { zh: '（未初始化）', en: '(not initialized)' },
  'subagent-not-mounted': { zh: '子代理服务未挂载（leaf 未启用 subagent）', en: 'Subagent service not mounted (leaf has no subagent)' },
  'subagent-none': { zh: '当前会话暂无子代理', en: 'No subagents in the current session' },
  'subagent-resumable': { zh: '可续', en: 'resumable' },
  'subagent-oneshot': { zh: '一次性', en: 'one-shot' },
  'subagent-row': { zh: '{{mode}} {{label}}{{activity}} · {{id}}', en: '{{mode}} {{label}}{{activity}} · {{id}}' },
  'subagent-running': { zh: ' 运行中', en: ' running' },
  'subagent-archived': { zh: ' 已归档', en: ' archived' },
  'subagent-query-failed': { zh: '查询失败 · {{err}}', en: 'Query failed · {{err}}' },
  'agent-preset-switched': { zh: 'Agent preset 已切换：{{preset}}', en: 'Agent preset switched: {{preset}}' },

  // ── questions.ts ─────────────────────────────────────────────────────
  'questionnaire-answered': { zh: '📋 问卷已答 · {{total}} 题', en: '📋 Questionnaire answered · {{total}} questions' },

  // ── customTheme.ts (doc example only) ───────────────────────────────
  'theme-sakura-name': { zh: '樱花粉', en: 'Sakura Pink' },

  // ── utils/loaded-context.ts ─────────────────────────────────────────
  'context-truncated': { zh: '…（已截断）', en: '… (truncated)' },
  'context-sections': { zh: '系统提示词 {{n}} 段', en: 'System prompt {{n}} sections' },
  'context-files': { zh: '工作区指令 ×{{n}}', en: 'Workspace instructions ×{{n}}' },
  'context-runtime': { zh: '运行时上下文 {{n}} 项', en: 'Runtime context {{n}} items' },
  'context-skills': { zh: '技能 {{n}}', en: 'Skills {{n}}' },
  'context-tools': { zh: '工具 {{n}}', en: 'Tools {{n}}' },

  // ── screens/Chat.tsx ────────────────────────────────────────────────
  'skill-audit-prompt': { zh: '请使用 audit 技能对当前项目做一次全面的代码审计，找出安全、正确性与质量问题。', en: 'Use the audit skill to do a thorough code audit of the current project, finding security, correctness and quality issues.' },
  'skill-bug-prompt': { zh: '请使用 bug 技能协助我记录一份完整的 bug 报告（现象、复现步骤、期望行为）。', en: 'Use the bug skill to help me write a complete bug report (symptoms, reproduction steps, expected behavior).' },
  'skill-practice-prompt': { zh: '请使用 practice 技能陪我进行一轮编程练习。', en: 'Use the practice skill to run a round of programming practice with me.' },
  'skill-review-prompt': { zh: '请使用 review 技能对当前项目做一次全面的代码评审。', en: 'Use the review skill to do a thorough code review of the current project.' },
  'skill-pr-comments-prompt': { zh: '请使用 pr-comments 技能审查当前分支的拉取请求评论并给出改进建议。', en: 'Use the pr-comments skill to review pull request comments on the current branch and suggest improvements.' },
  'skill-release-notes-prompt': { zh: '请使用 release-notes 技能为当前项目生成发布说明。', en: 'Use the release-notes skill to generate release notes for the current project.' },
  'skill-vuln-check-prompt': { zh: '请使用 vuln-check 技能对当前项目做一次安全漏洞检查。', en: 'Use the vuln-check skill to run a security vulnerability check on the current project.' },
  'exit-ctrl-c-again': { zh: '再按一次 Ctrl+C 退出', en: 'Press Ctrl+C again to exit' },
  'yolo-upgrade-unavailable': { zh: 'Yolo 升级不可用：未挂载权限服务', en: 'Yolo upgrade unavailable: permission service is not loaded' },
  'permission-unavailable-profile': { zh: '当前 profile 未提供权限切换', en: 'Permission switching unavailable in this profile' },
  'permission-switch-running': { zh: '回合运行中无法切换权限', en: 'Cannot switch permissions while a turn is running' },
  'permission-no-presets': { zh: '当前 profile 没有可用的权限预设', en: 'No permission presets are available in this profile' },
  'new-session-started': { zh: '新会话已开始', en: 'New session started' },
  'btw-none-yet': { zh: '还没有 BTW 旁路会话。使用 /btw <问题>。', en: 'No BTW conversation yet. Use /btw <question>.' },
  'plugin-no-matches': { zh: '没有匹配的已安装或已加载插件。`/plugin search` 只过滤本地列表，不会搜索 npm。', en: 'No matching installed or loaded plugins. `/plugin search` filters this local list; it does not search npm.' },
  'plugin-usage': { zh: '用法: /plugin [list|search <词>|add <spec>|remove <包>|update [包]]', en: 'Usage: /plugin [list|search <text>|add <spec>|remove <package>|update [package]]' },
  'plugin-profile-required': { zh: '插件变更需要通过 dsh --profile <名称> 启动。', en: 'Plugin changes require launching with dsh --profile <name>.' },
  'login-inherited-source': { zh: '来源：启动环境变量（本次会话只读）。', en: 'Source: launch environment (read-only for this running session).' },
  'login-inherited-change-hint': { zh: '如需更换，请在 shell 中更新 DEEPSEEK_API_KEY 并重启 cdsh。', en: 'To change it, update DEEPSEEK_API_KEY in the shell and restart cdsh.' },
  'logout-env-key': { zh: 'API key 来自启动环境变量。请在 shell 中清除后重启 cdsh。', en: 'The API key came from the launch environment. Clear it in the shell and restart cdsh.' },
  'logout-cleared-no-saved': { zh: '已清除本次会话的 API key；未改动 CuteDshTui 保存的凭证。', en: 'API key cleared for this session. No CuteDshTui-saved credential was changed.' },
  'permissions-unavailable': { zh: '当前 profile 未提供权限切换。', en: 'Permission switching is unavailable in this profile.' },
  'permissions-use-hint': { zh: '使用 /permission 切换当前会话。', en: 'Use /permission to switch the current session.' },
  'rewind-none': { zh: '还没有可回退的消息', en: 'Nothing to rewind yet' },
  'rewound-edit-resend': { zh: '已回退——编辑后按 Enter 重新发送', en: 'Rewound — edit and press Enter to resend' },
  'yolo-enabled-resumed': { zh: '已为这个恢复的会话启用 Yolo 升级', en: 'Yolo upgrade enabled for this resumed session' },
  'yolo-declined-preserved': { zh: '已拒绝 Yolo 升级；保留该会话原有权限', en: 'Yolo upgrade declined; preserved this session\'s existing permission' },
  'session-resumed': { zh: '会话已恢复', en: 'Session resumed' },
  'logout-saved-kept': { zh: '已清除会话 API key，保留已保存凭证。', en: 'Session API key cleared. The saved credential was kept.' },
  'credential-saved-applied': { zh: 'API key 已保存供以后 cdsh 启动使用，并已应用到本次会话。', en: 'API key saved for future cdsh launches and applied to this session.' },
  'credential-save-failed': { zh: '无法保存或应用 API key。请检查终端错误信息后重试。', en: 'Could not save or apply the API key. Check the terminal error message and try again.' },
  'credential-removed': { zh: '已移除 CuteDshTui 保存的凭证。', en: 'Saved CuteDshTui credential removed.' },
  'credential-remove-failed': { zh: '无法移除已保存凭证。', en: 'Could not remove the saved credential.' },
  'plugin-confirm-title': { zh: '确认插件变更', en: 'Confirm plugin change' },
  'plugin-confirm-hint': { zh: '这将重启 CuteDshTui 并恢复当前主会话。Enter 继续 · Esc 取消。', en: 'This will restart CuteDshTui and restore the current main session. Enter to continue · Esc to cancel.' },
  'context-loaded': { zh: '已加载上下文', en: 'Context loaded' },
  'copied-chars': { zh: '已复制 {{n}} 个字符', en: 'Copied {{n}} characters' },
  'activity-usage-name': { zh: '/activity frames <名>', en: '/activity frames <name>' },
  'activity-current-preset': { zh: '当前预设  {{name}}', en: 'Current preset  {{name}}' },
  'activity-switch-hint': { zh: '切换      /activity（选择器）或 /activity frames <名>', en: 'Switch      /activity (picker) or /activity frames <name>' },
  'activity-persist-hint': { zh: '持久化    ~/.cute-dsh-tui/working-activity.json（重启后仍生效）', en: 'Persisted    ~/.cute-dsh-tui/working-activity.json (survives restart)' },
  'activity-current-direct': { zh: '当前预设：{{name}} · /activity frames <名> 直接切换：', en: 'Current preset: {{name}} · /activity frames <name> to switch directly:' },
  'activity-random-each': { zh: '每次随机', en: 'random each time' },
  'activity-current-marker': { zh: '  ← 当前', en: '  ← current' },
  'activity-usage': { zh: '用法：/activity | /activity frames <名> | /activity status', en: 'Usage: /activity | /activity frames <name> | /activity status' },
  'preset-current': { zh: '当前 preset  {{name}}', en: 'Current preset  {{name}}' },
  'preset-roster-missing': { zh: '（未挂载名册）', en: '(roster not mounted)' },
  'preset-switch-hint': { zh: '切换        /preset（选择器）或 /preset <id>', en: 'Switch        /preset (picker) or /preset <id>' },
  'preset-persist-hint': { zh: '持久化      ~/.cute-dsh-tui/agent-preset.json（重启后仍生效；cordis.yml preset 优先）', en: 'Persisted      ~/.cute-dsh-tui/agent-preset.json (survives restart; cordis.yml preset wins)' },
  'preset-lock-hint': { zh: '锁定规则    已开始的会话不可切换（官方 blank-only 规则）', en: 'Lock rule     started sessions cannot switch (official blank-only rule)' },
  'preset-roster-unmounted': { zh: '当前组合未挂载 agent-presets 名册（preset 不可用）', en: 'The agent-presets roster is not mounted (presets unavailable)' },
  'theme-name-arg': { zh: '/theme <名字>', en: '/theme <name>' },
  'theme-current': { zh: '当前主题  {{name}}', en: 'Current theme  {{name}}' },
  'theme-switch-hint': { zh: '切换      /theme（选择器）或 /theme <名字>', en: 'Switch      /theme (picker) or /theme <name>' },
  'theme-persist-hint': { zh: '持久化    ~/.cute-dsh-tui/theme.json（重启后仍生效；CUTE_DSH_TUI_THEME 优先）', en: 'Persisted    ~/.cute-dsh-tui/theme.json (survives restart; CUTE_DSH_TUI_THEME wins)' },
  'theme-custom-hint': { zh: '自定义    ~/.cute-dsh-tui/themes/<名字>.json（见 README「自定义主题」）', en: 'Custom      ~/.cute-dsh-tui/themes/<name>.json (see README "Custom themes")' },
  'theme-switched-saved': { zh: '主题已切换：{{name}}（已保存）', en: 'Theme switched: {{name}} (saved)' },
  'theme-unknown': { zh: '未知主题「{{name}}」· /theme 查看全部', en: 'Unknown theme "{{name}}" · /theme to view all' },
  'status-model': { zh: '模型   {{model}}', en: 'Model   {{model}}' },
  'status-working': { zh: '工作中', en: 'working' },
  'status-idle': { zh: '空闲', en: 'idle' },
  'status-state': { zh: '状态   {{state}}', en: 'Status   {{state}}' },
  'status-session': { zh: '会话   {{id}}', en: 'Session   {{id}}' },
  'status-dir': { zh: '目录   {{cwd}}', en: 'Directory   {{cwd}}' },
  'cost-cache-rate': { zh: '缓存率 {{rate}}% · {{read}} 读 / {{write}} 写', en: 'Cache rate {{rate}}% · {{read}} read / {{write}} write' },
  'cost-context': { zh: '上下文 {{pct}}%', en: 'Context {{pct}}%' },
  'status-title': { zh: '标题   {{title}}', en: 'Title   {{title}}' },
  'cost-cache-hit-rate': { zh: '缓存命中率 {{rate}}% · 缓存 {{read}} 读 / {{write}} 写', en: 'Cache hit rate {{rate}}% · cache {{read}} read / {{write}} write' },
  'cost-note': { zh: '注：DSH 不提供 API 费用计量，以上为 token 用量（按 provider 账单计费）', en: 'Note: DSH provides no API cost metering; the above is token usage (billed by your provider)' },
  'doctor-example-config': { zh: '示例配置  {{path}}', en: 'Example config  {{path}}' },
  'doctor-user-config': { zh: '用户配置  {{path}}', en: 'User config  {{path}}' },
  'doctor-launch-hint': { zh: '启动方式  cdsh（官方 dsh 保持可用）', en: 'Launch      cdsh (official dsh remains available)' },
  'doctor-route-hint': { zh: '模型路由  由 cordis.yml 或持久化选择决定（/model 通过会话 fork 切换）', en: 'Model route  set by cordis.yml or persisted selection (/model switches through a session fork)' },
  'export-failed': { zh: '导出失败（无法写入工作目录）', en: 'Export failed (cannot write to working directory)' },
  'export-saved': { zh: '已导出: {{target}}', en: 'Exported: {{target}}' },
  'agentsmd-create-failed': { zh: '创建 AGENTS.md 失败', en: 'Failed to create AGENTS.md' },
  'agentsmd-exists': { zh: 'AGENTS.md 已存在，未覆盖', en: 'AGENTS.md already exists, not overwritten' },
  'agentsmd-created': { zh: '已创建 {{result}}', en: 'Created {{result}}' },
  'login-api-key': { zh: 'API key: {{key}}', en: 'API key: {{key}}' },
  'login-key-missing': { zh: '未配置（DEEPSEEK_API_KEY）', en: 'not configured (DEEPSEEK_API_KEY)' },
  'login-base-url': { zh: 'Base URL: {{url}}', en: 'Base URL: {{url}}' },
  'login-official-endpoint': { zh: '官方端点', en: 'official endpoint' },
  'login-source-hint': { zh: '来源：启动环境变量 → DSH 加密凭证存储', en: 'Source: launch environment → DSH credential store' },
  'login-logout-hint': { zh: 'DSH 凭证可来自环境变量或已保存的凭证存储。/logout 只会移除 CuteDshTui 保存的凭证。', en: 'DSH credentials may come from the environment or saved credential store. /logout removes only credentials saved by CuteDshTui.' },
  'login-session-applied': { zh: 'API key 已用于本次 CuteDshTui 会话。', en: 'API key set for this CuteDshTui session only.' },
  'login-session-applied-exit': { zh: 'API key 已用于本次会话；退出 TUI 时恢复原状态。', en: 'API key set for this session only. It is restored when the TUI exits.' },
  'login-session-failed': { zh: '无法应用本次会话专用的 API key。', en: 'Could not apply the session-only API key.' },
  'login-session-unavailable': { zh: '当前启动方式不支持仅本次会话的 API key。', en: 'Session-only API keys are unavailable in this launch mode.' },
  'login-release-failed': { zh: '无法释放本次会话专用的 API key。', en: 'Could not release the session-only API key.' },

  // ── components/LoginDialog.tsx ─────────────────────────────────────
  'login-title': { zh: '连接 DeepSeek', en: 'Connect DeepSeek' },
  'login-body': { zh: '粘贴 DeepSeek API key。输入已掩码、不会进入命令历史，并立即应用到本次会话。', en: 'Paste a DeepSeek API key. It is masked, never added to command history, and applies immediately to this session.' },
  'login-api-key-label': { zh: 'API key', en: 'API key' },
  'login-save-warning': { zh: '当前终端没有 key。下一屏确认后才会保存，供以后 cdsh 启动使用。', en: 'No key exists in this terminal. Confirm on the next screen to save it for future cdsh launches.' },
  'login-error-empty': { zh: '请先输入 API key。', en: 'Enter an API key first.' },
  'login-action-continue': { zh: '继续', en: 'continue' },
  'login-action-cancel': { zh: '取消', en: 'cancel' },
  'login-save-title': { zh: '保存 API key 供以后 cdsh 启动使用？', en: 'Save API key for future cdsh launches?' },
  'login-save-body': { zh: 'Windows 会保存为用户环境变量。macOS/Linux 通过 DSH 的仅属主凭证存储保存，立即生效并供以后 cdsh 启动复用。', en: 'Windows saves it as your user environment variable. macOS/Linux save it through DSH\'s owner-only credential store, which is applied immediately and reused by later cdsh launches.' },
  'login-save-hint': { zh: 'Enter 保存 · Esc 仅本次会话使用', en: 'Enter saves · Esc keeps it for this session only' },
  'login-delete-title': { zh: '忘记已保存的 API key？', en: 'Forget the saved API key?' },
  'login-delete-body': { zh: '这将移除 CuteDshTui 之前保存的凭证；shell 提供的 key 永远不会被改动。', en: 'This removes the credential previously saved by CuteDshTui. Keys supplied by your shell are never changed.' },
  'login-delete-hint': { zh: 'Enter 移除 · Esc 保留', en: 'Enter removes it · Esc keeps it' },

  // ── components/BtwPane.tsx ─────────────────────────────────────────
  'btw-pane-title': { zh: 'BTW · 旁路会话', en: 'BTW · side conversation' },
  'btw-pane-hint': { zh: '已复制上下文 · 主会话不受影响 · Esc 返回 · Ctrl+C 停止 · Ctrl+O 详情', en: 'Forked context · main conversation is unchanged · Esc returns · Ctrl+C stops · Ctrl+O details' },
  'btw-working': { zh: '旁路会话正在工作…', en: 'Working in side conversation…' },
  'btw-placeholder': { zh: '继续追问…', en: 'Ask a follow-up…' },

  // ── design-system action labels ─────────────────────────────────────
  'action-navigate': { zh: '移动', en: 'navigate' },
  'action-select': { zh: '选择', en: 'select' },
  'action-cancel': { zh: '取消', en: 'cancel' },
  'action-confirm': { zh: '确认', en: 'confirm' },
  'action-exit': { zh: '退出', en: 'exit' },
  'action-back': { zh: '返回', en: 'back' },
  'action-switch-model': { zh: '切换模型', en: 'switch model' },
  'action-choose-depth': { zh: '选择深度', en: 'choose depth' },
  'action-rewind': { zh: '回退', en: 'rewind' },
  'action-allow-once': { zh: '允许一次', en: 'allow once' },
  'action-deny': { zh: '拒绝', en: 'deny' },
  'action-enable-full': { zh: '启用完整访问', en: 'enable full access' },
  'action-keep-permission': { zh: '保持当前权限', en: 'keep current permission' },
  'action-expand': { zh: '展开', en: 'expand' },
  'action-expand-collapse-fork': { zh: '展开/折叠 fork 组', en: 'expand/collapse fork group' },
  'injected-context-label': { zh: '注入的上下文', en: 'Injected context' },
  'thinking-label': { zh: '思考', en: 'Thinking' },

  // ── components/ApprovalPanel.tsx ───────────────────────────────────
  'approval-title': { zh: '需要审批', en: 'Approval required' },
  'approval-tool': { zh: '工具', en: 'Tool' },
  'approval-reason': { zh: '原因', en: 'Reason' },
  'approval-call': { zh: '调用', en: 'Call' },
  'approval-queued': { zh: '另有 {{count}} 个审批请求排队。', en: '{{count}} additional approval request(s) queued.' },

  // ── components/HistorySearchDialog.tsx ──────────────────────────────
  'history-title': { zh: '搜索历史', en: 'Search history' },
  'history-placeholder': { zh: '输入以搜索…', en: 'Type to search…' },
  'history-no-matches': { zh: '无匹配命令', en: 'No matching commands' },
  'history-age-now': { zh: '刚刚', en: 'now' },
  'history-age-minutes': { zh: '{{n}} 分钟前', en: '{{n}}m ago' },
  'history-age-hours': { zh: '{{n}} 小时前', en: '{{n}}h ago' },
  'history-age-days': { zh: '{{n}} 天前', en: '{{n}}d ago' },

  // ── components/InterruptedByUser.tsx ────────────────────────────────
  'interrupted-label': { zh: '已打断', en: 'Interrupted' },
  'interrupted-question': { zh: '· 你希望 DeepSeek 接下来做什么？', en: '· What should DeepSeek do instead?' },

  // ── components/PermissionPicker.tsx ─────────────────────────────────
  'permission-picker-title': { zh: '权限', en: 'Permissions' },
  'permission-picker-subtitle': { zh: '作用于本次会话及其后续工具调用。', en: 'Applies to this session and its future tool calls.' },
  'full-access-title': { zh: '启用完整访问？', en: 'Enable full access?' },
  'full-access-body': { zh: '完整访问会移除工作区边界，并关闭本次会话的审批提示；命令可以读取、修改或执行项目之外的内容。', en: 'Full access removes the workspace boundary and disables approval prompts for this session. Commands may read, modify, or execute outside the current project.' },
  'full-access-yolo-body': { zh: '这个恢复的会话此前受限。`--yolo` 请求升级权限；确认后立即应用。', en: 'This resumed session was previously restricted. `--yolo` requested an upgrade; confirm to apply it now.' },

  // ── components/RewindPicker.tsx ─────────────────────────────────────
  'rewind-picker-title': { zh: '回退', en: 'Rewind' },
  'rewind-picker-subtitle': { zh: '选择要回退到的消息', en: 'Pick a message to rewind the conversation to' },
  'rewind-picker-confirm': { zh: '回退会话到这条消息？', en: 'Rewind conversation to this message?' },
  'rewind-row-description': { zh: '会话从这里重新开始', en: 'conversation restarts here' },
  'rewind-row-last': { zh: '最后一条消息', en: 'last message' },
  'rewind-no-rows': { zh: '没有可回退的消息', en: 'No messages to rewind to' },

  // ── components/ThinkingToggle.tsx ───────────────────────────────────
  'thinking-toggle-title': { zh: '切换思考模式', en: 'Toggle thinking mode' },
  'thinking-toggle-subtitle': { zh: '启用或禁用本次会话的扩展思考。', en: 'Enable or disable thinking for this session.' },
  'thinking-enabled': { zh: '启用', en: 'Enabled' },
  'thinking-disabled': { zh: '禁用', en: 'Disabled' },
  'thinking-enabled-desc': { zh: 'DeepSeek 回答前先进行思考', en: 'DeepSeek will think before responding' },
  'thinking-disabled-desc': { zh: 'DeepSeek 不进行扩展思考，直接回答', en: 'DeepSeek will respond without extended thinking' },
  'thinking-warning': { zh: '会话中途切换思考模式会增加延迟并可能降低质量。建议在会话开始时设置。', en: 'Changing thinking mode mid-conversation will increase latency and may reduce quality. For best results, set this at the start of a session.' },
  'thinking-confirm-question': { zh: '确认继续吗？', en: 'Do you want to proceed?' },

  // ── components/ReasoningEffortPicker.tsx ────────────────────────────
  'effort-picker-title': { zh: '推理深度 · 第 2 步 / 共 2 步', en: 'Reasoning depth · step 2 of 2' },

  // ── components/LogoV2.tsx ───────────────────────────────────────────
  'logo-tip-label': { zh: '提示: ', en: 'Tip: ' },
  'permissions-root-hint': { zh: '当前文件系统策略以工作目录为根：{{cwd}}', en: 'Current filesystem policy is rooted at the working directory: {{cwd}}' },
  'permissions-path-hint': { zh: '模型工具相对路径均解析自该目录；跨目录访问由 fs-policy 拦截。', en: 'Relative paths of model tools resolve from this directory; cross-directory access is blocked by fs-policy.' },
  'update-unavailable': { zh: '当前运行方式不支持自动更新（需经 dsh --profile 启动），请在终端执行 dsh plugin --profile <name> update @heluo0991/cute-dsh-tui', en: 'Automatic update is unavailable in this launch mode (needs dsh --profile). Run dsh plugin --profile <name> update @heluo0991/cute-dsh-tui in a terminal.' },
  'update-working': { zh: '当前回合仍在运行，请等待完成后再更新 TUI。', en: 'The current turn is still running. Wait for it to finish before updating the TUI.' },
  'update-starting': { zh: '正在更新 @heluo0991/cute-dsh-tui，完成后会自动重启并恢复当前会话……', en: 'Updating @heluo0991/cute-dsh-tui. The TUI will restart and resume this session when finished…' },
  'update-available': { zh: '发现新版本：v{{latest}}（当前 v{{current}}）· 输入 /update 更新 TUI', en: 'New version available: v{{latest}} (current v{{current}}) · type /update to update the TUI' },
  'update-already-latest': { zh: '当前已是最新版本（v{{current}}）。', en: 'Already on the latest version (v{{current}}).' },
  'update-check-failed': { zh: '无法确认新版本（网络或 registry 不可达），已尝试直接更新……', en: 'Could not confirm a newer version (network or registry unreachable); attempting the update anyway…' },
  'terminal-setup-hint': { zh: '推荐 Windows Terminal（≥110 列、等宽字体、TrueColor）。', en: 'Recommended: Windows Terminal (≥110 columns, monospace, TrueColor).' },
  'terminal-paste-hint': { zh: 'Ctrl+V 粘贴文本/文件路径；Ctrl+Shift+V 终端原生粘贴；右键粘贴同样可用。', en: 'Ctrl+V pastes text/file paths; Ctrl+Shift+V is native terminal paste; right-click paste also works.' },
  'theme-switch-failed': { zh: '主题「{{name}}」切换失败（无法写入 ~/.cute-dsh-tui/theme.json）', en: 'Theme "{{name}}" switch failed (cannot write ~/.cute-dsh-tui/theme.json)' },
  'interrupt-delivered': { zh: '已打断当前回合，{{n}} 条消息立即处理', en: 'Interrupted current turn, {{n}} messages processed immediately' },

  // ── components/ActivityLine.tsx ──────────────────────────────────────
  'activity-ctx-warn': { zh: '⚠ 上下文', en: '⚠ ctx ' },

  // ── components/ActivityPicker.tsx ─────────────────────────────────────
  'activity-random-each-preset': { zh: '每次随机一个预设', en: 'random preset each time' },

  // ── components/PresetPicker.tsx ──────────────────────────────────────
  'preset-default-tag': { zh: '（默认）', en: ' (default)' },
  'preset-broken-tag': { zh: '（无法加载）', en: ' (failed to load)' },

  // ── channel.ts — reasoning-effort notifications ──────────────────────
  'effort-unavailable': { zh: '推理等级切换不可用（llm 服务未挂载）', en: 'Reasoning effort switching unavailable (llm service not mounted)' },
  'effort-read-failed': { zh: '推理等级读取失败 · {{error}}', en: 'Failed to read reasoning efforts · {{error}}' },
  'effort-single-tier': { zh: '当前模型只有一档推理等级（{{name}}）', en: 'Current model has a single reasoning effort ({{name}})' },
  'effort-unsupported': { zh: '当前模型不支持推理等级切换', en: 'Current model does not support reasoning effort switching' },
  'effort-switched': { zh: '推理强度 → {{name}}', en: 'Reasoning effort → {{name}}' },
  'rewind-unavailable': { zh: '回退不可用——未加载会话服务', en: 'Rewind unavailable — session services not loaded' },
  'rewind-settling': { zh: '当前回合仍在收尾，暂不能回退，请稍后再试', en: 'Cannot rewind — the turn is still settling, try again in a moment' },
  'rewind-failed': { zh: '回退失败——无法创建替代会话', en: 'Rewind failed — could not create the replacement session' },
  'resume-running': { zh: '回合运行中无法恢复会话', en: 'Cannot resume while a turn is running' },
  'resume-unavailable': { zh: '恢复不可用——未加载 agents 服务', en: 'Resume unavailable — agents service not loaded' },
  'new-session-running': { zh: '回合运行中无法开始新会话', en: 'Cannot start a new session while a turn is running' },
  'new-session-unavailable': { zh: '新会话不可用——未加载 agents 服务', en: 'New session unavailable — agents service not loaded' },
  'model-switch-running': { zh: '回合运行中无法切换模型', en: 'Cannot switch models while a turn is running' },
  'model-switch-unavailable': { zh: '模型切换不可用——未加载会话服务', en: 'Model switch unavailable — session services not loaded' },
  'reasoning-pref-failed': { zh: '推理深度已切换，但偏好写入失败（重启后不保留）', en: 'Reasoning depth changed, but the preference could not be saved' },
  'btw-unavailable': { zh: 'BTW 不可用：未加载会话服务', en: 'BTW is unavailable: session services are not loaded' },
  'btw-needs-main-turn': { zh: 'BTW 需要主会话至少完成一个回合后才能并行运行', en: 'BTW needs one completed main turn before it can run in parallel' },
  'btw-cancelled': { zh: 'BTW 已取消', en: 'BTW cancelled' },
  'permission-command-unavailable': { zh: '权限切换不可用：未加载命令服务', en: 'Permission switching unavailable: command service not loaded' },
  'permission-command-not-registered': { zh: '权限切换不可用：DSH /permission 未注册', en: 'Permission switching unavailable: DSH /permission is not registered' },
  'permission-switch-failed': { zh: '权限切换失败 · {{error}}', en: 'Permission switch failed · {{error}}' },
  'compact-unavailable': { zh: '压缩不可用——当前组合没有 compaction 服务', en: 'Compaction unavailable · no compaction service in this leaf' },
  'compact-running': { zh: '回合运行中无法压缩', en: 'Cannot compact while a turn is running' },
  'compacting': { zh: '正在压缩会话…', en: 'Compacting conversation…' },
  'compacted-notice': { zh: '会话已压缩', en: 'Conversation compacted' },
  'interrupted-what-instead': { zh: '已打断 · 你希望接下来做什么？', en: 'Interrupted · What should Claude do instead?' },
  'context-low': { zh: '上下文偏低（剩余 {{percent}}%）· 可运行 /clear 或开始新会话', en: 'Context low ({{percent}}% remaining) · Run /clear or start a new session' },
  'rewind-to-point-failed': { zh: '无法回退到该位置 · {{error}}', en: 'Cannot rewind to this point · {{error}}' },
  'resume-failed': { zh: '恢复失败 · {{error}}', en: 'Resume failed · {{error}}' },
  'new-session-failed': { zh: '新会话失败 · {{error}}', en: 'New session failed · {{error}}' },
  'model-switch-fork-failed': { zh: '无法切换模型 · {{error}}', en: 'Cannot switch models · {{error}}' },
  'model-switch-failed': { zh: '模型切换失败 · {{error}}', en: 'Model switch failed · {{error}}' },
  'btw-fork-failed': { zh: 'BTW 无法派生会话：{{error}}', en: 'BTW could not fork this conversation: {{error}}' },
  'unknown-permission-preset': { zh: '未知权限预设：{{preset}}', en: 'Unknown permission preset: {{preset}}' },
  'compacted-done': { zh: '会话已压缩', en: 'Conversation compacted' },
  'compact-nothing': { zh: '没有可压缩的内容', en: 'Nothing to compact' },
  'compaction-failed': { zh: '压缩失败 · {{error}}', en: 'Compaction failed · {{error}}' },

  // ── components/LogoV2.tsx ───────────────────────────────────────────
  'logo-tagline': { zh: '探索未至之境！', en: 'Explore the uncharted!' },
  'logo-tip-model': { zh: '切换模型', en: 'switch model' },
  'logo-tip-help': { zh: '查看命令', en: 'view commands' },
  'logo-tip-tab': { zh: '自动补全', en: 'autocomplete' },

  // ── components/PromptInput.tsx ──────────────────────────────────────
  'input-sent-after-turn': { zh: '已发送，当前回合结束后处理', en: 'Sent, processed after the current turn' },
  'input-interrupted-next': { zh: '已插话 · 下一步立即处理', en: 'Interrupted · processed next' },
  'input-queued-after-turn': { zh: '已排队 · 回合结束后处理', en: 'Queued · processed after the turn' },
  'input-cannot-retract': { zh: '无法撤回：消息可能已被处理，或当前版本不支持', en: 'Cannot retract: the message may already be processed, or this version doesn\'t support it' },
  'input-retracted': { zh: '已撤回，可编辑后重新发送', en: 'Retracted, editable and resendable' },
  'input-empty': { zh: '输入为空，没有可发送的内容', en: 'Empty input, nothing to send' },
  'input-interrupt-immediate': { zh: '已打断当前回合，正在立即处理', en: 'Interrupted current turn, processing immediately' },
  'input-clipboard-empty': { zh: '剪贴板为空', en: 'Clipboard is empty' },
  'input-esc-again-rewind': { zh: '再按 Esc 回退', en: 'Press Esc again to rewind' },
  'input-esc-again-clear': { zh: '再按 Esc 清空', en: 'Press Esc again to clear' },
  'input-pending-steer-label': { zh: '插话 · 下一步送达', en: 'Steer · delivered next' },
  'input-pending-queue-label': { zh: '排队 · 回合结束后送达', en: 'Queued · delivered after the turn' },
  'input-pending-actions-hint': { zh: '撤回 · Esc 打断并立即发送', en: 'Retract · Esc interrupts and sends immediately' },

  // ── components/HelpMenu.tsx ────────────────────────────────────────
  'help-shortcut-slash': { zh: '/ 打开命令', en: '/ for commands' },
  'help-shortcut-question': { zh: '? 打开帮助', en: '? for this help' },
  'help-shortcut-verbose': { zh: 'ctrl+o 切换详情', en: 'ctrl+o for verbose output' },
  'help-shortcut-context': { zh: 'ctrl+t 切换上下文', en: 'ctrl+t to toggle context' },
  'help-shortcut-history': { zh: 'ctrl+r 搜索历史', en: 'ctrl+r to search history' },
  'help-shortcut-interrupt': { zh: 'ctrl+c 中断', en: 'ctrl+c to interrupt' },
  'help-shortcut-exit': { zh: 'ctrl+d 退出', en: 'ctrl+d to exit' },
  'help-shortcut-redraw': { zh: 'ctrl+l 重绘', en: 'ctrl+l to redraw' },
  'help-shortcut-show-older': { zh: 'ctrl+g 显示/折叠旧消息', en: 'ctrl+g to show/fold old messages' },
  'help-edit-esc': { zh: 'esc 清空输入', en: 'esc to clear input' },
  'help-edit-history': { zh: '↑/↓ 浏览历史', en: '↑/↓ for history' },
  'help-edit-cursor': { zh: '←/→ 移动光标', en: '←/→ to move cursor' },
  'help-edit-word': { zh: 'ctrl+←/→ 按词跳转', en: 'ctrl+←/→ for word jumps' },
  'help-edit-tab': { zh: 'tab 补全命令', en: 'tab to complete command' },
  'help-edit-permission': { zh: 'shift+tab 循环权限', en: 'shift+tab to cycle permission' },
  'help-edit-delete-word-left': { zh: 'ctrl+backspace 删前词', en: 'ctrl+backspace delete word' },
  'help-edit-delete-word-right': { zh: 'ctrl+delete 删后词', en: 'ctrl+delete word after' },
  'help-commands-title': { zh: '命令：', en: 'commands:' },
  'help-commands-more': { zh: '…另有 {{count}} 个命令，输入 / 查看并补全', en: '…{{count}} more commands; type / to complete' },

  // ── components/CommandSuggestions.tsx / FileSuggestions.tsx ─────────
  'suggestions-command-hint': { zh: '↑/↓ 选择 · tab 补全 · enter 执行 · esc 关闭', en: '↑/↓ select · tab complete · enter run · esc close' },
  'suggestions-file-hint': { zh: '↑/↓ 选择 · tab 插入 · enter 插入 · esc 仅关闭本引用', en: '↑/↓ select · tab insert · enter insert · esc close this reference' },

  // ── screens/StatusLine.tsx ─────────────────────────────────────────
  'status-hint-selection': { zh: 'esc 返回输入', en: 'esc to return to input' },
  'status-hint-interrupt': { zh: 'esc 中断', en: 'esc to interrupt' },
  'status-hint-help': { zh: '? 查看快捷键', en: '? for shortcuts' },
  'status-cache-label': { zh: '缓存', en: 'cache' },
  'search-no-matches': { zh: '无匹配 ', en: 'no matches ' },
  'permissions-current-preset': { zh: '当前预设: {{preset}}', en: 'Current preset: {{preset}}' },

  // ── components/whaleFrames.ts (frame labels) ────────────────────────
  'frame-blink': { zh: '眨眼', en: 'blink' },
  'frame-fin-1': { zh: '动腹鳍1', en: 'fin1' },
  'frame-fin-2': { zh: '动腹鳍2', en: 'fin2' },
  'frame-spout-1': { zh: '喷水花1', en: 'spout1' },
  'frame-spout-2': { zh: '喷水花2', en: 'spout2' },
  'frame-spout-3': { zh: '喷水花3', en: 'spout3' },
  'frame-spout-4': { zh: '喷水花4', en: 'spout4' },
  'frame-spout-5': { zh: '喷水花5', en: 'spout5' },
  'frame-spout-6': { zh: '喷水花6', en: 'spout6' },
  'frame-tail-1': { zh: '摆尾巴1', en: 'tail1' },
  'frame-tail-2': { zh: '摆尾巴2', en: 'tail2' },
  'frame-tail-3': { zh: '摆尾巴3', en: 'tail3' },

  // ── components/MessageList.tsx ──────────────────────────────────────
  'load-earlier': { zh: ' ↑ 加载更早消息（会话日志完整，/export 导出全文） ', en: ' ↑ load earlier messages (full session log; /export for full text) ' },
  'show-previous-messages': { zh: ' ctrl+g 显示 {{count}} 条较早消息 ', en: ' ctrl+g to show {{count}} previous messages ' },
  'resume-none-in-cwd': { zh: '当前目录没有可恢复的历史会话', en: 'No resumable sessions in the current directory' },
  'compact-summary-folded': { zh: '摘要已折叠', en: 'Summary folded' },

  // ── components/ThemePicker.tsx ──────────────────────────────────────
  'theme-builtin-base': { zh: '内置 · {{name}} 基底', en: 'Built-in · {{name}} base' },
  'theme-user-base': { zh: '{{base}} 基底 · ~/.cute-dsh-tui/themes/{{name}}.json', en: '{{base}} base · ~/.cute-dsh-tui/themes/{{name}}.json' },

  // ── components/LoadedContextPanel.tsx ───────────────────────────────
  'context-panel-collapse': { zh: '折叠', en: 'Collapse' },
  'context-panel-expand': { zh: '展开', en: 'Expand' },
  'context-panel-sections': { zh: '系统提示词 · {{n}} 段', en: 'System prompt · {{n}} sections' },
  'context-panel-files': { zh: '工作区指令 · {{n}} 个文件', en: 'Workspace instructions · {{n}} files' },
  'context-panel-runtime': { zh: '运行时上下文 · {{n}} 项', en: 'Runtime context · {{n}} items' },
  'context-panel-skills': { zh: '技能 · {{n}}', en: 'Skills · {{n}}' },
  'context-panel-tools': { zh: '工具 · {{n}}', en: 'Tools · {{n}}' },

  // ── components/questions/AskUserQuestionPanel.tsx ───────────────────
  'question-select-or-answer': { zh: '至少选择一个选项，或在最后一行输入回答', en: 'Select at least one option, or type an answer on the last line' },
  'question-answer-or-check': { zh: '输入回答或勾选选项后再提交', en: 'Type an answer or check options before submitting' },
  'question-type-answer-first': { zh: '先输入回答内容再提交', en: 'Type your answer before submitting' },
  'question-header-progress': { zh: ' 📋 提问 · 第 {{position}}/{{total}} 题{{remaining}} ', en: ' 📋 Question {{position}}/{{total}} {{remaining}} ' },
  'question-remaining-more': { zh: ' · 还剩 {{n}} 题', en: ' · {{n}} left' },
  'question-hint-type': { zh: '输入回答', en: 'Type answer' },
  'question-hint-enter': { zh: 'Enter 提交', en: 'Enter submit' },
  'question-hint-back': { zh: '↑ 返回选项', en: '↑ back to options' },
  'question-hint-esc': { zh: 'Esc 中断', en: 'Esc cancel' },
  'question-hint-selected': { zh: '已选 {{n}}', en: 'Selected {{n}}' },
  'question-hint-select': { zh: '↑/↓ 选择', en: '↑/↓ select' },
  'question-hint-multi': { zh: 'Space 多选', en: 'Space multi-select' },
  'question-hint-attach': { zh: '输入文字附带回答', en: 'Type text to attach an answer' },
  'question-custom-tab': { zh: '自定义回答', en: 'Custom answer' },
  'question-attached-label': { zh: '（附加：{{label}}）', en: '(attached: {{label}})' },
  'question-direct-input': { zh: '直接输入…', en: 'Type directly…' },

  // ── /lang command ───────────────────────────────────────────────────
  'lang-current': { zh: '当前语言  {{lang}}', en: 'Current language  {{lang}}' },
  'lang-switch-hint': { zh: '切换      /lang en | /lang zh', en: 'Switch      /lang en | /lang zh' },
  'lang-persist-hint': { zh: '持久化    ~/.cute-dsh-tui/lang.json（重启后仍生效；CUTE_DSH_TUI_LANG 优先）', en: 'Persisted    ~/.cute-dsh-tui/lang.json (survives restart; CUTE_DSH_TUI_LANG wins)' },
  'lang-switched': { zh: '语言已切换：{{lang}}（已保存）', en: 'Language switched: {{lang}} (saved)' },
  'lang-unknown': { zh: '未知语言「{{lang}}」· /lang 查看全部（en / zh）', en: 'Unknown language "{{lang}}" · /lang to view all (en / zh)' },
  'lang-switch-failed': { zh: '语言「{{lang}}」切换失败（无法写入 ~/.cute-dsh-tui/lang.json）', en: 'Language "{{lang}}" switch failed (cannot write ~/.cute-dsh-tui/lang.json)' },
} as const

export type I18nKey = keyof typeof dict
export type I18nParams = Record<string, string | number>

/** The active language, module-level so non-React modules (channel.ts,
 *  loaded-context.ts) resolve strings without a context. Defaults to `zh`
 *  (the original hard-coded language). */
let activeLang: Lang = 'zh'

/** Emitted on every language switch so React screens can re-render. */
type Listener = () => void
const listeners = new Set<Listener>()

/** Subscribe to language switches (mirrors themePrefs subscription style). */
export function subscribeLang(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The currently active language. */
export function getLang(): Lang {
  return activeLang
}

/** Switch the active language and notify subscribers. */
export function setLang(lang: Lang): void {
  activeLang = lang
  for (const listener of listeners) listener()
}

/** Is a string a valid shipped language code? */
export function isLang(value: unknown): value is Lang {
  return value === 'zh' || value === 'en'
}

/**
 * Translate a dictionary key into the active language, substituting
 * `{{name}}` placeholders with params. Missing keys render the key itself
 * so a typo is visible instead of silently blank.
 * @param key - Dictionary key (see dict).
 * @param params - Placeholder values.
 */
export function t(key: I18nKey, params: I18nParams = {}): string {
  const entry = dict[key] as { zh: string; en: string } | undefined
  const template = entry?.[activeLang] ?? key
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

// ── persistence (~/.cute-dsh-tui/lang.json) ──────────────────────────────────

/**
 * Parse a persisted `{ lang }` value; anything else yields undefined.
 * @param text - Raw file contents.
 */
export function parseLangPref(text: string): Lang | undefined {
  try {
    const parsed: unknown = JSON.parse(text)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined
    const lang = (parsed as Record<string, unknown>).lang
    return isLang(lang) ? lang : undefined
  } catch {
    return undefined
  }
}

/** The persisted `/lang` choice, or undefined when unset or invalid. */
export function readLangPref(dir: string = PREFS_DIR): Lang | undefined {
  try {
    return parseLangPref(readFileSync(join(dir, 'lang.json'), 'utf8'))
  } catch {
    return undefined
  }
}

/** Persist the chosen language (best effort). */
export function writeLangPref(lang: Lang, dir: string = PREFS_DIR): boolean {
  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'lang.json'), JSON.stringify({ lang }, null, 2))
    return true
  } catch {
    return false
  }
}

/**
 * Guess the user's language from the OS locale (`LC_ALL`, `LC_MESSAGES`,
 * `LANG`), defaulting to `zh`. Only consulted when nothing else (env var,
 * cordis.yml `lang`, persisted `/lang` choice) pinned a language.
 */
export function detectLocaleLang(): Lang {
  const raw =
    process.env.LC_ALL ??
    process.env.LC_MESSAGES ??
    process.env.LANG ??
    ''
  const locale = raw.split('.')[0]?.toLowerCase() ?? ''
  if (locale.startsWith('zh')) return 'zh'
  if (locale.startsWith('en')) return 'en'
  return 'zh'
}

/**
 * Resolve the startup language: the persisted `/lang` choice, else the OS
 * locale guess, else `zh` (the original hard-coded language). The env var /
 * config precedence lives in plugin.apply (see {@link resolveStartupLang}
 * consumers).
 */
export function resolveStartupLang(): Lang {
  return readLangPref() ?? detectLocaleLang()
}
