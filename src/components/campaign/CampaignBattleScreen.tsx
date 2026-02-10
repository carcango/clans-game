import React, { useEffect, useRef, useState } from 'react';
import { ArmyUnit } from '../../types/army';
import { ArmyBattleEngine } from '../../engine/ArmyBattleEngine';
import { useInputManager } from '../../hooks/useInputManager';
import { useArmyBattleLoop } from '../../hooks/useArmyBattleLoop';
import ArmyBattleHUD from '../army-battle/ArmyBattleHUD';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import FullscreenDialog from '../ui/fullscreen-dialog';

interface CampaignBattleScreenProps {
  playerArmy: ArmyUnit[];
  enemyArmy: ArmyUnit[];
  playerClassId: string;
  playerLevel: number;
  heroModifiers: {
    maxHealthFlat: number;
    staminaFlat: number;
    attackPct: number;
    speedPct: number;
  };
  allyDamageMultiplier: number;
  onContinue: (result: ReturnType<ArmyBattleEngine['getDetailedBattleResult']>) => void;
}

const CampaignBattleScreen: React.FC<CampaignBattleScreenProps> = ({
  playerArmy,
  enemyArmy,
  playerClassId,
  playerLevel,
  heroModifiers,
  allyDamageMultiplier,
  onContinue,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ArmyBattleEngine | null>(null);
  const [engine, setEngine] = useState<ArmyBattleEngine | null>(null);
  const { inputRef, requestPointerLock } = useInputManager();

  useEffect(() => {
    if (!containerRef.current) return;

    const battleEngine = new ArmyBattleEngine(
      containerRef.current,
      playerArmy,
      enemyArmy,
      playerClassId,
      playerLevel,
      inputRef.current,
      {
        heroModifiers,
        allyDamageMultiplier,
      }
    );

    battleEngine.init();
    engineRef.current = battleEngine;
    setEngine(battleEngine);

    const onClick = () => {
      if (!document.pointerLockElement && containerRef.current) {
        requestPointerLock(containerRef.current);
      }
    };

    document.addEventListener('click', onClick);

    setTimeout(() => {
      if (containerRef.current) requestPointerLock(containerRef.current);
    }, 120);

    return () => {
      document.removeEventListener('click', onClick);
      battleEngine.dispose();
      engineRef.current = null;
    };
  }, [allyDamageMultiplier, enemyArmy, heroModifiers, inputRef, playerArmy, playerClassId, playerLevel, requestPointerLock]);

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

  const detailedResult = gameOver ? engineRef.current?.getDetailedBattleResult() : null;

  return (
    <div className="relative h-screen w-full cursor-crosshair bg-[var(--color-bg)]">
      <div ref={containerRef} className="h-full w-full" />

      <ArmyBattleHUD
        hudState={hudState}
        waveBanner={waveBanner}
        damageFlash={damageFlash}
        minimapRef={minimapRef}
        abilityName="Class Ability"
      />

      {gameOver && detailedResult && (
        <FullscreenDialog
          open
          title={detailedResult.victory ? 'Battle Won' : 'Battle Lost'}
          description="Resolve the encounter and continue your campaign."
          preventClose
        >
          <Card variant="elevated" className="mx-auto w-full max-w-lg">
            <CardContent className="space-y-6 p-8 text-center sm:p-10">
              {/* Icon -- bigger with more margin */}
              <div className="animate-bounce-in-up stagger-1">
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 ${
                    detailedResult.victory
                      ? 'border-[var(--color-primary)]/50 bg-[rgba(212,168,67,0.15)] text-[var(--color-primary)] shadow-[0_0_30px_rgba(212,168,67,0.2)]'
                      : 'border-[var(--color-destructive)]/50 bg-[rgba(196,64,64,0.15)] text-[var(--color-destructive)] shadow-[0_0_30px_rgba(196,64,64,0.2)]'
                  }`}
                >
                  <span className="font-display text-2xl font-bold">{detailedResult.victory ? 'W' : 'L'}</span>
                </div>
              </div>

              {/* Badges -- with more padding and stagger */}
              <div className="animate-bounce-in-up stagger-2 flex flex-wrap items-center justify-center gap-3">
                <Badge variant={detailedResult.heroAlive ? 'success' : 'destructive'} className="px-4 py-1.5 text-xs">
                  Hero {detailedResult.heroAlive ? 'Alive' : 'Fallen'}
                </Badge>
                <Badge variant="secondary" className="px-4 py-1.5 text-xs">Kills {detailedResult.kills}</Badge>
              </div>

              {/* Flavor text */}
              <p className="animate-bounce-in-up stagger-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {detailedResult.victory
                  ? 'Your troops secured the field. Resolve losses and continue marching.'
                  : 'Your troops were forced back. Regroup and decide your next move.'}
              </p>

              {/* CTA button */}
              <div className="animate-bounce-in-up stagger-4 pt-2">
                <Button size="lg" onClick={() => onContinue(detailedResult)} className="w-full">
                  Continue Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </FullscreenDialog>
      )}
    </div>
  );
};

export default CampaignBattleScreen;
