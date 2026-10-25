# CLAUDE.md — Engineering Handover & Page-by-Page Architecture Guide

## 1. Project Overview
**Moallem (মোয়াল্লেম) — Personal AI Hajj Companion** is a mobile-first, offline-resilient Progressive Web App (PWA, ready to be wrapped as an Android APK via Capacitor/TWA) built specifically for **60+ year-old Bangladeshi Hajj pilgrims** navigating Makkah, Madinah, Mina, Arafat, and Muzdalifah in bright 45°C sunlight.

### Core Design & Domain Principles
- **Elderly Bangladeshi Pilgrim First:** High-contrast "Haramain Emerald & Alabaster" palette (`#12A839` vibrant Haramain green, `#064E3B` deep emerald, `#D97706` desert gold, `#EF233C` Strava/SOS red, `#111315` high-contrast Bangla typography on `#FFFFFF` and `#F4F6F3` surfaces). Minimum touch target height is `56px`.
- **Strict Hanafi Madhab Compliance (Islamic Foundation Bangladesh):**
  - **9 Dhul Hijjah (Arafat Sunset):** Never pray Maghrib at Arafat; combine Maghrib + Isha at Muzdalifah at Isha time with 1 Adhan and 1 Iqamah.
  - **10 Dhul Hijjah Wajib Sequence (Tartib):** `1. Rami (Jamarat al-Aqabah)` → `2. Qurbani (Hadi confirmation)` → `3. Halq/Qasr (Shaving/Trimming)` → `4. Tawaf al-Ziyarah`. Attempting Halq before Rami/Qurbani triggers a high-visibility Hanafi Dam warning.
  - **11–13 Dhul Hijjah Stoning Window:** Rami before Zawal (midday ~12:15 PM) is invalid in Hanafi Fiqh.
  - **Ihram by Landing Sector:** Flights landing in **Jeddah first** require entering Ihram from Dhaka (Hazrat Shahjalal Airport / Ashkona Hajj Camp) before boarding. Flights landing in **Madinah first** wear regular stitched clothing from Dhaka and enter Ihram later at **Miqat Dhul Hulayfah (Abyar Ali)** when departing Madinah for Makkah.

---

## 2. Tech Stack & Directory Structure
- **Frontend:** React 19 + TypeScript + Tailwind CSS v4 (`@tailwindcss/vite`) + Lucide Icons
- **Backend / Dev Server:** Express 4 (`server.ts`) with Vite middleware in development (`tsx server.ts` on port `3000`) and static `dist` serving in production
- **AI / Voice:** `@google/genai` SDK on the server (`/api/moallem/chat`, `/api/moallem/parse-ticket`, `/api/tts`) with instant offline Hanafi fallback and Web Speech API (`window.speechSynthesis` / `webkitSpeechRecognition`)
- **Testing:** Node.js native test runner (`node:test` via `npx tsx --test src/utils/hajjLogic.test.ts`)

