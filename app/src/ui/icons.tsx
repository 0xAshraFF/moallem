import {
  ArrowLeftRight, Ban, Bed, Beef, BookOpen, Clock, Droplets, Footprints, HandHeart, Luggage, MapPin, Mic, Moon,
  Mountain, Plane, QrCode, RotateCcw, Scissors, Shirt, Sunset, Tent, Users, type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { IconKey } from '../domain/days';

/** Kaaba: authored to match lucide's 24px grid and 1.75 stroke. */
export function KaabaIcon({ size = 24, strokeWidth = 1.75, ...rest }: LucideProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...(rest as object)}>
      <path d="M5 7.5 12 4l7 3.5v10L12 21l-7-3.5z" />
      <path d="M5 7.5 12 11l7-3.5" />
      <path d="M12 11v10" />
      <path d="M5 10.5 12 14l7-3.5" />
    </svg>
  );
}

/** Pebbles for Rami. */
export function PebblesIcon({ size = 24, strokeWidth = 1.75, ...rest }: LucideProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...(rest as object)}>
      <ellipse cx="7" cy="16" rx="3.5" ry="2.8" />
      <ellipse cx="16.5" cy="16.5" rx="3.2" ry="2.5" />
      <ellipse cx="12" cy="8.5" rx="3" ry="2.4" />
    </svg>
  );
}

export const ICONS: Record<IconKey, ComponentType<LucideProps>> = {
  plane: Plane, shirt: Shirt, mic: Mic, tawaf: RotateCcw, sai: ArrowLeftRight, scissors: Scissors, tent: Tent,
  droplets: Droplets, mountain: Mountain, hands: HandHeart, sunset: Sunset, moon: Moon, stones: PebblesIcon,
  beef: Beef, kaaba: KaabaIcon, qr: QrCode, luggage: Luggage, book: BookOpen, mapPin: MapPin, family: Users,
  ban: Ban, bed: Bed, clock: Clock, footprints: Footprints,
};
