import test from 'node:test';
import assert from 'node:assert/strict';
import { dayById, stepsFor } from './days';

const umrah = dayById('umrah');

test('Tamattu brother: Umrah has Tawaf, Sa\'i and hair cut, with Raml', () => {
  const s = stepsFor(umrah, { gender: 'male', hajjType: 'tamattu' });
  assert.ok(s.some((x) => x.icon === 'scissors'));
  assert.ok(s.find((x) => x.icon === 'tawaf')!.detailBn.includes('রমল'));
  assert.equal(s.find((x) => x.icon === 'tawaf')!.weight, 'fard');
});

test('sister: no Raml, hair cut by a fingertip, normal walk between the green lights', () => {
  const s = stepsFor(umrah, { gender: 'female', hajjType: 'tamattu' });
  assert.ok(s.find((x) => x.icon === 'tawaf')!.detailBn.includes('রমল নেই'));
  assert.ok(s.find((x) => x.icon === 'scissors')!.detailBn.includes('এক কর'));
  assert.ok(s.find((x) => x.icon === 'sai')!.detailBn.includes('স্বাভাবিক'));
});

test('Qiran: no hair cut after Umrah, stays in Ihram', () => {
  const s = stepsFor(umrah, { gender: 'male', hajjType: 'qiran' });
  assert.ok(!s.some((x) => x.icon === 'scissors'));
  assert.ok(s.some((x) => x.bn === 'ইহরাম খুলবেন না'));
});

test('Ifrad: arrival Tawaf is Sunnah, no Sa\'i or hair cut, sacrifice not required', () => {
  const s = stepsFor(umrah, { gender: 'male', hajjType: 'ifrad' });
  assert.equal(s.find((x) => x.icon === 'tawaf')!.weight, 'sunnah');
  assert.ok(!s.some((x) => x.icon === 'sai'));
  const eid = stepsFor(dayById('eid'), { gender: 'male', hajjType: 'ifrad' });
  assert.equal(eid.find((x) => x.icon === 'beef')!.weight, 'sunnah');
  const eidT = stepsFor(dayById('eid'), { gender: 'male', hajjType: 'tamattu' });
  assert.equal(eidT.find((x) => x.icon === 'beef')!.weight, 'wajib');
});

test('Arafah: standing is ফরজ; no Maghrib at Arafah is ওয়াজিব', () => {
  const s = stepsFor(dayById('arafah'), { gender: 'male', hajjType: 'tamattu' });
  assert.equal(s[0].weight, 'fard');
  assert.equal(s.find((x) => x.icon === 'ban')!.weight, 'wajib');
});
