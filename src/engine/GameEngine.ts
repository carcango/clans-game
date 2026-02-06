import * as THREE from 'three';
import { GameState, InputState, HUDState, UnitData, CombatLogEntry } from '../types/game';
import { HeroClass } from '../types/hero';
import { getScaledStats, ClassStats } from '../constants/stats';
import { BASE_ENEMIES_PER_WAVE, BASE_ALLIES_PER_WAVE, CAMERA_DEFAULT_DISTANCE } from '../constants/game';
import { createBattleScene, handleResize, disposeScene, SceneContext } from './SceneSetup';
import { buildTerrain } from './TerrainBuilder';
import { buildCharacter } from './VoxelCharacterBuilder';
import { PlayerController } from './PlayerController';
import { AllyManager } from './AllyManager';
import { EnemyManager } from './EnemyManager';
import { WaveManager } from './WaveManager';
import { CombatSystem } from './CombatSystem';
import { ParticleSystem } from './ParticleSystem';
import { AbilitySystem } from './AbilitySystem';
import { MinimapRenderer } from './MinimapRenderer';

export class GameEngine {
  private ctx!: SceneContext;
  private container: HTMLElement;
  private heroClass: HeroClass;
  private stats: ClassStats;

  private state!: GameState;
  private input: InputState;

  private player!: THREE.Group;
  private enemies: THREE.Group[] = [];
  private allies: THREE.Group[] = [];

  private playerController!: PlayerController;
  private allyManager!: AllyManager;
  private enemyManager!: EnemyManager;
  private waveManager!: WaveManager;
  private combatSystem!: CombatSystem;
  private particleSystem!: ParticleSystem;
  private abilitySystem!: AbilitySystem;
  private minimapRenderer: MinimapRenderer | null = null;

  private combatLog: CombatLogEntry[] = [];
  private waveBannerText = '';
  private waveBannerTimer = 0;
  private damageFlashTimer = 0;
  private resizeHandler: (() => void) | null = null;

  constructor(container: HTMLElement, heroClass: HeroClass, input: InputState) {
    this.container = container;
    this.heroClass = heroClass;
    this.stats = getScaledStats(heroClass.id, heroClass.level);
    this.input = input;
  }

  init() {
    this.ctx = createBattleScene(this.container);

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
      allyCommand: 'follow',
      waveTransition: false,
      waveTransitionTimer: 0,
      enemiesPerWave: BASE_ENEMIES_PER_WAVE,
      alliesPerWave: BASE_ALLIES_PER_WAVE,
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

    // Create player
    this.player = buildCharacter({ heroClass: this.heroClass, team: 'player' });
    this.player.position.set(0, 0, 0);
    const pData = this.player.userData as UnitData;
    pData.team = 'player';
    pData.health = this.stats.hp;
    pData.maxHealth = this.stats.hp;
    this.ctx.scene.add(this.player);

    // Init systems
    this.particleSystem = new ParticleSystem(this.ctx.scene);
    this.combatSystem = new CombatSystem(this.particleSystem);
    this.allyManager = new AllyManager(this.ctx.scene, this.combatSystem);
    this.enemyManager = new EnemyManager(this.ctx.scene, this.combatSystem);
    this.waveManager = new WaveManager(this.ctx.scene);
    this.abilitySystem = new AbilitySystem(this.ctx.scene, this.particleSystem, this.combatSystem);

    this.playerController = new PlayerController(
      this.player,
      this.ctx.camera,
      this.ctx.scene,
      this.state,
      this.input,
      this.stats,
      this.heroClass.id,
      this.combatSystem,
      this.particleSystem,
      (text) => this.addCombatLog(text),
      (enemy) => this.handleEnemyKill(enemy),
      (dmg) => this.handlePlayerDamage(dmg)
    );

    // Spawn initial wave
    this.waveManager.spawnInitialWave(this.state, this.player, this.enemies, this.allies, this.heroClass);

    // Resize handler
    this.resizeHandler = () => handleResize(this.ctx, this.container);
    window.addEventListener('resize', this.resizeHandler);
  }

  setMinimapCanvas(canvas: HTMLCanvasElement) {
    this.minimapRenderer = new MinimapRenderer(canvas);
  }

  update(dt: number) {
    if (this.state.over) return;

    // Handle commands
    if (this.input.keys['KeyF']) {
      this.input.keys['KeyF'] = false;
      this.state.allyCommand = 'follow';
      this.addCombatLog('Rally to me!');
      this.showWaveBanner('Rally!');
    }
    if (this.input.keys['KeyG']) {
      this.input.keys['KeyG'] = false;
      this.state.allyCommand = 'charge';
      this.addCombatLog('Charge!!!');
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
        (text) => this.addCombatLog(text),
        (ally) => {
          this.ctx.scene.add(ally);
          this.allies.push(ally);
        }
      );
    }

