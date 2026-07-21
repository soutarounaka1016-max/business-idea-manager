import { createEmptyIdea, createId } from './data';
import type { AppData, BusinessIdea, ConversationCandidate, ConversationDraft, ConversationRecord, ConversationSource, ExtractedItem, ExtractedItemKind, SyncPayload, SyncPayloadItem } from './types';

const KIND_LABELS: Record<ExtractedItemKind, string> = { idea: 'アイデア', hypothesis: '仮説', problem: '課題', task: '次にやること', note: 'メモ' };
const TAG_RULES: Array<[string, RegExp]> = [
  ['顧客', /顧客|利用者|ユーザー|対象|保護者|生徒|店舗|企業/],
  ['市場', /市場|需要|競合|業界|知名度|参入/],
  ['営業', /営業|ヒアリング|聞き取り|契約|提案|訪問/],
  ['収益', /収益|料金|価格|月額|課金|売上|稼/],
  ['機能', /機能|画面|連携|API|自動化|実装|アプリ/],
  ['リスク', /リスク|課題|問題|難しい|できない|制限|安全/],
  ['検証', /検証|調査|確認|試す|テスト|比較/],
];
const speakerPrefix = /^(?:user|assistant|chatgpt|あなた|ユーザー|私|ai)\s*[:：]\s*/i;
const compact = (value: string): string => value.replace(/\s+/g, ' ').trim();
const normalizeName = (value: string): string => value.toLowerCase().replace(/[\s　・、。,.!！?？「」『』()（）\-_]/g, '');
const appendUnique = (base: string, addition: string): string => {
  const clean = compact(addition);
  if (!clean || base.includes(clean)) return base;
  return base.trim() ? `${base.trim()}\n${clean}` : clean;
};
const findIdeaByName = (ideas: BusinessIdea[], name: string): BusinessIdea | undefined => {
  const normalized = normalizeName(name);
  if (!normalized) return undefined;
  return ideas.find((idea) => {
    const current = normalizeName(idea.name);
    return current === normalized || current.includes(normalized) || normalized.includes(current);
  });
};

const extractMessageText = (content: unknown): string => {
  if (typeof content === 'string') return content;
  if (!content || typeof content !== 'object') return '';
  const candidate = content as { parts?: unknown[]; text?: unknown };
  if (typeof candidate.text === 'string') return candidate.text;
  if (!Array.isArray(candidate.parts)) return '';
  return candidate.parts.map((part) => {
    if (typeof part === 'string') return part;
    if (part && typeof part === 'object' && 'text' in part) return String((part as { text?: unknown }).text ?? '');
    return '';
  }).filter(Boolean).join('\n');
};

const parseExportConversation = (raw: unknown, index: number): ConversationCandidate | null => {
  if (!raw || typeof raw !== 'object') return null;
  const conversation = raw as { id?: unknown; title?: unknown; mapping?: Record<string, unknown> };
  if (!conversation.mapping || typeof conversation.mapping !== 'object') return null;
  const messages = Object.values(conversation.mapping).map((node) => {
    if (!node || typeof node !== 'object') return null;
    const message = (node as { message?: unknown }).message;
    if (!message || typeof message !== 'object') return null;
    const typed = message as { author?: { role?: unknown }; content?: unknown; create_time?: unknown };
    const role = String(typed.author?.role ?? '');
    if (!['user', 'assistant'].includes(role)) return null;
    const text = compact(extractMessageText(typed.content));
    if (!text) return null;
    return { role, text, createdAt: Number(typed.create_time ?? 0) };
  }).filter((item): item is { role: string; text: string; createdAt: number } => Boolean(item)).sort((a, b) => a.createdAt - b.createdAt);
  if (!messages.length) return null;
  return {
    id: String(conversation.id ?? `export-${index}`),
    title: compact(String(conversation.title ?? 'ChatGPT会話')) || 'ChatGPT会話',
    rawText: messages.map((message) => `${message.role === 'user' ? 'あなた' : 'ChatGPT'}: ${message.text}`).join('\n\n'),
  };
};

