import { AlarmClock, Bus, Check, Megaphone, MapPin, Phone, Send, ThumbsDown, ThumbsUp, UserRound, Users, Volume2 } from 'lucide-react';
import { useState } from 'react';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import { clock, num } from '../lib/format';
import { createGroup, joinGroup, postNotice, sendReview, useGroup, type Notice, type NoticeKind } from '../lib/group';
import { usePrefs } from '../lib/prefs';
import { speak } from '../lib/speech';
import { Button, Header, Screen } from '../ui/kit';

export const NOTICE_ICON: Record<NoticeKind, ComponentType<LucideProps>> = { bus: Bus, wake: AlarmClock, meet: MapPin, info: Megaphone };
export const NOTICE_BN: Record<NoticeKind, string> = { bus: 'বাস ছাড়বে', wake: 'উঠতে হবে', meet: 'একসাথে হবো', info: 'জরুরি খবর' };
const NOTICE_EN: Record<NoticeKind, string> = { bus: 'Bus leaves', wake: 'Wake up', meet: 'Meet', info: 'Notice' };

/** "কাল সকাল ৭:০০" style day + time in Makkah. */
export function whenBn(at: number, lang: 'bn' | 'en', now = Date.now()) {
  const day = (ts: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(ts);
  const diff = Math.round((Date.parse(day(at)) - Date.parse(day(now))) / 86400000);
  const d = diff === 0 ? (lang === 'bn' ? 'আজ' : 'Today') : diff === 1 ? (lang === 'bn' ? 'কাল' : 'Tomorrow') : '';
  return `${d} ${clock(at, lang)}`.trim();
}

export function noticeSentence(n: Notice, lang: 'bn' | 'en') {
  const when = n.at ? whenBn(n.at, lang) : '';
  return lang === 'bn' ? `${NOTICE_BN[n.kind]}${when ? ` ${when}` : ''}। ${n.textBn}` : `${NOTICE_EN[n.kind]}${when ? ` ${when}` : ''}. ${n.textBn}`;
}

export function NoticeCard({ n, big = false }: { n: Notice; big?: boolean }) {
  const { t, lang } = usePrefs();
  const Icon = NOTICE_ICON[n.kind];
  return (
    <div className={`card flex items-start gap-4 ${big ? 'p-5' : 'p-4'}`}>
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary"><Icon size={30} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-[1.2rem] font-bold leading-snug">{t(NOTICE_BN[n.kind], NOTICE_EN[n.kind])}{n.at && <span className="text-brass"> · {whenBn(n.at, lang)}</span>}</p>
        <p className="mt-0.5 text-ink-2">{n.textBn}</p>
      </div>
      <button onClick={() => speak(noticeSentence(n, lang), lang)} aria-label={t('শুনুন', 'Listen')}
        className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-on-primary"><Volume2 size={22} /></button>
    </div>
  );
}

const REASONS = ['সময়মতো খবর দেন', 'মিনায় পাশে ছিলেন', 'হোটেল কাছে ছিল', 'প্রশ্নের উত্তর দেন', 'খাবার ভালো ছিল'];
const NO_REASONS = ['খবর দেরিতে দেন', 'মিনায় পাওয়া যায়নি', 'হোটেল দূরে', 'ফোন ধরেন না'];

function Review({ onDone }: { onDone: () => void }) {
  const { t } = usePrefs();
  const [rec, setRec] = useState<boolean | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const toggle = (r: string) => setReasons((x) => (x.includes(r) ? x.filter((y) => y !== r) : [...x, r]));
  return (
    <section className="card mx-4 mt-4 p-5">
      <p className="text-center text-[1.25rem] font-bold leading-snug">{t('আপনার মোয়াল্লেমকে কি অন্য হাজীর কাছে সুপারিশ করবেন?', 'Would you recommend your Moallem to another haji?')}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={() => { setRec(true); setReasons([]); }} aria-pressed={rec === true}
          className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-3xl text-[1.1rem] font-bold ${rec === true ? 'bg-primary text-on-primary' : 'bg-surface-2'}`}>
          <ThumbsUp size={36} /> {t('হ্যাঁ', 'Yes')}
        </button>
        <button onClick={() => { setRec(false); setReasons([]); }} aria-pressed={rec === false}
          className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-3xl text-[1.1rem] font-bold ${rec === false ? 'bg-ink text-bg' : 'bg-surface-2'}`}>
          <ThumbsDown size={36} /> {t('না', 'No')}
        </button>
      </div>
      {rec !== null && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {(rec ? REASONS : NO_REASONS).map((r) => (
              <button key={r} onClick={() => toggle(r)} aria-pressed={reasons.includes(r)}
                className={`min-h-11 rounded-full px-4 font-semibold ${reasons.includes(r) ? 'bg-primary-soft text-primary ring-2 ring-primary' : 'bg-surface-2'}`}>{r}</button>
            ))}
          </div>
          <Button className="mt-4 w-full" icon={Send} onClick={() => sendReview(rec, reasons).then(onDone)}>{t('পাঠান', 'Send')}</Button>
        </>
      )}
    </section>
  );
}

