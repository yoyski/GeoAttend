import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import type { Fix } from '../types';

export const PRESETS: { label: string; fix: Fix }[] = [
  { label: 'Grace Hall (seed, location only)', fix: { lat: 14.58361, lng: 120.97916, accuracy: 10 } },
  { label: 'Room 204 (seed, passcode 1234)', fix: { lat: 14.6538, lng: 121.0685, accuracy: 10 } },
  { label: 'HQ level 3 (seed, email list)', fix: { lat: 14.5547, lng: 121.0244, accuracy: 10 } },
  { label: 'Main quad (seed, link)', fix: { lat: 14.6042, lng: 120.9822, accuracy: 10 } },
  { label: 'Far away from everything', fix: { lat: 14.7, lng: 121.2, accuracy: 10 } },
];

interface LocationCtx {
  mode: 'manual' | 'gps';
  setMode: (m: 'manual' | 'gps') => void;
  manual: Fix;
  setManual: (f: Fix) => void;
  gps: Fix | null;
  gpsError: string;
  locationServicesDisabled: boolean;
  /** The position every request uses right now. null until GPS has answered. */
  fix: Fix | null;
  /** Opens device location settings */
  openLocationSettings: () => void;
}

const Ctx = createContext<LocationCtx | null>(null);

const rad = (n: number) => (n * Math.PI) / 180;
function metres(a: Fix, b: Fix) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'manual' | 'gps'>('gps');
  const [manual, setManual] = useState<Fix>(PRESETS[0]!.fix);
  const [gps, setGps] = useState<Fix | null>(null);
  const [gpsError, setGpsError] = useState('');
  const [locationServicesDisabled, setLocationServicesDisabled] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const isNative = Capacitor.isNativePlatform();

  const openLocationSettings = () => {
    if (isNative) {
      // On Android, we can open the location settings
      // This requires the App plugin from Capacitor
      import('@capacitor/app').then(({ App }) => {
        // For Android, we use an intent to open location settings
        if (Capacitor.getPlatform() === 'android') {
          // Use a custom intent to open location settings
          (window as any).cordova?.plugins?.settings?.open('location', () => {
            console.log('Opened location settings');
          }, () => {
            // Fallback: open app settings
            App.openSettings?.();
          });
          // If cordova settings plugin not available, open app settings
          setTimeout(() => {
            App.openSettings?.();
          }, 100);
        } else {
          App.openSettings?.();
        }
      }).catch(() => {
        // Fallback
        alert('Please enable location services in your device settings.');
      });
    } else {
      // On web, provide instructions
      alert('Please enable location services in your browser settings:\n\n1. Click the location icon in the address bar\n2. Select "Allow" for location access\n3. Refresh the page');
    }
  };

  useEffect(() => {
    if (mode !== 'gps') return;

    setGpsError('');
    setLocationServicesDisabled(false);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by this browser.');
      return;
    }

    const handleSuccess = (p: GeolocationPosition) => {
      const next: Fix = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
      // Ignore tiny jitter so pages do not refetch and redraw every second.
      setGps((prev) =>
        prev && metres(prev, next) < 5 && Math.abs(prev.accuracy - next.accuracy) < 10 ? prev : next,
      );
      setGpsError('');
      setLocationServicesDisabled(false);
    };

    const handleError = (e: GeolocationPositionError) => {
      let message = 'Unable to get your location.';
      let servicesDisabled = false;

      if (e.code === 1) {
        // Permission denied
        message = 'Location permission denied. Please allow location access in your settings.';
        servicesDisabled = false;
      } else if (e.code === 2) {
        // Position unavailable - usually means location services are off
        message = 'Location services are turned off. Please enable location services to check in.';
        servicesDisabled = true;
      } else if (e.code === 3) {
        // Timeout
        message = 'Location request timed out. Make sure location services are enabled and try again.';
        servicesDisabled = false;
      }

      setGpsError(message);
      setLocationServicesDisabled(servicesDisabled);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 5_000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [mode, isNative]);

  const value = useMemo<LocationCtx>(
    () => ({
      mode,
      setMode,
      manual,
      setManual,
      gps,
      gpsError,
      locationServicesDisabled,
      fix: mode === 'manual' ? manual : gps,
      openLocationSettings,
    }),
    [mode, manual, gps, gpsError, locationServicesDisabled, isNative],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocationCtx(): LocationCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLocationCtx must be used inside <LocationProvider>');
  return v;
}