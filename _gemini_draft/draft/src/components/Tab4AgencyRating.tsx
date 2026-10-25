import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  MapPin,
  PlusCircle,
  Lock,
  Unlock,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { INITIAL_HAJJ_AGENCIES, HajjAgency, AgencyReview } from '../data/hajjData';
import {
  calculateDistanceDiscrepancy,
  validateBdPid,
} from '../utils/hajjLogic';

interface Tab4Props {
  defaultPid: string;
  showEnglish: boolean;
}

export const Tab4AgencyRating: React.FC<Tab4Props> = ({ defaultPid, showEnglish }) => {
  const [agencies, setAgencies] = useState<HajjAgency[]>(() => {
    try {
      const saved = localStorage.getItem('moallem_haab_agencies');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_HAJJ_AGENCIES;
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'honest' | 'discrepancy'>('all');

  // Verified Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [pidToVerify, setPidToVerify] = useState<string>('');
  const [isPidUnlocked, setIsPidUnlocked] = useState<boolean>(false);
  const [pidModalError, setPidModalError] = useState<string | null>(null);

  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(
    INITIAL_HAJJ_AGENCIES[0].id
  );
  const [reviewerName, setReviewerName] = useState<string>('আলহাজ্ব মোঃ আব্দুল করিম');
  const [promisedInput, setPromisedInput] = useState<string>('400');
  const [actualGpsInput, setActualGpsInput] = useState<string>('440');
  const [scoreDistance, setScoreDistance] = useState<number>(5);
  const [scoreFood, setScoreFood] = useState<number>(5);
  const [scoreMoallem, setScoreMoallem] = useState<number>(5);
  const [scoreLuggage, setScoreLuggage] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewFormError, setReviewFormError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('moallem_haab_agencies', JSON.stringify(agencies));
    } catch {
      // ignore
    }
  }, [agencies]);

  const filteredAgencies = agencies.filter((agency) => {
    const matchesQuery =
      !searchQuery.trim() ||
      agency.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.haabLicense.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesQuery) return false;

    const analysis = calculateDistanceDiscrepancy(
      agency.brochurePromisedMeters,
      agency.gpsVerifiedActualMeters
    );

    if (filterMode === 'honest') {
      return analysis.status === 'honest';
    }
    if (filterMode === 'discrepancy') {
      return analysis.status !== 'honest';
    }
    return true;
  });

  const handleUnlockPidForm = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateBdPid(pidToVerify);
    if (!res.valid) {
      setPidModalError(res.errorBn || 'সঠিক ১১ সংখ্যার পিআইডি দিন।');
      setIsPidUnlocked(false);
      return;
    }
    setPidModalError(null);
    setPidToVerify(res.normalized);
    setIsPidUnlocked(true);
  };

  const handleSubmitVerifiedReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPidUnlocked) {
      setPidModalError('রিভিউ দেওয়ার আগে ১১ সংখ্যার পিআইডি যাচাই করুন।');
      return;
    }
    if (!reviewComment.trim()) {
      setReviewFormError('অনুগ্রহ করে আপনার অভিজ্ঞতার বিবরণ বাংলায় লিখুন।');
      return;
    }

    const promisedM = Math.max(50, Number(promisedInput) || 400);
    const actualM = Math.max(50, Number(actualGpsInput) || 450);
    const avgScore =
      Math.round(((scoreDistance + scoreFood + scoreMoallem + scoreLuggage) / 4) * 10) / 10;

    const maskedPid = `${pidToVerify.slice(0, 6)}***${pidToVerify.slice(-2)}`;
    const newReview: AgencyReview = {
      id: `rev-${Date.now()}`,
      pilgrimNameBn: reviewerName.trim() || 'যাচাইকৃত বাংলাদেশি হাজী',
      maskedPid,
      year: '১৪৪৮ হিজরি',
      rating: avgScore,
      commentBn: reviewComment.trim(),
      verifiedGpsMeters: actualM,
    };

    setAgencies((prev) =>
      prev.map((ag) => {
        if (ag.id !== selectedAgencyId) return ag;
        const count = ag.totalVerifiedReviews + 1;
        return {
          ...ag,
          brochurePromisedMeters: promisedM,
          gpsVerifiedActualMeters: Math.round(
            (ag.gpsVerifiedActualMeters * ag.totalVerifiedReviews + actualM) / count
          ),
          scores: {
            distanceAccuracy:
              Math.round(((ag.scores.distanceAccuracy * 4 + scoreDistance) / 5) * 10) / 10,
            foodQuality:
              Math.round(((ag.scores.foodQuality * 4 + scoreFood) / 5) * 10) / 10,
            moallemPresence:
              Math.round(((ag.scores.moallemPresence * 4 + scoreMoallem) / 5) * 10) / 10,
            luggageAndFlight:
              Math.round(((ag.scores.luggageAndFlight * 4 + scoreLuggage) / 5) * 10) / 10,
          },
          totalVerifiedReviews: count,
          reviews: [newReview, ...ag.reviews],
        };
      })
    );

    setReviewComment('');
    setReviewFormError(null);
    setIsReviewModalOpen(false);
  };

  return (
    <section aria-label="হজ এজেন্সি রেটিং ও অ্যান্টি-ফ্রড ডিরেক্টরি" className="space-y-6">
      {/* HEADER & ANTI-FRAUD EXPLAINER */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#064E3B] shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-[#D97706]">
              পিআইডি যাচাইকৃত হাব ডিরেক্টরি · PID-VERIFIED HAAB ANTI-FRAUD DIRECTORY
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
              বাংলাদেশ হজ এজেন্সি রেটিং ও জিপিএস দূরত্ব যাচাই
            </h1>
            <p className="text-sm text-slate-600">
              ব্রোশিউরের প্রতিশ্রুতি বনাম অ্যাপের জিপিএস দিয়ে মাপা প্রকৃত হাঁটা পথের দূরত্বের তুলনা দেখুন
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPidToVerify('');
              setIsPidUnlocked(false);
              setPidModalError(null);
              setIsReviewModalOpen(true);
            }}
            className="min-h-[56px] px-5 rounded-2xl bg-[#064E3B] hover:bg-[#04392B] text-white font-extrabold text-base flex items-center gap-2 shadow-md cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-[#FBBF24]" />
            <span>যাচাইকৃত রিভিউ দিন (Submit Verified Review)</span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="হজ এজেন্সির নাম বা লাইসেন্স নম্বর দিয়ে খুঁজুন"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="এজেন্সির নাম বা HAAB লাইসেন্স (যেমন: HL-0124, নূর ট্রাভেলস)..."
              className="w-full min-h-[56px] pl-11 pr-4 rounded-2xl border-2 border-slate-300 focus:border-[#064E3B] font-semibold text-base text-[#111827]"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl shrink-0">
            {[
              { id: 'all' as const, labelBn: 'সব এজেন্সি' },
              { id: 'honest' as const, labelBn: 'সত্যবাদী দূরত্ব' },
              { id: 'discrepancy' as const, labelBn: 'দূরত্ব গড়মিল সতর্কতা' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filterMode === tab.id
                    ? 'bg-[#064E3B] text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {tab.labelBn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AGENCY CARDS LIST */}
      <div className="space-y-5">
        {filteredAgencies.map((agency) => {
          const discrepancy = calculateDistanceDiscrepancy(
            agency.brochurePromisedMeters,
            agency.gpsVerifiedActualMeters
          );
          const overallRating =
            Math.round(
              ((agency.scores.distanceAccuracy +
                agency.scores.foodQuality +
                agency.scores.moallemPresence +
                agency.scores.luggageAndFlight) /
                4) *
                10
            ) / 10;

          return (
            <article
              key={agency.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5"
            >
              {/* Top Row: Agency Name, License & Overall Rating */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
                    <span>HAAB লাইসেন্স: {agency.haabLicense}</span>
                    <span aria-hidden="true">·</span>
                    <span>{agency.officeLocationBn}</span>
                    <span aria-hidden="true">·</span>
                    <span>প্যাকেজ: {agency.packagePriceBdt}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] mt-1">
                    {agency.nameBn}
                  </h2>
                  {showEnglish && (
                    <p className="text-sm font-semibold text-slate-600">{agency.nameEn}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200">
                  <Star className="w-6 h-6 text-[#D97706] fill-[#D97706]" />
                  <div className="text-right">
                    <span className="text-2xl font-extrabold font-mono-tabular text-[#111827]">
                      {overallRating}
                    </span>
                    <span className="text-xs text-slate-500 font-mono-tabular"> / 5.0</span>
                    <p className="text-[11px] font-bold text-[#064E3B]">
                      {agency.totalVerifiedReviews}টি পিআইডি রিভিউ
                    </p>
                  </div>
                </div>
              </div>

              {/* UNIQUE ANTI-FRAUD FEATURE: Brochure Promise vs. App GPS Verified Reality */}
              <div
                className={`rounded-2xl p-4 sm:p-5 border-2 ${
                  discrepancy.status === 'honest'
                    ? 'bg-emerald-50/70 border-[#064E3B]'
                    : 'bg-red-50/80 border-[#DC2626]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {discrepancy.status === 'honest' ? (
                      <ShieldCheck className="w-6 h-6 text-[#064E3B] shrink-0" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 text-[#DC2626] shrink-0" />
                    )}
                    <span className="text-sm sm:text-base font-extrabold text-[#111827]">
                      {discrepancy.badgeBn}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    এলাকা: {agency.makkahAreaBn}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-500">
                      এজেন্সির ব্রোশিউরের প্রতিশ্রুতি (Brochure Promise):
                    </p>
                    <p className="text-xl sm:text-2xl font-extrabold font-mono-tabular text-[#111827] mt-0.5">
                      {agency.brochurePromisedMeters}m from Haram (হারাম থেকে {agency.brochurePromisedMeters} মিটার)
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-500">
                      অ্যাপ জিপিএস যাচাইকৃত প্রকৃত দূরত্ব (App GPS Verified Reality):
                    </p>
                    <p
                      className={`text-xl sm:text-2xl font-extrabold font-mono-tabular mt-0.5 ${
                        discrepancy.status === 'honest' ? 'text-[#064E3B]' : 'text-[#DC2626]'
                      }`}
                    >
                      {agency.gpsVerifiedActualMeters.toLocaleString('en-US')}m actual walking distance
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Breakdown Scores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    labelBn: '১. হোটেল দূরত্বের সত্যতা',
                    labelEn: 'Hotel Distance Accuracy',
                    score: agency.scores.distanceAccuracy,
                  },
                  {
                    labelBn: '২. দেশি খাবারের মান',
                    labelEn: 'Bangladeshi Food Quality',
                    score: agency.scores.foodQuality,
                  },
                  {
                    labelBn: '৩. মিনা-আরাফাতে মোয়াল্লেম',
                    labelEn: 'Moallem in Mina/Arafat',
                    score: agency.scores.moallemPresence,
                  },
                  {
                    labelBn: '৪. লাগেজ ও ফ্লাইট ব্যবস্থাপনা',
                    labelEn: 'Luggage & Flight Mgmt',
                    score: agency.scores.luggageAndFlight,
                  },
                ].map((metric) => (
                  <div
                    key={metric.labelBn}
                    className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#111827]">{metric.labelBn}</span>
                      <span className="font-mono-tabular font-extrabold text-[#064E3B]">
                        {metric.score} / 5
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          metric.score >= 4
                            ? 'bg-[#064E3B]'
                            : metric.score >= 3
                            ? 'bg-[#D97706]'
                            : 'bg-[#DC2626]'
                        }`}
                        style={{ width: `${(metric.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent PID-Verified Pilgrim Reviews */}
              <div className="space-y-2 pt-1">
                {agency.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-bold">
                      <span>
                        {rev.pilgrimNameBn} · PID: {rev.maskedPid} · {rev.year}
                      </span>
                      <span className="text-[#064E3B] flex items-center gap-1 font-mono-tabular">
                        <MapPin className="w-3.5 h-3.5" />
                        জিপিএস মাপ: {rev.verifiedGpsMeters}m · রেটিং: {rev.rating}/5
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-[#111827] leading-relaxed">
                      &ldquo;{rev.commentBn}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {/* SUBMIT VERIFIED REVIEW MODAL (REQUIRES 11-DIGIT BD PID BEFORE UNLOCKING) */}
      {isReviewModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="পিআইডি যাচাইকৃত হজ এজেন্সি রিভিউ ফরম"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white text-[#111827] w-full max-w-xl rounded-3xl p-5 sm:p-6 border-2 border-[#064E3B] shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-extrabold text-[#D97706]">
                  ভুয়া রিভিউ প্রতিরোধ ব্যবস্থা · PID-VERIFIED REVIEW GATE
                </span>
                <h3 className="text-xl font-extrabold text-[#111827]">
                  হজ এজেন্সির যাচাইকৃত রিভিউ জমা দিন
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                aria-label="রিভিউ ফরম বন্ধ করুন"
                className="min-h-[48px] min-w-[48px] rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: 11-Digit BD PID Gate */}
            <form
              onSubmit={handleUnlockPidForm}
              className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3"
            >
              <div className="flex items-center justify-between">
                <label
                  htmlFor="review-pid-gate-input"
                  className="text-sm font-extrabold text-[#111827] flex items-center gap-1.5"
                >
                  {isPidUnlocked ? (
                    <Unlock className="w-4 h-4 text-[#064E3B]" />
                  ) : (
                    <Lock className="w-4 h-4 text-[#D97706]" />
                  )}
                  <span>ধাপ ১: আপনার ১১-সংখ্যার বাংলাদেশ পিআইডি (BD PID) যাচাই করুন</span>
                </label>
                <button
                  type="button"
                  onClick={() => setPidToVerify(defaultPid)}
                  className="text-xs font-bold text-[#064E3B] underline cursor-pointer"
                >
                  ডেমো পিআইডি বসান ({defaultPid})
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  id="review-pid-gate-input"
                  type="text"
                  inputMode="numeric"
                  value={pidToVerify}
                  onChange={(e) => {
                    setPidToVerify(e.target.value);
                    setIsPidUnlocked(false);
                  }}
                  placeholder="১১ সংখ্যার পিআইডি লিখুন (যেমন: 20270849210)"
                  className="flex-1 min-h-[52px] px-4 rounded-xl border-2 border-slate-300 font-mono-tabular font-extrabold text-base"
                />
                <button
                  type="submit"
                  className="min-h-[52px] px-5 rounded-xl bg-[#064E3B] hover:bg-[#04392B] text-white font-extrabold text-sm cursor-pointer"
                >
                  পিআইডি যাচাই ও ফরম আনলক করুন
                </button>
              </div>

              {pidModalError && (
                <p
                  role="alert"
                  className="text-xs font-bold text-[#DC2626] flex items-center gap-1.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pidModalError}</span>
                </p>
              )}

              {isPidUnlocked && (
                <p
                  role="status"
                  className="text-xs font-bold text-[#064E3B] flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>পিআইডি {pidToVerify} যাচাইকৃত! নিচে আপনার রেটিং ও রিভিউ ফরম আনলক হয়েছে।</span>
                </p>
              )}
            </form>

            {/* Step 2: Rating Form (Locked until valid 11-digit PID is verified) */}
            {isPidUnlocked ? (
              <form onSubmit={handleSubmitVerifiedReview} className="space-y-4">
                <div>
                  <label
                    htmlFor="agency-select-input"
                    className="block text-sm font-bold text-[#111827] mb-1"
                  >
                    হজ এজেন্সি নির্বাচন করুন:
                  </label>
                  <select
                    id="agency-select-input"
                    value={selectedAgencyId}
                    onChange={(e) => setSelectedAgencyId(e.target.value)}
                    className="w-full min-h-[52px] px-3.5 rounded-xl border-2 border-slate-300 font-bold text-sm bg-white"
                  >
                    {agencies.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.nameBn} ({ag.haabLicense})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="reviewer-name-input"
                      className="block text-xs font-bold text-slate-600 mb-1"
                    >
                      আপনার নাম:
                    </label>
                    <input
                      id="reviewer-name-input"
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full min-h-[48px] px-3 rounded-xl border border-slate-300 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="promised-dist-input"
                      className="block text-xs font-bold text-slate-600 mb-1"
                    >
                      ব্রোশিউরের দূরত্ব (মিটার):
                    </label>
                    <input
                      id="promised-dist-input"
                      type="number"
                      value={promisedInput}
                      onChange={(e) => setPromisedInput(e.target.value)}
                      className="w-full min-h-[48px] px-3 rounded-xl border border-slate-300 text-sm font-bold font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="actual-dist-input"
                      className="block text-xs font-bold text-slate-600 mb-1"
                    >
                      প্রকৃত জিপিএস দূরত্ব (মিটার):
                    </label>
                    <input
                      id="actual-dist-input"
                      type="number"
                      value={actualGpsInput}
                      onChange={(e) => setActualGpsInput(e.target.value)}
                      className="w-full min-h-[48px] px-3 rounded-xl border border-slate-300 text-sm font-bold font-mono-tabular"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: 'হোটেল দূরত্ব', val: scoreDistance, setter: setScoreDistance },
                    { label: 'দেশি খাবার', val: scoreFood, setter: setScoreFood },
                    { label: 'মোয়াল্লেম সেবা', val: scoreMoallem, setter: setScoreMoallem },
                    { label: 'লাগেজ/ফ্লাইট', val: scoreLuggage, setter: setScoreLuggage },
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-50 p-2.5 rounded-xl border">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {item.label} (১-৫)
                      </label>
                      <select
                        aria-label={`${item.label} রেটিং`}
                        value={item.val}
                        onChange={(e) => item.setter(Number(e.target.value))}
                        className="w-full min-h-[40px] px-2 rounded-lg border border-slate-300 font-bold text-sm bg-white"
                      >
                        <option value={5}>৫ - চমৎকার</option>
                        <option value={4}>৪ - ভালো</option>
                        <option value={3}>৩ - মোটামুটি</option>
                        <option value={2}>২ - দুর্বল</option>
                        <option value={1}>১ - প্রতারণামূলক</option>
                      </select>
                    </div>
                  ))}
                </div>

                <div>
                  <label
                    htmlFor="review-comment-textarea"
                    className="block text-sm font-bold text-[#111827] mb-1"
                  >
                    আপনার বাস্তব অভিজ্ঞতা লিখুন (হোটেল দূরত্ব, খাবার ও মোয়াল্লেম সম্পর্কে):
                  </label>
                  <textarea
                    id="review-comment-textarea"
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="যেমন: ব্রোশিউরে ৪০০ মিটার বলেছিল এবং বাস্তবেও কাছাকাছি ছিল..."
                    className="w-full p-3.5 rounded-xl border-2 border-slate-300 text-sm font-medium"
                  />
                </div>

                {reviewFormError && (
                  <p role="alert" className="text-xs font-bold text-[#DC2626]">
                    {reviewFormError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full min-h-[56px] rounded-2xl bg-[#064E3B] hover:bg-[#04392B] text-white font-extrabold text-base shadow-md cursor-pointer"
                >
                  যাচাইকৃত রিভিউ প্রকাশ করুন (Publish Verified Review)
                </button>
              </form>
            ) : (
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-300 text-center space-y-1">
                <p className="text-sm font-extrabold text-[#111827]">
                  রিভিউ ফরমটি বর্তমানে লক করা আছে
                </p>
                <p className="text-xs text-slate-700">
                  এজেন্সির দালাল বা ভুয়া রিভিউ ঠেকাতে উপরে আপনার ১১-সংখ্যার বাংলাদেশ পিআইডি (যেমন: 20270849210) দিয়ে &ldquo;পিআইডি যাচাই ও ফরম আনলক করুন&rdquo; বাটনে চাপ দিন।
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
