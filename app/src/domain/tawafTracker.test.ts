import test from 'node:test';
import assert from 'node:assert/strict';
import { createTawafTracker, fromEnu, wrap180, wrap360, type MotionSample, type TawafState } from './tawafTracker';
import { BLACK_STONE_BEARING_DEG, KAABA_CENTER } from './haramGeo';
import { simulateTawaf, tawafStream, type SimSample, type TawafSimOptions } from './sensorSim';

const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);

function run(samples: MotionSample[], floor: 'ground' | 'first' | 'roof' = 'ground') {
  const tr = createTawafTracker({ kaaba: KAABA_CENTER, floor });
  let maxRounds = 0;
  for (const s of samples) {
    tr.push(s);
    maxRounds = Math.max(maxRounds, tr.state().rounds);
  }
  return { tr, state: tr.state(), maxRounds };
}

/** Runs one scenario over many seeds; returns the share of seeds counted exactly right. */
function accuracy(make: (seed: number) => TawafSimOptions, floor: 'ground' | 'first' | 'roof' = 'ground') {
  const misses: string[] = [];
  for (const seed of SEEDS) {
    const sim = simulateTawaf(make(seed));
    const { state } = run(sim.samples, floor);
    if (state.rounds !== sim.truth.rounds) misses.push(`seed ${seed}: ${state.rounds}/${sim.truth.rounds}`);
  }
  return { rate: (SEEDS.length - misses.length) / SEEDS.length, misses };
}

function expectAccuracy(name: string, make: (seed: number) => TawafSimOptions, min: number, floor?: 'ground' | 'first' | 'roof') {
  const { rate, misses } = accuracy(make, floor);
  assert.ok(rate >= min, `${name}: ${(rate * 100).toFixed(0)}% exact (< ${min * 100}%) — ${misses.join(', ')}`);
}

// ---------------------------------------------------------------- deterministic hand-made walks

/** Perfect circle, CCW, no noise: heading wraps through 0/360 every lap. */
function perfectLaps(laps: number, opts: { hz?: number; steps?: boolean; gps?: boolean; dir?: 1 | -1 } = {}): MotionSample[] {
  const hz = opts.hz ?? 5;
  const r = 40;
  const v = 1;
  const dir = opts.dir ?? 1;
  const out: MotionSample[] = [];
  const total = laps * 360;
  let theta = 90; // start due east of the Kaaba
  let walked = 0;
  let t = 0;
  let phase = 0;
  // stand a few seconds facing the Kaaba first (istilam), then walk
  for (let i = 0; i < 3 * hz; i++, t += 1000 / hz) out.push({ t, headingDeg: wrap360(theta + 180) });
  while (walked < total) {
    const d = ((v / hz / r) * 180) / Math.PI;
    theta -= dir * d;
    walked += d;
    phase += 1.6 / hz;
    const s: MotionSample = { t, headingDeg: wrap360(theta - dir * 90) };
    if (opts.steps !== false && phase >= 1) {
      phase -= 1;
      s.step = true;
    }
    if (opts.gps && Math.round(t) % 1000 === 0) {
      const p = fromEnu(KAABA_CENTER, r * Math.sin((theta * Math.PI) / 180), r * Math.cos((theta * Math.PI) / 180));
      Object.assign(s, { lat: p.lat, lng: p.lng, accuracyM: 5 });
    }
    out.push(s);
    t += 1000 / hz;
  }
  for (let i = 0; i < 10 * hz; i++, t += 1000 / hz) out.push({ t, headingDeg: wrap360(theta - dir * 90) });
  return out;
}

test('heading unwrap across 0/360: 7 perfect laps count exactly 7, at 5 Hz and at 2 Hz', () => {
  for (const hz of [5, 2]) {
    const { state, maxRounds } = run(perfectLaps(7, { hz }));
    assert.equal(state.rounds, 7, `hz ${hz}`);
    assert.equal(maxRounds, 7);
    assert.equal(state.direction, 'ccw');
    assert.equal(state.progress, 1);
  }
});

