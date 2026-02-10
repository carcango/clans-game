import React from 'react';

interface DamageOverlayProps {
  active: boolean;
}

const DamageOverlay: React.FC<DamageOverlayProps> = ({ active }) => (
  <div
    className="fixed inset-0 z-[12] transition-all duration-120"
    style={{
      background: active
        ? 'radial-gradient(circle at 50% 50%, transparent 55%, rgba(196,64,64,0.45) 100%)'
        : 'none',
      boxShadow: active ? 'inset 0 0 0 8px rgba(196,64,64,0.6)' : 'inset 0 0 0 0 rgba(196,64,64,0)',
      pointerEvents: 'none',
    }}
  />
);

export default DamageOverlay;
