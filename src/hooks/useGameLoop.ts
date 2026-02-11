import { useRef, useEffect, useState } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { HUDState } from '../types/game';
import { HUD_SYNC_INTERVAL } from '../constants/game';

const DEFAULT_HUD: HUDState = {
  health: 100, maxHealth: 100,
  stamina: 100, maxStamina: 100,
  kills: 0, wave: 1,
  allyCount: 0, enemyCount: 0,
  isBlocking: false, isAttacking: false,
  abilityCooldown: 0, abilityMaxCooldown: 10,
  ability2Cooldown: 0, ability2MaxCooldown: 10,
};

export function useGameLoop(engine: GameEngine | null) {
  const [hudState, setHudState] = useState<HUDState>(DEFAULT_HUD);
  const [waveBanner, setWaveBanner] = useState<string | null>(null);
  const [damageFlash, setDamageFlash] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastSyncRef = useRef<number>(0);

  useEffect(() => {
    if (!engine) return;

    lastTimeRef.current = performance.now();
    lastSyncRef.current = 0;

    const loop = (now: number) => {
      const dtRaw = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      const dt = Math.min(dtRaw, 0.05);

      engine.update(dt);
      engine.render();

      // Throttled React state sync
      lastSyncRef.current += dt * 1000;
      if (lastSyncRef.current >= HUD_SYNC_INTERVAL) {
        lastSyncRef.current = 0;
        setHudState(engine.getHUDState());
        setWaveBanner(engine.getWaveBanner());
        setDamageFlash(engine.getDamageFlash());
        if (engine.isGameOver()) {
          setGameOver(true);
        }
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [engine]);

  return { hudState, waveBanner, damageFlash, gameOver };
}
