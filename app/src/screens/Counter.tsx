import { Compass, Minus, Pause, Play, Plus, RotateCcw, Sparkles, Square, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SAI_ROUND_DUAS, TAWAF_ROUND_DUAS } from '../domain/hajjData';
import { useAutoCount } from '../lib/autoCount';
import { logRitual } from '../lib/circle';
import { num } from '../lib/format';
import { usePrefs } from '../lib/prefs';
import { go } from '../lib/router';
import { speak, stopSpeaking } from '../lib/speech';
import { Button, Header, Screen } from '../ui/kit';

const SEGMENTS = 7;

/** 7-segment ring. Finished rounds are green; the current round fills in brass as the pilgrim walks. */
function Ring({ done, progress }: { done: number; progress: number }) {
  const size = 280, stroke = 18, r = (size - stroke) / 2, c = size / 2;
  const gap = 7, seg = 360 / SEGMENTS;
  const arc = (i: number, frac = 1) => {
    const a0 = ((i * seg + gap / 2 - 90) * Math.PI) / 180;
    const a1 = ((i * seg + gap / 2 + (seg - gap) * frac - 90) * Math.PI) / 180;
    return `M ${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)}`;
  };
  const complete = done >= SEGMENTS;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="size-[min(74vw,17.5rem)]" aria-hidden="true">
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <path key={`b${i}`} d={arc(i)} fill="none" stroke={complete ? 'var(--brass)' : i < done ? 'var(--primary)' : 'var(--line)'} strokeWidth={stroke} strokeLinecap="round"
          style={{ transition: 'stroke 400ms var(--ease-calm)' }} />
      ))}
      {!complete && progress > 0.02 && <path d={arc(done, Math.min(1, progress))} fill="none" stroke="var(--brass)" strokeWidth={stroke} strokeLinecap="round" />}
    </svg>
  );
}

