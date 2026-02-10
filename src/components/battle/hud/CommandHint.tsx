import React from 'react';

const CommandHint: React.FC = () => (
  <div className="fixed bottom-2 left-1/2 z-[15] -translate-x-1/2 rounded-[var(--radius-full)] border-2 border-[var(--color-hud-border)] bg-[var(--color-surface)]/80 px-4 py-1.5 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] opacity-60 shadow-[var(--shadow-hud)] backdrop-blur-md">
    F Rally · G Charge · Q Ability · R View · Scroll Zoom
  </div>
);

export default CommandHint;
