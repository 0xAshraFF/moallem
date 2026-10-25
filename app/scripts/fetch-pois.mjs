#!/usr/bin/env node
// Builds the offline points-of-interest dataset (src/domain/pois.json) from
// OpenStreetMap via the Overpass API.
//
//   node scripts/fetch-pois.mjs            # fetch + write src/domain/pois.json
//   node scripts/fetch-pois.mjs --dry-run  # fetch + print counts only
//
// Data © OpenStreetMap contributors, available under the ODbL
// (https://www.openstreetmap.org/copyright). Keep the attribution in the app.
//
// Politeness: one Overpass query per area, sequential, with a pause between
// areas and exponential backoff on 429/5xx.

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = resolve(HERE, '../src/domain/pois.json');
const DRY_RUN = process.argv.includes('--dry-run');

// Mirrors first: the main instance is often "at capacity".
const ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];
const USER_AGENT = 'Moallem-Hajj-PWA/0.1 (offline POI dataset builder; node fetch)';

// ---------------------------------------------------------------------------
// Areas
// ---------------------------------------------------------------------------

/**
 * `mosqueWays` selects the OSM ways that make up the mosque building outline;
 * entrance nodes on those ways are treated as mosque gates.
 * `gateRadius` limits which other entrance/gate nodes may count as gates.
 */
const AREAS = [
  {
    area: 'makkah',
    centre: { lat: 21.4225, lng: 39.8262 }, // Kaaba
    filter: '(around:1500,21.4225,39.8262)',
    // Masjid al-Haram building multipolygon (relation 1472531)
    mosqueWays: 'rel(1472531);way(r);',
    gateRadius: 450,
  },
  {
    area: 'madinah',
    centre: { lat: 24.4688, lng: 39.6112 }, // Masjid an-Nabawi building centroid
    filter: '(around:1200,24.4672,39.6111)',
    // Masjid an-Nabawi building (way 461699097)
    mosqueWays: 'way(461699097);',
    gateRadius: 650,
  },
  {
    area: 'mashair', // Mina, Muzdalifah, Arafat
    centre: null,
    filter: '(21.33,39.86,21.43,40.00)',
    mosqueWays: null,
    gateRadius: 0,
  },
];

function buildQuery(a) {
  const F = a.filter;
  const mosque = a.mosqueWays
    ? `${a.mosqueWays}node(w)[entrance]->.mg;\n.mg out ids;\n`
    : '';
  // `out count;` emits a {type:"count"} element: everything before it is
  // a mosque-building entrance id, everything after it is a candidate.
  return `[out:json][timeout:180];
${mosque}out count;
(
  nwr${F}[amenity~"^(toilets|drinking_water|water_point|clinic|hospital|doctors|pharmacy|bus_station|fountain)$"];
  nwr${F}[healthcare~"^(clinic|hospital|doctor|centre|pharmacy)$"];
  nwr${F}[man_made~"^(water_tap|water_well)$"];
  nwr${F}[railway~"^(station|halt|stop)$"];
  nwr${F}[public_transport=station];
  nwr${F}[highway=bus_stop];
  nwr${F}[public_transport=platform][bus=yes];
  ${a.gateRadius ? `node${F}[entrance];
  node${F}[door][name];
  node${F}[historic=city_gate];
  node${F}[barrier=gate][name];` : ''}
  nwr${F}[~"^name(:en|:ar)?$"~"zamzam|زمزم|ablution|wudu|wudhu|وضوء|ميضأة",i];
);
out center tags;`;
}

// ---------------------------------------------------------------------------
// Overpass fetch with fallback + backoff
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(query, label) {
  let delay = 5000;
  for (let attempt = 1; attempt <= 5; attempt++) {
    for (const ep of ENDPOINTS) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: {
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: 'data=' + encodeURIComponent(query),
          signal: AbortSignal.timeout(200_000),
        });
        if (res.ok) {
          const json = await res.json();
          console.error(`[${label}] ${ep} -> ${json.elements.length} elements`);
          return json;
        }
        const retriable = res.status === 429 || res.status >= 500;
        console.error(`[${label}] ${ep} -> HTTP ${res.status}${retriable ? ' (retrying)' : ''}`);
        if (!retriable) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      } catch (err) {
        if (String(err.message).startsWith('HTTP 4')) throw err;
        console.error(`[${label}] ${ep} -> ${err.name === 'TimeoutError' ? 'timeout' : err.message}`);
      }
    }
    console.error(`[${label}] all endpoints busy, backing off ${delay / 1000}s`);
    await sleep(delay);
    delay *= 2;
  }
  throw new Error(`[${label}] Overpass failed after retries`);
}

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

