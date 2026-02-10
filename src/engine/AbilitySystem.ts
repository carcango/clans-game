import * as THREE from 'three';
import { GameState, UnitData, ToastType } from '../types/game';
import { ClassStats, CLASS_STATS } from '../constants/stats';
import { ParticleSystem } from './ParticleSystem';
import { CombatSystem } from './CombatSystem';
import { updateHealthBar, buildCharacter } from './VoxelCharacterBuilder';
import { HERO_CLASSES } from '../constants/classes';
import { HeroClass } from '../types/hero';

interface AbilityProjectile {
  mesh: THREE.Mesh;
  update: (dt: number) => boolean;
  damageMin: number;
  damageMax: number;
}

export class AbilitySystem {
  private particles: ParticleSystem;
  private combatSystem: CombatSystem;
  private scene: THREE.Scene;
  private projectiles: AbilityProjectile[] = [];

  constructor(scene: THREE.Scene, particles: ParticleSystem, combatSystem: CombatSystem) {
    this.scene = scene;
    this.particles = particles;
    this.combatSystem = combatSystem;
  }

  activateAbility(
    classId: string,
    stats: ClassStats,
    state: GameState,
    player: THREE.Group,
    enemies: THREE.Group[],
    allies: THREE.Group[],
    heroClass: HeroClass,
    addCombatLog: (text: string, type?: ToastType) => void,
    addAlly: (ally: THREE.Group) => void
  ): boolean {
    if (state.abilityCooldown > 0) return false;
    if (state.playerStamina < stats.abilityCost) return false;

    let success = false;

    switch (classId) {
      case 'warrior':
        success = this.shieldBash(player, enemies, stats, addCombatLog);
        break;
      case 'archer':
        success = this.arrowVolley(player, state.cameraAngleY, stats, addCombatLog);
        break;
      case 'mage':
        success = this.fireball(player, enemies, stats, addCombatLog);
        break;
      case 'paladin':
        success = this.holyAura(player, allies, stats, addCombatLog);
        break;
      case 'rogue':
        state.backstabReady = true;
        state.backstabTimer = 5;
        addCombatLog('Backstab ready - next hit deals 3x damage! (5s)', 'info');
        success = true;
        break;
      case 'necromancer':
        success = this.raiseDead(player, enemies, allies, stats, heroClass, addCombatLog, addAlly);
        break;
      default:
        return false;
    }

    if (success) {
      state.playerStamina -= stats.abilityCost;
      state.abilityCooldown = stats.abilityCooldownMax;
      state.abilityActive = true;
    }

    return success;
  }

  private shieldBash(
    player: THREE.Group,
    enemies: THREE.Group[],
    stats: ClassStats,
    addCombatLog: (text: string, type?: ToastType) => void
  ): boolean {
    const fwd = new THREE.Vector3(-Math.sin(player.rotation.y), 0, -Math.cos(player.rotation.y));
    let hitCount = 0;
    const bashDmg = Math.floor((stats.attackMin + stats.attackMax) * 0.25);

    enemies.forEach((enemy) => {
      const data = enemy.userData as UnitData;
      if (data.health <= 0) return;
      const toE = new THREE.Vector3().subVectors(enemy.position, player.position);
      toE.y = 0;
      const dist = toE.length();
      if (dist < 4 && fwd.dot(toE.normalize()) > 0.2) {
        data.stunTimer = 1.5;
        data.health -= bashDmg;
        const kb = toE.normalize().multiplyScalar(3);
        enemy.position.add(kb);
        this.particles.createBloodEffect(enemy.position);
        if (data.health > 0) {
          updateHealthBar(enemy);
        }
        hitCount++;
      }
    });

    this.particles.createShieldBashEffect(player.position);
    addCombatLog(`Shield Bash hit ${hitCount} enemies for ${bashDmg} each!`, 'info');
    return true;
  }

  private arrowVolley(
    player: THREE.Group,
    cameraAngleY: number,
    stats: ClassStats,
    addCombatLog: (text: string, type?: ToastType) => void
  ): boolean {
    const baseFwd = new THREE.Vector3(Math.sin(cameraAngleY), 0, Math.cos(cameraAngleY));
    const spreadAngles = [-0.3, -0.15, 0, 0.15, 0.3];

    spreadAngles.forEach((angle) => {
      const dir = baseFwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      const spawnPos = player.position.clone().add(dir.clone().multiplyScalar(2));
      const proj = this.particles.createProjectile(
        spawnPos,
        dir,
        0xe9c46a,
        35,
        () => {}
      );

      this.projectiles.push({
        mesh: proj.mesh,
        update: proj.update,
        damageMin: stats.attackMin,
        damageMax: stats.attackMax,
      });
    });

    addCombatLog('Arrow Volley fired!', 'info');
    return true;
  }