export const parseChatGptExport = (json: string): ConversationCandidate[] => {
  const parsed = JSON.parse(json) as unknown;
  const list = Array.isArray(parsed) ? parsed : [parsed];
  const candidates = list.map((item, index) => parseExportConversation(item, index)).filter((item): item is ConversationCandidate => Boolean(item));
  if (!candidates.length) throw new Error('ChatGPTの会話データを読み取れませんでした。');
  return candidates;
};

export const isSyncPayload = (value: unknown): value is SyncPayload => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SyncPayload>;
  return candidate.version === 'chat-sync/v1' && typeof candidate.syncId === 'string' && Boolean(candidate.syncId.trim()) && Boolean(candidate.conversation && typeof candidate.conversation.title === 'string') && Array.isArray(candidate.items) && candidate.items.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const kind = (item as Partial<SyncPayloadItem>).kind;
    const text = (item as Partial<SyncPayloadItem>).text;
    return ['idea', 'hypothesis', 'problem', 'task', 'note'].includes(String(kind)) && typeof text === 'string';
  });
};

export const parseSyncPayload = (text: string): SyncPayload => {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(cleaned) as unknown;
  if (!isSyncPayload(parsed)) throw new Error('同期JSONの形式が正しくありません。');
  return parsed;
};

const splitStatements = (text: string): string[] => Array.from(new Set(text.replace(/([。！？!?])\s*/g, '$1\n').split(/\n+/).map((line) => compact(line.replace(speakerPrefix, ''))).filter((line) => line.length >= 4 && line.length <= 280))).slice(0, 120);
const classifyLine = (line: string): ExtractedItemKind | null => {
  if (/次に.{0,16}(?:する|やる)|(?:調査|確認|比較|ヒアリング|実装|作成|テスト|連絡|訪問)(?:する|したい|してみる)/.test(line)) return 'task';
  if (/仮説|可能性がある|かもしれない|だと思う|と考えられる|なら売れそう|需要がありそう/.test(line)) return 'hypothesis';
  if (/課題|問題|困る|困って|できない|難しい|不足|手間|時間がかかる|見落と/.test(line)) return 'problem';
  if (/アイデア|構想|(?:AI|アプリ|サービス|システム|ダッシュボード|エージェント).*(?:作りたい|開発したい|考えている)|(?:向け|用).*(?:AI|アプリ|サービス|システム)/.test(line)) return 'idea';
  return null;
};
const ideaNameFromLine = (line: string): string => {
  const quoted = line.match(/[「『](.{2,50}?)[」』]/)?.[1];
  if (quoted) return compact(quoted);
  return compact(line.replace(/^(?:新しい)?(?:事業)?アイデア(?:は|として|：|:)?\s*/, '').replace(/(?:を)?(?:作りたい|開発したい|考えている|提案する).*$/, '').replace(/[。！？!?]+$/, '')).slice(0, 50);
};
const inferTags = (text: string): string[] => TAG_RULES.filter(([, rule]) => rule.test(text)).map(([tag]) => tag);
const inferSummary = (text: string): string => splitStatements(text).slice(0, 3).join(' ').slice(0, 240);
const guessTargetIdea = (ideas: BusinessIdea[], text: string): string => {
  const direct = ideas.find((idea) => text.includes(idea.name));
  if (direct) return direct.id;
  const tokens = text.split(/[\s、。・/／]+/).filter((token) => token.length >= 2);
  let best: { id: string; score: number } | null = null;
  for (const idea of ideas) {
    const haystack = `${idea.name} ${idea.summary} ${idea.industry} ${idea.targetCustomer}`;
    const score = tokens.filter((token) => haystack.includes(token)).length;
    if (score > (best?.score ?? 0)) best = { id: idea.id, score };
  }
  return best?.score ? best.id : ideas[0]?.id ?? '';
};

