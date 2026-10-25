import { CircleCheck, MapPin, Phone, Siren } from 'lucide-react';
import { useState } from 'react';
import { NEEDS } from '../domain/intents';
import { myCircle, sendSos } from '../lib/circle';
import { usePrefs } from '../lib/prefs';
import { ArabicCard } from './Ask';
import { Button, Header, Screen } from '../ui/kit';

export function Sos() {
  const { t } = usePrefs();
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [card, setCard] = useState(false);
  const lost = NEEDS.find((n) => n.id === 'lost')!;
  const linked = !!myCircle();

  const send = async () => {
    setState('sending');
    navigator.vibrate?.([80, 60, 80]);
    setState((await sendSos()) ? 'sent' : 'failed');
  };

  return (
    <Screen>
      <Header title={t('জরুরি সাহায্য', 'Emergency')} sos={false} />
      <section className="flex flex-col items-center px-4 pt-4">
        <button onClick={send} disabled={state === 'sending'} aria-label={t('পরিবারকে সাহায্যের সংকেত পাঠান', 'Send help alert to family')}
          className="grid size-56 place-items-center rounded-full bg-sos text-on-sos shadow-[0_10px_30px_rgba(179,38,30,0.35)] active:scale-95">
          <span className="flex flex-col items-center gap-2">
            {state === 'sent' ? <CircleCheck size={72} /> : <Siren size={72} strokeWidth={1.75} />}
            <span className="text-[1.5rem] font-bold">{state === 'sent' ? t('পাঠানো হয়েছে', 'Sent') : 'SOS'}</span>
          </span>
        </button>
        <p className="mt-4 max-w-xs text-center text-[1.1rem] text-ink-2">
          {state === 'sent' ? t('পরিবার আপনার অবস্থান পেয়েছে', 'Family has your location')
            : state === 'failed' ? t('নেটওয়ার্ক নেই। নিচের কার্ডটি পুলিশকে দেখান।', 'No network. Show the card below to police.')
            : linked ? t('চাপ দিলে পরিবার আপনার অবস্থান পাবে', 'Tap to send your location to family')
            : t('পরিবার যুক্ত নেই। কার্ড দেখান বা ফোন করুন।', 'No family linked. Show the card or call.')}
        </p>
      </section>
      <section className="mt-6 grid gap-3 px-4">
        <Button variant="quiet" icon={MapPin} onClick={() => setCard(true)} className="min-h-16 text-[1.2rem]">{t('আরবি কার্ড: পথ হারিয়েছি', 'Arabic card: I am lost')}</Button>
        <a href="tel:911" className="inline-flex min-h-16 items-center justify-center gap-2.5 rounded-2xl border border-line text-[1.2rem] font-semibold text-primary">
          <Phone size={24} /> {t('সৌদি জরুরি ৯১১', 'Saudi emergency 911')}
        </a>
      </section>
      {card && <ArabicCard need={lost} onClose={() => setCard(false)} />}
    </Screen>
  );
}
