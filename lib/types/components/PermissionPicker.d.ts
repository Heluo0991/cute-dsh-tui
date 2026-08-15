import React from 'react';
import type { PermissionOption } from '../channel.js';
/** Selects DSH's current-session sandbox and approval bundle. */
export declare function PermissionPicker({ options, focusIndex, currentPreset, }: {
    options: readonly PermissionOption[];
    focusIndex: number;
    currentPreset: string;
}): React.ReactNode;
/** Explicit interlock before a session gains unrestricted access. */
export declare function FullAccessConfirm({ fromYoloResume, }: {
    /** Distinguishes the launcher-driven confirmation from a manual switch. */
    fromYoloResume: boolean;
}): React.ReactNode;
//# sourceMappingURL=PermissionPicker.d.ts.map