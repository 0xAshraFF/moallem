import express, { type Request, type Response, type NextFunction } from 'express';
import { randomBytes } from 'node:crypto';
import {
  PLANS, addBeat, addEvent, approveViewer, checkInOk, createCircle, findByViewer, getCircle, inviteOpen,
  joinCircle, onChange, raiseSos, removeViewer, renewInvite, setPaused, subscribe, viewerById, viewerStatus,
  type Beat, type Circle, type PlanId,
} from './store';
import { answerOffline, NEEDS } from '../src/domain/intents';
import {
  createGroup, findLeader, findMember, getGroup, joinGroup, postNotice, publicGroup, review, type NoticeKind,
} from './groups';
import { parseTicketImage } from './ticket';
import { recordAnswer, popularAnswers } from './answers';

const bearer = (req: Request) => (req.headers.authorization || '').replace(/^Bearer\s+/i, '');

function validBeat(b: unknown): b is Beat {
  const x = b as Beat;
  return !!x && Number.isFinite(x.lat) && Number.isFinite(x.lng) && Math.abs(x.lat) <= 90 && Math.abs(x.lng) <= 180
    && Number.isFinite(x.ts) && (x.battery === null || (x.battery >= 0 && x.battery <= 1));
}

/** Join codes are 6 digits, so guesses are limited per IP. */
const attempts = new Map<string, { n: number; since: number }>();
export function tooManyAttempts(ip: string, now = Date.now()) {
  const a = attempts.get(ip);
  if (!a || now - a.since > 10 * 60_000) { attempts.set(ip, { n: 0, since: now }); return false; }
  return a.n >= 5;
}
const failAttempt = (ip: string) => { const a = attempts.get(ip); if (a) a.n++; };
/** Test helper. */
export const _resetAttempts = () => attempts.clear();

const tickets = new Map<string, { viewerToken: string; exp: number }>();

