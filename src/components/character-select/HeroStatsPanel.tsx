import React from 'react';
import { HeroClass } from '../../types/hero';
import { getScaledStats, CLASS_STATS } from '../../constants/stats';

interface HeroStatsPanelProps {
  heroClass: HeroClass;
}

const HeroStatsPanel: React.FC<HeroStatsPanelProps> = ({ heroClass }) => {
  const stats = getScaledStats(heroClass.id, heroClass.level);
  const base = CLASS_STATS[heroClass.id] || CLASS_STATS.warrior;

  const statBars = [
    { label: 'HP', value: stats.hp, max: 170, color: 'bg-red-500' },
    { label: 'Stamina', value: stats.stamina, max: 200, color: 'bg-green-500' },
    { label: 'Speed', value: stats.speed, max: 12, color: 'bg-blue-500' },
    { label: 'Attack', value: (stats.attackMin + stats.attackMax) / 2, max: 55, color: 'bg-orange-500' },
    { label: 'Block', value: stats.blockPct * 100, max: 100, color: 'bg-cyan-500' },
  ];

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/50 p-5 w-72 shadow-2xl">
      <h3 className="text-lg font-bold text-white mb-1">{heroClass.name}</h3>
      <p className="text-xs text-slate-400 mb-4 uppercase tracking-wider">
        {stats.attackType} • Range: {stats.range}
      </p>

      <div className="space-y-3 mb-4">
        {statBars.map((stat) => (
          <div key={stat.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">{stat.label}</span>
              <span className="text-white font-bold">
                {typeof stat.value === 'number' && stat.value % 1 !== 0
                  ? stat.value.toFixed(1)
                  : Math.round(stat.value)}
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${stat.color} rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(100, (stat.value / stat.max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-700 pt-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-amber-400 text-sm font-bold">Q</span>
          <span className="text-white text-sm font-bold">{stats.abilityName}</span>
        </div>
        <p className="text-xs text-slate-400">{stats.abilityDescription}</p>
        <p className="text-xs text-slate-500 mt-1">Cost: {stats.abilityCost} stamina</p>
      </div>
    </div>
  );
};

export default HeroStatsPanel;
