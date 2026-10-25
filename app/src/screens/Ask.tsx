import { Accessibility, CloudDownload, Droplets, Headphones, Mic, Pill, Route, Scissors, Send, Utensils, Volume2, X, GlassWater, Check } from 'lucide-react';
import { enableEarbuds, earbudsSupported } from '../lib/earbuds';
import { nextNotice, useGroup, type NoticeKind } from '../lib/group';
import { noticeSentence } from './Group';
import { useTrip } from '../lib/trip';
import { answerTripQuestion } from '../domain/itinerary';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import { answerOffline, NEEDS, type Need, type NeedId } from '../domain/intents';
import { usePrefs } from '../lib/prefs';
import { speak } from '../lib/speech';
import { Header, Screen } from '../ui/kit';

const NEED_ICONS: Record<NeedId, ComponentType<LucideProps>> = {
  food: Utensils, water: GlassWater, pharmacy: Pill, barber: Scissors, wheelchair: Accessibility, toilet: Droplets, lost: Route,
};

type Rec = { start: () => void; stop: () => void; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; lang: string; interimResults: boolean };

/** Full-screen Arabic card to show a shopkeeper or guard. */
export function ArabicCard({ need, onClose }: { need: Need; onClose: () => void }) {
  const { t } = usePrefs();
  // Portal: the screen's entrance animation creates a stacking context that would trap this under the nav.
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-surface p-5 pt-[max(env(safe-area-inset-top),20px)]" role="dialog" aria-modal="true">
      <div className="flex justify-end">
        <button onClick={onClose} aria-label={t('বন্ধ করুন', 'Close')} className="grid size-14 place-items-center rounded-full bg-surface-2"><X size={28} /></button>
      </div>
      <div className="flex flex-1 flex-col justify-center text-center">
        <p className="font-[family-name:var(--font-sign)] text-[2.3rem] font-bold leading-[1.7] text-ink" dir="rtl">{need.card.arabic}</p>
        <p className="mt-6 text-[1.15rem] text-ink-2">{need.card.phoneticBn}</p>
        <p className="mt-2 text-[1.2rem] font-semibold">{need.card.meaningBn}</p>
      </div>
      <button onClick={() => speak(need.card.arabic, 'ar')} className="mx-auto mb-6 inline-flex min-h-16 items-center gap-3 rounded-2xl bg-primary px-8 text-[1.2rem] font-semibold text-on-primary">
        <Volume2 size={26} /> {t('আরবিতে শোনান', 'Play in Arabic')}
      </button>
    </div>,
    document.body,
  );
}

