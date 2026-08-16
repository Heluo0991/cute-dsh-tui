/**
 * Input semantic-highlight regression: the tokenizer must classify known and
 * unknown slash commands, subcommands, arguments, and mid-message @mentions;
 * wrapping must preserve CJK display width and source ranges.
 */
import { LOCAL_COMMANDS } from '../src/commands.js'
import {
  cursorAtVisualColumn,
  moveCursorVertically,
  tokenizePromptInput,
  wrapToWidthRanges,
} from '../src/utils/inputHighlight.js'
import type { LocalCommand } from '../src/commands.js'

let failed = 0
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`)
  if (!ok) failed++
}

const tokens = (value: string, commands: readonly LocalCommand[] = LOCAL_COMMANDS) =>
  tokenizePromptInput(value, commands)

// 1. Slash command classification.
{
  const model = tokens('/model')
  check('/model is one known command token', model.length === 1 && model[0]?.kind === 'command' && model[0]?.text === '/model')
  const partial = tokens('/mod')
  check('partial /mod is still known', partial[0]?.kind === 'command')
  const unknown = tokens('/nope')
  check('/nope is warning-colored unknown', unknown[0]?.kind === 'command-unknown')
  const plan = tokens('/plan off', [
    ...LOCAL_COMMANDS,
    { name: 'plan', description: 'external plan command', external: true },
  ])
  check('/plan off has argument remainder', plan[0]?.kind === 'command' && plan[1]?.kind === 'argument' && plan[1]?.text === ' off')
}

// 2. Subcommand-aware coloring.
{
  const plugin = tokens('/plugin add express')
  const kinds = plugin.map(token => token.kind).join(',')
  check('/plugin add keeps child command-colored', kinds === 'command,argument' && plugin[0]?.text === '/plugin add' && plugin[1]?.text === ' express')
}

// 3. Mentions anywhere win over slash argument coloring.
{
  const mid = tokens('看看 @src/a.ts 这个')
  check('mid-message @mention is classified', mid.some(token => token.kind === 'mention' && token.text === '@src/a.ts'))
  const slash = tokens('/audit @src/a.ts')
  check('slash argument mention wins', slash.some(token => token.kind === 'mention'))
  const quoted = tokens('@"my dir/a.ts"')
  check('quoted mention stays one token', quoted[0]?.kind === 'mention' && quoted[0]?.text === '@"my dir/a.ts"')
}

// 4. Visual-row caret movement (PromptInput Up/Down contract).
{
  const wrapped = wrapToWidthRanges('abcdef', 3)
  const down = moveCursorVertically('abcdef', 1, 3, 'down')
  check('down crosses a soft wrap to the next visual row', !down.atEdge && down.cursor === 4)
  const up = moveCursorVertically('abcdef', 4, 3, 'up')
  check('up crosses a soft wrap to the previous visual row', !up.atEdge && up.cursor === 1)
  check('up from the first visual row is the history edge', moveCursorVertically('abcdef', 1, 3, 'up').atEdge)
  check('down from the last visual row is the history edge', moveCursorVertically('abcdef', 6, 3, 'down').atEdge)
  const hard = moveCursorVertically('ab\ncd', 1, 10, 'down')
  check('down still crosses hard newlines', !hard.atEdge && hard.cursor === 4)
  const cjkDown = moveCursorVertically('中ab', 1, 3, 'down')
  check('wide glyphs move as visual rows without splitting', !cjkDown.atEdge && cjkDown.cursor === 3)
  const cjkUp = moveCursorVertically('中ab', 3, 3, 'up')
  check('wide glyph up move lands before the wide first row', !cjkUp.atEdge && cjkUp.cursor === 0)
  const wideLine = wrapToWidthRanges('中ab', 3)[0]
  const wideCursor = wideLine === undefined ? 0 : cursorAtVisualColumn(wideLine, 1)
  check('cursorAtVisualColumn never splits a wide glyph', wideCursor === 0)
}

// 5. CJK-aware wrapping with source ranges.
{
  const rows = wrapToWidthRanges('你好世界', 4)
  check('CJK wraps into two full-width rows', rows.length === 2 && rows[0]?.text === '你好' && rows[1]?.text === '世界')
  check('row ranges map to code-unit offsets', rows[0]?.start === 0 && rows[0]?.end === 2 && rows[1]?.start === 2 && rows[1]?.end === 4)
  const mixed = wrapToWidthRanges('ab中', 3)
  check('mixed-width row text is correct', mixed.length === 2 && mixed[0]?.text === 'ab' && mixed[1]?.text === '中')
  const newline = wrapToWidthRanges('a\n中', 10)
  check('newline produces two source rows', newline.length === 2 && newline[0]?.text === 'a' && newline[1]?.text === '中' && newline[1]?.start === 2)
}

process.exit(failed)
