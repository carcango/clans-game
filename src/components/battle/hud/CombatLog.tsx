import React from 'react';
import { CombatLogEntry } from '../../../types/game';

interface CombatLogProps {
  entries: CombatLogEntry[];
}

const CombatLog: React.FC<CombatLogProps> = ({ entries }) => (
  <div className="fixed bottom-[180px] left-[30px] text-[rgba(200,169,110,0.8)] text-[11px] z-[15] max-w-[300px]">
    {entries.map((entry, i) => (
      <div key={`${entry.time}-${i}`} className="animate-log-fade mb-0.5">
        {entry.text}
      </div>
    ))}
  </div>
);

export default CombatLog;
