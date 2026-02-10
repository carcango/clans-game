import * as THREE from 'three';
import { toast } from 'sonner';
import { GameState, InputState, UnitData, ToastType } from '../types/game';
import { ArmyUnit } from '../types/army';
import { HeroClass } from '../types/hero';
import { HERO_CLASSES } from '../constants/classes';
import { getScaledStats, ClassStats } from '../constants/stats';
import { CAMERA_DEFAULT_DISTANCE } from '../constants/game';
import { createBattleScene, handleResize, disposeScene, SceneContext } from './SceneSetup';
import { buildTerrain } from './TerrainBuilder';
import { PlayerController } from './PlayerController';
import { AllyManager } from './AllyManager';
import { EnemyManager } from './EnemyManager';
import { CombatSystem } from './CombatSystem';
import { ParticleSystem } from './ParticleSystem';
import { AbilitySystem } from './AbilitySystem';
import { MinimapRenderer } from './MinimapRenderer';
import { DamageNumberSystem } from './DamageNumberSystem';
import { spawnArmy, spawnPlayerUnit } from './ArmySpawner';

export interface ArmyHUDState {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  allyCount: number;
  totalAllies: number;
  enemyCount: number;
  totalEnemies: number;
  isBlocking: boolean;
  isAttacking: boolean;
  abilityCooldown: number;
  abilityMaxCooldown: number;
}

interface ArmyBattleHeroModifiers {
  maxHealthFlat?: number;
  staminaFlat?: number;
  attackPct?: number;
  speedPct?: number;
}

interface ArmyBattleOptions {
  heroModifiers?: ArmyBattleHeroModifiers;
  allyDamageMultiplier?: number;
}

interface ClassLevelCount {
  classId: string;
  level: number;
  count: number;
}

export class ArmyBattleEngine {
  private ctx!: SceneContext;
  private container: HTMLElement;
  private input: InputState;

  private playerClassId: string;
  private playerLevel: number;
  private playerArmy: ArmyUnit[];
  private enemyArmy: ArmyUnit[];
  private heroClass!: HeroClass;
  private stats!: ClassStats;

  private state!: GameState;
  private player!: THREE.Group;
  private allies: THREE.Group[] = [];
  private enemies: THREE.Group[] = [];

  private totalAllies = 0;
  private totalEnemies = 0;

  private playerController!: PlayerController;
  private allyManager!: AllyManager;
  private enemyManager!: EnemyManager;
  private combatSystem!: CombatSystem;
  private particleSystem!: ParticleSystem;
  private abilitySystem!: AbilitySystem;
  private damageNumbers!: DamageNumberSystem;
  private minimapRenderer: MinimapRenderer | null = null;

  private waveBannerText = '';
  private waveBannerTimer = 0;
  private damageFlashTimer = 0;
  private resizeHandler: (() => void) | null = null;

  private victory: boolean | null = null;
  private options: ArmyBattleOptions;

  constructor(
    container: HTMLElement,
    playerArmy: ArmyUnit[],
    enemyArmy: ArmyUnit[],
    playerClassId: string,
    playerLevel: number,
    input: InputState,
    options: ArmyBattleOptions = {}
  ) {
    this.container = container;
    this.input = input;
    this.playerClassId = playerClassId;
    this.playerLevel = playerLevel;
    this.playerArmy = playerArmy;
    this.enemyArmy = enemyArmy;
    this.options = options;
  }

