import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sessionsApi } from '../api/endpoints';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
// Kept from the custom kit (GeoAttend-specific pieces)
import { ErrorBox, PageHeading, StatusChip } from '../components/modern';
import { useAsync } from '../hooks/useAsync';
import type { Status } from '../types';

const FILTERS = ['', 'Open', 'Closed', 'Cancelled'] as const;

const mut = { color: 'var(--mut)' } as const;

const focusRing =
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--pine)_25%,transparent)]';

/**
 * Card grid that fills the width it is given: 1 column on a phone, then as many 300px+ columns
 * as fit (2 on a tablet, 3 on a laptop, 4+ on a wide monitor). No fixed breakpoints, so it also
 * behaves inside a narrow window, a split screen or a foldable.
 */
const gridCls = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4';

// Tabs share the full width on phones (so four labels never overflow at 320px) and shrink to fit from 640px.
const tabCls = (on: boolean) =>
  [
    'flex-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-semibold transition-all cursor-pointer sm:flex-none sm:px-4 sm:text-sm',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--pine)_25%,transparent)]',
    on ? 'bg-[var(--card)] text-[var(--pine)] shadow-[var(--shadow-sm)]' : 'text-[var(--mut)] hover:text-[var(--ink)]',
  ].join(' ');

export function MinePage() {
  const [status, setStatus] = useState<Status | ''>('');
  const list = useAsync(() => sessionsApi.listMine(status || undefined), [status]);

  const isEmpty = !list.loading && list.data?.length === 0;

  return (
    <div className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <PageHeading title="My sessions" sub="Sessions you created" />
        </div>
        <Button asChild size="sm" className="mt-3 shrink-0">
          <Link to="/create">
            <i className="ti ti-plus mr-1.5 text-[16px]" aria-hidden="true" />
            New
          </Link>
        </Button>
      </div>

      {/* Status tabs */}
      <div
        className="mb-4 flex w-full gap-1 rounded-full bg-[var(--field)] p-1 sm:inline-flex sm:w-auto"
        role="tablist"
        aria-label="Filter sessions by status"
      >
        {FILTERS.map((s) => (
          <button key={s || 'All'} role="tab" aria-selected={status === s} onClick={() => setStatus(s)} className={tabCls(status === s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <ErrorBox error={list.error} />

      {list.loading && !list.data && (
        <div className={`mt-5 ${gridCls}`}>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3.5">
                <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2.5">
                    <Skeleton className="h-5 w-32 max-w-full" />
                    <Skeleton className="h-5 w-16 shrink-0" />
                  </div>
                  <Skeleton className="h-4 w-32 max-w-full" />
                  <Skeleton className="h-4 w-28 max-w-full" />
                </div>
                <Skeleton className="h-5 w-5 shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!list.loading && (
        <>
          {isEmpty && (
            <Card tone="tint" className="mt-5 mx-auto max-w-[560px] sm:mx-0">
              <CardHeader>
                <CardTitle>{status ? `No ${status.toLowerCase()} sessions` : 'No sessions yet'}</CardTitle>
                <CardDescription>{status ? 'Try another filter.' : 'Create your first attendance session.'}</CardDescription>
              </CardHeader>
              {!status && (
                <CardContent>
                  <Button asChild className="w-full sm:w-auto">
                    <Link to="/create">Create a session</Link>
                  </Button>
                </CardContent>
              )}
            </Card>
          )}

          {!!list.data?.length && (
            <div className={`mt-5 ${gridCls}`}>
              {list.data.map((s) => (
                <Link key={s.id} to={`/manage/${s.id}`} className={`group block min-w-0 ${focusRing}`}>
                  <Card className="h-full p-4 transition-colors group-hover:bg-[var(--tint)]">
                    <div className="flex items-center gap-3.5">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--tint)]">
                        <i className="ti ti-calendar text-[24px] text-[var(--pine)]" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2.5">
                          <h2
                            className="min-w-0 truncate text-[16px] font-semibold tracking-tight group-hover:underline group-hover:underline-offset-[3px] sm:text-[18px]"
                          >
                            {s.title}
                          </h2>
                          <span className="shrink-0">
                            <StatusChip status={s.status} />
                          </span>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[13px]" style={mut}>
                          <i className="ti ti-map-pin shrink-0 text-[14px]" aria-hidden="true" />
                          <span className="min-w-0 truncate">{s.venue}</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-[13px]" style={mut}>
                          <i className="ti ti-users shrink-0 text-[14px]" aria-hidden="true" />
                          {s.checkInCount} checked in
                        </p>
                      </div>
                      <i className="ti ti-chevron-right shrink-0 text-[18px]" style={mut} aria-hidden="true" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
