import { useState, useCallback, useRef } from 'react';

export interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}

export const useCanvasInteractions = () => {
  const [transform, setTransform] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const lastPanPoint = useRef<{ x: number; y: number } | null>(null);
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);

  const startPan = useCallback((clientX: number, clientY: number) => {
    isPanning.current = true;
    lastPanPoint.current = { x: clientX, y: clientY };
  }, []);

  const updatePan = useCallback((clientX: number, clientY: number) => {
    if (!isPanning.current || !lastPanPoint.current) return;

    const deltaX = clientX - lastPanPoint.current.x;
    const deltaY = clientY - lastPanPoint.current.y;

    setTransform(prev => ({
      ...prev,
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));

    lastPanPoint.current = { x: clientX, y: clientY };
  }, []);

  const endPan = useCallback(() => {
    isPanning.current = false;
    lastPanPoint.current = null;
  }, []);

  const zoom = useCallback((delta: number, centerX: number, centerY: number) => {
    const zoomFactor = delta > 0 ? 1.1 : 0.9;
    
    setTransform(prev => {
      const newScale = Math.max(0.1, Math.min(5, prev.scale * zoomFactor));
      
      // Calculate zoom towards the center point (cursor/pinch position)
      const scaleChange = newScale / prev.scale;
      const newX = centerX - (centerX - prev.x) * scaleChange;
      const newY = centerY - (centerY - prev.y) * scaleChange;
      
      return {
        x: newX,
        y: newY,
        scale: newScale,
      };
    });
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Two finger touch - prepare for pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      lastTouchDistance.current = distance;
      lastTouchCenter.current = { x: centerX, y: centerY };
    } else if (e.touches.length === 1) {
      // Single finger - pan
      startPan(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [startPan]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2 && lastTouchDistance.current && lastTouchCenter.current) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      const delta = distance - lastTouchDistance.current;
      zoom(delta, centerX, centerY);
      
      lastTouchDistance.current = distance;
      lastTouchCenter.current = { x: centerX, y: centerY };
    } else if (e.touches.length === 1) {
      // Pan
      updatePan(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [updatePan, zoom]);

  const handleTouchEnd = useCallback(() => {
    endPan();
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
  }, [endPan]);

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  return {
    transform,
    setTransform,
    startPan,
    updatePan,
    endPan,
    zoom,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetView,
    isPanning: isPanning.current,
  };
};