// Shared answer cache. Every question any haji asks is normalised and counted, so the most
// asked answers can be downloaded by everyone for offline use (before Mina/Arafah, where the
// network fails). Production: same table in Supabase plus pre-recorded Bangla audio per answer.

export interface CachedAnswer { key: string; question: string; topic: string; replyBn: string; replyEn: string; count: number; lastAt: number }

const cache = new Map<string, CachedAnswer>();

export const normalise = (q: string) =>
  q.toLowerCase().replace(/[?？।!,.]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);

export function recordAnswer(question: string, a: { topic: string; replyBn: string; replyEn: string }) {
  if (a.topic === 'generic') return; // only answers we actually have
  const key = a.topic;
  const prev = cache.get(key);
  cache.set(key, { key, question: prev?.question ?? question.slice(0, 120), topic: a.topic, replyBn: a.replyBn, replyEn: a.replyEn, count: (prev?.count ?? 0) + 1, lastAt: Date.now() });
}

export function popularAnswers(n: number) {
  return [...cache.values()].sort((a, b) => b.count - a.count).slice(0, n);
}

export function _resetAnswers() { cache.clear(); }
