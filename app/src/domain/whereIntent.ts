// "চা কোথায় পাবো?" → which kind of place the pilgrim wants to reach. Null when it isn't a "where" question.
import type { DestKind } from './pois';

const PLACES: Array<{ kind: DestKind; keys: string[] }> = [
  { kind: 'hotel', keys: ['হোটেলে', 'হোটেলের পথ', 'হোটেল কোথায়', 'হোটেলে ফির', 'রুমে', 'back to hotel', 'my hotel', 'hotel'] },
  { kind: 'tea', keys: ['চা ', 'চা?', 'চায়', 'কফি', 'tea', 'coffee', 'cafe'] },
  { kind: 'food', keys: ['খাবার', 'ভাত', 'খেতে', 'রেস্টুরেন্ট', 'হোটেলে খা', 'food', 'restaurant', 'eat', 'lunch', 'dinner'] },
  { kind: 'water', keys: ['জমজম', 'যমযম', 'পানি', 'zamzam', 'water'] },
  { kind: 'wudu', keys: ['ওযু', 'অজু', 'ওজু', 'wudu', 'ablution'] },
  { kind: 'toilet', keys: ['টয়লেট', 'বাথরুম', 'প্রস্রাব', 'পায়খানা', 'toilet', 'washroom', 'bathroom', 'restroom'] },
  { kind: 'pharmacy', keys: ['ফার্মেসি', 'ওষুধ', 'pharmacy', 'medicine'] },
  { kind: 'clinic', keys: ['ডাক্তার', 'হাসপাতাল', 'ক্লিনিক', 'doctor', 'hospital', 'clinic'] },
  { kind: 'gate', keys: ['গেট', 'gate'] },
  { kind: 'haram', keys: ['হারাম', 'কাবা', 'মসজিদে', 'haram', 'kaaba', 'mosque'] },
];
const WHERE = ['কোথায়', 'কোথায়', 'কই', 'কাছে', 'যাব', 'যাবো', 'ফিরব', 'ফিরবো', 'পাবো', 'পাব', 'কিভাবে', 'কীভাবে', 'রাস্তা', 'পথ', 'where', 'near', 'how do i get', 'way to', 'take me', 'find'];

export function whereIntent(text: string): DestKind | null {
  const q = ` ${text.toLowerCase()} `;
  if (!WHERE.some((w) => q.includes(w))) return null;
  for (const p of PLACES) if (p.keys.some((k) => q.includes(k.toLowerCase()))) return p.kind;
  return null;
}
