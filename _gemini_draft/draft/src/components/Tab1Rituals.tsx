import React, { useState, useEffect } from 'react';
import {
  Compass,
  Volume2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Droplets,
  Play,
  Pause,
  SkipForward,
  ShieldCheck,
  Plane,
  Luggage,
  Calculator,
  Plus,
  Trash2,
  Clock,
  Footprints,
  Sparkles,
  Tent,
  Sun,
  Award,
} from 'lucide-react';
import {
  HAJJ_PHASES,
  HajjPhaseId,
  TAWAF_ROUND_DUAS,
  SAI_ROUND_DUAS,
  ARAFAT_LYING_DOWN_DUAS,
  ZIYARAH_SPOTS,
  PilgrimProfile,
} from '../data/hajjData';
import {
  getIhramRuleForSector,
  evaluateStoningWindow,
  validateTenDhulHijjahSequence,
  TenDhulHijjahState,
  LuggageItem,
  calculateLuggageStatus,
} from '../utils/hajjLogic';
import { speakText, stopAllSpeech } from '../utils/speech';
import { LocationHeroBanner } from './LocationHeroBanner';
import { TawafCounter } from './TawafCounter';
import { TawafInsights } from './TawafInsights';
import { HajjChecklist } from './HajjChecklist';
import type { PilgrimGpsTrackerState } from '../App';

interface Tab1Props {
  activePhase: HajjPhaseId;
  onSelectPhase: (phase: HajjPhaseId) => void;
  profile: PilgrimProfile;
  onUpdateProfile: (updated: PilgrimProfile) => void;
  showEnglish: boolean;
  gpsTracker: PilgrimGpsTrackerState;
}

