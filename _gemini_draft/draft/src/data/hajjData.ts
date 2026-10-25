export type HajjPhaseId =
  | 'preflight'
  | 'umrah'
  | 'mina8'
  | 'arafat9'
  | 'jamarat10_13'
  | 'posthajj';

export interface HajjPhaseMeta {
  id: HajjPhaseId;
  stepNum: number;
  shortBn: string;
  shortEn: string;
  fullBn: string;
  fullEn: string;
  hijriDateBn: string;
  locationBn: string;
}

export const HAJJ_PHASES: HajjPhaseMeta[] = [
  {
    id: 'preflight',
    stepNum: 1,
    shortBn: '১. প্রি-ফ্লাইট (ঢাকা)',
    shortEn: '1. Pre-Flight (Dhaka)',
    fullBn: 'ঢাকা এয়ারপোর্ট ও ইহরাম প্রস্তুতি',
    fullEn: 'Pre-Flight (Dhaka Airport & Ihram Setup)',
    hijriDateBn: 'হজ যাত্রা শুরুর দিন',
    locationBn: 'হযরত শাহজালাল আন্তর্জাতিক বিমানবন্দর, ঢাকা',
  },
  {
    id: 'umrah',
    stepNum: 2,
    shortBn: '২. উমরাহ (তাওয়াফ ও সাঈ)',
    shortEn: "2. Umrah (Tawaf & Sa'i)",
    fullBn: 'পবিত্র উমরাহ — ৭ চক্কর তাওয়াফ ও সাঈ কাউন্টার',
    fullEn: "Umrah (7-Round Tawaf & Sa'i Counter)",
    hijriDateBn: 'মক্কায় আগমন (তামাত্তু হজ)',
    locationBn: 'মসজিদুল হারাম, মক্কা আল-মুকাররমাহ',
  },
  {
    id: 'mina8',
    stepNum: 3,
    shortBn: '৩. ৮ জিলহজ (মিনা)',
    shortEn: '3. 8 Dhul Hijjah (Mina)',
    fullBn: '৮ই জিলহজ — মিনার তাঁবু ও তারবিয়াহ দিবস',
    fullEn: '8 Dhul Hijjah (Mina Tent & Tarwiyah)',
    hijriDateBn: '৮ই জিলহজ (ইয়াওমুত তারবিয়াহ)',
    locationBn: 'মিনা তাঁবু নং ৪২ (দক্ষিণ এশিয়া জোন)',
  },
  {
    id: 'arafat9',
    stepNum: 4,
    shortBn: '৪. ৯ জিলহজ (আরাফাত)',
    shortEn: '4. 9 Dhul Hijjah (Arafat)',
    fullBn: '৯ই জিলহজ — আরাফাতের ময়দান (ওকুফে আরাফাহ)',
    fullEn: '9 Dhul Hijjah (Arafat Wuquf Mode)',
    hijriDateBn: '৯ই জিলহজ (হজের মূল ফরজ দিন)',
    locationBn: 'আরাফাত ময়দান · জাবালে রহমত সেক্টর',
  },
  {
    id: 'jamarat10_13',
    stepNum: 5,
    shortBn: '৫. ১০-১৩ জিলহজ (জামারাত)',
    shortEn: '5. 10-13 Dhul Hijjah',
    fullBn: '১০-১৩ই জিলহজ — মুযদালিফা, কংকর নিক্ষেপ ও কুরবানি',
    fullEn: '10-13 Dhul Hijjah (Muzdalifah & Jamarat)',
    hijriDateBn: '১০-১৩ই জিলহজ (আইয়ামে নহর ও তাশরীক)',
    locationBn: 'মুযদালিফা ও জামারাত ব্রিজ, মিনা',
  },
  {
    id: 'posthajj',
    stepNum: 6,
    shortBn: '৬. জিয়ারত ও লাগেজ',
    shortEn: '6. Post-Hajj & Bags',
    fullBn: 'হজ পরবর্তী জিয়ারত ও বিমান/সৌদিয়া লাগেজ ট্র্যাকার',
    fullEn: 'Post-Hajj Concierge (Ziyarah & Shopping)',
    hijriDateBn: 'মদিনা জিয়ারত ও দেশে ফেরার প্রস্তুতি',
    locationBn: 'মক্কা ও মদিনা আল-মুনাওয়ারাহ',
  },
];

export interface RoundDua {
  round: number;
  titleBn: string;
  titleEn: string;
  arabic: string;
  banglaPronunciation: string;
  banglaMeaning: string;
  englishMeaning: string;
  hanafiRuleBn: string;
}

