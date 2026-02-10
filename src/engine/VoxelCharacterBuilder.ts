import * as THREE from 'three';
import { HeroClass, ColorPalette } from '../types/hero';
import { UnitData } from '../types/game';

const matDarkMetal = () => new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.8, roughness: 0.4 });
const matBrightMetal = () => new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3 });
const matBrown = () => new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
const matWood = () => new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });
const matGold = () => new THREE.MeshStandardMaterial({ color: 0xc8a96e, metalness: 0.7, roughness: 0.3 });

function buildVoxel(w: number, h: number, d: number, x: number, y: number, z: number, color: number, emissive = false): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color,
      emissive: emissive ? color : 0x000000,
      emissiveIntensity: emissive ? 0.5 : 0,
      roughness: 0.6,
      metalness: 0.2,
    })
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

function buildWeapon(type: string, sizeMod: number, colors: ColorPalette, level: number): THREE.Group {
  const weapon = new THREE.Group();

  switch (type) {
    case 'sword': {
      weapon.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 6), matBrown()));
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.06), matGold());
      guard.position.y = 0.15;
      weapon.add(guard);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75 * sizeMod, 0.02), matBrightMetal());
      blade.position.y = 0.55;
      blade.castShadow = true;
      weapon.add(blade);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), matBrightMetal());
      tip.position.y = 0.55 + 0.375 * sizeMod + 0.06;
      weapon.add(tip);
      const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), matGold());
      pommel.position.y = -0.16;
      weapon.add(pommel);
      if (level >= 3) {
        weapon.add(buildVoxel(0.04, 0.6, 0.02, 0, 0.7, 0.02, 0xffffff, true));
      }
      break;
    }
    case 'bow': {
      weapon.add(buildVoxel(0.1, 1.8 * sizeMod, 0.1, 0, 0.5, 0, 0x8b4513));
      weapon.add(buildVoxel(0.1, 0.1, 0.6, 0, 0.5 + 0.9 * sizeMod, 0, 0x8b4513));
      weapon.add(buildVoxel(0.1, 0.1, 0.6, 0, 0.5 - 0.9 * sizeMod + 0.1, 0, 0x8b4513));
      weapon.add(buildVoxel(0.02, 1.6 * sizeMod, 0.02, 0, 0.5, 0.25, 0xcccccc));
      break;
    }
    case 'staff': {
      weapon.add(buildVoxel(0.12, 2.8, 0.12, 0, 0.5, 0, 0x5e503f));
      weapon.add(buildVoxel(0.35 * sizeMod, 0.35 * sizeMod, 0.35 * sizeMod, 0, 1.9, 0, colors.accent, level >= 3));
      break;
    }
    case 'mace': {
      weapon.add(buildVoxel(0.1, 1.0, 0.1, 0, 0.3, 0, 0x6b4226));
      weapon.add(buildVoxel(0.3 * sizeMod, 0.35 * sizeMod, 0.3 * sizeMod, 0, 0.9, 0, 0x888888));
      const spikes = [
        [0.15, 0.9, 0], [-0.15, 0.9, 0], [0, 0.9, 0.15], [0, 0.9, -0.15],
      ];
      spikes.forEach(([sx, sy, sz]) => {
        weapon.add(buildVoxel(0.08, 0.08, 0.08, sx!, sy!, sz!, 0xaaaaaa));
      });
      break;
    }
    case 'dagger': {
      weapon.add(buildVoxel(0.06, 0.2, 0.06, 0, 0, 0, 0x5a3a1a));
      weapon.add(buildVoxel(0.12, 0.03, 0.04, 0, 0.1, 0, 0xc8a96e));
      weapon.add(buildVoxel(0.04, 0.4 * sizeMod, 0.02, 0, 0.35, 0, 0xbbbbbb));
      break;
    }
    case 'scythe': {
      weapon.add(buildVoxel(0.1, 2.5, 0.1, 0, 0.5, 0, 0x4a3520));
      weapon.add(buildVoxel(0.6 * sizeMod, 0.06, 0.04, -0.25, 1.8, 0, 0x888888));
      weapon.add(buildVoxel(0.06, 0.4 * sizeMod, 0.04, -0.52, 1.6, 0, 0x888888));
      if (level >= 3) {
        weapon.add(buildVoxel(0.04, 0.35, 0.02, -0.52, 1.6, 0.03, colors.accent, true));
      }
      break;
    }
    default:
      break;
  }

  return weapon;
}

