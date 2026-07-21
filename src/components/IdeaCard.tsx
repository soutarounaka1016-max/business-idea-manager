import { ChevronRight } from 'lucide-react';
import type { BusinessIdea } from '../types';
import { evaluationAverage, formatDate } from '../utils';

export default function IdeaCard({ idea, onOpen }: { idea: BusinessIdea; onOpen: () => void }) {
  const nextAction = idea.nextActions.find((action) => !action.completed);
  return (
    <button className="idea-card" onClick={onOpen} data-testid={`idea-card-${idea.id}`}>
      <div className="card-topline">
        <span className={`status-pill status-${idea.status}`}>{idea.status}</span>
        <span className="priority-pill">優先度 {idea.priority}</span>
      </div>
      <div className="card-main">
        <p className="industry">{idea.industry || '業界未設定'}</p>
        <h3>{idea.name || '名称未設定'}</h3>
        <p>{idea.summary || '説明がまだありません。'}</p>
      </div>
      <div className="score-row">
        <span>総合評価</span>
        <strong>{evaluationAverage(idea)}</strong>
      </div>
      <div className="next-action-preview">
        <span>次にやること</span>
        <strong>{nextAction?.title ?? '未設定'}</strong>
      </div>
      <div className="card-footer">
        <span>更新 {formatDate(idea.updatedAt)}</span>
        <ChevronRight size={18} />
      </div>
    </button>
  );
}
