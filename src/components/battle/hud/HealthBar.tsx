import React from 'react';
import { Progress } from '../../ui/progress';

interface HealthBarProps {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
}

const HealthBar: React.FC<HealthBarProps> = ({ health, maxHealth, stamina, maxStamina }) => {
  const hpPct = Math.max(0, (health / maxHealth) * 100);
  const stPct = Math.max(0, (stamina / maxStamina) * 100);

  return (
    <div className="fixed bottom-8 left-1/2 z-[15] w-[min(460px,94vw)] -translate-x-1/2 rounded-[var(--radius-2xl)] border-2 border-[var(--color-hud-border)] bg-[var(--color-hud-bg)] p-2.5 shadow-[var(--shadow-hud)] backdrop-blur-md">
      <div className="mb-1 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span className="uppercase tracking-wide">Health</span>
        <span className="font-semibold text-[var(--color-text)]">
          {Math.max(0, Math.round(health))} / {Math.round(maxHealth)}
        </span>
      </div>
      <Progress value={hpPct} variant="health" className="h-2.5" />

      <div className="mb-1 mt-1.5 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span className="uppercase tracking-wide">Stamina</span>
        <span className="font-semibold text-[var(--color-text)]">
          {Math.max(0, Math.round(stamina))} / {Math.round(maxStamina)}
        </span>
      </div>
      <Progress value={stPct} variant="stamina" className="h-2.5" />
    </div>
  );
};

export default HealthBar;
