// Seeded, deterministic sensor simulator for Tawaf and Sa'i.
// Used by tests (many seeds) and by the app's demo mode (replay in real time).
//
// Models what actually goes wrong in the Haram: compass noise and phone wobble, a phone that
// sits at an arbitrary angle in a pocket, crowd stop-and-go, prayer pauses, GPS that is off by
// 10-40 m with temporally-correlated error plus 30-50 m multipath jumps that the phone's own
// accuracy figure does not admit to, and a pedometer ticking at ~1.6 Hz.

import { fromEnu, wrap360, type LatLng, type MotionSample } from './tawafTracker';
import { KAABA_CENTER, MARWAH, SAFA } from './haramGeo';

// ---------------------------------------------------------------- PRNG

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = ReturnType<typeof makeRng>;

export function makeRng(seed: number) {
  const next = mulberry32(seed * 2654435761 + 12345);
  let spare: number | null = null;
  return {
    next,
    uniform: (lo: number, hi: number) => lo + (hi - lo) * next(),
    chance: (p: number) => next() < p,
    gauss(): number {
      if (spare !== null) {
        const v = spare;
        spare = null;
        return v;
      }
      let u = 0;
      while (u === 0) u = next();
      const v = next();
      const r = Math.sqrt(-2 * Math.log(u));
      spare = r * Math.sin(2 * Math.PI * v);
      return r * Math.cos(2 * Math.PI * v);
    },
  };
}

// ---------------------------------------------------------------- sensor noise models

export type GpsMode = 'noisy' | 'good' | 'off';

/** GPS error: AR(1) correlated offset + occasional multipath jumps (not reflected in accuracy). */
function createGpsModel(rng: Rng, mode: GpsMode) {
  const level = mode === 'good' ? rng.uniform(3, 6) : rng.uniform(10, 40);
  const jumpP = mode === 'good' ? 0.003 : 0.025;
  const jumpRange: [number, number] = mode === 'good' ? [10, 20] : [30, 50];
  const a = Math.exp(-1 / 20); // ~20 s correlation at 1 Hz
  const sd = level / Math.SQRT2;
  let ee = rng.gauss() * sd;
  let en = rng.gauss() * sd;
  let jumpLeft = 0;
  let je = 0;
  let jn = 0;
  return {
    /** one fix per call (call at 1 Hz) */
    fix(e: number, n: number): { e: number; n: number; acc: number } {
      const k = Math.sqrt(1 - a * a) * sd;
      ee = a * ee + k * rng.gauss();
      en = a * en + k * rng.gauss();
      if (jumpLeft <= 0 && rng.chance(jumpP)) {
        jumpLeft = Math.round(rng.uniform(3, 12));
        const mag = rng.uniform(jumpRange[0], jumpRange[1]);
        const ang = rng.uniform(0, 2 * Math.PI);
        je = mag * Math.sin(ang);
        jn = mag * Math.cos(ang);
      }
      let oe = ee, on = en;
      if (jumpLeft > 0) {
        jumpLeft--;
        oe += je;
        on += jn;
      }
      const acc = Math.max(3, level * rng.uniform(0.7, 1.3));
      return { e: e + oe, n: n + on, acc: Math.round(acc * 10) / 10 };
    },
  };
}

/** Compass error: Gaussian jitter, rare spikes, and occasional ±60° phone wobble that returns. */
function createCompassModel(rng: Rng, wobble: boolean) {
  let wobbleT = 0; // seconds into the current wobble
  let wobbleDur = 0;
  let wobbleAmp = 0;
  return {
    read(trueDeg: number, dt: number, wobbleRatePerS: number): number {
      let w = 0;
      if (wobbleDur > 0) {
        wobbleT += dt;
        const ramp = 0.4;
        const x = wobbleT < ramp ? wobbleT / ramp : wobbleT > wobbleDur - ramp ? (wobbleDur - wobbleT) / ramp : 1;
        w = wobbleAmp * Math.max(0, Math.min(1, x));
        if (wobbleT >= wobbleDur) wobbleDur = 0;
      } else if (wobble && rng.chance(wobbleRatePerS * dt)) {
        wobbleT = 0;
        wobbleDur = rng.uniform(1, 4);
        wobbleAmp = (rng.chance(0.5) ? 1 : -1) * rng.uniform(30, 60);
      }
      let noise = rng.gauss() * 6;
      if (rng.chance(0.03)) noise += (rng.chance(0.5) ? 1 : -1) * rng.uniform(15, 40);
      return wrap360(trueDeg + w + noise);
    },
  };
}

