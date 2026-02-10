import React from 'react';

interface WaveBannerProps {
  text: string | null;
}

const WaveBanner: React.FC<WaveBannerProps> = ({ text }) => (
  <div
    className={`fixed left-1/2 top-[35%] z-20 -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-2xl)] border-2 border-[var(--color-primary)]/40 bg-[var(--color-surface)] px-7 py-3 text-center font-display text-5xl font-semibold text-[var(--color-text-heading)] shadow-[var(--shadow-card)] backdrop-blur-md transition-opacity duration-300 ${text ? 'animate-banner-drop' : ''}`}
    style={{
      opacity: text ? 1 : 0,
      pointerEvents: 'none',
    }}
  >
    {text}
  </div>
);

export default WaveBanner;
