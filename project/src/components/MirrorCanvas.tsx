// src/components/MirrorCanvas.tsx
import React, { useRef, useEffect } from 'react';

interface MirrorCanvasProps {
  sourceData: string;
  viewTransform: { scale: number; offsetX: number; offsetY: number };
}

const MirrorCanvas: React.FC<MirrorCanvasProps> = ({
  sourceData,
  viewTransform,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Resize to container & account for devicePixelRatio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Draw the tutor's view, cropped & rotated
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceData) return;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      const vw = canvas.width / dpr;
      const vh = canvas.height / dpr;
      const { scale, offsetX, offsetY } = viewTransform;
      const srcW = vw / scale;
      const srcH = vh / scale;
      const srcX = -offsetX / scale;
      const srcY = -offsetY / scale;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // center & rotate 180°
      ctx.translate(vw / 2, vh / 2);
      ctx.rotate(Math.PI);

      // draw the cropped tutor viewport
      ctx.drawImage(
        img,
        srcX, srcY,
        srcW, srcH,
        -vw / 2, -vh / 2,
        vw, vh
      );
      ctx.restore();
    };
    img.src = sourceData;
  }, [sourceData, viewTransform]);

  return (
    <canvas
      ref={canvasRef}
      className="border-0"
      style={{ touchAction: 'none', width: 'auto', height: 'auto' }}
    />
  );
};

export default MirrorCanvas;
