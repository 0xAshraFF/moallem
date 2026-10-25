import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateBdPid,
  calculateDistanceDiscrepancy,
  calculateLuggageStatus,
  evaluateStoningWindow,
  validateTenDhulHijjahSequence,
  getIhramRuleForSector,
  resolveHolySiteFromGps,
  HOLY_SITE_COORDINATES,
  calculateTawafSummaryMetrics,
  analyzeTawafCrowdTraffic,
  evaluateOverallTawafRecommendation,
  DEFAULT_HAJJ_CHECKLIST_ITEMS,
  calculateChecklistProgress,
} from './hajjLogic';

test('validateBdPid accepts valid 11-digit ASCII and Bangla numerals and rejects invalid lengths', () => {
  const validAscii = validateBdPid('20270849210');
  assert.equal(validAscii.valid, true);
  assert.equal(validAscii.normalized, '20270849210');

  const validBangla = validateBdPid('২০২৭০৮৪৯২১০');
  assert.equal(validBangla.valid, true);
  assert.equal(validBangla.normalized, '20270849210');

  const shortPid = validateBdPid('202708');
  assert.equal(shortPid.valid, false);
  assert.ok(shortPid.errorBn?.includes('১১ সংখ্যার'));

  const nonNumeric = validateBdPid('2027084921A');
  assert.equal(nonNumeric.valid, false);
});

test('calculateDistanceDiscrepancy detects severe brochure vs GPS fraud accurately', () => {
  const fraudCase = calculateDistanceDiscrepancy(400, 1120);
  assert.equal(fraudCase.diffMeters, 720);
  assert.equal(fraudCase.overstatementPercent, 180);
  assert.equal(fraudCase.status, 'severe_fraud');

  const honestCase = calculateDistanceDiscrepancy(350, 410);
  assert.equal(honestCase.status, 'honest');
});

test('calculateLuggageStatus tracks 2x23kg bags, overweight flags, and SAR to BDT conversion', () => {
  const summary = calculateLuggageStatus(
    [
      { id: '1', nameBn: 'আজওয়া খেজুর', nameEn: 'Ajwa Dates', weightKg: 15, priceSar: 300, bag: 1 },
      { id: '2', nameBn: 'জায়নামাজ ও তসবিহ', nameEn: 'Prayer Mats', weightKg: 9.5, priceSar: 150, bag: 1 },
      { id: '3', nameBn: 'সাধারণ কাপড়', nameEn: 'Clothes', weightKg: 18, priceSar: 200, bag: 2 },
    ],
    32.5,
    true
  );

  assert.equal(summary.bag1WeightKg, 24.5);
  assert.equal(summary.bag1Overweight, true);
  assert.equal(summary.bag2WeightKg, 18);
  assert.equal(summary.bag2Overweight, false);
  assert.equal(summary.totalPriceSar, 650);
  assert.equal(summary.totalPriceBdt, 21125);
  assert.equal(summary.zamzamLiters, 5);
});

test('evaluateStoningWindow enforces Hanafi post-Zawal rule on 11-13 Dhul Hijjah and crowd safety on 10th', () => {
  const morningTen = evaluateStoningWindow(10, 8);
  assert.equal(morningTen.status, 'danger_crowd');

  const eveningTen = evaluateStoningWindow(10, 17);
  assert.equal(eveningTen.status, 'optimal_safe');

  const beforeZawalEleven = evaluateStoningWindow(11, 9);
  assert.equal(beforeZawalEleven.status, 'invalid_before_zawal');

  const afternoonEleven = evaluateStoningWindow(11, 17);
  assert.equal(afternoonEleven.status, 'optimal_safe');
});

test('validateTenDhulHijjahSequence prevents Halq before Rami and Qurbani per Hanafi Wajib Tartib', () => {
  const initial = { ramiDone: false, qurbaniDone: false, halqDone: false, tawafZiyarahDone: false };

  // Trying Halq before Rami/Qurbani must fail with Dam warning
  const prematureHalq = validateTenDhulHijjahSequence(initial, 'halqDone');
  assert.equal(prematureHalq.allowed, false);
  assert.ok(prematureHalq.warningBn?.includes('দম'));

  // Rami first is allowed
  const ramiFirst = validateTenDhulHijjahSequence(initial, 'ramiDone');
  assert.equal(ramiFirst.allowed, true);

  // After Rami and Qurbani, Halq is allowed
  const readyForHalq = { ramiDone: true, qurbaniDone: true, halqDone: false, tawafZiyarahDone: false };
  const validHalq = validateTenDhulHijjahSequence(readyForHalq, 'halqDone');
  assert.equal(validHalq.allowed, true);
});

test('getIhramRuleForSector differentiates Jeddah vs Madinah landing sectors', () => {
  const jeddah = getIhramRuleForSector('jeddah');
  assert.ok(jeddah.headlineBn.includes('ঢাকা থেকেই'));
  const madinah = getIhramRuleForSector('madinah');
  assert.ok(madinah.headlineBn.includes('বাঁধতে হবে না'));
});

