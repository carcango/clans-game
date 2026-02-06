import React from 'react';

const Crosshair: React.FC = () => (
  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 z-20 opacity-60">
    <div className="absolute w-0.5 h-6 left-[11px] top-0 bg-white" />
    <div className="absolute w-6 h-0.5 top-[11px] left-0 bg-white" />
  </div>
);

export default Crosshair;
