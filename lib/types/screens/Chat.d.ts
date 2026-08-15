import React from 'react';
import type { Channel } from '../channel.js';
import type { QuestionStore } from '../questions.js';
import { ApprovalStore } from '../approvals.js';
import { type PluginAction } from '../pluginManager.js';
/**
 * Main chat screen in the Claude Code layout: a scrollable transcript
 * (with the current turn's prompt pinned above the viewport while scrolled
 * up), transient notifications, the working spinner, the bordered prompt
 * input (with slash-command overlay) and the status line pinned at the
 * bottom.
 *
 * Ctrl+O toggles expanded detail globally; Shift+↑ enters message-selection
 * mode (↑/↓ move, Enter expands the selected row, Esc exits); Ctrl+C
 * interrupts the running turn, or (when idle) asks for a second Ctrl+C to
 * exit; Enter while scrolled up jumps back to the bottom.
 */
export declare function Chat({ channel, questionStore, approvalStore: suppliedApprovalStore, onExit, onUpdate, onPluginAction, profile, fullscreen, openResumePickerOnStart, yoloResumeUpgrade, }: {
    channel: Channel;
    questionStore: QuestionStore;
    /** Optional for embedders; the real plugin always supplies its shared store. */
    approvalStore?: ApprovalStore;
    onExit: () => void;
    /** Update the installed package and restart the current TUI process. */
    onUpdate?: () => void;
    /** Profile mutation handoff: the plugin unmounts before spawning pnpm. */
    onPluginAction?: (action: PluginAction) => void;
    profile?: string;
    /** Alternate-screen mode can safely keep header animation after history exists. */
    fullscreen?: boolean;
    /** Open the current-working-directory session picker after the first frame. */
    openResumePickerOnStart?: boolean;
    /** `--yolo` resumed an existing session; require a user upgrade decision. */
    yoloResumeUpgrade?: boolean;
}): React.JSX.Element;
//# sourceMappingURL=Chat.d.ts.map