import test from 'node:test';
import assert from 'node:assert/strict';
import { createSaiTracker } from './saiTracker';
import { KAABA_CENTER, MARWAH, SAFA } from './haramGeo';
import { distanceM } from './geo';
import { fromEnu, toEnu, type MotionSample } from './tawafTracker';
import { simulateSai, type SaiSimOptions, type SimSample } from './sensorSim';

const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);

function run(samples: MotionSample[]) {
  const tr = createSaiTracker();
  let maxRounds = 0;
  for (const s of samples) {
    tr.push(s);
    maxRounds = Math.max(maxRounds, tr.state().rounds);
  }
  return { tr, state: tr.state(), maxRounds };
}

function expectAccuracy(name: string, make: (seed: number) => SaiSimOptions, min: number) {
  const misses: string[] = [];
  for (const seed of SEEDS) {
    const sim = simulateSai(make(seed));
    const { state } = run(sim.samples);
    if (state.rounds !== sim.truth.rounds) misses.push(`seed ${seed}: ${state.rounds}/${sim.truth.rounds}`);
  }
  const rate = (SEEDS.length - misses.length) / SEEDS.length;
  assert.ok(rate >= min, `${name}: ${(rate * 100).toFixed(0)}% exact (< ${min * 100}%) — ${misses.join(', ')}`);
}

test('reference coordinates are sane (Safa ~150 m from the Kaaba, Mas`a ~380 m long)', () => {
  const len = distanceM(SAFA.lat, SAFA.lng, MARWAH.lat, MARWAH.lng);
  assert.ok(len > 340 && len < 420, `Safa-Marwah ${len.toFixed(0)} m`);
  const safaKaaba = distanceM(SAFA.lat, SAFA.lng, KAABA_CENTER.lat, KAABA_CENTER.lng);
  assert.ok(safaKaaba > 100 && safaKaaba < 200, `Safa-Kaaba ${safaKaaba.toFixed(0)} m`);
  assert.ok(MARWAH.lat > SAFA.lat, 'Marwah is north of Safa');
});

test("Sa'i 7 lengths (noisy GPS + compass + steps) → ≥98% exact, fusion", () => {
  expectAccuracy('default', (seed) => ({ seed }), 0.98);
  const { state } = run(simulateSai({ seed: 2 }).samples);
  assert.equal(state.rounds, 7);
  assert.equal(state.progress, 1);
  assert.equal(state.source, 'fusion');
});

test("Sa'i with compass + steps only (no GPS, dead reckoning self-calibrates at each hill) → ≥98%", () => {
  expectAccuracy('heading only', (seed) => ({ seed, gps: 'off' }), 0.98);
});

test("Sa'i with GPS + steps only (no compass) → ≥98%", () => {
  expectAccuracy('gps only', (seed) => ({ seed, heading: false }), 0.98);
});

test("Sa'i without a pedometer (GPS + compass) → ≥98%", () => {
  expectAccuracy('no steps', (seed) => ({ seed, steps: false }), 0.98);
});

test('turning back mid-way does not count (with and without GPS)', () => {
  expectAccuracy('turnbacks', (seed) => ({ seed, turnbacks: 2 }), 0.98);
  expectAccuracy('turnbacks, no gps', (seed) => ({ seed, turnbacks: 2, gps: 'off' }), 0.98);
});

test('every length is counted near a hill, never at a mid-way turn-back', () => {
  const L = Math.hypot(toEnu(SAFA, MARWAH).e, toEnu(SAFA, MARWAH).n);
  for (const seed of SEEDS.slice(0, 25)) {
    const tr = createSaiTracker();
    let last = 0;
    for (const s of simulateSai({ seed, turnbacks: 3 }).samples as SimSample[]) {
      tr.push(s);
      const r = tr.state().rounds;
      if (r !== last) {
        const x = s.truthM ?? 0;
        const hill = r % 2 === 1 ? L : 0; // odd rounds end at Marwah
        assert.ok(Math.abs(x - hill) < 80, `seed ${seed}: round ${r} counted ${Math.abs(x - hill).toFixed(0)} m from the hill`);
        last = r;
      }
    }
  }
});

test('walking half-way and coming back to Safa counts nothing', () => {
  for (const seed of SEEDS.slice(0, 20)) {
    // a 1-length Sa'i in which the pilgrim turns back for good is equivalent to: legs=0 + a walk out and back
    const out = simulateSai({ seed, legs: 1, turnbacks: 0 }).samples as SimSample[];
    // cut the walk at ~45% of the way and mirror it back
    const cut = out.findIndex((s) => (s.truthM ?? 0) > 170);
    const there = out.slice(0, cut);
    const back = there
      .slice()
      .reverse()
      .map((s, i) => ({ ...s, t: there[there.length - 1].t + (i + 1) * 200, headingDeg: s.headingDeg == null ? s.headingDeg : (s.headingDeg + 180) % 360 }));
    const { maxRounds } = run([...there, ...back]);
    assert.equal(maxRounds, 0, `seed ${seed}`);
  }
});

test('never above 7: 9 lengths walked → 7', () => {
  for (const seed of SEEDS.slice(0, 10)) {
    const { state, maxRounds } = run(simulateSai({ seed, legs: 9 }).samples);
    assert.equal(state.rounds, 7);
    assert.equal(maxRounds, 7);
  }
});

test('direction follows the walk; progress grows along the length', () => {
  const tr = createSaiTracker();
  const samples = simulateSai({ seed: 9 }).samples as SimSample[];
  let sawToMarwah = false;
  let sawToSafa = false;
  let midProgress = -1;
  for (const s of samples) {
    tr.push(s);
    const st = tr.state();
    if (st.direction === 'toMarwah') sawToMarwah = true;
    if (st.direction === 'toSafa') sawToSafa = true;
    if (midProgress < 0 && st.rounds === 0 && (s.truthM ?? 0) > 190) midProgress = st.progress;
  }
  assert.ok(sawToMarwah && sawToSafa);
  assert.ok(midProgress > 0.3 && midProgress < 0.75, `progress half-way ${midProgress}`);
});

test('manual +1 / -1 is respected and re-anchors at the hill', () => {
  const tr = createSaiTracker();
  tr.manualAdd(-1);
  assert.equal(tr.state().rounds, 0);
  tr.manualAdd(1); // "I'm at Marwah"
  assert.equal(tr.state().rounds, 1);
  assert.equal(tr.state().source, 'manual');
  assert.ok(Math.abs(tr.debug().metresFromSafa - tr.debug().lengthM) < 1);
  tr.manualAdd(-1);
  assert.equal(tr.state().rounds, 0);
  for (let i = 0; i < 10; i++) tr.manualAdd(1);
  assert.equal(tr.state().rounds, 7);
});

test('starting at Marwah warns (Sa`i begins at Safa)', () => {
  const tr = createSaiTracker();
  for (let i = 0; i < 20; i++) {
    const p = fromEnu(SAFA, toEnu(SAFA, MARWAH).e, toEnu(SAFA, MARWAH).n);
    tr.push({ t: i * 1000, lat: p.lat, lng: p.lng, accuracyM: 6 });
  }
  assert.ok(tr.state().warnings.includes('start-not-at-safa'));
});

test("leaving the Mas'a warns", () => {
  const tr = createSaiTracker();
  for (let i = 0; i < 10; i++) {
    const p = fromEnu(SAFA, -300, 100);
    tr.push({ t: i * 1000, lat: p.lat, lng: p.lng, accuracyM: 8 });
  }
  assert.ok(tr.state().warnings.includes('outside-masa'));
});
