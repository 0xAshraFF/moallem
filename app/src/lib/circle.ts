// Pilgrim side of Family Circle. Keeps the circle token on the phone, sends location
// heartbeats, and queues them while the network in Mina/Arafah is down.
import { useEffect, useState } from 'react';
import { bnDigits } from './format';

const KEY = 'moallem.circle';
const QUEUE_KEY = 'moallem.beatQueue';
const QUEUE_CAP = 300;

export interface MyCircle { code: string; token: string }
export interface ViewerInfo { id: string; name: string; status: 'pending' | 'approved' }
export interface CircleMe {
  code: string; paused: boolean; inviteExpiresAt: number; okAt: number | null; viewers: ViewerInfo[];
}
export interface Beat { lat: number; lng: number; accuracy: number; battery: number | null; stage: string; ts: number }

export function myCircle(): MyCircle | null {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const c = myCircle();
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(c ? { Authorization: `Bearer ${c.token}` } : {}), ...(init.headers || {}) },
  });
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  return res.json() as Promise<T>;
}

export async function createCircle(pilgrimName: string): Promise<MyCircle> {
  const r = await call<{ code: string; pilgrimToken: string }>('/api/circles', { method: 'POST', body: JSON.stringify({ pilgrimName }) });
  const c = { code: r.code, token: r.pilgrimToken };
  localStorage.setItem(KEY, JSON.stringify(c));
  window.dispatchEvent(new Event('moallem:circle'));
  return c;
}

export const getMe = () => call<CircleMe>(`/api/circles/${myCircle()?.code}/me`);
export const approve = (id: string) => call(`/api/circles/${myCircle()?.code}/viewers/${id}/approve`, { method: 'POST' });
export const removeViewer = (id: string) => call(`/api/circles/${myCircle()?.code}/viewers/${id}`, { method: 'DELETE' });
export const sayOk = () => call(`/api/circles/${myCircle()?.code}/ok`, { method: 'POST' });
export const setPaused = (paused: boolean) => call(`/api/circles/${myCircle()?.code}/pause`, { method: 'POST', body: JSON.stringify({ paused }) });
export const renewInvite = () => call<{ inviteExpiresAt: number }>(`/api/circles/${myCircle()?.code}/invite`, { method: 'POST' });
export const logRitual = (label: string, labelEn: string) =>
  myCircle() ? call(`/api/circles/${myCircle()!.code}/events`, { method: 'POST', body: JSON.stringify({ kind: 'ritual', label, labelEn }) }).catch(() => {}) : Promise.resolve();

/** SOS always tries to send, with the freshest location we have. */
export async function sendSos(): Promise<boolean> {
  if (!myCircle()) return false;
  const beat = await currentBeat('sos').catch(() => null);
  try {
    await call(`/api/circles/${myCircle()!.code}/sos`, { method: 'POST', body: JSON.stringify({ beat }) });
    return true;
  } catch {
    return false;
  }
}

async function batteryLevel(): Promise<number | null> {
  try {
    const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number }> };
    return nav.getBattery ? (await nav.getBattery()).level : null; // Safari/Firefox: unknown, never 0
  } catch {
    return null;
  }
}

function currentBeat(stage: string): Promise<Beat> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('no geolocation'));
    navigator.geolocation.getCurrentPosition(async (p) => resolve({
      lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy,
      battery: await batteryLevel(), stage, ts: Date.now(),
    }), reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  });
}

function readQueue(): Beat[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}
function writeQueue(q: Beat[]) {
  // When full, thin out old beats (keep 1 in 3) so recent history survives.
  if (q.length > QUEUE_CAP) q = [...q.slice(0, -100).filter((_, i) => i % 3 === 0), ...q.slice(-100)];
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* storage full */ }
}

export async function flushQueue() {
  const q = readQueue();
  if (!q.length || !myCircle()) return;
  try {
    await call(`/api/circles/${myCircle()!.code}/beats`, { method: 'POST', body: JSON.stringify({ beats: q.slice(0, 50) }) });
    writeQueue(readQueue().slice(Math.min(50, q.length)));
  } catch { /* keep for next time */ }
}

/** Sends a heartbeat every few minutes while sharing is on. Native foreground service replaces this in the APK. */
export function startHeartbeats(stage: () => string, everyMs = 3 * 60_000) {
  const tick = async () => {
    if (!myCircle()) return;
    try {
      const beat = await currentBeat(stage());
      writeQueue([...readQueue(), beat]);
    } catch { /* GPS off or denied: family sees "location off" */ }
    await flushQueue();
  };
  tick();
  const id = setInterval(tick, everyMs);
  const online = () => flushQueue();
  window.addEventListener('online', online);
  return () => { clearInterval(id); window.removeEventListener('online', online); };
}

/** Small summary for the Today screen. */
export function useCircleSummary() {
  const [me, setMe] = useState<CircleMe | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => { if (myCircle()) getMe().then((m) => alive && setMe(m)).catch(() => {}); };
    load();
    const id = setInterval(load, 15000);
    window.addEventListener('moallem:circle', load);
    return () => { alive = false; clearInterval(id); window.removeEventListener('moallem:circle', load); };
  }, []);
  const approved = me?.viewers.filter((v) => v.status === 'approved').length ?? 0;
  return { me, approved, approvedBn: bnDigits(approved), paused: !!me?.paused };
}
