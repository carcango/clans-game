import * as THREE from 'three';
import { UnitData } from '../types/game';
import { CombatSystem } from './CombatSystem';
import { updateHealthBar } from './VoxelCharacterBuilder';
import {
  TERRAIN_HALF,
  MELEE_ENGAGE_DIST, MELEE_HIT_DIST,
  RANGED_MIN_DIST, AI_PROJECTILE_SPEED, UNIT_AVOIDANCE_DIST,
} from '../constants/game';

interface AIProjectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  damageMin: number;
  damageMax: number;
}

const SHIELD_CLASSES = new Set(['warrior', 'paladin']);

export class EnemyManager {
  private scene: THREE.Scene;
  private combat: CombatSystem;
  private projectiles: AIProjectile[] = [];

  constructor(scene: THREE.Scene, combat: CombatSystem) {
    this.scene = scene;
    this.combat = combat;
  }

  update(
    dt: number,
    enemies: THREE.Group[],
    allies: THREE.Group[],
    player: THREE.Group,
    wave: number,
    isPlayerBlocking: boolean,
    onPlayerHit: (dmg: number) => void,
    onAllyKill: (ally: THREE.Group) => void
  ) {
    const aliveAllies = allies.filter((a) => (a.userData as UnitData).health > 0);

    for (const enemy of enemies) {
      const data = enemy.userData as UnitData;
      if (data.health <= 0) continue;

      data.stunTimer -= dt;
      if (data.stunTimer > 0) continue;

      // Find closest target
      let closestTarget = player;
      let closestDist = enemy.position.distanceTo(player.position);
      for (const ally of aliveAllies) {
        const d = enemy.position.distanceTo(ally.position);
        if (d < closestDist) {
          closestDist = d;
          closestTarget = ally;
        }
      }

      const toTarget = new THREE.Vector3().subVectors(closestTarget.position, enemy.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      const dirToTarget = toTarget.clone().normalize();

      // Face target
      const ta = Math.atan2(dirToTarget.x, dirToTarget.z);
      let diff = ta - enemy.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      enemy.rotation.y += diff * 5 * dt;

      const isRanged = data.attackType === 'ranged';

      if (isRanged) {
        // Ranged behavior: stay at 6-15 range, fire projectiles
        if (dist < RANGED_MIN_DIST) {
          // Too close - back away
          enemy.position.x -= dirToTarget.x * data.speed * 0.7 * dt;
          enemy.position.z -= dirToTarget.z * data.speed * 0.7 * dt;
        } else if (dist > 15) {
          // Too far - close in
          enemy.position.x += dirToTarget.x * data.speed * dt;
          enemy.position.z += dirToTarget.z * data.speed * dt;
        } else {
          // In range - strafe
          data.stateTimer = (data.stateTimer ?? 0) - dt;
          if (data.stateTimer! <= 0) {
            data.strafeDir = (data.strafeDir ?? 1) * -1;
            data.stateTimer = 1 + Math.random() * 1.5;
          }
          const strafe = new THREE.Vector3(-dirToTarget.z, 0, dirToTarget.x).multiplyScalar(data.strafeDir ?? 1);
          enemy.position.x += strafe.x * data.speed * 0.5 * dt;
          enemy.position.z += strafe.z * data.speed * 0.5 * dt;
        }

        // Ranged attack
        data.attackTimer -= dt;
        if (data.attackTimer <= 0 && !data.isAttacking && dist < 15) {
          data.isAttacking = true;
          data.attackTime = 0;
          data.attackTimer = data.attackCooldown;
          data.hitThisSwing = false;
        }

        // Ranged attack animation (slower windup)
        if (data.isAttacking) {
          data.attackTime += dt;
          const progress = data.attackTime / 0.5;

          if (progress < 0.45) {
            data.rightArm.rotation.x = -1.5 * (progress / 0.45);
          } else {
            data.rightArm.rotation.x = -1.5 + 1.5 * ((progress - 0.45) / 0.55);
          }

          // Fire projectile at progress 0.45-0.55
          if (progress > 0.45 && progress < 0.55 && !data.hitThisSwing) {
            data.hitThisSwing = true;
            this.fireAIProjectile(enemy, closestTarget, data);
          }

          if (progress >= 1) {
            data.isAttacking = false;
            data.rightArm.rotation.x = 0;
          }
        }
      } else {
        // Melee behavior
        if (dist < MELEE_ENGAGE_DIST) {
          data.attackTimer -= dt;
          if (data.attackTimer <= 0 && !data.isAttacking) {
            data.isAttacking = true;
            data.attackTime = 0;
            data.attackTimer = data.attackCooldown;
            data.hitThisSwing = false;
          }
        } else if (dist < 6) {
          data.stateTimer = (data.stateTimer ?? 0) - dt;
          if (data.stateTimer! <= 0) {
            data.strafeDir = (data.strafeDir ?? 1) * -1;
            data.stateTimer = 1 + Math.random() * 1.5;
          }
          const strafe = new THREE.Vector3(-dirToTarget.z, 0, dirToTarget.x).multiplyScalar(data.strafeDir ?? 1);
          enemy.position.x += (strafe.x * 0.4 + dirToTarget.x * 0.6) * data.speed * dt;
          enemy.position.z += (strafe.z * 0.4 + dirToTarget.z * 0.6) * data.speed * dt;
        } else {
          enemy.position.x += dirToTarget.x * data.speed * dt;
          enemy.position.z += dirToTarget.z * data.speed * dt;
        }

        // Melee attack animation
        if (data.isAttacking) {
          data.attackTime += dt;
          const progress = data.attackTime / 0.4;

          if (progress < 0.4) {
            data.rightArm.rotation.x = -2.0 * (progress / 0.4);
          } else {
            data.rightArm.rotation.x = -2.0 + 3.0 * ((progress - 0.4) / 0.6);
          }

          if (progress > 0.4 && progress < 0.6 && dist < MELEE_HIT_DIST && !data.hitThisSwing) {
            data.hitThisSwing = true;
            const dmgMin = data.damageMin ?? 8;
            const dmgMax = data.damageMax ?? 16;
            if (closestTarget === player) {
              if (isPlayerBlocking) {
                onPlayerHit(0);
              } else {
                const dmg = dmgMin + Math.floor(Math.random() * (dmgMax - dmgMin)) + wave;
                onPlayerHit(dmg);
              }
            } else {
              const tData = closestTarget.userData as UnitData;
              if (tData.isBlocking && Math.random() < 0.45) {
                // Blocked
              } else {
                const dmg = dmgMin + Math.floor(Math.random() * (dmgMax - dmgMin)) + wave;
                tData.health -= dmg;
                tData.stunTimer = 0.3;
                if (tData.health <= 0) {
                  onAllyKill(closestTarget);
                } else {
                  updateHealthBar(closestTarget);
                }
              }
            }
          }

          if (progress >= 1) {
            data.isAttacking = false;
            data.rightArm.rotation.x = 0;
          }
        }
      }

      // Blocking - only shield classes
      const canBlock = SHIELD_CLASSES.has(data.classId ?? '');
      if (canBlock) {
        data.blockTimer -= dt;
        if (dist < 4 && Math.random() < 0.015) {
          data.isBlocking = true;
          data.blockTimer = 0.5 + Math.random() * 0.5;
        }
        if (data.blockTimer <= 0) data.isBlocking = false;
      } else {
        data.isBlocking = false;
      }

      data.leftArm.rotation.x = data.isBlocking ? -1.2 : 0;
      data.leftArm.position.z = data.isBlocking ? 0.3 : 0;

      // Avoidance
      for (const other of enemies) {
        if (other === enemy || (other.userData as UnitData).health <= 0) continue;
        const sep = new THREE.Vector3().subVectors(enemy.position, other.position);
        sep.y = 0;
        if (sep.length() < UNIT_AVOIDANCE_DIST && sep.length() > 0.01) {
          enemy.position.add(sep.normalize().multiplyScalar(1.5 * dt));
        }
      }

      enemy.position.x = Math.max(-TERRAIN_HALF, Math.min(TERRAIN_HALF, enemy.position.x));
      enemy.position.z = Math.max(-TERRAIN_HALF, Math.min(TERRAIN_HALF, enemy.position.z));
      enemy.position.y = 0;
    }

    this.updateProjectiles(dt, player, allies, isPlayerBlocking, wave, onPlayerHit, onAllyKill);
  }

  private fireAIProjectile(attacker: THREE.Group, target: THREE.Group, data: UnitData) {
    const dir = new THREE.Vector3().subVectors(target.position, attacker.position);
    dir.y = 0;
    dir.normalize();

    let color = 0xcccccc;
    const classId = data.classId ?? '';
    if (classId === 'mage') color = 0xb56576;
    else if (classId === 'archer') color = 0xe9c46a;
    else if (classId === 'necromancer') color = 0x95d5b2;

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshBasicMaterial({ color })
    );
    mesh.position.copy(attacker.position);
    mesh.position.y += 2.0;
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      velocity: dir.multiplyScalar(AI_PROJECTILE_SPEED),
      life: 2.0,
      damageMin: data.damageMin ?? 8,
      damageMax: data.damageMax ?? 16,
    });
  }

  private updateProjectiles(
    dt: number,
    player: THREE.Group,
    allies: THREE.Group[],
    isPlayerBlocking: boolean,
    wave: number,
    onPlayerHit: (dmg: number) => void,
    onAllyKill: (ally: THREE.Group) => void
  ) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.mesh.position.add(proj.velocity.clone().multiplyScalar(dt));
      proj.life -= dt;

      let hit = false;

      // Check hit against player (XZ distance only - projectiles fly at y=2)
      const pDx = proj.mesh.position.x - player.position.x;
      const pDz = proj.mesh.position.z - player.position.z;
      const pDist = Math.sqrt(pDx * pDx + pDz * pDz);
      if (pDist < 2.0) {
        if (isPlayerBlocking) {
          onPlayerHit(0);
        } else {
          const dmg = proj.damageMin + Math.floor(Math.random() * (proj.damageMax - proj.damageMin)) + wave;
          onPlayerHit(dmg);
        }
        hit = true;
      }

      // Check hit against allies
      if (!hit) {
        for (const ally of allies) {
          const aData = ally.userData as UnitData;
          if (aData.health <= 0) continue;
          const aDx = proj.mesh.position.x - ally.position.x;
          const aDz = proj.mesh.position.z - ally.position.z;
          const aDist = Math.sqrt(aDx * aDx + aDz * aDz);
          if (aDist < 1.8) {
            if (aData.isBlocking && Math.random() < 0.3) {
              // Blocked
            } else {
              const dmg = proj.damageMin + Math.floor(Math.random() * (proj.damageMax - proj.damageMin)) + wave;
              aData.health -= dmg;
              aData.stunTimer = 0.3;
              if (aData.health <= 0) {
                onAllyKill(ally);
              } else {
                updateHealthBar(ally);
              }
            }
            hit = true;
            break;
          }
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

  dispose() {
    for (const proj of this.projectiles) {
      this.scene.remove(proj.mesh);
      proj.mesh.geometry.dispose();
      (proj.mesh.material as THREE.Material).dispose();
    }
    this.projectiles = [];
  }
}
