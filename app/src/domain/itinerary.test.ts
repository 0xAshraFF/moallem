import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HAJJ_1448, answerTripQuestion, buildItinerary, daysUntil, luggageDeadline, luggagePlan, shiftCalendar,
  toBnDigits, whereOn, withAnnouncements, type Ticket,
} from './itinerary';

// Jeddah-first: land JED, Makkah -> Hajj -> Madinah -> fly home from MED
const JED_FIRST: Ticket = {
  pilgrimName: 'Abdul Karim', pnr: 'X7K2LM',
  inbound: { flightNo: 'BG3001', date: '2027-04-20', time: '10:00', from: 'DAC', to: 'JED' },
  outbound: { flightNo: 'BG3022', date: '2027-05-30', time: '13:00', from: 'MED', to: 'DAC' },
};
// Madinah-first: overnight flight lands MED next day, Madinah 8 days -> Makkah -> Hajj -> home from JED
const MED_FIRST: Ticket = {
  inbound: { flightNo: 'SV803', date: '2027-04-12', time: '23:30', from: 'DAC', to: 'MED' },
  outbound: { flightNo: 'SV802', date: '2027-06-10', from: 'JED', to: 'DAC' },
};
const flight = (date: string, from: string, to: string, time?: string) => ({ flightNo: 'BG1', date, from, to, ...(time ? { time } : {}) });
const codes = (it: { warnings: { code: string }[] }) => it.warnings.map((w) => w.code);
const hasAsciiDigit = (s: string) => /[0-9]/.test(s);

// ------------------------------------------------------------- calendar

test('Hajj 1448 follows Umm al-Qura: Tarwiyah 14 May, Arafah 15 May, Eid 16 May 2027', () => {
  assert.equal(HAJJ_1448.dhulHijjah1, '2027-05-07');
  const it = buildItinerary(JED_FIRST);
  assert.deepEqual(it.hajj, { tarwiyah: '2027-05-14', arafah: '2027-05-15', eid: '2027-05-16', lastMinaDay: '2027-05-18' });
});

test('calendar can be shifted a day for moon sighting', () => {
  const it = buildItinerary(JED_FIRST, { calendar: shiftCalendar(HAJJ_1448, 1) });
  assert.equal(it.hajj.arafah, '2027-05-16');
  assert.equal(whereOn(it, '2027-05-16'), 'arafah');
});

// ------------------------------------------------------------- Jeddah-first

test('Jeddah-first: Makkah, Hajj, then 8 days Madinah before the MED flight', () => {
  const it = buildItinerary(JED_FIRST);
  assert.equal(it.ok, true);
  assert.deepEqual(it.errors, []);
  assert.equal(it.pattern, 'jeddah_first');
  assert.deepEqual(
    it.segments.map((s) => s.kind),
    ['travel', 'makkah', 'mina', 'arafah', 'muzdalifah', 'jamarat', 'mina', 'makkah', 'madinah', 'return'],
  );
  assert.deepEqual(it.madinah, { start: '2027-05-22', end: '2027-05-29', leave: '2027-05-30', days: 8, placement: 'after', shortened: false });
  assert.equal(it.segments[1].start, '2027-04-20'); // same-day landing, Makkah that day
  assert.equal(it.segments[1].end, '2027-05-13'); // 7 Dhul Hijjah
});

test('days: one per calendar date, contiguous, 1-3 tasks each, hijri labels only in Dhul Hijjah', () => {
  const it = buildItinerary(JED_FIRST);
  assert.equal(it.days[0].date, '2027-04-20');
  assert.equal(it.days.at(-1)!.date, '2027-05-30');
  assert.equal(it.days.length, daysUntil('2027-04-20', '2027-05-30') + 1);
  for (let i = 1; i < it.days.length; i++) assert.equal(daysUntil(it.days[i - 1].date, it.days[i].date), 1);
  for (const d of it.days) assert.ok(d.tasks.length >= 1 && d.tasks.length <= 3, `${d.date} has ${d.tasks.length} tasks`);
  const before = it.days.find((d) => d.date === '2027-05-06')!;
  assert.equal(before.hijriBn, undefined);
  const arafah = it.days.find((d) => d.date === '2027-05-15')!;
  assert.equal(arafah.dhulHijjah, 9);
  assert.equal(arafah.hijriBn, '৯ জিলহজ · আরাফার দিন');
  assert.equal(arafah.night, 'muzdalifah');
  assert.equal(it.days.find((d) => d.date === '2027-05-16')!.hijriBn, '১০ জিলহজ · ঈদুল আযহা');
});

