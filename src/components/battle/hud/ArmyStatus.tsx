import React from 'react';

interface ArmyStatusProps {
  allyCount: number;
  enemyCount: number;
}

const ArmyStatus: React.FC<ArmyStatusProps> = ({ allyCount, enemyCount }) => (
  <div className="fixed bottom-[115px] left-1/2 -translate-x-1/2 flex gap-[30px] items-center z-[15]">
    <div className="flex flex-col items-center gap-0.5">
      <div className="text-[10px] tracking-[3px] uppercase text-[#5b9bd5]" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        Your Army
      </div>
      <div className="text-[28px] font-black text-[#5b9bd5]" style={{ textShadow: '0 0 15px #5b9bd5' }}>
        {allyCount}
      </div>
    </div>
    <div className="text-[#c8a96e] text-[14px] tracking-[4px]" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
      VS
    </div>
    <div className="flex flex-col items-center gap-0.5">
      <div className="text-[10px] tracking-[3px] uppercase text-[#e74c3c]" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        Enemy Army
      </div>
      <div className="text-[28px] font-black text-[#e74c3c]" style={{ textShadow: '0 0 15px #e74c3c' }}>
        {enemyCount}
      </div>
    </div>
  </div>
);

export default ArmyStatus;
