import { beforeEach, describe, expect, it } from 'vitest';
import { initialData } from './data';
import { exportData, importData, loadData, normalizeIdea, saveData, STORAGE_KEY } from './storage';

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('初回は初期アイデア7件を返す', () => {
    const data = loadData();
    expect(data.ideas).toHaveLength(7);
    expect(data.ideas.map((idea) => idea.name)).toContain('個人塾向けAI受付');
  });

  it('保存したデータを再読み込みできる', () => {
    const changed = structuredClone(initialData);
    changed.ideas[0].name = '保存確認';
    saveData(changed);
    expect(localStorage.getItem(STORAGE_KEY)).toContain('保存確認');
    expect(loadData().ideas[0].name).toBe('保存確認');
  });

  it('バックアップを書き出して復元できる', () => {
    const json = exportData(initialData);
    const restored = importData(json);
    expect(restored.schemaVersion).toBe(1);
    expect(restored.ideas).toHaveLength(7);
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
