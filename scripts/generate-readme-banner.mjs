import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const input = JSON.parse(readFileSync(resolve(root, 'docs/assets/pixel-character-standardized.json'), 'utf8'))
const output = resolve(root, 'docs/assets/readme-terminal-banner.svg')

const cell = 8
const offsetX = 32
const offsetY = 30
const mascot = input.pixels.map(({ x, y, color }) => {
  const fill = input.palette[color]?.hex
  if (!/^#[0-9a-f]{6}$/i.test(fill ?? '')) throw new Error(`Invalid palette colour: ${color}`)
  return `  <rect x="${offsetX + x * cell}" y="${offsetY + y * cell}" width="${cell}" height="${cell}" fill="${fill}"/>`
})

const svg = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360" role="img" aria-labelledby="title desc">',
  '  <title id="title">CuteDshTui terminal art</title>',
  '  <desc id="desc">A pixel DeepSeek mascot on the left and a DeepSeek Harness wordmark on the right.</desc>',
  '  <rect width="1200" height="360" rx="16" fill="#090a0d"/>',
  '  <g shape-rendering="crispEdges">',
  ...mascot,
  '  </g>',
  '  <g font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-weight="900" letter-spacing="-5">',
  '    <text x="330" y="145" font-size="94" fill="#fbf9fa">DEEPSEEK</text>',
  '    <text x="330" y="250" font-size="94" fill="#fbf9fa">HARNESS</text>',
  '  </g>',
  '  <g fill="#00aaaa"><rect x="330" y="51" width="12" height="12"/><rect x="782" y="130" width="12" height="12"/><rect x="464" y="238" width="12" height="12"/><rect x="990" y="238" width="12" height="12"/></g>',
  '  <text x="332" y="302" fill="#a9a4c4" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="18">CuteDshTui · terminal front door for DeepSeek Harness</text>',
  '</svg>',
  '',
].join('\n')

writeFileSync(output, svg, 'utf8')