export const TAWAF_ROUND_DUAS: RoundDua[] = [
  {
    round: 1,
    titleBn: '১ম চক্কর — সুবহানাল্লাহ ও তাকবীর',
    titleEn: 'Round 1 — Tasbih, Tahmid & Takbir',
    arabic:
      'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ، سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
    banglaPronunciation:
      'বিসমিল্লাহি ওয়াল্লাহু আকবার। সুবহানাল্লাহি ওয়ালহামদুলিল্লাহি ওয়া লা ইলাহা ইল্লাল্লাহু ওয়াল্লাহু আকবার, ওয়া লা হাওলা ওয়া লা কুওয়াতা ইল্লা বিল্লাহিল আলিয়্যিল আযীম।',
    banglaMeaning:
      'আল্লাহর নামে শুরু করছি এবং আল্লাহ সর্বশ্রেষ্ঠ। সমস্ত পবিত্রতা আল্লাহর, সমস্ত প্রশংসা আল্লাহর, আল্লাহ ছাড়া কোনো মাবুদ নেই, মহান ও সর্বশক্তিমান আল্লাহর সাহায্য ছাড়া পাপ থেকে বাঁচার ও নেক কাজ করার কোনো শক্তি নেই।',
    englishMeaning:
      'In the name of Allah, Allah is the Greatest. Glory be to Allah, praise be to Allah, there is no deity but Allah, and there is no power or might except with Allah the Most High.',
    hanafiRuleBn:
      'হানাফি মাসআলা: পুরুষ হাজীগণ ইযতিবা (ডান কাঁধ খোলা) অবস্থায় প্রথম ৩ চক্করে একটু বীরদর্পে ঘন কদমে (রমল) হাঁটবেন। মা-বোনদের জন্য রমল নেই।',
  },
  {
    round: 2,
    titleBn: '২য় চক্কর — ঈমান ও নিরাপত্তার দোয়া',
    titleEn: 'Round 2 — Supplication for Faith & Conviction',
    arabic:
      'اللَّهُمَّ إِيْمَانًا بِكَ وَتَصْدِيقًا بِكِتَابِكَ وَوَفَاءً بِعَهْدِكَ وَاتِّبَاعًا لِسُنَّةِ نَبِيِّكَ مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ',
    banglaPronunciation:
      'আল্লাহুম্মা ঈমানাম বিকা ওয়া তাসদীকাম বিকিতাবিকা ওয়া ওয়াফাআন বিআহদিকা ওয়াত্তিবাআল লিসুন্নাতি নাবিয়্যিকা মুহাম্মাদিন সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম।',
    banglaMeaning:
      'হে আল্লাহ! আপনার প্রতি পূর্ণ ঈমান এনে, আপনার কিতাবকে সত্য জেনে, আপনার ওয়াদা পূরণার্থে এবং আপনার নবী মুহাম্মাদ (সা.)-এর সুন্নাতের অনুসরণে আমি তাওয়াফ করছি।',
    englishMeaning:
      'O Allah, out of faith in You, conviction in Your Book, fulfillment of Your covenant, and following the Sunnah of Your Prophet Muhammad (peace be upon him).',
    hanafiRuleBn:
      'হানাফি মাসআলা: তাওয়াফ অবস্থায় কাবা ঘরের দিকে বুক বা পিঠ ঘুরিয়ে হাঁটা মাকরুহ; কাবা শরীফ বাম পাশে রেখে স্বাভাবিক দৃষ্টিতে সামনে হাঁটুন।',
  },
  {
    round: 3,
    titleBn: '৩য় চক্কর — কবুল হজ ও গুনাহ মাফের দোয়া',
    titleEn: 'Round 3 — Hajj Mabrur & Forgiveness',
    arabic:
      'اللَّهُمَّ اجْعَلْهُ حَجًّا مَبْرُورًا وَسَعْيًا مَشْكُورًا وَذَنْبًا مَغْفُورًا وَعَمَلًا صَالِحًا مَقْبُولًا',
    banglaPronunciation:
      'আল্লাহুম্মাজ-আলহু হাজ্জাম মাবরূরাঁও ওয়া সা’ইয়াম মাশকূরাঁও ওয়া যাম্বাম মাগফূরাঁও ওয়া আমালান সালিহাম মাকবূলা।',
    banglaMeaning:
      'হে আল্লাহ! আপনি আমার এই হজকে মাবরুর (কবুল হজ) করুন, আমার প্রচেষ্টাকে মূল্যায়িত করুন, আমার গুনাহসমূহ ক্ষমা করুন এবং নেক আমল কবুল করুন।',
    englishMeaning:
      'O Allah, make this an accepted Hajj, a rewarded effort, a forgiven sin, and an accepted righteous deed.',
    hanafiRuleBn:
      'হানাফি মাসআলা: পুরুষদের রমল (বীরদর্পে হাঁটা) এই ৩য় চক্কর শেষে সমাপ্ত হবে। ৪র্থ চক্কর থেকে স্বাভাবিক গতিতে হাঁটুন।',
  },
  {
    round: 4,
    titleBn: '৪র্থ চক্কর — রিজিক ও ক্ষমা প্রার্থনা',
    titleEn: 'Round 4 — Forgiveness, Mercy & Provision',
    arabic:
      'رَبِّ اغْفِرْ وَارْحَمْ وَاعْفُ عَمَّا تَعْلَمُ وَأَنْتَ الْأَعَزُّ الْأَكْرَمُ، اللَّهُمَّ آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    banglaPronunciation:
      'রাব্বিগফির ওয়ারহাম ওয়া’ফু আম্মা তা’লামু ওয়া আনতাল আআযযুল আকরাম। আল্লাহুম্মা আতিনা ফিদ্দুনইয়া হাসানাতাঁও ওয়া ফিল আখিরাতি হাসানাতাঁও ওয়া কিনা আযাবান্নার।',
    banglaMeaning:
      'হে আমার রব! ক্ষমা করুন, দয়া করুন এবং আপনি আমার যেসব ত্রুটি জানেন তা মাফ করে দিন; আপনিই তো পরাক্রমশালী ও মহামহিম। হে আল্লাহ, আমাদের দুনিয়া ও আখিরাতে কল্যাণ দান করুন।',
    englishMeaning:
      'My Lord, forgive and have mercy, and pardon what You know, for You are the Most Mighty, the Most Generous.',
    hanafiRuleBn:
      'রুকনে ইয়ামানি থেকে হাজরে আসওয়াদ পর্যন্ত প্রতি চক্করে "রাব্বানা আতিনা ফিদ্দুনইয়া হাসানাহ..." পড়া সুন্নাত।',
  },
  {
    round: 5,
    titleBn: '৫ম চক্কর — আরশের ছায়া ও জান্নাতের দোয়া',
    titleEn: 'Round 5 — Shade of the Throne & Jannah',
    arabic:
      'اللَّهُمَّ أَظِلَّنِي تَحْتَ ظِلِّ عَرْشِكَ يَوْمَ لَا ظِلَّ إِلَّا ظِلُّكَ وَلَا بَاقِيَ إِلَّا وَجْهُكَ وَاسْقِنِي مِنْ حَوْضِ نَبِيِّكَ شَرْبَةً هَنِيئَةً لَا أَظْمَأُ بَعْدَهَا أَبَدًا',
    banglaPronunciation:
      'আল্লাহুম্মা আযিল্লানী তাহতা যিল্লি আরশিকা ইয়াওমা লা যিল্লা ইল্লা যিল্লুকা, ওয়াসকিনী মিন হাউদি নাবিয়্যিকা শারবাতান হানীআতান লা আযমাউ বা’দাহা আবাদা।',
    banglaMeaning:
      'হে আল্লাহ! যেদিন আপনার আরশের ছায়া ছাড়া আর কোনো ছায়া থাকবে না, সেদিন আমাকে আপনার আরশের নিচে ছায়া দিন এবং হাউজে কাউসারের পানি পান করান।',
    englishMeaning:
      'O Allah, shade me under the shade of Your Throne on the Day when there is no shade except Yours, and grant me to drink from the basin of Your Prophet.',
    hanafiRuleBn:
      'হানাফি মাসআলা: তাওয়াফের নির্দিষ্ট কোনো দোয়া মুখস্থ না থাকলে নিজের ভাষায় (বাংলায়) যেকোনো নেক দোয়া বা কুরআন তিলাওয়াত ও জিকির করা সম্পূর্ণ জায়েজ।',
  },
  {
    round: 6,
    titleBn: '৬ষ্ঠ চক্কর — দুনিয়া ও আখিরাতের মাগফিরাত',
    titleEn: 'Round 6 — Complete Pardon & Acceptance',
    arabic:
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدِّينِ وَالدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ استُرْ عَوْرَاتِنَا وَآمِنْ رَوْعَاتِنَا',
    banglaPronunciation:
      'আল্লাহুম্মা ইন্নী আসআলুকাল আফওয়া ওয়াল আফিয়াতা ফিদ্দীনী ওয়াদ্দুনইয়া ওয়াল আখিরাহ, আল্লাহুম্মাসতুর আওরাতিনা ওয়া আমিন রাওআতিনা।',
    banglaMeaning:
      'হে আল্লাহ! আমি আপনার কাছে দ্বীন, দুনিয়া ও আখিরাতে ক্ষমা এবং সুস্থতা প্রার্থনা করছি। হে আল্লাহ, আমাদের দোষত্রুটি ঢেকে রাখুন এবং আমাদের ভয়ভীতিকে নিরাপত্তায় পরিণত করুন।',
    englishMeaning:
      'O Allah, I ask You for pardon and well-being in my religion, worldly life, and the Hereafter. Conceal our faults and calm our fears.',
    hanafiRuleBn:
      'হানাফি মাসআলা: তাওয়াফের মধ্যে অজু ভেঙে গেলে সাথে সাথে তাওয়াফ থামিয়ে অজু করে এসে বাকি চক্কর পূর্ণ করবেন।',
  },
  {
    round: 7,
    titleBn: '৭ম চক্কর — শুকরিয়া ও ঈমানের সাথে মৃত্যুর দোয়া',
    titleEn: 'Round 7 — Gratitude & Steadfast Heart',
    arabic:
      'اللَّهُمَّ يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ رِضَاكَ وَالْجَنَّةَ وَأَعُوذُ بِكَ مِنْ سَخَطِكَ وَالنَّارِ',
    banglaPronunciation:
      'আল্লাহুম্মা ইয়া মুকাল্লিবাল কুলূব সাব্বিত কালবী আলা দীনিক। আল্লাহুম্মা ইন্নী আসআলুকা রিদাকা ওয়াল জান্নাতা ওয়া আউযুবিকা মিন সাখাতিকা ওয়ান্নার।',
    banglaMeaning:
      'হে অন্তর পরিবর্তনকারী আল্লাহ! আমার অন্তরকে আপনার দ্বীনের ওপর অবিচল রাখুন। আমি আপনার সন্তুষ্টি ও জান্নাত চাই এবং আপনার অসন্তুষ্টি ও জাহান্নাম থেকে আশ্রয় চাই।',
    englishMeaning:
      'O Turner of hearts, keep my heart firm upon Your religion. O Allah, I ask You for Your pleasure and Paradise, and seek refuge from Your wrath and the Fire.',
    hanafiRuleBn:
      '৭ম চক্কর শেষে মাকামে ইবরাহীমের পেছনে (ভিড় থাকলে মসজিদুল হারামের যেকোনো স্থানে) ২ রাকাত ওয়াজিবুত তাওয়াফ নামাজ আদায় করুন (মাকরুহ ওয়াক্ত না হলে)। এরপর পেট ভরে জমজম পানি পান করুন।',
  },
];

