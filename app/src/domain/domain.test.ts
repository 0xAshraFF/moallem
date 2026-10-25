import test from 'node:test';
import assert from 'node:assert/strict';
import { freshness, resolveSite, SITES } from './geo';
import { ramiWindow, toMin } from './rulings';
import { answerOffline } from './intents';

test('every site centre resolves to itself', () => {
  for (const s of SITES) assert.equal(resolveSite(s.lat, s.lng).id, s.id);
});

test('Muzdalifah is not Arafah (draft bug)', () => {
  assert.equal(resolveSite(21.3833, 39.9361).id, 'muzdalifah');
});

test('Dhaka and Jeddah are elsewhere (draft bugs)', () => {
  assert.equal(resolveSite(23.8103, 90.4125).id, 'elsewhere');
  assert.equal(resolveSite(21.5433, 39.1728).id, 'elsewhere');
});

test('Jamarat wins over Mina when standing on the bridge', () => {
  assert.equal(resolveSite(21.4207, 39.8728).id, 'jamarat');
});

const T = { fajr: toMin(4, 12), zawal: toMin(12, 18), asr: toMin(15, 38) };

test('Rami on the 10th is invalid before Fajr (draft bug)', () => {
  assert.equal(ramiWindow(10, toMin(3, 0), T).verdict, 'invalid');
  assert.equal(ramiWindow(10, toMin(7, 0), T).verdict, 'valid');
});

test('Rami on 11-13 needs true Zawal, not 12:00 (draft bug)', () => {
  assert.equal(ramiWindow(11, toMin(12, 5), T).verdict, 'invalid');
  assert.equal(ramiWindow(11, toMin(13, 0), T).verdict, 'valid');
  assert.equal(ramiWindow(12, toMin(16, 0), T).verdict, 'best_for_elderly');
});

test('Tawaf questions no longer get the wudu answer (draft bug)', () => {
  assert.equal(answerOffline('তাওয়াফ কিভাবে করব?').topic, 'tawaf');
  assert.equal(answerOffline('তাওয়াফে ওযু ভেঙে গেছে').topic, 'wudu_tawaf');
  assert.equal(answerOffline('ভুলে আতর লেগেছে').topic, 'perfume');
  assert.equal(answerOffline('hello').topic, 'generic');
});

test('freshness boundaries', () => {
  const now = 1_000_000_000;
  assert.equal(freshness(now - 119_000, now), 'live');
  assert.equal(freshness(now - 121_000, now), 'recent');
  assert.equal(freshness(now - 901_000, now), 'stale');
  assert.equal(freshness(null, now), 'stale');
});
