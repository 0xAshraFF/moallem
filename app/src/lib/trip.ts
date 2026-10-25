// The pilgrim's ticket and the trip built from it. "Today" is the real date, or a demo date
// chosen in Settings so the app can be shown on any day of the Hajj journey.
import { useEffect, useMemo, useState } from 'react';
import { buildItinerary, dayOf, type Itinerary, type Ticket, type TripDay } from '../domain/itinerary';
import type { DayId } from '../domain/days';

const TICKET_KEY = 'moallem.ticket';
const DATE_KEY = 'moallem.demoDate';

export const DEMO_TICKET: Ticket = {
  pilgrimName: 'আব্দুল করিম',
  pnr: 'BG7K2Q',
  inbound: { flightNo: 'BG 3011', date: '2027-04-22', time: '06:30', from: 'DAC', to: 'MED' },
  outbound: { flightNo: 'BG 3022', date: '2027-05-28', time: '14:10', from: 'JED', to: 'DAC' },
};

export const readTicket = (): Ticket | null => { try { return JSON.parse(localStorage.getItem(TICKET_KEY) || 'null'); } catch { return null; } };
export function saveTicket(t: Ticket | null) {
  try { if (t) localStorage.setItem(TICKET_KEY, JSON.stringify(t)); else localStorage.removeItem(TICKET_KEY); } catch { /* ignore */ }
  window.dispatchEvent(new Event('moallem:trip'));
}
export const readDemoDate = () => { try { return localStorage.getItem(DATE_KEY); } catch { return null; } };
export function setDemoDate(d: string | null) {
  try { if (d) localStorage.setItem(DATE_KEY, d); else localStorage.removeItem(DATE_KEY); } catch { /* ignore */ }
  window.dispatchEvent(new Event('moallem:trip'));
}

export const todayYmd = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date());

/** Which ritual-step set (days.ts) fits a trip day. */
export function dayIdFor(d: TripDay | null): DayId | null {
  if (!d) return null;
  if (d.dhulHijjah === 8) return 'mina';
  if (d.dhulHijjah === 9) return 'arafah';
  if (d.dhulHijjah === 10) return 'eid';
  if (d.dhulHijjah && d.dhulHijjah >= 11 && d.dhulHijjah <= 13) return 'tashreeq';
  if (d.place === 'madinah') return 'madinah';
  if (d.kind === 'travel' || d.place === 'dhaka' || d.place === 'air' || d.place === 'jeddah') return 'travel';
  return 'umrah';
}

export function useTrip() {
  const [ticket, setTicket] = useState<Ticket | null>(readTicket);
  const [demoDate, setDemo] = useState<string | null>(readDemoDate);
  useEffect(() => {
    const on = () => { setTicket(readTicket()); setDemo(readDemoDate()); };
    window.addEventListener('moallem:trip', on);
    return () => window.removeEventListener('moallem:trip', on);
  }, []);
  const itinerary: Itinerary | null = useMemo(() => (ticket ? buildItinerary(ticket) : null), [ticket]);
  const today = demoDate ?? todayYmd();
  const day = itinerary ? dayOf(itinerary, today) : null;
  return { ticket, itinerary, today, day, dayId: dayIdFor(day), demoDate };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
