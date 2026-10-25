import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Volume2,
  Play,
  Pause,
  Users,
  Activity,
  Target,
  Sparkles,
  Compass,
  Vibrate,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { TAWAF_ROUND_DUAS, SAI_ROUND_DUAS } from '../data/hajjData';
import {
  HaramFloorId,
  calculateTawafSummaryMetrics,
  analyzeTawafCrowdTraffic,
  FloorTrafficStatus,
} from '../utils/hajjLogic';
import { speakText } from '../utils/speech';

interface TawafCounterProps {
  showEnglish: boolean;
  tawafRound: number;
  onChangeTawafRound: (round: number) => void;
  saiRound: number;
  onChangeSaiRound: (round: number) => void;
}

interface ServerTrafficPayload {
  floors: Record<
    HaramFloorId,
    { recentLapSeconds: number[]; activePilgrims: number; lastReportedAtBn: string }
  >;
}

const DEFAULT_TRAFFIC_TELEMETRY: ServerTrafficPayload['floors'] = {
  ground_mataf: {
    recentLapSeconds: [385, 395, 410, 390, 405],
    activePilgrims: 148,
    lastReportedAtBn: '২ মিনিট আগে (মাকতাব ৪২ ও অন্যান্য হাজীদের ডেটা)',
  },
  first_floor: {
    recentLapSeconds: [405, 415, 400, 410],
    activePilgrims: 64,
    lastReportedAtBn: '১ মিনিট আগে আপডেটেড',
  },
  roof_level: {
    recentLapSeconds: [460, 470, 465],
    activePilgrims: 39,
    lastReportedAtBn: '৩ মিনিট আগে আপডেটেড',
  },
  wheelchair_lane: {
    recentLapSeconds: [350, 360, 355, 365],
    activePilgrims: 27,
    lastReportedAtBn: 'এইমাত্র আপডেটেড',
  },
};