test('resolveHolySiteFromGps maps GPS coordinates to Arafat, Madinah, Mina, Jamarat, and Makkah', () => {
  const arafatRes = resolveHolySiteFromGps(
    HOLY_SITE_COORDINATES.arafat.lat,
    HOLY_SITE_COORDINATES.arafat.lng
  );
  assert.equal(arafatRes.locationId, 'arafat');
  assert.equal(arafatRes.isInsideArafatOfficialBoundary, true);

  const madinahRes = resolveHolySiteFromGps(
    HOLY_SITE_COORDINATES.madinah.lat,
    HOLY_SITE_COORDINATES.madinah.lng
  );
  assert.equal(madinahRes.locationId, 'madinah');

  const minaRes = resolveHolySiteFromGps(
    HOLY_SITE_COORDINATES.mina.lat,
    HOLY_SITE_COORDINATES.mina.lng
  );
  assert.equal(minaRes.locationId, 'mina');

  const jamaratRes = resolveHolySiteFromGps(
    HOLY_SITE_COORDINATES.jamarat.lat,
    HOLY_SITE_COORDINATES.jamarat.lng
  );
  assert.equal(jamaratRes.locationId, 'jamarat');

  const makkahRes = resolveHolySiteFromGps(
    HOLY_SITE_COORDINATES.makkah.lat,
    HOLY_SITE_COORDINATES.makkah.lng
  );
  assert.equal(makkahRes.locationId, 'makkah');
});

test('calculateTawafSummaryMetrics computes Strava-style distance, pace, and remaining Hajj Tawaf goal (e.g. 50)', () => {
  const metrics = calculateTawafSummaryMetrics({
    currentLap: 4,
    todayLapsCompleted: 14, // 2 full Tawafs today
    elapsedSeconds: 2280, // 38m 00s
    hajjTargetTawafs: 50,
    hajjCompletedTawafs: 12,
    floor: 'ground_mataf',
  });

  assert.equal(metrics.distanceKm, 4.9); // 14 * 0.35 km
  assert.equal(metrics.durationFormatted, '38:00');
  assert.equal(metrics.hajjTargetTawafs, 50);
  assert.equal(metrics.hajjCompletedTawafs, 12);
  assert.equal(metrics.hajjRemainingTawafs, 38);
  assert.equal(metrics.hajjGoalCompletionPercent, 24);
  assert.equal(metrics.currentLapRingPercent, 57);
});

test('analyzeTawafCrowdTraffic detects fast flow vs heavy congestion from app user lap durations', () => {
  const fastTraffic = analyzeTawafCrowdTraffic('ground_mataf', [290, 300, 310], 42);
  assert.equal(fastTraffic.trafficLevel, 'green_fast');

  const moderateTraffic = analyzeTawafCrowdTraffic('ground_mataf', [400, 415, 420], 89);
  assert.equal(moderateTraffic.trafficLevel, 'yellow_moderate');
  assert.ok(moderateTraffic.delayMinutes > 5);

  const congestedTraffic = analyzeTawafCrowdTraffic('ground_mataf', [560, 580, 600], 210);
  assert.equal(congestedTraffic.trafficLevel, 'red_congested');
  assert.ok(congestedTraffic.delayMinutes > 16);
});

test('evaluateOverallTawafRecommendation aggregates anonymous pilgrim sessions and identifies best Haram floor', () => {
  const ground = analyzeTawafCrowdTraffic('ground_mataf', [400, 410, 405], 140); // yellow_moderate (~47 min)
  const first = analyzeTawafCrowdTraffic('first_floor', [405, 410, 408], 60); // green_fast (~48 min, 0 delay)
  const wheelchair = analyzeTawafCrowdTraffic('wheelchair_lane', [355, 360], 30); // green_fast (~42 min, 0 delay)
  const roof = analyzeTawafCrowdTraffic('roof_level', [465, 470], 40); // green_fast (~55 min, 0 delay)

  const summary = evaluateOverallTawafRecommendation([ground, first, wheelchair, roof]);
  assert.equal(summary.totalAnonymousPilgrims, 270);
  assert.equal(summary.isGoodTimeNow, true);
  assert.equal(summary.bestFloor.floor, 'wheelchair_lane');
  assert.equal(summary.hourlyForecast.length, 6);
  assert.ok(summary.hourlyForecast.some((slot) => slot.isCurrentWindow));
});

test('calculateChecklistProgress computes categorized and critical readiness accurately', () => {
  const defaultProgress = calculateChecklistProgress(DEFAULT_HAJJ_CHECKLIST_ITEMS, {});
  assert.equal(defaultProgress.totalCount, 14);
  assert.equal(defaultProgress.completedCount, 6); // 6 items defaultChecked: true
  assert.equal(defaultProgress.remainingCount, 8);
  assert.equal(defaultProgress.allCriticalReady, false);
  assert.equal(defaultProgress.byCategory.documents.total, 4);
  assert.equal(defaultProgress.byCategory.documents.completed, 3);

  const allCheckedMap: Record<string, boolean> = {};
  for (const item of DEFAULT_HAJJ_CHECKLIST_ITEMS) {
    allCheckedMap[item.id] = true;
  }
  const fullProgress = calculateChecklistProgress(DEFAULT_HAJJ_CHECKLIST_ITEMS, allCheckedMap);
  assert.equal(fullProgress.completedCount, 14);
  assert.equal(fullProgress.completionPercent, 100);
  assert.equal(fullProgress.allCriticalReady, true);
  assert.equal(fullProgress.criticalRemaining, 0);
});




