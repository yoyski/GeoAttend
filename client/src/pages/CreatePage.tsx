import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionsApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { LeafletMap } from '../components/LeafletMap';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
// Kept from the custom kit
import { ErrorBox, PageHeading, toLocalInput } from '../components/modern';
import { useLocationCtx } from '../hooks/useLocation';
import { useRequireLogin } from '../hooks/useRequireLogin';
import { clearDraft, loadDraft, saveDraft } from '../lib/returnTo';
import type { Verification } from '../types';

const VERIFY: Record<Verification, { tile: string; title: string; icon: string }> = {
  location: { tile: 'Location', title: 'Location only', icon: 'ti-map-pin' },
  passcode: { tile: 'Passcode', title: 'Location + passcode', icon: 'ti-lock' },
  email: { tile: 'Emails', title: 'Location + emails', icon: 'ti-mail' },
};
const VERIFY_ORDER: Verification[] = ['location', 'passcode', 'email'];

/** Strong random passcode like XXXXX-XXXXX (no look-alike characters). */
function genPasscode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const a = new Uint32Array(10);
  crypto.getRandomValues(a);
  let o = '';
  for (let i = 0; i < 10; i++) o += chars[a[i]! % chars.length];
  return `${o.slice(0, 5)}-${o.slice(5)}`;
}
const strength = (p: string) => (p.length >= 10 ? 'Strong' : p.length >= 6 ? 'Good' : 'Too short');

const mut = { color: 'var(--mut)' } as const;
const dateCls = '[color-scheme:light_dark] min-w-0 text-[13px] min-[480px]:text-base';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_R = 1; // minimum radius
const MAX_R = 400;

