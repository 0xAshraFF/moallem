// "মনের কথা বলুন": the pilgrim says what is on their heart, we find Qur'anic duas that fit.
// Only Qur'anic duas, each with its verse reference, so every card has a checkable source.
// Arabic text and Bangla wording still need the Mufti's sign-off before launch.

export interface Dua {
  id: string;
  themeBn: string;
  themeEn: string;
  arabic: string;
  pronBn: string;
  meaningBn: string;
  meaningEn: string;
  source: string; // Surah:verse
  keys: string[]; // Bangla + English cue words
}

export const DUAS: Dua[] = [
  { id: 'parents-mercy', themeBn: 'মা-বাবার জন্য', themeEn: 'For parents', source: 'সূরা বনী ইসরাঈল ১৭:২৪',
    arabic: 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    pronBn: 'রাব্বির হামহুমা কামা রাব্বাইয়ানী সাগীরা',
    meaningBn: 'হে আমার রব, তাঁদের প্রতি দয়া করুন, যেমন তাঁরা ছোটবেলায় আমাকে লালন-পালন করেছেন।',
    meaningEn: 'My Lord, have mercy on them as they raised me when I was small.',
    keys: ['মা', 'বাবা', 'আব্বা', 'আম্মা', 'বাবা-মা', 'মা-বাবা', 'পিতা', 'মাতা', 'parent', 'mother', 'father', 'mum', 'dad'] },
  { id: 'parents-forgive', themeBn: 'মা-বাবা ও সব মুমিনের ক্ষমা', themeEn: 'Forgiveness for parents', source: 'সূরা ইবরাহীম ১৪:৪১',
    arabic: 'رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ',
    pronBn: 'রাব্বানাগফিরলী ওয়ালি ওয়ালিদাইয়া ওয়ালিল মু’মিনীনা ইয়াওমা ইয়াকূমুল হিসাব',
    meaningBn: 'হে আমাদের রব, হিসাবের দিন আমাকে, আমার মা-বাবাকে ও সব মুমিনকে ক্ষমা করুন।',
    meaningEn: 'Our Lord, forgive me, my parents and the believers on the Day of Reckoning.',
    keys: ['মা', 'বাবা', 'ক্ষমা', 'মাগফিরাত', 'মারা', 'কবর', 'parent', 'forgive', 'grave'] },
  { id: 'deceased', themeBn: 'যাঁরা চলে গেছেন', themeEn: 'For those who passed away', source: 'সূরা হাশর ৫৯:১০',
    arabic: 'رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ',
    pronBn: 'রাব্বানাগফিরলানা ওয়ালি ইখওয়ানিনাল্লাযীনা সাবাকূনা বিল ঈমান',
    meaningBn: 'হে আমাদের রব, আমাদের এবং ঈমানের সাথে আমাদের আগে চলে যাওয়া ভাইদের ক্ষমা করুন।',
    meaningEn: 'Our Lord, forgive us and our brothers who went before us in faith.',
    keys: ['মারা', 'মৃত', 'ইন্তেকাল', 'কবর', 'চলে গেছেন', 'মরহুম', 'died', 'passed away', 'deceased', 'late'] },
  { id: 'children', themeBn: 'সন্তান ও পরিবার', themeEn: 'Children and family', source: 'সূরা ফুরকান ২৫:৭৪',
    arabic: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
    pronBn: 'রাব্বানা হাবলানা মিন আযওয়াজিনা ওয়া যুররিয়্যাতিনা কুররাতা আ’ইয়ুনিও ওয়াজআলনা লিলমুত্তাকীনা ইমামা',
    meaningBn: 'হে আমাদের রব, আমাদের স্ত্রী-স্বামী ও সন্তানদের আমাদের চোখের শীতলতা বানিয়ে দিন।',
    meaningEn: 'Our Lord, make our spouses and children a comfort to our eyes.',
    keys: ['সন্তান', 'ছেলে', 'মেয়ে', 'বাচ্চা', 'নাতি', 'নাতনি', 'পরিবার', 'স্ত্রী', 'স্বামী', 'বউ', 'child', 'son', 'daughter', 'family', 'wife', 'husband'] },
  { id: 'children-prayer', themeBn: 'সন্তান যেন নামাজি হয়', themeEn: 'Children who pray', source: 'সূরা ইবরাহীম ১৪:৪০',
    arabic: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ',
    pronBn: 'রাব্বিজ আলনী মুকীমাস সালাতি ওয়া মিন যুররিয়্যাতী, রাব্বানা ওয়া তাকাব্বাল দু’আ',
    meaningBn: 'হে আমার রব, আমাকে ও আমার সন্তানদের নামাজ কায়েমকারী বানান। হে রব, আমার দোয়া কবুল করুন।',
    meaningEn: 'My Lord, make me and my children steadfast in prayer, and accept my prayer.',
    keys: ['সন্তান', 'ছেলে', 'মেয়ে', 'নামাজ', 'দ্বীন', 'ভবিষ্যৎ', 'child', 'pray', 'future'] },
  { id: 'forgiveness', themeBn: 'গুনাহ মাফ', themeEn: 'Forgiveness', source: 'সূরা আরাফ ৭:২৩',
    arabic: 'رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',
    pronBn: 'রাব্বানা যালামনা আনফুসানা ওয়া ইল্লাম তাগফিরলানা ওয়া তারহামনা লানাকূনান্না মিনাল খাসিরীন',
    meaningBn: 'হে আমাদের রব, আমরা নিজেদের উপর জুলুম করেছি। আপনি ক্ষমা ও দয়া না করলে আমরা ক্ষতিগ্রস্ত হব।',
    meaningEn: 'Our Lord, we have wronged ourselves; if You do not forgive us and have mercy, we will be lost.',
    keys: ['গুনাহ', 'পাপ', 'ক্ষমা', 'তওবা', 'ভুল', 'অনুতপ্ত', 'sin', 'forgive', 'repent', 'mistake', 'guilt'] },
  { id: 'distress', themeBn: 'দুশ্চিন্তা ও বিপদ', themeEn: 'Anxiety and distress', source: 'সূরা আম্বিয়া ২১:৮৭',
    arabic: 'لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ',
    pronBn: 'লা ইলাহা ইল্লা আনতা সুবহানাকা ইন্নী কুনতু মিনায যালিমীন',
    meaningBn: 'আপনি ছাড়া কোনো ইলাহ নেই, আপনি পবিত্র। নিশ্চয় আমি জালিমদের অন্তর্ভুক্ত ছিলাম।',
    meaningEn: 'There is no god but You, glory be to You; I was among the wrongdoers.',
    keys: ['দুশ্চিন্তা', 'চিন্তা', 'ভয়', 'বিপদ', 'কষ্ট', 'টেনশন', 'অস্থির', 'দুঃখ', 'anxious', 'worry', 'fear', 'stress', 'trouble', 'sad'] },
  { id: 'reliance', themeBn: 'আল্লাহর উপর ভরসা', themeEn: 'Trust in Allah', source: 'সূরা আলে ইমরান ৩:১৭৩',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    pronBn: 'হাসবুনাল্লাহু ওয়া নি’মাল ওয়াকীল',
    meaningBn: 'আল্লাহই আমাদের জন্য যথেষ্ট, আর তিনি কতই না উত্তম কর্মবিধায়ক।',
    meaningEn: 'Allah is sufficient for us, and He is the best disposer of affairs.',
    keys: ['ভয়', 'ভরসা', 'একা', 'হারিয়ে', 'অসহায়', 'afraid', 'alone', 'lost', 'helpless', 'trust'] },
  { id: 'illness', themeBn: 'অসুখ ও কষ্ট', themeEn: 'Illness', source: 'সূরা আম্বিয়া ২১:৮৩',
    arabic: 'أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ',
    pronBn: 'আন্নী মাসসানিয়াদ দুররু ওয়া আনতা আরহামুর রাহিমীন',
    meaningBn: 'আমি কষ্টে পড়েছি, আর আপনি সব দয়ালুর চেয়ে বেশি দয়ালু।',
    meaningEn: 'Harm has touched me, and You are the most merciful of the merciful.',
    keys: ['অসুখ', 'অসুস্থ', 'রোগ', 'ব্যথা', 'জ্বর', 'শরীর', 'হাসপাতাল', 'সুস্থ', 'ill', 'sick', 'pain', 'health', 'disease', 'hospital'] },
  { id: 'both-worlds', themeBn: 'দুনিয়া ও আখিরাতের কল্যাণ', themeEn: 'Good in both worlds', source: 'সূরা বাকারা ২:২০১',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    pronBn: 'রাব্বানা আতিনা ফিদ দুনইয়া হাসানাতাও ওয়া ফিল আখিরাতি হাসানাতাও ওয়া কিনা আযাবান নার',
    meaningBn: 'হে আমাদের রব, আমাদের দুনিয়া ও আখিরাতে কল্যাণ দিন এবং জাহান্নামের আযাব থেকে বাঁচান।',
    meaningEn: 'Our Lord, give us good in this world and the next, and save us from the Fire.',
    keys: ['সব', 'ভালো', 'কল্যাণ', 'জান্নাত', 'আখিরাত', 'দুনিয়া', 'good', 'everything', 'paradise', 'hereafter'] },
  { id: 'accept-hajj', themeBn: 'হজ কবুল', themeEn: 'Acceptance of Hajj', source: 'সূরা বাকারা ২:১২৭',
    arabic: 'رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ',
    pronBn: 'রাব্বানা তাকাব্বাল মিন্না ইন্নাকা আনতাস সামী’উল আলীম',
    meaningBn: 'হে আমাদের রব, আমাদের পক্ষ থেকে কবুল করুন। নিশ্চয় আপনি সব শোনেন, সব জানেন।',
    meaningEn: 'Our Lord, accept from us; You are the All-Hearing, the All-Knowing.',
    keys: ['কবুল', 'হজ', 'ইবাদত', 'আমল', 'accept', 'hajj', 'worship'] },
  { id: 'patience', themeBn: 'ধৈর্য ও শক্তি', themeEn: 'Patience and strength', source: 'সূরা বাকারা ২:২৫০',
    arabic: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا',
    pronBn: 'রাব্বানা আফরিগ আলাইনা সাবরাও ওয়া সাব্বিত আকদামানা',
    meaningBn: 'হে আমাদের রব, আমাদের ধৈর্য দিন এবং আমাদের পা অবিচল রাখুন।',
    meaningEn: 'Our Lord, pour patience upon us and make our steps firm.',
    keys: ['ধৈর্য', 'ক্লান্ত', 'শক্তি', 'দুর্বল', 'গরম', 'ভিড়', 'হাঁটতে', 'tired', 'patience', 'weak', 'strength', 'crowd', 'heat'] },
  { id: 'steadfast-heart', themeBn: 'ঈমানে অটল থাকা', themeEn: 'A steadfast heart', source: 'সূরা আলে ইমরান ৩:৮',
    arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً إِنَّكَ أَنتَ الْوَهَّابُ',
    pronBn: 'রাব্বানা লা তুযিগ কুলূবানা বা’দা ইয হাদাইতানা ওয়া হাব লানা মিল লাদুনকা রাহমাহ, ইন্নাকা আনতাল ওয়াহহাব',
    meaningBn: 'হে আমাদের রব, হেদায়েত দেওয়ার পর আমাদের অন্তর বাঁকা করবেন না, আমাদের রহমত দিন।',
    meaningEn: 'Our Lord, do not let our hearts swerve after You have guided us, and grant us mercy.',
    keys: ['ঈমান', 'হেদায়েত', 'অন্তর', 'মন', 'দ্বীন', 'faith', 'guidance', 'heart'] },
  { id: 'provision', themeBn: 'রিজিক ও অভাব', themeEn: 'Provision and need', source: 'সূরা কাসাস ২৮:২৪',
    arabic: 'رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ',
    pronBn: 'রাব্বি ইন্নী লিমা আনযালতা ইলাইয়া মিন খাইরিন ফাকীর',
    meaningBn: 'হে আমার রব, আপনি আমার জন্য যে কল্যাণই পাঠান, আমি তার মুখাপেক্ষী।',
    meaningEn: 'My Lord, I am in need of whatever good You send down to me.',
    keys: ['রিজিক', 'টাকা', 'অভাব', 'ঋণ', 'দেনা', 'চাকরি', 'ব্যবসা', 'money', 'debt', 'job', 'business', 'provision', 'need'] },
  { id: 'ease', themeBn: 'কাজ সহজ হওয়া', themeEn: 'Ease in affairs', source: 'সূরা ত্বাহা ২০:২৫-২৬',
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
    pronBn: 'রাব্বিশ রাহলী সাদরী ওয়া ইয়াসসিরলী আমরী',
    meaningBn: 'হে আমার রব, আমার বুক প্রশস্ত করে দিন এবং আমার কাজ সহজ করে দিন।',
    meaningEn: 'My Lord, expand my chest and make my task easy.',
    keys: ['সহজ', 'কঠিন', 'কাজ', 'পরীক্ষা', 'বিয়ে', 'মামলা', 'easy', 'hard', 'exam', 'marriage', 'task'] },
  { id: 'good-end', themeBn: 'ঈমানের সাথে মৃত্যু', themeEn: 'A good ending', source: 'সূরা ইউসুফ ১২:১০১',
    arabic: 'تَوَفَّنِي مُسْلِمًا وَأَلْحِقْنِي بِالصَّالِحِينَ',
    pronBn: 'তাওয়াফফানী মুসলিমাও ওয়া আলহিকনী বিস সালিহীন',
    meaningBn: 'আমাকে মুসলিম অবস্থায় মৃত্যু দিন এবং নেককারদের সাথে মিলিত করুন।',
    meaningEn: 'Let me die as a Muslim and join me with the righteous.',
    keys: ['মৃত্যু', 'শেষ', 'বয়স', 'আখিরাত', 'death', 'end', 'old age'] },
  { id: 'safe-journey', themeBn: 'নিরাপদ যাত্রা ও ফেরা', themeEn: 'Safe journey and return', source: 'সূরা বনী ইসরাঈল ১৭:৮০',
    arabic: 'رَّبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ وَأَخْرِجْنِي مُخْرَجَ صِدْقٍ وَاجْعَل لِّي مِن لَّدُنكَ سُلْطَانًا نَّصِيرًا',
    pronBn: 'রাব্বি আদখিলনী মুদখালা সিদকিও ওয়া আখরিজনী মুখরাজা সিদকিও ওয়াজ’আল লী মিল লাদুনকা সুলতানান নাসীরা',
    meaningBn: 'হে আমার রব, আমাকে সম্মানের সাথে প্রবেশ করান ও সম্মানের সাথে বের করুন, এবং আপনার পক্ষ থেকে সাহায্য দিন।',
    meaningEn: 'My Lord, let me enter with truth and leave with truth, and grant me supporting strength.',
    keys: ['যাত্রা', 'ফেরা', 'দেশে', 'ফ্লাইট', 'বিমান', 'নিরাপদ', 'travel', 'journey', 'flight', 'safe', 'return', 'home'] },
];

const PEOPLE = new Set(['parents-mercy', 'parents-forgive', 'deceased', 'children', 'children-prayer']);

/** Best matching duas for what the pilgrim said, strongest first. Falls back to general duas. */
export function matchDuas(text: string, n = 3): Dua[] {
  const q = ` ${text.toLowerCase()} `;
  // Who the dua is for (parents, children, the deceased) outranks how the pilgrim feels.
  const scored = DUAS.map((d) => {
    const hits = d.keys.filter((k) => q.includes(k.toLowerCase()));
    const base = hits.length * 10 + hits.reduce((s, k) => s + k.length, 0);
    return { d, score: hits.length ? base + (PEOPLE.has(d.id) ? 15 : 0) : 0 };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  if (scored.length === 0) return DUAS.filter((d) => d.id === 'both-worlds' || d.id === 'accept-hajj').slice(0, n);
  return scored.slice(0, n).map((x) => x.d);
}
