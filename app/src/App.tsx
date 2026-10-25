import { BookOpen, House, Map as MapIcon, Mic, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import { dayById } from './domain/days';
import { myCircle, startHeartbeats } from './lib/circle';
import { usePrefs } from './lib/prefs';
import { go, useRoute } from './lib/router';
import { Watch } from './family/Watch';
import { MapScreen } from './map/MapScreen';
import { Group } from './screens/Group';
import { Onboarding } from './screens/Onboarding';
import { usePlacePhoto } from './lib/placePhoto';
import { Arafah } from './screens/Arafah';
import { Ask } from './screens/Ask';
import { Counter } from './screens/Counter';
import { Duas } from './screens/Duas';
import { Family } from './screens/Family';
import { Permit } from './screens/Permit';
import { Settings } from './screens/Settings';
import { Sos } from './screens/Sos';
import { Steps } from './screens/Steps';
import { Today } from './screens/Today';
import { Trip } from './screens/Trip';

function NavItem({ icon: Icon, label, active, onClick }: { icon: ComponentType<LucideProps>; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-current={active ? 'page' : undefined}
      className={`flex flex-1 flex-col items-center gap-1 pt-2 ${active ? 'text-primary' : 'text-ink-2'}`}>
      <span className={`grid h-8 w-14 place-items-center rounded-full ${active ? 'bg-primary-soft' : ''}`}><Icon size={26} strokeWidth={active ? 2.1 : 1.8} /></span>
      <span className={`text-[0.85rem] leading-none ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </button>
  );
}

function BottomNav({ route }: { route: string }) {
  const { t } = usePrefs();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]" aria-label={t('প্রধান মেনু', 'Main menu')}>
      <div className="mx-auto flex h-[4.6rem] max-w-[34rem] items-stretch px-1">
        <NavItem icon={House} label={t('আজ', 'Today')} active={route === ''} onClick={() => go('/')} />
        <NavItem icon={MapIcon} label={t('ম্যাপ', 'Map')} active={route === 'map'} onClick={() => go('/map')} />
        <div className="flex flex-1 justify-center">
          <button onClick={() => go('/ask/listen')} aria-label={t('কথা বলুন', 'Speak')}
            className="-mt-5 grid size-[4.4rem] place-items-center rounded-full bg-primary text-on-primary shadow-[0_8px_20px_rgba(30,91,63,0.35)] ring-4 ring-bg active:scale-95">
            <Mic size={32} strokeWidth={2} />
          </button>
        </div>
        <NavItem icon={BookOpen} label={t('দোয়া', 'Duas')} active={route === 'duas'} onClick={() => go('/duas')} />
        <NavItem icon={Users} label={t('পরিবার', 'Family')} active={route === 'family'} onClick={() => go('/family')} />
      </div>
    </nav>
  );
}

/** The app's wallpaper is the place the pilgrim is in right now, softened behind every screen. */
function Backdrop() {
  const photo = usePlacePhoto();
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <img key={photo} src={`/img/${photo}.webp`} alt="" className="wallpaper-in size-full object-cover" />
      <div className="wallpaper-veil absolute inset-0" />
    </div>
  );
}

export default function App() {
  const parts = useRoute();
  const [route, sub] = [parts[0] ?? '', parts[1]];
  const { day, onboarded } = usePrefs();

  // Heartbeats run whenever the pilgrim has a circle; the server ignores them while paused.
  const [hasCircle, setHasCircle] = useState(() => !!myCircle());
  useEffect(() => {
    const on = () => setHasCircle(!!myCircle());
    window.addEventListener('moallem:circle', on);
    return () => window.removeEventListener('moallem:circle', on);
  }, []);
  const dayRef = useRef(day);
  dayRef.current = day;
  useEffect(() => {
    if (!hasCircle || route === 'watch') return;
    return startHeartbeats(() => dayById(dayRef.current).id);
  }, [hasCircle, route === 'watch']);

  // Relatives opening a family link skip pilgrim onboarding.
  if (!onboarded && route !== 'watch') return <><Backdrop /><Onboarding /></>;

  if (route === 'watch') {
    return <Watch codeFromLink={sub && /^\d{6}$/.test(sub) ? sub : undefined} showPass={sub === 'pass'} />;
  }

  const screen = (() => {
    switch (route) {
      case 'steps': return <Steps />;
      case 'map': return <MapScreen initialKind={sub} />;
      case 'group': return <Group />;
      case 'tawaf': return <Counter key="tawaf" kind="tawaf" />;
      case 'sai': return <Counter key="sai" kind="sai" />;
      case 'arafah': return <Arafah />;
      case 'duas': return <Duas />;
      case 'ask': return <Ask />;
      case 'sos': return <Sos />;
      case 'permit': return <Permit />;
      case 'trip': return <Trip />;
      case 'family': return <Family />;
      case 'settings': return <Settings section={sub} />;
      default: return <Today />;
    }
  })();

  return (
    <>
      <Backdrop />
      <div key={route + (sub ?? '')}>{screen}</div>
      {route !== 'sos' && route !== 'map' && <BottomNav route={route} />}
    </>
  );
}
