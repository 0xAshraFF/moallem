// The pilgrim's journey as days. Each day decides the photo, the "Now" card, the 4 home tiles
// and the step list. Copy is deliberately short; details sit behind a tap with audio.
// All ritual wording needs Mufti sign-off before launch.

export type DayId = 'travel' | 'umrah' | 'mina' | 'arafah' | 'eid' | 'tashreeq' | 'madinah';

export type IconKey =
  | 'plane' | 'shirt' | 'mic' | 'tawaf' | 'sai' | 'scissors' | 'tent' | 'droplets' | 'mountain'
  | 'hands' | 'sunset' | 'moon' | 'stones' | 'beef' | 'kaaba' | 'qr' | 'luggage' | 'book' | 'mapPin'
  | 'family' | 'ban' | 'bed' | 'clock' | 'footprints';

export type TileKey = 'tawaf' | 'sai' | 'arafah' | 'permit' | 'trip' | 'rami' | 'tent';

export interface Step {
  icon: IconKey;
  bn: string;
  en: string;
  detailBn: string;
  detailEn: string;
  guard?: boolean; // a ruling that must not be broken: shown with warn styling
  /** Hanafi weight: ফরজ (pillar, Hajj invalid without it), ওয়াজিব (Dam if missed), সুন্নত. Needs Mufti sign-off. */
  weight?: Weight;
}

export type Weight = 'fard' | 'wajib' | 'sunnah';
export const WEIGHT_BN: Record<Weight, string> = { fard: 'ফরজ', wajib: 'ওয়াজিব', sunnah: 'সুন্নত' };
export const WEIGHT_EN: Record<Weight, string> = { fard: 'Pillar', wajib: 'Wajib', sunnah: 'Sunnah' };
export const WEIGHT_HELP_BN: Record<Weight, string> = {
  fard: 'বাদ গেলে হজ হবে না',
  wajib: 'বাদ গেলে দম দিতে হয়',
  sunnah: 'অসুস্থ হলে বিশ্রাম নিতে পারেন',
};

export interface Day {
  id: DayId;
  hijriBn: string;
  hijriEn: string;
  placeBn: string;
  placeEn: string;
  photo: string;
  photoNight?: string;
  now: { bn: string; en: string; ctaBn: string; ctaEn: string; cta: string; untilLocal?: [number, number] };
  tiles: TileKey[];
  steps: Step[];
}

