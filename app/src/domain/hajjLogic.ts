export interface PidValidationResult {
  valid: boolean;
  normalized: string;
  errorBn?: string;
  errorEn?: string;
}

/**
 * Validates an 11-digit Bangladesh Pilgrim ID (PID).
 */
export function validateBdPid(rawInput: string): PidValidationResult {
  const trimmed = (rawInput || '').trim().replace(/[\s-]/g, '');
  // Convert Bangla numerals ০-৯ to ASCII 0-9 if entered in Bangla keyboard
  const banglaDigits = '০১২৩৪৫৬৭৮৯';
  const normalized = trimmed
    .split('')
    .map((ch) => {
      const idx = banglaDigits.indexOf(ch);
      return idx !== -1 ? String(idx) : ch;
    })
    .join('');

  if (!normalized) {
    return {
      valid: false,
      normalized: '',
      errorBn: 'অনুগ্রহ করে ১১ সংখ্যার বাংলাদেশ হজ পিআইডি (PID) নম্বর লিখুন।',
      errorEn: 'Please enter the 11-digit Bangladesh Pilgrim ID (PID).',
    };
  }

  if (!/^\d+$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      errorBn: 'পিআইডি নম্বরে শুধুমাত্র সংখ্যা (০-৯) থাকতে পারবে।',
      errorEn: 'PID must contain numeric digits only (0-9).',
    };
  }

  if (normalized.length !== 11) {
    return {
      valid: false,
      normalized,
      errorBn: `পিআইডি অবশ্যই ১১ সংখ্যার হতে হবে (আপনি ${normalized.length} সংখ্যা দিয়েছেন)।`,
      errorEn: `PID must be exactly 11 digits (entered ${normalized.length} digits).`,
    };
  }

  return {
    valid: true,
    normalized,
  };
}

export interface DiscrepancyAnalysis {
  promisedMeters: number;
  actualMeters: number;
  diffMeters: number;
  overstatementPercent: number;
  status: 'honest' | 'moderate' | 'severe_fraud';
  badgeBn: string;
  badgeEn: string;
}

/**
 * Compares agency brochure promised distance vs GPS verified walking distance.
 */
export function calculateDistanceDiscrepancy(
  promisedMeters: number,
  actualMeters: number
): DiscrepancyAnalysis {
  const safePromised = Math.max(50, Math.round(promisedMeters));
  const safeActual = Math.max(50, Math.round(actualMeters));
  const diffMeters = safeActual - safePromised;
  const overstatementPercent = Math.round((diffMeters / safePromised) * 100);

  if (diffMeters <= 120 || overstatementPercent <= 20) {
    return {
      promisedMeters: safePromised,
      actualMeters: safeActual,
      diffMeters: Math.max(0, diffMeters),
      overstatementPercent: Math.max(0, overstatementPercent),
      status: 'honest',
      badgeBn: 'জিপিএস সত্যতা যাচাইকৃত · প্রতিশ্রুতি অনুযায়ী',
      badgeEn: 'GPS Verified · Matches Brochure Promise',
    };
  }

  if (diffMeters <= 350 || overstatementPercent <= 65) {
    return {
      promisedMeters: safePromised,
      actualMeters: safeActual,
      diffMeters,
      overstatementPercent,
      status: 'moderate',
      badgeBn: `আংশিক গড়মিল · প্রতিশ্রুতির চেয়ে ${diffMeters} মিটার বেশি হাঁটা পথ`,
      badgeEn: `Moderate Gap · +${diffMeters}m farther than brochure`,
    };
  }

  return {
    promisedMeters: safePromised,
    actualMeters: safeActual,
    diffMeters,
    overstatementPercent,
    status: 'severe_fraud',
    badgeBn: `সতর্কতা · ব্রোশিউরের চেয়ে ${diffMeters} মিটার (${overstatementPercent}%) বেশি দূরত্ব`,
    badgeEn: `Discrepancy Alert · +${diffMeters}m (+${overstatementPercent}%) farther`,
  };
}

export interface LuggageItem {
  id: string;
  nameBn: string;
  nameEn: string;
  weightKg: number;
  priceSar: number;
  bag: 1 | 2 | 'hand';
}

export interface LuggageSummary {
  bag1WeightKg: number;
  bag2WeightKg: number;
  handCarryWeightKg: number;
  bag1Overweight: boolean;
  bag2Overweight: boolean;
  handCarryOverweight: boolean;
  bag1RemainingKg: number;
  bag2RemainingKg: number;
  totalWeightKg: number;
  totalPriceSar: number;
  totalPriceBdt: number;
  zamzamLiters: number;
}

export const MAX_CHECKED_BAG_KG = 23;
export const MAX_HAND_CARRY_KG = 7;

/**
 * Calculates Biman/Saudia 2x23kg luggage weight + 5L Zamzam + SAR->BDT conversion.
 */
export function calculateLuggageStatus(
  items: LuggageItem[],
  sarToBdtRate: number,
  zamzamPacked: boolean = true
): LuggageSummary {
  let bag1 = 0;
  let bag2 = 0;
  let hand = 0;
  let totalSar = 0;

  for (const item of items) {
    const w = Math.max(0, Number(item.weightKg) || 0);
    const p = Math.max(0, Number(item.priceSar) || 0);
    totalSar += p;
    if (item.bag === 1) bag1 += w;
    else if (item.bag === 2) bag2 += w;
    else hand += w;
  }

  bag1 = Math.round(bag1 * 10) / 10;
  bag2 = Math.round(bag2 * 10) / 10;
  hand = Math.round(hand * 10) / 10;
  const totalWeightKg = Math.round((bag1 + bag2 + hand) * 10) / 10;
  const validRate = sarToBdtRate > 0 ? sarToBdtRate : 32.5;
  const totalPriceBdt = Math.round(totalSar * validRate);

  return {
    bag1WeightKg: bag1,
    bag2WeightKg: bag2,
    handCarryWeightKg: hand,
    bag1Overweight: bag1 > MAX_CHECKED_BAG_KG,
    bag2Overweight: bag2 > MAX_CHECKED_BAG_KG,
    handCarryOverweight: hand > MAX_HAND_CARRY_KG,
    bag1RemainingKg: Math.round((MAX_CHECKED_BAG_KG - bag1) * 10) / 10,
    bag2RemainingKg: Math.round((MAX_CHECKED_BAG_KG - bag2) * 10) / 10,
    totalWeightKg,
    totalPriceSar: Math.round(totalSar),
    totalPriceBdt,
    zamzamLiters: zamzamPacked ? 5 : 0,
  };
}

