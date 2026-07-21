import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { Check, Lightbulb, Plus, Trash2, X } from 'lucide-react';
import { createId } from '../data';
import {
  EVALUATION_KEYS,
  EVALUATION_LABELS,
  IDEA_STATUSES,
  type BusinessIdea,
  type EvaluationKey,
  type Hypothesis,
  type NextAction,
  type ResearchLog,
} from '../types';
import { evaluationAverage, todayString } from '../utils';

type Tab = '概要' | '評価' | '仮説' | '調査記録' | '次にやること';
const tabs: Tab[] = ['概要', '評価', '仮説', '調査記録', '次にやること'];

export default function IdeaDialog({
  idea,
  mode,
  onClose,
  onSave,
  onDelete,
}: {
  idea: BusinessIdea;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSave: (idea: BusinessIdea) => void;
  onDelete?: (id: string) => void;
}) {
  const [draft, setDraft] = useState<BusinessIdea>(() => structuredClone(idea));
  const [tab, setTab] = useState<Tab>('概要');

  useEffect(() => {
    setDraft(structuredClone(idea));
  }, [idea]);

  const save = () => {
    if (!draft.name.trim()) {
      window.alert('アイデア名を入力してください。');
      return;
    }
    onSave({ ...draft, name: draft.name.trim() });
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="idea-dialog" role="dialog" aria-modal="true" aria-label={mode === 'create' ? '新しいアイデア' : `${idea.name}の編集`}>
        <header className="dialog-header">
          <div>
            <p className="eyebrow">{mode === 'create' ? 'NEW IDEA' : 'IDEA DETAIL'}</p>
            <h2>{mode === 'create' ? '新しいアイデア' : draft.name}</h2>
          </div>
          <button className="icon-button" aria-label="閉じる" onClick={onClose}><X size={22} /></button>
        </header>

        <nav className="tab-bar" aria-label="アイデア詳細タブ">
          {tabs.map((item) => (
            <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>
          ))}
        </nav>

        <div className="dialog-content">
          {tab === '概要' && <OverviewTab draft={draft} setDraft={setDraft} />}
          {tab === '評価' && <EvaluationTab draft={draft} setDraft={setDraft} />}
          {tab === '仮説' && <HypothesisTab draft={draft} setDraft={setDraft} />}
          {tab === '調査記録' && <ResearchTab draft={draft} setDraft={setDraft} />}
          {tab === '次にやること' && <ActionsTab draft={draft} setDraft={setDraft} />}
        </div>

        <footer className="dialog-footer">
          {onDelete && (
            <button className="danger-button" onClick={() => onDelete(draft.id)} data-testid="delete-idea-button">
              <Trash2 size={18} /> 削除
            </button>
          )}
          <div className="footer-spacer" />
          <button className="secondary-button" onClick={onClose}>キャンセル</button>
          <button className="primary-button" onClick={save} data-testid="save-idea-button">
            <Check size={18} /> 保存
          </button>
        </footer>
      </section>
    </div>
  );
}

function OverviewTab({ draft, setDraft }: DraftProps) {
  const field = (key: keyof BusinessIdea) => ({
    value: String(draft[key] ?? ''),
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setDraft({ ...draft, [key]: event.target.value }),
  });

  return (
    <div className="form-grid">
      <Field label="アイデア名" wide><input {...field('name')} data-testid="idea-name-input" /></Field>
      <Field label="一言説明" wide><textarea rows={2} {...field('summary')} /></Field>
      <Field label="対象業界"><input {...field('industry')} data-testid="idea-industry-input" /></Field>
      <Field label="対象顧客"><input {...field('targetCustomer')} /></Field>
      <Field label="現在の状態">
        <select {...field('status')}>
          {IDEA_STATUSES.map((status) => <option key={status}>{status}</option>)}
        </select>
      </Field>
      <Field label={`優先度：${draft.priority}`}>
        <input
          type="range"
          min="1"
          max="5"
          value={draft.priority}
          onChange={(event) => setDraft({ ...draft, priority: Number(event.target.value) })}
          aria-label="優先度"
        />
      </Field>
      <Field label="解決したい課題" wide><textarea rows={4} {...field('problem')} /></Field>
      <Field label="解決方法" wide><textarea rows={4} {...field('solution')} /></Field>
      <Field label="収益方法" wide><textarea rows={3} {...field('revenueModel')} /></Field>
      <Field label="思いついた理由" wide><textarea rows={3} {...field('reason')} /></Field>
    </div>
  );
}