export const DAYS: Day[] = [
  {
    id: 'travel', hijriBn: 'যাত্রার দিন', hijriEn: 'Travel day', placeBn: 'ঢাকা থেকে যাত্রা', placeEn: 'Leaving Dhaka',
    photo: 'haram-aerial',
    now: { bn: 'ইহরামের নিয়ম দেখুন', en: 'Check your Ihram rule', ctaBn: 'শুনুন', ctaEn: 'Listen', cta: '/steps' },
    tiles: ['permit', 'trip', 'tawaf', 'sai'],
    steps: [
      { icon: 'plane', bn: 'কোথায় নামবেন দেখুন', en: 'Check landing city', detailBn: 'জেদ্দায় নামলে ঢাকা থেকেই ইহরাম। মদিনায় নামলে সাধারণ কাপড়ে যাবেন।', detailEn: 'Landing in Jeddah: wear Ihram from Dhaka. Landing in Madinah: travel in normal clothes.' },
      { weight: 'fard', icon: 'shirt', bn: 'ইহরাম পরুন', en: 'Wear Ihram', detailBn: 'গোসল করে দুই টুকরা সাদা কাপড় পরুন, দুই রাকাত নামাজ পড়ুন।', detailEn: 'Bathe, wear the two white cloths, pray two rakah.' },
      { weight: 'fard', icon: 'mic', bn: 'তালবিয়াহ পড়ুন', en: 'Say Talbiyah', detailBn: 'মীকাত পার হওয়ার আগে নিয়ত করে তালবিয়াহ শুরু করুন।', detailEn: 'Make intention and begin Talbiyah before the Miqat.' },
    ],
  },
  {
    id: 'umrah', hijriBn: 'মক্কায় আগমন', hijriEn: 'Arrival in Makkah', placeBn: 'মসজিদুল হারাম', placeEn: 'Masjid al-Haram',
    photo: 'kaaba-close', photoNight: 'tawaf-night',
    now: { bn: 'উমরাহর তাওয়াফ', en: 'Umrah Tawaf', ctaBn: 'তাওয়াফ শুরু', ctaEn: 'Start Tawaf', cta: '/tawaf' },
    tiles: ['tawaf', 'sai', 'permit', 'trip'],
    steps: [
      { weight: 'fard', icon: 'tawaf', bn: 'তাওয়াফ ৭ চক্কর', en: 'Tawaf, 7 rounds', detailBn: 'হাজরে আসওয়াদ থেকে শুরু, কাবা বাম পাশে।', detailEn: 'Start at the Black Stone, Kaaba on your left.' },
      { weight: 'wajib', icon: 'hands', bn: 'দুই রাকাত নামাজ', en: 'Pray two rakah', detailBn: 'মাকামে ইব্রাহিমের পেছনে বা যেখানে জায়গা পান।', detailEn: 'Behind Maqam Ibrahim, or wherever there is space.' },
      { weight: 'wajib', icon: 'sai', bn: 'সাঈ ৭ বার', en: "Sa'i, 7 times", detailBn: 'সাফা থেকে শুরু, মারওয়ায় শেষ।', detailEn: 'Start at Safa, end at Marwah.' },
      { weight: 'wajib', icon: 'scissors', bn: 'চুল কাটুন', en: 'Cut hair', detailBn: 'মাথা মুণ্ডন বা চুল ছোট করুন। মহিলারা আঙুলের এক কর।', detailEn: 'Shave or shorten. Women cut a fingertip length.' },
    ],
  },
  {
    id: 'mina', hijriBn: '৮ জিলহজ', hijriEn: '8 Dhul Hijjah', placeBn: 'মিনা', placeEn: 'Mina',
    photo: 'mina',
    now: { bn: 'তাঁবুর জায়গা সেভ করুন', en: 'Save your tent spot', ctaBn: 'সেভ করুন', ctaEn: 'Save', cta: '/family' },
    tiles: ['tent', 'tawaf', 'permit', 'trip'],
    steps: [
      { weight: 'fard', icon: 'shirt', bn: 'হজের ইহরাম', en: 'Ihram for Hajj', detailBn: 'হোটেল থেকে হজের নিয়তে ইহরাম বাঁধুন।', detailEn: 'Enter Ihram for Hajj from your hotel.' },
      { weight: 'sunnah', icon: 'tent', bn: 'মিনায় যান', en: 'Go to Mina', detailBn: 'জোহর থেকে পরদিন ফজর পর্যন্ত মিনায় ৫ ওয়াক্ত।', detailEn: 'Five prayers in Mina, Dhuhr to next Fajr.' },
      { icon: 'droplets', bn: 'পানি পান করুন', en: 'Drink water', detailBn: 'প্রতি ঘণ্টায় পানি। রোদে ছাতা।', detailEn: 'Water every hour. Umbrella in the sun.' },
    ],
  },
  {
    id: 'arafah', hijriBn: '৯ জিলহজ · আরাফার দিন', hijriEn: '9 Dhul Hijjah · Day of Arafah', placeBn: 'আরাফাহ', placeEn: 'Arafah',
    photo: 'arafat',
    now: { bn: 'সূর্যাস্ত পর্যন্ত দোয়া', en: 'Dua until sunset', ctaBn: 'দোয়া শুনুন', ctaEn: 'Play duas', cta: '/arafah', untilLocal: [18, 58] },
    tiles: ['arafah', 'tawaf', 'permit', 'trip'],
    steps: [
      { weight: 'fard', icon: 'sunset', bn: 'আরাফায় পৌঁছান', en: 'Reach Arafah', detailBn: 'যাওয়ালের আগে আরাফার সীমানার ভেতরে থাকুন।', detailEn: 'Be inside Arafah before midday.' },
      { icon: 'hands', bn: 'জোহর ও আসর', en: 'Dhuhr and Asr', detailBn: 'আপনার তাঁবুর ইমামের সাথে পড়ুন।', detailEn: 'Pray with your tent imam.' },
      { weight: 'sunnah', icon: 'bed', bn: 'শুয়ে বসে দোয়া', en: 'Dua, resting is fine', detailBn: 'ক্লান্ত হলে শুয়ে থেকেও দোয়া চলবে।', detailEn: 'If tired, keep making dua lying down.' },
      { weight: 'wajib', icon: 'ban', bn: 'এখানে মাগরিব নয়', en: 'No Maghrib here', guard: true, detailBn: 'সূর্যাস্তের পর আরাফায় মাগরিব পড়বেন না। মুযদালিফায় এশার সাথে পড়বেন।', detailEn: 'Do not pray Maghrib in Arafah. Pray it with Isha at Muzdalifah.' },
      { weight: 'wajib', icon: 'moon', bn: 'মুযদালিফায় রাত', en: 'Night at Muzdalifah', detailBn: 'মাগরিব-এশা একসাথে, ৭০টি ছোট কংকর তুলুন।', detailEn: 'Maghrib and Isha together; pick 70 small pebbles.' },
    ],
  },
  {
    id: 'eid', hijriBn: '১০ জিলহজ · ঈদের দিন', hijriEn: '10 Dhul Hijjah · Eid', placeBn: 'জামারাত', placeEn: 'Jamarat',
    photo: 'jamarat',
    now: { bn: 'বড় জামারায় ৭ কংকর', en: '7 pebbles, big Jamarah', ctaBn: 'ধাপ দেখুন', ctaEn: 'See steps', cta: '/steps' },
    tiles: ['rami', 'tawaf', 'permit', 'trip'],
    steps: [
      { weight: 'wajib', icon: 'stones', bn: 'বড় জামারায় ৭ কংকর', en: '7 pebbles, big Jamarah', detailBn: 'ফজরের পর থেকে। প্রথম কংকরের সাথে তালবিয়াহ বন্ধ।', detailEn: 'After Fajr. Stop Talbiyah with the first pebble.' },
      { weight: 'wajib', icon: 'beef', bn: 'কুরবানি', en: 'Sacrifice', detailBn: 'কুরবানি হয়েছে কিনা নিশ্চিত হোন, তারপর চুল কাটুন।', detailEn: 'Confirm the sacrifice is done before cutting hair.' },
      { weight: 'wajib', icon: 'scissors', bn: 'চুল কাটুন', en: 'Cut hair', guard: true, detailBn: 'ক্রম: কংকর → কুরবানি → চুল। আগে চুল কাটলে দম লাগতে পারে।', detailEn: 'Order: stones, sacrifice, hair. Cutting first may need a Dam.' },
      { weight: 'fard', icon: 'kaaba', bn: 'তাওয়াফে যিয়ারত', en: 'Tawaf al-Ifadah', detailBn: '১২ তারিখ সূর্যাস্তের আগে।', detailEn: 'Before sunset on the 12th.' },
    ],
  },
  {
    id: 'tashreeq', hijriBn: '১১-১৩ জিলহজ', hijriEn: '11-13 Dhul Hijjah', placeBn: 'মিনা ও জামারাত', placeEn: 'Mina and Jamarat',
    photo: 'mina',
    now: { bn: 'দুপুরের পর তিন জামারা', en: 'Three Jamarat after midday', ctaBn: 'ধাপ দেখুন', ctaEn: 'See steps', cta: '/steps' },
    tiles: ['rami', 'tent', 'permit', 'trip'],
    steps: [
      { icon: 'clock', bn: 'দুপুরের পর যান', en: 'Go after midday', guard: true, detailBn: 'যাওয়ালের আগে কংকর সহিহ নয়। আসরের পর ভিড় কম।', detailEn: 'Stoning before midday is not valid. After Asr is calmer.' },
      { weight: 'wajib', icon: 'stones', bn: 'তিন জামারায় ৭ করে', en: '7 at each of three', detailBn: 'ছোট → মাঝারি → বড়।', detailEn: 'Small, middle, then big.' },
      { weight: 'sunnah', icon: 'tent', bn: 'রাত মিনায়', en: 'Nights in Mina', detailBn: '১২ তারিখ সূর্যাস্তের আগে চাইলে মক্কায় ফিরতে পারেন।', detailEn: 'You may leave before sunset on the 12th.' },
    ],
  },
  {
    id: 'madinah', hijriBn: 'হজের পর', hijriEn: 'After Hajj', placeBn: 'মদিনা', placeEn: 'Madinah',
    photo: 'madinah-dome',
    now: { bn: 'রওজায় সালাম', en: 'Greet at the Rawdah', ctaBn: 'পারমিট', ctaEn: 'Permit', cta: '/permit' },
    tiles: ['permit', 'trip', 'tawaf', 'sai'],
    steps: [
      { icon: 'qr', bn: 'নুসুক পারমিট', en: 'Nusuk permit', detailBn: 'রওজার জন্য নুসুক অ্যাপে সময় নিন।', detailEn: 'Book a Rawdah slot in the Nusuk app.' },
      { weight: 'sunnah', icon: 'mapPin', bn: 'কুবা মসজিদ', en: 'Quba Mosque', detailBn: 'ওযু করে গিয়ে দুই রাকাত নামাজ।', detailEn: 'Go with wudu and pray two rakah.' },
      { icon: 'luggage', bn: 'ব্যাগ ২৩ কেজি', en: 'Bags 23 kg', detailBn: 'দুটি ব্যাগ ২৩ কেজি, হাতে ৭ কেজি, জমজম ৫ লিটার।', detailEn: 'Two 23 kg bags, 7 kg carry-on, 5 L Zamzam.' },
    ],
  },
];