test('Jeddah landing: first day says board in Ihram and perform Umrah', () => {
  const it = buildItinerary(JED_FIRST);
  const t = it.days[0].tasks.map((x) => x.en).join(' | ');
  assert.match(t, /Ihram/);
  assert.match(t, /Umrah/);
});

test('farewell Tawaf and luggage on the last Makkah day before Madinah', () => {
  const it = buildItinerary(JED_FIRST);
  const d = it.days.find((x) => x.date === '2027-05-21')!;
  const en = d.tasks.map((x) => x.en).join(' | ');
  assert.match(en, /farewell Tawaf/);
  assert.match(en, /luggage/);
});

// ------------------------------------------------------------- Madinah-first

test('Madinah-first: overnight flight lands next day, 8 days Madinah, then Makkah, home from JED', () => {
  const it = buildItinerary(MED_FIRST);
  assert.equal(it.ok, true);
  assert.equal(it.pattern, 'madinah_first');
  assert.equal(it.arrivalDate, '2027-04-13'); // 23:30 departure lands after midnight
  assert.deepEqual(it.madinah, { start: '2027-04-13', end: '2027-04-20', leave: '2027-04-21', days: 8, placement: 'before', shortened: false });
  assert.deepEqual(
    it.segments.map((s) => s.kind),
    ['travel', 'madinah', 'makkah', 'mina', 'arafah', 'muzdalifah', 'jamarat', 'mina', 'makkah', 'return'],
  );
  assert.equal(whereOn(it, '2027-04-12'), 'air');
  assert.equal(whereOn(it, '2027-04-15'), 'madinah');
  assert.equal(whereOn(it, '2027-04-21'), 'makkah');
  assert.equal(whereOn(it, '2027-06-10'), 'jeddah');
  // Madinah landing: travel in normal clothes; Ihram at the Miqat on the way to Makkah
  assert.match(it.days[0].tasks.map((t) => t.en).join(' '), /normal clothes/);
  assert.match(it.days.find((d) => d.date === '2027-04-21')!.tasks.map((t) => t.en).join(' '), /Dhul Hulayfah/);
});

test('missing times: landing assumed on the departure date', () => {
  const it = buildItinerary({ inbound: flight('2027-04-12', 'DAC', 'MED'), outbound: flight('2027-06-10', 'JED', 'DAC') });
  assert.equal(it.arrivalDate, '2027-04-12');
  assert.equal(it.homeDate, '2027-06-10');
  assert.equal(it.madinah!.start, '2027-04-12');
});

test('ticket-printed arrival date wins over the estimate', () => {
  const it = buildItinerary({ inbound: { ...flight('2027-04-12', 'DAC', 'MED', '09:00'), arrDate: '2027-04-13' }, outbound: flight('2027-06-10', 'JED', 'DAC', '18:00') });
  assert.equal(it.arrivalDate, '2027-04-13');
  assert.equal(it.homeDate, '2027-06-11'); // evening flight lands in Dhaka next day
  assert.equal(whereOn(it, '2027-06-11'), 'dhaka');
});

// ------------------------------------------------------------- edge cases

test('Madinah landing very close to Hajj: Madinah moves after Hajj', () => {
  const it = buildItinerary({ inbound: flight('2027-05-10', 'DAC', 'MED'), outbound: flight('2027-06-10', 'JED', 'DAC') });
  assert.equal(it.ok, true);
  assert.equal(it.madinah!.placement, 'after');
  assert.equal(it.madinah!.days, 8);
  assert.ok(codes(it).includes('madinah_moved_after'));
  assert.ok(codes(it).includes('arrives_close_to_hajj'));
});

