/** Visual-state helpers for the prompt while a Max route is being replaced. */
export function isMaxModel(model) {
    return /max/i.test(model.id) || /max/i.test(model.name);
}
const SKY = { r: 73, g: 201, b: 255 };
const ICE = { r: 219, g: 244, b: 255 };
const BLUE = { r: 95, g: 181, b: 248 };
const WHITE = { r: 245, g: 251, b: 255 };
function mix(from, to, amount) {
    const t = Math.max(0, Math.min(1, amount));
    const r = Math.round(from.r + (to.r - from.r) * t);
    const g = Math.round(from.g + (to.g - from.g) * t);
    const b = Math.round(from.b + (to.b - from.b) * t);
    return `rgb(${r},${g},${b})`;
}
function rotatingColor(phase) {
    const normalized = ((phase % 1) + 1) % 1;
    const colors = [BLUE, SKY, ICE, WHITE];
    const scaled = normalized * colors.length;
    const index = Math.floor(scaled) % colors.length;
    const next = colors[(index + 1) % colors.length];
    return mix(colors[index], next, scaled - Math.floor(scaled));
}
/**
 * Initial state shades from blue at the upper-left toward white at the lower
 * edge; advancing time moves that color progression clockwise around all four
 * sides of the temporary Max outline.
 */
export function modelSwitchBorderColors(elapsedMs) {
    const spin = elapsedMs / 1200;
    return {
        top: rotatingColor(spin),
        right: rotatingColor(spin + 0.25),
        bottom: rotatingColor(spin + 0.5),
        left: rotatingColor(spin + 0.75),
    };
}
/** Backward-compatible primary glow color for simple consumers. */
export function modelSwitchGlowColor(elapsedMs) {
    return modelSwitchBorderColors(elapsedMs).top;
}
