// The nearest place of a kind from where the pilgrim stands (used by Ask and the map).
import { distanceM, walkMinutes } from '../domain/geo';
import { nearest, toDestination, type DestKind, type Destination, type PoiKind } from '../domain/pois';
import type { Hotel } from './location';

const CENTERS = { makkah: { lat: 21.42251, lng: 39.82616 }, madinah: { lat: 24.46723, lng: 39.6111 } };

export function nearestDest(kind: DestKind, pos: { lat: number; lng: number }, hotels: Hotel[]): { d: Destination; m: number; min: number } | null {
  const city = distanceM(pos.lat, pos.lng, CENTERS.madinah.lat, CENTERS.madinah.lng) < 30000 ? 'madinah' : 'makkah';
  let d: Destination | null = null;
  if (kind === 'hotel') {
    const h = hotels.find((x) => x.city === city);
    if (h) d = { id: `hotel-${h.city}`, kind: 'hotel', lat: h.lat, lng: h.lng, labelBn: h.name, labelEn: 'Your hotel' };
  } else if (kind === 'haram') {
    const g = nearest('gate', pos.lat, pos.lng, 1, 5000)[0];
    d = g ? { ...toDestination(g.poi), kind: 'haram' } : { id: `haram-${city}`, kind: 'haram', ...CENTERS[city], labelBn: 'হারাম', labelEn: 'Haram' };
  } else {
    const hit = nearest(kind as PoiKind, pos.lat, pos.lng, 1, 3000)[0];
    if (hit) d = toDestination(hit.poi);
  }
  if (!d) return null;
  const m = Math.round(distanceM(pos.lat, pos.lng, d.lat, d.lng));
  return { d, m, min: walkMinutes(m) };
}
