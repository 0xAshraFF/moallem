// Automatic Sa'i counting between Safa and Marwah — no tapping needed.
// One length = one round; 7 lengths, starting at Safa and ending at Marwah.
//
// Pure + deterministic (no DOM, no clock). Signals:
//  1. along-axis position: a 1-D Kalman filter on "metres from Safa" driven by pedometer steps ×
//     stride × cos(heading − Marwah-ward heading) (dead reckoning), corrected by GPS fixes
//     projected onto the Safa→Marwah axis (outliers gated — the Mas'a is a covered building).
//  2. heading reversals (~180° turn held for a few seconds of walking). A reversal close to an
//     end both completes that length and re-anchors the position, so dead reckoning without GPS
//     self-calibrates its stride every length. A reversal half-way (looking for a companion) is
//     just a direction change and never counts.
//  3. step / time plausibility: a length cannot be shorter than a brisk jog would allow.
// Manual taps always win.

import {
  createHeadingFilter,
  isNum,
  toEnu,
  wrap180,
  wrap360,
  type Confidence,
  type LatLng,
  type MotionSample,
  type TrackSource,
} from './tawafTracker';
// Verified hill positions (OSM peak nodes, cross-checked with Wikipedia) — see haramGeo.ts.
import { MARWAH, SAFA } from './haramGeo';

export const SAI_ROUNDS = 7;

export type SaiDirection = 'toMarwah' | 'toSafa' | 'unknown';
export type SaiWarning =
  | 'start-not-at-safa' // first fixes put the pilgrim at the Marwah end
  | 'outside-masa' // good GPS fixes well off the Safa-Marwah gallery
  | 'no-signal'; // no compass/steps and no usable GPS

export interface SaiState {
  rounds: number; // 0..7 completed lengths
  progress: number; // 0..1 along the current length (1 when done)
  confidence: Confidence;
  source: TrackSource;
  direction: SaiDirection;
  warnings: SaiWarning[];
}

export interface SaiTrackerOptions {
  safa?: LatLng;
  marwah?: LatLng;
  /** initial stride guess for dead reckoning (m); self-calibrates at each end */
  strideM?: number;
  floor?: 'ground' | 'first' | 'second' | 'roof';
}

export interface SaiTracker {
  push(sample: MotionSample): void;
  state(): SaiState;
  manualAdd(delta: 1 | -1): void;
  reset(): void;
  /** Diagnostics for the demo screen / tests. */
  debug(): { metresFromSafa: number; sigmaM: number; lengthM: number; strideM: number };
}

const END_TOL_M = 25; // reaching this close to the hill completes the length
const WALK_WINDOW_MS = 2000;
const HEADING_GAP_MS = 3000;
const REVERSAL_HOLD_MS = 3000;
const REVERSAL_MIN_STEPS = 3;
const LEARN_MS = 10000;
const STOP_COUNT_MS = 6000;
const GPS_RECENT_MS = 10000;

