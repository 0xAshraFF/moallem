import { ChevronLeft, Moon, Siren, Sun } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';
import { back, go } from '../lib/router';
import { usePrefs } from '../lib/prefs';

type IconC = ComponentType<LucideProps>;

/** Big icon tile: the icon says what it does, one or two words confirm it. */
export function Tile({ icon: Icon, label, onClick, tone = 'primary' }: { icon: IconC; label: string; onClick: () => void; tone?: 'primary' | 'brass' }) {
  return (
    <button onClick={onClick}
      className="card flex min-h-[7.5rem] flex-col items-center justify-center gap-3 px-3 py-4 text-center transition-transform duration-150 active:scale-[0.97]">
      <span className="grid size-14 place-items-center rounded-full bg-medal text-brass ring-1 ring-brass/20">
        <Icon size={32} strokeWidth={1.75} />
      </span>
      <span className="text-[1.15rem] font-semibold leading-tight">{label}</span>
    </button>
  );
}

export function Button({ children, onClick, icon: Icon, variant = 'primary', className = '', disabled, type = 'button' }: {
  children: ReactNode; onClick?: () => void; icon?: IconC; variant?: 'primary' | 'quiet' | 'sos' | 'outline';
  className?: string; disabled?: boolean; type?: 'button' | 'submit';
}) {
  const styles = {
    primary: 'bg-primary text-on-primary',
    sos: 'bg-sos text-on-sos',
    quiet: 'bg-surface-2 text-ink',
    outline: 'bg-transparent text-primary border border-line',
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex min-h-14 items-center justify-center gap-2.5 whitespace-nowrap rounded-2xl px-5 text-[1.1rem] font-semibold transition-transform duration-150 active:scale-[0.98] ${styles} ${className}`}>
      {Icon && <Icon size={24} strokeWidth={2} className="shrink-0" />}
      {children}
    </button>
  );
}

/** Round icon button for top bars. Always has an accessible name. */
export function IconButton({ icon: Icon, label, onClick, onPhoto = false, active = false }: { icon: IconC; label: string; onClick: () => void; onPhoto?: boolean; active?: boolean }) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      className={`grid size-12 place-items-center rounded-full transition-colors ${onPhoto ? 'bg-black/35 text-white' : active ? 'bg-primary-soft text-primary' : 'bg-surface-2 text-ink'}`}>
      <Icon size={24} strokeWidth={1.9} />
    </button>
  );
}

export function SosPill({ onPhoto = false }: { onPhoto?: boolean }) {
  const { t } = usePrefs();
  return (
    <button onClick={() => go('/sos')} aria-label={t('জরুরি সাহায্য', 'Emergency help')}
      className={`inline-flex h-12 items-center gap-1.5 rounded-full bg-sos px-4 font-bold text-on-sos ${onPhoto ? 'shadow-lg' : ''}`}>
      <Siren size={22} strokeWidth={2} /> SOS
    </button>
  );
}

export function ThemeToggle({ onPhoto = false }: { onPhoto?: boolean }) {
  const { resolvedTheme, set, t } = usePrefs();
  const dark = resolvedTheme === 'dark';
  return (
    <IconButton onPhoto={onPhoto} icon={dark ? Moon : Sun} label={dark ? t('রাতের মোড', 'Night mode') : t('দিনের মোড', 'Day mode')}
      onClick={() => set({ theme: dark ? 'light' : 'dark' })} />
  );
}

export function LangToggle({ onPhoto = false }: { onPhoto?: boolean }) {
  const { lang, set } = usePrefs();
  return (
    <button onClick={() => set({ lang: lang === 'bn' ? 'en' : 'bn' })} aria-label={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
      className={`grid h-12 min-w-12 place-items-center rounded-full px-3 text-[0.95rem] font-bold ${onPhoto ? 'bg-black/35 text-white' : 'bg-surface-2 text-ink'}`}>
      {lang === 'bn' ? 'EN' : 'বাং'}
    </button>
  );
}

/** Plain screen header: back, title, and SOS always reachable. */
export function Header({ title, right, sos = true, onPhoto = false }: { title: string; right?: ReactNode; sos?: boolean; onPhoto?: boolean }) {
  const { t } = usePrefs();
  return (
    <header className={`${onPhoto ? 'scrim-top' : 'sticky top-0 bg-bg/85'} z-20 flex items-center gap-3 px-4 pb-3 pt-[max(env(safe-area-inset-top),12px)]`}>
      <IconButton icon={ChevronLeft} label={t('ফিরে যান', 'Back')} onClick={back} onPhoto={onPhoto} />
      <h1 className="flex-1 truncate text-[1.45rem] font-bold leading-tight">{title}</h1>
      {right}
      {sos && <SosPill />}
    </header>
  );
}

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <main className={`screen-in mx-auto min-h-dvh w-full max-w-[34rem] pb-32 ${className}`}>{children}</main>;
}

export function Chip({ icon: Icon, children, tone = 'neutral' }: { icon: IconC; children: ReactNode; tone?: 'neutral' | 'warn' | 'sos' | 'ok' }) {
  const styles = {
    neutral: 'bg-surface-2 text-ink',
    warn: 'bg-warn-soft text-warn border border-warn/50',
    sos: 'bg-sos text-on-sos',
    ok: 'bg-primary-soft text-primary',
  }[tone];
  return (
    <span className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-[0.95rem] font-semibold ${styles}`}>
      <Icon size={20} strokeWidth={2} /> {children}
    </span>
  );
}

export function Photo({ name, className = '', alt = '' }: { name: string; className?: string; alt?: string }) {
  return <img src={`/img/${name}.webp`} alt={alt} className={`object-cover ${className}`} draggable={false} />;
}

/** ফরজ / ওয়াজিব / সুন্নত pill. Colour + word, never colour alone. */
export function WeightPill({ weight, lang }: { weight: 'fard' | 'wajib' | 'sunnah'; lang: 'bn' | 'en' }) {
  const label = { fard: ['ফরজ', 'Pillar'], wajib: ['ওয়াজিব', 'Wajib'], sunnah: ['সুন্নত', 'Sunnah'] }[weight][lang === 'bn' ? 0 : 1];
  const cls = { fard: 'bg-fard-bg text-fard', wajib: 'bg-wajib-bg text-wajib', sunnah: 'bg-sunnah-bg text-sunnah' }[weight];
  return <span className={`inline-flex h-7 items-center rounded-full px-3 text-[0.85rem] font-bold ${cls}`}>{label}</span>;
}

/** The pilgrim's profile as small pills: Hajj type · brother/sister · Hanafi. */
export function ProfilePills() {
  const { t, hajjType, gender } = usePrefs();
  const type = { tamattu: t('তামাত্তু', "Tamattu'"), qiran: t('কিরান', 'Qiran'), ifrad: t('ইফরাদ', 'Ifrad') }[hajjType];
  return (
    <a href="#/settings" className="inline-flex flex-wrap gap-1.5" aria-label={t('প্রোফাইল বদলান', 'Change profile')}>
      {[type, gender === 'male' ? t('ভাই', 'Brother') : t('বোন', 'Sister'), t('হানাফি', 'Hanafi')].map((x) => (
        <span key={x} className="rounded-full bg-medal px-3 py-1 text-[0.85rem] font-semibold text-brass">{x}</span>
      ))}
    </a>
  );
}
