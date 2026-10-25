import { ArrowLeft, Check, ScanLine, UserRound } from 'lucide-react';
import { useState } from 'react';
import { usePrefs, type HajjType } from '../lib/prefs';
import { go } from '../lib/router';
import { speak } from '../lib/speech';
import { KaabaIcon } from '../ui/icons';
import { Button } from '../ui/kit';

const TYPES: Array<{ id: HajjType; bn: string; en: string; flowBn: string; flowEn: string; noteBn: string; noteEn: string }> = [
  { id: 'tamattu', bn: 'তামাত্তু', en: "Tamattu'", flowBn: 'উমরাহ → বিরতি → হজ', flowEn: 'Umrah → break → Hajj',
    noteBn: 'বেশিরভাগ বাংলাদেশি হাজী এটি করেন', noteEn: 'What most Bangladeshi pilgrims do' },
  { id: 'qiran', bn: 'কিরান', en: 'Qiran', flowBn: 'উমরাহ ও হজ একই ইহরামে', flowEn: 'Umrah and Hajj in one Ihram',
    noteBn: '১০ তারিখ পর্যন্ত ইহরাম খুলবেন না', noteEn: 'Ihram stays on until the 10th' },
  { id: 'ifrad', bn: 'ইফরাদ', en: 'Ifrad', flowBn: 'শুধু হজ', flowEn: 'Hajj only',
    noteBn: 'কুরবানি ওয়াজিব নয়', noteEn: 'Sacrifice not required' },
];

/** Three taps: language, brother or sister, Hajj type. Everything can be changed later in Settings. */
export function Onboarding() {
  const { t, set, lang, gender, hajjType } = usePrefs();
  const [step, setStep] = useState(0);
  const total = 3;

  const finish = (toTicket: boolean) => { set({ onboarded: true }); go(toTicket ? '/trip' : '/'); };

  const Choice = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} aria-pressed={on}
      className={`card flex w-full items-center gap-4 p-5 text-left transition-[box-shadow,transform] active:scale-[0.99] ${on ? 'ring-2 ring-primary' : ''}`}>
      {children}
      <span className={`ml-auto grid size-8 shrink-0 place-items-center rounded-full ${on ? 'bg-primary text-on-primary' : 'border border-line'}`}>{on && <Check size={18} />}</span>
    </button>
  );

  return (
    <main className="screen-in mx-auto flex min-h-dvh w-full max-w-[34rem] flex-col px-5 pb-8 pt-[max(env(safe-area-inset-top),20px)]">
      <div className="flex items-center gap-3">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} aria-label={t('ফিরে যান', 'Back')} className="grid size-12 place-items-center rounded-full bg-surface-2"><ArrowLeft size={22} /></button>
        ) : <span className="size-12" />}
        <div className="flex flex-1 gap-1.5" aria-label={t(`ধাপ ${step + 1}/${total}`, `Step ${step + 1} of ${total}`)}>
          {Array.from({ length: total }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-line'}`} />)}
        </div>
        <span className="size-12" />
      </div>

      <div key={step} className="sheet-in mt-8 flex flex-1 flex-col">
        {step === 0 && (
          <>
            <span className="mx-auto grid size-24 place-items-center rounded-full bg-medal text-brass ring-1 ring-brass/20"><KaabaIcon size={52} strokeWidth={1.5} /></span>
            <h1 className="mt-6 text-center font-display text-[2.4rem] leading-tight">মোয়াল্লেম</h1>
            <p className="mt-2 text-center text-ink-2">আপনার হজের সাথী · Your Hajj companion</p>
            <div className="mt-8 grid gap-3">
              <Choice on={lang === 'bn'} onClick={() => { set({ lang: 'bn' }); speak('বাংলা বেছে নিয়েছেন', 'bn'); }}><span className="text-[1.4rem] font-bold">বাংলা</span></Choice>
              <Choice on={lang === 'en'} onClick={() => set({ lang: 'en' })}><span className="text-[1.4rem] font-bold">English</span></Choice>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="font-display text-[2rem] leading-tight">{t('আপনি কে?', 'Who is going?')}</h1>
            <p className="mt-2 text-ink-2">{t('ইহরাম, রমল ও চুল কাটার নিয়ম এর উপর বদলায়', 'Ihram, Raml and hair-cutting rules depend on this')}</p>
            <div className="mt-6 grid gap-3">
              {(['male', 'female'] as const).map((g) => (
                <Choice key={g} on={gender === g} onClick={() => set({ gender: g })}>
                  <span className="grid size-16 place-items-center rounded-full bg-medal text-brass"><UserRound size={34} strokeWidth={1.6} /></span>
                  <span className="text-[1.4rem] font-bold">{g === 'male' ? t('ভাই', 'Brother') : t('বোন', 'Sister')}</span>
                </Choice>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-display text-[2rem] leading-tight">{t('কোন হজ করবেন?', 'Which Hajj?')}</h1>
            <p className="mt-2 text-ink-2">{t('না জানলে তামাত্তু রাখুন, মোয়াল্লেমকে জিজ্ঞেস করুন', "Not sure? Keep Tamattu' and ask your Moallem")}</p>
            <div className="mt-6 grid gap-3">
              {TYPES.map((ty) => (
                <Choice key={ty.id} on={hajjType === ty.id} onClick={() => set({ hajjType: ty.id })}>
                  <span className="min-w-0">
                    <span className="block text-[1.35rem] font-bold">{t(ty.bn, ty.en)}</span>
                    <span className="block font-semibold text-brass">{t(ty.flowBn, ty.flowEn)}</span>
                    <span className="block text-[0.95rem] text-ink-2">{t(ty.noteBn, ty.noteEn)}</span>
                  </span>
                </Choice>
              ))}
            </div>
            <p className="mt-4 text-center text-[0.9rem] text-ink-2">{t('মাসআলা: হানাফি মাজহাব (ইসলামিক ফাউন্ডেশন বাংলাদেশ)', 'Rulings: Hanafi school (Islamic Foundation Bangladesh)')}</p>
          </>
        )}
      </div>

      <div className="mt-6 grid gap-3">
        {step < total - 1 ? (
          <Button onClick={() => setStep(step + 1)} className="w-full min-h-16 text-[1.2rem]">{t('পরের ধাপ', 'Next')}</Button>
        ) : (
          <>
            <Button icon={ScanLine} onClick={() => finish(true)} className="w-full min-h-16 text-[1.2rem]">{t('টিকিটের ছবি দিন', 'Add my ticket')}</Button>
            <Button variant="quiet" onClick={() => finish(false)} className="w-full">{t('পরে দেব', 'Later')}</Button>
          </>
        )}
      </div>
    </main>
  );
}
