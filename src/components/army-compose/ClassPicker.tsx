import React, { useState } from 'react';
import { HERO_CLASSES } from '../../constants/classes';
import { getUnitCost, ARMY_BUDGET, MAX_ARMY_SIZE } from '../../constants/army';
import { getScaledStats } from '../../constants/stats';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface ClassPickerProps {
  spent: number;
  unitCount: number;
  onAdd: (classId: string, level: number) => void;
}

const ClassPicker: React.FC<ClassPickerProps> = ({ spent, unitCount, onAdd }) => {
  const [selectedLevel, setSelectedLevel] = useState(1);

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-[var(--radius-xl)] border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Level</span>
          {[1, 2, 3].map((lv) => (
            <Button
              key={lv}
              onClick={() => setSelectedLevel(lv)}
              variant={selectedLevel === lv ? 'primary' : 'secondary'}
              size="sm"
            >
              {lv}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {HERO_CLASSES.map((cls) => {
            const cost = getUnitCost(cls.id, selectedLevel);
            const canAfford = spent + cost <= ARMY_BUDGET;
            const canFit = unitCount < MAX_ARMY_SIZE;
            const disabled = !canAfford || !canFit;
            const stats = getScaledStats(cls.id, selectedLevel);

            return (
              <Card key={cls.id} className={disabled ? 'opacity-60' : ''}>
                <CardContent className="space-y-3 p-4">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-[var(--color-primary)]">{cls.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{stats.attackType} &middot; {stats.hp} HP</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{cost} pts</div>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          onClick={() => !disabled && onAdd(cls.id, selectedLevel)}
                          disabled={disabled}
                          variant="secondary"
                          size="sm"
                          className="w-full"
                        >
                          Add Unit
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {disabled && (
                      <TooltipContent>
                        {!canAfford ? 'Insufficient budget.' : 'Army is at max capacity.'}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ClassPicker;
