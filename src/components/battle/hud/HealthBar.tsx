import React from 'react';

interface HealthBarProps {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
}

const HealthBar: React.FC<HealthBarProps> = ({ health, maxHealth, stamina, maxStamina }) => {
  const hpPct = Math.max(0, (health / maxHealth) * 100);
  const stPct = Math.max(0, (stamina / maxStamina) * 100);

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-[15]">
      {/* Health bar */}
      <div className="w-[300px] h-[18px] bg-black/70 border border-[#5a4a2a] rounded-sm overflow-hidden relative">
        <div
          className="h-full transition-[width] duration-300 ease-out"
          style={{
            width: `${hpPct}%`,
            background: 'linear-gradient(180deg, #c0392b 0%, #8b1a1a 100%)',
            boxShadow: '0 0 10px rgba(192,57,43,0.5)',
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent" />
      </div>
      {/* Stamina bar */}
      <div className="w-[300px] h-[8px] bg-black/70 border border-[#3a4a2a] rounded-sm overflow-hidden">
        <div
          className="h-full transition-[width] duration-300 ease-out"
          style={{
            width: `${stPct}%`,
            background: 'linear-gradient(180deg, #27ae60 0%, #1a6b3c 100%)',
          }}
        />
      </div>
      <div className="text-[#c8a96e] text-[11px] tracking-[3px] uppercase" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        Health & Stamina
      </div>
    </div>
  );
};

export default HealthBar;
