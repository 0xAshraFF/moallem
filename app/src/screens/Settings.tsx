import { ExternalLink, Moon, Sun, SunMoon, Type } from 'lucide-react';
import credits from '../domain/photoCredits.json';
import { DAYS } from '../domain/days';
import { SITES } from '../domain/geo';
import { useLocation, DEMO_HOTELS } from '../lib/location';
import { LocateFixed } from 'lucide-react';
import { setDemoDate, useTrip } from '../lib/trip';
import { dateBn, dateEn } from '../domain/itinerary';
import { usePrefs, type Theme } from '../lib/prefs';
import { Header, Photo, Screen } from '../ui/kit';

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card mx-4 mt-3 p-5">
      <h2 className="mb-3 text-[1.1rem] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Seg<T extends string | number>({ value, options, onChange }: { value: T; options: Array<{ v: T; label: React.ReactNode; aria: string }>; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }} role="radiogroup">
      {options.map((o) => (
        <button key={String(o.v)} role="radio" aria-checked={value === o.v} aria-label={o.aria} onClick={() => onChange(o.v)}
          className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl font-semibold ${value === o.v ? 'bg-primary text-on-primary' : 'bg-surface-2'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Settings({ section }: { section?: string }) {
  const { t, lang, set, theme, scale, day, reduceMotion, gender, hajjType } = usePrefs();
  const { setDemo, source, place } = useLocation();
  const trip = useTrip();
  const demoPlaces = [
    { id: 'hotel', bn: 'মক্কার হোটেল', en: 'Makkah hotel', lat: DEMO_HOTELS[0].lat, lng: DEMO_HOTELS[0].lng },
    { id: 'haram', bn: 'হারাম চত্বর', en: 'Haram plaza', lat: 21.4219, lng: 39.8268 },
    ...SITES.filter((s) => s.id !== 'makkah').map((s) => ({ id: s.id, bn: s.nameBn, en: s.nameEn, lat: s.lat, lng: s.lng })),
  ];

  if (section === 'credits') {
    return (
      <Screen>
        <Header title={t('ছবির কৃতজ্ঞতা', 'Photo credits')} sos={false} />
        <ul className="space-y-3 px-4">
          {Object.entries(credits).map(([key, c]) => (
            <li key={key} className="card flex gap-3 p-3">
              <Photo name={key} className="size-20 shrink-0 rounded-xl" />
              <div className="min-w-0 text-[0.92rem]">
                <p className="truncate font-semibold">{c.title.replace(/^File:/, '').replace(/\.(jpe?g|png)$/i, '')}</p>
                <p className="text-ink-2">{c.author} · {c.license}</p>
                <a href={c.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline underline-offset-4">
                  Wikimedia Commons <ExternalLink size={14} />
                </a>
              </div>
            </li>
          ))}
        </ul>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={t('সেটিংস', 'Settings')} sos={false} />
      <Row title={t('ভাষা', 'Language')}>
        <Seg value={lang} onChange={(v) => set({ lang: v })} options={[
          { v: 'bn', label: 'বাংলা', aria: 'বাংলা' }, { v: 'en', label: 'English', aria: 'English' },
        ]} />
      </Row>
      <Row title={t('আমার হজ', 'My Hajj')}>
        <Seg value={gender} onChange={(v) => set({ gender: v })} options={[
          { v: 'male', label: t('ভাই', 'Brother'), aria: t('ভাই', 'Brother') }, { v: 'female', label: t('বোন', 'Sister'), aria: t('বোন', 'Sister') },
        ] as Array<{ v: 'male' | 'female'; label: React.ReactNode; aria: string }>} />
        <div className="mt-3" />
        <Seg value={hajjType} onChange={(v) => set({ hajjType: v })} options={[
          { v: 'tamattu', label: t('তামাত্তু', "Tamattu'"), aria: "Tamattu'" }, { v: 'qiran', label: t('কিরান', 'Qiran'), aria: 'Qiran' }, { v: 'ifrad', label: t('ইফরাদ', 'Ifrad'), aria: 'Ifrad' },
        ] as Array<{ v: 'tamattu' | 'qiran' | 'ifrad'; label: React.ReactNode; aria: string }>} />
      </Row>
      <Row title={t('লেখার আকার', 'Text size')}>
        <Seg value={scale} onChange={(v) => set({ scale: v })} options={[
          { v: 1, label: <span className="text-[1rem] font-bold">অ</span>, aria: t('স্বাভাবিক', 'Normal') },
          { v: 1.15, label: <span className="text-[1.3rem] font-bold">অ</span>, aria: t('বড়', 'Large') },
          { v: 1.3, label: <span className="text-[1.6rem] font-bold">অ</span>, aria: t('আরও বড়', 'Larger') },
        ] as Array<{ v: 1 | 1.15 | 1.3; label: React.ReactNode; aria: string }>} />
      </Row>
      <Row title={t('আলো', 'Theme')}>
        <Seg<Theme> value={theme} onChange={(v) => set({ theme: v })} options={[
          { v: 'auto', label: <><SunMoon size={24} /><span className="text-[0.85rem]">{t('মক্কার সময়', 'Makkah time')}</span></>, aria: t('স্বয়ংক্রিয়', 'Auto') },
          { v: 'light', label: <><Sun size={24} /><span className="text-[0.85rem]">{t('দিন', 'Day')}</span></>, aria: t('দিন', 'Day') },
          { v: 'dark', label: <><Moon size={24} /><span className="text-[0.85rem]">{t('রাত', 'Night')}</span></>, aria: t('রাত', 'Night') },
        ]} />
        <label className="mt-4 flex min-h-12 items-center justify-between gap-3">
          <span>{t('কম নড়াচড়া', 'Less motion')}</span>
          <input type="checkbox" checked={reduceMotion} onChange={(e) => set({ reduceMotion: e.target.checked })} className="size-6 accent-[var(--primary)]" />
        </label>
      </Row>
      <Row title={t('ডেমো: অবস্থান', 'Demo: location')}>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setDemo(null)} className={`inline-flex min-h-12 items-center gap-2 rounded-full px-4 font-semibold ${source === 'gps' || source === 'none' ? 'bg-primary text-on-primary' : 'bg-surface-2'}`}>
            <LocateFixed size={18} /> {t('আসল GPS', 'Real GPS')}
          </button>
          {demoPlaces.map((p) => (
            <button key={p.id} onClick={() => setDemo({ lat: p.lat, lng: p.lng })}
              className={`min-h-12 rounded-full px-4 font-semibold ${source === 'demo' && (place.id === p.id || (p.id === 'haram' && place.id === 'makkah')) ? 'bg-primary text-on-primary' : 'bg-surface-2'}`}>{t(p.bn, p.en)}</button>
          ))}
        </div>
      </Row>
      {trip.itinerary && (
        <Row title={t('ডেমো: যাত্রার তারিখ', 'Demo: trip date')}>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setDemoDate(null)} className={`min-h-12 rounded-full px-4 font-semibold ${!trip.demoDate ? 'bg-primary text-on-primary' : 'bg-surface-2'}`}>{t('আসল তারিখ', 'Real date')}</button>
            {trip.itinerary.segments.map((s) => (
              <button key={s.start + s.kind} onClick={() => setDemoDate(s.start)}
                className={`min-h-12 rounded-full px-4 font-semibold ${trip.demoDate && trip.demoDate >= s.start && trip.demoDate <= s.end ? 'bg-primary text-on-primary' : 'bg-surface-2'}`}>
                {t(s.titleBn, s.titleEn)} · {lang === 'bn' ? dateBn(s.start) : dateEn(s.start)}
              </button>
            ))}
          </div>
        </Row>
      )}
      <Row title={t('ডেমো: হজের দিন', 'Demo: Hajj day')}>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button key={d.id} onClick={() => set({ day: d.id })}
              className={`min-h-12 rounded-full px-4 font-semibold ${d.id === day ? 'bg-primary text-on-primary' : 'bg-surface-2'}`}>{t(d.placeBn, d.placeEn)}</button>
          ))}
        </div>
      </Row>
      <section className="mx-4 mt-3 space-y-2 pb-6">
        <a href="#/settings/credits" className="card flex min-h-14 items-center px-5 font-semibold">{t('ছবির কৃতজ্ঞতা', 'Photo credits')}</a>
        <a href="#/watch" className="card flex min-h-14 items-center px-5 font-semibold">{t('পরিবারের ভিউ খুলুন', 'Open family view')}</a>
        <p className="px-1 pt-2 text-[0.9rem] text-ink-2">{t('মোয়াল্লেম একটি সদকায়ে জারিয়া প্রকল্প। হাজীদের জন্য সবসময় ফ্রি, কোনো বিজ্ঞাপন নেই।', 'Moallem is a sadaqah jariyah project. Always free for pilgrims, no ads.')}</p>
      </section>
    </Screen>
  );
}
