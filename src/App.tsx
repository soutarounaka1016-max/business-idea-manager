import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArchiveRestore, BarChart3, Download, Lightbulb, Moon, Plus, Search, Sun, Upload, ChevronRight, MessageSquarePlus } from 'lucide-react';
import { applyConversationDraft, isSyncPayload, readSyncPayloadFromLocation } from './conversation';
import { createEmptyIdea } from './data';
import { exportData, importData, loadData, saveData } from './storage';
import { IDEA_STATUSES, type AppData, type BusinessIdea, type ConversationDraft, type SyncPayload } from './types';
import ConversationImporter from './components/ConversationImporter';
import IdeaCard from './components/IdeaCard';
import IdeaDialog from './components/IdeaDialog';
import { evaluationAverage, formatDate, todayString } from './utils';

function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [initialSyncPayload, setInitialSyncPayload] = useState<SyncPayload | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('すべて');
  const [industryFilter, setIndustryFilter] = useState('すべて');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('businessIdeaManager.theme') === 'dark' ? 'dark' : 'light');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { saveData(data); }, [data]);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('businessIdeaManager.theme', theme); }, [theme]);
  useEffect(() => {
    const payload = readSyncPayloadFromLocation(window.location);
    if (payload) {
      setInitialSyncPayload(payload);
      setIsSyncing(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
    const receiveSync = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const candidate = event.data && typeof event.data === 'object' && 'payload' in event.data ? (event.data as { payload?: unknown }).payload : event.data;
      if (!isSyncPayload(candidate)) return;
      setInitialSyncPayload(candidate);
      setIsSyncing(true);
    };
    window.addEventListener('message', receiveSync);
    return () => window.removeEventListener('message', receiveSync);
  }, []);

  const industries = useMemo(() => Array.from(new Set(data.ideas.map((idea) => idea.industry).filter(Boolean))).sort(), [data.ideas]);
  const filteredIdeas = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.ideas.filter((idea) => {
      const matchesQuery = !normalized || [idea.name, idea.summary, idea.targetCustomer, idea.industry].join(' ').toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === 'すべて' || idea.status === statusFilter;
      const matchesIndustry = industryFilter === 'すべて' || idea.industry === industryFilter;
      return matchesQuery && matchesStatus && matchesIndustry;
    }).sort((a, b) => b.priority - a.priority || b.updatedAt.localeCompare(a.updatedAt));
  }, [data.ideas, industryFilter, query, statusFilter]);

  const selectedIdea = data.ideas.find((idea) => idea.id === selectedId) ?? null;
  const updateIdea = (updated: BusinessIdea) => {
    const withTimestamp = { ...updated, updatedAt: new Date().toISOString() };
    setData((current) => ({ ...current, ideas: current.ideas.map((idea) => idea.id === withTimestamp.id ? withTimestamp : idea) }));
  };
  const createIdea = (idea: BusinessIdea) => { setData((current) => ({ ...current, ideas: [idea, ...current.ideas] })); setSelectedId(idea.id); setIsCreating(false); };
  const deleteIdea = (id: string) => {
    const target = data.ideas.find((idea) => idea.id === id);
    if (!target || !window.confirm(`「${target.name}」を削除しますか？`)) return;
    setData((current) => ({ ...current, ideas: current.ideas.filter((idea) => idea.id !== id), conversations: current.conversations.map((record) => ({ ...record, linkedIdeaIds: record.linkedIdeaIds.filter((ideaId) => ideaId !== id) })) }));
    setSelectedId(null);
  };
  const applyConversation = (draft: ConversationDraft) => {
    const result = applyConversationDraft(data, draft);
    if (result.duplicateSync) { window.alert('この同期データはすでに反映されています。'); return; }
    setData(result.data);
    setIsSyncing(false);
    setInitialSyncPayload(null);
    const focusId = result.createdIdeaIds[0] ?? result.updatedIdeaIds[0];
    if (focusId) setSelectedId(focusId);
    window.alert(`会話を保存し、${result.createdIdeaIds.length + result.updatedIdeaIds.length}件のアイデアへ反映しました。`);
  };

  const downloadBackup = () => {
    const blob = new Blob([exportData(data)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `business-ideas-${todayString()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const restoreBackup = async (file: File) => {
    try {
      const restored = importData(await file.text());
      if (!window.confirm(`バックアップの${restored.ideas.length}件で現在のデータを置き換えますか？`)) return;
      setData(restored); setSelectedId(null); window.alert('バックアップを復元しました。');
    } catch (error) { window.alert(error instanceof Error ? error.message : '復元に失敗しました。'); }
  };

  const counts = { total: data.ideas.length, conversations: data.conversations.length, researching: data.ideas.filter((idea) => idea.status === '調査中').length, promising: data.ideas.filter((idea) => idea.status === '有望').length, hold: data.ideas.filter((idea) => idea.status === '保留').length };
  const todayActions = data.ideas.flatMap((idea) => idea.nextActions.filter((action) => !action.completed && action.dueDate === todayString()).map((action) => ({ idea, action })));
  const topPriority = [...data.ideas].sort((a, b) => b.priority - a.priority || evaluationAverage(b) - evaluationAverage(a)).slice(0, 4);

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-icon"><Lightbulb size={22}/></div><div><p className="eyebrow">BUSINESS IDEA LAB</p><h1>事業アイデア管理</h1></div></div>
      <div className="header-actions">
        <button className="icon-button" aria-label="テーマ切替" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}</button>
        <button className="secondary-button" onClick={downloadBackup} data-testid="backup-button"><Download size={18}/> バックアップ</button>
        <button className="secondary-button" onClick={() => fileInputRef.current?.click()}><Upload size={18}/> 復元</button>
        <input ref={fileInputRef} className="visually-hidden" type="file" accept="application/json" aria-label="バックアップファイル" onChange={(event) => { const file = event.target.files?.[0]; if (file) void restoreBackup(file); event.currentTarget.value = ''; }}/>
        <button className="sync-button" onClick={() => { setInitialSyncPayload(null); setIsSyncing(true); }} data-testid="chatgpt-sync-button"><MessageSquarePlus size={19}/> ChatGPT同期</button>
        <button className="primary-button" onClick={() => setIsCreating(true)} data-testid="add-idea-button"><Plus size={19}/> 新しいアイデア</button>
      </div>
    </header>

    <main>
      <section className="sync-banner"><div><p className="eyebrow">CONVERSATION → ACTION</p><h2>ChatGPTで考えた内容を、流さず事業データへ</h2><p>会話を貼るか同期JSONを読み込み、登録前に確認してからアイデア・課題・仮説・行動へ反映します。</p></div><button className="primary-button" onClick={() => setIsSyncing(true)}><MessageSquarePlus size={19}/> 会話を取り込む</button></section>
      <section className="stats-grid" aria-label="ダッシュボード集計">
        <StatCard label="登録アイデア" value={counts.total} icon={<Lightbulb size={20}/>}/><StatCard label="取り込んだ会話" value={counts.conversations} icon={<MessageSquarePlus size={20}/>}/><StatCard label="調査中" value={counts.researching}/><StatCard label="有望" value={counts.promising}/><StatCard label="保留" value={counts.hold}/>
      </section>
      <section className="dashboard-grid">
        <div className="panel focus-panel"><div className="panel-heading"><div><p className="eyebrow">TODAY</p><h2>今日やるべき調査</h2></div><span className="count-badge">{todayActions.length}</span></div><div className="compact-list">{todayActions.length === 0 ? <p className="empty-state">今日が期限の調査はありません。</p> : todayActions.slice(0, 5).map(({ idea, action }) => <button key={action.id} className="compact-row" onClick={() => setSelectedId(idea.id)}><span><strong>{action.title}</strong><small>{idea.name}</small></span><ChevronRight size={18}/></button>)}</div></div>
        <div className="panel"><div className="panel-heading"><div><p className="eyebrow">PRIORITY</p><h2>優先度上位</h2></div><BarChart3 size={20}/></div><div className="compact-list">{topPriority.map((idea, index) => <button key={idea.id} className="compact-row rank-row" onClick={() => setSelectedId(idea.id)}><span className="rank">{index + 1}</span><span><strong>{idea.name}</strong><small>優先度 {idea.priority} ・ 評価 {evaluationAverage(idea)}</small></span><ChevronRight size={18}/></button>)}</div></div>
      </section>
      {data.conversations.length > 0 && <section className="conversation-section panel"><div className="panel-heading"><div><p className="eyebrow">CONVERSATIONS</p><h2>最近取り込んだ会話</h2></div><span className="count-badge">{data.conversations.length}</span></div><div className="conversation-grid">{data.conversations.slice(0, 4).map((record) => <article className="conversation-card" key={record.id}><div className="card-topline"><span className="status-pill">{record.source === 'chatgpt-export' ? 'エクスポート' : record.source === 'paste' ? '貼り付け' : '同期'}</span><span className="conversation-date">{formatDate(record.importedAt)}</span></div><h3>{record.title}</h3><p>{record.summary || '要約はありません。'}</p><div className="tag-row">{record.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><small>{record.linkedIdeaIds.length}件のアイデアに反映</small></article>)}</div></section>}

      <section className="ideas-section"><div className="section-heading"><div><p className="eyebrow">IDEAS</p><h2>アイデア一覧</h2></div><span>{filteredIdeas.length}件</span></div>
        <div className="filter-bar"><label className="search-field"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="名前・顧客・業界で検索" aria-label="アイデア検索"/></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="状態で絞り込み"><option>すべて</option>{IDEA_STATUSES.map((status) => <option key={status}>{status}</option>)}</select><select value={industryFilter} onChange={(event) => setIndustryFilter(event.target.value)} aria-label="対象業界で絞り込み"><option>すべて</option>{industries.map((industry) => <option key={industry}>{industry}</option>)}</select></div>
        <div className="idea-grid" data-testid="idea-grid">{filteredIdeas.length === 0 ? <div className="empty-card"><ArchiveRestore size={28}/><h3>該当するアイデアがありません</h3><p>検索条件を変えるか、新しいアイデアを追加してください。</p></div> : filteredIdeas.map((idea) => <IdeaCard key={idea.id} idea={idea} onOpen={() => setSelectedId(idea.id)}/>)}</div>
      </section>
    </main>

    {(selectedIdea || isCreating) && <IdeaDialog idea={selectedIdea ?? createEmptyIdea()} mode={isCreating ? 'create' : 'edit'} onClose={() => { setSelectedId(null); setIsCreating(false); }} onSave={isCreating ? createIdea : updateIdea} onDelete={isCreating ? undefined : deleteIdea}/>} 
    {isSyncing && <ConversationImporter ideas={data.ideas} initialPayload={initialSyncPayload} onClose={() => { setIsSyncing(false); setInitialSyncPayload(null); }} onApply={applyConversation}/>} 
  </div>;
}

function StatCard({ label, value, icon }: { label: string; value: number; icon?: ReactNode }) {
  return <div className="stat-card"><div className="stat-label">{icon}{label}</div><strong>{value}</strong></div>;
}

export default App;
