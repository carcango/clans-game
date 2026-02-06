import React from 'react';

interface WaveInfoProps {
  wave: number;
  kills: number;
}

const WaveInfo: React.FC<WaveInfoProps> = ({ wave, kills }) => (
  <>
    <div className="fixed top-[30px] left-[40px] z-[15]" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
      <div className="text-[#c8a96e] text-[14px] tracking-[2px]">WAVE</div>
      <div className="text-[24px] font-bold text-[#f39c12]">{wave}</div>
    </div>
    <div className="fixed top-[30px] right-[40px] z-[15]" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
      <div className="text-[#c8a96e] text-[14px] tracking-[2px]">KILLS</div>
      <div className="text-[36px] font-black text-[#e74c3c]" style={{ textShadow: '0 0 20px rgba(231,76,60,0.5)' }}>
        {kills}
      </div>
    </div>
  </>
);

export default WaveInfo;
