# Moallem (মোয়াল্লেম)

Bangla, voice-first Hajj companion for Bangladeshi pilgrims (mostly 50+). Sadaqah project:
the pilgrim app is free forever with no ads; revenue comes only from relatives buying a
**Hajj Season Pass** for the Family Circle live view.

Read `docs/PLAN.md` first. Section 9 records the team-review decisions; don't re-litigate them silently.

## Layout

```
app/            Vite + React 19 + Tailwind v4 PWA, plus a small Express API (one process)
  src/domain/   pure logic + data, all tested:
                itinerary.ts   ticket -> every day of the trip (Hajj 1448 Umm al-Qura dates), trip Q&A
                geo.ts         place geofences (Haram, Mina, Arafah, Madinah, Quba, Uhud, Jeddah, Dhaka)
                pois.json/.ts  770 OSM points: gates, toilets, wudu, water, clinics, stations (scripts/fetch-pois.mjs)
                haramGeo.ts    Kaaba centre, Black Stone bearing, Safa/Marwah, Haram outline
                tawafTracker.ts / saiTracker.ts / sensorSim.ts   automatic round counting + simulator
                days.ts (ritual steps), rulings.ts, intents.ts (offline answers), hajjData.ts (duas)
  src/lib/      location.tsx (GPS, compass, hotel, demo teleport), trip.ts, group.ts, autoCount.ts,
                earbuds.ts (headset button via Media Session), route.ts (OSRM foot routing), circle.ts
  src/map/      MapScreen.tsx (nearest X + WhatsApp-style guidance), GuideMap.tsx (Leaflet, lazy)
  src/screens/  Today, Steps, Counter (Tawaf/Sa'i), Arafah, Duas, Ask, SOS, Permit, Trip, Group, Family, Settings
  src/family/   relative's view: Watch.tsx (join, wait, live, Season Pass) + LiveMap.tsx
  server/       app.ts (routes), store.ts (Family Circle), groups.ts (Moallem notices + recommend),
                ticket.ts (Gemini vision; needs GEMINI_API_KEY), answers.ts (shared answer cache), demo.ts
video/          Remotion films. v2 (src/v2) is built from real app recordings in public/rec;
                scripts/record.mjs re-records them (needs the app running on :8787)
shared/images/  original Wikimedia Commons photos + CREDITS.json (shown in-app under Settings)
_gemini_draft/  the AI Studio draft, kept only as reference. Do not build from it.
```

Demo codes: family `786786`, Moallem group `313313`. Settings → Demo moves the pilgrim and picks a trip date.

## Run

```bash
cd app && npm install && npm run dev      # http://localhost:8787, demo family code 786786
npm test                                   # node:test, domain + server
npm run typecheck && npm run build
cd video && npm install && npx remotion studio
```

## Rules that matter

- **Design**: icon first, 1-2 word labels, 18px base type, 56px+ targets. Tokens live in `app/src/index.css`:
  warm parchment canvas, deep pine for action, bronze accents, icons in gold medallions (`bg-medal text-brass`),
  ফরজ/ওয়াজিব/সুন্নত pills (rose/amber/mint), red only for SOS. Sheets slide up (`sheet-in`), rows snap (`snap-row`). No emoji, no pattern backgrounds, no fake "live" data.
  Theme `auto` follows Makkah sunrise/sunset. Use `impeccable` (in `.claude/skills`) for UI work.
- **Safety is never paywalled**: SOS (with location) and "I'm OK" reach family even without a pass or while paused.
- **Consent**: a relative sees nothing until the pilgrim approves them by name. Invite codes expire in 15 min.
- **Profile**: Hajj type (Tamattu/Qiran/Ifrad) + brother/sister set at onboarding; `stepsFor(day, profile)` in days.ts
  adapts steps. Prayer times: `domain/prayerTimes.ts` (Umm al-Qura + Hanafi Asr, tested against AlAdhan).
  Dua matcher: `domain/duaMatch.ts`, Qur'anic duas only, each with its verse.
- **Religious content**: Hanafi (Islamic Foundation Bangladesh). Every ruling/dua needs Mufti sign-off before launch.
  The Ask screen uses offline answers only; keep live AI out of fiqh until that sign-off exists.
- **Location**: GPS geofences in `domain/geo.ts` are circles for now; use official polygons before claiming boundaries.
- Base CSS must stay inside `@layer base` (unlayered rules override Tailwind utilities).
- Full-screen overlays must portal to `document.body` (screen entrance animation creates a stacking context).

## Not built yet

Supabase backend + phone OTP, real bKash/Nagad/SSLCommerz, Capacitor APK with a foreground location service
(needed for background GPS and auto-Tawaf with the screen off), pre-recorded Bangla audio for cached answers,
offline service worker + map tile cache, field test of auto-Tawaf in the Mataf, hand-mapped Zamzam/water and
Madinah/Mashair wudu points (missing from OSM), agency directory (web, pre-departure).
