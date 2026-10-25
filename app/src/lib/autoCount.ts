// Automatic Tawaf / Sa'i counting. Feeds the phone's compass, GPS and steps into the pure trackers
// (domain/tawafTracker.ts, domain/saiTracker.ts). Demo mode replays a realistic simulated walk.
import { useCallback, useEffect, useRef, useState } from 'react';
import { BLACK_STONE_BEARING_DEG, KAABA_CENTER } from '../domain/haramGeo';
import { createSaiTracker, type SaiState } from '../domain/saiTracker';
import { replaySamples, simulateSai, simulateTawaf } from '../domain/sensorSim';
import { createTawafTracker, type MotionSample, type TawafState } from '../domain/tawafTracker';

export type CountState = Pick<TawafState, 'rounds' | 'progress' | 'confidence' | 'source'> & { warnings: string[] };
type Tracker = { push(s: MotionSample): void; state(): TawafState | SaiState; manualAdd(d: 1 | -1): void; reset(): void };

const IDLE: CountState = { rounds: 0, progress: 0, confidence: 'low', source: 'manual', warnings: [] };

/** Simple step detector: a peak in acceleration magnitude above gravity, at most ~3 per second. */
function stepDetector(onStep: () => void) {
  let last = 0, high = false;
  const on = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x === null || a.y === null || a.z === null) return;
    const mag = Math.hypot(a.x, a.y, a.z);
    const now = Date.now();
    if (!high && mag > 11.2 && now - last > 330) { high = true; last = now; onStep(); }
    if (high && mag < 10.2) high = false;
  };
  window.addEventListener('devicemotion', on);
  return () => window.removeEventListener('devicemotion', on);
}

async function askSensorPermission() {
  const D = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
  const M = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
  try { await D.requestPermission?.(); } catch { /* not iOS */ }
  try { await M.requestPermission?.(); } catch { /* not iOS */ }
}

export function useAutoCount(kind: 'tawaf' | 'sai', onRound: (rounds: number) => void) {
  const tracker = useRef<Tracker | null>(null);
  const stops = useRef<Array<() => void>>([]);
  const [state, setState] = useState<CountState>(IDLE);
  const [mode, setMode] = useState<'off' | 'live' | 'demo'>('off');
  const lastRounds = useRef(0);
  const onRoundRef = useRef(onRound);
  onRoundRef.current = onRound;

  const make = useCallback((): Tracker => (kind === 'tawaf'
    ? createTawafTracker({ kaaba: KAABA_CENTER, startBearingDeg: BLACK_STONE_BEARING_DEG })
    : createSaiTracker()), [kind]);

  const stopAll = () => { stops.current.forEach((f) => f()); stops.current = []; };

  const refresh = useCallback(() => {
    const t = tracker.current;
    if (!t) return;
    const s = t.state();
    setState({ rounds: s.rounds, progress: s.progress, confidence: s.confidence, source: s.source, warnings: [...s.warnings] });
    if (s.rounds !== lastRounds.current) {
      const up = s.rounds > lastRounds.current;
      lastRounds.current = s.rounds;
      if (up) onRoundRef.current(s.rounds);
    }
  }, []);

  const begin = (m: 'live' | 'demo') => {
    stopAll();
    tracker.current = make();
    lastRounds.current = 0;
    setMode(m);
    const tick = setInterval(refresh, 200);
    stops.current.push(() => clearInterval(tick));
  };

  /** Real sensors. Must be called from a tap (iOS asks for motion permission). */
  const startLive = async () => {
    await askSensorPermission();
    begin('live');
    let heading: number | null = null, lat: number | null = null, lng: number | null = null, acc: number | null = null, step = false;
    const onOri = (e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
      if (typeof e.webkitCompassHeading === 'number') heading = e.webkitCompassHeading;
      else if (e.absolute && typeof e.alpha === 'number') heading = (360 - e.alpha) % 360;
    };
    const evt = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(evt, onOri as EventListener);
    stops.current.push(() => window.removeEventListener(evt, onOri as EventListener));
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition((p) => { lat = p.coords.latitude; lng = p.coords.longitude; acc = p.coords.accuracy; },
        () => {}, { enableHighAccuracy: true, maximumAge: 1000 });
      stops.current.push(() => navigator.geolocation.clearWatch(id));
    }
    stops.current.push(stepDetector(() => { step = true; }));
    const feed = setInterval(() => {
      tracker.current?.push({ t: Date.now(), headingDeg: heading, lat, lng, accuracyM: acc, step });
      step = false;
    }, 200);
    stops.current.push(() => clearInterval(feed));
  };

  /** Replays a simulated 7-round walk (noisy GPS, crowd stops, phone wobble) about 130x faster. */
  const startDemo = () => {
    begin('demo');
    const sim = kind === 'tawaf'
      ? simulateTawaf({ seed: 11, gps: 'noisy', startBearingDeg: BLACK_STONE_BEARING_DEG, tailS: 5 })
      : simulateSai({ seed: 11, tailS: 5 } as Parameters<typeof simulateSai>[0]);
    stops.current.push(replaySamples(sim.samples, (s) => tracker.current?.push(s), { speed: kind === 'tawaf' ? 130 : 90 }));
  };

  const stop = () => { stopAll(); setMode('off'); };
  const manual = (d: 1 | -1) => {
    if (!tracker.current) { tracker.current = make(); }
    tracker.current.manualAdd(d);
    refresh();
  };
  const reset = () => { stopAll(); tracker.current = null; lastRounds.current = 0; setState(IDLE); setMode('off'); };

  useEffect(() => () => stopAll(), []);
  return { state, mode, startLive, startDemo, stop, manual, reset };
}