export interface StoningWindowAssessment {
  status: 'optimal_safe' | 'caution_heat' | 'danger_crowd' | 'invalid_before_zawal';
  titleBn: string;
  titleEn: string;
  adviceBn: string;
  adviceEn: string;
  recommendedWindowBn: string;
}

/**
 * Evaluates Jamarat stoning safety and Hanafi Fiqh validity for elderly Bangladeshi pilgrims.
 */
export function evaluateStoningWindow(
  day: 10 | 11 | 12 | 13,
  hour24: number
): StoningWindowAssessment {
  const h = ((hour24 % 24) + 24) % 24;

  if (day === 10) {
    if (h >= 6 && h <= 11) {
      return {
        status: 'danger_crowd',
        titleBn: 'সর্বোচ্চ ভিড় ও প্রচণ্ড রোদ (বয়স্কদের জন্য ঝুঁকিপূর্ণ)',
        titleEn: 'Peak Crowd & Heat (High Risk for Seniors)',
        adviceBn:
          '১০ই জিলহজ সকাল ৬টা থেকে ১১টা পর্যন্ত জামারাতে প্রচণ্ড ভিড় থাকে। বয়স্ক ও দুর্বল হাজীদের জন্য আসরের পর বা মাগরিবের পর কংকর মারা সবচেয়ে নিরাপদ (হানাফি মাজহাবে সুবহে সাদিকের আগ পর্যন্ত জায়েজ)।',
        adviceEn:
          'Extreme crowd between 6 AM and 11 AM on 10th Dhul Hijjah. Seniors should wait until after Asr or Maghrib (valid until next Fajr in Hanafi Fiqh).',
        recommendedWindowBn: 'বিকাল ৪:৩০ — রাত ১০:০০ (সবচেয়ে নিরাপদ)',
      };
    }
    if (h > 11 && h < 16) {
      return {
        status: 'caution_heat',
        titleBn: 'তীব্র ৪৫°C রোদ (ছাতা ও পানি সাথে রাখুন)',
        titleEn: 'Intense 45°C Midday Sun (Carry Umbrella & Water)',
        adviceBn:
          'ভিড় কিছুটা কমলেও দুপুরের রোদ অত্যন্ত তীব্র। বয়স্ক হাজীগণ আসরের পর গেলে হাঁটার কষ্ট অনেক কম হবে।',
        adviceEn:
          'Crowd is moderate but midday heat is severe. Waiting until after Asr reduces heat exhaustion.',
        recommendedWindowBn: 'বিকাল ৪:৩০ — রাত ১০:০০',
      };
    }
    return {
      status: 'optimal_safe',
      titleBn: 'নিরাপদ ও স্বস্তিদায়ক সময় (বাংলাদেশ মাকতাব)',
      titleEn: 'Safe & Comfortable Stoning Window',
      adviceBn:
        'এখন রোদ নেই এবং ভিড় স্বাভাবিক। শুধুমাত্র বড় জামারায় (জামারাতুল আকাবা) ৭টি কংকর নিক্ষেপ করুন এবং প্রথম কংকরের সাথে তালবিয়াহ পড়া বন্ধ করুন।',
      adviceEn:
        'Cooler temperature and calm crowd flow. Throw 7 pebbles at Jamarat al-Aqabah only and stop Talbiyah upon the first throw.',
      recommendedWindowBn: 'বিকাল ৪:৩০ — রাত ১০:০০ (চলমান)',
    };
  }

  // Days 11, 12, 13 Dhul Hijjah: In Hanafi Fiqh, stoning on 11-13 starts after Zawal (approx 12:15 PM)
  if (h >= 4 && h < 12) {
    return {
      status: 'invalid_before_zawal',
      titleBn: 'হানাফি ফিকহ সতর্কতা: এখন কংকর মারার ওয়াক্ত হয়নি!',
      titleEn: 'Hanafi Fiqh Warning: Before Zawal (Not Valid Yet)',
      adviceBn:
        `${day}ই জিলহজ সূর্য ঢলে পড়ার (জাওয়াল / দুপুর ১২:১৫) আগে কংকর নিক্ষেপ করলে হানাফি মাজহাব অনুযায়ী তা আদায় হবে না এবং পুনরায় মারতে হবে বা দম ওয়াজিব হবে।`,
      adviceEn:
        `On ${day}th Dhul Hijjah, stoning before Zawal (12:15 PM) is invalid in Hanafi Fiqh and must be repeated.`,
      recommendedWindowBn: 'বিকাল ৪:০০ — রাত ৯:৩০ (জাওয়ালের পর)',
    };
  }

  if (h >= 12 && h < 16) {
    return {
      status: 'caution_heat',
      titleBn: 'ওয়াক্ত শুরু হয়েছে কিন্তু বাইরে প্রচণ্ড রোদ ও ভিড়',
      titleEn: 'Valid Time Started, But Extreme Midday Heat & Rush',
      adviceBn:
        'জাওয়ালের পর পরই সব দেশের হাজী একসাথে বের হন এবং তাপমাত্রা ৪৫°C থাকে। বয়স্ক বাংলাদেশি হাজীগণ আসরের পর রওনা দিলে নিরাপদে ছোট, মধ্যম ও বড়—এই ৩ জামারায় ২১টি কংকর মারতে পারবেন।',
      adviceEn:
        'Post-Zawal rush and 45°C heat. Seniors should wait until after Asr to stone all 3 Jamarat (21 pebbles) safely.',
      recommendedWindowBn: 'বিকাল ৪:১৫ — রাত ৯:৩০',
    };
  }

  return {
    status: 'optimal_safe',
    titleBn: 'নিরাপদ সময় · ৩টি জামারায় ২১টি কংকর নিক্ষেপ করুন',
    titleEn: 'Safe Window · Stone All 3 Jamarat (21 Pebbles)',
    adviceBn:
      'প্রথমে ছোট জামারায় ৭টি (দোয়া সহ), এরপর মধ্যম জামারায় ৭টি (দোয়া সহ), এবং শেষে বড় জামারায় ৭টি কংকর মেরে না দাঁড়িয়ে ফিরে আসুন।',
    adviceEn:
      'Stone Small Jamarah (7 + Dua), Middle Jamarah (7 + Dua), then Large Jamarah (7, return immediately without standing for Dua).',
    recommendedWindowBn: 'বিকাল ৪:১৫ — রাত ১০:০০ (চলমান)',
  };
}

