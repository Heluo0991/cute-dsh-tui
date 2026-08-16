import React from 'react';
import type { Channel } from '../channel.js';
/**
 * The footer under the prompt input, in Claude Code's PromptInputFooter
 * layout: the segmented context progress bar on its own first line, the
 * status line below (left group: brand · model · mode · permission · tps ·
 * cache · tokens; right group: git · cwd · title, right-aligned), and the
 * mode/hint line last. The right side of the footer shows the latest
 * transient notification (errors in red, warnings in amber — CC style).
 */
export declare function StatusLine({ channel, selectionActive, helpOpen, btwUnseen, btwViewActive, }: {
    channel: Channel;
    selectionActive?: boolean;
    helpOpen?: boolean;
    /** Completed BTW threads not currently in view (badge count). */
    btwUnseen?: number;
    /** True while the BTW view owns the screen (hint line switches). */
    btwViewActive?: boolean;
}): React.JSX.Element;
//# sourceMappingURL=StatusLine.d.ts.map