import React from 'react';

interface WaveInfoProps {
  wave: number;
  kills: number;
}

const WaveInfo: React.FC<WaveInfoProps> = ({ wave, kills }) => (
  <div className="fixed left-1/2 top-4 z-[15] flex -translate-x-1/2 items-center gap-6 rounded-[var(--radius-2xl)] border-2 border-[var(--color-hud-border)] bg-[var(--color-hud-bg)] px-4 py-2 shadow-[var(--shadow-hud)] backdrop-blur-md">
    <div className="text-center">
      <div className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">Wave</div>
      <div className="font-display text-2xl font-semibold text-[var(--color-primary)]">{wave}</div>
    </div>
    <div className="h-8 w-px bg-[var(--color-border)]" />
    <div className="text-center">
      <div className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">Kills</div>
      <div className="text-2xl font-semibold text-[var(--color-text)]">{kills}</div>
    </div>
  </div>
);

export default WaveInfo;