test('Madinah landing close to Hajj with no room after: shortened Madinah before Hajj', () => {
  const it = buildItinerary({ inbound: flight('2027-05-10', 'DAC', 'MED'), outbound: flight('2027-05-21', 'JED', 'DAC') });
  assert.equal(it.madinah!.placement, 'before');
  assert.equal(it.madinah!.days, 3);
  assert.equal(it.madinah!.leave, '2027-05-13'); // reach Makkah by 7 Dhul Hijjah
  assert.ok(codes(it).includes('madinah_shortened'));
});

test('return from MED soon after Hajj: Madinah shortened, never overlaps Mina', () => {
  const it = buildItinerary({ inbound: flight('2027-04-20', 'DAC', 'JED'), outbound: flight('2027-05-21', 'MED', 'DAC') });
  assert.equal(it.madinah!.start, '2027-05-19');
  assert.equal(it.madinah!.days, 2);
  assert.ok(codes(it).includes('madinah_shortened'));
  assert.equal(whereOn(it, '2027-05-18'), 'mina');
});

test('Jeddah both ways with no room after Hajj: Madinah between Umrah and Hajj', () => {
  const it = buildItinerary({ inbound: flight('2027-04-25', 'DAC', 'JED'), outbound: flight('2027-05-21', 'JED', 'DAC') });
  assert.equal(it.madinah!.placement, 'before');
  assert.equal(it.madinah!.start, '2027-04-28'); // 3 days in Makkah for Umrah first
  assert.equal(it.madinah!.days, 8);
  assert.equal(whereOn(it, '2027-04-25'), 'makkah');
  assert.equal(whereOn(it, '2027-05-06'), 'makkah');
});

test('Jeddah both ways with room after Hajj: Madinah right before the flight', () => {
  const it = buildItinerary({ inbound: flight('2027-04-25', 'DAC', 'JED'), outbound: flight('2027-06-05', 'JED', 'DAC') });
  assert.equal(it.madinah!.placement, 'after');
  assert.equal(it.madinah!.end, '2027-06-04');
  assert.equal(whereOn(it, '2027-06-05'), 'jeddah');
});

test('madinahDays and placement are overridable', () => {
  const ten = buildItinerary(JED_FIRST, { madinahDays: 10 });
  assert.equal(ten.madinah!.days, 10);
  assert.equal(ten.madinah!.start, '2027-05-20');
  const none = buildItinerary(JED_FIRST, { madinahPlacement: 'none' });
  assert.equal(none.madinah, null);
  assert.ok(codes(none).includes('madinah_not_scheduled'));
  assert.ok(!none.days.some((d) => d.place === 'madinah' && d.kind !== 'return'));
});

test('late nafr keeps the pilgrim in Mina on the 13th', () => {
  const it = buildItinerary(JED_FIRST, { nafr: 'late' });
  assert.equal(it.hajj.lastMinaDay, '2027-05-19');
  assert.equal(whereOn(it, '2027-05-19'), 'mina');
  assert.equal(it.days.find((d) => d.date === '2027-05-18')!.night, 'mina');
});

test('landing on 8 Dhul Hijjah: straight to Mina, with a warning', () => {
  const it = buildItinerary({ inbound: flight('2027-05-14', 'DAC', 'JED'), outbound: flight('2027-06-10', 'MED', 'DAC') });
  assert.equal(it.ok, true);
  assert.ok(codes(it).includes('arrives_on_tarwiyah'));
  assert.equal(whereOn(it, '2027-05-14'), 'mina');
  assert.ok(!it.segments.some((s) => s.kind === 'makkah' && s.start < '2027-05-14'));
});

