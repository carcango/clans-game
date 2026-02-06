import React from 'react';
import { HUDState, CombatLogEntry } from '../../../types/game';
import HealthBar from './HealthBar';
import ArmyStatus from './ArmyStatus';
import Minimap from './Minimap';
import WaveInfo from './WaveInfo';
import CombatLog from './CombatLog';
import Crosshair from './Crosshair';
import DamageOverlay from './DamageOverlay';
import WaveBanner from './WaveBanner';
import CommandHint from './CommandHint';
import AbilityCooldown from './AbilityCooldown';

interface HUDProps {
  hudState: HUDState;
  combatLog: CombatLogEntry[];
  waveBanner: string | null;
  damageFlash: boolean;
  minimapRef: React.RefObject<HTMLCanvasElement | null>;
  abilityName: string;
}

const HUD: React.FC<HUDProps> = ({ hudState, combatLog, waveBanner, damageFlash, minimapRef, abilityName }) => (
  <div className="fixed inset-0 pointer-events-none z-10">
    <HealthBar
      health={hudState.health}
      maxHealth={hudState.maxHealth}
      stamina={hudState.stamina}
      maxStamina={hudState.maxStamina}
    />
    <ArmyStatus allyCount={hudState.allyCount} enemyCount={hudState.enemyCount} />
    <Minimap canvasRef={minimapRef} />
    <WaveInfo wave={hudState.wave} kills={hudState.kills} />
    <CombatLog entries={combatLog} />
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
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] border-2 border-[rgba(100,180,255,0.5)] rounded-full z-[15] opacity-50" />
    )}
  </div>
);

export default HUD;