// ---------------------------------------------------------------- Tawaf

export type TawafSegment =
  | { walk: number; direction?: 'ccw' | 'cw' } // laps (fractions allowed)
  | { stand: number; spin?: boolean } // seconds standing; spin = twirl the phone round and round
  | { pray: number }; // seconds stopped facing the Kaaba; phone taken out and re-pocketed

export interface TawafSimOptions {
  seed: number;
  /** default [{ walk: 7 }] */
  script?: TawafSegment[];
  kaaba?: LatLng;
  /** bearing from the Kaaba centre where walking starts (Black Stone line); default random */
  startBearingDeg?: number;
  radiusM?: number; // default 30-60
  speedMps?: number; // default 0.8-1.1
  sampleHz?: number; // default 5 (compass rate); GPS at 1 Hz
  gps?: GpsMode; // default 'noisy'
  heading?: boolean; // default true
  steps?: boolean; // default true
  crowdStops?: boolean; // default true
  wobble?: boolean; // default true
  tailS?: number; // standing still after the script, default 20
  startT?: number; // default 0
  /** seconds facing the Black Stone (istilam) before turning to walk; default 3-8 */
  istilamS?: number;
  /** compass drops out this many times per hour for 5-40 s (app backgrounded, permission) */
  headingDropoutsPerHour?: number;
}

/** A sample plus ground truth (CCW degrees walked for Tawaf, metres from Safa for Sa'i). */
export interface SimSample extends MotionSample {
  truthDeg?: number;
  truthM?: number;
}

export interface SimResult {
  samples: SimSample[];
  truth: { rounds: number; durationS: number; steps: number };
}

/**
 * Yields samples in time order. The generator's return value is the ground truth.
 * Demo mode: feed it to replaySamples() to play it back in (scaled) real time.
 */
