import { initialData, emptyEvaluations } from './data';
import type { AppData, BusinessIdea } from './types';
import { IDEA_STATUSES } from './types';

export const STORAGE_KEY = 'businessIdeaManager.v1';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const normalizeIdea = (raw: Partial<BusinessIdea>): BusinessIdea => {
  const evaluations = emptyEvaluations();
  for (const key of Object.keys(evaluations) as Array<keyof typeof evaluations>) {
    const item = raw.evaluations?.[key];
    if (item) {
      evaluations[key] = {
        score: Math.min(5, Math.max(1, Number(item.score) || 3)),
        reason: String(item.reason ?? ''),
      };
    }
  }

  return {
    id: String(raw.id ?? crypto.randomUUID()),
    name: String(raw.name ?? ''),
    summary: String(raw.summary ?? ''),
    industry: String(raw.industry ?? ''),
    targetCustomer: String(raw.targetCustomer ?? ''),
    problem: String(raw.problem ?? ''),
    solution: String(raw.solution ?? ''),
    revenueModel: String(raw.revenueModel ?? ''),
    reason: String(raw.reason ?? ''),
    status: IDEA_STATUSES.includes(raw.status as (typeof IDEA_STATUSES)[number])
      ? (raw.status as BusinessIdea['status'])
      : '思いつき',
    priority: Math.min(5, Math.max(1, Number(raw.priority) || 3)),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
    evaluations,
    hypotheses: Array.isArray(raw.hypotheses) ? raw.hypotheses : [],
    researchLogs: Array.isArray(raw.researchLogs) ? raw.researchLogs : [],
    nextActions: Array.isArray(raw.nextActions) ? raw.nextActions : [],
  };
};

export const parseData = (value: unknown): AppData => {
  if (!value || typeof value !== 'object') throw new Error('バックアップ形式が正しくありません。');
  const candidate = value as Partial<AppData>;
  if (!Array.isArray(candidate.ideas)) throw new Error('アイデア一覧が含まれていません。');
  return {
    schemaVersion: 1,
    ideas: candidate.ideas.map((idea) => normalizeIdea(idea)),
  };
};

export const loadData = (): AppData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return clone(initialData);
    return parseData(JSON.parse(saved));
  } catch (error) {
    console.error('保存データの読み込みに失敗しました。', error);
    return clone(initialData);
  }
};

export const saveData = (data: AppData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const exportData = (data: AppData): string =>
  JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2);

export const importData = (json: string): AppData => parseData(JSON.parse(json));
