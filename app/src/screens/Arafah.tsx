import { Ban, Pause, Play, Repeat, SkipBack, SkipForward } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ARAFAT_LYING_DOWN_DUAS } from '../domain/hajjData';
import { countdown, num } from '../lib/format';
import { makkahSeconds } from '../lib/clock';
import { hhmm, prayerTimes } from '../domain/prayerTimes';
import { useTrip } from '../lib/trip';
import { usePrefs } from '../lib/prefs';
import { speak, stopSpeaking } from '../lib/speech';
import { Header, Photo, Screen } from '../ui/kit';



export function Arafah() {
  const { t, lang } = usePrefs();
  const [now, setNow] = useState(() => new Date());
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const wake = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => () => { stopSpeaking(); wake.current?.release().catch(() => {}); }, []);

  const { today } = useTrip();
  const pt = prayerTimes(today, 21.3549, 39.9841, 3); // Arafah
  const s = makkahSeconds(now);
  const z = pt.dhuhr * 60;
  const ss = pt.maghrib * 60;
  const left = Math.max(0, ss - s) * 1000;
  const progress = Math.min(1, Math.max(0, (s - z) / (ss - z)));
  const afterSunset = s >= ss;
  const dua = ARAFAT_LYING_DOWN_DUAS[i];

  const playIndex = async (idx: number) => {
    setI(idx);
    setPlaying(true);
    try { wake.current = await (navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { /* not supported */ }
    const d = ARAFAT_LYING_DOWN_DUAS[idx];
    const ok = await speak(d.arabic, 'ar', () => {
      const next = idx + 1;
      if (next < ARAFAT_LYING_DOWN_DUAS.length) playIndex(next);
      else if (loop) playIndex(0);
      else setPlaying(false);
    });
    if (!ok) setPlaying(false);
  };
  const toggle = () => { if (playing) { stopSpeaking(); setPlaying(false); } else playIndex(i); };

  return (
    <Screen>
      <div className="relative h-[30vh] min-h-[12rem] overflow-hidden">
        <Photo name="arafat" className="absolute inset-0 size-full" alt={t('জাবালে রহমত', 'Jabal al-Rahmah')} />
        <div className="scrim-bottom absolute inset-0" />
        <div className="absolute inset-x-0 top-0"><Header title="" onPhoto /></div>
        <div className="absolute bottom-4 left-5 text-white">
          <p className="font-display text-[2.2rem] leading-none">{t('আরাফাহ', 'Arafah')}</p>
          <p className="mt-1 text-white/85">{t('৯ জিলহজ', '9 Dhul Hijjah')}</p>
        </div>
      </div>

      <section className="card relative z-10 mx-4 -mt-5 p-5">
        <p className="text-ink-2">{afterSunset ? t('সূর্য ডুবেছে', 'The sun has set') : t('সূর্যাস্ত পর্যন্ত', 'Until sunset')}</p>
        <p className="num text-[3.4rem] font-bold leading-tight text-brass">{countdown(left, lang)}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}
          aria-label={t('যাওয়াল থেকে সূর্যাস্ত', 'Midday to sunset')}>
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[0.85rem] text-ink-2">
          <span>{t('যাওয়াল', 'Midday')} {num(hhmm(pt.dhuhr), lang)}</span><span>{t('সূর্যাস্ত', 'Sunset')} {num(hhmm(pt.maghrib - 720), lang)}</span>
        </div>
      </section>

      <section className="mx-4 mt-3 flex items-center gap-4 rounded-3xl border border-warn/60 bg-warn-soft p-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-warn/15 text-warn"><Ban size={28} /></span>
        <div>
          <p className="text-[1.2rem] font-bold text-warn">{t('এখানে মাগরিব নয়', 'No Maghrib here')}</p>
          <p className="text-[0.98rem] text-ink-2">{t('মুযদালিফায় এশার সাথে পড়বেন', 'Pray it with Isha at Muzdalifah')}</p>
        </div>
      </section>

      <section className="card mx-4 mt-3 p-5">
        <p className="text-[1.15rem] font-semibold">{t(dua.titleBn.replace(/^\d+\.\s*/, '').replace(/^[০-৯]+\.\s*/, ''), dua.titleEn.replace(/^\d+\.\s*/, ''))}</p>
        <p className="arabic mt-2 line-clamp-3 text-[1.45rem]">{dua.arabic}</p>
        <div className="mt-4 flex items-center justify-center gap-5">
          <button aria-label={t('আগের দোয়া', 'Previous')} onClick={() => playIndex((i - 1 + ARAFAT_LYING_DOWN_DUAS.length) % ARAFAT_LYING_DOWN_DUAS.length)}
            className="grid size-14 place-items-center rounded-full bg-surface-2"><SkipBack size={24} /></button>
          <button aria-label={playing ? t('থামান', 'Pause') : t('শুনুন', 'Play')} onClick={toggle}
            className="grid size-[5.5rem] place-items-center rounded-full bg-primary text-on-primary shadow-lg">
            {playing ? <Pause size={40} /> : <Play size={40} className="translate-x-0.5" />}
          </button>
          <button aria-label={t('পরের দোয়া', 'Next')} onClick={() => playIndex((i + 1) % ARAFAT_LYING_DOWN_DUAS.length)}
            className="grid size-14 place-items-center rounded-full bg-surface-2"><SkipForward size={24} /></button>
        </div>
        <div className="mt-4 flex justify-center">
          <button onClick={() => setLoop(!loop)} aria-pressed={loop}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-semibold ${loop ? 'bg-primary-soft text-primary' : 'bg-surface-2 text-ink-2'}`}>
            <Repeat size={20} /> {t('বারবার', 'Repeat')}
          </button>
        </div>
        <p className="mt-3 text-center text-[0.9rem] text-ink-2">{t('ফোন রেখে শুয়ে শুনুন, স্ক্রিন জেগে থাকবে', 'Rest and listen; the screen stays awake')}</p>
      </section>
    </Screen>
  );
}
