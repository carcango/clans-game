import React, { useRef, useEffect } from 'react';

interface MinimapProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const Minimap: React.FC<MinimapProps> = ({ canvasRef }) => (
  <div className="fixed top-[30px] left-1/2 -translate-x-1/2 w-[150px] h-[150px] bg-black/60 border border-[#5a4a2a] rounded-full overflow-hidden z-[15]">
    <canvas ref={canvasRef} width={150} height={150} className="rounded-full" />
  </div>
);

export default Minimap;
