import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DayId } from '../domain/days';

export type Theme = 'auto' | 'light' | 'dark';
export type Lang = 'bn' | 'en';
export type Gender = 'male' | 'female';
export type HajjType = 'tamattu' | 'qiran' | 'ifrad';

export interface Prefs {
  theme: Theme;
  lang: Lang;
  scale: 1 | 1.15 | 1.3;
  day: DayId; // which Hajj day the app shows (demo control; real app derives it from date + GPS)
  reduceMotion: boolean;
  onboarded: boolean;
  gender: Gender;
  hajjType: HajjType;
}

const DEFAULTS: Prefs = { theme: 'auto', lang: 'bn', scale: 1, day: 'arafah', reduceMotion: false, onboarded: false, gender: 'male', hajjType: 'tamattu' };
const KEY = 'moallem.prefs';

function load(): Prefs {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return DEFAULTS;
  }
}

/** "Auto" follows sunrise and sunset in Makkah, where the pilgrim actually is, not the phone setting. */
export function makkahIsNight(now = new Date()): boolean {
  const h = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Riyadh' }).format(now));
  return h < 6 || h >= 19;
}

interface Ctx extends Prefs {
  set: (patch: Partial<Prefs>) => void;
  resolvedTheme: 'light' | 'dark';
  t: (bn: string, en: string) => string;
}

const PrefsContext = createContext<Ctx | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(load);
  const [night, setNight] = useState(makkahIsNight);

  useEffect(() => {
    const id = setInterval(() => setNight(makkahIsNight()), 60_000);
    return () => clearInterval(id);
  }, []);

  const resolvedTheme = prefs.theme === 'auto' ? (night ? 'dark' : 'light') : prefs.theme;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.lang = prefs.lang;
    root.style.setProperty('--scale', String(prefs.scale));
    root.dataset.motion = prefs.reduceMotion ? 'reduce' : '';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolvedTheme === 'dark' ? '#0F1311' : '#F4F5F2');
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...prefs, theme: prefs.theme }));
    } catch {
      /* private mode: prefs just won't persist */
    }
  }, [prefs, resolvedTheme]);

  const set = useCallback((patch: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...patch })), []);
  const t = useCallback((bn: string, en: string) => (prefs.lang === 'bn' ? bn : en), [prefs.lang]);

  const value = useMemo(() => ({ ...prefs, set, resolvedTheme, t }), [prefs, set, resolvedTheme, t]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs outside PrefsProvider');
  return ctx;
}
