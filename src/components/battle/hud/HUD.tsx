import React from 'react';
import { HUDState } from '../../../types/game';
import HealthBar from './HealthBar';
import ArmyStatus from './ArmyStatus';
import Minimap from './Minimap';
import WaveInfo from './WaveInfo';
import Crosshair from './Crosshair';
import DamageOverlay from './DamageOverlay';
import WaveBanner from './WaveBanner';
import CommandHint from './CommandHint';
import AbilityCooldown from './AbilityCooldown';

interface HUDProps {
  hudState: HUDState;
  waveBanner: string | null;
  damageFlash: boolean;
  minimapRef: React.RefObject<HTMLCanvasElement | null>;
  abilityName: string;
}

const HUD: React.FC<HUDProps> = ({ hudState, waveBanner, damageFlash, minimapRef, abilityName }) => (
  <div className="fixed inset-0 z-10 pointer-events-none">
    <HealthBar
      health={hudState.health}
      maxHealth={hudState.maxHealth}
      stamina={hudState.stamina}
      maxStamina={hudState.maxStamina}
    />
    <ArmyStatus allyCount={hudState.allyCount} enemyCount={hudState.enemyCount} />
    <Minimap canvasRef={minimapRef} />
    <WaveInfo wave={hudState.wave} kills={hudState.kills} />
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

export default HUD;