  private fireball(
    player: THREE.Group,
    enemies: THREE.Group[],
    stats: ClassStats,
    addCombatLog: (text: string, type?: ToastType) => void
  ): boolean {
    const fwd = new THREE.Vector3(-Math.sin(player.rotation.y), 0, -Math.cos(player.rotation.y));
    const targetPos = player.position.clone().add(fwd.multiplyScalar(8));

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
    addCombatLog(`Fireball dealt ${totalDmg} total damage!`, 'info');
    return true;
  }

  private holyAura(
    player: THREE.Group,
    allies: THREE.Group[],
    stats: ClassStats,
    addCombatLog: (text: string, type?: ToastType) => void
  ): boolean {
    const healAmount = Math.floor(stats.attackMax * 0.5);
    let healed = 0;
    allies.forEach((ally) => {
      const data = ally.userData as UnitData;
      if (data.health <= 0) return;
      const dist = ally.position.distanceTo(player.position);
      if (dist < 10) {
        data.health = Math.min(data.maxHealth, data.health + healAmount);
        updateHealthBar(ally);
        this.particles.createHealEffect(ally.position);
        healed++;
      }
    });

    this.particles.createHealEffect(player.position);
    addCombatLog(`Holy Aura healed ${healed} allies for ${healAmount} HP!`, 'info');
    return true;
  }

  private raiseDead(
    player: THREE.Group,
    enemies: THREE.Group[],
    allies: THREE.Group[],
    stats: ClassStats,
    heroClass: HeroClass,
    addCombatLog: (text: string, type?: ToastType) => void,
    addAlly: (ally: THREE.Group) => void
  ): boolean {
    let nearest: THREE.Group | null = null;
    let nearestDist = Infinity;
    enemies.forEach((enemy) => {
      const data = enemy.userData as UnitData;
      if (data.health > 0) return;
      const dist = enemy.position.distanceTo(player.position);
      if (dist < 15 && dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    });

    if (!nearest) {
      addCombatLog('No dead enemies nearby to raise!', 'info');
      return false;
    }

    const pos = (nearest as THREE.Group).position.clone();
    const randomClass = HERO_CLASSES[Math.floor(Math.random() * HERO_CLASSES.length)];
    const classStats = CLASS_STATS[randomClass.id];
    const ally = buildCharacter({ heroClass: randomClass, team: 'ally' });
    ally.position.copy(pos);

    const scaledHp = Math.floor(40 * (stats.hp / 90));
    const allyData = ally.userData as UnitData;
    allyData.team = 'ally';
    allyData.classId = randomClass.id;
    allyData.attackType = classStats.attackType;
    allyData.attackRange = classStats.range;
    allyData.damageMin = classStats.attackMin;
    allyData.damageMax = classStats.attackMax;
    allyData.health = scaledHp;
    allyData.maxHealth = scaledHp;
    allyData.speed = 3.5;
    allyData.attackTimer = Math.random();
    allyData.attackCooldown = classStats.attackType === 'ranged' ? 1.2 : 0.7;
    allyData.isAttacking = false;
    allyData.attackTime = 0;
    allyData.stunTimer = 0;
    allyData.isBlocking = false;
    allyData.blockTimer = 0;
    allyData.hitThisSwing = false;

    this.particles.createMagicEffect(pos, 0x95d5b2, 3);
    addAlly(ally);
    addCombatLog(`Raised a dead enemy as an ally! (${scaledHp} HP)`, 'info');
    return true;
  }

  update(
    dt: number,
    state: GameState,
    enemies: THREE.Group[],
    onKillEnemy: (enemy: THREE.Group) => void,
    addCombatLog: (text: string, type?: ToastType) => void
  ) {
    if (state.abilityCooldown > 0) {
      state.abilityCooldown = Math.max(0, state.abilityCooldown - dt);
    }
    if (state.abilityCooldown <= 0) {
      state.abilityActive = false;
    }

    // Backstab timeout
    if (state.backstabReady && state.backstabTimer > 0) {
      state.backstabTimer -= dt;
      if (state.backstabTimer <= 0) {
        state.backstabReady = false;
        state.backstabTimer = 0;
        addCombatLog('Backstab expired!', 'info');
      }
    }

    // Update Arrow Volley projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      const alive = proj.update(dt);
      if (!alive) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const result = this.combatSystem.checkRangedHit(
        proj.mesh.position,
        enemies,
        proj.damageMin,
        proj.damageMax,
        0,
        onKillEnemy
      );

      if (result.hit) {
        this.scene.remove(proj.mesh);
        proj.mesh.geometry.dispose();
        (proj.mesh.material as THREE.Material).dispose();
        this.projectiles.splice(i, 1);
      }
    }
  }
}
