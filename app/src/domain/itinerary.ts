// Trip engine: one photographed ticket (inbound + outbound flight) + the fixed Hajj calendar
// => the pilgrim's whole trip, day by day, plus answers to what a Moallem is asked all day.
//
// Pure, offline, never throws. Bad input comes back as `errors` on the itinerary.
// Exact bus / wake-up times are NOT guessed here: they come from the Moallem's announcements
// (separate feature) and are attached through the `announcements` hook.
//
// ---------------------------------------------------------------------------------------------
// SOURCES (checked Oct 2026)
// - Hajj 1448 dates: Umm al-Qura calendar puts 1 Dhul Hijjah 1448 on 2027-05-07, so
//   8 Tarwiyah = Fri 2027-05-14, 9 Arafah = Sat 2027-05-15, 10 Eid = Sun 2027-05-16.
//   Verified with ICU's `islamic-umalqura` calendar (Node Intl) and published listings:
//   https://blog.wego.com/day-of-arafah-pakistan/ (Arafah 15 May 2027, may move to 16 May)
//   https://www.calendarlabs.com/holidays/islam/waqf-al-arafa-hajj.php (Arafah 15 May 2027)
//   Bangladesh MoRA roadmap, Bangla Tribune 7 Jun 2026: "Hajj 15 May 2027 (9 Zilhajj), subject
//   to moon sighting", first Hajj flight 8 Apr 2027:
//   https://www.banglatribune.com/others/950606/
//   Saudi Arabia may confirm a day later after moon sighting: use `shiftCalendar(HAJJ_1448, 1)`.
// - 1447 (2026) season pattern used for ESTIMATES only: first flight 18 Apr 2026, last inbound
//   arrival 21 May, Arafah 26 May, return flights 30 May to 1 Jul 2026.
//   https://bangla.thedailystar.net/news/bangladesh/news-731011
//   https://bdnews24.com/bangladesh/b25eb811a698  https://en.ittefaq.com.bd/16751/hajj-ends-homeward-flights-begin
// - 2027 government package: expected stay in Saudi Arabia 35 to 40 days.
//   https://www.dhakatribune.com/bangladesh/415643/govt-announces-2027-hajj-packages-cuts-airfare-by
// - Ihram rule by landing city (Jeddah: Ihram from Dhaka; Madinah: normal clothes, Ihram later at
//   Dhul Hulayfah) matches the existing app copy in days.ts / hajjLogic.ts.
//
// NOT VERIFIED (named, overridable defaults; nothing official found):
// - DEFAULT_MADINAH_DAYS = 8: the widely followed "40 prayers in Masjid an-Nabawi" custom
//   (8 days x 5 prayers). Agencies vary; pass `madinahDays`.
// - DEFAULT_NAFR = 'early': most groups leave Mina on 12 Dhul Hijjah. Pass `nafr: 'late'` for 13th.
// - Madinah-first pilgrims (landing MED) visit Madinah before Hajj and usually fly home from JED;
//   Jeddah-first pilgrims do Makkah, Hajj, then Madinah and usually fly home from MED. When both
//   flights use JED we put Madinah after Hajj, right before the flight (bus to Jeddah airport).
// - Flight durations used to guess landing dates when the ticket has no arrival date.
// ---------------------------------------------------------------------------------------------

export type Place = 'makkah' | 'madinah' | 'mina' | 'arafah' | 'muzdalifah' | 'jamarat' | 'jeddah' | 'dhaka' | 'air';
export type SegmentKind = 'travel' | 'makkah' | 'madinah' | 'mina' | 'arafah' | 'muzdalifah' | 'jamarat' | 'return';

export interface Flight {
  flightNo: string;
  date: string; // YYYY-MM-DD, local departure date
  time?: string; // HH:MM local departure time
  from: string; // IATA
  to: string; // IATA
  /** Local arrival date if the ticket prints it. Otherwise estimated from `time`. */
  arrDate?: string;
}

export interface Ticket {
  pilgrimName?: string;
  pnr?: string;
  inbound: Flight; // Bangladesh -> Saudi Arabia
  outbound: Flight; // Saudi Arabia -> Bangladesh
}

export interface HajjCalendar {
  hijriYear: number;
  /** Gregorian date of 1 Dhul Hijjah per the Saudi Umm al-Qura calendar. */
  dhulHijjah1: string;
  dhulHijjahDays: 29 | 30;
  note: string;
}

/** Hajj 1448 AH (2027). Umm al-Qura; Saudi moon sighting may move it +1 day. */
export const HAJJ_1448: HajjCalendar = {
  hijriYear: 1448,
  dhulHijjah1: '2027-05-07', // => 8th 2027-05-14, 9th (Arafah) 2027-05-15, 10th (Eid) 2027-05-16
  dhulHijjahDays: 30, // Umm al-Qura: 30 Dhul Hijjah 1448 = 2027-06-05
  note: 'Umm al-Qura; MoRA roadmap says Hajj 15 May 2027 subject to moon sighting',
};

/** Shift a calendar when Saudi Arabia announces a different moon sighting (e.g. +1). */
export function shiftCalendar(cal: HajjCalendar, days: number): HajjCalendar {
  const d = parseYmd(cal.dhulHijjah1);
  return { ...cal, dhulHijjah1: d === null ? cal.dhulHijjah1 : fmtYmd(d + days), note: `${cal.note}; shifted ${days} day(s)` };
}

/** Bangladesh 1448 season. firstInboundFlight is announced; the rest are ESTIMATES from 1447. */
export const BD_HAJJ_SEASON_1448 = {
  hijriYear: 1448,
  firstInboundFlight: '2027-04-08', // MoRA roadmap (Bangla Tribune, 7 Jun 2026)
  lastInboundFlightEstimate: '2027-05-10', // 1447: last arrival = Arafah - 5
  returnFlightsStartEstimate: '2027-05-19', // 1447: first return = Arafah + 4
  returnFlightsEndEstimate: '2027-06-20', // 1447: last return = Arafah + 36
  stayDaysRange: [35, 40] as [number, number], // 2027 govt package
};

export const DEFAULT_MADINAH_DAYS = 8; // unverified custom, see header
export const DEFAULT_NAFR: 'early' | 'late' = 'early';
export const DEFAULT_LUGGAGE_DAYS_BEFORE_RETURN = 1; // pack the evening before; agencies may collect earlier
/** Days in Makkah for Umrah before a Jeddah-first pilgrim could go to Madinah pre-Hajj. */
export const MAKKAH_FIRST_DAYS = 3;
// Departure-time + this many minutes >= 24h means landing the next local date.
const INBOUND_SHIFT_MIN = 4 * 60; // ~7h flight, KSA is 3h behind Bangladesh
const OUTBOUND_SHIFT_MIN = 9 * 60 + 30; // ~6.5h flight, Bangladesh is 3h ahead

