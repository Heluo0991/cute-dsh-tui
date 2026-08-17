const DEFAULT_LIMIT = 500;
/**
 * Bounded client-side projection of raw DSH session-event envelopes. This
 * module is intentionally free of DSH and React imports: the TUI side of the
 * v2 split can consume JSON-RPC frames and replay/append events without
 * depending on core packages.
 */
export class SessionEventProjector {
    lines = [];
    limit;
    statusSeq = 0;
    constructor(options = {}) {
        this.limit = options.limit ?? DEFAULT_LIMIT;
    }
    push(event) {
        const record = asObject(event);
        if (record === undefined)
            return;
        const type = asString(record.type);
        if (type === undefined)
            return;
        const seq = asNumber(record.seq) ?? 0;
        const time = asNumber(record.time) ?? Date.now();
        const data = asObject(record.data) ?? {};
        switch (type) {
            case 'user/message': {
                const text = textOfContent(data.content, ['text']);
                this.addLine({
                    key: `user:${seq}`,
                    kind: 'user',
                    text: text === '' ? 'You: (empty user message)' : `You: ${text}`,
                    seq,
                    time,
                });
                break;
            }
            case 'assistant/message': {
                const message = asObject(data.message);
                const text = textOfContent(message?.content, ['text']);
                const reasoning = textOfContent(message?.content, ['reasoning']);
                const turn = asNumber(data.turn) ?? 0;
                const step = asNumber(data.step) ?? 0;
                this.upsert({
                    key: `assistant:${turn}:${step}`,
                    kind: 'assistant',
                    text: text === '' ? 'Assistant: (empty assistant message)' : `Assistant: ${text}`,
                    seq,
                    time,
                });
                if (reasoning !== '') {
                    this.upsert({
                        key: `reasoning:${turn}:${step}`,
                        kind: 'reasoning',
                        text: `Reasoning: ${reasoning}`,
                        seq,
                        time,
                    });
                }
                break;
            }
            case 'assistant/chunk': {
                const chunk = asObject(data.chunk);
                const chunkType = asString(chunk?.type);
                const text = asString(chunk?.text) ?? '';
                const turn = asNumber(data.turn) ?? 0;
                const step = asNumber(data.step) ?? 0;
                if (chunkType === 'text-delta' && text !== '') {
                    this.append({
                        key: `assistant:${turn}:${step}`,
                        kind: 'assistant',
                        text,
                        seq,
                        time,
                    });
                }
                else if (chunkType === 'reasoning-delta' && text !== '') {
                    this.append({
                        key: `reasoning:${turn}:${step}`,
                        kind: 'reasoning',
                        text,
                        seq,
                        time,
                    });
                }
                break;
            }
            case 'tool/call': {
                const callId = asString(data.callId) ?? `call:${seq}`;
                const name = asString(data.name) ?? 'tool';
                const args = asString(data.arguments) ?? '';
                this.upsert({
                    key: `tool:${callId}`,
                    kind: 'tool',
                    text: `▶ ${name}${args === '' ? '' : ` ${compact(args)}`}`,
                    seq,
                    time,
                });
                break;
            }
            case 'tool/result': {
                const result = toolResultText(data);
                const callId = toolResultCallId(data);
                if (callId !== undefined) {
                    const text = result === '' ? '(empty tool result)' : result;
                    this.update(`tool:${callId}`, line => ({
                        ...line,
                        text: `${line.text}\n${text}`,
                        seq,
                        time,
                    }));
                }
                else {
                    this.addLine({
                        key: `tool-result:${seq}`,
                        kind: 'tool',
                        text: result === '' ? '(empty tool result)' : result,
                        seq,
                        time,
                    });
                }
                break;
            }
            default: {
                this.addLine({
                    key: `${type}:${seq}`,
                    kind: 'system',
                    text: `[${type}]`,
                    seq,
                    time,
                });
                break;
            }
        }
    }
    pushStatus(sessionId, status) {
        this.statusSeq += 1;
        const session = typeof sessionId === 'string' ? sessionId : '?';
        const text = typeof status === 'string' ? status : status === undefined ? 'unknown' : JSON.stringify(status);
        this.addLine({
            key: `status:${session}:${this.statusSeq}`,
            kind: 'status',
            text: `status: ${text}`,
            seq: this.statusSeq,
            time: Date.now(),
        });
    }
    snapshot() {
        return this.lines.map(line => ({ ...line }));
    }
    clear() {
        this.lines = [];
        this.statusSeq = 0;
    }
    addLine(line) {
        this.lines = [...this.lines, line].slice(-this.limit);
    }
    upsert(line) {
        const index = this.lines.findIndex(candidate => candidate.key === line.key);
        if (index === -1) {
            this.addLine(line);
            return;
        }
        this.lines = this.lines.map((candidate, candidateIndex) => candidateIndex === index ? line : candidate);
    }
    append(line) {
        const index = this.lines.findIndex(candidate => candidate.key === line.key);
        if (index === -1) {
            this.addLine(line);
            return;
        }
        const existing = this.lines[index];
        if (existing === undefined)
            return;
        this.lines = this.lines.map((candidate, candidateIndex) => candidateIndex === index
            ? { ...existing, text: existing.text + line.text, seq: line.seq, time: line.time }
            : candidate);
    }
    update(key, update) {
        const index = this.lines.findIndex(candidate => candidate.key === key);
        if (index === -1)
            return;
        const existing = this.lines[index];
        if (existing === undefined)
            return;
        this.lines = this.lines.map((candidate, candidateIndex) => candidateIndex === index ? update(existing) : candidate);
    }
}
function asObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : undefined;
}
function asArray(value) {
    return Array.isArray(value) ? value : undefined;
}
function asString(value) {
    return typeof value === 'string' ? value : undefined;
}
function asNumber(value) {
    return typeof value === 'number' ? value : undefined;
}
function textOfContent(content, blockTypes) {
    const blocks = asArray(content);
    if (blocks === undefined)
        return '';
    const parts = [];
    for (const block of blocks) {
        const record = asObject(block);
        if (record === undefined)
            continue;
        const type = asString(record.type);
        if (type !== undefined && blockTypes.length > 0 && !blockTypes.includes(type))
            continue;
        const text = asString(record.text);
        if (text !== undefined && text !== '')
            parts.push(text);
    }
    return parts.join('\n').trim();
}
function toolResultText(data) {
    const message = asObject(data.message);
    const content = asArray(message?.content);
    if (content === undefined)
        return '';
    const parts = [];
    for (const block of content) {
        const record = asObject(block);
        if (record === undefined)
            continue;
        if (record.type === 'tool-result') {
            const nested = textOfContent(record.content, ['text']);
            if (nested !== '')
                parts.push(nested);
        }
        else {
            const nested = textOfContent(record, ['text']);
            if (nested !== '')
                parts.push(nested);
        }
    }
    return parts.join('\n').trim();
}
function toolResultCallId(data) {
    const message = asObject(data.message);
    const content = asArray(message?.content);
    if (content === undefined)
        return undefined;
    for (const block of content) {
        const record = asObject(block);
        if (record === undefined)
            continue;
        if (record.type === 'tool-result') {
            const callId = asString(record.toolCallId);
            if (callId !== undefined)
                return callId;
        }
    }
    return undefined;
}
function compact(value) {
    const flat = value.replace(/\s+/g, ' ').trim();
    return flat.length <= 200 ? flat : `${flat.slice(0, 199)}…`;
}