```text
/
├── CLAUDE.md                        # This handover & page-by-page architecture guide
├── claude.md                        # Lowercase alias of CLAUDE.md
├── moallem-hajj-companion.zip       # Complete packaged project archive
├── server.ts                        # Express server + Gemini AI routes + Live Tawaf telemetry API
├── index.html                       # PWA HTML entry point with Bangla fonts & manifest links
├── metadata.json                    # App metadata & capabilities
├── package.json                     # Dependencies & scripts
├── public/
│   ├── manifest.json                # Web App Manifest for Android APK / PWA installation
│   ├── sw.js                        # Offline cache-first Service Worker
│   ├── moallem-hajj-companion.zip   # Downloadable ZIP bundle served statically
│   └── assets/                      # Contextual holy-site imagery & PWA icons
└── src/
    ├── App.tsx                      # Root layout, GPS tracker hook (usePilgrimGpsTracker), tab state
    ├── index.css                    # Tailwind v4 + Hind Siliguri / Amiri / JetBrains Mono typography
    ├── data/
    │   └── hajjData.ts              # Offline Duas, 6 Hajj phases, verified BD agencies, Ziyarah spots
    ├── utils/
    │   ├── hajjLogic.ts             # Decoupled pure business logic (GPS, Tawaf, Traffic, Checklist, Fiqh)
    │   ├── hajjLogic.test.ts        # 11 unit tests covering all pure domain logic
    │   └── speech.ts                # Bangla/Arabic TTS (window.speechSynthesis + /api/tts fallback)
    └── components/
        ├── TopBarModals.tsx         # PersistentTopBar, NusukQrModal, LostHajiSosModal, OfflineIndicator
        ├── PWAInstallButton.tsx     # Android / iOS PWA installation button & modal
        ├── LocationHeroBanner.tsx   # GPS-driven hero card (Arafat, Madinah, Makkah, Mina, Jamarat)
        ├── TawafInsights.tsx        # Google Maps-style live anonymous Tawaf traffic & duration insights
        ├── HajjChecklist.tsx        # Categorized localStorage-persistent Hajj packing & readiness checklist
        ├── TawafCounter.tsx         # Strava-style Mataf GPS route map, progress ring & 50-Tawaf goal tracker
        ├── Tab1Rituals.tsx          # Page 1 & 5: "আজকের আমল" & "জিয়ারত/ব্যাগ" (Rituals, 6 Phases, Ziyarah, Luggage)
        ├── Tab2VoiceMoallem.tsx     # Page 2: "কথা বলুন" (Bangla Voice AI Moallem & Arabic Flashcards)
        ├── Tab3FlightProfile.tsx    # Page 3: "ফ্লাইট/PID" (BD 11-digit PID, PNR Sync & Ticket OCR)
        └── Tab4AgencyRating.tsx     # Page 4: "এজেন্সি যাচাই" (BD HL License Verifier & Hotel GPS Fraud Check)
```

---

## 3. Page-by-Page (Tab-by-Tab) Detailed Handover Guide

### Persistent Global Chrome (`App.tsx` + `TopHeader.tsx`)
1. **`usePilgrimGpsTracker` Hook (`src/App.tsx`):**
   - Tracks real-time browser GPS coordinates (`navigator.geolocation.watchPosition`) and persists/resolves coordinates via `resolveHolySiteFromGps(lat, lng)` into one of 5 holy zones: `'arafat'`, `'madinah'`, `'makkah'`, `'mina'`, or `'jamarat'`.
   - Also provides interactive simulation presets so developers and pilgrims can preview any holy site on demand.
2. **Top Header (`src/components/TopHeader.tsx`):**
   - **Language Toggle (`বাংলা` / `বাং + EN`):** Toggles bilingual English subtitles across all 5 pages.
   - **Nusuk QR Quick-Vault (`নুসুক QR` → `NusukQrModal.tsx`):** Opens a full-screen, maximum-brightness modal displaying the pilgrim's offline Nusuk Permit QR code, 11-digit Bangladesh PID, passport number, and Maktab ID for Saudi security checkpoints.
   - **Lost Haji SOS (`SOS সাহায্য` → `LostHajiSosModal.tsx`):** Displays exact GPS coordinates, distance/direction back to the pilgrim's Makkah hotel or Mina tent, a one-tap WhatsApp distress message generator for Family/Moallem, and a giant high-contrast **Arabic Flashcard** with audio playback for Saudi police: *"أنا حاج من بنغلاديش وقد ضللت طريقي. يرجى مساعدتي للوصول إلى مكتبي / فندقي"*.

---

### Page 1: `'Rituals'` — "আজকের করণীয়" (`src/components/Tab1Rituals.tsx`)
This is the primary daily companion screen. From top to bottom, it integrates:

1. **Dynamic GPS Location Hero Banner (`src/components/LocationHeroBanner.tsx`):**
   - Displays high-contrast contextual photography and ritual summaries that automatically switch based on the pilgrim's GPS location (`Arafat` shows Jabal al-Rahmah + Wadi Uranah boundary status; `Madinah` shows Masjid an-Nabawi Green Dome + Riyad ul-Jannah status; `Makkah` shows the Holy Kaaba; `Mina` shows Maktab 42 tents; `Jamarat` shows Jamarat Bridge).
   - Includes a top GPS Coordinate Pill and 5 one-tap location scene buttons for instant previewing.
