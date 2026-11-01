import { useTheme } from '../hooks/useTheme';

const OPTIONS = [
  { value: 'light', icon: 'ti-sun', label: 'Light' },
  { value: 'dark', icon: 'ti-moon', label: 'Dark' },
  { value: 'system', icon: 'ti-device-desktop', label: 'System' },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex items-center gap-0.5 rounded-full bg-[var(--field)] p-0.5"
    >
      {OPTIONS.map((o) => {
        const on = theme === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            title={o.label}
            onClick={() => setTheme(o.value)}
            className={
              'grid h-7 w-7 place-items-center rounded-full text-[15px] transition-all cursor-pointer ' +
              (on
                ? 'bg-[var(--card)] text-[var(--pine)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--mut)] hover:text-[var(--ink)]')
            }
          >
            <i className={`ti ${o.icon}`} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}