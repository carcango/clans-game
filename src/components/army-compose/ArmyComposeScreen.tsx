import React, { useState, useCallback } from 'react';
import { ArrowLeft, Sword } from 'lucide-react';
import { ArmyUnit } from '../../types/army';
import { HERO_CLASSES } from '../../constants/classes';
import {
  getArmyTotalCost,
  getArmyTotalUnits,
  ARMY_BUDGET,
  MAX_ARMY_SIZE,
  generateRandomArmy,
} from '../../constants/army';
import VoxelPreview from '../character-select/VoxelPreview';
import ArmyRoster from './ArmyRoster';
import ClassPicker from './ClassPicker';
import BudgetBar from './BudgetBar';
import ArmyPresets from './ArmyPresets';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import ScreenShell from '../ui/screen-shell';
import SectionHeader from '../ui/section-header';

interface ArmyComposeScreenProps {
  onStartBattle: (
    playerArmy: ArmyUnit[],
    enemyArmy: ArmyUnit[],
    playerClassId: string,
    playerLevel: number
  ) => void;
  onBack: () => void;
}

type Tab = 'your-army' | 'enemy-army';

const ArmyComposeScreen: React.FC<ArmyComposeScreenProps> = ({ onStartBattle, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('your-army');
  const [playerUnits, setPlayerUnits] = useState<ArmyUnit[]>([]);
  const [enemyUnits, setEnemyUnits] = useState<ArmyUnit[]>([]);
  const [playerHeroIndex, setPlayerHeroIndex] = useState<number | null>(null);
  const [useRandomEnemy, setUseRandomEnemy] = useState(true);

  const playerHero = playerHeroIndex !== null && playerUnits[playerHeroIndex] ? playerUnits[playerHeroIndex] : null;
  const previewClass = playerHero
    ? { ...HERO_CLASSES.find((c) => c.id === playerHero.classId)!, level: playerHero.level }
    : HERO_CLASSES[0];

  const currentUnits = activeTab === 'your-army' ? playerUnits : enemyUnits;
  const setCurrentUnits = activeTab === 'your-army' ? setPlayerUnits : setEnemyUnits;
  const spent = getArmyTotalCost(currentUnits);
  const unitCount = getArmyTotalUnits(currentUnits);

  const handleAdd = useCallback(
    (classId: string, level: number) => {
      setCurrentUnits((prev) => {
        const existing = prev.findIndex((u) => u.classId === classId && u.level === level);
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = { ...next[existing], count: next[existing].count + 1 };
          return next;
        }
        return [...prev, { classId, level, count: 1 }];
      });
    },
    [setCurrentUnits]
  );

  const handleChangeCount = useCallback(
    (index: number, delta: number) => {
      setCurrentUnits((prev) => {
        const next = [...prev];
        const newCount = next[index].count + delta;
        if (newCount <= 0) {
          next.splice(index, 1);
          if (activeTab === 'your-army') {
            if (playerHeroIndex === index) setPlayerHeroIndex(null);
            else if (playerHeroIndex !== null && playerHeroIndex > index) setPlayerHeroIndex(playerHeroIndex - 1);
          }
          return next;
        }
        next[index] = { ...next[index], count: newCount };
        return next;
      });
    },
    [activeTab, playerHeroIndex, setCurrentUnits]
  );

  const handleRemove = useCallback(
    (index: number) => {
      setCurrentUnits((prev) => {
        const next = [...prev];
        next.splice(index, 1);
        if (activeTab === 'your-army') {
          if (playerHeroIndex === index) setPlayerHeroIndex(null);
          else if (playerHeroIndex !== null && playerHeroIndex > index) setPlayerHeroIndex(playerHeroIndex - 1);
        }
        return next;
      });
    },
    [activeTab, playerHeroIndex, setCurrentUnits]
  );

  const handleApplyPreset = useCallback(
    (units: ArmyUnit[]) => {
      setCurrentUnits(units);
      if (activeTab === 'your-army') setPlayerHeroIndex(0);
    },
    [activeTab, setCurrentUnits]
  );

  const playerTotalCost = getArmyTotalCost(playerUnits);
  const playerTotalUnits = getArmyTotalUnits(playerUnits);
  const canStart =
    playerUnits.length > 0 &&
    playerHeroIndex !== null &&
    playerTotalCost <= ARMY_BUDGET &&
    playerTotalUnits <= MAX_ARMY_SIZE &&
    (useRandomEnemy ||
      (enemyUnits.length > 0 &&
        getArmyTotalCost(enemyUnits) <= ARMY_BUDGET &&
        getArmyTotalUnits(enemyUnits) <= MAX_ARMY_SIZE));

  const handleStart = useCallback(() => {
    if (!canStart || playerHeroIndex === null) return;
    const hero = playerUnits[playerHeroIndex];
    const finalEnemyArmy = useRandomEnemy ? generateRandomArmy(ARMY_BUDGET).units : enemyUnits;
    onStartBattle(playerUnits, finalEnemyArmy, hero.classId, hero.level);
  }, [canStart, playerUnits, enemyUnits, playerHeroIndex, useRandomEnemy, onStartBattle]);

  return (
    <ScreenShell contentClassName="flex h-full flex-col gap-4 p-4 sm:p-6">
      <SectionHeader
        title="Compose Army"
        subtitle="Build both sides, pick your hero stack, and launch a balanced skirmish."
        eyebrow="Skirmish"
        action={
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Budget <span className="text-[var(--color-primary)]">{playerTotalCost}</span>/{ARMY_BUDGET}</Badge>
        <Badge variant="secondary">Units <span className="text-[var(--color-primary)]">{playerTotalUnits}</span>/{MAX_ARMY_SIZE}</Badge>
        <Badge variant="outline">Hero {playerHero ? `${previewClass.name} Lv${playerHero.level}` : 'Not selected'}</Badge>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(260px,32%)_1fr]">
        <Card className="hidden min-h-0 overflow-hidden lg:block">
          <CardContent className="relative h-full p-0">
            <VoxelPreview heroClass={previewClass} />
            <div className="absolute bottom-3 left-3 right-3 rounded-[var(--radius-lg)] border-2 border-[var(--color-hud-border)] bg-[var(--color-hud-bg)] p-3 text-xs text-[var(--color-text-muted)] backdrop-blur-md">
              {playerHero
                ? `You will play as ${previewClass.name} (Lv${playerHero.level}).`
                : 'Select your hero stack with the crown icon.'}
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-0">
          <CardContent className="flex h-full min-h-0 flex-col gap-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="w-auto">
                <TabsList>
                  <TabsTrigger value="your-army">Your Army</TabsTrigger>
                  <TabsTrigger value="enemy-army">Enemy Army</TabsTrigger>
                </TabsList>
              </Tabs>

              {activeTab === 'enemy-army' && (
                <label className="ml-auto flex items-center gap-2 rounded-[var(--radius-lg)] border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text-muted)]">
                  <Checkbox checked={useRandomEnemy} onCheckedChange={(value) => setUseRandomEnemy(value === true)} />
                  Random enemy
                </label>
              )}
            </div>

            {activeTab === 'enemy-army' && useRandomEnemy ? (
              <div className="flex flex-1 items-center justify-center rounded-[var(--radius-xl)] border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-text-muted)]">
                Enemy army will be randomly generated at battle start.
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-4">
                <BudgetBar spent={spent} unitCount={unitCount} />
                <ArmyPresets onApply={handleApplyPreset} />
                <div className="min-h-0 flex-1 overflow-hidden">
                  <ArmyRoster
                    units={currentUnits}
                    playerHeroIndex={activeTab === 'your-army' ? playerHeroIndex : null}
                    onSetPlayerHero={(i) => activeTab === 'your-army' && setPlayerHeroIndex(i)}
                    onChangeCount={handleChangeCount}
                    onRemove={handleRemove}
                  />
                </div>
                <ClassPicker spent={spent} unitCount={unitCount} onAdd={handleAdd} />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-4">
              <Button onClick={handleStart} disabled={!canStart} size="xl" className="flex-1 min-w-[220px]">
                <Sword className="h-4 w-4" />
                Start Battle
              </Button>
              {!canStart && playerHeroIndex === null && playerUnits.length > 0 && (
                <span className="text-xs text-[var(--color-destructive)]">Pick your hero stack first (crown icon).</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScreenShell>
  );
};

export default ArmyComposeScreen;
