import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isMaxModel, modelSwitchBorderColors, modelSwitchGlowColor } from '../src/components/modelSwitchGlow.js'

assert.equal(isMaxModel({ id: 'deepseek-v4-pro-max', name: 'DeepSeek V4 Pro Max' }), true)
assert.equal(isMaxModel({ id: 'provider/pro', name: 'Pro Max' }), true)
assert.equal(isMaxModel({ id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro' }), false)

const first = modelSwitchGlowColor(0)
const crest = modelSwitchGlowColor(105)
const next = modelSwitchGlowColor(315)
assert.match(first, /^rgb\(\d+,\d+,\d+\)$/)
assert.match(crest, /^rgb\(\d+,\d+,\d+\)$/)
assert.notEqual(first, crest)
assert.notEqual(crest, next)

const borderStart = modelSwitchBorderColors(0)
const borderMoved = modelSwitchBorderColors(300)
assert.notEqual(borderStart.top, borderStart.bottom)
assert.notEqual(borderStart.top, borderMoved.top)

// Keep the visual-state wiring honest: the selection state must reach the
// prompt, and very fast local forks must remain visible for at least one
// terminal redraw instead of being batched away.
const chatSource = readFileSync(new URL('../src/screens/Chat.tsx', import.meta.url), 'utf8')
const promptSource = readFileSync(new URL('../src/components/PromptInput.tsx', import.meta.url), 'utf8')
assert.match(chatSource, /modelSwitching=\{maxModelSwitchesInFlight > 0\}/)
assert.match(chatSource, /1600 - \(Date\.now\(\) - glowStartedAt\)/)
assert.match(promptSource, /borderTopColor=\{switchBorderColors\?\.top\}/)
assert.match(promptSource, /borderRightColor=\{switchBorderColors\?\.right\}/)
assert.match(promptSource, /borderBottomColor=\{switchBorderColors\?\.bottom\}/)
assert.match(promptSource, /borderLeftColor=\{switchBorderColors\?\.left\}/)
assert.match(promptSource, /useAnimationFrame\(modelSwitching \? 60 : null\)/)
assert.doesNotMatch(promptSource, /renderMaxSwitchLabel/)

console.log('model-switch glow verification passed')