export function* tawafStream(o: TawafSimOptions): Generator<SimSample, SimResult['truth'], void> {
  const rng = makeRng(o.seed);
  const kaaba = o.kaaba ?? KAABA_CENTER;
  const hz = o.sampleHz ?? 5;
  const dt = 1 / hz;
  const gpsMode = o.gps ?? 'noisy';
  const useHeading = o.heading ?? true;
  const useSteps = o.steps ?? true;
  const crowd = o.crowdStops ?? true;
  const gpsModel = createGpsModel(rng, gpsMode);
  const compass = createCompassModel(rng, o.wobble ?? true);

  const rBase = o.radiusM ?? rng.uniform(30, 60);
  const vBase = o.speedMps ?? rng.uniform(0.8, 1.1);
  const stride = vBase / 1.6; // ~0.5-0.7 m, cadence ~1.6 Hz
  let deviceOffset = rng.uniform(0, 360); // phone orientation in the pocket
  let theta = o.startBearingDeg ?? rng.uniform(0, 360);
  let r = rBase;
  let rVel = 0;
  let bodyHeading = theta - 90;
  let stepPhase = rng.next();
  let t = o.startT ?? 0;
  let tick = 0;
  let stopLeft = 0;
  let truthCcw = 0; // CCW degrees walked (signed)
  let steps = 0;
  let dropLeft = 0;
  const dropRate = (o.headingDropoutsPerHour ?? 0) / 3600;

  const emit = (v: number, extraHeading = 0, wobbleRate = 1 / 60): SimSample => {
    const s: SimSample = { t: Math.round(t * 1000), truthDeg: Math.round(truthCcw * 10) / 10 };
    if (dropLeft > 0) dropLeft -= dt;
    else if (dropRate > 0 && rng.chance(dropRate * dt)) dropLeft = rng.uniform(5, 40);
    const compassReading = compass.read(bodyHeading + deviceOffset + extraHeading, dt, wobbleRate);
    if (useHeading && dropLeft <= 0) s.headingDeg = Math.round(compassReading * 10) / 10;
    if (v > 0.05) {
      stepPhase += (v / stride) * dt;
      if (stepPhase >= 1) {
        stepPhase -= 1;
        steps++;
        if (useSteps) s.step = true;
      }
    }
    if (gpsMode !== 'off' && tick % hz === 0) {
      const e = r * Math.sin(theta * (Math.PI / 180));
      const n = r * Math.cos(theta * (Math.PI / 180));
      const f = gpsModel.fix(e, n);
      const ll = fromEnu(kaaba, f.e, f.n);
      s.lat = ll.lat;
      s.lng = ll.lng;
      s.accuracyM = f.acc;
    }
    tick++;
    t += dt;
    return s;
  };

  const script = o.script ?? [{ walk: 7 }];
  {
    // istilam: face the Kaaba at the Black Stone line, then turn to walk
    const first = script.find((x): x is Extract<TawafSegment, { walk: number }> => 'walk' in x);
    const walkDir = first?.direction === 'cw' ? theta + 90 : theta - 90;
    const n = Math.round((o.istilamS ?? rng.uniform(3, 8)) * hz);
    bodyHeading = theta + 180;
    for (let i = 0; i < n; i++) yield emit(0, 0, 1 / 30);
    const turnN = Math.round(1.5 * hz);
    const d = ((walkDir - bodyHeading + 540) % 360) - 180;
    const from = bodyHeading;
    for (let i = 1; i <= turnN; i++) {
      bodyHeading = from + (d * i) / turnN;
      yield emit(0);
    }
  }
  for (const seg of script) {
    if ('walk' in seg) {
      const sign = seg.direction === 'cw' ? -1 : 1; // +1 = CCW (bearing decreasing)
      // turn to face the new walking direction (a U-turn when switching direction), either way
      const want = theta - sign * 90;
      let d = ((want - bodyHeading + 540) % 360) - 180;
      if (Math.abs(d) > 150) d = rng.chance(0.5) ? Math.abs(d) : -Math.abs(d);
      if (Math.abs(d) > 20) {
        const from = bodyHeading;
        const n = Math.round(rng.uniform(1.5, 3) * hz);
        for (let i = 1; i <= n; i++) {
          bodyHeading = from + (d * i) / n;
          yield emit(0.4);
        }
      }
      const target = Math.abs(seg.walk) * 360;
      let done = 0;
      let speedJitter = 1;
      while (done < target) {
        if (stopLeft > 0) stopLeft -= dt;
        else if (crowd && rng.chance(dt / 75)) stopLeft = rng.uniform(2, 12);
        speedJitter += (rng.gauss() * 0.05 - (speedJitter - 1) * 0.1) * dt * 5;
        const v = stopLeft > 0 ? 0 : vBase * Math.max(0.5, Math.min(1.4, speedJitter));
        // drift in and out a little (crowd), radius stays within ±8 m
        rVel += (rng.gauss() * 0.08 - rVel * 0.2 - (r - rBase) * 0.02) * dt;
        const rOld = r;
        if (v > 0) r = Math.max(rBase - 8, Math.min(rBase + 8, r + rVel * dt));
        const dr = r - rOld;
        const ds = v * dt;
        const dTheta = (ds / r) * (180 / Math.PI);
        theta -= sign * dTheta;
        done += dTheta;
        truthCcw += sign * dTheta;
        if (v > 0) {
          // body faces the direction of travel: tangent ± a little radial drift
          const tangent = theta - sign * 90;
          bodyHeading = tangent + (sign * Math.atan2(dr, Math.max(ds, 1e-6)) * 180) / Math.PI;
        }
        yield emit(v);
      }
    } else if ('stand' in seg) {
      const n = Math.round(seg.stand * hz);
      const spinRate = seg.spin ? rng.uniform(40, 90) * (rng.chance(0.5) ? 1 : -1) : 0;
      let extra = 0;
      for (let i = 0; i < n; i++) {
        if (seg.spin) {
          // twirl for a while, pause, twirl back the other way sometimes
          const phase = (i / hz) % 20;
          if (phase < 8) extra += spinRate * dt;
        }
        yield emit(0, extra, seg.spin ? 1 / 5 : 1 / 30);
      }
      // a spun phone ends up in some other orientation
      deviceOffset += extra;
    } else {
      const n = Math.round(seg.pray * hz);
      const turnS = 3;
      const walkHeading = bodyHeading;
      const faceKaaba = theta + 180;
      const turn = ((faceKaaba - walkHeading + 540) % 360) - 180; // shortest turn
      const newOffset = deviceOffset + rng.uniform(-120, 120);
      for (let i = 0; i < n; i++) {
        const ts = i / hz;
        const remaining = seg.pray - ts;
        if (ts < turnS) bodyHeading = walkHeading + (turn * ts) / turnS;
        else if (remaining < turnS) bodyHeading = walkHeading + (turn * remaining) / turnS;
        else bodyHeading = walkHeading + turn;
        if (Math.abs(ts - seg.pray / 2) < dt / 2) deviceOffset = newOffset; // phone out & back
        yield emit(0, 0, 1 / 20);
      }
      bodyHeading = walkHeading;
    }
  }
  const tail = Math.round((o.tailS ?? 20) * hz);
  for (let i = 0; i < tail; i++) yield emit(0);

  return {
    rounds: Math.max(0, Math.min(7, Math.floor((truthCcw + 0.5) / 360))), // 0.5° slack: segment overshoot
    durationS: t - (o.startT ?? 0),
    steps,
  };
}

