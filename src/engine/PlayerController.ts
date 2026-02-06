import * as THREE from 'three';
import { GameState, InputState, UnitData } from '../types/game';
import { ClassStats } from '../constants/stats';
import { CombatSystem } from './CombatSystem';
import { ParticleSystem } from './ParticleSystem';
import {
  GRAVITY, JUMP_VELOCITY, TERRAIN_HALF,
  ATTACK_DURATION, ATTACK_COOLDOWN, ATTACK_STAMINA_COST,
  SPRINT_STAMINA_COST, STAMINA_REGEN_RATE, BLOCK_STAMINA_DRAIN,
  CAMERA_SENSITIVITY, PROJECTILE_SPEED,
  CAMERA_MIN_DISTANCE, CAMERA_MAX_DISTANCE, CAMERA_HEIGHT,
  CAMERA_LERP_SPEED, CAMERA_FP_EYE_HEIGHT,
} from '../constants/game';

interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
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
  private addCombatLog: (text: string) => void;
  private onKillEnemy: (enemy: THREE.Group) => void;
  private onPlayerHit: (dmg: number) => void;

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
    addCombatLog: (text: string) => void,
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
  }

  update(dt: number, enemies: THREE.Group[]) {
    this.updateMovement(dt);
    this.updateCombat(dt, enemies);
    this.updateProjectiles(dt, enemies);
    this.updateCamera(dt);
  }

  private updateMovement(dt: number) {
    const { keys } = this.input;
    const state = this.state;
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
      const ta = Math.atan2(moveDir.x, moveDir.z);
      let d = ta - this.player.rotation.y;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.player.rotation.y += d * 8 * dt;
    }

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
    const rightArm = this.player.userData.rightArm as THREE.Group;
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

    if (mouseDown[0] && !state.isAttacking && state.attackCooldownTimer <= 0 && state.playerStamina > 10) {
      state.isAttacking = true;
      state.attackTimer = ATTACK_DURATION;
      state.playerStamina -= ATTACK_STAMINA_COST;
      this.hitEnemiesThisSwing.clear();

      // Ranged: fire projectile immediately
      if (this.stats.attackType === 'ranged') {
        this.fireProjectile();
      }
    }

    if (state.isAttacking) {
      state.attackTimer -= dt;
      const progress = 1 - state.attackTimer / ATTACK_DURATION;

      if (progress < 0.4) {
        rightArm.rotation.x = -2.0 * (progress / 0.4);
        rightArm.rotation.z = 0.3 * (progress / 0.4);
      } else {
        const sp = (progress - 0.4) / 0.6;
        rightArm.rotation.x = -2.0 + 3.0 * sp;
        rightArm.rotation.z = 0.3 - 0.8 * sp;
      }

      // Melee hit check
      if (this.stats.attackType === 'melee' && progress > 0.35 && progress < 0.65) {
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
          if (result.damage > 0) {
            this.addCombatLog(
              state.backstabReady
                ? `Backstab! ${result.damage} damage!`
                : `Hit for ${result.damage} damage!`
            );
            if (state.backstabReady) state.backstabReady = false;
          } else {
            this.addCombatLog('Attack blocked!');
          }
        }
      }

      if (state.attackTimer <= 0) {
        state.isAttacking = false;
        state.attackCooldownTimer = ATTACK_COOLDOWN;
        rightArm.rotation.x = 0;
        rightArm.rotation.z = 0;
      }
    }
  }

  private fireProjectile() {
    const fwd = new THREE.Vector3(
      Math.sin(this.state.cameraAngleY),
      0,
      Math.cos(this.state.cameraAngleY)
    );

    let color = 0xcccccc;
    if (this.classId === 'mage') color = 0xb56576;
    else if (this.classId === 'archer') color = 0xe9c46a;
    else if (this.classId === 'necromancer') color = 0x95d5b2;

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshBasicMaterial({ color })
    );
    mesh.position.copy(this.player.position);
    mesh.position.y += 2.0;
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      velocity: fwd.clone().multiplyScalar(PROJECTILE_SPEED),
      life: 2.0,
    });
  }

  private updateProjectiles(dt: number, enemies: THREE.Group[]) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.mesh.position.add(proj.velocity.clone().multiplyScalar(dt));
      proj.life -= dt;

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
            this.addCombatLog(`Ranged hit for ${result.totalDamage} damage!`);
            if (this.state.backstabReady) this.state.backstabReady = false;
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
        proj.mesh.geometry.dispose();
        (proj.mesh.material as THREE.Material).dispose();
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
  }

  getPosition(): THREE.Vector3 {
    return this.player.position;
  }

  dispose() {
    this.projectiles.forEach((p) => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    });
    this.projectiles = [];
  }
}