export const SAI_ROUND_DUAS: RoundDua[] = [
  {
    round: 1,
    titleBn: '১ম চক্কর (সাফা → মারওয়া) — সাঈ শুরু',
    titleEn: 'Lap 1 (Safa to Marwah) — Starting at Mount Safa',
    arabic:
      'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ، أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    banglaPronunciation:
      'ইন্নাস সাফা ওয়াল মারওয়াতা মিন শাআইরিল্লাহ। আবদাউ বিমা বাদাআল্লাহু বিহী। লা ইলাহা ইল্লাল্লাহু ওয়াহদাহু লা শারীকা লাহু, লাহুল মুলকু ওয়া লাহুল হামদু ওয়া হুওয়া আলা কুল্লি শাইয়িন কাদীর।',
    banglaMeaning:
      'নিশ্চয়ই সাফা ও মারওয়া আল্লাহর নিদর্শনসমূহের অন্তর্ভুক্ত। আল্লাহ যা দিয়ে শুরু করেছেন আমিও তা দিয়ে শুরু করছি। আল্লাহ ছাড়া কোনো উপাস্য নেই, তিনি এক ও অদ্বিতীয়।',
    englishMeaning:
      'Indeed, Safa and Marwah are among the symbols of Allah. I begin with what Allah began with. There is no deity except Allah alone.',
    hanafiRuleBn:
      'হানাফি মাসআলা: সাফা থেকে মারওয়া গেলে ১ চক্কর এবং মারওয়া থেকে সাফায় ফিরলে ২য় চক্কর গণ্য হয়। সবুজ দুই পিলারের মাঝে পুরুষরা একটু দ্রুত হাঁটবেন।',
  },
  {
    round: 2,
    titleBn: '২য় চক্কর (মারওয়া → সাফা) — মাগফিরাত ও দয়া',
    titleEn: 'Lap 2 (Marwah to Safa) — Forgiveness & Honour',
    arabic:
      'رَبِّ اغْفِرْ وَارْحَمْ إِنَّكَ أَنْتَ الْأَعَزُّ الْأَكْرَمُ، اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
    banglaPronunciation:
      'রাব্বিগফির ওয়ারহাম ইন্নাকা আনতাল আআযযুল আকরাম। আল্লাহুম্মা আইন্নী আলা যিকরিকা ওয়া শুকরিকা ওয়া হুসনি ইবাদাতিক।',
    banglaMeaning:
      'হে আমার রব! ক্ষমা করুন ও দয়া করুন, নিশ্চয়ই আপনি সর্বাধিক পরাক্রমশালী ও মহামহিম। হে আল্লাহ, আপনার জিকির, শুকরিয়া ও উত্তম ইবাদতে আমাকে সাহায্য করুন।',
    englishMeaning:
      'My Lord, forgive and have mercy, for You are the Most Mighty, Most Generous. Help me to remember You, thank You, and worship You well.',
    hanafiRuleBn:
      'সাঈ করার জন্য অজু থাকা সুন্নাত (ওয়াজিব নয়)। তাই সাঈ অবস্থায় অজু ভেঙে গেলেও সাঈ চালিয়ে যাওয়া জায়েজ।',
  },
  {
    round: 3,
    titleBn: '৩য় চক্কর (সাফা → মারওয়া) — হিদায়াত ও তাকওয়া',
    titleEn: 'Lap 3 (Safa to Marwah) — Guidance & Piety',
    arabic:
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى',
    banglaPronunciation:
      'আল্লাহুম্মা ইন্নী আসআলুকাল হুদা ওয়াত-তুকা ওয়াল আফাফা ওয়াল গিনা।',
    banglaMeaning:
      'হে আল্লাহ! আমি আপনার কাছে হিদায়াত, তাকওয়া (আল্লাহভীতি), পবিত্র চরিত্র এবং অভাবমুক্ততা প্রার্থনা করছি।',
    englishMeaning:
      'O Allah, I ask You for guidance, piety, chastity, and self-sufficiency.',
    hanafiRuleBn:
      'ক্লান্তি বোধ করলে সাঈর মাঝখানে একটু বসে পানি পান করে বিশ্রাম নেওয়া সম্পূর্ণ জায়েজ।',
  },
  {
    round: 4,
    titleBn: '৪র্থ চক্কর (মারওয়া → সাফা) — পিতা-মাতা ও পরিবারের দোয়া',
    titleEn: 'Lap 4 (Marwah to Safa) — Parents & Offspring',
    arabic:
      'رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ، رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا، رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ',
    banglaPronunciation:
      'রাব্বিগফির লী ওয়ালিওয়ালিদাইয়্যা, রাব্বিরহামহুমা কামা রাব্বাইয়ানী সাগীরা। রাব্বানা হাব লানা মিন আযওয়াজিনা ওয়া যুররিয়্যাতিনা কুররাতা আ’ইউন।',
    banglaMeaning:
      'হে আমার রব! আমাকে ও আমার পিতা-মাতাকে ক্ষমা করুন, ছোটবেলায় তাঁরা যেভাবে আমাকে স্নেহ-মমতায় লালন করেছেন সেভাবে তাঁদের ওপর দয়া করুন।',
    englishMeaning:
      'My Lord, forgive me and my parents, and have mercy on them as they raised me when I was small.',
    hanafiRuleBn:
      'বয়স্ক বা হাঁটুতে ব্যথা থাকলে হুইলচেয়ারে সাঈ করা হানাফি মাজহাবে বিনা কেরাহাতে জায়েজ (কোনো দম দিতে হয় না)।',
  },
  {
    round: 5,
    titleBn: '৫ম চক্কর (সাফা → মারওয়া) — কবুল ইবাদতের দোয়া',
    titleEn: 'Lap 5 (Safa to Marwah) — Acceptance of Worship',
    arabic:
      'اللَّهُمَّ تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ وَتُبْ عَلَيْنَا إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
    banglaPronunciation:
      'আল্লাহুম্মা তাকাব্বাল মিন্না ইন্নাকা আনতাস সামীউল আলীম, ওয়া তুব আলাইনা ইন্নাকা আনতাত তাওয়াবুর রাহীম।',
    banglaMeaning:
      'হে আল্লাহ! আমাদের পক্ষ থেকে কবুল করে নিন, নিশ্চয়ই আপনি সর্বশ্রোতা ও সর্বজ্ঞ; আমাদের তাওবা কবুল করুন, আপনিই পরম তাওবা কবুলকারী ও দয়ালু।',
    englishMeaning:
      'O Allah, accept from us; indeed You are the Hearing, the Knowing. And accept our repentance; indeed You are the Accepting of repentance, the Merciful.',
    hanafiRuleBn:
      'প্রতিবার সাফা ও মারওয়া পাহাড়ে উঠে কাবা শরীফের দিকে ফিরে দুই হাত তুলে দোয়া করা সুন্নাত।',
  },
  {
    round: 6,
    titleBn: '৬ষ্ঠ চক্কর (মারওয়া → সাফা) — ঋণ ও দুশ্চিন্তা মুক্তি',
    titleEn: 'Lap 6 (Marwah to Safa) — Relief from Worry',
    arabic:
      'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
    banglaPronunciation:
      'আল্লাহুম্মাকফিনী বিহালালিকা আন হারামিকা ওয়া আগনিনী বিফাদলিকা আম্মান সিওয়াক।',
    banglaMeaning:
      'হে আল্লাহ! আপনার হালাল রিজিক দিয়ে আমাকে হারাম থেকে বাঁচিয়ে রাখুন এবং আপনার অনুগ্রহে আপনি ছাড়া অন্য সবার থেকে আমাকে অমুখাপেক্ষী করুন।',
    englishMeaning:
      'O Allah, suffice me with what You have made lawful against what You have made unlawful, and enrich me by Your grace from needing anyone besides You.',
    hanafiRuleBn:
      'আর মাত্র ১টি চক্কর বাকি। ভিড়ের মধ্যে ধাক্কাধাক্কি না করে শান্তভাবে হাঁটুন।',
  },
  {
    round: 7,
    titleBn: '৭ম চক্কর (সাফা → মারওয়া) — সাঈ সমাপ্তি ও হলক/কসর',
    titleEn: 'Lap 7 (Safa to Marwah) — Completion at Marwah',
    arabic:
      'اللَّهُمَّ رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ وَأَدْخِلْنَا الْجَنَّةَ مَعَ الْأَبْرَارِ',
    banglaPronunciation:
      'আল্লাহুম্মা রাব্বানা আতিনা ফিদ্দুনইয়া হাসানাতাঁও ওয়া ফিল আখিরাতি হাসানাতাঁও ওয়া কিনা আযাবান্নার, ওয়া আদখিলনাল জান্নাতা মাআল আবরার।',
    banglaMeaning:
      'হে আমাদের রব! আমাদের দুনিয়া ও আখিরাতে কল্যাণ দিন, জাহান্নামের আজাব থেকে রক্ষা করুন এবং নেককার বান্দাদের সাথে জান্নাতে প্রবেশ করান।',
    englishMeaning:
      'Our Lord, grant us good in this world and good in the Hereafter, protect us from the torment of the Fire, and admit us to Paradise with the righteous.',
    hanafiRuleBn:
      'গুরুত্বপূর্ণ হানাফি মাসআলা: মারওয়া পাহাড়ে ৭ম চক্কর শেষ হয়েছে। এখন সাথে সাথে মাথার চুল মুণ্ডন (হলক) বা সমস্ত মাথার চুল অন্তত ১ আঙুল পরিমাণ ছোট (কসর) না করা পর্যন্ত ইহরাম খুলবেন না! মা-বোনেরা চুলের আগা থেকে এক কর পরিমাণ কাটবেন।',
  },
];

