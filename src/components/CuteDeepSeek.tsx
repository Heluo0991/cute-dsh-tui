import React from 'react'
import { Box, Text } from '../ui.js'

type Rgb = readonly [number, number, number]

/**
 * Exact 33×33 grid from docs/assets/pixel-character-standardized.json.
 * `.` is transparent: the source image's pale-blue board is deliberately
 * omitted so the mascot sits naturally on every terminal theme. Do not
 * resample or hand-adjust this sprite; the JSON grid is its source of truth.
 */
const PALETTE: Readonly<Record<string, Rgb | undefined>> = {
  '1': [99, 123, 187], '2': [31, 30, 52], '3': [251, 249, 250],
  '4': [49, 54, 104], '5': [252, 232, 218], '6': [59, 73, 141],
  '7': [39, 40, 72], '8': [84, 84, 130], '9': [144, 175, 219],
  A: [78, 98, 167], B: [169, 164, 196], C: [235, 172, 178],
  D: [240, 196, 194], E: [95, 162, 215], F: [197, 193, 217],
  G: [218, 214, 230], H: [224, 222, 232], I: [57, 114, 187],
  J: [70, 133, 199], K: [106, 104, 151],
}

const SPRITE = [
  '.................................',
  '.................................',
  '........222....222...............',
  '.......4AAA22.23332.22...........',
  '......61..23323333323322.........',
  '......6..23333B333B333332........',
  '........23334411111443332........',
  '.......23F3411111111143F32.......',
  '......233341111111111143332......',
  '.....23334111111111111143332.....',
  '.....23341111111111111114332.....',
  '.....73341911191119111914332.....',
  '....23G41191119991111991A4G32....',
  '....233411116111111611914E2I2....',
  '....2F341116D111116D61114EIE2....',
  '.....77411165611116556114E2J2....',
  '....28841165556161555D6117487....',
  '...2888411422256565222411A4887...',
  '..788884117573555553757116K8882..',
  '.2888.H4112577555557752116G.8882.',
  '..2...246155115555511551162...2..',
  '...22246411CC55C5C55CC11464222...',
  '......76661AD555C555DA16664......',
  '.....21661A77222D22227A16612.....',
  '....211661147324J423241166112....',
  '....212611643342D243346116212....',
  '.....2.61142438H3H83774116.2.....',
  '.......71142423BBB32424117.......',
  '........44257333B33375247........',
  '...........24433333442...........',
  '............244444442............',
  '.............2B222B2.............',
  '.................................',
] as const

const RESET = '\x1b[0m'
function brighten(rgb: Rgb, amount: number): Rgb {
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * amount),
    Math.round(rgb[1] + (255 - rgb[1]) * amount),
    Math.round(rgb[2] + (255 - rgb[2]) * amount),
  ]
}
function fg(rgb: Rgb): string { return `\x1b[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m` }
function bg(rgb: Rgb): string { return `\x1b[48;2;${rgb[0]};${rgb[1]};${rgb[2]}m` }

/** Render the source-aligned grid as 17 ANSI rows using half-block glyphs. */
export function renderCuteDeepSeekRows(pulse = 0): string[] {
  const amount = Math.max(0, Math.min(1, (Math.sin(pulse / 570) + 1) / 2)) * 0.09
  const rows: string[] = []
  for (let y = 0; y < SPRITE.length; y += 2) {
    const upper = SPRITE[y] ?? ''
    const lower = SPRITE[y + 1] ?? ''
    let out = ''
    let current = ''
    for (let x = 0; x < upper.length; x++) {
      const up = PALETTE[upper[x] ?? '.']
      const down = PALETTE[lower[x] ?? '.']
      let style = ''
      let glyph = ' '
      if (up !== undefined && down !== undefined) {
        style = fg(brighten(up, amount)) + bg(brighten(down, amount)); glyph = '▀'
      } else if (up !== undefined) {
        style = fg(brighten(up, amount)); glyph = '▀'
      } else if (down !== undefined) {
        style = fg(brighten(down, amount)); glyph = '▄'
      }
      if (style !== current) { out += style === '' ? RESET : style; current = style }
      out += glyph
    }
    const row = out.replace(/ +$/, '')
    rows.push(row.endsWith(RESET) ? row : row + RESET)
  }
  return rows
}

/** The CuteDeepSeek mascot, pinned beside the header text. */
export function CuteDeepSeekArt({ pulse, width }: { pulse?: number; width?: number }): React.ReactNode {
  const rows = renderCuteDeepSeekRows(pulse)
  return <Box flexDirection="column" flexShrink={0} width={width}>{rows.map((row, index) => <Text key={index} wrap="truncate-end">{row}</Text>)}</Box>
}
