import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--pine)_25%,transparent)] cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--pine)] text-[var(--onp)] shadow-[var(--shadow-md)] hover:brightness-110',
        secondary: 'bg-[var(--tint)] text-[var(--pine)] hover:brightness-95',
        outline:
          'border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] shadow-[var(--shadow-sm)] hover:bg-[var(--field)]',
        ghost: 'text-[var(--mut)] hover:bg-[var(--field)] hover:text-[var(--ink)]',
        destructive: 'bg-[var(--err)] text-white shadow-[var(--shadow-md)] hover:brightness-110',
        link: 'text-[var(--pine)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 px-3.5 text-[13px]',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
