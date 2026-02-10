import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-[var(--radius-full)] border-2 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide font-accent',
  {
  variants: {
    variant: {
      default: 'border-[var(--color-primary)]/40 bg-[rgba(212,168,67,0.15)] text-[var(--color-primary)]',
      secondary: 'border-[var(--color-secondary-light)] bg-[rgba(107,79,160,0.15)] text-[var(--color-secondary-light)]',
      outline: 'border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)]',
      destructive: 'border-[var(--color-destructive)]/40 bg-[rgba(196,64,64,0.15)] text-[var(--color-destructive)]',
      success: 'border-[var(--color-success)]/40 bg-[rgba(74,139,92,0.15)] text-[var(--color-success)]',
      info: 'border-[var(--color-info)]/40 bg-[rgba(74,127,181,0.15)] text-[var(--color-info)]',
      glow: 'border-[var(--color-primary)]/50 bg-[rgba(212,168,67,0.15)] text-[var(--color-primary)] animate-pulse-ring',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
