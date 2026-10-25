// Offline prayer times. Umm al-Qura convention (Fajr 18.5°, Isha 90 min after Maghrib, 120 in
// Ramadan) with Hanafi Asr (shadow = 2x object + noon shadow), as followed by Bangladeshi pilgrims.
// Checked against the AlAdhan API (method 4, school 1) in prayerTimes.test.ts.

export type PrayerId = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export interface PrayerTimes { fajr: number; sunrise: number; dhuhr: number; asr: number; maghrib: number; isha: number } // minutes after local midnight

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Sun declination and equation of time for a Julian day (NOAA / praytimes.org approximation). */
function sun(jd: number) {
  const D = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * D) % 360;
  const q = (280.459 + 0.98564736 * D) % 360;
  const L = (q + 1.915 * Math.sin(rad(g)) + 0.02 * Math.sin(rad(2 * g))) % 360;
  const e = 23.439 - 0.00000036 * D;
  const RA = deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(L)), Math.cos(rad(L)))) / 15;
  const decl = deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(L))));
  let eqt = q / 15 - ((RA % 24) + 24) % 24;
  eqt = ((eqt + 12) % 24 + 24) % 24 - 12;
  return { decl, eqt };
}

function julian(y: number, m: number, d: number) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

/** Hours from noon until the sun reaches `angle` below (positive) the horizon. */
function hourAngle(angle: number, lat: number, decl: number) {
  const v = (-Math.sin(rad(angle)) - Math.sin(rad(lat)) * Math.sin(rad(decl))) / (Math.cos(rad(lat)) * Math.cos(rad(decl)));
  return deg(Math.acos(Math.min(1, Math.max(-1, v)))) / 15;
}

/**
 * Prayer times for a date ('YYYY-MM-DD') at a place. tzHours: offset from UTC (Saudi Arabia = 3).
 * Results are minutes after local midnight, rounded to the minute like printed timetables.
 */
export function prayerTimes(ymd: string, lat: number, lng: number, tzHours = 3, opts: { ramadan?: boolean } = {}): PrayerTimes {
  const [y, m, d] = ymd.split('-').map(Number);
  const jd = julian(y, m, d) - lng / 360;
  // Iterate once at noon for a better sun position.
  let { decl, eqt } = sun(jd + 0.5);
  const noon = 12 + tzHours - lng / 15 - eqt;
  ({ decl, eqt } = sun(jd + (noon - tzHours) / 24));
  const dhuhr = 12 + tzHours - lng / 15 - eqt;
  const sunriseH = dhuhr - hourAngle(0.833, lat, decl);
  const sunsetH = dhuhr + hourAngle(0.833, lat, decl);
  const fajrH = dhuhr - hourAngle(18.5, lat, decl);
  // Hanafi Asr: shadow factor 2.
  const asrAngle = -deg(Math.atan(1 / (2 + Math.tan(rad(Math.abs(lat - decl))))));
  const asrH = dhuhr + hourAngle(asrAngle, lat, decl);
  const toMin = (h: number) => Math.round(h * 60);
  const maghrib = toMin(sunsetH);
  return {
    fajr: toMin(fajrH), sunrise: toMin(sunriseH), dhuhr: toMin(dhuhr), asr: toMin(asrH),
    maghrib, isha: maghrib + (opts.ramadan ? 120 : 90),
  };
}

export const PRAYER_BN: Record<PrayerId, string> = { fajr: 'ফজর', sunrise: 'সূর্যোদয়', dhuhr: 'জোহর', asr: 'আসর', maghrib: 'মাগরিব', isha: 'এশা' };
export const PRAYER_EN: Record<PrayerId, string> = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };

/** The next prayer from `nowMin` (minutes after midnight). Rolls to tomorrow's Fajr after Isha. */
export function nextPrayer(t: PrayerTimes, nowMin: number): { id: PrayerId; at: number; inMin: number } {
  const order: PrayerId[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (const id of order) if (t[id] > nowMin) return { id, at: t[id], inMin: t[id] - nowMin };
  return { id: 'fajr', at: t.fajr, inMin: t.fajr + 1440 - nowMin };
}

export const hhmm = (min: number) => `${Math.floor(min / 60) % 24}:${String(min % 60).padStart(2, '0')}`;

/** Heat guidance for older pilgrims by "feels like" temperature (°C). */
export type HeatLevel = 'ok' | 'caution' | 'danger' | 'extreme';
export function heatLevel(feelsLike: number): HeatLevel {
  if (feelsLike >= 46) return 'extreme';
  if (feelsLike >= 40) return 'danger';
  if (feelsLike >= 33) return 'caution';
  return 'ok';
}
export const HEAT_ADVICE: Record<HeatLevel, { bn: string; en: string }> = {
  ok: { bn: 'আবহাওয়া সহনীয়', en: 'Weather is fine' },
  caution: { bn: 'ছাতা নিন, পানি পান করুন', en: 'Take an umbrella, drink water' },
  danger: { bn: 'দুপুরে বাইরে কম থাকুন', en: 'Stay out of the midday sun' },
  extreme: { bn: 'খুব গরম। ছায়ায় থাকুন, পানি পান করুন', en: 'Extreme heat. Stay in shade, keep drinking' },
};
