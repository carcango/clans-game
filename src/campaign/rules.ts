import { ArmyUnit } from '../types/army';
import {
  CampaignHero,
  CampaignParty,
  CampaignSkillId,
  CampaignState,
  CampaignTroopStack,
} from '../types/campaign';
import {
  BASE_PARTY_CAP,
  BATTLE_SIDE_CAP,
  MAX_PARTY_CAP,
  TROOP_TIER_XP_REQUIREMENTS,
  TROOP_UPGRADE_COSTS,
} from '../constants/campaign';

export function getStackTroopCount(stacks: CampaignTroopStack[]): number {
  return stacks.reduce((sum, stack) => sum + stack.count, 0);
}

export function getPartyCap(hero: CampaignHero): number {
  const leadership = hero.skills.leadership.level;
  return Math.min(MAX_PARTY_CAP, BASE_PARTY_CAP + leadership * 2);
}

export function getSkillRequirementLevel(skillLevel: number): number {
  return Math.floor(skillLevel / 3) + 1;
}

export function canUpgradeStack(stack: CampaignTroopStack): boolean {
  if (stack.tier === 1) return stack.xp >= TROOP_TIER_XP_REQUIREMENTS['1-2'];
  if (stack.tier === 2) return stack.xp >= TROOP_TIER_XP_REQUIREMENTS['2-3'];
  return false;
}

export function getUpgradeCostForStack(stack: CampaignTroopStack): number {
  if (stack.tier === 1) return TROOP_UPGRADE_COSTS['1-2'];
  if (stack.tier === 2) return TROOP_UPGRADE_COSTS['2-3'];
  return 0;
}

export function upgradeStack(stack: CampaignTroopStack): CampaignTroopStack {
  if (stack.tier >= 3) return stack;
  const nextTier = (stack.tier + 1) as 2 | 3;
  return {
    ...stack,
    tier: nextTier,
    level: nextTier,
    xp: 0,
  };
}

export function mergeStacks(stacks: CampaignTroopStack[]): CampaignTroopStack[] {
  const merged = new Map<string, CampaignTroopStack>();
  for (const stack of stacks) {
    if (stack.count <= 0) continue;
    const key = `${stack.classId}:${stack.level}`;
    const existing = merged.get(key);
    if (existing) {
      existing.count += stack.count;
      existing.xp = Math.max(existing.xp, stack.xp);
    } else {
      merged.set(key, { ...stack });
    }
  }
  return Array.from(merged.values());
}

export function sortStacksForDeployment(stacks: CampaignTroopStack[]): CampaignTroopStack[] {
  return [...stacks].sort((a, b) => {
    if (b.tier !== a.tier) return b.tier - a.tier;
    if (b.count !== a.count) return b.count - a.count;
    return a.classId.localeCompare(b.classId);
  });
}

export function buildArmyUnitsForBattle(stacks: CampaignTroopStack[], cap: number): ArmyUnit[] {
  const sorted = sortStacksForDeployment(stacks);
  const units: ArmyUnit[] = [];
  let remaining = cap;

  for (const stack of sorted) {
    if (remaining <= 0) break;
    const count = Math.min(stack.count, remaining);
    if (count <= 0) continue;
    units.push({ classId: stack.classId, level: stack.level, count });
    remaining -= count;
  }

  return units;
}

export function splitStacksForDeployment(
  stacks: CampaignTroopStack[],
  deployedArmy: ArmyUnit[]
): { deployedStacks: CampaignTroopStack[]; reserveStacks: CampaignTroopStack[] } {
  const deployedLeft = new Map<string, number>();
  for (const unit of deployedArmy) {
    const key = `${unit.classId}:${unit.level}`;
    deployedLeft.set(key, (deployedLeft.get(key) ?? 0) + unit.count);
  }

  const deployedStacks: CampaignTroopStack[] = [];
  const reserveStacks: CampaignTroopStack[] = [];

  for (const stack of stacks) {
    const key = `${stack.classId}:${stack.level}`;
    const needed = deployedLeft.get(key) ?? 0;
    if (needed <= 0) {
      reserveStacks.push({ ...stack });
      continue;
    }

    const deployedCount = Math.min(needed, stack.count);
    if (deployedCount > 0) {
      deployedStacks.push({ ...stack, count: deployedCount });
    }

    const remaining = stack.count - deployedCount;
    if (remaining > 0) {
      reserveStacks.push({ ...stack, count: remaining });
    }

    deployedLeft.set(key, needed - deployedCount);
  }

  return { deployedStacks, reserveStacks };
}

export function applySurvivorCounts(
  previousStacks: CampaignTroopStack[],
  survivors: { classId: string; level: number; count: number }[],
  xpGainPerSurvivor = 0
): CampaignTroopStack[] {
  const survivorMap = new Map<string, number>();
  for (const survivor of survivors) {
    const key = `${survivor.classId}:${survivor.level}`;
    survivorMap.set(key, (survivorMap.get(key) ?? 0) + survivor.count);
  }

  const updated: CampaignTroopStack[] = [];
  for (const stack of previousStacks) {
    const key = `${stack.classId}:${stack.level}`;
    const survivorCount = survivorMap.get(key) ?? 0;
    if (survivorCount <= 0) continue;
    updated.push({
      ...stack,
      count: survivorCount,
      xp: stack.xp + xpGainPerSurvivor,
    });
  }

  return mergeStacks(updated);
}

export function calculateAverageEnemyTier(enemyArmy: ArmyUnit[]): number {
  let weightedTierTotal = 0;
  let total = 0;

  for (const unit of enemyArmy) {
    weightedTierTotal += unit.level * unit.count;
    total += unit.count;
  }

  return total > 0 ? weightedTierTotal / total : 1;
}

export function calculateGoldReward(enemyCasualties: number, lootingLevel: number): number {
  const base = 80 + enemyCasualties * 12;
  const bonusMultiplier = 1 + lootingLevel * 0.1;
  return Math.floor(base * bonusMultiplier);
}

export function calculateHeroXpReward(avgEnemyTier: number, victory: boolean): number {
  if (!victory) return 10;
  return Math.floor(25 + avgEnemyTier * 15);
}

export function getHeroBattleModifiers(hero: CampaignHero) {
  return {
    maxHealthFlat: hero.skills.ironflesh.level * 8,
    staminaFlat: hero.attributes.agility.value * 2,
    attackPct: hero.skills.power.level * 0.06,
    speedPct: hero.skills.athletics.level * 0.03,
  };
}

export function getTacticsAllyDamageMultiplier(hero: CampaignHero) {
  return 1 + hero.skills.tactics.level * 0.04;
}

export function getTrackingModifier(hero: CampaignHero) {
  return hero.skills.tracking.level;
}

export function getSelectedEnemy(state: CampaignState): CampaignParty | null {
  if (!state.selectedEnemyId) return null;
  return state.enemyParties.find((party) => party.id === state.selectedEnemyId) ?? null;
}

export function getSelectedLocation(state: CampaignState) {
  if (!state.selectedLocationId) return null;
  return state.locations.find((location) => location.id === state.selectedLocationId) ?? null;
}

export function getDeployCapForPlayer(): number {
  return BATTLE_SIDE_CAP - 1;
}

export const TRACKABLE_SKILLS: CampaignSkillId[] = [
  'ironflesh',
  'power',
  'athletics',
  'leadership',
  'tactics',
  'looting',
  'tracking',
];
