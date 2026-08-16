import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { t as tr } from '../i18n.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Box, Text, useAnimationFrame, useTerminalSize } from '../ui.js';
import { getTheme } from '../theme.js';
import { useTheme } from './design-system/ThemeProvider.js';
import { parseRGB } from './Spinner/spinnerUtils.js';
import { renderMessagesText } from './bigfont.js';
import { BRAND, FLASH, ICE, PALE, sweep } from './shimmer.js';
import { CuteDeepSeekArt } from './CuteDeepSeek.js';
import { OPENING_SEQUENCE } from './whaleFrames.js';
/**
 * Header badge version, read from the installed package.json so the display
 * never drifts from the published version. Falls back to a literal when the
 * package metadata is unreadable (unusual layouts).
 */
const VERSION = (() => {
    for (const relativePath of ['../../../package.json', '../../package.json']) {
        try {
            const pkgPath = join(dirname(fileURLToPath(import.meta.url)), relativePath);
            const version = JSON.parse(readFileSync(pkgPath, 'utf8')).version;
            if (typeof version === 'string')
                return version;
        }
        catch {
            // Try the source-layout fallback after the compiled-layout path.
        }
    }
    return '1.1.0';
})();
/** Below this width the mascot hides and the header goes text-only. */
const MASCOT_MIN_COLUMNS = 115;
/**
 * Fixed mascot box width keeps the text column stable during the breathing
 * introduction.
 */
const FULL_MASCOT_WIDTH = 33;
/**
 * Leading spaces that center the welcome line under the drawn whale: the
 * art's bounding box spans sprite columns 3..34 (center 18.5) of the
 * 40-wide box, and the tagline measure 14
 * columns — 18.5 − 7 = 11.5 → 12. Centered on the full 40-column box
 * instead would need 13, which reads one column right of the whale body.
 */
const WELCOME_PAD = 9;
/** `max` → `Max` (effort levels arrive lower-case from the adapter). */
function capitalize(text) {
    return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}
/**
 * The header splash: one layout, two phases. The **opening** (~3.4s, once)
 * plays the hand-drawn whale animation (blink → water-spout bloom → tail
 * wag) and runs the shimmer sweeps; the **settled** header is the same
 * tree frozen at t=0 — whale on the standard pose, sweep highlights parked
 * off-screen, clock unsubscribed, zero timers.
 *
 * Layout: the 13-row pixel whale beside a text column of matching height —
 * the `✦ CuteDshTui` wordmark with version, the `DEEPSEEK`/`HARNESS` tagline in
 * the 5-row block font (brand-blue → ice gradient), the model/effort and
 * cwd in plain text (no brand-color highlight), the startup tip, and below
 * the whale the welcome tagline, centered under the art, in ice
 * blue. Narrow terminals drop the whale and keep the text column.
 */
export function LogoV2({ model, effort, cwd, skipIntro = false, animateIntro = true, }) {
    const introEnabled = animateIntro && !skipIntro;
    const [step, setStep] = React.useState(introEnabled ? 0 : OPENING_SEQUENCE.length);
    const settled = !introEnabled || step >= OPENING_SEQUENCE.length;
    // Opening clock: drives the shimmer sweep and big-text highlight only
    // while the intro plays; `null` afterwards unsubscribes so the settled
    // header never repaints. 60ms frames keep the sweep lively.
    const [ref, time] = useAnimationFrame(settled ? null : 60);
    const openingStartTime = React.useRef(null);
    if (openingStartTime.current === null)
        openingStartTime.current = time;
    // Frame chain: dwell per OPENING_SEQUENCE entry, then settle for good.
    React.useEffect(() => {
        if (settled)
            return;
        const timer = setTimeout(() => {
            setStep(s => s + 1);
        }, OPENING_SEQUENCE[step].ms);
        return () => {
            clearTimeout(timer);
        };
    }, [step, settled]);
    const [themeName] = useTheme();
    const theme = getTheme(themeName);
    const { columns } = useTerminalSize();
    const wordmarkRGB = parseRGB(theme.claude) ?? BRAND;
    const wordmarkShimmerRGB = parseRGB(theme.claudeShimmer) ?? ICE;
    const taglineRGB = parseRGB(theme.claudeBlue_FOR_SYSTEM_SPINNER) ?? ICE;
    const showMascot = columns >= MASCOT_MIN_COLUMNS;
    // Frozen clock for the settled header: t=0 parks every sweep highlight
    // off-screen, leaving the static gradient behind.
    const t = settled ? 0 : Math.max(0, time - openingStartTime.current);
    const bigDeepSeek = renderMessagesText('DEEPSEEK', t, wordmarkRGB, taglineRGB, FLASH);
    const bigHarness = renderMessagesText('HARNESS', t, taglineRGB, PALE, FLASH);
    return (_jsxs(Box, { ref: ref, flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { flexDirection: "row", gap: 2, width: "100%", alignItems: "center", children: [showMascot && _jsx(CuteDeepSeekArt, { pulse: t, width: FULL_MASCOT_WIDTH }), _jsxs(Box, { flexDirection: "column", flexShrink: 1, children: [_jsxs(Text, { wrap: "truncate-end", children: [sweep('✦ CuteDshTui', t, wordmarkRGB, wordmarkShimmerRGB, 60), _jsx(Text, { dimColor: true, children: '  v' + VERSION })] }), bigDeepSeek.map((row, index) => (_jsx(Text, { wrap: "truncate-end", children: row }, `ds-${index}`))), bigHarness.map((row, index) => (_jsx(Text, { wrap: "truncate-end", children: row }, `h-${index}`))), _jsxs(Text, { wrap: "truncate-end", children: [model, effort !== undefined && _jsx(Text, { dimColor: true, children: ' · ' + capitalize(effort) + ' effort' })] }), _jsx(Text, { dimColor: true, wrap: "truncate-end", children: cwd }), _jsxs(Text, { wrap: "truncate-end", children: [_jsx(Text, { dimColor: true, children: tr('logo-tip-label') }), "/model", _jsxs(Text, { dimColor: true, children: [" ", tr('logo-tip-model'), " \u00B7 "] }), "/help", _jsxs(Text, { dimColor: true, children: [" ", tr('logo-tip-help'), " \u00B7 "] }), "Tab", _jsxs(Text, { dimColor: true, children: [" ", tr('logo-tip-tab')] })] })] })] }), _jsx(Box, { marginTop: 1, paddingLeft: showMascot ? WELCOME_PAD : 2, children: _jsx(Text, { children: sweep(tr('logo-tagline'), t, taglineRGB, FLASH, 60) }) })] }));
}