function EvaluationTab({ draft, setDraft }: DraftProps) {
  const update = (key: EvaluationKey, value: Partial<BusinessIdea['evaluations'][EvaluationKey]>) =>
    setDraft({
      ...draft,
      evaluations: {
        ...draft.evaluations,
        [key]: { ...draft.evaluations[key], ...value },
      },
    });

  return (
    <div className="evaluation-list">
      <div className="evaluation-summary">
        <span>総合評価</span>
        <strong>{evaluationAverage(draft)} / 5</strong>
      </div>
      {EVALUATION_KEYS.map((key) => (
        <div className="evaluation-row" key={key}>
          <div className="evaluation-heading">
            <h3>{EVALUATION_LABELS[key]}</h3>
            <div className="score-buttons" role="group" aria-label={`${EVALUATION_LABELS[key]}の点数`}>
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  className={draft.evaluations[key].score === score ? 'active' : ''}
                  onClick={() => update(key, { score })}
                  data-testid={`score-${key}-${score}`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
          <textarea
            rows={2}
            value={draft.evaluations[key].reason}
            onChange={(event) => update(key, { reason: event.target.value })}
            placeholder="なぜこの点数なのか"
            aria-label={`${EVALUATION_LABELS[key]}の理由`}
          />
        </div>
      ))}
    </div>
  );
}

function HypothesisTab({ draft, setDraft }: DraftProps) {
  const add = () => {
    const item: Hypothesis = {
      id: createId(),
      hypothesis: '',
      verificationMethod: '',
      successCriteria: '',
      result: '',
      createdAt: new Date().toISOString(),
    };
    setDraft({ ...draft, hypotheses: [item, ...draft.hypotheses] });
  };
  const update = (id: string, value: Partial<Hypothesis>) =>
    setDraft({ ...draft, hypotheses: draft.hypotheses.map((item) => item.id === id ? { ...item, ...value } : item) });
  return (
    <RecordSection title="仮説" description="思いつきではなく、確かめられる形にします。" onAdd={add} addLabel="仮説を追加">
      {draft.hypotheses.length === 0 ? <EmptyInline text="仮説がまだありません。" /> : draft.hypotheses.map((item) => (
        <article className="record-card" key={item.id}>
          <button className="mini-delete" aria-label="仮説を削除" onClick={() => setDraft({ ...draft, hypotheses: draft.hypotheses.filter((x) => x.id !== item.id) })}><Trash2 size={17} /></button>
          <Field label="仮説" wide><textarea rows={3} value={item.hypothesis} onChange={(e) => update(item.id, { hypothesis: e.target.value })} data-testid="hypothesis-input" /></Field>
          <Field label="どう確認するか" wide><textarea rows={3} value={item.verificationMethod} onChange={(e) => update(item.id, { verificationMethod: e.target.value })} /></Field>
          <Field label="成功条件" wide><textarea rows={2} value={item.successCriteria} onChange={(e) => update(item.id, { successCriteria: e.target.value })} /></Field>
          <Field label="検証結果" wide><textarea rows={3} value={item.result} onChange={(e) => update(item.id, { result: e.target.value })} /></Field>
        </article>
      ))}
    </RecordSection>
  );
}

function ResearchTab({ draft, setDraft }: DraftProps) {
  const add = () => {
    const item: ResearchLog = { id: createId(), date: todayString(), partner: '', topic: '', findings: '', memorableQuote: '', nextResearch: '' };
    setDraft({ ...draft, researchLogs: [item, ...draft.researchLogs] });
  };
  const update = (id: string, value: Partial<ResearchLog>) =>
    setDraft({ ...draft, researchLogs: draft.researchLogs.map((item) => item.id === id ? { ...item, ...value } : item) });
  return (
    <RecordSection title="調査記録" description="顧客の言葉と事実を残します。" onAdd={add} addLabel="記録を追加">
      {draft.researchLogs.length === 0 ? <EmptyInline text="調査記録がまだありません。" /> : draft.researchLogs.map((item) => (
        <article className="record-card research-card" key={item.id}>
          <button className="mini-delete" aria-label="調査記録を削除" onClick={() => setDraft({ ...draft, researchLogs: draft.researchLogs.filter((x) => x.id !== item.id) })}><Trash2 size={17} /></button>
          <Field label="日付"><input type="date" value={item.date} onChange={(e) => update(item.id, { date: e.target.value })} /></Field>
          <Field label="相手"><input value={item.partner} onChange={(e) => update(item.id, { partner: e.target.value })} data-testid="research-partner-input" /></Field>
          <Field label="調査内容" wide><textarea rows={2} value={item.topic} onChange={(e) => update(item.id, { topic: e.target.value })} /></Field>
          <Field label="分かったこと" wide><textarea rows={3} value={item.findings} onChange={(e) => update(item.id, { findings: e.target.value })} /></Field>
          <Field label="印象に残った言葉" wide><textarea rows={2} value={item.memorableQuote} onChange={(e) => update(item.id, { memorableQuote: e.target.value })} /></Field>
          <Field label="次に調べること" wide><textarea rows={2} value={item.nextResearch} onChange={(e) => update(item.id, { nextResearch: e.target.value })} /></Field>
        </article>
      ))}
    </RecordSection>
  );
}

function ActionsTab({ draft, setDraft }: DraftProps) {
  const add = () => {
    const item: NextAction = { id: createId(), title: '', dueDate: todayString(), completed: false };
    setDraft({ ...draft, nextActions: [...draft.nextActions, item] });
  };
  const update = (id: string, value: Partial<NextAction>) =>
    setDraft({ ...draft, nextActions: draft.nextActions.map((item) => item.id === id ? { ...item, ...value } : item) });
  return (
    <RecordSection title="次にやること" description="考えるだけで止めず、次の行動に変えます。" onAdd={add} addLabel="行動を追加">
      {draft.nextActions.length === 0 ? <EmptyInline text="次にやることが未設定です。" /> : (
        <div className="actions-list">
          {draft.nextActions.map((item) => (
            <div className={`action-row ${item.completed ? 'completed' : ''}`} key={item.id}>
              <label className="check-wrap">
                <input type="checkbox" checked={item.completed} onChange={(e) => update(item.id, { completed: e.target.checked })} />
                <span><Check size={15} /></span>
              </label>
              <input value={item.title} onChange={(e) => update(item.id, { title: e.target.value })} placeholder="例：顧客へ話を聞く" data-testid="action-title-input" />
              <input type="date" value={item.dueDate} onChange={(e) => update(item.id, { dueDate: e.target.value })} aria-label="期限" />
              <button className="mini-delete" aria-label="行動を削除" onClick={() => setDraft({ ...draft, nextActions: draft.nextActions.filter((x) => x.id !== item.id) })}><Trash2 size={17} /></button>
            </div>
          ))}
        </div>
      )}
    </RecordSection>
  );
}

type DraftProps = { draft: BusinessIdea; setDraft: (idea: BusinessIdea) => void };

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={`field ${wide ? 'wide' : ''}`}><span>{label}</span>{children}</label>;
}

function RecordSection({ title, description, onAdd, addLabel, children }: { title: string; description: string; onAdd: () => void; addLabel: string; children: ReactNode }) {
  return (
    <section className="record-section">
      <div className="record-section-header">
        <div><h3>{title}</h3><p>{description}</p></div>
        <button className="secondary-button" onClick={onAdd}><Plus size={18} />{addLabel}</button>
      </div>
      <div className="record-list">{children}</div>
    </section>
  );
}

function EmptyInline({ text }: { text: string }) {
  return <div className="empty-inline"><Lightbulb size={23} /><p>{text}</p></div>;
}