function LeaderPanel() {
  const { t, lang } = usePrefs();
  const { mine, reload } = useGroup();
  const [kind, setKind] = useState<NoticeKind>('bus');
  const [time, setTime] = useState('07:00');
  const [tomorrow, setTomorrow] = useState(true);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  if (!mine) return null;
  const g = mine.group;

  const send = async () => {
    const [h, m] = time.split(':').map(Number);
    const now = new Date();
    const at = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (tomorrow ? 1 : 0), h - 3, m); // Makkah UTC+3
    await postNotice(kind, kind === 'info' ? null : at, text || NOTICE_BN[kind]);
    setText(''); setSent(true); reload();
    setTimeout(() => setSent(false), 2500);
  };

  return (
    <>
      <section className="card mx-4 p-5">
        <div className="flex items-center gap-3">
          <Users className="text-primary" size={28} />
          <p className="flex-1 text-[1.15rem] font-semibold">{t(`${num(g.members, 'bn')} জন হাজী`, `${g.members} hajis`)}</p>
          <p className="num rounded-full bg-surface-2 px-3 py-1 font-bold tracking-widest">{num(g.code, lang)}</p>
        </div>
        {g.reviews.recommendPct !== null && (
          <p className="mt-3 flex items-center gap-2 text-ink-2"><ThumbsUp size={20} className="text-primary" />
            {t(`${num(g.reviews.recommendPct, 'bn')}% হাজী আপনাকে সুপারিশ করবেন`, `${g.reviews.recommendPct}% would recommend you`)}</p>
        )}
      </section>

      <section className="card mx-4 mt-4 p-5">
        <p className="mb-3 text-[1.15rem] font-semibold">{t('সবাইকে জানান', 'Tell everyone')}</p>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(NOTICE_ICON) as NoticeKind[]).map((k) => {
            const Icon = NOTICE_ICON[k];
            return (
              <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k}
                className={`flex flex-col items-center gap-1 rounded-2xl py-3 ${kind === k ? 'bg-primary text-on-primary' : 'bg-surface-2'}`}>
                <Icon size={26} /><span className="text-[0.85rem] font-semibold">{t(NOTICE_BN[k], NOTICE_EN[k])}</span>
              </button>
            );
          })}
        </div>
        {kind !== 'info' && (
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="min-h-14 rounded-2xl border border-line bg-surface px-4 text-[1.2rem] font-bold" />
            <button onClick={() => setTomorrow(!tomorrow)} className="min-h-14 rounded-2xl bg-surface-2 px-4 font-semibold">{tomorrow ? t('কাল', 'Tomorrow') : t('আজ', 'Today')}</button>
          </div>
        )}
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('যেমন: হোটেলের সামনে থেকে', 'e.g. from the hotel gate')}
          className="mt-3 min-h-14 w-full rounded-2xl border border-line bg-surface px-4 placeholder:text-ink-2/70" />
        <Button className="mt-3 w-full" icon={sent ? Check : Send} onClick={send}>{sent ? t('পাঠানো হয়েছে', 'Sent') : t('সবাইকে পাঠান', 'Send to all')}</Button>
      </section>
      <div className="mx-4 mt-4 space-y-3">{g.notices.map((n) => <NoticeCard key={n.id} n={n} />)}</div>
    </>
  );
}

