import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clipboard, FileJson, Link2, MessageSquareText, Plus, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { buildDraftFromSyncPayload, buildDraftFromText, buildIntegrationPrompt, extractedKindLabel, parseChatGptExport, parseSyncPayload } from '../conversation';
import { createId } from '../data';
import type { BusinessIdea, ConversationCandidate, ConversationDraft, ExtractedItemKind, SyncPayload } from '../types';

const kinds: ExtractedItemKind[] = ['idea', 'problem', 'hypothesis', 'task', 'note'];
type InputMode = 'paste' | 'export' | 'sync';

export default function ConversationImporter({ ideas, initialPayload, onClose, onApply }: { ideas: BusinessIdea[]; initialPayload?: SyncPayload | null; onClose: () => void; onApply: (draft: ConversationDraft) => void }) {
  const [mode, setMode] = useState<InputMode>(initialPayload ? 'sync' : 'paste');
  const [title, setTitle] = useState('ChatGPTとの会話');
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<ConversationDraft | null>(null);
  const [candidates, setCandidates] = useState<ConversationCandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialPayload) return;
    setTitle(initialPayload.conversation.title);
    setText(JSON.stringify(initialPayload, null, 2));
    setDraft(buildDraftFromSyncPayload(initialPayload, ideas, 'sync-url'));
  }, [ideas, initialPayload]);

  const selectedCount = useMemo(() => draft?.items.filter((item) => item.selected && item.text.trim()).length ?? 0, [draft]);
  const analyzeText = () => {
    setError('');
    if (!text.trim()) { setError('会話または同期JSONを入力してください。'); return; }
    try {
      if (mode === 'sync') {
        const payload = parseSyncPayload(text);
        setDraft(buildDraftFromSyncPayload(payload, ideas));
        setTitle(payload.conversation.title);
      } else setDraft(buildDraftFromText(title, text, 'paste', ideas));
    } catch (cause) { setError(cause instanceof Error ? cause.message : '内容を読み取れませんでした。'); }
  };
  const loadCandidate = (candidate: ConversationCandidate) => {
    setSelectedCandidateId(candidate.id); setTitle(candidate.title); setText(candidate.rawText); setDraft(buildDraftFromText(candidate.title, candidate.rawText, 'chatgpt-export', ideas));
  };
  const importFile = async (file: File) => {
    setError('');
    try {
      const content = await file.text();
      try {
        const payload = parseSyncPayload(content);
        setMode('sync'); setTitle(payload.conversation.title); setText(content); setDraft(buildDraftFromSyncPayload(payload, ideas)); setCandidates([]); return;
      } catch { /* try ChatGPT export next */ }
      const parsed = parseChatGptExport(content);
      setMode('export'); setCandidates(parsed); loadCandidate(parsed[0]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'ファイルを読み取れませんでした。'); }
  };
  const copyPrompt = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    await navigator.clipboard.writeText(buildIntegrationPrompt(url));
    window.alert('1タップ同期の設定文をコピーしました。ChatGPTプロジェクトの指示へ一度だけ追加してください。');
  };
  const updateItem = (id: string, patch: Partial<ConversationDraft['items'][number]>) => {
    if (draft) setDraft({ ...draft, items: draft.items.map((item) => item.id === id ? { ...item, ...patch } : item) });
  };
  const addItem = () => {
    if (draft) setDraft({ ...draft, items: [...draft.items, { id: createId(), kind: 'note', text: '', selected: true, targetIdeaId: ideas[0]?.id ?? '' }] });
  };
  const apply = () => {
    if (!draft || selectedCount === 0) { setError('登録する項目を1件以上選んでください。'); return; }
    onApply({ ...draft, record: { ...draft.record, title: draft.record.title.trim() || title.trim() || 'ChatGPT会話' } });
  };

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="sync-dialog" role="dialog" aria-modal="true" aria-label="ChatGPT同期">
      <header className="dialog-header"><div><p className="eyebrow">CHATGPT SYNC</p><h2>会話からアイデアを更新</h2></div><button className="icon-button" aria-label="同期画面を閉じる" onClick={onClose}><X size={22}/></button></header>
      <nav className="sync-mode-tabs" aria-label="取り込み方法">
        <button className={mode === 'paste' ? 'active' : ''} onClick={() => { setMode('paste'); setDraft(null); setError(''); }}><MessageSquareText size={18}/> 会話を貼る</button>
        <button className={mode === 'export' ? 'active' : ''} onClick={() => { setMode('export'); setDraft(null); setError(''); }}><FileJson size={18}/> エクスポートJSON</button>
        <button className={mode === 'sync' ? 'active' : ''} onClick={() => { setMode('sync'); setDraft(null); setError(''); }}><Link2 size={18}/> 同期リンク / JSON</button>
      </nav>
      <div className="sync-content">
        <aside className="sync-input-panel">
          <div className="sync-help-card"><Sparkles size={20}/><div><strong>{initialPayload ? 'ChatGPTのリンクから受け取りました' : mode === 'sync' ? 'おすすめ：1タップ同期リンク' : mode === 'export' ? '過去の会話をまとめて選択' : '手動取り込みも残しています'}</strong><p>{initialPayload ? '登録前に内容を確認し、必要な項目だけ反映できます。' : '会話はこの端末内で処理され、外部AI APIへ自動送信しません。'}</p></div></div>
          {mode === 'export' ? <>
            <button className="drop-button" onClick={() => fileRef.current?.click()}><Upload size={22}/> ChatGPTの conversations.json を選ぶ</button>
            <input ref={fileRef} className="visually-hidden" type="file" accept="application/json,.json" aria-label="ChatGPTエクスポートファイル" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); event.currentTarget.value = ''; }}/>
            {candidates.length > 0 && <label className="field"><span>取り込む会話</span><select value={selectedCandidateId} onChange={(event) => { const candidate = candidates.find((item) => item.id === event.target.value); if (candidate) loadCandidate(candidate); }}>{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}</select></label>}
          </> : <>
            {mode === 'paste' && <label className="field"><span>会話タイトル</span><input value={title} onChange={(event) => setTitle(event.target.value)} data-testid="conversation-title-input"/></label>}
            <label className="field sync-text-field"><span>{mode === 'sync' ? 'chat-sync/v1 JSON（リンク利用時は自動入力）' : 'ChatGPTとの会話'}</span><textarea rows={14} value={text} onChange={(event) => setText(event.target.value)} placeholder={mode === 'sync' ? '{ "version": "chat-sync/v1", ... }' : 'あなた: 塾向けAIを作りたい\nChatGPT: ...'} data-testid="conversation-text-input"/></label>
            <button className="primary-button analyze-button" onClick={analyzeText} data-testid="analyze-conversation-button"><Sparkles size={18}/> 内容を整理する</button>
          </>}
          <div className="prompt-card"><strong>会話を貼らずに1タップ同期</strong><p>設定文をChatGPTプロジェクトの指示へ一度追加します。次回から会話末尾に出る「事業アイデア管理へ1タップ追加」を押すだけで、この確認画面が開きます。</p><button className="secondary-button" onClick={() => void copyPrompt()}><Clipboard size={18}/> 1タップ同期の設定文をコピー</button></div>
        </aside>
        <section className="sync-review-panel">
          {!draft ? <div className="sync-empty"><MessageSquareText size={34}/><h3>ChatGPTの同期リンクを押すと、ここに整理結果が出ます</h3><p>従来どおり貼り付けやJSON読み込みも利用できます。</p></div> : <>
            <div className="sync-summary-card"><label className="field"><span>保存する会話名</span><input value={draft.record.title} onChange={(event) => setDraft({ ...draft, record: { ...draft.record, title: event.target.value } })}/></label><label className="field"><span>会話の要約</span><textarea rows={3} value={draft.record.summary} onChange={(event) => setDraft({ ...draft, record: { ...draft.record, summary: event.target.value } })}/></label><div className="tag-row">{draft.record.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
            <div className="review-heading"><div><h3>登録する内容</h3><p>{selectedCount}件を選択中。誤分類はここで直せます。</p></div><button className="secondary-button" onClick={addItem}><Plus size={17}/> 項目を追加</button></div>
            <div className="extracted-list" data-testid="extracted-list">{draft.items.length === 0 ? <div className="empty-inline"><p>自動抽出できませんでした。項目を追加して登録できます。</p></div> : draft.items.map((item) => <article className={`extracted-row ${item.selected ? '' : 'disabled'}`} key={item.id}>
              <label className="check-wrap" aria-label="登録する"><input type="checkbox" checked={item.selected} onChange={(event) => updateItem(item.id, { selected: event.target.checked })}/><span><Check size={15}/></span></label>
              <select value={item.kind} onChange={(event) => updateItem(item.id, { kind: event.target.value as ExtractedItemKind })} aria-label="分類">{kinds.map((kind) => <option key={kind} value={kind}>{extractedKindLabel(kind)}</option>)}</select>
              <textarea rows={2} value={item.text} onChange={(event) => updateItem(item.id, { text: event.target.value })} aria-label="抽出内容"/>
              {item.kind !== 'idea' ? <select value={item.targetIdeaId} onChange={(event) => updateItem(item.id, { targetIdeaId: event.target.value })} aria-label="反映先アイデア"><option value="">反映先を選択</option>{ideas.map((idea) => <option key={idea.id} value={idea.id}>{idea.name}</option>)}</select> : <span className="new-idea-label">新しいアイデアとして登録</span>}
              <button className="mini-delete" aria-label="抽出項目を削除" onClick={() => setDraft({ ...draft, items: draft.items.filter((entry) => entry.id !== item.id) })}><Trash2 size={17}/></button>
            </article>)}</div>
          </>}
          {error && <p className="form-error" role="alert">{error}</p>}
        </section>
      </div>
      <footer className="dialog-footer"><span className="privacy-note">保存先：このブラウザのlocalStorage</span><div className="footer-spacer"/><button className="secondary-button" onClick={onClose}>キャンセル</button><button className="primary-button" onClick={apply} disabled={!draft || selectedCount === 0} data-testid="apply-conversation-button"><Check size={18}/> {selectedCount}件を反映</button></footer>
    </section>
  </div>;
}