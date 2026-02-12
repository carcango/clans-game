import * as THREE from 'three';
import { GameState, InputState, UnitData, ToastType } from '../types/game';
import { ClassStats } from '../constants/stats';
import { CombatSystem } from './CombatSystem';
import { ParticleSystem } from './ParticleSystem';
import { updateHealthBar } from './VoxelCharacterBuilder';
import {
  updateIdleAnimation, updateLocomotionAnimation,
  updateMeleeAttackAnimation, updateRangedAttackAnimation,
  updateHitReaction, updateHitFlash, resetAttackPose,
  updateWarLeapAnimation, updateHolyChargeAnimation,
  updateEvasiveRollAnimation, updateShadowStepAnimation,
  updateBlinkAnimation, updateSoulDrainAnimation,
} from './UnitAnimator';
import {
  GRAVITY, JUMP_VELOCITY, TERRAIN_HALF,
  ATTACK_DURATION, ATTACK_COOLDOWN, ATTACK_STAMINA_COST,
  SPRINT_STAMINA_COST, STAMINA_REGEN_RATE, BLOCK_STAMINA_DRAIN,
  CAMERA_SENSITIVITY,
  PLAYER_PROJECTILE_SPEED, DEFAULT_PLAYER_PROJECTILE_SPEED, PROJECTILE_LIFETIME,
  CAMERA_MIN_DISTANCE, CAMERA_MAX_DISTANCE, CAMERA_HEIGHT,
  CAMERA_LERP_SPEED, CAMERA_FP_EYE_HEIGHT,
} from '../constants/game';
import { createProjectileMesh, disposeProjectile, getProjectileTrailColor } from './ProjectileFactory';

interface Projectile {
  mesh: THREE.Object3D;
  velocity: THREE.Vector3;
  life: number;
  frameCount: number;
}

export class PlayerController {
  private player: THREE.Group;
  private camera: THREE.PerspectiveCamera;
  private state: GameState;
  private input: InputState;
  private stats: ClassStats;
  private classId: string;
  private combat: CombatSystem;
  private particles: ParticleSystem;
  private scene: THREE.Scene;
  private hitEnemiesThisSwing = new Set<THREE.Group>();
  private projectiles: Projectile[] = [];
  private leapLanded = false;
  private addCombatLog: (text: string, type?: ToastType) => void;
  private onKillEnemy: (enemy: THREE.Group) => void;
  private onPlayerHit: (dmg: number) => void;
  private time = 0;
  private currentSpeed = 0;

  // Melee range ring
  private rangeRing: THREE.Mesh | null = null;
  private rangeRingMat: THREE.MeshBasicMaterial | null = null;

  // Camera shake
  private shakeIntensity = 0;
  private shakeDecay = 8;

  constructor(
    player: THREE.Group,
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    state: GameState,
    input: InputState,
    stats: ClassStats,
    classId: string,
    combat: CombatSystem,
    particles: ParticleSystem,
    addCombatLog: (text: string, type?: ToastType) => void,
    onKillEnemy: (enemy: THREE.Group) => void,
    onPlayerHit: (dmg: number) => void
  ) {
    this.player = player;
    this.camera = camera;
    this.scene = scene;
    this.state = state;
    this.input = input;
    this.stats = stats;
    this.classId = classId;
    this.combat = combat;
    this.particles = particles;
    this.addCombatLog = addCombatLog;
    this.onKillEnemy = onKillEnemy;
    this.onPlayerHit = onPlayerHit;

    // Create melee range ring (melee classes only)
    if (stats.attackType === 'melee') {
      const ringGeo = new THREE.RingGeometry(stats.range - 0.15, stats.range + 0.15, 48);
      this.rangeRingMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      this.rangeRing = new THREE.Mesh(ringGeo, this.rangeRingMat);
      this.rangeRing.rotation.x = -Math.PI / 2;
      this.rangeRing.position.y = 0.05;
      player.add(this.rangeRing);
    }
  }

