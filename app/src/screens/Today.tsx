import { Clock, Footprints, Info, Sunset, Play, QrCode, RotateCcw, Settings, Tent, Plane, ArrowLeftRight, Users, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { dayById, type TileKey } from '../domain/days';
import { countdown } from '../lib/format';
import { secondsUntil } from '../lib/clock';
import { usePrefs } from '../lib/prefs';
import { go } from '../lib/router';
import { useCircleSummary } from '../lib/circle';
import { useLocation } from '../lib/location';
import { nearest, type PoiKind } from '../domain/pois';
import { walkMinutes } from '../domain/geo';
import { num } from '../lib/format';
import { KIND_ICONS } from '../map/GuideMap';
import { nextNotice, useGroup } from '../lib/group';
import { NoticeCard } from './Group';
import { UserRound, ScanLine } from 'lucide-react';
import { useTrip } from '../lib/trip';
import { usePlacePhoto } from '../lib/placePhoto';
import { SkyRow, StageStepper } from './TodayParts';
import { usePrayer } from '../lib/sky';
import { dateBn, dateEn } from '../domain/itinerary';
import { PebblesIcon } from '../ui/icons';
import { Button, IconButton, LangToggle, Photo, Screen, SosPill, ThemeToggle, Tile } from '../ui/kit';


export function Today() {
  const { day: prefDay, t, lang, resolvedTheme } = usePrefs();
  const trip = useTrip();
  const day = dayById(trip.dayId ?? prefDay);
  const tripDay = trip.day;
  const subtitle = tripDay
    ? `${lang === 'bn' ? dateBn(tripDay.date) : dateEn(tripDay.date)}${tripDay.hijriBn ? ' · ' + t(tripDay.hijriBn, tripDay.hijriEn ?? '') : ''}`
    : t(day.hijriBn, day.hijriEn);
  const [now, setNow] = useState(() => new Date());
  const circle = useCircleSummary();
  const { times } = usePrayer();
  // Arafah countdown runs to today's real Maghrib, not a fixed time.
  const until: [number, number] | undefined = day.now.untilLocal ? [Math.floor(times.maghrib / 60), times.maghrib % 60] : undefined;
  const { mine } = useGroup();
  const notice = mine ? nextNotice(mine.group.notices) : null;

  useEffect(() => {
    if (!until) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [!!until]); // eslint-disable-line react-hooks/exhaustive-deps

  const { place, pos } = useLocation();
  const photo = usePlacePhoto();
  const near = (['toilet', 'wudu', 'water', 'gate'] as PoiKind[])
    .map((k) => ({ k, hit: pos ? nearest(k, pos.lat, pos.lng, 1, 2000)[0] : undefined }))
    .filter((x) => x.hit);
  const nearLabel: Record<string, [string, string]> = { toilet: ['টয়লেট', 'Toilet'], wudu: ['ওযু', 'Wudu'], water: ['পানি', 'Water'], gate: ['গেট', 'Gate'] };

  const tile = (k: TileKey) => {
    switch (k) {
      case 'tawaf': return <Tile key={k} icon={RotateCcw} label={t('তাওয়াফ', 'Tawaf')} onClick={() => go('/tawaf')} />;
      case 'sai': return <Tile key={k} icon={ArrowLeftRight} label={t('সাঈ', "Sa'i")} onClick={() => go('/sai')} />;
      case 'arafah': return <Tile key={k} icon={Sunset} label={t('আরাফাহ', 'Arafah')} onClick={() => go('/arafah')} tone="brass" />;
      case 'permit': return <Tile key={k} icon={QrCode} label={t('পারমিট', 'Permit')} onClick={() => go('/permit')} />;
      case 'trip': return <Tile key={k} icon={Plane} label={t('ভ্রমণ', 'Trip')} onClick={() => go('/trip')} />;
      case 'rami': return <Tile key={k} icon={PebblesIcon} label={t('কংকর', 'Rami')} onClick={() => go('/steps')} />;
      case 'tent': return <Tile key={k} icon={Tent} label={t('তাঁবু', 'My tent')} onClick={() => go('/family')} />;
    }
  };

  return (
    <Screen className="pb-36">
      <section className="relative h-[46vh] max-h-[23rem] min-h-[17rem] overflow-hidden">
        <Photo key={photo} name={photo} className="wallpaper-in absolute inset-0 size-full" alt={t(place.nameBn, place.nameEn)} />
        <div className="scrim-top absolute inset-x-0 top-0 h-28" />
        <div className="scrim-bottom absolute inset-0" />
        <div className="absolute inset-x-0 top-0 flex items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),14px)]">
          <IconButton onPhoto icon={Settings} label={t('সেটিংস', 'Settings')} onClick={() => go('/settings')} />
          <div className="flex-1" />
          <ThemeToggle onPhoto />
          <LangToggle onPhoto />
          <SosPill onPhoto />
        </div>
        <div className="absolute inset-x-0 bottom-12 px-5 text-white">
          <h1 className="font-display text-[2.4rem] leading-none">{t(place.nameBn, place.nameEn)}</h1>
          <p className="num mt-2 text-[1.05rem] text-white/85">{subtitle}</p>
        </div>
        <button onClick={() => go('/settings/credits')} aria-label={t('ছবির তথ্য', 'Photo credit')}
          className="absolute bottom-12 right-4 grid size-9 place-items-center rounded-full bg-black/30 text-white/80">
          <Info size={18} />
        </button>
      </section>

      <section className="relative z-10 -mt-8 px-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 text-ink-2">
            <Clock size={24} />
            <span className="text-[1.3rem] font-semibold text-ink">{t(day.now.bn, day.now.en)}</span>
          </div>
          {until && secondsUntil(until, now) > 0 && (
            <p className="num mt-2 text-[2.6rem] font-bold leading-none text-brass" aria-label={t('সূর্যাস্ত পর্যন্ত বাকি', 'Time left until sunset')}>
              {countdown(secondsUntil(until!, now) * 1000, lang)}
            </p>
          )}
          {tripDay && tripDay.tasks.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {tripDay.tasks.map((k, i) => <li key={i} className="flex gap-2 text-[1.05rem] text-ink-2"><span className="mt-2.5 size-2 shrink-0 rounded-full bg-primary" />{t(k.bn, k.en)}</li>)}
            </ul>
          )}
          <Button className="mt-4 w-full" icon={Play} onClick={() => go(day.now.cta)}>{t(day.now.ctaBn, day.now.ctaEn)}</Button>
        </div>
      </section>

      <section className="mt-4 px-4"><StageStepper current={trip.dayId ?? prefDay} madinahFirst={trip.itinerary?.pattern === 'madinah_first'} /></section>
      <section className="mt-3 px-4"><SkyRow /></section>

      {!trip.itinerary && (
        <section className="mt-3 px-4">
          <button onClick={() => go('/trip')} className="card flex w-full items-center gap-4 border-primary/40 px-5 py-4 text-left">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary text-on-primary"><ScanLine size={30} /></span>
            <span className="flex-1">
              <span className="block text-[1.15rem] font-bold">{t('টিকিটের ছবি দিন', 'Add your ticket photo')}</span>
              <span className="block text-ink-2">{t('পুরো হজের দিনগুলো সাজিয়ে দেব', "I'll plan every day")}</span>
            </span>
          </button>
        </section>
      )}

      <section className="mt-3 px-4">
        {notice ? (
          <div role="link" tabIndex={0} onClick={() => go('/group')} onKeyDown={(e) => e.key === 'Enter' && go('/group')} className="cursor-pointer"><NoticeCard n={notice} big /></div>
        ) : (
          <button onClick={() => go('/group')} className="card flex w-full items-center gap-3 px-5 py-4 text-left">
            <span className="grid size-11 place-items-center rounded-full bg-medal text-brass"><UserRound size={24} /></span>
            <span className="flex-1 text-[1.1rem] font-semibold">{t('মোয়াল্লেমের দলে যুক্ত হোন', "Join your Moallem's group")}</span>
            <ChevronRight className="text-ink-2" />
          </button>
        )}
      </section>

      {near.length > 0 && (
        <section className="mt-4 px-4">
          <div className="grid grid-cols-4 gap-2">
            {near.map(({ k, hit }) => {
              const Icon = KIND_ICONS[k];
              return (
                <button key={k} onClick={() => go(`/map/${k}`)} className="card flex flex-col items-center gap-1 px-1 py-3 active:scale-[0.97]">
                  <span className="grid size-11 place-items-center rounded-full bg-medal text-brass"><Icon size={24} strokeWidth={1.8} /></span>
                  <span className="text-[0.95rem] font-semibold leading-tight">{t(nearLabel[k][0], nearLabel[k][1])}</span>
                  <span className="num text-[0.85rem] text-ink-2">{num(walkMinutes(hit!.d), lang)} {t('মিনিট', 'min')}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-3 grid grid-cols-2 gap-3 px-4">{day.tiles.map(tile)}</section>

      <section className="mt-3 px-4">
        <button onClick={() => go('/steps')} className="card flex w-full items-center gap-3 px-5 py-4 text-left">
          <span className="grid size-11 place-items-center rounded-full bg-medal text-brass"><Footprints size={24} /></span>
          <span className="flex-1 text-[1.1rem] font-semibold">{t('আজকের ধাপ', "Today's steps")}</span>
          <ChevronRight className="text-ink-2" />
        </button>
      </section>

      <section className="mt-3 px-4">
        <button onClick={() => go('/family')} className="card flex w-full items-center gap-3 px-5 py-4 text-left">
          <span className="grid size-11 place-items-center rounded-full bg-medal text-brass"><Users size={24} /></span>
          <span className="flex-1">
            <span className="block text-[1.1rem] font-semibold">
              {circle.approved > 0
                ? t(`${circle.approvedBn} জন সাথে আছেন`, `${circle.approved} family with you`)
                : t('পরিবারকে সাথে রাখুন', 'Keep family with you')}
            </span>
            <span className="block text-[0.95rem] text-ink-2">{circle.paused ? t('শেয়ারিং বন্ধ', 'Sharing paused') : t('অবস্থান শেয়ার', 'Location sharing')}</span>
          </span>
          <ChevronRight className="text-ink-2" />
        </button>
      </section>
    </Screen>
  );
}
