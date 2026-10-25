// Walking routes for guidance. Uses the public OSRM foot router when online; falls back to a
// straight line with a compass arrow (useful inside the Haram plaza where streets end).
import { bearingDeg, distanceM } from '../domain/geo';

export type Turn = 'straight' | 'left' | 'right' | 'slight-left' | 'slight-right' | 'uturn' | 'arrive';

export interface Step { turn: Turn; distance: number; lat: number; lng: number; name: string }
export interface Route { points: Array<[number, number]>; distance: number; steps: Step[]; offline: boolean }

const cache = new Map<string, Route>();

function turnOf(type: string, modifier?: string): Turn {
  if (type === 'arrive') return 'arrive';
  switch (modifier) {
    case 'left': case 'sharp left': return 'left';
    case 'right': case 'sharp right': return 'right';
    case 'slight left': return 'slight-left';
    case 'slight right': return 'slight-right';
    case 'uturn': return 'uturn';
    default: return 'straight';
  }
}

export async function walkingRoute(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<Route> {
  const key = `${from.lat.toFixed(4)},${from.lng.toFixed(4)}>${to.lat.toFixed(5)},${to.lng.toFixed(5)}`;
  if (cache.has(key)) return cache.get(key)!;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
    const j = await (await fetch(url, { signal: ctrl.signal })).json();
    clearTimeout(timer);
    const r = j.routes?.[0];
    if (!r) throw new Error('no route');
    const route: Route = {
      points: r.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
      distance: r.distance,
      steps: r.legs[0].steps.map((s: { maneuver: { type: string; modifier?: string; location: [number, number] }; distance: number; name: string }) => ({
        turn: turnOf(s.maneuver.type, s.maneuver.modifier), distance: s.distance,
        lng: s.maneuver.location[0], lat: s.maneuver.location[1], name: s.name,
      })),
      offline: false,
    };
    // The router snaps to streets; finish the last metres straight to the door.
    route.points.push([to.lat, to.lng]);
    cache.set(key, route);
    return route;
  } catch {
    const d = distanceM(from.lat, from.lng, to.lat, to.lng);
    return { points: [[from.lat, from.lng], [to.lat, to.lng]], distance: d, offline: true,
      steps: [{ turn: 'straight', distance: d, lat: from.lat, lng: from.lng, name: '' }, { turn: 'arrive', distance: 0, lat: to.lat, lng: to.lng, name: '' }] };
  }
}

/** Where along the route the walker is: remaining metres, next turn, and the point to aim at. */
export function progressOn(route: Route, lat: number, lng: number) {
  let best = 0, bestD = Infinity;
  route.points.forEach(([plat, plng], i) => { const d = distanceM(lat, lng, plat, plng); if (d < bestD) { bestD = d; best = i; } });
  let remaining = distanceM(lat, lng, route.points[Math.min(best + 1, route.points.length - 1)][0], route.points[Math.min(best + 1, route.points.length - 1)][1]);
  for (let i = best + 1; i < route.points.length - 1; i++) remaining += distanceM(route.points[i][0], route.points[i][1], route.points[i + 1][0], route.points[i + 1][1]);
  const aim = route.points[Math.min(best + 1, route.points.length - 1)];
  const next = route.steps.find((s) => s.turn !== 'straight' && distanceM(lat, lng, s.lat, s.lng) > 8 &&
    route.points.findIndex(([a, b]) => distanceM(a, b, s.lat, s.lng) < 6) >= best) ?? route.steps[route.steps.length - 1];
  return {
    remaining: Math.round(remaining),
    offRoute: bestD > 40,
    aimBearing: bearingDeg(lat, lng, aim[0], aim[1]),
    next,
    toNext: Math.round(distanceM(lat, lng, next.lat, next.lng)),
  };
}

export const TURN_BN: Record<Turn, string> = {
  straight: 'সোজা যান', left: 'বামে ঘুরুন', right: 'ডানে ঘুরুন', 'slight-left': 'একটু বামে', 'slight-right': 'একটু ডানে',
  uturn: 'পেছনে ঘুরুন', arrive: 'পৌঁছে যাবেন',
};
export const TURN_EN: Record<Turn, string> = {
  straight: 'Go straight', left: 'Turn left', right: 'Turn right', 'slight-left': 'Keep left', 'slight-right': 'Keep right',
  uturn: 'Turn around', arrive: 'Arrive',
};
