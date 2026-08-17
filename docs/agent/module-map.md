# Module map and focused verification

| Task surface | Entry files | Key invariant / focused checks |
| --- | --- | --- |
| Plugin lifecycle, agent boot, credentials, exit | `src/index.ts`, `src/plugin.ts` | `verify-teardown-exit.tsx`, `verify-session-credential.ts`, `verify-permissions.mjs` |
| Session projection, submit, resume, rewind, model/preset switching | `src/channel.ts` | `verify-submit.mjs`, `verify-compact.mjs`, `verify-channel-goal-todo.mjs`, `verify-model-route.mjs` |
| Global keys, slash commands, modal precedence | `src/screens/Chat.tsx`, `src/commands.ts` | `verify-working-commands.tsx`, `verify-slash-expanded.tsx`, affected headless screen regression |
| Prompt editing, completion, mentions, CJK widths | `src/components/PromptInput.tsx`, `src/utils/inputHighlight.ts`, `src/utils/mentions.ts` | `verify-input-highlight.ts`, `verify-input-highlight-render.tsx`, `verify-prompt-arrow-keys.tsx`, `verify-cjk-truncate.tsx` |
| Transcript rows, tools, diffs, Markdown | `src/components/MessageList.tsx`, `src/components/messages/*`, `src/cc/*` | `repro-toolcards.tsx`, `verify-cjk-truncate.tsx` |
| Status, activity, themes, i18n | `src/screens/StatusLine.tsx`, `src/components/*Picker*`, `src/theme.ts`, `src/i18n.ts` | `verify-status-line.tsx`, `verify-themes.mjs`, `verify-i18n.mjs` |
| Launcher/profile/runtime install | `cute-dsh-tui.js`, `launch-options.js`, `src/profileManager.ts`, `src/update.ts` | `verify-launch-options.mjs`, `verify-profile-manifest-recovery.mjs`, `verify-profile-native-build.mjs`, `verify-package-exports.mjs` |
| V2 core/TUI transport | `src/core-protocol.ts`, `docs/architecture/v2-runtime-boundary.md` | `verify-core-protocol.ts`; v1 launcher must remain unmodified until an experimental path is verified |
| Cordis/DSH composition | `cordis.patch.yml`, `cordis.yml`, `src/presets.ts` | inspect the active service row order; run packed-profile CI equivalent when practical |
| Terminal renderer and layout | `src/ui.ts`, `src/ink/*`, `src/native-ts/yoga-layout/*` | renderer-specific regression plus affected scroll/resize/copy/PTY probe; validate inline and fullscreen manually |
| Package/release metadata | `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `.github/workflows/publish.yml` | `verify-package-version.mjs`, `verify-package-exports.mjs`, `npm pack --dry-run` |

`src/ink/` and Yoga are ported infrastructure. Do not mass-format or broadly
refactor them. Prefer the `src/ui.ts` facade for ordinary product work.
