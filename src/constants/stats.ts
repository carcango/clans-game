import { AttackType } from '../types/hero';

export interface ClassStats {
  hp: number;
  stamina: number;
  speed: number;
  attackMin: number;
  attackMax: number;
  attackType: AttackType;
  range: number;
  blockPct: number;
  sprintSpeed: number;
  abilityName: string;
  abilityDescription: string;
  abilityCost: number;
  abilityCooldownMax: number;
}

export const CLASS_STATS: Record<string, ClassStats> = {
  warrior: {
    hp: 120, stamina: 100, speed: 5, attackMin: 20, attackMax: 35,
    attackType: 'melee', range: 2.5, blockPct: 0.7, sprintSpeed: 8,
    abilityName: 'Shield Bash', abilityDescription: 'Knockback + stun nearby enemies',
    abilityCost: 30, abilityCooldownMax: 8,
  },
  archer: {
    hp: 80, stamina: 120, speed: 6, attackMin: 15, attackMax: 25,
    attackType: 'ranged', range: 15, blockPct: 0.3, sprintSpeed: 9.5,
    abilityName: 'Arrow Volley', abilityDescription: 'Fire 5 arrows in a spread',
    abilityCost: 40, abilityCooldownMax: 10,
  },
  mage: {
    hp: 70, stamina: 150, speed: 4.5, attackMin: 25, attackMax: 40,
    attackType: 'ranged', range: 12, blockPct: 0.5, sprintSpeed: 7,
    abilityName: 'Fireball', abilityDescription: 'AoE explosion dealing heavy damage',
    abilityCost: 50, abilityCooldownMax: 12,
  },
  paladin: {
    hp: 130, stamina: 90, speed: 4.5, attackMin: 18, attackMax: 30,
    attackType: 'melee', range: 2.5, blockPct: 0.8, sprintSpeed: 7,
    abilityName: 'Holy Aura', abilityDescription: 'Heal nearby allies for 15 HP',
    abilityCost: 35, abilityCooldownMax: 10,
  },
  rogue: {
    hp: 85, stamina: 130, speed: 7.5, attackMin: 22, attackMax: 38,
    attackType: 'melee', range: 2.0, blockPct: 0.4, sprintSpeed: 11,
    abilityName: 'Backstab', abilityDescription: 'Next attack deals 3x damage',
    abilityCost: 25, abilityCooldownMax: 6,
  },
  necromancer: {
    hp: 90, stamina: 140, speed: 4.5, attackMin: 20, attackMax: 30,
    attackType: 'ranged', range: 10, blockPct: 0.2, sprintSpeed: 7,
    abilityName: 'Raise Dead', abilityDescription: 'Convert a dead enemy into an ally',
    abilityCost: 60, abilityCooldownMax: 15,
  },
};

export function getScaledStats(classId: string, level: number): ClassStats {
  const base = CLASS_STATS[classId];
  if (!base) return CLASS_STATS.warrior;
  const mult = level === 2 ? 1.15 : level === 3 ? 1.3 : 1.0;
  return {
    ...base,
    hp: Math.floor(base.hp * mult),
    stamina: Math.floor(base.stamina * mult),
    speed: +(base.speed * mult).toFixed(1),
    attackMin: Math.floor(base.attackMin * mult),
    attackMax: Math.floor(base.attackMax * mult),
    sprintSpeed: +(base.sprintSpeed * mult).toFixed(1),
    range: base.range,
    blockPct: Math.min(0.95, base.blockPct * (level === 3 ? 1.1 : 1.0)),
    abilityCost: base.abilityCost,
    abilityCooldownMax: base.abilityCooldownMax,
  };
}
