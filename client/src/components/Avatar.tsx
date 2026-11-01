import { cn } from '../lib/utils';

const initialsOf = (name?: string) =>
  (name || 'ME').split(' ').filter(Boolean).map((x) => x[0]).slice(0, 2).join('').toUpperCase() || 'ME';

/** Profile picture, or the person's initials when there is none. Size it with className (h-* w-* text-*). */
export function Avatar({ name, src, className }: { name?: string; src?: string | null; className?: string }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--tint)] font-bold text-[var(--pine)]',
        className,
      )}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" draggable={false} /> : initialsOf(name)}
    </span>
  );
}