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
  aoeRadius: number;
  stunDuration: number;
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

  private setPlayerOpacity(player: THREE.Group, opacity: number) {
    player.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
        child.material.transparent = opacity < 1;
        child.material.opacity = opacity;
      }
    });
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
        success = this.shieldBash(player, state.cameraAngleY, enemies, stats, addCombatLog);
        break;
      case 'archer':
        success = this.arrowVolley(player, state.cameraAngleY, stats, addCombatLog);
        break;
      case 'mage':
        success = this.fireball(player, state.cameraAngleY, enemies, stats, addCombatLog);
        break;
      case 'paladin':
        success = this.holyAura(player, allies, stats, addCombatLog);
        break;
      case 'rogue':
        state.backstabReady = true;
        state.backstabTimer = 5;
        state.stealthTimer = 2;
        this.particles.createBackstabActivateEffect(player.position);
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
    cameraAngleY: number,
    enemies: THREE.Group[],
    stats: ClassStats,
    addCombatLog: (text: string, type?: ToastType) => void
  ): boolean {
    const fwd = new THREE.Vector3(Math.sin(cameraAngleY), 0, Math.cos(cameraAngleY));
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

    this.particles.createShieldBashEffect(player.position, fwd);
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
    const spreadAngles = [-0.5, -0.375, -0.25, -0.125, 0, 0.125, 0.25, 0.375, 0.5];

    // Launch burst at player position
    this.particles.createArrowVolleyLaunch(player.position, baseFwd);

    spreadAngles.forEach((angle) => {
      const dir = baseFwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      const spawnPos = player.position.clone().add(dir.clone().multiplyScalar(2));

      // Elongated arrow mesh oriented along travel direction
      const arrowGroup = new THREE.Group();
      const shaft = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x8b6914, emissive: 0x443008, emissiveIntensity: 0.3 })
      );
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.2, 4),
        new THREE.MeshStandardMaterial({ color: 0xc0c0c0, emissive: 0x888888, emissiveIntensity: 0.5 })
      );
      tip.rotation.x = -Math.PI / 2;
      tip.position.z = -0.4;
      const fletch = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.02, 0.12),
        new THREE.MeshBasicMaterial({ color: 0xe9c46a })
      );
      fletch.position.z = 0.3;
      arrowGroup.add(shaft, tip, fletch);
      arrowGroup.position.copy(spawnPos);
      arrowGroup.position.y += 2.0;

      // Orient arrow along direction
      const target = arrowGroup.position.clone().add(dir);
      arrowGroup.lookAt(target);

      this.scene.add(arrowGroup);

      const vel = dir.clone().normalize().multiplyScalar(38);
      let life = 2.5;
      const scene = this.scene;
      const particles = this.particles;
      let frameCount = 0;

      // Use a proxy mesh for collision (positioned at group center)
      const proxy = new THREE.Mesh(new THREE.SphereGeometry(0.01), new THREE.MeshBasicMaterial());
      proxy.visible = false;
      proxy.position.copy(arrowGroup.position);

      this.projectiles.push({
        mesh: proxy,
        update: (dt: number): boolean => {
          const delta = vel.clone().multiplyScalar(dt);
          arrowGroup.position.add(delta);
          proxy.position.copy(arrowGroup.position);
          life -= dt;
          frameCount++;

          // Arrow trail
          if (frameCount % 2 === 0) {
            particles.createTrailParticle(arrowGroup.position, 0xe9c46a);
          }

          if (life <= 0 || arrowGroup.position.y < 0) {
            scene.remove(arrowGroup);
            return false;
          }
          return true;
        },
        damageMin: stats.attackMin,
        damageMax: stats.attackMax,
        aoeRadius: 0,
        stunDuration: 0,
      });
    });

    addCombatLog('Arrow Volley fired!', 'info');
    return true;
  }

  private fireball(
    player: THREE.Group,
    cameraAngleY: number,
    _enemies: THREE.Group[],
    stats: ClassStats,
    addCombatLog: (text: string, type?: ToastType) => void
  ): boolean {
    const fwd = new THREE.Vector3(Math.sin(cameraAngleY), 0, Math.cos(cameraAngleY));
    const spawnPos = player.position.clone().add(fwd.clone().multiplyScalar(2));

    // Create a larger, glowing fireball mesh
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 2 })
    );
    mesh.position.copy(spawnPos);
    mesh.position.y += 2.0;
    this.scene.add(mesh);

    const vel = fwd.clone().normalize().multiplyScalar(25);
    let life = 3.0;
    const scene = this.scene;
    const particles = this.particles;

    this.projectiles.push({
      mesh,
      update: (dt: number): boolean => {
        mesh.position.add(vel.clone().multiplyScalar(dt));
        life -= dt;
        // Trail particles
        if (Math.random() < 0.4) {
          particles.createTrailParticle(mesh.position, 0xff4400);
        }
        if (life <= 0 || mesh.position.y < 0) {
          scene.remove(mesh);
          return false;
        }
        return true;
      },
      damageMin: Math.floor(stats.attackMin * 1.5),
      damageMax: Math.floor(stats.attackMax * 1.5),
      aoeRadius: 7,
      stunDuration: 0.5,
    });

    addCombatLog('Fireball launched!', 'info');
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
        this.particles.createHolyHealEffect(ally.position);
        healed++;
      }
    });

    this.particles.createHolyAuraEffect(player.position, 10);
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

    this.particles.createNecromancyEffect(pos);
    addAlly(ally);
    addCombatLog(`Raised a dead enemy as an ally! (${scaledHp} HP)`, 'info');
    return true;
  }

  activateAbility2(
    classId: string,
    stats: ClassStats,
    state: GameState,
    player: THREE.Group,
    enemies: THREE.Group[],
    _allies: THREE.Group[],
    addCombatLog: (text: string, type?: ToastType) => void
  ): boolean {
    if (state.ability2Cooldown > 0) return false;
    if (state.playerStamina < stats.ability2Cost) return false;
    if (state.dashActive) return false;

    let success = false;

    switch (classId) {
      case 'warrior': {
        // War Leap — arc leap forward, AoE slam on landing
        const fwd = new THREE.Vector3(Math.sin(state.cameraAngleY), 0, Math.cos(state.cameraAngleY));
        state.dashActive = true;
        state.isLeaping = true;
        state.dashDirX = fwd.x;
        state.dashDirZ = fwd.z;
        state.dashSpeed = 16;
        state.playerVelY = 12;
        state.onGround = false;
        state.dashInvulnerable = false;
        addCombatLog('War Leap!', 'info');
        success = true;
        break;
      }
      case 'paladin': {
        // Holy Charge — ground dash forward, invulnerable, knockback enemies in path
        const fwd = new THREE.Vector3(Math.sin(state.cameraAngleY), 0, Math.cos(state.cameraAngleY));
        state.dashActive = true;
        state.isLeaping = false;
        state.dashTimer = 0.35;
        state.dashDirX = fwd.x;
        state.dashDirZ = fwd.z;
        state.dashSpeed = 35;
        state.dashInvulnerable = true;
        this.particles.createDashTrailEffect(player.position, fwd);
        addCombatLog('Holy Charge!', 'info');
        success = true;
        break;
      }
      case 'rogue': {
        // Shadow Step — teleport behind nearest enemy within 15 units
        let nearest: THREE.Group | null = null;
        let nearestDist = Infinity;
        for (const enemy of enemies) {
          const data = enemy.userData as UnitData;
          if (data.health <= 0) continue;
          const dist = player.position.distanceTo(enemy.position);
          if (dist < 15 && dist < nearestDist) {
            nearestDist = dist;
            nearest = enemy;
          }
        }
        if (!nearest) {
          addCombatLog('No enemies nearby to Shadow Step!', 'info');
          return false;
        }
        // Particle at origin
        this.particles.createShadowStepEffect(player.position.clone());
        // Teleport behind the enemy
        const enemyFwd = new THREE.Vector3(Math.sin(nearest.rotation.y), 0, Math.cos(nearest.rotation.y));
        player.position.set(
          nearest.position.x - enemyFwd.x * 2,
          player.position.y,
          nearest.position.z - enemyFwd.z * 2
        );
        // Face the enemy
        player.rotation.y = Math.atan2(
          nearest.position.x - player.position.x,
          nearest.position.z - player.position.z
        );
        state.stealthTimer = 1;
        this.setPlayerOpacity(player, 0.25);
        // Particle at destination
        this.particles.createShadowStepEffect(player.position.clone());
        addCombatLog('Shadow Step!', 'info');
        success = true;
        break;
      }
      case 'archer': {
        // Evasive Roll — quick dash in movement direction, invulnerable
        const fwd = new THREE.Vector3(Math.sin(state.cameraAngleY), 0, Math.cos(state.cameraAngleY));
        state.dashActive = true;
        state.isLeaping = false;
        state.dashTimer = 0.2;
        state.dashDirX = fwd.x;
        state.dashDirZ = fwd.z;
        state.dashSpeed = 30;
        state.dashInvulnerable = true;
        this.particles.createDodgeRollDust(player.position, fwd);
        addCombatLog('Evasive Roll!', 'info');
        success = true;
        break;
      }
      case 'mage': {
        // Blink — instant teleport 10 units forward, frost nova at origin
        const fwd = new THREE.Vector3(Math.sin(state.cameraAngleY), 0, Math.cos(state.cameraAngleY));
        const oldPos = player.position.clone();
        // Teleport forward
        player.position.x += fwd.x * 10;
        player.position.z += fwd.z * 10;
        // Blink effects
        this.particles.createBlinkEffect(oldPos);
        this.particles.createBlinkEffect(player.position.clone());
        // Frost nova at old position — damage + stun nearby enemies
        const frostRadius = 4;
        const frostDmg = Math.floor((stats.attackMin + stats.attackMax) * 0.3);
        for (const enemy of enemies) {
          const eData = enemy.userData as UnitData;
          if (eData.health <= 0) continue;
          const dist = oldPos.distanceTo(enemy.position);
          if (dist < frostRadius) {
            eData.health -= frostDmg;
            eData.stunTimer = Math.max(eData.stunTimer, 0.5);
            this.particles.createBloodEffect(enemy.position);
            if (eData.health <= 0) {
              // Will be picked up by the enemy manager
            } else {
              updateHealthBar(enemy);
            }
          }
        }
        this.particles.createFrostNovaEffect(oldPos, frostRadius);
        addCombatLog(`Blink! Frost nova hit for ${frostDmg}!`, 'info');
        success = true;
        break;
      }
      case 'necromancer': {
        // Soul Drain — AoE damage + heal
        const drainRadius = 8;
        const drainDmg = Math.floor((stats.attackMin + stats.attackMax) * 0.3);
        let totalDrained = 0;
        for (const enemy of enemies) {
          const eData = enemy.userData as UnitData;
          if (eData.health <= 0) continue;
          const dist = player.position.distanceTo(enemy.position);
          if (dist < drainRadius) {
            eData.health -= drainDmg;
            totalDrained += drainDmg;
            this.particles.createBloodEffect(enemy.position);
            if (eData.health <= 0) {
              // Will be picked up by the enemy manager
            } else {
              updateHealthBar(enemy);
            }
          }
        }
        const healAmount = Math.floor(totalDrained * 0.5);
        state.playerHealth = Math.min(state.playerMaxHealth, state.playerHealth + healAmount);
        this.particles.createSoulDrainEffect(player.position, drainRadius);
        if (healAmount > 0) {
          this.particles.createHealEffect(player.position);
        }
        addCombatLog(`Soul Drain! ${totalDrained} damage, healed ${healAmount}!`, 'info');
        success = true;
        break;
      }
      default:
        return false;
    }

    if (success) {
      state.playerStamina -= stats.ability2Cost;
      state.ability2Cooldown = stats.ability2CooldownMax;
    }

    return success;
  }

  update(
    dt: number,
    state: GameState,
    player: THREE.Group,
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

    if (state.ability2Cooldown > 0) {
      state.ability2Cooldown = Math.max(0, state.ability2Cooldown - dt);
    }

    // Stealth timer — make player semi-transparent while stealthed
    if (state.stealthTimer > 0) {
      state.stealthTimer -= dt;
      this.setPlayerOpacity(player, 0.25);
      if (state.stealthTimer <= 0) {
        state.stealthTimer = 0;
        this.setPlayerOpacity(player, 1);
      }
    }

    // Backstab timeout
    if (state.backstabReady && state.backstabTimer > 0) {
      state.backstabTimer -= dt;
      if (state.backstabTimer <= 0) {
        state.backstabReady = false;
        state.backstabTimer = 0;
        state.stealthTimer = 0;
        this.setPlayerOpacity(player, 1);
        addCombatLog('Backstab expired!', 'info');
      }
    }

    // Update ability projectiles
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
        proj.aoeRadius,
        onKillEnemy
      );

      if (result.hit) {
        // AoE explosion effect + stun
        if (proj.aoeRadius > 0) {
          this.particles.createFireballExplosion(proj.mesh.position.clone(), proj.aoeRadius);
          for (const enemy of enemies) {
            const eData = enemy.userData as UnitData;
            if (eData.health <= 0) continue;
            const dist = proj.mesh.position.distanceTo(enemy.position);
            if (dist < proj.aoeRadius && proj.stunDuration > 0) {
              eData.stunTimer = Math.max(eData.stunTimer, proj.stunDuration);
            }
          }
        }
        this.scene.remove(proj.mesh);
        proj.mesh.geometry.dispose();
        (proj.mesh.material as THREE.Material).dispose();
        this.projectiles.splice(i, 1);
      }
    }
  }
}
