// Next prayer and live heat for where the pilgrim is.
import { useEffect, useState } from 'react';
import { heatLevel, nextPrayer, prayerTimes, type HeatLevel, type PrayerId, type PrayerTimes } from '../domain/prayerTimes';
import { makkahSeconds } from './clock';
import { useLocation } from './location';
import { useTrip } from './trip';

const MAKKAH = { lat: 21.4225, lng: 39.8262 };

export function usePrayer(): { times: PrayerTimes; next: { id: PrayerId; at: number; inMin: number } } {
  const { pos } = useLocation();
  const { today } = useTrip();
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(id); }, []);
  const p = pos && Math.abs(pos.lat - 23) > 0 && pos.lng < 60 ? pos : MAKKAH; // in Bangladesh, show Makkah times
  const times = prayerTimes(today, p.lat, p.lng, 3);
  return { times, next: nextPrayer(times, Math.floor(makkahSeconds() / 60)) };
}

export interface Weather { temp: number; feels: number; level: HeatLevel }
const cache: { key: string; at: number; w: Weather } = { key: '', at: 0, w: { temp: 0, feels: 0, level: 'ok' } };

/** Live temperature from Open-Meteo (free, no key). Null when offline. */
export function useWeather(): Weather | null {
  const { pos } = useLocation();
  const p = pos ?? MAKKAH;
  const key = `${p.lat.toFixed(2)},${p.lng.toFixed(2)}`;
  const [w, setW] = useState<Weather | null>(cache.key === key ? cache.w : null);
  useEffect(() => {
    if (cache.key === key && Date.now() - cache.at < 15 * 60000) { setW(cache.w); return; }
    let alive = true;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lng}&current=temperature_2m,apparent_temperature`)
      .then((r) => r.json())
      .then((j) => {
        const temp = Math.round(j.current.temperature_2m);
        const feels = Math.round(j.current.apparent_temperature);
        const next = { temp, feels, level: heatLevel(feels) };
        Object.assign(cache, { key, at: Date.now(), w: next });
        if (alive) setW(next);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return w;
}