export const Tab1Rituals: React.FC<Tab1Props> = ({
  activePhase,
  onSelectPhase,
  profile,
  onUpdateProfile,
  showEnglish,
  gpsTracker,
}) => {
  // Phase 1: Pre-Flight State
  const [landingSector, setLandingSector] = useState<'jeddah' | 'madinah'>(
    profile.inboundFlight.sector
  );
  const [preFlightChecklist, setPreFlightChecklist] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('moallem_preflight_checks');
      return saved
        ? JSON.parse(saved)
        : {
            passport: true,
            nusuk: true,
            vaccine: true,
            medicine: false,
            ihram: false,
          };
    } catch {
      return { passport: true, nusuk: true, vaccine: true, medicine: false, ihram: false };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('moallem_preflight_checks', JSON.stringify(preFlightChecklist));
    } catch {
      // ignore
    }
  }, [preFlightChecklist]);

  // Phase 2: Umrah (Tawaf & Sa'i) Counter State
  const [umrahSubMode, setUmrahSubMode] = useState<'tawaf' | 'sai'>('tawaf');
  const [tawafRound, setTawafRound] = useState<number>(() => {
    return Number(localStorage.getItem('moallem_tawaf_round')) || 1;
  });
  const [saiRound, setSaiRound] = useState<number>(() => {
    return Number(localStorage.getItem('moallem_sai_round')) || 1;
  });
  const [simulatedSteps, setSimulatedSteps] = useState<number>(480);
  const [isPlayingDua, setIsPlayingDua] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('moallem_tawaf_round', String(tawafRound));
      localStorage.setItem('moallem_sai_round', String(saiRound));
    } catch {
      // ignore
    }
  }, [tawafRound, saiRound]);

  // Phase 3: 8 Dhul Hijjah (Mina Tent & Hydration) State
  const [waterGlasses, setWaterGlasses] = useState<number>(() => {
    return Number(localStorage.getItem('moallem_mina_water')) || 4;
  });
  const [orsPackets, setOrsPackets] = useState<number>(() => {
    return Number(localStorage.getItem('moallem_mina_ors')) || 1;
  });
  const [tentSavedBanner, setTentSavedBanner] = useState<boolean>(false);
  const [customTentNote, setCustomTentNote] = useState<string>(
    profile.minaTentPin.streetPoleBn
  );

  useEffect(() => {
    try {
      localStorage.setItem('moallem_mina_water', String(waterGlasses));
      localStorage.setItem('moallem_mina_ors', String(orsPackets));
    } catch {
      // ignore
    }
  }, [waterGlasses, orsPackets]);

  // Phase 4: 9 Dhul Hijjah (Arafat Wuquf Mode) State
  const [arafatDuaIndex, setArafatDuaIndex] = useState<number>(0);
  const [isContinuousPlaying, setIsContinuousPlaying] = useState<boolean>(false);
  const [maghribSecondsLeft, setMaghribSecondsLeft] = useState<number>(5842); // ~1h 37m 22s

  useEffect(() => {
    if (activePhase !== 'arafat9') return;
    const timer = setInterval(() => {
      setMaghribSecondsLeft((prev) => (prev > 0 ? prev - 1 : 5842));
    }, 1000);
    return () => clearInterval(timer);
  }, [activePhase]);

  // Phase 5: 10-13 Dhul Hijjah (Muzdalifah & Jamarat) State
  const [pebbleTarget, setPebbleTarget] = useState<49 | 70>(49);
  const [pebbleCount, setPebbleCount] = useState<number>(() => {
    return Number(localStorage.getItem('moallem_pebbles')) || 21;
  });
  const [selectedJamaratDay, setSelectedJamaratDay] = useState<10 | 11 | 12 | 13>(10);
  const [selectedJamaratHour, setSelectedJamaratHour] = useState<number>(17); // 5:00 PM safe default
  const [tenDhulHijjahChecklist, setTenDhulHijjahChecklist] = useState<TenDhulHijjahState>(() => {
    try {
      const saved = localStorage.getItem('moallem_10dhulhijjah_steps');
      return saved
        ? JSON.parse(saved)
        : { ramiDone: true, qurbaniDone: false, halqDone: false, tawafZiyarahDone: false };
    } catch {
      return { ramiDone: true, qurbaniDone: false, halqDone: false, tawafZiyarahDone: false };
    }
  });
  const [sequenceWarning, setSequenceWarning] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('moallem_pebbles', String(pebbleCount));
      localStorage.setItem('moallem_10dhulhijjah_steps', JSON.stringify(tenDhulHijjahChecklist));
    } catch {
      // ignore
    }
  }, [pebbleCount, tenDhulHijjahChecklist]);

  // Phase 6: Post-Hajj Concierge (Ziyarah & Shopping / Luggage) State
  const [visitedZiyarah, setVisitedZiyarah] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('moallem_ziyarah_visited');
      return saved ? JSON.parse(saved) : { quba: true, uhud: false, hira: false, qiblatain: false };
    } catch {
      return { quba: true };
    }
  });
  const [luggageItems, setLuggageItems] = useState<LuggageItem[]>(() => {
    try {
      const saved = localStorage.getItem('moallem_luggage_items');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'item-1',
              nameBn: 'মদিনার আজওয়া ও মাবরুম খেজুর (৫ কেজি)',
              nameEn: 'Madinah Ajwa & Mabroom Dates (5kg)',
              weightKg: 5.0,
              priceSar: 175,
              bag: 1,
            },
            {
              id: 'item-2',
              nameBn: 'ব্যক্তিগত কাপড় ও ইহরাম সেট',
              nameEn: 'Personal Clothes & Ihram Set',
              weightKg: 13.5,
              priceSar: 0,
              bag: 1,
            },
            {
              id: 'item-3',
              nameBn: 'জায়নামাজ, তসবিহ, আতর ও উপহার সামগ্রী',
              nameEn: 'Prayer Mats, Tasbih, Attar & Gifts',
              weightKg: 16.0,
              priceSar: 240,
              bag: 2,
            },
            {
              id: 'item-4',
              nameBn: 'হ্যান্ডব্যাগ (ওষুধ, পাসপোর্ট ও চার্জার)',
              nameEn: 'Cabin Carry-On (Meds & Documents)',
              weightKg: 4.5,
              priceSar: 0,
              bag: 'hand',
            },
          ];
    } catch {
      return [];
    }
  });
  const [sarRate, setSarRate] = useState<number>(32.5);
  const [converterSarInput, setConverterSarInput] = useState<string>('100');
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemWeight, setNewItemWeight] = useState<string>('2.0');
  const [newItemPriceSar, setNewItemPriceSar] = useState<string>('50');
  const [newItemBag, setNewItemBag] = useState<1 | 2>(1);

  useEffect(() => {
    try {
      localStorage.setItem('moallem_ziyarah_visited', JSON.stringify(visitedZiyarah));
      localStorage.setItem('moallem_luggage_items', JSON.stringify(luggageItems));
    } catch {
      // ignore
    }
  }, [visitedZiyarah, luggageItems]);

  const currentPhaseMeta =
    HAJJ_PHASES.find((p) => p.id === activePhase) || HAJJ_PHASES[0];

  const currentRound = umrahSubMode === 'tawaf' ? tawafRound : saiRound;
  const activeDuaList = umrahSubMode === 'tawaf' ? TAWAF_ROUND_DUAS : SAI_ROUND_DUAS;
  const currentDua =
    activeDuaList[Math.min(Math.max(currentRound - 1, 0), 6)] || activeDuaList[0];

  const handleCompleteRound = () => {
    if (umrahSubMode === 'tawaf') {
      const next = tawafRound < 7 ? tawafRound + 1 : 7;
      setTawafRound(next);
      setSimulatedSteps((s) => (s >= 620 ? 120 : s + 85));
    } else {
      const next = saiRound < 7 ? saiRound + 1 : 7;
      setSaiRound(next);
      setSimulatedSteps((s) => (s >= 580 ? 110 : s + 90));
    }
  };

  const handleSaveTentPin = () => {
    const nowStr = 'এইমাত্র সংরক্ষিত · জিপিএস লকড';
    const updated: PilgrimProfile = {
      ...profile,
      minaTentPin: {
        ...profile.minaTentPin,
        streetPoleBn: customTentNote || profile.minaTentPin.streetPoleBn,
        savedAt: nowStr,
      },
    };
    onUpdateProfile(updated);
    setTentSavedBanner(true);
    setTimeout(() => setTentSavedBanner(false), 5000);
  };

  const handleToggleContinuousArafatDua = (indexToPlay = arafatDuaIndex) => {
    if (isContinuousPlaying && indexToPlay === arafatDuaIndex) {
      stopAllSpeech();
      setIsContinuousPlaying(false);
      return;
    }
    const targetDua = ARAFAT_LYING_DOWN_DUAS[indexToPlay] || ARAFAT_LYING_DOWN_DUAS[0];
    setArafatDuaIndex(indexToPlay);
    setIsContinuousPlaying(true);
    speakText(
      `${targetDua.banglaPronunciation}। ${targetDua.banglaHeartfeltScript}`,
      'bn-BD',
      () => {
        setIsContinuousPlaying(false);
      }
    );
  };

  const handleToggleTenDhulHijjahStep = (step: keyof TenDhulHijjahState) => {
    const validation = validateTenDhulHijjahSequence(tenDhulHijjahChecklist, step);
    if (!validation.allowed) {
      setSequenceWarning(validation.warningBn || null);
      return;
    }
    setSequenceWarning(null);
    setTenDhulHijjahChecklist((prev) => ({
      ...prev,
      [step]: !prev[step],
    }));
  };

  const handleAddLuggageItem = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newItemWeight);
    const p = parseFloat(newItemPriceSar) || 0;
    if (!newItemName.trim() || isNaN(w) || w <= 0) return;

    const added: LuggageItem = {
      id: `item-${Date.now()}`,
      nameBn: newItemName.trim(),
      nameEn: newItemName.trim(),
      weightKg: Math.round(w * 10) / 10,
      priceSar: Math.round(p),
      bag: newItemBag,
    };
    setLuggageItems((prev) => [...prev, added]);
    setNewItemName('');
    setNewItemWeight('1.5');
    setNewItemPriceSar('40');
  };

  const formatCountdown = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const ihramRule = getIhramRuleForSector(landingSector);
  const stoningAssessment = evaluateStoningWindow(selectedJamaratDay, selectedJamaratHour);
  const luggageSummary = calculateLuggageStatus(luggageItems, sarRate, true);

  return (
    <section aria-label="আজকের করণীয় ও হজের ৬টি ধাপ" className="space-y-5">
      {/* DYNAMIC CONTEXTUAL LOCATION HERO CARD (Shows Arafat in Arafat, Madinah in Madinah, Makkah in Umrah, etc.) */}
      <LocationHeroBanner
        activePhase={activePhase}
        landingSector={landingSector}
        profile={profile}
        showEnglish={showEnglish}
        onSelectPhase={onSelectPhase}
        gpsTracker={gpsTracker}
      />

      {/* 2x3 QUICK-ACTION ICON GRID (Matches Reference UI 6-Tile Grid + Simulation Mode Switcher) */}
      <div className="bg-white rounded-[32px] p-4 sm:p-5 border border-[#E2E6E1] shadow-[0_10px_30px_rgba(17,19,21,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 px-1">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#111315] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#12A839] shrink-0" />
              <span>
                {showEnglish
                  ? 'হজের ধাপ নির্বাচন করুন (Simulation Mode Bar — Test All 6 Phases)'
                  : 'হজের ৬টি ধাপ ও আমল গাইড (যেকোনো ধাপে ট্যাপ করুন)'}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              যেকোনো ধাপে ট্যাপ করলে উপরের পবিত্র স্থানের ছবি (আরাফাত, মদিনা, মক্কা, মিনা) ও নিচের আমল পরিবর্তিত হবে
            </p>
          </div>
          <span className="text-xs font-extrabold font-mono-tabular bg-[#F4F6F3] text-[#12A839] px-3 py-1.5 rounded-full border border-[#DDE2DC]">
            ধাপ {currentPhaseMeta.stepNum} / 6
          </span>
        </div>

        <div
          role="tablist"
          aria-label="হজের ৬টি পর্যায় (Hajj 6 Phases Switcher)"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
        >
          {HAJJ_PHASES.map((phase) => {
            const isActive = phase.id === activePhase;
            const PhaseIcon =
              phase.id === 'preflight'
                ? Plane
                : phase.id === 'umrah'
                ? Compass
                : phase.id === 'mina8'
                ? Tent
                : phase.id === 'arafat9'
                ? Sun
                : phase.id === 'jamarat10_13'
                ? Award
                : Luggage;

            return (
              <button
                key={phase.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => onSelectPhase(phase.id)}
                className={`min-h-[82px] px-2.5 py-2.5 rounded-[22px] font-bold text-center transition-all cursor-pointer border-2 flex flex-col items-center justify-center gap-1.5 overflow-hidden ${
                  isActive
                    ? 'bg-white text-[#111315] border-[#12A839] shadow-[0_6px_20px_rgba(18,168,57,0.15)]'
                    : 'bg-[#F6F7F5] hover:bg-white text-[#111315] border-transparent hover:border-[#DDE2DC]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-[#12A839] text-white'
                      : 'bg-white text-[#12A839] border border-[#E2E6E1]'
                  }`}
                >
                  <PhaseIcon className="w-5 h-5 shrink-0" />
                </div>
                <span className="text-xs sm:text-[13px] font-extrabold leading-snug whitespace-nowrap">
                  {phase.shortBn}
                </span>
                {showEnglish && (
                  <span className="text-[10px] text-slate-500 truncate max-w-full">
                    {phase.shortEn}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* LIVE CROWDSOURCED TAWAF INSIGHTS (Google Maps Traffic Density & Anonymous Session Durations) */}
      <TawafInsights
        showEnglish={showEnglish}
        onJumpToTawafTracker={
          activePhase !== 'umrah' ? () => onSelectPhase('umrah') : undefined
        }
        refreshTrigger={tawafRound}
      />

      {/* CATEGORIZED PERSISTENT HAJJ CHECKLIST (Documents, Ahram, Medication, Essentials) */}
      <HajjChecklist showEnglish={showEnglish} landingSector={landingSector} />

      {/* =====================================================================
          PHASE 1: PRE-FLIGHT (DHAKA AIRPORT & IHRAM RULES)
         ===================================================================== */}
      {activePhase === 'preflight' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: PNR Sync & Sector Ihram Rules */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Plane className="w-6 h-6 text-[#064E3B]" />
                  <h3 className="text-xl font-extrabold text-[#111827]">
                    বিমান / সৌদিয়া ফ্লাইট ও পিআইডি স্ট্যাটাস
                  </h3>
                </div>
                <span className="text-xs font-bold text-[#064E3B]">
                  PNR: {profile.inboundFlight.pnr}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <p className="text-xs text-slate-600">ফ্লাইট ও এয়ারলাইন্স</p>
                  <p className="text-lg font-extrabold text-[#111827]">
                    {profile.inboundFlight.flightNo} · সিট {profile.inboundFlight.seat}
                  </p>
                  <p className="text-xs font-semibold text-slate-700">
                    {profile.inboundFlight.airlineBn}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">বাংলাদেশ ১১-সংখ্যার পিআইডি (BD PID)</p>
                  <p className="text-lg font-extrabold font-mono-tabular text-[#064E3B]">
                    {profile.pid} (যাচাইকৃত)
                  </p>
                  <p className="text-xs font-semibold text-emerald-800">
                    আশকোনা হজ ক্যাম্প ইমিগ্রেশন ও ভিসা রেডি
                  </p>
                </div>
              </div>

              {/* Landing Sector Switcher */}
              <div className="space-y-2.5 pt-2">
                <label className="block text-base font-extrabold text-[#111827]">
                  আপনার ফ্লাইট প্রথমে কোথায় নামবে? (Select Landing Sector for Ihram Rule):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLandingSector('jeddah');
                      gpsTracker.setGpsBySite('makkah');
                    }}
                    className={`min-h-[56px] p-3.5 rounded-2xl font-bold text-left border-2 transition-all cursor-pointer ${
                      landingSector === 'jeddah'
                        ? 'bg-[#064E3B] text-white border-[#D97706]'
                        : 'bg-slate-50 text-[#111827] border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-base font-extrabold">
                      ১. জেদ্দা আগে (মক্কা শরীফ প্রথমে)
                    </div>
                    <div
                      className={`text-xs ${
                        landingSector === 'jeddah' ? 'text-amber-200' : 'text-slate-600'
                      }`}
                    >
                      ঢাকা → জেদ্দা (ঢাকা থেকেই ইহরাম বাঁধতে হবে)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLandingSector('madinah');
                      gpsTracker.setGpsBySite('madinah');
                    }}
                    className={`min-h-[56px] p-3.5 rounded-2xl font-bold text-left border-2 transition-all cursor-pointer ${
                      landingSector === 'madinah'
                        ? 'bg-[#064E3B] text-white border-[#D97706]'
                        : 'bg-slate-50 text-[#111827] border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-base font-extrabold">
                      ২. মদিনা আগে (মদিনা শরীফ প্রথমে)
                    </div>
                    <div
                      className={`text-xs ${
                        landingSector === 'madinah' ? 'text-amber-200' : 'text-slate-600'
                      }`}
                    >
                      ঢাকা → মদিনা (ঢাকা থেকে সাধারণ কাপড়)
                    </div>
                  </button>
                </div>
              </div>

              {/* Dynamic Hanafi Ihram Instruction Card */}
              <div className="bg-amber-50/80 border-2 border-[#D97706] rounded-2xl p-4 space-y-2">
                <h4 className="text-lg font-extrabold text-[#111827]">
                  {ihramRule.headlineBn}
                </h4>
                <p className="text-sm font-bold text-[#064E3B]">
                  স্থান: {ihramRule.wearLocationBn} · {ihramRule.miqatNameBn}
                </p>
                <p className="text-base text-[#111827] leading-relaxed">
                  {ihramRule.instructionBn}
                </p>
                {showEnglish && (
                  <p className="text-xs text-slate-700 pt-1">{ihramRule.instructionEn}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Talbiyah Audio Player & Pre-Flight Reminder */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xl font-extrabold text-[#111827]">
                তালবিয়াহ পাঠ ও ইহরামের নিয়ত (Talbiyah Audio)
              </h3>

              {/* Talbiyah Player Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-sm font-extrabold text-[#064E3B]">
                  তালবিয়াহ পাঠ (পুরুষরা উচ্চস্বরে, মা-বোনেরা নিচুস্বরে):
                </p>
                <p dir="rtl" lang="ar" className="text-2xl font-bold font-arabic text-[#111827]">
                  لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  উচ্চারণ: লাব্বাইক আল্লাহুম্মা লাব্বাইক, লাব্বাইকা লা শারীকা লাকা লাব্বাইক, ইন্নাল হামদা ওয়ান নি’মাতা লাকা ওয়াল মুলক, লা শারীকা লাক।
                </p>
                <button
                  type="button"
                  onClick={() =>
                    speakText(
                      'লাব্বাইক আল্লাহুম্মা লাব্বাইক, লাব্বাইকা লা শারীকা লাকা লাব্বাইক, ইন্নাল হামদা ওয়ান নিমাতা লাকা ওয়াল মুলক, লা শারীকা লাক।',
                      'bn-BD'
                    )
                  }
                  className="mt-2 w-full min-h-[56px] rounded-xl bg-[#064E3B] hover:bg-[#04392B] text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Volume2 className="w-5 h-5 text-[#FBBF24]" />
                  <span>তালবিয়াহ উচ্চারণ শুনুন (Listen Talbiyah)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PHASE 2: UMRAH & STRAVA-INSPIRED TAWAF COUNTER + LIVE CROWD TRAFFIC
         ===================================================================== */}
      {activePhase === 'umrah' ? (
        <TawafCounter
          showEnglish={showEnglish}
          tawafRound={tawafRound}
          onChangeTawafRound={setTawafRound}
          saiRound={saiRound}
          onChangeSaiRound={setSaiRound}
        />
      ) : (
        <div className="bg-white rounded-[28px] p-4 sm:p-5 border border-[#E2E6E1] shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#111315] text-white flex items-center justify-center font-extrabold text-xl shrink-0">
              🕋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold font-mono-tabular uppercase tracking-wider bg-[#EF233C]/10 text-[#EF233C] px-2.5 py-0.5 rounded-full">
                  LIVE TAWAF TRACKER · STRAVA MODE
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#111315]">
                তাওয়াফ কাউন্টার, মাতাফ জিপিএস ম্যাপ ও লাইভ ভিড়ের আপডেট (চলমান চক্কর: {tawafRound}/৭)
              </h3>
              <p className="text-xs text-slate-600">
                ৫০টি হজ তাওয়াফ লক্ষ্যমাত্রা ও অন্য হাজীদের ডেটা থেকে এখন তাওয়াফের উপযুক্ত সময় কি না দেখুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectPhase('umrah')}
            className="min-h-[56px] px-5 rounded-2xl bg-[#12A839] hover:bg-[#0E8A2D] text-white font-extrabold text-sm sm:text-base shadow-sm cursor-pointer shrink-0"
          >
            তাওয়াফ ট্র্যাকার খুলুন →
          </button>
        </div>
      )}

      {/* =====================================================================
          PHASE 3: 8 DHUL HIJJAH (MINA TENT GPS PIN SAVER & HYDRATION TRACKER)
         ===================================================================== */}
      {activePhase === 'mina8' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Tent GPS Pin Saver */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <MapPin className="w-6 h-6 text-[#064E3B]" />
              <h3 className="text-xl font-extrabold text-[#111827]">
                আমার মিনা তাঁবুর লোকেশন সেভ করুন (Mina Tent GPS Pin)
              </h3>
            </div>

            <p className="text-sm sm:text-base text-slate-700">
              মিনার হাজার হাজার সাদা তাঁবুর দেখতে একই রকম। ওজুখানা বা জামারাতে যাওয়ার আগে নিচের বাটনে ট্যাপ করে আপনার তাঁবুর জিপিএস ও পোল নম্বর সেভ করে রাখুন।
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#064E3B]">
                <span>সংরক্ষিত মাকতাব ও তাঁবু</span>
                <span>শেষ আপডেট: {profile.minaTentPin.savedAt}</span>
              </div>
              <p className="text-lg font-extrabold text-[#111827]">
                {profile.minaTentPin.tentNoBn}
              </p>
              <p className="text-sm font-semibold text-slate-700">
                {profile.minaTentPin.streetPoleBn}
              </p>
              <p className="text-xs font-mono-tabular text-slate-500">
                GPS: {profile.minaTentPin.lat}° N, {profile.minaTentPin.lng}° E · দূরত্ব: ১২০ মিটার উত্তর-পশ্চিম
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="mina-tent-note"
                className="block text-sm font-bold text-[#111827]"
              >
                তাঁবুর গেট / পোল নম্বর বা চিহ্ন লিখুন (ঐচ্ছিক):
              </label>
              <input
                id="mina-tent-note"
                type="text"
                value={customTentNote}
                onChange={(e) => setCustomTentNote(e.target.value)}
                className="w-full min-h-[56px] px-4 rounded-xl border-2 border-slate-300 focus:border-[#064E3B] text-base font-semibold text-[#111827]"
                placeholder="যেমন: রোড ৫৬, পোল ১৪B, সবুজ সাইনবোর্ডের পাশে"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveTentPin}
              className="w-full min-h-[60px] rounded-2xl bg-[#064E3B] hover:bg-[#04392B] text-white font-extrabold text-lg flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <MapPin className="w-6 h-6 text-[#FBBF24]" />
              <span>আমার তাঁবুর লোকেশন সেভ করুন (Save Tent GPS Pin)</span>
            </button>

            {tentSavedBanner && (
              <div
                role="status"
                className="bg-emerald-50 border-2 border-[#064E3B] text-[#064E3B] p-3.5 rounded-xl font-bold text-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>আলহামদুলিল্লাহ! আপনার মিনা তাঁবুর জিপিএস পিন অফলাইনে সেভ হয়েছে।</span>
              </div>
            )}
          </div>

          {/* 45°C Heat Hydration Tracker & 5-Waqt Mina Prayer Note */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Droplets className="w-6 h-6 text-[#D97706]" />
                <h3 className="text-xl font-extrabold text-[#111827]">
                  ৪৫°C তাপমাত্রা ও পানি পান ট্র্যাকার (Hydration)
                </h3>
              </div>
              <span className="text-sm font-extrabold font-mono-tabular text-[#064E3B]">
                {waterGlasses}/১০ গ্লাস
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-700">
              মিনায় হিটস্ট্রোক ও পানিশূন্যতা এড়াতে প্রতি ঘণ্টায় অন্তত ১ গ্লাস জমজম বা সাধারণ পানি এবং দিনে ২ প্যাক ওরস্যালাইন পান করুন।
            </p>

            {/* Progress Bar */}
            <div className="w-full h-5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#064E3B] transition-all duration-200"
                style={{ width: `${Math.min(100, (waterGlasses / 10) * 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-600">পানি ও জমজম</p>
                <p className="text-3xl font-extrabold font-mono-tabular text-[#064E3B] my-1">
                  {waterGlasses} গ্লাস
                </p>
                <button
                  type="button"
                  onClick={() => setWaterGlasses((w) => w + 1)}
                  className="mt-2 w-full min-h-[56px] rounded-xl bg-[#064E3B] hover:bg-[#04392B] text-white font-bold text-sm sm:text-base cursor-pointer"
                >
                  + ১ গ্লাস পানি পান করেছি
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-600">ওরস্যালাইন (ORS)</p>
                <p className="text-3xl font-extrabold font-mono-tabular text-[#D97706] my-1">
                  {orsPackets} প্যাক
                </p>
                <button
                  type="button"
                  onClick={() => setOrsPackets((o) => o + 1)}
                  className="mt-2 w-full min-h-[56px] rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-sm sm:text-base cursor-pointer"
                >
                  + ১ প্যাক ওরস্যালাইন
                </button>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 text-sm space-y-1">
              <p className="font-extrabold text-[#111827]">
                ৮ই জিলহজ মিনার আমল (হানাফি মাজহাব):
              </p>
              <p className="text-slate-800">
                মিনায় জোহর, আসর, মাগরিব, এশা এবং ৯ই জিলহজ ফজর—মোট ৫ ওয়াক্ত নামাজ নিজ নিজ ওয়াক্তে আদায় করা সুন্নাত (২ ওয়াক্ত একত্রে জমা করা যাবে না; মুসাফির হলে ৪ রাকাত ফরজ নামাজ ২ রাকাত কসর পড়বেন)।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PHASE 4: 9 DHUL HIJJAH (ARAFAT WUQUF MODE — CRITICAL FEATURE)
         ===================================================================== */}
      {activePhase === 'arafat9' && (
        <div className="space-y-5">
          {/* CRITICAL 1: Green Arafat Boundary Verified Badge + Live Maghrib Countdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-[#064E3B] text-white rounded-3xl p-5 sm:p-6 border-2 border-[#10B981] shadow-md space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-9 h-9 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-extrabold text-emerald-200 tracking-wide">
                    জিপিএস সীমানা যাচাইকৃত · GPS GEO-FENCE ACTIVE
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                    Arafat Boundary Verified (Not in Wadi Uranah)
                  </h3>
                  <p className="text-base font-bold text-amber-200 mt-1">
                    আপনি আরাফাতের নির্ধারিত সীমানার ভেতরে আছেন (ওয়াদি উরানাহ উপত্যকার বাইরে)
                  </p>
                </div>
              </div>
              <p className="text-sm text-emerald-100 leading-relaxed">
                হানাফি ফিকহ নোট: মসজিদে নামিরার পশ্চিম অংশ (ওয়াদি উরানাহ) আরাফাতের সীমানার বাইরে। আপনার বর্তমান অবস্থান (21.3549° N, 39.9841° E) শতভাগ আরাফাতের মূল সীমানার ভেতরে রয়েছে—আপনার ওকুফে আরাফাহ সহীহভাবে আদায় হচ্ছে।
              </p>
            </div>

            <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#D97706] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#B45309] flex items-center gap-1.5">
                  <Clock className="w-5 h-5" />
                  দোয়া কবুলের সোনালী সময় (Golden Hour)
                </span>
                <span className="text-xs font-bold text-slate-600">সূর্যাস্ত: সন্ধ্যা ৬:৪২</span>
              </div>
              <div className="my-3">
                <p className="text-xs font-bold text-slate-500">
                  মাগরিব (সূর্যাস্ত) পর্যন্ত বাকি সময় (Countdown to Maghrib):
                </p>
                <p className="text-4xl sm:text-5xl font-extrabold font-mono-tabular text-[#111827] mt-1">
                  {formatCountdown(maghribSecondsLeft)}
                </p>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#064E3B]">
                কেবলামুখী হয়ে দুই হাত তুলে কান্নাকাটি ও ইস্তিগফারে মশগুল থাকুন
              </p>
            </div>
          </div>

          {/* CRITICAL 2: High-Visibility Hanafi Fiqh Guardrail Warning at Sunset */}
          <div
            role="alert"
            className="bg-[#FEF2F2] border-4 border-[#DC2626] rounded-3xl p-5 sm:p-6 shadow-md"
          >
            <div className="flex items-start gap-3.5">
              <AlertTriangle className="w-9 h-9 text-[#DC2626] shrink-0 mt-1" />
              <div className="space-y-1.5">
                <div className="text-xs sm:text-sm font-extrabold text-[#DC2626]">
                  হানাফি ফিকহ গার্ডরেইল সতর্কবার্তা (HANAFI FIQH SUNSET GUARDRAIL)
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#111827] leading-snug">
                  সতর্কতা: আরাফাতে মাগরিবের নামাজ পড়বেন না! মুযদালিফায় গিয়ে মাগরিব ও এশা একত্রে পড়তে হবে।
                </h3>
                <p className="text-sm sm:text-base text-slate-800 leading-relaxed">
                  সূর্য ডুবে যাওয়ার পর আরাফাতের ময়দানে মাগরিবের নামাজ পড়া যাবে না। সূর্যাস্তের পর শান্তভাবে মুযদালিফার উদ্দেশ্যে রওনা দিন এবং মুযদালিফায় পৌঁছে এশার ওয়াক্তে <strong>এক আজান ও এক ইকামতে</strong> প্রথমে মাগরিবের ৩ রাকাত ফরজ এবং পরপরই এশার ফরজ আদায় করবেন (ইসলামিক ফাউন্ডেশন বাংলাদেশ ও হানাফি ফিকহ)।
                </p>
              </div>
            </div>
          </div>

          {/* CRITICAL 3: Lying Down Continuous Dua Player (অবসর সময়ে শোনার দোয়া) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#064E3B] shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-extrabold text-[#D97706]">
                  হ্যান্ডস-ফ্রি অডিও প্লেয়ার · LYING DOWN CONTINUOUS DUA PLAYER
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#111827]">
                  অবসর সময়ে শোনার দোয়া (তাঁবুতে শুয়ে বা বিশ্রামরত অবস্থায় শুনুন)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleContinuousArafatDua(arafatDuaIndex)}
                  className="min-h-[56px] px-5 rounded-2xl bg-[#064E3B] hover:bg-[#04392B] text-white font-extrabold text-base flex items-center gap-2 shadow-md cursor-pointer"
                >
                  {isContinuousPlaying ? (
                    <>
                      <Pause className="w-5 h-5 text-[#FBBF24]" />
                      <span>বিরতি দিন (Pause)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 text-[#FBBF24]" />
                      <span>ধারাবাহিক দোয়া চালু করুন (Play All)</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (arafatDuaIndex + 1) % ARAFAT_LYING_DOWN_DUAS.length;
                    handleToggleContinuousArafatDua(nextIdx);
                  }}
                  aria-label="পরবর্তী আরাফাত দোয়া (Next Arafat Dua)"
                  className="min-h-[56px] px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#111827] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <SkipForward className="w-5 h-5" />
                  <span className="text-sm">পরের দোয়া</span>
                </button>
              </div>
            </div>

            {/* Active Arafat Dua Card */}
            {(() => {
              const dua =
                ARAFAT_LYING_DOWN_DUAS[arafatDuaIndex] || ARAFAT_LYING_DOWN_DUAS[0];
              return (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-extrabold text-[#064E3B]">
                      {dua.titleBn}
                    </h4>
                    <span className="text-xs font-bold text-slate-600">
                      {dua.durationLabel}
                    </span>
                  </div>
                  <p
                    dir="rtl"
                    lang="ar"
                    className="text-2xl sm:text-3xl font-bold font-arabic text-[#111827] text-right leading-loose"
                  >
                    {dua.arabic}
                  </p>
                  <p className="text-base font-bold text-[#111827]">
                    উচ্চারণ: {dua.banglaPronunciation}
                  </p>
                  <p className="text-base text-slate-800 leading-relaxed bg-white p-4 rounded-xl border border-slate-200">
                    <strong>বাংলা মোনাজাত:</strong> &ldquo;{dua.banglaHeartfeltScript}&rdquo;
                  </p>
                </div>
              );
            })()}

            {/* Playlist Selection Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ARAFAT_LYING_DOWN_DUAS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleContinuousArafatDua(idx)}
                  className={`min-h-[56px] p-3.5 rounded-2xl border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    idx === arafatDuaIndex
                      ? 'bg-[#064E3B] text-white border-[#D97706]'
                      : 'bg-slate-50 text-[#111827] border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-sm sm:text-base font-bold">{item.titleBn}</span>
                  <Volume2 className="w-5 h-5 shrink-0 text-[#D97706]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PHASE 5: 10-13 DHUL HIJJAH (MUZDALIFAH PEBBLES & JAMARAT CALCULATOR)
         ===================================================================== */}
      {activePhase === 'jamarat10_13' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Pebble Counter (49/70) & Safe Stoning Window Calculator */}
          <div className="lg:col-span-6 space-y-5">
            {/* Pebble Counter */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xl font-extrabold text-[#111827]">
                  মুযদালিফা কংকর গণনাকারী (Pebble Counter)
                </h3>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPebbleTarget(49)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                      pebbleTarget === 49 ? 'bg-[#064E3B] text-white' : 'text-slate-700'
                    }`}
                  >
                    ৪৯টি (১২ জিলহজ পর্যন্ত)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPebbleTarget(70)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                      pebbleTarget === 70 ? 'bg-[#064E3B] text-white' : 'text-slate-700'
                    }`}
                  >
                    ৭০টি (১৩ জিলহজ সহ)
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-700">
                মুযদালিফা থেকে ছোলা বুটের সমান ছোট কংকর কুড়িয়ে নিন (১০ তারিখ ৭টি + ১১ তারিখ ২১টি + ১২ তারিখ ২১টি = ৪৯টি)।
              </p>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500">সংগৃহীত কংকর সংখ্যা</p>
                  <p className="text-4xl font-extrabold font-mono-tabular text-[#064E3B]">
                    {pebbleCount} <span className="text-xl text-slate-400">/ {pebbleTarget}টি</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPebbleCount((c) => Math.min(70, c + 1))}
                    className="min-h-[56px] px-4 rounded-xl bg-[#064E3B] hover:bg-[#04392B] text-white font-extrabold text-base cursor-pointer"
                  >
                    +১টি কংকর
                  </button>
                  <button
                    type="button"
                    onClick={() => setPebbleCount((c) => Math.min(70, c + 7))}
                    className="min-h-[56px] px-4 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold text-base cursor-pointer"
                  >
                    +৭টি (১ সেট)
                  </button>
                </div>
              </div>
            </div>

            {/* Safe Stoning Window Calculator */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xl font-extrabold text-[#111827]">
                নিরাপদ কংকর নিক্ষেপের সময়সূচী (Safe Stoning Calculator)
              </h3>

              <div className="grid grid-cols-4 gap-2">
                {([10, 11, 12, 13] as const).map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedJamaratDay(day)}
                    className={`min-h-[52px] rounded-xl font-extrabold text-sm cursor-pointer border ${
                      selectedJamaratDay === day
                        ? 'bg-[#064E3B] text-white border-[#D97706]'
                        : 'bg-slate-50 text-[#111827] border-slate-200'
                    }`}
                  >
                    {day}ই জিলহজ
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="jamarat-hour-select"
                  className="block text-sm font-bold text-slate-700"
                >
                  জামারাতে যাওয়ার সম্ভাব্য সময় নির্বাচন করুন:
                </label>
                <select
                  id="jamarat-hour-select"
                  value={selectedJamaratHour}
                  onChange={(e) => setSelectedJamaratHour(Number(e.target.value))}
                  className="w-full min-h-[56px] px-4 rounded-xl border-2 border-slate-300 font-bold text-base text-[#111827] bg-white"
                >
                  <option value={8}>সকাল ০৮:০০ (ফজর/সকালের পর)</option>
                  <option value={13}>দুপুর ০১:০০ (জাওয়াল / জোহরের পর)</option>
                  <option value={17}>বিকাল ০৫:০০ (আসরের পর — বয়স্কদের জন্য প্রস্তাবিত)</option>
                  <option value={20}>রাত ০৮:০০ (মাগরিব/এশার পর — ঠান্ডা আবহাওয়া)</option>
                </select>
              </div>

              <div
                className={`p-4 rounded-2xl border-2 space-y-1.5 ${
                  stoningAssessment.status === 'optimal_safe'
                    ? 'bg-emerald-50 border-[#064E3B] text-[#111827]'
                    : stoningAssessment.status === 'caution_heat'
                    ? 'bg-amber-50 border-[#D97706] text-[#111827]'
                    : 'bg-red-50 border-[#DC2626] text-[#111827]'
                }`}
              >
                <p className="text-base font-extrabold">{stoningAssessment.titleBn}</p>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {stoningAssessment.adviceBn}
                </p>
                <p className="text-xs font-extrabold text-[#064E3B] pt-1">
                  বাংলাদেশ মাকতাবের প্রস্তাবিত নিরাপদ সময়: {stoningAssessment.recommendedWindowBn}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: 10th Dhul Hijjah Strict Hanafi Tartib Checklist (Rami -> Qurbani -> Halq) */}
          <div className="lg:col-span-6 space-y-5">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#064E3B] shadow-sm space-y-4">
              <div>
                <span className="text-xs font-extrabold text-[#D97706]">
                  হানাফি ওয়াজিব তারতীব · 10TH DHUL HIJJAH WAJIB SEQUENCE
                </span>
                <h3 className="text-xl font-extrabold text-[#111827]">
                  ১০ই জিলহজের ৩টি কাজের বাধ্যতামূলক ক্রম (তারতীব)
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  হানাফি মাজহাবে ১. কংকর নিক্ষেপ → ২. কুরবানি → ৩. হলক (চুল কাটা) ধারাবাহিকভাবে করা ওয়াজিব। ক্রম ভঙ্গ করলে দম ওয়াজিব হয়।
                </p>
              </div>

              {sequenceWarning && (
                <div
                  role="alert"
                  className="bg-red-50 border-2 border-[#DC2626] text-[#111827] p-4 rounded-2xl flex items-start gap-3"
                >
                  <AlertTriangle className="w-6 h-6 text-[#DC2626] shrink-0 mt-0.5" />
                  <p className="text-sm font-bold leading-relaxed">{sequenceWarning}</p>
                </div>
              )}

              <div className="space-y-3">
                {[
                  {
                    stepKey: 'ramiDone' as const,
                    num: '১',
                    titleBn: 'বড় জামারায় (জামারাতুল আকাবা) ৭টি কংকর নিক্ষেপ',
                    subBn: 'প্রথম কংকর নিক্ষেপের সাথে সাথে তালবিয়াহ পড়া বন্ধ করুন',
                  },
                  {
                    stepKey: 'qurbaniDone' as const,
                    num: '২',
                    titleBn: 'দমে শুকর (হজের কুরবানি) সম্পন্ন হওয়ার নিশ্চিতকরণ',
                    subBn: 'ব্যাংক কুপন / আদাহী এসএমএস বা মোয়াল্লেমের নিশ্চিতকরণের পর পরবর্তী ধাপে যান',
                  },
                  {
                    stepKey: 'halqDone' as const,
                    num: '৩',
                    titleBn: 'হলক বা কসর (মাথা মুণ্ডন বা চুল ছোট করা)',
                    subBn: 'কুরবানির পর মাথা মুণ্ডন করলে ইহরাম থেকে হালাল হবেন',
                  },
                  {
                    stepKey: 'tawafZiyarahDone' as const,
                    num: '৪',
                    titleBn: 'তাওয়াফে জিয়ারত (ফরজ তাওয়াফ — ১০ হতে ১২ জিলহজ সূর্যাস্তের মধ্যে)',
                    subBn: 'সাধারণ সেলাইযুক্ত কাপড় পরে হারাম শরীফে গিয়ে ৭ চক্কর তাওয়াফ ও সাঈ',
                  },
                ].map((item) => {
                  const done = tenDhulHijjahChecklist[item.stepKey];
                  return (
                    <button
                      key={item.stepKey}
                      type="button"
                      onClick={() => handleToggleTenDhulHijjahStep(item.stepKey)}
                      className={`w-full min-h-[68px] p-4 rounded-2xl border-2 text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                        done
                          ? 'bg-emerald-50/80 border-[#064E3B] text-[#111827]'
                          : 'bg-slate-50 border-slate-200 text-[#111827] hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-base shrink-0 mt-0.5 ${
                          done ? 'bg-[#064E3B] text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {done ? '✓' : item.num}
                      </div>
                      <div>
                        <p className="text-base font-extrabold">{item.titleBn}</p>
                        <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{item.subBn}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PHASE 6: POST-HAJJ CONCIERGE (ZIYARAH AUDIO GUIDE & LUGGAGE TRACKER)
         ===================================================================== */}
      {activePhase === 'posthajj' && (
        <div className="space-y-6">
          {/* Return Flight Countdown Banner */}
          <div className="bg-white rounded-3xl p-5 border-2 border-[#D97706] shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Plane className="w-8 h-8 text-[#064E3B]" />
              <div>
                <p className="text-xs font-extrabold text-[#D97706]">
                  দেশে ফেরার ফ্লাইট কাউন্টডাউন · RETURN FLIGHT TO DHAKA
                </p>
                <h3 className="text-xl font-extrabold text-[#111827]">
                  ফ্লাইট {profile.outboundFlight.flightNo} ({profile.outboundFlight.fromBn} → {profile.outboundFlight.toBn}) — ৭ দিন বাকি
                </h3>
                <p className="text-sm text-slate-600">
                  {profile.outboundFlight.baggageAllowanceBn}
                </p>
              </div>
            </div>
            <div className="text-right font-mono-tabular">
              <span className="text-3xl font-extrabold text-[#064E3B]">০৭ দিন</span>
              <p className="text-xs font-semibold text-slate-600">
                প্রস্থান: {profile.outboundFlight.departureTimeBn}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Audio-Guided Ziyarah Checklist */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xl font-extrabold text-[#111827]">
                অডিও গাইডেড ঐতিহাসিক জিয়ারত তালিকা (Uhud, Quba, Hira)
              </h3>
              <div className="space-y-3">
                {ZIYARAH_SPOTS.map((spot) => {
                  const visited = !!visitedZiyarah[spot.id];
                  return (
                    <div
                      key={spot.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base sm:text-lg font-extrabold text-[#111827]">
                            {spot.nameBn}
                          </h4>
                          {showEnglish && (
                            <p className="text-xs text-slate-500">{spot.nameEn}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setVisitedZiyarah((prev) => ({
                              ...prev,
                              [spot.id]: !prev[spot.id],
                            }))
                          }
                          className={`min-h-[44px] px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer ${
                            visited
                              ? 'bg-[#064E3B] text-white'
                              : 'bg-white border border-slate-300 text-slate-700'
                          }`}
                        >
                          {visited ? '✓ জিয়ারত সম্পন্ন' : 'সম্পন্ন মার্ক করুন'}
                        </button>
                      </div>

                      <p className="text-sm text-slate-800 leading-relaxed">
                        {spot.significanceBn}
                      </p>
                      <p className="text-xs font-bold text-[#064E3B] bg-emerald-50 p-2.5 rounded-xl">
                        {spot.hanafiEtiquetteBn}
                      </p>

                      <button
                        type="button"
                        onClick={() => speakText(spot.audioScriptBn, 'bn-BD')}
                        className="w-full min-h-[52px] rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>বাংলা অডিও ইতিহাস ও আদব শুনুন (Play Audio Guide)</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Smart Shopping & Biman/Saudia Luggage Weight Tracker + SAR to BDT */}
            <div className="lg:col-span-6 space-y-5">
              {/* Luggage Weight Tracker Card */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#064E3B] shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <Luggage className="w-6 h-6 text-[#064E3B]" />
                  <h3 className="text-xl font-extrabold text-[#111827]">
                    বিমান ও সৌদিয়া লাগেজ ওজন ট্র্যাকার (2×23kg + 5L Zamzam)
                  </h3>
                </div>

                {/* Bag 1, Bag 2 & Zamzam Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    className={`p-3.5 rounded-2xl border-2 ${
                      luggageSummary.bag1Overweight
                        ? 'bg-red-50 border-[#DC2626]'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-600">ব্যাগ ১ (সর্বোচ্চ ২৩ কেজি)</p>
                    <p
                      className={`text-2xl font-extrabold font-mono-tabular mt-0.5 ${
                        luggageSummary.bag1Overweight ? 'text-[#DC2626]' : 'text-[#064E3B]'
                      }`}
                    >
                      {luggageSummary.bag1WeightKg} / 23 kg
                    </p>
                    <p className="text-xs font-semibold text-slate-600 mt-1">
                      {luggageSummary.bag1Overweight
                        ? 'সতর্কতা: ওজন বেশি হয়েছে!'
                        : `বাকি: ${luggageSummary.bag1RemainingKg} কেজি`}
                    </p>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border-2 ${
                      luggageSummary.bag2Overweight
                        ? 'bg-red-50 border-[#DC2626]'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-600">ব্যাগ ২ (সর্বোচ্চ ২৩ কেজি)</p>
                    <p
                      className={`text-2xl font-extrabold font-mono-tabular mt-0.5 ${
                        luggageSummary.bag2Overweight ? 'text-[#DC2626]' : 'text-[#064E3B]'
                      }`}
                    >
                      {luggageSummary.bag2WeightKg} / 23 kg
                    </p>
                    <p className="text-xs font-semibold text-slate-600 mt-1">
                      {luggageSummary.bag2Overweight
                        ? 'সতর্কতা: ওজন বেশি হয়েছে!'
                        : `বাকি: ${luggageSummary.bag2RemainingKg} কেজি`}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl border-2 bg-emerald-50/70 border-[#064E3B]">
                    <p className="text-xs font-bold text-[#064E3B]">জমজম পানির বোতল</p>
                    <p className="text-2xl font-extrabold font-mono-tabular text-[#064E3B] mt-0.5">
                      {luggageSummary.zamzamLiters} লিটার
                    </p>
                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      ১টি ৫L বক্স (ঢাকা এয়ারপোর্টে প্রদেয়)
                    </p>
                  </div>
                </div>

                {/* Add Shopping Item Form */}
                <form
                  onSubmit={handleAddLuggageItem}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3"
                >
                  <p className="text-sm font-extrabold text-[#111827]">
                    নতুন কেনাকাটা বা মালামাল যোগ করুন:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      aria-label="মালামালের নাম (Item Name)"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="যেমন: মরিয়ম খেজুর বা জায়নামাজ"
                      className="min-h-[48px] px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        step="0.5"
                        aria-label="ওজন কেজি (Weight kg)"
                        value={newItemWeight}
                        onChange={(e) => setNewItemWeight(e.target.value)}
                        placeholder="কেজি"
                        className="min-h-[48px] px-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold font-mono-tabular"
                      />
                      <input
                        type="number"
                        aria-label="মূল্য সৌদি রিয়াল (Price SAR)"
                        value={newItemPriceSar}
                        onChange={(e) => setNewItemPriceSar(e.target.value)}
                        placeholder="SAR"
                        className="min-h-[48px] px-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold font-mono-tabular"
                      />
                      <select
                        aria-label="ব্যাগ নির্বাচন (Select Bag)"
                        value={newItemBag}
                        onChange={(e) => setNewItemBag(Number(e.target.value) as 1 | 2)}
                        className="min-h-[48px] px-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                      >
                        <option value={1}>ব্যাগ ১</option>
                        <option value={2}>ব্যাগ ২</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full min-h-[52px] rounded-xl bg-[#064E3B] hover:bg-[#04392B] text-white font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>লাগেজে যোগ করুন (Add to Bag)</span>
                  </button>
                </form>

                {/* Item List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {luggageItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                    >
                      <div>
                        <p className="font-bold text-[#111827]">{item.nameBn}</p>
                        <p className="text-xs text-slate-600 font-mono-tabular">
                          {item.bag === 'hand' ? 'হ্যান্ডব্যাগ' : `ব্যাগ ${item.bag}`} · {item.weightKg} kg
                          {item.priceSar > 0 ? ` · ${item.priceSar} SAR` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setLuggageItems((prev) => prev.filter((i) => i.id !== item.id))
                        }
                        aria-label={`${item.nameBn} মুছে ফেলুন`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live SAR to BDT Converter Card */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-[#D97706]" />
                    <h4 className="text-lg font-extrabold text-[#111827]">
                      সৌদি রিয়াল (SAR) → বাংলাদেশি টাকা (BDT) হিসাবকারী
                    </h4>
                  </div>
                  <span className="text-xs font-mono-tabular font-bold text-[#064E3B]">
                    1 SAR = {sarRate} BDT
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label
                      htmlFor="sar-amount-input"
                      className="block text-xs font-bold text-slate-600 mb-1"
                    >
                      সৌদি রিয়াল (SAR) লিখুন:
                    </label>
                    <input
                      id="sar-amount-input"
                      type="number"
                      value={converterSarInput}
                      onChange={(e) => setConverterSarInput(e.target.value)}
                      className="w-full min-h-[56px] px-4 rounded-xl border-2 border-slate-300 font-extrabold font-mono-tabular text-xl text-[#111827]"
                    />
                  </div>
                  <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                    <p className="text-xs font-bold text-[#064E3B]">বাংলাদেশি টাকায় মূল্য:</p>
                    <p className="text-2xl sm:text-3xl font-extrabold font-mono-tabular text-[#064E3B]">
                      ৳ {Math.round((parseFloat(converterSarInput) || 0) * sarRate).toLocaleString('en-IN')} টাকা
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[10, 25, 50, 100, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setConverterSarInput(String(preset))}
                      className="min-h-[44px] px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-extrabold font-mono-tabular text-[#111827] cursor-pointer"
                    >
                      {preset} SAR
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
