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
  ability2Name: string;
  ability2Description: string;
  ability2Cost: number;
  ability2CooldownMax: number;
  attackSpeed: number; // multiplier: 1.0 = baseline, higher = faster
}

export const CLASS_STATS: Record<string, ClassStats> = {
  warrior: {
    hp: 180, stamina: 100, speed: 7, attackMin: 23, attackMax: 40,
    attackType: 'melee', range: 3.2, blockPct: 0.7, sprintSpeed: 10.5,
    abilityName: 'Shield Bash', abilityDescription: 'Knockback + stun nearby enemies',
    abilityCost: 30, abilityCooldownMax: 8,
    ability2Name: 'War Leap', ability2Description: 'Leap forward, AoE slam on landing',
    ability2Cost: 25, ability2CooldownMax: 10, attackSpeed: 1.0,
  },
  archer: {
    hp: 80, stamina: 120, speed: 8, attackMin: 9, attackMax: 15,
    attackType: 'ranged', range: 15, blockPct: 0.3, sprintSpeed: 12,
    abilityName: 'Arrow Volley', abilityDescription: 'Fire 5 arrows in a spread',
    abilityCost: 40, abilityCooldownMax: 10,
    ability2Name: 'Evasive Roll', ability2Description: 'Quick dodge roll, briefly invulnerable',
    ability2Cost: 15, ability2CooldownMax: 5, attackSpeed: 1.5,
  },
  mage: {
    hp: 70, stamina: 150, speed: 6.5, attackMin: 15, attackMax: 25,
    attackType: 'ranged', range: 12, blockPct: 0.5, sprintSpeed: 9.5,
    abilityName: 'Fireball', abilityDescription: 'AoE explosion dealing heavy damage',
    abilityCost: 50, abilityCooldownMax: 12,
    ability2Name: 'Blink', ability2Description: 'Teleport forward, frost nova at origin',
    ability2Cost: 20, ability2CooldownMax: 8, attackSpeed: 1.3,
  },
  paladin: {
    hp: 195, stamina: 90, speed: 6.5, attackMin: 21, attackMax: 35,
    attackType: 'melee', range: 3.2, blockPct: 0.8, sprintSpeed: 9.5,
    abilityName: 'Holy Aura', abilityDescription: 'Heal nearby allies for 15 HP',
    abilityCost: 35, abilityCooldownMax: 10,
    ability2Name: 'Holy Charge', ability2Description: 'Dash forward, invulnerable, knockback',
    ability2Cost: 30, ability2CooldownMax: 12, attackSpeed: 1.0,
  },
  rogue: {
    hp: 100, stamina: 130, speed: 10, attackMin: 25, attackMax: 44,
    attackType: 'melee', range: 2.8, blockPct: 0.4, sprintSpeed: 14.5,
    abilityName: 'Backstab', abilityDescription: 'Next attack deals 3x damage',
    abilityCost: 25, abilityCooldownMax: 6,
    ability2Name: 'Shadow Step', ability2Description: 'Teleport behind nearest enemy',
    ability2Cost: 20, ability2CooldownMax: 6, attackSpeed: 1.6,
  },
  necromancer: {
    hp: 90, stamina: 140, speed: 6, attackMin: 12, attackMax: 19,
    attackType: 'ranged', range: 10, blockPct: 0.2, sprintSpeed: 9,
    abilityName: 'Raise Dead', abilityDescription: 'Convert a dead enemy into an ally',
    abilityCost: 60, abilityCooldownMax: 15,
    ability2Name: 'Soul Drain', ability2Description: 'AoE life drain, heal 50% of damage',
    ability2Cost: 35, ability2CooldownMax: 10, attackSpeed: 1.1,
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
    ability2Cost: base.ability2Cost,
    ability2CooldownMax: base.ability2CooldownMax,
  };
}
