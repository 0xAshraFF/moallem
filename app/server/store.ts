// In-memory Family Circle store. Swap for Supabase tables later:
// circles -> family_circles, beats -> location_beats, events -> circle_events, viewers -> circle_viewers.
import { randomBytes, randomInt } from 'node:crypto';

export type PlanId = 'single' | 'family' | 'abroad';

export interface Beat {
  lat: number;
  lng: number;
  accuracy: number;
  battery: number | null; // 0..1, null when the phone does not report it
  stage: string; // ritual stage id, e.g. "arafat9"
  ts: number; // ms epoch, when the phone took the reading
}

export interface CircleEvent {
  id: string;
  kind: 'ritual' | 'zone' | 'sos' | 'info';
  label: string; // Bangla
  labelEn: string;
  ts: number;
}

export interface Viewer {
  id: string; // public id shown to the pilgrim; the token stays secret
  token: string;
  name: string;
  joinedAt: number;
  status: 'pending' | 'approved';
}

export interface Circle {
  code: string; // 6 digits, what the pilgrim reads out to family
  pilgrimToken: string;
  pilgrimName: string;
  createdAt: number;
  paused: boolean;
  trail: Beat[]; // newest last, capped
  events: CircleEvent[]; // newest last, capped
  viewers: Map<string, Viewer>;
  subscription: { plan: PlanId; until: number } | null;
  trialEndsAt: number | null; // starts when the first location arrives
  okAt: number | null; // last free "I'm OK" check-in
  inviteExpiresAt: number; // the 6-digit code only accepts new relatives until this time
  demo: boolean;
}

export const TRIAL_MS = 24 * 60 * 60 * 1000;
export const SEASON_MS = 45 * 24 * 60 * 60 * 1000;
export const INVITE_MS = 15 * 60 * 1000;
const TRAIL_CAP = 240;
const EVENT_CAP = 60;

export const PLANS: Record<PlanId, { priceLabel: string; viewers: number }> = {
  single: { priceLabel: '৳299', viewers: 1 },
  family: { priceLabel: '৳499', viewers: 5 },
  abroad: { priceLabel: '$9.99', viewers: 5 },
};

const circles = new Map<string, Circle>();
const viewerIndex = new Map<string, string>(); // viewer token -> circle code

export function findByViewer(viewerToken: string): { circle: Circle; viewer: Viewer } | null {
  const code = viewerIndex.get(viewerToken);
  const circle = code ? circles.get(code) : undefined;
  const viewer = circle?.viewers.get(viewerToken);
  return circle && viewer ? { circle, viewer } : null;
}

export const viewerById = (c: Circle, id: string) => [...c.viewers.values()].find((v) => v.id === id);
type Listener = (c: Circle, change: 'beat' | 'event' | 'state') => void;
const listeners = new Map<string, Set<Listener>>();

const token = () => randomBytes(18).toString('base64url');

function newCode(): string {
  for (;;) {
    const code = String(randomInt(100000, 1000000));
    if (!circles.has(code)) return code;
  }
}

export function createCircle(pilgrimName: string, fixedCode?: string, opts: { demo?: boolean } = {}): Circle {
  const now = Date.now();
  const circle: Circle = {
    code: fixedCode ?? newCode(),
    pilgrimToken: token(),
    pilgrimName: pilgrimName.trim().slice(0, 40) || 'হাজী',
    createdAt: now,
    paused: false,
    trail: [],
    events: [],
    viewers: new Map(),
    subscription: null,
    trialEndsAt: null,
    okAt: null,
    inviteExpiresAt: opts.demo ? Number.MAX_SAFE_INTEGER : now + INVITE_MS,
    demo: !!opts.demo,
  };
  circles.set(circle.code, circle);
  return circle;
}

export const getCircle = (code: string) => circles.get(code);

export function addBeat(c: Circle, beat: Beat) {
  if (c.paused) return;
  if (c.trialEndsAt === null) c.trialEndsAt = beat.ts + TRIAL_MS;
  c.trail.push(beat);
  if (c.trail.length > TRAIL_CAP) c.trail.splice(0, c.trail.length - TRAIL_CAP);
  emit(c, 'beat');
}