const ARABIC = /[؀-ۿ]/;
const LATIN = /[A-Za-z]/;
const WUDU = /ablution|wudu|wudhu|وضوء|ميضأة|ميضاة/i;
const NOT_A_MOSQUE_GATE = /hotel|tower|jabal omar|jabel omar|hilton|hyatt|conrad|jumeirah|mall|commercial|centre|center|food court|parking|فندق|برج|مركز|مول/i;

function distM(a, b) {
  const r = Math.PI / 180;
  const x = (b.lng - a.lng) * r * Math.cos(((a.lat + b.lat) / 2) * r);
  const y = (b.lat - a.lat) * r;
  return 6371000 * Math.hypot(x, y);
}

const toAsciiDigits = (s) =>
  s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

function names(t) {
  let en = t['name:en'] || null;
  let ar = t['name:ar'] || null;
  const n = t.name || null;
  if (n && !ar && ARABIC.test(n)) ar = n;
  if (n && !en && LATIN.test(n) && !ARABIC.test(n)) en = n;
  // Drop machine transliterations like "MarkazSihhiMawsimiRaqm..." (no spaces).
  if (en && en.length >= 20 && !/\s/.test(en)) en = null;
  return { nameEn: en, nameAr: ar };
}

/** Gate numbers from the ref tag or from the digits in the names. */
function gateRef(t) {
  if (t.ref) return String(t.ref).trim();
  for (const n of [t['name:en'], t.name, t['name:ar']]) {
    if (!n) continue;
    const nums = toAsciiDigits(n).match(/\d+/g);
    if (nums) return [...new Set(nums)].join(', ');
  }
  return null;
}

function classify(t, ctx) {
  const text = [t.name, t['name:en'], t['name:ar'], t.description, t['description:en']]
    .filter(Boolean).join(' | ');
  const am = t.amenity, hc = t.healthcare, mm = t.man_made;

  // Gates (only around the two Harams)
  if (ctx.area.gateRadius && ctx.dist <= ctx.area.gateRadius && t.access !== 'no' && ctx.isNode) {
    if (ctx.inMosque && (t.entrance || t.door)) return 'gate';
    const nameLooksGate = /\bgate\b|\bbab\b|\bdoor\b|باب|مدخل|بوابة/i.test(text);
    const isEntrance = t.entrance || t.door;
    if (!NOT_A_MOSQUE_GATE.test(text) && !am && !t.shop && !t.tourism) {
      if (t.historic === 'city_gate') return 'gate';
      if (t.barrier === 'gate' && t.name) return 'gate';
      if (isEntrance && (nameLooksGate || /^\d+$/.test(t.ref || ''))) return 'gate';
    }
  }

  if (am === 'toilets') return 'toilet';
  if (WUDU.test(text) && (am === 'water_point' || am === 'drinking_water' || mm || !am)) return 'wudu';

  if (am === 'drinking_water' || am === 'water_point' || mm === 'water_tap') return 'water';
  if (mm === 'water_well' && (t.drinking_water === 'yes' || /zamzam|زمزم/i.test(text))) return 'water';
  if (am === 'fountain' && t.drinking_water === 'yes') return 'water';

  if (am === 'pharmacy' || hc === 'pharmacy') return 'pharmacy';
  if (['clinic', 'hospital', 'doctors'].includes(am) || ['clinic', 'hospital', 'doctor', 'centre'].includes(hc)) return 'clinic';

  const named = Boolean(t.name || t['name:en'] || t['name:ar']);
  const rail = t.railway === 'station' || t.railway === 'halt' ||
    (t.public_transport === 'station' && (t.railway || t.train === 'yes' || t.subway === 'yes' || t.light_rail === 'yes'));
  if (rail && named && !/under construction/i.test(text)) return 'station';
  if (t.railway === 'stop' && named) return 'station-stop';

  if (t.highway === 'bus_stop' || am === 'bus_station' ||
    (t.bus === 'yes' && (t.public_transport === 'platform' || t.public_transport === 'station'))) return 'bus';

  return null;
}

