import React from 'react';

interface AbilityCooldownProps {
  cooldown: number;
  maxCooldown: number;
  abilityName: string;
}

const AbilityCooldown: React.FC<AbilityCooldownProps> = ({ cooldown, maxCooldown, abilityName }) => {
  const ready = cooldown <= 0;
  const pct = ready ? 100 : ((maxCooldown - cooldown) / maxCooldown) * 100;

  return (
    <div className="fixed bottom-[60px] right-[40px] z-[15] flex flex-col items-center gap-1">
      <div
        className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center relative overflow-hidden ${
          ready ? 'border-amber-400 animate-pulse-glow' : 'border-slate-600'
        }`}
        style={{ background: 'rgba(0,0,0,0.7)' }}
      >
        {!ready && (
          <div
            className="absolute bottom-0 left-0 right-0 bg-amber-600/40 transition-[height] duration-200"
            style={{ height: `${pct}%` }}
          />
        )}
        <span className={`text-lg font-black relative z-10 ${ready ? 'text-amber-400' : 'text-slate-500'}`}>
          Q
        </span>
      </div>
      <div className="text-[10px] text-amber-300/80 tracking-wider uppercase text-center max-w-[70px] leading-tight font-semibold">
        {abilityName}
      </div>
      <div className="text-[9px] text-slate-500 tracking-wider uppercase text-center max-w-[60px]">
        {ready ? 'READY' : `${cooldown.toFixed(1)}s`}
      </div>
    </div>
  );
};

export default AbilityCooldown;
