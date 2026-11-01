import * as React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-xl border-2 border-[var(--line)] bg-[var(--card)] px-3.5 text-sm text-[var(--ink)] transition-all placeholder:text-[var(--mut)] hover:border-[var(--pine)] hover:bg-[var(--tint)] focus:border-[var(--sig)] focus:bg-[var(--card)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--sig)_15%,transparent)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
export { Input };
