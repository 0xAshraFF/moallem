import { Camera, ChevronDown, Keyboard, Loader2, Luggage, PlaneLanding, PlaneTakeoff, ScanLine, Sparkles, Volume2 } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  answerTripQuestion, dateBn, dateEn, PLACE_BN, PLACE_EN, type Place, type Ticket,
} from '../domain/itinerary';
import { num } from '../lib/format';
import { usePrefs } from '../lib/prefs';
import { speak } from '../lib/speech';
import { DEMO_TICKET, fileToBase64, saveTicket, useTrip } from '../lib/trip';
import { Button, Header, Photo, Screen } from '../ui/kit';

export const PLACE_PHOTO: Record<Place, string> = {
  makkah: 'kaaba-close', madinah: 'madinah-dome', mina: 'mina', arafah: 'arafat', muzdalifah: 'muzdalifah',
  jamarat: 'jamarat', jeddah: 'jeddah', dhaka: 'dhaka', air: 'haram-aerial',
};

const QUESTIONS: Array<[string, string]> = [
  ['মদিনায় কয়দিন থাকব?', 'How many days in Madinah?'],
  ['কবে মক্কা যাব?', 'When do I go to Makkah?'],
  ['কবে মিনা যাব?', 'When do I go to Mina?'],
  ['হজের আর কয়দিন বাকি?', 'How many days to Hajj?'],
  ['লাগেজ কবে রেডি করব?', 'When do I pack?'],
  ['কবে দেশে ফিরব?', 'When do I fly home?'],
];

function ManualForm({ initial, onSave }: { initial: Ticket; onSave: (t: Ticket) => void }) {
  const { t } = usePrefs();
  const [tk, setTk] = useState<Ticket>(initial);
  const field = 'min-h-14 w-full rounded-2xl border border-line bg-surface px-4';
  return (
    <div className="card mt-4 space-y-3 p-5">
      <p className="flex items-center gap-2 font-semibold"><PlaneLanding size={22} className="text-primary" /> {t('যাওয়ার ফ্লাইট', 'Flight to Saudi')}</p>
      <div className="grid grid-cols-2 gap-2">
        <input className={field} type="date" value={tk.inbound.date} onChange={(e) => setTk({ ...tk, inbound: { ...tk.inbound, date: e.target.value } })} />
        <select className={field} value={tk.inbound.to} onChange={(e) => setTk({ ...tk, inbound: { ...tk.inbound, to: e.target.value } })}>
          <option value="JED">{t('জেদ্দা নামবো', 'Land Jeddah')}</option><option value="MED">{t('মদিনা নামবো', 'Land Madinah')}</option>
        </select>
      </div>
      <p className="flex items-center gap-2 pt-2 font-semibold"><PlaneTakeoff size={22} className="text-primary" /> {t('ফেরার ফ্লাইট', 'Flight home')}</p>
      <div className="grid grid-cols-2 gap-2">
        <input className={field} type="date" value={tk.outbound.date} onChange={(e) => setTk({ ...tk, outbound: { ...tk.outbound, date: e.target.value } })} />
        <select className={field} value={tk.outbound.from} onChange={(e) => setTk({ ...tk, outbound: { ...tk.outbound, from: e.target.value } })}>
          <option value="JED">{t('জেদ্দা থেকে', 'From Jeddah')}</option><option value="MED">{t('মদিনা থেকে', 'From Madinah')}</option>
        </select>
      </div>
      <Button className="w-full" onClick={() => onSave(tk)}>{t('যাত্রা তৈরি করুন', 'Build my trip')}</Button>
    </div>
  );
}