test('with good GPS the first round is measured from the Black Stone line, not from where tracking began', () => {
  // the pilgrim starts 25° short of the line (bearing decreases walking CCW)
  let ok = 0;
  for (const seed of SEEDS.slice(0, 20)) {
    const tr = createTawafTracker({ kaaba: KAABA_CENTER, startBearingDeg: BLACK_STONE_BEARING_DEG });
    const sim = simulateTawaf({ seed, gps: 'good', startBearingDeg: BLACK_STONE_BEARING_DEG + 25, script: [{ walk: 1.2 }] });
    let firstAt = -1;
    for (const s of sim.samples as SimSample[]) {
      tr.push(s);
      if (firstAt < 0 && tr.state().rounds === 1) firstAt = s.truthDeg ?? 0;
    }
    // the line is reached after 385° of walking; allow the early-count tolerance and noise
    if (firstAt > 385 - 30 && firstAt < 385 + 15) ok++;
  }
  assert.ok(ok >= 18, `aligned in ${ok}/20`);
});

test('rounds tick over at the start line, not before', () => {
  const tr = createTawafTracker({ kaaba: KAABA_CENTER });
  const samples = perfectLaps(3);
  let firstCountAt = -1;
  let walkedSamples = 0;
  for (const s of samples) {
    tr.push(s);
    if (s.step !== undefined || walkedSamples > 0) walkedSamples++;
    if (firstCountAt < 0 && tr.state().rounds === 1) firstCountAt = walkedSamples;
  }
  // one lap at r=40 m, 1 m/s, 5 Hz ≈ 1257 samples; allow the 15° early tolerance only
  const lapSamples = (2 * Math.PI * 40) * 5;
  assert.ok(firstCountAt > lapSamples * (1 - 16 / 360) && firstCountAt < lapSamples * 1.02, `counted at ${firstCountAt}`);
});

test('wrapper helpers', () => {
  assert.equal(wrap180(190), -170);
  assert.equal(wrap180(-190), 170);
  assert.equal(wrap360(-10), 350);
});

// ---------------------------------------------------------------- simulated pilgrims (50 seeds each)

test('7 clean laps → 7 (fusion, high confidence)', () => {
  for (const seed of SEEDS.slice(0, 20)) {
    const sim = simulateTawaf({ seed, gps: 'good', wobble: false, crowdStops: false });
    const { state, maxRounds } = run(sim.samples);
    assert.equal(sim.truth.rounds, 7);
    assert.equal(state.rounds, 7, `seed ${seed}`);
    assert.equal(maxRounds, 7);
    assert.equal(state.source, 'fusion');
    assert.equal(state.confidence, 'high');
    assert.deepEqual(state.warnings, []);
  }
});

test('noisy GPS (10-40 m, multipath jumps) + compass, crowd stops, wobble → ≥98% exact', () => {
  expectAccuracy('noisy', (seed) => ({ seed }), 0.98);
});

test('compass only (GPS off) → ≥98% exact, source heading', () => {
  expectAccuracy('heading only', (seed) => ({ seed, gps: 'off' }), 0.98);
  const { state } = run(simulateTawaf({ seed: 3, gps: 'off' }).samples);
  assert.equal(state.source, 'heading');
});

test('GPS only (compass unavailable, good sky view) → ≥98% exact, source gps', () => {
  expectAccuracy('gps only', (seed) => ({ seed, gps: 'good', heading: false }), 0.98);
  const { state } = run(simulateTawaf({ seed: 3, gps: 'good', heading: false }).samples);
  assert.equal(state.source, 'gps');
});

test('phone twirled / wobbled while standing mid-Tawaf → no extra rounds', () => {
  expectAccuracy('stand+spin', (seed) => ({ seed, script: [{ walk: 3 }, { stand: 120, spin: true }, { walk: 4 }] }), 0.98);
});

test('standing still and spinning the phone for 5 minutes counts nothing', () => {
  for (const seed of SEEDS.slice(0, 20)) {
    const sim = simulateTawaf({ seed, script: [{ walk: 0.02 }, { stand: 300, spin: true }] });
    const { maxRounds } = run(sim.samples);
    assert.equal(maxRounds, 0, `seed ${seed}`);
  }
});

