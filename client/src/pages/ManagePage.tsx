import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ApiError } from '../api/client';
import { sessionsApi } from '../api/endpoints';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
// Kept from the custom kit (GeoAttend-specific logic)
import { ErrorBox, StatusChip, toLocalInput } from '../components/modern';
import type { RecordsResponse } from '../types';
import { useAsync } from '../hooks/useAsync';
import type { CreatorSession } from '../types';

const mut = { color: 'var(--mut)' } as const;

const TYPE_LABEL: Record<string, string> = {
  location: 'Location only',
  passcode: 'Location + passcode',
  email: 'Location + emails',
};

const timeOf = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const dayOf = (d: Date) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
/** "Oct 27, 9:00 to 11:00 AM" */
const when = (startIso: string, endIso: string) => {
  const a = new Date(startIso);
  const b = new Date(endIso);
  const ta = timeOf(a);
  const tb = timeOf(b);
  if (a.toDateString() !== b.toDateString()) return `${dayOf(a)} ${ta} to ${dayOf(b)} ${tb}`;
  const sa = ta.slice(-2).toUpperCase();
  const sb = tb.slice(-2).toUpperCase();
  const first = (sa === 'AM' || sa === 'PM') && sa === sb ? ta.slice(0, -2).trim() : ta;
  return `${dayOf(a)}, ${first} to ${tb}`;
};
const slug = (t: string) => t.replace(/[^\w-]+/g, '_');