export function createApp() {
  const app = express();
  const smallJson = express.json({ limit: '200kb' });
  app.use((req, res, next) => (req.path === '/api/ticket/parse' ? next() : smallJson(req, res, next)));

  // ---------- Pilgrim ----------
  app.post('/api/circles', (req, res) => {
    const c = createCircle(String(req.body?.pilgrimName ?? ''));
    res.json({ code: c.code, pilgrimToken: c.pilgrimToken, inviteExpiresAt: c.inviteExpiresAt });
  });

  const pilgrim = (req: Request, res: Response, next: NextFunction) => {
    const c = getCircle(req.params.code);
    if (!c || bearer(req) !== c.pilgrimToken) return void res.status(401).json({ error: 'unauthorized' });
    res.locals.circle = c;
    next();
  };
  const C = (res: Response) => res.locals.circle as Circle;

  app.get('/api/circles/:code/me', pilgrim, (_req, res) => {
    const c = C(res);
    res.json({
      code: c.code, paused: c.paused, inviteExpiresAt: c.inviteExpiresAt, okAt: c.okAt,
      viewers: [...c.viewers.values()].map((v) => ({ id: v.id, name: v.name, status: v.status })),
    });
  });

  app.post('/api/circles/:code/beats', pilgrim, (req, res) => {
    const beats: unknown[] = Array.isArray(req.body?.beats) ? req.body.beats.slice(0, 50) : [];
    const now = Date.now();
    const ok = beats.filter(validBeat).map((b) => ({ ...b, ts: Math.min(b.ts, now) })).sort((a, b) => a.ts - b.ts);
    const c = C(res);
    const lastTs = c.trail[c.trail.length - 1]?.ts ?? 0;
    ok.filter((b) => b.ts > lastTs).forEach((b) => addBeat(c, b)); // idempotent: replays are ignored
    res.json({ accepted: ok.length });
  });

  app.post('/api/circles/:code/viewers/:id/approve', pilgrim, (req, res) => {
    const v = viewerById(C(res), req.params.id);
    if (!v) return void res.status(404).json({ error: 'not_found' });
    approveViewer(C(res), v.token);
    res.json({ ok: true });
  });
  app.delete('/api/circles/:code/viewers/:id', pilgrim, (req, res) => {
    const v = viewerById(C(res), req.params.id);
    if (v) removeViewer(C(res), v.token);
    res.json({ ok: true });
  });
  app.post('/api/circles/:code/ok', pilgrim, (_req, res) => { checkInOk(C(res)); res.json({ ok: true }); });
  app.post('/api/circles/:code/pause', pilgrim, (req, res) => { setPaused(C(res), !!req.body?.paused); res.json({ paused: C(res).paused }); });
  app.post('/api/circles/:code/invite', pilgrim, (_req, res) => { renewInvite(C(res)); res.json({ inviteExpiresAt: C(res).inviteExpiresAt }); });
  app.post('/api/circles/:code/sos', pilgrim, (req, res) => {
    raiseSos(C(res), validBeat(req.body?.beat) ? req.body.beat : null);
    res.json({ ok: true });
  });
  app.post('/api/circles/:code/events', pilgrim, (req, res) => {
    const label = String(req.body?.label ?? '').slice(0, 80);
    if (!label) return void res.status(400).json({ error: 'label_required' });
    addEvent(C(res), { kind: 'ritual', label, labelEn: String(req.body?.labelEn ?? '').slice(0, 80), ts: Date.now() });
    res.json({ ok: true });
  });

  // ---------- Family ----------
  app.post('/api/watch/join', (req, res) => {
    const ip = req.ip || 'x';
    if (tooManyAttempts(ip)) return void res.status(429).json({ error: 'rate_limited' });
    const code = String(req.body?.code ?? '').replace(/\D/g, '');
    const c = getCircle(code);
    if (!c) { failAttempt(ip); return void res.status(404).json({ error: 'invalid_code' }); }
    if (!inviteOpen(c)) return void res.status(410).json({ error: 'expired' });
    const max = c.subscription ? PLANS[c.subscription.plan].viewers : 5;
    if (c.viewers.size >= max) return void res.status(409).json({ error: 'viewer_limit' });
    const v = joinCircle(c, String(req.body?.name ?? ''));
    res.json({ viewerToken: v.token, pilgrimName: c.pilgrimName, status: v.status });
  });

  const viewer = (req: Request, res: Response, next: NextFunction) => {
    const found = findByViewer(bearer(req));
    if (!found) return void res.status(401).json({ error: 'unauthorized' });
    res.locals.circle = found.circle;
    res.locals.viewer = found.viewer;
    next();
  };

  const statusFor = (res: Response) => {
    const v = res.locals.viewer;
    if (v.status !== 'approved') return { viewerStatus: 'pending', pilgrimName: C(res).pilgrimName };
    return { viewerStatus: 'approved', viewerName: v.name, ...viewerStatus(C(res)) };
  };

  app.get('/api/watch/status', viewer, (_req, res) => res.json(statusFor(res)));

  app.post('/api/watch/pass', viewer, (req, res) => {
    const plan = req.body?.plan as PlanId;
    if (!(plan in PLANS)) return void res.status(400).json({ error: 'bad_plan' });
    subscribe(C(res), plan); // mock payment: bKash / Nagad / card sandbox goes here
    res.json(statusFor(res));
  });

  // EventSource can't send headers, so viewers trade their token for a 60 s one-time ticket.
  app.post('/api/watch/stream-ticket', viewer, (req, res) => {
    const ticket = randomBytes(16).toString('base64url');
    tickets.set(ticket, { viewerToken: bearer(req), exp: Date.now() + 60_000 });
    res.json({ ticket });
  });

  app.get('/api/watch/stream', (req, res) => {
    const t = tickets.get(String(req.query.ticket ?? ''));
    tickets.delete(String(req.query.ticket ?? ''));
    const found = t && t.exp > Date.now() ? findByViewer(t.viewerToken) : null;
    if (!found) return void res.status(401).end();
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    res.write('retry: 3000\n\n');
    const locals = { circle: found.circle, viewer: found.viewer };
    const send = () => res.write(`event: status\ndata: ${JSON.stringify(statusFor({ locals } as unknown as Response))}\n\n`);
    send();
    const off = onChange(found.circle.code, send);
    const ping = setInterval(() => res.write(': ping\n\n'), 25_000);
    req.on('close', () => { off(); clearInterval(ping); });
  });

  // ---------- Moallem groups ----------
  app.post('/api/groups', (req, res) => {
    const g = createGroup(String(req.body?.leaderName ?? ''), String(req.body?.agency ?? ''), String(req.body?.phone ?? ''));
    res.json({ code: g.code, leaderToken: g.leaderToken });
  });
  app.post('/api/groups/join', (req, res) => {
    const ip = req.ip || 'x';
    if (tooManyAttempts(ip)) return void res.status(429).json({ error: 'rate_limited' });
    const g = getGroup(String(req.body?.code ?? '').replace(/D/g, ''));
    if (!g) { failAttempt(ip); return void res.status(404).json({ error: 'invalid_code' }); }
    const m = joinGroup(g, String(req.body?.name ?? ''));
    res.json({ memberToken: m.token, memberId: m.id, group: publicGroup(g) });
  });
  app.get('/api/groups/mine', (req, res) => {
    const t = bearer(req);
    const asLeader = findLeader(t);
    if (asLeader) return void res.json({ role: 'leader', group: publicGroup(asLeader) });
    const found = findMember(t);
    if (!found) return void res.status(401).json({ error: 'unauthorized' });
    res.json({ role: 'member', memberId: found.member.id, reviewed: found.group.reviews.has(found.member.id), group: publicGroup(found.group) });
  });
  app.post('/api/groups/notices', (req, res) => {
    const g = findLeader(bearer(req));
    if (!g) return void res.status(401).json({ error: 'leader_only' });
    const kind = String(req.body?.kind) as NoticeKind;
    if (!['bus', 'wake', 'meet', 'info'].includes(kind)) return void res.status(400).json({ error: 'bad_kind' });
    const at = req.body?.at === null || req.body?.at === undefined ? null : Number(req.body.at);
    res.json(postNotice(g, { kind, at: Number.isFinite(at) ? at : null, textBn: String(req.body?.textBn ?? '') }));
  });
  app.post('/api/groups/review', (req, res) => {
    const found = findMember(bearer(req));
    if (!found) return void res.status(401).json({ error: 'unauthorized' });
    review(found.group, found.member.id, !!req.body?.recommend, Array.isArray(req.body?.reasons) ? req.body.reasons.map(String) : []);
    res.json({ ok: true });
  });

  // ---------- Ticket photo -> flights (Gemini vision when a key is set) ----------
  app.post('/api/ticket/parse', express.json({ limit: '8mb' }), async (req, res) => {
    const img = String(req.body?.imageBase64 ?? '');
    if (!img) return void res.status(400).json({ error: 'image_required' });
    const r = await parseTicketImage(img, String(req.body?.mimeType ?? 'image/jpeg'));
    if ('error' in r) return void res.status(r.error === 'no_ai' ? 501 : 502).json(r);
    res.json(r);
  });

  // ---------- Ask: offline answers, shared so every haji can download them ----------
  app.post('/api/ask', (req, res) => {
    const text = String(req.body?.text ?? '').slice(0, 500);
    const a = answerOffline(text);
    recordAnswer(text, a);
    res.json({ ...a, source: 'offline' });
  });
  app.get('/api/answers/popular', (_req, res) => res.json(popularAnswers(40)));
  app.get('/api/needs', (_req, res) => res.json(NEEDS));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  return app;
}
