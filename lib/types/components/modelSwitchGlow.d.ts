/** Visual-state helpers for the prompt while a Max route is being replaced. */
export declare function isMaxModel(model: {
    id: string;
    name: string;
}): boolean;
/** Four independently colored sides of the clockwise Max border animation. */
export interface ModelSwitchBorderColors {
    readonly top: `rgb(${number},${number},${number})`;
    readonly right: `rgb(${number},${number},${number})`;
    readonly bottom: `rgb(${number},${number},${number})`;
    readonly left: `rgb(${number},${number},${number})`;
}
/**
 * Initial state shades from blue at the upper-left toward white at the lower
 * edge; advancing time moves that color progression clockwise around all four
 * sides of the temporary Max outline.
 */
export declare function modelSwitchBorderColors(elapsedMs: number): ModelSwitchBorderColors;
/** Backward-compatible primary glow color for simple consumers. */
export declare function modelSwitchGlowColor(elapsedMs: number): `rgb(${number},${number},${number})`;
//# sourceMappingURL=modelSwitchGlow.d.ts.map