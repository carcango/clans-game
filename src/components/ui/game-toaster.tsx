import React from 'react';
import { Toaster } from 'sonner';

interface GameToasterProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  offset?: string | number;
}

const GameToaster: React.FC<GameToasterProps> = ({ position = 'top-right', offset = 16 }) => (
  <Toaster
    richColors
    theme="dark"
    position={position}
    offset={offset}
    toastOptions={{
      style: {
        fontFamily: 'Lora, serif',
        fontSize: '13px',
        fontWeight: '600',
        background: 'var(--color-surface)',
        border: '2px solid var(--color-border)',
        color: 'var(--color-text)',
        borderRadius: 'var(--radius-xl)',
      },
    }}
  />
);

export default GameToaster;
