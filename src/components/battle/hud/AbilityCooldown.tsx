import React from 'react';

interface AbilityCooldownProps {
  cooldown: number;
  maxCooldown: number;
  abilityName: string;
  keyLabel?: string;
}

const AbilityCooldown: React.FC<AbilityCooldownProps> = ({ cooldown, maxCooldown, abilityName, keyLabel = 'Q' }) => {
  const ready = cooldown <= 0;
  const pct = ready ? 100 : ((maxCooldown - cooldown) / maxCooldown) * 100;

  return (
    <div className="w-[106px] rounded-[var(--radius-xl)] border-2 border-[var(--color-hud-border)] bg-[var(--color-hud-bg)] p-2 text-center shadow-[var(--shadow-hud)] backdrop-blur-md">
      <div className={`relative mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border-2 border-[var(--color-secondary-light)] bg-[var(--color-surface-elevated)] ${ready ? 'animate-pulse-ring' : ''}`}>
        {!ready && (
          <div
            className="absolute bottom-0 left-0 right-0 bg-[var(--color-secondary)]/30 transition-[height] duration-200"
            style={{ height: `${pct}%` }}
          />
        )}
        <span className={`relative z-10 text-lg font-semibold ${ready ? 'text-[var(--color-secondary)]' : 'text-[var(--color-text-muted)]'}`}>
          {keyLabel}
        </span>
      </div>
      <div className="mt-1 truncate text-[11px] text-[var(--color-text-muted)]">{abilityName}</div>
      <div className={`text-xs font-semibold ${ready ? 'text-[var(--color-secondary)]' : 'text-[var(--color-text)]'}`}>{ready ? 'Ready' : `${cooldown.toFixed(1)}s`}</div>
    </div>
  );
};

export default AbilityCooldown;
