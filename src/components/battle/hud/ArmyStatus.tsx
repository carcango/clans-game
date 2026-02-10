import React from 'react';

interface ArmyStatusProps {
  allyCount: number;
  enemyCount: number;
}

const ArmyStatus: React.FC<ArmyStatusProps> = ({ allyCount, enemyCount }) => (
  <div className="fixed bottom-[124px] left-1/2 z-[15] flex -translate-x-1/2 items-center gap-4 rounded-[var(--radius-full)] border-2 border-[var(--color-hud-border)] bg-[var(--color-hud-bg)] px-4 py-2 text-sm shadow-[var(--shadow-hud)] backdrop-blur-md">
    <div className="text-center">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
        <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
        Allies
      </div>
      <div className="text-xl font-semibold text-[var(--color-success)]">{allyCount}</div>
    </div>
    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">vs</div>
    <div className="text-center">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
        <span className="h-2 w-2 rounded-full bg-[var(--color-destructive)]" />
        Enemies
      </div>
      <div className="text-xl font-semibold text-[var(--color-destructive)]">{enemyCount}</div>
    </div>
  </div>
);

export default ArmyStatus;
