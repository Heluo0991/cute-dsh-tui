import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Text } from '../ui.js';
import { t } from '../i18n.js';
/**
 * The dim "interrupted" row shown when the user stops a turn, ported from
 * the leak's `InterruptedByUser.tsx`.
 */
export function InterruptedByUser() {
    return (_jsxs(_Fragment, { children: [_jsxs(Text, { dimColor: true, children: [t('interrupted-label'), " "] }), _jsx(Text, { dimColor: true, children: t('interrupted-question') })] }));
}
