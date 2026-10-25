import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { useEffect, useRef } from 'react';
import { Accessibility, Bus, Coffee, Cross, DoorOpen, Droplets, GlassWater, Hotel, Pill, Toilet, TrainFront, Utensils } from 'lucide-react';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import { KaabaIcon } from '../ui/icons';
import type { DestKind } from '../domain/pois';

export interface MapMarker { id: string; kind: DestKind; lat: number; lng: number; label: string; selected?: boolean }

const KIND_ICON: Record<DestKind, ComponentType<LucideProps>> = {
  gate: DoorOpen, toilet: Toilet, wudu: Droplets, water: GlassWater, tea: Coffee, food: Utensils, clinic: Cross, pharmacy: Pill,
  station: TrainFront, bus: Bus, hotel: Hotel, haram: KaabaIcon,
};
export const KIND_ICONS = KIND_ICON;
void Accessibility;

function css(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function markerIcon(m: MapMarker) {
  const Icon = KIND_ICON[m.kind];
  const primary = css('--primary', '#1E5B3F');
  const big = m.selected || m.kind === 'hotel' || m.kind === 'haram';
  const size = big ? 46 : 34;
  const bg = m.selected ? primary : m.kind === 'hotel' ? css('--brass', '#7A5B12') : 'var(--surface)';
  const fg = m.selected || m.kind === 'hotel' ? 'var(--on-primary)' : primary;
  const svg = renderToStaticMarkup(<Icon size={big ? 24 : 18} strokeWidth={2.2} color="currentColor" />);
  const label = big ? `<div style="position:absolute;top:${size + 2}px;left:50%;transform:translateX(-50%);white-space:nowrap;font:700 13px 'Noto Sans Bengali',sans-serif;color:var(--ink);background:var(--surface);padding:1px 8px;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,.18)">${m.label}</div>` : '';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${size}px;height:${size}px;border-radius:999px;background:${bg};color:${fg};display:grid;place-items:center;border:2px solid ${m.selected ? 'var(--surface)' : primary};box-shadow:0 3px 10px rgba(0,0,0,.25)">${svg}${label}</div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}

function meIcon(heading: number | null) {
  const primary = css('--primary', '#1E5B3F');
  const cone = heading === null ? '' :
    `<svg width="90" height="90" viewBox="0 0 90 90" style="position:absolute;left:-30px;top:-30px;transform:rotate(${heading}deg)"><path d="M45 45 L28 4 A44 44 0 0 1 62 4 Z" fill="${primary}" opacity=".28"/></svg>`;
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:30px;height:30px">${cone}<div style="position:absolute;inset:0;border-radius:999px;background:${primary};border:4px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35)"></div></div>`,
    iconSize: [30, 30], iconAnchor: [15, 15],
  });
}

export default function GuideMap({ me, heading, markers, route, follow, onPick, className = '' }: {
  me: { lat: number; lng: number } | null; heading: number | null; markers: MapMarker[];
  route: Array<[number, number]> | null; follow: boolean; onPick: (id: string) => void; className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<{ markers?: L.LayerGroup; me?: L.Marker; route?: L.Polyline; routeCasing?: L.Polyline; fitted?: string }>({});

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { zoomControl: false, attributionControl: true }).setView(me ? [me.lat, me.lng] : [21.4225, 39.8262], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map.current);
    layer.current.markers = L.layerGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; layer.current = {}; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const g = layer.current.markers;
    if (!g) return;
    g.clearLayers();
    markers.forEach((m) => L.marker([m.lat, m.lng], { icon: markerIcon(m), zIndexOffset: m.selected ? 900 : m.kind === 'hotel' ? 500 : 0 })
      .on('click', () => onPick(m.id)).addTo(g));
  }, [markers, onPick]);

  useEffect(() => {
    const m = map.current;
    if (!m || !me) return;
    if (!layer.current.me) layer.current.me = L.marker([me.lat, me.lng], { icon: meIcon(heading), zIndexOffset: 1000, keyboard: false }).addTo(m);
    else layer.current.me.setLatLng([me.lat, me.lng]).setIcon(meIcon(heading));
    if (follow) {
      if (m.getZoom() < 18) m.setView([me.lat, me.lng], 18, { animate: true });
      else m.panTo([me.lat, me.lng], { animate: true, duration: 0.25 });
    }
  }, [me?.lat, me?.lng, heading, follow]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    layer.current.route?.remove();
    layer.current.routeCasing?.remove();
    if (!route || route.length < 2) return;
    const primary = css('--primary', '#1E5B3F');
    layer.current.routeCasing = L.polyline(route, { color: '#ffffff', weight: 11, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }).addTo(m);
    layer.current.route = L.polyline(route, { color: primary, weight: 7, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(m);
    const key = `${route[0]}|${route[route.length - 1]}`;
    if (layer.current.fitted !== key && !follow) {
      m.fitBounds(L.latLngBounds(route).pad(0.25), { maxZoom: 18, paddingBottomRight: [0, 220] });
      layer.current.fitted = key;
    }
  }, [route, follow]);

  return <div ref={el} className={`calm-tiles ${className}`} />;
}