export interface TenDhulHijjahState {
  ramiDone: boolean;
  qurbaniDone: boolean;
  halqDone: boolean;
  tawafZiyarahDone: boolean;
}

export interface SequenceValidation {
  allowed: boolean;
  warningBn?: string;
  warningEn?: string;
}

/**
 * Validates the strict Hanafi Wajib sequence on 10th Dhul Hijjah:
 * 1. Rami (7 pebbles at Aqabah) -> 2. Qurbani (Hadi) -> 3. Halq/Taqsir (Shaving/Trimming).
 */
export function validateTenDhulHijjahSequence(
  state: TenDhulHijjahState,
  stepToToggle: keyof TenDhulHijjahState
): SequenceValidation {
  // If unchecking a step, always allow
  if (state[stepToToggle]) {
    return { allowed: true };
  }

  if (stepToToggle === 'qurbaniDone' && !state.ramiDone) {
    return {
      allowed: false,
      warningBn:
        'হানাফি ফিকহ সতর্কতা: ১০ই জিলহজ প্রথমে বড় জামারায় ৭টি কংকর নিক্ষেপ (রমি) করতে হবে, তারপর কুরবানি। অনুগ্রহ করে আগে কংকর নিক্ষেপ সম্পন্ন করুন।',
      warningEn:
        'Hanafi Fiqh Tartib Warning: You must complete Rami (7 pebbles at Large Jamarah) before Qurbani on 10th Dhul Hijjah.',
    };
  }

  if (stepToToggle === 'halqDone' && (!state.ramiDone || !state.qurbaniDone)) {
    return {
      allowed: false,
      warningBn:
        'হানাফি ওয়াজিব সতর্কতা: কংকর নিক্ষেপ এবং কুরবানি সম্পন্ন হওয়ার মেসেজ পাওয়ার আগে মাথার চুল কাটলে (হলক) হানাফি মাজহাব অনুযায়ী দম (অতিরিক্ত কুরবানি) ওয়াজিব হবে!',
      warningEn:
        'Hanafi Wajib Warning: Shaving/trimming hair (Halq) before completing Rami and confirming Qurbani incurs a Dam penalty in Hanafi Fiqh!',
    };
  }

  if (stepToToggle === 'tawafZiyarahDone' && !state.halqDone) {
    return {
      allowed: false,
      warningBn:
        'সুন্নাহ ও তারতীব পরামর্শ: আগে হলক (চুল কাটা) সম্পন্ন করে হালাল হয়ে সাধারণ কাপড়ে তাওয়াফে জিয়ারত করা সুন্নাত।',
      warningEn:
        'Complete Halq (shaving/trimming) first to exit Ihram before performing Tawaf al-Ziyarah.',
    };
  }

  return { allowed: true };
}

export interface IhramSectorRule {
  sector: 'jeddah' | 'madinah';
  headlineBn: string;
  headlineEn: string;
  wearLocationBn: string;
  miqatNameBn: string;
  instructionBn: string;
  instructionEn: string;
}

/**
 * Returns Hanafi Ihram rules based on whether the Biman/Saudia flight lands in Jeddah or Madinah first.
 */
export function getIhramRuleForSector(sector: 'jeddah' | 'madinah'): IhramSectorRule {
  if (sector === 'jeddah') {
    return {
      sector: 'jeddah',
      headlineBn: 'ঢাকা থেকেই ইহরামের কাপড় পরিধান আবশ্যক (জেদ্দা ফ্লাইট)',
      headlineEn: 'Wear Ihram from Dhaka Airport (Jeddah First Sector)',
      wearLocationBn: 'আশকোনা হজ ক্যাম্প বা ঢাকা বিমানবন্দর (বিমানে ওঠার আগে)',
      miqatNameBn: 'মিকাত: ইয়ালামলাম / কারনুল মানাযিল (বিমানের ভেতরে অতিক্রম হবে)',
      instructionBn:
        'আপনার ফ্লাইট প্রথমে জেদ্দায় নামবে। তাই ঢাকা থেকেই অজু-গোসল করে ইহরামের সাদা দুই খণ্ড কাপড় পরে বিমানে উঠুন। বিমান উড্ডয়নের পর মিকাত পৌঁছানোর আগেই উমরাহর নিয়ত ও তালবিয়াহ পাঠ শুরু করুন। জেদ্দায় নেমে ইহরাম বাঁধলে দম দিতে হবে।',
      instructionEn:
        'Your flight lands in Jeddah first (inside the Miqat boundary). Put on Ihram garments at Dhaka before boarding, and make Niyyah + Talbiyah in the aircraft before crossing Miqat Yalamlam.',
    };
  }

  return {
    sector: 'madinah',
    headlineBn: 'ঢাকা থেকে ইহরাম বাঁধতে হবে না (মদিনা ফ্লাইট)',
    headlineEn: 'No Ihram Needed from Dhaka (Madinah First Sector)',
    wearLocationBn: 'মদিনা থেকে মক্কায় যাওয়ার সময় (যুল হুলাইফা / আবইয়ারে আলী)',
    miqatNameBn: 'মিকাত: যুল হুলাইফা (মসজিদে শাজারাহ / আবইয়ারে আলী, মদিনা)',
    instructionBn:
      'আপনার ফ্লাইট সরাসরি মদিনা শরীফে নামবে। তাই ঢাকা থেকে সাধারণ সেলাইযুক্ত পোশাকেই বিমানে উঠুন। মদিনায় ৮ দিন অবস্থান শেষে যখন মক্কা শরীফে রওনা হবেন, তখন মদিনার মিকাত "যুল হুলাইফা (আবইয়ারে আলী)" থেকে ইহরাম বাঁধবেন।',
    instructionEn:
      'Your flight lands in Madinah first. Travel in regular clothes from Dhaka. You will enter Ihram later at Miqat Dhul Hulayfah (Abyar Ali) when departing Madinah for Makkah.',
  };
}

export type HolySiteLocationId = 'arafat' | 'madinah' | 'makkah' | 'mina' | 'jamarat';

export interface GpsCoordinatePreset {
  id: HolySiteLocationId;
  nameBn: string;
  nameEn: string;
  lat: number;
  lng: number;
}

