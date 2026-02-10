import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HeroClass } from '../../types/hero';
import { getScaledStats } from '../../constants/stats';
import { GameEngine } from '../../engine/GameEngine';
import { useInputManager } from '../../hooks/useInputManager';
import { useGameLoop } from '../../hooks/useGameLoop';
import HUD from './hud/HUD';
import DeathScreen from './DeathScreen';
import GameToaster from '../ui/game-toaster';

interface BattleScreenProps {
  heroClass: HeroClass;
  onChangeHero: () => void;
}

const BattleScreen: React.FC<BattleScreenProps> = ({ heroClass, onChangeHero }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const { inputRef, requestPointerLock } = useInputManager();

  const stats = getScaledStats(heroClass.id, heroClass.level);

  useEffect(() => {
    if (!containerRef.current) return;

    const gameEngine = new GameEngine(containerRef.current, heroClass, inputRef.current);
    gameEngine.init();
    engineRef.current = gameEngine;
    setEngine(gameEngine);

    // Request pointer lock on click
    const onClick = () => {
      if (!document.pointerLockElement && containerRef.current) {
        requestPointerLock(containerRef.current);
      }
    };
    document.addEventListener('click', onClick);

    // Initial pointer lock
    setTimeout(() => {
      if (containerRef.current) requestPointerLock(containerRef.current);
    }, 100);

    return () => {
      document.removeEventListener('click', onClick);
      gameEngine.dispose();
      engineRef.current = null;
    };
  }, [heroClass]);

  // Connect minimap canvas once engine and canvas are ready
  useEffect(() => {
    if (engine && minimapRef.current) {
      engine.setMinimapCanvas(minimapRef.current);
    }
  }, [engine]);

  const { hudState, waveBanner, damageFlash, gameOver } = useGameLoop(engine);

  useEffect(() => {
    if (gameOver) {
      document.exitPointerLock();
    }
  }, [gameOver]);

  const handleRestart = useCallback(() => {
    if (!containerRef.current) return;
    engineRef.current?.dispose();

    const gameEngine = new GameEngine(containerRef.current, heroClass, inputRef.current);
    gameEngine.init();
    if (minimapRef.current) gameEngine.setMinimapCanvas(minimapRef.current);
    engineRef.current = gameEngine;
    setEngine(gameEngine);

    setTimeout(() => {
      if (containerRef.current) requestPointerLock(containerRef.current);
    }, 100);
  }, [heroClass]);

  const handleChangeHero = useCallback(() => {
    document.exitPointerLock();
    onChangeHero();
  }, [onChangeHero]);

  const deathStats = gameOver ? engineRef.current?.getDeathStats() : null;

  return (
    <div className="relative h-screen w-full cursor-crosshair bg-[var(--color-bg)]">
      <div ref={containerRef} className="w-full h-full" />

      <HUD
        hudState={hudState}
        waveBanner={waveBanner}
        damageFlash={damageFlash}
        minimapRef={minimapRef}
        abilityName={stats.abilityName}
      />

      <GameToaster offset={180} />

      {gameOver && deathStats && (
        <DeathScreen
          kills={deathStats.kills}
          wave={deathStats.wave}
          alliesRemaining={deathStats.alliesRemaining}
          onRestart={handleRestart}
          onChangeHero={handleChangeHero}
        />
      )}
    </div>
  );
};

export default BattleScreen;
