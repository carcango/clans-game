import React from 'react';

const CommandHint: React.FC = () => (
  <div
    className="fixed bottom-[88px] left-1/2 -translate-x-1/2 text-[rgba(200,169,110,0.4)] text-[10px] tracking-[2px] z-[15]"
    style={{ pointerEvents: 'none' }}
  >
    F — Rally &nbsp;|&nbsp; G — Charge &nbsp;|&nbsp; Q — Ability &nbsp;|&nbsp; R — View &nbsp;|&nbsp; Scroll — Zoom
  </div>
);

export default CommandHint;
