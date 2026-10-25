import { ArrowUp, ChevronLeft, CornerUpLeft, CornerUpRight, Flag, Footprints, LocateFixed, Navigation, Square, Volume2, VolumeX } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { bearingDeg, distanceM, walkMinutes } from '../domain/geo';
import { kindLabel, nearest, POIS, toDestination, type DestKind, type Destination, type PoiKind } from '../domain/pois';
import { num } from '../lib/format';
import { useLocation } from '../lib/location';
import { usePrefs } from '../lib/prefs';
import { back } from '../lib/router';
import { progressOn, TURN_BN, TURN_EN, walkingRoute, type Route, type Turn } from '../lib/route';
import { speak } from '../lib/speech';
import { IconButton, SosPill } from '../ui/kit';
import { KIND_ICONS, type MapMarker } from './GuideMap';

const GuideMap = lazy(() => import('./GuideMap'));

const CHIPS: DestKind[] = ['toilet', 'wudu', 'water', 'tea', 'food', 'gate', 'hotel', 'haram', 'clinic'];
const CENTERS = { makkah: { lat: 21.42251, lng: 39.82616 }, madinah: { lat: 24.46723, lng: 39.61110 } };

function TurnIcon({ turn, size = 56 }: { turn: Turn; size?: number }) {
  if (turn === 'left' || turn === 'slight-left') return <CornerUpLeft size={size} strokeWidth={2.4} />;
  if (turn === 'right' || turn === 'slight-right') return <CornerUpRight size={size} strokeWidth={2.4} />;
  if (turn === 'arrive') return <Flag size={size} strokeWidth={2.2} />;
  return <ArrowUp size={size} strokeWidth={2.4} />;
}