function normaliseArea(area, json) {
  const els = json.elements;
  const sep = els.findIndex((e) => e.type === 'count');
  const mosqueIds = new Set(els.slice(0, Math.max(sep, 0)).filter((e) => e.type === 'node').map((e) => e.id));
  const candidates = els.slice(sep + 1);

  const out = [];
  const seen = new Set();
  for (const e of candidates) {
    const key = `${e.type}-${e.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const t = e.tags || {};
    const lat = e.lat ?? e.center?.lat;
    const lng = e.lon ?? e.center?.lon;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    const dist = area.centre ? distM(area.centre, { lat, lng }) : 0;
    const kind = classify(t, { area, dist, inMosque: mosqueIds.has(e.id) && e.type === 'node', isNode: e.type === 'node' });
    if (!kind) continue;
    const { nameEn, nameAr } = names(t);
    let ref = t.ref ? String(t.ref) : null;
    if (kind === 'gate') ref = gateRef(t);
    if (kind === 'toilet' && !ref && /^\d+$/.test(t.name || '')) ref = t.name;
    out.push({
      id: `osm-${e.type}-${e.id}`,
      kind,
      area: area.area,
      lat: +lat.toFixed(6),
      lng: +lng.toFixed(6),
      nameEn: kind === 'toilet' && /^\d+$/.test(nameEn || '') ? null : nameEn,
      nameAr,
      ref,
    });
  }

  // Railway stop positions only when no station node is nearby (e.g. Mina 3 / Jamarat).
  const stations = out.filter((p) => p.kind === 'station');
  const pois = out.filter((p) => p.kind !== 'station-stop');
  for (const s of out.filter((p) => p.kind === 'station-stop')) {
    if (!stations.some((st) => distM(st, s) < 300)) pois.push({ ...s, kind: 'station' });
  }
  return dedupe(pois);
}

/** Drop same-kind points closer than 8 m unless they carry different names/refs. */
function dedupe(pois) {
  const richness = (p) => (p.ref ? 2 : 0) + (p.nameEn ? 1 : 0) + (p.nameAr ? 1 : 0) + (p.id.includes('node') ? 0.5 : 0);
  const sorted = [...pois].sort((a, b) => richness(b) - richness(a));
  const kept = [];
  const compatible = (x, y) => x == null || y == null || x === y;
  for (const p of sorted) {
    const dup = kept.find((k) => k.kind === p.kind && distM(k, p) < 8 &&
      compatible(k.ref, p.ref) && compatible(k.nameEn, p.nameEn) && compatible(k.nameAr, p.nameAr));
    if (dup) {
      dup.ref ??= p.ref; dup.nameEn ??= p.nameEn; dup.nameAr ??= p.nameAr;
      continue;
    }
    kept.push({ ...p });
  }
  return kept;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const KIND_ORDER = ['gate', 'toilet', 'wudu', 'water', 'clinic', 'pharmacy', 'station', 'bus'];

const all = [];
for (const [i, area] of AREAS.entries()) {
  if (i > 0) await sleep(3000); // be polite between areas
  const json = await overpass(buildQuery(area), area.area);
  all.push(...normaliseArea(area, json));
}

all.sort((a, b) =>
  AREAS.findIndex((x) => x.area === a.area) - AREAS.findIndex((x) => x.area === b.area) ||
  KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
  (a.ref && b.ref ? a.ref.localeCompare(b.ref, 'en', { numeric: true }) : 0) ||
  a.id.localeCompare(b.id));

// Counts table
const table = {};
for (const p of all) {
  table[p.kind] ??= Object.fromEntries(AREAS.map((a) => [a.area, 0]));
  table[p.kind][p.area]++;
}
console.table(KIND_ORDER.map((k) => ({ kind: k, ...(table[k] || {}) })));
console.error(`total ${all.length} POIs`);

if (!DRY_RUN) {
  const data = {
    generatedAt: new Date().toISOString(),
    source: '© OpenStreetMap contributors (ODbL)',
    pois: all,
  };
  // One POI per line keeps the file small but diff-friendly.
  const body = data.pois.map((p) => '    ' + JSON.stringify(p)).join(',\n');
  writeFileSync(OUT_FILE,
    `{\n  "generatedAt": ${JSON.stringify(data.generatedAt)},\n  "source": ${JSON.stringify(data.source)},\n  "pois": [\n${body}\n  ]\n}\n`);
  console.error(`wrote ${OUT_FILE}`);
}