    this.playerController.update(dt, this.enemies);
    this.allyManager.update(
      dt, this.allies, this.enemies, this.player,
      this.state.allyCommand, this.state.wave,
      (enemy) => this.handleEnemyKill(enemy)
    );
    this.enemyManager.update(
      dt, this.enemies, this.allies, this.player, this.state.wave,
      this.state.isBlocking,
      (dmg) => this.handlePlayerDamage(dmg),
      (ally) => this.handleAllyKill(ally)
    );
    this.waveManager.update(
      dt, this.state, this.player, this.enemies, this.allies,
      (text) => this.showWaveBanner(text),
      (text) => this.addCombatLog(text)
    );
    this.abilitySystem.update(
      dt, this.state, this.enemies,
      (enemy) => this.handleEnemyKill(enemy),
      (text) => this.addCombatLog(text)
    );
    this.particleSystem.update(dt);

    // Update minimap
    if (this.minimapRenderer) {
      this.minimapRenderer.render(this.player, this.allies, this.enemies);
    }

    // Update timers
    if (this.waveBannerTimer > 0) this.waveBannerTimer -= dt;
    if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt;

    // Clean up combat log
    const now = performance.now();
    this.combatLog = this.combatLog.filter((e) => now - e.time < 3000);
  }

  render() {
    this.ctx.renderer.render(this.ctx.scene, this.ctx.camera);
  }

  getHUDState(): HUDState {
    const aliveAllies = this.allies.filter((a) => (a.userData as UnitData).health > 0).length;
    const aliveEnemies = this.enemies.filter((e) => (e.userData as UnitData).health > 0).length;

    return {
      health: this.state.playerHealth,
      maxHealth: this.state.playerMaxHealth,
      stamina: this.state.playerStamina,
      maxStamina: this.state.playerMaxStamina,
      kills: this.state.kills,
      wave: this.state.wave,
      allyCount: aliveAllies + 1,
      enemyCount: aliveEnemies,
      isBlocking: this.state.isBlocking,
      isAttacking: this.state.isAttacking,
      abilityCooldown: this.state.abilityCooldown,
      abilityMaxCooldown: this.stats.abilityCooldownMax,
    };
  }

  getCombatLog(): CombatLogEntry[] {
    return this.combatLog;
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

  getDeathStats() {
    return {
      kills: this.state.kills,
      wave: this.state.wave,
      alliesRemaining: this.allies.filter((a) => (a.userData as UnitData).health > 0).length,
    };
  }

  private handleEnemyKill(enemy: THREE.Group) {
    this.state.kills++;
    this.killUnit(enemy, this.enemies);
  }

  private handleAllyKill(ally: THREE.Group) {
    this.killUnit(ally, this.allies);
  }

  private handlePlayerDamage(dmg: number) {
    if (dmg === 0 || this.state.isBlocking) {
      this.particleSystem.createBlockSparks(this.player.position);
      this.state.playerStamina -= 8;
      return;
    }
    this.state.playerHealth -= dmg;
    this.addCombatLog(`Took ${dmg} damage!`);
    this.damageFlashTimer = 0.15;
    if (this.state.playerHealth <= 0) {
      this.state.playerHealth = 0;
      this.state.over = true;
    }
  }

  private killUnit(unit: THREE.Group, array: THREE.Group[]) {
    const data = unit.userData as UnitData;
    data.health = 0;

    // Death animation
    let progress = 0;
    const animate = () => {
      progress += 0.035;
      unit.rotation.x = (Math.PI / 2) * Math.min(1, progress);
      unit.position.y = Math.max(-0.3, -progress * 0.5);
      if (progress < 1.5) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          this.ctx.scene.remove(unit);
          const idx = array.indexOf(unit);
          if (idx !== -1) array.splice(idx, 1);
        }, 4000);
      }
    };
    animate();
  }

  private addCombatLog(text: string) {
    this.combatLog.push({ text, time: performance.now() });
    if (this.combatLog.length > 8) this.combatLog.shift();
  }

  private showWaveBanner(text: string) {
    this.waveBannerText = text;
    this.waveBannerTimer = 2;
  }

  dispose() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.playerController.dispose();
    this.enemyManager.dispose();
    this.allyManager.dispose();
    this.particleSystem.dispose();
    disposeScene(this.ctx);
  }
}
