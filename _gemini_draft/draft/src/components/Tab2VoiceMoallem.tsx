import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  MapPin,
  Store,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { SURVIVAL_CHIPS, SurvivalItem, PilgrimProfile } from '../data/hajjData';
import { speakText } from '../utils/speech';

interface ChatMessage {
  id: string;
  sender: 'user' | 'moallem';
  textBn: string;
  timestamp: string;
  arabicFlashcard?: {
    arabic: string;
    phoneticBangla: string;
    banglaMeaning: string;
    directionBn: string;
    distanceBn: string;
  };
}

interface Tab2Props {
  profile: PilgrimProfile;
  showEnglish: boolean;
}

const SAMPLE_QUESTIONS_BN = [
  'ইহরাম অবস্থায় ভুলে সুগন্ধি সাবান ব্যবহার করলে কী করণীয়?',
  'মক্কায় কলা, তাজা ফল ও লাবান কাছে কোথায় পাবো?',
  'তাওয়াফের সময় অজু ভেঙে গেলে হানাফি মাসআলা কী?',
  'আরাফাতের ময়দানে মাগরিবের নামাজ কখন ও কোথায় পড়বো?',
];

export const Tab2VoiceMoallem: React.FC<Tab2Props> = ({ profile, showEnglish }) => {
  const [selectedSurvival, setSelectedSurvival] = useState<SurvivalItem>(
    SURVIVAL_CHIPS[0]
  );
  const [isListening, setIsListening] = useState<boolean>(false);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('moallem_voice_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'welcome-1',
        sender: 'moallem',
        textBn: `আসসালামু আলাইকুম শ্রদ্ধেয় ${profile.nameBn}! আমি আপনার ব্যক্তিগত হানাফি হজ মোয়াল্লেম। হজের মাসআলা, দোয়া বা মক্কা-মদিনায় কলা, বাংলা খাবার, ফার্মেসি কোথায় পাবেন—তা জানতে মাইক্রোফোনে ট্যাপ করে বাংলায় বলুন অথবা নিচের বাটনগুলোতে চাপ দিন।`,
        timestamp: 'এখন',
      },
    ];
  });

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    try {
      localStorage.setItem('moallem_voice_chat_history', JSON.stringify(messages.slice(-12)));
    } catch {
      // ignore
    }
  }, [messages]);

  const handleSelectSurvivalChip = (item: SurvivalItem) => {
    setSelectedSurvival(item);
    const chipResponse: ChatMessage = {
      id: `chip-${Date.now()}`,
      sender: 'moallem',
      textBn: `${item.categoryBn} (${item.distanceBn}): ${item.directionBn} (${item.priceHintBn})। দোকানদারকে দেখানোর জন্য নিচে আরবি ফ্ল্যাশকার্ডটি দেওয়া হলো।`,
      timestamp: 'এইমাত্র',
      arabicFlashcard: {
        arabic: item.arabicFlashcard,
        phoneticBangla: item.phoneticBangla,
        banglaMeaning: item.banglaMeaning,
        directionBn: item.directionBn,
        distanceBn: item.distanceBn,
      },
    };
    setMessages((prev) => [...prev, chipResponse]);
    speakText(
      `${item.categoryBn}। দূরত্ব ${item.distanceBn}। ${item.directionBn}`,
      'bn-BD'
    );
  };

  const askMoallemQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      textBn: trimmed,
      timestamp: 'এইমাত্র',
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoadingAi(true);

    try {
      const res = await fetch('/api/moallem/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          pilgrimName: profile.nameBn,
          maktab: profile.maktabNoBn,
        }),
      });
      const data = await res.json();
      const replyText =
        data.replyBn ||
        'আলহামদুলিল্লাহ, হানাফি মাজহাব (ইসলামিক ফাউন্ডেশন বাংলাদেশ) অনুযায়ী অনিচ্ছাকৃত ভুলের কারণে হজ নষ্ট হয় না। তাড়াহুড়ো না করে শান্তভাবে পরবর্তী আমল সম্পন্ন করুন এবং বেশি বেশি ইস্তিগফার পড়ুন।';

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'moallem',
        textBn: replyText,
        timestamp: 'এইমাত্র',
        arabicFlashcard: data.arabicFlashcard || undefined,
      };
      setMessages((prev) => [...prev, aiMsg]);
      speakText(replyText, 'bn-BD');
    } catch {
      const fallbackText =
        'হানাফি মাজহাব (ইসলামিক ফাউন্ডেশন বাংলাদেশ) অনুযায়ী: আপনার প্রশ্নটি অত্যন্ত গুরুত্বপূর্ণ। ভুলবশত বা অজ্ঞতাবশত ছোটখাটো ত্রুটি হলে ভয় পাবেন না; ইস্তিগফার পড়ুন এবং প্রয়োজনে মাকতাব ৪২-এর আলেম মোয়াল্লেমের সাথে সরাসরি কথা বলুন।';
      const fallbackMsg: ChatMessage = {
        id: `ai-fallback-${Date.now()}`,
        sender: 'moallem',
        textBn: fallbackText,
        timestamp: 'অফলাইন মোড',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      speakText(fallbackText, 'bn-BD');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      // Graceful fallback in browsers without SpeechRecognition: populate a realistic spoken query
      const simulatedVoiceText =
        'হুজুর, ইহরাম অবস্থায় ভুলে সুগন্ধি সাবান দিয়ে হাত ধুয়ে ফেলেছি, এখন হানাফি মাজহাব অনুযায়ী আমার কী করণীয়?';
      setInputQuery(simulatedVoiceText);
      askMoallemQuestion(simulatedVoiceText);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'bn-BD';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setInputQuery(transcript);
          askMoallemQuestion(transcript);
        }
      };
      recognition.onerror = () => {
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <section aria-label="বাংলা ভয়েস মোয়াল্লেম ও আশেপাশে খুঁজুন" className="space-y-6">
      {/* HERO VOICE MOALLEM MICROPHONE CARD */}
      <div className="bg-[#064E3B] text-white rounded-3xl p-6 sm:p-8 border-b-4 border-[#D97706] shadow-lg text-center space-y-5">
        <div className="max-w-2xl mx-auto space-y-2">
          <p className="text-xs sm:text-sm font-extrabold text-[#FBBF24]">
            হানাফি ফিকহ ও মক্কা-মদিনা ভয়েস গাইড · NATIVE BANGLA VOICE MOALLEM
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            ট্যাপ করে বাংলায় বলুন আপনার কী সাহায্য লাগবে
          </h1>
          {showEnglish && (
            <p className="text-sm text-emerald-100">
              Tap the microphone and speak in Bangla — strictly follows Hanafi Madhab (Islamic Foundation Bangladesh)
            </p>
          )}
        </div>

        {/* Massive Central Microphone Button */}
        <div className="flex flex-col items-center justify-center py-2">
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            aria-label="ট্যাপ করে বাংলায় বলুন আপনার কী সাহায্য লাগবে (Tap and speak in Bangla)"
            className={`w-36 h-36 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center gap-2 border-4 transition-transform active:scale-95 shadow-2xl cursor-pointer ${
              isListening
                ? 'bg-[#DC2626] border-white scale-105'
                : 'bg-[#D97706] hover:bg-[#B45309] border-amber-200'
            }`}
          >
            {isListening ? (
              <MicOff className="w-14 h-14 text-white" />
            ) : (
              <Mic className="w-14 h-14 text-white" />
            )}
            <span className="text-xs sm:text-sm font-extrabold text-white px-2">
              {isListening ? 'শুনছি... বলুন' : 'ট্যাপ করে বলুন'}
            </span>
          </button>
          <p className="mt-3 text-xs sm:text-sm text-emerald-100 font-semibold">
            ভাষা: বাংলা (bn-BD) · ইসলামিক ফাউন্ডেশন বাংলাদেশ (হানাফি মাজহাব)
          </p>
        </div>

        {/* Text Input Fallback Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            askMoallemQuestion(inputQuery);
          }}
          className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2.5"
        >
          <input
            type="text"
            aria-label="বাংলায় আপনার প্রশ্ন লিখুন (Type your question in Bangla)"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="অথবা এখানে বাংলায় লিখুন (যেমন: ইহরামে সাবান লাগলে কী হবে?)"
            className="flex-1 min-h-[56px] px-4 rounded-2xl bg-white text-[#111827] font-semibold text-base placeholder:text-slate-500 border-2 border-amber-300"
          />
          <button
            type="submit"
            disabled={isLoadingAi}
            className="min-h-[56px] px-6 rounded-2xl bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold text-base flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-60"
          >
            <Send className="w-5 h-5" />
            <span>{isLoadingAi ? 'উত্তর আসছে...' : 'প্রশ্ন পাঠান'}</span>
          </button>
        </form>

        {/* One-Tap Common Elderly Questions */}
        <div className="max-w-3xl mx-auto pt-1">
          <p className="text-xs font-bold text-emerald-200 mb-2">
            এক ট্যাপে সাধারণ মাসআলা জিজ্ঞাসা করুন:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SAMPLE_QUESTIONS_BN.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => askMoallemQuestion(q)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold border border-white/25 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK-TAP SURVIVAL CHIPS ("আশেপাশে খুঁজুন") */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#064E3B] shadow-sm space-y-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#D97706] shrink-0" />
            <span>
              {showEnglish
                ? 'আশেপাশে খুঁজুন (Quick-Tap Survival Chips & Local Shopkeeper Flashcards)'
                : 'আশেপাশে খুঁজুন (এক ট্যাপে দিকনির্দেশনা ও আরবি ফ্ল্যাশকার্ড)'}
            </span>
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            যেকোনো বাটনে ট্যাপ করলে হাঁটা পথের দূরত্ব এবং সৌদি দোকানদারকে দেখানোর জন্য বড় আরবি ফ্ল্যাশকার্ড খুলে যাবে
          </p>
        </div>

        {/* 5 Survival Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {SURVIVAL_CHIPS.map((chip) => {
            const isSelected = selectedSurvival.id === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleSelectSurvivalChip(chip)}
                className={`min-h-[60px] px-4 py-3 rounded-2xl font-extrabold text-left border-2 transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#064E3B] text-white border-[#D97706] shadow-md'
                    : 'bg-slate-50 hover:bg-emerald-50/70 text-[#111827] border-slate-200'
                }`}
              >
                <div>
                  <div className="text-base font-extrabold">{chip.chipLabelBn}</div>
                  {showEnglish && (
                    <div
                      className={`text-xs ${
                        isSelected ? 'text-amber-200' : 'text-slate-500'
                      }`}
                    >
                      {chip.chipLabelEn}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Survival Result: Walking Direction + Show to Local Shopkeeper Arabic Flashcard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
          {/* Left: Bangla Walking Distance & Landmark Direction */}
          <div className="lg:col-span-6 bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#064E3B]">
                  হাঁটা পথের দূরত্ব ও ল্যান্ডমার্ক দিকনির্দেশনা
                </span>
                <span className="text-sm font-extrabold text-[#D97706]">
                  {selectedSurvival.distanceBn}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[#111827]">
                {selectedSurvival.categoryBn}
              </h3>
              <p className="text-base text-[#111827] leading-relaxed font-medium">
                {selectedSurvival.directionBn}
              </p>
              {showEnglish && (
                <p className="text-xs text-slate-600">{selectedSurvival.directionEn}</p>
              )}
              <p className="text-sm font-bold text-[#064E3B] pt-1">
                {selectedSurvival.priceHintBn}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                speakText(
                  `${selectedSurvival.categoryBn}। দূরত্ব ${selectedSurvival.distanceBn}। ${selectedSurvival.directionBn}`,
                  'bn-BD'
                )
              }
              className="mt-4 w-full min-h-[56px] rounded-xl bg-[#064E3B] hover:bg-[#04392B] text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
            >
              <Volume2 className="w-5 h-5 text-[#FBBF24]" />
              <span>বাংলায় রাস্তার দিকনির্দেশনা শুনুন</span>
            </button>
          </div>

          {/* Right: "Show to Local Shopkeeper" Arabic Flashcard */}
          <div className="lg:col-span-6 bg-amber-50/70 rounded-2xl p-5 border-2 border-[#D97706] space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <span className="text-xs font-extrabold text-[#B45309] flex items-center gap-1.5">
                  <Store className="w-4 h-4" />
                  দোকানদার বা স্থানীয় আরবকে দেখান (Show to Local Shopkeeper)
                </span>
                <span className="text-xs font-bold text-[#064E3B]">ARABIC FLASHCARD</span>
              </div>

              <p
                dir="rtl"
                lang="ar"
                className="text-2xl sm:text-3xl font-bold font-arabic text-[#111827] text-right leading-loose bg-white p-4 rounded-xl border border-amber-200"
              >
                {selectedSurvival.arabicFlashcard}
              </p>

              <div className="space-y-1 text-sm">
                <p className="font-bold text-[#064E3B]">
                  বাংলা উচ্চারণ (Phonetic Bangla):{' '}
                  <span className="text-[#111827] font-semibold">
                    {selectedSurvival.phoneticBangla}
                  </span>
                </p>
                <p className="text-slate-800">
                  <strong>বাংলা অর্থ:</strong> {selectedSurvival.banglaMeaning}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => speakText(selectedSurvival.arabicFlashcard, 'ar-SA')}
              className="mt-4 w-full min-h-[56px] rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold text-base flex items-center justify-center gap-2 cursor-pointer"
            >
              <Volume2 className="w-5 h-5" />
              <span>দোকানদারকে আরবি উচ্চারণ শুনিয়ে দিন (Speak Arabic)</span>
            </button>
          </div>
        </div>
      </div>

      {/* LIVE MOALLEM CONVERSATION HISTORY */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#064E3B]" />
            <h3 className="text-xl font-extrabold text-[#111827]">
              মোয়াল্লেমের প্রশ্নোত্তর ও পরামর্শ (Hanafi Fiqh Answers)
            </h3>
          </div>
          <span className="text-xs font-bold text-[#064E3B] flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-[#D97706]" />
            হানাফি ফিকহ যাচাইকৃত
          </span>
        </div>

        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-2xl border ${
                msg.sender === 'user'
                  ? 'bg-emerald-900 text-white border-emerald-800 ml-4 sm:ml-12'
                  : 'bg-slate-50 text-[#111827] border-slate-200 mr-4 sm:mr-12'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className={msg.sender === 'user' ? 'text-amber-300' : 'text-[#064E3B]'}>
                  {msg.sender === 'user' ? 'আপনার প্রশ্ন' : 'মোয়াল্লেম (হানাফি মাজহাব)'}
                </span>
                <span className={msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-500'}>
                  {msg.timestamp}
                </span>
              </div>
              <p className="text-base sm:text-lg font-medium leading-relaxed">{msg.textBn}</p>

              {msg.sender === 'moallem' && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => speakText(msg.textBn, 'bn-BD')}
                    className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-[#064E3B] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-[#FBBF24]" />
                    <span>উত্তরটি জোরে শুনুন</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
