import React from 'react';
import { ARMY_BUDGET, MAX_ARMY_SIZE } from '../../constants/army';
import { Progress } from '../ui/progress';
import StatPill from '../ui/stat-pill';

interface BudgetBarProps {
  spent: number;
  unitCount: number;
}

const BudgetBar: React.FC<BudgetBarProps> = ({ spent, unitCount }) => {
  const pct = Math.min(100, (spent / ARMY_BUDGET) * 100);
  const overBudget = spent > ARMY_BUDGET;
  const overUnits = unitCount > MAX_ARMY_SIZE;

  return (
    <div className="space-y-3 rounded-[var(--radius-xl)] border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap gap-2">
        <StatPill
          label="Budget"
          value={`${spent} / ${ARMY_BUDGET} pts`}
          className={`text-sm ${overBudget ? 'border-[var(--color-destructive)]/60 text-[var(--color-destructive)]' : ''}`}
        />
        <StatPill
          label="Units"
          value={`${unitCount} / ${MAX_ARMY_SIZE}`}
          className={`text-sm ${overUnits ? 'border-[var(--color-destructive)]/60 text-[var(--color-destructive)]' : ''}`}
        />
      </div>
      <Progress value={pct} variant="stamina" className="h-3" />
    </div>
  );
};

export default BudgetBar;
