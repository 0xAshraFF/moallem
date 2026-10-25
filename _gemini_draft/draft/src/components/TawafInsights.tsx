import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Volume2,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  HaramFloorId,
  FloorTrafficStatus,
  AnonymousTawafSessionSample,
  analyzeTawafCrowdTraffic,
  evaluateOverallTawafRecommendation,
} from '../utils/hajjLogic';
import { speakText } from '../utils/speech';

export interface TawafInsightsProps {
  showEnglish: boolean;
  selectedFloor?: HaramFloorId;
  onSelectFloor?: (floor: HaramFloorId) => void;
  onJumpToTawafTracker?: () => void;
  refreshTrigger?: number;
}

interface ServerFloorPayload {
  recentLapSeconds: number[];
  activePilgrims: number;
  lastReportedAtBn: string;
}

const DEFAULT_FLOOR_TELEMETRY: Record<HaramFloorId, ServerFloorPayload> = {
  ground_mataf: {
    recentLapSeconds: [380, 395, 410, 390, 405],
    activePilgrims: 148,
    lastReportedAtBn: '২ মিনিট আগে আপডেটেড',
  },
  first_floor: {
    recentLapSeconds: [405, 415, 400, 410],
    activePilgrims: 64,
    lastReportedAtBn: '১ মিনিট আগে আপডেটেড',
  },
  wheelchair_lane: {
    recentLapSeconds: [350, 360, 355, 365],
    activePilgrims: 27,
    lastReportedAtBn: 'এইমাত্র আপডেটেড',
  },
  roof_level: {
    recentLapSeconds: [460, 470, 465],
    activePilgrims: 39,
    lastReportedAtBn: '৩ মিনিট আগে আপডেটেড',
  },
};

const DEFAULT_RECENT_SESSIONS: AnonymousTawafSessionSample[] = [
  {
    sessionId: 'anon-904',
    anonymousBadgeBn: 'হাজী #A84F · মাকতাব ৪২ (ঢাকা)',
    floor: 'ground_mataf',
    completedDurationMinutes: 46,
    reportedAgoBn: '১ মিনিট আগে সম্পন্ন',
  },
  {
    sessionId: 'anon-903',
    anonymousBadgeBn: 'হাজী #C19B · মাকতাব ১৮ (চট্টগ্রাম)',
    floor: 'first_floor',
    completedDurationMinutes: 47,
    reportedAgoBn: '৩ মিনিট আগে সম্পন্ন',
  },
  {
    sessionId: 'anon-902',
    anonymousBadgeBn: 'হাজী #F32D · মাকতাব ৫১ (সিলেট)',
    floor: 'wheelchair_lane',
    completedDurationMinutes: 41,
    reportedAgoBn: '৪ মিনিট আগে সম্পন্ন',
  },
  {
    sessionId: 'anon-901',
    anonymousBadgeBn: 'হাজী #7E12 · মাকতাব ২৯ (রাজশাহী)',
    floor: 'ground_mataf',
    completedDurationMinutes: 45,
    reportedAgoBn: '৬ মিনিট আগে সম্পন্ন',
  },
];

const FLOOR_SHORT_LABELS: Record<HaramFloorId, string> = {
  ground_mataf: 'নিচতলা মাতাফ',
  first_floor: 'প্রথম তলা রিং',
  wheelchair_lane: 'হুইলচেয়ার লেন',
  roof_level: 'ছাদ তলা',
};

