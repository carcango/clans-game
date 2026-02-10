import * as THREE from 'three';
import { GameState, UnitData, ToastType } from '../types/game';
import { HeroClass } from '../types/hero';
import { buildCharacter, createHealthBar } from './VoxelCharacterBuilder';
import { HERO_CLASSES } from '../constants/classes';
import { CLASS_STATS } from '../constants/stats';
import {
  BASE_ENEMIES_PER_WAVE, BASE_ALLIES_PER_WAVE,
  MAX_ENEMIES_PER_WAVE, MAX_ALLIES_PER_WAVE,
  WAVE_TRANSITION_DELAY, SPAWN_DIST_MIN, SPAWN_DIST_MAX,
  ALLY_SPAWN_DIST_MIN, ALLY_SPAWN_DIST_MAX,
} from '../constants/game';

const MELEE_CLASSES = HERO_CLASSES.filter((c) => CLASS_STATS[c.id]?.attackType === 'melee');
const RANGED_CLASSES = HERO_CLASSES.filter((c) => CLASS_STATS[c.id]?.attackType === 'ranged');

function pickRandomClass(): HeroClass {
  // 60% melee, 40% ranged
  const pool = Math.random() < 0.6 ? MELEE_CLASSES : RANGED_CLASSES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export class WaveManager {
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnInitialWave(
    state: GameState,
    player: THREE.Group,
    enemies: THREE.Group[],
    allies: THREE.Group[],
    heroClass: HeroClass
  ) {
    for (let i = 0; i < state.enemiesPerWave; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 20 + Math.random() * 20;
      this.spawnEnemy(enemies, state, Math.cos(a) * d, Math.sin(a) * d);
    }
    for (let i = 0; i < state.alliesPerWave; i++) {
      const a = (i / state.alliesPerWave) * Math.PI * 2;
      const d = 3 + Math.random() * 3;
      this.spawnAlly(allies, state, Math.cos(a) * d, Math.sin(a) * d);
    }
  }

  update(
    dt: number,
    state: GameState,
    player: THREE.Group,
    enemies: THREE.Group[],
    allies: THREE.Group[],
    showWaveBanner: (text: string) => void,
    addCombatLog: (text: string, type?: ToastType) => void
  ) {
    // Check wave complete
    const aliveEnemies = enemies.filter((e) => (e.userData as UnitData).health > 0).length;
    if (aliveEnemies === 0 && !state.waveTransition) {
      state.waveTransition = true;
      state.waveTransitionTimer = WAVE_TRANSITION_DELAY;
      state.wave++;
      state.enemiesPerWave = Math.min(MAX_ENEMIES_PER_WAVE, BASE_ENEMIES_PER_WAVE + state.wave * 3);
      state.alliesPerWave = Math.min(MAX_ALLIES_PER_WAVE, BASE_ALLIES_PER_WAVE - 2 + state.wave);
      showWaveBanner(`Wave ${state.wave} — Reinforcements!`);
      addCombatLog(`Wave ${state.wave} incoming!`, 'success');
    }

    // Spawn new wave after delay
    if (state.waveTransition) {
      state.waveTransitionTimer -= dt;
      if (state.waveTransitionTimer <= 0) {
        state.waveTransition = false;

        for (let i = 0; i < state.enemiesPerWave; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = SPAWN_DIST_MIN + Math.random() * (SPAWN_DIST_MAX - SPAWN_DIST_MIN);
          this.spawnEnemy(
            enemies,
            state,
            player.position.x + Math.cos(angle) * dist,
            player.position.z + Math.sin(angle) * dist
          );
        }

        const aliveAllies = allies.filter((a) => (a.userData as UnitData).health > 0).length;
        const reinforcements = Math.max(2, state.alliesPerWave - aliveAllies);
        for (let i = 0; i < reinforcements; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = ALLY_SPAWN_DIST_MIN + Math.random() * (ALLY_SPAWN_DIST_MAX - ALLY_SPAWN_DIST_MIN);
          this.spawnAlly(
            allies,
            state,
            player.position.x + Math.cos(angle) * dist,
            player.position.z + Math.sin(angle) * dist
          );
        }
      }
    }
  }

  private spawnEnemy(enemies: THREE.Group[], state: GameState, x: number, z: number) {
    const heroClass = pickRandomClass();
    const classStats = CLASS_STATS[heroClass.id];
    const enemy = buildCharacter({ heroClass, team: 'enemy' });
    enemy.position.set(x, 0, z);

    const data = enemy.userData as UnitData;
    data.team = 'enemy';
    data.classId = heroClass.id;
    data.attackType = classStats.attackType;
    data.attackRange = classStats.range;
    data.damageMin = classStats.attackMin;
    data.damageMax = classStats.attackMax;
    data.health = 40 + state.wave * 10;
    data.maxHealth = data.health;
    data.speed = classStats.speed * (0.55 + Math.random() * 0.15) + state.wave * 0.2;
    data.attackTimer = Math.random();
    data.attackCooldown = classStats.attackType === 'ranged'
      ? 1.2 + Math.random() * 0.6
      : 0.8 + Math.random() * 0.6;
    data.isAttacking = false;
    data.attackTime = 0;
    data.stunTimer = 0;
    data.isBlocking = false;
    data.blockTimer = 0;
    data.strafeDir = Math.random() > 0.5 ? 1 : -1;
    data.stateTimer = 0;
    data.hitThisSwing = false;

    createHealthBar(enemy);
    this.scene.add(enemy);
    enemies.push(enemy);
  }

  private spawnAlly(allies: THREE.Group[], state: GameState, x: number, z: number) {
    const heroClass = pickRandomClass();
    const classStats = CLASS_STATS[heroClass.id];
    const ally = buildCharacter({ heroClass, team: 'ally' });
    ally.position.set(x, 0, z);

    const data = ally.userData as UnitData;
    data.team = 'ally';
    data.classId = heroClass.id;
    data.attackType = classStats.attackType;
    data.attackRange = classStats.range;
    data.damageMin = classStats.attackMin;
    data.damageMax = classStats.attackMax;
    data.health = 50 + state.wave * 8;
    data.maxHealth = data.health;
    data.speed = classStats.speed * (0.55 + Math.random() * 0.15) + state.wave * 0.2;
    data.attackTimer = Math.random();
    data.attackCooldown = classStats.attackType === 'ranged'
      ? 1.2 + Math.random() * 0.5
      : 0.7 + Math.random() * 0.5;
    data.isAttacking = false;
    data.attackTime = 0;
    data.stunTimer = 0;
    data.isBlocking = false;
    data.blockTimer = 0;
    data.hitThisSwing = false;

    createHealthBar(ally);
    this.scene.add(ally);
    allies.push(ally);
  }
}