// ---------------------------------------------------------------- Sa'i

export interface SaiSimOptions {
  seed: number;
  legs?: number; // default 7 (Safa→Marwah = leg 1)
  safa?: LatLng;
  marwah?: LatLng;
  speedMps?: number; // default 0.8-1.2
  sampleHz?: number; // default 5
  gps?: GpsMode; // default 'noisy'
  heading?: boolean;
  steps?: boolean;
  crowdStops?: boolean;
  wobble?: boolean;
  /** number of legs in which the pilgrim turns back mid-way for 20-60 m, then carries on */
  turnbacks?: number;
  /** jog between the green lights (men) */
  greenJog?: boolean;
  tailS?: number;
  startT?: number;
}

export function* saiStream(o: SaiSimOptions): Generator<SimSample, SimResult['truth'], void> {
  const rng = makeRng(o.seed + 7919);
  const safa = o.safa ?? SAFA;
  const marwah = o.marwah ?? MARWAH;
  const hz = o.sampleHz ?? 5;
  const dt = 1 / hz;
  const gpsMode = o.gps ?? 'noisy';
  const useHeading = o.heading ?? true;
  const useSteps = o.steps ?? true;
  const crowd = o.crowdStops ?? true;
  const gpsModel = createGpsModel(rng, gpsMode);
  const compass = createCompassModel(rng, o.wobble ?? true);
  const legs = o.legs ?? 7;

  // axis in Safa-centred ENU
  const R = 6371008.8, RAD = Math.PI / 180;
  const me = (marwah.lng - safa.lng) * RAD * R * Math.cos(safa.lat * RAD);
  const mn = (marwah.lat - safa.lat) * RAD * R;
  const L = Math.hypot(me, mn);
  const ux = me / L, uy = mn / L; // unit along axis (east, north)
  const axisBearing = wrap360(Math.atan2(ux, uy) / RAD);

  const vBase = o.speedMps ?? rng.uniform(0.8, 1.2);
  const stride = vBase / 1.6;
  const jog = o.greenJog ?? rng.chance(0.5);
  const deviceOffset = rng.uniform(0, 360);
  const kaabaBearingFromMasa = 250; // Kaaba lies west-south-west of the Mas'a
  const turnbackLegs = new Set<number>();
  while (turnbackLegs.size < Math.min(o.turnbacks ?? 0, legs)) turnbackLegs.add(Math.floor(rng.uniform(1, legs + 1)));

  let s = rng.uniform(-3, 3); // along-axis metres from Safa
  let lat = 0;
  let bodyHeading = axisBearing;
  let stepPhase = rng.next();
  let t = o.startT ?? 0;
  let tick = 0;
  let steps = 0;
  let stopLeft = 0;

  const emit = (v: number): SimSample => {
    const out: SimSample = { t: Math.round(t * 1000), truthM: Math.round(s * 10) / 10 };
    if (useHeading) out.headingDeg = Math.round(compass.read(bodyHeading + deviceOffset, dt, 1 / 60) * 10) / 10;
    if (v > 0.05) {
      stepPhase += (v / stride) * dt;
      if (stepPhase >= 1) {
        stepPhase -= 1;
        steps++;
        if (useSteps) out.step = true;
      }
    }
    if (gpsMode !== 'off' && tick % hz === 0) {
      // lateral axis: right-hand normal (uy, -ux)
      const e = s * ux + lat * uy;
      const n = s * uy - lat * ux;
      const f = gpsModel.fix(e, n);
      const ll = fromEnu(safa, f.e, f.n);
      out.lat = ll.lat;
      out.lng = ll.lng;
      out.accuracyM = f.acc;
    }
    tick++;
    t += dt;
    return out;
  };

  function* turn(from: number, to: number, secs: number) {
    const d = ((to - from + 540) % 360) - 180;
    const n = Math.max(1, Math.round(secs * hz));
    for (let i = 1; i <= n; i++) {
      bodyHeading = from + (d * i) / n;
      yield emit(0.3); // shuffling round
    }
  }

  function* walkTo(goal: number, dir: 1 | -1) {
    let jitter = 1;
    const laneTarget = dir * rng.uniform(3, 9);
    while (dir * (goal - s) > 0) {
      if (stopLeft > 0) stopLeft -= dt;
      else if (crowd && rng.chance(dt / 90)) stopLeft = rng.uniform(2, 10);
      jitter += (rng.gauss() * 0.05 - (jitter - 1) * 0.1) * dt * 5;
      const inGreen = s > 0.35 * L && s < 0.6 * L;
      let v = stopLeft > 0 ? 0 : vBase * Math.max(0.6, Math.min(1.4, jitter)) * (jog && inGreen ? 1.35 : 1);
      if (v > 0) {
        const dl = (laneTarget - lat) * 0.05 * dt + rng.gauss() * 0.05;
        lat += dl;
        s += dir * v * dt;
        bodyHeading = (dir > 0 ? axisBearing : axisBearing + 180) + (Math.atan2(dl, v * dt) / RAD) * dir;
      } else v = 0;
      yield emit(v);
    }
  }

  // dua at Safa facing the Kaaba, then turn towards Marwah
  bodyHeading = kaabaBearingFromMasa;
  for (let i = 0; i < Math.round(rng.uniform(3, 15) * hz); i++) yield emit(0);
  yield* turn(bodyHeading, axisBearing, 2);

  let truthLegs = 0;
  for (let leg = 1; leg <= legs; leg++) {
    const dir: 1 | -1 = leg % 2 === 1 ? 1 : -1;
    const goal = dir > 0 ? L + rng.uniform(-4, 4) : rng.uniform(-4, 4);
    if (turnbackLegs.has(leg)) {
      const frac = rng.uniform(0.3, 0.65);
      const turnAt = dir > 0 ? frac * L : (1 - frac) * L;
      yield* walkTo(turnAt, dir);
      yield* turn(bodyHeading, bodyHeading + 180, rng.uniform(2, 4));
      const back = rng.uniform(20, 60);
      yield* walkTo(turnAt - dir * back, (-dir) as 1 | -1);
      yield* turn(bodyHeading, bodyHeading + 180, rng.uniform(2, 4));
    }
    yield* walkTo(goal, dir);
    truthLegs++;
    // at the hill: face the Kaaba for dua, then turn round
    const stopS = rng.uniform(4, 25);
    yield* turn(bodyHeading, kaabaBearingFromMasa, 2);
    for (let i = 0; i < Math.round(stopS * hz); i++) yield emit(0);
    if (leg < legs) yield* turn(bodyHeading, dir > 0 ? axisBearing + 180 : axisBearing, 2);
  }
  const tail = Math.round((o.tailS ?? 20) * hz);
  for (let i = 0; i < tail; i++) yield emit(0);
  return { rounds: truthLegs, durationS: t - (o.startT ?? 0), steps };
}