  init() {
    this.ctx = createBattleScene(this.container);

    const baseHero = HERO_CLASSES.find((c) => c.id === this.playerClassId) ?? HERO_CLASSES[0];
    this.heroClass = { ...baseHero, level: this.playerLevel };
    this.stats = getScaledStats(this.playerClassId, this.playerLevel);
    const heroMods = this.options.heroModifiers;
    if (heroMods) {
      const attackPct = heroMods.attackPct ?? 0;
      const speedPct = heroMods.speedPct ?? 0;
      const hpBonus = heroMods.maxHealthFlat ?? 0;
      const staminaBonus = heroMods.staminaFlat ?? 0;
      this.stats = {
        ...this.stats,
        hp: Math.max(1, Math.floor(this.stats.hp + hpBonus)),
        stamina: Math.max(1, Math.floor(this.stats.stamina + staminaBonus)),
        attackMin: Math.max(1, Math.floor(this.stats.attackMin * (1 + attackPct))),
        attackMax: Math.max(1, Math.floor(this.stats.attackMax * (1 + attackPct))),
        speed: +(this.stats.speed * (1 + speedPct)).toFixed(2),
        sprintSpeed: +(this.stats.sprintSpeed * (1 + speedPct)).toFixed(2),
      };
    }

    this.state = {
      started: true,
      over: false,
      kills: 0,
      wave: 1,
      playerHealth: this.stats.hp,
      playerMaxHealth: this.stats.hp,
      playerStamina: this.stats.stamina,
      playerMaxStamina: this.stats.stamina,
      isAttacking: false,
      isBlocking: false,
      attackTimer: 0,
      attackCooldownTimer: 0,
      playerVelY: 0,
      onGround: true,
      allyCommand: 'charge',
      waveTransition: false,
      waveTransitionTimer: 0,
      enemiesPerWave: 0,
      alliesPerWave: 0,
      cameraAngleY: 0,
      cameraAngleX: 0.3,
      cameraDistance: CAMERA_DEFAULT_DISTANCE,
      isFirstPerson: false,
      abilityCooldown: 0,
      abilityActive: false,
      backstabReady: false,
      backstabTimer: 0,
    };

    buildTerrain(this.ctx.scene);

    // Spawn player at south side
    this.player = spawnPlayerUnit(this.ctx.scene, this.playerClassId, this.playerLevel, -30);

    // Spawn allied army (excluding the player unit's slot)
    const allyUnits = this.playerArmy.map((u) => ({ ...u }));
    const playerSlot = allyUnits.find((u) => u.classId === this.playerClassId && u.level === this.playerLevel);
    if (playerSlot && playerSlot.count > 0) {
      playerSlot.count--;
    }
    const filteredAllyUnits = allyUnits.filter((u) => u.count > 0);

    spawnArmy(this.ctx.scene, filteredAllyUnits, 'ally', -1, this.allies);
    spawnArmy(this.ctx.scene, this.enemyArmy, 'enemy', 1, this.enemies);
    this.applyAllyDamageMultiplier();

    this.totalAllies = this.allies.length + 1;
    this.totalEnemies = this.enemies.length;

    // Init subsystems
    this.particleSystem = new ParticleSystem(this.ctx.scene);
    this.damageNumbers = new DamageNumberSystem(this.ctx.scene);
    this.combatSystem = new CombatSystem(this.particleSystem);
    this.combatSystem.setDamageNumbers(this.damageNumbers);
    this.allyManager = new AllyManager(this.ctx.scene, this.combatSystem, this.particleSystem);
    this.enemyManager = new EnemyManager(this.ctx.scene, this.combatSystem, this.particleSystem);
    this.abilitySystem = new AbilitySystem(this.ctx.scene, this.particleSystem, this.combatSystem);

    this.playerController = new PlayerController(
      this.player,
      this.ctx.camera,
      this.ctx.scene,
      this.state,
      this.input,
      this.stats,
      this.playerClassId,
      this.combatSystem,
      this.particleSystem,
      (text, type) => this.addCombatLog(text, type),
      (enemy) => this.handleEnemyKill(enemy),
      (dmg) => this.handlePlayerDamage(dmg)
    );

    // Resize handler
    this.resizeHandler = () => handleResize(this.ctx, this.container);
    window.addEventListener('resize', this.resizeHandler);

    this.showWaveBanner('Battle!');
    this.addCombatLog('The battle has begun!', 'info');
  }

  setMinimapCanvas(canvas: HTMLCanvasElement) {
    this.minimapRenderer = new MinimapRenderer(canvas);
  }

