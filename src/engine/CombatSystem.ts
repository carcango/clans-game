import * as THREE from 'three';
import { UnitData } from '../types/game';
import { ParticleSystem } from './ParticleSystem';
import { updateHealthBar } from './VoxelCharacterBuilder';
import { triggerHitReaction } from './UnitAnimator';
import { DamageNumberSystem } from './DamageNumberSystem';

export class CombatSystem {
  private particles: ParticleSystem;
  private damageNumbers: DamageNumberSystem | null = null;

  constructor(particles: ParticleSystem) {
    this.particles = particles;
  }

  setDamageNumbers(dns: DamageNumberSystem) {
    this.damageNumbers = dns;
  }

  checkMeleeHit(
    attacker: THREE.Group,
    targets: THREE.Group[],
    range: number,
    damageMin: number,
    damageMax: number,
    hitSet: Set<THREE.Group>,
    onKill?: (target: THREE.Group) => void,
    damageMultiplier = 1
  ): { hit: boolean; damage: number; target: THREE.Group | null } {
    const fwd = new THREE.Vector3(
      Math.sin(attacker.rotation.y),
      0,
      Math.cos(attacker.rotation.y)
    );

    for (const target of targets) {
      const data = target.userData as UnitData;
      if (data.health <= 0 || hitSet.has(target)) continue;

      const toTarget = new THREE.Vector3().subVectors(target.position, attacker.position);
      toTarget.y = 0;
      const dist = toTarget.length();

      if (dist < range && fwd.dot(toTarget.normalize()) > 0.3) {
        hitSet.add(target);

        if (data.isBlocking && Math.random() < 0.45) {
          this.particles.createBlockSparks(target.position);
          data.stunTimer = 0.3;
          return { hit: true, damage: 0, target };
        }

        const dmg = Math.floor(
          (damageMin + Math.random() * (damageMax - damageMin)) * damageMultiplier
        );
        data.health -= dmg;
        data.stunTimer = 0.5;
        this.particles.createBloodEffect(target.position);

        // Hit reaction
        const hitDir = toTarget.normalize();
        triggerHitReaction(target, hitDir);

        // Damage number
        const isCrit = damageMultiplier > 1;
        this.damageNumbers?.spawn(target.position, dmg, isCrit);

        // Knockback
        const kb = toTarget.normalize().multiplyScalar(0.5);
        target.position.add(kb);

        if (data.health <= 0) {
          onKill?.(target);
        } else {
          updateHealthBar(target);
        }
        return { hit: true, damage: dmg, target };
      }
    }
    return { hit: false, damage: 0, target: null };
  }

  checkRangedHit(
    projectilePos: THREE.Vector3,
    targets: THREE.Group[],
    damageMin: number,
    damageMax: number,
    aoeRadius: number,
    onKill?: (target: THREE.Group) => void,
    damageMultiplier = 1
  ): { hit: boolean; totalDamage: number } {
    let totalDamage = 0;
    let anyHit = false;

    for (const target of targets) {
      const data = target.userData as UnitData;
      if (data.health <= 0) continue;

      const dx = projectilePos.x - target.position.x;
      const dz = projectilePos.z - target.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < (aoeRadius > 0 ? aoeRadius : 2.0)) {
        anyHit = true;

        if (data.isBlocking && Math.random() < 0.3) {
          this.particles.createBlockSparks(target.position);
          continue;
        }

        const dmg = Math.floor(
          (damageMin + Math.random() * (damageMax - damageMin)) * damageMultiplier
        );
        data.health -= dmg;
        data.stunTimer = 0.3;
        totalDamage += dmg;
        this.particles.createBloodEffect(target.position);

        // Hit reaction
        const hitDir = new THREE.Vector3(dx, 0, dz).normalize();
        triggerHitReaction(target, hitDir);

        // Damage number
        const isCrit = damageMultiplier > 1;
        this.damageNumbers?.spawn(target.position, dmg, isCrit);

        if (data.health <= 0) {
          onKill?.(target);
        } else {
          updateHealthBar(target);
        }

        // For non-AoE, stop at first hit
        if (aoeRadius <= 0) break;
      }
    }

    return { hit: anyHit, totalDamage };
  }

  processAIAttack(
    attacker: THREE.Group,
    target: THREE.Group,
    dt: number,
    wave: number,
    onPlayerHit?: (dmg: number) => void,
    onAllyKill?: (ally: THREE.Group) => void
  ) {
    const aData = attacker.userData as UnitData;
    if (!aData.isAttacking) return;

    aData.attackTime += dt;
    const progress = aData.attackTime / 0.4;

    // Arm animation
    if (progress < 0.4) {
      aData.rightArm.rotation.x = -2.0 * (progress / 0.4);
    } else {
      aData.rightArm.rotation.x = -2.0 + 3.0 * ((progress - 0.4) / 0.6);
    }

    const tData = target.userData as UnitData;
    const dist = attacker.position.distanceTo(target.position);

    // Hit window
    if (progress > 0.4 && progress < 0.6 && dist < 3.2 && !aData.hitThisSwing) {
      aData.hitThisSwing = true;

      if (tData.team === 'player') {
        const dmg = 8 + Math.floor(Math.random() * 8) + wave;
        onPlayerHit?.(dmg);
      } else {
        if (tData.isBlocking && Math.random() < 0.45) {
          this.particles.createBlockSparks(target.position);
        } else {
          const dmg = 10 + Math.floor(Math.random() * 8) + wave;
          tData.health -= dmg;
          tData.stunTimer = 0.3;
          this.particles.createBloodEffect(target.position);

          // Hit reaction
          const hitDir = new THREE.Vector3().subVectors(target.position, attacker.position).normalize();
          triggerHitReaction(target, hitDir);
          this.damageNumbers?.spawn(target.position, dmg);

          if (tData.health <= 0) {
            onAllyKill?.(target);
          } else {
            updateHealthBar(target);
          }
        }
      }
    }

    if (progress >= 1) {
      aData.isAttacking = false;
      aData.rightArm.rotation.x = 0;
    }
  }
}
