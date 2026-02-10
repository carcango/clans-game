import React from 'react';
import { Crown, Minus, Plus, X } from 'lucide-react';
import { ArmyUnit } from '../../types/army';
import { HERO_CLASSES } from '../../constants/classes';
import { getUnitCost } from '../../constants/army';
import { Button } from '../ui/button';

interface ArmyRosterProps {
  units: ArmyUnit[];
  playerHeroIndex: number | null;
  onSetPlayerHero: (index: number) => void;
  onChangeCount: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
}

const levelNames = ['', 'I', 'II', 'III'];

const ArmyRoster: React.FC<ArmyRosterProps> = ({
  units,
  playerHeroIndex,
  onSetPlayerHero,
  onChangeCount,
  onRemove,
}) => {
  if (units.length === 0) {
    return (
      <div className="rounded-[var(--radius-xl)] border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-text-muted)]">
        No units yet. Add classes from the picker below.
      </div>
    );
  }

  return (
    <div className="flex max-h-[340px] flex-col gap-2.5 overflow-y-auto pr-1">
      {units.map((unit, i) => {
        const heroClass = HERO_CLASSES.find((c) => c.id === unit.classId);
        const name = heroClass?.name ?? unit.classId;
        const cost = getUnitCost(unit.classId, unit.level);
        const isPlayerHero = playerHeroIndex === i;

        return (
          <div
            key={`${unit.classId}-${unit.level}-${i}`}
            className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-[var(--radius-xl)] border-2 px-3 py-3 transition-colors hover:border-[var(--color-border-strong)] ${
              isPlayerHero
                ? 'border-[var(--color-primary)]/40 bg-[rgba(212,168,67,0.1)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)]'
            }`}
          >
            <Button
              onClick={() => onSetPlayerHero(i)}
              variant={isPlayerHero ? 'primary' : 'ghost'}
              size="icon"
              title="Set as your hero"
              aria-label="Set as your hero"
            >
              <Crown className="h-4 w-4" aria-hidden="true" />
            </Button>

            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--color-text)]">{name}</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                Lv {levelNames[unit.level]} • {cost * unit.count} pts
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button onClick={() => onChangeCount(i, -1)} variant="secondary" size="icon" aria-label="Decrease unit count">
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-6 text-center text-sm font-semibold text-[var(--color-text)]">{unit.count}</span>
              <Button onClick={() => onChangeCount(i, 1)} variant="secondary" size="icon" aria-label="Increase unit count">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button onClick={() => onRemove(i)} variant="ghost" size="icon" aria-label="Remove unit stack">
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default ArmyRoster;
