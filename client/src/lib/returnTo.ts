/**
 * Where to send someone after they log in or register.
 * Kept in localStorage (not only router state) so it survives the "verify your email" step,
 * which usually happens in another tab.
 */
const KEY = 'geoattend:returnTo';

/** Only same-site paths are allowed, so a crafted link can never redirect to another website. */
const safe = (p: string | null | undefined) => (p && p.startsWith('/') && !p.startsWith('//') ? p : null);

export function setReturnTo(path: string) {
  try {
    const p = safe(path);
    if (p) localStorage.setItem(KEY, JSON.stringify({ p, t: Date.now() }));
  } catch {
    /* storage unavailable */
  }
}

export function getReturnTo(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { p, t } = JSON.parse(raw) as { p?: string; t?: number };
    // Ignore links older than a day so an old session never hijacks a later login.
    return t && Date.now() - t < 24 * 3600e3 ? safe(p) : null;
  } catch {
    return null;
  }
}

export function clearReturnTo() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
