import { ChevronDown, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { dayById, DAYS, stepsFor, WEIGHT_HELP_BN } from '../domain/days';
import { num } from '../lib/format';
import { usePrefs } from '../lib/prefs';
import { speak } from '../lib/speech';
import { ICONS } from '../ui/icons';
import { Header, ProfilePills, Screen, WeightPill } from '../ui/kit';

export function Steps() {
  const { day: dayId, t, lang, set, gender, hajjType } = usePrefs();
  const day = dayById(dayId);
  const steps = stepsFor(day, { gender, hajjType });
  const [open, setOpen] = useState<number | null>(null);

  return (
    <Screen>
      <Header title={t('আজকের ধাপ', "Today's steps")} />
      <nav className="flex gap-2 overflow-x-auto px-4 pb-3" aria-label={t('দিন বেছে নিন', 'Choose day')}>
        {DAYS.map((d) => (
          <button key={d.id} onClick={() => set({ day: d.id })}
            className={`shrink-0 rounded-full px-4 py-2 text-[0.95rem] font-semibold ${d.id === dayId ? 'bg-primary text-on-primary' : 'bg-surface-2 text-ink'}`}>
            {t(d.placeBn, d.placeEn)}
          </button>
        ))}
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-3">
        <p className="text-ink-2">{t(day.hijriBn, day.hijriEn)}</p>
        <ProfilePills />
      </div>

      <ol className="stagger relative mx-4 space-y-3">
        {steps.map((s, i) => {
          const Icon = ICONS[s.icon];
          const isOpen = open === i;
          return (
            <li key={i} className={`card overflow-hidden ${s.guard ? 'border-warn/60 bg-warn-soft' : ''}`}>
              <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}
                className="flex w-full items-center gap-4 px-4 py-4 text-left">
                <span className={`relative grid size-14 shrink-0 place-items-center rounded-full ${s.guard ? 'bg-warn/15 text-warn' : 'bg-medal text-brass'}`}>
                  <Icon size={30} strokeWidth={1.75} />
                  <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-surface text-[0.8rem] font-bold text-ink-2 shadow">{num(i + 1, lang)}</span>
                </span>
                <span className="flex-1">
                  <span className={`block text-[1.2rem] font-semibold leading-snug ${s.guard ? 'text-warn' : ''}`}>{t(s.bn, s.en)}</span>
                  {s.weight && <span className="mt-1 flex items-center gap-2"><WeightPill weight={s.weight} lang={lang} />{isOpen && lang === 'bn' && <span className="text-[0.85rem] text-ink-2">{WEIGHT_HELP_BN[s.weight]}</span>}</span>}
                </span>
                <ChevronDown className={`text-ink-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="flex items-start gap-3 px-4 pb-4">
                  <p className="flex-1 text-[1.05rem] text-ink-2">{t(s.detailBn, s.detailEn)}</p>
                  <button onClick={() => speak(t(s.detailBn, s.detailEn), lang)} aria-label={t('শুনুন', 'Listen')}
                    className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-on-primary"><Volume2 size={22} /></button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mx-5 mt-6 text-[0.9rem] text-ink-2">{t('মাসআলা: হানাফি মাজহাব (ইসলামিক ফাউন্ডেশন বাংলাদেশ)। সন্দেহ হলে মোয়াল্লেমকে জিজ্ঞেস করুন।', 'Rulings follow the Hanafi school (Islamic Foundation Bangladesh). Ask your Moallem if unsure.')}</p>
    </Screen>
  );
}