export function MapScreen({ initialKind, autoGo = false }: { initialKind?: string; autoGo?: boolean }) {
  const { t, lang } = usePrefs();
  const { pos, heading, hotels, place, source, setDemo } = useLocation();
  const [kind, setKind] = useState<DestKind>((CHIPS as string[]).includes(initialKind ?? '') ? (initialKind as DestKind) : 'toilet');
  const [dest, setDest] = useState<Destination | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [guiding, setGuiding] = useState(false);
  const [voice, setVoice] = useState(true);
  const [follow, setFollow] = useState(false);
  const lastSpoken = useRef('');
  const walker = useRef<ReturnType<typeof setInterval> | null>(null);

  const city: 'makkah' | 'madinah' = pos && distanceM(pos.lat, pos.lng, CENTERS.madinah.lat, CENTERS.madinah.lng) < 30000 ? 'madinah' : 'makkah';

  // Candidate destinations for the chosen chip, nearest first.
  const options = useMemo<Array<{ d: Destination; m: number }>>(() => {
    if (!pos) return [];
    if (kind === 'hotel') {
      return hotels.filter((h) => h.city === city).map((h) => ({ d: { id: `hotel-${h.city}`, kind: 'hotel' as const, lat: h.lat, lng: h.lng, labelBn: h.name, labelEn: 'Your hotel' }, m: distanceM(pos.lat, pos.lng, h.lat, h.lng) }));
    }
    if (kind === 'haram') {
      // Walk to the nearest gate of the Haram, not to the Kaaba itself.
      const gates = nearest('gate', pos.lat, pos.lng, 1, 5000);
      const c = CENTERS[city];
      const g = gates[0];
      const d: Destination = g ? { ...toDestination(g.poi), kind: 'haram', labelBn: `${toDestination(g.poi).labelBn} · হারাম`, labelEn: `${toDestination(g.poi).labelEn} · Haram` }
        : { id: `haram-${city}`, kind: 'haram', lat: c.lat, lng: c.lng, labelBn: city === 'makkah' ? 'মসজিদুল হারাম' : 'মসজিদে নববী', labelEn: city === 'makkah' ? 'Masjid al-Haram' : "Prophet's Mosque" };
      return [{ d, m: distanceM(pos.lat, pos.lng, d.lat, d.lng) }];
    }
    return nearest(kind as PoiKind, pos.lat, pos.lng, 3).map((x) => ({ d: toDestination(x.poi), m: x.d }));
  }, [kind, pos?.lat, pos?.lng, hotels, city]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-pick the nearest option when the chip changes.
  useEffect(() => { if (!guiding) setDest(options[0]?.d ?? null); }, [kind, options.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let alive = true;
    if (!dest || !pos) { setRoute(null); return; }
    walkingRoute(pos, dest).then((r) => alive && setRoute(r));
    return () => { alive = false; };
  }, [dest?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Arriving from Ask ("চলুন"): start guidance as soon as the route is ready.
  const autoStarted = useRef(false);
  useEffect(() => { if (autoGo && route && !autoStarted.current) { autoStarted.current = true; setGuiding(true); setFollow(true); } }, [autoGo, route]);

  const prog = route && pos ? progressOn(route, pos.lat, pos.lng) : null;
  const arrived = !!(guiding && dest && pos && distanceM(pos.lat, pos.lng, dest.lat, dest.lng) < 15);

  // Voice prompts: on start, on each new turn, and on arrival.
  useEffect(() => {
    if (!guiding || !prog || !dest || !voice) return;
    const label = t(dest.labelBn, dest.labelEn);
    const msg = arrived
      ? t(`আপনি ${label}-এ পৌঁছে গেছেন`, `You have arrived at ${label}`)
      : prog.next.turn === 'arrive' || prog.toNext > 60
        ? t(`${num(Math.round(prog.remaining / 10) * 10, 'bn')} মিটার সোজা যান`, `Go straight ${Math.round(prog.remaining / 10) * 10} metres`)
        : t(`${num(Math.round(prog.toNext / 5) * 5, 'bn')} মিটার পরে ${TURN_BN[prog.next.turn]}`, `In ${Math.round(prog.toNext / 5) * 5} metres, ${TURN_EN[prog.next.turn].toLowerCase()}`);
    const key = arrived ? 'arrived' : `${prog.next.lat},${prog.next.turn},${prog.toNext > 60 ? 'far' : 'near'}`;
    if (key !== lastSpoken.current) { lastSpoken.current = key; speak(msg, lang); }
  }, [guiding, prog?.next.lat, prog?.toNext && prog.toNext > 60, arrived, voice]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopWalker = () => { if (walker.current) clearInterval(walker.current); walker.current = null; };
  useEffect(() => stopWalker, []);
  useEffect(() => { if (arrived) stopWalker(); }, [arrived]);

  const start = () => { setGuiding(true); setFollow(true); lastSpoken.current = ''; };
  const stop = () => { setGuiding(false); setFollow(false); stopWalker(); };

  /** Demo only: walk the route at about 4x real pace so the guidance can be shown. */
  const demoWalk = () => {
    if (!route) return;
    start();
    const pts = route.points;
    let i = 0, along = 0;
    stopWalker();
    walker.current = setInterval(() => {
      if (i >= pts.length - 1) { stopWalker(); return; }
      const [a, b] = [pts[i], pts[i + 1]];
      const seg = distanceM(a[0], a[1], b[0], b[1]);
      along += 9;
      if (along >= seg) { along -= seg; i++; return; }
      const f = along / seg;
      setDemo({ lat: a[0] + (b[0] - a[0]) * f, lng: a[1] + (b[1] - a[1]) * f });
    }, 220);
  };

  const markers = useMemo<MapMarker[]>(() => {
    const m: MapMarker[] = hotels.filter((h) => h.city === city).map((h) => ({ id: `hotel-${h.city}`, kind: 'hotel' as const, lat: h.lat, lng: h.lng, label: t('হোটেল', 'Hotel') }));
    const c = CENTERS[city];
    m.push({ id: `haram-${city}`, kind: 'haram', lat: c.lat, lng: c.lng, label: city === 'makkah' ? t('কাবা', 'Kaaba') : t('রওজা', 'Rawdah') });
    if (kind !== 'hotel' && kind !== 'haram') {
      POIS.filter((p) => p.kind === kind && pos && distanceM(pos.lat, pos.lng, p.lat, p.lng) < 1500)
        .forEach((p) => m.push({ id: p.id, kind: p.kind, lat: p.lat, lng: p.lng, label: '' }));
    }
    if (dest) {
      const existing = m.find((x) => x.id === dest.id);
      if (existing) { existing.selected = true; existing.label = t(dest.labelBn, dest.labelEn); }
      else m.push({ id: dest.id, kind: dest.kind, lat: dest.lat, lng: dest.lng, label: t(dest.labelBn, dest.labelEn), selected: true });
    }
    return m;
  }, [kind, dest, hotels, city, pos?.lat, pos?.lng, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = useCallback((id: string) => {
    if (guiding) return;
    const p = POIS.find((x) => x.id === id);
    if (p) setDest(toDestination(p));
  }, [guiding]);

  const straightBearing = dest && pos ? bearingDeg(pos.lat, pos.lng, dest.lat, dest.lng) : 0;
  const arrowDeg = (prog?.aimBearing ?? straightBearing) - (heading ?? 0);

  return (
    <main className="screen-in relative h-dvh w-full overflow-hidden">
      <Suspense fallback={<div className="absolute inset-0 bg-surface-2" />}>
        <GuideMap className="absolute inset-0" me={pos} heading={heading} markers={markers} route={route?.points ?? null} follow={follow} onPick={pick} />
      </Suspense>

      {/* Top bar, or the guidance banner while walking */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] px-3 pt-[max(env(safe-area-inset-top),12px)]">
        {guiding && prog ? (
          <div className="pointer-events-auto flex items-center gap-4 rounded-[1.75rem] bg-primary p-4 text-on-primary shadow-xl">
            <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-white/15">
              {arrived ? <Flag size={48} /> : prog.toNext <= 60 && prog.next.turn !== 'arrive'
                ? <TurnIcon turn={prog.next.turn} />
                : <ArrowUp size={56} strokeWidth={2.4} style={{ rotate: `${heading === null ? 0 : arrowDeg}deg`, transition: 'rotate 300ms' }} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[1.6rem] font-bold leading-tight">
                {arrived ? t('পৌঁছে গেছেন', 'You are here') : prog.toNext <= 60 && prog.next.turn !== 'arrive'
                  ? t(`${num(prog.toNext, 'bn')} মি. পরে ${TURN_BN[prog.next.turn]}`, `${TURN_EN[prog.next.turn]} in ${prog.toNext} m`)
                  : t('সোজা যান', 'Go straight')}
              </p>
              <p className="truncate text-[1.05rem] opacity-90">{t(dest!.labelBn, dest!.labelEn)}</p>
            </div>
          </div>
        ) : (
          <div className="pointer-events-auto flex items-center gap-2">
            <IconButton icon={ChevronLeft} label={t('ফিরে যান', 'Back')} onClick={back} />
            <div className="card flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full px-4">
              <Navigation size={18} className="shrink-0 text-primary" />
              <span className="truncate font-semibold">{t(place.nameBn, place.nameEn)}</span>
              {source === 'demo' && <span className="ml-auto shrink-0 rounded-full bg-surface-2 px-2 text-[0.75rem] text-ink-2">{t('ডেমো', 'Demo')}</span>}
            </div>
            <SosPill />
          </div>
        )}
      </div>

      <button onClick={() => setFollow(true)} aria-label={t('আমার অবস্থান', 'My location')}
        className={`absolute right-3 z-[1000] grid size-14 place-items-center rounded-full shadow-lg ${follow ? 'bg-primary text-on-primary' : 'bg-surface text-primary'} ${guiding ? 'bottom-44' : 'bottom-[22rem]'}`}>
        <LocateFixed size={26} />
      </button>

      {/* Bottom sheet */}
      <section className="absolute inset-x-0 bottom-0 z-[1000] rounded-t-[1.75rem] bg-surface px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 shadow-[0_-10px_30px_rgba(0,0,0,0.15)]">
        {guiding && prog ? (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="num whitespace-nowrap text-[1.7rem] font-bold leading-none">{arrived ? '—' : `${num(prog.remaining, lang)} ${t('মি.', 'm')}`}</p>
              <p className="mt-1 text-ink-2">{arrived ? t('আলহামদুলিল্লাহ', 'Alhamdulillah') : t(`প্রায় ${num(walkMinutes(prog.remaining), 'bn')} মিনিট হাঁটা`, `About ${walkMinutes(prog.remaining)} min walk`)}</p>
            </div>
            {source === 'demo' && !arrived && (
              <button onClick={demoWalk} aria-label={t('ডেমো হাঁটা', 'Demo walk')} className="grid size-14 place-items-center rounded-full bg-surface-2"><Footprints size={24} /></button>
            )}
            <button onClick={() => setVoice(!voice)} aria-label={voice ? t('শব্দ বন্ধ', 'Mute') : t('শব্দ চালু', 'Unmute')} className="grid size-14 place-items-center rounded-full bg-surface-2">
              {voice ? <Volume2 size={26} /> : <VolumeX size={26} />}
            </button>
            <button onClick={stop} className="inline-flex min-h-14 items-center gap-2 rounded-2xl bg-sos px-5 text-[1.1rem] font-bold text-on-sos">
              <Square size={20} fill="currentColor" /> {t('থামুন', 'Stop')}
            </button>
          </div>
        ) : (
          <>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3" role="tablist">
              {CHIPS.map((k) => {
                const Icon = KIND_ICONS[k];
                const on = k === kind;
                return (
                  <button key={k} role="tab" aria-selected={on} onClick={() => setKind(k)}
                    className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl px-3 py-2.5 ${on ? 'bg-primary text-on-primary' : 'bg-surface-2'}`} style={{ minWidth: '4.6rem' }}>
                    <Icon size={26} strokeWidth={1.9} />
                    <span className="text-[0.88rem] font-semibold">{t(kindLabel(k).bn, kindLabel(k).en)}</span>
                  </button>
                );
              })}
            </div>
            {options.length === 0 ? (
              <p className="py-6 text-center text-ink-2">{t('কাছে পাওয়া যায়নি', 'Nothing nearby')}</p>
            ) : (
              <ul className="divide-y divide-line">
                {options.map(({ d, m }) => { const OptIcon = KIND_ICONS[d.kind]; return (
                  <li key={d.id}>
                    <button onClick={() => setDest(d)} className="flex w-full items-center gap-3 py-2.5 text-left">
                      <span className={`grid size-11 place-items-center rounded-full ${dest?.id === d.id ? 'bg-primary text-on-primary' : 'bg-primary-soft text-primary'}`}><OptIcon size={22} /></span>
                      <span className="flex-1 truncate text-[1.1rem] font-semibold">{t(d.labelBn, d.labelEn)}</span>
                      <span className="num text-right text-ink-2">{num(Math.round(m), lang)} {t('মি.', 'm')}<br /><span className="text-[0.85rem]">{num(walkMinutes(m), lang)} {t('মিনিট', 'min')}</span></span>
                    </button>
                  </li>
                ); })}
              </ul>
            )}
            <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
              <button disabled={!dest || !route} onClick={start}
                className="inline-flex min-h-16 items-center justify-center gap-2.5 rounded-2xl bg-primary text-[1.3rem] font-bold text-on-primary disabled:opacity-50">
                <Navigation size={26} /> {t('চলুন', 'Go')}
              </button>
              {source === 'demo' && (
                <button disabled={!route} onClick={demoWalk} className="inline-flex min-h-16 items-center gap-2 rounded-2xl bg-surface-2 px-4 font-semibold">
                  <Footprints size={22} /> {t('ডেমো হাঁটা', 'Demo walk')}
                </button>
              )}
            </div>
            {route?.offline && <p className="mt-2 text-center text-[0.9rem] text-ink-2">{t('খোলা চত্বর: তীর দেখে সোজা চলুন', 'Open plaza: follow the arrow')}</p>}
          </>
        )}
      </section>
    </main>
  );
}
