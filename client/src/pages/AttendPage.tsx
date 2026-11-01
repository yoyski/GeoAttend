import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { meApi, sessionsApi } from '../api/endpoints';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
// Kept from the custom kit: GeoAttend-specific pieces with no shadcn equivalent.
import { PageHeading, StatusChip } from '../components/modern';
import { useAsync } from '../hooks/useAsync';
import { useLocationCtx } from '../hooks/useLocation';
import type { Fix } from '../types';

const tabCls = (on: boolean) =>
  [
    'rounded-full px-4 py-1.5 text-sm font-semibold transition-all cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--pine)_25%,transparent)]',
    on ? 'bg-[var(--card)] text-[var(--pine)] shadow-[var(--shadow-sm)]' : 'text-[var(--mut)] hover:text-[var(--ink)]',
  ].join(' ');

const mut = { color: 'var(--mut)' } as const;

const rad = (n: number) => (n * Math.PI) / 180;
function metres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

const timeOf = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const dayOf = (d: Date) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
const range = (startIso: string, endIso: string) => {
  const a = new Date(startIso);
  const b = new Date(endIso);
  const ta = timeOf(a);
  const tb = timeOf(b);
  if (a.toDateString() !== b.toDateString()) return `${dayOf(a)} ${ta} to ${dayOf(b)} ${tb}`;
  const sa = ta.slice(-2).toUpperCase();
  const sb = tb.slice(-2).toUpperCase();
  const first = (sa === 'AM' || sa === 'PM') && sa === sb ? ta.slice(0, -2).trim() : ta;
  return `${first} to ${tb}`;
};

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

