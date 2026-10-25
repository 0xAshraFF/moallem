import { PLACE_PHOTO } from '../screens/Trip';
import { useLocation } from './location';
import { usePrefs } from './prefs';
import { useTrip } from './trip';

/** Wallpaper for where the pilgrim is: live GPS first, else where the itinerary says they are today. */
export function usePlacePhoto(): string {
  const { place, source } = useLocation();
  const { resolvedTheme } = usePrefs();
  const { day } = useTrip();
  if (source === 'none' && day) return PLACE_PHOTO[day.place];
  return resolvedTheme === 'dark' && place.photoNight ? place.photoNight : place.photo;
}
