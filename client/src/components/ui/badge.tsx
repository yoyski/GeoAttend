import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--pine)] text-[var(--onp)]',
        secondary: 'bg-[var(--tint)] text-[var(--pine)]',
        outline: 'border border-[var(--line)] text-[var(--mut)]',
        success: 'bg-[var(--okt)] text-[var(--ok)]',
        warning: 'bg-[var(--sigt)] text-[var(--ink)]',
        destructive: 'bg-[var(--errt)] text-[var(--err)]',
      },
    },
    defaultVariants: { variant: 'secondary' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  showDot?: boolean;
}

function Badge({ className, variant, showDot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {showDot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
