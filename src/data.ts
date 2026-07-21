import type { AppData, BusinessIdea, EvaluationKey, EvaluationItem } from './types';
import { EVALUATION_KEYS } from './types';

export const createId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const emptyEvaluations = (): Record<EvaluationKey, EvaluationItem> =>
  Object.fromEntries(EVALUATION_KEYS.map((key) => [key, { score: 3, reason: '' }])) as Record<
    EvaluationKey,
    EvaluationItem
  >;

const today = (): string => new Date().toISOString().slice(0, 10);

export const createEmptyIdea = (): BusinessIdea => ({
  id: createId(),
  name: '',
  summary: '',
  industry: '',
  targetCustomer: '',
  problem: '',
  solution: '',
  revenueModel: '',
  reason: '',
  status: '思いつき',
  priority: 3,
  updatedAt: new Date().toISOString(),
  evaluations: emptyEvaluations(),
  hypotheses: [],
  researchLogs: [],
  nextActions: [],
});

const initialIdea = (
  name: string,
  summary: string,
  industry: string,
  targetCustomer: string,
  problem: string,
  solution: string,
  revenueModel: string,
  reason: string,
  status: BusinessIdea['status'],
  priority: number,
  action: string,
): BusinessIdea => ({
  ...createEmptyIdea(),
  name,
  summary,
  industry,
  targetCustomer,
  problem,
  solution,
  revenueModel,
  reason,
  status,
  priority,
  nextActions: [{ id: createId(), title: action, dueDate: today(), completed: false }],
});

export const initialData: AppData = {
  schemaVersion: 1,
  ideas: [
    initialIdea(
      '個人塾向けAI受付',
      '問い合わせ対応と体験授業受付をAIで補助する。',
      '教育・学習塾',
      '個人経営の学習塾',
      '授業中や営業時間外に問い合わせへ対応できず、入塾機会を逃す。',
      'よくある質問、体験授業候補日の案内、必要情報の聞き取りを自動化する。',
      '月額利用料＋初期設定費',
      '学生として塾へ話を聞きに行きやすく、現場課題を検証しやすい。',
      '調査中',
      5,
      '近隣の個人塾3校へ受付業務について聞く',
    ),
    initialIdea(
      'LINE対応AI',
      '店舗のLINE問い合わせを整理し、返信案を作る。',
      '店舗業務',
      'LINE公式アカウントを使う小規模店舗',
      '同じ質問への返信や予約確認に時間がかかる。',
      '問い合わせ分類、返信案作成、必要事項の聞き取りを支援する。',
      '店舗ごとの月額課金',
      '個人店で共通しやすい業務で、業種横断の展開も考えられる。',
      '仮説作成',
      4,
      'LINE対応に時間を使う店舗を5件探す',
    ),
    initialIdea(
      '塾向け予約管理',
      '面談や体験授業の日程調整を簡単にする。',
      '教育・学習塾',
      '個人塾・小規模塾',
      '電話やLINEでの日程調整が往復し、管理漏れが起きる。',
      '空き時間提示、予約受付、変更履歴の管理を一画面にまとめる。',
      '月額利用料',
      'AI受付と組み合わせやすく、最小機能でも価値を検証できる。',
      '思いつき',
      4,
      '既存の予約管理サービスを比較する',
    ),
    initialIdea(
      '個人経営店舗向けAI',
      '受付・予約・定型連絡をまとめて補助する業務アシスタント。',
      '地域店舗',
      '飲食店、美容室、教室などの個人経営者',
      '少人数のため事務作業が営業や接客を圧迫する。',
      '業種ごとの定型業務をAIと簡単な自動化で減らす。',
      '初期導入費＋月額保守',
      '大学生でも地域店舗へ接触し、課題発見から始められる。',
      '調査中',
      4,
      '対象業種を一つに絞るため3業種へ聞き取りする',
    ),
    initialIdea(
      'AI問題発見エージェント',
      '業務記録から繰り返し発生する無駄や課題候補を見つける。',
      '業務改善',
      '中小企業の管理者',
      '改善すべき課題が経験者の感覚に依存し、見落とされる。',
      '業務ログや問い合わせを分類し、頻出問題と改善候補を提示する。',
      '法人向け月額契約',
      '将来の中核事業候補だが、データ取得と信頼性の検証が必要。',
      '保留',
      3,
      '入力データを安全に集められる方法を整理する',
    ),
    initialIdea(
      'AI工場ダッシュボード',
      '複数アプリの開発・テスト・公開状態を一画面で確認する。',
      '開発管理',
      '複数のアプリをAIで開発する個人',
      '開発状況がチャットやリポジトリに分散して把握しづらい。',
      '各アプリの状態、テスト結果、公開URLをカードで集約する。',
      '自分用から開始し、将来は開発者向け月額サービスを検討する。',
      '自分自身が明確な利用者で、すぐ使用感を検証できる。',
      '検証中',
      5,
      '現在のアプリ情報を手動登録して使い勝手を確認する',
    ),
    initialIdea(
      'サッカー観戦アプリ',
      '初心者へ注目選手と試合の見どころを短く案内する。',
      'スポーツ・メディア',
      'サッカー初心者の観戦者',
      '選手や戦術を知らないと、試合のどこを見ればよいか分からない。',
      '試合前に注目選手、プレーの特徴、観戦ポイントを提示する。',
      '広告、提携、プレミアム解説',
      '自分の観戦体験から課題を理解しており、試作品もある。',
      '検証予定',
      3,
      '初心者3人に現在の試作品を見せる',
    ),
  ],
};