export function Group() {
  const { t } = usePrefs();
  const { mine, loaded, reload } = useGroup();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [asLeader, setAsLeader] = useState(false);
  const [agency, setAgency] = useState('');

  if (!loaded) return <Screen><Header title={t('মোয়াল্লেম', 'Moallem')} /></Screen>;

  if (!mine) {
    return (
      <Screen>
        <Header title={t('মোয়াল্লেম', 'Moallem')} />
        <section className="px-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-2 p-1">
            <button onClick={() => setAsLeader(false)} className={`min-h-12 rounded-xl font-semibold ${!asLeader ? 'bg-surface shadow' : ''}`}>{t('আমি হাজী', 'I am a haji')}</button>
            <button onClick={() => setAsLeader(true)} className={`min-h-12 rounded-xl font-semibold ${asLeader ? 'bg-surface shadow' : ''}`}>{t('আমি মোয়াল্লেম', 'I am a Moallem')}</button>
          </div>
          {asLeader ? (
            <div className="mt-4 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('আপনার নাম', 'Your name')} className="min-h-14 w-full rounded-2xl border border-line bg-surface px-4" />
              <input value={agency} onChange={(e) => setAgency(e.target.value)} placeholder={t('এজেন্সির নাম', 'Agency name')} className="min-h-14 w-full rounded-2xl border border-line bg-surface px-4" />
              <Button className="w-full" icon={Users} onClick={() => createGroup(name, agency, '').then(reload)}>{t('দল খুলুন', 'Create group')}</Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder={t('মোয়াল্লেমের কোড', "Moallem's code")}
                className="num min-h-16 w-full rounded-2xl border border-line bg-surface px-4 text-center text-[1.8rem] font-bold tracking-[0.3em]" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('আপনার নাম', 'Your name')} className="min-h-14 w-full rounded-2xl border border-line bg-surface px-4" />
              <Button className="w-full" icon={UserRound} disabled={code.length !== 6}
                onClick={() => joinGroup(code, name).then(reload).catch(() => setErr(t('কোডটি মেলেনি', 'Code not found')))}>{t('দলে যুক্ত হোন', 'Join group')}</Button>
              {err && <p className="text-center font-semibold text-warn">{err}</p>}
              <p className="text-center text-[0.95rem] text-ink-2">{t('ডেমো কোড: ৩১৩৩১৩', 'Demo code: 313313')}</p>
            </div>
          )}
        </section>
      </Screen>
    );
  }

  const g = mine.group;
  return (
    <Screen>
      <Header title={mine.role === 'leader' ? t('আমার দল', 'My group') : t('মোয়াল্লেম', 'Moallem')} />
      {mine.role === 'leader' ? <LeaderPanel /> : (
        <>
          <section className="card mx-4 flex items-center gap-4 p-5">
            <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-[1.6rem] font-bold text-primary">{g.leaderName.replace('মাওলানা ', '').slice(0, 1)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[1.25rem] font-bold">{g.leaderName}</p>
              <p className="truncate text-ink-2">{g.agency}</p>
            </div>
            {g.phone && <a href={`tel:${g.phone.replace(/\s/g, '')}`} aria-label={t('ফোন করুন', 'Call')} className="grid size-14 place-items-center rounded-full bg-primary text-on-primary"><Phone size={26} /></a>}
          </section>
          <h2 className="mx-5 mt-5 text-[1.1rem] font-semibold text-ink-2">{t('মোয়াল্লেমের খবর', "Moallem's notices")}</h2>
          <div className="mx-4 mt-2 space-y-3">{g.notices.map((n) => <NoticeCard key={n.id} n={n} />)}</div>
          {!mine.reviewed ? <Review onDone={reload} /> : (
            <p className="mx-5 mt-5 flex items-center gap-2 text-ink-2"><Check size={20} className="text-primary" /> {t('আপনার মতামত পাঠানো হয়েছে', 'Your answer was sent')}</p>
          )}
        </>
      )}
    </Screen>
  );
}
