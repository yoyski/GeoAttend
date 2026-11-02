import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { sessionsApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { LeafletMap } from '../components/LeafletMap';
import { SignaturePad } from '../components/SignaturePad';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
// Kept from the custom kit
import { ErrorBox, StatusChip } from '../components/modern';
import { useAsync } from '../hooks/useAsync';
import { useLocationCtx } from '../hooks/useLocation';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from '../components/ThemeToggle';


/* Where to return after logging in. Stored in localStorage so it survives the email-verification step. */
const RETURN_KEY = 'geoattend:returnTo';
const safePath = (p?: string | null) => (p && p.startsWith('/') && !p.startsWith('//') ? p : null);
const setReturnTo = (path: string) => {
  try {
    const p = safePath(path);
    if (p) localStorage.setItem(RETURN_KEY, JSON.stringify({ p, t: Date.now() }));
  } catch {
    /* storage unavailable */
  }
};

const mut = { color: 'var(--mut)' } as const;

const VERIFY_LABEL: Record<string, string> = {
  location: 'Location only',
  passcode: 'Location + passcode',
  email: 'Location + emails',
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--pine)_25%,transparent)]';

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const range = (startIso: string, endIso: string) => {
  const a = new Date(startIso);
  const b = new Date(endIso);
  const ta = timeOf(startIso);
  const tb = timeOf(endIso);
  if (a.toDateString() !== b.toDateString()) {
    const d = (x: Date) => x.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${d(a)} ${ta} to ${d(b)} ${tb}`;
  }
  const sa = ta.slice(-2).toUpperCase();
  const sb = tb.slice(-2).toUpperCase();
  const first = (sa === 'AM' || sa === 'PM') && sa === sb ? ta.slice(0, -2).trim() : ta;
  return `${first} to ${tb}`;
};

const rad = (n: number) => (n * Math.PI) / 180;
function metres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
const osm = (lat: number, lng: number) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;

function MetaLine({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-[13px]" style={mut}>
      <i className={`ti ${icon} mt-[2px] text-[16px]`} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

type Venue = { lat: number; lng: number; radius: number };
type Done = { at: string; late: boolean };

export function SessionPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { fix } = useLocationCtx();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [busy, setBusy] = useState(false);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  const session = useAsync(
    () => (fix ? sessionsApi.detail(id, fix) : Promise.resolve(null)),
    [id, fix?.lat, fix?.lng, fix?.accuracy],
  );

  const s = session.data;
  const hidden = session.error?.code === 'NOT_AVAILABLE_HERE';
  const needsAuth = session.error?.code === 'UNAUTHENTICATED';

  // Remember the venue so the "Not available here" card can still show how far away you are.
  useEffect(() => {
    if (s) setVenue({ lat: s.location.lat, lng: s.location.lng, radius: s.radius });
  }, [s?.location.lat, s?.location.lng, s?.radius]);

  const dist = venue && fix ? Math.round(metres(venue, fix)) : null;
  const outside = hidden && dist !== null && venue ? dist - venue.radius : null;

  const checkIn = async () => {
    if (!fix) return;
    // Looking is free. Checking in needs an account: log in, then come straight back here.
    if (!user) return goToAuth();
    setBusy(true);
    setError(null);
    try {
      // Separate signature from other custom fields
      const { _signature, ...otherFields } = customFields;
      const r = await sessionsApi.checkIn(id, fix, {
        passcode: passcode || undefined,
        customFields: Object.keys(otherFields).length > 0 ? otherFields : undefined,
        signature: _signature || undefined,
      });
      setDone({ at: r.at, late: !!r.late });
      session.reload();
    } catch (e) {
      // Session expired while the page was open: send them to log in, then straight back here.
      if ((e as ApiError)?.code === 'UNAUTHENTICATED') goToAuth();
      else setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  };

  // Log in or register, then come straight back to this session (also after the email-verification step).
  const goToAuth = () => {
    const back = location.pathname + location.search;
    setReturnTo(back);
    navigate('/auth', { state: { from: back } });
  };

  const verification = s?.verification ?? 'location';
  const checkedIn = !!(s?.checkedIn || done);
  const accuracy = Math.round(fix?.accuracy ?? 0);

  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* soft glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72"
        style={{ background: 'radial-gradient(60% 100% at 50% 0%, color-mix(in srgb, var(--pine) 15%, transparent), transparent)' }}
      />

      <div className="relative mx-auto max-w-[560px] px-4 pb-12 pt-5">
        {/* Brand bar (this page is public, so it has no app layout) */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[17px] font-bold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--pine)] shadow-[var(--shadow-md)]">
              <svg width="22" height="22" viewBox="0 0 56 56" aria-hidden="true">
                <circle cx="28" cy="28" r="22" fill="none" stroke="var(--onp)" strokeWidth="4" strokeDasharray="5 5" />
                <circle cx="28" cy="28" r="11" fill="none" stroke="var(--onp)" strokeWidth="4" />
                <circle cx="28" cy="28" r="4.5" fill="var(--sig)" />
              </svg>
            </span>
            GeoAttend
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <Link
                to="/attend"
                aria-label="Back to the app"
                className={`grid h-9 w-9 place-items-center rounded-full bg-[var(--card)] text-[18px] text-[var(--mut)] shadow-[var(--shadow-sm)] hover:text-[var(--ink)] ${focusRing}`}
              >
                <i className="ti ti-home" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>

        {/* Back to home: always visible */}
        <Link
          to={user ? '/attend' : '/'}
          className={`mb-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--card)] py-1.5 pl-2.5 pr-3.5 text-[13px] font-semibold text-[var(--mut)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--line)] transition hover:text-[var(--ink)] ${focusRing}`}
        >
          <i className="ti ti-arrow-left text-[15px]" aria-hidden="true" />
          Back to home
        </Link>

        {/* 1. Waiting for location */}
        {!fix && (
          <StateCard
            icon="ti-current-location"
            tone="pine"
            title="Turn on location"
            desc="GeoAttend only shows a session to people who are physically there, so it needs your location first."
          >
            <ol className="space-y-2 text-[13px]" style={mut}>
              <li className="flex gap-2.5"><b className="text-[var(--pine)]">1</b> Tap Allow when your browser asks.</li>
              <li className="flex gap-2.5"><b className="text-[var(--pine)]">2</b> Stay outdoors or near a window for a better signal.</li>
            </ol>
          </StateCard>
        )}

        {session.loading && fix && !s && !hidden && !needsAuth && (
          <Card className="mt-2">
            <CardContent className="p-6 text-center">
              <Skeleton className="mx-auto h-16 w-16 rounded-2xl" />
              <Skeleton className="mx-auto mt-3 h-7 w-48" />
              <div className="mx-auto mt-3 flex justify-center gap-2">
                <Skeleton className="h-8 w-32 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
              <div className="relative mx-auto mt-5 aspect-[16/10] w-full overflow-hidden rounded-3xl">
                <Skeleton className="h-full w-full" />
              </div>
              <Card className="mt-5">
                <CardHeader>
                  <Skeleton className="mx-auto h-6 w-32" />
                  <Skeleton className="mx-auto h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {!hidden && !needsAuth && <ErrorBox error={session.error} />}

        {/* 2. Inside the area and logged in */}
        {s && !hidden && (
          <>
            <header>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="text-[28px] font-bold leading-tight tracking-tight sm:text-[32px]">{s.title}</h1>
                <StatusChip status={s.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill icon="ti-map-pin">{s.venue}</Pill>
                <Pill icon="ti-clock">{range(s.startsAt, s.endsAt)}</Pill>
              </div>
            </header>

            <div className="relative mt-5 aspect-[16/10] w-full overflow-hidden rounded-3xl border border-[var(--line)] shadow-[var(--shadow-md)]">
              <LeafletMap
                venue={{ lat: s.location.lat, lng: s.location.lng, radius: s.radius }}
                user={fix}
                inside={s.distance <= s.radius}
              />
              <div className="pointer-events-none absolute left-3 top-3 z-[500] flex flex-wrap gap-1.5">
                <Badge variant={s.distance <= s.radius ? 'success' : 'destructive'} showDot className="shadow-[var(--shadow-sm)]">
                  {s.distance <= s.radius ? 'Inside range' : 'Outside range'}
                </Badge>
                <Badge variant="secondary" className="bg-[var(--card)] shadow-[var(--shadow-sm)]">
                  {s.distance} m away
                </Badge>
              </div>
            </div>

            {checkedIn ? (
              /* 3. Success */
              <Card className="mt-5 overflow-hidden">
                <div
                  className="px-6 pb-6 pt-8 text-center"
                  style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--ok) 12%, transparent), transparent)' }}
                >
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--okt)] text-[34px] text-[var(--ok)] ring-8 ring-[color-mix(in_srgb,var(--ok)_12%,transparent)]">
                    <i className="ti ti-check" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 text-xl font-bold">
                    {done?.late ? 'Checked in, a little late' : "You're checked in"}
                  </h2>
                  <p className="mt-1 text-sm" style={mut}>
                    {done ? `Recorded at ${timeOf(done.at)}` : 'You are marked present for this session.'}
                  </p>
                  {done?.late && (
                    <Badge variant="warning" className="mt-3">
                      Marked late
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 divide-x divide-[var(--line)] border-t border-[var(--line)] text-center">
                  <Fact label="Time" value={done ? timeOf(done.at) : 'Present'} />
                  <Fact label="Distance" value={`${s.distance} m`} />
                  <Fact label="GPS" value={`±${accuracy} m`} />
                </div>
                <CardFooter className="flex-col gap-2 pt-4">
                  <Button asChild className="w-full">
                    <Link to={`/s/${id}/sheet`}>
                      <i className="ti ti-file-text text-[18px]" aria-hidden="true" />
                      View attendance sheet
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full">
                    <Link to={user ? '/attend' : '/'}>Back to home</Link>
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              /* 3. Check-in form */
              <Card className="mt-5">
                <CardHeader>
                  <CardTitle>Check in</CardTitle>
                  <CardDescription>
                    {VERIFY_LABEL[verification] ?? 'Location only'} · GPS ±{accuracy} m
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  {verification === 'passcode' && (
                    <div className="space-y-2">
                      <Label htmlFor="passcode">Passcode</Label>
                      <Input
                        id="passcode"
                        type="text"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        autoComplete="off"
                        placeholder="Ask the organizer"
                        className="font-mono tracking-widest"
                      />
                    </div>
                  )}
                  {verification === 'email' && (
                    <p className="flex items-start gap-2 rounded-xl bg-[var(--tint)] px-3 py-2.5 text-[13px] text-[var(--pine)]">
                      <i className="ti ti-mail-check mt-0.5" aria-hidden="true" />
                      Your account email must be on the organizer&apos;s authorized list.
                    </p>
                  )}

                  {/* Built-in signature column - only show if enabled in sheet */}
                  {s.sheet?.cols?.find((c: { k: string; on: number }) => c.k === 'sign' && c.on === 1) && (
                    <div className="space-y-2">
                      <Label>Signature</Label>
                      <SignaturePad
                        value={customFields['_signature'] || ''}
                        onChange={(dataUrl) => setCustomFields({ ...customFields, _signature: dataUrl })}
                      />
                    </div>
                  )}

                  {/* Custom columns configured by creator */}
                  {s.sheet?.cols
                    ?.filter((c: { k: string; on: number }) => c.k === 'custom' && c.on === 1)
                    .map((c: { id: string; l: string; inputType?: string }) => (
                      <div key={c.id} className="space-y-2">
                        {c.inputType === 'signature' ? (
                          <>
                            <Label>{c.l}</Label>
                            <SignaturePad
                              value={customFields[c.id] || ''}
                              onChange={(dataUrl) => setCustomFields({ ...customFields, [c.id]: dataUrl })}
                            />
                          </>
                        ) : (
                          <>
                            <Label htmlFor={`cf-${c.id}`}>{c.l}</Label>
                            <Input
                              id={`cf-${c.id}`}
                              type={c.inputType === 'number' ? 'number' : 'text'}
                              value={customFields[c.id] || ''}
                              onChange={(e) => setCustomFields({ ...customFields, [c.id]: e.target.value })}
                              autoComplete="off"
                              placeholder={c.inputType === 'number' ? 'Enter number' : 'Enter text'}
                            />
                          </>
                        )}
                      </div>
                    ))}

                  <ErrorBox error={error} />
                </CardContent>

                <CardFooter>
                  <Button type="button" size="lg" className="w-full" onClick={checkIn} disabled={busy}>
                    <i className={`ti ${busy ? 'ti-loader-2 animate-spin' : 'ti-map-pin-check'} text-[20px]`} aria-hidden="true" />
                    {busy ? 'Checking in…' : user ? 'Check in now' : 'Log in to check in'}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </>
        )}

        {/* 2b. Inside the area but logged out */}
        {needsAuth && !user && fix && (
          <StateCard
            icon="ti-lock"
            tone="pine"
            badge={
              <Badge variant="success" showDot>
                You are at the venue
              </Badge>
            }
            title="Log in to check in"
            desc="Your location is verified. Log in or create a free account and we will bring you straight back here."
            footer={
              <Button onClick={goToAuth} size="lg" className="w-full">
                <i className="ti ti-login text-[18px]" aria-hidden="true" />
                Log in or register
              </Button>
            }
          />
        )}

        {/* 2c. Outside the area */}
        {hidden && (
          <StateCard
            icon="ti-map-pin-off"
            tone="err"
            badge={
              <Badge variant="destructive" showDot>
                Not available here
              </Badge>
            }
            title="You are not at this location"
            desc="This session only appears inside its check-in area. No other details are shown, for privacy."
          >
            {dist !== null && (
              <div>
                <div className="flex items-baseline justify-between text-sm">
                  <span style={mut}>{outside !== null && outside <= 30 ? 'Almost there' : 'Distance to venue'}</span>
                  <b className="tabular-nums">{dist} m</b>
                </div>
                {outside !== null && (
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--line)]">
                    <div
                      className="h-full rounded-full bg-[var(--sig)] transition-[width] duration-300"
                      style={{ width: `${Math.max(4, Math.round(100 - Math.min(100, outside / 3)))}%` }}
                    />
                  </div>
                )}
                {outside !== null && (
                  <p className="mt-2 text-[13px]" style={mut}>
                    You are {outside} m outside the check-in area.
                  </p>
                )}
              </div>
            )}
          </StateCard>
        )}
      </div>
    </div>
  );
}

/* ---------------- small building blocks ---------------- */

function Pill({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[var(--card)] px-3 py-1.5 text-[13px] font-medium shadow-[var(--shadow-sm)] ring-1 ring-[var(--line)]">
      <i className={`ti ${icon} text-[15px] text-[var(--pine)]`} aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-3.5">
      <p className="text-xs" style={mut}>
        {label}
      </p>
      <p className="mt-0.5 text-[15px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function StateCard({
  icon,
  tone,
  badge,
  title,
  desc,
  children,
  footer,
}: {
  icon: string;
  tone: 'pine' | 'err';
  badge?: React.ReactNode;
  title: string;
  desc: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const c = tone === 'err' ? 'var(--err)' : 'var(--pine)';
  return (
    <Card className="mt-2 overflow-hidden">
      <CardContent className="p-6 text-center">
        <span
          className="mx-auto grid h-16 w-16 place-items-center rounded-2xl text-[30px]"
          style={{ color: c, background: `color-mix(in srgb, ${c} 12%, transparent)` }}
        >
          <i className={`ti ${icon}`} aria-hidden="true" />
        </span>
        {badge && <div className="mt-4 flex justify-center">{badge}</div>}
        <h2 className="mt-3 text-xl font-bold tracking-tight">{title}</h2>
        <p className="mx-auto mt-1.5 max-w-[360px] text-sm" style={mut}>
          {desc}
        </p>
        {children && <div className="mx-auto mt-5 max-w-[360px] text-left">{children}</div>}
      </CardContent>
      {footer && <CardFooter className="pt-0">{footer}</CardFooter>}
    </Card>
  );
}