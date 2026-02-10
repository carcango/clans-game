import * as THREE from 'three';
import { UnitData } from '../types/game';

/**
 * Stateless procedural animation functions for all unit types.
 * Operates on any THREE.Group whose userData implements UnitData.
 */

export function updateIdleAnimation(unit: THREE.Group, dt: number, time: number) {
  const data = unit.userData as UnitData;
  const t = time + data.animTimeOffset;

  // Subtle torso breathing (Y scale oscillation)
  if (data.torso) {
    data.torso.scale.y = 1 + Math.sin(t * 2) * 0.015;
    data.torso.scale.x = 1 + Math.sin(t * 2 + 0.5) * 0.008;
  }

  // Head slow-look
  if (data.headGroup) {
    data.headGroup.rotation.y = Math.sin(t * 0.7) * 0.08;
    data.headGroup.rotation.x = Math.sin(t * 0.5) * 0.04;
  }

  // Gentle arm sway
  if (!data.isAttacking && !data.isBlocking) {
    data.rightArm.rotation.x = Math.sin(t * 1.2) * 0.06;
    data.leftArm.rotation.x = Math.sin(t * 1.2 + Math.PI) * 0.06;
  }

  // Legs return to neutral
  if (data.leftLeg) {
    data.leftLeg.rotation.x *= 0.9;
  }
  if (data.rightLeg) {
    data.rightLeg.rotation.x *= 0.9;
  }
}

export function updateLocomotionAnimation(unit: THREE.Group, dt: number, time: number, speed: number) {
  const data = unit.userData as UnitData;
  data.moveSpeed = speed;
  const t = time + data.animTimeOffset;

  if (speed < 0.5) return; // not really moving

  const freq = 8 + speed * 0.5;
  const amplitude = Math.min(0.6, 0.2 + speed * 0.04);

  // Leg swing (sin-based, frequency/amplitude scale with speed)
  if (data.leftLeg) {
    data.leftLeg.rotation.x = Math.sin(t * freq) * amplitude;
  }
  if (data.rightLeg) {
    data.rightLeg.rotation.x = Math.sin(t * freq + Math.PI) * amplitude;
  }

  // Arm counter-swing (only if not attacking/blocking)
  if (!data.isAttacking && !data.isBlocking) {
    data.rightArm.rotation.x = Math.sin(t * freq + Math.PI) * amplitude * 0.5;
    data.leftArm.rotation.x = Math.sin(t * freq) * amplitude * 0.5;
  }

  // Slight torso twist
  if (data.torso) {
    data.torso.rotation.y = Math.sin(t * freq) * 0.04;
  }

  // Vertical bounce
  unit.position.y = Math.abs(Math.sin(t * freq)) * 0.08;
}

export function updateMeleeAttackAnimation(unit: THREE.Group, progress: number) {
  const data = unit.userData as UnitData;

  if (progress < 0.25) {
    // Wind-up: arm back + torso wind
    const p = progress / 0.25;
    data.rightArm.rotation.x = -2.2 * p;
    data.rightArm.rotation.z = 0.4 * p;
    if (data.torso) {
      data.torso.rotation.y = 0.2 * p;
    }
  } else if (progress < 0.5) {
    // Strike: fast forward swing + torso unwind
    const p = (progress - 0.25) / 0.25;
    data.rightArm.rotation.x = -2.2 + 3.5 * p;
    data.rightArm.rotation.z = 0.4 - 1.0 * p;
    if (data.torso) {
      data.torso.rotation.y = 0.2 - 0.4 * p;
    }
  } else {
    // Follow-through + recovery
    const p = (progress - 0.5) / 0.5;
    data.rightArm.rotation.x = 1.3 * (1 - p);
    data.rightArm.rotation.z = -0.6 * (1 - p);
    if (data.torso) {
      data.torso.rotation.y = -0.2 * (1 - p);
    }
  }
}

export function updateRangedAttackAnimation(unit: THREE.Group, progress: number) {
  const data = unit.userData as UnitData;

  if (progress < 0.35) {
    // Draw-back with torso lean
    const p = progress / 0.35;
    data.rightArm.rotation.x = -1.8 * p;
    if (data.torso) {
      data.torso.rotation.x = -0.08 * p;
    }
  } else if (progress < 0.5) {
    // Release
    const p = (progress - 0.35) / 0.15;
    data.rightArm.rotation.x = -1.8 + 2.0 * p;
    if (data.torso) {
      data.torso.rotation.x = -0.08 + 0.12 * p;
    }
  } else {
    // Recovery
    const p = (progress - 0.5) / 0.5;
    data.rightArm.rotation.x = 0.2 * (1 - p);
    if (data.torso) {
      data.torso.rotation.x = 0.04 * (1 - p);
    }
  }
}

export function triggerHitReaction(unit: THREE.Group, fromDirection: THREE.Vector3) {
  const data = unit.userData as UnitData;
  data.hitReactTimer = 0.25;
  data.hitFlashTimer = 0.12;
  data.hitReactDirection.copy(fromDirection).normalize();
}

export function updateHitReaction(unit: THREE.Group, dt: number) {
  const data = unit.userData as UnitData;
  if (data.hitReactTimer <= 0) return;

  data.hitReactTimer -= dt;
  const t = Math.max(0, data.hitReactTimer) / 0.25;

  // Flinch backward (torso tilt + positional nudge)
  if (data.torso) {
    data.torso.rotation.x += data.hitReactDirection.z * 0.15 * t;
    data.torso.rotation.z += -data.hitReactDirection.x * 0.1 * t;
  }
}

export function updateHitFlash(unit: THREE.Group, dt: number) {
  const data = unit.userData as UnitData;
  if (data.hitFlashTimer <= 0) return;

  data.hitFlashTimer -= dt;
  const flashing = data.hitFlashTimer > 0;

  // Brief white emissive flash on all mesh materials
  unit.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat.emissive) {
        if (flashing) {
          mat.emissive.setHex(0xffffff);
          mat.emissiveIntensity = 0.6;
        } else {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      }
    }
  });
}

export function resetAttackPose(unit: THREE.Group) {
  const data = unit.userData as UnitData;
  data.rightArm.rotation.x = 0;
  data.rightArm.rotation.z = 0;
  if (data.torso) {
    data.torso.rotation.y = 0;
    data.torso.rotation.x = 0;
  }
}
