import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArmyUnit } from '../../types/army';
import { getScaledStats } from '../../constants/stats';
import { ArmyBattleEngine } from '../../engine/ArmyBattleEngine';
import { useInputManager } from '../../hooks/useInputManager';
import { useArmyBattleLoop } from '../../hooks/useArmyBattleLoop';
import ArmyBattleHUD from './ArmyBattleHUD';
import ArmyResultScreen from './ArmyResultScreen';
import GameToaster from '../ui/game-toaster';

interface ArmyBattleScreenProps {
  playerArmy: ArmyUnit[];
  enemyArmy: ArmyUnit[];
  playerClassId: string;
  playerLevel: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

const ArmyBattleScreen: React.FC<ArmyBattleScreenProps> = ({
  playerArmy, enemyArmy, playerClassId, playerLevel, onPlayAgain, onBackToMenu,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ArmyBattleEngine | null>(null);
  const [engine, setEngine] = useState<ArmyBattleEngine | null>(null);
  const { inputRef, requestPointerLock } = useInputManager();

  const stats = getScaledStats(playerClassId, playerLevel);

  useEffect(() => {
    if (!containerRef.current) return;

    const armyEngine = new ArmyBattleEngine(
      containerRef.current,
      playerArmy,
      enemyArmy,
      playerClassId,
      playerLevel,
      inputRef.current
    );
    armyEngine.init();
    engineRef.current = armyEngine;
    setEngine(armyEngine);

    const onClick = () => {
      if (!document.pointerLockElement && containerRef.current) {
        requestPointerLock(containerRef.current);
      }
    };
    document.addEventListener('click', onClick);

    setTimeout(() => {
      if (containerRef.current) requestPointerLock(containerRef.current);
    }, 100);

    return () => {
      document.removeEventListener('click', onClick);
      armyEngine.dispose();
      engineRef.current = null;
    };
  }, [playerArmy, enemyArmy, playerClassId, playerLevel]);

  useEffect(() => {
    if (engine && minimapRef.current) {
      engine.setMinimapCanvas(minimapRef.current);
    }
  }, [engine]);

  const { hudState, waveBanner, damageFlash, gameOver } = useArmyBattleLoop(engine);

  useEffect(() => {
    if (gameOver) {
      document.exitPointerLock();
    }
  }, [gameOver]);

  const handlePlayAgain = useCallback(() => {
    document.exitPointerLock();
    onPlayAgain();
  }, [onPlayAgain]);

  const handleBackToMenu = useCallback(() => {
    document.exitPointerLock();
    onBackToMenu();
  }, [onBackToMenu]);

  const battleResult = gameOver ? engineRef.current?.getBattleResult() : null;

  return (
    <div className="relative h-screen w-full cursor-crosshair bg-[var(--color-bg)]">
      <div ref={containerRef} className="w-full h-full" />

      <ArmyBattleHUD
        hudState={hudState}
        waveBanner={waveBanner}
        damageFlash={damageFlash}
        minimapRef={minimapRef}
        abilityName={stats.abilityName}
        ability2Name={stats.ability2Name}
      />

      <GameToaster offset={180} />

      {gameOver && battleResult && (
        <ArmyResultScreen
          victory={battleResult.victory}
          survivorCount={battleResult.survivorCount}
          totalAllies={battleResult.totalAllies}
          totalEnemies={battleResult.totalEnemies}
          kills={battleResult.kills}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
};

export default ArmyBattleScreen;