export function CreatePage() {
  const { fix } = useLocationCtx();
  const nav = useNavigate();
  const { user, loading: authLoading, goToLogin } = useRequireLogin();
  // Answers typed before being sent to log in come back after login.
  const [restored, setRestored] = useState(false);

  const [f, setF] = useState(() => {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
    const end = new Date(Math.min(now.getTime() + 2 * 3600_000, endOfDay.getTime()));
    const base = {
      title: '',
      venue: '',
      dt: toLocalInput(now).slice(0, 10),
      ts: toLocalInput(now).slice(11, 16),
      te: toLocalInput(end).slice(11, 16),
      lat: 14.5995,
      lng: 120.9842,
      radius: 100,
      verification: 'location' as Verification,
      passcode: genPasscode(),
      emails: [] as string[],
      lateAfterTime: '', // HH:MM format
    };
    const draft = loadDraft<Partial<typeof base>>('create');
    return draft ? { ...base, ...draft } : base;
  });
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return; // React strict mode runs effects twice in dev
    booted.current = true;
    if (loadDraft('create')) {
      // Coming back from the sheet designer or from logging in: the typed answers are restored once.
      setRestored(true);
      clearDraft('create');
    } else {
      // A brand-new session starts with a fresh sheet design, not the one left from an abandoned attempt.
      try {
        localStorage.removeItem('geoattend:sheet:preview');
      } catch {
        /* ignore */
      }
    }
  }, []);
  const [emailDraft, setEmailDraft] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  // "Use my location": take the GPS fix if available
  const centerOnMe = () => {
    if (fix) setF((p) => ({ ...p, lat: fix.lat, lng: fix.lng }));
  };

  const addEmails = () => {
    let bad = false;
    const next = [...f.emails];
    emailDraft
      .split(/[\s,;]+/)
      .filter(Boolean)
      .forEach((raw) => {
        const m = raw.toLowerCase();
        if (!EMAIL_RE.test(m)) bad = true;
        else if (!next.includes(m)) next.push(m);
      });
    set('emails', next);
    setEmailErr(bad ? 'Check the email format' : '');
    if (!bad) setEmailDraft('');
  };

  const fail = (message: string) => setError({ message } as ApiError);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!f.title.trim() || !f.venue.trim()) return fail('Add a title and venue first.');
    const start = new Date(`${f.dt}T${f.ts}`);
    const end = new Date(`${f.dt}T${f.te}`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return fail('Pick a date, start and end time.');
    if (end <= start) return fail('The end time must be after the start time.');
    if (f.verification === 'passcode' && f.passcode.length < 6) return fail('Passcode needs at least 6 characters.');
    if (f.verification === 'email' && f.emails.length === 0) return fail('Add at least one authorized email.');

    // Publishing needs an account. Keep what was typed, send them to log in, and bring them back here.
    if (authLoading) return;
    if (!user) {
      saveDraft('create', f);
      goToLogin('/create');
      return;
    }

    setBusy(true);
    try {
      const res = await sessionsApi.create({
        title: f.title.trim(),
        description: '',
        venue: f.venue.trim(),
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        lat: f.lat,
        lng: f.lng,
        radius: f.radius,
        verification: f.verification,
        ...(f.lateAfterTime ? { lateAfterTime: new Date(`${f.dt}T${f.lateAfterTime}`).toISOString() } : {}),
        ...(f.verification === 'passcode' ? { passcode: f.passcode } : {}),
        ...(f.verification === 'email' ? { allowedEmails: f.emails } : {}),
      });
      clearDraft('create');
      // The sheet designed before publishing belongs to the new session now.
      try {
        const design = localStorage.getItem('geoattend:sheet:preview');
        if (design) {
          localStorage.setItem(`geoattend:sheet:${res.session.id}`, design);
          localStorage.removeItem('geoattend:sheet:preview');
        }
      } catch {
        /* ignore */
      }
      // After publishing, go straight to the session dashboard.
      nav(`/manage/${res.session.id}`, {
        state: {
          passcode: res.passcode,
          toast: f.verification === 'location' ? 'Published automatically' : 'Published. Share access to start.',
        },
      });
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  };

  /** Keep what was typed (the page unmounts), and hand the session details to the sheet designer. */
  const openSheetDesigner = () => {
    saveDraft('create', f);
    const a = new Date(`${f.dt}T${f.ts}`);
    const b = new Date(`${f.dt}T${f.te}`);
    const valid = !Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime());
    nav('/manage/preview/sheet', {
      state: {
        prefill: {
          title: f.title.trim(),
          venue: f.venue.trim(),
          startsAt: (valid ? a : new Date()).toISOString(),
          endsAt: (valid ? b : new Date()).toISOString(),
        },
      },
    });
  };

  return (
    <form onSubmit={submit} noValidate className="min-w-0">
      <PageHeading title="New session" sub="Location is always required" />

      {restored && user && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-[var(--tint)] px-3 py-2.5 text-[13px] font-medium text-[var(--pine)]" role="status">
          <i className="ti ti-circle-check mt-0.5" aria-hidden="true" />
          Welcome back. Your details are saved. Press Publish when you are ready.
        </p>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        {/* ---------- Details ---------- */}
        <Card className="min-w-0 lg:col-start-1 lg:row-start-1">
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>What and when.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="c-title">Title</Label>
              <Input id="c-title" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Morning assembly" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-venue">Venue</Label>
              <Input id="c-venue" value={f.venue} onChange={(e) => set('venue', e.target.value)} placeholder="e.g. Main hall" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              <div className="col-span-2 min-w-0 space-y-2 sm:col-span-1 lg:col-span-2 xl:col-span-1">
                <Label htmlFor="c-date">Date</Label>
                <Input id="c-date" type="date" className={dateCls} value={f.dt} onChange={(e) => set('dt', e.target.value)} />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="c-start">Start</Label>
                <Input id="c-start" type="time" className={dateCls} value={f.ts} onChange={(e) => set('ts', e.target.value)} />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="c-end">End</Label>
                <Input id="c-end" type="time" className={dateCls} value={f.te} onChange={(e) => set('te', e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lateTime">Mark late after (optional)</Label>
              <Input
                id="lateTime"
                type="time"
                className={dateCls}
                value={f.lateAfterTime}
                onChange={(e) => set('lateAfterTime', e.target.value)}
              />
              <p className="text-[13px]" style={mut}>
                Check-ins after this time are marked late. Leave empty to skip.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ---------- Location (sticky on wide screens) ---------- */}
        <Card className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:[@media(min-height:760px)]:sticky lg:[@media(min-height:760px)]:top-5">
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>
              Click or drag the map to place the venue pin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-[var(--line)] shadow-[var(--shadow-sm)]">
              <div className="aspect-[4/3] max-h-[min(60dvh,480px)] w-full sm:aspect-[16/10] lg:aspect-[4/3]">
                <LeafletMap
                  venue={{ lat: f.lat, lng: f.lng, radius: f.radius }}
                  user={fix}
                  inside={false}
                  onCenterUser={centerOnMe}
                  interactive={true}
                  onVenueChange={(lat, lng) => setF((p) => ({ ...p, lat, lng }))}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="min-w-0 break-words text-[12px] min-[480px]:text-[13px]" style={mut} title={`Venue: ${f.lat.toFixed(5)}, ${f.lng.toFixed(5)}${fix ? ` | GPS: ${fix.lat.toFixed(5)}, ${fix.lng.toFixed(5)}` : ' | GPS: waiting...'}`}>
                Venue: {f.lat.toFixed(5)}, {f.lng.toFixed(5)} · {f.radius} m
                {fix && (
                  <span className="mt-1 block text-[var(--ok)] sm:ml-2 sm:mt-0 sm:inline">
                    <i className="ti ti-map-pin mr-0.5 align-[-1px]" aria-hidden="true" />
                    GPS: {fix.lat.toFixed(5)}, {fix.lng.toFixed(5)}
                  </span>
                )}
              </span>
              <Button type="button" variant="outline" size="sm" onClick={centerOnMe} disabled={!fix} className="whitespace-nowrap">
                <i className="ti ti-current-location mr-1.5 text-[16px]" aria-hidden="true" />
                Use my location
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="radius">Check-in radius: {f.radius} m</Label>
              <p className="text-[13px]" style={mut}>
                Participants see the attendance card only inside the radius.
              </p>
              <input
                id="radius"
                type="range"
                min={MIN_R}
                max={MAX_R}
                value={f.radius}
                aria-label="Check-in radius in metres"
                className="w-full accent-[var(--sig)]"
                onChange={(e) => set('radius', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* ---------- Verification, sheet, publish ---------- */}
        <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-2">
          <Card>
            <CardHeader>
              <CardTitle>Verification</CardTitle>
              <CardDescription>Choose one. Location is always checked first.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Verification type">
                {VERIFY_ORDER.map((k) => {
                  const on = f.verification === k;
                  return (
                    <label key={k} title={VERIFY[k].title} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="verification"
                        value={k}
                        aria-label={VERIFY[k].title}
                        className="peer sr-only"
                        checked={on}
                        onChange={() => set('verification', k)}
                      />
                      <span
                        className="flex flex-col items-center gap-1.5 rounded-2xl border-2 px-1 py-3 text-center text-[11px] font-semibold min-[360px]:py-3.5 min-[360px]:text-xs transition-all hover:bg-[var(--tint)] peer-focus-visible:ring-4 peer-focus-visible:ring-[color-mix(in_srgb,var(--pine)_25%,transparent)]"
                        style={{
                          borderColor: on ? 'var(--pine)' : 'var(--line)',
                          backgroundColor: on ? 'var(--tint)' : 'transparent',
                          boxShadow: on ? 'var(--shadow-md)' : 'none',
                          color: 'var(--ink)',
                        }}
                      >
                        <i className={`ti ${VERIFY[k].icon} text-[24px] leading-none`} aria-hidden="true" />
                        {VERIFY[k].tile}
                      </span>
                    </label>
                  );
                })}
              </div>
              {f.verification === 'location' && (
                <div className="mt-4 rounded-xl p-3.5" style={{ background: 'var(--tint)' }}>
                  <p className="text-sm font-bold">Publishes automatically</p>
                  <p className="mt-1 text-[13px]" style={mut}>
                    No extra setup. Anyone inside the radius can check in as soon as you publish.
                  </p>
                </div>
              )}

              {f.verification === 'passcode' && (
                <div className="mt-4 rounded-xl p-3.5" style={{ background: 'var(--tint)' }}>
                  <p className="text-sm font-bold">Passcode</p>
                  <p className="mt-1 text-[13px]" style={mut}>
                    We generated a strong one. Keep it or type your own (6+ characters).
                  </p>
                  <Input
                    className="mt-2 font-mono"
                    value={f.passcode}
                    autoComplete="off"
                    aria-label="Passcode"
                    onChange={(e) => set('passcode', e.target.value)}
                  />
                  <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Badge variant={f.passcode.length < 6 ? 'destructive' : 'default'} showDot>
                      {strength(f.passcode)}
                    </Badge>
                    <Button type="button" variant="outline" size="sm" onClick={() => set('passcode', genPasscode())} className="whitespace-nowrap">
                      <i className="ti ti-refresh mr-1.5 text-[16px]" aria-hidden="true" />
                      Generate new
                    </Button>
                  </div>
                </div>
              )}

              {f.verification === 'email' && (
                <div className="mt-4 rounded-xl p-3.5" style={{ background: 'var(--tint)' }}>
                  <p className="text-sm font-bold">Who can check in</p>
                  <p className="mt-1 text-[13px]" style={mut}>
                    Add the emails that can see the attendance card. They must also be inside the radius.
                  </p>
                  <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      type="email"
                      placeholder="name@school.edu"
                      aria-label="Authorized email"
                      value={emailDraft}
                      onChange={(e) => setEmailDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addEmails();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addEmails} className="whitespace-nowrap sm:w-auto w-full">
                      Add
                    </Button>
                  </div>
                  {emailErr && (
                    <p role="alert" className="mt-2 text-[13px] font-semibold" style={{ color: 'var(--err)' }}>
                      {emailErr}
                    </p>
                  )}
                  {f.emails.length === 0 ? (
                    <p className="mt-2 text-[13px]" style={mut}>
                      No emails added yet.
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {f.emails.map((m) => (
                        <Badge key={m} variant="secondary" className="max-w-full gap-1.5 break-all">
                          {m}
                          <button
                            type="button"
                            aria-label={`Remove ${m}`}
                            className="grid place-items-center leading-none"
                            onClick={() => set('emails', f.emails.filter((x) => x !== m))}
                          >
                            <i className="ti ti-x text-[14px]" aria-hidden="true" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button type="button" variant="outline" className="w-full" onClick={openSheetDesigner}>
              <i className="ti ti-file-text mr-2 text-[18px]" aria-hidden="true" />
              Design the attendance sheet
              <span className="ml-1.5 font-normal text-[var(--mut)]">(optional)</span>
            </Button>
            <Button type="submit" size="lg" disabled={busy} className="w-full">
              {busy ? 'Publishing...' : f.verification === 'location' ? 'Publish now' : 'Publish session'}
            </Button>
            <p className="text-center text-[13px]" style={mut}>
              {!authLoading && !user
                ? 'You will be asked to log in when you publish. Your answers are kept. '
                : ''}
              You get a share link and QR code right after publishing.
            </p>
            <ErrorBox error={error} />
          </div>
        </div>
      </div>
    </form>
  );
}