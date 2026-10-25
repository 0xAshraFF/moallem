import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createApp, _resetAttempts } from './app';
import { _reset, getCircle, TRIAL_MS } from './store';

let base = '';
const server = createApp().listen(0);
base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
test.after(() => server.close());
beforeEach(() => { _reset(); _resetAttempts(); });

async function j(path: string, body?: unknown, token?: string, method = body ? 'POST' : 'GET') {
  const r = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}

async function setup() {
  const c = (await j('/api/circles', { pilgrimName: 'আব্বা' })).body;
  const v = (await j('/api/watch/join', { code: c.code, name: 'রহিম' })).body;
  return { c, v };
}

test('relative sees nothing until the pilgrim approves them by name', async () => {
  const { c, v } = await setup();
  assert.equal((await j('/api/watch/status', undefined, v.viewerToken)).body.viewerStatus, 'pending');
  const me = (await j(`/api/circles/${c.code}/me`, undefined, c.pilgrimToken)).body;
  assert.equal(me.viewers[0].name, 'রহিম');
  await j(`/api/circles/${c.code}/viewers/${me.viewers[0].id}/approve`, {}, c.pilgrimToken);
  assert.equal((await j('/api/watch/status', undefined, v.viewerToken)).body.viewerStatus, 'approved');
});

test('pilgrim routes need the pilgrim token', async () => {
  const { c, v } = await setup();
  assert.equal((await j(`/api/circles/${c.code}/me`, undefined, v.viewerToken)).status, 401);
});

test('beats: replays and out-of-order are handled, last is newest', async () => {
  const { c } = await setup();
  const b = (ts: number) => ({ lat: 21.35, lng: 39.98, accuracy: 10, battery: 0.5, stage: 'arafat9', ts });
  await j(`/api/circles/${c.code}/beats`, { beats: [b(3000), b(1000), b(2000)] }, c.pilgrimToken);
  await j(`/api/circles/${c.code}/beats`, { beats: [b(2000)] }, c.pilgrimToken);
  const circle = getCircle(c.code)!;
  assert.deepEqual(circle.trail.map((x) => x.ts), [1000, 2000, 3000]);
});

test('after the trial, map is locked but SOS still reaches family with location', async () => {
  const { c, v } = await setup();
  const me = (await j(`/api/circles/${c.code}/me`, undefined, c.pilgrimToken)).body;
  await j(`/api/circles/${c.code}/viewers/${me.viewers[0].id}/approve`, {}, c.pilgrimToken);
  await j(`/api/circles/${c.code}/beats`, { beats: [{ lat: 21.35, lng: 39.98, accuracy: 10, battery: 0.5, stage: 'x', ts: Date.now() }] }, c.pilgrimToken);
  getCircle(c.code)!.trialEndsAt = Date.now() - 1; // trial over
  let s = (await j('/api/watch/status', undefined, v.viewerToken)).body;
  assert.equal(s.access, false);
  assert.equal(s.last, null);
  await j(`/api/circles/${c.code}/sos`, { beat: { lat: 21.36, lng: 39.97, accuracy: 8, battery: 0.4, stage: 'x', ts: Date.now() } }, c.pilgrimToken);
  s = (await j('/api/watch/status', undefined, v.viewerToken)).body;
  assert.equal(s.events.at(-1).kind, 'sos');
  assert.ok(s.sosLocation, 'SOS location is free');
  await j('/api/watch/pass', { plan: 'single', method: 'bkash' }, v.viewerToken);
  s = (await j('/api/watch/status', undefined, v.viewerToken)).body;
  assert.equal(s.access, true);
});

test('trial starts at the first location, not at signup', async () => {
  const { c } = await setup();
  assert.equal(getCircle(c.code)!.trialEndsAt, null);
  const ts = Date.now();
  await j(`/api/circles/${c.code}/beats`, { beats: [{ lat: 21.35, lng: 39.98, accuracy: 10, battery: null, stage: 'x', ts }] }, c.pilgrimToken);
  assert.equal(getCircle(c.code)!.trialEndsAt, ts + TRIAL_MS);
});

test('expired invite code is refused', async () => {
  const c = (await j('/api/circles', { pilgrimName: 'আম্মা' })).body;
  getCircle(c.code)!.inviteExpiresAt = Date.now() - 1;
  assert.equal((await j('/api/watch/join', { code: c.code, name: 'x' })).status, 410);
});

test('code guessing is rate limited', async () => {
  let last = 0;
  for (let i = 0; i < 7; i++) last = (await j('/api/watch/join', { code: '000000', name: 'x' })).status;
  assert.equal(last, 429);
});

test('Moallem posts a notice once and every haji in the group sees it', async () => {
  const g = (await j('/api/groups', { leaderName: 'মাওলানা রহমান', agency: 'টেস্ট' })).body;
  const code = (await j('/api/groups/mine', undefined, g.leaderToken)).body.group.code;
  const m = (await j('/api/groups/join', { code, name: 'করিম' })).body;
  await j('/api/groups/notices', { kind: 'bus', at: Date.now() + 3600e3, textBn: 'হোটেলের সামনে' }, g.leaderToken);
  const seen = (await j('/api/groups/mine', undefined, m.memberToken)).body;
  assert.equal(seen.role, 'member');
  assert.equal(seen.group.notices[0].kind, 'bus');
});

test('only the Moallem can post notices', async () => {
  const g = (await j('/api/groups', { leaderName: 'x', agency: 'y' })).body;
  const code = (await j('/api/groups/mine', undefined, g.leaderToken)).body.group.code;
  const m = (await j('/api/groups/join', { code, name: 'করিম' })).body;
  assert.equal((await j('/api/groups/notices', { kind: 'bus', at: null, textBn: 'x' }, m.memberToken)).status, 401);
});

test('recommend question: one answer per haji, summarised for the Moallem', async () => {
  const g = (await j('/api/groups', { leaderName: 'x', agency: 'y' })).body;
  const code = (await j('/api/groups/mine', undefined, g.leaderToken)).body.group.code;
  const a = (await j('/api/groups/join', { code, name: 'a' })).body;
  const b = (await j('/api/groups/join', { code, name: 'b' })).body;
  await j('/api/groups/review', { recommend: true, reasons: ['সময়মতো খবর দেন'] }, a.memberToken);
  await j('/api/groups/review', { recommend: false, reasons: [] }, b.memberToken);
  await j('/api/groups/review', { recommend: true, reasons: [] }, b.memberToken); // changed mind: replaces, not adds
  const s = (await j('/api/groups/mine', undefined, g.leaderToken)).body.group.reviews;
  assert.equal(s.total, 2);
  assert.equal(s.recommendPct, 100);
});
