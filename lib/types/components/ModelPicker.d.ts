import React from 'react';
import type { LlmModelInfo } from '@deepseek-ai/dsh-llm';
/**
 * Model picker in the CC ModelPicker style: a permission-colored Pane with
 * the model list as Select rows (❯ focus pointer, ✓ on the active model,
 * descriptions), plus the Enter/Esc hint line. This is step one of `/model`:
 * after choosing a model route, the next pane chooses that route's reasoning
 * depth before the session fork is created.
 */
export declare function ModelPicker({ models, focusIndex, currentModel, }: {
    models: readonly LlmModelInfo[];
    focusIndex: number;
    currentModel: string;
}): React.ReactNode;
//# sourceMappingURL=ModelPicker.d.ts.map