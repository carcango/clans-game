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
  abilityCooldown: number;
  abilityActive: boolean;
  backstabReady: boolean;
}

export interface UnitData {
  team: 'player' | 'ally' | 'enemy';
  health: number;
  maxHealth: number;
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
  hbCanvas?: HTMLCanvasElement;
  hbTex?: THREE.CanvasTexture;
  classId?: string;
  attackType?: 'melee' | 'ranged';
  attackRange?: number;
  damageMin?: number;
  damageMax?: number;
}

export interface InputState {
  keys: Record<string, boolean>;
  mouseDown: Record<number, boolean>;
  mouseDelta: { x: number; y: number };
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
}

export interface CombatLogEntry {
  text: string;
  time: number;
}

export interface ParticleData {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}