  triggerShake(intensity: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  update(dt: number, enemies: THREE.Group[]) {
    this.time += dt;
    this.updateMovement(dt);
    this.checkDashEffects(dt, enemies);
    this.updateCombat(dt, enemies);
    this.updateProjectiles(dt, enemies);
    this.updateAnimations(dt);
    this.updateCamera(dt);
  }

  private checkDashEffects(_dt: number, enemies: THREE.Group[]) {
    const state = this.state;

    // War Leap landing AoE
    if (this.leapLanded) {
      this.leapLanded = false;
      const slamRadius = 10;
      const slamDmg = Math.floor((this.stats.attackMin + this.stats.attackMax) * 0.9);
      let hitCount = 0;
      for (const enemy of enemies) {
        const data = enemy.userData as UnitData;
        if (data.health <= 0) continue;
        const dist = this.player.position.distanceTo(enemy.position);
        if (dist < slamRadius) {
          data.health -= slamDmg;
          data.stunTimer = Math.max(data.stunTimer, 2.0);
          this.particles.createBloodEffect(enemy.position);
          hitCount++;
          if (data.health <= 0) {
            this.onKillEnemy(enemy);
          } else {
            updateHealthBar(enemy);
            const kb = new THREE.Vector3().subVectors(enemy.position, this.player.position).normalize().multiplyScalar(7);
            enemy.position.add(kb);
          }
        }
      }
      this.particles.createLeapSlamEffect(this.player.position, slamRadius);
      this.triggerShake(0.8);
      if (hitCount > 0) {
        this.addCombatLog(`War Leap slam hit ${hitCount} enemies for ${slamDmg}!`, 'info');
      }
    }

    // War Leap aerial trail
    if (state.dashActive && state.isLeaping) {
      this.particles.createTrailParticle(this.player.position, 0xaa6633);
      this.particles.createTrailParticle(this.player.position, 0x886644);
    }

    // Holy Charge damage + knockback (during active dash for paladin)
    if (state.dashActive && !state.isLeaping && state.dashInvulnerable && this.classId === 'paladin') {
      for (const enemy of enemies) {
        const data = enemy.userData as UnitData;
        if (data.health <= 0) continue;
        if (data.holyChargeHit) continue; // Only hit each enemy once per charge
        const dist = this.player.position.distanceTo(enemy.position);
        if (dist < 4) {
          const dmg = Math.floor(this.stats.attackMin + Math.random() * (this.stats.attackMax - this.stats.attackMin));
          data.health -= dmg;
          data.holyChargeHit = true;
          const kb = new THREE.Vector3().subVectors(enemy.position, this.player.position).normalize().multiplyScalar(8);
          enemy.position.add(kb);
          data.stunTimer = Math.max(data.stunTimer, 1.0);
          this.particles.createBloodEffect(enemy.position);
          this.particles.createBlockSparks(enemy.position);
          if (data.health <= 0) {
            this.onKillEnemy(enemy);
          } else {
            updateHealthBar(enemy);
          }
        }
      }
      this.particles.createDashTrailEffect(this.player.position, new THREE.Vector3(state.dashDirX, 0, state.dashDirZ));
    }

    // Reset holy charge hit flags when dash ends
    if (!state.dashActive && this.classId === 'paladin') {
      for (const enemy of enemies) {
        (enemy.userData as UnitData).holyChargeHit = false;
      }
    }

    // Evasive Roll dust trail
    if (state.dashActive && !state.isLeaping && this.classId === 'archer') {
      const dir = new THREE.Vector3(state.dashDirX, 0, state.dashDirZ);
      this.particles.createDodgeRollDust(this.player.position, dir);
    }
  }

  private updateMovement(dt: number) {
    const { keys } = this.input;
    const state = this.state;

    // Dash/leap movement override
    if (state.dashActive) {
      // Apply dash horizontal movement
      this.player.position.x += state.dashDirX * state.dashSpeed * dt;
      this.player.position.z += state.dashDirZ * state.dashSpeed * dt;

      // Face dash direction
      this.player.rotation.y = Math.atan2(state.dashDirX, state.dashDirZ);
      this.currentSpeed = state.dashSpeed;

      // Gravity + vertical physics still apply
      state.playerVelY += GRAVITY * dt;
      this.player.position.y += state.playerVelY * dt;

      if (state.isLeaping) {
        // War Leap — ends when landing
        if (this.player.position.y <= 0 && state.playerVelY < 0) {
          this.player.position.y = 0;
          state.playerVelY = 0;
          state.onGround = true;
          state.dashActive = false;
          state.isLeaping = false;
          state.dashInvulnerable = false;
          this.leapLanded = true;
        }
      } else {
        // Ground dash (Holy Charge, Evasive Roll) — timer based
        state.dashTimer -= dt;
        // Keep on ground during ground dashes
        if (this.player.position.y <= 0) {
          this.player.position.y = 0;
          state.playerVelY = 0;
          state.onGround = true;
        }
        if (state.dashTimer <= 0) {
          state.dashActive = false;
          state.dashInvulnerable = false;
        }
      }

      // Bounds
      this.player.position.x = Math.max(-TERRAIN_HALF, Math.min(TERRAIN_HALF, this.player.position.x));
      this.player.position.z = Math.max(-TERRAIN_HALF, Math.min(TERRAIN_HALF, this.player.position.z));
      return;
    }

    const moveDir = new THREE.Vector3();
    const forward = new THREE.Vector3(Math.sin(state.cameraAngleY), 0, Math.cos(state.cameraAngleY));
    const right = new THREE.Vector3(Math.cos(state.cameraAngleY), 0, -Math.sin(state.cameraAngleY));

    if (keys['KeyW']) moveDir.add(forward);
    if (keys['KeyS']) moveDir.sub(forward);
    if (keys['KeyA']) moveDir.add(right);
    if (keys['KeyD']) moveDir.sub(right);

    const sprinting = keys['ShiftLeft'] || keys['ShiftRight'];
    let speed = sprinting ? this.stats.sprintSpeed : this.stats.speed;
    if (state.isBlocking) speed *= 0.4;
    if (state.isAttacking) speed *= 0.3;

    if (moveDir.length() > 0) {
      moveDir.normalize();
      this.player.position.x += moveDir.x * speed * dt;
      this.player.position.z += moveDir.z * speed * dt;
      this.currentSpeed = speed;
    } else {
      this.currentSpeed = 0;
    }

    // Always face camera direction
    this.player.rotation.y = state.cameraAngleY;

    // Jump
    if (keys['Space'] && state.onGround) {
      state.playerVelY = JUMP_VELOCITY;
      state.onGround = false;
    }
    state.playerVelY += GRAVITY * dt;
    this.player.position.y += state.playerVelY * dt;
    if (this.player.position.y <= 0) {
      this.player.position.y = 0;
      state.playerVelY = 0;
      state.onGround = true;
    }

    // Bounds
    this.player.position.x = Math.max(-TERRAIN_HALF, Math.min(TERRAIN_HALF, this.player.position.x));
    this.player.position.z = Math.max(-TERRAIN_HALF, Math.min(TERRAIN_HALF, this.player.position.z));

    // Stamina
    if (sprinting && moveDir.length() > 0) {
      state.playerStamina = Math.max(0, state.playerStamina - SPRINT_STAMINA_COST * dt);
    } else {
      state.playerStamina = Math.min(state.playerMaxStamina, state.playerStamina + STAMINA_REGEN_RATE * dt);
    }
  }

  private updateCombat(dt: number, enemies: THREE.Group[]) {
    const { mouseDown } = this.input;
    const state = this.state;
    const leftArm = this.player.userData.leftArm as THREE.Group;

    // Block
    state.isBlocking = !!mouseDown[2] && !state.isAttacking;
    leftArm.rotation.x = state.isBlocking ? -1.2 : 0;
    leftArm.position.z = state.isBlocking ? 0.3 : 0;

    if (state.isBlocking) {
      state.playerStamina = Math.max(0, state.playerStamina - BLOCK_STAMINA_DRAIN * dt * 0.5);
    }

    // Attack
    state.attackCooldownTimer -= dt;

    const atkSpeed = this.stats.attackSpeed || 1.0;
    const atkDuration = ATTACK_DURATION / atkSpeed;
    const atkCooldown = ATTACK_COOLDOWN / atkSpeed;

    if (mouseDown[0] && !state.isAttacking && state.attackCooldownTimer <= 0 && state.playerStamina > 10) {
      state.isAttacking = true;
      state.attackTimer = atkDuration;
      state.playerStamina -= ATTACK_STAMINA_COST;
      this.hitEnemiesThisSwing.clear();

      // Ranged: fire projectile immediately
      if (this.stats.attackType === 'ranged') {
        this.fireProjectile();
      }
    }

    if (state.isAttacking) {
      state.attackTimer -= dt;
      const progress = 1 - state.attackTimer / atkDuration;

      // Melee hit check at strike phase
      if (this.stats.attackType === 'melee' && progress > 0.25 && progress < 0.55) {
        const dmgMult = state.backstabReady ? 3 : 1;
        const result = this.combat.checkMeleeHit(
          this.player,
          enemies,
          this.stats.range,
          this.stats.attackMin,
          this.stats.attackMax,
          this.hitEnemiesThisSwing,
          this.onKillEnemy,
          dmgMult
        );
        if (result.hit) {
          this.triggerShake(0.15);
          if (result.damage > 0 && state.backstabReady) {
            this.addCombatLog(`Backstab! ${result.damage} damage!`, 'success');
            const fwd = new THREE.Vector3(Math.sin(this.player.rotation.y), 0, Math.cos(this.player.rotation.y));
            const hitPos = this.player.position.clone().add(fwd.multiplyScalar(2));
            hitPos.y += 1.5;
            this.particles.createBackstabHitEffect(hitPos);
            state.backstabReady = false;
            state.stealthTimer = 0;
          }
        }
      }

      // Slash trail at start of strike phase
      if (this.stats.attackType === 'melee' && progress > 0.24 && progress < 0.28) {
        const fwd = new THREE.Vector3(Math.sin(this.player.rotation.y), 0, Math.cos(this.player.rotation.y));
        const slashPos = this.player.position.clone().add(fwd.multiplyScalar(2));
        slashPos.y += 2.0;
        this.particles.createSlashTrail(slashPos, fwd, 0xcccccc);
      }

      if (state.attackTimer <= 0) {
        state.isAttacking = false;
        state.attackCooldownTimer = atkCooldown;
        resetAttackPose(this.player);
      }
    }
  }

  private updateAnimations(dt: number) {
    const state = this.state;

    // Hit reaction & flash
    updateHitReaction(this.player, dt);
    updateHitFlash(this.player, dt);

    // Save physics Y — locomotion animation overwrites position.y with a bounce
    const physicsY = this.player.position.y;

    // Ability2 animations take priority over everything else
    if (state.dashActive || state.ability2AnimTimer > 0) {
      this.updateAbility2Animation();
    } else if (state.isAttacking) {
      const atkSpd = this.stats.attackSpeed || 1.0;
      const progress = 1 - state.attackTimer / (ATTACK_DURATION / atkSpd);
      if (this.stats.attackType === 'melee') {
        updateMeleeAttackAnimation(this.player, progress);
      } else {
        updateRangedAttackAnimation(this.player, progress);
      }
    } else if (this.currentSpeed > 0.5) {
      updateLocomotionAnimation(this.player, dt, this.time, this.currentSpeed);
    } else {
      updateIdleAnimation(this.player, dt, this.time);
    }

    // Restore physics Y when airborne so animation bounce doesn't clobber leap/jump arcs
    if (!state.onGround) {
      this.player.position.y = physicsY;
    }

    // Update melee range ring
    if (this.rangeRingMat) {
      if (state.isAttacking) {
        this.rangeRingMat.color.setHex(0xff8800);
        this.rangeRingMat.opacity = 0.35;
      } else {
        this.rangeRingMat.color.setHex(0xffffff);
        this.rangeRingMat.opacity = 0.08 + Math.sin(this.time * 2) * 0.05;
      }
    }
  }

  private updateAbility2Animation() {
    const state = this.state;

    switch (this.classId) {
      case 'warrior':
        if (state.isLeaping) {
          updateWarLeapAnimation(this.player, state.playerVelY);
        }
        break;
      case 'paladin':
        if (state.dashActive) {
          const progress = 1 - state.dashTimer / 0.55;
          updateHolyChargeAnimation(this.player, progress, this.time);
        }
        break;
      case 'archer':
        if (state.dashActive) {
          const progress = 1 - state.dashTimer / 0.2;
          updateEvasiveRollAnimation(this.player, progress);
        }
        break;
      case 'rogue':
        if (state.ability2AnimTimer > 0) {
          const progress = 1 - state.ability2AnimTimer / 0.35;
          updateShadowStepAnimation(this.player, progress);
        }
        break;
      case 'mage':
        if (state.ability2AnimTimer > 0) {
          const progress = 1 - state.ability2AnimTimer / 0.3;
          updateBlinkAnimation(this.player, progress);
        }
        break;
      case 'necromancer':
        if (state.ability2AnimTimer > 0) {
          const progress = 1 - state.ability2AnimTimer / 0.5;
          updateSoulDrainAnimation(this.player, progress);
        }
        break;
    }
  }

  private fireProjectile() {
    const fwd = new THREE.Vector3(
      Math.sin(this.state.cameraAngleY),
      0,
      Math.cos(this.state.cameraAngleY)
    );

    const mesh = createProjectileMesh(this.classId);
    mesh.position.copy(this.player.position);
    mesh.position.y += 2.0;

    // Orient arrow along flight direction
    if (this.classId === 'archer') {
      const target = mesh.position.clone().add(fwd);
      mesh.lookAt(target);
    }

    this.scene.add(mesh);

    const speed = PLAYER_PROJECTILE_SPEED[this.classId] ?? DEFAULT_PLAYER_PROJECTILE_SPEED;
    this.projectiles.push({
      mesh,
      velocity: fwd.clone().multiplyScalar(speed),
      life: PROJECTILE_LIFETIME,
      frameCount: 0,
    });
  }

  private updateProjectiles(dt: number, enemies: THREE.Group[]) {
    const trailColor = getProjectileTrailColor(this.classId);

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.mesh.position.add(proj.velocity.clone().multiplyScalar(dt));
      proj.life -= dt;
      proj.frameCount++;

      // Re-orient arrow along flight direction each frame
      if (this.classId === 'archer') {
        const ahead = proj.mesh.position.clone().add(proj.velocity);
        proj.mesh.lookAt(ahead);
      }

      // Projectile trail every 3 frames
      if (proj.frameCount % 3 === 0) {
        this.particles.createTrailParticle(proj.mesh.position, trailColor);
      }

      // Check hits
      let hit = false;
      for (const enemy of enemies) {
        const data = enemy.userData as UnitData;
        if (data.health <= 0) continue;
        const dx = proj.mesh.position.x - enemy.position.x;
        const dz = proj.mesh.position.z - enemy.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 2.0) {
          const aoeRadius = this.classId === 'mage' ? 3 : 0;
          const dmgMult = this.state.backstabReady ? 3 : 1;
          const result = this.combat.checkRangedHit(
            proj.mesh.position,
            enemies,
            this.stats.attackMin,
            this.stats.attackMax,
            aoeRadius,
            this.onKillEnemy,
            dmgMult
          );
          if (result.hit) {
            if (this.state.backstabReady) {
              this.particles.createBackstabHitEffect(proj.mesh.position.clone());
              this.state.backstabReady = false;
              this.state.stealthTimer = 0;
            }
            if (this.classId === 'mage') {
              this.particles.createMagicEffect(proj.mesh.position, 0xff4400, 3);
            }
          }
          hit = true;
          break;
        }
      }

      if (hit || proj.life <= 0 || proj.mesh.position.y < 0) {
        this.scene.remove(proj.mesh);
        disposeProjectile(proj.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateCamera(dt: number) {
    const state = this.state;
    const PI = Math.PI;

    // Mouse look
    state.cameraAngleY -= this.input.mouseDelta.x * CAMERA_SENSITIVITY;
    state.cameraAngleX += this.input.mouseDelta.y * CAMERA_SENSITIVITY;
    state.cameraAngleX = Math.max(-PI / 3, Math.min(PI / 3, state.cameraAngleX));
    this.input.mouseDelta.x = 0;
    this.input.mouseDelta.y = 0;

    // Zoom via scroll wheel
    state.cameraDistance = Math.max(
      CAMERA_MIN_DISTANCE,
      Math.min(CAMERA_MAX_DISTANCE, state.cameraDistance + this.input.wheelDelta * 0.01)
    );
    this.input.wheelDelta = 0;

    // R key toggle first-person / third-person
    if (this.input.keys['KeyR']) {
      this.input.keys['KeyR'] = false;
      state.isFirstPerson = !state.isFirstPerson;
      this.player.visible = !state.isFirstPerson;
    }

    // Camera shake decay
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    }

    if (state.isFirstPerson) {
      // First-person camera
      this.camera.position.set(
        this.player.position.x,
        this.player.position.y + CAMERA_FP_EYE_HEIGHT,
        this.player.position.z
      );
      const lookTarget = new THREE.Vector3(
        this.camera.position.x + Math.sin(state.cameraAngleY) * 10,
        this.camera.position.y - Math.tan(state.cameraAngleX) * 10,
        this.camera.position.z + Math.cos(state.cameraAngleY) * 10
      );
      this.camera.lookAt(lookTarget);
    } else {
      // Third-person spherical orbit
      const dist = state.cameraDistance;
      const angleY = state.cameraAngleY;
      const angleX = state.cameraAngleX;

      const offsetX = -Math.sin(angleY) * dist * Math.cos(angleX);
      const offsetY = CAMERA_HEIGHT + Math.sin(angleX) * dist;
      const offsetZ = -Math.cos(angleY) * dist * Math.cos(angleX);

      const targetPos = new THREE.Vector3(
        this.player.position.x + offsetX,
        this.player.position.y + offsetY,
        this.player.position.z + offsetZ
      );

      this.camera.position.lerp(targetPos, CAMERA_LERP_SPEED);
      this.camera.lookAt(
        this.player.position.x,
        this.player.position.y + 1.5,
        this.player.position.z
      );
    }

    // Apply camera shake
    if (this.shakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.z += (Math.random() - 0.5) * this.shakeIntensity;
    }
  }

  getPosition(): THREE.Vector3 {
    return this.player.position;
  }

  dispose() {
    this.projectiles.forEach((p) => {
      this.scene.remove(p.mesh);
      disposeProjectile(p.mesh);
    });
    this.projectiles = [];

    if (this.rangeRing) {
      this.rangeRing.geometry.dispose();
      this.rangeRingMat!.dispose();
      this.player.remove(this.rangeRing);
      this.rangeRing = null;
      this.rangeRingMat = null;
    }
  }
}
