import React from 'react';

interface WaveBannerProps {
  text: string | null;
}

const WaveBanner: React.FC<WaveBannerProps> = ({ text }) => (
  <div
    className="fixed top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 transition-opacity duration-400 tracking-wider font-[var(--font-medieval)]"
    style={{
      fontSize: '48px',
      color: '#f39c12',
      textShadow: '0 0 30px rgba(243,156,18,0.5), 0 4px 12px rgba(0,0,0,0.9)',
      opacity: text ? 1 : 0,
      pointerEvents: 'none',
    }}
  >
    {text}
  </div>
);

export default WaveBanner;