// ---------------------------------------------------------------- helpers

function collect(gen: Generator<SimSample, SimResult['truth'], void>): SimResult {
  const samples: SimSample[] = [];
  for (;;) {
    const r = gen.next();
    if (r.done) return { samples, truth: r.value };
    samples.push(r.value);
  }
}

export const simulateTawaf = (o: TawafSimOptions): SimResult => collect(tawafStream(o));
export const simulateSai = (o: SaiSimOptions): SimResult => collect(saiStream(o));

/**
 * Plays samples back on a timer (demo mode). speed 1 = real time, 30 = a 35-minute Tawaf in ~70 s.
 * Uses setTimeout only — no DOM. Returns a stop function.
 */
export function replaySamples(
  samples: Iterable<MotionSample>,
  onSample: (s: MotionSample) => void,
  opts: { speed?: number; onDone?: () => void } = {},
): () => void {
  const speed = Math.max(0.01, opts.speed ?? 1);
  const it = samples[Symbol.iterator]();
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let first: number | null = null;
  const wallStart = Date.now();
  let held: MotionSample | null = null;
  const pump = () => {
    timer = null;
    if (stopped) return;
    for (;;) {
      let smp = held;
      held = null;
      if (!smp) {
        const r = it.next();
        if (r.done) {
          opts.onDone?.();
          return;
        }
        smp = r.value;
      }
      if (first === null) first = smp.t;
      const lag = (smp.t - first) / speed - (Date.now() - wallStart);
      if (lag > 15) {
        held = smp;
        timer = setTimeout(pump, lag);
        return;
      }
      onSample(smp);
    }
  };
  pump();
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