test('invalid input returns errors, never throws', () => {
  const bad = buildItinerary({ inbound: flight('2027-02-30', 'DAC', 'JED'), outbound: flight('2027-06-10', 'MED', 'DAC') });
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.errors.map((e) => [e.code, e.field]), [['invalid_date', 'inbound.date']]);
  assert.deepEqual(bad.days, []);
  assert.deepEqual(bad.segments, []);

  assert.doesNotThrow(() => buildItinerary(null as unknown as Ticket));
  assert.equal(buildItinerary(null as unknown as Ticket).errors[0].code, 'missing_flight');
  assert.equal(buildItinerary({ inbound: flight('20270420', 'DAC', 'JED') } as unknown as Ticket).ok, false);
  assert.equal(buildItinerary({ inbound: { date: 42 }, outbound: {} } as unknown as Ticket).ok, false);
});

test('impossible tickets are rejected with a clear code', () => {
  const e = (inD: string, outD: string) => buildItinerary({ inbound: flight(inD, 'DAC', 'JED'), outbound: flight(outD, 'MED', 'DAC') }).errors.map((x) => x.code);
  assert.deepEqual(e('2027-05-20', '2027-04-20'), ['outbound_before_inbound']);
  assert.deepEqual(e('2027-05-17', '2027-06-10'), ['arrives_after_hajj']);
  assert.deepEqual(e('2027-04-20', '2027-05-17'), ['departs_before_hajj_ends']);
  assert.deepEqual(e('2026-04-20', '2026-06-10'), ['not_this_hajj_season']);
});

test('unreadable time and unknown airport are warnings, not errors', () => {
  const it = buildItinerary({ inbound: flight('2027-04-20', 'DAC', 'XYZ', '25:99'), outbound: flight('2027-05-30', 'MED', 'DAC') });
  assert.equal(it.ok, true);
  assert.ok(codes(it).includes('invalid_time'));
  assert.ok(codes(it).includes('unknown_airport'));
  assert.equal(it.landing, 'JED');
});

test('before the announced first flight (8 Apr 2027) gives a warning', () => {
  const it = buildItinerary({ inbound: flight('2027-04-01', 'DAC', 'JED'), outbound: flight('2027-05-30', 'MED', 'DAC') });
  assert.ok(codes(it).includes('before_first_flight'));
});

// ------------------------------------------------------------- whereOn / luggage

test('whereOn picks the photo place, dhaka outside the trip', () => {
  const it = buildItinerary(JED_FIRST);
  assert.equal(whereOn(it, '2027-04-01'), 'dhaka');
  assert.equal(whereOn(it, '2027-05-14'), 'mina');
  assert.equal(whereOn(it, '2027-05-15'), 'arafah');
  assert.equal(whereOn(it, '2027-05-16'), 'jamarat');
  assert.equal(whereOn(it, '2027-05-17'), 'mina');
  assert.equal(whereOn(it, '2027-05-25'), 'madinah');
  assert.equal(whereOn(it, '2027-05-30'), 'madinah'); // MED departure day
  assert.equal(whereOn(it, '2027-07-01'), 'dhaka');
});

test('luggage plan: small bag for Mina, full luggage for Madinah and home', () => {
  const it = buildItinerary(JED_FIRST);
  assert.deepEqual(luggagePlan(it).map((m) => [m.kind, m.bag, m.packBy]), [
    ['mina', 'small', '2027-05-13'], ['madinah', 'full', '2027-05-21'], ['return', 'full', '2027-05-29'],
  ]);
  assert.equal(luggageDeadline(it, '2027-05-19')!.kind, 'madinah');
  assert.equal(luggageDeadline(it, '2027-05-30')!.kind, 'return');
  assert.equal(luggageDeadline(it, '2027-06-01'), null);
  const two = buildItinerary(JED_FIRST, { luggageDaysBefore: 2 });
  assert.equal(luggagePlan(two).at(-1)!.packBy, '2027-05-28');
});

test('daysUntil and Bangla digits', () => {
  assert.equal(daysUntil('2027-04-25', '2027-05-15'), 20);
  assert.ok(Number.isNaN(daysUntil('bad', '2027-05-15')));
  assert.equal(toBnDigits(2027), '২০২৭');
  assert.equal(toBnDigits('10:30'), '১০:৩০');
});

