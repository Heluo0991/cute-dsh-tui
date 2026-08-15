import { interpolateColor } from './Spinner/spinnerUtils.js'

/**
 * A 5-row block font for the header tagline, painted with a horizontal
 * color gradient plus a moving highlight window (the same sweep cadence as
 * the wordmark shimmer — see the `stepMs` parameter). Glyphs are 5 columns wide so curves
 * and diagonals stay legible; only the letters the tagline needs are
 * defined, and unknown characters fall back to a hollow box so a typo
 * fails visibly instead of crashing the splash.
 */

export interface Rgb {
  r: number
  g: number
  b: number
}

/** Glyph rows are 5 columns wide; `·` is a transparent cell. */
const GLYPHS: Record<string, readonly [string, string, string, string, string]> = {
  D: ['█▀▀▀▄', '█···█', '█···█', '█···█', '█▄▄▄▀'],
  E: ['█▀▀▀▀', '█····', '█▀▀▀·', '█····', '█▄▄▄▄'],
  P: ['█▀▀▀▄', '█···█', '█▄▄▄▀', '█····', '█····'],
  S: ['█▀▀▀▀', '█····', '·▀▀▀▄', '····█', '█▄▄▄▀'],
  K: ['█···█', '█·█··', '██···', '█·█··', '█···█'],
  H: ['█···█', '█···█', '█▀▀▀█', '█···█', '█···█'],
  A: ['·▄▀▄·', '█···█', '█▀▀▀█', '█···█', '█···█'],
  R: ['█▀▀▀▄', '█···█', '█▄▄▄▀', '█·█··', '█···█'],
  N: ['█···█', '██··█', '█·█·█', '█··██', '█···█'],
}

const FALLBACK: readonly [string, string, string, string, string] = [
  '▄▄▄▄▄',
  '█···█',
  '█···█',
  '█···█',
  '▀▀▀▀▀',
]

/** Per-glyph advance (5 glyph columns + 1 kerning column). */
const ADVANCE = 6
/** Space between words. */
const WORD_GAP = 2
/** Sweep highlight window width, in terminal columns. */
const SWEEP_WINDOW = 8

const esc = (rgb: Rgb): string => `\x1b[38;2;${rgb.r};${rgb.g};${rgb.b}m`
const RESET = '\x1b[39m'

/**
 * Render `text` in the 5-row block font. The gradient runs `from` → `to`
 * across the full line width; a SWEEP_WINDOW-wide highlight mixed toward
 * `flash` travels left to right (one column per `stepMs`, matching the
 * wordmark shimmer's cadence). Returns 5 ANSI rows.
 * @param text - Text to render; only D, E, P, S, K, H, A, R, N have glyphs, unknown letters fall back to a hollow box.
 * @param time - Elapsed time in milliseconds; drives the sweep position and the brightness pulse.
 * @param from - Gradient start color at the left edge.
 * @param to - Gradient end color at the right edge.
 * @param flash - Highlight color mixed into the moving sweep window.
 * @param stepMs - Milliseconds per column of sweep advance (default 60).
 * @returns Five ANSI rows, one per block-font line.
 */
export function renderBigText(
  text: string,
  time: number,
  from: Rgb,
  to: Rgb,
  flash: Rgb,
  stepMs = 60,
): string[] {
  const width = text.length * ADVANCE + (text.includes(' ') ? WORD_GAP - 1 : 0)
  const cycle = width + SWEEP_WINDOW * 2
  const sweepStart = (Math.floor(time / stepMs) % cycle) - SWEEP_WINDOW
  const pulse = (Math.sin(time / (stepMs * 2)) + 1) / 2

  const rows: string[] = []
  for (let row = 0; row < 5; row++) {
    let out = ''
    let current = ''
    let x = 0
    const emit = (ch: string): void => {
      if (ch === ' ' || ch === '·') {
        if (current !== '') {
          out += RESET
          current = ''
        }
        out += ' '
        x += 1
        return
      }
      const t = width <= 1 ? 0 : x / (width - 1)
      let color = interpolateColor(from, to, t)
      if (x >= sweepStart && x < sweepStart + SWEEP_WINDOW) {
        color = interpolateColor(color, flash, pulse)
      }
      const seq = esc(color)
      if (seq !== current) {
        out += seq
        current = seq
      }
      out += ch
      x += 1
    }
    for (const ch of text) {
      if (ch === ' ') {
        for (let i = 0; i < WORD_GAP; i++) emit(' ')
        continue
      }
      const glyph = GLYPHS[ch] ?? FALLBACK
      for (const cell of glyph[row]) emit(cell)
      emit(' ')
    }
    if (current !== '') out += RESET
    rows.push(out)
  }
  return rows
}

