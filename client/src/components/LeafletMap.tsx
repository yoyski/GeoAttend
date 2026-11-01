import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  /** Venue pin + radius ring. Omit to show only the user. */
  venue?: { lat: number; lng: number; radius: number } | null;
  user?: { lat: number; lng: number } | null;
  /** Colours the user's dot green (inside the radius) or red (outside). */
  inside?: boolean;
  /** Create-page mode: click the map or drag the pin to move the venue. */
  interactive?: boolean;
  onVenueChange?: (lat: number, lng: number) => void;
  onCenterUser?: () => void;
}

/* Standard OpenStreetMap tiles: no API key. Fine for development and light use.
   For production traffic, swap this URL for a provider such as MapTiler or Stadia (needs a key). */
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/* OSM has no dark style, so in dark mode the tile layer is colour-inverted. */
const DARK_TILES = '[&_.leaflet-tile-pane]:[filter:invert(1)_hue-rotate(180deg)_brightness(0.95)_contrast(0.9)]';

const readDark = () => {
  const t = document.documentElement.getAttribute('data-theme');
  return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/* SVG attributes cannot use var(--x), so read the real colour value. */
const cssVar = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

const icon = (html: string, size: number) =>
  L.divIcon({ className: '', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });

const VENUE_ICON = icon(
  '<div class="h-6 w-6 rounded-full border-[3px] border-[var(--card)] bg-[var(--sig)] shadow-md"></div>',
  24,
);
const userIcon = (inside: boolean) =>
  icon(
    `<div class="h-[18px] w-[18px] rounded-full border-[3px] border-[var(--card)] shadow-md ${
      inside ? 'bg-[var(--pine)]' : 'bg-[var(--err)]'
    }"></div>`,
    18,
  );

/** Leaflet map: venue pin, radius ring, live user dot. Fits the view once, then leaves your zoom and panning alone. */
export function LeafletMap({ venue = null, user = null, inside = true, interactive = false, onVenueChange, onCenterUser }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const venueMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const fittedRef = useRef('');
  const [isDark, setIsDark] = useState(readDark);

  // Always call the latest callback without re-running the map effects.
  const onVenueRef = useRef(onVenueChange);
  const interactiveRef = useRef(interactive);
  onVenueRef.current = onVenueChange;
  interactiveRef.current = interactive;

  // Follow the app theme.
  useEffect(() => {
    const update = () => setIsDark(readDark());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    mq.addEventListener('change', update);
    return () => {
      mo.disconnect();
      mq.removeEventListener('change', update);
    };
  }, []);

  // Create the map once.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const start = venue ?? user ?? { lat: 14.5995, lng: 120.9842 };
    const map = L.map(el, { center: [start.lat, start.lng], zoom: 17, zoomControl: false, scrollWheelZoom: false });
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (interactiveRef.current) onVenueRef.current?.(e.latlng.lat, e.latlng.lng);
    });
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    mapRef.current = map;
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      circleRef.current = null;
      venueMarkerRef.current = null;
      userMarkerRef.current = null;
      fittedRef.current = '';
    };
  }, []);

  // Venue ring + pin: update in place, never rebuild.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!venue) {
      circleRef.current?.remove();
      venueMarkerRef.current?.remove();
      circleRef.current = null;
      venueMarkerRef.current = null;
      return;
    }
    const pos = L.latLng(venue.lat, venue.lng);
    const pine = cssVar('--pine', '#0F5C4D');

    if (!circleRef.current) circleRef.current = L.circle(pos, { radius: venue.radius, interactive: false }).addTo(map);
    circleRef.current.setLatLng(pos);
    circleRef.current.setRadius(venue.radius);
    circleRef.current.setStyle({ color: pine, fillColor: pine, fillOpacity: 0.15, weight: 2, dashArray: '6 4' });

    if (!venueMarkerRef.current) {
      const m = L.marker(pos, { icon: VENUE_ICON, keyboard: false }).addTo(map);
      m.on('dragend', () => {
        const p = m.getLatLng();
        onVenueRef.current?.(p.lat, p.lng);
      });
      venueMarkerRef.current = m;
    }
    venueMarkerRef.current.setLatLng(pos);
    if (interactive) venueMarkerRef.current.dragging?.enable();
    else venueMarkerRef.current.dragging?.disable();
  }, [venue?.lat, venue?.lng, venue?.radius, interactive, isDark]);

  // User dot.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!user) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }
    const pos = L.latLng(user.lat, user.lng);
    if (!userMarkerRef.current) userMarkerRef.current = L.marker(pos, { keyboard: false, interactive: false, zIndexOffset: 500 }).addTo(map);
    userMarkerRef.current.setLatLng(pos);
    userMarkerRef.current.setIcon(userIcon(inside));
  }, [user?.lat, user?.lng, inside]);

  // Fit the view once (view maps: again only when the venue changes). Radius slider or GPS jitter never moves the camera.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const key = `${venue ? `${venue.lat},${venue.lng}` : '-'}|${user ? 'u' : '-'}`;
    if (interactive ? fittedRef.current !== '' : fittedRef.current === key) return;
    if (!venue && !user) return;
    fittedRef.current = key;

    if (venue && circleRef.current) {
      const b = circleRef.current.getBounds();
      if (user) b.extend([user.lat, user.lng]);
      map.fitBounds(b, { padding: [30, 30], maxZoom: 18 });
    } else if (user) {
      map.setView([user.lat, user.lng], 17);
    }
  }, [venue?.lat, venue?.lng, !!user, interactive]);

  const centerOnMe = () => {
    const map = mapRef.current;
    if (!map || !user) return;
    map.setView([user.lat, user.lng], Math.max(map.getZoom(), 17), { animate: true });
    onCenterUser?.();
  };

  return (
    <div className="relative isolate h-full w-full">
      <div ref={boxRef} className={`z-0 h-full w-full bg-[var(--map)] ${isDark ? DARK_TILES : ''}`} />
      {user && onCenterUser && (
        <button
          type="button"
          onClick={centerOnMe}
          className="absolute bottom-7 left-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-md border-[1.5px] border-[var(--ink)] bg-[var(--card)] shadow-md hover:bg-[var(--bg)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--sig)]"
          aria-label="Center map on my location"
          title="My location"
        >
          <i className="ti ti-current-location text-lg text-[var(--ink)]" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}