  update(dt: number) {
    if (this.state.over) return;

    // Commands
    if (this.input.keys['KeyF']) {
      this.input.keys['KeyF'] = false;
      this.state.allyCommand = 'follow';
      this.addCombatLog('Rally to me!', 'info');
      this.showWaveBanner('Rally!');
    }
    if (this.input.keys['KeyG']) {
      this.input.keys['KeyG'] = false;
      this.state.allyCommand = 'charge';
      this.addCombatLog('Charge!!!', 'info');
      this.showWaveBanner('Charge!');
    }
    if (this.input.keys['KeyQ']) {
      this.input.keys['KeyQ'] = false;
      this.abilitySystem.activateAbility(
        this.heroClass.id,
        this.stats,
        this.state,
        this.player,
        this.enemies,
        this.allies,
        this.heroClass,
        (text, type) => this.addCombatLog(text, type),
        (ally) => {
          this.ctx.scene.add(ally);
          this.allies.push(ally);
        }
      );
    }

    this.playerController.update(dt, this.enemies);
    this.allyManager.update(
      dt, this.allies, this.enemies, this.player,
      this.state.allyCommand, 1,
      (enemy) => this.handleEnemyKill(enemy)
    );
    this.enemyManager.update(
      dt, this.enemies, this.allies, this.player, 1,
      this.state.isBlocking,
      (dmg) => this.handlePlayerDamage(dmg),
      (ally) => this.handleAllyKill(ally)
    );
    this.abilitySystem.update(
      dt, this.state, this.enemies,
      (enemy) => this.handleEnemyKill(enemy),
      (text, type) => this.addCombatLog(text, type)
    );
    this.particleSystem.update(dt);
    this.damageNumbers.update(dt);

    // Minimap
    if (this.minimapRenderer) {
      this.minimapRenderer.render(this.player, this.allies, this.enemies);
    }

    // Timers
    if (this.waveBannerTimer > 0) this.waveBannerTimer -= dt;
    if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt;

    // Win/loss check
    this.checkBattleEnd();
  }

  render() {
    this.ctx.renderer.render(this.ctx.scene, this.ctx.camera);
  }

  private checkBattleEnd() {
    const aliveEnemies = this.enemies.filter((e) => (e.userData as UnitData).health > 0).length;
    const playerAlive = this.state.playerHealth > 0;

    if (aliveEnemies === 0 && this.enemies.length > 0) {
      this.victory = true;
      this.state.over = true;
    } else if (!playerAlive) {
      this.victory = false;
      this.state.over = true;
    }
  }

  getArmyHUDState(): ArmyHUDState {
    const aliveAllies = this.allies.filter((a) => (a.userData as UnitData).health > 0).length;
    const aliveEnemies = this.enemies.filter((e) => (e.userData as UnitData).health > 0).length;

    return {
      health: this.state.playerHealth,
      maxHealth: this.state.playerMaxHealth,
      stamina: this.state.playerStamina,
      maxStamina: this.state.playerMaxStamina,
      allyCount: aliveAllies + (this.state.playerHealth > 0 ? 1 : 0),
      totalAllies: this.totalAllies,
      enemyCount: aliveEnemies,
      totalEnemies: this.totalEnemies,
      isBlocking: this.state.isBlocking,
      isAttacking: this.state.isAttacking,
      abilityCooldown: this.state.abilityCooldown,
      abilityMaxCooldown: this.stats.abilityCooldownMax,
    };
  }

  getWaveBanner(): string | null {
    return this.waveBannerTimer > 0 ? this.waveBannerText : null;
  }

  getDamageFlash(): boolean {
    return this.damageFlashTimer > 0;
  }

  isGameOver(): boolean {
    return this.state.over;
  }

  getVictory(): boolean {
    return this.victory === true;
  }

  getBattleResult() {
    const aliveAllies = this.allies.filter((a) => (a.userData as UnitData).health > 0).length;
    return {
      victory: this.victory === true,
      survivorCount: aliveAllies + (this.state.playerHealth > 0 ? 1 : 0),
      totalAllies: this.totalAllies,
      totalEnemies: this.totalEnemies,
      kills: this.state.kills,
    };
  }

