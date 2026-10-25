import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Star,
  Plane,
  Building2,
  Compass,
  Volume2,
  ShieldCheck,
  Sparkles,
  Flag,
  Navigation,
} from 'lucide-react';
import { HajjPhaseId, PilgrimProfile } from '../data/hajjData';
import { HolySiteLocationId, HOLY_SITE_COORDINATES } from '../utils/hajjLogic';
import { speakText } from '../utils/speech';
import type { PilgrimGpsTrackerState } from '../App';

export type LocationSceneId = HolySiteLocationId;

interface LocationSceneMeta {
  id: LocationSceneId;
  cityBadgeBn: string;
  cityBadgeEn: string;
  durationBadgeBn: string;
  durationBadgeEn: string;
  frostedTagBn: string;
  frostedTagEn: string;
  headlineBn: string;
  headlineEn: string;
  locationLineBn: string;
  locationLineEn: string;
  rating: string;
  amenitiesBn: [string, string, string, string];
  audioSummaryBn: string;
  correspondingPhase: HajjPhaseId;
}

export const LOCATION_SCENES: Record<LocationSceneId, LocationSceneMeta> = {
  arafat: {
    id: 'arafat',
    cityBadgeBn: 'আরাফাত (Arafat)',
    cityBadgeEn: 'Mount Arafat',
    durationBadgeBn: '৯ই জিলহজ · ওকুফে আরাফাহ',
    durationBadgeEn: '9 Dhul Hijjah · Wuquf',
    frostedTagBn: 'ফরজ রুকন · আরাফাত সীমানা যাচাইকৃত',
    frostedTagEn: 'Fard Rukn · Boundary Verified',
    headlineBn: 'আরাফাতের ময়দান ও জাবালে রহমত — দোয়া কবুলের শ্রেষ্ঠ দিন',
    headlineEn: 'Plains of Arafat & Jabal al-Rahmah — Day of Wuquf',
    locationLineBn: 'আরাফাত ময়দান, মক্কা (ওয়াদি উরানাহর বাইরে)',
    locationLineEn: 'Mount Arafat, Makkah (Inside Official Boundary)',
    rating: '5.0',
    amenitiesBn: ['জিপিএস সীমানা ওকে', 'মাকতাব ৪২ তাঁবু', 'ইস্তিগফার ও দোয়া', 'মাগরিব মুযদালিফায়'],
    audioSummaryBn:
      'আপনি এখন আরাফাতের পবিত্র ময়দানে জাবালে রহমতের সন্নিকটে অবস্থান করছেন। সূর্যাস্ত পর্যন্ত কেবলামুখী হয়ে দোয়া ও ইস্তিগফার জারি রাখুন এবং মাগরিবের নামাজ না পড়ে মুযদালিফায় রওনা হোন।',
    correspondingPhase: 'arafat9',
  },
  madinah: {
    id: 'madinah',
    cityBadgeBn: 'মদিনা (Madinah)',
    cityBadgeEn: 'Madinah',
    durationBadgeBn: '৮ দিন অবস্থান · মদিনা শরীফ',
    durationBadgeEn: '8 Days · Madinah Munawwarah',
    frostedTagBn: 'মসজিদে নববী · রওজা মোবারক ও জিয়ারত',
    frostedTagEn: 'Masjid an-Nabawi · Green Dome',
    headlineBn: 'মদিনা মনোয়ারা — মসজিদে নববীর সবুজ গম্বুজ ও জিয়ারত',
    headlineEn: 'Umrah & Hajj Pilgrimage — Concludes in Madinah',
    locationLineBn: 'মসজিদে নববী, মারকাজিয়া, মদিনা মনোয়ারা',
    locationLineEn: 'Masjid an-Nabawi, Central Madinah',
    rating: '4.98',
    amenitiesBn: ['রওজা শরীফ সালাম', 'মসজিদে কুবা', 'উহুদ পাহাড়', '২×২৩ কেজি লাগেজ'],
    audioSummaryBn:
      'আপনি এখন প্রিয় নবী হযরত মুহাম্মদ সাল্লাল্লাহু আলাইহি ওয়া সাল্লামের শহর মদিনা মনোয়ারায় আছেন। অত্যন্ত আদব ও নিচুস্বরে দরুদ শরীফ পাঠ করুন এবং রওজা মোবারকে সালাম পেশ করুন।',
    correspondingPhase: 'posthajj',
  },
  makkah: {
    id: 'makkah',
    cityBadgeBn: 'মক্কা (Makkah)',
    cityBadgeEn: 'Makkah',
    durationBadgeBn: '৭ চক্কর · তাওয়াফ ও সাঈ',
    durationBadgeEn: '7 Rounds · Tawaf & Sa’i',
    frostedTagBn: 'মসজিদুল হারাম · পবিত্র কাবা শরীফ',
    frostedTagEn: 'Masjid al-Haram · Holy Kaaba',
    headlineBn: 'মক্কা মুকাররমা — পবিত্র কাবা শরীফ তাওয়াফ ও সাফা-মারওয়া সাঈ',
    headlineEn: 'Makkah Mukarramah — Holy Kaaba Tawaf & Sa’i Guide',
    locationLineBn: 'মসজিদুল হারাম, মক্কা (হোটেল হতে ৪০০ মিটার)',
    locationLineEn: 'Masjid al-Haram, Makkah (400m from Hotel)',
    rating: '4.99',
    amenitiesBn: ['৭ চক্কর তাওয়াফ', '৭ বার সাঈ', 'জমজম পান', 'হানাফি দোয়া অডিও'],
    audioSummaryBn:
      'আপনি এখন পবিত্র মক্কা মুকাররমায় মসজিদুল হারামে অবস্থান করছেন। হাজরে আসওয়াদ কোণ থেকে বিসমিল্লাহি আল্লাহু আকবার বলে তাওয়াফ শুরু করুন।',
    correspondingPhase: 'umrah',
  },
  mina: {
    id: 'mina',
    cityBadgeBn: 'মিনা (Mina)',
    cityBadgeEn: 'Mina Tents',
    durationBadgeBn: '৮ই জিলহজ · তারবিয়ার দিন',
    durationBadgeEn: '8 Dhul Hijjah · Mina Camp',
    frostedTagBn: 'মিনা তাঁবু শহর · মাকতাব ৪২ (বাংলাদেশ)',
    frostedTagEn: 'Mina Tent Valley · BD Maktab 42',
    headlineBn: 'মিনা উপত্যকা — সাদা তাঁবুর শহর ও ৫ ওয়াক্ত নামাজ আদায়',
    headlineEn: 'Mina Tent City — 5 Waqt Prayers & GPS Tent Pin',
    locationLineBn: 'মিনা তাঁবু নং ৫৬/১৪B, রোড ৫৬, মক্কা',
    locationLineEn: 'Mina Camp Tent 56/14B, King Fahd Road',
    rating: '4.92',
    amenitiesBn: ['তাঁবু জিপিএস পিন', '৫ ওয়াক্ত নামাজ', '৪৫°C পানি ট্র্যাকার', 'ওরস্যালাইন সতর্কতা'],
    audioSummaryBn:
      'আপনি এখন মিনার সাদা তাঁবুর শহরে আছেন। বাইরে যাওয়ার আগে আপনার তাঁবুর জিপিএস লোকেশন ও পোল নম্বর সেভ করে নিন এবং প্রতি ঘণ্টায় পানি পান করুন।',
    correspondingPhase: 'mina8',
  },
  jamarat: {
    id: 'jamarat',
    cityBadgeBn: 'জামারাত (Jamarat)',
    cityBadgeEn: 'Jamarat & Muzdalifah',
    durationBadgeBn: '১০-১৩ জিলহজ · কংকর ও কুরবানি',
    durationBadgeEn: '10-13 Dhul Hijjah · Rami & Halq',
    frostedTagBn: 'ওয়াজিব তারতীব · কংকর → কুরবানি → হলক',
    frostedTagEn: 'Wajib Sequence · Rami → Qurbani → Halq',
    headlineBn: 'মুযদালিফা ও জামারাত সেতু — নিরাপদ কংকর নিক্ষেপ ও কুরবানি',
    headlineEn: 'Muzdalifah & Jamarat Bridge — Safe Stoning & Qurbani',
    locationLineBn: 'মুযদালিফা ও জামারাত কমপ্লেক্স (৩য় তলা), মিনা',
    locationLineEn: 'Jamarat Bridge Level 3 & Muzdalifah',
    rating: '4.95',
    amenitiesBn: ['৪৯/৭০টি কংকর', 'নিরাপদ সময়সূচী', 'হানাফি তারতীব', 'তাওয়াফে জিয়ারত'],
    audioSummaryBn:
      '১০ই জিলহজ হানাফি মাজহাব অনুযায়ী প্রথমে বড় জামারায় ৭টি কংকর নিক্ষেপ, এরপর কুরবানি এবং তারপর হলক বা চুল কাটা ধারাবাহিকভাবে সম্পন্ন করুন।',
    correspondingPhase: 'jamarat10_13',
  },
};

