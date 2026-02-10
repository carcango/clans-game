import React from 'react';
import { Sparkles } from 'lucide-react';
import { HeroClass } from '../../types/hero';
import { HERO_CLASSES } from '../../constants/classes';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface ClassGridProps {
  currentClass: HeroClass;
  onClassSelect: (hero: HeroClass) => void;
  onLevelUp: () => void;
}

const ClassGrid: React.FC<ClassGridProps> = ({ currentClass, onClassSelect, onLevelUp }) => {
  const levelNames = ['Novice', 'Elite', 'Legendary'];

  return (
    <TooltipProvider delayDuration={120}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {HERO_CLASSES.map((cls) => (
            <Button
              key={cls.id}
              onClick={() => onClassSelect(cls)}
              variant={currentClass.id === cls.id ? 'primary' : 'secondary'}
              size="sm"
              className="h-10"
            >
              {cls.name}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-4">
          {currentClass.level < 3 ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onLevelUp} variant="secondary" size="sm" className="gap-1.5 border-[var(--color-secondary-light)] text-[var(--color-secondary)]">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Ascend Hero
                </Button>
              </TooltipTrigger>
              <TooltipContent>Increase this class to the next level tier.</TooltipContent>
            </Tooltip>
          ) : (
            <Button disabled size="sm" variant="secondary">
              Max Level Reached
            </Button>
          )}

          <Badge variant={currentClass.level >= 3 ? 'glow' : 'secondary'}>
            Level {currentClass.level}: {levelNames[currentClass.level - 1]}
          </Badge>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ClassGrid;
