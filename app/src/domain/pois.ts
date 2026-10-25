// Points of interest from OpenStreetMap (scripts/fetch-pois.mjs), stored offline in pois.json.
import data from './pois.json';
import { distanceM } from './geo';

export type PoiKind = 'gate' | 'toilet' | 'wudu' | 'water' | 'clinic' | 'pharmacy' | 'station' | 'bus';
export type DestKind = PoiKind | 'hotel' | 'haram';

export interface Poi {
  id: string;
  kind: PoiKind;
  area: 'makkah' | 'madinah' | 'mashair';
  lat: number;
  lng: number;
  nameEn: string | null;
  nameAr: string | null;
  ref: string | null;
}

export interface Destination {
  id: string;
  kind: DestKind;
  lat: number;
  lng: number;
  labelBn: string;
  labelEn: string;
}

export const POIS = (data as { pois: Poi[] }).pois;
export const POI_SOURCE = (data as { source: string }).source;

const KIND_BN: Record<DestKind, string> = {
  gate: 'গেট', toilet: 'টয়লেট', wudu: 'ওযুখানা', water: 'পানি', clinic: 'ক্লিনিক', pharmacy: 'ফার্মেসি',
  station: 'ট্রেন স্টেশন', bus: 'বাস স্টপ', hotel: 'হোটেল', haram: 'হারাম',
};
const KIND_EN: Record<DestKind, string> = {
  gate: 'Gate', toilet: 'Toilet', wudu: 'Wudu', water: 'Water', clinic: 'Clinic', pharmacy: 'Pharmacy',
  station: 'Station', bus: 'Bus stop', hotel: 'Hotel', haram: 'Haram',
};

const bnNum = (s: string) => s.replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

export function poiLabel(p: Poi): { bn: string; en: string } {
  if (p.kind === 'gate' && p.ref) return { bn: `গেট ${bnNum(p.ref)}`, en: `Gate ${p.ref}` };
  return { bn: KIND_BN[p.kind], en: p.nameEn ?? KIND_EN[p.kind] };
}

export const kindLabel = (k: DestKind) => ({ bn: KIND_BN[k], en: KIND_EN[k] });

export function toDestination(p: Poi): Destination {
  const l = poiLabel(p);
  return { id: p.id, kind: p.kind, lat: p.lat, lng: p.lng, labelBn: l.bn, labelEn: l.en };
}

/** Nearest points of a kind, closest first, with straight-line distance. */
export function nearest(kind: PoiKind, lat: number, lng: number, n = 3, within = 3000) {
  return POIS.filter((p) => p.kind === kind)
    .map((p) => ({ poi: p, d: distanceM(lat, lng, p.lat, p.lng) }))
    .filter((x) => x.d <= within)
    .sort((a, b) => a.d - b.d)
    .slice(0, n);
}
