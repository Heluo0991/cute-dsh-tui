import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Box, Text, render, useApp, useInput } from './ui.js';
import { CoreClient } from './core-client.js';
import { SessionEventProjector } from './sessionEventProjection.js';
import { createNotificationBuffer, processNotificationRecords, } from './experimentalNotificationBuffer.js';
import { ExperimentalCoreClient, } from './experimentalCoreClient.js';
import { ApprovalPanel } from './components/ApprovalPanel.js';
import { AskUserQuestionPanel } from './components/questions/AskUserQuestionPanel.js';
import { Pane } from './components/design-system/Pane.js';
import { Select } from './components/Select.js';
/**
 * Experimental interactive v2 projection. It owns only the TUI/client side:
 * launch the explicit core process, open a session, replay its durable events,
 * project live session/event notifications as bounded text rows, and send
 * prompts / cancellations / approvals / questions / session actions through
 * the typed experimental client facade.
 *
 * The client notification listener is installed before `session/open` so any
 * event emitted by the core while the session is being opened is buffered and
 * replayed after the open response arrives.
 */
export async function runExperimentalProjection(options) {
    if (!process.stdout.isTTY || !process.stdin.isTTY) {
        throw new Error('experimental v2 projection requires an interactive terminal (stdout and stdin must be TTYs)');
    }
    const coreClient = new CoreClient(options.launch);
    const client = new ExperimentalCoreClient(coreClient, options.cwd ?? process.cwd());
    const buffer = createNotificationBuffer(coreClient);
    try {
        await client.start();
        const opened = await client.open({
            sessionId: options.sessionId,
            provider: options.provider,
            model: options.model,
        });
        const projector = new SessionEventProjector({ limit: options.limit });
        applySnapshot(projector, opened);
        // Replay anything the core emitted while session/open was in flight.
        processNotificationRecords(projector, buffer.drain(), initialSeqs(opened.events));
        const instance = await render(_jsx(ExperimentalApp, { client: client, projector: projector, buffer: buffer }), { exitOnCtrlC: false });
        await instance.waitUntilExit();
        buffer.close();
        await client.close();
    }
    catch (error) {
        buffer.close();
        await client.close();
        throw error;
    }
}
function ExperimentalApp({ client, projector, buffer, }) {
    const { exit } = useApp();
    const [lines, setLines] = useState(() => projector.snapshot());
    const [input, setInput] = useState('');
    const [cursor, setCursor] = useState(0);
    const [notice, setNotice] = useState();
    const [busy, setBusy] = useState(false);
    const [approval, setApproval] = useState(null);
    const [question, setQuestion] = useState(null);
    const [picker, setPicker] = useState(null);
    const approvalResolverRef = useRef(null);
    const questionResolverRef = useRef(null);
    const questionRejectRef = useRef(null);
    useEffect(() => {
        const unsubApproval = client.onApprovalRequest(params => {
            return new Promise(resolve => {
                approvalResolverRef.current = resolve;
                setApproval(params);
            });
        });
        const unsubQuestion = client.onUserQuestion(params => {
            return new Promise((resolve, reject) => {
                const items = parseQuestions(params.questions);
                if (items.length === 0) {
                    reject(new Error('user-question request contained no questions'));
                    return;
                }
                questionResolverRef.current = resolve;
                questionRejectRef.current = reject;
                setQuestion({
                    items,
                    index: 0,
                    answers: [],
                });
            });
        });
        return () => {
            unsubApproval();
            unsubQuestion();
        };
    }, [client]);
    useEffect(() => {
        const processPending = () => {
            const records = buffer.drain();
            if (records.length === 0)
                return;
            if (processNotificationRecords(projector, records)) {
                setLines(projector.snapshot());
            }
        };
        processPending();
        return buffer.subscribe(processPending);
    }, [buffer, projector]);
    const applySnapshot = (snapshot) => {
        projector.clear();
        for (const event of snapshot.events)
            projector.push(event);
        processNotificationRecords(projector, buffer.drain(), initialSeqs(snapshot.events));
        setLines(projector.snapshot());
        setNotice(`session ${snapshot.sessionId} (${snapshot.status})`);
    };
    const errorMessage = (error) => error instanceof Error ? error.message : String(error);
    const submitApproval = (outcome) => {
        approvalResolverRef.current?.(outcome);
        approvalResolverRef.current = null;
        setApproval(null);
    };
    const cancelQuestion = () => {
        questionRejectRef.current?.(new Error('ask_user_question was interrupted before the user answered'));
        questionRejectRef.current = null;
        questionResolverRef.current = null;
        setQuestion(null);
    };
    const answerQuestion = (selection) => {
        if (question === null)
            return;
        const current = question.items[question.index];
        if (current === undefined)
            return;
        const answers = [
            ...question.answers,
            {
                id: current.id,
                selected: [...selection.selected],
                ...(selection.custom !== undefined && selection.custom !== '' ? { custom: selection.custom } : {}),
            },
        ];
        if (question.index + 1 >= question.items.length) {
            questionResolverRef.current?.({ answers });
            questionResolverRef.current = null;
            questionRejectRef.current = null;
            setQuestion(null);
            return;
        }
        setQuestion({
            ...question,
            index: question.index + 1,
            answers,
        });
    };
    const runCommand = async (raw) => {
        const parts = raw.slice(1).trim().split(/\s+/).filter(Boolean);
        const name = parts[0]?.toLowerCase() ?? '';
        const args = parts.slice(1);
        setBusy(true);
        try {
            switch (name) {
                case 'help':
                    setNotice('Commands: /new /resume [id] /list /rewind <seq> /model /preset /permission /cancel /quit');
                    break;
                case 'new': {
                    const snapshot = await client.newSession();
                    applySnapshot(snapshot);
                    break;
                }
                case 'resume': {
                    if (args[0] !== undefined) {
                        const snapshot = await client.resume(args[0]);
                        applySnapshot(snapshot);
                    }
                    else {
                        const sessions = await client.listSessions();
                        setPicker({
                            title: 'Resume session',
                            items: sessions.map(session => ({
                                value: session.id,
                                label: session.id,
                                description: session.cwd ?? undefined,
                            })),
                            focus: 0,
                            onSelect: async (sessionId) => {
                                const snapshot = await client.resume(sessionId);
                                applySnapshot(snapshot);
                            },
                        });
                    }
                    break;
                }
                case 'list': {
                    const sessions = await client.listSessions();
                    setNotice(sessions.length === 0 ? 'No sessions found' : sessions.map(session => session.id).join('\n'));
                    break;
                }
                case 'rewind': {
                    const seq = Number(args[0]);
                    if (!Number.isFinite(seq)) {
                        setNotice('Usage: /rewind <seq>');
                        break;
                    }
                    const snapshot = await client.rewind(seq);
                    if (snapshot === null)
                        setNotice('Cannot rewind to that point');
                    else
                        applySnapshot(snapshot);
                    break;
                }
                case 'model': {
                    const models = await client.listModels();
                    setPicker({
                        title: 'Switch model',
                        items: models.map(model => ({
                            value: `${model.provider}/${model.model}`,
                            label: `${model.provider}/${model.model}`,
                        })),
                        focus: 0,
                        onSelect: async (value) => {
                            const [provider, model] = splitModel(value);
                            const snapshot = await client.switchModel(provider, model);
                            if (snapshot !== null)
                                applySnapshot(snapshot);
                        },
                    });
                    break;
                }
                case 'preset': {
                    const presets = await client.listPresets();
                    setPicker({
                        title: 'Switch agent preset',
                        items: presets.map(preset => ({
                            value: preset.id,
                            label: preset.name ?? preset.id,
                            description: preset.description ?? preset.broken,
                        })),
                        focus: 0,
                        onSelect: async (presetId) => {
                            const ok = await client.switchPreset(presetId);
                            setNotice(ok ? 'Agent preset switched' : 'Agent preset switch failed');
                        },
                    });
                    break;
                }
                case 'permission': {
                    const permissions = await client.listPermissions();
                    setPicker({
                        title: 'Switch permission preset',
                        items: permissions.map(permission => ({
                            value: permission.id,
                            label: permission.name,
                            description: permission.description,
                        })),
                        focus: 0,
                        onSelect: async (permissionId) => {
                            const ok = await client.switchPermission(permissionId);
                            setNotice(ok ? 'Permission preset switched' : 'Permission preset switch failed');
                        },
                    });
                    break;
                }
                case 'cancel':
                    await client.cancel();
                    setNotice('Cancellation sent');
                    break;
                case 'quit':
                case 'exit':
                    exit();
                    break;
                default:
                    setNotice(`Unknown command: /${name}`);
            }
        }
        catch (error) {
            setNotice(errorMessage(error));
        }
        finally {
            setBusy(false);
        }
    };
    const submitInput = async () => {
        const text = input.trim();
        if (text === '' || busy)
            return;
        setInput('');
        setCursor(0);
        if (text.startsWith('/')) {
            await runCommand(text);
            return;
        }
        setBusy(true);
        try {
            await client.prompt(text);
            setNotice('Prompt sent');
        }
        catch (error) {
            setNotice(errorMessage(error));
        }
        finally {
            setBusy(false);
        }
    };
    const runPickerSelect = () => {
        if (picker === null)
            return;
        const item = picker.items[picker.focus];
        if (item === undefined)
            return;
        let action;
        try {
            action = picker.onSelect(item.value);
        }
        catch (error) {
            setNotice(errorMessage(error));
            return;
        }
        setPicker(null);
        setBusy(true);
        Promise.resolve(action)
            .catch(error => setNotice(errorMessage(error)))
            .finally(() => setBusy(false));
    };
    const insertText = (text) => {
        setInput(value => value.slice(0, cursor) + text + value.slice(cursor));
        setCursor(position => position + text.length);
    };
    useInput((inputText, key) => {
        if (key.ctrl && (inputText === 'c' || inputText === 'q')) {
            if (approval !== null) {
                submitApproval('cancelled');
            }
            else if (question !== null) {
                cancelQuestion();
            }
            else if (picker !== null) {
                setPicker(null);
            }
            else if (input !== '') {
                setInput('');
                setCursor(0);
            }
            else {
                exit();
            }
            return;
        }
        if (approval !== null) {
            if (key.return || inputText === 'a' || inputText === 'y' || inputText === 'Y') {
                submitApproval('allowed-once');
            }
            else if (inputText === 'd' || inputText === 'D' || inputText === 'n' || inputText === 'N') {
                submitApproval('rejected');
            }
            else if (key.escape) {
                submitApproval('cancelled');
            }
            return;
        }
        if (question !== null) {
            // AskUserQuestionPanel owns keyboard input while a question is open.
            return;
        }
        if (picker !== null) {
            if (key.upArrow) {
                setPicker(state => state === null ? state : { ...state, focus: Math.max(0, state.focus - 1) });
            }
            else if (key.downArrow) {
                setPicker(state => state === null ? state : { ...state, focus: Math.min(state.items.length - 1, state.focus + 1) });
            }
            else if (key.return) {
                runPickerSelect();
            }
            else if (key.escape) {
                setPicker(null);
            }
            return;
        }
        if (key.return) {
            void submitInput();
            return;
        }
        if (key.backspace) {
            if (cursor > 0) {
                setInput(value => value.slice(0, cursor - 1) + value.slice(cursor));
                setCursor(position => position - 1);
            }
            return;
        }
        if (key.delete) {
            if (cursor < input.length) {
                setInput(value => value.slice(0, cursor) + value.slice(cursor + 1));
            }
            return;
        }
        if (key.leftArrow) {
            setCursor(position => Math.max(0, position - 1));
            return;
        }
        if (key.rightArrow) {
            setCursor(position => Math.min(input.length, position + 1));
            return;
        }
        if (key.home) {
            setCursor(0);
            return;
        }
        if (key.end) {
            setCursor(input.length);
            return;
        }
        if (key.escape) {
            if (input !== '') {
                setInput('');
                setCursor(0);
            }
            return;
        }
        if (!key.ctrl && !key.meta && inputText) {
            insertText(inputText);
        }
    });
    const currentQuestion = question?.items[question.index];
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { bold: true, children: "experimental v2 interactive session projection" }), _jsx(Box, { flexDirection: "column", marginTop: 1, children: lines.map(line => (_jsx(Text, { wrap: "wrap", children: line.text }, line.key))) }), approval !== null && (_jsx(Box, { marginTop: 1, children: _jsx(ApprovalPanel, { approval: {
                        key: approval.callId ?? approval.toolName,
                        toolName: approval.toolName,
                        reason: approval.reason,
                        callId: approval.callId,
                        queued: 0,
                    } }) })), question !== null && currentQuestion !== undefined && (_jsx(Box, { marginTop: 1, children: _jsx(AskUserQuestionPanel, { question: {
                        question: currentQuestion.question,
                        header: currentQuestion.header,
                        detail: currentQuestion.detail,
                        options: currentQuestion.options,
                        multiSelect: currentQuestion.multiSelect,
                    }, position: question.index + 1, total: question.items.length, answered: question.answers.length, onAnswer: answerQuestion, onCancel: cancelQuestion }) }, `${question.index}-${currentQuestion.id}`)), picker !== null && (_jsx(Box, { marginTop: 1, children: _jsx(Pane, { color: "permission", children: _jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: "remember", bold: true, children: picker.title }) }), _jsx(Select, { options: picker.items.map(item => ({
                                    value: item.value,
                                    label: item.label,
                                    description: item.description,
                                })), focusIndex: picker.focus, selectedValue: undefined }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "Enter to select \u00B7 Esc to cancel" }) })] }) }) })), notice !== undefined && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, wrap: "wrap", children: notice }) })), _jsxs(Box, { marginTop: 1, flexDirection: "row", children: [_jsx(Text, { bold: true, children: busy ? '… ' : '> ' }), _jsx(Text, { children: input.slice(0, cursor) }), _jsx(Text, { inverse: true, children: input[cursor] ?? ' ' }), _jsx(Text, { children: input.slice(cursor + 1) })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "Enter send \u00B7 /help for commands \u00B7 Ctrl+C quit" }) })] }));
}
function applySnapshot(projector, snapshot) {
    projector.clear();
    for (const event of snapshot.events)
        projector.push(event);
}
function initialSeqs(events) {
    const seqs = new Set();
    for (const event of events) {
        if (isObject(event) && typeof event.seq === 'number')
            seqs.add(event.seq);
    }
    return seqs;
}
function parseQuestions(value) {
    if (!Array.isArray(value))
        return [];
    const items = [];
    for (const raw of value) {
        const item = isObject(raw) ? raw : undefined;
        if (item === undefined)
            continue;
        const id = typeof item.id === 'string' ? item.id : '';
        const question = typeof item.question === 'string' ? item.question : '';
        if (id === '' || question === '')
            continue;
        const options = Array.isArray(item.options)
            ? item.options
                .map(option => {
                if (!isObject(option))
                    return undefined;
                const label = typeof option.label === 'string' ? option.label : '';
                if (label === '')
                    return undefined;
                return {
                    label,
                    ...(typeof option.description === 'string' ? { description: option.description } : {}),
                };
            })
                .filter((option) => option !== undefined)
            : undefined;
        items.push({
            id,
            question,
            ...(typeof item.header === 'string' ? { header: item.header } : {}),
            ...(typeof item.detail === 'string' ? { detail: item.detail } : {}),
            ...(options !== undefined && options.length > 0 ? { options } : {}),
            ...(item.multiSelect === true ? { multiSelect: true } : {}),
        });
    }
    return items;
}
function splitModel(value) {
    const index = value.indexOf('/');
    if (index === -1)
        return [value, value];
    return [value.slice(0, index), value.slice(index + 1)];
}
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
