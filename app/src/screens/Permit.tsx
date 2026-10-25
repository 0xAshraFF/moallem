import { ImagePlus, SunMedium } from 'lucide-react';
import { useState } from 'react';
import { usePrefs } from '../lib/prefs';
import { Button, Header, Screen } from '../ui/kit';

/** Nusuk permit / card photo kept on the phone for checkpoints. Works offline; never uploaded. */
export function Permit() {
  const { t } = usePrefs();
  const [img, setImg] = useState<string | null>(() => { try { return localStorage.getItem('moallem.permit'); } catch { return null; } });
  const [bright, setBright] = useState(false);

  const pick = (file?: File) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      const data = String(r.result);
      setImg(data);
      try { localStorage.setItem('moallem.permit', data); } catch { /* too big for storage; still shown now */ }
    };
    r.readAsDataURL(file);
  };

  if (bright && img) {
    return (
      <button onClick={() => setBright(false)} className="fixed inset-0 z-50 grid place-items-center bg-white p-4" aria-label={t('বন্ধ করুন', 'Close')}>
        <img src={img} alt={t('নুসুক পারমিট', 'Nusuk permit')} className="max-h-full max-w-full object-contain" />
      </button>
    );
  }

  return (
    <Screen>
      <Header title={t('নুসুক পারমিট', 'Nusuk permit')} />
      <section className="px-4">
        {img ? (
          <>
            <button onClick={() => setBright(true)} className="card block w-full overflow-hidden p-3">
              <img src={img} alt={t('নুসুক পারমিট', 'Nusuk permit')} className="mx-auto max-h-[50vh] object-contain" />
            </button>
            <Button className="mt-4 w-full" icon={SunMedium} onClick={() => setBright(true)}>{t('বড় করে দেখান', 'Show full screen')}</Button>
          </>
        ) : (
          <div className="card flex flex-col items-center gap-3 p-8 text-center">
            <ImagePlus size={56} strokeWidth={1.5} className="text-primary" />
            <p className="text-[1.15rem] font-semibold">{t('পারমিটের ছবি রাখুন', 'Save a photo of your permit')}</p>
            <p className="text-ink-2">{t('ইন্টারনেট ছাড়াও দেখা যাবে', 'Works without internet')}</p>
          </div>
        )}
        <label className="mt-3 inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-surface-2 text-[1.1rem] font-semibold">
          <ImagePlus size={24} /> {img ? t('ছবি বদলান', 'Change photo') : t('ছবি যোগ করুন', 'Add photo')}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
      </section>
    </Screen>
  );
}
