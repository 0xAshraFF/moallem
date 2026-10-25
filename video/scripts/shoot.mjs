// Screenshot app screens in a phone viewport. Usage: node shoot.mjs <outDir> <spec.json>
// spec: [{ name, hash, prefs?, watch?: true, circle?: true, wait?: ms, full?: bool, width?, height? }]
import puppeteer from 'puppeteer-core';
import { readFileSync, mkdirSync } from 'node:fs';

const [outDir, specPath] = process.argv.slice(2);
const specs = JSON.parse(readFileSync(specPath, 'utf8'));
const BASE = process.env.BASE || 'http://localhost:8787';
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true, args: ['--hide-scrollbars', '--lang=bn-BD'],
});
for (const s of specs) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', s.name, e.message));
  page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', s.name, m.text()));
  await page.setViewport({ width: s.width ?? 390, height: s.height ?? 844, deviceScaleFactor: s.dpr ?? 2, isMobile: true, hasTouch: true });
  await page.goto(BASE + '/api/health', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async (s) => {
    localStorage.clear();
    localStorage.setItem('moallem.prefs', JSON.stringify({ theme: 'light', lang: 'bn', scale: 1, day: 'arafah', onboarded: true, ...(s.prefs || {}) }));
    if (s.watch) {
      const r = await fetch('/api/watch/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: '786786', name: 'রহিম (ছেলে)' }) });
      localStorage.setItem('moallem.watch', (await r.json()).viewerToken);
    }
    if (s.circle) {
      const r = await (await fetch('/api/circles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pilgrimName: 'আব্দুল করিম' }) })).json();
      localStorage.setItem('moallem.circle', JSON.stringify({ code: r.code, token: r.pilgrimToken }));
      const auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${r.pilgrimToken}` };
      for (const name of ['রহিম (ছেলে)', 'ফাতেমা (মেয়ে)']) await fetch('/api/watch/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: r.code, name }) });
      const me = await (await fetch(`/api/circles/${r.code}/me`, { headers: auth })).json();
      await fetch(`/api/circles/${r.code}/viewers/${me.viewers[0].id}/approve`, { method: 'POST', headers: auth });
    }
    if (s.demo) localStorage.setItem('moallem.demoPlace', JSON.stringify(s.demo));
    if (s.group) { const r = await (await fetch('/api/groups/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: '313313', name: 'আব্দুল করিম' }) })).json(); localStorage.setItem('moallem.group', r.memberToken); }
    if (s.ticket) localStorage.setItem('moallem.ticket', JSON.stringify({pilgrimName:'আব্দুল করিম',pnr:'BG7K2Q',inbound:{flightNo:'BG 3011',date:'2027-04-22',time:'06:30',from:'DAC',to:'MED'},outbound:{flightNo:'BG 3022',date:'2027-05-28',time:'14:10',from:'JED',to:'DAC'}}));
    if (s.date) localStorage.setItem('moallem.demoDate', s.date);
    if (s.clock) localStorage.setItem('moallem.demoClock', s.clock);
    if (s.counter) localStorage.setItem('moallem.counter.tawaf', String(s.counter));
  }, s);
  await page.goto(BASE + '/#' + s.hash, { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  if (s.texts) { for (const tx of s.texts) { await page.evaluate((tx) => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes(tx))?.click(), tx); await new Promise((r) => setTimeout(r, 450)); } }
  if (s.click) { await page.$eval(s.click, (el) => el.click()); }
  await new Promise((r) => setTimeout(r, s.wait ?? 900));
  await page.screenshot({ path: `${outDir}/${s.name}.png`, fullPage: !!s.full });
  console.log('shot', s.name);
  await ctx.close();
}
await browser.close();