export interface ArafatAudioDua {
  id: string;
  titleBn: string;
  titleEn: string;
  durationLabel: string;
  arabic: string;
  banglaPronunciation: string;
  banglaHeartfeltScript: string;
}

export const ARAFAT_LYING_DOWN_DUAS: ArafatAudioDua[] = [
  {
    id: 'arafat-tahlil',
    titleBn: '১. আরাফাতের শ্রেষ্ঠ দোয়া (তাহলীল)',
    titleEn: '1. The Best Supplication of Arafat (Tahlil)',
    durationLabel: '৩:২০ মিনিট · অবসর শ্রবণ',
    arabic:
      'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    banglaPronunciation:
      'লা ইলাহা ইল্লাল্লাহু ওয়াহদাহু লা শারীকা লাহু, লাহুল মুলকু ওয়া লাহুল হামদু ওয়া হুওয়া আলা কুল্লি শাইয়িন কাদীর।',
    banglaHeartfeltScript:
      'হে দয়াময় আল্লাহ! রাসূলুল্লাহ (সা.) বলেছেন আরাফাতের দিনের শ্রেষ্ঠ দোয়া হলো—আল্লাহ ছাড়া কোনো মাবুদ নেই, তিনি এক ও অদ্বিতীয়, রাজত্ব তাঁরই এবং সকল প্রশংসা তাঁরই, তিনি সর্ববিষয়ে সর্বশক্তিমান। ইয়া আল্লাহ, ৪৫ ডিগ্রি রোদে আপনার এই বৃদ্ধ বান্দা বাংলাদেশ থেকে এসে আরাফাতের ময়দানে হাত তুলেছে, আপনি আমাদের জীবনের সমস্ত গুনাহ মাফ করে দিন।',
  },
  {
    id: 'arafat-sayyidul',
    titleBn: '২. সাইয়্যিদুল ইস্তিগফার ও গুনাহ মাফের মোনাজাত',
    titleEn: '2. Sayyidul Istighfar & Heartfelt Repentance',
    durationLabel: '৪:১০ মিনিট · অবসর শ্রবণ',
    arabic:
      'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي',
    banglaPronunciation:
      'আল্লাহুম্মা আনতা রাব্বী লা ইলাহা ইল্লা আনতা খালাকতানী ওয়া আনা আবদুকা... ফাগফির লী ফাইন্নাহু লা ইয়াগফিরুয যুনূবা ইল্লা আনতা।',
    banglaHeartfeltScript:
      'ইয়া রাব্বুল আলামীন! আপনি আমার রব, আপনিই আমাকে সৃষ্টি করেছেন এবং আমি আপনার গুনাহগার বান্দা। জীবনে জেনে না-জেনে যত কবিরা ও সগিরা গুনাহ করেছি, আরাফাতের এই বিকেলে সব আপনার দরবারে স্বীকার করছি। আপনি ছাড়া গুনাহ মাফ করার আর কেউ নেই—আজ আমাদের নিষ্পাপ শিশুর মতো পবিত্র করে দিন।',
  },
  {
    id: 'arafat-parents',
    titleBn: '৩. মা-বাবা, সন্তান ও পরিবারের জন্য বিশেষ কান্নাজড়িত দোয়া',
    titleEn: '3. Supplication for Parents, Children & Family in Bangladesh',
    durationLabel: '৩:৪৫ মিনিট · অবসর শ্রবণ',
    arabic:
      'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا، رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
    banglaPronunciation:
      'রাব্বিরহামহুমা কামা রাব্বাইয়ানী সাগীরা। রাব্বানা হাব লানা মিন আযওয়াজিনা ওয়া যুররিয়্যাতিনা কুররাতা আ’ইউন।',
    banglaHeartfeltScript:
      'হে আল্লাহ! আমাদের যেসব মা-বাবা অন্ধকার কবরে শুয়ে আছেন, আরাফাতের এই বরকতময় সময়ে তাঁদের কবরকে জান্নাতের বাগান বানিয়ে দিন। আর বাংলাদেশে রেখে আসা আমাদের সন্তান-সন্ততি, নাতি-নাতনি ও পরিবার-পরিজনকে ঈমান ও সুস্থতার সাথে হেফাজত করুন এবং তাঁদের সবাইকে আপনার ঘর জিয়ারতের তাওফিক দিন।',
  },
  {
    id: 'arafat-husnul-khatimah',
    titleBn: '৪. ঈমানের সাথে মৃত্যু ও হজ কবুলের দোয়া',
    titleEn: '4. Supplication for Hajj Mabrur & Husnul Khatimah',
    durationLabel: '৩:০০ মিনিট · অবসর শ্রবণ',
    arabic:
      'اللَّهُمَّ اجْعَلْ خَيْرَ عُمُرِي آخِرَهُ وَخَيْرَ عَمَلِي خَوَاتِيمَهُ وَخَيْرَ أَيَّامِي يَوْمَ أَلْقَاكَ فِيهِ',
    banglaPronunciation:
      'আল্লাহুম্মাজ-আল খাইরা উমুরী আখিরাহু ওয়া খাইরা আমালী খাওয়াতীমাহু ওয়া খাইরা আইয়্যামী ইয়াওমা আলকাকা ফীহ।',
    banglaHeartfeltScript:
      'হে আল্লাহ! আমার জীবনের শেষ অংশকে সর্বোত্তম করুন, আমার শেষ আমলকে শ্রেষ্ঠ আমল করুন এবং আপনার সাথে সাক্ষাতের দিনটিকে আমার জীবনের শ্রেষ্ঠ দিন বানিয়ে দিন। আমাদের এই হজকে হজে মাবরুর হিসেবে কবুল করে নিরাপদে পরিবারের কাছে ফিরিয়ে নিন। আমীন।',
  },
];

export interface SurvivalItem {
  id: string;
  chipLabelBn: string;
  chipLabelEn: string;
  iconEmoji: string;
  categoryBn: string;
  distanceBn: string;
  directionBn: string;
  directionEn: string;
  priceHintBn: string;
  arabicFlashcard: string;
  phoneticBangla: string;
  banglaMeaning: string;
  englishTranslation: string;
}