export const buildDraftFromText = (title: string, rawText: string, source: ConversationSource, ideas: BusinessIdea[]): ConversationDraft => {
  const statements = splitStatements(rawText);
  const extracted: ExtractedItem[] = [];
  for (const line of statements) {
    const kind = classifyLine(line);
    if (!kind) continue;
    const text = kind === 'idea' ? ideaNameFromLine(line) : line;
    if (!text || extracted.some((item) => item.kind === kind && normalizeName(item.text) === normalizeName(text))) continue;
    extracted.push({ id: createId(), kind, text, selected: true, targetIdeaId: kind === 'idea' ? '' : guessTargetIdea(ideas, line), suggestedIdeaName: kind === 'idea' ? text : undefined });
    if (extracted.length >= 18) break;
  }
  if (!extracted.some((item) => item.kind === 'idea') && /AI|アプリ|サービス|システム|ダッシュボード|エージェント|向け/.test(title)) extracted.unshift({ id: createId(), kind: 'idea', text: title.slice(0, 50), selected: true, targetIdeaId: '', suggestedIdeaName: title.slice(0, 50) });
  splitStatements(rawText).filter((line) => !classifyLine(line)).slice(0, 3).forEach((note) => extracted.push({ id: createId(), kind: 'note', text: note, selected: false, targetIdeaId: guessTargetIdea(ideas, note) }));
  return { record: { id: createId(), title: compact(title) || 'ChatGPT会話', source, importedAt: new Date().toISOString(), rawText, summary: inferSummary(rawText), tags: inferTags(rawText), linkedIdeaIds: [] }, items: extracted };
};

export const buildDraftFromSyncPayload = (payload: SyncPayload, ideas: BusinessIdea[], source: ConversationSource = 'sync-json'): ConversationDraft => ({
  record: { id: createId(), title: compact(payload.conversation.title) || 'ChatGPT同期', source, importedAt: new Date().toISOString(), rawText: payload.items.map((item) => `${KIND_LABELS[item.kind]}: ${item.text}`).join('\n'), summary: compact(payload.conversation.summary ?? ''), tags: inferTags(`${payload.conversation.summary ?? ''} ${payload.items.map((item) => item.text).join(' ')}`), linkedIdeaIds: [], syncId: payload.syncId },
  items: payload.items.map((item) => ({ id: createId(), kind: item.kind, text: compact(item.text), selected: true, targetIdeaId: item.targetIdeaName ? findIdeaByName(ideas, item.targetIdeaName)?.id ?? '' : guessTargetIdea(ideas, item.text), suggestedIdeaName: item.targetIdeaName, industry: item.industry, targetCustomer: item.targetCustomer, dueDate: item.dueDate })),
});

