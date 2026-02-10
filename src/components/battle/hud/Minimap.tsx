import React from 'react';

interface MinimapProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const Minimap: React.FC<MinimapProps> = ({ canvasRef }) => (
  <div className="fixed right-4 top-4 z-[15] h-[158px] w-[158px] rounded-full border-2 border-[var(--color-hud-border)] bg-[var(--color-hud-bg)] p-1 shadow-[var(--shadow-hud)] backdrop-blur-md">
    <canvas ref={canvasRef} width={150} height={150} className="h-full w-full rounded-full" />
  </div>
);

export default Minimap;