interface LocationHeroBannerProps {
  activePhase: HajjPhaseId;
  landingSector: 'jeddah' | 'madinah';
  profile: PilgrimProfile;
  showEnglish: boolean;
  onSelectPhase: (phase: HajjPhaseId) => void;
  gpsTracker: PilgrimGpsTrackerState;
}

export const LocationHeroBanner: React.FC<LocationHeroBannerProps> = ({
  profile,
  showEnglish,
  onSelectPhase,
  gpsTracker,
}) => {
  const activeSceneId: LocationSceneId = gpsTracker.currentLocation;
  const scene = LOCATION_SCENES[activeSceneId] || LOCATION_SCENES.arafat;

  const handleSelectScenePill = (targetScene: LocationSceneId) => {
    gpsTracker.setGpsBySite(targetScene);
    onSelectPhase(LOCATION_SCENES[targetScene].correspondingPhase);
  };

  return (
    <div
      data-testid="location-hero-card"
      data-active-location={activeSceneId}
      className="bg-white rounded-[32px] p-3.5 sm:p-5 border border-[#E2E6E1] shadow-[0_10px_30px_rgba(17,19,21,0.06)] space-y-4"
    >
      {/* Top GPS Telemetry & Holy Site Switcher Strip */}
      <div className="space-y-2.5 px-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#111315]">
            <Sparkles className="w-4 h-4 text-[#12A839] shrink-0" />
            <span>
              {showEnglish
                ? `জিপিএস ট্র্যাকার সচল (Live GPS Location: ${gpsTracker.lat}° N, ${gpsTracker.lng}° E)`
                : `জিপিএস লোকেশন ট্র্যাকার (${gpsTracker.lat}° N, ${gpsTracker.lng}° E · ±${gpsTracker.accuracyMeters}m)`}
            </span>
          </div>

          <button
            type="button"
            onClick={gpsTracker.requestLiveGps}
            className="min-h-[34px] px-3 py-1 rounded-full bg-[#F4F6F3] hover:bg-[#E6EAE4] text-[#111315] border border-[#DDE2DC] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 text-[#12A839] shrink-0" />
            <span>{showEnglish ? 'লাইভ জিপিএস · Live GPS' : 'লাইভ জিপিএস রিফ্রেশ'}</span>
          </button>
        </div>

        <div
          role="group"
          aria-label="পবিত্র স্থানের দৃশ্য পরিবর্তন করুন (Location Scene Preview)"
          className="flex flex-wrap items-center gap-1.5"
        >
          {(
            [
              { id: 'arafat', labelBn: 'আরাফাত ময়দান', labelEn: 'Arafat' },
              { id: 'madinah', labelBn: 'মদিনা শরীফ', labelEn: 'Madinah' },
              { id: 'makkah', labelBn: 'মক্কা (কাবা)', labelEn: 'Makkah' },
              { id: 'mina', labelBn: 'মিনা তাঁবু', labelEn: 'Mina' },
              { id: 'jamarat', labelBn: 'জামারাত', labelEn: 'Jamarat' },
            ] as const
          ).map((item) => {
            const isSelected = activeSceneId === item.id;
            const coords = HOLY_SITE_COORDINATES[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectScenePill(item.id)}
                title={`GPS: ${coords.lat}° N, ${coords.lng}° E`}
                className={`min-h-[38px] px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#12A839] text-white border-[#12A839] shadow-sm'
                    : 'bg-[#F4F6F3] text-[#111315] border-[#E2E6E1] hover:bg-[#E9ECE8]'
                }`}
              >
                {showEnglish ? `${item.labelBn} · ${item.labelEn}` : item.labelBn}
              </button>
            );
          })}
        </div>
      </div>

      {/* HERO VISUAL CONTAINER (Matches Reference Mockup Rounded Image Header + Floating Badges) */}
      <div className="relative w-full h-56 sm:h-68 rounded-[24px] overflow-hidden bg-[#D8ECF8] border border-[#E2E6E1]">
        {/* Contextual Sunlit Architectural Artwork */}
        {activeSceneId === 'arafat' && (
          <svg
            viewBox="0 0 800 420"
            className="w-full h-full object-cover"
            role="img"
            aria-label="আরাফাতের ময়দান ও জাবালে রহমত (Mount Arafat & Jabal al-Rahmah)"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="arafatSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B9AE1" />
                <stop offset="55%" stopColor="#89CFF3" />
                <stop offset="100%" stopColor="#F6E6C2" />
              </linearGradient>
              <linearGradient id="arafatHill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C89D66" />
                <stop offset="60%" stopColor="#A67B44" />
                <stop offset="100%" stopColor="#7D5829" />
              </linearGradient>
              <radialGradient id="arafatSun" cx="0.2" cy="0.22" r="0.35">
                <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#FDE68A" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Sunlit Sky */}
            <rect width="800" height="420" fill="url(#arafatSky)" />
            <circle cx="160" cy="90" r="130" fill="url(#arafatSun)" />

            {/* Soft sunlit clouds */}
            <g fill="#FFFFFF" opacity="0.82">
              <ellipse cx="150" cy="85" rx="58" ry="20" />
              <ellipse cx="185" cy="78" rx="42" ry="18" />
              <ellipse cx="620" cy="70" rx="68" ry="22" />
              <ellipse cx="660" cy="64" rx="48" ry="18" />
            </g>

            {/* Distant Hejaz Mountain Range */}
            <path
              d="M0,290 L110,235 L230,275 L350,210 L490,260 L630,220 L740,265 L800,240 L800,420 L0,420 Z"
              fill="#D4B489"
              opacity="0.7"
            />

            {/* Jabal al-Rahmah (Mount of Mercy) Granite Hill */}
            <path
              d="M120,360 L265,240 L355,190 L405,172 L455,192 L545,245 L690,360 Z"
              fill="url(#arafatHill)"
            />
            {/* Rocky granite facets & white stepped path */}
            <path
              d="M355,190 L405,172 L425,270 L330,295 Z"
              fill="#B98B52"
              opacity="0.65"
            />
            <path
              d="M396,174 L414,174 L434,315 L382,315 Z"
              fill="#F3EFEA"
              opacity="0.45"
            />

            {/* Iconic White Obelisk Pillar at Summit of Jabal al-Rahmah */}
            <rect x="394" y="86" width="22" height="90" rx="3" fill="#FFFFFF" stroke="#D6D3CD" strokeWidth="2" />
            <rect x="390" y="168" width="30" height="10" rx="2" fill="#E7E5E4" />
            <circle cx="405" cy="86" r="11" fill="#FFFFFF" />

            {/* Arafat Green Neem Trees & Plains at Base */}
            <rect x="0" y="340" width="800" height="80" fill="#E9D5B3" />
            <g fill="#15803D">
              <circle cx="95" cy="342" r="22" />
              <circle cx="122" cy="346" r="18" />
              <circle cx="210" cy="348" r="20" />
              <circle cx="595" cy="346" r="22" />
              <circle cx="622" cy="350" r="17" />
              <circle cx="715" cy="342" r="24" />
            </g>

            {/* White-Robed Pilgrims in Ihram standing on Jabal al-Rahmah & Plains */}
            <g fill="#FFFFFF">
              {[
                [310, 265],
                [335, 250],
                [368, 228],
                [390, 205],
                [422, 212],
                [448, 236],
                [475, 258],
                [265, 325],
                [295, 330],
                [330, 320],
                [365, 332],
                [405, 326],
                [445, 330],
                [485, 324],
                [525, 332],
              ].map(([cx, cy], idx) => (
                <g key={idx} transform={`translate(${cx}, ${cy})`}>
                  <circle cx="0" cy="-10" r="4.5" fill="#FDE68A" />
                  <path d="M-6,6 C-6,-3 6,-3 6,6 Z" fill="#FFFFFF" />
                </g>
              ))}
            </g>

            {/* Green Official Arafat Boundary Signboard */}
            <g transform="translate(42, 275)">
              <rect x="12" y="38" width="4" height="32" fill="#E5E7EB" />
              <rect x="64" y="38" width="4" height="32" fill="#E5E7EB" />
              <rect x="0" y="0" width="82" height="42" rx="6" fill="#12A839" stroke="#FFFFFF" strokeWidth="2.5" />
              <text x="41" y="18" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
                عرفات
              </text>
              <text x="41" y="33" textAnchor="middle" fill="#DCFCE7" fontSize="9" fontWeight="bold">
                ARAFAT
              </text>
            </g>
          </svg>
        )}

        {activeSceneId === 'madinah' && (
          <svg
            viewBox="0 0 800 420"
            className="w-full h-full object-cover"
            role="img"
            aria-label="মদিনা মনোয়ারা ও মসজিদে নববীর সবুজ গম্বুজ (Masjid an-Nabawi Green Dome in Madinah)"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="madinahSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4BA3E3" />
                <stop offset="60%" stopColor="#9BD4F5" />
                <stop offset="100%" stopColor="#EBF5FB" />
              </linearGradient>
              <linearGradient id="greenDomeGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#19B347" />
                <stop offset="55%" stopColor="#0E8A34" />
                <stop offset="100%" stopColor="#065F24" />
              </linearGradient>
              <linearGradient id="sandstoneWall" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBF7F0" />
                <stop offset="100%" stopColor="#E6DAC6" />
              </linearGradient>
            </defs>

            {/* Bright Azure Sky */}
            <rect width="800" height="420" fill="url(#madinahSky)" />

            {/* Soft Clouds (matching the reference photo) */}
            <g fill="#FFFFFF" opacity="0.88">
              <ellipse cx="140" cy="95" rx="75" ry="26" />
              <ellipse cx="195" cy="86" rx="55" ry="22" />
              <ellipse cx="640" cy="105" rx="85" ry="28" />
              <ellipse cx="580" cy="112" rx="55" ry="20" />
            </g>

            {/* Left & Right Ornate Madinah Minarets */}
            <g transform="translate(155, 48)">
              <rect x="14" y="75" width="32" height="220" fill="url(#sandstoneWall)" stroke="#D5C5AC" strokeWidth="1.5" />
              <rect x="10" y="135" width="40" height="10" rx="2" fill="#C89D54" />
              <rect x="10" y="200" width="40" height="10" rx="2" fill="#C89D54" />
              <rect x="18" y="42" width="24" height="35" fill="#F5EFE6" stroke="#D5C5AC" />
              <polygon points="18,42 30,10 42,42" fill="#374151" />
              <circle cx="30" cy="6" r="4" fill="#F59E0B" />
            </g>

            <g transform="translate(605, 36)">
              <rect x="12" y="85" width="36" height="230" fill="url(#sandstoneWall)" stroke="#D5C5AC" strokeWidth="1.5" />
              <rect x="8" y="145" width="44" height="10" rx="2" fill="#C89D54" />
              <rect x="8" y="210" width="44" height="10" rx="2" fill="#C89D54" />
              <rect x="16" y="46" width="28" height="40" fill="#F5EFE6" stroke="#D5C5AC" />
              <polygon points="16,46 30,8 44,46" fill="#374151" />
              <circle cx="30" cy="4" r="4.5" fill="#F59E0B" />
            </g>

            {/* Iconic Green Dome of Masjid an-Nabawi (Al-Qubbah al-Khadra) */}
            <g transform="translate(400, 260)">
              {/* Dome Drum */}
              <rect x="-118" y="-32" width="236" height="44" fill="#F5EFE6" stroke="#D5C5AC" strokeWidth="2" />
              {/* Main Green Dome Curve */}
              <path
                d="M-115,-30 C-115,-145 -45,-190 0,-212 C45,-190 115,-145 115,-30 Z"
                fill="url(#greenDomeGrad)"
              />
              {/* Subtle architectural ribs & golden finial */}
              <path
                d="M-75,-30 C-75,-125 -25,-170 0,-206 C25,-170 75,-125 75,-30"
                fill="none"
                stroke="#34D399"
                strokeWidth="1.5"
                opacity="0.45"
              />
              <line x1="0" y1="-212" x2="0" y2="-236" stroke="#F59E0B" strokeWidth="4" />
              <circle cx="0" cy="-222" r="5" fill="#FBBF24" />
              <circle cx="0" cy="-232" r="4" fill="#FBBF24" />
            </g>

            {/* Mosque Facade & Arched Colonade */}
            <rect x="60" y="260" width="680" height="105" fill="url(#sandstoneWall)" stroke="#D6C7B2" strokeWidth="2" />
            <rect x="60" y="252" width="680" height="12" fill="#C89D54" />

            {/* Decorative Arches */}
            {[110, 195, 280, 365, 450, 535, 620].map((xPos) => (
              <g key={xPos} transform={`translate(${xPos}, 282)`}>
                <path
                  d="M0,75 L0,26 C0,6 45,6 45,26 L45,75 Z"
                  fill="#4B382A"
                />
                <path
                  d="M4,75 L4,28 C4,12 41,12 41,28 L41,75 Z"
                  fill="#1F2937"
                />
                <circle cx="22.5" cy="36" r="5" fill="#FBBF24" opacity="0.8" />
              </g>
            ))}

            {/* Forecourt White Shading Umbrellas */}
            <rect x="0" y="360" width="800" height="60" fill="#EFECE6" />
            {[180, 400, 620].map((ux) => (
              <g key={ux} transform={`translate(${ux}, 355)`}>
                <path d="M-70,-18 L0,-36 L70,-18 Z" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="2" />
                <rect x="-4" y="-18" width="8" height="32" fill="#D4AF37" />
              </g>
            ))}
          </svg>
        )}

        {activeSceneId === 'makkah' && (
          <svg
            viewBox="0 0 800 420"
            className="w-full h-full object-cover"
            role="img"
            aria-label="পবিত্র কাবা শরীফ ও মসজিদুল হারাম (Holy Kaaba in Makkah)"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="makkahSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E6FB8" />
                <stop offset="65%" stopColor="#72B6EC" />
                <stop offset="100%" stopColor="#E6F2FA" />
              </linearGradient>
              <linearGradient id="kaabaCloth" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1F242D" />
                <stop offset="50%" stopColor="#111318" />
                <stop offset="100%" stopColor="#07080A" />
              </linearGradient>
            </defs>

            {/* Sky */}
            <rect width="800" height="420" fill="url(#makkahSky)" />

            {/* Haram Minarets & Arched Portico in Background */}
            <rect x="40" y="210" width="720" height="125" fill="#F3EFE6" stroke="#D5C7B4" strokeWidth="2" />
            {[120, 250, 550, 680].map((mx) => (
              <g key={mx} transform={`translate(${mx}, 55)`}>
                <rect x="-14" y="35" width="28" height="145" fill="#F5EFE6" stroke="#D5C5AC" />
                <rect x="-18" y="85" width="36" height="8" fill="#D4AF37" />
                <polygon points="-14,35 0,4 14,35" fill="#1E293B" />
                <circle cx="0" cy="0" r="4" fill="#FBBF24" />
              </g>
            ))}

            {/* White Marble Mataf Floor */}
            <ellipse cx="400" cy="365" rx="390" ry="75" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="3" />
            <ellipse cx="400" cy="365" rx="290" ry="50" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="8 6" />
            <ellipse cx="400" cy="365" rx="210" ry="34" fill="none" stroke="#CBD5E1" strokeWidth="2" />

            {/* THE HOLY KAABA */}
            <g transform="translate(295, 118)">
              {/* Main Cube Body */}
              <rect
                x="0"
                y="0"
                width="210"
                height="215"
                rx="4"
                fill="url(#kaabaCloth)"
                stroke="#374151"
                strokeWidth="1.5"
              />
              {/* Golden Embroidered Hizam Band */}
              <rect x="0" y="44" width="210" height="28" fill="#D97706" />
              <rect x="0" y="48" width="210" height="20" fill="#FBBF24" />
              <path
                d="M10,58 L200,58"
                stroke="#78350F"
                strokeWidth="3"
                strokeDasharray="12 6 4 6"
              />

              {/* Golden Ornaments (Qandils) */}
              <rect x="24" y="92" width="34" height="44" rx="4" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="2" />
              <rect x="82" y="92" width="42" height="28" rx="4" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="2" />

              {/* Golden Door of the Kaaba (Multazam & Bab al-Kaaba) */}
              <rect x="142" y="88" width="44" height="82" rx="3" fill="#FBBF24" stroke="#B45309" strokeWidth="3" />
              <line x1="164" y1="88" x2="164" y2="170" stroke="#92400E" strokeWidth="2" />

              {/* Hajar al-Aswad (Black Stone) Silver Frame at Corner */}
              <ellipse cx="206" cy="152" rx="7" ry="10" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
              <circle cx="206" cy="152" r="4" fill="#111827" />
            </g>

            {/* Tawaf Pilgrims in White Ihram around Mataf */}
            <g fill="#FFFFFF">
              {[160, 195, 230, 265, 535, 570, 605, 640].map((px, i) => (
                <g key={i} transform={`translate(${px}, ${342 + (i % 2) * 12})`}>
                  <circle cx="0" cy="-9" r="4" fill="#FDE68A" />
                  <rect x="-5" y="-5" width="10" height="14" rx="4" fill="#FFFFFF" stroke="#CBD5E1" />
                </g>
              ))}
            </g>
          </svg>
        )}

        {activeSceneId === 'mina' && (
          <svg
            viewBox="0 0 800 420"
            className="w-full h-full object-cover"
            role="img"
            aria-label="মিনা তাঁবুর শহর (Mina White Tent City)"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="minaSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3898EC" />
                <stop offset="100%" stopColor="#D8F0FA" />
              </linearGradient>
            </defs>
            <rect width="800" height="420" fill="url(#minaSky)" />
            {/* Mina Valley Mountains */}
            <path
              d="M0,220 L130,155 L280,210 L440,145 L610,205 L740,160 L800,190 L800,420 L0,420 Z"
              fill="#B08D6A"
            />
            <rect x="0" y="235" width="800" height="185" fill="#E5E7EB" />

            {/* Rows of Iconic White Fireproof Pyramid-Roofed Mina Tents */}
            {[240, 295, 350].map((rowY, rIdx) => (
              <g key={rowY} transform={`translate(0, ${rowY})`}>
                {[40, 155, 270, 385, 500, 615].map((colX, cIdx) => (
                  <g key={colX} transform={`translate(${colX + (rIdx % 2) * 20}, 0)`}>
                    {/* Tent Walls */}
                    <rect
                      x="0"
                      y="28"
                      width="98"
                      height="42"
                      fill="#FFFFFF"
                      stroke="#CBD5E1"
                      strokeWidth="2"
                    />
                    {/* Pitched Pyramid Tent Roof */}
                    <polygon
                      points="-4,28 49,0 102,28"
                      fill="#F8FAFC"
                      stroke="#94A3B8"
                      strokeWidth="2"
                    />
                    <rect x="45" y="-5" width="8" height="6" fill="#64748B" />
                    {/* Green Door Strip */}
                    <rect x="40" y="42" width="18" height="28" fill="#12A839" opacity="0.85" />
                  </g>
                ))}
              </g>
            ))}

            {/* Green Pedestrian Walkway & Maktab 42 Sign */}
            <g transform="translate(32, 165)">
              <rect x="0" y="0" width="135" height="44" rx="8" fill="#12A839" stroke="#FFFFFF" strokeWidth="2.5" />
              <text x="67" y="19" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
                مكتب ٤٢ · بنغلاديش
              </text>
              <text x="67" y="34" textAnchor="middle" fill="#DCFCE7" fontSize="10" fontWeight="bold">
                MINA TENT 56 / 14B
              </text>
            </g>
          </svg>
        )}

        {activeSceneId === 'jamarat' && (
          <svg
            viewBox="0 0 800 420"
            className="w-full h-full object-cover"
            role="img"
            aria-label="জামারাত সেতু ও কংকর নিক্ষেপ স্তম্ভ (Jamarat Bridge & Pillar)"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="jamaratSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2575FC" />
                <stop offset="100%" stopColor="#CFE8FC" />
              </linearGradient>
            </defs>
            <rect width="800" height="420" fill="url(#jamaratSky)" />
            {/* Multi-tier Jamarat Bridge Structure */}
            <rect x="40" y="250" width="720" height="150" rx="12" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="3" />
            <rect x="40" y="232" width="720" height="22" fill="#12A839" />

            {/* Jamarat Elliptical Basin & Central Stone Pillar (Jamarat al-Aqabah) */}
            <ellipse cx="400" cy="340" rx="220" ry="52" fill="#E2E8F0" stroke="#64748B" strokeWidth="4" />
            <ellipse cx="400" cy="345" rx="185" ry="38" fill="#CBD5E1" />

            {/* Tall Elliptical Stone Wall Pillar */}
            <rect
              x="355"
              y="110"
              width="90"
              height="230"
              rx="18"
              fill="#D6D3CD"
              stroke="#78716C"
              strokeWidth="3"
            />
            <text x="400" y="165" textAnchor="middle" fill="#111315" fontSize="15" fontWeight="bold">
              جمرة العقبة
            </text>
            <text x="400" y="188" textAnchor="middle" fill="#12A839" fontSize="11" fontWeight="bold">
              JAMARAT AL-AQABAH
            </text>
          </svg>
        )}

        {/* TOP-RIGHT FLOATING WHITE PILL BADGE (Exact Reference Mockup Motif) */}
        <div className="absolute top-3.5 right-3.5 bg-white/95 text-[#111315] px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold shadow-md border border-black/5">
          {showEnglish ? scene.durationBadgeEn : scene.durationBadgeBn}
        </div>

        {/* BOTTOM-LEFT FROSTED TRANSLUCENT PILL BADGE (Exact Reference Mockup Motif) */}
        <div className="absolute bottom-3.5 left-3.5 backdrop-blur-md bg-black/45 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold border border-white/25 flex items-center gap-1.5">
          <Flag className="w-3.5 h-3.5 text-white shrink-0" />
          <span>{showEnglish ? scene.frostedTagEn : scene.frostedTagBn}</span>
        </div>
      </div>

      {/* CARD CONTENT AREA BELOW HERO IMAGE (Matches Reference Mockup Package Card Layout) */}
      <div className="px-1 sm:px-2 space-y-3">
        {/* Bold Headline */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#111315] leading-snug">
          {showEnglish ? `${scene.headlineBn} · ${scene.headlineEn}` : scene.headlineBn}
        </h2>

        {/* Location Pin + Star Rating Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-bold text-slate-600">
          <div className="flex items-center gap-1.5 text-[#111315]">
            <MapPin className="w-4 h-4 text-[#12A839] shrink-0" />
            <span>{showEnglish ? scene.locationLineEn : scene.locationLineBn}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F4F6F3] px-3 py-1 rounded-full border border-[#E2E6E1]">
            <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
            <span className="font-mono-tabular font-extrabold text-[#111315]">
              {scene.rating}
            </span>
            <span className="text-xs text-slate-500">· PID {profile.pid}</span>
          </div>
        </div>

        {/* 4-Item Amenity / Ritual Metadata Row (Matches Reference Mockup Flight/Hotel/Transfer/Meal Row) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {[
            { Icon: ShieldCheck, label: scene.amenitiesBn[0] },
            { Icon: Building2, label: scene.amenitiesBn[1] },
            { Icon: Compass, label: scene.amenitiesBn[2] },
            { Icon: Plane, label: scene.amenitiesBn[3] },
          ].map(({ Icon, label }, idx) => (
            <div
              key={idx}
              className="bg-[#F6F7F5] border border-[#E6E8E5] rounded-2xl px-3 py-2.5 flex items-center gap-2 text-xs sm:text-[13px] font-bold text-[#111315]"
            >
              <Icon className="w-4 h-4 text-[#12A839] shrink-0" />
              <span className="truncate">{label}</span>
            </div>
          ))}
        </div>

        {/* Bottom Pill Action Row (Vibrant Leaf Green #12A839 + Sleek Obsidian #111315) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => speakText(scene.audioSummaryBn, 'bn-BD')}
            className="flex-1 min-h-[54px] px-5 rounded-full bg-[#12A839] hover:bg-[#0E8F2F] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Volume2 className="w-5 h-5 shrink-0" />
            <span>
              {showEnglish
                ? `${scene.cityBadgeBn}-এর করণীয় অডিও শুনুন (Listen Audio Guide)`
                : `${scene.cityBadgeBn}-এর করণীয় ও দোয়া অডিও শুনুন`}
            </span>
          </button>

          <div className="min-h-[54px] px-5 rounded-full bg-[#111315] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0">
            <span className="text-[#12A839]">●</span>
            <span>
              {profile.nameBn} · {profile.maktabNoBn.split('(')[0]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
