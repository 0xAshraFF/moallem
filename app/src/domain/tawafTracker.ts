// Automatic Tawaf round counting from phone sensors — no tapping needed.
//
// Pure + deterministic: feed it samples, read state(). No DOM, no clocks, no randomness.
//
// Why fusion: inside the Mataf raw GPS jumps 30-50 m (multipath off the marble and towers), and the
// pilgrim is only 10-60 m from the centre, so GPS alone cannot count laps. Walking one full circle
// around the Kaaba rotates the body's heading by ~360° no matter where the phone sits, so the
// primary signal is the *accumulated* compass heading. GPS angle around the Kaaba is a second,
// independent signal (confidence + fallback when the compass drops out), and step events gate
// out phone-twisting while standing and bound how fast rounds may be counted.
//
// Sign convention: compass headings and bearings grow clockwise (seen from above). Tawaf is
// counter-clockwise (Kaaba on the left), so both heading and bearing *decrease* while walking it.
// Internally "progress" is CCW-positive degrees.

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MotionSample {
  /** epoch / monotonic milliseconds */
  t: number;
  /** 0-360 compass heading of the phone; null/undefined when unavailable */
  headingDeg?: number | null;
  lat?: number | null;
  lng?: number | null;
  /** reported horizontal accuracy (m) of lat/lng */
  accuracyM?: number | null;
  /** true when the pedometer reported one step since the previous sample */
  step?: boolean;
}

export type Confidence = 'high' | 'medium' | 'low';
export type TrackSource = 'fusion' | 'heading' | 'gps' | 'manual';
export type TawafFloor = 'ground' | 'first' | 'roof';
export type TawafDirection = 'ccw' | 'cw' | 'unknown';
export type TawafWarning =
  | 'wrong-direction' // walking clockwise (Kaaba on the right)
  | 'outside-mataf' // good GPS fixes far from the Kaaba
  | 'no-signal' // neither compass nor usable GPS recently
  | 'implausible-rotation' // rotation faster than a human can walk a lap; held back
  | 'gps-heading-disagree'; // two signals disagree; trust lowered

export interface TawafState {
  rounds: number; // 0..7 completed rounds
  progress: number; // 0..1 within the current round (1 once all 7 are done)
  confidence: Confidence;
  source: TrackSource;
  direction: TawafDirection;
  warnings: TawafWarning[];
}

export interface TawafTrackerOptions {
  kaaba: LatLng;
  /** Bearing (deg, from Kaaba centre) of the Black Stone start line. Used only with good GPS. */
  startBearingDeg?: number;
  floor?: TawafFloor;
}

export interface TawafTracker {
  push(sample: MotionSample): void;
  state(): TawafState;
  manualAdd(delta: 1 | -1): void;
  reset(): void;
  /** Diagnostics for the demo screen / tests: accumulated CCW degrees per signal. */
  debug(): { fusedDeg: number; headingDeg: number; gpsDeg: number; roundStartDeg: number };
}

export const TAWAF_ROUNDS = 7;

/** Per-floor plausibility. Lower bounds only — a real lap is always longer than this. */
export const TAWAF_FLOOR_LIMITS: Record<TawafFloor, { minLapSec: number; minLapSteps: number; outsideM: number }> = {
  // Ground floor: tightest realistic lap hugs the Kaaba + Hijr Ismail (~90 m). Typical 450-700 steps.
  ground: { minLapSec: 45, minLapSteps: 90, outsideM: 250 },
  // Upper floors ring the courtyard: laps are several hundred metres.
  first: { minLapSec: 180, minLapSteps: 350, outsideM: 320 },
  roof: { minLapSec: 240, minLapSteps: 450, outsideM: 340 },
};

// ---------------------------------------------------------------- shared geometry helpers

const R_EARTH = 6371008.8;
const RAD = Math.PI / 180;

/** Local east/north metres of p relative to origin (equirectangular; exact enough within 1 km). */
export function toEnu(origin: LatLng, p: LatLng): { e: number; n: number } {
  return {
    e: (p.lng - origin.lng) * RAD * R_EARTH * Math.cos(origin.lat * RAD),
    n: (p.lat - origin.lat) * RAD * R_EARTH,
  };
}

export function fromEnu(origin: LatLng, e: number, n: number): LatLng {
  return {
    lat: origin.lat + n / (RAD * R_EARTH),
    lng: origin.lng + e / (RAD * R_EARTH * Math.cos(origin.lat * RAD)),
  };
}

