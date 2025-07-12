// src/components/MirrorCanvas.tsx
import React, { useRef, useEffect, useCallback } from 'react';

interface MirrorCanvasProps {
  sourceData: string;
  viewTransform: { scale: number; offsetX: number; offsetY: number };
}

const MirrorCanvas: React.FC<MirrorCanvasProps> = ({ sourceData, viewTransform }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(new Image());

  // redraw the current viewport region
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img.complete) return;
    const ctx = canvas.getContext('2d')!;
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
    ctx.translate(vw / 2, vh / 2);
    ctx.rotate(Math.PI);
    ctx.drawImage(
      img,
      srcX, srcY,
      srcW, srcH,
      -vw / 2, -vh / 2,
      vw, vh
    );
    ctx.restore();
  }, [viewTransform]);

  // load new image snapshot
  useEffect(() => {
    const img = imgRef.current;
    img.onload = () => redraw();
    img.src = sourceData;
  }, [sourceData, redraw]);

  // adjust buffer on container resize and redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
      redraw();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redraw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full border-0"
      style={{ touchAction: 'none' }}
    />
  );
};

export default MirrorCanvas;