export interface Announcement {
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  kind: 'bus' | 'wakeup' | 'meeting' | 'other';
  textBn: string;
  textEn: string;
}

export interface ItineraryOptions {
  calendar?: HajjCalendar;
  madinahDays?: number;
  madinahPlacement?: 'auto' | 'before' | 'after' | 'none';
  nafr?: 'early' | 'late';
  luggageDaysBefore?: number;
  announcements?: Announcement[];
}

export interface ItineraryIssue {
  code: string;
  field?: string;
  messageBn: string;
  messageEn: string;
}

export interface Segment {
  kind: SegmentKind;
  place: Place;
  start: string;
  end: string; // inclusive
  titleBn: string;
  titleEn: string;
}

export interface Task {
  bn: string;
  en: string;
}

export interface TripDay {
  date: string;
  /** Where the pilgrim is during the day (drives the background photo). */
  place: Place;
  /** Where the pilgrim sleeps that night. */
  night: Place;
  kind: SegmentKind;
  dhulHijjah?: number;
  hijriBn?: string;
  hijriEn?: string;
  tasks: Task[]; // 1-3
  announcements: Announcement[];
}

export interface MadinahPlan {
  start: string; // first night in Madinah
  end: string; // last night in Madinah
  leave: string; // day the pilgrim leaves Madinah
  days: number;
  placement: 'before' | 'after';
  shortened: boolean;
}

export interface Itinerary {
  ok: boolean;
  errors: ItineraryIssue[];
  warnings: ItineraryIssue[];
  ticket: Ticket;
  calendar: HajjCalendar;
  pattern: 'jeddah_first' | 'madinah_first' | null;
  landing: 'JED' | 'MED' | null;
  departureAirport: 'JED' | 'MED' | null;
  arrivalDate: string | null;
  outboundDate: string | null;
  homeDate: string | null;
  hajj: { tarwiyah: string; arafah: string; eid: string; lastMinaDay: string };
  madinah: MadinahPlan | null;
  luggageDaysBefore: number;
  segments: Segment[];
  days: TripDay[];
}

// ---------------------------------------------------------------- dates & digits

const DAY_MS = 86_400_000;