/**
 * The Messages terminal font supplied as HTML in `bangen/111.html`. The
 * source contains rendered samples (rather than a distributable glyph file),
 * so these are the two brand words used by the splash. Keeping the original
 * block/shade characters preserves the typeface while the renderer below
 * preserves its original per-cell palette while adding the shimmer.
 */
const MESSAGES_WORDS: Readonly<Record<string, readonly string[]>> = {
  DEEPSEEK: [
    '▀██▀▀█▀▄  ▀██▀▀▀█▄ ▀██▀▀▀█▄ ▀██▀▀▀█▄ ▄▄▄▀▀█▄ ▀██▀▀▀█▄ ▀██▀▀▀█▄ ▀██▀  ▄▄',
    '▓██  ▀▀██ ▓██  ▀▀▀ ▓██  ▀▀▀ ▓██ ▄▄█▀ ██▀ ▀▀▀ ▓██  ▀▀▀ ▓██  ▀▀▀ ▓██ ▄▄█▀',
    '▒██   ▓██ ▒█▄▀▀    ▒█▄▀▀    ▒█▄▀▀▀▀  ▀▀█▄▄▄  ▒█▄▀▀    ▒█▄▀▀    ▒█▀▄█▀▀',
    '░██  ▄▄██ ░██      ░██      ░██       ▀▀▀▀▄█ ░██      ░██      ░██▀▀█▄',
    '▄██▄▄██▀▀ ▄██▄▄▄█▀ ▄██▄▄▄█▀ ▄██▄     ██▄▄▄█▀ ▄██▄▄▄█▀ ▄██▄▄▄█▀ ▄██▄▄▄██▄',
    '▀▀▀▀▀▀▀   ▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀  ▀▀▀▀     ▀▀▀▀▀▀  ▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀',
  ],
  HARNESS: [
    '▀██▀▒▀██▀     ▄▄█▄    ▀██▀▀██▄    ▄    ▓▀█▀ ▀██▀▀▀█▄ ▄▄▄▀▀█▄ ▄▄▄▀▀█▄',
    '▓██  ▓██     ▓█▄▀█▄   ▓██ ▒▐█▀   ░▄█▄   ▒█  ▓██  ▀▀▀ ██▀ ▀▀▀ ██▀ ▀▀▀',
    '▒█▄▀▀▀██    ▒██▀█▀█   ▒██▄▄█▀    ▒█▀▀█▄ ░█  ▒█▄▀▀    ▀▀█▄▄▄  ▀▀█▄▄▄',
    '░██  ▒██   ░██▀▀▀▀██  ░██▀▀▄█▄   ░█ ▀▀▀█▄█  ░██       ▀▀▀▀▄█  ▀▀▀▀▄█',
    '▄██▄▄▄██▄ ▄██▄▄ ▄▄██▄ ▄██▄▀▀▀██▄ ▄█▄  ▀▀▀█  ▄██▄▄▄█▀ ██▄▄▄█▀ ██▄▄▄█▀',
    '▀▀▀▀▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀  ▀▀▀▀ ▀▀▀    ▀▀  ▀▀▀▀▀▀▀  ▀▀▀▀▀▀  ▀▀▀▀▀▀',
  ],
}

type MessagesRow = { readonly text: string; readonly styles: string }

