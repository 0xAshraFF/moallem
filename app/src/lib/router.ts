import { useEffect, useState } from 'react';

/** Hash routes keep the PWA working from any static host and offline. */
export function useRoute(): string[] {
  const read = () => (window.location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
  const [parts, setParts] = useState(read);
  useEffect(() => {
    const on = () => {
      setParts(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parts;
}

export const go = (path: string) => {
  window.location.hash = path.startsWith('/') ? path : `/${path}`;
};

export const back = () => {
  if (window.history.length > 1) window.history.back();
  else go('/');
};
