// Record real app flows as video for the product film. Usage: node record.mjs <outDir> [flowName...]
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

/** CDP screencast with real timestamps -> constant 30 fps MP4 at full device resolution. */
async function startRecording(page, file) {
  const client = await page.createCDPSession();
  const dir = file + '.frames';
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const frames = [];
  client.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const name = String(frames.length).padStart(5, '0') + '.jpg';
    writeFileSync(dir + '/' + name, Buffer.from(data, 'base64'));
    frames.push({ name, t: metadata.timestamp });
    client.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await client.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
  return {
    stop: async () => {
      const end = Date.now() / 1000;
      await client.send('Page.stopScreencast');
      let list = '';
      frames.forEach((f, i) => {
        const next = frames[i + 1]?.t ?? Math.max(f.t + 0.04, end);
        list += `file '${f.name}'\nduration ${Math.max(0.001, next - f.t).toFixed(4)}\n`;
      });
      list += `file '${frames[frames.length - 1].name}'\n`;
      writeFileSync(dir + '/list.txt', list);
      execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', dir + '/list.txt',
        '-vf', 'fps=30,scale=780:1688:force_original_aspect_ratio=decrease,pad=780:1688:(ow-iw)/2:(oh-ih)/2,format=yuv420p', '-c:v', 'libx264', '-crf', '18', file]);
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

const outDir = process.argv[2];
const only = process.argv.slice(3);
const BASE = 'http://localhost:8787';
mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TICKET = { pilgrimName: 'আব্দুল করিম', pnr: 'BG7K2Q', inbound: { flightNo: 'BG 3011', date: '2027-04-22', time: '06:30', from: 'DAC', to: 'MED' }, outbound: { flightNo: 'BG 3022', date: '2027-05-28', time: '14:10', from: 'JED', to: 'DAC' } };

async function setup(page, o) {
  await page.goto(BASE + '/api/health');
  await page.evaluate(async (o, TICKET) => {
    localStorage.clear();
    localStorage.setItem('moallem.prefs', JSON.stringify({ theme: o.theme ?? 'light', lang: o.lang ?? 'bn', scale: 1, day: o.day ?? 'arafah' }));
    if (o.demo) localStorage.setItem('moallem.demoPlace', JSON.stringify(o.demo));
    if (o.ticket) localStorage.setItem('moallem.ticket', JSON.stringify(TICKET));
    if (o.date) localStorage.setItem('moallem.demoDate', o.date);
    localStorage.setItem('moallem.demoClock', o.clock ?? '16:42');
    if (o.group) {
      const r = await (await fetch('/api/groups/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: '313313', name: 'আব্দুল করিম' }) })).json();
      localStorage.setItem('moallem.group', r.memberToken);
    }
    if (o.watch) {
      const r = await (await fetch('/api/watch/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: '786786', name: 'রহিম (ছেলে)' }) })).json();
      localStorage.setItem('moallem.watch', r.viewerToken);
    }
    for (const [k, v] of Object.entries(o.storage ?? {})) localStorage.setItem(k, v);
  }, o, TICKET);
}

const move = (page, lat, lng, date) => page.evaluate((lat, lng, date) => {
  window.__moallem?.setDemo({ lat, lng });
  if (date) { localStorage.setItem('moallem.demoDate', date); window.dispatchEvent(new Event('moallem:trip')); }
}, lat, lng, date);

const clickText = (page, text) => page.evaluate((text) => {
  const el = [...document.querySelectorAll('button, [role=link], a')].find((b) => b.textContent?.includes(text));
  el?.click();
  return !!el;
}, text);

const FLOWS = {
  // The wallpaper follows the pilgrim from Dhaka to Madinah, Makkah, Mina and Arafah.
  journey: { o: { ticket: true, date: '2027-04-22', demo: { lat: 23.8466, lng: 90.403 }, hash: '/' }, run: async (p) => {
    await sleep(1800);
    const stops = [[24.4669, 39.6113, '2027-04-25'], [21.4169, 39.8236, '2027-05-02'], [21.4219, 39.8268, '2027-05-05'], [21.4133, 39.8933, '2027-05-14'], [21.3549, 39.9841, '2027-05-15']];
    for (const [lat, lng, d] of stops) { await move(p, lat, lng, d); await sleep(1900); }
  } },
  // Hotel to Haram with live guidance.
  guide: { o: { demo: { lat: 21.4169, lng: 39.8236 }, hash: '/map/haram' }, run: async (p) => {
    await sleep(3200);
    await clickText(p, 'ডেমো হাঁটা');
    await sleep(15000);
  } },
  // Nearest toilet from the Haram plaza.
  toilet: { o: { demo: { lat: 21.4212, lng: 39.8283 }, hash: '/map/toilet' }, run: async (p) => {
    await sleep(3000);
    await clickText(p, 'ওযুখানা'); await sleep(1800);
    await clickText(p, 'পানি'); await sleep(1800);
    await clickText(p, 'টয়লেট'); await sleep(1500);
    await clickText(p, 'ডেমো হাঁটা'); await sleep(7000);
  } },
  ticket: { o: { hash: '/trip', date: '2027-04-25' }, run: async (p) => {
    await sleep(1500);
    await clickText(p, 'ডেমো টিকিট'); await sleep(2200);
    await clickText(p, 'মদিনায় কয়দিন'); await sleep(2500);
    await clickText(p, 'কবে মিনা'); await sleep(2500);
    await clickText(p, 'কবে দেশে ফিরব'); await sleep(2500);
  } },
  moallem: { o: { hash: '/group', group: true, ticket: true, date: '2027-05-13', demo: { lat: 21.4169, lng: 39.8236 } }, run: async (p) => {
    await sleep(2500);
    await p.evaluate(() => window.scrollTo({ top: 700, behavior: 'smooth' })); await sleep(1500);
    await clickText(p, 'হ্যাঁ'); await sleep(1000);
    await clickText(p, 'সময়মতো খবর দেন'); await sleep(800);
    await clickText(p, 'মিনায় পাশে ছিলেন'); await sleep(1500);
  } },
  tawaf: { o: { hash: '/tawaf', demo: { lat: 21.4224, lng: 39.8268 } }, run: async (p) => {
    await sleep(1500);
    await clickText(p, 'ডেমো');
    await sleep(24000);
  } },
  family: { o: { hash: '/watch', watch: true }, run: async (p) => { await sleep(12000); } },
  arabic: { o: { hash: '/ask' }, run: async (p) => {
    await sleep(1500);
    await p.evaluate(() => document.querySelector('.grid-cols-3 > button:nth-child(7)')?.click());
    await sleep(3500);
  } },
};

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
for (const [name, f] of Object.entries(FLOWS)) {
  if (only.length && !only.includes(name)) continue;
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', name, e.message));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await setup(page, f.o);
  await page.goto(BASE + '/#' + f.o.hash, { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  await sleep(600);
  const rec = await startRecording(page, `${outDir}/${name}.mp4`);
  await f.run(page);
  await rec.stop();
  console.log('recorded', name);
  await ctx.close();
}
await browser.close();
