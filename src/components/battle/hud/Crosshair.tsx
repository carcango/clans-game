import React from 'react';

const Crosshair: React.FC = () => (
  <div className="fixed left-1/2 top-1/2 z-20 h-7 w-7 -translate-x-1/2 -translate-y-1/2 opacity-70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
    <div className="absolute left-[13px] top-[3px] h-4 w-0.5 bg-white" />
    <div className="absolute left-[3px] top-[13px] h-0.5 w-4 bg-white" />
    <div className="absolute left-[11.5px] top-[11.5px] h-1.5 w-1.5 rounded-full border border-white bg-white/20" />
  </div>
);

export default Crosshair;
