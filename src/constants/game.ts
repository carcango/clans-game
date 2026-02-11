export const GRAVITY = -25;
export const TERRAIN_SIZE = 300;
export const TERRAIN_HALF = 140;
export const ATTACK_DURATION = 0.35;
export const ATTACK_COOLDOWN = 0.3;
export const JUMP_VELOCITY = 8;
export const CAMERA_SENSITIVITY = 0.002;
export const CAMERA_MIN_DISTANCE = 5;
export const CAMERA_MAX_DISTANCE = 30;
export const CAMERA_DEFAULT_DISTANCE = 18;
export const CAMERA_HEIGHT = 12;
export const CAMERA_LERP_SPEED = 0.1;
export const CAMERA_FP_EYE_HEIGHT = 2.0;
export const BASE_ENEMIES_PER_WAVE = 12;
export const BASE_ALLIES_PER_WAVE = 6;
export const MAX_ENEMIES_PER_WAVE = 35;
export const MAX_ALLIES_PER_WAVE = 15;
export const WAVE_TRANSITION_DELAY = 1.5;
export const SPAWN_DIST_MIN = 20;
export const SPAWN_DIST_MAX = 40;
export const ALLY_SPAWN_DIST_MIN = 4;
export const ALLY_SPAWN_DIST_MAX = 10;
export const PROJECTILE_LIFETIME = 2.5;

// Per-class AI projectile speeds (used by EnemyManager & AllyManager)
export const CLASS_PROJECTILE_SPEED: Record<string, number> = { archer: 28, mage: 18, necromancer: 15 };
export const DEFAULT_AI_PROJECTILE_SPEED = 20;

// Per-class player projectile speeds
export const PLAYER_PROJECTILE_SPEED: Record<string, number> = { archer: 38, mage: 25, necromancer: 20 };
export const DEFAULT_PLAYER_PROJECTILE_SPEED = 30;
export const STAMINA_REGEN_RATE = 10;
export const SPRINT_STAMINA_COST = 15;
export const ATTACK_STAMINA_COST = 12;
export const BLOCK_STAMINA_DRAIN = 8;
export const HUD_SYNC_INTERVAL = 100; // ms
export const MELEE_ENGAGE_DIST = 3.8;
export const MELEE_HIT_DIST = 4.0;
export const RANGED_MIN_DIST = 10;
export const RANGED_ENGAGE_MAX_ENEMY = 20;
export const RANGED_ENGAGE_MAX_ALLY = 24;
export const UNIT_AVOIDANCE_DIST = 1.6;

// Melee balance: charge speed boost when closing on enemies
export const MELEE_CHARGE_SPEED_MULT = 1.5;

// Ranged balance: projectile spread (radians) at max range — ~8.5° miss angle
export const PROJECTILE_SPREAD_MAX = 0.15;
