// Where is the pilgrim, and which way are they facing? Everything location-aware reads this.
// Live GPS + compass when allowed; a demo position (Settings → Demo place, or the guidance
// walker) so the app can be shown anywhere.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { distanceM, resolveSite, SITES, type Site, type SiteId } from '../domain/geo';

export interface Position { lat: number; lng: number; accuracy: number; ts: number }
export interface Hotel { name: string; lat: number; lng: number; city: 'makkah' | 'madinah' }
export type PlaceId = SiteId | 'hotel';

export interface Place {
  id: PlaceId;
  nameBn: string;
  nameEn: string;
  photo: string;
  photoNight?: string;
  site: Site | null;
}

const DEMO_KEY = 'moallem.demoPlace';
const HOTEL_KEY = 'moallem.hotels';

// Demo hotels: real streets a short walk from each Haram, as a typical BD package would be.
export const DEMO_HOTELS: Hotel[] = [
  { name: 'হোটেল · ইব্রাহিম খলিল রোড', lat: 21.4169, lng: 39.8236, city: 'makkah' },
  { name: 'হোটেল · মারকাজিয়া দক্ষিণ', lat: 24.4646, lng: 39.6094, city: 'madinah' },
];

function read<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}

export function placeFor(pos: Position | null, hotels: Hotel[]): Place {
  if (!pos) {
    const s = SITES[0];
    return { id: s.id, nameBn: s.nameBn, nameEn: s.nameEn, photo: s.photo, photoNight: s.photoNight, site: s };
  }
  const hotel = hotels.find((h) => distanceM(pos.lat, pos.lng, h.lat, h.lng) < 120);
  const r = resolveSite(pos.lat, pos.lng);
  if (hotel) {
    const city = SITES.find((s) => s.id === hotel.city)!;
    return { id: 'hotel', nameBn: 'আপনার হোটেল', nameEn: 'Your hotel', photo: hotel.city === 'makkah' ? 'hotel-makkah' : 'madinah-umbrellas', site: city };
  }
  if (!r.site) return { id: 'elsewhere', nameBn: 'পথে', nameEn: 'On the way', photo: 'haram-aerial', site: null };
  return { id: r.site.id, nameBn: r.site.nameBn, nameEn: r.site.nameEn, photo: r.site.photo, photoNight: r.site.photoNight, site: r.site };
}

interface Ctx {
  pos: Position | null;
  heading: number | null; // compass degrees, null if the phone has no compass
  source: 'gps' | 'demo' | 'none';
  place: Place;
  hotels: Hotel[];
  setHotel: (h: Hotel) => void;
  /** Demo: jump to a site or exact point; null returns to live GPS. */
  setDemo: (p: { lat: number; lng: number } | null) => void;
  requestLive: () => void;
  gpsError: string | null;
}

const LocationContext = createContext<Ctx | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [demo, setDemoState] = useState<{ lat: number; lng: number } | null>(() => read(DEMO_KEY, { lat: 21.4219, lng: 39.8268 }));
  const [live, setLive] = useState<Position | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>(() => read(HOTEL_KEY, DEMO_HOTELS));
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const requestLive = useCallback(() => {
    if (!navigator.geolocation || watchId.current !== null) return;
    watchId.current = navigator.geolocation.watchPosition(
      (p) => { setLive({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, ts: Date.now() }); setGpsError(null); },
      (e) => setGpsError(e.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  }, []);

  useEffect(() => {
    if (!demo) requestLive();
    return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); watchId.current = null; };
  }, [demo, requestLive]);

  // Compass. iOS gives webkitCompassHeading; Android gives absolute alpha (counter-clockwise).
  useEffect(() => {
    const on = (e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
      if (typeof e.webkitCompassHeading === 'number') setHeading(e.webkitCompassHeading);
      else if (e.absolute && typeof e.alpha === 'number') setHeading((360 - e.alpha) % 360);
    };
    const evt = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(evt, on as EventListener);
    return () => window.removeEventListener(evt, on as EventListener);
  }, []);

  const setDemo = useCallback((p: { lat: number; lng: number } | null) => {
    setDemoState(p);
    try { if (p) localStorage.setItem(DEMO_KEY, JSON.stringify(p)); else localStorage.removeItem(DEMO_KEY); } catch { /* ignore */ }
  }, []);

  const setHotel = useCallback((h: Hotel) => {
    setHotels((list) => {
      const next = [...list.filter((x) => x.city !== h.city), h];
      try { localStorage.setItem(HOTEL_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Demo/recording hook: lets the product video and QA move the pilgrim without GPS.
  useEffect(() => { (window as unknown as { __moallem?: object }).__moallem = { setDemo }; }, [setDemo]);

  const pos: Position | null = demo ? { ...demo, accuracy: 8, ts: Date.now() } : live;
  const place = useMemo(() => placeFor(pos, hotels), [pos?.lat, pos?.lng, hotels]); // eslint-disable-line react-hooks/exhaustive-deps

  const value: Ctx = { pos, heading, source: demo ? 'demo' : live ? 'gps' : 'none', place, hotels, setHotel, setDemo, requestLive, gpsError };
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation outside LocationProvider');
  return ctx;
}
