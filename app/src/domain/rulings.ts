// Time-based Hanafi guardrails. Every ruling here must be signed off by a Mufti before launch.

export type RamiVerdict = 'invalid' | 'valid' | 'best_for_elderly';

/**
 * Is stoning valid right now? Times are minutes since local midnight (Makkah time).
 * 10 Dhul Hijjah: only Jamarat al-Aqabah, valid from Fajr.
 * 11-13 Dhul Hijjah: all three, valid only after Zawal (true solar noon, not 12:00).
 * After Asr the bridge is usually calmer, which suits older pilgrims.
 */
export function ramiWindow(
  day: number,
  nowMin: number,
  t: { fajr: number; zawal: number; asr: number },
): { verdict: RamiVerdict; reasonBn: string } {
  if (day === 10) {
    if (nowMin < t.fajr) return { verdict: 'invalid', reasonBn: 'ফজরের আগে কংকর নিক্ষেপ সহিহ নয়' };
    return { verdict: 'valid', reasonBn: 'আজ শুধু বড় জামারায় ৭টি কংকর' };
  }
  if (day >= 11 && day <= 13) {
    if (nowMin < t.zawal) return { verdict: 'invalid', reasonBn: 'যাওয়ালের (দুপুর) আগে সহিহ নয়' };
    if (nowMin >= t.asr) return { verdict: 'best_for_elderly', reasonBn: 'আসরের পর ভিড় কম, বয়স্কদের জন্য ভালো' };
    return { verdict: 'valid', reasonBn: 'তিন জামারায় ৭টি করে কংকর' };
  }
  return { verdict: 'invalid', reasonBn: 'আজ কংকর নিক্ষেপের দিন নয়' };
}

export const toMin = (h: number, m: number) => h * 60 + m;
