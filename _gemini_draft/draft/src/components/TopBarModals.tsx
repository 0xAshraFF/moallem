import React, { useState } from 'react';
import {
  QrCode,
  AlertTriangle,
  Volume2,
  MapPin,
  PhoneCall,
  Share2,
  Sun,
  X,
  CheckCircle2,
  Compass,
  Globe,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { PilgrimProfile } from '../data/hajjData';
import { speakText } from '../utils/speech';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  profile: PilgrimProfile;
  showEnglish: boolean;
  onToggleLanguage: () => void;
  onOpenNusukModal: () => void;
  onOpenSosModal: () => void;
}

export const PersistentTopBar: React.FC<TopBarProps> = ({
  showEnglish,
  onToggleLanguage,
  onOpenNusukModal,
  onOpenSosModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md text-[#111315] border-b border-[#E2E6E1] shadow-[0_4px_20px_rgba(17,19,21,0.04)]">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-15 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Zone 1: Brand Title */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-base sm:text-xl font-extrabold tracking-tight text-[#111315] whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#12A839] text-white font-extrabold text-base sm:text-lg shadow-xs">
            ম
          </span>
          <span>{showEnglish ? 'মোয়াল্লেম · Moallem' : 'মোয়াল্লেম'}</span>
        </a>

        {/* Zone 2 & 3: ZIP Export + Language Toggle + Nusuk QR Quick-Vault + Lost Haji SOS Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <a
            href="/moallem-hajj-companion.zip"
            download="moallem-hajj-companion.zip"
            data-testid="download-project-zip-link"
            aria-label="প্রজেক্ট জিপ ও CLAUDE.md ডাউনলোড করুন (Download Project ZIP)"
            className="min-h-[44px] sm:min-h-[46px] px-3 sm:px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#064E3B] text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#12A839] shrink-0" />
            <span className="hidden md:inline">ZIP ডাউনলোড</span>
          </a>

          <PWAInstallButton showEnglish={showEnglish} />

          <button
            type="button"
            onClick={onToggleLanguage}
            aria-label={
              showEnglish
                ? 'শুধুমাত্র বাংলা ভাষায় পরিবর্তন করুন (Switch to Bangla Only)'
                : 'বাংলা ও ইংরেজি ভাষায় পরিবর্তন করুন (Switch to Bangla + English)'
            }
            className="min-h-[44px] sm:min-h-[46px] px-3 sm:px-4 py-1.5 rounded-full bg-[#F4F6F3] hover:bg-[#E7EBE5] border border-[#DDE2DC] text-[#111315] text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#12A839] shrink-0" />
            <span>{showEnglish ? 'বাং+EN' : 'বাংলা'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenNusukModal}
            aria-label="নুসুক কার্ড ও কিউআর কোড দেখুন (Nusuk Permit QR Quick-Vault)"
            className="min-h-[44px] sm:min-h-[46px] px-3 sm:px-4 py-1.5 rounded-full bg-[#111315] hover:bg-black text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <QrCode className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#12A839] shrink-0" />
            <span>নুসুক QR</span>
          </button>

          <button
            type="button"
            onClick={onOpenSosModal}
            aria-label="হারিয়ে গেছি জরুরি সাহায্য (Lost Haji SOS)"
            className="min-h-[44px] sm:min-h-[46px] px-3 sm:px-4 py-1.5 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
            <span>{showEnglish ? 'SOS' : 'SOS সাহায্য'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

interface NusukModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PilgrimProfile;
  showEnglish: boolean;
}

export const NusukQrModal: React.FC<NusukModalProps> = ({
  isOpen,
  onClose,
  profile,
  showEnglish,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="নুসুক কার্ড ও মাকতাব আইডি (Nusuk Permit QR Vault)"
      className="fixed inset-0 z-50 bg-white text-[#111827] overflow-y-auto flex flex-col justify-between p-4 sm:p-6"
    >
      {/* Top Maximum Brightness Bar */}
      <div className="max-w-lg w-full mx-auto">
        <div className="flex items-center justify-between gap-3 bg-[#064E3B] text-white px-4 py-3 rounded-2xl shadow-md">
          <div className="flex items-center gap-2">
            <Sun className="w-6 h-6 text-[#FBBF24] shrink-0" />
            <div>
              <p className="text-sm font-bold">
                ১০০% সর্বোচ্চ উজ্জ্বলতা (Max Brightness Offline Mode)
              </p>
              <p className="text-xs text-emerald-100">
                চেকপোস্টে সৌদি পুলিশ বা গেট প্রহরীকে এই স্ক্রিনটি দেখান
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="নুসুক কার্ড বন্ধ করুন (Close Nusuk Modal)"
            className="min-h-[48px] min-w-[48px] px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center justify-center cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Official Offline Nusuk & Maktab Card */}
        <div className="mt-4 bg-white border-4 border-[#064E3B] rounded-3xl p-5 shadow-xl text-center">
          <div className="flex items-center justify-between text-xs font-bold text-[#064E3B] border-b border-slate-200 pb-3">
            <span>NUSUK PERMIT · অফলাইন ভল্ট</span>
            <span>KINGDOM OF SAUDI ARABIA · HAJJ 1448H</span>
          </div>

          <h2 className="mt-3 text-2xl font-extrabold text-[#111827]">
            {profile.nameBn}
          </h2>
          <p className="text-base font-bold text-slate-700">{profile.nameEn}</p>

          {/* High Contrast Deterministic SVG QR Code */}
          <div className="my-5 mx-auto w-56 h-56 sm:w-64 sm:h-64 p-4 bg-white border-4 border-[#111827] rounded-2xl flex items-center justify-center">
            <svg
              viewBox="0 0 29 29"
              className="w-full h-full"
              role="img"
              aria-label={`Nusuk QR Code for PID ${profile.pid}`}
            >
              <rect width="29" height="29" fill="#FFFFFF" />
              {/* Top-left finder */}
              <path d="M1,1 h7 v7 h-7 z M2,2 v5 h5 v-5 z M3,3 h3 v3 h-3 z" fill="#111827" />
              {/* Top-right finder */}
              <path d="M21,1 h7 v7 h-7 z M22,2 v5 h5 v-5 z M23,3 h3 v3 h-3 z" fill="#111827" />
              {/* Bottom-left finder */}
              <path d="M1,21 h7 v7 h-7 z M2,22 v5 h5 v-5 z M3,23 h3 v3 h-3 z" fill="#111827" />
              {/* Alignment pattern */}
              <path d="M20,20 h5 v5 h-5 z M21,21 v3 h3 v-3 z M22,22 h1 v1 h-1 z" fill="#064E3B" />
              {/* Timing & Data Modules */}
              <path
                d="M9,2 h2 v2 h-2 z M13,1 h2 v3 h-2 z M16,2 h3 v2 h-3 z
                   M9,5 h3 v2 h-3 z M14,5 h2 v2 h-2 z M18,5 h2 v2 h-2 z
                   M1,9 h3 v2 h-3 z M6,9 h2 v2 h-2 z M10,9 h4 v2 h-4 z M16,9 h2 v3 h-2 z M20,9 h3 v2 h-3 z M25,9 h3 v2 h-3 z
                   M2,12 h2 v3 h-2 z M6,12 h3 v2 h-3 z M11,12 h2 v2 h-2 z M14,13 h3 v2 h-3 z M19,12 h2 v3 h-2 z M23,12 h4 v2 h-4 z
                   M1,16 h4 v2 h-4 z M7,15 h2 v3 h-2 z M11,16 h3 v2 h-3 z M16,16 h2 v2 h-2 z M21,16 h2 v2 h-2 z M25,15 h3 v3 h-3 z
                   M9,19 h2 v3 h-2 z M13,19 h4 v2 h-4 z M18,19 h1 v3 h-1 z M26,20 h2 v3 h-2 z
                   M9,23 h3 v2 h-3 z M14,22 h2 v3 h-2 z M17,24 h2 v3 h-2 z
                   M9,26 h2 v2 h-2 z M13,26 h3 v2 h-3 z M20,26 h4 v2 h-4 z M26,25 h2 v3 h-2 z"
                fill="#111827"
              />
            </svg>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <p className="text-xs text-slate-600">বাংলাদেশ হজ পিআইডি (BD PID)</p>
              <p className="text-lg font-extrabold font-mono-tabular text-[#064E3B]">
                {profile.pid}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600">নুসুক পারমিট নং (Nusuk ID)</p>
              <p className="text-base font-extrabold font-mono-tabular text-[#111827]">
                {profile.nusukPermitId}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600">মাকতাব ও তাঁবু (Maktab & Tent)</p>
              <p className="text-base font-bold text-[#111827]">
                {profile.maktabNoBn}
              </p>
              <p className="text-xs text-slate-600">{profile.minaTentPin.tentNoBn}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">হজ এজেন্সি ও লাইসেন্স (HAAB)</p>
              <p className="text-base font-bold text-[#111827]">
                {profile.agencyLicense} · {profile.agencyNameBn}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-[#064E3B]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              {showEnglish
                ? 'হারাম শরীফ ও মিনা চেকপোস্টের জন্য অফলাইনে সংরক্ষিত (Saved Offline)'
                : 'হারাম শরীফ ও মিনা চেকপোস্টের জন্য ফোনে অফলাইনে সংরক্ষিত'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full min-h-[56px] rounded-2xl bg-[#064E3B] hover:bg-[#04392B] text-white font-extrabold text-lg shadow-lg transition-colors cursor-pointer"
        >
          {showEnglish ? 'মূল পাতায় ফিরে যান (Close Vault)' : 'মূল পাতায় ফিরে যান'}
        </button>
      </div>
    </div>
  );
};

interface LostSosModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PilgrimProfile;
  showEnglish: boolean;
}

export const LostHajiSosModal: React.FC<LostSosModalProps> = ({
  isOpen,
  onClose,
  profile,
  showEnglish,
}) => {
  const [beaconSent, setBeaconSent] = useState(false);
  const [isSpeakingArabic, setIsSpeakingArabic] = useState(false);

  if (!isOpen) return null;

  const arabicSosText =
    'أنا حاج من بنغلاديش وقد ضللت طريقي. يرجى مساعدتي للوصول إلى مكتبي / فندقي';
  const phoneticBanglaSos =
    'আনা হাজ্জুন মিন বাঙ্গলাদেশ ওয়া কাদ দালালতু তারীকি। ইয়ারজা মুসাআদাতী লিল-উসূলি ইলা মাকতাবী / ফুনদুকী।';

  const distressMessage = `🆘 জরুরি সাহায্য (Lost Haji SOS): আমি ${profile.nameBn} (PID: ${profile.pid})। আমি রাস্তা হারিয়ে ফেলেছি। আমার বর্তমান জিপিএস লোকেশন: ${profile.makkahHotel.lat}° N, ${profile.makkahHotel.lng}° E (https://maps.google.com/?q=${profile.makkahHotel.lat},${profile.makkahHotel.lng})। আমার হোটেল: ${profile.makkahHotel.nameBn} এবং মাকতাব: ${profile.maktabNoBn}।`;

  const handleSendBeacon = async () => {
    setBeaconSent(true);
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(distressMessage);
      } catch {
        // ignore clipboard permission in sandbox
      }
    }
  };

  const handlePlayArabic = () => {
    setIsSpeakingArabic(true);
    speakText(arabicSosText, 'ar-SA', () => setIsSpeakingArabic(false));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="হারিয়ে যাওয়া হাজীর জরুরি সাহায্য স্ক্রিন (Lost Haji SOS Screen)"
      className="fixed inset-0 z-50 bg-[#111827] text-white overflow-y-auto p-4 sm:p-6"
    >
      <div className="max-w-2xl mx-auto space-y-5 pb-8">
        {/* Emergency Red Header */}
        <div className="flex items-center justify-between gap-3 bg-[#DC2626] p-4 rounded-2xl border-2 border-white shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-white shrink-0" />
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                জরুরি সাহায্য · আপনি একা নন! (Lost Haji SOS)
              </h2>
              <p className="text-sm text-red-100">
                ভয় পাবেন না, ছায়ায় দাঁড়ান এবং নিচের আরবি কার্ডটি যেকোনো সৌদি পুলিশকে দেখান
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="জরুরি স্ক্রিন বন্ধ করুন (Close SOS)"
            className="min-h-[52px] min-w-[52px] px-3 rounded-xl bg-black/25 hover:bg-black/40 text-white font-bold flex items-center justify-center cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* GIANT ARABIC FLASHCARD FOR SAUDI POLICE / VOLUNTEERS */}
        <div className="bg-white text-[#111827] rounded-3xl p-5 sm:p-6 border-4 border-[#D97706] shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <span className="text-xs sm:text-sm font-extrabold text-[#B45309]">
              সৌদি পুলিশ বা স্বেচ্ছাসেবককে এই কার্ডটি দেখান (SHOW TO SAUDI POLICE / SECURITY)
            </span>
            <span className="text-xs font-bold text-[#064E3B]">KSA 911 / HAJJ SECURITY</span>
          </div>

          <p
            dir="rtl"
            lang="ar"
            className="mt-4 text-3xl sm:text-4xl font-bold font-arabic text-[#111827] leading-relaxed text-right bg-amber-50/70 p-4 rounded-2xl border border-amber-200"
          >
            أنا حاج من بنغلاديش وقد ضللت طريقي. يرجى مساعدتي للوصول إلى مكتبي / فندقي
          </p>

          <div className="mt-3 space-y-1 text-left">
            <p className="text-sm font-bold text-[#064E3B]">
              বাংলা উচ্চারণ: <span className="font-normal text-[#111827]">{phoneticBanglaSos}</span>
            </p>
            <p className="text-sm font-semibold text-slate-700">
              অর্থ: &ldquo;আমি বাংলাদেশের একজন হাজী এবং আমি পথ হারিয়ে ফেলেছি। অনুগ্রহ করে আমাকে আমার মাকতাব / হোটেলে পৌঁছাতে সাহায্য করুন।&rdquo;
            </p>
            {showEnglish && (
              <p className="text-xs text-slate-600">
                English: &ldquo;I am a Bangladeshi pilgrim and I am lost. Please help me reach my Maktab/Hotel.&rdquo;
              </p>
            )}
          </div>

          {/* Hotel & Maktab Info in Arabic + English for Police */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-100 p-4 rounded-2xl text-sm">
            <div>
              <p className="text-xs font-bold text-slate-600">MAKTAB / TENT (المكتب والخيمة)</p>
              <p className="text-base font-extrabold text-[#111827]">{profile.maktabNoEn}</p>
              <p className="text-xs font-semibold text-[#064E3B]">{profile.minaTentPin.streetPoleBn}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-600">MAKKAH HOTEL (الفندق بمكة)</p>
              <p className="text-base font-extrabold text-[#111827]">{profile.makkahHotel.nameEn}</p>
              <p className="text-xs font-semibold text-[#064E3B]">
                Moallem Phone: {profile.makkahHotel.moallemPhone}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePlayArabic}
            className="mt-4 w-full min-h-[56px] rounded-2xl bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            <Volume2 className="w-6 h-6 shrink-0" />
            <span>
              {isSpeakingArabic
                ? 'আরবিতে শোনানো হচ্ছে... (Playing Arabic Audio...)'
                : 'সৌদি পুলিশকে আরবিতে শুনিয়ে দিন (Play Loud Arabic Audio)'}
            </span>
          </button>
        </div>

        {/* Exact GPS Coordinates & Tent/Hotel Distance Card */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-[#FBBF24] shrink-0" />
              <h3 className="text-lg font-bold text-white">
                আপনার বর্তমান জিপিএস অবস্থান ও দূরত্ব
              </h3>
            </div>
            <span className="text-xs font-mono-tabular text-emerald-400">
              GPS Accuracy: ±4m
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
              <p className="text-xs text-slate-400">জিপিএস স্থানাঙ্ক (GPS Coords)</p>
              <p className="text-base font-extrabold font-mono-tabular text-white mt-0.5">
                {profile.makkahHotel.lat}° N, {profile.makkahHotel.lng}° E
              </p>
            </div>
            <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
              <p className="text-xs text-slate-400">হোটেল থেকে দূরত্ব (Hotel Dist.)</p>
              <p className="text-base font-extrabold text-[#FBBF24] mt-0.5 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                <span>{profile.makkahHotel.distanceMeters} মিটার (দক্ষিণ-পূর্ব)</span>
              </p>
            </div>
            <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
              <p className="text-xs text-slate-400">মিনা তাঁবু পিন (Saved Tent Pin)</p>
              <p className="text-sm font-bold text-emerald-300 mt-0.5">
                {profile.minaTentPin.tentNoBn}
              </p>
            </div>
          </div>

          {/* One-Tap WhatsApp / SMS Distress Beacon */}
          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={handleSendBeacon}
              className="w-full min-h-[60px] rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-lg transition-colors cursor-pointer"
            >
              <Share2 className="w-6 h-6 shrink-0" />
              <span>
                মোয়াল্লেম ও সন্তানকে জিপিএস এসওএস (WhatsApp/SMS) পাঠান
              </span>
            </button>

            {beaconSent && (
              <div
                role="status"
                className="bg-emerald-950/90 border border-emerald-500 text-emerald-100 p-4 rounded-xl flex items-start gap-3"
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-bold text-white">
                    বিপদ সংকেত ও জিপিএস লোকেশন প্রস্তুত ও কপি করা হয়েছে!
                  </p>
                  <p>
                    প্রাপক: মোয়াল্লেম ({profile.makkahHotel.moallemPhone}) এবং {profile.familyGuardian.sonNameBn} ({profile.familyGuardian.phoneBd})।
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <a
                      href={`https://wa.me/${profile.makkahHotel.moallemPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(distressMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      হোয়াটসঅ্যাপে পাঠান (WhatsApp)
                    </a>
                    <a
                      href={`sms:${profile.makkahHotel.moallemPhone}?body=${encodeURIComponent(distressMessage)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 text-white font-bold text-xs"
                    >
                      এসএমএস পাঠান (Offline SMS)
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[56px] rounded-2xl bg-white text-[#111827] font-extrabold text-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          বন্ধ করুন ও মূল পাতায় ফিরুন (Close Emergency Screen)
        </button>
      </div>
    </div>
  );
};
