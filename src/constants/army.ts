import { ArmyComposition, ArmyUnit } from '../types/army';
import { CLASS_STATS } from './stats';

export const ARMY_BUDGET = 1200;
export const MAX_ARMY_SIZE = 30;

// Cost per unit: indexed by level (1, 2, 3)
export const UNIT_COSTS: Record<string, number[]> = {
  warrior:     [35, 95, 205],
  archer:      [35, 95, 205],
  rogue:       [45, 105, 215],
  mage:        [45, 105, 215],
  paladin:     [55, 115, 225],
  necromancer: [55, 115, 225],
};

export function getUnitCost(classId: string, level: number): number {
  const costs = UNIT_COSTS[classId];
  if (!costs) return 99;
  return costs[level - 1] ?? 99;
}

export function getArmyTotalCost(units: ArmyUnit[]): number {
  return units.reduce((sum, u) => sum + getUnitCost(u.classId, u.level) * u.count, 0);
}

export function getArmyTotalUnits(units: ArmyUnit[]): number {
  return units.reduce((sum, u) => sum + u.count, 0);
}

export const ARMY_PRESETS: { name: string; units: ArmyUnit[] }[] = [
  {
    name: 'Balanced',
    units: [
      { classId: 'warrior', level: 1, count: 4 },
      { classId: 'archer', level: 1, count: 3 },
      { classId: 'paladin', level: 1, count: 2 },
      { classId: 'mage', level: 1, count: 2 },
      { classId: 'rogue', level: 1, count: 2 },
      { classId: 'necromancer', level: 1, count: 1 },
    ],
  },
  {
    name: 'Elite Few',
    units: [
      { classId: 'warrior', level: 3, count: 2 },
      { classId: 'paladin', level: 3, count: 2 },
      { classId: 'mage', level: 3, count: 2 },
    ],
  },
  {
    name: 'Zerg Rush',
    units: [
      { classId: 'warrior', level: 1, count: 8 },
      { classId: 'rogue', level: 1, count: 6 },
      { classId: 'archer', level: 1, count: 6 },
    ],
  },
  {
    name: 'Ranged Heavy',
    units: [
      { classId: 'archer', level: 2, count: 4 },
      { classId: 'mage', level: 2, count: 3 },
      { classId: 'warrior', level: 1, count: 3 },
      { classId: 'paladin', level: 1, count: 2 },
    ],
  },
];

export function generateRandomArmy(budget: number): ArmyComposition {
  const classIds = Object.keys(UNIT_COSTS);
  const units: ArmyUnit[] = [];
  let remaining = budget;
  let totalUnits = 0;

  // Ensure at least 1 melee and 1 ranged
  const meleeClasses = classIds.filter((id) => CLASS_STATS[id]?.attackType === 'melee');
  const rangedClasses = classIds.filter((id) => CLASS_STATS[id]?.attackType === 'ranged');

  const pickMelee = meleeClasses[Math.floor(Math.random() * meleeClasses.length)];
  const pickRanged = rangedClasses[Math.floor(Math.random() * rangedClasses.length)];

  const meleeCost = getUnitCost(pickMelee, 1);
  const rangedCost = getUnitCost(pickRanged, 1);
  units.push({ classId: pickMelee, level: 1, count: 1 });
  units.push({ classId: pickRanged, level: 1, count: 1 });
  remaining -= meleeCost + rangedCost;
  totalUnits += 2;

  // Fill randomly
  while (remaining > 0 && totalUnits < MAX_ARMY_SIZE) {
    const classId = classIds[Math.floor(Math.random() * classIds.length)];
    const level = Math.random() < 0.5 ? 1 : Math.random() < 0.7 ? 2 : 3;
    const cost = getUnitCost(classId, level);
    if (cost > remaining) {
      // Try level 1 of cheapest
      const cheapest = classIds.reduce((best, id) => {
        const c = getUnitCost(id, 1);
        return c < getUnitCost(best, 1) ? id : best;
      }, classIds[0]);
      const cheapCost = getUnitCost(cheapest, 1);
      if (cheapCost > remaining) break;
      const existing = units.find((u) => u.classId === cheapest && u.level === 1);
      if (existing) {
        existing.count++;
      } else {
        units.push({ classId: cheapest, level: 1, count: 1 });
      }
      remaining -= cheapCost;
      totalUnits++;
      continue;
    }

    const existing = units.find((u) => u.classId === classId && u.level === level);
    if (existing) {
      existing.count++;
    } else {
      units.push({ classId: classId, level, count: 1 });
    }
    remaining -= cost;
    totalUnits++;
  }

  return { units, totalPoints: budget - remaining };
}
