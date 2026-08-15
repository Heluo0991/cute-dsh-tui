import React from 'react';
import type { LlmModelInfo } from '@deepseek-ai/dsh-llm';
import type { ReasoningEffortOption } from '../channel.js';
/** Second stage of `/model`: select one adapter-supported reasoning depth. */
export declare function ReasoningEffortPicker({ model, efforts, focusIndex, currentEffort, }: {
    model: LlmModelInfo;
    efforts: readonly ReasoningEffortOption[];
    focusIndex: number;
    currentEffort: string | undefined;
}): React.ReactNode;
//# sourceMappingURL=ReasoningEffortPicker.d.ts.map