export const SURVIVAL_CHIPS: SurvivalItem[] = [
  {
    id: 'banana',
    chipLabelBn: '🍌 কলা ও ফল',
    chipLabelEn: '🍌 Banana & Fruit',
    iconEmoji: '🍌',
    categoryBn: 'কলা, খেজুর, দই (লাবান) ও বাকালা',
    distanceBn: '৬০ মিটার · ১ মিনিট হাঁটা পথ',
    directionBn:
      'মসজিদুল হারামের বাদশাহ ফাহাদ গেট ৭৯ (King Fahd Gate 79) থেকে বের হয়ে ৫০ মিটার সোজা ইব্রাহিম খলিল রোডের ডান পাশে "আল-নূর বাকালা (মুদি দোকান)" ও বিন দাউদ সুপারমার্কেটের নিচতলায় তাজা কলা, আপেল ও আল-মারাই লাবান পাবেন।',
    directionEn:
      'Exit King Fahd Gate 79, walk 50m straight toward Ibrahim Al-Khalil Rd. Fresh bananas, fruit, and Almarai Laban are available at Al-Noor Baqala on the right and Bin Dawood Ground Floor.',
    priceHintBn: 'আনুমানিক মূল্য: ১ ডজন কলা ৬-৮ রিয়াল · লাবান ২ রিয়াল',
    arabicFlashcard:
      'أَسْأَلُكَ مِنْ فَضْلِكَ: أَيْنَ أَجِدُ الْمَوْزَ وَالْفَوَاكِهَ وَاللَّبَنَ؟ (بَقَّالَة قَرِيبَة)',
    phoneticBangla:
      'আসআলুকা মিন ফাদলিক: আইনা আজিদুল মাওযা (কলা) ওয়াল ফাওয়াকিহা (ফল) ওয়াল লাবান (দই/ঘোল)? (বাক্কালা কারীবাহ)',
    banglaMeaning:
      'ভাই, অনুগ্রহ করে বলবেন—কাছে কোথায় কলা, তাজা ফল এবং লাবান (মাঠা/দই) পাওয়া যাবে?',
    englishTranslation:
      'Excuse me brother, where can I find bananas, fresh fruit, and Laban (nearby grocery store)?',
  },
  {
    id: 'bangla-food',
    chipLabelBn: '🍛 বাংলা খাবার',
    chipLabelEn: '🍛 Bangla Food',
    iconEmoji: '🍛',
    categoryBn: 'ভাত, ডাল, মাছ ও আলু ভর্তা (মিসফালাহ / আজিজিয়াহ)',
    distanceBn: '১৮০ মিটার · ৩ মিনিট হাঁটা পথ',
    directionBn:
      'হিজরাহ রোড / মিসফালাহ কবুতর চত্বর থেকে দক্ষিণে ১৮০ মিটার এগিয়ে বাম গলিতে "সোনারগাঁও বাংলা হোটেল" ও "ঢাকা বিরিয়ানি হাউস"। গরম সাদা ভাত, মুগ ডাল, রুই মাছ, গরুর গোশত ও আলু ভর্তা পাওয়া যায়।',
    directionEn:
      '180m south down Ibrahim Al-Khalil / Misfalah Pigeon Square, left lane: Sonargaon Bangla Restaurant & Dhaka Hotel serving steamed rice, dal, fish, and bhorta.',
    priceHintBn: 'আনুমানিক মূল্য: ভাত-মাছ/গোশত প্যাকেজ ১৫-২০ রিয়াল',
    arabicFlashcard:
      'مِنْ فَضْلِكَ، أَيْنَ مَطْعَمٌ بَنْغَالِيٌّ يُقَدِّمُ الْأَرُزَّ وَالسَّمَكَ وَالْعَدَسَ (فِي الْمِسْفَلَةِ)؟',
    phoneticBangla:
      'মিন ফাদলিক, আইনা মাতআমুন বাঙ্গালিয়্যুন ইউকাদ্দিমুল আরুযযা (ভাত) ওয়াস সামাকা (মাছ) ওয়াল আদাস (ডাল)?',
    banglaMeaning:
      'অনুগ্রহ করে বলবেন, সাদা ভাত, মাছ ও ডাল পাওয়া যায় এমন বাংলাদেশি খাবার হোটেল কোন দিকে?',
    englishTranslation:
      'Please tell me, where is the Bangladeshi restaurant serving rice, fish, and lentil soup in Misfalah?',
  },
  {
    id: 'pharmacy',
    chipLabelBn: '💊 ফার্মেসি ও প্যারাসিটামল',
    chipLabelEn: '💊 Pharmacy & Clinic',
    iconEmoji: '💊',
    categoryBn: 'প্যারাসিটামল, ওরস্যালাইন, কাশির সিরাপ ও নাহদি ফার্মেসি',
    distanceBn: '৯০ মিটার · ২ মিনিট হাঁটা পথ',
    directionBn:
      'ক্লক টাওয়ার (Abraj Al Bait) এর নিচে এবং ইব্রাহিম খলিল রোডের মোড়ে ২৪ ঘণ্টা খোলা "নাহদি ফার্মেসি (Nahdi Pharmacy)"। এখানে প্যারাসিটামল (Panadol / Fevadol), ওরস্যালাইন ও ডায়াবেটিসের ওষুধ পাবেন। বিনামূল্যে চিকিৎসার জন্য হারামের গেট ৮৮ সংলগ্ন বাংলাদেশ হজ মেডিকেল সেন্টার বা সৌদি রেড ক্রিসেন্ট ক্লিনিকে যান।',
    directionEn:
      '24-hour Nahdi Pharmacy is 90m ahead at the Clock Tower base / Ibrahim Al-Khalil corner. Ask for Panadol/Fevadol and ORS. Free care is at Bangladesh Hajj Medical Center near Gate 88.',
    priceHintBn: 'প্যানাডল (Panadol) বক্স: ৭ রিয়াল · সৌদি সরকারি ক্লিনিক: সম্পূর্ণ ফ্রি',
    arabicFlashcard:
      'أَحْتَاجُ إِلَى صَيْدَلِيَّةٍ: أُرِيدُ دَوَاءً لِلْحُمَّى وَالصُّدَاعِ (بَانَادُول) وَمَحْلُولَ الْجَفَافِ (ORS) وَدَوَاءَ السُّعَالِ.',
    phoneticBangla:
      'আহতাজু ইলা সাইদালিয়্যাহ (ফার্মেসি): উরীদু দাওয়াআন লিল-হুম্মা ওয়াস-সুদা (প্যানাডল/জ্বরের ওষুধ) ওয়া মাহলূলাল জাফাফ (ওরস্যালাইন)।',
    banglaMeaning:
      'আমার ফার্মেসি দরকার: আমি জ্বর ও শরীর ব্যথার ওষুধ (প্যানাডল), ওরস্যালাইন এবং কাশির ওষুধ চাই।',
    englishTranslation:
      'I need a pharmacy: I need medicine for fever/body ache (Panadol), Oral Rehydration Salts (ORS), and cough medicine.',
  },
  {
    id: 'barber',
    chipLabelBn: '💈 চুল কাটার সেলুন',
    chipLabelEn: '💈 Halq / Barber',
    iconEmoji: '💈',
    categoryBn: 'হলক (মাথা মুণ্ডন) ও কসর (চুল ছোট করা)',
    distanceBn: '১১০ মিটার · ২ মিনিট হাঁটা পথ',
    directionBn:
      'মারওয়া পাহাড়ের গেট দিয়ে বের হয়ে ডান দিকে গাজ্জাহ (Al-Ghazzah) ও সাফা টাওয়ারের নিচতলায় সারিবদ্ধ সরকারি অনুমোদিত সেলুন রয়েছে। নতুন ব্লেড (New Razor Blade) ব্যবহার করতে বলুন।',
    directionEn:
      'Exit from Marwah Gate and turn right toward Al-Ghazzah / Safa Tower basement for licensed barbershops. Always confirm a fresh disposable blade.',
    priceHintBn: 'সরকারি নির্ধারিত রেট: ১৫-২০ রিয়াল (নতুন ব্লেড সহ)',
    arabicFlashcard:
      'أُرِيدُ حَلْقَ الرَّأْسِ بِالْكَامِلِ لِلْعُمْرَةِ / الْحَجِّ. مِنْ فَضْلِكَ اسْتَخْدِمْ شَفْرَةً جَدِيدَةً مُعَقَّمَةً.',
    phoneticBangla:
      'উরীদু হালকার রা’সি বিল-কামিল (সম্পূর্ণ মাথা মুণ্ডন)। মিন ফাদলিক ইসতাখদিম শাফরাতান জাদীদাতান (নতুন ব্লেড ব্যবহার করুন)।',
    banglaMeaning:
      'আমি হজ/উমরাহর জন্য সম্পূর্ণ মাথা মুণ্ডন (হলক) করতে চাই। অনুগ্রহ করে সম্পূর্ণ নতুন জীবাণুমুক্ত ব্লেড ব্যবহার করুন।',
    englishTranslation:
      'I want to shave my head completely (Halq) for Umrah/Hajj. Please use a brand-new sterile razor blade.',
  },
  {
    id: 'wheelchair',
    chipLabelBn: '♿ হুইলচেয়ার ও ওজুখানা',
    chipLabelEn: '♿ Wheelchair & Wudu',
    iconEmoji: '♿',
    categoryBn: 'ফ্রি হুইলচেয়ার পয়েন্ট, গলফ কার্ট ও লিফট সহ ওজুখানা',
    distanceBn: '৪০ মিটার · ১ মিনিট হাঁটা পথ',
    directionBn:
      'আজিয়াদ ব্রিজ (Ajyad Bridge) ও সাফা গেট ১২ এর পাশে বিনামূল্যে হুইলচেয়ার নেওয়ার পয়েন্ট এবং ছাদে বৈদ্যুতিক গলফ কার্টের (মসজিদুল হারাম মেজানাইন ফ্লোর) লিফট রয়েছে। ওজুখানা ও বয়স্কদের বসার টয়লেট গেট ৭৯ ও ৮৯ এর সামনের চত্বরে সিঁড়ি ও চলন্ত র‍্যাম্প দিয়ে নিচে।',
    directionEn:
      'Wheelchair station & electric scooter elevator is at Ajyad Bridge / Safa Gate 12. Accessible Wudu & Western toilets are down the ramp in front of Gate 79 & 89.',
    priceHintBn: 'হুইলচেয়ার (নিজের লোক ঠেললে): ফ্রি · ইলেকট্রিক স্কুটার: ৫০-১১৫ রিয়াল',
    arabicFlashcard:
      'أَنَا كَبِيرٌ فِي السِّنِّ: أَيْنَ مَكَانُ الْكَرَاسِي الْمُتَحَرِّكَةِ (الْعَرَبَات) وَمَكَانُ الْوُضُوءِ وَالْمِصْعَدِ؟',
    phoneticBangla:
      'আনা কাবীরুন ফিস-সিন (আমি বয়স্ক মানুষ): আইনা মাকানুল কারাসিল মুতাহাররিকাহ (হুইলচেয়ার) ওয়া মাকানুল উযূ (ওজুখানা) ওয়াল মিসআদ (লিফট)?',
    banglaMeaning:
      'আমি একজন বয়স্ক হাজী: হুইলচেয়ার নেওয়ার জায়গা, ওজুখানা এবং লিফট কোন দিকে অনুগ্রহ করে দেখিয়ে দিন।',
    englishTranslation:
      'I am an elderly pilgrim: Where is the wheelchair station, Wudu area, and elevator?',
  },
];