export function Ask() {
  const { t, lang } = usePrefs();
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [reply, setReply] = useState<{ q: string; a: string } | null>(null);
  const [card, setCard] = useState<Need | null>(null);
  const rec = useRef<Rec | null>(null);
  const { mine } = useGroup();
  const trip = useTrip();
  const [earbuds, setEarbuds] = useState(false);
  const stopEarbuds = useRef<(() => void) | null>(null);
  const [popular, setPopular] = useState<Array<{ key: string; question: string; replyBn: string; replyEn: string; count: number }>>(() => {
    try { return JSON.parse(localStorage.getItem('moallem.answers') || '[]'); } catch { return []; }
  });
  const [saved, setSaved] = useState(false);
  useEffect(() => () => stopEarbuds.current?.(), []);

  const SR = (window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }).SpeechRecognition
    ?? (window as unknown as { webkitSpeechRecognition?: new () => Rec }).webkitSpeechRecognition;

  /** Bus / wake-up / meeting questions are answered from the Moallem's own notices. */
  const fromNotices = (q: string): string | null => {
    if (!mine) return null;
    const k: NoticeKind | null = /বাস|গাড়ি|bus/i.test(q) ? 'bus' : /উঠ|ঘুম|wake/i.test(q) ? 'wake' : /দেখা|কোথায় থাক|জমা|meet/i.test(q) ? 'meet' : null;
    if (!k) return null;
    const n = nextNotice(mine.group.notices.filter((x) => x.kind === k));
    if (!n) return lang === 'bn' ? 'মোয়াল্লেম এখনো সময় জানাননি। জানালেই আপনাকে শোনাব।' : "Your Moallem hasn't announced it yet. I'll tell you when he does.";
    return noticeSentence(n, lang);
  };

  const ask = async (q: string) => {
    if (!q.trim()) return;
    const fromMoallem = fromNotices(q);
    if (fromMoallem) { setReply({ q, a: fromMoallem }); setText(''); speak(fromMoallem, lang); return; }
    const fromTrip = trip.itinerary ? answerTripQuestion(trip.itinerary, q, trip.today) : null;
    if (fromTrip && fromTrip.topic !== 'announcement') {
      const out = lang === 'bn' ? fromTrip.replyBn : fromTrip.replyEn;
      setReply({ q, a: out }); setText(''); speak(out, lang); return;
    }
    let a = answerOffline(q);
    try {
      const r = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: q }) });
      if (r.ok) a = await r.json();
    } catch { /* offline: local answer already in hand */ }
    const out = lang === 'bn' ? a.replyBn : a.replyEn;
    setReply({ q, a: out });
    setText('');
    speak(out, lang);
  };

  const toggleMic = () => {
    if (!SR) return;
    if (listening) { rec.current?.stop(); return; }
    const r = new SR();
    r.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
    r.interimResults = false;
    r.onresult = (e) => ask(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  };

  const toggleEarbuds = async () => {
    if (earbuds) { stopEarbuds.current?.(); stopEarbuds.current = null; setEarbuds(false); return; }
    try {
      stopEarbuds.current = await enableEarbuds(() => toggleMic(), { title: t('মোয়াল্লেম শুনছে', 'Moallem is listening'), artist: t('হেডফোনের বোতাম চাপুন', 'Press your earbud button') });
      setEarbuds(true);
      speak(t('হেডফোনের বোতাম চাপুন, তারপর প্রশ্ন বলুন', 'Press your earbud button, then ask'), lang);
    } catch { setEarbuds(false); }
  };

  const saveOffline = async () => {
    try {
      const list = await (await fetch('/api/answers/popular')).json();
      localStorage.setItem('moallem.answers', JSON.stringify(list));
      setPopular(list);
      setSaved(true);
    } catch { /* offline already */ }
  };

  useEffect(() => {
    if (window.location.hash.includes('listen')) toggleMic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen>
      <Header title={t('জিজ্ঞেস করুন', 'Ask')} />
      <section className="flex flex-col items-center px-4 pt-2">
        <button onClick={toggleMic} disabled={!SR} aria-pressed={listening} aria-label={t('কথা বলুন', 'Speak')}
          className={`grid size-36 place-items-center rounded-full shadow-lg transition-transform active:scale-95 ${listening ? 'bg-brass text-white' : 'bg-primary text-on-primary'}`}>
          <Mic size={64} strokeWidth={1.75} />
        </button>
        <p className="mt-4 text-[1.2rem] font-semibold">{listening ? t('শুনছি...', 'Listening...') : t('চাপ দিয়ে বলুন', 'Tap and speak')}</p>
        {!SR && <p className="text-ink-2">{t('এই ফোনে মাইক নেই, লিখে জিজ্ঞেস করুন', 'No mic here, type instead')}</p>}
        {earbudsSupported() && (
          <button onClick={toggleEarbuds} aria-pressed={earbuds}
            className={`mt-3 inline-flex min-h-12 items-center gap-2 rounded-full px-5 font-semibold ${earbuds ? 'bg-primary text-on-primary' : 'bg-surface-2'}`}>
            <Headphones size={22} /> {earbuds ? t('হেডফোন চালু', 'Earbuds on') : t('হেডফোনে শুনুন', 'Use earbuds')}
          </button>
        )}
      </section>

      <form className="mx-4 mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('যেমন: ভুলে আতর লেগেছে', 'e.g. I used perfume by mistake')}
          className="min-h-14 flex-1 rounded-2xl border border-line bg-surface px-4 placeholder:text-ink-2/70" />
        <button type="submit" aria-label={t('পাঠান', 'Send')} className="grid size-14 place-items-center rounded-2xl bg-primary text-on-primary"><Send size={24} /></button>
      </form>

      {reply && (
        <section className="card mx-4 mt-4 p-5" aria-live="polite">
          <p className="text-[0.95rem] text-ink-2">“{reply.q}”</p>
          <p className="mt-2 text-[1.12rem] leading-relaxed">{reply.a}</p>
          <button onClick={() => speak(reply.a, lang)} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-soft px-4 font-semibold text-primary">
            <Volume2 size={20} /> {t('আবার শুনুন', 'Hear again')}
          </button>
        </section>
      )}

      <h2 className="mx-5 mt-6 text-[1.1rem] font-semibold text-ink-2">{t('আরবিতে দেখান', 'Show in Arabic')}</h2>
      <div className="mt-3 grid grid-cols-3 gap-3 px-4">
        {NEEDS.map((n) => {
          const Icon = NEED_ICONS[n.id];
          return (
            <button key={n.id} onClick={() => setCard(n)}
              className="card flex min-h-[6.5rem] flex-col items-center justify-center gap-2 px-2 py-3 active:scale-[0.97]">
              <Icon size={30} strokeWidth={1.75} className={n.id === 'lost' ? 'text-sos' : 'text-primary'} />
              <span className="text-center text-[0.98rem] font-semibold leading-tight">{t(n.labelBn, n.labelEn)}</span>
            </button>
          );
        })}
      </div>
      <div className="mx-5 mt-6 flex items-center gap-3">
        <h2 className="flex-1 text-[1.1rem] font-semibold text-ink-2">{t('অন্য হাজীরা যা জিজ্ঞেস করেছেন', 'What other hajis asked')}</h2>
        <button onClick={saveOffline} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-soft px-4 font-semibold text-primary">
          {saved ? <Check size={20} /> : <CloudDownload size={20} />} {saved ? t('রাখা হয়েছে', 'Saved') : t('অফলাইনে রাখুন', 'Save offline')}
        </button>
      </div>
      <ul className="mx-4 mt-2 space-y-2">
        {popular.slice(0, 6).map((p) => (
          <li key={p.key}>
            <button onClick={() => { const a = lang === 'bn' ? p.replyBn : p.replyEn; setReply({ q: p.question, a }); speak(a, lang); }}
              className="card flex w-full items-center gap-3 p-3 text-left">
              <Volume2 size={20} className="shrink-0 text-primary" />
              <span className="flex-1 truncate">{p.question}</span>
            </button>
          </li>
        ))}
      </ul>
      {card && <ArabicCard need={card} onClose={() => setCard(null)} />}
    </Screen>
  );
}
