import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

interface Props {
  showEnglish: boolean;
}

export const PWAInstallButton: React.FC<Props> = ({ showEnglish }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowGuideModal(true);
          }
        }}
        aria-label="অ্যাপ ফোনে ইনস্টল করুন (Install App)"
        className="min-h-[44px] sm:min-h-[48px] px-2 sm:px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-4 h-4 text-[#FBBF24] shrink-0" />
        <span className="hidden md:inline">
          {showEnglish ? 'অ্যাপ ইনস্টল (PWA)' : 'অ্যাপ ইনস্টল'}
        </span>
      </button>

      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="মোবাইলে মোয়াল্লেম অ্যাপ ইনস্টল গাইড"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white text-[#111827] p-6 shadow-2xl border-2 border-[#064E3B]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-[#064E3B]" />
                <h3 className="text-lg font-bold text-[#111827]">
                  মোবাইলে অফলাইন অ্যাপ ইনস্টল করুন
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="বন্ধ করুন"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-base text-slate-800">
              <p className="font-medium text-[#064E3B]">
                মক্কা, মিনা ও আরাফাতে ইন্টারনেট ছাড়াই ব্যবহারের জন্য আপনার ফোনের হোমস্ক্রিনে যোগ করুন:
              </p>
              {isIOS ? (
                <ol className="list-decimal list-inside space-y-2 text-sm bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <li>সাফারি ব্রাউজারের নিচে <strong>Share (শেয়ার)</strong> বাটনে ট্যাপ করুন।</li>
                  <li>নিচে স্ক্রল করে <strong>Add to Home Screen</strong> বাটনে ট্যাপ করুন।</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-2 text-sm bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <li>ক্রোম ব্রাউজারের ডান কোণায় <strong>⋮ (তিন ডট মেনু)</strong> ট্যাপ করুন।</li>
                  <li><strong>Install App</strong> বা <strong>Add to Home Screen</strong> সিলেক্ট করুন।</li>
                  <li>অ্যান্ড্রয়েড APK হিসেবে ইনস্টল হয়ে ইন্টারনেট ছাড়াই সকল দোয়া ও জিপিএস কাজ করবে।</li>
                </ol>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full min-h-[56px] rounded-xl bg-[#064E3B] text-white font-bold text-base hover:bg-[#04392B] transition-colors cursor-pointer"
            >
              বুঝেছি, বন্ধ করুন (Close)
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="bg-[#D97706] text-white px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 shadow-md"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>অফলাইন মোড সচল — আপনার সংরক্ষিত নুসুক কার্ড, দোয়া ও তাঁবুর জিপিএস ইন্টারনেট ছাড়াই কাজ করছে।</span>
    </div>
  );
};