export const HOLY_SITE_COORDINATES: Record<HolySiteLocationId, GpsCoordinatePreset> = {
  arafat: {
    id: 'arafat',
    nameBn: 'আরাফাত ময়দান (জাবালে রহমত)',
    nameEn: 'Mount Arafat (Jabal al-Rahmah)',
    lat: 21.3549,
    lng: 39.9841,
  },
  madinah: {
    id: 'madinah',
    nameBn: 'মদিনা শরীফ (মসজিদে নববী)',
    nameEn: 'Madinah (Masjid an-Nabawi)',
    lat: 24.4672,
    lng: 39.6111,
  },
  makkah: {
    id: 'makkah',
    nameBn: 'মক্কা শরীফ (পবিত্র কাবা)',
    nameEn: 'Makkah (Holy Kaaba)',
    lat: 21.4225,
    lng: 39.8262,
  },
  mina: {
    id: 'mina',
    nameBn: 'মিনা তাঁবু শহর (মাকতাব ৪২)',
    nameEn: 'Mina Tent Valley (Maktab 42)',
    lat: 21.4133,
    lng: 39.8933,
  },
  jamarat: {
    id: 'jamarat',
    nameBn: 'জামারাত সেতু ও মুযদালিফা',
    nameEn: 'Jamarat Bridge & Muzdalifah',
    lat: 21.42,
    lng: 39.873,
  },
};

/**
 * Calculates great-circle distance in meters between two GPS coordinates using the Haversine formula.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface GpsLocationResolution {
  locationId: HolySiteLocationId;
  nearestSiteBn: string;
  nearestSiteEn: string;
  distanceToSiteMeters: number;
  isInsideArafatOfficialBoundary: boolean;
  isInWadiUranahWarningZone: boolean;
}

/**
 * Resolves user GPS coordinates (lat, lng) to the relevant Hajj/Umrah holy site
 * (Arafat, Madinah, Mina, Jamarat, or Makkah) to drive high-contrast contextual imagery.
 */
export function resolveHolySiteFromGps(
  lat: number,
  lng: number
): GpsLocationResolution {
  // 1. Check Madinah region first (approx 24.46°N, 39.61°E)
  const distMadinah = calculateHaversineDistanceMeters(
    lat,
    lng,
    HOLY_SITE_COORDINATES.madinah.lat,
    HOLY_SITE_COORDINATES.madinah.lng
  );
  if (lat >= 23.0 || distMadinah <= 50000) {
    return {
      locationId: 'madinah',
      nearestSiteBn: HOLY_SITE_COORDINATES.madinah.nameBn,
      nearestSiteEn: HOLY_SITE_COORDINATES.madinah.nameEn,
      distanceToSiteMeters: distMadinah,
      isInsideArafatOfficialBoundary: false,
      isInWadiUranahWarningZone: false,
    };
  }

  // 2. Check Arafat geofence (approx 21.32°N–21.39°N, 39.93°E–40.03°E)
  const distArafat = calculateHaversineDistanceMeters(
    lat,
    lng,
    HOLY_SITE_COORDINATES.arafat.lat,
    HOLY_SITE_COORDINATES.arafat.lng
  );
  if (distArafat <= 5500 || (lat >= 21.32 && lat <= 21.385 && lng >= 39.935 && lng <= 40.025)) {
    const inWadiUranah = lng < 39.948;
    return {
      locationId: 'arafat',
      nearestSiteBn: HOLY_SITE_COORDINATES.arafat.nameBn,
      nearestSiteEn: HOLY_SITE_COORDINATES.arafat.nameEn,
      distanceToSiteMeters: distArafat,
      isInsideArafatOfficialBoundary: !inWadiUranah,
      isInWadiUranahWarningZone: inWadiUranah,
    };
  }

  // 3. Compare distances among Mina, Jamarat, and Makkah (Masjid al-Haram)
  const candidates: Array<{ id: HolySiteLocationId; dist: number }> = (
    ['mina', 'jamarat', 'makkah'] as const
  ).map((id) => ({
    id,
    dist: calculateHaversineDistanceMeters(
      lat,
      lng,
      HOLY_SITE_COORDINATES[id].lat,
      HOLY_SITE_COORDINATES[id].lng
    ),
  }));

  candidates.sort((a, b) => a.dist - b.dist);
  const closest = candidates[0];
  const preset = HOLY_SITE_COORDINATES[closest.id];

  return {
    locationId: closest.id,
    nearestSiteBn: preset.nameBn,
    nearestSiteEn: preset.nameEn,
    distanceToSiteMeters: closest.dist,
    isInsideArafatOfficialBoundary: false,
    isInWadiUranahWarningZone: false,
  };
}

export type HaramFloorId = 'ground_mataf' | 'first_floor' | 'roof_level' | 'wheelchair_lane';

export interface TawafStravaMetrics {
  currentLap: number; // 1..7
  todayLapsCompleted: number;
  todayFullTawafs: number;
  hajjTargetTawafs: number;
  hajjCompletedTawafs: number;
  hajjRemainingTawafs: number;
  hajjGoalCompletionPercent: number;
  currentLapRingPercent: number;
  distanceKm: number;
  durationFormatted: string;
  avgPaceFormatted: string;
  estimatedCalories: number;
}

const FLOOR_LAP_DISTANCE_KM: Record<HaramFloorId, number> = {
  ground_mataf: 0.35, // ~350m per lap on Mataf courtyard (2.45 km per 7 laps)
  first_floor: 0.62, // ~620m per lap on First Floor
  roof_level: 0.78, // ~780m per lap on Roof
  wheelchair_lane: 0.68, // ~680m per lap on Mezzanine Wheelchair track
};

/**
 * Computes Strava-style Tawaf summary metrics (Distance km, Duration, Avg Pace, Calories,
 * and Remaining Tawafs out of the user's Hajj goal e.g. 50).
 */
