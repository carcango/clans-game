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

// --- Second Ability Animations ---

export function updateWarLeapAnimation(unit: THREE.Group, velY: number) {
  const data = unit.userData as UnitData;
  const ascending = velY > 0;

  if (ascending) {
    // Superman pose: both arms overhead, legs back, torso forward
    data.rightArm.rotation.x = -2.8;
    data.rightArm.rotation.z = 0.3;
    data.leftArm.rotation.x = -2.8;
    data.leftArm.rotation.z = -0.3;
    if (data.leftLeg) data.leftLeg.rotation.x = 0.5;
    if (data.rightLeg) data.rightLeg.rotation.x = 0.7;
    if (data.torso) data.torso.rotation.x = -0.2;
    if (data.headGroup) data.headGroup.rotation.x = -0.15;
  } else {
    // Descending: fists forward for ground slam
    data.rightArm.rotation.x = -1.6;
    data.rightArm.rotation.z = 0.5;
    data.leftArm.rotation.x = -1.6;
    data.leftArm.rotation.z = -0.5;
    if (data.leftLeg) data.leftLeg.rotation.x = 0.7;
    if (data.rightLeg) data.rightLeg.rotation.x = 0.7;
    if (data.torso) data.torso.rotation.x = -0.3;
    if (data.headGroup) data.headGroup.rotation.x = -0.2;
  }
}

export function updateHolyChargeAnimation(unit: THREE.Group, progress: number, time: number) {
  const data = unit.userData as UnitData;
  const ramp = Math.min(1, progress * 5); // quickly reach full charge pose

  // Left arm (shield) thrust forward
  data.leftArm.rotation.x = -1.5 * ramp;
  data.leftArm.rotation.z = -0.3 * ramp;
  // Right arm pulled back (weapon ready)
  data.rightArm.rotation.x = 0.6 * ramp;
  data.rightArm.rotation.z = 0.2 * ramp;
  // Torso leaned forward aggressively
  if (data.torso) data.torso.rotation.x = -0.25 * ramp;
  // Head ducked behind shield
  if (data.headGroup) data.headGroup.rotation.x = -0.2 * ramp;
  // Fast leg pumping
  const legFreq = 22;
  if (data.leftLeg) data.leftLeg.rotation.x = Math.sin(time * legFreq) * 0.6 * ramp;
  if (data.rightLeg) data.rightLeg.rotation.x = Math.sin(time * legFreq + Math.PI) * 0.6 * ramp;
}

export function updateEvasiveRollAnimation(unit: THREE.Group, progress: number) {
  const data = unit.userData as UnitData;

  // 3-phase roll: crouch → tuck → spring up
  if (progress < 0.3) {
    // Phase 1: quick crouch
    const p = progress / 0.3;
    if (data.torso) data.torso.rotation.x = -0.8 * p;
    data.rightArm.rotation.x = -1.2 * p;
    data.rightArm.rotation.z = -0.3 * p;
    data.leftArm.rotation.x = -1.2 * p;
    data.leftArm.rotation.z = 0.3 * p;
    if (data.headGroup) data.headGroup.rotation.x = -0.3 * p;
    if (data.leftLeg) data.leftLeg.rotation.x = 0.8 * p;
    if (data.rightLeg) data.rightLeg.rotation.x = 0.8 * p;
  } else if (progress < 0.75) {
    // Phase 2: tight tuck (full forward lean)
    const p = (progress - 0.3) / 0.45;
    if (data.torso) data.torso.rotation.x = -0.8 - 0.6 * Math.sin(p * Math.PI);
    data.rightArm.rotation.x = -1.2 - 0.5 * Math.sin(p * Math.PI);
    data.rightArm.rotation.z = -0.3 - 0.3 * Math.sin(p * Math.PI);
    data.leftArm.rotation.x = -1.2 - 0.5 * Math.sin(p * Math.PI);
    data.leftArm.rotation.z = 0.3 + 0.3 * Math.sin(p * Math.PI);
    if (data.headGroup) data.headGroup.rotation.x = -0.3 - 0.2 * Math.sin(p * Math.PI);
    if (data.leftLeg) data.leftLeg.rotation.x = 0.8 + 0.3 * Math.sin(p * Math.PI);
    if (data.rightLeg) data.rightLeg.rotation.x = 0.8 + 0.3 * Math.sin(p * Math.PI);
  } else {
    // Phase 3: spring up
    const p = (progress - 0.75) / 0.25;
    if (data.torso) data.torso.rotation.x = -0.8 * (1 - p);
    data.rightArm.rotation.x = -1.2 * (1 - p);
    data.rightArm.rotation.z = -0.3 * (1 - p);
    data.leftArm.rotation.x = -1.2 * (1 - p);
    data.leftArm.rotation.z = 0.3 * (1 - p);
    if (data.headGroup) data.headGroup.rotation.x = -0.3 * (1 - p);
    if (data.leftLeg) data.leftLeg.rotation.x = 0.8 * (1 - p);
    if (data.rightLeg) data.rightLeg.rotation.x = 0.8 * (1 - p);
  }
}

export function updateShadowStepAnimation(unit: THREE.Group, progress: number) {
  const data = unit.userData as UnitData;
  // Landing crouch → spring up with daggers ready
  const crouch = 1 - progress; // starts crouched, ends standing

  // Knees bent
  if (data.leftLeg) data.leftLeg.rotation.x = 0.7 * crouch;
  if (data.rightLeg) data.rightLeg.rotation.x = 0.5 * crouch;
  // Arms: daggers ready at sides
  data.rightArm.rotation.x = -1.0 * crouch;
  data.rightArm.rotation.z = 0.4 * crouch;
  data.leftArm.rotation.x = -0.6 * crouch;
  data.leftArm.rotation.z = -0.4 * crouch;
  // Torso crouched forward
  if (data.torso) data.torso.rotation.x = -0.25 * crouch;
  if (data.headGroup) data.headGroup.rotation.x = -0.1 * crouch;
}

export function updateBlinkAnimation(unit: THREE.Group, progress: number) {
  const data = unit.userData as UnitData;
  // Arcane recoil: arms thrust forward, then relax
  const power = 1 - progress;

  data.rightArm.rotation.x = -1.8 * power;
  data.rightArm.rotation.z = -0.2 * power;
  data.leftArm.rotation.x = -1.8 * power;
  data.leftArm.rotation.z = 0.2 * power;
  if (data.torso) data.torso.rotation.x = 0.15 * power;
  if (data.headGroup) data.headGroup.rotation.x = 0.15 * power;
}

export function updateSoulDrainAnimation(unit: THREE.Group, progress: number) {
  const data = unit.userData as UnitData;
  // Arms-wide channeling: ramp up then sustain then fade
  const power = progress < 0.2 ? progress / 0.2 : progress > 0.7 ? (1 - progress) / 0.3 : 1;

  // Arms spread wide
  data.rightArm.rotation.x = -0.4 * power;
  data.rightArm.rotation.z = -1.3 * power;
  data.leftArm.rotation.x = -0.4 * power;
  data.leftArm.rotation.z = 1.3 * power;
  // Head tilted back
  if (data.headGroup) data.headGroup.rotation.x = 0.25 * power;
  // Torso arched back slightly
  if (data.torso) data.torso.rotation.x = 0.12 * power;
  // Slight levitation feel — legs together
  if (data.leftLeg) data.leftLeg.rotation.x = -0.1 * power;
  if (data.rightLeg) data.rightLeg.rotation.x = -0.1 * power;
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
