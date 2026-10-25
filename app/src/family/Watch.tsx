import {
  BatteryLow, BatteryMedium, ChevronLeft, CircleCheck, Clock, CreditCard, Footprints, HeartHandshake, Hourglass, MapPin,
  PauseCircle, ShieldCheck, Siren, Smartphone, WifiOff, Info,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { freshness, resolveSite } from '../domain/geo';
import { ago, clock, num } from '../lib/format';
import { usePrefs } from '../lib/prefs';
import { go } from '../lib/router';
import { Button, Chip, IconButton, LangToggle, Screen, ThemeToggle } from '../ui/kit';

const LiveMap = lazy(() => import('./LiveMap'));

const KEY = 'moallem.watch';
type PlanId = 'single' | 'family' | 'abroad';
interface Beat { lat: number; lng: number; accuracy: number; battery: number | null; stage: string; ts: number }
interface Ev { id: string; kind: 'ritual' | 'zone' | 'sos' | 'info'; label: string; labelEn: string; ts: number }
interface Status {
  viewerStatus: 'pending' | 'approved'; pilgrimName: string; viewerName?: string; paused?: boolean; access?: boolean;
  trialEndsAt?: number | null; subscription?: { plan: PlanId; until: number } | null; lastSeenAt?: number | null;
  last?: Beat | null; trail?: Beat[]; events?: Ev[]; okAt?: number | null; viewers?: number; sosLocation?: Beat | null;
}

const token = () => { try { return localStorage.getItem(KEY); } catch { return null; } };

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token() ?? ''}`, ...(init.headers || {}) } });
  if (!r.ok) throw Object.assign(new Error(String(r.status)), { status: r.status });
  return r.json();
}

/** Live status over SSE, falling back to polling every 20 s. */
function useStatus(enabled: boolean) {
  const [status, setStatus] = useState<Status | null>(null);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let alive = true;
    const pollNow = () => api<Status>('/api/watch/status').then((s) => alive && setStatus(s)).catch((e) => e.status === 401 && setGone(true));
    const connect = async () => {
      try {
        const { ticket } = await api<{ ticket: string }>('/api/watch/stream-ticket', { method: 'POST' });
        es = new EventSource(`/api/watch/stream?ticket=${ticket}`);
        es.addEventListener('status', (e) => alive && setStatus(JSON.parse((e as MessageEvent).data)));
        es.onerror = () => { es?.close(); if (!poll) poll = setInterval(pollNow, 20000); setTimeout(() => alive && connect(), 5000); };
      } catch (e) {
        if ((e as { status?: number }).status === 401) setGone(true);
        if (!poll) poll = setInterval(pollNow, 20000);
      }
    };
    pollNow();
    connect();
    return () => { alive = false; es?.close(); if (poll) clearInterval(poll); };
  }, [enabled]);
  return { status, setStatus, gone };
}

export function Watch({ codeFromLink, showPass }: { codeFromLink?: string; showPass?: boolean }) {
  const [joined, setJoined] = useState(() => !!token());
  const { status, setStatus, gone } = useStatus(joined);

  useEffect(() => { if (gone) { localStorage.removeItem(KEY); setJoined(false); } }, [gone]);

  if (!joined) return <Join initialCode={codeFromLink} onJoined={() => setJoined(true)} />;
  if (!status) return <Screen><p className="p-8 text-center text-ink-2">…</p></Screen>;
  if (status.viewerStatus === 'pending') return <Waiting name={status.pilgrimName} />;
  if (showPass || status.access === false) return <Pass status={status} onPaid={setStatus} />;
  return <Live status={status} />;
}

function Join({ initialCode, onJoined }: { initialCode?: string; onJoined: () => void }) {
  const { t, lang } = usePrefs();
  const [code, setCode] = useState(initialCode ?? '');
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const join = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await fetch('/api/watch/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, name }) });
      if (!r.ok) {
        const msg: Record<number, string> = {
          404: t('কোডটি মেলেনি', 'Code not found'), 410: t('কোডের সময় শেষ, নতুন কোড চান', 'Code expired, ask for a new one'),
          409: t('আর জায়গা নেই', 'No more viewers allowed'), 429: t('একটু পরে চেষ্টা করুন', 'Too many tries, wait a bit'),
        };
        setErr(msg[r.status] ?? t('আবার চেষ্টা করুন', 'Please try again'));
      } else {
        const j = await r.json();
        localStorage.setItem(KEY, j.viewerToken);
        onJoined();
      }
    } catch { setErr(t('ইন্টারনেট নেই', 'No internet')); }
    setBusy(false);
  };

  return (
    <Screen>
      <div className="relative h-[34vh] min-h-[14rem] overflow-hidden">
        <img src="/img/kaaba.webp" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="scrim-bottom absolute inset-0" />
        <div className="absolute right-4 top-[max(env(safe-area-inset-top),14px)] flex gap-2"><ThemeToggle onPhoto /><LangToggle onPhoto /></div>
        <div className="absolute bottom-5 left-5 text-white">
          <p className="font-display text-[2.1rem] leading-tight">{t('প্রিয়জনের হজে সাথে থাকুন', 'Be with them on Hajj')}</p>
        </div>
      </div>
      <section className="px-4 pt-5">
        <label className="block">
          <span className="mb-1.5 block font-semibold">{t('হাজীর কোড', "Pilgrim's code")}</span>
          <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={lang === 'bn' ? num(code, 'bn') : code}
            onChange={(e) => setCode(e.target.value.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))).replace(/\D/g, '').slice(0, 6))}
            className="num min-h-16 w-full rounded-2xl border border-line bg-surface px-4 text-center text-[2rem] font-bold tracking-[0.3em]" placeholder="••••••" />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block font-semibold">{t('আপনার নাম ও সম্পর্ক', 'Your name and relation')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('যেমন: রহিম (ছেলে)', 'e.g. Rahim (son)')}
            className="min-h-14 w-full rounded-2xl border border-line bg-surface px-4 placeholder:text-ink-2/70" />
        </label>
        <Button className="mt-5 w-full" icon={ShieldCheck} onClick={join} disabled={busy || code.length !== 6}>{t('যুক্ত হোন', 'Join')}</Button>
        {err && <p className="mt-3 text-center font-semibold text-warn" role="alert">{err}</p>}
        <p className="mt-6 flex items-start gap-2 text-[0.95rem] text-ink-2"><Info size={20} className="mt-0.5 shrink-0" />
          {t('হাজী নিজে অনুমতি দিলে তবেই দেখতে পাবেন। ডেমো কোড: ৭৮৬৭৮৬', 'You see them only after they approve you. Demo code: 786786')}</p>
      </section>
    </Screen>
  );
}

function Waiting({ name }: { name: string }) {
  const { t } = usePrefs();
  return (
    <Screen className="flex flex-col items-center justify-center px-6 text-center">
      <span className="grid size-24 place-items-center rounded-full bg-primary-soft text-primary"><Hourglass size={48} strokeWidth={1.5} /></span>
      <h1 className="mt-6 text-[1.6rem] font-bold">{t(`${name}-এর অনুমতির অপেক্ষায়`, `Waiting for ${name} to approve`)}</h1>
      <p className="mt-2 text-ink-2">{t('উনার ফোনে আপনার নাম দেখাবে', 'They will see your name on their phone')}</p>
    </Screen>
  );
}

function Live({ status }: { status: Status }) {
  const { t, lang } = usePrefs();
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(id); }, []);

  const last = status.last ?? null;
  const fresh = freshness(status.lastSeenAt ?? null);
  const site = last ? resolveSite(last.lat, last.lng) : null;
  const placeName = site?.site ? t(site.site.nameBn, site.site.nameEn) : t('অন্য জায়গায়', 'Elsewhere');
  const silentMin = status.lastSeenAt ? (Date.now() - status.lastSeenAt) / 60000 : Infinity;
  const sosRecent = (status.events ?? []).some((e) => e.kind === 'sos' && Date.now() - e.ts < 6 * 3600e3);
  const battery = last?.battery ?? null;
  const initial = status.pilgrimName.trim().slice(0, 1) || 'হ';
  const trialLeftH = status.trialEndsAt && !status.subscription ? Math.max(0, Math.ceil((status.trialEndsAt - Date.now()) / 3600e3)) : null;
  const events = useMemo(() => [...(status.events ?? [])].reverse(), [status.events]);

  return (
    <main className="screen-in mx-auto min-h-dvh w-full max-w-[64rem] lg:grid lg:grid-cols-[3fr_2fr]">
      <div className="relative isolate h-[50vh] lg:sticky lg:top-0 lg:h-dvh">
        <Suspense fallback={<div className="size-full bg-surface-2" />}>
          <LiveMap trail={status.trail ?? []} initial={initial} className="absolute inset-0" />
        </Suspense>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-center gap-2 bg-gradient-to-b from-black/40 to-transparent px-4 pb-8 pt-[max(env(safe-area-inset-top),14px)]">
          <span className="pointer-events-auto"><IconButton onPhoto icon={ChevronLeft} label={t('বের হন', 'Leave')} onClick={() => go('/')} /></span>
          <p className="flex-1 text-[1.35rem] font-bold text-white drop-shadow">{status.pilgrimName}</p>
          <span className="pointer-events-auto flex gap-2"><ThemeToggle onPhoto /><LangToggle onPhoto /></span>
        </div>
      </div>

      <section className="relative z-10 -mt-6 rounded-t-[1.75rem] bg-bg px-4 pb-24 pt-5 lg:mt-0 lg:rounded-none lg:pt-6">
        {sosRecent && (
          <div className="mb-4 flex items-center gap-3 rounded-3xl bg-sos p-4 text-on-sos" role="alert">
            <Siren size={30} /> <p className="text-[1.15rem] font-bold">{t('সাহায্য চেয়েছেন। এখনই ফোন করুন।', 'They asked for help. Call now.')}</p>
          </div>
        )}

        {status.okAt && (
          <div className="mb-3 flex items-center gap-3 rounded-3xl bg-primary-soft p-4 text-primary">
            <HeartHandshake size={30} />
            <p className="text-[1.15rem] font-bold">{t('"আমি ভালো আছি"', '"I\'m OK"')} <span className="font-normal text-ink-2">· {ago(status.okAt, lang)}</span></p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {status.paused ? <Chip icon={PauseCircle} tone="warn">{t('শেয়ারিং বন্ধ রেখেছেন', 'Sharing paused')}</Chip> : (
            <>
              <Chip icon={MapPin} tone="ok">{placeName}</Chip>
              <Chip icon={fresh === 'stale' ? WifiOff : Clock} tone={silentMin > 120 ? 'sos' : silentMin > 30 ? 'warn' : 'neutral'}>{ago(status.lastSeenAt ?? null, lang)}</Chip>
              <Chip icon={battery !== null && battery < 0.2 ? BatteryLow : BatteryMedium} tone={battery !== null && battery < 0.2 ? 'warn' : 'neutral'}>
                {battery === null ? t('ব্যাটারি অজানা', 'Battery unknown') : `${num(Math.round(battery * 100), lang)}%`}
              </Chip>
              {last?.stage === 'arafat9' && <Chip icon={Footprints}>{t('আরাফার দিন', 'Arafah day')}</Chip>}
            </>
          )}
        </div>

        {fresh === 'stale' && !status.paused && (
          <p className="mt-3 flex items-start gap-2 rounded-2xl bg-surface-2 p-3 text-[0.98rem] text-ink-2"><WifiOff size={20} className="mt-0.5 shrink-0" />
            {t(`শেষ অবস্থান ${status.lastSeenAt ? clock(status.lastSeenAt, 'bn') : ''}। মিনা-আরাফায় নেটওয়ার্ক প্রায়ই দুর্বল থাকে, এটা স্বাভাবিক।`,
              `Last seen ${status.lastSeenAt ? clock(status.lastSeenAt, 'en') : ''}. Network in Mina and Arafah is often weak; this is normal.`)}</p>
        )}

        <h2 className="mt-6 text-[1.15rem] font-semibold text-ink-2">{t('আজ', 'Today')}</h2>
        <ol className="relative mt-3 space-y-4 border-l-2 border-line pl-6">
          {events.map((e) => (
            <li key={e.id} className="relative">
              <span className={`absolute -left-[1.95rem] top-1.5 size-3.5 rounded-full ring-4 ring-bg ${e.kind === 'sos' ? 'bg-sos' : e.kind === 'ritual' ? 'bg-brass' : 'bg-primary'}`} />
              <p className="num text-[0.92rem] text-ink-2">{clock(e.ts, lang)}</p>
              <p className="text-[1.12rem] font-semibold leading-snug">{t(e.label, e.labelEn)}</p>
            </li>
          ))}
        </ol>

        {trialLeftH !== null && (
          <button onClick={() => go('/watch/pass')} className="card mt-6 flex w-full items-center gap-3 p-4 text-left">
            <ShieldCheck className="text-primary" size={28} />
            <span className="flex-1"><b className="block">{t('হজ সিজন পাস', 'Hajj Season Pass')}</b>
              <span className="text-ink-2">{t(`ফ্রি · ${num(trialLeftH, 'bn')} ঘণ্টা বাকি`, `Free · ${trialLeftH} h left`)}</span></span>
            <span className="rounded-full bg-primary px-4 py-2 font-semibold text-on-primary">{t('নিন', 'Get')}</span>
          </button>
        )}
        {status.subscription && (
          <p className="mt-6 flex items-center gap-2 text-ink-2"><CircleCheck size={20} className="text-primary" /> {t('সিজন পাস চালু', 'Season Pass active')}</p>
        )}
        <p className="mt-6 text-[0.85rem] text-ink-2">{t('ডেমো: আরাফার পথে একজন হাজী', 'Demo: a pilgrim on the way to Arafah')}</p>
      </section>
    </main>
  );
}

const PLANS: Array<{ id: PlanId; priceBn: string; priceEn: string; bn: string; en: string }> = [
  { id: 'single', priceBn: '৳২৯৯', priceEn: '৳299', bn: '১ জন দেখবেন', en: '1 viewer' },
  { id: 'family', priceBn: '৳৪৯৯', priceEn: '৳499', bn: 'পরিবারের ৫ জন', en: 'Up to 5 family' },
  { id: 'abroad', priceBn: '$৯.৯৯', priceEn: '$9.99', bn: 'বিদেশ থেকে, কার্ডে', en: 'From abroad, by card' },
];

function Pass({ status, onPaid }: { status: Status; onPaid: (s: Status) => void }) {
  const { t, lang } = usePrefs();
  const [plan, setPlan] = useState<PlanId>('single');
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'card'>('bkash');
  const [busy, setBusy] = useState(false);
  const chosen = PLANS.find((p) => p.id === plan)!;
  const methodLabel = { bkash: 'bKash', nagad: t('নগদ', 'Nagad'), card: t('কার্ড', 'Card') }[method];

  const pay = async () => {
    setBusy(true);
    try {
      const s = await api<Status>('/api/watch/pass', { method: 'POST', body: JSON.stringify({ plan, method }) });
      onPaid(s);
      go('/watch');
    } finally { setBusy(false); }
  };

  return (
    <main className="screen-in relative mx-auto min-h-dvh w-full max-w-[34rem]">
      <div className="absolute inset-x-0 top-0 isolate h-[38vh] overflow-hidden" aria-hidden="true">
        <Suspense fallback={null}>
          <LiveMap trail={status.trail ?? []} initial={status.pilgrimName.slice(0, 1)} interactive={false} className="absolute inset-0 scale-110 blur-[3px]" />
        </Suspense>
        <div className="absolute inset-0 z-[1000] bg-gradient-to-b from-bg/10 via-bg/40 to-bg" />
      </div>
      <div className="relative px-4 pt-[max(env(safe-area-inset-top),14px)]">
        <IconButton icon={ChevronLeft} label={t('ফিরে যান', 'Back')} onClick={() => go('/watch')} />
        <h1 className="mt-[18vh] font-display text-[2.1rem] leading-tight">{t(`${status.pilgrimName} কোথায়, সবসময় জানুন`, `Always know where ${status.pilgrimName} is`)}</h1>
        <ul className="mt-4 space-y-2.5">
          {[[MapPin, 'লাইভ ম্যাপ', 'Live map'], [Footprints, 'হজের প্রতিটি ধাপ', 'Every Hajj step'], [BatteryMedium, 'ব্যাটারি ও শেষ দেখা', 'Battery and last seen']].map(([Icon, bn, en]) => {
            const I = Icon as typeof MapPin;
            return <li key={en as string} className="flex items-center gap-3 text-[1.12rem]"><span className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary"><I size={22} /></span>{t(bn as string, en as string)}</li>;
          })}
        </ul>

        <fieldset className="mt-6 space-y-3">
          <legend className="sr-only">{t('পাস বেছে নিন', 'Choose a pass')}</legend>
          {PLANS.map((p) => (
            <label key={p.id} className={`card flex min-h-16 cursor-pointer items-center gap-4 px-5 ${plan === p.id ? 'border-primary ring-2 ring-primary' : ''}`}>
              <input type="radio" name="plan" checked={plan === p.id} onChange={() => { setPlan(p.id); if (p.id === 'abroad') setMethod('card'); }} className="size-5 accent-[var(--primary)]" />
              <span className="flex-1 text-[1.1rem] font-semibold">{t(p.bn, p.en)}</span>
              <span className="num text-[1.3rem] font-bold">{lang === 'bn' ? p.priceBn : p.priceEn}</span>
            </label>
          ))}
        </fieldset>
        <p className="mt-2 text-[0.92rem] text-ink-2">{t('একবারই, পুরো হজ মৌসুম (৪৫ দিন)', 'One payment, the whole Hajj season (45 days)')}</p>

        <div className="mt-5 grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('কীভাবে দেবেন', 'Pay with')}>
          {(['bkash', 'nagad', 'card'] as const).map((m) => (
            <button key={m} role="radio" aria-checked={method === m} onClick={() => setMethod(m)} disabled={plan === 'abroad' && m !== 'card'}
              className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl font-semibold ${method === m ? 'bg-ink text-bg' : 'bg-surface-2'}`}>
              {m === 'card' ? <CreditCard size={20} /> : <Smartphone size={20} />} {{ bkash: 'bKash', nagad: t('নগদ', 'Nagad'), card: t('কার্ড', 'Card') }[m]}
            </button>
          ))}
        </div>

        <Button className="mt-5 w-full text-[1.2rem]" onClick={pay} disabled={busy}>
          {lang === 'bn' ? `${chosen.priceBn} ${methodLabel} দিয়ে` : `Pay ${chosen.priceEn} with ${methodLabel}`}
        </Button>
        <p className="mt-4 pb-10 text-center text-[0.95rem] text-ink-2">{t('ইবাদত ও SOS সবসময় ফ্রি · তথ্য কখনো বিক্রি হয় না', 'Worship and SOS are always free · Data is never sold')}</p>
      </div>
    </main>
  );
}