export function calculateTawafSummaryMetrics(params: {
  currentLap: number;
  todayLapsCompleted: number;
  elapsedSeconds: number;
  hajjTargetTawafs: number;
  hajjCompletedTawafs: number;
  floor: HaramFloorId;
}): TawafStravaMetrics {
  const safeCurrentLap = Math.min(7, Math.max(0, Math.round(params.currentLap)));
  const safeTodayLaps = Math.max(safeCurrentLap, Math.round(params.todayLapsCompleted));
  const lapDistKm = FLOOR_LAP_DISTANCE_KM[params.floor] || 0.35;

  const distanceKm = Math.round(safeTodayLaps * lapDistKm * 100) / 100;
  const safeSeconds = Math.max(60, Math.round(params.elapsedSeconds));

  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  const durationFormatted =
    hrs > 0
      ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Pace in min/km (Strava style)
  const paceSecondsPerKm = distanceKm > 0 ? Math.round(safeSeconds / distanceKm) : 390;
  const paceMin = Math.floor(paceSecondsPerKm / 60);
  const paceSec = paceSecondsPerKm % 60;
  const avgPaceFormatted = `${paceMin}:${String(paceSec).padStart(2, '0')}`;

  const estimatedCalories = Math.round(distanceKm * 68);

  const safeTarget = Math.max(1, Math.round(params.hajjTargetTawafs));
  const safeCompleted = Math.max(0, Math.round(params.hajjCompletedTawafs));
  const hajjRemainingTawafs = Math.max(0, safeTarget - safeCompleted);
  const hajjGoalCompletionPercent = Math.min(
    100,
    Math.round((safeCompleted / safeTarget) * 100)
  );
  const currentLapRingPercent = Math.min(100, Math.round((safeCurrentLap / 7) * 100));

  return {
    currentLap: safeCurrentLap,
    todayLapsCompleted: safeTodayLaps,
    todayFullTawafs: Math.floor(safeTodayLaps / 7),
    hajjTargetTawafs: safeTarget,
    hajjCompletedTawafs: safeCompleted,
    hajjRemainingTawafs,
    hajjGoalCompletionPercent,
    currentLapRingPercent,
    distanceKm,
    durationFormatted,
    avgPaceFormatted,
    estimatedCalories,
  };
}

export interface FloorTrafficStatus {
  floor: HaramFloorId;
  floorNameBn: string;
  floorNameEn: string;
  baselineMinutesFor7Laps: number;
  currentAvgMinutesFor7Laps: number;
  delayMinutes: number;
  activeAppPilgrimsCount: number;
  trafficLevel: 'green_fast' | 'yellow_moderate' | 'red_congested';
  statusBadgeBn: string;
  statusBadgeEn: string;
  recommendationBn: string;
}

/**
 * Analyzes crowdsourced Tawaf lap durations from app users to produce a Google-Maps-style
 * live congestion & timing recommendation.
 */
export function analyzeTawafCrowdTraffic(
  floor: HaramFloorId,
  recentLapDurationsSeconds: number[],
  activePilgrimsCount: number
): FloorTrafficStatus {
  const floorMeta: Record<
    HaramFloorId,
    { nameBn: string; nameEn: string; baseline7LapsMin: number }
  > = {
    ground_mataf: {
      nameBn: 'মাতাফ চত্বর (কাবার সামনে নিচতলা)',
      nameEn: 'Ground Mataf Courtyard',
      baseline7LapsMin: 35,
    },
    first_floor: {
      nameBn: 'প্রথম তলা (১ম ফ্লোর রিং)',
      nameEn: 'First Floor Mataf Ring',
      baseline7LapsMin: 48,
    },
    roof_level: {
      nameBn: 'ছাদ তলা (খোলা ছাদ)',
      nameEn: 'Roof Level Mataf',
      baseline7LapsMin: 55,
    },
    wheelchair_lane: {
      nameBn: 'হুইলচেয়ার ও বয়স্কদের বিশেষ লেন',
      nameEn: 'Wheelchair & Senior Mezzanine',
      baseline7LapsMin: 42,
    },
  };

  const meta = floorMeta[floor];
  const validSamples = recentLapDurationsSeconds.filter((s) => s >= 120 && s <= 1800);
  const avgLapSec =
    validSamples.length > 0
      ? validSamples.reduce((acc, v) => acc + v, 0) / validSamples.length
      : (meta.baseline7LapsMin * 60) / 7;

  const currentAvgMinutesFor7Laps = Math.round((avgLapSec * 7) / 60);
  const delayMinutes = currentAvgMinutesFor7Laps - meta.baseline7LapsMin;

  if (delayMinutes <= 5) {
    return {
      floor,
      floorNameBn: meta.nameBn,
      floorNameEn: meta.nameEn,
      baseline7LapsMin: meta.baseline7LapsMin,
      baselineMinutesFor7Laps: meta.baseline7LapsMin,
      currentAvgMinutesFor7Laps,
      delayMinutes: Math.max(0, delayMinutes),
      activeAppPilgrimsCount: Math.max(1, activePilgrimsCount),
      trafficLevel: 'green_fast',
      statusBadgeBn: 'সবুজ সংকেত · এখন তাওয়াফের উত্তম সময় (ভিড় কম)',
      statusBadgeEn: 'Green Traffic · Great Time for Tawaf (Fast Flow)',
      recommendationBn: `অন্যান্য হাজীদের লাইভ ডেটা অনুযায়ী এখন ${meta.nameBn}-এ মাত্র ~${currentAvgMinutesFor7Laps} মিনিটে ৭ চক্কর সম্পন্ন হচ্ছে। এখন তাওয়াফ শুরু করার উপযুক্ত সময়!`,
    } as FloorTrafficStatus;
  }

  if (delayMinutes <= 16) {
    return {
      floor,
      floorNameBn: meta.nameBn,
      floorNameEn: meta.nameEn,
      baselineMinutesFor7Laps: meta.baseline7LapsMin,
      currentAvgMinutesFor7Laps,
      delayMinutes,
      activeAppPilgrimsCount: Math.max(1, activePilgrimsCount),
      trafficLevel: 'yellow_moderate',
      statusBadgeBn: `মাঝারি ভিড় · স্বাভাবিকের চেয়ে +${delayMinutes} মিনিট বেশি লাগছে`,
      statusBadgeEn: `Moderate Traffic · +${delayMinutes} min slower than usual`,
      recommendationBn: `বর্তমানে ${activePilgrimsCount} জন অ্যাপ ব্যবহারকারীর ডেটা অনুযায়ী ৭ চক্করে ~${currentAvgMinutesFor7Laps} মিনিট লাগছে (স্বাভাবিক ${meta.baseline7LapsMin} মিনিট)। বয়স্করা ১ম তলা বা হুইলচেয়ার লেন ব্যবহার করতে পারেন।`,
    };
  }

  return {
    floor,
    floorNameBn: meta.nameBn,
    floorNameEn: meta.nameEn,
    baselineMinutesFor7Laps: meta.baseline7LapsMin,
    currentAvgMinutesFor7Laps,
    delayMinutes,
    activeAppPilgrimsCount: Math.max(1, activePilgrimsCount),
    trafficLevel: 'red_congested',
    statusBadgeBn: `অতিরিক্ত ভিড় (লাল সংকেত) · +${delayMinutes} মিনিট বেশি সময় লাগছে`,
    statusBadgeEn: `Heavy Congestion · +${delayMinutes} min slower than normal`,
    recommendationBn: `সতর্কতা: অন্যান্য হাজীদের লাইভ ডেটা অনুযায়ী এখন প্রচণ্ড ভিড়ের কারণে ৭ চক্করে ~${currentAvgMinutesFor7Laps} মিনিট লাগছে। বয়স্ক হাজীদের ৩০-৪৫ মিনিট অপেক্ষা করার বা ছাদ/হুইলচেয়ার লেনে যাওয়ার পরামর্শ দেওয়া হচ্ছে।`,
  };
}

