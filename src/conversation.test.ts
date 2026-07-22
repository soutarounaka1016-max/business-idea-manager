import { describe, expect, it } from 'vitest';
import {
  applyConversationDraft,
  buildDraftFromSyncPayload,
  buildDraftFromText,
  parseChatGptExport,
  parseSyncPayload,
  readSyncPayloadFromLocation,
} from './conversation';
import { initialData } from './data';

const cloneData = () => JSON.parse(JSON.stringify(initialData)) as typeof initialData;

describe('conversation sync', () => {
  it('会話をアイデア・課題・行動へ分類する', () => {
    const draft = buildDraftFromText(
      '塾向け予約AI',
      'あなた: 塾向け予約AIアプリを作りたい。\n課題は日程調整に時間がかかること。\n次に個人塾へヒアリングする。',
      'paste',
      cloneData().ideas,
    );

    expect(draft.items.some((item) => item.kind === 'idea')).toBe(true);
    expect(draft.items.some((item) => item.kind === 'problem')).toBe(true);
    expect(draft.items.some((item) => item.kind === 'task')).toBe(true);
    expect(draft.record.tags).toContain('機能');
  });

  it('同期JSONを反映し、同じsyncIdの二重登録を防ぐ', () => {
    const payload = parseSyncPayload(JSON.stringify({
      version: 'chat-sync/v1',
      syncId: 'sync-test-1',
      conversation: { title: '塾AIの検討', summary: '受付業務を自動化する。' },
      items: [
        { kind: 'idea', text: '塾向け受付AI', industry: '教育', targetCustomer: '個人塾' },
        { kind: 'hypothesis', text: '営業時間外の問い合わせ対応に需要がある', targetIdeaName: '塾向け受付AI' },
        { kind: 'task', text: '塾3校へ聞き取りする', targetIdeaName: '塾向け受付AI', dueDate: '2026-07-22' },
      ],
    }));
    const draft = buildDraftFromSyncPayload(payload, cloneData().ideas);
    const first = applyConversationDraft(cloneData(), draft);

    const created = first.data.ideas.find((idea) => idea.name === '塾向け受付AI');
    expect(created?.hypotheses[0]?.hypothesis).toContain('営業時間外');
    expect(created?.nextActions[0]?.title).toContain('塾3校');
    expect(first.data.conversations).toHaveLength(1);

    const second = applyConversationDraft(first.data, draft);
    expect(second.duplicateSync).toBe(true);
    expect(second.data.conversations).toHaveLength(1);
  });

  it('ChatGPTエクスポートJSONから会話を復元する', () => {
    const candidates = parseChatGptExport(JSON.stringify([{
      id: 'conversation-1',
      title: '事業アイデア相談',
      mapping: {
        a: { message: { author: { role: 'user' }, content: { parts: ['塾向けAIを作りたい'] }, create_time: 1 } },
        b: { message: { author: { role: 'assistant' }, content: { parts: ['課題を整理しましょう'] }, create_time: 2 } },
      },
    }]));

    expect(candidates).toHaveLength(1);
    expect(candidates[0].rawText).toContain('あなた: 塾向けAIを作りたい');
    expect(candidates[0].rawText).toContain('ChatGPT: 課題を整理しましょう');
  });

  it('同期URLのクエリ形式を読み取る', () => {
    const payload = readSyncPayloadFromLocation({
      search: '?sync=1&syncId=url-1&title=%E5%A1%BEAI&idea=%E5%A1%BE%E5%90%91%E3%81%91AI&task=%E5%A1%BE%E3%81%B8%E8%81%9E%E3%81%8F',
      hash: '',
    } as Location);

    expect(payload?.syncId).toBe('url-1');
    expect(payload?.items.map((item) => item.kind)).toEqual(['idea', 'task']);
  });
});
