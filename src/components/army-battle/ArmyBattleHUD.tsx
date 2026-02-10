import React from 'react';
import { ArmyHUDState } from '../../engine/ArmyBattleEngine';
import HealthBar from '../battle/hud/HealthBar';
import Minimap from '../battle/hud/Minimap';
import Crosshair from '../battle/hud/Crosshair';
import DamageOverlay from '../battle/hud/DamageOverlay';
import WaveBanner from '../battle/hud/WaveBanner';
import CommandHint from '../battle/hud/CommandHint';
import AbilityCooldown from '../battle/hud/AbilityCooldown';

interface ArmyBattleHUDProps {
  hudState: ArmyHUDState;
  waveBanner: string | null;
  damageFlash: boolean;
  minimapRef: React.RefObject<HTMLCanvasElement | null>;
  abilityName: string;
}

const ArmyBattleHUD: React.FC<ArmyBattleHUDProps> = ({
  hudState,
  waveBanner,
  damageFlash,
  minimapRef,
  abilityName,
}) => (
  <div className="fixed inset-0 z-10 pointer-events-none">
    <HealthBar
      health={hudState.health}
      maxHealth={hudState.maxHealth}
      stamina={hudState.stamina}
      maxStamina={hudState.maxStamina}
    />

    <div className="fixed bottom-[124px] left-1/2 z-[15] flex -translate-x-1/2 items-center gap-4 rounded-[var(--radius-full)] border-2 border-[var(--color-hud-border)] bg-[var(--color-hud-bg)] px-4 py-2 text-sm shadow-[var(--shadow-hud)] backdrop-blur-md">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-success)]" />
          Your Army
        </div>
        <div className="text-xl font-semibold text-[var(--color-success)]">
          {hudState.allyCount}
          <span className="ml-1 text-sm font-medium text-[var(--color-text-muted)]">/{hudState.totalAllies}</span>
        </div>
      </div>
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">vs</div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-destructive)]" />
          Enemy Army
        </div>
        <div className="text-xl font-semibold text-[var(--color-destructive)]">
          {hudState.enemyCount}
          <span className="ml-1 text-sm font-medium text-[var(--color-text-muted)]">/{hudState.totalEnemies}</span>
        </div>
      </div>
    </div>

    <Minimap canvasRef={minimapRef} />
    <Crosshair />
    <DamageOverlay active={damageFlash} />
    <WaveBanner text={waveBanner} />
    <CommandHint />
    <AbilityCooldown
      cooldown={hudState.abilityCooldown}
      maxCooldown={hudState.abilityMaxCooldown}
      abilityName={abilityName}
    />
    {hudState.isBlocking && (
      <div className="fixed left-1/2 top-1/2 z-[15] h-[62px] w-[62px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/10" />
    )}
  </div>
);

export default ArmyBattleHUD;
