import React, { useRef, useEffect } from 'react';

interface MirrorCanvasProps {
  sourceData: string;
}

const MirrorCanvas: React.FC<MirrorCanvasProps> = ({ sourceData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the mirrored image
      ctx.save();
      // Rotate 180 degrees for student view
      ctx.translate(canvas.width / window.devicePixelRatio / 2, canvas.height / window.devicePixelRatio / 2);
      ctx.rotate(Math.PI);
      ctx.drawImage(img, -canvas.width / window.devicePixelRatio / 2, -canvas.height / window.devicePixelRatio / 2);
      ctx.restore();
    };
    img.src = sourceData;
  }, [sourceData]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full border-0"
      style={{ touchAction: 'none' }}
    />
  );
};

export default MirrorCanvas;