export function Counter({ kind }: { kind: 'tawaf' | 'sai' }) {
  const { t, lang } = usePrefs();
  const [playing, setPlaying] = useState(false);
  const duas = kind === 'tawaf' ? TAWAF_ROUND_DUAS : SAI_ROUND_DUAS;

  const announce = (rounds: number) => {
    navigator.vibrate?.(rounds >= SEGMENTS ? [60, 40, 120] : 40);
    if (rounds >= SEGMENTS) {
      speak(t('সাত চক্কর পূর্ণ হয়েছে। আল্লাহ কবুল করুন।', 'Seven rounds complete. May Allah accept it.'), lang);
      logRitual(kind === 'tawaf' ? 'তাওয়াফ সম্পন্ন' : 'সাঈ সম্পন্ন', kind === 'tawaf' ? 'Finished Tawaf' : "Finished Sa'i");
    } else {
      speak(t(`${num(rounds, 'bn')} চক্কর শেষ। আরও ${num(SEGMENTS - rounds, 'bn')}টি।`, `${rounds} done. ${SEGMENTS - rounds} to go.`), lang);
    }
  };
  const auto = useAutoCount(kind, announce);
  const { rounds, progress, confidence, source } = auto.state;
  const complete = rounds >= SEGMENTS;
  const dua = duas[Math.min(rounds, SEGMENTS - 1)];
  useEffect(() => () => stopSpeaking(), []);

  const play = async () => {
    if (playing) { stopSpeaking(); setPlaying(false); return; }
    setPlaying(true);
    if (!(await speak(dua.arabic, 'ar', () => setPlaying(false)))) setPlaying(false);
  };

  const title = kind === 'tawaf' ? t('তাওয়াফ', 'Tawaf') : t('সাঈ', "Sa'i");
  const sourceBn = source === 'fusion' ? t('কম্পাস + GPS', 'Compass + GPS') : source === 'heading' ? t('কম্পাস', 'Compass') : source === 'gps' ? 'GPS' : t('হাতে', 'Manual');
  const dot = confidence === 'high' ? 'bg-primary' : confidence === 'medium' ? 'bg-brass' : 'bg-warn';

  return (
    <Screen>
      <Header title={title} />
      <section className="flex flex-col items-center px-4 pt-1">
        <div className="relative grid place-items-center">
          <Ring done={rounds} progress={progress} />
          <span className="absolute inset-0 grid place-items-center">
            <span className="flex flex-col items-center">
              <span className="flex items-baseline">
                <span className="num text-[5.3rem] font-bold leading-none">{num(complete ? SEGMENTS : rounds, lang)}</span>
                <span className="num text-[1.8rem] text-ink-2">/{num(SEGMENTS, lang)}</span>
              </span>
              {auto.mode !== 'off' && !complete && (
                <span className="mt-1 text-[0.95rem] font-semibold text-ink-2">{t('চক্কর শেষ', 'rounds done')}</span>
              )}
            </span>
          </span>
        </div>

        {auto.mode !== 'off' && !complete && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 font-semibold">
            <span className={`size-2.5 rounded-full ${dot}`} />
            {t('নিজে গুনছে', 'Counting by itself')} · {sourceBn}
            {auto.mode === 'demo' && <span className="text-ink-2">· {t('ডেমো', 'demo')}</span>}
          </p>
        )}

        {complete ? (
          <div className="mt-5 w-full text-center">
            <p className="text-[1.6rem] font-bold text-brass">{t('সম্পূর্ণ', 'Complete')}</p>
            <p className="mt-1 text-ink-2">{t('আল্লাহ কবুল করুন', 'May Allah accept it')}</p>
            <div className="mt-5 grid gap-3">
              <Button onClick={() => go(kind === 'tawaf' ? '/sai' : '/steps')}>{kind === 'tawaf' ? t('এবার সাঈ', "Next: Sa'i") : t('পরের ধাপ', 'Next step')}</Button>
              <Button variant="quiet" icon={RotateCcw} onClick={auto.reset}>{t('নতুন করে', 'Start over')}</Button>
            </div>
          </div>
        ) : auto.mode === 'off' ? (
          <div className="mt-5 w-full">
            <Button icon={Compass} onClick={auto.startLive} className="min-h-16 w-full text-[1.25rem]">{t('শুরু করুন, নিজে গুনবে', 'Start, it counts itself')}</Button>
            <p className="mt-2 text-center text-[0.95rem] text-ink-2">{t('ফোন পকেটে রাখুন। প্রতি চক্করে শুনিয়ে দেবে।', 'Keep the phone in your pocket. It tells you each round.')}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button variant="quiet" icon={Plus} onClick={() => auto.manual(1)}>{t('হাতে গুনুন', 'Count by hand')}</Button>
              <Button variant="quiet" icon={Sparkles} onClick={auto.startDemo}>{t('ডেমো', 'Demo')}</Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid w-full grid-cols-3 gap-3">
            <Button variant="quiet" icon={Minus} onClick={() => auto.manual(-1)}><span className="sr-only">{t('একটি কমান', 'Minus one')}</span></Button>
            <Button variant="quiet" icon={Plus} onClick={() => auto.manual(1)}><span className="sr-only">{t('একটি যোগ', 'Plus one')}</span></Button>
            <Button variant="outline" icon={Square} onClick={auto.stop}>{t('থামুন', 'Stop')}</Button>
          </div>
        )}
      </section>

      {!complete && (
        <section className="card mx-4 mt-5 p-5">
          <div className="flex items-center gap-3">
            <p className="flex-1 font-semibold text-ink-2">{t(`${num(rounds + 1, 'bn')} নম্বর চক্করের দোয়া`, `Dua for round ${rounds + 1}`)}</p>
            <button onClick={play} aria-label={playing ? t('থামান', 'Pause') : t('শুনুন', 'Listen')}
              className="grid size-14 place-items-center rounded-full bg-primary text-on-primary">
              {playing ? <Pause size={26} /> : <Play size={26} />}
            </button>
          </div>
          <p className="arabic mt-3 text-[1.55rem] text-ink">{dua.arabic}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-[1rem] font-semibold text-primary">{t('অর্থ', 'Meaning')}</summary>
            <p className="mt-2 text-ink-2">{lang === 'bn' ? dua.banglaMeaning : dua.englishMeaning}</p>
          </details>
        </section>
      )}
      <p className="mx-5 mt-4 flex items-start gap-2 text-[0.88rem] text-ink-2"><Undo2 size={16} className="mt-1 shrink-0" />
        {t('সন্দেহ হলে কম সংখ্যা ধরুন। হাতের হিসাব সবসময় আগে।', 'If unsure, take the lower count. Your own count always wins.')}</p>
    </Screen>
  );
}