function groupByDay<T extends { at: string }>(items: T[]) {
  const groups: { label: string; items: T[] }[] = [];
  for (const it of items) {
    const label = dayLabel(it.at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(it);
    else groups.push({ label, items: [it] });
  }
  return groups;
}

const errMessage = (e: unknown) =>
  typeof e === 'string' ? e : (e as { message?: string } | null)?.message ?? 'Something went wrong.';

/** Callout card used for empty and prompt states. */
function Notice({ title, children, tone = 'tint' }: { title: string; children: React.ReactNode; tone?: 'tint' | 'sig' | 'err' }) {
  return (
    <Card tone={tone} className="mt-[22px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ErrorCard({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <Card tone="err" role="alert" className="mt-[22px]">
      <CardContent>
        <p className="text-sm font-semibold">{errMessage(error)}</p>
      </CardContent>
    </Card>
  );
}

export function AttendPage() {
  const [tab, setTab] = useState<'sessions' | 'history'>('sessions');
  const { fix, gpsError } = useLocationCtx();

  // The position used for the nearby search. It only moves when you have moved 20 m or more
  // (or GPS accuracy became usable), so GPS jitter never clears the list or refetches.
  const [anchor, setAnchor] = useState<Fix | null>(null);
  useEffect(() => {
    if (!fix) return;
    setAnchor((prev) =>
      !prev || metres(prev, fix) >= 20 || (prev.accuracy > 100 && fix.accuracy <= 100) ? { ...fix } : prev,
    );
  }, [fix?.lat, fix?.lng, fix?.accuracy]);

  const nearby = useAsync(
    () => (tab === 'sessions' && anchor ? sessionsApi.nearby(anchor) : Promise.resolve(null)),
    [anchor?.lat, anchor?.lng, anchor?.accuracy, tab],
  );

  const history = useAsync(() => (tab === 'history' ? meApi.history() : Promise.resolve(null)), [tab]);

  const noneHere = tab === 'sessions' && !!fix && !nearby.error && !!nearby.data && nearby.data.length === 0;

  return (
    <div>
      <PageHeading
        title="Attend"
        sub={tab === 'history' && history.data ? `${history.data.history.length} recent check-ins` : 'Sessions you can join'}
      />

      {/* Tabs (no shadcn Tabs primitive installed, so styled to match) */}
      <div className="mb-4 inline-flex gap-1 rounded-full bg-[var(--field)] p-1" role="tablist">
        <button role="tab" aria-selected={tab === 'sessions'} onClick={() => setTab('sessions')} className={tabCls(tab === 'sessions')}>
          Sessions
        </button>
        <button role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')} className={tabCls(tab === 'history')}>
          My history
        </button>
      </div>

      <div>
        {tab === 'sessions' && (
          <>
            {!fix && (
              <Notice title="Location required">
                <p className="text-sm" style={mut}>
                  Allow location access to see sessions where you are.
                </p>
                {gpsError && (
                  <p role="alert" className="mt-2 text-[13px] font-semibold text-[var(--err)]">
                    {gpsError}
                  </p>
                )}
              </Notice>
            )}

            <ErrorCard error={nearby.error} />

            {nearby.loading && !nearby.data && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
                    <div className="flex items-start gap-3.5">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2.5">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="mt-3 flex gap-3 border-t border-[var(--line)] pt-3">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {noneHere && (
              <Notice title="No sessions at your location">
                <p className="text-sm" style={mut}>
                  Sessions appear here only while you are inside their check-in area. Move to a venue to see its session.
                </p>
              </Notice>
            )}

            {nearby.data && nearby.data.length > 0 && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {nearby.data.map((s) => (
                  <Link
                    key={s.id}
                    to={`/s/${s.id}`}
                    className="group rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--pine)_25%,transparent)]"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--tint)]">
                        <i className="ti ti-map-pin text-[24px] text-[var(--pine)]" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2.5">
                          <h3 className="truncate text-[16px] font-semibold tracking-tight">{s.title}</h3>
                          <StatusChip status={s.status} />
                        </div>
                        <p className="mt-0.5 truncate text-[13px]" style={mut}>
                          <i className="ti ti-map-pin mr-1" aria-hidden="true" />
                          {s.venue}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[var(--line)] pt-3 text-[13px]" style={mut}>
                      <span className="inline-flex items-center gap-1">
                        <i className="ti ti-clock" aria-hidden="true" />
                        {range(s.startsAt, s.endsAt)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <i className="ti ti-focus-2" aria-hidden="true" />
                        within {s.radius} m
                      </span>
                      {s.checkedIn && (
                        <Badge variant="success" showDot className="ml-auto">
                          Checked in
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <>
            <ErrorCard error={history.error} />

            {history.loading && !history.data && (
              <div className="space-y-6">
                <section>
                  <Skeleton className="mb-2.5 h-4 w-20" />
                  <ol className="relative space-y-3 border-l-2 border-[var(--line)] pl-5">
                    {[1, 2, 3].map((i) => (
                      <li key={i} className="relative">
                        <span
                          aria-hidden="true"
                          className="absolute -left-[31px] top-4 h-5 w-5 rounded-full bg-[var(--line)] ring-4 ring-[var(--bg)]"
                        />
                        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
                          <div className="flex items-start justify-between gap-2.5">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                          <Skeleton className="mt-2 h-4 w-32" />
                          <Skeleton className="mt-2 h-3 w-48" />
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            )}

            {history.data && (
              <>
                {history.data.history.length === 0 ? (
                  <Notice title="No check-ins yet">
                    <p className="text-sm" style={mut}>
                      Open a session and check in when you are at the venue.
                    </p>
                  </Notice>
                ) : (
                  <div className="space-y-6">
                    {groupByDay(history.data.history).map((g) => (
                      <section key={g.label} aria-label={g.label}>
                        <h3 className="mb-2.5 text-[13px] font-semibold" style={mut}>
                          {g.label}
                        </h3>
                        <ol className="relative space-y-3 border-l-2 border-[var(--line)] pl-5">
                          {g.items.map((h) => (
                            <li key={h.id} className="relative">
                              <span
                                aria-hidden="true"
                                className={
                                  'absolute -left-[31px] top-4 grid h-5 w-5 place-items-center rounded-full text-[11px] ring-4 ring-[var(--bg)] ' +
                                  (h.late ? 'bg-[var(--sigt)] text-[var(--ink)]' : 'bg-[var(--okt)] text-[var(--ok)]')
                                }
                              >
                                <i className={`ti ${h.late ? 'ti-clock' : 'ti-check'}`} />
                              </span>
                              <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
                                <div className="flex items-start justify-between gap-2.5">
                                  <h4 className="truncate text-[16px] font-semibold tracking-tight">{h.title}</h4>
                                  <Badge variant={h.late ? 'warning' : 'success'} showDot>
                                    {h.late ? 'Late' : 'Present'}
                                  </Badge>
                                </div>
                                <p className="mt-0.5 truncate text-[13px]" style={mut}>
                                  {h.venue}
                                </p>
                                <p className="mt-2 text-[12px]" style={mut}>
                                  {new Date(h.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ·{' '}
                                  {h.distance} m from centre · GPS ±{h.accuracy} m
                                </p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </section>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}