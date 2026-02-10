import React from 'react';
import { cn } from '../../lib/utils';

interface ScreenShellProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

const ScreenShell: React.FC<ScreenShellProps> = ({ children, className, contentClassName }) => (
  <div className={cn('relative h-screen w-full overflow-hidden bg-[var(--color-bg)]', className)}>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    <div className={cn('relative z-10 h-full w-full p-4 sm:p-6', contentClassName)}>{children}</div>
  </div>
);

export default ScreenShell;
