import { useEffect, useMemo, useRef, useState } from 'react';
import { ArchiveRestore, BarChart3, Download, Lightbulb, Moon, Plus, Search, Sun, Upload, ChevronRight } from 'lucide-react';
import { createEmptyIdea } from './data';
import { exportData, importData, loadData, saveData } from './storage';
import { IDEA_STATUSES, type AppData, type BusinessIdea } from './types';
import IdeaCard from './components/IdeaCard';
import IdeaDialog from './components/IdeaDialog';
import { evaluationAverage, todayString } from './utils';

function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('すべて');
  const [industryFilter, setIndustryFilter] = useState('すべて');
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('businessIdeaManager.theme') === 'dark' ? 'dark' : 'light',
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('businessIdeaManager.theme', theme);
  }, [theme]);

  const industries = useMemo(
    () => Array.from(new Set(data.ideas.map((idea) => idea.industry).filter(Boolean))).sort(),
    [data.ideas],
  );

  const filteredIdeas = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.ideas
      .filter((idea) => {
        const matchesQuery =
          !normalized ||
          [idea.name, idea.summary, idea.targetCustomer, idea.industry]
            .join(' ')
            .toLowerCase()
            .includes(normalized);
        const matchesStatus = statusFilter === 'すべて' || idea.status === statusFilter;
        const matchesIndustry = industryFilter === 'すべて' || idea.industry === industryFilter;
        return matchesQuery && matchesStatus && matchesIndustry;
      })
      .sort((a, b) => b.priority - a.priority || b.updatedAt.localeCompare(a.updatedAt));
  }, [data.ideas, industryFilter, query, statusFilter]);

  const selectedIdea = data.ideas.find((idea) => idea.id === selectedId) ?? null;

  const updateIdea = (updated: BusinessIdea) => {
    const withTimestamp = { ...updated, updatedAt: new Date().toISOString() };
    setData((current) => ({
      ...current,
      ideas: current.ideas.map((idea) => (idea.id === withTimestamp.id ? withTimestamp : idea)),
    }));
  };

  const createIdea = (idea: BusinessIdea) => {
    setData((current) => ({ ...current, ideas: [idea, ...current.ideas] }));
    setSelectedId(idea.id);
    setIsCreating(false);
  };

  const deleteIdea = (id: string) => {
    const target = data.ideas.find((idea) => idea.id === id);
    if (!target || !window.confirm(`「${target.name}」を削除しますか？`)) return;
    setData((current) => ({ ...current, ideas: current.ideas.filter((idea) => idea.id !== id) }));
    setSelectedId(null);
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
      setData(restored);
      setSelectedId(null);
      window.alert('バックアップを復元しました。');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '復元に失敗しました。');
    }
  };

  const counts = {
    total: data.ideas.length,
    researching: data.ideas.filter((idea) => idea.status === '調査中').length,
    promising: data.ideas.filter((idea) => idea.status === '有望').length,
    hold: data.ideas.filter((idea) => idea.status === '保留').length,
    rejected: data.ideas.filter((idea) => idea.status === '不採用').length,
  };

  const todayActions = data.ideas.flatMap((idea) =>
    idea.nextActions
      .filter((action) => !action.completed && action.dueDate === todayString())
      .map((action) => ({ idea, action })),
  );

  const topPriority = [...data.ideas]
    .sort((a, b) => b.priority - a.priority || evaluationAverage(b) - evaluationAverage(a))
    .slice(0, 4);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><Lightbulb size={22} /></div>
          <div>
            <p className="eyebrow">BUSINESS IDEA LAB</p>
            <h1>事業アイデア管理</h1>
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-button" aria-label="テーマ切替" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="secondary-button" onClick={downloadBackup} data-testid="backup-button">
            <Download size={18} /> バックアップ
          </button>
          <button className="secondary-button" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} /> 復元
          </button>
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept="application/json"
            aria-label="バックアップファイル"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void restoreBackup(file);
              event.currentTarget.value = '';
            }}
          />
          <button className="primary-button" onClick={() => setIsCreating(true)} data-testid="add-idea-button">
            <Plus size={19} /> 新しいアイデア
          </button>
        </div>
      </header>

      <main>
        <section className="stats-grid" aria-label="ダッシュボード集計">
          <StatCard label="登録アイデア" value={counts.total} icon={<Lightbulb size={20} />} />
          <StatCard label="調査中" value={counts.researching} />
          <StatCard label="有望" value={counts.promising} />
          <StatCard label="保留" value={counts.hold} />
          <StatCard label="不採用" value={counts.rejected} />
        </section>

        <section className="dashboard-grid">
          <div className="panel focus-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">TODAY</p>
                <h2>今日やるべき調査</h2>
              </div>
              <span className="count-badge">{todayActions.length}</span>
            </div>
            <div className="compact-list">
              {todayActions.length === 0 ? (
                <p className="empty-state">今日が期限の調査はありません。</p>
              ) : (
                todayActions.slice(0, 5).map(({ idea, action }) => (
                  <button key={action.id} className="compact-row" onClick={() => setSelectedId(idea.id)}>
                    <span>
                      <strong>{action.title}</strong>
                      <small>{idea.name}</small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">PRIORITY</p>
                <h2>優先度上位</h2>
              </div>
              <BarChart3 size={20} />
            </div>
            <div className="compact-list">
              {topPriority.map((idea, index) => (
                <button key={idea.id} className="compact-row rank-row" onClick={() => setSelectedId(idea.id)}>
                  <span className="rank">{index + 1}</span>
                  <span>
                    <strong>{idea.name}</strong>
                    <small>優先度 {idea.priority} ・ 評価 {evaluationAverage(idea)}</small>
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="ideas-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">IDEAS</p>
              <h2>アイデア一覧</h2>
            </div>
            <span>{filteredIdeas.length}件</span>
          </div>

          <div className="filter-bar">
            <label className="search-field">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="名前・顧客・業界で検索"
                aria-label="アイデア検索"
              />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="状態で絞り込み">
              <option>すべて</option>
              {IDEA_STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
            <select value={industryFilter} onChange={(event) => setIndustryFilter(event.target.value)} aria-label="対象業界で絞り込み">
              <option>すべて</option>
              {industries.map((industry) => <option key={industry}>{industry}</option>)}
            </select>
          </div>

          <div className="idea-grid" data-testid="idea-grid">
            {filteredIdeas.length === 0 ? (
              <div className="empty-card">
                <ArchiveRestore size={28} />
                <h3>該当するアイデアがありません</h3>
                <p>検索条件を変えるか、新しいアイデアを追加してください。</p>
              </div>
            ) : (
              filteredIdeas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} onOpen={() => setSelectedId(idea.id)} />
              ))
            )}
          </div>
        </section>
      </main>

      {(selectedIdea || isCreating) && (
        <IdeaDialog
          idea={selectedIdea ?? createEmptyIdea()}
          mode={isCreating ? 'create' : 'edit'}
          onClose={() => {
            setSelectedId(null);
            setIsCreating(false);
          }}
          onSave={isCreating ? createIdea : updateIdea}
          onDelete={isCreating ? undefined : deleteIdea}
        />
      )}
    </div>
  );
}


function StatCard({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{icon}{label}</div>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
