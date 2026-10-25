import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';

export interface MapPoint { lat: number; lng: number; accuracy?: number }

/** Leaflet + OpenStreetMap tiles (no API key). Production moves to MapLibre + own tiles. */
export default function LiveMap({ trail, initial, className = '', interactive = true }: {
  trail: MapPoint[]; initial: string; className?: string; interactive?: boolean;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layers = useRef<{ line?: L.Polyline; pin?: L.Marker; acc?: L.Circle; fitted?: boolean }>({});

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, {
      zoomControl: false, attributionControl: true, dragging: interactive, scrollWheelZoom: interactive,
      doubleClickZoom: interactive, touchZoom: interactive, keyboard: interactive,
    }).setView([21.39, 39.93], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '© OpenStreetMap',
    }).addTo(map.current);
    return () => { map.current?.remove(); map.current = null; layers.current = {}; };
  }, [interactive]);

  useEffect(() => {
    const m = map.current;
    if (!m || trail.length === 0) return;
    const pts = trail.map((p) => [p.lat, p.lng] as [number, number]);
    const last = trail[trail.length - 1];
    const css = getComputedStyle(document.documentElement);
    const primary = css.getPropertyValue('--primary').trim() || '#1E5B3F';

    if (!layers.current.line) layers.current.line = L.polyline(pts, { color: primary, weight: 5, opacity: 0.75, lineCap: 'round' }).addTo(m);
    else layers.current.line.setLatLngs(pts);

    if (!layers.current.acc) layers.current.acc = L.circle([last.lat, last.lng], { radius: last.accuracy ?? 30, color: primary, weight: 0, fillOpacity: 0.12 }).addTo(m);
    else layers.current.acc.setLatLng([last.lat, last.lng]).setRadius(last.accuracy ?? 30);

    const icon = L.divIcon({
      className: '',
      html: `<div style="width:48px;height:48px;border-radius:999px;background:var(--surface);border:3px solid ${primary};display:grid;place-items:center;font:700 20px 'Noto Sans Bengali',sans-serif;color:var(--ink);box-shadow:0 4px 14px rgba(0,0,0,.25)">${initial}</div>`,
      iconSize: [48, 48], iconAnchor: [24, 24],
    });
    if (!layers.current.pin) layers.current.pin = L.marker([last.lat, last.lng], { icon, keyboard: false }).addTo(m);
    else layers.current.pin.setLatLng([last.lat, last.lng]);

    if (!layers.current.fitted) {
      m.fitBounds(L.latLngBounds(pts).pad(0.35), { maxZoom: 14 });
      layers.current.fitted = true;
    } else if (!m.getBounds().pad(-0.2).contains([last.lat, last.lng])) {
      m.panTo([last.lat, last.lng], { animate: true });
    }
  }, [trail, initial]);

  return <div ref={el} className={`calm-tiles ${className}`} role="img" aria-label="Map" />;
}
