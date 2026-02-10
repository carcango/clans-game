import React from 'react';
import { cn } from '../../lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, eyebrow, action, className }) => (
  <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
    <div className="space-y-1.5">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)] font-accent">
          {eyebrow}
        </p>
      )}
      <h1
        className={cn(
          eyebrow ? 'mt-1' : 'mt-0',
          'font-display text-3xl font-semibold tracking-tight text-[var(--color-text-heading)] sm:text-4xl'
        )}
      >
        {title}
      </h1>
      {subtitle && <p className="max-w-2xl text-sm text-[var(--color-text-muted)]">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export default SectionHeader;