function buildShield(sizeMod: number, color: number): THREE.Group {
  const shield = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.5 * sizeMod, 0.65 * sizeMod, 0.06),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.2 })
  );
  body.castShadow = true;
  shield.add(body);
  const boss = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), matGold());
  boss.position.set(0, 0, 0.04);
  shield.add(boss);
  const rimMat = matDarkMetal();
  [0.33 * sizeMod * 0.5, -0.33 * sizeMod * 0.5].forEach((y) => {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(0.54 * sizeMod, 0.03, 0.08), rimMat);
    rim.position.set(0, y, 0);
    shield.add(rim);
  });
  return shield;
}

export interface CharacterBuildOptions {
  heroClass: HeroClass;
  team: 'player' | 'ally' | 'enemy';
  forPreview?: boolean;
}

/**
 * Build a chunky voxel character (Minecraft-style proportions).
 * Returns a THREE.Group with userData containing rightArm/leftArm refs for animation.
 */
export function buildCharacter(options: CharacterBuildOptions): THREE.Group {
  const { heroClass, team, forPreview } = options;
  const c = heroClass.colors;
  const level = heroClass.level;
  const sizeMod = level >= 3 ? 1.3 : 1.0;

  // Team color override for battle
  let armorColor: number;
  if (team === 'enemy') {
    const reds = [0x6b2222, 0x5a1a1a, 0x7a3333, 0x8a2020, 0x4a1515];
    armorColor = reds[Math.floor(Math.random() * reds.length)];
  } else if (team === 'ally') {
    const blues = [0x2255aa, 0x1a4a8a, 0x2a5a9a, 0x3366bb, 0x1a5577];
    armorColor = blues[Math.floor(Math.random() * blues.length)];
  } else {
    armorColor = c.primary;
  }

  const group = new THREE.Group();
  const armorMat = new THREE.MeshStandardMaterial({ color: armorColor, roughness: 0.6, metalness: 0.3 });
  const skinMat = new THREE.MeshStandardMaterial({
    color: team === 'player' ? c.skin : (0xc49560 + Math.floor(Math.random() * 30) * 0x010101),
    roughness: 0.8,
  });

  // Torso - chunky
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.8), armorMat);
  torso.position.y = 1.7;
  torso.castShadow = true;
  group.add(torso);

  // Belt
  const belt = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 0.9), matBrown());
  belt.position.y = 1.0;
  group.add(belt);

  // Head
  const headGroup = new THREE.Group();
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), skinMat);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.1), eyeMat);
  leftEye.position.set(-0.25, -0.05, 0.5);
  headGroup.add(leftEye);
  const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.1), eyeMat);
  rightEye.position.set(0.25, -0.05, 0.5);
  headGroup.add(rightEye);

  // Head equipment - class-specific for ALL teams
  const headEquip = heroClass.equipment.head;
  const headColor = team === 'player' ? c.primary : armorColor;
  const headSecondary = team === 'player' ? c.secondary : armorColor;

  if (headEquip === 'helmet') {
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 1.1), matDarkMetal());
    helmet.position.y = 0.5;
    helmet.castShadow = true;
    headGroup.add(helmet);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, 0.2), matDarkMetal());
    visor.position.set(0, 0.2, 0.5);
    headGroup.add(visor);
    if (level >= 3) {
      headGroup.add(buildVoxel(0.1, 0.5, 0.1, 0, 0.8, 0, c.accent, true));
    }
  } else if (headEquip === 'hood') {
    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.1, 1.1),
      new THREE.MeshStandardMaterial({ color: headColor, roughness: 0.8 })
    );
    hood.position.set(0, 0.05, -0.1);
    headGroup.add(hood);
  } else if (headEquip === 'wizard_hat') {
    const brim = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.1, 1.5),
      new THREE.MeshStandardMaterial({ color: headSecondary, roughness: 0.7 })
    );
    brim.position.y = 0.5;
    headGroup.add(brim);
    const mid = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.MeshStandardMaterial({ color: headSecondary, roughness: 0.7 })
    );
    mid.position.y = 0.9;
    headGroup.add(mid);
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.4, 0.4),
      new THREE.MeshStandardMaterial({ color: headSecondary, roughness: 0.7 })
    );
    top.position.y = 1.5;
    headGroup.add(top);
    if (level >= 3) {
      headGroup.add(buildVoxel(0.15, 0.15, 0.15, 0, 1.8, 0, c.accent, true));
    }
  } else if (headEquip === 'crown') {
    const crown = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 1.1), matGold());
    crown.position.y = 0.5;
    headGroup.add(crown);
    [-0.3, -0.1, 0.1, 0.3].forEach((xp) => {
      const spike = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), matGold());
      spike.position.set(xp, 0.7, 0);
      headGroup.add(spike);
    });
  } else if (headEquip === 'mask') {
    const mask = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.5, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 })
    );
    mask.position.set(0, 0, 0.5);
    headGroup.add(mask);
  }

  headGroup.position.y = 2.9;
  group.add(headGroup);

  // Legs - each leg is a Group with hip-joint pivot for animation
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.35, 1.0, 0); // pivot at hip
  const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), armorMat);
  leftLegMesh.position.set(0, -0.4, 0); // offset from pivot
  leftLegMesh.castShadow = true;
  leftLegGroup.add(leftLegMesh);
  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.5), matBrown());
  leftBoot.position.set(0, -0.85, 0.05);
  leftLegGroup.add(leftBoot);
  group.add(leftLegGroup);

  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.35, 1.0, 0); // pivot at hip
  const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), armorMat);
  rightLegMesh.position.set(0, -0.4, 0);
  rightLegMesh.castShadow = true;
  rightLegGroup.add(rightLegMesh);
  const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.5), matBrown());
  rightBoot.position.set(0, -0.85, 0.05);
  rightLegGroup.add(rightBoot);
  group.add(rightLegGroup);

  // Level 2+ pauldrons & waist guard
  if (level >= 2) {
    const pauldronMat = new THREE.MeshStandardMaterial({ color: team === 'player' ? c.secondary : armorColor, roughness: 0.5, metalness: 0.4 });
    const lp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), pauldronMat);
    lp.position.set(-0.9, 2.3, 0);
    lp.castShadow = true;
    group.add(lp);
    const rp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), pauldronMat);
    rp.position.set(0.9, 2.3, 0);
    rp.castShadow = true;
    group.add(rp);
    const waist = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.2, 0.9),
      new THREE.MeshStandardMaterial({ color: team === 'player' ? c.accent : armorColor, roughness: 0.6 })
    );
    waist.position.y = 1.0;
    group.add(waist);
  }

  // Right arm (single box per arm, pivot at shoulder)
  const rightArm = new THREE.Group();
  const rArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), armorMat);
  rArmMesh.position.set(0, -0.4, 0);
  rArmMesh.castShadow = true;
  rightArm.add(rArmMesh);

  // Weapon - class-specific for ALL teams
  const weaponType = heroClass.equipment.rightHand;
  if (weaponType && weaponType !== 'empty') {
    const weapon = buildWeapon(weaponType, sizeMod, c, team === 'player' ? level : 1);
    weapon.position.set(0, -0.4, 0.3);
    rightArm.add(weapon);
  }

  rightArm.position.set(0.85, 1.8, 0);
  group.add(rightArm);

  // Left arm + offhand - class-specific for ALL teams
  const leftArm = new THREE.Group();
  const lArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), armorMat);
  lArmMesh.position.set(0, -0.4, 0);
  lArmMesh.castShadow = true;
  leftArm.add(lArmMesh);

  const leftHandType = heroClass.equipment.leftHand;
  if (leftHandType === 'shield') {
    const shieldColor = (team === 'player' || team === 'ally') ? 0x1a3a6b : 0x6b1a1a;
    const shield = buildShield(sizeMod, shieldColor);
    shield.position.set(0, -0.65, 0.15);
    leftArm.add(shield);
  } else if (leftHandType === 'book') {
    leftArm.add(buildVoxel(0.35, 0.45, 0.12, 0, -0.5, 0.1, 0xfefae0));
    leftArm.add(buildVoxel(0.38, 0.48, 0.06, 0, -0.5, 0.04, team === 'player' ? c.secondary : armorColor));
  } else if (leftHandType === 'orb') {
    const orbMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18 * sizeMod, 8, 8),
      new THREE.MeshStandardMaterial({ color: c.accent, emissive: c.accent, emissiveIntensity: 0.4, roughness: 0.3 })
    );
    orbMesh.position.set(0, -0.6, 0.1);
    leftArm.add(orbMesh);
  } else if (leftHandType === 'dagger') {
    const dagger = buildWeapon('dagger', sizeMod, c, team === 'player' ? level : 1);
    dagger.position.set(0, -0.4, 0.3);
    leftArm.add(dagger);
  }

  leftArm.position.set(-0.85, 1.8, 0);
  group.add(leftArm);

  // Cape (level 3 or non-player teams)
  if (level >= 3 || team !== 'player') {
    const capeColor = team === 'enemy' ? 0xaa2222 : team === 'ally' ? 0x2255aa : c.accent;
    const cape = buildVoxel(1.4, 2.4, 0.1, 0, 1.5, -0.5, capeColor);
    group.add(cape);
  }

  // Level 3 aura particles (player only)
  if (level >= 3 && (team === 'player' || forPreview)) {
    [
      [1.2, 3.0, 0.5],
      [-1.2, 2.5, -0.5],
      [0.6, 3.4, -0.4],
    ].forEach(([ax, ay, az]) => {
      group.add(buildVoxel(0.1, 0.1, 0.1, ax!, ay!, az!, 0xffffff, true));
    });
  }

  // Store refs for animation
  group.userData.rightArm = rightArm;
  group.userData.leftArm = leftArm;
  group.userData.leftLeg = leftLegGroup;
  group.userData.rightLeg = rightLegGroup;
  group.userData.headGroup = headGroup;
  group.userData.torso = torso;
  group.userData.team = team;
  group.userData.moveSpeed = 0;
  group.userData.hitReactTimer = 0;
  group.userData.hitFlashTimer = 0;
  group.userData.hitReactDirection = new THREE.Vector3();
  group.userData.animTimeOffset = Math.random() * Math.PI * 2;

  return group;
}

export function createHealthBar(parent: THREE.Group) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 16;
  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sprite.scale.set(1.6, 0.2, 1);
  sprite.position.y = 4.5;
  parent.add(sprite);
  (parent.userData as UnitData).hbCanvas = c;
  (parent.userData as UnitData).hbTex = tex;
}

export function updateHealthBar(unit: THREE.Group) {
  const data = unit.userData as UnitData;
  if (!data.hbCanvas || !data.hbTex) return;
  const ctx = data.hbCanvas.getContext('2d')!;
  ctx.clearRect(0, 0, 128, 16);
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, 128, 16);
  const pct = Math.max(0, data.health / data.maxHealth);
  const isAlly = data.team === 'ally';
  ctx.fillStyle = pct < 0.3 ? '#e74c3c' : isAlly ? '#2980b9' : '#c0392b';
  ctx.fillRect(2, 2, 124 * pct, 12);
  data.hbTex.needsUpdate = true;
}

/**
 * Build a character specifically for the preview scene.
 */
export function buildPreviewCharacter(heroClass: HeroClass): THREE.Group {
  return buildCharacter({ heroClass, team: 'player', forPreview: true });
}
