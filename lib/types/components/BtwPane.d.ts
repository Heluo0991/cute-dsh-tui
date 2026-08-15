import React from 'react';
import type { BtwThread } from '../channel.js';
/**
 * A child session is a real conversation, not a condensed activity log. Keep
 * the main message renderer here so Markdown, thinking blocks, and tool cards
 * retain the same fidelity as the parent transcript.
 */
export declare function BtwPane({ thread, draft, expanded, }: {
    thread: BtwThread;
    draft: string;
    expanded: boolean;
}): React.ReactNode;
//# sourceMappingURL=BtwPane.d.ts.map