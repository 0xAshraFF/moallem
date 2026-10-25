// Demo pilgrim: walks from a Mina tent via Muzdalifah toward Jabal al-Rahmah on 9 Dhul Hijjah,
// so the Family Watch screen has something real to show. Code 786786.
import { addBeat, addEvent, approveViewer, createCircle, getCircle, onChange } from './store';

export const DEMO_CODE = '786786';

const MINA: [number, number] = [21.4133, 39.8933];
const MUZDALIFAH: [number, number] = [21.3833, 39.9361];
const ARAFAH: [number, number] = [21.3549, 39.9841]; // Jabal al-Rahmah

function lerp(a: [number, number], b: [number, number], steps: number): Array<[number, number]> {
  return Array.from({ length: steps }, (_, i) => [
    a[0] + ((b[0] - a[0]) * i) / steps,
    a[1] + ((b[1] - a[1]) * i) / steps,
  ]);
}
const ROUTE = [...lerp(MINA, MUZDALIFAH, 10), ...lerp(MUZDALIFAH, ARAFAH, 12), ARAFAH];

const MILESTONES: Record<number, { label: string; labelEn: string; kind: 'ritual' | 'zone' | 'info' }> = {
  0: { label: 'মিনার তাঁবু থেকে রওনা', labelEn: 'Left Mina tent', kind: 'zone' },
  10: { label: 'মুযদালিফা পার হচ্ছেন', labelEn: 'Passing Muzdalifah', kind: 'zone' },
  16: { label: 'আরাফাহ সীমানায় প্রবেশ', labelEn: 'Entered Arafah', kind: 'zone' },
  22: { label: 'জাবালে রহমতের কাছে', labelEn: 'Near Jabal al-Rahmah', kind: 'zone' },
};

export function startDemo(intervalMs = 4000) {
  if (getCircle(DEMO_CODE)) return;
  const c = createCircle('আব্বা', DEMO_CODE, { demo: true });
  const now = Date.now();
  [
    { label: 'ইহরাম অবস্থায় আছেন', labelEn: 'In Ihram', kind: 'info' as const, ago: 540 },
    { label: 'মিনায় রাত কাটিয়েছেন', labelEn: 'Night in Mina', kind: 'ritual' as const, ago: 360 },
    { label: 'ফজর পড়েছেন', labelEn: 'Prayed Fajr', kind: 'ritual' as const, ago: 150 },
  ].forEach((h) => addEvent(c, { label: h.label, labelEn: h.labelEn, kind: h.kind, ts: now - h.ago * 60000 }));

  // In the demo the pilgrim approves every relative right away.
  onChange(DEMO_CODE, (circle) => {
    for (const v of circle.viewers.values()) if (v.status === 'pending') approveViewer(circle, v.token);
  });

  let i = 0;
  let battery = 0.82;
  const step = () => {
    const idx = Math.min(i, ROUTE.length - 1); // walk once, then rest at Arafah
    const [lat, lng] = ROUTE[idx];
    const jitter = () => (Math.random() - 0.5) * 0.0006;
    addBeat(c, {
      lat: lat + jitter(), lng: lng + jitter(), accuracy: 12 + Math.random() * 20,
      battery: (battery = Math.max(0.35, battery - 0.002)), stage: 'arafat9', ts: Date.now(),
    });
    const m = i < ROUTE.length ? MILESTONES[idx] : undefined;
    if (m) addEvent(c, { ...m, ts: Date.now() });
    i++;
  };
  for (let k = 0; k < 6; k++) step();
  setInterval(step, intervalMs).unref();
}
