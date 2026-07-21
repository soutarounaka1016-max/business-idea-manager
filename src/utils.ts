import { EVALUATION_KEYS, type BusinessIdea } from './types';

export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(new Date(iso));

export const evaluationAverage = (idea: BusinessIdea): number => {
  const scores = EVALUATION_KEYS.map((key) => idea.evaluations[key].score);
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
};

export const todayString = (): string => new Date().toISOString().slice(0, 10);
