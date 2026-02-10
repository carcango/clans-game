import React from 'react';
import { cn } from '../../lib/utils';

interface StatPillProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

const StatPill: React.FC<StatPillProps> = ({ label, value, className }) => (
  <div
    className={cn(
      'inline-flex items-center gap-2 rounded-[var(--radius-full)] border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-medium',
      className
    )}
  >
    <span className="uppercase tracking-wide text-[var(--color-primary)]">{label}</span>
    <span className="font-bold text-[var(--color-text)]">{value}</span>
  </div>
);

export default StatPill;