// ------------------------------------------------------------- questions

const JED = buildItinerary(JED_FIRST);
const MED = buildItinerary(MED_FIRST);
const ask = (q: string, today = '2027-04-25', it = JED) => answerTripQuestion(it, q, today);

test('"মদিনায় কয়দিন থাকব?" in every common spelling', () => {
  for (const q of ['মদিনায় কয়দিন থাকব?', 'মদীনায় কতদিন থাকবো', 'মদিনাতে কয় দিন থাকবো', 'মদিনায় কত দিন', 'How many days in Madinah?', 'how long will we stay in medina']) {
    const a = ask(q);
    assert.ok(a, q);
    assert.equal(a!.topic, 'madinah_stay', q);
    assert.match(a!.replyBn, /৮ দিন/, q);
    assert.ok(!hasAsciiDigit(a!.replyBn), q);
  }
});

test('decomposed য় (য + nukta) is matched the same', () => {
  const decomposed = 'মদিনায় কয়দিন থাকব'.normalize('NFD');
  assert.equal(ask(decomposed)!.topic, 'madinah_stay');
});

test('while in Madinah: days left are counted', () => {
  const a = ask('মদিনায় আর কয়দিন?', '2027-05-26');
  assert.match(a!.replyBn, /আর ৪ দিন বাকি/);
});

test('"কবে মক্কা যাব?" for Madinah-first pilgrims', () => {
  const a = ask('কবে মক্কা যাব?', '2027-04-15', MED);
  assert.equal(a!.topic, 'go_makkah');
  assert.match(a!.replyBn, /বুধবার, ২১ এপ্রিল/);
  assert.match(a!.replyBn, /আর ৬ দিন পর/);
  assert.equal(ask('কবে মক্কা যাব?', '2027-04-25', MED)!.replyBn, 'আপনি এখন মক্কাতেই আছেন।');
});

test('"কবে মদিনা যাব?" for Jeddah-first pilgrims', () => {
  const a = ask('কবে মদিনা যাব?', '2027-05-19');
  assert.equal(a!.topic, 'go_madinah');
  assert.match(a!.replyBn, /শনিবার, ২২ মে/);
  assert.match(a!.replyBn, /আর ৩ দিন পর/);
});

test('"কবে মিনা যাব?" gives 8 Dhul Hijjah with countdown', () => {
  const a = ask('কবে মিনা যাব?', '2027-05-13');
  assert.equal(a!.topic, 'go_mina');
  assert.match(a!.replyBn, /আগামীকাল/);
  assert.match(a!.replyBn, /৮ জিলহজ/);
  assert.equal(ask('when do we go to Mina', '2027-05-17')!.topic, 'go_mina');
});

test('"কবে দেশে ফিরব?" gives flight, date and days left', () => {
  const a = ask('কবে দেশে ফিরব?');
  assert.equal(a!.topic, 'return_home');
  assert.match(a!.replyBn, /রবিবার, ৩০ মে/);
  assert.match(a!.replyBn, /আর ৩৫ দিন পর/);
  assert.match(a!.replyBn, /BG3022/);
  assert.match(a!.replyBn, /১৩:০০/);
  assert.match(a!.replyEn, /in 35 days/);
  assert.match(ask('বাড়ি কবে যাব', '2027-05-30')!.replyBn, /আজই/);
});

test('"হজের আর কয়দিন বাকি?" counts to Arafah in Bangla digits', () => {
  const a = ask('হজের আর কয়দিন বাকি?');
  assert.equal(a!.topic, 'hajj_countdown');
  assert.match(a!.replyBn, /আর ২০ দিন বাকি/);
  assert.ok(!hasAsciiDigit(a!.replyBn));
  assert.match(ask('হজ কবে?', '2027-05-15')!.replyBn, /আজই হজ/);
  assert.match(ask('hajj how many days left', '2027-05-17')!.replyEn, /under way/);
  assert.match(ask('হজের আর কতদিন', '2027-05-25')!.replyBn, /শেষ/);
});