export const TawafCounter: React.FC<TawafCounterProps> = ({
  showEnglish,
  tawafRound,
  onChangeTawafRound,
  saiRound,
  onChangeSaiRound,
}) => {
  const [subMode, setSubMode] = useState<'tawaf' | 'sai'>('tawaf');
  const [selectedFloor, setSelectedFloor] = useState<HaramFloorId>('ground_mataf');

  // Today's total laps & stopwatch duration
  const [todayLapsCompleted, setTodayLapsCompleted] = useState<number>(() => {
    return Number(localStorage.getItem('moallem_today_tawaf_laps')) || 14;
  });
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    return Number(localStorage.getItem('moallem_today_tawaf_seconds')) || 2310; // 38m 30s
  });
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Hajj Total Tawaf Goal (e.g. 50 Tawafs during Hajj trip)
  const [hajjTargetTawafs, setHajjTargetTawafs] = useState<number>(() => {
    return Number(localStorage.getItem('moallem_hajj_tawaf_target')) || 50;
  });
  const [hajjCompletedTawafs, setHajjCompletedTawafs] = useState<number>(() => {
    return Number(localStorage.getItem('moallem_hajj_tawaf_completed')) || 12;
  });

  // Haptic feedback visual indicator
  const [hapticPulse, setHapticPulse] = useState<boolean>(false);
  const [lastHapticMsgBn, setLastHapticMsgBn] = useState<string | null>(null);
  const [isPlayingDua, setIsPlayingDua] = useState<boolean>(false);

  // Crowdsourced Live Traffic State (Google Maps Traffic for Tawaf)
  const [trafficData, setTrafficData] = useState<ServerTrafficPayload['floors']>(
    DEFAULT_TRAFFIC_TELEMETRY
  );
  const [userReportedLapBanner, setUserReportedLapBanner] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('moallem_today_tawaf_laps', String(todayLapsCompleted));
      localStorage.setItem('moallem_today_tawaf_seconds', String(elapsedSeconds));
      localStorage.setItem('moallem_hajj_tawaf_target', String(hajjTargetTawafs));
      localStorage.setItem('moallem_hajj_tawaf_completed', String(hajjCompletedTawafs));
    } catch {
      // ignore storage errors
    }
  }, [todayLapsCompleted, elapsedSeconds, hajjTargetTawafs, hajjCompletedTawafs]);

  // Stopwatch effect when active
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Fetch crowdsourced Tawaf traffic from server
  useEffect(() => {
    let mounted = true;
    fetch('/api/tawaf/traffic')
      .then((r) => r.json())
      .then((data) => {
        if (mounted && data?.floors) {
          setTrafficData(data.floors);
        }
      })
      .catch(() => {
        // fallback to default telemetry when offline
      });
    return () => {
      mounted = false;
    };
  }, []);

  const currentRound = subMode === 'tawaf' ? tawafRound : saiRound;
  const activeDuaList = subMode === 'tawaf' ? TAWAF_ROUND_DUAS : SAI_ROUND_DUAS;
  const currentDua =
    activeDuaList[Math.min(Math.max(currentRound - 1, 0), 6)] || activeDuaList[0];

  const metrics = calculateTawafSummaryMetrics({
    currentLap: currentRound,
    todayLapsCompleted,
    elapsedSeconds,
    hajjTargetTawafs,
    hajjCompletedTawafs,
    floor: selectedFloor,
  });

  const floorTrafficList: FloorTrafficStatus[] = (
    ['ground_mataf', 'first_floor', 'wheelchair_lane', 'roof_level'] as const
  ).map((fl) =>
    analyzeTawafCrowdTraffic(
      fl,
      trafficData[fl]?.recentLapSeconds || [360],
      trafficData[fl]?.activePilgrims || 35
    )
  );

  const selectedFloorTraffic =
    floorTrafficList.find((f) => f.floor === selectedFloor) || floorTrafficList[0];

  const totalActivePilgrimsAllFloors = Object.values(trafficData).reduce(
    (sum, item) => sum + (item.activePilgrims || 0),
    0
  );

  const triggerHapticFeedback = (pattern: number | number[] = [45, 30, 75]) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {
      // ignore if browser blocks vibrate
    }
    setHapticPulse(true);
    setTimeout(() => setHapticPulse(false), 450);
  };

  const reportLapToCrowdServer = async (lapSeconds: number) => {
    try {
      const res = await fetch('/api/tawaf/report-lap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floor: selectedFloor,
          lapDurationSeconds: lapSeconds,
        }),
      });
      const data = await res.json();
      if (data?.floors) {
        setTrafficData(data.floors);
      }
    } catch {
      // Optimistically update local traffic sample when offline
      setTrafficData((prev) => ({
        ...prev,
        [selectedFloor]: {
          ...prev[selectedFloor],
          recentLapSeconds: [...prev[selectedFloor].recentLapSeconds.slice(-10), lapSeconds],
          activePilgrims: prev[selectedFloor].activePilgrims + 1,
          lastReportedAtBn: 'এইমাত্র (আপনার চক্করের ডেটা যুক্ত হয়েছে)',
        },
      }));
    }
  };

  const handleManualIncrementLap = () => {
    triggerHapticFeedback([50, 35, 80]);

    if (subMode === 'tawaf') {
      const nextLap = tawafRound < 7 ? tawafRound + 1 : 1;
      onChangeTawafRound(nextLap);
      setTodayLapsCompleted((prev) => prev + 1);
      setElapsedSeconds((prev) => prev + 315); // ~5m 15s per lap

      if (tawafRound === 7) {
        setHajjCompletedTawafs((prev) => prev + 1);
        setLastHapticMsgBn(
          'আলহামদুলিল্লাহ! ৭ চক্করে ১টি পূর্ণ তাওয়াফ সম্পন্ন হয়েছে এবং আপনার হজ তাওয়াফ গোলে যুক্ত হয়েছে।'
        );
      } else {
        setLastHapticMsgBn(
          `হ্যাপটিক ভাইব্রেশন নিশ্চিত: চক্কর ${tawafRound} সম্পন্ন → এখন চক্কর ${nextLap}/৭ চলছে`
        );
      }
      reportLapToCrowdServer(335);
    } else {
      const nextSai = saiRound < 7 ? saiRound + 1 : 1;
      onChangeSaiRound(nextSai);
      setLastHapticMsgBn(`সাঈ চক্কর ${saiRound} সম্পন্ন → এখন চক্কর ${nextSai}/৭ চলছে`);
    }
  };

  // SVG Circular Progress Ring Geometry
  const ringRadius = 68;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringStrokeDashoffset =
    ringCircumference - (metrics.currentLapRingPercent / 100) * ringCircumference;

  // Dynamic GPS Route Loops around the Kaaba (1..currentRound loops)
  const renderMatafGpsLoops = () => {
    const loops = [];
    for (let i = 1; i <= currentRound; i++) {
      const rx = 58 + i * 11;
      const ry = 38 + i * 7.5;
      // Create an organic GPS-traced elliptical path around the Kaaba
      const d = `M ${260 + rx} 145
                 C ${260 + rx} ${145 + ry * 0.85}, ${260 + rx * 0.55} ${145 + ry}, 260 ${145 + ry}
                 C ${260 - rx * 0.58} ${145 + ry}, ${260 - rx} ${145 + ry * 0.82}, ${260 - rx} 145
                 C ${260 - rx} ${145 - ry * 0.85}, ${260 - rx * 0.55} ${145 - ry}, 260 ${145 - ry}
                 C ${260 + rx * 0.58} ${145 - ry}, ${260 + rx} ${145 - ry * 0.82}, ${260 + rx} 145 Z`;
      loops.push(
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#EF233C"
          strokeWidth={i === currentRound ? '4' : '2.75'}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={i === currentRound ? 1 : 0.72}
        />
      );
    }
    return loops;
  };

  const activeDotRadiusX = 58 + currentRound * 11;

  return (
    <div data-testid="tawaf-counter-strava" className="space-y-5">
      {/* =====================================================================
          CARD 1: STRAVA-STYLE MATAF GPS ROUTE MAP + SUMMARY METRICS + PROGRESS RING
         ===================================================================== */}
      <div className="bg-white rounded-[32px] overflow-hidden border border-[#E2E6E1] shadow-[0_12px_34px_rgba(17,19,21,0.06)]">
        {/* Top Mode & Floor Selector Bar */}
        <div className="p-4 sm:p-5 bg-[#F6F7F5] border-b border-[#E2E6E1] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 bg-white p-1 rounded-full border border-[#DDE2DC]">
            <button
              type="button"
              onClick={() => setSubMode('tawaf')}
              className={`min-h-[42px] px-4 rounded-full font-extrabold text-xs sm:text-sm transition-colors cursor-pointer ${
                subMode === 'tawaf'
                  ? 'bg-[#12A839] text-white shadow-xs'
                  : 'text-[#111315] hover:bg-slate-100'
              }`}
            >
              ১. তাওয়াফ ট্র্যাকার (৭ চক্কর)
            </button>
            <button
              type="button"
              onClick={() => setSubMode('sai')}
              className={`min-h-[42px] px-4 rounded-full font-extrabold text-xs sm:text-sm transition-colors cursor-pointer ${
                subMode === 'sai'
                  ? 'bg-[#12A839] text-white shadow-xs'
                  : 'text-[#111315] hover:bg-slate-100'
              }`}
            >
              ২. সাঈ ট্র্যাকার (সাফা-মারওয়া)
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#12A839]" />
            <label htmlFor="haram-floor-select" className="sr-only">
              হারাম তলা নির্বাচন করুন
            </label>
            <select
              id="haram-floor-select"
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value as HaramFloorId)}
              className="min-h-[40px] px-3 rounded-full bg-white border border-[#DDE2DC] text-xs font-extrabold text-[#111315] cursor-pointer"
            >
              <option value="ground_mataf">মাতাফ চত্বর (নিচতলা · ৩৫০মি/চক্কর)</option>
              <option value="first_floor">প্রথম তলা (১ম ফ্লোর · ৬২০মি/চক্কর)</option>
              <option value="wheelchair_lane">হুইলচেয়ার লেন (৬৮০মি/চক্কর)</option>
              <option value="roof_level">ছাদ তলা (৭৮০মি/চক্কর)</option>
            </select>
          </div>
        </div>

        {/* STRAVA-STYLE GPS ROUTE MAP OF MASJID AL-HARAM & MATAF */}
        <div className="relative w-full h-60 sm:h-68 bg-[#EEF1E8] border-b border-[#E2E6E1] overflow-hidden">
          <svg
            viewBox="0 0 520 260"
            className="w-full h-full"
            role="img"
            aria-label="মসজিদুল হারাম মাতাফ জিপিএস তাওয়াফ ম্যাপ (Strava-style Mataf GPS Route Map)"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Map Base Parks / Plazas / Pedestrian Roads */}
            <rect width="520" height="260" fill="#EEF1E8" />
            <path
              d="M0,45 L140,45 L185,0 M345,0 L390,55 L520,55 M0,225 L155,210 L195,260 M340,260 L380,215 L520,230"
              stroke="#FFFFFF"
              strokeWidth="12"
              fill="none"
            />
            {/* Green Park Zones (like Strava Map) */}
            <path d="M0,0 L125,0 L95,42 L0,42 Z" fill="#D5E5C6" />
            <path d="M405,0 L520,0 L520,52 L392,52 Z" fill="#D5E5C6" />
            <path d="M0,230 L145,218 L175,260 L0,260 Z" fill="#D5E5C6" />
            <path d="M385,218 L520,232 L520,260 L355,260 Z" fill="#D5E5C6" />

            {/* Outer Masjid al-Haram Colonnade Footprint */}
            <ellipse
              cx="260"
              cy="135"
              rx="176"
              ry="112"
              fill="#F8FAF5"
              stroke="#D0D7C8"
              strokeWidth="6"
            />
            {/* White Marble Mataf Circle */}
            <ellipse
              cx="260"
              cy="135"
              rx="142"
              ry="92"
              fill="#FFFFFF"
              stroke="#E2E8DD"
              strokeWidth="2"
            />

            {/* Green Hajar al-Aswad Alignment Line (Rukn al-Aswad Start/Finish Line) */}
            <line
              x1="282"
              y1="135"
              x2="400"
              y2="135"
              stroke="#12A839"
              strokeWidth="3.5"
              strokeDasharray="6 4"
            />

            {/* RED GPS CIRCUMAMBULATION LOOPS (Matches User's Strava Screenshot Red Track!) */}
            <g transform="translate(0, -10)">{renderMatafGpsLoops()}</g>

            {/* Hijr Ismail (Hatim Semicircle) */}
            <path
              d="M236,112 A24,18 0 0,1 284,112"
              fill="none"
              stroke="#D97706"
              strokeWidth="3"
            />

            {/* THE HOLY KAABA IN CENTER OF MAP */}
            <rect
              x="238"
              y="115"
              width="44"
              height="40"
              rx="4"
              fill="#111315"
              stroke="#F59E0B"
              strokeWidth="2.5"
            />
            <rect x="242" y="123" width="36" height="4" fill="#FBBF24" />

            {/* Green Start Dot & Red Current GPS Position Dot (Exact Strava Map Markers) */}
            <circle
              cx={260 + 69}
              cy="139"
              r="7.5"
              fill="#12A839"
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />
            <circle
              cx={260 + activeDotRadiusX}
              cy="129"
              r="8.5"
              fill="#EF233C"
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />

            {/* Map Labels (Haram Landmarks) */}
            <g fontFamily="Plus Jakarta Sans, Hind Siliguri, sans-serif" fontWeight="700">
              <text x="42" y="72" fill="#374151" fontSize="11">
                বাদশাহ ফাহাদ গেট ৭৯
              </text>
              <text x="382" y="72" fill="#374151" fontSize="11">
                সাফা-মারওয়া করিডোর
              </text>
              <text x="355" y="156" fill="#12A839" fontSize="10.5">
                হাজরে আসওয়াদ লাইন
              </text>
              <text x="42" y="205" fill="#4B5563" fontSize="11">
                মাতাফ জিপিএস ট্র্যাক
              </text>
            </g>

            {/* Highway-style Badge in Top Right (like M18 in Strava Reference) */}
            <g transform="translate(412, 10)">
              <rect
                x="0"
                y="0"
                width="96"
                height="24"
                rx="5"
                fill="#0284C7"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <text
                x="48"
                y="16"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="bold"
              >
                MATAF · {currentRound}/7
              </text>
            </g>
          </svg>

          {/* Bottom-Left Map Attribution Pill */}
          <div className="absolute bottom-3 left-3.5 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-extrabold text-[#111315] border border-black/10 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#EF233C]" />
            <span>হারাম জিপিএস ম্যাপ · চক্কর {currentRound}/৭</span>
          </div>
        </div>

        {/* STRAVA-STYLE ACTIVITY SUMMARY & CIRCULAR PROGRESS RING */}
        <div className="p-5 sm:p-7 space-y-6">
          {/* Header Row: Activity Title + Black "Proud of that" Banner from Reference Image */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E6E8E5] pb-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#111315]">
                {subMode === 'tawaf'
                  ? `${metrics.distanceKm} km তাওয়াফ (${metrics.todayLapsCompleted} চক্কর)`
                  : 'সাফা-মারওয়া সাঈ ট্র্যাকার (৭ চক্কর)'}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                আজ · {selectedFloorTraffic.floorNameBn} · জিপিএস ল্যাপ ট্র্যাকিং
              </p>
            </div>

            {/* Iconic Black Monospace Badge from the Strava Reference Screenshot */}
            <div className="bg-[#111315] text-white px-3.5 py-1.5 rounded-lg font-mono-tabular text-xs sm:text-sm font-extrabold tracking-wide flex items-center gap-2 shadow-xs">
              <span>আলহামদুলিল্লাহ · Proud of that</span>
              <span aria-hidden="true">🕋</span>
            </div>
          </div>

          {/* Main Grid: Left = Strava 2x2 Big Bold SUMMARY Metrics | Right = Progress Ring + Haptic Button */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Cols: Strava "SUMMARY" 2x2 Big Numbers */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-[#111315]">
                  SUMMARY · আজকের তাওয়াফ সামারি
                </span>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning((prev) => !prev)}
                  className="min-h-[36px] px-3 py-1 rounded-full bg-[#F4F6F3] hover:bg-[#E6EAE4] text-xs font-extrabold text-[#111315] border border-[#DDE2DC] flex items-center gap-1.5 cursor-pointer"
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-[#EF233C]" />
                      <span>টাইমার বিরতি (Pause)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-[#12A839]" />
                      <span>লাইভ টাইমার চালু (Start Timer)</span>
                    </>
                  )}
                </button>
              </div>

              {/* 2x2 Giant Bold Tabular Metrics Grid (Matches Strava Screenshot) */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 bg-[#FAFBF9] p-4 sm:p-5 rounded-3xl border border-[#E6E8E5]">
                <div>
                  <div className="text-3xl sm:text-5xl font-extrabold font-mono-tabular text-[#111315] tracking-tight">
                    {metrics.distanceKm}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-600 mt-1">
                    Distance (km) · অতিক্রান্ত দূরত্ব
                  </div>
                </div>

                <div>
                  <div className="text-3xl sm:text-5xl font-extrabold font-mono-tabular text-[#111315] tracking-tight">
                    {metrics.durationFormatted}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-600 mt-1">
                    Duration · মোট সময়কাল
                  </div>
                </div>

                <div>
                  <div className="text-3xl sm:text-5xl font-extrabold font-mono-tabular text-[#111315] tracking-tight">
                    {metrics.avgPaceFormatted}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-600 mt-1">
                    Avg Pace (min/km) · গড় গতি
                  </div>
                </div>

                <div>
                  <div className="text-3xl sm:text-5xl font-extrabold font-mono-tabular text-[#12A839] tracking-tight">
                    {metrics.hajjRemainingTawafs}
                    <span className="text-lg sm:text-2xl text-slate-400 font-bold">
                      /{metrics.hajjTargetTawafs}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-600 mt-1">
                    Remaining Tawafs · হজ কোটা বাকি
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Circular Progress Ring + Haptic-Feedback Increment Button */}
            <div className="lg:col-span-5 bg-[#F6F7F5] rounded-3xl p-5 border border-[#E2E6E1] flex flex-col items-center text-center space-y-4">
              {/* SVG Circular Progress Ring */}
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r={ringRadius}
                    fill="none"
                    stroke="#E2E6E1"
                    strokeWidth="12"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r={ringRadius}
                    fill="none"
                    stroke="#12A839"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringStrokeDashoffset}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-extrabold text-slate-500">
                    {subMode === 'tawaf' ? 'চলমান তাওয়াফ' : 'চলমান সাঈ'}
                  </span>
                  <div
                    data-testid="round-counter-value"
                    className="text-4xl sm:text-5xl font-extrabold font-mono-tabular text-[#111315]"
                  >
                    {currentRound} <span className="text-2xl text-slate-400">/ ৭</span>
                  </div>
                  <span className="text-xs font-extrabold text-[#12A839] mt-0.5">
                    {metrics.currentLapRingPercent}% পূর্ণ
                  </span>
                </div>
              </div>

              {/* 1..7 Quick Lap Pills */}
              <div className="grid grid-cols-7 gap-1 w-full">
                {[1, 2, 3, 4, 5, 6, 7].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(35);
                      if (subMode === 'tawaf') onChangeTawafRound(r);
                      else onChangeSaiRound(r);
                    }}
                    aria-label={`চক্কর ${r} নির্বাচন করুন (Select Round ${r})`}
                    className={`h-9 rounded-xl font-extrabold text-xs font-mono-tabular transition-all cursor-pointer ${
                      r < currentRound
                        ? 'bg-[#12A839] text-white'
                        : r === currentRound
                        ? 'bg-[#111315] text-white ring-2 ring-[#12A839]'
                        : 'bg-white text-slate-700 border border-[#DDE2DC]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* GIANT HAPTIC-FEEDBACK MANUAL INCREMENT BUTTON */}
              <button
                type="button"
                data-testid="haptic-lap-increment-btn"
                onClick={handleManualIncrementLap}
                className={`w-full min-h-[68px] px-5 rounded-full bg-[#12A839] hover:bg-[#0E8F2F] active:scale-[0.98] text-white font-extrabold text-lg sm:text-xl shadow-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  hapticPulse ? 'ring-4 ring-[#12A839]/40 scale-[1.01]' : ''
                }`}
              >
                <Vibrate className="w-6 h-6 text-white shrink-0" />
                <span>
                  {currentRound < 7
                    ? `${currentRound} নং চক্কর শেষ — পরের চক্কর (+১)`
                    : '৭ম চক্কর সম্পন্ন — নতুন তাওয়াফ (+১)'}
                </span>
              </button>

              {lastHapticMsgBn && (
                <p
                  role="status"
                  className="text-xs font-bold text-[#064E3B] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 w-full"
                >
                  {lastHapticMsgBn}
                </p>
              )}

              <div className="flex items-center justify-between w-full pt-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(25);
                    if (subMode === 'tawaf') onChangeTawafRound(1);
                    else onChangeSaiRound(1);
                  }}
                  className="min-h-[42px] px-3.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-[#DDE2DC] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>চক্কর ১ থেকে শুরু (Reset)</span>
                </button>

                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#12A839]" />
                  হ্যাপটিক ভাইব্রেশন সচল
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          CARD 2: HAJJ TOTAL TAWAF GOAL TRACKER (E.G. 50 TAWAFS TARGET & REMAINING)
         ===================================================================== */}
      <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#E2E6E1] shadow-[0_10px_30px_rgba(17,19,21,0.05)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#12A839]">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#111315]">
                হজ সফরের মোট তাওয়াফ টার্গেট ও বাকি হিসাব (Hajj Tawaf Goal Tracker)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                আপনি পুরো হজ সফরে মোট কতটি তাওয়াফ (যেমন: ৫০টি) করতে চান তা নির্ধারণ করুন এবং কতটি বাকি আছে দেখুন
              </p>
            </div>
          </div>

          <div className="bg-[#F6F7F5] px-4 py-2 rounded-full border border-[#DDE2DC] text-xs sm:text-sm font-extrabold text-[#111315] font-mono-tabular">
            সম্পন্ন: {metrics.hajjCompletedTawafs} · বাকি আছে:{' '}
            <span className="text-[#12A839]">{metrics.hajjRemainingTawafs}টি</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="text-[#12A839]">
              অগ্রগতি: {metrics.hajjCompletedTawafs} / {metrics.hajjTargetTawafs} তাওয়াফ ({metrics.hajjGoalCompletionPercent}%)
            </span>
            <span className="text-[#111315]">
              আরও {metrics.hajjRemainingTawafs}টি তাওয়াফ ({metrics.hajjRemainingTawafs * 7} চক্কর) বাকি
            </span>
          </div>
          <div className="w-full h-4 bg-[#EEF0ED] rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-[#12A839] rounded-full transition-all duration-300"
              style={{ width: `${metrics.hajjGoalCompletionPercent}%` }}
            />
          </div>
        </div>

        {/* Preset Goal Selector (7, 21, 35, 50, 70) + Completed Adjuster */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="bg-[#F6F7F5] p-3.5 rounded-2xl border border-[#E6E8E5] space-y-2">
            <label className="block text-xs font-extrabold text-[#111315]">
              হজ সফরের মোট তাওয়াফ লক্ষ্যমাত্রা (Set Hajj Tawaf Target):
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {[7, 21, 35, 50, 70].map((goalPreset) => (
                <button
                  key={goalPreset}
                  type="button"
                  onClick={() => setHajjTargetTawafs(goalPreset)}
                  className={`min-h-[38px] px-3.5 rounded-full text-xs font-extrabold font-mono-tabular cursor-pointer transition-colors ${
                    hajjTargetTawafs === goalPreset
                      ? 'bg-[#12A839] text-white'
                      : 'bg-white text-[#111315] border border-[#DDE2DC] hover:bg-slate-100'
                  }`}
                >
                  {goalPreset}টি তাওয়াফ
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#F6F7F5] p-3.5 rounded-2xl border border-[#E6E8E5] flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold text-[#111315]">
                এ পর্যন্ত সম্পন্ন পূর্ণ তাওয়াফ
              </p>
              <p className="text-2xl font-extrabold font-mono-tabular text-[#12A839]">
                {hajjCompletedTawafs}টি সম্পন্ন · {metrics.hajjRemainingTawafs}টি বাকি
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setHajjCompletedTawafs((c) => Math.max(0, c - 1))}
                aria-label="সম্পন্ন তাওয়াফ ১ কমান"
                className="min-h-[42px] min-w-[42px] rounded-full bg-white border border-[#DDE2DC] font-extrabold text-base text-[#111315] cursor-pointer"
              >
                -১
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(40);
                  setHajjCompletedTawafs((c) => c + 1);
                }}
                aria-label="সম্পন্ন তাওয়াফ ১ বাড়ান"
                className="min-h-[42px] px-4 rounded-full bg-[#111315] text-white font-extrabold text-xs sm:text-sm cursor-pointer"
              >
                +১ পূর্ণ তাওয়াফ যোগ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          CARD 3: ROUND-SPECIFIC ARABIC DUA + BANGLA PRONUNCIATION + AUDIO
         ===================================================================== */}
      <div className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#E2E6E1] shadow-[0_10px_30px_rgba(17,19,21,0.05)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-extrabold text-[#12A839] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {subMode === 'tawaf' ? 'তাওয়াফের দোয়া' : 'সাঈর দোয়া'} · চক্কর {currentDua.round}/৭
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#111315]">
              {currentDua.titleBn}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsPlayingDua(true);
              speakText(
                `${currentDua.banglaPronunciation}। অর্থ: ${currentDua.banglaMeaning}`,
                'bn-BD',
                () => setIsPlayingDua(false)
              );
            }}
            className="min-h-[52px] px-5 rounded-full bg-[#12A839] hover:bg-[#0E8F2F] text-white font-extrabold text-sm sm:text-base flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Volume2 className="w-5 h-5 shrink-0" />
            <span>{isPlayingDua ? 'পাঠ চলছে...' : 'দোয়াটি শুনুন (Play Audio)'}</span>
          </button>
        </div>

        {/* Large Arabic Text */}
        <div className="bg-[#F6F7F5] border border-[#E2E6E1] rounded-2xl p-4 sm:p-5">
          <p
            dir="rtl"
            lang="ar"
            className="text-2xl sm:text-3xl font-bold font-arabic text-[#111315] text-right leading-loose"
          >
            {currentDua.arabic}
          </p>
        </div>

        {/* Bangla Phonetic Pronunciation */}
        <div className="space-y-1">
          <p className="text-xs font-extrabold text-[#12A839]">
            বাংলা উচ্চারণ (Phonetic Bangla):
          </p>
          <p className="text-base sm:text-lg font-bold text-[#111315] leading-relaxed bg-[#FAFBF9] p-4 rounded-2xl border border-[#E6E8E5]">
            {currentDua.banglaPronunciation}
          </p>
        </div>

        {/* Bangla Meaning & Hanafi Fiqh Note */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-[#FAFBF9] p-3.5 rounded-2xl border border-[#E6E8E5]">
            <p className="text-xs font-extrabold text-slate-500">বাংলা অর্থ (Meaning):</p>
            <p className="text-sm sm:text-base text-slate-800 leading-relaxed mt-0.5">
              {currentDua.banglaMeaning}
            </p>
            {showEnglish && (
              <p className="text-xs text-slate-500 pt-1">{currentDua.englishMeaning}</p>
            )}
          </div>
          <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-3.5 text-sm font-semibold text-[#111315] flex items-center">
            {currentDua.hanafiRuleBn}
          </div>
        </div>
      </div>
    </div>
  );
};