/* ---------- schedule helpers (same look as the Create page) ---------- */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PRESETS: { label: string; days: number[] }[] = [
  { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { label: 'Every day', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: 'Weekends', days: [0, 6] },
];
const sameDays = (a: number[], b: number[]) => a.length === b.length && a.every((d, i) => d === b[i]);

/** "14:30" -> "2:30 PM" */
function fmt12(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** Plain-words description of the selected days. */
function describeDays(days: number[]) {
  if (days.length === 7) return 'every day';
  if (sameDays(days, [1, 2, 3, 4, 5])) return 'every weekday';
  if (sameDays(days, [0, 6])) return 'every weekend';
  const names = days.map((d) => DAYS_LONG[d]!);
  if (names.length === 1) return `every ${names[0]}`;
  return `every ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** On/off switch. */
function Switch({
  id,
  checked,
  onChange,
  label,
}: {
  id?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--pine)_25%,transparent)]"
      style={{ background: checked ? 'var(--pine)' : 'var(--line)' }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-5 w-5 rounded-full shadow transition-transform"
        style={{
          background: checked ? 'var(--card)' : 'var(--mut)',
          transform: checked ? 'translateX(22px)' : 'translateX(2px)',
        }}
      />
    </button>
  );
}

/**
 * One file row: icon, name, meta, actions.
 * Phone: the actions drop onto their own full-width row. Tablet and up: everything sits on one line.
 */
function FileRow({
  icon,
  tint,
  name,
  meta,
  children,
}: {
  icon: string;
  tint: string;
  name: string;
  meta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 transition-shadow hover:shadow-[var(--shadow-md)]">
      <span
        aria-hidden="true"
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-[24px]"
        style={{ color: tint, background: `color-mix(in srgb, ${tint} 14%, transparent)` }}
      >
        <i className={`ti ${icon}`} />
      </span>
      <div className="min-w-0 flex-1 basis-[140px]">
        <p className="truncate text-[15px] font-semibold">{name}</p>
        <p className="mt-0.5 truncate text-[13px]" style={mut}>
          {meta}
        </p>
      </div>
      <div className="w-full sm:w-auto">{children}</div>
    </div>
  );
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--pine)_25%,transparent)]';
const backCls = `inline-flex items-center gap-1.5 py-1 text-[14px] font-semibold text-[var(--mut)] hover:text-[var(--ink)] ${focusRing}`;

/** Preview / Print / Download: icon over a short label on phones, icon beside it from 640px. */
const fileBtn = `inline-flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-[var(--line)] bg-transparent px-2 py-2.5 text-[13px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--pine)] hover:bg-[var(--tint)] disabled:cursor-wait disabled:opacity-60 sm:h-10 sm:min-h-0 sm:flex-row sm:gap-2 sm:px-4 sm:py-0 sm:text-sm ${focusRing}`;

function Toast({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div
      role="status"
      className="fixed bottom-[calc(96px+env(safe-area-inset-bottom))] left-1/2 z-50 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-full px-5 py-3 text-center text-[14px] font-semibold shadow-[var(--shadow-lg)] lg:bottom-8"
      style={{ background: 'var(--ink)', color: 'var(--bg)' }}
    >
      {msg}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[13px] font-medium" style={mut}>
        {label}
      </p>
      <p className="mt-1.5 text-[34px] font-bold leading-none tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}

function MetaLine({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <p className="flex min-w-0 items-start gap-2.5 text-[14px]">
      <i className={`ti ${icon} mt-[2px] shrink-0 text-[18px]`} style={mut} aria-hidden="true" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

export function ManagePage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const navState = (loc.state ?? null) as { passcode?: string; toast?: string } | null;

  const session = useAsync(() => sessionsApi.getMine(id), [id]);
  const [busy, setBusy] = useState<'pdf' | 'delete' | null>(null);
  const [absentList, setAbsentList] = useState<string[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [toast, setToast] = useState('');
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [newPass, setNewPass] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const say = (m: string) => {
    setToast(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(''), 2200);
  };

  useEffect(() => {
    setNewPass(null);
    setEditing(false);
    setConfirmDel(false);
    setAbsentList(null);
    if (navState?.toast) say(navState.toast);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Live attendance over Server-Sent Events
  useEffect(() => {
    const es = new EventSource(sessionsApi.liveUrl(id));
    const refresh = () => {
      session.reload();
      setAbsentList(null);
    };
    es.addEventListener('checkin', refresh);
    es.addEventListener('removed', refresh);
    es.addEventListener('status', refresh);
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setError(null);
    try {
      await fn();
      if (ok) say(ok);
      await session.reload();
      setAbsentList(null);
      return true;
    } catch (e) {
      setError(e as ApiError);
      return false;
    }
  };

  const s = session.data;
  const status = String(s?.status ?? '').toLowerCase();
  const isOpen = status === 'open';
  const pass = newPass ?? navState?.passcode ?? null;

  const copy = (text: string, msg: string) => {
    try {
      void navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
    say(msg);
  };

  /** Generate and download the attendance sheet as a PDF (same layout as Preview and Print). */
  const downloadPdf = async () => {
    if (!s || busy) return;
    setBusy('pdf');
    setError(null);
    const frame = document.createElement('iframe');
    try {
      // Loaded on demand to keep the first page load small
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ]);

      // Render the sheet page (all pages, real size) in a hidden frame
      frame.setAttribute('aria-hidden', 'true');
      frame.tabIndex = -1;
      frame.style.cssText =
        'position:fixed;left:-10000px;top:0;width:1500px;height:1000px;border:0;opacity:0;pointer-events:none';
      document.body.appendChild(frame);
      frame.src = `/manage/${id}/sheet?pdf=1`;

      // Wait until the sheet has its data (up to 30 s) instead of guessing a fixed delay
      const root = await new Promise<HTMLElement>((resolve, reject) => {
        const t0 = Date.now();
        const poll = () => {
          const el = frame.contentDocument?.getElementById('pdf-root');
          if (el && el.querySelector('.sheet')) return resolve(el);
          if (Date.now() - t0 > 30_000) return reject(new Error('The sheet took too long to load. Try Print instead.'));
          window.setTimeout(poll, 150);
        };
        poll();
      });
      await frame.contentDocument?.fonts?.ready;
      await new Promise((r) => window.setTimeout(r, 150));

      // Use the paper size chosen in the sheet design (not always A4)
      const mmW = Number(root.dataset.mmW);
      const mmH = Number(root.dataset.mmH);
      const pdf = new jsPDF({
        orientation: mmW > mmH ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [Math.min(mmW, mmH), Math.max(mmW, mmH)],
        compress: true,
      });

      const pages = Array.from(root.querySelectorAll<HTMLElement>('.sheet'));
      for (let i = 0; i < pages.length; i++) {
        const el = pages[i]!;
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: Math.max(el.offsetWidth, 1500),
        });
        const imgH = (canvas.height * mmW) / canvas.width;
        const img = canvas.toDataURL('image/jpeg', 0.92);
        // a sheet taller than the paper continues on the next PDF page, the same as on paper
        const slices = Math.max(1, Math.ceil((imgH - 0.5) / mmH));
        for (let k = 0; k < slices; k++) {
          if (i > 0 || k > 0) pdf.addPage();
          pdf.addImage(img, 'JPEG', 0, -k * mmH, mmW, imgH, undefined, 'FAST');
        }
      }

      pdf.save(`${slug(s.title)}-attendance.pdf`);
      say('PDF downloaded');
    } catch (e) {
      console.error('PDF generation failed:', e);
      setError({ message: e instanceof Error ? e.message : 'PDF generation failed.' } as ApiError);
      say('PDF failed. Try Print instead.');
    } finally {
      frame.remove();
      setBusy(null);
    }
  };

  const loadAbsent = async () => {
    try {
      const r = (await sessionsApi.records(id)) as RecordsResponse;
      setAbsentList(r.summary.absent ?? []);
    } catch (e) {
      setError(e as ApiError);
    }
  };

  const remove = async () => {
    setBusy('delete');
    setError(null);
    try {
      await sessionsApi.remove(id);
      setConfirmDel(false);
      nav('/mine');
    } catch (e) {
      setError(e as ApiError);
      setBusy(null);
    }
  };

  /* ---------------- Edit view ---------------- */
  if (s && editing) {
    return (
      <>
        <EditView
          s={s}
          onBack={() => setEditing(false)}
          onSave={async (patch) => {
            const ok = await run(async () => {
              const r = await sessionsApi.update(id, patch);
              if (r.passcode) setNewPass(r.passcode);
            }, 'Changes saved');
            if (ok) setEditing(false);
          }}
        />
        <ErrorBox error={error} />
        <Toast msg={toast} />
      </>
    );
  }

  /* ---------------- Dashboard ---------------- */
  const count = s?.checkInCount ?? 0;
  const expected = s?.verification === 'email' ? s.allowedEmails.length : null;
  const pct = expected ? Math.min(100, Math.round((100 * count) / expected)) : 0;

  return (
    <div className="min-w-0">
      {/* Top bar: Back on the left, Edit and Delete on the right */}
      <div className="flex items-center justify-between gap-3">
        <Link to="/mine" className={backCls}>
          <i className="ti ti-arrow-left text-[16px]" aria-hidden="true" />
          Back
        </Link>
        {s && (
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" className="h-10 px-3 min-[400px]:px-4" aria-label="Edit session" onClick={() => setEditing(true)}>
              <i className="ti ti-edit text-[18px] min-[400px]:mr-1.5" aria-hidden="true" />
              <span className="hidden min-[400px]:inline">Edit</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-3 !text-[var(--err)] min-[400px]:px-4"
              aria-label="Delete session"
              onClick={() => setConfirmDel(true)}
            >
              <i className="ti ti-trash text-[18px] min-[400px]:mr-1.5" aria-hidden="true" />
              <span className="hidden min-[400px]:inline">Delete</span>
            </Button>
          </div>
        )}
      </div>

      <ErrorBox error={session.error} />

      {session.loading && !s && (
        <>
          {/* Header skeleton */}
          <header className="mt-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Skeleton className="h-10 w-64 max-w-full" />
              <Skeleton className="h-7 w-16" />
            </div>
            <Skeleton className="mt-4 h-28 w-full rounded-2xl" />
          </header>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
            {/* Stats card skeleton */}
            <div className="min-w-0 space-y-6">
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-16" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 divide-x divide-[var(--line)] rounded-2xl border border-[var(--line)]">
                    <div className="space-y-2 px-5 py-4">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-9 w-12" />
                    </div>
                    <div className="space-y-2 px-5 py-4">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-9 w-12" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-12 w-full" />
                </CardFooter>
              </Card>

              {/* Files skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
                      <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-48 max-w-full" />
                        <Skeleton className="h-3 w-32 max-w-full" />
                      </div>
                      <Skeleton className="hidden h-10 w-24 sm:block" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right sidebar skeleton */}
            <div className="grid min-w-0 content-start gap-6 md:grid-cols-2 md:items-start lg:grid-cols-1">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full rounded-xl" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {s && (
        <>
          {/* ---------- Header ---------- */}
          <header className="mt-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="min-w-0 break-words text-[28px] font-semibold leading-[1.1] tracking-tight sm:text-[34px] lg:text-[40px]">
                {s.title}
              </h1>
              <StatusChip status={s.status} />
            </div>
            {/* Session details sit in one tidy panel instead of loose lines */}
            <div className="mt-4 grid gap-x-6 gap-y-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 sm:grid-cols-2 sm:p-5">
              <MetaLine icon="ti-map-pin">
                {s.venue} · {s.radius} m radius
              </MetaLine>
              <MetaLine icon="ti-clock">{when(s.startsAt, s.endsAt)}</MetaLine>
              <MetaLine icon="ti-shield-check">{TYPE_LABEL[s.verification] ?? s.verification}</MetaLine>
              <MetaLine icon="ti-current-location">
                <span className="tabular-nums">
                  {s.location.lat.toFixed(5)}, {s.location.lng.toFixed(5)}
                </span>
              </MetaLine>
            </div>
          </header>

          <ErrorBox error={error} />

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
            {/* ---------- Left / main column ---------- */}
            <div className="min-w-0 space-y-6">
              {/* Attendance overview */}
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle>Attendance</CardTitle>
                  {isOpen && (
                    <Badge variant="default" showDot>
                      Live
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className={`grid divide-x divide-[var(--line)] rounded-2xl border border-[var(--line)] ${expected ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <Stat label="Checked in" value={count} />
                    {expected ? <Stat label="Expected" value={expected} /> : null}
                  </div>

                  {expected ? (
                    <div className="mt-5">
                      <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
                        <div
                          className="h-full rounded-full transition-[width] duration-500"
                          style={{ background: 'var(--sig)', width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[13px]" style={mut}>
                        {count} of {expected} expected · {pct}%
                      </p>
                    </div>
                  ) : null}
                </CardContent>
                <CardFooter>
                  <Button
                    type="button"
                    variant={isOpen ? 'outline' : 'default'}
                    className="h-12 w-full text-[15px]"
                    onClick={() =>
                      run(
                        () => sessionsApi.setStatus(id, isOpen ? 'close' : 'open'),
                        isOpen ? 'Attendance closed' : 'Attendance opened',
                      )
                    }
                  >
                    <i className={`ti ${isOpen ? 'ti-lock' : 'ti-lock-open'} mr-2 text-[20px]`} aria-hidden="true" />
                    {isOpen ? 'Close attendance' : 'Open attendance'}
                  </Button>
                </CardFooter>
              </Card>

              {/* Attendance files: nothing is listed on the page, whatever the headcount */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance files</CardTitle>
                  <CardDescription>
                    The full list stays out of the page, so it opens instantly with any number of attendees.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <FileRow
                    icon="ti-file-type-pdf"
                    tint="#DC2626"
                    name="Attendance sheet"
                    meta={`PDF document · ${count} check-in${count === 1 ? '' : 's'}`}
                  >
                    <div className="grid grid-cols-3 gap-2 sm:flex sm:shrink-0">
                      <Link to={`/manage/${id}/sheet?view=1`} className={fileBtn}>
                        <i className="ti ti-eye text-[22px] sm:text-[18px]" aria-hidden="true" />
                        <span>Preview</span>
                      </Link>
                      <Link to={`/manage/${id}/sheet?print=1`} className={fileBtn}>
                        <i className="ti ti-printer text-[22px] sm:text-[18px]" aria-hidden="true" />
                        <span>Print</span>
                      </Link>
                      <button type="button" className={fileBtn} onClick={downloadPdf} disabled={busy === 'pdf'} aria-busy={busy === 'pdf'}>
                        <i
                          className={`ti ${busy === 'pdf' ? 'ti-loader-2 animate-spin' : 'ti-download'} text-[22px] sm:text-[18px]`}
                          aria-hidden="true"
                        />
                        <span>{busy === 'pdf' ? 'Preparing' : 'Download'}</span>
                      </button>
                    </div>
                  </FileRow>
                  {count === 0 && (
                    <p className="pt-1 text-center text-[13px]" style={mut}>
                      No check-ins yet. You can still print the sheet with blank rows to sign by hand.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Not checked in (emails only), loaded on demand */}
              {s.verification === 'email' && (
                <Card>
                  <CardHeader className="flex-col items-start gap-3 space-y-0 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
                    <div className="min-w-0">
                      <CardTitle>Not checked in{absentList ? ` (${absentList.length})` : ''}</CardTitle>
                      <CardDescription>Authorized emails that have not checked in yet.</CardDescription>
                    </div>
                    <Button type="button" variant="outline" className="h-10 shrink-0" onClick={loadAbsent}>
                      {absentList ? 'Refresh' : 'Show list'}
                    </Button>
                  </CardHeader>
                  {absentList && (
                    <CardContent>
                      {absentList.length ? (
                        <div className="flex max-h-64 flex-wrap gap-2 overflow-auto">
                          {absentList.map((m) => (
                            <Badge key={m} variant="secondary" className="max-w-full break-all">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[14px]" style={mut}>
                          Everyone on the list has checked in.
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}
            </div>

            {/* ---------- Right / side column (2 columns on tablet, 1 on desktop) ---------- */}
            <div className="grid min-w-0 content-start gap-6 md:grid-cols-2 md:items-start lg:grid-cols-1">
              {/* Verification */}
              {s.verification === 'passcode' && (
                <Card tone="tint">
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <CardTitle>Passcode</CardTitle>
                    {pass ? (
                      <Button type="button" variant="outline" className="h-10" onClick={() => copy(pass, 'Passcode copied')}>
                        <i className="ti ti-copy mr-1.5 text-[16px]" aria-hidden="true" />
                        Copy
                      </Button>
                    ) : (
                      !s.locked && (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10"
                          onClick={() =>
                            run(async () => {
                              const r = await sessionsApi.newPasscode(id);
                              setNewPass(r.passcode);
                            }, 'New passcode generated')
                          }
                        >
                          Generate new
                        </Button>
                      )
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="break-all rounded-xl bg-[var(--card)] px-4 py-4 text-center font-mono text-[24px] font-semibold leading-none tracking-[0.06em] sm:text-[28px]">
                      {pass ?? '••••••••'}
                    </p>
                    <p className="mt-3 text-[13px] leading-relaxed" style={mut}>
                      {pass
                        ? 'Share it only with people who should check in.'
                        : 'Passcodes are hashed and cannot be shown again. Generate a new one before the first check-in.'}
                    </p>
                  </CardContent>
                </Card>
              )}

              {s.verification === 'email' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Authorized emails ({s.allowedEmails.length})</CardTitle>
                    <CardDescription>Only these addresses can check in.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {s.allowedEmails.slice(0, 8).map((m) => (
                        <Badge key={m} variant="secondary" className="max-w-full break-all">
                          {m}
                        </Badge>
                      ))}
                      {s.allowedEmails.length > 8 && (
                        <Badge variant="outline">+{s.allowedEmails.length - 8} more</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Share link - shown for ALL sessions */}
              <Card>
                <CardHeader>
                  <CardTitle>Share</CardTitle>
                  <CardDescription>Help people find this session easily.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-[104px] shrink-0 rounded-xl bg-white p-2">
                      <QRCodeSVG value={s.shareLink} size={88} style={{ display: 'block', width: '100%', height: 'auto' }} />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 min-w-0 flex-1"
                      onClick={() => copy(s.shareLink, 'Copied')}
                    >
                      <i className="ti ti-copy mr-1.5 text-[18px]" aria-hidden="true" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule info (read-only, same look as the Create page) */}
              {s.schedule?.enabled && (
                <Card>
                  <CardHeader>
                    <CardTitle>Repeats weekly</CardTitle>
                    <CardDescription>This session opens automatically on these days.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-7 gap-1.5" role="list" aria-label="Active days">
                      {DAYS.map((day, idx) => {
                        const active = s.schedule!.daysOfWeek.includes(idx);
                        return (
                          <span
                            key={day}
                            role="listitem"
                            aria-label={`${DAYS_LONG[idx]}${active ? ', active' : ', off'}`}
                            className="grid h-9 min-w-0 place-items-center rounded-full border text-[11px] font-semibold"
                            style={{
                              borderColor: active ? 'var(--pine)' : 'var(--line)',
                              borderWidth: active ? 2 : 1,
                              background: active ? 'var(--tint)' : 'transparent',
                              color: active ? 'var(--ink)' : 'var(--mut)',
                              opacity: active ? 1 : 0.55,
                              fontWeight: active ? 700 : 600,
                            }}
                          >
                            {day}
                          </span>
                        );
                      })}
                    </div>
                    <p className="flex items-start gap-2 text-[13px]" style={mut}>
                      <i className="ti ti-calendar-repeat mt-0.5 shrink-0 text-[16px] text-[var(--pine)]" aria-hidden="true" />
                      <span>
                        Opens <strong className="font-semibold text-[var(--ink)]">{describeDays(s.schedule.daysOfWeek)}</strong> at{' '}
                        <strong className="font-semibold text-[var(--ink)]">{timeOf(new Date(s.startsAt))}</strong>
                        {s.schedule.autoClose ? (
                          <>
                            {' '}and closes at{' '}
                            <strong className="font-semibold text-[var(--ink)]">{timeOf(new Date(s.endsAt))}</strong>.
                          </>
                        ) : (
                          <>. You close it yourself.</>
                        )}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Delete confirmation */}
          <Dialog open={confirmDel} onOpenChange={(open) => !busy && setConfirmDel(open)}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Delete this session?</DialogTitle>
                <DialogDescription>
                  “{s.title}” and its {count} check-in{count === 1 ? '' : 's'} will be removed. This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
                  onClick={() => setConfirmDel(false)}
                  disabled={busy === 'delete'}
                >
                  Keep session
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="h-11"
                  onClick={remove}
                  disabled={busy === 'delete'}
                >
                  {busy === 'delete' ? (
                    <>
                      <i className="ti ti-loader-2 mr-2 animate-spin text-[18px]" aria-hidden="true" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      <Toast msg={toast} />
    </div>
  );
}

/* ---------------- Edit session ---------------- */
function EditView({
  s,
  onBack,
  onSave,
}: {
  s: CreatorSession;
  onBack: () => void;
  onSave: (patch: Record<string, unknown>) => void;
}) {
  const locked = s.checkInCount > 0 || s.locked;
  const [f, setF] = useState(() => ({
    title: s.title,
    venue: s.venue,
    dt: toLocalInput(s.startsAt).slice(0, 10),
    ts: toLocalInput(s.startsAt).slice(11, 16),
    te: toLocalInput(s.endsAt).slice(11, 16),
    radius: s.radius,
    scheduleEnabled: s.schedule?.enabled ?? false,
    scheduleDays: s.schedule?.daysOfWeek ?? [],
    scheduleAutoClose: s.schedule?.autoClose ?? true,
  }));
  const [err, setErr] = useState('');
  const dateCls = '[color-scheme:light_dark] min-w-0 text-[14px] min-[480px]:text-base';

  const toggleScheduleDay = (day: number) => {
    const days = f.scheduleDays.includes(day)
      ? f.scheduleDays.filter((d) => d !== day)
      : [...f.scheduleDays, day].sort((a, b) => a - b);
    setF({ ...f, scheduleDays: days });
  };

  const save = () => {
    if (!f.title.trim() || !f.venue.trim()) return setErr('Title and venue are required.');
    const a = new Date(`${f.dt}T${f.ts}`);
    const b = new Date(`${f.dt}T${f.te}`);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b <= a)
      return setErr('The end time must be after the start time.');
    if (f.scheduleEnabled && f.scheduleDays.length === 0)
      return setErr('Select at least one day when schedule is enabled.');
    setErr('');
    onSave({
      title: f.title.trim(),
      description: s.description,
      venue: f.venue.trim(),
      startsAt: a.toISOString(),
      endsAt: b.toISOString(),
      ...(locked ? {} : { lat: s.location.lat, lng: s.location.lng, radius: f.radius }),
      schedule: {
        enabled: f.scheduleEnabled,
        daysOfWeek: f.scheduleDays,
        autoClose: f.scheduleAutoClose,
      },
    });
  };

  return (
    <div className="mx-auto max-w-[680px]">
      <button type="button" className={backCls} onClick={onBack}>
        <i className="ti ti-arrow-left text-[16px]" aria-hidden="true" />
        Back
      </button>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Edit session</CardTitle>
          <CardDescription>
            {locked
              ? 'Check-ins exist, so the radius and verification are locked.'
              : 'You can change everything until the first check-in.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-venue">Venue</Label>
            <Input id="edit-venue" value={f.venue} onChange={(e) => setF({ ...f, venue: e.target.value })} />
          </div>

          {/* Phone: date on its own row, start and end side by side. 480px and up: all three on one row. */}
          <div className="grid grid-cols-2 items-end gap-4 min-[480px]:grid-cols-[1.3fr_1fr_1fr]">
            <div className="col-span-2 min-w-0 space-y-2 min-[480px]:col-span-1">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                className={dateCls}
                value={f.dt}
                onChange={(e) => setF({ ...f, dt: e.target.value })}
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="edit-start">Start</Label>
              <Input
                id="edit-start"
                type="time"
                className={dateCls}
                value={f.ts}
                onChange={(e) => setF({ ...f, ts: e.target.value })}
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="edit-end">End</Label>
              <Input
                id="edit-end"
                type="time"
                className={dateCls}
                value={f.te}
                onChange={(e) => setF({ ...f, te: e.target.value })}
              />
            </div>
          </div>

          {!locked && (
            <div className="space-y-3">
              <Label htmlFor="edit-radius">Check-in radius: {f.radius} m</Label>
              <input
                id="edit-radius"
                type="range"
                min={1}
                max={400}
                value={f.radius}
                onChange={(e) => setF({ ...f, radius: Number(e.target.value) })}
                className="h-6 w-full accent-[var(--sig)]"
              />
            </div>
          )}

          {/* Schedule */}
          <div className="rounded-2xl border border-[var(--line)]">
            <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
              <label htmlFor="edit-schedule-enabled" className="min-w-0 cursor-pointer">
                <span className="block text-[15px] font-semibold">Repeat weekly</span>
                <span className="mt-0.5 block text-[13px]" style={mut}>
                  Open this session automatically on the days you choose.
                </span>
              </label>
              <Switch
                id="edit-schedule-enabled"
                label="Repeat weekly"
                checked={f.scheduleEnabled}
                onChange={(v) => setF({ ...f, scheduleEnabled: v })}
              />
            </div>

            {f.scheduleEnabled && (
              <div className="space-y-5 border-t border-[var(--line)] p-4 sm:p-5">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Repeat on</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESETS.map((pr) => {
                        const active = sameDays(f.scheduleDays, pr.days);
                        return (
                          <button
                            key={pr.label}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setF({ ...f, scheduleDays: pr.days })}
                            className={`rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors hover:text-[var(--ink)] ${focusRing}`}
                            style={{
                              color: active ? 'var(--pine)' : 'var(--mut)',
                              background: active ? 'var(--tint)' : 'transparent',
                            }}
                          >
                            {pr.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Days of the week">
                    {DAYS.map((day, idx) => {
                      const selected = f.scheduleDays.includes(idx);
                      return (
                        <button
                          key={day}
                          type="button"
                          aria-pressed={selected}
                          aria-label={DAYS_LONG[idx]}
                          onClick={() => toggleScheduleDay(idx)}
                          className={`grid h-10 min-w-0 place-items-center rounded-full border text-[11px] font-semibold transition-colors min-[420px]:text-[13px] ${focusRing}`}
                          style={{
                            borderColor: selected ? 'var(--pine)' : 'var(--line)',
                            borderWidth: selected ? 2 : 1,
                            background: selected ? 'var(--tint)' : 'transparent',
                            color: 'var(--ink)',
                            fontWeight: selected ? 700 : 600,
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  {f.scheduleDays.length === 0 ? (
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--err)' }} role="alert">
                      Pick at least one day.
                    </p>
                  ) : (
                    <p className="flex items-start gap-2 text-[13px]" style={mut}>
                      <i className="ti ti-calendar-repeat mt-0.5 shrink-0 text-[16px] text-[var(--pine)]" aria-hidden="true" />
                      <span>
                        Opens <strong className="font-semibold text-[var(--ink)]">{describeDays(f.scheduleDays)}</strong> at{' '}
                        <strong className="font-semibold text-[var(--ink)]">{fmt12(f.ts)}</strong>
                        {f.scheduleAutoClose && (
                          <>
                            {' '}and closes at <strong className="font-semibold text-[var(--ink)]">{fmt12(f.te)}</strong>
                          </>
                        )}
                        .
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--line)] px-3.5 py-3">
                  <label htmlFor="edit-schedule-auto-close" className="min-w-0 cursor-pointer">
                    <span className="block text-sm font-semibold">Close automatically</span>
                    <span className="block text-[13px]" style={mut}>
                      Ends check-in at the end time. Turn off to close it yourself.
                    </span>
                  </label>
                  <Switch
                    id="edit-schedule-auto-close"
                    label="Close automatically at end time"
                    checked={f.scheduleAutoClose}
                    onChange={(v) => setF({ ...f, scheduleAutoClose: v })}
                  />
                </div>
              </div>
            )}
          </div>

          {err && (
            <p role="alert" className="text-[14px] font-semibold" style={{ color: 'var(--err)' }}>
              {err}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex-col-reverse gap-3 min-[360px]:flex-row">
          <Button type="button" variant="outline" className="h-12 w-full min-[360px]:flex-1" onClick={onBack}>
            Cancel
          </Button>
          <Button type="button" className="h-12 w-full min-[360px]:flex-1" onClick={save}>
            Save changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}