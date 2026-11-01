import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { ApiError } from '../api/client';

/* ---------- Design tokens (GeoAttend "field survey" look) ----------
   Tints fall back to a mix of the base colours if --tint/--errt/--sigt are not defined globally. */
export const TINT = 'var(--tint, color-mix(in srgb, var(--pine) 14%, var(--bg)))';
const ERRT = 'var(--errt, color-mix(in srgb, var(--err) 14%, var(--bg)))';
const SIGT = 'var(--sigt, color-mix(in srgb, var(--sig) 16%, var(--bg)))';
export const SERIF = 'Fraunces, Georgia, "Times New Roman", serif';

const focusRing =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--sig)]';

/* ---------- Page heading: serif title, muted subline, 2px ink rule ---------- */
export function PageHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h1
        className="mt-1 text-[34px] font-semibold leading-[1.08] tracking-[-0.02em]"
        style={{ fontFamily: SERIF, color: 'var(--ink)' }}
      >
        {title}
      </h1>
      {sub && (
        <p className="border-b-2 border-[var(--ink)] pb-4 text-[13px]" style={{ color: 'var(--mut)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ---------- Inputs and fields ---------- */
export const labelCls =
  'block font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--mut)]';

export const inputCls =
  'w-full rounded-none border-0 border-b-[1.5px] border-[var(--ink)] bg-transparent px-0 py-3 font-mono text-base ' +
  'normal-case tracking-normal text-[var(--ink)] transition-colors ' +
  'focus:border-[var(--sig)] focus:shadow-[0_1px_0_var(--sig)] focus:outline-none';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-[14px]">
      <label className={`${labelCls} mb-1.5`}>{label}</label>
      {children}
    </div>
  );
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${className}`} />;
}

export function SelectInput({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${className}`} />;
}

export function TextAreaInput({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} ${className}`} />;
}

/* ---------- Buttons ---------- */
export function Btn({
  variant = 'primary',
  className = '',
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const base = `mt-3.5 block min-h-[52px] w-full rounded-[6px] border-[1.5px] px-4 py-3 text-[15px] font-bold transition disabled:opacity-50 ${focusRing}`;
  const variantClasses =
    variant === 'primary'
      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]'
      : variant === 'danger'
        ? 'border-[var(--err)] bg-transparent text-[var(--err)]'
        : 'border-[var(--ink)] bg-transparent text-[var(--ink)]';

  return <button {...p} className={`${base} ${variantClasses} ${className}`} />;
}

/* ---------- Sections and cards: ink rule on top, no box ---------- */
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-[22px] border-t-2 border-[var(--ink)] pt-4">
      <h2
        className="mb-3 text-[19px] font-semibold tracking-[-0.01em]"
        style={{ fontFamily: SERIF, color: 'var(--ink)' }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Plain card = ruled section. Pass `tone` for the tinted callout version (permission, outside range, checked in). */
export function Card({ children, tone }: { children: ReactNode; tone?: 'tint' | 'err' | 'sig' }) {
  const bg = tone === 'tint' ? TINT : tone === 'err' ? ERRT : tone === 'sig' ? SIGT : undefined;
  return (
    <div
      className={`mt-[22px] border-t-2 border-[var(--ink)] ${tone ? 'p-4' : 'pb-1.5 pt-4'}`}
      style={bg ? { backgroundColor: bg } : undefined}
    >
      {children}
    </div>
  );
}

/* ---------- Ledger row ---------- */
export function Row({ children }: { children: ReactNode }) {
  return <div className="border-b border-[var(--line)] py-4">{children}</div>;
}

/* ---------- Chips: mono, uppercase, dot, tinted ---------- */
type Tone = 'pine' | 'sig' | 'mut' | 'err';
const TONES: Record<Tone, { bg: string; fg: string }> = {
  pine: { bg: TINT, fg: 'var(--pine)' },
  sig: { bg: SIGT, fg: 'var(--ink)' },
  mut: { bg: 'var(--line)', fg: 'var(--mut)' },
  err: { bg: ERRT, fg: 'var(--err)' },
};

export function Chip({ tone = 'pine', children }: { tone?: Tone; children: ReactNode }) {
  const t = TONES[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] px-2 py-[3px] font-mono text-[11px] font-semibold uppercase tracking-[0.06em]"
      style={{ backgroundColor: t.bg, color: t.fg }}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

/** Small tinted action chip (Copy, Add, Zoom in...). No dot, unlike status chips. */
export function ChipButton({ className = '', style, ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...p}
      className={`whitespace-nowrap rounded-[4px] border-0 px-2 py-[3px] font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--pine)] ${focusRing} ${className}`}
      style={{ backgroundColor: TINT, ...style }}
    />
  );
}

/** Segmented radio control: ink outline, selected segment filled with ink. */
export function Seg<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="mt-2 flex" role="radiogroup" aria-label={label}>
      {options.map((o, i) => {
        const on = o.value === value;
        const pos =
          i === 0 ? 'rounded-l-[6px]' : i === options.length - 1 ? '-ml-[1.5px] rounded-r-[6px]' : '-ml-[1.5px]';
        return (
          <label key={o.value} className="flex-1">
            <input type="radio" name={name} className="peer sr-only" checked={on} onChange={() => onChange(o.value)} />
            <span
              className={`block cursor-pointer border-[1.5px] border-[var(--ink)] px-1 py-[11px] text-center text-[13px] font-semibold peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-[var(--sig)] ${pos} ${on ? 'bg-[var(--ink)] text-[var(--bg)]' : 'bg-transparent text-[var(--ink)]'
                }`}
            >
              {o.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  const byStatus: Record<string, Tone> = { OPEN: 'pine', UPCOMING: 'sig', CLOSED: 'mut', CANCELLED: 'err' };
  return <Chip tone={byStatus[status.toUpperCase()] ?? 'pine'}>{status}</Chip>;
}

/* ---------- Category tile (Event = pine, School = amber, Employee = blue) ---------- */
const CAT_COLOR: Record<string, string> = { event: 'var(--pine)', school: '#C9861A', employee: '#5468D4' };
export const catColor = (c?: string) => CAT_COLOR[(c || '').toLowerCase()] ?? 'var(--mut)';
export const catLabel = (c?: string) => (c ? c.charAt(0).toUpperCase() + c.slice(1).toLowerCase() : '');

export function CatTile({ category }: { category?: string }) {
  const color = catColor(category);
  return (
    <span
      aria-hidden="true"
      className="grid h-11 w-11 flex-none place-items-center rounded-[6px] border-[1.5px] font-mono text-[15px] font-extrabold"
      style={{ borderColor: color, color }}
    >
      {catLabel(category).charAt(0)}
    </span>
  );
}

/* ---------- Alerts and messages ---------- */
export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  const e = error as ApiError;
  return (
    <div
      role="alert"
      className="mt-3 border-l-4 p-4 text-sm"
      style={{ backgroundColor: ERRT, borderColor: 'var(--err)', color: 'var(--ink)' }}
    >
      {e.code ? <b style={{ color: 'var(--err)' }}>{e.code}: </b> : null}
      {e.message}
      {Array.isArray(e.details) && e.details.length > 0 && (
        <ul className="ml-5 mt-2 list-disc">
          {(e.details as { path: string; message: string }[]).map((d, i) => (
            <li key={i}>{d.path}: {d.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SuccessBox({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="mt-3 border-l-4 p-4 text-sm"
      style={{ backgroundColor: TINT, borderColor: 'var(--pine)', color: 'var(--ink)' }}
    >
      {message}
    </div>
  );
}

/* ---------- Formatting utilities ---------- */
export const fmt = (iso: string) => new Date(iso).toLocaleString();

export const toLocalInput = (d: string | Date) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 16);
};