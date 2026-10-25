import { HeartHandshake, Mic, Pause, Play, Send, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { matchDuas, type Dua } from '../domain/duaMatch';
import { usePrefs } from '../lib/prefs';
import { speak, stopSpeaking } from '../lib/speech';

type Rec = { start: () => void; stop: () => void; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; lang: string };

const EXAMPLES: Array<[string, string]> = [
  ['মা-বাবার জন্য দোয়া চাই', 'A dua for my parents'],
  ['সন্তানের ভবিষ্যৎ নিয়ে চিন্তা', "Worried about my children's future"],
  ['শরীর অসুস্থ লাগছে', 'I feel unwell'],
  ['আব্বা মারা গেছেন', 'My father passed away'],
];

/** Say what is on your heart; matching Qur'anic duas slide up in a sheet. */
export function DuaMatcher() {
  const { t, lang } = usePrefs();
  const [text, setText] = useState('');
  const [asked, setAsked] = useState<string | null>(null);
  const [found, setFound] = useState<Dua[]>([]);
  const [listening, setListening] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const rec = useRef<Rec | null>(null);
  const W = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  const SR = W.SpeechRecognition ?? W.webkitSpeechRecognition;

  const find = (q: string) => {
    if (!q.trim()) return;
    setAsked(q);
    setFound(matchDuas(q, 3));
    setText('');
  };

  const mic = () => {
    if (!SR) return;
    if (listening) { rec.current?.stop(); return; }
    const r = new SR();
    r.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
    r.onresult = (e) => find(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  };

  const play = async (d: Dua) => {
    if (playing === d.id) { stopSpeaking(); setPlaying(null); return; }
    setPlaying(d.id);
    if (!(await speak(d.arabic, 'ar', () => setPlaying(null)))) setPlaying(null);
  };
  const close = () => { stopSpeaking(); setPlaying(null); setAsked(null); };

  return (
    <section className="card mx-4 mb-4 p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-medal text-brass"><HeartHandshake size={26} /></span>
        <div>
          <p className="font-display text-[1.4rem] leading-tight">{t('মনের কথা বলুন', 'Say what is on your heart')}</p>
          <p className="text-[0.95rem] text-ink-2">{t('কুরআনের মানানসই দোয়া খুঁজে দেব', "I'll find a fitting Qur'anic dua")}</p>
        </div>
      </div>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); find(text); }}>
        <button type="button" onClick={mic} disabled={!SR} aria-pressed={listening} aria-label={t('বলুন', 'Speak')}
          className={`grid size-14 shrink-0 place-items-center rounded-2xl ${listening ? 'bg-brass text-white' : 'bg-primary text-on-primary'}`}><Mic size={26} /></button>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={listening ? t('শুনছি...', 'Listening...') : t('যেমন: মায়ের অসুখ', "e.g. my mother's illness")}
          className="min-h-14 min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 placeholder:text-ink-2/70" />
        <button type="submit" aria-label={t('খুঁজুন', 'Find')} className="grid size-14 shrink-0 place-items-center rounded-2xl bg-surface-2"><Send size={22} /></button>
      </form>
      <div className="snap-row -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
        {EXAMPLES.map((ex) => (
          <button key={ex[1]} onClick={() => find(t(ex[0], ex[1]))} className="shrink-0 rounded-full bg-surface-2 px-4 py-2 text-[0.95rem] font-semibold">{t(ex[0], ex[1])}</button>
        ))}
      </div>

      {asked && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={close}>
          <div className="sheet-in max-h-[85dvh] overflow-y-auto rounded-t-[2rem] bg-bg px-4 pb-[max(env(safe-area-inset-bottom),20px)] pt-3" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" />
            <div className="flex items-start gap-3 px-1">
              <p className="flex-1 text-ink-2">“{asked}”</p>
              <button onClick={close} aria-label={t('বন্ধ করুন', 'Close')} className="grid size-11 place-items-center rounded-full bg-surface-2"><X size={22} /></button>
            </div>
            <ul className="stagger mt-3 space-y-3">
              {found.map((d) => (
                <li key={d.id} className="card p-5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-medal px-3 py-1 text-[0.85rem] font-bold text-brass">{t(d.themeBn, d.themeEn)}</span>
                    <span className="flex-1" />
                    <button onClick={() => play(d)} aria-label={playing === d.id ? t('থামান', 'Pause') : t('শুনুন', 'Listen')}
                      className="grid size-12 place-items-center rounded-full bg-primary text-on-primary">{playing === d.id ? <Pause size={22} /> : <Play size={22} />}</button>
                  </div>
                  <p className="arabic mt-3 text-[1.6rem] text-ink">{d.arabic}</p>
                  <p className="mt-2 font-semibold text-brass">{d.pronBn}</p>
                  <p className="mt-1 text-ink-2">{lang === 'bn' ? d.meaningBn : d.meaningEn}</p>
                  <p className="mt-2 text-[0.85rem] text-ink-2">{d.source}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
