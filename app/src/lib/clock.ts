// Makkah wall-clock time. A demo clock (set in localStorage "moallem.demoClock" as "HH:MM")
// lets the demo and the product video show Arafah afternoon at any real time of day.

let demoOffsetS: number | null = null;

function realMakkahSeconds(now: Date) {
  const p = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false, timeZone: 'Asia/Riyadh' })
    .formatToParts(now).reduce<Record<string, number>>((a, x) => (x.type !== 'literal' ? { ...a, [x.type]: Number(x.value) } : a), {});
  return p.hour * 3600 + p.minute * 60 + p.second;
}

function initDemo(now: Date) {
  if (demoOffsetS !== null) return;
  demoOffsetS = 0;
  try {
    const v = localStorage.getItem('moallem.demoClock');
    const m = v && /^(\d{1,2}):(\d{2})$/.exec(v);
    if (m) demoOffsetS = Number(m[1]) * 3600 + Number(m[2]) * 60 - realMakkahSeconds(now);
  } catch { /* ignore */ }
}

export function makkahSeconds(now = new Date()) {
  initDemo(now);
  return (((realMakkahSeconds(now) + (demoOffsetS ?? 0)) % 86400) + 86400) % 86400;
}

/** Seconds until a Makkah time today; negative once it has passed. */
export function secondsUntil([h, m]: [number, number], now = new Date()) {
  return h * 3600 + m * 60 - makkahSeconds(now);
}