export function Trip() {
  const { t, lang } = usePrefs();
  const { itinerary, today, day } = useTrip();
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const scan = async (file?: File) => {
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      const imageBase64 = await fileToBase64(file);
      const r = await fetch('/api/ticket/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64, mimeType: file.type }) });
      if (r.ok) saveTicket(await r.json());
      else { setManual(true); setMsg(t('ছবি থেকে পড়া গেল না। তারিখগুলো নিজে দিন।', "Couldn't read the photo. Enter the dates.")); }
    } catch { setManual(true); setMsg(t('ইন্টারনেট নেই। তারিখগুলো নিজে দিন।', 'No internet. Enter the dates.')); }
    setBusy(false);
  };

  if (!itinerary) {
    return (
      <Screen>
        <Header title={t('আমার যাত্রা', 'My trip')} />
        <section className="px-4">
          <button onClick={() => fileRef.current?.click()} disabled={busy}
            className="card flex w-full flex-col items-center gap-3 px-6 py-10 text-center active:scale-[0.99]">
            <span className="grid size-24 place-items-center rounded-3xl bg-primary text-on-primary">
              {busy ? <Loader2 size={48} className="animate-spin" /> : <ScanLine size={52} strokeWidth={1.6} />}
            </span>
            <span className="text-[1.5rem] font-bold">{busy ? t('পড়ছি...', 'Reading...') : t('টিকিটের ছবি তুলুন', 'Photo of your ticket')}</span>
            <span className="text-ink-2">{t('একবার দিলেই পুরো হজের দিনগুলো সাজিয়ে দেব', 'Once, and I plan every day of your Hajj')}</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => scan(e.target.files?.[0])} />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button variant="quiet" icon={Keyboard} onClick={() => setManual(true)}>{t('নিজে লিখুন', 'Type it')}</Button>
            <Button variant="quiet" icon={Sparkles} onClick={() => saveTicket(DEMO_TICKET)}>{t('ডেমো টিকিট', 'Demo ticket')}</Button>
          </div>
          {msg && <p className="mt-3 text-center font-semibold text-warn">{msg}</p>}
          {manual && <ManualForm initial={DEMO_TICKET} onSave={saveTicket} />}
        </section>
      </Screen>
    );
  }

  const it = itinerary;
  const ask = (q: [string, string]) => {
    const a = answerTripQuestion(it, q[0], today);
    const out = a ? (lang === 'bn' ? a.replyBn : a.replyEn) : t('এটা আপনার মোয়াল্লেমকে জিজ্ঞেস করুন', 'Ask your Moallem');
    setAnswer(out);
    speak(out, lang);
  };
  const date = (d: string) => (lang === 'bn' ? dateBn(d) : dateEn(d));
  const short = (d: string) => date(d).split(', ').pop() ?? date(d);
  const stats: Array<[string, string]> = [
    [t('নামবেন', 'Land'), it.arrivalDate ? short(it.arrivalDate) : '—'],
    [t('মদিনায়', 'Madinah'), it.madinah ? t(`${num(it.madinah.days, 'bn')} দিন`, `${it.madinah.days} days`) : '—'],
    [t('আরাফা', 'Arafah'), short(it.hajj.arafah)],
    [t('দেশে ফেরা', 'Home'), it.homeDate ? short(it.homeDate) : '—'],
  ];

  return (
    <Screen>
      <Header title={t('আমার যাত্রা', 'My trip')} />
      <section className="grid grid-cols-4 gap-2 px-4">
        {stats.map(([k, v]) => (
          <div key={k} className="card flex flex-col items-center px-1 py-3 text-center">
            <span className="text-[0.85rem] text-ink-2">{k}</span>
            <span className="num text-[1rem] font-bold leading-tight">{v}</span>
          </div>
        ))}
      </section>

      <section className="mt-4 px-4">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {QUESTIONS.map((q) => (
            <button key={q[1]} onClick={() => ask(q)} className="shrink-0 rounded-full bg-primary-soft px-4 py-2.5 font-semibold text-primary">{t(q[0], q[1])}</button>
          ))}
        </div>
        {answer && (
          <div className="card mt-3 flex items-start gap-3 p-4" aria-live="polite">
            <Volume2 size={22} className="mt-1 shrink-0 text-primary" />
            <p className="text-[1.12rem] leading-relaxed">{answer}</p>
          </div>
        )}
      </section>

      <ol className="mt-5 space-y-3 px-4">
        {it.segments.map((s, i) => {
          const now = today >= s.start && today <= s.end;
          const days = it.days.filter((d) => d.date >= s.start && d.date <= s.end);
          return (
            <li key={i} className={`card overflow-hidden ${now ? 'ring-2 ring-primary' : ''}`}>
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-3 p-3 text-left" aria-expanded={open === i}>
                <Photo name={PLACE_PHOTO[s.place]} className="size-16 shrink-0 rounded-2xl" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[1.15rem] font-bold">{t(s.titleBn, s.titleEn)}</span>
                  <span className="num block text-[0.95rem] text-ink-2">{date(s.start)}{s.end !== s.start ? ` – ${date(s.end)}` : ''}</span>
                </span>
                {now && <span className="rounded-full bg-primary px-3 py-1 text-[0.85rem] font-bold text-on-primary">{t('এখন', 'Now')}</span>}
                <ChevronDown className={`shrink-0 text-ink-2 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <ul className="divide-y divide-line border-t border-line">
                  {days.map((d) => (
                    <li key={d.date} className={`px-4 py-3 ${d.date === today ? 'bg-primary-soft' : ''}`}>
                      <p className="num font-semibold">{date(d.date)}{d.hijriBn && <span className="text-brass"> · {t(d.hijriBn, d.hijriEn ?? '')}</span>}</p>
                      <ul className="mt-1 list-disc pl-5 text-ink-2">{d.tasks.map((k, j) => <li key={j}>{t(k.bn, k.en)}</li>)}</ul>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      {day && <p className="mx-5 mt-4 text-[0.95rem] text-ink-2">{t(`আজ আপনি ${PLACE_BN[day.place]}`, `Today: ${PLACE_EN[day.place]}`)}</p>}
      <section className="mx-4 mt-4 flex gap-3">
        <Button variant="quiet" icon={Camera} className="flex-1" onClick={() => saveTicket(null)}>{t('নতুন টিকিট', 'New ticket')}</Button>
        <Button variant="quiet" icon={Luggage} className="flex-1" onClick={() => ask(['লাগেজ কবে রেডি করব?', 'When do I pack?'])}>{t('লাগেজ', 'Luggage')}</Button>
      </section>
    </Screen>
  );
}
