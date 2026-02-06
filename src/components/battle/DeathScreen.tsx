import React from 'react';

interface DeathScreenProps {
  kills: number;
  wave: number;
  alliesRemaining: number;
  onRestart: () => void;
  onChangeHero: () => void;
}

const DeathScreen: React.FC<DeathScreenProps> = ({ kills, wave, alliesRemaining, onRestart, onChangeHero }) => (
  <div className="fixed inset-0 bg-[rgba(80,10,10,0.85)] flex flex-col items-center justify-center z-[100] backdrop-blur-sm">
    <h1
      className="text-[64px] text-[#c0392b] mb-2.5 font-[var(--font-medieval)]"
      style={{ textShadow: '0 0 40px rgba(192,57,43,0.5)' }}
    >
      Fallen in Battle
    </h1>
    <div className="text-[#c8a96e] text-[14px] tracking-[2px] mb-10 text-center leading-8">
      You slew <strong className="text-[#e74c3c]">{kills}</strong> enemies<br />
      Reached wave <strong className="text-[#f39c12]">{wave}</strong><br />
      Allies remaining: <strong className="text-[#5b9bd5]">{alliesRemaining}</strong>
    </div>
    <div className="flex gap-4">
      <button
        onClick={onRestart}
        className="font-[var(--font-cinzel)] px-[60px] py-4 border-none text-[#1a1008] text-[16px] tracking-[4px] uppercase cursor-pointer transition-all hover:scale-105"
        style={{
          background: 'linear-gradient(180deg, #c8a96e, #8a6a2e)',
          clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)',
        }}
      >
        Fight Again
      </button>
      <button
        onClick={onChangeHero}
        className="font-[var(--font-cinzel)] px-[40px] py-4 border-2 border-[#5a4a2a] bg-transparent text-[#c8a96e] text-[14px] tracking-[3px] uppercase cursor-pointer transition-all hover:border-[#c8a96e] hover:scale-105"
      >
        Change Hero
      </button>
    </div>
  </div>
);

export default DeathScreen;
