# Moallem (মোয়াল্লেম) — Rebuild Plan v1

_Date: 2026-10-25 · Target: Hajj 1448 AH (Arafah ≈ 15 May 2027; first BD flights ≈ April 2027)_

## 1. What we are building

A calm, voice-first Hajj companion for Bangladeshi pilgrims (mostly 50+), plus a paid
**Family Circle** so relatives at home can see where their parent is and how the Hajj is going.

| Who | Pays? | Gets |
|---|---|---|
| Pilgrim (হাজী) | **Free forever** (sadaqah) | Today's steps, duas with audio, Tawaf/Sa'i counter, Arafah mode, voice Moallem, SOS, permit QR, trip info |
| Family (relatives in BD / abroad) | **Subscription** | Live map, "last seen", battery, which ritual they're on, safe-zone alerts, SOS alerts |

Rules carried over from the Gemini RFC: no ads, no paywall on ibadah or safety, Hanafi
(Islamic Foundation Bangladesh) rulings, offline-first.

## 2. Changes I'm making vs. the Gemini draft

| # | Change | Why |
|---|---|---|
| 1 | **Add Family Circle** (pilgrim shares a 6-digit code → relative opens live map) with a paywall | It's the business model, and the draft has none of it |
| 2 | **Icon-first UI**: home is a grid of 6 large icon tiles with one-word labels; 4-icon bottom bar + center mic | Draft screens are walls of text; users are 50+ |
| 3 | **New visual system**: ivory + deep Haram green + muted brass, true dark mode (sun/moon toggle), 18px base type, 56px+ targets | Draft uses bright "Strava" greens/reds and emoji |
| 4 | **Real photos** of Kaaba, Arafah, Madinah, Mina, Muzdalifah, Jamarat, Quba from Wikimedia Commons (CC0 / CC BY-SA), credited in-app | Draft has 3 unlicensed images |
| 5 | Tawaf counter = one big ring + one big tap. **Drop** pace/km/"50 Tawaf goal" Strava framing | Ibadah, not a workout; less cognitive load |
| 6 | **Hide** crowd-traffic (Tawaf insights) until real data exists | Draft shows made-up numbers as "live" |
| 7 | **Move agency ratings** out of the on-ground app into a pre-departure web page (later phase); no real agency names until verified | Legal risk; not needed inside Mina |
| 8 | Remove the "ZIP download" button and AI-Studio-specific wiring | Dev artifact leaked into product UI |
| 9 | Clean stack (draft `npm install` fails): Vite + React 19 + TS + Tailwind v4 PWA, small Node API; Capacitor APK next | Reproducible build |
| 10 | Location sharing is **opt-in by the pilgrim**, pausable, visible ("2 people can see you") | Trust + privacy; avoids feeling like surveillance |

Kept from the draft: Hanafi guardrails (no Maghrib at Arafah, 10 Dhul Hijjah order, Rami after Zawal,
Ihram by landing sector), 6 Hajj phases, PID validation, luggage limits, Arabic "I am lost" card,
Bangla TTS, dua data in `hajjData.ts`, pure logic + tests in `hajjLogic.ts`.

## 3. Screens (MVP)

1. **Today** — full-bleed photo of where you are, date in Hijri + Bangla, one "Now" card (next action +
   countdown), 6 icon tiles: Steps · Duas · Tawaf · Family · Permit · Trip.
2. **Steps** — the day's ritual timeline, each step an icon + 3–5 words, tap → detail + audio.
3. **Tawaf / Sa'i** — giant ring, tap per round, dua for this round with play button.
4. **Arafah mode** — Maghrib countdown, hands-free dua player, "don't pray Maghrib here" guard.
5. **Ask (mic)** — hold-to-talk Bangla; icon chips: food, pharmacy, barber, wheelchair, wudu, way back;
   answer + Arabic card to show locals. Works offline for common intents; AI when online.
6. **SOS** — one huge button: share location, call Moallem/family, Arabic "I am lost" card.
7. **Family (pilgrim side)** — share code/QR, who can see me, pause sharing.
8. **Family Watch (relative side, paid)** — live map, status chips (battery, last seen, ritual), event
   timeline ("Finished Tawaf 3:12 PM"), alerts. Paywall with bKash / Nagad / card (mock in demo).

Settings live behind one gear icon: language (বাংলা / English), text size, theme, credits.

## 4. Pricing proposal (for you to decide)

- **Single** ৳299 per pilgrim per Hajj season (≈45 days), 1 viewer
- **Family** ৳699 per pilgrim per season, up to 5 viewers
- **Abroad** $9.99 per season (card)
- First 24 h free so families can see it work at the airport.

## 5. Architecture

```
app/        Vite React PWA (pilgrim + family views, one codebase, two routes)
  src/domain/   pure Hajj logic + data (ported from draft, tested)
  src/ui/       design system: tokens, Icon tiles, Ring, Sheet, PhotoHero
server/     Node (Express) API: family links, location heartbeats, SSE stream, AI chat proxy
video/      Remotion product video
shared/images/  licensed photos + CREDITS.json
```

Demo mode: the server simulates a pilgrim walking Mina → Arafah so Family Watch shows motion.
Production later: Supabase (Postgres + PostGIS + Realtime), Capacitor foreground location service,
bKash/SSLCommerz payments, Cloudflare R2 for pre-baked Bangla audio.

## 6. The team (gstack roles)

