import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { canAcceptCommandSuggestion, filterCommands } from '../src/commands.js'
import { parsePluginAction, pluginArgs } from '../src/pluginManager.js'

assert.deepEqual(parsePluginAction('add @scope/example'), { verb: 'add', target: '@scope/example' })
assert.deepEqual(parsePluginAction('remove @scope/example'), { verb: 'remove', target: '@scope/example' })
assert.deepEqual(parsePluginAction('update'), { verb: 'update' })
assert.deepEqual(parsePluginAction('update @scope/example'), { verb: 'update', target: '@scope/example' })
assert.equal(parsePluginAction('add'), undefined)
assert.equal(parsePluginAction('remove one two'), undefined)
assert.deepEqual(pluginArgs({ verb: 'add', target: 'file:../plugin' }), ['add', 'file:../plugin'])

const pluginChildren = filterCommands('/plugin')
assert.deepEqual(pluginChildren.map(item => item.name), [
  'plugin list',
  'plugin search',
  'plugin add',
  'plugin remove',
  'plugin update',
])
assert.deepEqual(filterCommands('/plugin se').map(item => item.name), ['plugin search'])
assert.equal(canAcceptCommandSuggestion('/plu', filterCommands('/plu')[0]!), true)
assert.equal(canAcceptCommandSuggestion('/plugin search query', pluginChildren[1]!), false)

const channel = readFileSync(new URL('../src/channel.ts', import.meta.url), 'utf8')
const chat = readFileSync(new URL('../src/screens/Chat.tsx', import.meta.url), 'utf8')
assert.match(channel, /name: 'get_main_progress'/)
assert.match(channel, /origin: 'subagent'/)
assert.match(channel, /kind: 'tool'/)
assert.match(channel, /toolCards\.set\(event\.data\.callId, card\)/)
assert.match(channel, /writeResumeTarget\(childId\)/)
assert.match(channel, /lineageRoot: rootOf\(header\)/)
assert.match(chat, /channel\.startBtw\(question\)/)
assert.match(chat, /onPluginAction\?\.\(action\)/)
assert.match(chat, /resumeExpandedGroups/)
assert.match(chat, /key\.ctrl && input === 'o'/)

const btwPane = readFileSync(new URL('../src/components/BtwPane.tsx', import.meta.url), 'utf8')
assert.match(btwPane, /<MessageList/)
// The pane's header copy lives in the i18n dictionary (btw-pane-hint), not
// hardcoded in the component — assert the en template keeps its lineage
// marker ("Forked context") so the pane stays recognizably a fork.
const i18n = readFileSync(new URL('../src/i18n.ts', import.meta.url), 'utf8')
assert.match(i18n, /'btw-pane-hint': \{ zh: '[^']*', en: 'Forked context[^']*' \}/)

console.log('btw, plugin, and lineage wiring verification passed')