/** Exact per-cell paint extracted from `bangen/111.html` (0..4 style keys). */
const MESSAGES_RENDERED: Readonly<Record<string, readonly MessagesRow[]>> = {
  DEEPSEEK: [
    { text: '▀██▀▀█▀▄  ▀██▀▀▀█▄ ▀██▀▀▀█▄ ▀██▀▀▀█▄ ▄▄▄▀▀█▄ ▀██▀▀▀█▄ ▀██▀▀▀█▄ ▀██▀  ▄▄ ', styles: '100110203310011100310011100310011100340011003100111003100111003100133403' },
    { text: '▓██  ▀▀██ ▓██  ▀▀▀ ▓██  ▀▀▀ ▓██ ▄▄█▀ ██▀ ▀▀▀ ▓██  ▀▀▀ ▓██  ▀▀▀ ▓██ ▄▄█▀ ', styles: '400333100340033433340033433340034001300334333400334333400334333400340013' },
    { text: '▒██   ▓██ ▒█▄▀▀    ▒█▄▀▀    ▒█▄▀▀▀▀  ▀▀█▄▄▄  ▒█▄▀▀    ▒█▄▀▀    ▒█▀▄█▀▀  ', styles: '400333400340211333340211333340211133331000033402113333402113333402001333' },
    { text: '░██  ▄▄██ ░██      ░██      ░██       ▀▀▀▀▄█ ░██      ░██      ░██▀▀█▄  ', styles: '400334000340033333340033333340033333334331203400333333400333333400310033' },
    { text: '▄██▄▄██▀▀ ▄██▄▄▄█▀ ▄██▄▄▄█▀ ▄██▄     ██▄▄▄█▀ ▄██▄▄▄█▀ ▄██▄▄▄█▀ ▄██▄▄▄██▄', styles: '000000013300000001300000001300003333300000013000000013000000013000041000' },
    { text: '▀▀▀▀▀▀▀   ▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀  ▀▀▀▀     ▀▀▀▀▀▀  ▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀', styles: '333333333333333333333333333333333333333333333333333333333333333333343333' },
  ],
  HARNESS: [
    { text: '▀██▀▒▀██▀     ▄▄█▄    ▀██▀▀██▄    ▄    ▓▀█▀ ▀██▀▀▀█▄ ▄▄▄▀▀█▄ ▄▄▄▀▀█▄', styles: '10014100133333400033331001100033330333341013100111003400110034001100' },
    { text: '▓██  ▓██     ▓█▄▀█▄   ▓██ ▒▐█▀   ░▄█▄   ▒█  ▓██  ▀▀▀ ██▀ ▀▀▀ ██▀ ▀▀▀', styles: '40033400333334021003334003400133342003334033400334333003343330033433' },
    { text: '▒█▄▀▀▀██    ▒██▀█▀█   ▒██▄▄█▀    ▒█▀▀█▄ ░█  ▒█▄▀▀    ▀▀█▄▄▄  ▀▀█▄▄▄ ', styles: '40211100333340034103334000001333340310034033402113333310000333100003' },
    { text: '░██  ▒██   ░██▀▀▀▀██  ░██▀▀▄█▄   ░█ ▀▀▀█▄█  ░██       ▀▀▀▀▄█  ▀▀▀▀▄█', styles: '40033400333400111100334003120033340343100033400333333343312033433120' },
    { text: '▄██▄▄▄██▄ ▄██▄▄ ▄▄██▄ ▄██▄▀▀▀██▄ ▄█▄  ▀▀▀█  ▄██▄▄▄█▀ ██▄▄▄█▀ ██▄▄▄█▀', styles: '00004000030001034000030000431000300033431033000000013000000130000001' },
    { text: '▀▀▀▀▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀  ▀▀▀▀ ▀▀▀    ▀▀  ▀▀▀▀▀▀▀  ▀▀▀▀▀▀  ▀▀▀▀▀▀ ', styles: '33334333333333334333333333334333333333334333333333333333333333333333' },
  ],
}

// The supplied HTML renders Messages on black with white ink, grey half-block
// shading, and cyan accents. Keep that palette independent of the TUI theme;
// only the moving scan highlight is animated.
const MESSAGES_WHITE: Rgb = { r: 255, g: 255, b: 255 }
const MESSAGES_GREY: Rgb = { r: 170, g: 170, b: 170 }
const MESSAGES_DARK: Rgb = { r: 85, g: 85, b: 85 }
const MESSAGES_CYAN: Rgb = { r: 0, g: 170, b: 170 }
const RESET_COLORS = '\x1b[39;49m'
const MESSAGES_CONVERGE_MS = 1_600
const MESSAGES_FOCUS_MS = 350
const MESSAGES_RIPPLE_MS = 1_000

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))
const easeOutCubic = (value: number): number => 1 - (1 - clamp01(value)) ** 3

