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

export class AllyManager {
  private scene: THREE.Scene;
  private combat: CombatSystem;
  private projectiles: AIProjectile[] = [];

  constructor(scene: THREE.Scene, combat: CombatSystem) {
    this.scene = scene;
    this.combat = combat;
  }

  update(
    dt: number,
    allies: THREE.Group[],
    enemies: THREE.Group[],
    player: THREE.Group,
    allyCommand: 'follow' | 'charge',
    wave: number,
    onKillEnemy: (enemy: THREE.Group) => void
  ) {
    const aliveEnemies = enemies.filter((e) => (e.userData as UnitData).health > 0);

    for (const ally of allies) {
      const data = ally.userData as UnitData;
      if (data.health <= 0) continue;

      data.stunTimer -= dt;
      if (data.stunTimer > 0) continue;

      // Find closest enemy
      let closestEnemy: THREE.Group | null = null;
      let closestDist = Infinity;
      for (const e of aliveEnemies) {
        const d = ally.position.distanceTo(e.position);
        if (d < closestDist) {
          closestDist = d;
          closestEnemy = e;
        }
      }

      const isRanged = data.attackType === 'ranged';
      const engageDist = isRanged ? 15 : 10;

      // Determine target position
      let targetPos: THREE.Vector3;
      if (allyCommand === 'follow' && closestDist > engageDist) {
        const aliveAllies = allies.filter((a) => (a.userData as UnitData).health > 0);
        const idx = aliveAllies.indexOf(ally);
        const total = aliveAllies.length;
        const angle = (idx / Math.max(total, 1)) * Math.PI * 2;
        const formDist = 2.5 + Math.floor(idx / 6) * 1.5;
        targetPos = new THREE.Vector3(
          player.position.x + Math.cos(angle) * formDist,
          0,
          player.position.z + Math.sin(angle) * formDist
        );
      } else if (closestEnemy) {
        targetPos = closestEnemy.position.clone();
      } else {
        const aliveAllies = allies.filter((a) => (a.userData as UnitData).health > 0);
        const idx = aliveAllies.indexOf(ally);
        const angle = (idx / Math.max(aliveAllies.length, 1)) * Math.PI * 2;
        targetPos = new THREE.Vector3(
          player.position.x + Math.cos(angle) * 3,
          0,
          player.position.z + Math.sin(angle) * 3
        );
      }

      const toTarget = new THREE.Vector3().subVectors(targetPos, ally.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      const dir = toTarget.clone().normalize();

      // Face direction
      if (closestEnemy && closestDist < (isRanged ? 15 : 5)) {
        const toE = new THREE.Vector3().subVectors(closestEnemy.position, ally.position);
        toE.y = 0;
        const ta = Math.atan2(toE.x, toE.z);
        let d2 = ta - ally.rotation.y;
        while (d2 > Math.PI) d2 -= Math.PI * 2;
        while (d2 < -Math.PI) d2 += Math.PI * 2;
        ally.rotation.y += d2 * 6 * dt;
      } else if (dist > 0.5) {
        const ta = Math.atan2(dir.x, dir.z);
        let d2 = ta - ally.rotation.y;
        while (d2 > Math.PI) d2 -= Math.PI * 2;
        while (d2 < -Math.PI) d2 += Math.PI * 2;
        ally.rotation.y += d2 * 5 * dt;
      }

      if (isRanged) {
        // Ranged ally behavior
        if (closestEnemy) {
          const toEnemy = new THREE.Vector3().subVectors(closestEnemy.position, ally.position);
          toEnemy.y = 0;
          const eDist = toEnemy.length();
          const eDir = toEnemy.clone().normalize();

          if (eDist < RANGED_MIN_DIST) {
            // Too close - back away
            ally.position.x -= eDir.x * data.speed * 0.7 * dt;
            ally.position.z -= eDir.z * data.speed * 0.7 * dt;
          } else if (eDist > 15) {
            // Too far - close in
            ally.position.x += eDir.x * data.speed * dt;
            ally.position.z += eDir.z * data.speed * dt;
          } else {
            // In range - slight strafe
            data.stateTimer = (data.stateTimer ?? 0) - dt;
            if (data.stateTimer! <= 0) {
              data.strafeDir = (data.strafeDir ?? 1) * -1;
              data.stateTimer = 1 + Math.random() * 1.5;
            }
            const strafe = new THREE.Vector3(-eDir.z, 0, eDir.x).multiplyScalar(data.strafeDir ?? 1);
            ally.position.x += strafe.x * data.speed * 0.4 * dt;
            ally.position.z += strafe.z * data.speed * 0.4 * dt;
          }

          // Ranged attack
          data.attackTimer -= dt;
          if (data.attackTimer <= 0 && !data.isAttacking && eDist < 15) {
            data.isAttacking = true;
            data.attackTime = 0;
            data.attackTimer = data.attackCooldown;
            data.hitThisSwing = false;
          }
        } else if (dist > 1.5) {
          ally.position.x += dir.x * data.speed * dt;
          ally.position.z += dir.z * data.speed * dt;
        }

        // Ranged attack animation
        if (data.isAttacking) {
          data.attackTime += dt;
          const progress = data.attackTime / 0.5;

          if (progress < 0.45) {
            data.rightArm.rotation.x = -1.5 * (progress / 0.45);
          } else {
            data.rightArm.rotation.x = -1.5 + 1.5 * ((progress - 0.45) / 0.55);
          }

          if (progress > 0.45 && progress < 0.55 && !data.hitThisSwing && closestEnemy) {
            data.hitThisSwing = true;
            this.fireAllyProjectile(ally, closestEnemy, data);
          }

          if (progress >= 1) {
            data.isAttacking = false;
            data.rightArm.rotation.x = 0;
          }
        }
      } else {
        // Melee ally behavior
        if (closestEnemy && closestDist < MELEE_ENGAGE_DIST) {
          data.attackTimer -= dt;
          if (data.attackTimer <= 0 && !data.isAttacking) {
            data.isAttacking = true;
            data.attackTime = 0;
            data.attackTimer = data.attackCooldown;
            data.hitThisSwing = false;
          }
        } else if (dist > 1.5) {
          ally.position.x += dir.x * data.speed * dt;
          ally.position.z += dir.z * data.speed * dt;
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

          // Hit check
          if (progress > 0.4 && progress < 0.65 && closestEnemy && closestDist < MELEE_HIT_DIST + 0.3 && !data.hitThisSwing) {
            data.hitThisSwing = true;
            const eData = closestEnemy.userData as UnitData;
            if (eData.isBlocking && Math.random() < 0.45) {
              // Blocked
            } else {
              const dmgMin = data.damageMin ?? 12;
              const dmgMax = data.damageMax ?? 22;
              const dmg = dmgMin + Math.floor(Math.random() * (dmgMax - dmgMin)) + Math.floor(wave * 0.5);
              this.combat.checkMeleeHit(
                ally,
                [closestEnemy],
                MELEE_HIT_DIST + 0.3,
                dmg,
                dmg,
                new Set(),
                onKillEnemy
              );
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
        if (closestEnemy && closestDist < 4 && Math.random() < 0.02) {
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
      for (const other of allies) {
        if (other === ally || (other.userData as UnitData).health <= 0) continue;
        const sep = new THREE.Vector3().subVectors(ally.position, other.position);
        sep.y = 0;
        if (sep.length() < UNIT_AVOIDANCE_DIST && sep.length() > 0.01) {
          ally.position.add(sep.normalize().multiplyScalar(1.5 * dt));
        }
      }

      const toP = new THREE.Vector3().subVectors(ally.position, player.position);
      toP.y = 0;
      if (toP.length() < UNIT_AVOIDANCE_DIST && toP.length() > 0.01) {
        ally.position.add(toP.normalize().multiplyScalar(2 * dt));
      }

      ally.position.x = Math.max(-TERRAIN_HALF, Math.min(TERRAIN_HALF, ally.position.x));
      ally.position.z = Math.max(-TERRAIN_HALF, Math.min(TERRAIN_HALF, ally.position.z));
      ally.position.y = 0;
    }

    this.updateProjectiles(dt, enemies, wave, onKillEnemy);
  }

  private fireAllyProjectile(attacker: THREE.Group, target: THREE.Group, data: UnitData) {
    const dir = new THREE.Vector3().subVectors(target.position, attacker.position);
    dir.y = 0;
    dir.normalize();

    let color = 0x6699ff;
    const classId = data.classId ?? '';
    if (classId === 'mage') color = 0x7799ff;
    else if (classId === 'archer') color = 0x88ccff;
    else if (classId === 'necromancer') color = 0x66ffaa;

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
      damageMin: data.damageMin ?? 10,
      damageMax: data.damageMax ?? 20,
    });
  }

  private updateProjectiles(
    dt: number,
    enemies: THREE.Group[],
    wave: number,
    onKillEnemy: (enemy: THREE.Group) => void
  ) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.mesh.position.add(proj.velocity.clone().multiplyScalar(dt));
      proj.life -= dt;

      let hit = false;

      // Check hit against enemies
      for (const enemy of enemies) {
        const eData = enemy.userData as UnitData;
        if (eData.health <= 0) continue;
        const eDx = proj.mesh.position.x - enemy.position.x;
        const eDz = proj.mesh.position.z - enemy.position.z;
        const eDist = Math.sqrt(eDx * eDx + eDz * eDz);
        if (eDist < 1.8) {
          if (eData.isBlocking && Math.random() < 0.3) {
            // Blocked
          } else {
            const dmg = proj.damageMin + Math.floor(Math.random() * (proj.damageMax - proj.damageMin)) + Math.floor(wave * 0.5);
            eData.health -= dmg;
            eData.stunTimer = 0.3;
            if (eData.health <= 0) {
              onKillEnemy(enemy);
            } else {
              updateHealthBar(enemy);
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

  dispose() {
    for (const proj of this.projectiles) {
      this.scene.remove(proj.mesh);
      proj.mesh.geometry.dispose();
      (proj.mesh.material as THREE.Material).dispose();
    }
    this.projectiles = [];
  }
}