export interface AnonymousTawafSessionSample {
  sessionId: string;
  anonymousBadgeBn: string;
  floor: HaramFloorId;
  completedDurationMinutes: number;
  reportedAgoBn: string;
}

export interface HourlyTawafDensitySlot {
  slotId: string;
  labelBn: string;
  labelEn: string;
  avgDurationMinutes: number;
  densityPercent: number; // 0..100 for Google-Maps-style bar height
  trafficLevel: 'green_fast' | 'yellow_moderate' | 'red_congested';
  isCurrentWindow?: boolean;
}

export interface OverallTawafInsightsSummary {
  isGoodTimeNow: boolean;
  overallTrafficLevel: 'green_fast' | 'yellow_moderate' | 'red_congested';
  weightedAvgSessionMinutes: number;
  totalAnonymousPilgrims: number;
  bestFloor: FloorTrafficStatus;
  groundMatafStatus: FloorTrafficStatus;
  verdictHeadlineBn: string;
  verdictHeadlineEn: string;
  verdictDetailBn: string;
  hourlyForecast: HourlyTawafDensitySlot[];
}

/**
 * Aggregates anonymous pilgrim session telemetry across all 4 Haram floors
 * into a Google-Maps-style "Is now a good time for Tawaf?" decision summary
 * and popular-times hourly density forecast.
 */
export function evaluateOverallTawafRecommendation(
  floorStatuses: FloorTrafficStatus[]
): OverallTawafInsightsSummary {
  const safeStatuses =
    floorStatuses.length > 0
      ? floorStatuses
      : [analyzeTawafCrowdTraffic('ground_mataf', [360, 370], 120)];

  const totalAnonymousPilgrims = safeStatuses.reduce(
    (sum, f) => sum + f.activeAppPilgrimsCount,
    0
  );

  const weightedSum = safeStatuses.reduce(
    (sum, f) => sum + f.currentAvgMinutesFor7Laps * f.activeAppPilgrimsCount,
    0
  );
  const weightedAvgSessionMinutes =
    totalAnonymousPilgrims > 0
      ? Math.round(weightedSum / totalAnonymousPilgrims)
      : safeStatuses[0].currentAvgMinutesFor7Laps;

  const groundMatafStatus =
    safeStatuses.find((f) => f.floor === 'ground_mataf') || safeStatuses[0];

  // Pick floor with lowest relative delay (or fastest absolute time when delays are equal)
  const sortedByBest = [...safeStatuses].sort((a, b) => {
    if (a.delayMinutes !== b.delayMinutes) {
      return a.delayMinutes - b.delayMinutes;
    }
    return a.currentAvgMinutesFor7Laps - b.currentAvgMinutesFor7Laps;
  });
  const bestFloor = sortedByBest[0];

  const isGoodTimeNow =
    groundMatafStatus.trafficLevel === 'green_fast' ||
    (groundMatafStatus.trafficLevel === 'yellow_moderate' &&
      bestFloor.trafficLevel === 'green_fast');

  const overallTrafficLevel = groundMatafStatus.trafficLevel;

  let verdictHeadlineBn = '';
  let verdictHeadlineEn = '';
  let verdictDetailBn = '';

  if (groundMatafStatus.trafficLevel === 'green_fast') {
    verdictHeadlineBn = 'হ্যাঁ, এখন তাওয়াফ করার সর্বত্তম সময় (ভিড় কম · সবুজ সংকেত)';
    verdictHeadlineEn = 'Yes — Great Time to Perform Tawaf Now (Low Crowd Density)';
    verdictDetailBn = `${totalAnonymousPilgrims} জন হাজীর অ্যানোনিমাস সেশন ডেটা অনুযায়ী এখন মাতাফ চত্বরে গড়ে মাত্র ~${groundMatafStatus.currentAvgMinutesFor7Laps} মিনিটে পূর্ণ তাওয়াফ (৭ চক্কর) শেষ হচ্ছে।`;
  } else if (groundMatafStatus.trafficLevel === 'yellow_moderate') {
    verdictHeadlineBn = `মাঝারি ভিড় — এখন ${bestFloor.floorNameBn} দিয়ে তাওয়াফ করা উত্তম`;
    verdictHeadlineEn = `Moderate Crowd — Recommended via ${bestFloor.floorNameEn}`;
    verdictDetailBn = `নিচতলা মাতাফে এখন ৭ চক্করে ~${groundMatafStatus.currentAvgMinutesFor7Laps} মিনিট লাগছে (+${groundMatafStatus.delayMinutes} মি. ধীর), তবে ${bestFloor.floorNameBn}-এ স্বাভাবিক গতিতে (~${bestFloor.currentAvgMinutesFor7Laps} মিনিটে) তাওয়াফ চলছে।`;
  } else {
    verdictHeadlineBn = 'এখন প্রচণ্ড ভিড় (লাল সংকেত) — ৪৫ মিনিট অপেক্ষা করা বা হুইলচেয়ার লেন উত্তম';
    verdictHeadlineEn = 'Heavy Crowd Right Now — Consider Waiting 45 Mins or Using Upper Ring';
    verdictDetailBn = `${totalAnonymousPilgrims} জন হাজীর লাইভ ডেটা অনুযায়ী এখন নিচতলা মাতাফে ৭ চক্কর শেষ করতে ~${groundMatafStatus.currentAvgMinutesFor7Laps} মিনিট লাগছে। বয়স্ক হাজীদের কিছুক্ষণ বিশ্রাম নিয়ে বা ${bestFloor.floorNameBn} ব্যবহারের পরামর্শ দেওয়া হচ্ছে।`;
  }

  const liveMin = groundMatafStatus.currentAvgMinutesFor7Laps;
  const liveDensity = Math.min(100, Math.max(25, Math.round((liveMin / 70) * 100)));

  const hourlyForecast: HourlyTawafDensitySlot[] = [
    {
      slotId: 'tahajjud_2am',
      labelBn: 'রাত ২টা (তাহাজ্জুদ)',
      labelEn: '2 AM',
      avgDurationMinutes: 33,
      densityPercent: 42,
      trafficLevel: 'green_fast',
    },
    {
      slotId: 'post_fajr_6am',
      labelBn: 'সকাল ৬টা (ফজর পর)',
      labelEn: '6 AM',
      avgDurationMinutes: 46,
      densityPercent: 64,
      trafficLevel: 'yellow_moderate',
    },
    {
      slotId: 'morning_9am',
      labelBn: 'সকাল ৯টা',
      labelEn: '9 AM',
      avgDurationMinutes: 36,
      densityPercent: 48,
      trafficLevel: 'green_fast',
    },
    {
      slotId: 'dhuhr_asr_2pm',
      labelBn: 'দুপুর ২টা (রোদ কম ভিড়)',
      labelEn: '2 PM',
      avgDurationMinutes: 38,
      densityPercent: 52,
      trafficLevel: 'green_fast',
    },
    {
      slotId: 'maghrib_isha_8pm',
      labelBn: 'রাত ৮টা (মাগরিব-এশা)',
      labelEn: '8 PM',
      avgDurationMinutes: 62,
      densityPercent: 92,
      trafficLevel: 'red_congested',
    },
    {
      slotId: 'live_now',
      labelBn: 'এখন (লাইভ)',
      labelEn: 'LIVE NOW',
      avgDurationMinutes: liveMin,
      densityPercent: liveDensity,
      trafficLevel: groundMatafStatus.trafficLevel,
      isCurrentWindow: true,
    },
  ];

  return {
    isGoodTimeNow,
    overallTrafficLevel,
    weightedAvgSessionMinutes,
    totalAnonymousPilgrims,
    bestFloor,
    groundMatafStatus,
    verdictHeadlineBn,
    verdictHeadlineEn,
    verdictDetailBn,
    hourlyForecast,
  };
}

