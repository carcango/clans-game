import React, { useState, useCallback } from 'react';
import { HeroClass } from '../../types/hero';
import { HERO_CLASSES } from '../../constants/classes';
import VoxelPreview from './VoxelPreview';
import ClassGrid from './ClassGrid';
import HeroStatsPanel from './HeroStatsPanel';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import ScreenShell from '../ui/screen-shell';
import SectionHeader from '../ui/section-header';

interface CharacterSelectScreenProps {
  onStartBattle: (heroClass: HeroClass) => void;
}

const CharacterSelectScreen: React.FC<CharacterSelectScreenProps> = ({ onStartBattle }) => {
  const [currentClass, setCurrentClass] = useState<HeroClass>(HERO_CLASSES[0]);

  const handleClassSelect = useCallback((hero: HeroClass) => {
    setCurrentClass({ ...hero, level: 1 });
  }, []);

  const handleLevelUp = useCallback(() => {
    if (currentClass.level >= 3) return;
    setCurrentClass((prev) => ({ ...prev, level: prev.level + 1 }));
  }, [currentClass.level]);

  return (
    <ScreenShell contentClassName="p-0">
      <VoxelPreview heroClass={currentClass} />

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
        <SectionHeader
          title={currentClass.name}
          subtitle="Choose class and level before entering the arena."
          eyebrow="Hero Arena"
          action={<Badge variant="secondary">Hero Select</Badge>}
        />

        <div className="pointer-events-auto grid items-end gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="animate-bounce-in-up stagger-1">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <ClassGrid currentClass={currentClass} onClassSelect={handleClassSelect} onLevelUp={handleLevelUp} />

              <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button onClick={() => onStartBattle(currentClass)} size="xl" className="sm:min-w-[200px]">
                  Enter Battle
                </Button>
                <p className="text-xs text-[var(--color-text-muted)]">
                  WASD Move · Mouse Look · Left Click Attack · Right Click Block · Q Ability
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="animate-bounce-in-up stagger-2">
            <HeroStatsPanel heroClass={currentClass} />
          </div>
        </div>
      </div>
    </ScreenShell>
  );
};

export default CharacterSelectScreen;
