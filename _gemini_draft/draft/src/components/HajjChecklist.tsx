import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Shirt,
  Pill,
  Umbrella,
  CheckCircle2,
  RotateCcw,
  Plus,
  Trash2,
  Volume2,
  AlertTriangle,
  ClipboardCheck,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  HajjChecklistCategoryId,
  HajjChecklistItem,
  DEFAULT_HAJJ_CHECKLIST_ITEMS,
  calculateChecklistProgress,
} from '../utils/hajjLogic';
import { speakText } from '../utils/speech';

export interface HajjChecklistProps {
  showEnglish: boolean;
  landingSector?: 'jeddah' | 'madinah';
}

const STORAGE_KEY_COMPLETION = 'moallem_hajj_checklist_v1';
const STORAGE_KEY_CUSTOM_ITEMS = 'moallem_hajj_checklist_custom_v1';

interface CategoryMeta {
  id: HajjChecklistCategoryId;
  titleBn: string;
  titleEn: string;
  shortBn: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORY_META_LIST: CategoryMeta[] = [
  {
    id: 'documents',
    titleBn: '১. কাগজপত্র, ভিসা ও নুসুক কার্ড',
    titleEn: 'Documents, Visa & Nusuk Permit',
    shortBn: 'কাগজপত্র',
    icon: FileCheck2,
  },
  {
    id: 'ihram_clothing',
    titleBn: '২. ইহরামের কাপড় ও পোশাক',
    titleEn: 'Ahram Towels & Sun-Safe Clothing',
    shortBn: 'ইহরাম ও পোশাক',
    icon: Shirt,
  },
  {
    id: 'medication',
    titleBn: '৩. নিয়মিত ওষুধ ও প্রাথমিক চিকিৎসা',
    titleEn: 'Regular Medication & Heatstroke First-Aid',
    shortBn: 'ওষুধ ও চিকিৎসা',
    icon: Pill,
  },
  {
    id: 'electronics_essentials',
    titleBn: '৪. ছাতা, পাওয়ার ব্যাংক ও জরুরি সামগ্রী',
    titleEn: 'Umbrella, Power Bank & Daily Essentials',
    shortBn: 'ছাতা ও অন্যান্য',
    icon: Umbrella,
  },
];

export const HajjChecklist: React.FC<HajjChecklistProps> = ({
  showEnglish,
  landingSector = 'jeddah',
}) => {
  const [completionMap, setCompletionMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const item of DEFAULT_HAJJ_CHECKLIST_ITEMS) {
      initial[item.id] = item.defaultChecked;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPLETION);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...initial, ...parsed };
        }
      }
    } catch {
      // ignore storage errors
    }
    return initial;
  });

  const [customItems, setCustomItems] = useState<HajjChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_ITEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    'all' | HajjChecklistCategoryId
  >('all');
  const [newItemTitle, setNewItemTitle] = useState<string>('');
  const [newItemCategory, setNewItemCategory] =
    useState<HajjChecklistCategoryId>('medication');
  const [statusMessageBn, setStatusMessageBn] = useState<string | null>(null);

  // Persist completion map to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPLETION, JSON.stringify(completionMap));
    } catch {
      // ignore
    }
  }, [completionMap]);

  // Persist custom items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_ITEMS, JSON.stringify(customItems));
    } catch {
      // ignore
    }
  }, [customItems]);

  const allItems: HajjChecklistItem[] = [
    ...DEFAULT_HAJJ_CHECKLIST_ITEMS.map((item) => {
      if (item.id === 'ihram_two_sets') {
        return {
          ...item,
          noteBn:
            landingSector === 'jeddah'
              ? 'জেদ্দা ফ্লাইট: ঢাকা বিমানবন্দর থেকেই ১ সেট ইহরাম পরিধান করতে হবে, তাই হ্যান্ডব্যাগে রাখুন'
              : 'মদিনা ফ্লাইট: মদিনা থেকে মক্কায় যাওয়ার সময় (আবইয়ারে আলী মিকাত) ইহরাম বাঁধবেন',
        };
      }
      return item;
    }),
    ...customItems,
  ];

  const progress = calculateChecklistProgress(allItems, completionMap);

  const triggerHaptic = (ms = 35) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(ms);
      } catch {
        // ignore
      }
    }
  };

  const handleToggleItem = (itemId: string, itemTitleBn: string) => {
    triggerHaptic(35);
    setCompletionMap((prev) => {
      const currentVal =
        prev[itemId] !== undefined
          ? prev[itemId]
          : allItems.find((i) => i.id === itemId)?.defaultChecked || false;
      const nextVal = !currentVal;
      setStatusMessageBn(
        nextVal
          ? `সম্পন্ন মার্ক করা হয়েছে: "${itemTitleBn}"`
          : `আনচেক করা হয়েছে: "${itemTitleBn}"`
      );
      return {
        ...prev,
        [itemId]: nextVal,
      };
    });
  };

  const handleMarkAllComplete = () => {
    triggerHaptic(55);
    const updated: Record<string, boolean> = {};
    for (const item of allItems) {
      updated[item.id] = true;
    }
    setCompletionMap(updated);
    setStatusMessageBn('আলহামদুলিল্লাহ! হজ চেকলিস্টের সবগুলো আইটেম সম্পন্ন হিসেবে সংরক্ষিত হয়েছে।');
  };

  const handleResetDefaults = () => {
    triggerHaptic(40);
    const defaults: Record<string, boolean> = {};
    for (const item of allItems) {
      defaults[item.id] = false;
    }
    setCompletionMap(defaults);
    setStatusMessageBn('চেকলিস্ট পুনরায় শুরু করার জন্য রিসেট করা হয়েছে।');
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemTitle.trim();
    if (!trimmed) return;

    const newItem: HajjChecklistItem = {
      id: `custom_${Date.now()}`,
      categoryId: newItemCategory,
      titleBn: trimmed,
      titleEn: trimmed,
      noteBn: 'আপনার ব্যক্তিগত যুক্ত করা হজ সামগ্রী',
      isCritical: false,
      defaultChecked: true,
    };

    setCustomItems((prev) => [...prev, newItem]);
    setCompletionMap((prev) => ({ ...prev, [newItem.id]: true }));
    setNewItemTitle('');
    setStatusMessageBn(`নতুন আইটেম যুক্ত ও সংরক্ষিত হয়েছে: "${trimmed}"`);
  };

  const handleDeleteCustomItem = (itemId: string) => {
    setCustomItems((prev) => prev.filter((item) => item.id !== itemId));
    setCompletionMap((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  const visibleCategories =
    activeCategoryFilter === 'all'
      ? CATEGORY_META_LIST
      : CATEGORY_META_LIST.filter((c) => c.id === activeCategoryFilter);

  return (
    <section
      data-testid="hajj-checklist-card"
      aria-label="হজের জরুরি সামগ্রী ও প্রস্তুতি চেকলিস্ট (Categorized Hajj Checklist)"
      className="bg-white rounded-[32px] p-5 sm:p-6 border border-[#E2E6E1] shadow-[0_10px_30px_rgba(17,19,21,0.05)] space-y-5"
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E6E8E5] pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#12A839] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ClipboardCheck className="w-3.5 h-3.5 text-[#12A839]" />
              <span>HAJJ PACKING & READINESS CHECKLIST · অফলাইন অটো-সেভ</span>
            </span>

            <span
              className={`inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full border ${
                progress.allCriticalReady
                  ? 'bg-emerald-50 text-[#064E3B] border-emerald-200'
                  : 'bg-amber-50 text-[#B45309] border-amber-300'
              }`}
            >
              {progress.allCriticalReady ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#12A839]" />
                  <span>সব জরুরি আইটেম প্রস্তুত ({progress.criticalCompleted}/{progress.criticalTotal})</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>
                    জরুরি আইটেম বাকি: {progress.criticalRemaining}টি ({progress.criticalCompleted}/
                    {progress.criticalTotal})
                  </span>
                </>
              )}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-[#111315]">
            হজের জরুরি সামগ্রী ও প্রস্তুতি চেকলিস্ট (ইহরাম, ওষুধ, কাগজপত্র ও ছাতা)
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            যেকোনো আইটেমে ট্যাপ করলে আপনার ফোনে স্বয়ংক্রিয়ভাবে সেভ (Local Storage) হয়ে থাকবে
          </p>
        </div>

        {/* Audio Readout & Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              speakText(
                `হজ প্রস্তুতি চেকলিস্টে মোট ${progress.totalCount} টি আইটেমের মধ্যে ${progress.completedCount} টি সম্পন্ন হয়েছে এবং ${progress.remainingCount} টি বাকি আছে। পাসপোর্ট, নুসুক কার্ড, ইহরামের কাপড় এবং নিয়মিত ওষুধ হ্যান্ডব্যাগে নিতে ভুলবেন না।`,
                'bn-BD'
              )
            }
            className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-[#111315] hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-[#12A839]" />
            <span>অডিও শুনুন</span>
          </button>

          <button
            type="button"
            data-testid="hajj-checklist-mark-all-btn"
            onClick={handleMarkAllComplete}
            className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] border border-emerald-200 font-extrabold text-xs cursor-pointer"
          >
            সব সম্পন্ন মার্ক করুন
          </button>

          <button
            type="button"
            data-testid="hajj-checklist-reset-btn"
            onClick={handleResetDefaults}
            className="min-h-[44px] px-3 py-2 rounded-2xl bg-[#F4F6F3] hover:bg-[#E6EAE4] text-slate-700 border border-[#DDE2DC] font-extrabold text-xs flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>রিসেট</span>
          </button>
        </div>
      </div>

      {/* Overall Progress Bar + Category Filter Pills */}
      <div className="bg-[#F6F7F5] rounded-2xl p-4 border border-[#E2E6E1] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              data-testid="hajj-checklist-progress-text"
              className="text-sm sm:text-base font-extrabold font-mono-tabular text-[#111315]"
            >
              সম্পন্ন: {progress.completedCount} / {progress.totalCount} আইটেম (
              {progress.completionPercent}%)
            </span>
          </div>
          <span className="text-xs font-extrabold text-[#12A839]">
            {progress.remainingCount === 0
              ? 'আলহামদুলিল্লাহ! ১০০% হজ প্যাকিং সম্পন্ন'
              : `আরও ${progress.remainingCount}টি আইটেম নেওয়া বাকি`}
          </span>
        </div>

        <div className="w-full h-3.5 bg-white rounded-full overflow-hidden border border-[#DDE2DC]">
          <div
            className="h-full bg-[#12A839] rounded-full transition-all duration-300"
            style={{ width: `${progress.completionPercent}%` }}
          />
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="চেকলিস্ট ক্যাটাগরি ফিল্টার (Checklist Category Filter)"
          className="flex flex-wrap items-center gap-2 pt-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeCategoryFilter === 'all'}
            onClick={() => setActiveCategoryFilter('all')}
            className={`min-h-[42px] px-3.5 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm transition-colors cursor-pointer border ${
              activeCategoryFilter === 'all'
                ? 'bg-[#111315] text-white border-[#111315]'
                : 'bg-white text-[#111315] border-[#DDE2DC] hover:bg-slate-50'
            }`}
          >
            সবগুলো ({progress.completedCount}/{progress.totalCount})
          </button>

          {CATEGORY_META_LIST.map((cat) => {
            const stat = progress.byCategory[cat.id];
            const isSelected = activeCategoryFilter === cat.id;
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                data-testid={`checklist-category-tab-${cat.id}`}
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`min-h-[42px] px-3.5 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm transition-colors cursor-pointer border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#12A839] text-white border-[#12A839]'
                    : 'bg-white text-[#111315] border-[#DDE2DC] hover:bg-slate-50'
                }`}
              >
                <CatIcon className="w-4 h-4 shrink-0" />
                <span>
                  {cat.shortBn} ({stat.completed}/{stat.total})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {statusMessageBn && (
        <div
          role="status"
          className="bg-emerald-950 text-white px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-[#FBBF24] shrink-0" />
          <span>{statusMessageBn}</span>
        </div>
      )}

      {/* Categorized Checklist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visibleCategories.map((cat) => {
          const catItems = allItems.filter((item) => item.categoryId === cat.id);
          const catStat = progress.byCategory[cat.id];
          const CatIcon = cat.icon;

          return (
            <div
              key={cat.id}
              data-testid={`checklist-category-panel-${cat.id}`}
              className="bg-[#FAFBF9] rounded-3xl p-4 sm:p-5 border border-[#E2E6E1] space-y-3"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[#E6E8E5] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#12A839] shrink-0">
                    <CatIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-[#111315]">
                      {cat.titleBn}
                    </h4>
                    {showEnglish && (
                      <p className="text-[11px] font-semibold text-slate-500">
                        {cat.titleEn}
                      </p>
                    )}
                  </div>
                </div>

                <span className="text-xs font-extrabold font-mono-tabular bg-white text-[#12A839] px-2.5 py-1 rounded-full border border-[#DDE2DC] shrink-0">
                  {catStat.completed}/{catStat.total} ({catStat.percent}%)
                </span>
              </div>

              <div className="space-y-2">
                {catItems.map((item) => {
                  const isChecked =
                    completionMap[item.id] !== undefined
                      ? Boolean(completionMap[item.id])
                      : item.defaultChecked;
                  const isCustom = item.id.startsWith('custom_');

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border-2 transition-all flex items-stretch justify-between overflow-hidden ${
                        isChecked
                          ? 'bg-emerald-50/70 border-[#12A839]'
                          : 'bg-white border-[#E2E6E1] hover:border-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isChecked}
                        data-testid={`checklist-item-btn-${item.id}`}
                        onClick={() => handleToggleItem(item.id, item.titleBn)}
                        className="flex-1 min-h-[58px] p-3.5 text-left flex items-start gap-3 cursor-pointer"
                      >
                        <div
                          className={`w-6 h-6 mt-0.5 rounded-lg flex items-center justify-center shrink-0 font-extrabold text-sm transition-colors ${
                            isChecked
                              ? 'bg-[#12A839] text-white'
                              : 'bg-white border-2 border-slate-400 text-transparent'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-sm sm:text-base font-extrabold leading-snug ${
                                isChecked ? 'text-[#064E3B]' : 'text-[#111315]'
                              }`}
                            >
                              {item.titleBn}
                            </span>
                            {item.isCritical && (
                              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-[#B45309] px-2 py-0.5 rounded-md border border-amber-300">
                                আবশ্যক
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                            {item.noteBn}
                          </p>

                          {showEnglish && (
                            <p className="text-[11px] text-slate-500">{item.titleEn}</p>
                          )}
                        </div>
                      </button>

                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomItem(item.id)}
                          aria-label={`${item.titleBn} মুছে ফেলুন`}
                          className="px-3 text-slate-400 hover:text-red-600 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Essential Item Form */}
      <form
        onSubmit={handleAddCustomItem}
        className="bg-[#F6F7F5] rounded-2xl p-4 border border-[#E2E6E1] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <div className="flex-1">
          <label htmlFor="custom-checklist-input" className="sr-only">
            নতুন হজ সামগ্রী বা ওষুধের নাম লিখুন
          </label>
          <input
            id="custom-checklist-input"
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="নিজের কোনো বিশেষ ওষুধ বা সামগ্রী যোগ করুন (যেমন: ইনসুলিন পেন, চশমার অতিরিক্ত জোড়া)..."
            className="w-full min-h-[48px] px-4 rounded-xl bg-white border border-[#DDE2DC] text-sm font-bold text-[#111315] placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="custom-checklist-category" className="sr-only">
            ক্যাটাগরি নির্বাচন করুন
          </label>
          <select
            id="custom-checklist-category"
            value={newItemCategory}
            onChange={(e) =>
              setNewItemCategory(e.target.value as HajjChecklistCategoryId)
            }
            className="min-h-[48px] px-3 rounded-xl bg-white border border-[#DDE2DC] text-xs font-extrabold text-[#111315] cursor-pointer"
          >
            <option value="documents">১. কাগজপত্র</option>
            <option value="ihram_clothing">২. ইহরাম ও পোশাক</option>
            <option value="medication">৩. ওষুধ ও চিকিৎসা</option>
            <option value="electronics_essentials">৪. ছাতা ও অন্যান্য</option>
          </select>

          <button
            type="submit"
            data-testid="add-custom-checklist-btn"
            className="min-h-[48px] px-4 rounded-xl bg-[#12A839] hover:bg-[#0E8A2D] text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>যোগ করুন</span>
          </button>
        </div>
      </form>
    </section>
  );
};
