import * as THREE from 'three';
import { GameState, UnitData } from '../types/game';
import { ClassStats, CLASS_STATS } from '../constants/stats';
import { ParticleSystem } from './ParticleSystem';
import { updateHealthBar, buildCharacter } from './VoxelCharacterBuilder';
import { HERO_CLASSES } from '../constants/classes';
import { HeroClass } from '../types/hero';

export class AbilitySystem {
  private particles: ParticleSystem;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, particles: ParticleSystem) {
    this.scene = scene;
    this.particles = particles;
  }

  activateAbility(
    classId: string,
    stats: ClassStats,
    state: GameState,
    player: THREE.Group,
    enemies: THREE.Group[],
    allies: THREE.Group[],
    heroClass: HeroClass,
    addCombatLog: (text: string) => void,
    addAlly: (ally: THREE.Group) => void
  ): boolean {
    if (state.abilityCooldown > 0) return false;
    if (state.playerStamina < stats.abilityCost) return false;

    state.playerStamina -= stats.abilityCost;
    state.abilityCooldown = stats.abilityCooldownMax;
    state.abilityActive = true;

    switch (classId) {
      case 'warrior':
        return this.shieldBash(player, enemies, addCombatLog);
      case 'archer':
        return this.arrowVolley(player, enemies, stats, addCombatLog);
      case 'mage':
        return this.fireball(player, enemies, stats, addCombatLog);
      case 'paladin':
        return this.holyAura(player, allies, addCombatLog);
      case 'rogue':
        state.backstabReady = true;
        addCombatLog('Backstab ready - next hit deals 3x damage!');
        return true;
      case 'necromancer':
        return this.raiseDead(player, enemies, allies, heroClass, addCombatLog, addAlly);
      default:
        return false;
    }
  }

  private shieldBash(
    player: THREE.Group,
    enemies: THREE.Group[],
    addCombatLog: (text: string) => void
  ): boolean {
    const fwd = new THREE.Vector3(-Math.sin(player.rotation.y), 0, -Math.cos(player.rotation.y));
    let hitCount = 0;

    enemies.forEach((enemy) => {
      const data = enemy.userData as UnitData;
      if (data.health <= 0) return;
      const toE = new THREE.Vector3().subVectors(enemy.position, player.position);
      toE.y = 0;
      const dist = toE.length();
      if (dist < 4 && fwd.dot(toE.normalize()) > 0.2) {
        data.stunTimer = 1.5;
        const kb = toE.normalize().multiplyScalar(3);
        enemy.position.add(kb);
        this.particles.createBlockSparks(enemy.position);
        hitCount++;
      }
    });

    addCombatLog(`Shield Bash hit ${hitCount} enemies!`);
    return true;
  }

  private arrowVolley(
    player: THREE.Group,
    enemies: THREE.Group[],
    stats: ClassStats,
    addCombatLog: (text: string) => void
  ): boolean {
    const baseFwd = new THREE.Vector3(-Math.sin(player.rotation.y), 0, -Math.cos(player.rotation.y));
    const spreadAngles = [-0.3, -0.15, 0, 0.15, 0.3];

    spreadAngles.forEach((angle) => {
      const dir = baseFwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      const proj = this.particles.createProjectile(
        player.position.clone(),
        dir,
        0xe9c46a,
        35,
        (_pos) => {}
      );

      // Simple projectile tracking
      const checkHits = () => {
        const alive = proj.update(0.016);
        if (!alive) return;

        // Check hits against enemies
        for (const enemy of enemies) {
          const eData = enemy.userData as UnitData;
          if (eData.health <= 0) continue;
          // Approximate hit check using small radius
        }
        requestAnimationFrame(checkHits);
      };
      // We'll handle projectile hits in the main game loop instead
    });

    addCombatLog('Arrow Volley fired!');
    return true;
  }

  private fireball(
    player: THREE.Group,
    enemies: THREE.Group[],
    stats: ClassStats,
    addCombatLog: (text: string) => void
  ): boolean {
    const fwd = new THREE.Vector3(-Math.sin(player.rotation.y), 0, -Math.cos(player.rotation.y));
    const targetPos = player.position.clone().add(fwd.multiplyScalar(8));

    // AoE damage at target position
    let totalDmg = 0;
    enemies.forEach((enemy) => {
      const data = enemy.userData as UnitData;
      if (data.health <= 0) return;
      const dist = enemy.position.distanceTo(targetPos);
      if (dist < 5) {
        const dmg = stats.attackMin + Math.floor(Math.random() * (stats.attackMax - stats.attackMin));
        data.health -= dmg;
        data.stunTimer = 0.5;
        totalDmg += dmg;
        this.particles.createBloodEffect(enemy.position);
        if (data.health > 0) updateHealthBar(enemy);
      }
    });

    this.particles.createMagicEffect(targetPos, 0xff4400, 5);
    addCombatLog(`Fireball dealt ${totalDmg} total damage!`);
    return true;
  }

  private holyAura(
    player: THREE.Group,
    allies: THREE.Group[],
    addCombatLog: (text: string) => void
  ): boolean {
    let healed = 0;
    allies.forEach((ally) => {
      const data = ally.userData as UnitData;
      if (data.health <= 0) return;
      const dist = ally.position.distanceTo(player.position);
      if (dist < 10) {
        data.health = Math.min(data.maxHealth, data.health + 15);
        updateHealthBar(ally);
        this.particles.createHealEffect(ally.position);
        healed++;
      }
    });

    this.particles.createHealEffect(player.position);
    addCombatLog(`Holy Aura healed ${healed} allies!`);
    return true;
  }

  private raiseDead(
    player: THREE.Group,
    enemies: THREE.Group[],
    allies: THREE.Group[],
    heroClass: HeroClass,
    addCombatLog: (text: string) => void,
    addAlly: (ally: THREE.Group) => void
  ): boolean {
    // Find nearest dead enemy
    let nearest: THREE.Group | null = null;
    let nearestDist = Infinity;
    enemies.forEach((enemy) => {
      const data = enemy.userData as UnitData;
      if (data.health > 0) return; // Only target dead enemies
      const dist = enemy.position.distanceTo(player.position);
      if (dist < 15 && dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    });

    if (!nearest) {
      // If no dead enemies, find lowest health enemy
      addCombatLog('No dead enemies nearby to raise!');
      return false;
    }

    // Convert: create a new ally at that position with random class
    const pos = (nearest as THREE.Group).position.clone();
    const randomClass = HERO_CLASSES[Math.floor(Math.random() * HERO_CLASSES.length)];
    const classStats = CLASS_STATS[randomClass.id];
    const ally = buildCharacter({ heroClass: randomClass, team: 'ally' });
    ally.position.copy(pos);
    const allyData = ally.userData as UnitData;
    allyData.team = 'ally';
    allyData.classId = randomClass.id;
    allyData.attackType = classStats.attackType;
    allyData.attackRange = classStats.range;
    allyData.damageMin = classStats.attackMin;
    allyData.damageMax = classStats.attackMax;
    allyData.health = 40;
    allyData.maxHealth = 40;
    allyData.speed = 3.5;
    allyData.attackTimer = Math.random();
    allyData.attackCooldown = classStats.attackType === 'ranged' ? 1.8 : 1.0;
    allyData.isAttacking = false;
    allyData.attackTime = 0;
    allyData.stunTimer = 0;
    allyData.isBlocking = false;
    allyData.blockTimer = 0;
    allyData.hitThisSwing = false;

    this.particles.createMagicEffect(pos, 0x95d5b2, 3);
    addAlly(ally);
    addCombatLog('Raised a dead enemy as an ally!');
    return true;
  }

  update(dt: number, state: GameState) {
    if (state.abilityCooldown > 0) {
      state.abilityCooldown = Math.max(0, state.abilityCooldown - dt);
    }
    if (state.abilityCooldown <= 0) {
      state.abilityActive = false;
    }
  }
}
