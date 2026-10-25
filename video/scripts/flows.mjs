// Capture every user flow as numbered phone screenshots for the flow board.
// Usage: node flows.mjs <outDir> [flowId...]   (app must be running on :8787)
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2];
const only = process.argv.slice(3);
const BASE = 'http://localhost:8787';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TICKET = { pilgrimName: 'আব্দুল করিম', pnr: 'BG7K2Q', inbound: { flightNo: 'BG 3011', date: '2027-04-22', time: '06:30', from: 'DAC', to: 'MED' }, outbound: { flightNo: 'BG 3022', date: '2027-05-28', time: '14:10', from: 'JED', to: 'DAC' } };
const PLAZA = { lat: 21.4212, lng: 39.8283 };
const HOTEL = { lat: 21.4169, lng: 39.8236 };

/** Fresh browser profile with prefs/demo state, then open a route. */
async function open(page, o) {
  await page.goto(BASE + '/api/health');
  await page.evaluate(async (o, TICKET) => {
    localStorage.clear();
    localStorage.setItem('moallem.prefs', JSON.stringify({ theme: 'light', lang: 'bn', scale: 1, day: o.day ?? 'umrah', onboarded: true, gender: 'male', hajjType: 'tamattu', ...(o.prefs ?? {}) }));
    localStorage.setItem('moallem.demoPlace', JSON.stringify(o.at ?? { lat: 21.4212, lng: 39.8283 }));
    localStorage.setItem('moallem.demoClock', o.clock ?? '16:20');
    if (o.ticket) localStorage.setItem('moallem.ticket', JSON.stringify(TICKET));
    if (o.date) localStorage.setItem('moallem.demoDate', o.date);
    const j = (u, b, tok) => fetch(u, { method: b ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) }, body: b ? JSON.stringify(b) : undefined }).then((r) => r.json());
    if (o.group) localStorage.setItem('moallem.group', (await j('/api/groups/join', { code: '313313', name: 'আব্দুল করিম' })).memberToken);
    if (o.leader) localStorage.setItem('moallem.group', (await j('/api/groups', { leaderName: 'মাওলানা আব্দুর রহমান', agency: 'আল-মদিনা হজ কাফেলা' })).leaderToken);
    if (o.circle) {
      const c = await j('/api/circles', { pilgrimName: 'আব্বা' });
      localStorage.setItem('moallem.circle', JSON.stringify({ code: c.code, token: c.pilgrimToken }));
      if (o.circle === 'pending' || o.circle === 'both') await j('/api/watch/join', { code: c.code, name: 'ফাতেমা (মেয়ে)' });
      if (o.circle === 'both') {
        const v = await j('/api/watch/join', { code: c.code, name: 'রহিম (ছেলে)' });
        const me = await j(`/api/circles/${c.code}/me`, null, c.pilgrimToken);
        await j(`/api/circles/${c.code}/viewers/${me.viewers.find((x) => x.name.startsWith('রহিম')).id}/approve`, {}, c.pilgrimToken);
        await j(`/api/circles/${c.code}/beats`, { beats: [{ lat: 21.4212, lng: 39.8283, accuracy: 10, battery: 0.64, stage: 'umrah', ts: Date.now() - 60000 }] }, c.pilgrimToken);
        localStorage.setItem('moallem.watch', v.viewerToken);
      }
    }
    if (o.watchDemo) localStorage.setItem('moallem.watch', (await j('/api/watch/join', { code: '786786', name: 'রহিম (ছেলে)' })).viewerToken);
  }, o, TICKET);
  await page.goto(BASE + '/#' + (o.hash ?? '/'), { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  await sleep(o.wait ?? 900);
}

const clickText = (page, text) => page.evaluate((text) => {
  const el = [...document.querySelectorAll('button, a, [role=link], label')].find((b) => b.textContent?.replace(/\s+/g, ' ').includes(text));
  el?.click();
  return !!el;
}, text);
const go = (page, hash) => page.evaluate((h) => { window.location.hash = h; }, hash);
const say = async (page, text, sel = 'form input') => {
  await page.click(sel, { clickCount: 3 });
  await page.type(sel, text);
  await page.keyboard.press('Enter');
};
const scroll = (page, y) => page.evaluate((y) => window.scrollTo({ top: y }), y);
const walkTo = (page, target, ms = 9000) => page.evaluate(async (target, ms) => {
  // Arrive: glide the demo position onto the destination.
  const start = JSON.parse(localStorage.getItem('moallem.demoPlace'));
  const steps = 30;
  for (let i = 1; i <= steps; i++) {
    window.__moallem.setDemo({ lat: start.lat + (target.lat - start.lat) * (i / steps), lng: start.lng + (target.lng - start.lng) * (i / steps) });
    await new Promise((r) => setTimeout(r, ms / steps));
  }
}, target, ms);

const FLOWS = {
  tea: async (p, shot) => {
    await open(p, { at: PLAZA, group: true }); await shot('Today: Makkah, near the Haram');
    await go(p, '/ask'); await sleep(900); await shot('Tap the mic (or type)');
    await say(p, 'চা কোথায় পাবো?'); await sleep(1500); await shot('“চা কোথায় পাবো?” → nearest tea stall + Go');
    await clickText(p, 'চলুন'); await sleep(4500); await shot('Guidance starts by itself');
    await p.click('button[aria-label="ডেমো হাঁটা"]').catch(() => {}); await sleep(5000); await shot('Turn prompts, distance counting down');
    await sleep(9000); await shot('Arrived');
  },
  hotel: async (p, shot) => {
    await open(p, { at: PLAZA, hash: '/ask' }); await shot('After Isha, at the Haram');
    await say(p, 'হোটেলে ফিরব কীভাবে'); await sleep(1500); await shot('“হোটেলে ফিরব কীভাবে” → hotel distance + Go');
    await clickText(p, 'চলুন'); await sleep(4500); await shot('Route home through the streets');
    await p.click('button[aria-label="ডেমো হাঁটা"]').catch(() => {}); await sleep(6000); await shot('Walking, voice says each turn');
    await go(p, '/'); await p.evaluate((h) => window.__moallem.setDemo(h), HOTEL); await sleep(1800); await shot('Home: wallpaper switches to “আপনার হোটেল”');
  },
  water: async (p, shot) => {
    await open(p, { at: PLAZA }); await scroll(p, 900); await sleep(600); await shot('Today: nearby row (toilet, wudu, water, gate)');
    await go(p, '/map/water'); await sleep(4000); await shot('Water / Zamzam points, nearest first');
    await clickText(p, 'ওযুখানা'); await sleep(2500); await shot('Switch to wudu');
    await clickText(p, 'টয়লেট'); await sleep(2500); await shot('Switch to toilets');
    await clickText(p, 'চলুন'); await sleep(3500); await shot('Go: guided to the nearest toilet');
  },
  sos: async (p, shot) => {
    await open(p, { at: PLAZA, circle: 'both' }); await shot('SOS is on every screen');
    await clickText(p, 'SOS'); await sleep(900); await shot('One big button');
    await p.evaluate(() => document.querySelector('main section button')?.click()); await sleep(2500); await shot('Sent: family gets location (free)');
    await clickText(p, 'আরবি কার্ড'); await sleep(900); await shot('Arabic card for police: “I am lost”');
    await go(p, '/watch'); await sleep(3500); await shot('Relative\'s phone: SOS alert at the top');
  },
  tawaf: async (p, shot) => {
    await open(p, { at: { lat: 21.4224, lng: 39.8268 }, hash: '/tawaf' }); await shot('Start: “it counts itself”');
    await clickText(p, 'ডেমো'); await sleep(6000); await shot('Walking: ring fills, voice announces rounds');
    await sleep(8000); await shot('Rounds counted by compass + GPS');
    await sleep(14000); await shot('Seven complete → “এবার সাঈ”');
  },
  ticket: async (p, shot) => {
    await open(p, { hash: '/trip', date: '2027-04-25', at: { lat: 24.4669, lng: 39.6113 } }); await shot('Photo of the ticket (or type it)');
    await clickText(p, 'ডেমো টিকিট'); await sleep(1500); await shot('Whole trip planned from the ticket');
    await clickText(p, 'মদিনায় কয়দিন'); await sleep(1200); await shot('“মদিনায় কয়দিন থাকব?” → answered');
    await go(p, '/'); await sleep(1800); await shot('Today follows the trip: Madinah, day\'s tasks');
  },
  moallem: async (p, shot) => {
    await open(p, { leader: true, hash: '/group' }); await shot('Moallem: post to the whole group');
    await clickText(p, 'বাস ছাড়বে'); await p.type('input[type=time]', '0700'); await p.type('main input:not([type])', 'হোটেলের সামনে থেকে'); await sleep(400); await shot('Bus, tomorrow 7:00');
    await clickText(p, 'সবাইকে পাঠান'); await sleep(1200); await shot('Sent to every haji');
    await open(p, { group: true, at: HOTEL }); await shot('Haji: notice on Today, tap to hear');
    await go(p, '/ask'); await sleep(800); await say(p, 'বাস কখন ছাড়বে?'); await sleep(1200); await shot('“বাস কখন ছাড়বে?” → from the Moallem');
    await go(p, '/group'); await sleep(1200); await scroll(p, 900); await clickText(p, 'হ্যাঁ'); await sleep(500); await clickText(p, 'সময়মতো খবর দেন'); await sleep(500); await shot('Review: “would you recommend your Moallem?”');
  },
  family: async (p, shot) => {
    await open(p, { circle: 'pending', hash: '/family', at: PLAZA }); await sleep(1500); await shot('Pilgrim: “I\'m OK”, code, approve by name');
    await open(p, { hash: '/watch/786786' }); await shot('Relative: enter code + name');
    await open(p, { watchDemo: true, hash: '/watch' }); await sleep(3500); await shot('Live map, battery, last seen, timeline');
    await go(p, '/watch/pass'); await sleep(2500); await shot('Hajj Season Pass from ৳299');
  },
  dua: async (p, shot) => {
    await open(p, { hash: '/duas' }); await shot('Duas: “মনের কথা বলুন”');
    await say(p, 'আম্মার শরীর অসুস্থ'); await sleep(1000); await shot('“আম্মার শরীর অসুস্থ” → matching duas slide up');
  },
  onboarding: async (p, shot) => {
    await open(p, { prefs: { onboarded: false } }); await shot('Language');
    await clickText(p, 'পরের ধাপ'); await sleep(500); await shot('Brother or sister');
    await clickText(p, 'বোন'); await clickText(p, 'পরের ধাপ'); await sleep(500); await shot('Hajj type');
    await open(p, { hash: '/steps', prefs: { gender: 'female' }, day: 'umrah' }); await clickText(p, 'তাওয়াফ ৭ চক্কর'); await sleep(500); await shot('Steps adapt: sister, ফরজ/ওয়াজিব');
  },
  arafah: async (p, shot) => {
    await open(p, { ticket: true, date: '2027-05-15', at: { lat: 21.3549, lng: 39.9841 }, clock: '15:10', day: 'arafah' }); await shot('Arafah day: real sunset countdown');
    await scroll(p, 520); await sleep(500); await shot('Stepper, next prayer, heat');
    await go(p, '/arafah'); await sleep(1200); await shot('Arafah mode: duas hands-free, “no Maghrib here”');
  },
  journey: async (p, shot) => {
    await open(p, { ticket: true, date: '2027-04-22', at: { lat: 23.8466, lng: 90.403 } }); await shot('Dhaka airport');
    for (const [lat, lng, d, label] of [[24.4669, 39.6113, '2027-04-25', 'Madinah'], [21.4133, 39.8933, '2027-05-14', 'Mina']]) {
      await p.evaluate((lat, lng, d) => { window.__moallem.setDemo({ lat, lng }); localStorage.setItem('moallem.demoDate', d); window.dispatchEvent(new Event('moallem:trip')); }, lat, lng, d);
      await sleep(1800); await shot(label + ': wallpaper and plan follow the pilgrim');
    }
  },
};

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--hide-scrollbars'] });
const captions = {};
for (const [id, run] of Object.entries(FLOWS)) {
  if (only.length && !only.includes(id)) continue;
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', id, e.message));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  mkdirSync(`${OUT}/${id}`, { recursive: true });
  let n = 0;
  captions[id] = [];
  const shot = async (caption) => { n++; await page.screenshot({ path: `${OUT}/${id}/${n}.png` }); captions[id].push(caption); };
  try { await run(page, shot); } catch (e) { console.log('FAIL', id, e.message); }
  console.log('flow', id, n);
  await ctx.close();
}
await browser.close();
const { writeFileSync } = await import('node:fs');
writeFileSync(`${OUT}/captions${only.length ? '-' + only.join('-') : ''}.json`, JSON.stringify(captions, null, 1));
