/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  Mic,
  Plane,
  ShieldCheck,
  Luggage,
} from 'lucide-react';
import {
  HajjPhaseId,
  PilgrimProfile,
  SEEDED_PILGRIM_PROFILES,
} from './data/hajjData';
import {
  HolySiteLocationId,
  HOLY_SITE_COORDINATES,
  GpsLocationResolution,
  resolveHolySiteFromGps,
} from './utils/hajjLogic';
import {
  PersistentTopBar,
  NusukQrModal,
  LostHajiSosModal,
} from './components/TopBarModals';
import { Tab1Rituals } from './components/Tab1Rituals';
import { Tab2VoiceMoallem } from './components/Tab2VoiceMoallem';
import { Tab3FlightProfile } from './components/Tab3FlightProfile';
import { Tab4AgencyRating } from './components/Tab4AgencyRating';
import { OfflineIndicator } from './components/PWAInstallButton';

export type MainTabId = 'rituals' | 'voice' | 'profile' | 'agencies' | 'concierge';

export interface PilgrimGpsTrackerState {
  lat: number;
  lng: number;
  accuracyMeters: number;
  currentLocation: HolySiteLocationId;
  resolution: GpsLocationResolution;
  source: 'live-gps' | 'simulated-gps';
  lastUpdatedBn: string;
  setGpsBySite: (siteId: HolySiteLocationId) => void;
  setCustomGpsCoords: (lat: number, lng: number, source?: 'live-gps' | 'simulated-gps') => void;
  requestLiveGps: () => void;
}

/**
 * Custom hook that tracks user GPS coordinates via navigator.geolocation.watchPosition
 * and updates state to display relevant, high-contrast holy site imagery (Arafat, Madinah,
 * Mina, Jamarat, or Makkah) at the top of the 'Rituals' tab.
 */
