import { useState, type FormEvent, type ReactNode } from 'react';
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
import type { Verification } from '../types';

const VERIFY: Record<Verification, { tile: string; title: string; hint: string; icon: ReactNode }> = {
  location: {
    tile: 'Location',
    title: 'Location only',
    hint: 'Card appears inside the radius',
    icon: (
      <>
        <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
  },
  passcode: {
    tile: 'Passcode',
    title: 'Location + passcode',
    hint: 'Inside the radius, then enter a passcode',
    icon: (
      <>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 018 0v3" />
      </>
    ),
  },
  email: {
    tile: 'Emails',
    title: 'Location + emails',
    hint: 'Inside the radius, with an authorized email',
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </>
    ),
  },
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
const MIN_R = 20;
const MAX_R = 400;

const osm = (lat: number, lng: number) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;

/** Segmented control built from Button variants. */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="mt-2 grid gap-2"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="radiogroup"
      aria-label={label}
    >
      {options.map((o) => (
        <Button
          key={o.value}
          type="button"
          size="sm"
          role="radio"
          aria-checked={value === o.value}
          variant={value === o.value ? 'default' : 'outline'}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}

export function CreatePage() {
  const { fix } = useLocationCtx();
  const nav = useNavigate();

  const [f, setF] = useState(() => {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
    const end = new Date(Math.min(now.getTime() + 2 * 3600_000, endOfDay.getTime()));
    return {
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
    };
  });
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
        ...(f.verification === 'passcode' ? { passcode: f.passcode } : {}),
        ...(f.verification === 'email' ? { allowedEmails: f.emails } : {}),
      });
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

  const v = VERIFY[f.verification];

  return (
    <form onSubmit={submit} noValidate>
      <PageHeading title="New session" sub="Location is always required" />

      <div className="mt-5 grid gap-5 lg:grid-cols-2 lg:items-start">
        {/* ---------- Details ---------- */}
        <Card className="lg:col-start-1 lg:row-start-1">
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

            <div className="grid grid-cols-[1.3fr_1fr_1fr] items-end gap-2 min-[480px]:gap-3">
              <div className="min-w-0 space-y-2">
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
          </CardContent>
        </Card>

        {/* ---------- Location (sticky on wide screens) ---------- */}
        <Card className="lg:sticky lg:top-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>
              Click or drag on the map to place your venue pin. Use "Use my location" to center on your GPS position.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-[var(--line)] shadow-[var(--shadow-sm)]">
              <div className="aspect-[320/240] w-full">
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

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-[12px] min-[480px]:text-[13px]" style={mut}>
                {f.lat.toFixed(5)}, {f.lng.toFixed(5)} · {f.radius} m
              </span>
              <Button type="button" variant="outline" size="sm" onClick={centerOnMe} disabled={!fix}>
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
        <div className="space-y-5 lg:col-start-1 lg:row-start-2">
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
                        className="flex flex-col items-center gap-1.5 rounded-2xl border-2 px-1 py-3.5 text-center text-xs font-semibold transition-all hover:bg-[var(--tint)] peer-focus-visible:ring-4 peer-focus-visible:ring-[color-mix(in_srgb,var(--pine)_25%,transparent)]"
                        style={{
                          borderColor: on ? 'var(--pine)' : 'var(--line)',
                          backgroundColor: on ? 'var(--tint)' : 'transparent',
                          boxShadow: on ? 'var(--shadow-md)' : 'none',
                          color: 'var(--ink)',
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="24"
                          height="24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          {VERIFY[k].icon}
                        </svg>
                        {VERIFY[k].tile}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-3 text-[13px]" style={mut}>
                <b style={{ color: 'var(--ink)' }}>{v.title}:</b> {v.hint}
              </p>

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
                  <div className="mt-2.5 flex items-center justify-between">
                    <Badge variant={f.passcode.length < 6 ? 'destructive' : 'default'} showDot>
                      {strength(f.passcode)}
                    </Badge>
                    <Button type="button" variant="outline" size="sm" onClick={() => set('passcode', genPasscode())}>
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
                  <div className="mt-2.5 flex items-center gap-2">
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
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addEmails}>
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
                        <Badge key={m} variant="secondary" className="gap-1.5">
                          {m}
                          <button
                            type="button"
                            aria-label={`Remove ${m}`}
                            className="font-bold leading-none"
                            onClick={() => set('emails', f.emails.filter((x) => x !== m))}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Share link</CardTitle>
              <CardDescription>A shareable link and QR code are generated for all sessions.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[13px]" style={mut}>
                After publishing, you can copy the link or show the QR code to help people find the session easily.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Printable sheet</CardTitle>
              <CardDescription>Preview and edit how the printed attendance sheet looks.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button type="button" variant="outline" className="w-full" onClick={() => nav(`/manage/preview/sheet`)}>
                <i className="ti ti-file-text mr-2 text-[18px]" aria-hidden="true" />
                Preview and edit sheet
              </Button>
            </CardFooter>
          </Card>

          <div>
            <Button type="submit" size="lg" disabled={busy} className="w-full">
              {busy ? 'Publishing...' : f.verification === 'location' ? 'Publish now' : 'Publish session'}
            </Button>
            <ErrorBox error={error} />
          </div>
        </div>
      </div>
    </form>
  );
}
