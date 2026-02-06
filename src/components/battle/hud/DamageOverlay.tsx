import React from 'react';

interface DamageOverlayProps {
  active: boolean;
}

const DamageOverlay: React.FC<DamageOverlayProps> = ({ active }) => (
  <div
    className="fixed inset-0 z-[12] transition-[border-color] duration-100"
    style={{
      border: '8px solid transparent',
      borderColor: active ? 'rgba(192,57,43,0.6)' : 'transparent',
      pointerEvents: 'none',
    }}
  />
);

export default DamageOverlay;