export function usePilgrimGpsLocation(initialPhase: HajjPhaseId): PilgrimGpsTrackerState {
  const getInitialSiteFromPhase = (phase: HajjPhaseId): HolySiteLocationId => {
    switch (phase) {
      case 'arafat9':
        return 'arafat';
      case 'posthajj':
        return 'madinah';
      case 'mina8':
        return 'mina';
      case 'jamarat10_13':
        return 'jamarat';
      case 'umrah':
      case 'preflight':
      default:
        return 'makkah';
    }
  };

  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
    accuracyMeters: number;
    source: 'live-gps' | 'simulated-gps';
    lastUpdatedBn: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('moallem_gps_coords');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    const defaultSite = HOLY_SITE_COORDINATES[getInitialSiteFromPhase(initialPhase)];
    return {
      lat: defaultSite.lat,
      lng: defaultSite.lng,
      accuracyMeters: 4,
      source: 'simulated-gps',
      lastUpdatedBn: 'এইমাত্র · জিপিএস সচল',
    };
  });

  const resolution = resolveHolySiteFromGps(coords.lat, coords.lng);
  const currentLocation = resolution.locationId;

  useEffect(() => {
    try {
      localStorage.setItem('moallem_gps_coords', JSON.stringify(coords));
    } catch {
      // ignore
    }
  }, [coords]);

  const setCustomGpsCoords = useCallback(
    (lat: number, lng: number, source: 'live-gps' | 'simulated-gps' = 'simulated-gps') => {
      const roundedLat = Math.round(lat * 10000) / 10000;
      const roundedLng = Math.round(lng * 10000) / 10000;
      setCoords({
        lat: roundedLat,
        lng: roundedLng,
        accuracyMeters: source === 'live-gps' ? 5 : 4,
        source,
        lastUpdatedBn:
          source === 'live-gps' ? 'লাইভ ডিভাইস জিপিএস সংযুক্ত' : 'জিপিএস স্থানাঙ্ক আপডেটেড',
      });
    },
    []
  );

  const setGpsBySite = useCallback(
    (siteId: HolySiteLocationId) => {
      const preset = HOLY_SITE_COORDINATES[siteId];
      setCustomGpsCoords(preset.lat, preset.lng, 'simulated-gps');
    },
    [setCustomGpsCoords]
  );

  const requestLiveGps = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        // If user/browser is in or simulating the Hejaz/Saudi region, use exact live coords;
        // otherwise still update if explicitly requested or map to nearest site
        const isInHejazRegion =
          latitude >= 18 && latitude <= 28 && longitude >= 36 && longitude <= 46;
        if (isInHejazRegion) {
          setCoords({
            lat: Math.round(latitude * 10000) / 10000,
            lng: Math.round(longitude * 10000) / 10000,
            accuracyMeters: Math.max(3, Math.round(accuracy || 5)),
            source: 'live-gps',
            lastUpdatedBn: 'লাইভ জিপিএস সচল',
          });
        } else {
          // Keep current holy site coordinates but mark live GPS check completed
          setCoords((prev) => ({
            ...prev,
            source: 'live-gps',
            lastUpdatedBn: 'জিপিএস যাচাইকৃত (সৌদি জোন প্রিভিউ)',
          }));
        }
      },
      () => {
        // On permission denied or timeout in iframe, preserve current coordinates gracefully
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 5000 }
    );
  }, []);

  // Subscribe to real-time GPS coordinate updates via watchPosition
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const isInHejazRegion =
          latitude >= 18 && latitude <= 28 && longitude >= 36 && longitude <= 46;
        if (isInHejazRegion) {
          setCoords({
            lat: Math.round(latitude * 10000) / 10000,
            lng: Math.round(longitude * 10000) / 10000,
            accuracyMeters: Math.max(3, Math.round(accuracy || 5)),
            source: 'live-gps',
            lastUpdatedBn: 'লাইভ জিপিএস ট্র্যাকিং সচল',
          });
        }
      },
      () => {
        // Ignore watch errors in restricted preview frames
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 8000 }
    );

    return () => {
      try {
        navigator.geolocation.clearWatch(watchId);
      } catch {
        // ignore
      }
    };
  }, []);

  return {
    lat: coords.lat,
    lng: coords.lng,
    accuracyMeters: coords.accuracyMeters,
    currentLocation,
    resolution,
    source: coords.source,
    lastUpdatedBn: coords.lastUpdatedBn,
    setGpsBySite,
    setCustomGpsCoords,
    requestLiveGps,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTabId>(() => {
    const saved = localStorage.getItem('moallem_active_tab') as MainTabId | null;
    return saved || 'rituals';
  });

  const [activePhase, setActivePhase] = useState<HajjPhaseId>(() => {
    const saved = localStorage.getItem('moallem_active_phase') as HajjPhaseId | null;
    return saved || 'umrah';
  });

  const [showEnglish, setShowEnglish] = useState<boolean>(() => {
    return localStorage.getItem('moallem_show_english') === 'true';
  });

  const [profile, setProfile] = useState<PilgrimProfile>(() => {
    try {
      const saved = localStorage.getItem('moallem_pilgrim_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return SEEDED_PILGRIM_PROFILES['20270849210'];
  });

  const [isNusukOpen, setIsNusukOpen] = useState<boolean>(false);
  const [isSosOpen, setIsSosOpen] = useState<boolean>(false);

  // Track user GPS coordinates and resolve high-contrast location imagery for the Rituals tab
  const gpsTracker = usePilgrimGpsLocation(activePhase);

  useEffect(() => {
    try {
      localStorage.setItem('moallem_active_tab', activeTab);
      localStorage.setItem('moallem_active_phase', activePhase);
      localStorage.setItem('moallem_show_english', String(showEnglish));
      localStorage.setItem('moallem_pilgrim_profile', JSON.stringify(profile));
    } catch {
      // ignore storage quota errors
    }
  }, [activeTab, activePhase, showEnglish, profile]);

  const handleSelectPhaseAndSyncGps = (phase: HajjPhaseId) => {
    setActivePhase(phase);
    // Sync GPS coordinates when switching simulation phases so the location hero imagery updates
    if (phase === 'arafat9') gpsTracker.setGpsBySite('arafat');
    else if (phase === 'posthajj') gpsTracker.setGpsBySite('madinah');
    else if (phase === 'mina8') gpsTracker.setGpsBySite('mina');
    else if (phase === 'jamarat10_13') gpsTracker.setGpsBySite('jamarat');
    else if (phase === 'umrah') gpsTracker.setGpsBySite('makkah');
    else if (phase === 'preflight') {
      gpsTracker.setGpsBySite(
        profile.inboundFlight.sector === 'madinah' ? 'madinah' : 'makkah'
      );
    }
  };

  const handleSelectNavTab = (tab: MainTabId) => {
    if (tab === 'concierge') {
      handleSelectPhaseAndSyncGps('posthajj');
      setActiveTab('concierge');
    } else {
      setActiveTab(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#EEF0ED] text-[#111315] pb-24">
      <OfflineIndicator />

      {/* Persistent High-Contrast Top Bar */}
      <PersistentTopBar
        profile={profile}
        showEnglish={showEnglish}
        onToggleLanguage={() => setShowEnglish((prev) => !prev)}
        onOpenNusukModal={() => setIsNusukOpen(true)}
        onOpenSosModal={() => setIsSosOpen(true)}
      />

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-8">
        {(activeTab === 'rituals' || activeTab === 'concierge') && (
          <Tab1Rituals
            activePhase={activeTab === 'concierge' ? 'posthajj' : activePhase}
            onSelectPhase={(phase) => {
              handleSelectPhaseAndSyncGps(phase);
              if (activeTab === 'concierge' && phase !== 'posthajj') {
                setActiveTab('rituals');
              }
            }}
            profile={profile}
            onUpdateProfile={setProfile}
            showEnglish={showEnglish}
            gpsTracker={gpsTracker}
          />
        )}

        {activeTab === 'voice' && (
          <Tab2VoiceMoallem profile={profile} showEnglish={showEnglish} />
        )}

        {activeTab === 'profile' && (
          <Tab3FlightProfile
            profile={profile}
            onUpdateProfile={setProfile}
            activePhase={activePhase}
            showEnglish={showEnglish}
          />
        )}

        {activeTab === 'agencies' && (
          <Tab4AgencyRating defaultPid={profile.pid} showEnglish={showEnglish} />
        )}
      </main>

      {/* Fixed Bottom Navigation (Rounded Floating White Dock matching Reference UI) */}
      <nav
        aria-label="প্রধান নেভিগেশন বার (Bottom Navigation)"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-[28px] border-t border-[#E2E6E1] shadow-[0_-8px_30px_rgba(17,19,21,0.08)]"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-5 items-center h-16 px-1.5 sm:px-4">
          {[
            {
              id: 'rituals' as const,
              labelBn: 'আজকের আমল',
              labelEn: 'Rituals',
              Icon: Compass,
            },
            {
              id: 'voice' as const,
              labelBn: 'কথা বলুন',
              labelEn: 'Voice',
              Icon: Mic,
            },
            {
              id: 'profile' as const,
              labelBn: 'ফ্লাইট/PID',
              labelEn: 'Flight',
              Icon: Plane,
            },
            {
              id: 'agencies' as const,
              labelBn: 'এজেন্সি যাচাই',
              labelEn: 'Agencies',
              Icon: ShieldCheck,
            },
            {
              id: 'concierge' as const,
              labelBn: 'জিয়ারত/ব্যাগ',
              labelEn: 'Ziyarah',
              Icon: Luggage,
            },
          ].map(({ id, labelBn, labelEn, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelectNavTab(id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${labelBn} (${labelEn})`}
                className={`h-13 mx-0.5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#12A839] text-white font-extrabold shadow-sm'
                    : 'text-[#111315] hover:bg-[#F4F6F3] font-bold'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-[#12A839]'
                  }`}
                />
                <span className="text-[11px] sm:text-xs tracking-tight mt-0.5 whitespace-nowrap px-0.5">
                  {showEnglish ? labelEn : labelBn}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Persistent Top Bar Modals */}
      <NusukQrModal
        isOpen={isNusukOpen}
        onClose={() => setIsNusukOpen(false)}
        profile={profile}
        showEnglish={showEnglish}
      />

      <LostHajiSosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        profile={profile}
        showEnglish={showEnglish}
      />
    </div>
  );
}