export function createSaiTracker(opts: SaiTrackerOptions = {}): SaiTracker {
  const safa = opts.safa ?? SAFA;
  const marwah = opts.marwah ?? MARWAH;
  const m = toEnu(safa, marwah);
  const L = Math.hypot(m.e, m.n);
  const ux = m.e / L;
  const uy = m.n / L;
  const minLegSteps = Math.round((0.5 * L) / 0.8);
  const minLegMs = (L / 2.5) * 1000;
  const defaultStride = opts.strideM ?? 0.62;

  let s = fresh();

  function fresh() {
    return {
      started: false,
      t0: 0,
      lastT: 0,
      filter: createHeadingFilter(),
      lastHeadingT: -Infinity,
      hf: 0, // filtered heading, 0-360
      stepSeen: false,
      lastStepT: -Infinity,
      stride: defaultStride,
      calibrated: false,
      // position along axis (m from Safa)
      x: 0,
      P: 10 * 10, // random-walk variance
      relUnc: 0.2, // stride bias uncertainty (fraction)
      dSinceFix: 0, // dead-reckoned metres since the last absolute fix
      // Marwah-ward heading reference (absorbs the unknown phone-in-pocket angle)
      mRef: null as number | null,
      learn: [] as number[],
      learnMs: 0,
      learnDir: 1 as 1 | -1,
      learning: true,
      curDir: 0 as -1 | 0 | 1,
      candDir: 0 as -1 | 0 | 1,
      candSince: 0,
      candSteps: 0,
      // legs
      counted: 0,
      lastCountT: 0,
      stepsSinceCount: 0,
      netSteps: 0, // steps toward the target hill minus steps away from it, this length
      legStartX: 0,
      legStepLog: [] as number[], // steps taken per completed length
      legBest: 0, // furthest point reached toward the current target hill
      justCountedEnd: null as number | null, // hill just counted, until the pilgrim turns round
      legDrStartX: 0,
      gpsInLeg: false,
      lastCountManual: false,
      // gps
      gpsRejects: 0,
      lastGpsT: -Infinity,
      outsideCount: 0,
      startWarn: false,
      lastFix: '',
      lastFixT: -Infinity,
      xHist: [] as { t: number; x: number }[],
    };
  }

  const targetPos = () => (s.counted % 2 === 0 ? L : 0);
  const sigma = () => Math.sqrt(s.P + (s.relUnc * s.dSinceFix) ** 2);
  const legPlausible = (t: number) =>
    t - s.lastCountT >= minLegMs && (!s.stepSeen || s.stepsSinceCount >= minLegSteps);

  /**
   * Stopped after just about a usual length's worth of *net* steps toward the hill (steps back
   * and forth on a turn-back cancel), near the hill — GPS may be biased there.
   */
  function nearByStepCount(dist: number) {
    if (s.legStepLog.length < 2 || dist > 0.2 * L) return false;
    const typical = [...s.legStepLog].sort((a, b) => a - b)[s.legStepLog.length >> 1];
    return s.netSteps >= 0.92 * typical && s.netSteps <= 1.12 * typical;
  }

  function count(t: number) {
    if (s.counted >= SAI_ROUNDS) return;
    s.justCountedEnd = targetPos();
    s.counted++;
    s.legBest = s.x;
    s.lastCountT = t;
    if (s.stepSeen) s.legStepLog.push(s.netSteps);
    s.stepsSinceCount = 0;
    s.netSteps = 0;
    s.lastCountManual = false;
  }

  /** Pin the position to a hill (after a turn-round there); calibrates stride when no GPS helped. */
  function snapTo(end: number, calibrate = true) {
    const drDist = Math.abs(s.x - s.legDrStartX);
    const trueDist = Math.abs(end - s.legStartX);
    if (calibrate && !s.gpsInLeg && s.stepSeen && drDist > 0.5 * L && trueDist > 0.5 * L) {
      const ratio = Math.max(0.75, Math.min(1.33, trueDist / drDist));
      s.stride *= s.calibrated ? 1 + (ratio - 1) * 0.5 : ratio;
      s.calibrated = true;
      s.relUnc = 0.07;
    }
    s.x = end;
    s.P = 4 * 4;
    s.dSinceFix = 0;
    s.legStartX = end;
    s.legDrStartX = end;
    s.gpsInLeg = false;
  }

  function onReversal(t: number, prevDir: 1 | -1) {
    const end = prevDir > 0 ? L : 0;
    const radius = Math.min(0.3 * L, END_TOL_M + 2.5 * sigma());
    if (Math.abs(end - s.x) > radius) return; // turned back mid-way: not a length
    const justCounted = s.justCountedEnd === end;
    s.justCountedEnd = null;
    if (end !== targetPos()) {
      // Turning round just after this hill counted is the normal case. Otherwise: back at the
      // hill this length started from (gave up on it)? Only if most of the outward distance was
      // retraced — a short turn-back-and-on must not re-anchor us there.
      if (!justCounted && Math.abs(end - s.x) > 0.3 * Math.abs(s.legBest - end)) return;
    } else if (legPlausible(t)) count(t);
    snapTo(end);
  }

  function onHeading(t: number, h: number, walking: boolean, dtMs: number) {
    if (t - s.lastHeadingT > HEADING_GAP_MS) s.filter.reset();
    s.hf = wrap360(s.filter.push(t, h));
    s.lastHeadingT = t;
    if (!walking) return;
    // Before the first step the pilgrim is making dua at Safa facing the Kaaba: not a walking
    // direction. (No pedometer at all? Then after 30 s learn from everything, robustly.)
    if (!s.stepSeen && t - s.t0 < 30000) return;

    if (s.learning) {
      s.learn.push(s.hf);
      s.learnMs += dtMs;
      // without a pedometer "walking" includes standing (dua at the hill), so learn longer + robustly
      if (s.learnMs >= (s.stepSeen ? LEARN_MS : 2.5 * LEARN_MS) && s.learn.length >= 5) {
        const mean = robustCircMean(s.learn);
        s.mRef = wrap360(mean + (s.learnDir > 0 ? 0 : 180));
        s.learning = false;
        if (s.curDir === 0) s.curDir = s.learnDir;
      }
    }
    if (s.mRef === null) return;
    const c = Math.cos((wrap180(s.hf - s.mRef) * Math.PI) / 180);
    const cand: -1 | 0 | 1 = c > 0.5 ? 1 : c < -0.5 ? -1 : 0;
    if (cand !== 0 && cand !== s.curDir) {
      if (s.candDir !== cand) {
        s.candDir = cand;
        s.candSince = t;
        s.candSteps = 0;
      } else if (t - s.candSince >= REVERSAL_HOLD_MS && (!s.stepSeen || s.candSteps >= REVERSAL_MIN_STEPS)) {
        const prev = s.curDir;
        s.curDir = cand;
        s.candDir = 0;
        if (prev !== 0) onReversal(t, prev);
        // re-learn the reference over the next seconds of walking (phone may have moved at the hill)
        s.learning = true;
        s.learn = [];
        s.learnMs = 0;
        s.learnDir = cand;
      }
    } else if (cand === s.curDir) {
      s.candDir = 0;
    }
  }

  function onStep(t: number, headingValid: boolean) {
    s.stepsSinceCount++;
    if (s.candDir !== 0) s.candSteps++;
    let ds: number;
    if (headingValid && s.mRef !== null) {
      ds = s.stride * Math.cos((wrap180(s.hf - s.mRef) * Math.PI) / 180);
      s.P += (0.05 * s.stride) ** 2;
    } else if (headingValid) {
      ds = s.stride * s.learnDir; // first seconds: assume walking away from Safa
      s.P += (0.1 * s.stride) ** 2;
    } else {
      // no compass: let GPS drive; assume heading for the next hill, but loosely
      ds = s.stride * (targetPos() > s.x ? 1 : -1) * 0.5;
      s.P += (0.6 * s.stride) ** 2;
    }
    s.x = Math.max(-60, Math.min(L + 60, s.x + ds));
    s.netSteps += Math.sign(ds) * (targetPos() > 0 ? 1 : -1);
    s.dSinceFix += Math.abs(ds);
    void t;
  }

  function onGps(t: number, lat: number, lng: number, acc: number) {
    const p = toEnu(safa, { lat, lng });
    const along = p.e * ux + p.n * uy;
    const lateral = p.e * uy - p.n * ux;
    if (acc <= 30) {
      const off = Math.abs(lateral) - acc > 60 || along < -80 - acc || along > L + 80 + acc;
      if (off) s.outsideCount++;
      else s.outsideCount = 0;
    }
    if (acc > 40) return;
    const R = (1.5 * Math.max(acc, 5)) ** 2; // inflated: GPS error is correlated over ~20 s
    const V = sigma() ** 2;
    const innov = along - s.x;
    if (Math.abs(innov) > Math.max(20, 3 * Math.sqrt(V + R))) {
      const drActive = s.stepSeen && t - s.lastHeadingT <= HEADING_GAP_MS && s.mRef !== null;
      if (drActive) {
        // Steps + compass are tracking us; a run of far-off fixes is far more likely multipath
        // than a teleport. Loosen slowly so a real error can still be corrected over time.
        if (++s.gpsRejects >= 10) s.P *= 1.3;
        return;
      }
      if (++s.gpsRejects < 6) return;
      // no dead reckoning and consistently elsewhere: believe GPS
      s.x = along;
      s.P = R;
      s.dSinceFix = 0;
      s.gpsRejects = 0;
    } else {
      s.gpsRejects = 0;
      const K = V / (V + R);
      s.x += K * innov;
      const k = 1 - K;
      s.P *= k;
      s.dSinceFix *= Math.sqrt(k);
    }
    s.gpsInLeg = true;
    s.lastGpsT = t;
    if (s.counted === 0 && t - s.t0 < 120000 && sigma() < 40 && s.x > 0.5 * L) s.startWarn = true;
  }

  return {
    push(sample: MotionSample) {
      const t = sample.t;
      if (!isNum(t)) return;
      if (!s.started) {
        s.started = true;
        s.t0 = t;
        s.lastT = t;
        s.lastCountT = t;
      } else if (t < s.lastT) return;
      const dtMs = t - s.lastT;
      s.lastT = t;

      if (sample.step) {
        s.stepSeen = true;
        s.lastStepT = t;
      }
      const walking = !s.stepSeen || t - s.lastStepT <= WALK_WINDOW_MS;
      if (isNum(sample.headingDeg)) onHeading(t, wrap360(sample.headingDeg), walking, dtMs);
      const headingValid = t - s.lastHeadingT <= HEADING_GAP_MS;
      if (sample.step) onStep(t, headingValid);
      else if (!s.stepSeen) s.P += (36 * dtMs) / 1000; // no pedometer: let GPS lead (~1 m/s walking)

      if (isNum(sample.lat) && isNum(sample.lng)) {
        const acc = isNum(sample.accuracyM) && sample.accuracyM > 0 ? sample.accuracyM : 30;
        // the same fix re-sent with every sample (within ~1 s) is one fix, not many
        const key = `${sample.lat},${sample.lng},${acc}`;
        if (key !== s.lastFix || t - s.lastFixT >= 950) {
          onGps(t, sample.lat, sample.lng, acc);
          s.lastFix = key;
          s.lastFixT = t;
        }
      }

      // length completion
      if (s.counted < SAI_ROUNDS) {
        const tp = targetPos();
        const toward = tp > 0 ? 1 : -1;
        if (toward * (s.x - s.legBest) > 0) s.legBest = s.x;
        const dist = Math.abs(s.x - tp);
        const bestDist = Math.abs(s.legBest - tp);
        // position-trend reversal (works without a compass): got close to the hill, then came
        // well back. Mid-way turn-backs never get close enough.
        const cameBack = toward * (s.legBest - s.x) > 60;
        const stoppedLong = s.stepSeen && t - s.lastStepT >= STOP_COUNT_MS;
        if (legPlausible(t)) {
          if (dist <= END_TOL_M) count(t);
          else if (cameBack && bestDist <= Math.min(0.3 * L, END_TOL_M + 2 * sigma())) count(t);
          else if (stoppedLong && (dist <= Math.min(60, END_TOL_M + 2.5 * sigma()) || nearByStepCount(dist))) {
            // stopped at the hill for dua (the 7th length never turns round)
            count(t);
            snapTo(tp);
          }
        }
      }

      const xh = s.xHist;
      if (!xh.length || t - xh[xh.length - 1].t >= 1000) xh.push({ t, x: s.x });
      while (xh.length > 1 && xh[0].t < t - 20000) xh.shift();
    },

    state(): SaiState {
      const t = s.lastT;
      const headingValid = s.started && t - s.lastHeadingT <= HEADING_GAP_MS;
      const gpsRecent = s.started && t - s.lastGpsT <= GPS_RECENT_MS;
      const dr = headingValid && s.stepSeen;
      const sig = sigma();
      const warnings: SaiWarning[] = [];
      if (s.startWarn) warnings.push('start-not-at-safa');
      if (s.outsideCount >= 3) warnings.push('outside-masa');
      if (s.started && !dr && !gpsRecent) warnings.push('no-signal');

      let source: TrackSource;
      let confidence: Confidence;
      if (dr && gpsRecent) {
        source = 'fusion';
        confidence = sig <= 15 ? 'high' : 'medium';
      } else if (dr) {
        source = 'heading';
        confidence = s.calibrated || s.counted === 0 ? 'medium' : 'low';
      } else if (gpsRecent) {
        source = 'gps';
        confidence = sig <= 20 ? 'medium' : 'low';
      } else {
        source = 'heading';
        confidence = 'low';
      }
      if (s.lastCountManual) source = 'manual';

      let direction: SaiDirection = 'unknown';
      if (headingValid && s.curDir !== 0) direction = s.curDir > 0 ? 'toMarwah' : 'toSafa';
      else if (s.xHist.length > 1) {
        const d = s.x - s.xHist[0].x;
        if (Math.abs(d) > 8) direction = d > 0 ? 'toMarwah' : 'toSafa';
      }

      const done = s.counted >= SAI_ROUNDS;
      const frac = s.counted % 2 === 0 ? s.x / L : (L - s.x) / L;
      return {
        rounds: s.counted,
        progress: done ? 1 : Math.max(0, Math.min(0.999, frac)),
        confidence,
        source,
        direction,
        warnings,
      };
    },

    manualAdd(delta: 1 | -1) {
      if (delta > 0) {
        if (s.counted >= SAI_ROUNDS) return;
        const tp = targetPos();
        s.counted++;
        s.lastCountT = s.lastT;
        s.stepsSinceCount = 0;
        s.netSteps = 0;
        s.justCountedEnd = tp;
        s.legBest = tp;
        snapTo(tp, false); // the pilgrim says they are at the hill now
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
      return { metresFromSafa: s.x, sigmaM: sigma(), lengthM: L, strideM: s.stride };
    },
  };
}

/** Circular mean that ignores samples more than 50° from the bulk (wobble, facing the Kaaba). */
function robustCircMean(degs: number[]): number {
  let m = circMean(degs);
  for (let k = 0; k < 2; k++) {
    const keep = degs.filter((d) => Math.abs(wrap180(d - m)) <= 50);
    if (keep.length < 3) break;
    m = circMean(keep);
  }
  return m;
}

function circMean(degs: number[]): number {
  let sx = 0, sy = 0;
  for (const d of degs) {
    sx += Math.cos((d * Math.PI) / 180);
    sy += Math.sin((d * Math.PI) / 180);
  }
  return wrap360((Math.atan2(sy, sx) * 180) / Math.PI);
}