/** 'YYYY-MM-DD' -> day number (days since 1970-01-01 UTC), or null if not a real date. */
export function parseYmd(s: unknown): number | null {
  if (typeof s !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return Math.round(t / DAY_MS);
}

export function fmtYmd(n: number): string {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). NaN if either is invalid. */
export function daysUntil(from: string, to: string): number {
  const a = parseYmd(from);
  const b = parseYmd(to);
  return a === null || b === null ? NaN : b - a;
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export function toBnDigits(v: number | string): string {
  return String(v).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

const MONTHS_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "শুক্রবার, ১৪ মে" */
export function dateBn(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  return `${WEEKDAYS_BN[d.getUTCDay()]}, ${toBnDigits(d.getUTCDate())} ${MONTHS_BN[d.getUTCMonth()]}`;
}
/** "Fri 14 May" */
export function dateEn(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  return `${WEEKDAYS_EN[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_EN[d.getUTCMonth()]}`;
}

function parseHm(s: unknown): number | null {
  if (typeof s !== 'string') return null;
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(s.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

// ---------------------------------------------------------------- labels

export const PLACE_BN: Record<Place, string> = {
  makkah: 'মক্কা', madinah: 'মদিনা', mina: 'মিনা', arafah: 'আরাফা', muzdalifah: 'মুজদালিফা',
  jamarat: 'জামারাত', jeddah: 'জেদ্দা', dhaka: 'ঢাকা', air: 'বিমান',
};
const PLACE_BN_AT: Record<Place, string> = {
  makkah: 'মক্কায়', madinah: 'মদিনায়', mina: 'মিনায়', arafah: 'আরাফায়', muzdalifah: 'মুজদালিফায়',
  jamarat: 'জামারাতে', jeddah: 'জেদ্দায়', dhaka: 'দেশে', air: 'বিমানে',
};
export const PLACE_EN: Record<Place, string> = {
  makkah: 'Makkah', madinah: 'Madinah', mina: 'Mina', arafah: 'Arafah', muzdalifah: 'Muzdalifah',
  jamarat: 'Jamarat', jeddah: 'Jeddah', dhaka: 'Bangladesh', air: 'the plane',
};

function hijriLabel(day: number): { bn: string; en: string } {
  const special: Record<number, [string, string]> = {
    8: ['তারবিয়ার দিন', 'Day of Tarwiyah'],
    9: ['আরাফার দিন', 'Day of Arafah'],
    10: ['ঈদুল আযহা', 'Eid al-Adha'],
    11: ['তাশরিকের দিন', 'Day of Tashreeq'],
    12: ['তাশরিকের দিন', 'Day of Tashreeq'],
    13: ['তাশরিকের দিন', 'Day of Tashreeq'],
  };
  const base = { bn: `${toBnDigits(day)} জিলহজ`, en: `${day} Dhul Hijjah` };
  const s = special[day];
  return s ? { bn: `${base.bn} · ${s[0]}`, en: `${base.en} · ${s[1]}` } : base;
}

function issue(code: string, messageBn: string, messageEn: string, field?: string): ItineraryIssue {
  return field ? { code, field, messageBn, messageEn } : { code, messageBn, messageEn };
}

function normAirport(code: unknown): 'JED' | 'MED' | null {
  const c = typeof code === 'string' ? code.trim().toUpperCase() : '';
  if (c === 'JED' || c === 'TIF') return 'JED'; // Taif lands on the Makkah side
  if (c === 'MED') return 'MED';
  return null;
}

// ---------------------------------------------------------------- build

interface Stay {
  kind: SegmentKind;
  place: Place;
  start: number;
  end: number;
}

export function buildItinerary(ticket: Ticket, opts: ItineraryOptions = {}): Itinerary {
  const cal = opts.calendar ?? HAJJ_1448;
  const nafr = opts.nafr ?? DEFAULT_NAFR;
  const wantMadinah = Math.max(0, Math.floor(opts.madinahDays ?? DEFAULT_MADINAH_DAYS));
  const luggageDaysBefore = Math.max(0, Math.floor(opts.luggageDaysBefore ?? DEFAULT_LUGGAGE_DAYS_BEFORE_RETURN));
  const errors: ItineraryIssue[] = [];
  const warnings: ItineraryIssue[] = [];

  const dh1 = parseYmd(cal.dhulHijjah1) ?? parseYmd(HAJJ_1448.dhulHijjah1)!;
  if (parseYmd(cal.dhulHijjah1) === null) {
    errors.push(issue('invalid_calendar', 'হজের ক্যালেন্ডারের তারিখ ঠিক নেই।', 'Hajj calendar date is invalid.', 'calendar'));
  }
  const dh = (n: number) => dh1 + n - 1;
  const lastMina = nafr === 'late' ? dh(13) : dh(12);
  const hajj = { tarwiyah: fmtYmd(dh(8)), arafah: fmtYmd(dh(9)), eid: fmtYmd(dh(10)), lastMinaDay: fmtYmd(lastMina) };

  const empty = (): Itinerary => ({
    ok: false, errors, warnings, ticket, calendar: cal, pattern: null, landing: null, departureAirport: null,
    arrivalDate: null, outboundDate: null, homeDate: null, hajj, madinah: null, luggageDaysBefore, segments: [], days: [],
  });

  const inF = ticket?.inbound;
  const outF = ticket?.outbound;
  if (!inF) errors.push(issue('missing_flight', 'যাওয়ার ফ্লাইটের তথ্য নেই।', 'Inbound flight is missing.', 'inbound'));
  if (!outF) errors.push(issue('missing_flight', 'ফেরার ফ্লাইটের তথ্য নেই।', 'Return flight is missing.', 'outbound'));
  if (!inF || !outF) return empty();

  const inDep = parseYmd(inF.date);
  const outDep = parseYmd(outF.date);
  if (inDep === null) errors.push(issue('invalid_date', 'যাওয়ার ফ্লাইটের তারিখ পড়া যায়নি।', 'Inbound flight date is invalid.', 'inbound.date'));
  if (outDep === null) errors.push(issue('invalid_date', 'ফেরার ফ্লাইটের তারিখ পড়া যায়নি।', 'Return flight date is invalid.', 'outbound.date'));
  for (const [f, name] of [[inF, 'inbound'], [outF, 'outbound']] as const) {
    if (f.time !== undefined && f.time !== '' && parseHm(f.time) === null) {
      warnings.push(issue('invalid_time', 'ফ্লাইটের সময় পড়া যায়নি, শুধু তারিখ ধরা হলো।', 'Flight time unreadable; using the date only.', `${name}.time`));
    }
    if (f.arrDate !== undefined && parseYmd(f.arrDate) === null) {
      warnings.push(issue('invalid_date', 'নামার তারিখ পড়া যায়নি, আনুমানিক ধরা হলো।', 'Arrival date unreadable; estimated instead.', `${name}.arrDate`));
    }
  }
  if (inDep === null || outDep === null || errors.length) return empty();

  let landing = normAirport(inF.to);
  if (!landing) {
    warnings.push(issue('unknown_airport', 'নামার বিমানবন্দর চেনা যায়নি, জেদ্দা ধরা হলো।', 'Landing airport not recognised; assuming Jeddah.', 'inbound.to'));
    landing = 'JED';
  }
  let depAirport = normAirport(outF.from);
  if (!depAirport) {
    warnings.push(issue('unknown_airport', 'ফেরার বিমানবন্দর চেনা যায়নি, জেদ্দা ধরা হলো।', 'Departure airport not recognised; assuming Jeddah.', 'outbound.from'));
    depAirport = 'JED';
  }

  const landed = (f: Flight, dep: number, shift: number) => {
    const given = parseYmd(f.arrDate);
    if (given !== null && given >= dep && given <= dep + 1) return given;
    const t = parseHm(f.time);
    return t !== null && t + shift >= 24 * 60 ? dep + 1 : dep;
  };
  const arrival = landed(inF, inDep, INBOUND_SHIFT_MIN);
  const home = landed(outF, outDep, OUTBOUND_SHIFT_MIN);

  if (outDep < inDep) {
    errors.push(issue('outbound_before_inbound', 'ফেরার তারিখ যাওয়ার তারিখের আগে পড়েছে।', 'Return flight is before the inbound flight.', 'outbound.date'));
  }
  if (arrival < dh(1) - 75 || outDep > dh(13) + 75) {
    errors.push(issue('not_this_hajj_season', `টিকিটের তারিখ ${toBnDigits(cal.hijriYear)} হিজরির হজের সাথে মিলছে না।`, `Ticket dates do not match Hajj ${cal.hijriYear}.`));
  }
  if (!errors.length && arrival > dh(8)) {
    errors.push(issue('arrives_after_hajj', 'আপনার ফ্লাইট হজ শুরুর পরে পৌঁছায়। টিকিট আবার দেখুন।', 'Your flight lands after Hajj has begun. Please check the ticket.', 'inbound.date'));
  }
  if (!errors.length && outDep <= lastMina) {
    errors.push(issue('departs_before_hajj_ends', 'ফেরার ফ্লাইট হজ শেষ হওয়ার আগে। টিকিট আবার দেখুন।', 'Return flight is before Hajj ends. Please check the ticket.', 'outbound.date'));
  }
  if (errors.length) return empty();

  if (arrival === dh(8)) {
    warnings.push(issue('arrives_on_tarwiyah', 'আপনি ৮ জিলহজ পৌঁছাবেন, সরাসরি মিনায় যেতে হতে পারে।', 'You land on 8 Dhul Hijjah and may go straight to Mina.'));
  } else if (arrival >= dh(4)) { // 1447: the last inbound flight landed on 4 Dhul Hijjah
    warnings.push(issue('arrives_close_to_hajj', 'আপনি হজের খুব কাছাকাছি সময়ে পৌঁছাবেন।', 'You land very close to Hajj.'));
  }
  const season = BD_HAJJ_SEASON_1448;
  if (season.hijriYear === cal.hijriYear && inDep < parseYmd(season.firstInboundFlight)!) {
    warnings.push(issue('before_first_flight', 'এই তারিখ ঘোষিত প্রথম হজ ফ্লাইটের আগে।', 'This date is before the announced first Hajj flight.', 'inbound.date'));
  }

  // --- Madinah placement
  const preRoom = dh(7) - arrival; // nights available in Madinah if leaving for Makkah by the 7th
  const postStart = lastMina + 1;
  const postRoom = outDep - postStart; // nights available between Mina and the flight
  let placement = opts.madinahPlacement ?? 'auto';
  const auto = placement === 'auto';
  if (placement === 'auto') {
    if (landing === 'MED') placement = 'before';
    else if (depAirport === 'MED' || postRoom >= wantMadinah) placement = 'after';
    else if (preRoom - MAKKAH_FIRST_DAYS >= wantMadinah) placement = 'before';
    else placement = postRoom > 0 ? 'after' : 'none';
  }

  const stays: Stay[] = [];
  let madinah: MadinahPlan | null = null;
  const lead = landing === 'JED' ? MAKKAH_FIRST_DAYS : 0;
  const preFits = Math.min(wantMadinah, preRoom - lead);
  if (placement === 'before' && wantMadinah > 0 && (preFits < 1 || (auto && preFits < wantMadinah && postRoom >= wantMadinah))) {
    // too close to Hajj for a (full) pre-Hajj visit: Madinah after Hajj instead
    placement = postRoom > 0 ? 'after' : 'none';
    if (placement === 'after') {
      warnings.push(issue('madinah_moved_after', 'হজের আগে সময় কম, তাই মদিনা হজের পরে ধরা হলো।', 'Too little time before Hajj, so Madinah is planned after Hajj.'));
    }
  }

  if (placement === 'before' && wantMadinah > 0) {
    const n = Math.min(wantMadinah, preRoom - lead);
    const mStart = arrival + lead;
    if (lead > 0) stays.push({ kind: 'makkah', place: 'makkah', start: arrival, end: mStart - 1 });
    stays.push({ kind: 'madinah', place: 'madinah', start: mStart, end: mStart + n - 1 });
    if (mStart + n <= dh(7)) stays.push({ kind: 'makkah', place: 'makkah', start: mStart + n, end: dh(7) });
    madinah = { start: fmtYmd(mStart), end: fmtYmd(mStart + n - 1), leave: fmtYmd(mStart + n), days: n, placement: 'before', shortened: n < wantMadinah };
  } else if (arrival <= dh(7)) {
    stays.push({ kind: 'makkah', place: 'makkah', start: arrival, end: dh(7) });
  }

  stays.push({ kind: 'mina', place: 'mina', start: dh(8), end: dh(8) });
  stays.push({ kind: 'arafah', place: 'arafah', start: dh(9), end: dh(9) });
  stays.push({ kind: 'jamarat', place: 'jamarat', start: dh(10), end: dh(10) });
  stays.push({ kind: 'mina', place: 'mina', start: dh(11), end: lastMina });

  if (placement === 'after' && wantMadinah > 0 && postRoom > 0) {
    const n = Math.min(wantMadinah, postRoom);
    const mStart = outDep - n;
    if (mStart > postStart) stays.push({ kind: 'makkah', place: 'makkah', start: postStart, end: mStart - 1 });
    stays.push({ kind: 'madinah', place: 'madinah', start: mStart, end: outDep - 1 });
    madinah = { start: fmtYmd(mStart), end: fmtYmd(outDep - 1), leave: fmtYmd(outDep), days: n, placement: 'after', shortened: n < wantMadinah };
  } else if (postRoom > 0) {
    stays.push({ kind: 'makkah', place: 'makkah', start: postStart, end: outDep - 1 });
  }

  if (madinah?.shortened) {
    warnings.push(issue('madinah_shortened', `সময় কম, তাই মদিনায় ${toBnDigits(madinah.days)} দিন ধরা হলো।`, `Short on time: Madinah planned for ${madinah.days} days.`));
  }
  if (!madinah && wantMadinah > 0) {
    warnings.push(issue('madinah_not_scheduled', 'টিকিটের তারিখে মদিনার সময় পাওয়া যায়নি। মোয়াল্লেমকে জিজ্ঞেস করুন।', 'No room for Madinah in these dates. Ask your Moallem.'));
  }

  // --- segments
  const segments: Segment[] = [];
  const titles: Record<SegmentKind, [string, string]> = {
    travel: ['দেশ থেকে যাত্রা', 'Flight to Saudi Arabia'],
    makkah: ['মক্কায় অবস্থান', 'Stay in Makkah'],
    madinah: ['মদিনায় অবস্থান', 'Stay in Madinah'],
    mina: ['মিনায় অবস্থান', 'Stay in Mina'],
    arafah: ['আরাফার দিন', 'Day of Arafah'],
    muzdalifah: ['মুজদালিফায় রাত', 'Night in Muzdalifah'],
    jamarat: ['ঈদের দিন: কঙ্কর, কুরবানি, তাওয়াফ', 'Eid day: stoning, sacrifice, Tawaf'],
    return: ['দেশে ফেরা', 'Flight home'],
  };
  const seg = (kind: SegmentKind, place: Place, s: number, e: number): Segment => ({
    kind, place, start: fmtYmd(s), end: fmtYmd(e), titleBn: titles[kind][0], titleEn: titles[kind][1],
  });
  segments.push(seg('travel', 'air', inDep, arrival));
  for (const st of stays) {
    const s = seg(st.kind, st.place, st.start, st.end);
    if (st.kind === 'mina' && st.start === dh(11)) {
      s.titleBn = 'মিনায় অবস্থান ও কঙ্কর নিক্ষেপ';
      s.titleEn = 'Mina and the stoning days';
    }
    segments.push(s);
    if (st.kind === 'arafah') segments.push(seg('muzdalifah', 'muzdalifah', dh(9), dh(10)));
  }
  segments.push(seg('return', 'air', outDep, home));

  // --- days
  const stayOn = (d: number) => stays.find((s) => d >= s.start && d <= s.end) ?? null;
  const depCity: Place = depAirport === 'MED' ? 'madinah' : 'jeddah';
  const days: TripDay[] = [];
  const annByDate = new Map<string, Announcement[]>();
  for (const a of opts.announcements ?? []) {
    if (parseYmd(a?.date) === null) continue;
    const list = annByDate.get(a.date) ?? [];
    list.push(a);
    annByDate.set(a.date, list);
  }

  for (let d = inDep; d <= home; d++) {
    const st = stayOn(d);
    let place: Place;
    let night: Place;
    let kind: SegmentKind;
    if (d === outDep) {
      place = depCity;
      night = home > outDep ? 'air' : 'dhaka';
      kind = 'return';
    } else if (d > outDep) {
      place = night = 'dhaka';
      kind = 'return';
    } else if (st) {
      place = night = st.place;
      kind = st.kind;
    } else {
      place = night = 'air';
      kind = 'travel';
    }
    if (d === dh(9)) night = 'muzdalifah';
    if (d === dh(10)) night = 'mina';
    if (d === lastMina) night = 'makkah'; // back to the Makkah hotel after the last stoning
    const day: TripDay = { date: fmtYmd(d), place, night, kind, tasks: [], announcements: annByDate.get(fmtYmd(d)) ?? [] };
    const dhd = d - dh1 + 1;
    if (dhd >= 1 && dhd <= cal.dhulHijjahDays) {
      const h = hijriLabel(dhd);
      day.dhulHijjah = dhd;
      day.hijriBn = h.bn;
      day.hijriEn = h.en;
    }
    days.push(day);
  }

  const it: Itinerary = {
    ok: true, errors, warnings, ticket, calendar: cal,
    pattern: landing === 'MED' ? 'madinah_first' : 'jeddah_first',
    landing, departureAirport: depAirport,
    arrivalDate: fmtYmd(arrival), outboundDate: fmtYmd(outDep), homeDate: fmtYmd(home),
    hajj, madinah, luggageDaysBefore, segments, days,
  };
  for (let i = 0; i < days.length; i++) days[i].tasks = tasksFor(it, i);
  return it;
}

/** Attach (or replace) the Moallem's announcements without rebuilding the trip. */
export function withAnnouncements(it: Itinerary, list: Announcement[]): Itinerary {
  return {
    ...it,
    days: it.days.map((d) => ({ ...d, announcements: list.filter((a) => a && a.date === d.date) })),
  };
}

// ---------------------------------------------------------------- tasks

function tasksFor(it: Itinerary, i: number): Task[] {
  const day = it.days[i];
  const prev = it.days[i - 1];
  const next = it.days[i + 1];
  const t: Task[] = [];
  const add = (bn: string, en: string) => t.push({ bn, en });
  const isFirst = i === 0;
  const dhd = day.dhulHijjah;
  const luggage = luggagePlan(it).find((m) => m.packBy === day.date);

  if (isFirst) {
    if (it.landing === 'JED') add('ইহরাম পরে বিমানে উঠুন', 'Board the plane in Ihram');
    else add('সাধারণ কাপড়ে যাত্রা করুন', 'Travel in normal clothes');
    add('পাসপোর্ট ও টিকিট হাতের ব্যাগে রাখুন', 'Keep passport and ticket in your hand bag');
  }
  if (day.date === it.arrivalDate && it.arrivalDate !== it.hajj.tarwiyah) {
    if (day.place === 'makkah') add('মক্কায় পৌঁছে উমরাহ করুন', 'Reach Makkah and perform Umrah');
    if (day.place === 'madinah') add('হোটেলে উঠে বিশ্রাম নিন', 'Check in and rest');
  }

  if (dhd === 7) add('মিনার জন্য ছোট ব্যাগ গুছান', 'Pack a small bag for Mina');
  if (dhd === 8) {
    add('হজের ইহরাম ও নিয়ত, তালবিয়াহ', 'Hajj Ihram, intention, Talbiyah');
    add('মিনায় পাঁচ ওয়াক্ত নামাজ', 'Pray the five prayers in Mina');
  } else if (dhd === 9) {
    add('আরাফায় জোহর-আসর ও দোয়া', 'Dhuhr, Asr and dua at Arafah');
    add('সূর্যাস্তের পর মুজদালিফা', 'After sunset, to Muzdalifah');
    add('মুজদালিফায় কঙ্কর সংগ্রহ', 'Collect pebbles at Muzdalifah');
  } else if (dhd === 10) {
    add('বড় জামারায় ৭টি কঙ্কর', 'Seven pebbles at the big Jamarah');
    add('কুরবানি, তারপর চুল কাটা', 'Sacrifice, then cut hair');
    add('তাওয়াফে জিয়ারাহ ও সাঈ', "Tawaf al-Ifadah and Sa'i");
  } else if (dhd !== undefined && dhd >= 11 && day.date <= it.hajj.lastMinaDay) {
    add('তিন জামারায় কঙ্কর (জোহরের পর)', 'Stone all three Jamarat (after Dhuhr)');
    if (day.date === it.hajj.lastMinaDay) add('সূর্যাস্তের আগে মিনা ত্যাগ', 'Leave Mina before sunset');
  }

  // arriving in a new city by road
  if (prev && day.place !== prev.night && day.kind === 'makkah' && prev.night === 'madinah') {
    add('মিকাতে (যুল-হুলাইফা) ইহরাম ও নিয়ত', 'Ihram and intention at Dhul Hulayfah');
    add('মক্কায় পৌঁছে উমরাহ', 'Perform Umrah in Makkah');
  }
  if (prev && day.kind === 'madinah' && prev.night !== 'madinah' && day.date !== it.arrivalDate) {
    add('মদিনা যাত্রা, বাসের সময় মোয়াল্লেম জানাবেন', 'Travel to Madinah; Moallem will give the bus time');
  }

  if (luggage && luggage.kind !== 'mina') {
    add('লাগেজ গুছিয়ে ওজন মেপে নিন', 'Pack and weigh your luggage');
  }
  // leaving Makkah for good after Hajj
  if (next && day.kind === 'makkah' && day.date > it.hajj.eid && next.night !== 'makkah' && next.place !== 'makkah') {
    add('বিদায়ী তাওয়াফ করুন', 'Perform the farewell Tawaf');
  }

  if (day.kind === 'return') {
    if (day.date === it.outboundDate) {
      add('বিমানবন্দরের বাসের সময় মোয়াল্লেম জানাবেন', 'Moallem will announce the airport bus time');
      add('পাসপোর্ট ও টিকিট হাতের ব্যাগে রাখুন', 'Keep passport and ticket in your hand bag');
    } else add('দেশে পৌঁছানো, আলহামদুলিল্লাহ', 'Home, Alhamdulillah');
  }

  if (!t.length) {
    if (day.place === 'makkah') {
      add('মসজিদুল হারামে জামাতে নামাজ', 'Pray in congregation at the Haram');
      add('দুপুরের রোদ এড়িয়ে চলুন, পানি পান করুন', 'Avoid the midday sun, drink water');
    } else if (day.place === 'madinah') {
      add('মসজিদে নববীতে জামাতে নামাজ', "Pray in congregation at the Prophet's Mosque");
      add('রওজায় সালাম (নুসুকে অনুমতি নিন)', 'Salam at the Rawdah (book on Nusuk)');
    } else if (day.place === 'air') {
      add('বিমানে পানি পান করুন, বিশ্রাম নিন', 'Drink water and rest on the plane');
    } else {
      add('মোয়াল্লেমের ঘোষণা শুনুন', "Listen to your Moallem's announcements");
    }
  }
  // de-duplicate, keep 1-3
  const seen = new Set<string>();
  return t.filter((x) => !seen.has(x.bn) && seen.add(x.bn)).slice(0, 3);
}

// ---------------------------------------------------------------- lookups

export function dayOf(it: Itinerary, date: string): TripDay | null {
  return it.days.find((d) => d.date === date) ?? null;
}

/** Place for the background photo when GPS is unavailable. Before/after the trip: 'dhaka'. */
export function whereOn(it: Itinerary, date: string): Place {
  const d = dayOf(it, date);
  return d ? d.place : 'dhaka';
}

export interface LuggageMove {
  kind: 'madinah' | 'makkah' | 'mina' | 'return';
  bag: 'full' | 'small';
  moveDate: string;
  packBy: string;
}

/** Every day the pilgrim must have bags ready, in order. Mina needs only a small bag. */
export function luggagePlan(it: Itinerary): LuggageMove[] {
  const moves: LuggageMove[] = [];
  const minus = (ymd: string, n: number) => fmtYmd(parseYmd(ymd)! - n);
  for (let i = 1; i < it.days.length; i++) {
    const prev = it.days[i - 1];
    const day = it.days[i];
    if (day.kind === 'return') break;
    if (prev.kind === 'travel') continue;
    if (day.night === 'madinah' && prev.night !== 'madinah') moves.push({ kind: 'madinah', bag: 'full', moveDate: day.date, packBy: prev.date });
    if (day.night === 'makkah' && prev.night === 'madinah') moves.push({ kind: 'makkah', bag: 'full', moveDate: day.date, packBy: prev.date });
    if (day.dhulHijjah === 8) moves.push({ kind: 'mina', bag: 'small', moveDate: day.date, packBy: prev.date });
  }
  if (it.outboundDate) {
    const packBy = minus(it.outboundDate, it.luggageDaysBefore);
    const lastMove = moves[moves.length - 1];
    // if bags are already packed for the bus to Madinah right before the flight, that counts
    moves.push({ kind: 'return', bag: 'full', moveDate: it.outboundDate, packBy: lastMove && lastMove.packBy > packBy ? lastMove.packBy : packBy });
  }
  return moves;
}

/** The next time bags must be ready, counted from `today`. Null when the trip is over. */
export function luggageDeadline(it: Itinerary, today: string): LuggageMove | null {
  return luggagePlan(it).find((m) => m.moveDate >= today) ?? null;
}

// ---------------------------------------------------------------- questions

export type TripTopic =
  | 'madinah_stay' | 'makkah_stay' | 'go_madinah' | 'go_makkah' | 'go_mina' | 'arafah' | 'eid'
  | 'return_home' | 'next_flight' | 'hajj_countdown' | 'luggage' | 'where' | 'announcement' | 'ticket_problem';

export interface TripAnswer {
  topic: TripTopic;
  replyBn: string;
  replyEn: string;
}

const N = (s: string) => s.normalize('NFC');
const rx = (src: string) => new RegExp(N(src), 'iu');
const RX = {
  madinah: rx('মদিনা|মদীনা|মাদিনা|মাদীনা|মদিনায়|মদীনায়|madina|medina|madinah'),
  makkah: rx('মক্কা|মক্কায়|মাক্কা|মক্কাহ|makkah|makka|mecca|mekka|হারাম শরীফ'),
  mina: rx('মিনা|মীনা|মিনায়|\\bmina\\b'),
  arafah: rx('আরাফা|আরাফাত|আরাফাহ|আরফা|arafa|arafat'),
  eid: rx('ঈদ|ইদ|কুরবানি|কোরবানি|\\beid\\b|qurbani'),
  howMany: rx('(^|\\s)(কয়|কত|ক)\\s?দিন|কদ্দিন|how many days|how long|days left|days remaining'),
  when: rx('কবে|কখন|কোন দিন|কোনদিন|কত তারিখ|তারিখ|\\bwhen\\b|what date|which day'),
  go: rx('যাব|যাবো|যাবে|যাচ্ছি|যাওয়া|রওনা|go\\b|going|leave|travel'),
  stay: rx('থাকব|থাকবো|থাকবে|থাকা|থাকতে|\\bstay'),
  home: rx('দেশে|বাড়ি|বাড়ী|বাসায়|ফির|ফেরত|ফেরা|return|\\bhome\\b|go back|bangladesh|বাংলাদেশ'),
  flight: rx('ফ্লাইট|বিমান|flight|plane'),
  hajj: rx('হজ|হজ্জ|হজ্ব|\\bhajj?\\b'),
  left: rx('বাকি|বাকী|\\bleft\\b|remaining|countdown'),
  luggage: rx('লাগেজ|ব্যাগ|সুটকেস|মালপত্র|মাল-পত্র|গোছা|গুছা|luggage|baggage|\\bbags?\\b|suitcase|\\bpack'),
  where: rx('কোথায়|কোথায়|কই|কোন জায়গায়|where'),
  tomorrow: rx('(^|\\s)(আগামী\\s?)?কাল(কে)?(\\s|$)|tomorrow'),
  bus: rx('বাস|\\bbus\\b|গাড়ি|ঘুম থেকে|উঠতে হবে|wake'),
  whatTime: rx('কয়টায়|কটায়|কখন উঠ|what time'),
};

function relBn(n: number): string {
  if (n === 0) return 'আজ';
  if (n === 1) return 'আগামীকাল';
  if (n === 2) return 'পরশু';
  if (n > 0) return `আর ${toBnDigits(n)} দিন পর`;
  return `${toBnDigits(-n)} দিন আগে`;
}
function relEn(n: number): string {
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n > 0) return `in ${n} days`;
  return `${-n} days ago`;
}
const whenBn = (ymd: string, today: string) => `${dateBn(ymd)} (${relBn(daysUntil(today, ymd))})`;
const whenEn = (ymd: string, today: string) => `${dateEn(ymd)} (${relEn(daysUntil(today, ymd))})`;

/** First date >= today on which the pilgrim starts sleeping in `place`; or 'here' if already there. */
function nextArrival(it: Itinerary, place: Place, today: string): { date: string } | 'here' | null {
  const i = it.days.findIndex((d) => d.date === today);
  if (i >= 0 && it.days[i].night === place && (i === 0 || it.days[i - 1].night === place)) return 'here';
  for (let k = Math.max(0, i); k < it.days.length; k++) {
    const d = it.days[k];
    if (d.date < today) continue;
    if (d.night === place && (k === 0 || it.days[k - 1].night !== place)) return { date: d.date };
  }
  return null;
}

const ann = (a: Announcement) => ({ bn: a.time ? `${toBnDigits(a.time)}: ${a.textBn}` : a.textBn, en: a.time ? `${a.time}: ${a.textEn}` : a.textEn });

/**
 * Answers the trip questions a Moallem hears all day, with real numbers from the ticket.
 * Returns null when the question is not about the trip (let other answerers try).
 */
export function answerTripQuestion(it: Itinerary, text: string, today: string): TripAnswer | null {
  if (typeof text !== 'string' || !text.trim()) return null;
  const q = N(text).toLowerCase().replace(/[।?!,.;:'"()]/g, ' ').replace(/\s+/g, ' ').trim();
  const has = (r: RegExp) => r.test(q);

  let topic: TripTopic | null = null;
  if (has(RX.luggage)) topic = 'luggage';
  else if (has(RX.bus)) topic = 'announcement';
  else if (has(RX.madinah)) topic = has(RX.howMany) || (has(RX.stay) && !has(RX.go)) ? 'madinah_stay' : 'go_madinah';
  else if (has(RX.makkah)) topic = has(RX.howMany) || (has(RX.stay) && !has(RX.go)) ? 'makkah_stay' : 'go_makkah';
  else if (has(RX.mina)) topic = 'go_mina';
  else if (has(RX.arafah)) topic = 'arafah';
  else if (has(RX.eid)) topic = 'eid';
  else if (has(RX.home)) topic = 'return_home';
  else if (has(RX.flight)) topic = 'next_flight';
  else if (has(RX.hajj) && (has(RX.howMany) || has(RX.left) || has(RX.when))) topic = 'hajj_countdown';
  else if (has(RX.where)) topic = 'where';
  else if (has(RX.howMany) && has(RX.stay)) topic = 'return_home'; // "আর কয়দিন থাকব?"
  else if (has(RX.whatTime)) topic = 'announcement';
  if (!topic) return null;

  if (!it.ok || parseYmd(today) === null) {
    return {
      topic: 'ticket_problem',
      replyBn: 'আপনার টিকিটের তথ্য ঠিকমতো পড়া যায়নি। টিকিটের ছবি আবার তুলুন, অথবা মোয়াল্লেমকে জিজ্ঞেস করুন।',
      replyEn: "I couldn't read your ticket properly. Please photograph it again, or ask your Moallem.",
    };
  }

  const r = (bn: string, en: string): TripAnswer => ({ topic: topic!, replyBn: bn, replyEn: en });
  const dt = (n: number) => toBnDigits(n);
  const offset = has(RX.tomorrow) ? 1 : 0;

  switch (topic) {
    case 'madinah_stay': {
      const m = it.madinah;
      if (!m) return r('আপনার টিকিটের তারিখে মদিনার সময় ধরা যায়নি। মোয়াল্লেমকে জিজ্ঞেস করুন।', "Your ticket dates leave no time for Madinah. Please ask your Moallem.");
      const inMadinah = today >= m.start && today <= m.end;
      if (inMadinah) {
        const left = daysUntil(today, m.leave);
        return r(`মদিনায় মোট ${dt(m.days)} দিন। ${dateBn(m.leave)} রওনা, আর ${dt(left)} দিন বাকি।`, `${m.days} days in Madinah in all. You leave ${dateEn(m.leave)}, ${left} days from now.`);
      }
      if (today > m.end) return r(`মদিনায় আপনার ${dt(m.days)} দিনের অবস্থান শেষ হয়েছে, আলহামদুলিল্লাহ।`, `Your ${m.days} days in Madinah are done, Alhamdulillah.`);
      return r(
        `মদিনায় ${dt(m.days)} দিন থাকবেন ইনশাআল্লাহ: ${dateBn(m.start)} থেকে ${dateBn(m.leave)} পর্যন্ত।`,
        `You'll stay ${m.days} days in Madinah, insha'Allah: ${dateEn(m.start)} to ${dateEn(m.leave)}.`,
      );
    }
    case 'makkah_stay': {
      const nights = it.days.filter((d) => d.night === 'makkah').length;
      return r(`মক্কায় মোট ${dt(nights)} রাত থাকবেন (মিনা-আরাফার দিনগুলো বাদে)।`, `${nights} nights in Makkah in all, besides the Mina and Arafah days.`);
    }
    case 'go_madinah': {
      const n = nextArrival(it, 'madinah', today);
      if (n === 'here') return r('আপনি এখন মদিনাতেই আছেন।', "You're in Madinah right now.");
      if (!n) return r('এই সফরে সামনে আর মদিনা যাওয়ার তারিখ নেই।', 'No Madinah visit is left on this trip.');
      return r(`মদিনা যাবেন ${whenBn(n.date, today)}। বাসের সময় মোয়াল্লেম জানাবেন।`, `You go to Madinah on ${whenEn(n.date, today)}. Your Moallem will give the bus time.`);
    }
    case 'go_makkah': {
      const n = nextArrival(it, 'makkah', today);
      if (n === 'here') return r('আপনি এখন মক্কাতেই আছেন।', "You're in Makkah right now.");
      if (!n) return r('এই সফরে সামনে আর মক্কা যাওয়ার তারিখ নেই।', 'No more Makkah stay is left on this trip.');
      return r(`মক্কা যাবেন ${whenBn(n.date, today)}, ইনশাআল্লাহ।`, `You go to Makkah on ${whenEn(n.date, today)}, insha'Allah.`);
    }
    case 'go_mina': {
      const t = it.hajj.tarwiyah;
      const n = daysUntil(today, t);
      if (n < 0 && today <= it.hajj.lastMinaDay) return r('আপনি এখন হজের দিনগুলোতে মিনাতেই আছেন।', "You're in the Mina days of Hajj now.");
      if (n < 0) return r('মিনার দিনগুলো শেষ হয়েছে, আলহামদুলিল্লাহ।', 'The Mina days are over, Alhamdulillah.');
      return r(
        `মিনায় যাবেন ${whenBn(t, today)}, ৮ জিলহজ। অনেক দল আগের রাতেই রওনা দেয়; সময় মোয়াল্লেম জানাবেন।`,
        `8 Dhul Hijjah, ${whenEn(t, today)}: you go to Mina. Many groups leave the night before; your Moallem will give the time.`,
      );
    }
    case 'arafah': {
      const a = it.hajj.arafah;
      const n = daysUntil(today, a);
      if (n === 0) return r('আজই আরাফার দিন, হজের মূল দিন। বেশি বেশি দোয়া করুন।', 'Today is the Day of Arafah, the heart of Hajj. Make lots of dua.');
      if (n < 0) return r(`আরাফার দিন ছিল ${dateBn(a)}। আলহামদুলিল্লাহ।`, `The Day of Arafah was ${dateEn(a)}. Alhamdulillah.`);
      return r(`আরাফার দিন ৯ জিলহজ, ${whenBn(a, today)}।`, `The Day of Arafah is 9 Dhul Hijjah, ${whenEn(a, today)}.`);
    }
    case 'eid': {
      const e = it.hajj.eid;
      const n = daysUntil(today, e);
      if (n === 0) return r('আজ ঈদুল আযহা, ঈদ মোবারক! আজ কঙ্কর, কুরবানি ও চুল কাটা।', 'Eid Mubarak! Today: stoning, sacrifice and cutting hair.');
      if (n < 0) return r(`ঈদ ছিল ${dateBn(e)}।`, `Eid was ${dateEn(e)}.`);
      return r(`ঈদুল আযহা ${whenBn(e, today)}।`, `Eid al-Adha is ${whenEn(e, today)}.`);
    }
    case 'return_home': {
      const o = it.outboundDate!;
      const n = daysUntil(today, o);
      const f = it.ticket.outbound;
      const timeBn = parseHm(f.time) !== null ? `, ${toBnDigits(f.time!)}` : '';
      const timeEn = parseHm(f.time) !== null ? `, ${f.time}` : '';
      if (n < 0) return r('আপনার ফিরতি ফ্লাইট হয়ে গেছে। হজ কবুল হোক!', 'Your return flight has gone. May your Hajj be accepted!');
      if (n === 0) return r(`আজই দেশে ফেরার ফ্লাইট ${f.flightNo}${timeBn}। বাসের সময় মোয়াল্লেম জানাবেন।`, `Your flight home ${f.flightNo} is today${timeEn}. Your Moallem will give the bus time.`);
      return r(`দেশে ফিরবেন ${whenBn(o, today)}, ফ্লাইট ${f.flightNo}${timeBn}।`, `You fly home ${whenEn(o, today)}, flight ${f.flightNo}${timeEn}.`);
    }
    case 'next_flight': {
      const f = today <= it.ticket.inbound.date ? it.ticket.inbound : it.ticket.outbound;
      const tBn = parseHm(f.time) !== null ? `, ${toBnDigits(f.time!)}` : '';
      const tEn = parseHm(f.time) !== null ? `, ${f.time}` : '';
      if (today > it.ticket.outbound.date) return r('আপনার সব ফ্লাইট শেষ, আলহামদুলিল্লাহ।', 'All your flights are done, Alhamdulillah.');
      return r(`পরের ফ্লাইট ${f.flightNo}: ${whenBn(f.date, today)}${tBn}।`, `Next flight ${f.flightNo}: ${whenEn(f.date, today)}${tEn}.`);
    }
    case 'hajj_countdown': {
      const a = it.hajj.arafah;
      const n = daysUntil(today, a);
      if (n > 0) return r(`হজের (আরাফার দিন) আর ${dt(n)} দিন বাকি: ${dateBn(a)}।`, `${n} days left until Hajj (Day of Arafah): ${dateEn(a)}.`);
      if (n === 0) return r('আজই হজ, আরাফার দিন। আল্লাহ কবুল করুন।', 'Hajj is today, the Day of Arafah. May Allah accept it.');
      if (today <= it.hajj.lastMinaDay) return r('হজ চলছে, এখন মিনার দিনগুলো। কঙ্কর নিক্ষেপ চালিয়ে যান।', 'Hajj is under way: the Mina days. Keep up the stoning.');
      return r('আলহামদুলিল্লাহ, আপনার হজ শেষ হয়েছে। আল্লাহ কবুল করুন।', 'Alhamdulillah, your Hajj is complete. May Allah accept it.');
    }
    case 'luggage': {
      const m = luggageDeadline(it, today);
      if (!m) return r('সফর শেষ, লাগেজের আর তাড়া নেই।', 'The trip is over; no packing needed.');
      const by = daysUntil(today, m.packBy) <= 0 ? 'আজ রাতের মধ্যেই' : `${dateBn(m.packBy)} রাতের মধ্যে`;
      const byEn = daysUntil(today, m.packBy) <= 0 ? 'by tonight' : `by the night of ${dateEn(m.packBy)}`;
      if (m.kind === 'mina') return r(`মিনার জন্য ${by} ছোট ব্যাগ গুছান; বড় লাগেজ সাধারণত হোটেলে থাকে।`, `Pack a small bag for Mina ${byEn}; big luggage usually stays at the hotel.`);
      const whyBn = m.kind === 'return' ? 'দেশে ফেরা' : m.kind === 'madinah' ? 'মদিনা যাত্রা' : 'মক্কা যাত্রা';
      const whyEn = m.kind === 'return' ? 'flight home' : m.kind === 'madinah' ? 'trip to Madinah' : 'trip to Makkah';
      return r(`${by} লাগেজ রেডি করুন; ${dateBn(m.moveDate)} ${whyBn}।`, `Have your luggage ready ${byEn}; ${whyEn} on ${dateEn(m.moveDate)}.`);
    }
    case 'where': {
      const d0 = parseYmd(today)! + offset;
      const day = dayOf(it, fmtYmd(d0));
      const whoBn = offset ? 'আগামীকাল' : 'আজ';
      const whoEn = offset ? 'Tomorrow' : 'Today';
      if (!day) {
        if (fmtYmd(d0) < it.days[0].date) return r(`যাত্রা এখনো শুরু হয়নি; ফ্লাইট ${dateBn(it.ticket.inbound.date)}।`, `The trip hasn't started; your flight is ${dateEn(it.ticket.inbound.date)}.`);
        return r(`${whoBn} আপনি দেশে, আলহামদুলিল্লাহ।`, `${whoEn} you're home, Alhamdulillah.`);
      }
      const h = day.hijriBn ? ` (${day.hijriBn})` : '';
      const hEn = day.hijriEn ? ` (${day.hijriEn})` : '';
      if (day.place !== day.night) {
        return r(`${whoBn}${h} দিনে ${PLACE_BN_AT[day.place]}, রাতে থাকবেন ${PLACE_BN_AT[day.night]}।`, `${whoEn}${hEn}: daytime in ${PLACE_EN[day.place]}, night in ${PLACE_EN[day.night]}.`);
      }
      return r(`${whoBn}${h} রাতে থাকবেন ${PLACE_BN_AT[day.night]}।`, `${whoEn}${hEn} you stay in ${PLACE_EN[day.night]}.`);
    }
    case 'announcement': {
      const d0 = parseYmd(today)! + offset;
      const list = dayOf(it, fmtYmd(d0))?.announcements ?? [];
      const wantWake = /ঘুম|উঠতে|wake/u.test(q);
      const pick = list.filter((a) => (wantWake ? a.kind === 'wakeup' : a.kind !== 'wakeup')).concat(list).slice(0, 2);
      if (!pick.length) return r('মোয়াল্লেম এখনো সময় জানাননি। ঘোষণা এলেই এখানে দেখাবে।', "Your Moallem hasn't announced a time yet. It'll show here as soon as they do.");
      const uniq = [...new Set(pick)];
      return r(uniq.map((a) => ann(a).bn).join(' · '), uniq.map((a) => ann(a).en).join(' · '));
    }
    default:
      return null;
  }
}
