import { Check, Clock, Sun, Tent, Thermometer } from 'lucide-react';
import { DAYS, type DayId } from '../domain/days';
import { HEAT_ADVICE, PRAYER_BN, PRAYER_EN, hhmm } from '../domain/prayerTimes';
import { num } from '../lib/format';
import { usePrefs } from '../lib/prefs';
import { go } from '../lib/router';
import { usePrayer, useWeather } from '../lib/sky';

const STAGE_BN: Record<DayId, string> = { travel: 'যাত্রা', umrah: 'উমরাহ', mina: 'মিনা', arafah: 'আরাফা', eid: 'ঈদ', tashreeq: 'তাশরিক', madinah: 'মদিনা' };
const STAGE_EN: Record<DayId, string> = { travel: 'Travel', umrah: 'Umrah', mina: 'Mina', arafah: 'Arafah', eid: 'Eid', tashreeq: 'Tashreeq', madinah: 'Madinah' };

/** Where the pilgrim is in the journey: done ✓, now ●, ahead ○. Scrolls to keep "now" in view. */
export function StageStepper({ current, madinahFirst }: { current: DayId; madinahFirst: boolean }) {
  const { t, hajjType } = usePrefs();
  let order: DayId[] = DAYS.map((d) => d.id);
  if (madinahFirst) order = ['travel', 'madinah', ...order.filter((x) => x !== 'travel' && x !== 'madinah')];
  const at = order.indexOf(current);
  const label = (id: DayId) => (id === 'umrah' && hajjType === 'ifrad' ? t('আগমন', 'Arrival') : t(STAGE_BN[id], STAGE_EN[id]));
  return (
    <div className="snap-row -mx-4 flex items-start overflow-x-auto px-4 pb-1" ref={(el) => {
      const now = el?.querySelector('[data-now]') as HTMLElement | null;
      if (el && now) el.scrollLeft = now.offsetLeft - el.clientWidth / 2 + now.clientWidth / 2;
    }}>
      {order.map((id, i) => {
        const done = i < at, now = i === at;
        return (
          <div key={id} data-now={now || undefined} className="flex shrink-0 items-start">
            <button onClick={() => go('/steps')} className="flex w-[4.6rem] flex-col items-center gap-1.5">
              <span className={`grid size-10 place-items-center rounded-full ${now ? 'bg-brass text-white ring-4 ring-medal' : done ? 'bg-primary text-on-primary' : 'border-2 border-line bg-surface'}`}>
                {done ? <Check size={20} strokeWidth={2.5} /> : now ? <span className="size-2.5 rounded-full bg-white" /> : null}
              </span>
              <span className={`text-[0.88rem] leading-tight ${now ? 'font-bold text-brass' : done ? 'font-semibold text-primary' : 'text-ink-2'}`}>{label(id)}</span>
            </button>
            {i < order.length - 1 && <span className={`mt-5 h-0.5 w-5 shrink-0 ${i < at ? 'bg-primary' : 'bg-line'}`} />}
          </div>
        );
      })}
    </div>
  );
}

/** Swipeable cards: next prayer, heat, Mina tent. */
export function SkyRow() {
  const { t, lang } = usePrefs();
  const { next } = usePrayer();
  const w = useWeather();
  const h = Math.floor(next.inMin / 60), m = next.inMin % 60;
  const left = h > 0 ? t(`${num(h, 'bn')} ঘ ${num(m, 'bn')} মি বাকি`, `in ${h}h ${m}m`) : t(`${num(m, 'bn')} মিনিট বাকি`, `in ${m} min`);
  const heatTone = !w ? 'text-ink-2' : w.level === 'extreme' || w.level === 'danger' ? 'text-sos' : w.level === 'caution' ? 'text-brass' : 'text-primary';
  const card = 'card w-[11.5rem] shrink-0 p-4 text-left';
  return (
    <div className="snap-row stagger -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
      <div className={card}>
        <p className="flex items-center gap-1.5 text-[0.9rem] font-semibold text-ink-2"><Clock size={16} /> {t('পরের নামাজ', 'Next prayer')}</p>
        <p className="mt-1 text-[1.5rem] font-bold leading-tight text-primary">{t(PRAYER_BN[next.id], PRAYER_EN[next.id])} <span className="num text-ink">{num(hhmm(next.at), lang)}</span></p>
        <p className="num text-[0.9rem] text-ink-2">{left}</p>
      </div>
      <div className={card}>
        <p className="flex items-center gap-1.5 text-[0.9rem] font-semibold text-ink-2"><Thermometer size={16} /> {t('গরম', 'Heat')}</p>
        {w ? (
          <>
            <p className={`num mt-1 text-[1.5rem] font-bold leading-tight ${heatTone}`}>{num(w.temp, lang)}°<span className="text-[0.95rem] font-semibold text-ink-2"> {t(`অনুভব ${num(w.feels, 'bn')}°`, `feels ${w.feels}°`)}</span></p>
            <p className="text-[0.9rem] leading-snug text-ink-2">{t(HEAT_ADVICE[w.level].bn, HEAT_ADVICE[w.level].en)}</p>
          </>
        ) : (
          <><p className="mt-1 text-[1.2rem] font-bold text-brass"><Sun className="inline" size={20} /></p><p className="text-[0.9rem] text-ink-2">{t('ছাতা ও পানি সাথে রাখুন', 'Carry an umbrella and water')}</p></>
        )}
      </div>
      <button onClick={() => go('/map/hotel')} className={card}>
        <p className="flex items-center gap-1.5 text-[0.9rem] font-semibold text-ink-2"><Tent size={16} /> {t('আমার তাঁবু', 'My tent')}</p>
        <p className="mt-1 text-[1.15rem] font-bold leading-tight">{t('মিনার তাঁবু', 'Mina tent')}</p>
        <p className="text-[0.9rem] text-primary">{t('জায়গা সেভ করুন', 'Save the spot')}</p>
      </button>
    </div>
  );
}