function bandStrength(position: number, center: number, radius: number): number {
  return clamp01(1 - Math.abs(position - center) / radius)
}

/**
 * Startup light choreography for the Messages art:
 * two scans travel inward, compress into one center point, then break into
 * small symmetric particles that ripple outward. The first and last frames
 * intentionally contain no moving paint, so the settled logo is pure source art.
 */
function messagesShimmerStrength(x: number, row: number, width: number, time: number): number {
  const center = (width - 1) / 2
  if (time < MESSAGES_CONVERGE_MS) {
    const progress = easeOutCubic(time / MESSAGES_CONVERGE_MS)
    const left = -SWEEP_WINDOW + (center + SWEEP_WINDOW) * progress
    const right = width + SWEEP_WINDOW + (center - width - SWEEP_WINDOW) * progress
    return Math.max(bandStrength(x, left, SWEEP_WINDOW / 2), bandStrength(x, right, SWEEP_WINDOW / 2))
  }

  const focusEnd = MESSAGES_CONVERGE_MS + MESSAGES_FOCUS_MS
  if (time < focusEnd) {
    const progress = easeOutCubic((time - MESSAGES_CONVERGE_MS) / MESSAGES_FOCUS_MS)
    // The joined beam contracts instead of passing through itself.
    return bandStrength(x, center, Math.max(0.45, (SWEEP_WINDOW / 2) * (1 - progress)))
  }

  const rippleEnd = focusEnd + MESSAGES_RIPPLE_MS
  if (time >= rippleEnd) return 0

  const progress = easeOutCubic((time - focusEnd) / MESSAGES_RIPPLE_MS)
  const distance = Math.abs(x - center)
  const radius = (center + SWEEP_WINDOW / 2) * progress
  const leadingRing = bandStrength(distance, radius, 0.8)
  const trailingMotes = bandStrength(distance, radius * 0.58, 0.45)
  // Offset each terminal row differently so the outward wave reads as
  // particles rather than two solid vertical bars.
  const leadingParticle = (x * 11 + row * 7 + Math.floor(progress * 12)) % 4 === 0 ? 1 : 0.42
  const moteParticle = (x * 5 + row * 3 + Math.floor(progress * 10)) % 3 === 0 ? 0.75 : 0
  return Math.max(leadingRing * leadingParticle, trailingMotes * moteParticle)
}

/** Render one supplied Messages-font brand word with the normal splash paint. */
export function renderMessagesText(
  text: string,
  time: number,
  from: Rgb,
  to: Rgb,
  flash: Rgb,
  stepMs = 60,
): string[] {
  const source = MESSAGES_RENDERED[text]
  if (source === undefined) return renderBigText(text, time, from, to, flash, stepMs)
  const width = Math.max(...source.map(row => row.text.length))
  return source.map((row, rowIndex) => {
    let out = ''
    let current = ''
    for (let x = 0; x < row.text.length; x++) {
      const ch = row.text[x]!
      const style = row.styles[x]!
      if (ch === ' ') {
        if (current !== '') {
          out += RESET_COLORS
          current = ''
        }
        out += ch
        continue
      }
      // Preserve the HTML source's monochrome ink and block shading rather
      // than recoloring Messages with the splash's ice-blue gradient.
      let color = style === '4' ? MESSAGES_DARK : style === '3' ? MESSAGES_GREY : MESSAGES_WHITE
      let background = style === '1' ? MESSAGES_GREY : style === '2' ? MESSAGES_CYAN : undefined
      // Original cyan pixels are part of the glyph. The effect passes around
      // them so it never replaces or removes those embedded highlights.
      const shimmer = style === '2' ? 0 : messagesShimmerStrength(x, rowIndex, width, time)
      if (shimmer > 0) {
        color = interpolateColor(color, MESSAGES_WHITE, shimmer)
        background = MESSAGES_CYAN
      }
      const seq = `${esc(color)}${background === undefined ? '' : `\x1b[48;2;${background.r};${background.g};${background.b}m`}`
      if (seq !== current) {
        out += seq
        current = seq
      }
      out += ch
    }
    return current === '' ? out : out + RESET_COLORS
  })
}