/** Wrap any angle to (-180, 180]. */
export function wrap180(d: number): number {
  const x = (((d + 180) % 360) + 360) % 360 - 180;
  return x === -180 ? 180 : x;
}

export function wrap360(d: number): number {
  return ((d % 360) + 360) % 360;
}

/** Compass bearing (0 = north, clockwise) of an east/north vector. */
export function bearingOf(e: number, n: number): number {
  return wrap360(Math.atan2(e, n) / RAD);
}

export function isNum(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}

/** Robust slope (f per ms of wc) through points; ignores up to ~30% outliers such as wobbles. */
function theilSen(w: { wc: number; f: number }[]): number {
  const half = w.length >> 1;
  const slopes: number[] = [];
  for (let i = 0; i < w.length; i++)
    for (let j = i + half; j < w.length; j += 2) slopes.push((w[j].f - w[i].f) / Math.max(1, w[j].wc - w[i].wc));
  return slopes.length ? median(slopes) : 0;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Compass smoother: unwraps across 0/360, kills 1-2 sample spikes with a 5-tap median, then a
 * time-constant EMA. Output is an *unwrapped* heading (can run past 360 or below 0).
 */
export function createHeadingFilter(tauMs = 400) {
  let lastRaw: number | null = null;
  let unwrapped = 0;
  let ema = 0;
  let lastT = 0;
  const buf: number[] = [];
  return {
    push(t: number, h: number): number {
      if (lastRaw === null) {
        lastRaw = h;
        unwrapped = h;
        ema = h;
        lastT = t;
        buf.length = 0;
        buf.push(h);
        return ema;
      }
      unwrapped += wrap180(h - lastRaw);
      lastRaw = h;
      buf.push(unwrapped);
      if (buf.length > 5) buf.shift();
      const dt = Math.max(0, t - lastT);
      lastT = t;
      const alpha = 1 - Math.exp(-dt / tauMs);
      ema += alpha * (median(buf) - ema);
      return ema;
    },
    reset() {
      lastRaw = null;
      buf.length = 0;
    },
    /** Restart after a dropout, choosing the 360° branch nearest to `near` so output stays continuous. */
    restart(t: number, h: number, near: number | null): number {
      lastRaw = h;
      unwrapped = near === null ? h : near + wrap180(h - near);
      ema = unwrapped;
      lastT = t;
      buf.length = 0;
      buf.push(unwrapped);
      return ema;
    },
    get started() {
      return lastRaw !== null;
    },
  };
}

// ---------------------------------------------------------------- tracker

const HEADING_GAP_MS = 3000; // compass considered lost after this
const HEADING_BRIDGE_MS = 120000; // a lost compass that returns within this keeps continuity
const WALK_WINDOW_MS = 2000; // walking = a step within this window
const START_WIN_MS = 15000; // walking time used to anchor where the first round began
const STOP_WIN_MS = 8000; // walking time on each side of a stop used to measure re-orientation
const REORIENT_MIN_DEG = 20; // persistent heading jump across a stop smaller than this is noise
const HANDLED_MIN_DEG = 30; // swing while standing that means the phone was handled / body turned
const UTURN_MIN_DEG = 100; // swing while walking that means the pilgrim turned round
const EXCLUDE_MIN_DEG = 30; // rotation while standing larger than this is held back from counting
const END_TOL_DEG = 15; // a round may count this many degrees before the exact line
const STOP_TOL_DEG = 35; // ...or this many when the pilgrim has stopped (at the line, usually)
const FAST_TURN_RATE = 30; // deg/s; faster rotation is a body/phone turn, not orbiting
const GPS_WINDOW_MS = 8000;
const GPS_MAX_ACC = 25;
const AGREE_WINDOW_MS = 120000;
const DIR_WINDOW_MS = 45000;

export function createTawafTracker(opts: TawafTrackerOptions): TawafTracker {
  const kaaba = opts.kaaba;
  const limits = TAWAF_FLOOR_LIMITS[opts.floor ?? 'ground'];

  let s = fresh();

  function fresh() {
    return {
      filter: createHeadingFilter(),
      started: false,
      t0: 0,
      lastT: 0,
      // motion
      stepSeen: false,
      lastStepT: -Infinity,
      stepsInRound: 0,
      // heading
      lastHeadingT: -Infinity,
      lastF: null as number | null,
      wasWalking: true,
      walkClock: 0, // ms spent walking
      startWin: null as null | { wc: number; f: number }[], // first seconds of walking, for the anchor
      startWc: 0,
      walkStarted: false,
      inFast: false,
      settleUntil: 0, // no-pedometer mode: phone being twisted right now
      lastFastT: 0,
      recentWalk: [] as { wc: number; f: number }[],
      rateHist: [] as { wc: number; p: number }[],
      stopEval: null as null | {
        graceMs: number; // standing time already inside the "before" window
        stood: boolean; // a real stop (not only a fast turn while walking)
        hb: number; // robust heading just before the stop
        wcB: number;
        rate: number | null;
        wcStop: number; // walking clock when the stop / turn began
        f0: number; // heading when the stop was detected
        maxExc: number; // largest swing away from f0 while standing
        after: { wc: number; f: number }[];
      },
      excluded: 0, // rotation integrated while standing, not yet judged
      hAcc: 0, // accumulated CCW heading rotation actually used
      // gps
      gpsWin: [] as { t: number; e: number; n: number; w: number; acc: number }[],
      gpsRejects: 0,
      lastTheta: null as number | null,
      lastThetaT: 0,
      gAcc: 0, // accumulated CCW angle around Kaaba
      gpsValidUntil: -Infinity,
      gpsQuality: 1, // est accuracy / distance of the smoothed fix
      gpsFill: 0, // GPS rotation added while the compass was away
      lastHeadingWc: 0,
      outsideCount: 0,
      startAligned: false,
      alignOff: 0, // CCW degrees past the Black Stone line where walking started (from GPS)
      lastFix: '',
      lastFixT: -Infinity,
      // fused progress
      P: 0,
      roundStartP: 0,
      roundStartT: 0,
      counted: 0,
      lastCountManual: false,
      implausibleUntil: -Infinity,
      lastSource: 'heading' as Exclude<TrackSource, 'manual'>,
      // histories
      agreeHist: [] as { t: number; h: number; g: number }[],
      agree: 'unknown' as 'agree' | 'disagree' | 'unknown',
      direction: 'unknown' as TawafDirection,
    };
  }

  function addProgress(d: number) {
    s.P += d;
  }

  function onHeading(t: number, h: number, walking: boolean) {
    const gap = t - s.lastHeadingT;
    if (!s.filter.started || gap > HEADING_GAP_MS) {
      // (re)start after a dropout. The compass is absolute, so the rotation during the gap is
      // known modulo 360: pick the branch closest to what GPS saw (or the usual walking rate)
      // and let it replace the coarser GPS fill. Later filter movement cancels this first
      // sample's noise.
      const prevF = s.lastF;
      let near = prevF;
      if (prevF !== null && gap <= HEADING_BRIDGE_MS) {
        const walkedS = (s.walkClock - s.lastHeadingWc) / 1000;
        const expected = s.gpsFill !== 0 ? s.gpsFill : (walkRate() ?? 0) * walkedS;
        const seen = -wrap180(h - prevF);
        const d = expected + wrap180(seen - expected);
        s.hAcc += d;
        addProgress(d - s.gpsFill);
        near = prevF - d;
      }
      s.lastF = s.filter.restart(t, h, near);
      s.settleUntil = t + 2500; // the restarted filter swings from one noisy sample: not a turn
      s.recentWalk = [];
      s.lastHeadingT = t;
      s.lastHeadingWc = s.walkClock;
      s.gpsFill = 0;
      return;
    }
    const f = s.filter.push(t, h);
    const dH = -(f - (s.lastF as number)); // CCW positive
    const dtS = Math.max(1e-3, (t - s.lastHeadingT) / 1000);
    s.lastF = f;
    s.lastHeadingT = t;
    s.lastHeadingWc = s.walkClock;
    if (s.startWin) {
      // The turn usually overlaps the first steps, so the filtered heading is still settling.
      // Anchor the start robustly instead: Theil-Sen line through the first START_WIN_MS of
      // walking (shrugs off wobbles) extrapolated back to the moment walking began.
      if (walking) s.startWin.push({ wc: s.walkClock, f });
      const w = s.startWin;
      if (w.length > 5 && w[w.length - 1].wc - w[0].wc >= START_WIN_MS) {
        const slope = theilSen(w);
        const fStart = median(w.map((x) => x.f - slope * (x.wc - s.startWc)));
        const set = -(f - fStart);
        s.hAcc += set - s.P;
        s.P = set;
        s.startWin = null;
        return;
      }
    }

    // Integrate everything, so a wobble that goes out and comes back cancels exactly, even when
    // it straddles a stop. What must NOT count is a *persistent* change of phone orientation made
    // while standing (re-pocketed, twirled, turned to face the Kaaba and back the other way).
    // That is measured robustly after the pilgrim walks on (resolveStop) and removed.
    s.hAcc += dH;
    addProgress(dH);
    // Rotation faster than walking round the Kaaba can produce (≤ ~12°/s) is the body or phone
    // turning: a U-turn to find a companion, the phone taken out. Judge that episode exactly
    // like a stop — a turn that is undone cancels, a lasting one is removed. (Without a pedometer
    // this is the only way to tell.)
    if (Math.abs(dH) / dtS > FAST_TURN_RATE && walking && t > s.settleUntil) {
      if (!s.stopEval) onStop(0);
      else if (!s.inFast) {
        s.stopEval.after = [];
        s.stopEval.f0 = f + dH; // heading before this sample
      }
      s.inFast = true;
      s.lastFastT = t;
    } else if (s.inFast && t - s.lastFastT > 1500) s.inFast = false;
    if (s.inFast) walking = false;
    if (!walking) {
      if (s.stopEval) {
        s.excluded += dH;
        s.stopEval.maxExc = Math.max(s.stopEval.maxExc, Math.abs(f - s.stopEval.f0));
      }
      return;
    }
    s.recentWalk.push({ wc: s.walkClock, f });
    while (s.recentWalk.length && s.recentWalk[0].wc < s.walkClock - STOP_WIN_MS) s.recentWalk.shift();
    const ev = s.stopEval;
    if (ev) {
      ev.after.push({ wc: s.walkClock, f });
      if (ev.after[ev.after.length - 1].wc - ev.after[0].wc >= STOP_WIN_MS) resolveStop();
    }
  }

  function onStop(graceMs = WALK_WINDOW_MS) {
    if (s.lastF === null) return;
    if (s.stopEval) {
      // stopped again before the last stop was judged: keep its "before", restart its "after"
      s.stopEval.after = [];
      s.stopEval.f0 = s.lastF;
      if (graceMs > 0) s.stopEval.stood = true;
      return;
    }
    const rw = s.recentWalk;
    s.stopEval = {
      graceMs,
      stood: graceMs > 0,
      hb: rw.length ? median(rw.map((x) => x.f)) : s.lastF,
      wcB: rw.length ? median(rw.map((x) => x.wc)) : s.walkClock,
      rate: walkRate(),
      wcStop: s.walkClock,
      f0: s.lastF,
      maxExc: 0,
      after: [],
    };
    s.excluded = 0;
  }

  function resolveStop() {
    const ev = s.stopEval!;
    const ha = median(ev.after.map((x) => x.f));
    const wcA = median(ev.after.map((x) => x.wc));
    const jump = -(ha - ev.hb); // CCW progress seen between the two window centres
    // What walking alone explains: the usual rate over the walking time between the windows
    // (the last WALK_WINDOW before a stop was already standing). After a U-turn the pilgrim may
    // be walking the other way: then the part after the turn uses the rate seen afterwards.
    // With no rate at all only an obvious re-orientation is removed.
    const rate = ev.rate;
    let expected = ((rate ?? 0) * Math.max(0, wcA - ev.wcB - ev.graceMs)) / 1000;
    if (rate !== null && ev.maxExc >= UTURN_MIN_DEG && ev.after.length >= 6) {
      const rateA = -theilSen(ev.after) * 1000;
      if (Math.sign(rateA) !== Math.sign(rate) && Math.abs(rateA) >= 0.5 && Math.abs(rateA) <= 12) {
        expected =
          (rate * Math.max(0, ev.wcStop - ev.graceMs - ev.wcB) + rateA * Math.max(0, wcA - ev.after[0].wc)) / 1000;
      }
    }
    const reorient = jump - expected;
    // Only a stop in which the phone visibly swung can have re-oriented it; ordinary crowd stops
    // are left alone so their small measurement noise never leaks into the count.
    // A turn made while walking only matters if it was a real U-turn; wobbles cancel by themselves.
    const minSwing = s.stepSeen && !ev.stood ? UTURN_MIN_DEG : HANDLED_MIN_DEG;
    if (ev.maxExc >= minSwing && Math.abs(reorient) >= (rate === null ? 3 : 1) * REORIENT_MIN_DEG) {
      s.hAcc -= reorient;
      addProgress(-reorient);
    }
    s.stopEval = null;
    s.excluded = 0;
  }

  /** Typical CCW deg per walking-second lately (median of 1 s slopes, robust to jumps). */
  function walkRate(): number | null {
    const h = s.rateHist;
    if (h.length < 6) return null;
    const slopes: number[] = [];
    for (let i = 1; i < h.length; i++) {
      const dw = h[i].wc - h[i - 1].wc;
      if (dw > 0 && dw <= 1600) slopes.push(((h[i].p - h[i - 1].p) * 1000) / dw);
    }
    if (slopes.length < 5) return null;
    const r = median(slopes);
    return Math.abs(r) < 0.3 ? null : Math.max(-12, Math.min(12, r)); // a real Tawaf always turns
  }

  /** No pedometer: walking round the Kaaba always turns you; ~no turning for 6 s = standing. */
  function rotationStalled(): boolean {
    const h = s.rateHist;
    if (h.length < 7 || s.inFast) return false;
    const a = h[h.length - 7];
    return Math.abs(s.P - a.p) < 4;
  }

  /** Progress used for counting: rotation made while standing is held back until judged. */
  function effectiveP() {
    // While standing (or mid-swing) nothing turned is progress; once walking again a big
    // standing turn stays held back until it has been judged.
    const hold = s.stopEval && (s.inFast || (s.stepSeen && !s.wasWalking) || Math.abs(s.excluded) > EXCLUDE_MIN_DEG);
    return hold ? s.P - s.excluded : s.P;
  }

  function onGps(t: number, lat: number, lng: number, acc: number, headingValid: boolean) {
    const p = toEnu(kaaba, { lat, lng });
    const dist = Math.hypot(p.e, p.n);

    // Left the Mataf? Needs several decent fixes clearly beyond the floor's radius.
    if (acc <= 30) {
      if (dist - acc > limits.outsideM) s.outsideCount++;
      else if (dist + acc < limits.outsideM) s.outsideCount = 0;
    }

    // Angle around the centre is only meaningful when the error is small next to the radius.
    if (!(acc <= GPS_MAX_ACC && acc <= 0.45 * Math.max(dist, 1))) return;

    const win = s.gpsWin;
    if (win.length) {
      const m = weightedMean(win);
      const innov = Math.hypot(p.e - m.e, p.n - m.n);
      if (innov > Math.max(3 * acc, 25)) {
        // multipath jump; if it persists the window was the wrong one → restart from here
        if (++s.gpsRejects < 5) return;
        win.length = 0;
      }
    }
    s.gpsRejects = 0;
    win.push({ t, e: p.e, n: p.n, w: 1 / (acc * acc), acc });
    while (win.length && win[0].t < t - GPS_WINDOW_MS) win.shift();
    if (win.length < 2) return;

    const m = weightedMean(win);
    const r = Math.hypot(m.e, m.n);
    const estAcc = m.acc / Math.sqrt(win.length);
    s.gpsQuality = estAcc / Math.max(r, 1);
    if (s.gpsQuality > 0.35) return;
    const theta = bearingOf(m.e, m.n);

    if (!s.startAligned && opts.startBearingDeg !== undefined && win.length >= 5 && s.gpsQuality <= 0.12 && t - s.t0 < 60000 && s.counted === 0) {
      // Pilgrim may have started a little before/after the Black Stone line: shift the round start.
      const off = -wrap180(theta - opts.startBearingDeg); // CCW degrees already past the line
      if (Math.abs(off) <= 45 && Math.abs(s.P - s.roundStartP) < 30) {
        s.alignOff = off;
        s.roundStartP = s.P - off;
      }
      s.startAligned = true;
    }

    if (s.lastTheta !== null) {
      const dG = -wrap180(theta - s.lastTheta);
      // a gap in good fixes may legitimately span more rotation; walking can't exceed ~12°/s
      if (Math.abs(dG) < Math.min(150, 25 + (12 * (t - s.lastThetaT)) / 1000)) {
        s.gAcc += dG;
        if (!headingValid) {
          addProgress(dG);
          s.gpsFill += dG;
        }
      }
    }
    s.lastTheta = theta;
    s.lastThetaT = t;
    s.gpsValidUntil = t + 5000;
  }

  function weightedMean(win: { e: number; n: number; w: number; acc: number }[]) {
    let sw = 0, se = 0, sn = 0, sa = 0;
    for (const f of win) {
      sw += f.w;
      se += f.e * f.w;
      sn += f.n * f.w;
      sa += f.acc;
    }
    return { e: se / sw, n: sn / sw, acc: sa / win.length };
  }

  function updateCount(t: number, walking: boolean) {
    if (s.counted >= TAWAF_ROUNDS) return;
    const P = effectiveP();
    // Clockwise travel makes this negative and must be walked back: a round only starts
    // at the Black Stone line.
    const lapRaw = P - s.roundStartP;
    // A big turn made while standing is still being judged (wobble that will come back, or the
    // phone re-pocketed?). Don't count on top of it until it is resolved.
    if (s.inFast || (walking && s.stopEval && Math.abs(s.excluded) > EXCLUDE_MIN_DEG)) return;
    const secs = (t - s.roundStartT) / 1000;
    const capT = (secs * 360) / limits.minLapSec;
    const capS = s.stepSeen ? (s.stepsInRound * 360) / limits.minLapSteps : Infinity;
    const lapEff = Math.min(lapRaw, capT, capS);
    if (lapRaw > lapEff + 30) s.implausibleUntil = t + 30000;
    // Rounds keep their phase (carry), so counting a little early never adds up over 7 rounds;
    // it only matters for the last one, where the pilgrim stops at the line.
    const stopped = s.stepSeen ? !walking : rotationStalled();
    const tol = stopped ? STOP_TOL_DEG : END_TOL_DEG;
    if (lapEff >= 360 - tol) {
      s.counted++;
      // keep a little phase so rounds don't drift; drop any excess beyond one lap
      const carry = Math.max(-tol, Math.min(60, lapRaw - 360));
      s.roundStartP = P - carry;
      s.roundStartT = t;
      s.stepsInRound = 0;
      s.lastCountManual = false;
    }
  }

  function updateHistories(t: number, headingValid: boolean, gpsValid: boolean) {
    // Direction from walking time only, each second's change clipped to what walking can do,
    // so phone handling while standing can't flip it.
    const rh = s.rateHist;
    let dP = 0;
    let span = 0;
    for (let i = rh.length - 1; i > 0 && span < DIR_WINDOW_MS; i--) {
      const dw = Math.max(1, rh[i].wc - rh[i - 1].wc);
      dP += (Math.max(-12, Math.min(12, ((rh[i].p - rh[i - 1].p) * 1000) / dw)) * dw) / 1000;
      span += dw;
    }
    if (span >= DIR_WINDOW_MS * 0.6) {
      if (dP > 25) s.direction = 'ccw';
      else if (dP < -25) s.direction = 'cw';
    }

    if (headingValid && gpsValid) {
      const ah = s.agreeHist;
      if (!ah.length || t - ah[ah.length - 1].t >= 1000) ah.push({ t, h: s.hAcc, g: s.gAcc });
      while (ah.length > 1 && ah[0].t < t - AGREE_WINDOW_MS) ah.shift();
      const a = ah[0];
      const ddh = s.hAcc - a.h;
      const ddg = s.gAcc - a.g;
      if (t - a.t >= 30000 && Math.max(Math.abs(ddh), Math.abs(ddg)) >= 30) {
        s.agree = Math.abs(ddh - ddg) <= Math.max(40, 0.35 * Math.abs(ddh)) ? 'agree' : 'disagree';
      }
    }
  }

  return {
    push(sample: MotionSample) {
      const t = sample.t;
      if (!isNum(t)) return;
      if (!s.started) {
        s.started = true;
        s.t0 = t;
        s.lastT = t;
        s.roundStartT = t;
      } else if (t < s.lastT) return; // out-of-order sample
      const prevT = s.lastT;
      s.lastT = t;

      if (sample.step) {
        s.stepSeen = true;
        s.lastStepT = t;
        s.stepsInRound++;
      }
      const walking = !s.stepSeen || t - s.lastStepT <= WALK_WINDOW_MS;
      if (sample.step && !s.walkStarted) {
        // First step: before it the pilgrim stood at the Black Stone line doing istilam (facing
        // the Kaaba) and turned to walk. None of that turning is Tawaf, so start from zero.
        s.walkStarted = true;
        if (s.counted === 0) {
          s.P = 0;
          s.hAcc = 0;
          s.roundStartP = -s.alignOff;
          s.roundStartT = t;
          s.stopEval = null;
          s.excluded = 0;
          s.inFast = false;
          s.recentWalk = [];
          s.rateHist = [];
          s.startWin = [];
          s.startWc = s.walkClock;
        }
      }
      {
        if (s.stepSeen && s.wasWalking && !walking) onStop();
        if (walking) {
          s.walkClock += Math.min(1000, t - prevT);
          const rh = s.rateHist;
          // rate history from the compass only (GPS fill is too coarse to judge turns with)
          const sensing = t - s.lastHeadingT <= 1200;
          if (sensing && (!rh.length || s.walkClock - rh[rh.length - 1].wc >= 1000)) rh.push({ wc: s.walkClock, p: s.P });
          while (rh.length > 1 && rh[0].wc < s.walkClock - 90000) rh.shift();
        }
      }
      s.wasWalking = walking;

      if (isNum(sample.headingDeg)) onHeading(t, wrap360(sample.headingDeg), walking);
      const headingValid = t - s.lastHeadingT <= HEADING_GAP_MS;

      if (isNum(sample.lat) && isNum(sample.lng)) {
        const acc = isNum(sample.accuracyM) && sample.accuracyM > 0 ? sample.accuracyM : 30;
        // the same fix re-sent with every sample (within ~1 s) is one fix, not many
        const key = `${sample.lat},${sample.lng},${acc}`;
        if (key !== s.lastFix || t - s.lastFixT >= 950) {
          onGps(t, sample.lat, sample.lng, acc, headingValid);
          s.lastFix = key;
          s.lastFixT = t;
        }
      }
      const gpsValid = t <= s.gpsValidUntil;

      updateCount(t, walking);
      updateHistories(t, headingValid, gpsValid);
      if (headingValid && gpsValid) s.lastSource = 'fusion';
      else if (headingValid) s.lastSource = 'heading';
      else if (gpsValid) s.lastSource = 'gps';
    },

    state(): TawafState {
      const t = s.lastT;
      const headingValid = s.started && t - s.lastHeadingT <= HEADING_GAP_MS;
      const gpsValid = s.started && t <= s.gpsValidUntil;
      const warnings: TawafWarning[] = [];
      if (s.direction === 'cw') warnings.push('wrong-direction');
      if (s.outsideCount >= 3) warnings.push('outside-mataf');
      if (s.started && !headingValid && !gpsValid) warnings.push('no-signal');
      if (t <= s.implausibleUntil) warnings.push('implausible-rotation');
      if (headingValid && gpsValid && s.agree === 'disagree') warnings.push('gps-heading-disagree');

      let confidence: Confidence;
      if (!headingValid && !gpsValid) confidence = 'low';
      else if (headingValid && gpsValid) confidence = s.agree === 'agree' ? 'high' : s.agree === 'disagree' ? 'low' : 'medium';
      else if (headingValid) confidence = s.stepSeen ? 'medium' : 'low';
      else confidence = s.gpsQuality <= 0.2 ? 'medium' : 'low';
      if (t <= s.implausibleUntil && confidence === 'high') confidence = 'medium';

      const done = s.counted >= TAWAF_ROUNDS;
      const lap = effectiveP() - s.roundStartP;
      return {
        rounds: s.counted,
        progress: done ? 1 : Math.max(0, Math.min(0.999, lap / 360)),
        confidence,
        source: s.lastCountManual ? 'manual' : s.lastSource,
        direction: s.direction,
        warnings,
      };
    },

    manualAdd(delta: 1 | -1) {
      if (delta > 0) {
        if (s.counted >= TAWAF_ROUNDS) return;
        // The pilgrim is at the Black Stone line now: re-anchor so the same lap can't count twice.
        s.counted++;
        s.roundStartP = effectiveP();
        s.roundStartT = s.lastT;
        s.stepsInRound = 0;
      } else {
        if (s.counted <= 0) return;
        s.counted--;
      }
      s.lastCountManual = true;
    },

    reset() {
      s = fresh();
    },

    debug() {
      return { fusedDeg: effectiveP(), headingDeg: s.hAcc, gpsDeg: s.gAcc, roundStartDeg: s.roundStartP };
    },
  };
}