test('"লাগেজ কবে রেডি করব?" points to the next move', () => {
  assert.match(ask('লাগেজ কবে রেডি করব?', '2027-05-19')!.replyBn, /বৃহস্পতিবার, ২০ মে|শুক্রবার, ২১ মে/);
  assert.match(ask('লাগেজ কবে রেডি করব?', '2027-05-21')!.replyBn, /আজ রাতের মধ্যেই/);
  assert.match(ask('ব্যাগ গোছাব কবে', '2027-05-10')!.replyBn, /মিনার জন্য/);
  assert.match(ask('when should I pack my luggage', '2027-05-25')!.replyEn, /flight home/);
});

test('"আজ কোথায় থাকব?" uses the night place; কাল = tomorrow, সকাল is not', () => {
  assert.equal(ask('আজ কোথায় থাকব?', '2027-05-14')!.replyBn, 'আজ (৮ জিলহজ · তারবিয়ার দিন) রাতে থাকবেন মিনায়।');
  assert.match(ask('আজ কোথায় থাকব?', '2027-05-15')!.replyBn, /দিনে আরাফায়, রাতে থাকবেন মুজদালিফায়/);
  assert.match(ask('কাল কোথায় থাকব?', '2027-05-14')!.replyBn, /^আগামীকাল/);
  assert.match(ask('সকালে কোথায় থাকব?', '2027-05-14')!.replyBn, /^আজ/);
  assert.match(ask('where am I today', '2027-04-01')!.replyEn, /hasn't started/);
});

test('Arafah and Eid questions', () => {
  assert.match(ask('আরাফাত কবে?')!.replyBn, /শনিবার, ১৫ মে/);
  assert.match(ask('ঈদ কবে')!.replyBn, /রবিবার, ১৬ মে/);
});

test('announcement hook: bus time comes from the Moallem, never guessed', () => {
  assert.equal(ask('বাস কয়টায়?', '2027-05-13')!.topic, 'announcement');
  assert.match(ask('বাস কয়টায়?', '2027-05-13')!.replyBn, /এখনো সময় জানাননি/);
  const it = withAnnouncements(JED, [
    { date: '2027-05-13', time: '22:30', kind: 'bus', textBn: 'মিনার বাস হোটেলের সামনে', textEn: 'Mina bus at the hotel' },
    { date: '2027-05-13', time: '03:30', kind: 'wakeup', textBn: 'তাহাজ্জুদের জন্য উঠুন', textEn: 'Wake for Tahajjud' },
  ]);
  assert.match(answerTripQuestion(it, 'বাস কখন?', '2027-05-13')!.replyBn, /^২২:৩০: মিনার বাস/);
  assert.match(answerTripQuestion(it, 'ঘুম থেকে কখন উঠব?', '2027-05-13')!.replyBn, /^০৩:৩০/);
  const built = buildItinerary(JED_FIRST, { announcements: [{ date: '2027-05-13', kind: 'bus', textBn: 'বাস', textEn: 'Bus' }] });
  assert.equal(built.days.find((d) => d.date === '2027-05-13')!.announcements.length, 1);
});

test('non-trip questions return null', () => {
  for (const q of ['আজ আবহাওয়া কেমন?', 'what is the weather', 'আমি এক দিন অসুস্থ ছিলাম', '', 'তাওয়াফের দোয়া']) {
    assert.equal(ask(q), null, q);
  }
});

test('broken ticket: trip questions get a gentle re-scan reply, others still null', () => {
  const bad = buildItinerary({ inbound: flight('nope', 'DAC', 'JED'), outbound: flight('2027-05-30', 'MED', 'DAC') });
  assert.equal(answerTripQuestion(bad, 'কবে দেশে ফিরব?', '2027-04-25')!.topic, 'ticket_problem');
  assert.equal(answerTripQuestion(bad, 'what is the weather', '2027-04-25'), null);
});
