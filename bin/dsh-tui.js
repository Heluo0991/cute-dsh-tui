#!/usr/bin/env node
// Local-development compatibility shim. The published executable is
// `cute-dsh-tui`; this keeps an existing G:\DSH\bin\dsh.cmd wrapper usable
// without changing its path while the repository is renamed.
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

process.env.CUTE_DSH_TUI_DEV_PATH ??= resolve(dirname(fileURLToPath(import.meta.url)), '..')
await import('../cute-dsh-tui.js')
