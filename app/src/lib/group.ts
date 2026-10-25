import { useEffect, useState } from 'react';

export type NoticeKind = 'bus' | 'wake' | 'meet' | 'info';
export interface Notice { id: string; kind: NoticeKind; at: number | null; textBn: string; createdAt: number }
export interface GroupInfo {
  code: string; leaderName: string; agency: string; phone: string; members: number; notices: Notice[];
  reviews: { total: number; recommendPct: number | null; topReasons: Array<{ reason: string; n: number }> };
}
export interface Mine { role: 'leader' | 'member'; memberId?: string; reviewed?: boolean; group: GroupInfo }

const KEY = 'moallem.group';
export const groupToken = () => { try { return localStorage.getItem(KEY); } catch { return null; } };

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groupToken() ?? ''}`, ...(init.headers || {}) } });
  if (!r.ok) throw Object.assign(new Error(String(r.status)), { status: r.status });
  return r.json();
}

export async function joinGroup(code: string, name: string) {
  const r = await call<{ memberToken: string }>('/api/groups/join', { method: 'POST', body: JSON.stringify({ code, name }) });
  localStorage.setItem(KEY, r.memberToken);
  window.dispatchEvent(new Event('moallem:group'));
}
export async function createGroup(leaderName: string, agency: string, phone: string) {
  const r = await call<{ leaderToken: string }>('/api/groups', { method: 'POST', body: JSON.stringify({ leaderName, agency, phone }) });
  localStorage.setItem(KEY, r.leaderToken);
  window.dispatchEvent(new Event('moallem:group'));
}
export const postNotice = (kind: NoticeKind, at: number | null, textBn: string) =>
  call<Notice>('/api/groups/notices', { method: 'POST', body: JSON.stringify({ kind, at, textBn }) });
export const sendReview = (recommend: boolean, reasons: string[]) =>
  call('/api/groups/review', { method: 'POST', body: JSON.stringify({ recommend, reasons }) });
export const leaveGroup = () => { localStorage.removeItem(KEY); window.dispatchEvent(new Event('moallem:group')); };

export function useGroup() {
  const [mine, setMine] = useState<Mine | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = () => {
      if (!groupToken()) { setMine(null); setLoaded(true); return; }
      call<Mine>('/api/groups/mine').then((m) => { if (alive) { setMine(m); setLoaded(true); } })
        .catch((e) => { if (e.status === 401) leaveGroup(); setLoaded(true); });
    };
    load();
    const id = setInterval(load, 20000);
    window.addEventListener('moallem:group', load);
    return () => { alive = false; clearInterval(id); window.removeEventListener('moallem:group', load); };
  }, []);
  return { mine, loaded, reload: () => window.dispatchEvent(new Event('moallem:group')) };
}

/** The notice that matters next: the soonest upcoming timed one, else the newest. */
export function nextNotice(notices: Notice[], now = Date.now()): Notice | null {
  const upcoming = notices.filter((n) => n.at && n.at > now - 30 * 60000).sort((a, b) => a.at! - b.at!);
  return upcoming[0] ?? notices[0] ?? null;
}
