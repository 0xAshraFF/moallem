import test from 'node:test';
import assert from 'node:assert/strict';
import { heatLevel, hhmm, nextPrayer, prayerTimes } from './prayerTimes';

// Reference: api.aladhan.com, method 4 (Umm al-Qura), school 1 (Hanafi Asr), fetched 2026-10-26.
const REF = [
  { name: 'Makkah, Arafah day 1448', ymd: '2027-05-15', lat: 21.4225, lng: 39.8262, t: { fajr: '4:19', sunrise: '5:43', dhuhr: '12:17', asr: '16:51', maghrib: '18:52', isha: '20:22' } },
  { name: 'Makkah, winter', ymd: '2027-01-01', lat: 21.4225, lng: 39.8262, t: { fajr: '5:37', sunrise: '6:58', dhuhr: '12:24', asr: '16:14', maghrib: '17:50', isha: '19:20' } },
  { name: 'Madinah', ymd: '2027-05-15', lat: 24.4672, lng: 39.6111, t: { fajr: '4:12', sunrise: '5:38', dhuhr: '12:18', asr: '16:57', maghrib: '18:58', isha: '20:28' } },
];

for (const r of REF) {
  test(`prayer times match Umm al-Qura + Hanafi Asr within 2 min: ${r.name}`, () => {
    const p = prayerTimes(r.ymd, r.lat, r.lng, 3);
    for (const [k, v] of Object.entries(r.t)) {
      const [h, m] = v.split(':').map(Number);
      const diff = Math.abs(p[k as keyof typeof p] - (h * 60 + m));
      assert.ok(diff <= 2, `${k}: got ${hhmm(p[k as keyof typeof p])}, expected ${v}`);
    }
  });
}

test('next prayer rolls over to tomorrow Fajr after Isha', () => {
  const p = prayerTimes('2027-05-15', 21.4225, 39.8262);
  assert.equal(nextPrayer(p, 13 * 60).id, 'asr');
  const late = nextPrayer(p, 23 * 60);
  assert.equal(late.id, 'fajr');
  assert.ok(late.inMin > 0 && late.inMin < 8 * 60);
});

test('heat levels', () => {
  assert.equal(heatLevel(30), 'ok');
  assert.equal(heatLevel(38), 'caution');
  assert.equal(heatLevel(43), 'danger');
  assert.equal(heatLevel(49), 'extreme');
});
