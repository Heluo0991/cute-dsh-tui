/**
 * Local slash commands for the cute-dsh-tui TUI. Claude Code's command system is
 * deeply wired into its engine; cute-dsh-tui ships a small built-in set with the
 * same `/name — description` suggestion chrome, and merges plugin-registered
 * commands (plan/goal/…) from the DSH command registry (`dsh-commands`) —
 * `runCommand` in the Chat screen dispatches either kind, with the registry
 * handler winning for names both sides declare.
 */

export interface LocalCommand {
  /** The command name without the slash, e.g. `clear`. */
  name: string
  /** One-line description shown in the suggestion overlay. */
  description: string
  /** Optional bracket tag shown between name and description. */
  tag?: string
  /** True when a DSH plugin registered this command (not built in). */
  external?: boolean
  /** Optional second-level actions, shown after the command name is complete. */
  subcommands?: readonly CommandSubcommand[]
}

/** One continuation offered below a built-in slash command. */
export interface CommandSubcommand {
  /** The action token, without the parent command. */
  name: string
  /** One-line description shown in the suggestion overlay. */
  description: string
}

/**
 * The built-in slash commands (name + description pairs). Plugin-registered
 * commands merge in at runtime; locals win on name collisions.
 */
export const LOCAL_COMMANDS: LocalCommand[] = [
  // Conversation
  { name: 'new', description: 'Start a new conversation' },
  { name: 'clear', description: 'Clear the conversation' },
  { name: 'compact', description: 'Compact the conversation history' },
  { name: 'resume', description: 'Resume a previous session' },
  { name: 'rewind', description: 'Rewind the conversation to a previous message' },
  { name: 'btw', description: 'Ask a parallel side question without changing this conversation' },
  { name: 'export', description: 'Export the conversation to a markdown file' },
  // Session / environment
  { name: 'status', description: 'Show session status' },
  { name: 'cost', description: 'Show session token usage' },
  { name: 'config', description: 'Show the cute-dsh-tui configuration source' },
  { name: 'doctor', description: 'Run environment checks' },
  { name: 'init', description: 'Create AGENTS.md in the working directory' },
  { name: 'agents', description: 'Show subagents of this session' },
  // Model / display
  { name: 'activity', description: 'Switch the working-activity indicator preset' },
  { name: 'preset', description: 'Switch the agent preset (standard/code/minimal/cordis)' },
  { name: 'theme', description: 'Switch the color theme (built-in or custom)' },
  { name: 'lang', description: 'Switch the UI language (en / zh)' },
  { name: 'model', description: 'Show the active model' },
  { name: 'thinking', description: 'Toggle extended thinking display' },
  { name: 'tokens', description: 'Show session token usage' },
  // Account / policy
  { name: 'login', description: 'Enter a DeepSeek API key for this session or future cdsh launches' },
  { name: 'logout', description: 'Clear this session key and optionally forget CuteDshTui’s saved key' },
  { name: 'permission', description: 'Switch sandbox and approval policy' },
  { name: 'permissions', description: 'Show current sandbox and approval policy' },
  { name: 'add-dir', description: 'Show the filesystem policy scope' },
  { name: 'mcp', description: 'Show MCP status' },
  { name: 'update', description: 'Update cute-dsh-tui and restart' },
  {
    name: 'plugin',
    description: 'List and manage plugins in this DSH profile',
    subcommands: [
      { name: 'list', description: 'Show installed and profile-loaded plugins' },
      { name: 'search', description: 'Search plugin names in this profile' },
      { name: 'add', description: 'Install a package into this profile' },
      { name: 'remove', description: 'Remove a package from this profile' },
      { name: 'update', description: 'Update one package, or all packages' },
    ],
  },
  // Built-in skills (CC's skill commands, driven through DSH skills)
  { name: 'audit', description: 'Run a comprehensive code audit on this project' },
  { name: 'bug', description: 'Capture a bug report' },
  { name: 'practice', description: 'Practice programming with cute-dsh-tui' },
  { name: 'review', description: 'Run a comprehensive code review on this project' },
  { name: 'pr_comments', description: 'Review pull request comments' },
  { name: 'release-notes', description: 'Generate release notes' },
  { name: 'vuln-check', description: 'Run a security vulnerability check' },
  // Misc
  { name: 'terminal-setup', description: 'Show terminal setup instructions' },
  // Help / exit
  { name: 'help', description: 'Show shortcuts and commands' },
  { name: 'exit', description: 'Exit cute-dsh-tui' },
]

/**
 * Parse a slash-command line into its name and the verbatim input following
 * the name (separator whitespace included) — the same split the DSH command
 * registry uses, so `/plan off` dispatches `plan` with ` off`.
 *
 * @param line - Complete candidate command line.
 * @returns The parsed name and raw input, or `undefined` when the line is
 *   not a command.
 */
export function parseCommandName(
  line: string,
): { name: string; rawInput: string } | undefined {
  const match = /^\/([a-z][a-z0-9_-]*)(?=$|[\t\n\r ])/.exec(line)
  if (match === null) return undefined
  return { name: match[1], rawInput: line.slice(match[0].length) }
}

/**
 * Whether the input names a local command. Local commands must never be sent
 * to the model when typed alone; trailing whitespace is legal.
 * @param input - Candidate command line (slash optional).
 * @param list - Command list to match against; defaults to LOCAL_COMMANDS.
 * @returns True when the trimmed input names a command in `list`.
 */
export function isLocalCommandName(
  input: string,
  list: readonly LocalCommand[] = LOCAL_COMMANDS,
): boolean {
  // Trailing whitespace is legal (Tab completion leaves a space after the
  // name so the user can type arguments).
  const name = input.replace(/^\//, '').trim()
  return list.some(command => command.name === name)
}

/**
 * Filter commands by a `/…` input prefix (matches the CC overlay behavior).
 * The prefix is the whole input after the slash, so `/plan off` matches
 * nothing and the overlay stays closed — Enter still dispatches through
 * `parseCommandName`.
 * @param input - Slash-command input; the prefix is the whole text after the slash.
 * @param list - Command list to filter; defaults to LOCAL_COMMANDS.
 * @returns Commands whose name starts with the prefix, in list order.
 */
export function filterCommands(
  input: string,
  list: readonly LocalCommand[] = LOCAL_COMMANDS,
): LocalCommand[] {
  const source = input.replace(/^\//, '')
  const trimmed = source.trim()
  const [first = '', ...rest] = trimmed.split(/\s+/)
  const parent = list.find(command => command.name.toLowerCase() === first.toLowerCase())
  // Once a parent command is complete, complete its action token rather than
  // hiding the overlay. Child names retain the parent so the prompt can use
  // the existing Tab/Enter completion path unchanged.
  if (parent?.subcommands !== undefined && (source.endsWith(' ') || rest.length === 0 || rest.length === 1)) {
    const childPrefix = rest[0]?.toLowerCase() ?? ''
    return parent.subcommands
      .filter(child => child.name.toLowerCase().startsWith(childPrefix))
      .map(child => ({
        name: `${parent.name} ${child.name}`,
        description: child.description,
        tag: parent.name,
      }))
  }
  const prefix = trimmed.toLowerCase()
  return list.filter(command =>
    command.name.toLowerCase().startsWith(prefix),
  )
}

/** True while an autocomplete item can safely replace the typed command. */
export function canAcceptCommandSuggestion(input: string, command: LocalCommand): boolean {
  const typed = input.replace(/^\//, '').trim().toLowerCase()
  return typed.length > 0 && command.name.toLowerCase().startsWith(typed)
}