export interface PilgrimProfile {
  pid: string;
  nameBn: string;
  nameEn: string;
  age: number;
  bloodGroup: string;
  healthNoteBn: string;
  nusukPermitId: string;
  passportNo: string;
  agencyNameBn: string;
  agencyNameEn: string;
  agencyLicense: string;
  maktabNoBn: string;
  maktabNoEn: string;
  minaTentPin: {
    tentNoBn: string;
    streetPoleBn: string;
    lat: number;
    lng: number;
    savedAt: string;
  };
  inboundFlight: {
    flightNo: string;
    airlineBn: string;
    pnr: string;
    fromBn: string;
    toBn: string;
    sector: 'jeddah' | 'madinah';
    departureTimeBn: string;
    terminalBn: string;
    seat: string;
  };
  outboundFlight: {
    flightNo: string;
    airlineBn: string;
    pnr: string;
    fromBn: string;
    toBn: string;
    departureDateIso: string;
    departureTimeBn: string;
    terminalBn: string;
    baggageAllowanceBn: string;
  };
  makkahHotel: {
    nameBn: string;
    nameEn: string;
    areaBn: string;
    roomNo: string;
    distanceMeters: number;
    lat: number;
    lng: number;
    moallemPhone: string;
  };
  madinahHotel: {
    nameBn: string;
    nameEn: string;
    areaBn: string;
    roomNo: string;
    distanceMeters: number;
  };
  familyGuardian: {
    sonNameBn: string;
    phoneBd: string;
    batteryPercent: number;
    lastHeartbeatBn: string;
  };
}

export const SEEDED_PILGRIM_PROFILES: Record<string, PilgrimProfile> = {
  '20270849210': {
    pid: '20270849210',
    nameBn: 'আলহাজ্ব মোঃ আব্দুল করিম',
    nameEn: 'Alhaj Md. Abdul Karim',
    age: 66,
    bloodGroup: 'B+',
    healthNoteBn: 'উচ্চ রক্তচাপ ও ডায়াবেটিস (সকালে ও রাতে ওষুধ সেবন)',
    nusukPermitId: 'NSK-BD-984210-1448H',
    passportNo: 'A04928174',
    agencyNameBn: 'আল-হারামাইন হজ কাফেলা প্রাঃ লিঃ',
    agencyNameEn: 'Al-Haramain Hajj Kafela Pvt. Ltd.',
    agencyLicense: 'HL-0124',
    maktabNoBn: 'মাকতাব ৪২ (দক্ষিণ এশিয়া - বাংলাদেশ জোন)',
    maktabNoEn: 'Maktab 42 (South Asia - Bangladesh HAAB)',
    minaTentPin: {
      tentNoBn: 'মাকতাব ৪২ · ব্লক B · তাঁবু নং ১৪',
      streetPoleBn: 'কিং ফয়সাল রোড ৫৬ · পোল ১৪B (মুযদালিফা ব্রিজ সংলগ্ন)',
      lat: 21.4133,
      lng: 39.8933,
      savedAt: '৮ই জিলহজ সকাল ৯:১৫',
    },
    inboundFlight: {
      flightNo: 'BG-301',
      airlineBn: 'বিমান বাংলাদেশ এয়ারলাইন্স (Dedicated Hajj Flight)',
      pnr: 'BD8492M',
      fromBn: 'ঢাকা (DAC)',
      toBn: 'জেদ্দা (JED - হজ টার্মিনাল)',
      sector: 'jeddah',
      departureTimeBn: 'সকাল ০৭:৪৫ · আশকোনা রিপোর্টিং রাত ০১:৩০',
      terminalBn: 'হজ টার্মিনাল ১, ঢাকা → জেদ্দা কিং আব্দুল আজিজ হজ টার্মিনাল',
      seat: '24A (Aisle / আইল সিট)',
    },
    outboundFlight: {
      flightNo: 'BG-302',
      airlineBn: 'বিমান বাংলাদেশ এয়ারলাইন্স',
      pnr: 'BD8492M',
      fromBn: 'মদিনা (MED)',
      toBn: 'ঢাকা (DAC)',
      departureDateIso: '2026-10-31T21:30:00Z',
      departureTimeBn: 'রাত ০৯:৩০ (সৌদি সময়)',
      terminalBn: 'প্রিন্স মোহাম্মদ বিন আব্দুল আজিজ এয়ারপোর্ট, মদিনা',
      baggageAllowanceBn: '২টি ব্যাগ (২৩+২৩ = ৪৬ কেজি) + ৭ কেজি হ্যান্ড ব্যাগ + ৫ লিটার জমজম',
    },
    makkahHotel: {
      nameBn: 'দার আল-তাওহীদ মিসফালাহ প্যালেস হোটেল',
      nameEn: 'Dar Al-Tawhid Misfalah Palace Hotel',
      areaBn: 'ইব্রাহিম আল-খলিল রোড, মিসফালাহ (কবুতর চত্বরের কাছে)',
      roomNo: '৪০৮ (লিফট ২)',
      distanceMeters: 420,
      lat: 21.4189,
      lng: 39.8254,
      moallemPhone: '+966 55 849 2104',
    },
    madinahHotel: {
      nameBn: 'আনোয়ার আল-মদিনা মুভেনপিক / মারকাজিয়াহ',
      nameEn: 'Anwar Al Madinah Movenpick (Markaziyah North)',
      areaBn: 'উত্তর মারকাজিয়াহ (মহিলা ও পুরুষ গেট ৩২৯ এর সামনে)',
      roomNo: '৭১২',
      distanceMeters: 210,
    },
    familyGuardian: {
      sonNameBn: 'ইঞ্জিনিয়ার তানভীর করিম (ছেলে - ঢাকা)',
      phoneBd: '+880 1711-849210',
      batteryPercent: 88,
      lastHeartbeatBn: 'এইমাত্র আপডেট হয়েছে · জিপিএস সংকেত সচল',
    },
  },
  '20270849211': {
    pid: '20270849211',
    nameBn: 'আলহাজ্ব মোসাম্মৎ ফাতেমা বেগম',
    nameEn: 'Alhaj Mst. Fatema Begum',
    age: 61,
    bloodGroup: 'O+',
    healthNoteBn: 'হাঁটুতে ব্যথা (সাঈতে হুইলচেয়ার পরামর্শকৃত)',
    nusukPermitId: 'NSK-BD-984211-1448H',
    passportNo: 'A04928175',
    agencyNameBn: 'আল-হারামাইন হজ কাফেলা প্রাঃ লিঃ',
    agencyNameEn: 'Al-Haramain Hajj Kafela Pvt. Ltd.',
    agencyLicense: 'HL-0124',
    maktabNoBn: 'মাকতাব ৪২ (মহিলা তাঁবু সেকশন - বাংলাদেশ জোন)',
    maktabNoEn: 'Maktab 42 (Ladies Section - Bangladesh HAAB)',
    minaTentPin: {
      tentNoBn: 'মাকতাব ৪২ · মহিলা ব্লক A · তাঁবু নং ০৬',
      streetPoleBn: 'কিং ফয়সাল রোড ৫৬ · পোল ১৪A',
      lat: 21.4135,
      lng: 39.8931,
      savedAt: '৮ই জিলহজ সকাল ৯:২০',
    },
    inboundFlight: {
      flightNo: 'BG-301',
      airlineBn: 'বিমান বাংলাদেশ এয়ারলাইন্স',
      pnr: 'BD8492M',
      fromBn: 'ঢাকা (DAC)',
      toBn: 'জেদ্দা (JED)',
      sector: 'jeddah',
      departureTimeBn: 'সকাল ০৭:৪৫',
      terminalBn: 'হজ টার্মিনাল ১, ঢাকা',
      seat: '24B',
    },
    outboundFlight: {
      flightNo: 'BG-302',
      airlineBn: 'বিমান বাংলাদেশ এয়ারলাইন্স',
      pnr: 'BD8492M',
      fromBn: 'মদিনা (MED)',
      toBn: 'ঢাকা (DAC)',
      departureDateIso: '2026-10-31T21:30:00Z',
      departureTimeBn: 'রাত ০৯:৩০',
      terminalBn: 'মদিনা হজ টার্মিনাল',
      baggageAllowanceBn: '২টি ব্যাগ (২৩+২৩ = ৪৬ কেজি) + ৫ লিটার জমজম',
    },
    makkahHotel: {
      nameBn: 'দার আল-তাওহীদ মিসফালাহ প্যালেস হোটেল',
      nameEn: 'Dar Al-Tawhid Misfalah Palace Hotel',
      areaBn: 'ইব্রাহিম আল-খলিল রোড, মিসফালাহ',
      roomNo: '৪০৮',
      distanceMeters: 420,
      lat: 21.4189,
      lng: 39.8254,
      moallemPhone: '+966 55 849 2104',
    },
    madinahHotel: {
      nameBn: 'আনোয়ার আল-মদিনা মুভেনপিক',
      nameEn: 'Anwar Al Madinah Movenpick',
      areaBn: 'উত্তর মারকাজিয়াহ, মদিনা',
      roomNo: '৭১২',
      distanceMeters: 210,
    },
    familyGuardian: {
      sonNameBn: 'ইঞ্জিনিয়ার তানভীর করিম (ছেলে - ঢাকা)',
      phoneBd: '+880 1711-849210',
      batteryPercent: 92,
      lastHeartbeatBn: 'এইমাত্র আপডেট হয়েছে · জিপিএস সংকেত সচল',
    },
  },
};