  getDetailedBattleResult() {
    return {
      victory: this.victory === true,
      heroAlive: this.state.playerHealth > 0,
      allySurvivorsByClassLevel: this.collectSurvivors(this.allies),
      enemySurvivorsByClassLevel: this.collectSurvivors(this.enemies),
      kills: this.state.kills,
    };
  }

  private handleEnemyKill(enemy: THREE.Group) {
    const data = enemy.userData as UnitData;
    const className = data.classId ? data.classId.charAt(0).toUpperCase() + data.classId.slice(1) : 'Enemy';
    this.state.kills++;
    this.addCombatLog(`Killed ${className}!`, 'success');
    this.killUnit(enemy, this.enemies);
  }

  private handleAllyKill(ally: THREE.Group) {
    const data = ally.userData as UnitData;
    const className = data.classId ? data.classId.charAt(0).toUpperCase() + data.classId.slice(1) : 'Ally';
    this.addCombatLog(`${className} ally fallen!`, 'error');
    this.killUnit(ally, this.allies);
  }

  private handlePlayerDamage(dmg: number) {
    if (dmg === 0 || this.state.isBlocking) {
      this.particleSystem.createBlockSparks(this.player.position);
      this.state.playerStamina -= 8;
      return;
    }
    this.state.playerHealth -= dmg;
    this.damageFlashTimer = 0.15;
    this.playerController.triggerShake(0.3 + dmg * 0.01);
    this.damageNumbers.spawn(this.player.position, dmg);
    if (this.state.playerHealth <= 0) {
      this.state.playerHealth = 0;
      this.state.over = true;
    }
  }

  private killUnit(unit: THREE.Group, array: THREE.Group[]) {
    const data = unit.userData as UnitData;
    data.health = 0;

    // Death explosion particles
    this.particleSystem.createDeathExplosion(unit.position, data.team);

    // Enhanced death animation
    let progress = 0;
    const spinDir = Math.random() > 0.5 ? 1 : -1;
    const animate = () => {
      progress += 0.04;
      unit.rotation.x = (Math.PI / 2) * Math.min(1, progress);
      unit.rotation.z = spinDir * progress * 0.3;
      unit.position.y = Math.max(-0.3, -progress * 0.5);
      const s = Math.max(0.01, 1 - progress * 0.3);
      unit.scale.setScalar(s);
      if (progress < 1.5) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          this.ctx.scene.remove(unit);
          const idx = array.indexOf(unit);
          if (idx !== -1) array.splice(idx, 1);
        }, 2000);
      }
    };
    animate();
  }

  private addCombatLog(text: string, type: ToastType = 'info') {
    toast[type](text);
  }

  private showWaveBanner(text: string) {
    this.waveBannerText = text;
    this.waveBannerTimer = 2;
  }

  private applyAllyDamageMultiplier() {
    const multiplier = this.options.allyDamageMultiplier ?? 1;
    if (multiplier === 1) return;
    for (const ally of this.allies) {
      const data = ally.userData as UnitData;
      if (typeof data.damageMin === 'number') {
        data.damageMin = Math.max(1, Math.floor(data.damageMin * multiplier));
      }
      if (typeof data.damageMax === 'number') {
        data.damageMax = Math.max(1, Math.floor(data.damageMax * multiplier));
      }
    }
  }

  private collectSurvivors(units: THREE.Group[]): ClassLevelCount[] {
    const counts = new Map<string, number>();
    for (const unit of units) {
      const data = unit.userData as UnitData;
      if (data.health <= 0 || !data.classId) continue;
      const level = data.unitLevel ?? 1;
      const key = `${data.classId}:${level}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([key, count]) => {
      const [classId, level] = key.split(':');
      return { classId, level: Number(level), count };
    });
  }

  dispose() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.playerController.dispose();
    this.enemyManager.dispose();
    this.allyManager.dispose();
    this.particleSystem.dispose();
    this.damageNumbers.dispose();
    disposeScene(this.ctx);
  }
}