2. **6-Phase Hajj Simulation Switcher (`HAJJ_PHASES`):**
   - Allows switching between all 6 chronological stages of Hajj:
     - **Phase 1 (`preflight`):** Dhaka Airport & Ashkona Camp PNR sync, Jeddah vs. Madinah landing sector selector with dynamic Hanafi Ihram rules, and Talbiyah audio player.
     - **Phase 2 (`umrah`):** Renders the full Strava-inspired **`TawafCounter`** component.
     - **Phase 3 (`mina8`):** 8 Dhul Hijjah Mina Tent GPS Pin Saver (`আমার মিনা তাঁবুর লোকেশন সেভ করুন`) and daily water/ORS hydration tracker for 45°C heat.
     - **Phase 4 (`arafat9`):** 9 Dhul Hijjah Arafat Wuquf mode featuring a green **Arafat Official Boundary Verified (Not in Wadi Uranah)** badge, live Maghrib golden-hour countdown, a hands-free **Lying Down Continuous Dua Player**, and the **Hanafi Sunset Guardrail Warning** against praying Maghrib in Arafat.
     - **Phase 5 (`jamarat10_13`):** 10–13 Dhul Hijjah Wajib Sequence Enforcer (`Rami → Qurbani → Halq → Tawaf Ziyarah`) + Post-Zawal Stoning Time Evaluator.
     - **Phase 6 (`ziyarah_return`):** Quick Ziyarah & Return Luggage overview.
3. **`TawafInsights` Component (`src/components/TawafInsights.tsx`):**
   - Polls `/api/tawaf/insights` to display real-time aggregated anonymous Tawaf session data from other pilgrims, similar to **Google Maps traffic density**.
   - Shows the primary decision banner (*"এখন কি তাওয়াফ করার উপযুক্ত সময়?"*), average 7-lap session duration (`~44–46 মিনিট`), 4-floor Haram traffic density bars (`Ground Mataf`, `First Floor`, `Wheelchair Lane`, `Roof Level`), a 6-slot **Google Maps "Popular Times"** hourly duration histogram (`2 AM`, `6 AM`, `9 AM`, `2 PM`, `8 PM`, `LIVE`), and one-tap anonymous session duration reporting (`/api/tawaf/report-session`).
4. **`HajjChecklist` Component (`src/components/HajjChecklist.tsx`):**
   - Categorized, `localStorage`-persistent checklist (`moallem_hajj_checklist_v1`) across 4 essential categories:
     1. `১. কাগজপত্র, ভিসা ও নুসুক কার্ড` (`documents`)
     2. `২. ইহরামের কাপড় ও পোশাক` (`ihram_clothing`)
     3. `৩. নিয়মিত ওষুধ ও প্রাথমিক চিকিৎসা` (`medication`)
     4. `৪. ছাতা, পাওয়ার ব্যাংক ও জরুরি সামগ্রী` (`electronics_essentials`)
   - Supports category filtering, critical item tracking (`আবশ্যক` badges), haptic feedback, custom item creation (`moallem_hajj_checklist_custom_v1`), mark-all/reset actions, and Bangla audio readout.
5. **`TawafCounter` Component (`src/components/TawafCounter.tsx`):**
   - Strava-inspired Tawaf & Sa'i activity tracker featuring:
     - **Top Mataf GPS Route Map:** SVG architectural map of Masjid al-Haram with the Holy Kaaba, green Hajar al-Aswad alignment line, green start marker (`🟢`), red current GPS marker (`🔴`), and red circumambulation GPS loops (`#EF233C`) that grow with each lap (`1..7`).
     - **Strava `SUMMARY` 2x2 Grid:** Oversized tabular numbers for **Distance (km)**, **Duration** (with live timer), **Avg Pace (min/km)**, and **Remaining Hajj Tawafs**.
     - **Circular SVG Progress Ring & Haptic Increment Button:** Tactile vibration (`navigator.vibrate`) on lap completion.
     - **Hajj Total Tawaf Goal Tracker:** Lets users set a total Hajj Tawaf goal (e.g., `50 Tawafs`) and tracks completed vs. remaining Tawafs (`moallem_hajj_target_tawafs`, `moallem_hajj_completed_tawafs`).
     - **Round-Specific Dua Card:** Arabic text, Bangla phonetic pronunciation, Bangla meaning, Hanafi rule, and native TTS audio playback for each of the 7 rounds.