export interface AgencyReview {
  id: string;
  pilgrimNameBn: string;
  maskedPid: string;
  year: string;
  rating: number;
  commentBn: string;
  verifiedGpsMeters: number;
}

export interface HajjAgency {
  id: string;
  nameBn: string;
  nameEn: string;
  haabLicense: string;
  officeLocationBn: string;
  packagePriceBdt: string;
  makkahAreaBn: string;
  brochurePromisedMeters: number;
  gpsVerifiedActualMeters: number;
  scores: {
    distanceAccuracy: number;
    foodQuality: number;
    moallemPresence: number;
    luggageAndFlight: number;
  };
  totalVerifiedReviews: number;
  reviews: AgencyReview[];
}

export const INITIAL_HAJJ_AGENCIES: HajjAgency[] = [
  {
    id: 'agency-1',
    nameBn: 'আল-হারামাইন হজ কাফেলা প্রাঃ লিঃ',
    nameEn: 'Al-Haramain Hajj Kafela Pvt. Ltd.',
    haabLicense: 'HL-0124',
    officeLocationBn: 'পুরানা পল্টন, ঢাকা-১০০০',
    packagePriceBdt: '৬,১৫,০০০ টাকা',
    makkahAreaBn: 'মিসফালাহ (ইব্রাহিম খলিল রোড - সমতল পথ)',
    brochurePromisedMeters: 400,
    gpsVerifiedActualMeters: 430,
    scores: {
      distanceAccuracy: 4.9,
      foodQuality: 4.8,
      moallemPresence: 4.9,
      luggageAndFlight: 4.8,
    },
    totalVerifiedReviews: 148,
    reviews: [
      {
        id: 'rev-101',
        pilgrimNameBn: 'আলহাজ্ব মাওলানা রফিকুল ইসলাম (সিলেট)',
        maskedPid: '202604***19',
        year: '১৪৪৭ হিজরি',
        rating: 5.0,
        commentBn:
          'আলহামদুলিল্লাহ, ব্রোশিউরে ৪০০ মিটার বলেছিল, বাস্তবে ৪৩০ মিটার সমতল রাস্তা। বয়স্ক হাজীদের জন্য তিন বেলা দেশি মাছ-ভাত ও আরাফাতের ময়দানে মোয়াল্লেম সার্বক্ষণিক সাথে ছিলেন।',
        verifiedGpsMeters: 430,
      },
    ],
  },
  {
    id: 'agency-2',
    nameBn: 'মক্কা-মদিনা নূর ট্রাভেলস অ্যান্ড ট্যুরস',
    nameEn: 'Makkah-Madinah Noor Travels & Tours',
    haabLicense: 'HL-0389',
    officeLocationBn: 'মতিঝিল বা/এ, ঢাকা',
    packagePriceBdt: '৫,৮৫,০০০ টাকা',
    makkahAreaBn: 'আজিজিয়াহ / কুদাই (ব্রোশিউরে মিসফালাহ দাবি)',
    brochurePromisedMeters: 400,
    gpsVerifiedActualMeters: 1120,
    scores: {
      distanceAccuracy: 1.8,
      foodQuality: 3.4,
      moallemPresence: 2.5,
      luggageAndFlight: 3.1,
    },
    totalVerifiedReviews: 94,
    reviews: [
      {
        id: 'rev-102',
        pilgrimNameBn: 'আলহাজ্ব আনোয়ার হোসেন (কুমিল্লা)',
        maskedPid: '202609***82',
        year: '১৪৪৭ হিজরি',
        rating: 2.1,
        commentBn:
          'সতর্কতা: ঢাকায় বুকিংয়ের সময় বলেছিল হারাম শরীফ থেকে ৪০০ মিটার। কিন্তু মক্কায় গিয়ে জিপিএস দিয়ে মেপে দেখি ১,১২০ মিটার এবং উঁচু পাহাড়ি ঢাল! বৃদ্ধ মা-বাবাকে নিয়ে ৫ ওয়াক্ত যাওয়া অসম্ভব ছিল।',
        verifiedGpsMeters: 1120,
      },
    ],
  },
  {
    id: 'agency-3',
    nameBn: 'বায়তুল্লাহ ইসলামিক হজ সার্ভিসেস',
    nameEn: 'Baitullah Islamic Hajj Services',
    haabLicense: 'HL-0512',
    officeLocationBn: 'আগ্রাবাদ, চট্টগ্রাম',
    packagePriceBdt: '৬,৪০,০০০ টাকা',
    makkahAreaBn: 'আজিয়াদ সুদ (ক্লক টাওয়ার সংলগ্ন)',
    brochurePromisedMeters: 350,
    gpsVerifiedActualMeters: 380,
    scores: {
      distanceAccuracy: 4.8,
      foodQuality: 4.7,
      moallemPresence: 4.8,
      luggageAndFlight: 4.9,
    },
    totalVerifiedReviews: 112,
    reviews: [
      {
        id: 'rev-103',
        pilgrimNameBn: 'আলহাজ্ব আব্দুল মান্নান সওদাগর (চট্টগ্রাম)',
        maskedPid: '202602***44',
        year: '১৪৪৭ হিজরি',
        rating: 4.8,
        commentBn:
          'কথা ও কাজের শতভাগ মিল পেয়েছি। আজিয়াদ রোডে ৩৮০ মিটার দূরে হোটেল ছিল এবং মিনা-আরাফাত-মুযদালিফায় আলেম মোয়াল্লেম হানাফি মাসআলা অনুযায়ী প্রতিটি কাজ করিয়েছেন।',
        verifiedGpsMeters: 380,
      },
    ],
  },
  {
    id: 'agency-4',
    nameBn: 'জমজম এভিয়েশন অ্যান্ড হজ গ্রুপ',
    nameEn: 'Zamzam Aviation & Hajj Group',
    haabLicense: 'HL-0771',
    officeLocationBn: 'বনানী রোড ১১, ঢাকা',
    packagePriceBdt: '৫,৬০,০০০ টাকা',
    makkahAreaBn: 'হিজরাহ রোড পেছনের ঢাল (মিসফালাহ)',
    brochurePromisedMeters: 500,
    gpsVerifiedActualMeters: 940,
    scores: {
      distanceAccuracy: 2.3,
      foodQuality: 3.9,
      moallemPresence: 3.2,
      luggageAndFlight: 3.7,
    },
    totalVerifiedReviews: 67,
    reviews: [
      {
        id: 'rev-104',
        pilgrimNameBn: 'ডা. শফিকুর রহমান (বগুড়া)',
        maskedPid: '202607***55',
        year: '১৪৪৭ হিজরি',
        rating: 3.1,
        commentBn:
          'খাবারের মান ভালো ছিল কিন্তু হোটেলের দূরত্ব ৫০০ মিটার বলে ৯৪০ মিটার দূরে দিয়েছে। এছাড়া ১০ই জিলহজ মুযদালিফা থেকে মিনায় যাওয়ার সময় মোয়াল্লেমকে খুঁজে পাওয়া যায়নি।',
        verifiedGpsMeters: 940,
      },
    ],
  },
  {
    id: 'agency-5',
    nameBn: 'দারুস সালাম হজ ও উমরাহ ফাউন্ডেশন',
    nameEn: 'Darus Salam Hajj & Umrah Foundation',
    haabLicense: 'HL-0204',
    officeLocationBn: 'উত্তরা সেক্টর ৭, ঢাকা',
    packagePriceBdt: '৬,২৫,০০০ টাকা',
    makkahAreaBn: 'গাজ্জাহ / মারওয়া গেট সংলগ্ন',
    brochurePromisedMeters: 450,
    gpsVerifiedActualMeters: 490,
    scores: {
      distanceAccuracy: 4.7,
      foodQuality: 4.6,
      moallemPresence: 4.9,
      luggageAndFlight: 4.6,
    },
    totalVerifiedReviews: 89,
    reviews: [
      {
        id: 'rev-105',
        pilgrimNameBn: 'প্রফেসর এ কে এম ফজলুল হক (রাজশাহী)',
        maskedPid: '202601***91',
        year: '১৪৪৭ হিজরি',
        rating: 4.8,
        commentBn:
          'বয়স্ক হাজীদের জন্য অত্যন্ত আন্তরিক সার্ভিস। আরাফাতে এসি তাঁবু ও খাবারের ব্যবস্থা এবং ফিরতি ফ্লাইটে জমজম ও লাগেজ হ্যান্ডলিং চমৎকার ছিল।',
        verifiedGpsMeters: 490,
      },
    ],
  },
];

