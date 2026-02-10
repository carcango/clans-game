import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '../../lib/utils';

const variantStyles: Record<string, string> = {
  default: 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-strong)]',
  health: 'bg-gradient-to-r from-[#ef4444] via-[#f59e0b] to-[#22c55e]',
  stamina: 'bg-gradient-to-r from-[#f59e0b] to-[var(--color-primary)]',
  ability: 'bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-secondary-light)]',
};

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: 'default' | 'health' | 'stamina' | 'ability';
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = 'default', ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-2.5 w-full overflow-hidden rounded-[var(--radius-full)] border-2 border-[var(--color-border)] bg-[#16122a]',
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        'h-full w-full flex-1 rounded-[var(--radius-full)] transition-all shadow-[inset_0_2px_0_rgba(255,255,255,0.35)]',
        variantStyles[variant]
      )}
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