---

### Page 2: `'Voice'` — "কথা বলুন (ভয়েস মোয়াল্লেম)" (`src/components/Tab2VoiceMoallem.tsx`)
- **Push-to-Talk Bangla Voice Assistant:** Uses `webkitSpeechRecognition` (`bn-BD`) or one-tap preset questions to send queries to `/api/moallem/chat` (`gemini-3.8-flash` with strict Hanafi system instructions and instant offline fallback).
- **Dam vs. Sadqah Reassurance Cards:** Comforts elderly pilgrims who accidentally used scented soap or broke Wudu during Tawaf with accurate Islamic Foundation Bangladesh rulings.
- **Instant Arabic Flashcards for Saudi Locals:** Generates large Arabic text + phonetic Bangla + audio playback so a Bangladeshi pilgrim who doesn't speak Arabic can show or play their phone screen to Saudi shopkeepers or Haram staff (e.g., asking where to buy bananas/laban near Gate 79 or finding the wheelchair ramp).

---

### Page 3: `'Flight'` — "ফ্লাইট/PID ও টিকিট স্ক্যানার" (`src/components/Tab3FlightPid.tsx`)
- **Bangladesh 11-Digit PID Validator:** Validates both English ASCII and Bangla numeral 11-digit Pilgrim IDs (`validateBdPid`).
- **Multimodal Ticket & Visa OCR Scanner:** Allows uploading or simulating a photo of a Biman/Saudia ticket or Hajj visa (`/api/moallem/parse-ticket` using `gemini-3.8-flash` structured JSON extraction) to auto-populate PNR, flight numbers, agency license, and Maktab ID.
- **Inbound & Outbound Flight Cards + Ashkona Camp & 5L Zamzam Quota Guide:** Displays Jeddah/Madinah terminal details and official Biman/Saudia Zamzam water rules.

---

### Page 4: `'Agencies'` — "এজেন্সি যাচাই ও হোটেল দূরত্ব অডিটর" (`src/components/Tab4AgencyGuard.tsx`)
- **Ministry of Religious Affairs BD Hajj Agency Verifier:** Searchable directory of HL-licensed Bangladeshi Hajj agencies (`HL-0124`, `HL-0289`, `HL-0412`, `HL-0891`) showing license status (`Verified Active` vs. `Watchlist Warning`), historical pilgrim rating, and verified reviews.
- **GPS Hotel Distance Fraud Detector (`calculateDistanceDiscrepancy`):** Compares the distance promised in an agency's brochure (e.g., `400m from Haram`) against actual GPS distance (e.g., `1120m`) and flags severe discrepancies (`>50%` overstatement) with estimated walking times for 60+ year-old pilgrims.

---

### Page 5: `'Ziyarah'` — "জিয়ারত অডিও ও লাগেজ ক্যালকুলেটর" (`src/components/Tab5ZiyarahLuggage.tsx`)
- **Historical Ziyarah Audio Guide:** Interactive Makkah & Madinah Ziyarah cards (Jabal al-Noor, Jabal Thawr, Jannatul Mu'alla, Rawdah ash-Sharifah, Mount Uhud, Masjid Quba) with historical significance, Sunnah etiquette warnings against Bid'ah, and Bangla TTS audio playback.
- **2×23kg Check-in & 7kg Carry-On Luggage Weight + SAR→BDT Calculator (`calculateLuggageStatus`):** Tracks items across Bag 1 (`23kg max`), Bag 2 (`23kg max`), and Hand Carry (`7kg max`), warns when a bag exceeds airline limits, tracks the dedicated 5L Zamzam quota, and converts Saudi Riyal (SAR) shopping totals into Bangladeshi Taka (BDT).

---

## 4. How to Run, Test & Build After Handover

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests (11 tests in src/utils/hajjLogic.test.ts)
npx tsx --test src/utils/hajjLogic.test.ts

# 3. Start full-stack dev server on http://localhost:3000
npm run dev

# 4. Build production bundle
npm run build
```