test('clockwise (Kaaba on the right) → 0 rounds and a wrong-direction warning', () => {
  for (const seed of SEEDS) {
    const sim = simulateTawaf({ seed, script: [{ walk: 7, direction: 'cw' }] });
    const { state, maxRounds } = run(sim.samples);
    assert.equal(maxRounds, 0, `seed ${seed}`);
    assert.equal(state.direction, 'cw', `seed ${seed}`);
    assert.ok(state.warnings.includes('wrong-direction'), `seed ${seed}`);
  }
});

test('a clockwise start must be walked back: rounds begin at the Black Stone line', () => {
  // 0.3 lap the wrong way, then 7 laps the right way = 6.7 rounds from the line → 6
  expectAccuracy('cw then ccw', (seed) => ({ seed, script: [{ walk: 0.3, direction: 'cw' }, { walk: 7 }] }), 0.98);
});

test('5-minute prayer pause mid-lap (face the Kaaba, phone out and back) → continues correctly', () => {
  expectAccuracy('prayer', (seed) => ({ seed, script: [{ walk: 2.5 }, { pray: 300 }, { walk: 4.5 }] }), 0.98);
});

test('compass drops out for 5-40 s several times (GPS fills / heading bridges) → ≥95% exact', () => {
  expectAccuracy('dropouts noisy gps', (seed) => ({ seed, headingDropoutsPerHour: 20 }), 0.95);
  expectAccuracy('dropouts gps off', (seed) => ({ seed, gps: 'off', headingDropoutsPerHour: 20 }), 0.95);
});

test('no pedometer at all (degraded mode) → still ≥85% exact', () => {
  expectAccuracy('no steps', (seed) => ({ seed, steps: false }), 0.85);
});

test('upper floor (radius ~110-140 m, floor: first) → ≥98% exact', () => {
  expectAccuracy('first floor', (seed) => ({ seed, radiusM: 110 + (seed % 30) }), 0.98, 'first');
});

test('never above 7: 9 laps walked → 7, progress 1, manual +1 ignored', () => {
  for (const seed of SEEDS.slice(0, 10)) {
    const { tr, state, maxRounds } = run(simulateTawaf({ seed, script: [{ walk: 9 }] }).samples);
    assert.equal(state.rounds, 7);
    assert.equal(maxRounds, 7);
    assert.equal(state.progress, 1);
    tr.manualAdd(1);
    assert.equal(tr.state().rounds, 7);
  }
});

test('never more than one round per plausible lap: rotation faster than anyone can walk a lap', () => {
  // 60 s of steps while the heading turns 20°/s (1200° ≈ 3.3 "laps") — physically ≤ 1 lap
  const tr = createTawafTracker({ kaaba: KAABA_CENTER });
  for (let i = 0; i <= 300; i++) tr.push({ t: i * 200, headingDeg: wrap360(-i * 4), step: i % 3 === 0 });
  assert.ok(tr.state().rounds <= 1, `rounds ${tr.state().rounds}`);
  assert.ok(tr.state().warnings.includes('implausible-rotation'));

  // spinning at 60°/s while stepping is a body/phone turn, not orbiting: nothing counts
  const tr2 = createTawafTracker({ kaaba: KAABA_CENTER });
  for (let i = 0; i <= 300; i++) tr2.push({ t: i * 200, headingDeg: wrap360(-i * 12), step: i % 3 === 0 });
  assert.equal(tr2.state().rounds, 0);
});

test('a U-turn (either way round) is not Tawaf progress → ≥95% exact', () => {
  // walk half a lap, turn round to fetch a companion, walk back a quarter, turn again, finish
  assert.equal(simulateTawaf({ seed: 1, script: [{ walk: 0.5 }, { walk: 0.25, direction: 'cw' }, { walk: 6.75 }] }).truth.rounds, 7);
  expectAccuracy('u-turn', (seed) => ({ seed, script: [{ walk: 0.5 }, { walk: 0.25, direction: 'cw' }, { walk: 6.75 }] }), 0.95);
});

// ---------------------------------------------------------------- manual override