export const dayById = (id: DayId) => DAYS.find((d) => d.id === id) ?? DAYS[3];

// ---------------------------------------------------------------- personalised steps

export type Gender = 'male' | 'female';
export type HajjType = 'tamattu' | 'qiran' | 'ifrad';
export interface Profile { gender: Gender; hajjType: HajjType }

const IN_IHRAM: Step = { icon: 'shirt', bn: 'ইহরাম খুলবেন না', en: 'Stay in Ihram', guard: true,
  detailBn: 'কিরান ও ইফরাদ হাজীরা ১০ তারিখ পর্যন্ত ইহরাম অবস্থায় থাকবেন।', detailEn: 'Qiran and Ifrad pilgrims stay in Ihram until the 10th.' };

/**
 * The day's steps for this pilgrim. Hajj type changes what is done before Hajj and whether the
 * sacrifice is required; gender changes Raml, the green-light jog and how hair is cut.
 */
export function stepsFor(day: Day, p: Profile): Step[] {
  const female = p.gender === 'female';
  let steps = day.steps.map((st) => ({ ...st }));

  steps = steps.map((st) => {
    if (st.icon === 'scissors' && female) {
      return { ...st, detailBn: 'মহিলারা মাথার চুলের আগা থেকে আঙুলের এক কর পরিমাণ কাটবেন। মুণ্ডন নয়।', detailEn: 'Women cut a fingertip length from the ends. No shaving.' };
    }
    if (st.icon === 'tawaf' && day.id === 'umrah') {
      return { ...st, detailBn: st.detailBn + (female ? ' মহিলাদের জন্য রমল নেই।' : ' প্রথম ৩ চক্করে রমল (দ্রুত ছোট পা)।'), detailEn: st.detailEn + (female ? ' No Raml for women.' : ' Raml (brisk short steps) in the first 3 rounds.') };
    }
    if (st.icon === 'sai') {
      return { ...st, detailBn: st.detailBn + (female ? ' সবুজ বাতির মাঝে স্বাভাবিক হাঁটুন।' : ' সবুজ বাতির মাঝে একটু দ্রুত হাঁটুন।'), detailEn: st.detailEn + (female ? ' Walk normally between the green lights.' : ' Walk briskly between the green lights.') };
    }
    return st;
  });

  if (day.id === 'umrah' && p.hajjType !== 'tamattu') {
    // Qiran: Umrah inside Hajj Ihram, no hair cut. Ifrad: arrival Tawaf (Qudum) only.
    steps = steps.filter((st) => st.icon !== 'scissors');
    if (p.hajjType === 'ifrad') {
      steps = steps.filter((st) => st.icon !== 'sai').map((st) => st.icon === 'tawaf'
        ? { ...st, weight: 'sunnah' as const, bn: 'তাওয়াফে কুদুম', en: 'Tawaf al-Qudum', detailBn: 'আগমনের তাওয়াফ। ইফরাদ হাজীদের জন্য সুন্নত।', detailEn: 'Arrival Tawaf, Sunnah for Ifrad pilgrims.' }
        : st);
    }
    steps.push(IN_IHRAM);
  }
  if (day.id === 'mina' && p.hajjType !== 'tamattu') {
    steps = steps.map((st) => (st.icon === 'shirt' ? { ...IN_IHRAM, bn: 'আগের ইহরামেই আছেন', en: 'Already in Ihram', guard: false } : st));
  }
  if (day.id === 'eid') {
    steps = steps.map((st) => (st.icon === 'beef' && p.hajjType === 'ifrad'
      ? { ...st, weight: 'sunnah' as const, detailBn: 'ইফরাদ হাজীদের জন্য কুরবানি ওয়াজিব নয়, মুস্তাহাব।', detailEn: 'For Ifrad, the sacrifice is recommended, not required.' }
      : st));
  }
  return steps;
}