export type HajjChecklistCategoryId =
  | 'documents'
  | 'ihram_clothing'
  | 'medication'
  | 'electronics_essentials';

export interface HajjChecklistItem {
  id: string;
  categoryId: HajjChecklistCategoryId;
  titleBn: string;
  titleEn: string;
  noteBn: string;
  isCritical: boolean;
  defaultChecked: boolean;
}

export const DEFAULT_HAJJ_CHECKLIST_ITEMS: HajjChecklistItem[] = [
  // Category 1: Documents & Permits
  {
    id: 'doc_passport_visa',
    categoryId: 'documents',
    titleBn: 'ই-পাসপোর্ট, হজ ভিসার প্রিন্ট কপি ও রিটার্ন বিমান টিকিট',
    titleEn: 'E-Passport, Printed Hajj Visa & Return Flight Ticket',
    noteBn: 'গলায় ঝোলানো ওয়াটারপ্রুফ পাউচে সবসময় সাথে রাখুন',
    isCritical: true,
    defaultChecked: true,
  },
  {
    id: 'doc_nusuk_pid',
    categoryId: 'documents',
    titleBn: 'নুসুক (Nusuk) স্মার্ট কার্ড ও বাংলাদেশ ১১-সংখ্যার পিআইডি ব্যাজ',
    titleEn: 'Nusuk Smart Card & Bangladesh 11-Digit PID Badge',
    noteBn: 'মসজিদুল হারাম ও মিনার তাঁবুতে প্রবেশের জন্য বাধ্যতামূলক',
    isCritical: true,
    defaultChecked: true,
  },
  {
    id: 'doc_vaccine_card',
    categoryId: 'documents',
    titleBn: 'মেনিনজাইটিস ও পোলিও টিকার আন্তর্জাতিক হলুদ কার্ড',
    titleEn: 'Meningitis & Polio International Yellow Vaccine Card',
    noteBn: 'জেদ্দা ও মদিনা ইমিগ্রেশনে স্বাস্থ্য পরীক্ষায় প্রয়োজন হয়',
    isCritical: true,
    defaultChecked: true,
  },
  {
    id: 'doc_hotel_maktab_card',
    categoryId: 'documents',
    titleBn: 'মক্কা-মদিনা হোটেল কার্ড, মাকতাব নম্বর ও মোয়াল্লেমের মোবাইল নম্বর',
    titleEn: 'Makkah/Madinah Hotel Card, Maktab ID & Moallem Phone',
    noteBn: 'হারিয়ে গেলে পুলিশ বা স্বেচ্ছাসেবককে দেখানোর জন্য আরবি ঠিকানাসহ',
    isCritical: false,
    defaultChecked: false,
  },

  // Category 2: Ahram & Clothing
  {
    id: 'ihram_two_sets',
    categoryId: 'ihram_clothing',
    titleBn: '২ সেট সাদা সুতি ইহরামের কাপড় ও কোমরের বেল্ট / সেফটি পিন',
    titleEn: '2 Sets White Cotton Ahram Towels & Waist Belt',
    noteBn: 'জেদ্দা ফ্লাইট হলে ঢাকা থেকেই ১ সেট হ্যান্ডব্যাগে রাখুন',
    isCritical: true,
    defaultChecked: true,
  },
  {
    id: 'ihram_sandals',
    categoryId: 'ihram_clothing',
    titleBn: 'গোড়ালি ও পায়ের পাতার উঁচু হাড় খোলা নরম ওয়াকিং স্যান্ডেল',
    titleEn: 'Ankle-Uncovered Soft Walking Sandals (Hanafi Ahram Rule)',
    noteBn: 'হানাফি মাজহাব অনুযায়ী পুরুষদের পায়ের উঁচু হাড় খোলা থাকা জরুরি',
    isCritical: true,
    defaultChecked: false,
  },
  {
    id: 'ihram_unscented_care',
    categoryId: 'ihram_clothing',
    titleBn: 'সুগন্ধিমুক্ত (Unscented) সাবান, পেট্রোলিয়াম জেলি ও ভেসলিন',
    titleEn: 'Unscented Soap & Unscented Petroleum Jelly (Anti-Chafing)',
    noteBn: 'ইহরাম অবস্থায় সুগন্ধিযুক্ত সাবান ব্যবহার নিষিদ্ধ; হাঁটার ঘর্ষণ রোধে ভেসলিন জরুরি',
    isCritical: false,
    defaultChecked: false,
  },
  {
    id: 'ihram_cotton_clothes',
    categoryId: 'ihram_clothing',
    titleBn: 'হালকা সুতি পাঞ্জাবি-পায়জামা / মা-বোনদের ঢিলেঢালা সুতি বোরকা ও মোজা',
    titleEn: 'Breathable Cotton Panjabi / Loose Cotton Abaya & Socks',
    noteBn: 'মক্কা ও মিনার ৪৫°C গরমে আরামদায়ক চলাফেরার জন্য',
    isCritical: false,
    defaultChecked: true,
  },

  // Category 3: Medication & First Aid
  {
    id: 'med_regular_30days',
    categoryId: 'medication',
    titleBn: '৪০ দিনের প্রেসার, ডায়াবেটিস ও হার্টের নিয়মিত ওষুধ + ডাক্তারের প্রেসক্রিপশন',
    titleEn: '40-Day Regular BP/Diabetes/Heart Meds + English Prescription',
    noteBn: 'কমপক্ষে ১০ দিনের ওষুধ ও প্রেসক্রিপশন অবশ্যই হ্যান্ডব্যাগে রাখুন',
    isCritical: true,
    defaultChecked: false,
  },
  {
    id: 'med_ors_heatstroke',
    categoryId: 'medication',
    titleBn: 'খাবার স্যালাইন (ORS ১৫ প্যাকেট), গ্লুকোজ ও হিটস্ট্রোক সুরক্ষা কিট',
    titleEn: 'Oral Rehydration Salts (15 ORS Packets) & Glucose',
    noteBn: 'মিনা ও আরাফাতের প্রচণ্ড রোদে পানিশূন্যতা রোধে প্রতিদিন ১-২ প্যাকেট',
    isCritical: true,
    defaultChecked: false,
  },
  {
    id: 'med_first_aid_pain',
    categoryId: 'medication',
    titleBn: 'প্যারাসিটামল, গ্যাস্ট্রিকের ওষুধ, কাশির লজেন্স, ব্যথানাশক জেল ও ব্যান্ড-এইড',
    titleEn: 'Paracetamol, Antacid, Cough Lozenges, Pain Gel & Band-Aids',
    noteBn: 'তাওয়াফ ও সাঈ করার পর পায়ের পেশির ব্যথা ও ফোসকা রোধে',
    isCritical: false,
    defaultChecked: false,
  },

  // Category 4: Sun Protection, Electronics & Daily Essentials
  {
    id: 'ess_uv_umbrella',
    categoryId: 'electronics_essentials',
    titleBn: 'সাদা ইউভি (UV) ছাতা, রোদচশমা ও পানির স্প্রে বোতল',
    titleEn: 'White UV Sun Umbrella, Sunglasses & Water Mist Spray Bottle',
    noteBn: 'আরাফাত ও মিনায় ৪৫°C রোদে মাথার তাপ কমানোর জন্য অপরিহার্য',
    isCritical: true,
    defaultChecked: false,
  },
  {
    id: 'ess_powerbank_adapter',
    categoryId: 'electronics_essentials',
    titleBn: '১০,০০০ mAh পাওয়ার ব্যাংক (হ্যান্ডব্যাগে) ও সৌদি ৩-পিন মাল্টিপ্লাগ',
    titleEn: '10,000mAh Power Bank (in Carry-On) & Saudi Type-G 3-Pin Adapter',
    noteBn: 'সতর্কতা: পাওয়ার ব্যাংক কখনোই বড় লাগেজে (Check-in Bag) দেবেন না',
    isCritical: false,
    defaultChecked: true,
  },
  {
    id: 'ess_muzdalifah_mat_pouch',
    categoryId: 'electronics_essentials',
    titleBn: 'মুযদালিফার হালকা ফোল্ডিং জায়নামাজ/ম্যাট, জুতার ব্যাগ ও ৭০টি কংকরের থলে',
    titleEn: 'Folding Muzdalifah Mat, Shoe Bag & 70-Pebble Jamarat Pouch',
    noteBn: 'হারামে জুতা হারানো রোধে কাপড়ের থলে ও মুযদালিফায় রাত্রিযাপনের ম্যাট',
    isCritical: false,
    defaultChecked: false,
  },
];

