import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
// `./ui` resolves to your existing ui.tsx (old kit) — only the helpers are reused.
export { fmt, toLocalInput } from './ui';

/** Kept for backwards compatibility: headings are now sans, so this is the inherited font. */
export const SERIF = 'inherit';

export function PageHeading({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--ink)]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-[var(--mut)]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorBox({ error }: { error?: { message?: string } | null }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2.5 rounded-xl bg-[var(--errt)] px-4 py-3 text-sm font-medium text-[var(--err)]"
    >
      <i className="ti ti-alert-circle mt-0.5 text-base" aria-hidden="true" />
      <span>{error.message || 'Something went wrong'}</span>
    </div>
  );
}

const STATUS: Record<string, string> = {
  Open: 'bg-[var(--okt)] text-[var(--ok)]',
  Upcoming: 'bg-[var(--sigt)] text-[var(--ink)]',
  Closed: 'bg-[var(--field)] text-[var(--mut)]',
  Cancelled: 'bg-[var(--errt)] text-[var(--err)]',
};

export function StatusChip({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        STATUS[status] ?? STATUS.Closed,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}

const CAT: Record<string, { c: string; icon: string }> = {
  Event: { c: '#4F46E5', icon: 'ti-calendar-event' },
  School: { c: '#D97706', icon: 'ti-school' },
  Employee: { c: '#0891B2', icon: 'ti-briefcase' },
};

export function CatTile({ category, className }: { category?: string; className?: string }) {
  const m = (category && CAT[category]) || { c: '#4F46E5', icon: 'ti-map-pin' };
  return (
    <span
      aria-hidden="true"
      className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl', className)}
      style={{ color: m.c, background: `color-mix(in srgb, ${m.c} 14%, transparent)` }}
    >
      <i className={`ti ${m.icon}`} />
    </span>
  );
}