export function addEvent(c: Circle, e: Omit<CircleEvent, 'id'>) {
  // keep events in time order even when history is seeded
  const at = c.events.findIndex((x) => x.ts > e.ts);
  if (at !== -1) { c.events.splice(at, 0, { ...e, id: token().slice(0, 10) }); emit(c, 'event'); return; }
  c.events.push({ ...e, id: token().slice(0, 10) });
  if (c.events.length > EVENT_CAP) c.events.splice(0, c.events.length - EVENT_CAP);
  emit(c, 'event');
}

/** SOS always reaches family with a location, even when sharing is paused or unpaid. */
export function raiseSos(c: Circle, beat: Beat | null, now = Date.now()) {
  if (beat) { c.trail.push(beat); }
  addEvent(c, { kind: 'sos', label: 'সাহায্য দরকার (SOS)', labelEn: 'SOS: needs help', ts: now });
}

export function setPaused(c: Circle, paused: boolean) {
  c.paused = paused;
  emit(c, 'state');
}

export function inviteOpen(c: Circle, now = Date.now()) {
  return c.inviteExpiresAt > now;
}

export function renewInvite(c: Circle) {
  if (!c.demo) c.inviteExpiresAt = Date.now() + INVITE_MS;
}

/** A relative asks to join. They see nothing until the pilgrim approves them by name. */
export function joinCircle(c: Circle, name: string): Viewer {
  const v: Viewer = {
    id: token().slice(0, 8), token: token(), name: name.trim().slice(0, 40) || 'পরিবার', joinedAt: Date.now(), status: 'pending',
  };
  c.viewers.set(v.token, v);
  viewerIndex.set(v.token, c.code);
  emit(c, 'state');
  return v;
}

export function approveViewer(c: Circle, viewerToken: string) {
  const v = c.viewers.get(viewerToken);
  if (!v || v.status === 'approved') return;
  v.status = 'approved';
  emit(c, 'state');
}

export function removeViewer(c: Circle, viewerToken: string) {
  c.viewers.delete(viewerToken);
  viewerIndex.delete(viewerToken);
  emit(c, 'state');
}

/** Free forever: one tap "I'm OK" that every approved relative sees. */
export function checkInOk(c: Circle, now = Date.now()) {
  c.okAt = now;
  addEvent(c, { kind: 'info', label: 'আমি ভালো আছি', labelEn: "I'm OK", ts: now });
}

export function subscribe(c: Circle, plan: PlanId) {
  c.subscription = { plan, until: Date.now() + SEASON_MS };
  emit(c, 'state');
}

/** Live map + timeline: during the trial (or before the first fix) or with a Season Pass. */
export function hasAccess(c: Circle, now = Date.now()): boolean {
  if (c.subscription && c.subscription.until > now) return true;
  return c.trialEndsAt === null || c.trialEndsAt > now;
}

const FREE_KINDS = new Set(['sos']);

/**
 * What a family viewer may see. SOS and "I'm OK" are free forever (safety is never paywalled);
 * the live map, battery and ritual timeline need the trial or a Season Pass.
 */
export function viewerStatus(c: Circle, now = Date.now()) {
  const last = c.trail[c.trail.length - 1] ?? null;
  const access = hasAccess(c, now);
  return {
    code: c.code,
    okAt: c.okAt,
    pilgrimName: c.pilgrimName,
    paused: c.paused,
    access,
    trialEndsAt: c.trialEndsAt,
    subscription: c.subscription,
    viewers: c.viewers.size,
    lastSeenAt: last?.ts ?? null,
    last: access ? last : null,
    trail: access ? c.trail.slice(-120) : [],
    events: access ? c.events.slice(-30) : c.events.filter((e) => FREE_KINDS.has(e.kind)).slice(-3),
    sosLocation: !access && c.events.some((e) => e.kind === 'sos' && now - e.ts < 6 * 3600e3) ? last : null,
  };
}

export function onChange(code: string, fn: Listener) {
  if (!listeners.has(code)) listeners.set(code, new Set());
  listeners.get(code)!.add(fn);
  return () => listeners.get(code)?.delete(fn);
}

function emit(c: Circle, change: 'beat' | 'event' | 'state') {
  listeners.get(c.code)?.forEach((fn) => fn(c, change));
}

/** Test helper. */
export function _reset() {
  circles.clear();
  viewerIndex.clear();
  listeners.clear();
}
