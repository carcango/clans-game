import React from 'react';
import { Zap } from 'lucide-react';
import { HeroClass } from '../../types/hero';
import { getScaledStats, CLASS_STATS } from '../../constants/stats';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import StatPill from '../ui/stat-pill';

interface HeroStatsPanelProps {
  heroClass: HeroClass;
}

const STAT_VARIANT_MAP: Record<string, 'health' | 'stamina' | 'default'> = {
  Health: 'health',
  Stamina: 'stamina',
};

const HeroStatsPanel: React.FC<HeroStatsPanelProps> = ({ heroClass }) => {
  const stats = getScaledStats(heroClass.id, heroClass.level);
  const base = CLASS_STATS[heroClass.id] || CLASS_STATS.warrior;

  const statBars = [
    { label: 'Health', value: stats.hp, max: 170 },
    { label: 'Stamina', value: stats.stamina, max: 200 },
    { label: 'Speed', value: stats.speed, max: 12 },
    { label: 'Attack', value: (stats.attackMin + stats.attackMax) / 2, max: 55 },
    { label: 'Block', value: stats.blockPct * 100, max: 100 },
  ];

  return (
    <Card variant="elevated" className="w-full max-w-sm">
      <CardHeader className="space-y-3">
        <CardTitle className="font-display text-2xl">{heroClass.name}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <StatPill label="Style" value={stats.attackType} />
          <StatPill label="Range" value={stats.range} />
          <StatPill label="Base HP" value={base.hp} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-3 rounded-[var(--radius-lg)] border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          {statBars.map((stat) => (
            <div key={stat.label}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-muted)]">{stat.label}</span>
                <span className="font-semibold text-[var(--color-text)]">
                  {typeof stat.value === 'number' && stat.value % 1 !== 0
                    ? stat.value.toFixed(1)
                    : Math.round(stat.value)}
                </span>
              </div>
              <Progress
                value={Math.min(100, (stat.value / stat.max) * 100)}
                variant={STAT_VARIANT_MAP[stat.label] || 'default'}
              />
            </div>
          ))}
        </div>

        <div className="rounded-[var(--radius-lg)] border-2 border-[var(--color-secondary-light)] bg-[var(--color-surface-elevated)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-secondary)]">
            <Zap className="h-4 w-4" aria-hidden="true" />
            Q - {stats.abilityName}
          </div>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{stats.abilityDescription}</p>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">Cost: {stats.abilityCost} stamina</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeroStatsPanel;
