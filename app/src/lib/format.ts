const BN = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function bnDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN[Number(d)]);
}

export function num(n: string | number, lang: 'bn' | 'en') {
  return lang === 'bn' ? bnDigits(n) : String(n);
}

/** Clock time in Makkah. Bangla uses the part of day people actually say: সকাল, দুপুর, বিকাল, সন্ধ্যা, রাত. */
export function clock(ts: number, lang: 'bn' | 'en') {
  const p = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: false, timeZone: 'Asia/Riyadh' })
    .formatToParts(ts).reduce<Record<string, string>>((a, x) => ({ ...a, [x.type]: x.value }), {});
  const h = Number(p.hour) % 24;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  if (lang === 'en') return `${h12}:${p.minute} ${h < 12 ? 'AM' : 'PM'}`;
  const part = h < 4 ? 'রাত' : h < 12 ? 'সকাল' : h < 15 ? 'দুপুর' : h < 18 ? 'বিকাল' : h < 20 ? 'সন্ধ্যা' : 'রাত';
  return `${part} ${bnDigits(`${h12}:${p.minute}`)}`;
}

/** "3 min ago" style, in Bangla or English. */
export function ago(ts: number | null, lang: 'bn' | 'en', now = Date.now()) {
  if (ts === null) return lang === 'bn' ? 'এখনো পাওয়া যায়নি' : 'not yet';
  const m = Math.max(0, Math.round((now - ts) / 60000));
  if (m < 1) return lang === 'bn' ? 'এইমাত্র' : 'just now';
  if (m < 60) return lang === 'bn' ? `${bnDigits(m)} মিনিট আগে` : `${m} min ago`;
  const h = Math.round(m / 60);
  return lang === 'bn' ? `${bnDigits(h)} ঘণ্টা আগে` : `${h} h ago`;
}

export function countdown(ms: number, lang: 'bn' | 'en') {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const str = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return num(str, lang);
}