export interface ZiyarahSpot {
  id: string;
  city: 'makkah' | 'madinah';
  nameBn: string;
  nameEn: string;
  significanceBn: string;
  hanafiEtiquetteBn: string;
  audioScriptBn: string;
}

export const ZIYARAH_SPOTS: ZiyarahSpot[] = [
  {
    id: 'uhud',
    city: 'madinah',
    nameBn: 'জাবালে উহুদ ও শোহাদায়ে উহুদ (মদিনা)',
    nameEn: 'Mount Uhud & Martyrs of Uhud (Madinah)',
    significanceBn:
      'রাসূলুল্লাহ (সা.) বলেছেন: "উহুদ পাহাড় আমাদের ভালোবাসে এবং আমরাও উহুদকে ভালোবাসি।" এখানে সাইয়্যিদুশ শোহাদা হযরত হামজা (রা.)-সহ ৭০ জন সাহাবী শুয়ে আছেন।',
    hanafiEtiquetteBn:
      'হানাফি আদব: শহীদদের কবরস্থানের সামনে দাঁড়িয়ে সালাম দিন ("আসসালামু আলাইকুম ইয়া আহলাল কুবূর...")। কবরস্থানের গ্রিল বা মাটিতে চুমু খাওয়া বা সিজদা করা থেকে বিরত থাকুন।',
    audioScriptBn:
      'আপনি এখন ঐতিহাসিক উহুদ প্রান্তরে দাঁড়িয়ে আছেন। ৩য় হিজরিতে এখানে উহুদের যুদ্ধ সংঘটিত হয়েছিল। সামনে তীরন্দাজদের ছোট পাহাড় (জাবালে রুমাত) এবং পাশেই হযরত হামজা রাদিয়াল্লাহু আনহুসহ ৭০ জন শহীদের কবরস্থান। আদবের সাথে তাঁদের জন্য মাগফিরাতের দোয়া করুন।',
  },
  {
    id: 'quba',
    city: 'madinah',
    nameBn: 'মসজিদে কুবা (ইসলামের প্রথম মসজিদ)',
    nameEn: 'Masjid Quba (First Mosque of Islam)',
    significanceBn:
      'হাদিসে বর্ণিত: হোটেল বা বাসা থেকে অজু করে এসে মসজিদে কুবায় ২ রাকাত নফল নামাজ পড়লে ১টি কবুল উমরাহর সওয়াব পাওয়া যায় (ইবনে মাজাহ)।',
    hanafiEtiquetteBn:
      'হানাফি আদব: হোটেল থেকেই অজু করে রওনা দিন এবং মাকরুহ ওয়াক্ত না হলে মসজিদে প্রবেশ করে ২ রাকাত তাহিয়্যাতুল মসজিদ ও নফল নামাজ আদায় করুন।',
    audioScriptBn:
      'স্বাগতম মসজিদে কুবায়। হিজরতের সময় রাসূলুল্লাহ সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম নিজ হাতে এই মসজিদের ভিত্তিপ্রস্তর স্থাপন করেছিলেন। পবিত্র কুরআনে এই মসজিদকে তাকওয়ার ওপর প্রতিষ্ঠিত মসজিদ বলা হয়েছে। এখানে অজু সহকারে দুই রাকাত নামাজ আদায় করলে একটি উমরাহর সওয়াব লাভ হয়।',
  },
  {
    id: 'hira',
    city: 'makkah',
    nameBn: 'জাবালে নূর ও হেরা গুহা (মক্কা)',
    nameEn: 'Jabal al-Noor & Cave Hira (Makkah)',
    significanceBn:
      'এই পাহাড়ের চূড়ায় অবস্থিত হেরা গুহায় রাসূলুল্লাহ (সা.)-এর ওপর পবিত্র কুরআনের প্রথম ওহী "ইকরা বিসমি রাব্বিকাল্লাযী খালাক" নাজিল হয়েছিল।',
    hanafiEtiquetteBn:
      'বয়স্ক হাজীদের জন্য সতর্কতা: পাহাড়টি অনেক উঁচু ও খাড়া। হেরা গুহায় ওঠা হজের কোনো অংশ বা সুন্নাত নয়। ৬০+ বয়স্ক হাজীগণ নিচে জাবালে নূর কালচারাল সেন্টার থেকে দেখুন, পাহাড়ে উঠে হাঁটুর ক্ষতি করবেন না।',
    audioScriptBn:
      'আপনার সামনে দৃশ্যমান পাহাড়টি হলো জাবালে নূর বা আলোর পাহাড়। এর চূড়ায় রয়েছে ঐতিহাসিক হেরা গুহা, যেখানে নবীজি সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম ধ্যানমগ্ন থাকতেন এবং জিবরীল আলাইহিস সালাম প্রথম ওহী নিয়ে আগমন করেছিলেন। বয়স্ক হাজীগণ প্রচণ্ড রোদে পাহাড়ে না উঠে নিচ থেকেই দর্শন করুন।',
  },
  {
    id: 'qiblatain',
    city: 'madinah',
    nameBn: 'মসজিদে কিবলাতাইন (দুই কিবলার মসজিদ)',
    nameEn: 'Masjid al-Qiblatain (Mosque of the Two Qiblahs)',
    significanceBn:
      '২য় হিজরিতে এই মসজিদে নামাজরত অবস্থায় বায়তুল মুকাদ্দাস থেকে পবিত্র কাবা শরীফের দিকে কিবলা পরিবর্তনের ওহী নাজিল হয়েছিল।',
    hanafiEtiquetteBn:
      'হানাফি আদব: মসজিদে প্রবেশের দোয়া পড়ে ডান পা দিয়ে প্রবেশ করুন এবং ২ রাকাত নফল নামাজ আদায় করে আল্লাহর শুকরিয়া আদায় করুন।',
    audioScriptBn:
      'এটি মদিনা শরীফের ঐতিহাসিক মসজিদে কিবলাতাইন। এখানে নামাজ চলাকালীন অবস্থায় মহান আল্লাহ পবিত্র কাবা শরীফকে মুসলমানদের চিরস্থায়ী কিবলা হিসেবে নির্ধারণের আয়াত নাজিল করেন এবং সাহাবীগণ নামাজের ভেতরেই কাবার দিকে ঘুরে যান।',
  },
];
