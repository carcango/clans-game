import * as THREE from 'three';

export interface GameState {
  started: boolean;
  over: boolean;
  kills: number;
  wave: number;
  playerHealth: number;
  playerMaxHealth: number;
  playerStamina: number;
  playerMaxStamina: number;
  isAttacking: boolean;
  isBlocking: boolean;
  attackTimer: number;
  attackCooldownTimer: number;
  playerVelY: number;
  onGround: boolean;
  allyCommand: 'follow' | 'charge';
  waveTransition: boolean;
  waveTransitionTimer: number;
  enemiesPerWave: number;
  alliesPerWave: number;
  cameraAngleY: number;
  cameraAngleX: number;
  cameraDistance: number;
  isFirstPerson: boolean;
  abilityCooldown: number;
  abilityActive: boolean;
  backstabReady: boolean;
  backstabTimer: number;
  stealthTimer: number;
  ability2Cooldown: number;
  dashActive: boolean;
  dashTimer: number;
  dashDirX: number;
  dashDirZ: number;
  dashSpeed: number;
  dashInvulnerable: boolean;
  isLeaping: boolean;
  ability2AnimTimer: number;
}

export interface UnitData {
  team: 'player' | 'ally' | 'enemy';
  health: number;
  maxHealth: number;
  unitLevel?: number;
  speed: number;
  attackTimer: number;
  attackCooldown: number;
  isAttacking: boolean;
  attackTime: number;
  stunTimer: number;
  isBlocking: boolean;
  blockTimer: number;
  hitThisSwing: boolean;
  strafeDir?: number;
  stateTimer?: number;
  rightArm: THREE.Group;
  leftArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  headGroup: THREE.Group;
  torso: THREE.Mesh;
  hbCanvas?: HTMLCanvasElement;
  hbTex?: THREE.CanvasTexture;
  classId?: string;
  attackType?: 'melee' | 'ranged';
  attackRange?: number;
  damageMin?: number;
  damageMax?: number;
  moveSpeed: number;
  hitReactTimer: number;
  hitFlashTimer: number;
  hitReactDirection: THREE.Vector3;
  animTimeOffset: number;
  holyChargeHit?: boolean;
}

export interface InputState {
  keys: Record<string, boolean>;
  mouseDown: Record<number, boolean>;
  mouseDelta: { x: number; y: number };
  wheelDelta: number;
}

export interface HUDState {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  kills: number;
  wave: number;
  allyCount: number;
  enemyCount: number;
  isBlocking: boolean;
  isAttacking: boolean;
  abilityCooldown: number;
  abilityMaxCooldown: number;
  ability2Cooldown: number;
  ability2MaxCooldown: number;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ParticleData {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}
