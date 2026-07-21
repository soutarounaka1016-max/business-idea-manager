import { beforeEach, describe, expect, it } from 'vitest';
import { initialData } from './data';
import { exportData, importData, loadData, normalizeIdea, parseData, saveData, STORAGE_KEY } from './storage';

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('初回は初期アイデア7件を返す', () => {
    const data = loadData();
    expect(data.ideas).toHaveLength(7);
    expect(data.ideas.map((idea) => idea.name)).toContain('個人塾向けAI受付');
    expect(data.schemaVersion).toBe(2);
    expect(data.conversations).toEqual([]);
  });

  it('保存したデータを再読み込みできる', () => {
    const changed = structuredClone(initialData);
    changed.ideas[0].name = '保存確認';
    saveData(changed);
    expect(localStorage.getItem(STORAGE_KEY)).toContain('保存確認');
    expect(loadData().ideas[0].name).toBe('保存確認');
  });

  it('バックアップを書き出して会話履歴ごと復元できる', () => {
    const changed = structuredClone(initialData);
    changed.conversations.push({
      id: 'conversation-1',
      title: '同期確認',
      source: 'sync-json',
      importedAt: new Date().toISOString(),
      rawText: 'task: 調査する',
      summary: '同期の確認',
      tags: ['検証'],
      linkedIdeaIds: [changed.ideas[0].id],
      syncId: 'sync-1',
    });
    const json = exportData(changed);
    const restored = importData(json);
    expect(restored.schemaVersion).toBe(2);
    expect(restored.ideas).toHaveLength(7);
    expect(restored.conversations[0].title).toBe('同期確認');
  });

  it('schemaVersion 1の既存データをversion 2へ移行する', () => {
    const migrated = parseData({ schemaVersion: 1, ideas: [{ id: 'old-1', name: '旧アイデア', priority: 4 }] });
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.ideas[0].name).toBe('旧アイデア');
    expect(migrated.conversations).toEqual([]);
    expect(migrated.processedSyncIds).toEqual([]);
  });

  it('古い・不足したデータを安全に補完する', () => {
    const idea = normalizeIdea({ name: '移行対象', priority: 99, evaluations: undefined });
    expect(idea.priority).toBe(5);
    expect(idea.status).toBe('思いつき');
    expect(idea.evaluations.problemSize.score).toBe(3);
  });

  it('壊れたバックアップを拒否する', () => {
    expect(() => importData('{"hello":"world"}')).toThrow('アイデア一覧');
  });
});
