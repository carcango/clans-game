import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-xl)] text-sm font-bold leading-none transition-[background-color,color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'border-2 border-[var(--color-primary-strong)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-button)] hover:bg-[var(--color-primary-strong)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_#7a5a10,0_8px_24px_rgba(212,168,67,0.4)] active:translate-y-0.5 active:shadow-[0_2px_0_#7a5a10,0_3px_10px_rgba(212,168,67,0.2)]',
        secondary:
          'border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-card)] hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-secondary-light)]',
        outline:
          'border-2 border-[var(--color-border-strong)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface)]',
        ghost:
          'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]',
        danger:
          'border-2 border-[var(--color-destructive)] bg-[var(--color-destructive)] text-white shadow-[0_4px_0_#8a2020,0_6px_20px_rgba(196,64,64,0.3)] hover:bg-[#a83030] active:translate-y-0.5',
        hud:
          'border-2 border-[var(--color-hud-border)] bg-[var(--color-hud-bg)] text-[var(--color-text)] rounded-[var(--radius-lg)] backdrop-blur-md hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)]',
        default:
          'border-2 border-[var(--color-primary-strong)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-button)] hover:bg-[var(--color-primary-strong)] hover:-translate-y-0.5 active:translate-y-0.5',
        destructive:
          'border-2 border-[var(--color-destructive)] bg-[var(--color-destructive)] text-white shadow-[0_4px_0_#8a2020,0_6px_20px_rgba(196,64,64,0.3)] hover:bg-[#a83030] active:translate-y-0.5',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-[var(--radius-lg)] px-3 text-xs',
        lg: 'h-11 rounded-[var(--radius-xl)] px-8',
        xl: 'h-14 rounded-[var(--radius-2xl)] px-10 text-base font-bold tracking-wide',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
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
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
