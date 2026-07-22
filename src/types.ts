export const IDEA_STATUSES = ['思いつき', '調査中', '仮説作成', '検証予定', '検証中', '有望', '保留', '不採用'] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export const EVALUATION_KEYS = [
  'problemSize',
  'willingnessToPay',
  'customerAccess',
  'developmentEase',
  'aiDifferentiation',
  'recurringRevenue',
  'personalFit',
] as const;

export type EvaluationKey = (typeof EVALUATION_KEYS)[number];

export const EVALUATION_LABELS: Record<EvaluationKey, string> = {
  problemSize: '課題の大きさ',
  willingnessToPay: 'お金を払う可能性',
  customerAccess: '顧客へ会いやすさ',
  developmentEase: '開発しやすさ',
  aiDifferentiation: 'AIで差別化できるか',
  recurringRevenue: '継続収益性',
  personalFit: '自分との相性',
};

export interface EvaluationItem {
  score: number;
  reason: string;
}

export interface Hypothesis {
  id: string;
  hypothesis: string;
  verificationMethod: string;
  successCriteria: string;
  result: string;
  createdAt: string;
}

export interface ResearchLog {
  id: string;
  date: string;
  partner: string;
  topic: string;
  findings: string;
  memorableQuote: string;
  nextResearch: string;
}

export interface NextAction {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface BusinessIdea {
  id: string;
  name: string;
  summary: string;
  industry: string;
  targetCustomer: string;
  problem: string;
  solution: string;
  revenueModel: string;
  reason: string;
  status: IdeaStatus;
  priority: number;
  updatedAt: string;
  evaluations: Record<EvaluationKey, EvaluationItem>;
  hypotheses: Hypothesis[];
  researchLogs: ResearchLog[];
  nextActions: NextAction[];
}

export type ConversationSource = 'paste' | 'chatgpt-export' | 'sync-json' | 'sync-url';

export interface ConversationRecord {
  id: string;
  title: string;
  source: ConversationSource;
  importedAt: string;
  rawText: string;
  summary: string;
  tags: string[];
  linkedIdeaIds: string[];
  syncId?: string;
}

export interface AppData {
  schemaVersion: 2;
  ideas: BusinessIdea[];
  conversations: ConversationRecord[];
  processedSyncIds: string[];
}

export type ExtractedItemKind = 'idea' | 'hypothesis' | 'problem' | 'task' | 'note';

export interface ExtractedItem {
  id: string;
  kind: ExtractedItemKind;
  text: string;
  selected: boolean;
  targetIdeaId: string;
  suggestedIdeaName?: string;
  industry?: string;
  targetCustomer?: string;
  dueDate?: string;
}

export interface ConversationDraft {
  record: ConversationRecord;
  items: ExtractedItem[];
}

export interface SyncPayloadItem {
  kind: ExtractedItemKind;
  text: string;
  targetIdeaName?: string;
  industry?: string;
  targetCustomer?: string;
  dueDate?: string;
}

export interface SyncPayload {
  version: 'chat-sync/v1';
  syncId: string;
  conversation: {
    title: string;
    summary?: string;
    sourceUrl?: string;
  };
  items: SyncPayloadItem[];
}

export interface ConversationCandidate {
  id: string;
  title: string;
  rawText: string;
}
