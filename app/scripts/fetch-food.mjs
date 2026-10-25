// Adds tea (cafe) and food (restaurant / fast food) spots around both Harams to pois.json.
// Usage: node scripts/fetch-food.mjs   (data © OpenStreetMap contributors, ODbL)
import { readFileSync, writeFileSync } from 'node:fs';

const ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];
const AREAS = [
  { area: 'makkah', lat: 21.4225, lng: 39.8262, r: 1500 },
  { area: 'madinah', lat: 24.4672, lng: 39.6111, r: 1200 },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(q) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const url = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(60000), method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'User-Agent': 'MoallemApp/0.1', 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (r.ok) return (await r.json()).elements;
      console.log('retry', url, r.status);
    } catch (e) { console.log('retry', url, e.message); }
    await sleep(3000 * (attempt + 1));
  }
  throw new Error('overpass failed');
}

const file = new URL('../src/domain/pois.json', import.meta.url);
const data = JSON.parse(readFileSync(file, 'utf8'));
data.pois = data.pois.filter((p) => p.kind !== 'tea' && p.kind !== 'food');
for (const a of AREAS) {
  const q = `[out:json][timeout:50];(nwr(around:${a.r},${a.lat},${a.lng})["amenity"~"^(cafe|restaurant|fast_food)$"];);out center tags;`;
  const els = await overpass(q);
  let n = 0;
  for (const e of els) {
    const lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon;
    if (lat == null) continue;
    const kind = e.tags.amenity === 'cafe' ? 'tea' : 'food';
    data.pois.push({ id: `osm-${e.type}-${e.id}`, kind, area: a.area, lat: +lat.toFixed(6), lng: +lng.toFixed(6),
      nameEn: e.tags['name:en'] ?? e.tags.name ?? null, nameAr: e.tags['name:ar'] ?? null, ref: null });
    n++;
  }
  console.log(a.area, n);
}
data.generatedAt = new Date().toISOString();
writeFileSync(file, JSON.stringify(data));
