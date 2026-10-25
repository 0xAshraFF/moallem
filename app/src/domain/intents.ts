// Offline answers for the Ask screen. Matches specific topics before general ones
// (the draft sent every Tawaf question to the wudu answer). No invented shop names or distances.

export type NeedId = 'food' | 'water' | 'pharmacy' | 'barber' | 'wheelchair' | 'toilet' | 'lost';

export interface ArabicCard {
  arabic: string;
  phoneticBn: string;
  meaningBn: string;
}

export interface Need {
  id: NeedId;
  labelBn: string;
  labelEn: string;
  card: ArabicCard;
}

export const NEEDS: Need[] = [
  { id: 'food', labelBn: 'খাবার', labelEn: 'Food', card: {
    arabic: 'أَيْنَ أَجِدُ مَطْعَمًا قَرِيبًا؟',
    phoneticBn: 'আইনা আজিদু মাত্বআমান কারীবান?', meaningBn: 'কাছে খাবারের দোকান কোথায়?' } },
  { id: 'water', labelBn: 'পানি', labelEn: 'Water', card: {
    arabic: 'أَيْنَ الْمَاءُ مِنْ فَضْلِكَ؟',
    phoneticBn: 'আইনাল মা-উ মিন ফাদলিক?', meaningBn: 'দয়া করে বলুন, পানি কোথায়?' } },
  { id: 'pharmacy', labelBn: 'ওষুধ', labelEn: 'Pharmacy', card: {
    arabic: 'أَيْنَ أَقْرَبُ صَيْدَلِيَّةٍ؟',
    phoneticBn: 'আইনা আকরাবু সাইদালিয়্যাহ?', meaningBn: 'সবচেয়ে কাছের ফার্মেসি কোথায়?' } },
  { id: 'barber', labelBn: 'চুল কাটা', labelEn: 'Barber', card: {
    arabic: 'أَيْنَ الْحَلَّاقُ؟ أُرِيدُ الْحَلْقَ',
    phoneticBn: 'আইনাল হাল্লাক? উরীদুল হালক', meaningBn: 'নাপিত কোথায়? মাথা মুণ্ডন করব।' } },
  { id: 'wheelchair', labelBn: 'হুইলচেয়ার', labelEn: 'Wheelchair', card: {
    arabic: 'أَحْتَاجُ كُرْسِيًّا مُتَحَرِّكًا مِنْ فَضْلِكَ',
    phoneticBn: 'আহতাজু কুরসিয়্যান মুতাহাররিকান মিন ফাদলিক', meaningBn: 'দয়া করে আমার একটি হুইলচেয়ার দরকার।' } },
  { id: 'toilet', labelBn: 'ওযুখানা', labelEn: 'Wudu', card: {
    arabic: 'أَيْنَ دَوْرَةُ الْمِيَاهِ وَالْوُضُوءُ؟',
    phoneticBn: 'আইনা দাওরাতুল মিয়াহ ওয়াল উযু?', meaningBn: 'টয়লেট ও ওযুখানা কোথায়?' } },
  { id: 'lost', labelBn: 'পথ হারিয়েছি', labelEn: 'I am lost', card: {
    arabic: 'أَنَا حَاجٌّ مِنْ بَنْغْلَادِيشَ وَقَدْ ضَلَلْتُ طَرِيقِي، سَاعِدْنِي مِنْ فَضْلِكَ',
    phoneticBn: 'আনা হাজ্জুন মিন বাংলাদেশ, ওয়া কাদ দালালতু তারীকী, সাইদনী মিন ফাদলিক',
    meaningBn: 'আমি বাংলাদেশের হাজী, পথ হারিয়েছি। দয়া করে সাহায্য করুন।' } },
];

interface Answer { topic: string; keys: string[]; replyBn: string; replyEn: string }

