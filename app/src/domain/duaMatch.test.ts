import test from 'node:test';
import assert from 'node:assert/strict';
import { DUAS, matchDuas } from './duaMatch';

test('parents first when the heart is about parents', () => {
  assert.equal(matchDuas('আমার মা-বাবার জন্য দোয়া করতে চাই')[0].themeEn.includes('arent'), true);
  assert.equal(matchDuas('I am anxious about my parents back home')[0].id.startsWith('parents'), true);
});

test('illness, children, debt, deceased', () => {
  assert.equal(matchDuas('আম্মার শরীর খুব অসুস্থ')[0].id, 'illness');
  assert.ok(matchDuas('ছেলের ভবিষ্যৎ নিয়ে চিন্তা').some((d) => d.id.startsWith('children')));
  assert.equal(matchDuas('অনেক ঋণ আছে')[0].id, 'provision');
  assert.ok(matchDuas('আব্বা মারা গেছেন, কবরের জন্য').some((d) => d.id === 'deceased'));
});

test('unknown words still return general duas', () => {
  const r = matchDuas('xyz');
  assert.ok(r.length > 0);
});

test('every dua has a source and Arabic text', () => {
  for (const d of DUAS) { assert.ok(d.source.length > 3, d.id); assert.ok(/[؀-ۿ]/.test(d.arabic), d.id); }
});
