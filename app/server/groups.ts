// Moallem groups: the group leader posts notices once (bus, wake-up, meeting point) and every
// haji in the group hears them. After Hajj each haji answers one question: would you recommend
// this Moallem to another haji? In-memory now; maps to Supabase tables groups/members/notices/reviews.
import { randomBytes, randomInt } from 'node:crypto';

export type NoticeKind = 'bus' | 'wake' | 'meet' | 'info';
export interface Notice { id: string; kind: NoticeKind; at: number | null; textBn: string; createdAt: number }
export interface Member { id: string; token: string; name: string; joinedAt: number }
export interface Review { memberId: string; recommend: boolean; reasons: string[]; at: number }
export interface Group {
  code: string; leaderToken: string; leaderName: string; agency: string; phone: string;
  members: Map<string, Member>; notices: Notice[]; reviews: Map<string, Review>;
}

const groups = new Map<string, Group>();
const memberIndex = new Map<string, string>();
const tok = () => randomBytes(18).toString('base64url');

export function createGroup(leaderName: string, agency: string, phone = '', code?: string): Group {
  let c = code ?? String(randomInt(100000, 1000000));
  while (!code && groups.has(c)) c = String(randomInt(100000, 1000000));
  const g: Group = { code: c, leaderToken: tok(), leaderName: leaderName.slice(0, 40) || 'মোয়াল্লেম', agency: agency.slice(0, 60), phone: phone.slice(0, 20),
    members: new Map(), notices: [], reviews: new Map() };
  groups.set(c, g);
  return g;
}

export const getGroup = (code: string) => groups.get(code);

export function joinGroup(g: Group, name: string): Member {
  const m: Member = { id: tok().slice(0, 8), token: tok(), name: name.slice(0, 40) || 'হাজী', joinedAt: Date.now() };
  g.members.set(m.token, m);
  memberIndex.set(m.token, g.code);
  return m;
}

export function findMember(token: string) {
  const g = groups.get(memberIndex.get(token) ?? '');
  const m = g?.members.get(token);
  return g && m ? { group: g, member: m } : null;
}

export function findLeader(token: string) {
  for (const g of groups.values()) if (g.leaderToken === token) return g;
  return null;
}

export function postNotice(g: Group, n: { kind: NoticeKind; at: number | null; textBn: string }) {
  const notice: Notice = { id: tok().slice(0, 10), kind: n.kind, at: n.at, textBn: n.textBn.slice(0, 200), createdAt: Date.now() };
  g.notices.push(notice);
  if (g.notices.length > 100) g.notices.shift();
  return notice;
}

export function review(g: Group, memberId: string, recommend: boolean, reasons: string[]) {
  g.reviews.set(memberId, { memberId, recommend, reasons: reasons.slice(0, 6).map((r) => r.slice(0, 40)), at: Date.now() });
}

/** Share of hajis who would recommend this Moallem, plus the most common reasons. */
export function reviewSummary(g: Group) {
  const all = [...g.reviews.values()];
  const yes = all.filter((r) => r.recommend).length;
  const counts = new Map<string, number>();
  all.forEach((r) => r.reasons.forEach((x) => counts.set(x, (counts.get(x) ?? 0) + 1)));
  return {
    total: all.length,
    recommendPct: all.length ? Math.round((yes / all.length) * 100) : null,
    topReasons: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([reason, n]) => ({ reason, n })),
  };
}

export function publicGroup(g: Group) {
  return {
    code: g.code, leaderName: g.leaderName, agency: g.agency, phone: g.phone, members: g.members.size,
    notices: [...g.notices].sort((a, b) => b.createdAt - a.createdAt).slice(0, 30), reviews: reviewSummary(g),
  };
}

export const DEMO_GROUP = '313313';

/** A believable group so the demo has a Moallem with real-looking notices. */
export function seedDemoGroup() {
  if (groups.has(DEMO_GROUP)) return;
  const g = createGroup('মাওলানা আব্দুর রহমান', 'আল-মদিনা হজ কাফেলা (ডেমো)', '+966 50 000 0000', DEMO_GROUP);
  const today = new Date();
  const at = (dayOffset: number, h: number, m = 0) => {
    // Makkah is UTC+3
    const d = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + dayOffset, h - 3, m);
    return d;
  };
  const now = Date.now();
  g.notices.push(
    { id: 'n1', kind: 'meet', at: at(0, 20, 30), textBn: 'এশার পর ৭৯ নম্বর গেটের সামনে সবাই একসাথে', createdAt: now - 5 * 3600e3 },
    { id: 'n2', kind: 'wake', at: at(1, 3, 30), textBn: 'তাহাজ্জুদের জন্য উঠবেন, ব্যাগ গুছিয়ে রাখবেন', createdAt: now - 3 * 3600e3 },
    { id: 'n3', kind: 'bus', at: at(1, 7, 0), textBn: 'মিনার বাস হোটেলের সামনে থেকে ছাড়বে। ইহরাম পরে আসবেন', createdAt: now - 3600e3 },
  );
  ['রহিম উদ্দিন', 'আমেনা খাতুন', 'আব্দুল করিম'].forEach((n) => joinGroup(g, n));
  [...g.members.values()].slice(0, 2).forEach((m, i) => review(g, m.id, true, i ? ['সময়মতো খবর দেন'] : ['সময়মতো খবর দেন', 'মিনায় পাশে ছিলেন']));
}
