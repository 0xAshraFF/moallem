import { Check, CirclePause, CirclePlay, HeartHandshake, RefreshCw, Share2, ShieldCheck, Users, Volume2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { approve, createCircle, getMe, myCircle, removeViewer, renewInvite, sayOk, setPaused, type CircleMe } from '../lib/circle';
import { ago, num } from '../lib/format';
import { usePrefs } from '../lib/prefs';
import { speak } from '../lib/speech';
import { Button, Header, Screen } from '../ui/kit';

const CONSENT_BN = 'আপনি চাইলে পরিবারের যাদের অনুমতি দেবেন, শুধু তারাই আপনার অবস্থান দেখতে পাবে। যেকোনো সময় বন্ধ করতে পারবেন। বিপদে SOS সবসময় কাজ করবে।';
const CONSENT_EN = 'Only family you approve can see where you are. You can stop anytime. SOS always works.';

export function Family() {
  const { t, lang } = usePrefs();
  const [me, setMe] = useState<CircleMe | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [okSent, setOkSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = () => getMe().then(setMe).catch(() => setErr(t('সার্ভারে পৌঁছানো যাচ্ছে না', 'Cannot reach server')));
  useEffect(() => {
    if (!myCircle()) return;
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.code]);

  const start = async () => {
    setBusy(true);
    setErr(null);
    try { await createCircle(name || t('হাজী', 'Pilgrim')); await load(); } catch { setErr(t('আবার চেষ্টা করুন', 'Please try again')); }
    setBusy(false);
  };

  if (!myCircle() || !me) {
    return (
      <Screen>
        <Header title={t('পরিবার', 'Family')} />
        <section className="px-4">
          <div className="card flex flex-col items-center p-6 text-center">
            <span className="grid size-20 place-items-center rounded-full bg-primary-soft text-primary"><HeartHandshake size={44} strokeWidth={1.5} /></span>
            <h2 className="mt-4 text-[1.5rem] font-bold">{t('পরিবারকে সাথে রাখুন', 'Keep family with you')}</h2>
            <p className="mt-2 text-ink-2">{t(CONSENT_BN, CONSENT_EN)}</p>
            <button onClick={() => speak(t(CONSENT_BN, CONSENT_EN), lang)} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-soft px-4 font-semibold text-primary">
              <Volume2 size={20} /> {t('শুনুন', 'Listen')}
            </button>
          </div>
          <label className="mt-4 block">
            <span className="mb-1.5 block font-semibold">{t('আপনার নাম', 'Your name')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('যেমন: আব্দুল করিম', 'e.g. Abdul Karim')}
              className="min-h-14 w-full rounded-2xl border border-line bg-surface px-4 placeholder:text-ink-2/70" />
          </label>
          <Button className="mt-4 w-full" icon={ShieldCheck} onClick={start} disabled={busy}>{t('রাজি, শুরু করুন', 'I agree, start')}</Button>
          {err && <p className="mt-3 text-center text-warn">{err}</p>}
        </section>
      </Screen>
    );
  }

  const pending = me.viewers.filter((v) => v.status === 'pending');
  const approved = me.viewers.filter((v) => v.status === 'approved');
  const inviteLeftMin = Math.max(0, Math.round((me.inviteExpiresAt - Date.now()) / 60000));
  const inviteOpen = inviteLeftMin > 0;
  const share = () => {
    const url = `${location.origin}/#/watch/${me.code}`;
    const text = t(`আমার হজের সাথে থাকুন। মোয়াল্লেম অ্যাপে কোড: ${me.code}`, `Stay with me on Hajj. Moallem code: ${me.code}`);
    if (navigator.share) navigator.share({ title: 'Moallem', text, url }).catch(() => {});
    else navigator.clipboard?.writeText(`${text} ${url}`);
  };

  return (
    <Screen>
      <Header title={t('পরিবার', 'Family')} />

      <section className="px-4">
        <button onClick={async () => { await sayOk(); setOkSent(true); navigator.vibrate?.(40); }}
          className="flex min-h-[5.5rem] w-full items-center justify-center gap-3 rounded-3xl bg-primary text-[1.45rem] font-bold text-on-primary shadow-[var(--shadow)] active:scale-[0.98]">
          {okSent ? <Check size={34} /> : <HeartHandshake size={34} />}
          {okSent ? t('পরিবার জানলো', 'Family told') : t('আমি ভালো আছি', "I'm OK")}
        </button>
        {me.okAt && <p className="mt-2 text-center text-ink-2">{t('শেষ পাঠানো', 'Last sent')} {ago(me.okAt, lang)}</p>}
      </section>

      {pending.length > 0 && (
        <section className="mx-4 mt-4 space-y-3">
          {pending.map((v) => (
            <div key={v.id} className="card flex items-center gap-3 border-brass/60 p-4">
              <span className="grid size-12 place-items-center rounded-full bg-surface-2 text-[1.2rem] font-bold">{v.name.slice(0, 1)}</span>
              <p className="min-w-0 flex-1 text-[1.1rem] leading-snug"><b className="block truncate">{v.name}</b> {t('দেখতে চায়', 'wants to see you')}</p>
              <button onClick={() => approve(v.id).then(load)} aria-label={t('অনুমতি দিন', 'Allow')} className="grid size-14 place-items-center rounded-full bg-primary text-on-primary"><Check size={28} /></button>
              <button onClick={() => removeViewer(v.id).then(load)} aria-label={t('না', 'Deny')} className="grid size-14 place-items-center rounded-full bg-surface-2"><X size={28} /></button>
            </div>
          ))}
        </section>
      )}

      <section className="card mx-4 mt-4 p-5 text-center">
        <p className="font-semibold text-ink-2">{t('পরিবারকে এই কোড দিন', 'Give family this code')}</p>
        <p className="num mt-2 text-[3rem] font-bold tracking-[0.18em] text-ink" aria-label={me.code.split('').join(' ')}>{num(me.code, lang)}</p>
        <p className="text-[0.95rem] text-ink-2">
          {inviteOpen ? t(`${num(inviteLeftMin, 'bn')} মিনিট চালু থাকবে`, `Valid ${inviteLeftMin} more min`) : t('কোডের সময় শেষ', 'Code expired')}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button icon={Share2} onClick={share}>{t('পাঠান', 'Share')}</Button>
          <Button variant="quiet" icon={RefreshCw} onClick={() => renewInvite().then(load)}>{t('নতুন কোড', 'Renew')}</Button>
        </div>
      </section>

      <section className="card mx-4 mt-4 p-5">
        <div className="flex items-center gap-3">
          <Users className="text-primary" size={26} />
          <p className="flex-1 text-[1.15rem] font-semibold">{t(`${num(approved.length, 'bn')} জন দেখছেন`, `${approved.length} watching`)}</p>
        </div>
        {approved.length > 0 && (
          <ul className="mt-3 divide-y divide-line">
            {approved.map((v) => (
              <li key={v.id} className="flex items-center gap-3 py-3">
                <span className="grid size-10 place-items-center rounded-full bg-surface-2 font-bold">{v.name.slice(0, 1)}</span>
                <span className="flex-1">{v.name}</span>
                <button onClick={() => removeViewer(v.id).then(load)} className="min-h-11 rounded-full px-3 text-ink-2" aria-label={t(`${v.name} কে সরান`, `Remove ${v.name}`)}><X size={22} /></button>
              </li>
            ))}
          </ul>
        )}
        <Button variant="outline" className="mt-4 w-full" icon={me.paused ? CirclePlay : CirclePause} onClick={() => setPaused(!me.paused).then(load)}>
          {me.paused ? t('আবার শেয়ার করুন', 'Resume sharing') : t('শেয়ারিং বন্ধ রাখুন', 'Pause sharing')}
        </Button>
        <p className="mt-2 text-center text-[0.9rem] text-ink-2">{t('বন্ধ থাকলেও SOS কাজ করবে', 'SOS works even when paused')}</p>
      </section>
    </Screen>
  );
}