test('manual +1 / -1 is respected and wins', () => {
  const tr = createTawafTracker({ kaaba: KAABA_CENTER });
  tr.manualAdd(-1);
  assert.equal(tr.state().rounds, 0); // never below 0
  tr.manualAdd(1);
  tr.manualAdd(1);
  assert.equal(tr.state().rounds, 2);
  assert.equal(tr.state().source, 'manual');
  tr.manualAdd(-1);
  assert.equal(tr.state().rounds, 1);
  tr.reset();
  assert.equal(tr.state().rounds, 0);
});

test('manual tap just before the line re-anchors: the same lap is not counted twice', () => {
  for (const seed of SEEDS.slice(0, 20)) {
    const tr = createTawafTracker({ kaaba: KAABA_CENTER });
    let tapped = false;
    let roundsAfterTap = -1;
    let checked = false;
    const gen = tawafStream({ seed, script: [{ walk: 7 }] });
    for (let r = gen.next(); !r.done; r = gen.next()) {
      const s = r.value as SimSample;
      tr.push(s);
      const deg = s.truthDeg ?? 0;
      if (!tapped && deg >= 4.93 * 360) {
        const before = tr.state().rounds;
        tr.manualAdd(1); // pilgrim taps at the Black Stone a bit early
        roundsAfterTap = tr.state().rounds;
        assert.equal(roundsAfterTap, before + 1);
        tapped = true;
      }
      if (tapped && !checked && deg >= 5.08 * 360) {
        assert.equal(tr.state().rounds, roundsAfterTap, `seed ${seed}: double count after tap`);
        checked = true;
      }
    }
    assert.ok(checked);
    assert.ok(tr.state().rounds <= 7);
  }
});

test('manual -1 corrects an over-count and auto-counting carries on', () => {
  const tr = createTawafTracker({ kaaba: KAABA_CENTER });
  const samples = simulateTawaf({ seed: 5, gps: 'off' }).samples as SimSample[];
  let corrected = false;
  for (const s of samples) {
    tr.push(s);
    if (!corrected && tr.state().rounds === 3) {
      tr.manualAdd(-1);
      assert.equal(tr.state().rounds, 2);
      corrected = true;
    }
  }
  assert.equal(tr.state().rounds, 6); // one fewer than walked, because the pilgrim said so
});

// ---------------------------------------------------------------- warnings & robustness

test('leaving the Mataf (good fixes > 250 m away) warns', () => {
  const tr = createTawafTracker({ kaaba: KAABA_CENTER });
  for (let i = 0; i < 10; i++) {
    const p = fromEnu(KAABA_CENTER, 400, 50);
    tr.push({ t: i * 1000, lat: p.lat, lng: p.lng, accuracyM: 8 });
  }
  assert.ok(tr.state().warnings.includes('outside-mataf'));
  // a multipath jump of the same distance with poor accuracy does not
  const tr2 = createTawafTracker({ kaaba: KAABA_CENTER });
  for (let i = 0; i < 10; i++) {
    const p = fromEnu(KAABA_CENTER, 300, 0);
    tr2.push({ t: i * 1000, lat: p.lat, lng: p.lng, accuracyM: 80 });
  }
  assert.ok(!tr2.state().warnings.includes('outside-mataf'));
});

test('no data → low confidence, no-signal; garbage samples are ignored', () => {
  const tr = createTawafTracker({ kaaba: KAABA_CENTER });
  assert.equal(tr.state().confidence, 'low');
  tr.push({ t: 0 });
  tr.push({ t: 1000, headingDeg: NaN, lat: null, lng: undefined });
  tr.push({ t: 500, headingDeg: 10 }); // out of order: dropped
  const st: TawafState = tr.state();
  assert.equal(st.rounds, 0);
  assert.ok(st.warnings.includes('no-signal'));
});

test('simulator and tracker are deterministic per seed', () => {
  const a = simulateTawaf({ seed: 42 });
  const b = simulateTawaf({ seed: 42 });
  assert.deepEqual(a.samples.slice(0, 500), b.samples.slice(0, 500));
  assert.deepEqual(run(a.samples).state, run(b.samples).state);
  const c = simulateTawaf({ seed: 43 });
  assert.notDeepEqual(a.samples.slice(0, 50), c.samples.slice(0, 50));
});
