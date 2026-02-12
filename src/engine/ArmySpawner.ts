import * as THREE from 'three';
import { ArmyUnit } from '../types/army';
import { UnitData } from '../types/game';
import { HeroClass } from '../types/hero';
import { HERO_CLASSES } from '../constants/classes';
import { getScaledStats } from '../constants/stats';
import { buildCharacter, createHealthBar } from './VoxelCharacterBuilder';

function getHeroClassForUnit(classId: string, level: number): HeroClass {
  const base = HERO_CLASSES.find((c) => c.id === classId) ?? HERO_CLASSES[0];
  return { ...base, level };
}

const MELEE_IDS = new Set(['warrior', 'paladin', 'rogue']);

export function spawnArmy(
  scene: THREE.Scene,
  units: ArmyUnit[],
  team: 'ally' | 'enemy',
  zSide: number, // -1 for south (player army), +1 for north (enemy army)
  outArray: THREE.Group[]
): void {
  // Split into melee (front) and ranged (back)
  const melee: { heroClass: HeroClass; count: number }[] = [];
  const ranged: { heroClass: HeroClass; count: number }[] = [];

  for (const u of units) {
    const heroClass = getHeroClassForUnit(u.classId, u.level);
    if (MELEE_IDS.has(u.classId)) {
      melee.push({ heroClass, count: u.count });
    } else {
      ranged.push({ heroClass, count: u.count });
    }
  }

  const baseZ = zSide * 65;
  const frontZ = baseZ - zSide * 8; // melee row closer to center
  const backZ = baseZ + zSide * 8;  // ranged row further back

  spawnRow(scene, melee, team, frontZ, outArray);
  spawnRow(scene, ranged, team, backZ, outArray);
}

function spawnRow(
  scene: THREE.Scene,
  groups: { heroClass: HeroClass; count: number }[],
  team: 'ally' | 'enemy',
  z: number,
  outArray: THREE.Group[]
) {
  // Flatten to individual units
  const allUnits: HeroClass[] = [];
  for (const g of groups) {
    for (let i = 0; i < g.count; i++) {
      allUnits.push(g.heroClass);
    }
  }

  const spacing = 2.5;
  const totalWidth = (allUnits.length - 1) * spacing;
  const startX = -totalWidth / 2;

  for (let i = 0; i < allUnits.length; i++) {
    const heroClass = allUnits[i];
    const stats = getScaledStats(heroClass.id, heroClass.level);
    const unit = buildCharacter({ heroClass, team });
    const x = startX + i * spacing + (Math.random() - 0.5) * 0.5;
    const zOff = (Math.random() - 0.5) * 1.5;
    unit.position.set(x, 0, z + zOff);

    // Face toward center
    unit.rotation.y = z > 0 ? Math.PI : 0;

    const data = unit.userData as UnitData;
    data.team = team;
    data.classId = heroClass.id;
    data.unitLevel = heroClass.level;
    data.attackType = stats.attackType;
    data.attackRange = stats.range;
    data.damageMin = stats.attackMin;
    data.damageMax = stats.attackMax;
    data.health = stats.hp;
    data.maxHealth = stats.hp;
    data.speed = stats.speed * (0.80 + Math.random() * 0.35);
    data.attackTimer = Math.random();
    data.attackCooldown = stats.attackType === 'ranged'
      ? 1.8 + Math.random() * 0.6
      : 1.0 + Math.random() * 0.5;
    data.isAttacking = false;
    data.attackTime = 0;
    data.stunTimer = 0;
    data.isBlocking = false;
    data.blockTimer = 0;
    data.hitThisSwing = false;
    data.strafeDir = Math.random() > 0.5 ? 1 : -1;
    data.stateTimer = 0;

    createHealthBar(unit);
    scene.add(unit);
    outArray.push(unit);
  }
}

export function spawnPlayerUnit(
  scene: THREE.Scene,
  classId: string,
  level: number,
  z: number
): THREE.Group {
  const heroClass = getHeroClassForUnit(classId, level);
  const stats = getScaledStats(classId, level);
  const player = buildCharacter({ heroClass, team: 'player' });
  player.position.set(0, 0, z);
  player.rotation.y = z < 0 ? 0 : Math.PI;

  const data = player.userData as UnitData;
  data.team = 'player';
  data.classId = classId;
  data.unitLevel = level;
  data.health = stats.hp;
  data.maxHealth = stats.hp;

  scene.add(player);
  return player;
}
