import { Sunset, Pause, Play, RotateCcw, ArrowLeftRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import { ARAFAT_LYING_DOWN_DUAS, SAI_ROUND_DUAS, TAWAF_ROUND_DUAS } from '../domain/hajjData';
import { usePrefs } from '../lib/prefs';
import { speak, stopSpeaking } from '../lib/speech';
import { Header, Screen } from '../ui/kit';
import { DuaMatcher } from './DuaMatcher';

const TALBIYAH = {
  arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
  bn: 'আমি হাজির, হে আল্লাহ, আমি হাজির। আপনার কোনো শরিক নেই। সব প্রশংসা, নিয়ামত ও রাজত্ব আপনারই।',
  en: 'Here I am, O Allah, here I am. You have no partner. All praise, blessing and sovereignty are Yours.',
};

type Group = 'talbiyah' | 'tawaf' | 'sai' | 'arafah';

export function Duas() {
  const { t, lang } = usePrefs();
  const [group, setGroup] = useState<Group>('talbiyah');
  const [playing, setPlaying] = useState<string | null>(null);
  useEffect(() => () => stopSpeaking(), []);

  const groups: Array<{ id: Group; icon: ComponentType<LucideProps>; bn: string; en: string }> = [
    { id: 'talbiyah', icon: Play, bn: 'তালবিয়াহ', en: 'Talbiyah' },
    { id: 'tawaf', icon: RotateCcw, bn: 'তাওয়াফ', en: 'Tawaf' },
    { id: 'sai', icon: ArrowLeftRight, bn: 'সাঈ', en: "Sa'i" },
    { id: 'arafah', icon: Sunset, bn: 'আরাফাহ', en: 'Arafah' },
  ];

  const items =
    group === 'talbiyah' ? [{ id: 'talbiyah', title: t('তালবিয়াহ', 'Talbiyah'), arabic: TALBIYAH.arabic, meaning: t(TALBIYAH.bn, TALBIYAH.en) }]
    : group === 'arafah' ? ARAFAT_LYING_DOWN_DUAS.map((d) => ({ id: d.id, title: t(d.titleBn, d.titleEn).replace(/^[0-9০-৯]+\.\s*/, ''), arabic: d.arabic, meaning: d.banglaHeartfeltScript }))
    : (group === 'tawaf' ? TAWAF_ROUND_DUAS : SAI_ROUND_DUAS).map((d) => ({
        id: `${group}-${d.round}`, title: t(d.titleBn, d.titleEn), arabic: d.arabic, meaning: lang === 'bn' ? d.banglaMeaning : d.englishMeaning,
      }));

  const toggle = async (id: string, arabic: string) => {
    if (playing === id) { stopSpeaking(); setPlaying(null); return; }
    setPlaying(id);
    if (!(await speak(arabic, 'ar', () => setPlaying(null)))) setPlaying(null);
  };

  return (
    <Screen>
      <Header title={t('দোয়া', 'Duas')} />
      <DuaMatcher />
      <div className="grid grid-cols-4 gap-2 px-4 pb-4" role="tablist">
        {groups.map(({ id, icon: Icon, bn, en }) => (
          <button key={id} role="tab" aria-selected={group === id} onClick={() => setGroup(id)}
            className={`flex flex-col items-center gap-1 rounded-2xl py-3 ${group === id ? 'bg-primary text-on-primary' : 'bg-surface-2'}`}>
            <Icon size={26} strokeWidth={1.75} />
            <span className="text-[0.92rem] font-semibold">{t(bn, en)}</span>
          </button>
        ))}
      </div>
      <ul className="space-y-3 px-4">
        {items.map((d) => (
          <li key={d.id} className="card p-5">
            <div className="flex items-start gap-3">
              <p className="flex-1 text-[1.1rem] font-semibold leading-snug">{d.title}</p>
              <button onClick={() => toggle(d.id, d.arabic)} aria-label={playing === d.id ? t('থামান', 'Pause') : t('শুনুন', 'Listen')}
                className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
                {playing === d.id ? <Pause size={22} /> : <Play size={22} />}
              </button>
            </div>
            <p className="arabic mt-3 text-[1.5rem]">{d.arabic}</p>
            <details className="mt-1">
              <summary className="cursor-pointer font-semibold text-primary">{t('অর্থ', 'Meaning')}</summary>
              <p className="mt-2 text-ink-2">{d.meaning}</p>
            </details>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
