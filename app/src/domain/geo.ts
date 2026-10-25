// Which holy site is the pilgrim at? Circle geofences for now; swap for official polygons later.
// Fixes the draft bugs: Muzdalifah resolved as Arafah, Dhaka as Madinah, Jeddah as Makkah.

export type SiteId =
  | 'makkah' | 'mina' | 'jamarat' | 'muzdalifah' | 'arafah' | 'madinah' | 'quba' | 'uhud' | 'jeddah' | 'dhaka' | 'elsewhere';

export interface Site {
  id: Exclude<SiteId, 'elsewhere'>;
  nameBn: string;
  nameEn: string;
  lat: number;
  lng: number;
  radiusM: number;
  photo: string; // file in /img
  photoNight?: string;
}

export const SITES: Site[] = [
  { id: 'makkah', nameBn: 'মসজিদুল হারাম', nameEn: 'Masjid al-Haram', lat: 21.4225, lng: 39.8262, radiusM: 2500, photo: 'kaaba-close', photoNight: 'tawaf-night' },
  { id: 'jamarat', nameBn: 'জামারাত', nameEn: 'Jamarat', lat: 21.4207, lng: 39.8728, radiusM: 900, photo: 'jamarat' },
  { id: 'mina', nameBn: 'মিনা', nameEn: 'Mina', lat: 21.4133, lng: 39.8933, radiusM: 3200, photo: 'mina' },
  { id: 'muzdalifah', nameBn: 'মুযদালিফা', nameEn: 'Muzdalifah', lat: 21.3833, lng: 39.9361, radiusM: 3000, photo: 'muzdalifah' },
  { id: 'arafah', nameBn: 'আরাফাহ', nameEn: 'Arafah', lat: 21.3549, lng: 39.9841, radiusM: 5500, photo: 'arafat' },
  { id: 'madinah', nameBn: 'মসজিদে নববী', nameEn: "Prophet's Mosque", lat: 24.4672, lng: 39.6111, radiusM: 8000, photo: 'madinah-dome', photoNight: 'madinah-umbrellas' },
  { id: 'quba', nameBn: 'মসজিদে কুবা', nameEn: 'Quba Mosque', lat: 24.4393, lng: 39.6173, radiusM: 500, photo: 'quba' },
  { id: 'uhud', nameBn: 'উহুদ পাহাড়', nameEn: 'Mount Uhud', lat: 24.5016, lng: 39.6156, radiusM: 1500, photo: 'uhud' },
  { id: 'jeddah', nameBn: 'জেদ্দা হজ টার্মিনাল', nameEn: 'Jeddah Hajj Terminal', lat: 21.6796, lng: 39.1565, radiusM: 4000, photo: 'jeddah' },
  { id: 'dhaka', nameBn: 'ঢাকা বিমানবন্দর ও হজ ক্যাম্প', nameEn: 'Dhaka airport & Hajj camp', lat: 23.8466, lng: 90.4030, radiusM: 4000, photo: 'dhaka' },
];

export function distanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Picks the site whose geofence the point is deepest inside; 'elsewhere' when outside all. */
export function resolveSite(lat: number, lng: number): { id: SiteId; site: Site | null; distanceM: number } {
  let best: { site: Site; ratio: number; d: number } | null = null;
  for (const site of SITES) {
    const d = distanceM(lat, lng, site.lat, site.lng);
    const ratio = d / site.radiusM;
    if (ratio <= 1 && (!best || ratio < best.ratio)) best = { site, ratio, d };
  }
  if (!best) return { id: 'elsewhere', site: null, distanceM: 0 };
  return { id: best.site.id, site: best.site, distanceM: best.d };
}

export const siteById = (id: SiteId) => SITES.find((s) => s.id === id) ?? null;

/** Plain Bangla "last seen" wording. Calm, never alarming. */
export type Freshness = 'live' | 'recent' | 'stale';
export function freshness(lastTs: number | null, now = Date.now()): Freshness {
  if (lastTs === null) return 'stale';
  const s = (now - lastTs) / 1000;
  if (s < 120) return 'live';
  if (s < 15 * 60) return 'recent';
  return 'stale';
}

/** Compass bearing from point A to point B, degrees 0-360 (0 = north). */
export function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(rad(lng2 - lng1)) * Math.cos(rad(lat2));
  const x = Math.cos(rad(lat1)) * Math.sin(rad(lat2)) - Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(rad(lng2 - lng1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Older pilgrims in crowds walk slowly: ~45 m per minute. */
export const walkMinutes = (meters: number) => Math.max(1, Math.round(meters / 45));