| Role | gstack skill | Job here |
|---|---|---|
| CEO / product | `/office-hours`, `/plan-ceo-review` | Scope, pricing, sadaqah guardrails |
| Eng manager | `/plan-eng-review` | Architecture, data flow, failure modes |
| Designer | `/plan-design-review`, `/design-review` + `impeccable` | 50+ readability, icon-first, premium feel |
| Reviewer | `/review` | Code review before each milestone |
| QA | `/qa` | Click through every screen in a real browser |

## 7. Milestones

1. **This session** — new app (Today, Steps, Tawaf, Arafah, Ask, SOS, Family share, Family Watch + paywall),
   demo server, photos, product video.
2. **Nov–Dec 2026** — Supabase backend, real auth (phone OTP), bKash sandbox, Capacitor APK, Mufti review of all
   Bangla ritual text.
3. **Jan–Mar 2027** — pre-baked Bangla audio, offline packs, Umrah field test (Ramadan) with 50–100 pilgrims.
4. **Apr–Jun 2027** — launch with first flights; Family Circle live.

## 8. Risks / open questions

- **Religious accuracy**: every ruling and dua must be checked by a qualified Bangladeshi Mufti before launch.
- **Background GPS on Xiaomi/Vivo/Oppo** gets killed; needs native foreground service (Capacitor) — PWA alone is not enough.
- **Network in Mina/Arafah** is congested: heartbeats must queue offline and send in bursts.
- **Payments in BD**: bKash merchant account needs a registered business.
- **Privacy**: pilgrim must consent; data deleted 30 days after return flight.

---

## 9. Team review outcomes (gstack CEO / Design / Eng, 2026-10-25)

Decisions now applied to the build:

**Product (CEO)**
- SOS alerts and a daily one-tap "আমি ভালো আছি" check-in are **free forever** for linked family. Paid = live map, ritual timeline, battery, extra viewers.
- Sell a one-time **Hajj Season Pass**, not a "subscription": ৳299 Single · ৳499 Family (5 viewers) · $9.99 abroad. 24 h free trial starts at the first location fix.
- Consent: pilgrim approves each relative **by name**; join code expires in 15 min; a permanent "N জন দেখছেন" chip; pausing never disables SOS. Wording "সাথে থাকুন", never "track".
- Honest freshness on Family Watch ("শেষ অবস্থান ৩:১২, নেটওয়ার্ক দুর্বল") so Mina outages don't cause panic.
- Ask screen ships with **offline answers + Arabic cards only**; live AI stays off for fiqh until a Mufti signs off.
- Roadmap: agency/guide group dashboard (B2B, Umrah all year).

**Design**
- Tokens: marble neutrals, one Haram green (#1E5B3F / #7CC79A dark), brass once per screen, red only for SOS.
- Type: Noto Sans Bengali 18px base, Tiro Bangla for place names, Amiri for duas; text size 100/115/130%.
- Today = photo hero + "Now" card + 4 contextual tiles; nav = আজ · ধাপ · Mic · দোয়া · পরিবার.
- Theme auto-follows Makkah sunrise/sunset; sun/moon toggle overrides.
- No emoji, no pattern backgrounds, no fake "live" data, no pulsing dots, no text walls.

**Engineering**
- Fixed draft bugs: Muzdalifah resolved as Arafah, Dhaka as Madinah, Jeddah as Makkah (`domain/geo.ts`);
  stoning valid before Fajr on the 10th and at 12:00 on the 11th (`domain/rulings.ts`); every Tawaf
  question got the wudu answer (`domain/intents.ts`). Removed invented shop names and distances.
- Dropped: agency ratings, crowd-traffic, ticket OCR, Gemini TTS endpoints.
- SSE stream to family with short-lived tickets (EventSource can't send headers), 25 s pings, poll fallback.
- Leaflet + OSM tiles for the demo; MapLibre + own tiles before production.

---

## 10. Plan v2 (founder feedback, 2026-10-26)

v1 was a good-looking checklist. The product is a **location- and ticket-driven assistant** that does a Moallem's job.

| # | Goal | How |
|---|---|---|
| 1 | Ticket in, whole trip known | Photo of ticket → flights (Gemini vision when online, manual form fallback) → `domain/itinerary.ts` builds every day from fixed Hajj 1448 dates: Madinah days, when to Makkah/Mina, return, luggage day |
| 2 | Answers the Moallem's daily questions | "মদিনায় কয়দিন?", "কবে মিনা?", "কবে ফিরব?" answered from the itinerary; bus/wake-up times come from the Moallem's group announcements |
| 3 | Location drives everything | Live GPS → place (Haram, hotel, Mina, Arafah, Madinah, Quba, Uhud, Jeddah, Dhaka camp). The app's wallpaper is that place's photo on every screen |
| 4 | Map + guidance | You, your hotel, the Haram, nearest gate / wudu / toilet / water / clinic from real OpenStreetMap data stored offline. Tap one → WhatsApp-style guidance: route, big arrow, distance, voice |
| 5 | Tawaf and Sa'i count themselves | Compass heading + GPS around the Kaaba + steps (`domain/tawafTracker.ts`, `saiTracker.ts`); tap is only a backup |
| 6 | Moallem (group leader) mode | Leader posts bus/wake-up/meeting notices once; every haji hears them. Review: "আপনার মোয়াল্লেমকে কি অন্য হাজীকে সুপারিশ করবেন?" |
| 7 | Earbuds + shared offline answers | Headset button starts listening (Media Session); answers cached on the phone and shared server-side so every haji can download them for offline |
| 8 | Video | Real screen recordings of the map, guidance and auto-Tawaf; motion, not stills |

Kept: SOS free for everyone; Family Circle with Season Pass.