// Order matters: specific before general.
const ANSWERS: Answer[] = [
  { topic: 'perfume', keys: ['সাবান', 'সুগন্ধি', 'আতর', 'perfume', 'soap'],
    replyBn: 'ভয় পাবেন না। ভুলে সুগন্ধি সাবান লাগলে হজ নষ্ট হয় না। এখনই পানি দিয়ে ধুয়ে ফেলুন। সামান্য হলে সদকা যথেষ্ট; বিস্তারিত আপনার মোয়াল্লেমকে জিজ্ঞেস করুন।',
    replyEn: "Don't worry. Accidental scented soap does not break your Hajj. Wash it off now. A small amount needs only sadaqah; confirm with your Moallem." },
  { topic: 'wudu_tawaf', keys: ['ওযু ভে', 'অজু ভে', 'wudu broke', 'ওযু চলে', 'অজু চলে'],
    replyBn: 'তাওয়াফের মাঝে ওযু ভাঙলে থামুন, ওযু করে আসুন। ৪ চক্করের কম হলে নতুন করে শুরু করা ভালো; ৪ বা বেশি হলে যেখানে থেমেছিলেন সেখান থেকে বাকিটা করুন।',
    replyEn: 'If wudu breaks during Tawaf, stop and renew it. Under 4 rounds, restarting is better; 4 or more, continue where you stopped.' },
  { topic: 'tawaf_count', keys: ['কত চক্কর', 'চক্কর ভুল', 'গুনতে', 'how many rounds', 'forgot round'],
    replyBn: 'চক্করের সংখ্যায় সন্দেহ হলে কম সংখ্যাটি ধরে নিন এবং বাকি চক্কর পূর্ণ করুন। এই অ্যাপের তাওয়াফ কাউন্টার ব্যবহার করুন।',
    replyEn: 'If unsure of the count, take the lower number and complete the rest. Use the Tawaf counter in this app.' },
  { topic: 'maghrib_arafah', keys: ['মাগরিব', 'মুযদালিফা', 'maghrib', 'muzdalifah'],
    replyBn: 'সূর্যাস্তের পর আরাফায় মাগরিব পড়বেন না। মুযদালিফায় গিয়ে এশার সময়ে মাগরিব ও এশা একসাথে পড়বেন।',
    replyEn: 'Do not pray Maghrib in Arafah after sunset. Pray Maghrib and Isha together at Muzdalifah at Isha time.' },
  { topic: 'rami', keys: ['কংকর', 'জামারা', 'রমি', 'rami', 'stoning', 'pebble'],
    replyBn: '১০ তারিখে শুধু বড় জামারায় ৭টি কংকর। ১১-১৩ তারিখে যাওয়ালের (দুপুর) পর তিন জামারায় ৭টি করে। বয়স্কদের জন্য আসরের পর ভিড় কম।',
    replyEn: 'On the 10th, 7 pebbles at the big Jamarah only. On 11-13, after midday, 7 at each of the three. After Asr is calmer for elders.' },
  { topic: 'arafah', keys: ['আরাফা', 'arafah', 'arafat'],
    replyBn: 'আরাফার দিন দুপুর থেকে সূর্যাস্ত পর্যন্ত দোয়ায় থাকুন। শুয়ে বা বসেও দোয়া করা যায়। বেশি পানি পান করুন, ছাতা রাখুন।',
    replyEn: 'On Arafah day, stay in dua from midday to sunset. Lying down or sitting is fine. Drink water, keep shade.' },
  { topic: 'tawaf', keys: ['তাওয়াফ', 'tawaf'],
    replyBn: 'হাজরে আসওয়াদ থেকে শুরু করে কাবা বাম পাশে রেখে ৭ চক্কর। প্রতি চক্করে কাউন্টারে একবার চাপ দিন, দোয়া শুনুন।',
    replyEn: 'Start at the Black Stone, keep the Kaaba on your left, 7 rounds. Tap the counter once per round and listen to the dua.' },
];

const GENERIC = {
  replyBn: 'আমি এখন অফলাইনে আছি। নিচের বোতাম থেকে বেছে নিন, অথবা আপনার মোয়াল্লেমকে ফোন করুন।',
  replyEn: "I'm offline right now. Pick a button below, or call your Moallem.",
};

export function answerOffline(text: string): { topic: string; replyBn: string; replyEn: string } {
  const q = text.toLowerCase();
  for (const a of ANSWERS) if (a.keys.some((k) => q.includes(k.toLowerCase()))) return a;
  return { topic: 'generic', ...GENERIC };
}
