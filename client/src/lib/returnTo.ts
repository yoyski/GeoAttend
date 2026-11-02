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

/* ---------- Drafts: a form filled in before being sent to log in (used by the Create page), kept for a day ---------- */
const DRAFT_PREFIX = 'geoattend:draft:';

export function saveDraft(name: string, value: unknown) {
  try {
    localStorage.setItem(DRAFT_PREFIX + name, JSON.stringify({ v: value, t: Date.now() }));
  } catch {
    /* storage unavailable */
  }
}

export function loadDraft<T>(name: string): T | null {
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + name);
    if (!raw) return null;
    const { v, t } = JSON.parse(raw) as { v?: T; t?: number };
    return t && Date.now() - t < 24 * 3600e3 && v ? v : null;
  } catch {
    return null;
  }
}

export function clearDraft(name: string) {
  try {
    localStorage.removeItem(DRAFT_PREFIX + name);
  } catch {
    /* ignore */
  }
}