export const TawafInsights: React.FC<TawafInsightsProps> = ({
  showEnglish,
  selectedFloor: controlledFloor,
  onSelectFloor,
  onJumpToTawafTracker,
  refreshTrigger = 0,
}) => {
  const [internalFloor, setInternalFloor] = useState<HaramFloorId>('ground_mataf');
  const activeFloor = controlledFloor || internalFloor;

  const handleFloorChange = (floor: HaramFloorId) => {
    setInternalFloor(floor);
    if (onSelectFloor) {
      onSelectFloor(floor);
    }
  };

  const [floorTelemetry, setFloorTelemetry] = useState<
    Record<HaramFloorId, ServerFloorPayload>
  >(DEFAULT_FLOOR_TELEMETRY);
  const [recentSessions, setRecentSessions] = useState<AnonymousTawafSessionSample[]>(
    DEFAULT_RECENT_SESSIONS
  );
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [feedbackBannerBn, setFeedbackBannerBn] = useState<string | null>(null);

  const fetchAnonymousInsights = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/tawaf/insights');
      if (res.ok) {
        const data = await res.json();
        if (data?.floors) {
          setFloorTelemetry(data.floors);
        }
        if (Array.isArray(data?.recentAnonymousSessions)) {
          setRecentSessions(data.recentAnonymousSessions);
        }
      }
    } catch {
      // Keep offline defaults gracefully
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnonymousInsights();
    const interval = setInterval(fetchAnonymousInsights, 25000);
    return () => clearInterval(interval);
  }, [fetchAnonymousInsights, refreshTrigger]);

  const handleReportAnonymousSession = async (sessionDurationMinutes: number) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(45);
      } catch {
        // ignore
      }
    }

    const lapSec = Math.round((sessionDurationMinutes * 60) / 7);

    // Optimistic local state update
    setFloorTelemetry((prev) => {
      const cur = prev[activeFloor];
      return {
        ...prev,
        [activeFloor]: {
          recentLapSeconds: [...cur.recentLapSeconds.slice(-8), lapSec],
          activePilgrims: cur.activePilgrims + 1,
          lastReportedAtBn: 'এইমাত্র (আপনার অ্যানোনিমাস সেশন যুক্ত হয়েছে)',
        },
      };
    });

    setFeedbackBannerBn(
      `জাযাকাল্লাহু খাইরান! আপনার ${sessionDurationMinutes} মিনিটের অ্যানোনিমাস তাওয়াফ সেশন ডেটা যুক্ত হয়েছে।`
    );
    setTimeout(() => setFeedbackBannerBn(null), 5000);

    try {
      const res = await fetch('/api/tawaf/report-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floor: activeFloor,
          sessionDurationMinutes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.floors) {
          setFloorTelemetry(data.floors);
        }
        if (Array.isArray(data?.recentAnonymousSessions)) {
          setRecentSessions(data.recentAnonymousSessions);
        }
      }
    } catch {
      // ignore offline error
    }
  };

  // Compute Google-Maps-style traffic status across all 4 Haram levels
  const floorList: HaramFloorId[] = [
    'ground_mataf',
    'first_floor',
    'wheelchair_lane',
    'roof_level',
  ];
  const floorTrafficList: FloorTrafficStatus[] = floorList.map((f) =>
    analyzeTawafCrowdTraffic(
      f,
      floorTelemetry[f]?.recentLapSeconds || [360],
      floorTelemetry[f]?.activePilgrims || 25
    )
  );

  const selectedFloorStatus =
    floorTrafficList.find((item) => item.floor === activeFloor) || floorTrafficList[0];

  const overallSummary = evaluateOverallTawafRecommendation(floorTrafficList);

  return (
    <section
      data-testid="tawaf-insights-card"
      aria-label="লাইভ তাওয়াফ ট্রাফিক ও হাজীদের গড় সময়ের ইনসাইটস (Tawaf Insights)"
      className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#E2E6E1] shadow-[0_10px_30px_rgba(17,19,21,0.05)] space-y-5"
    >
      {/* Top Header: Google Maps Traffic Density Badge + Live Contributor Count + Voice Readout */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E6E8E5] pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#12A839] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <Activity className="w-3.5 h-3.5 text-[#12A839]" />
              <span>TAWAF INSIGHTS · GOOGLE MAPS LIVE TRAFFIC DENSITY</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-[#F4F6F3] px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-[#12A839]" />
              <span>১০০% অ্যানোনিমাস হাজী ডেটা</span>
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-[#111315]">
            এখন কি তাওয়াফ করার উপযুক্ত সময়? (লাইভ তাওয়াফ ট্রাফিক ও গড় সময়)
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            বর্তমানে মসজিদুল হারামে অবস্থানরত{' '}
            <strong className="text-[#111315] font-mono-tabular">
              {overallSummary.totalAnonymousPilgrims} জন হাজীর
            </strong>{' '}
            সম্পন্ন করা তাওয়াফ সেশনের গড় সময় থেকে সরাসরি ভিড়ের ঘনত্ব (Traffic Density)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              speakText(
                `${overallSummary.verdictHeadlineBn}। ${overallSummary.verdictDetailBn}`,
                'bn-BD'
              )
            }
            className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-[#111315] hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-[#12A839]" />
            <span>অডিও রিপোর্ট শুনুন</span>
          </button>

          <button
            type="button"
            onClick={fetchAnonymousInsights}
            aria-label="লাইভ তাওয়াফ ডেটা রিফ্রেশ করুন (Refresh Live Tawaf Insights)"
            className="min-h-[44px] px-3 py-2 rounded-2xl bg-[#F4F6F3] hover:bg-[#E6EAE4] text-[#111315] border border-[#DDE2DC] font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 text-[#12A839] ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* Primary Decision Verdict Banner: "Is now a good time to perform Tawaf?" */}
      <div
        data-testid="tawaf-insights-verdict-banner"
        className={`rounded-3xl p-4 sm:p-5 border-2 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
          selectedFloorStatus.trafficLevel === 'green_fast'
            ? 'bg-emerald-50/90 border-[#12A839]'
            : selectedFloorStatus.trafficLevel === 'yellow_moderate'
            ? 'bg-amber-50/90 border-[#F59E0B]'
            : 'bg-red-50/90 border-[#EF233C]'
        }`}
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                selectedFloorStatus.trafficLevel === 'green_fast'
                  ? 'bg-[#12A839] text-white'
                  : selectedFloorStatus.trafficLevel === 'yellow_moderate'
                  ? 'bg-[#F59E0B] text-white'
                  : 'bg-[#EF233C] text-white'
              }`}
            >
              {selectedFloorStatus.trafficLevel === 'green_fast' ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{selectedFloorStatus.statusBadgeBn}</span>
            </span>

            <span className="text-xs font-extrabold text-slate-700 bg-white/80 px-2.5 py-1 rounded-full border border-black/10">
              সেরা ফ্লোর এখন: {overallSummary.bestFloor.floorNameBn} (~
              {overallSummary.bestFloor.currentAvgMinutesFor7Laps} মি.)
            </span>
          </div>

          <h4 className="text-base sm:text-lg font-extrabold text-[#111315]">
            {overallSummary.verdictHeadlineBn}
          </h4>
          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
            {selectedFloorStatus.recommendationBn}
          </p>
          {showEnglish && (
            <p className="text-xs text-slate-600">{overallSummary.verdictHeadlineEn}</p>
          )}
        </div>

        {/* Big Average Session Duration Readout (Google Maps ETA Pill) */}
        <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-between lg:justify-end bg-white rounded-2xl px-4 py-3 border border-black/10 shadow-xs">
          <div className="text-left lg:text-right">
            <span className="text-[11px] font-bold text-slate-500 block">
              পূর্ণ তাওয়াফ সেশনের গড় সময় (৭ চক্কর)
            </span>
            <div
              data-testid="tawaf-insights-avg-duration"
              className="text-2xl sm:text-3xl font-extrabold font-mono-tabular text-[#111315]"
            >
              ~{selectedFloorStatus.currentAvgMinutesFor7Laps} মিনিট
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              স্বাভাবিক সময়: {selectedFloorStatus.baselineMinutesFor7Laps} মিনিট ·{' '}
              {selectedFloorStatus.activeAppPilgrimsCount} জন হাজী
            </span>
          </div>

          {onJumpToTawafTracker && (
            <button
              type="button"
              onClick={onJumpToTawafTracker}
              className="min-h-[48px] px-4 rounded-xl bg-[#12A839] hover:bg-[#0E8A2D] text-white font-extrabold text-xs sm:text-sm cursor-pointer shrink-0"
            >
              তাওয়াফ শুরু →
            </button>
          )}
        </div>
      </div>

      {/* 4-Floor Haram Traffic Density Grid + Google Maps Hourly Popular Times Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 7 Cols: 4-Floor Live Traffic Density Cards */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs sm:text-sm font-extrabold text-[#111315] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#12A839]" />
              <span>হারামের ৪টি তলার লাইভ ট্রাফিক ঘনত্ব (ট্যাপ করে তলা পরিবর্তন করুন)</span>
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              সবুজ = ফাঁকা · হলুদ = মাঝারি · লাল = ভিড়
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {floorTrafficList.map((fStatus) => {
              const isSelected = fStatus.floor === activeFloor;
              const densityBarPct = Math.min(
                100,
                Math.max(
                  25,
                  Math.round(
                    (fStatus.currentAvgMinutesFor7Laps /
                      (fStatus.baselineMinutesFor7Laps * 1.45)) *
                      100
                  )
                )
              );

              return (
                <button
                  key={fStatus.floor}
                  type="button"
                  onClick={() => handleFloorChange(fStatus.floor)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-[#F6F7F5] border-[#111315] shadow-xs'
                      : 'bg-white border-[#E2E6E1] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            fStatus.trafficLevel === 'green_fast'
                              ? 'bg-[#12A839]'
                              : fStatus.trafficLevel === 'yellow_moderate'
                              ? 'bg-[#F59E0B]'
                              : 'bg-[#EF233C]'
                          }`}
                        />
                        <span className="text-xs sm:text-sm font-extrabold text-[#111315]">
                          {fStatus.floorNameBn}
                        </span>
                      </div>
                      <p className="text-base sm:text-lg font-extrabold font-mono-tabular text-[#111315] mt-1">
                        ~{fStatus.currentAvgMinutesFor7Laps} মিনিট{' '}
                        <span className="text-xs font-normal text-slate-500">/ ৭ চক্কর</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block text-[11px] font-bold font-mono-tabular bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {fStatus.activeAppPilgrimsCount} জন হাজী
                      </span>
                      <span
                        className={`block text-[11px] font-extrabold mt-1 ${
                          fStatus.trafficLevel === 'green_fast'
                            ? 'text-[#12A839]'
                            : fStatus.trafficLevel === 'yellow_moderate'
                            ? 'text-[#D97706]'
                            : 'text-[#EF233C]'
                        }`}
                      >
                        {fStatus.delayMinutes > 0
                          ? `+${fStatus.delayMinutes} মি. ধীর`
                          : 'স্বাভাবিক গতি'}
                      </span>
                    </div>
                  </div>

                  {/* Google-Maps-style Traffic Density Bar */}
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        fStatus.trafficLevel === 'green_fast'
                          ? 'bg-[#12A839]'
                          : fStatus.trafficLevel === 'yellow_moderate'
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#EF233C]'
                      }`}
                      style={{ width: `${densityBarPct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Google Maps "Popular Times" Hourly Tawaf Duration Histogram */}
        <div className="lg:col-span-5 bg-[#F6F7F5] rounded-2xl p-4 border border-[#E2E6E1] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-extrabold text-[#111315] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#12A839]" />
              <span>সময়ভেদে তাওয়াফের গড় সময় (Popular Times)</span>
            </span>
            <span className="text-[11px] font-mono-tabular font-bold text-[#12A839]">
              ৭ চক্কর (মিনিট)
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2 items-end h-32 pt-4 px-1">
            {overallSummary.hourlyForecast.map((slot) => {
              const barColor =
                slot.trafficLevel === 'green_fast'
                  ? 'bg-[#12A839]'
                  : slot.trafficLevel === 'yellow_moderate'
                  ? 'bg-[#F59E0B]'
                  : 'bg-[#EF233C]';

              return (
                <div
                  key={slot.slotId}
                  className="flex flex-col items-center justify-end h-full gap-1"
                >
                  <span className="text-[10px] font-extrabold font-mono-tabular text-[#111315]">
                    {slot.avgDurationMinutes}মি
                  </span>
                  <div className="w-full bg-white rounded-t-lg h-20 flex items-end overflow-hidden border border-[#DDE2DC]">
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${barColor} ${
                        slot.isCurrentWindow ? 'ring-2 ring-[#111315]' : 'opacity-85'
                      }`}
                      style={{ height: `${slot.densityPercent}%` }}
                    />
                  </div>
                  <span
                    className={`text-[10px] text-center leading-tight font-bold ${
                      slot.isCurrentWindow ? 'text-[#111315] font-extrabold' : 'text-slate-600'
                    }`}
                  >
                    {slot.isCurrentWindow ? 'এখন' : slot.labelEn}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] font-semibold text-slate-600 bg-white px-3 py-2 rounded-xl border border-[#E2E6E1]">
            💡 <strong className="text-[#111315]">পরামর্শ:</strong> বয়স্ক হাজীদের জন্য{' '}
            <strong className="text-[#12A839]">রাত ২টা (তাহাজ্জুদ)</strong> এবং{' '}
            <strong className="text-[#12A839]">সকাল ৯টা</strong> সবচেয়ে কম ভিড়ের সময় (~৩৩-৩৬ মিনিটে ৭ চক্কর)।
          </p>
        </div>
      </div>

      {/* Bottom Row: Live Feed of Recent Anonymous Pilgrim Sessions + One-Tap Anonymous Contribution */}
      <div className="bg-[#F6F7F5] rounded-2xl p-4 border border-[#E2E6E1] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs sm:text-sm font-extrabold text-[#111315] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#12A839]" />
              <span>সদ্য তাওয়াফ শেষ করা হাজীদের অ্যানোনিমাস সেশন (Recent Anonymous Sessions)</span>
            </span>
          </div>

          {/* One-Tap Anonymous Session Contribution Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600 mr-1">
              আপনার তাওয়াফের সময় জানান:
            </span>
            <button
              type="button"
              data-testid="report-fast-session-btn"
              onClick={() => handleReportAnonymousSession(34)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-[#12A839] border border-[#12A839] font-extrabold text-xs cursor-pointer"
            >
              🟢 ৩৪ মি. (ফাঁকা)
            </button>
            <button
              type="button"
              data-testid="report-moderate-session-btn"
              onClick={() => handleReportAnonymousSession(46)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-[#D97706] border border-[#D97706] font-extrabold text-xs cursor-pointer"
            >
              🟡 ৪৬ মি. (মাঝারি)
            </button>
            <button
              type="button"
              data-testid="report-slow-session-btn"
              onClick={() => handleReportAnonymousSession(62)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-[#EF233C] border border-[#EF233C] font-extrabold text-xs cursor-pointer"
            >
              🔴 ৬২ মি. (প্রচণ্ড ভিড়)
            </button>
          </div>
        </div>

        {feedbackBannerBn && (
          <div className="bg-emerald-950 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FBBF24] shrink-0" />
            <span>{feedbackBannerBn}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {recentSessions.slice(0, 4).map((s) => (
            <div
              key={s.sessionId}
              className="bg-white rounded-xl px-3 py-2.5 border border-[#E2E6E1] flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[#111315] truncate">
                  {s.anonymousBadgeBn}
                </p>
                <p className="text-[11px] font-semibold text-slate-500">
                  {FLOOR_SHORT_LABELS[s.floor] || 'মাতাফ চত্বর'} · {s.reportedAgoBn}
                </p>
              </div>
              <span className="text-xs font-extrabold font-mono-tabular bg-emerald-50 text-[#064E3B] px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                {s.completedDurationMinutes} মি.
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