const toPayloadFromSearchParams = (params: URLSearchParams): SyncPayload | null => {
  if (params.get('sync') !== '1') return null;
  const kinds: ExtractedItemKind[] = ['idea', 'hypothesis', 'problem', 'task', 'note'];
  const items = kinds.flatMap((kind) => params.getAll(kind).map((text) => ({ kind, text })));
  if (!items.length) return null;
  return { version: 'chat-sync/v1', syncId: params.get('syncId') || `url-${Date.now()}`, conversation: { title: params.get('title') || 'ChatGPT同期', summary: params.get('summary') || '', sourceUrl: params.get('sourceUrl') || undefined }, items };
};
const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return decodeURIComponent(Array.from(atob(padded)).map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''));
};
export const readSyncPayloadFromLocation = (locationLike: Pick<Location, 'search' | 'hash'>): SyncPayload | null => {
  const searchPayload = toPayloadFromSearchParams(new URLSearchParams(locationLike.search));
  if (searchPayload) return searchPayload;
  const hash = locationLike.hash.replace(/^#/, '');
  if (!hash) return null;
  const hashParams = new URLSearchParams(hash);
  const parameterPayload = toPayloadFromSearchParams(hashParams);
  if (parameterPayload) return parameterPayload;
  const encoded = hash.startsWith('sync=') ? hash.slice(5) : hashParams.get('payload');
  if (!encoded) return null;
  try { return parseSyncPayload(decodeBase64Url(encoded)); } catch { return null; }
};

export const buildIntegrationPrompt = (appUrl: string): string => `この会話から事業管理に必要な情報だけを抽出してください。最後に説明文ではなく、versionをchat-sync/v1、syncIdを一意のID、conversationにtitleとsummary、itemsにkind（idea/problem/hypothesis/task/note）・text・targetIdeaName・industry・targetCustomer・dueDateを含むJSONだけをコードブロックで出力してください。同じ内容は重複させず、会話にない事実を追加しないでください。出力したJSONは ${appUrl} の「ChatGPT同期」へ貼り付けます。`;

export interface ApplyDraftResult { data: AppData; createdIdeaIds: string[]; updatedIdeaIds: string[]; duplicateSync: boolean }
export const applyConversationDraft = (current: AppData, draft: ConversationDraft): ApplyDraftResult => {
  if (draft.record.syncId && current.processedSyncIds.includes(draft.record.syncId)) return { data: current, createdIdeaIds: [], updatedIdeaIds: [], duplicateSync: true };
  const next: AppData = JSON.parse(JSON.stringify(current)) as AppData;
  const createdIdeaIds: string[] = [];
  const updatedIdeaIds = new Set<string>();
  const linkedIdeaIds = new Set<string>();
  let fallbackIdeaId = draft.items.find((item) => item.selected && item.targetIdeaId)?.targetIdeaId ?? next.ideas[0]?.id ?? '';
  for (const item of draft.items.filter((candidate) => candidate.selected && compact(candidate.text))) {
    if (item.kind === 'idea') {
      const existing = findIdeaByName(next.ideas, item.text);
      if (existing) { fallbackIdeaId = existing.id; linkedIdeaIds.add(existing.id); continue; }
      const idea = createEmptyIdea();
      idea.name = compact(item.text).slice(0, 80); idea.summary = draft.record.summary; idea.industry = compact(item.industry ?? ''); idea.targetCustomer = compact(item.targetCustomer ?? ''); idea.reason = appendUnique(idea.reason, `ChatGPT会話「${draft.record.title}」から登録`);
      next.ideas.unshift(idea); fallbackIdeaId = idea.id; createdIdeaIds.push(idea.id); linkedIdeaIds.add(idea.id); continue;
    }
    const target = next.ideas.find((idea) => idea.id === item.targetIdeaId) ?? (item.suggestedIdeaName ? findIdeaByName(next.ideas, item.suggestedIdeaName) : undefined) ?? next.ideas.find((idea) => idea.id === fallbackIdeaId);
    if (!target) continue;
    linkedIdeaIds.add(target.id); updatedIdeaIds.add(target.id); target.updatedAt = new Date().toISOString();
    if (item.kind === 'problem') target.problem = appendUnique(target.problem, item.text);
    if (item.kind === 'note') target.reason = appendUnique(target.reason, item.text);
    if (item.kind === 'hypothesis' && !target.hypotheses.some((entry) => normalizeName(entry.hypothesis) === normalizeName(item.text))) target.hypotheses.unshift({ id: createId(), hypothesis: compact(item.text), verificationMethod: '', successCriteria: '', result: '', createdAt: new Date().toISOString() });
    if (item.kind === 'task' && !target.nextActions.some((entry) => normalizeName(entry.title) === normalizeName(item.text))) target.nextActions.push({ id: createId(), title: compact(item.text), dueDate: item.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate) ? item.dueDate : new Date().toISOString().slice(0, 10), completed: false });
  }
  const record: ConversationRecord = { ...draft.record, linkedIdeaIds: Array.from(linkedIdeaIds) };
  next.conversations.unshift(record); next.conversations = next.conversations.slice(0, 100);
  if (record.syncId) next.processedSyncIds = [...next.processedSyncIds, record.syncId].slice(-500);
  return { data: next, createdIdeaIds, updatedIdeaIds: Array.from(updatedIdeaIds), duplicateSync: false };
};
export const extractedKindLabel = (kind: ExtractedItemKind): string => KIND_LABELS[kind];