export interface ChecklistCategoryStat {
  total: number;
  completed: number;
  percent: number;
}

export interface ChecklistProgressSummary {
  totalCount: number;
  completedCount: number;
  remainingCount: number;
  completionPercent: number;
  criticalTotal: number;
  criticalCompleted: number;
  criticalRemaining: number;
  allCriticalReady: boolean;
  byCategory: Record<HajjChecklistCategoryId, ChecklistCategoryStat>;
}

/**
 * Computes categorized and critical completion progress for the pilgrim's Hajj Checklist.
 */
export function calculateChecklistProgress(
  items: HajjChecklistItem[],
  completionMap: Record<string, boolean>
): ChecklistProgressSummary {
  const categories: HajjChecklistCategoryId[] = [
    'documents',
    'ihram_clothing',
    'medication',
    'electronics_essentials',
  ];

  const byCategory: Record<HajjChecklistCategoryId, ChecklistCategoryStat> = {
    documents: { total: 0, completed: 0, percent: 0 },
    ihram_clothing: { total: 0, completed: 0, percent: 0 },
    medication: { total: 0, completed: 0, percent: 0 },
    electronics_essentials: { total: 0, completed: 0, percent: 0 },
  };

  let totalCount = 0;
  let completedCount = 0;
  let criticalTotal = 0;
  let criticalCompleted = 0;

  for (const item of items) {
    const isDone =
      completionMap[item.id] !== undefined
        ? Boolean(completionMap[item.id])
        : item.defaultChecked;

    totalCount += 1;
    if (isDone) {
      completedCount += 1;
    }

    if (item.isCritical) {
      criticalTotal += 1;
      if (isDone) {
        criticalCompleted += 1;
      }
    }

    const catStat = byCategory[item.categoryId];
    if (catStat) {
      catStat.total += 1;
      if (isDone) {
        catStat.completed += 1;
      }
    }
  }

  for (const cat of categories) {
    const c = byCategory[cat];
    c.percent = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;
  }

  const remainingCount = Math.max(0, totalCount - completedCount);
  const completionPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const criticalRemaining = Math.max(0, criticalTotal - criticalCompleted);
  const allCriticalReady = criticalRemaining === 0;

  return {
    totalCount,
    completedCount,
    remainingCount,
    completionPercent,
    criticalTotal,
    criticalCompleted,
    criticalRemaining,
    allCriticalReady,
    byCategory,
  };
}



