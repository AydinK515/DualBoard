import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { DrawingState, DrawingElement, DrawingStroke, DrawingShape, DrawingText, DrawingImage, Point } from '../types/drawing';
import { ViewTransform } from '../hooks/useCanvasInteractions';

interface CanvasProps {
  drawingState: DrawingState;
  isRotated?: boolean;
  onStartDrawing?: (point: Point) => void;
  onContinueDrawing?: (point: Point) => void;
  onEndDrawing?: () => void;
  disabled?: boolean;
  transform: ViewTransform;
  onTransformChange: (transform: ViewTransform) => void;
}

export interface CanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
}

export const Canvas = forwardRef<CanvasRef, CanvasProps>(({
  drawingState,
  isRotated = false,
  onStartDrawing,
  onContinueDrawing,
  onEndDrawing,
  disabled = false,
  transform,
  onTransformChange,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const lastPanPoint = useRef<{ x: number; y: number } | null>(null);
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const initialTouchDistance = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }));

  const transformPoint = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Get raw canvas coordinates relative to the canvas element
    let canvasX = clientX - rect.left;
    let canvasY = clientY - rect.top;
    
    // If this canvas is rotated, we need to transform the screen coordinates first
    // before applying the pan/zoom transforms
    if (isRotated) {
      canvasX = rect.width - canvasX;
      canvasY = rect.height - canvasY;
    }
    
    // Now apply the inverse pan/zoom transforms to get the final drawing coordinates
    const x = (canvasX - transform.x) / transform.scale;
    const y = (canvasY - transform.y) / transform.scale;

    return { x, y };
  }, [isRotated, transform]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!drawingState.showGrid) return;

    const canvas = ctx.canvas;
    const gridSize = 20;
    
    // Make grid cover a much larger area
    const gridExtent = 10000; // Large grid area
    const startX = -gridExtent;
    const startY = -gridExtent;
    const endX = gridExtent;
    const endY = gridExtent;

    ctx.save();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.5;

    // Draw vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      if (x % gridSize === 0) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
    }

    // Draw horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      if (y % gridSize === 0) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [drawingState.showGrid]);

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (stroke.points.length < 2) return;

    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }

    ctx.stroke();
    ctx.restore();
  }, []);

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, shape: DrawingShape) => {
    ctx.save();
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = shape.width;

    const width = shape.endPoint.x - shape.startPoint.x;
    const height = shape.endPoint.y - shape.startPoint.y;

    switch (shape.type) {
      case 'rectangle':
        ctx.strokeRect(shape.startPoint.x, shape.startPoint.y, width, height);
        break;
      case 'ellipse':
        ctx.beginPath();
        ctx.ellipse(
          shape.startPoint.x + width / 2,
          shape.startPoint.y + height / 2,
          Math.abs(width / 2),
          Math.abs(height / 2),
          0,
          0,
          2 * Math.PI
        );
        ctx.stroke();
        break;
      case 'line':
        ctx.beginPath();
        ctx.moveTo(shape.startPoint.x, shape.startPoint.y);
        ctx.lineTo(shape.endPoint.x, shape.endPoint.y);
        ctx.stroke();
        break;
      case 'arrow':
        // Draw line
        ctx.beginPath();
        ctx.moveTo(shape.startPoint.x, shape.startPoint.y);
        ctx.lineTo(shape.endPoint.x, shape.endPoint.y);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(height, width);
        const arrowLength = Math.max(15, shape.width * 3); // Scale with line width
        const arrowAngle = Math.PI / 6; // 30 degrees
        ctx.beginPath();
        ctx.moveTo(shape.endPoint.x, shape.endPoint.y);
        ctx.lineTo(
          shape.endPoint.x - arrowLength * Math.cos(angle - arrowAngle),
          shape.endPoint.y - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.moveTo(shape.endPoint.x, shape.endPoint.y);
        ctx.lineTo(
          shape.endPoint.x - arrowLength * Math.cos(angle + arrowAngle),
          shape.endPoint.y - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.stroke();
        break;
    }

    ctx.restore();
  }, []);

  const drawText = useCallback((ctx: CanvasRenderingContext2D, text: DrawingText) => {
    ctx.save();
    ctx.fillStyle = text.color;
    ctx.font = `${text.fontSize}px ${text.fontFamily}`;
    ctx.textBaseline = 'top';
    ctx.fillText(text.text, text.position.x, text.position.y);
    ctx.restore();
  }, []);

  const drawImage = useCallback((ctx: CanvasRenderingContext2D, image: DrawingImage) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, image.position.x, image.position.y, image.width, image.height);
    };
    img.src = image.src;
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply pan and zoom transforms
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // If the canvas is CSS rotated, apply inverse rotation to drawings
    // so they appear in the same orientation regardless of the flip

    // Draw grid first (behind everything)
    drawGrid(ctx);

    // Draw all elements
    drawingState.elements.forEach((element) => {
      if ('points' in element) {
        drawStroke(ctx, element as DrawingStroke);
      } else if ('startPoint' in element && 'endPoint' in element) {
        drawShape(ctx, element as DrawingShape);
      } else if ('text' in element) {
        drawText(ctx, element as DrawingText);
      } else if ('src' in element) {
        drawImage(ctx, element as DrawingImage);
      }
    });

    ctx.restore();
  }, [drawingState.elements, drawingState.showGrid, isRotated, transform, drawGrid, drawStroke, drawShape, drawText, drawImage]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redraw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [redraw]);

  const startPan = useCallback((clientX: number, clientY: number) => {
    isPanning.current = true;
    lastPanPoint.current = { x: clientX, y: clientY };
  }, []);

  const updatePan = useCallback((clientX: number, clientY: number) => {
    if (!isPanning.current || !lastPanPoint.current) return;

    let deltaX = clientX - lastPanPoint.current.x;
    let deltaY = clientY - lastPanPoint.current.y;
    
    // If canvas is rotated 180 degrees, invert the pan deltas
    if (isRotated) {
      deltaX = -deltaX;
      deltaY = -deltaY;
    }

    onTransformChange({
      ...transform,
      x: transform.x + deltaX,
      y: transform.y + deltaY,
    });

    lastPanPoint.current = { x: clientX, y: clientY };
  }, [transform, onTransformChange]);

  const endPan = useCallback(() => {
    isPanning.current = false;
    lastPanPoint.current = null;
  }, []);

  const zoom = useCallback((delta: number, centerX: number, centerY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let canvasCenterX = centerX - rect.left;
    let canvasCenterY = centerY - rect.top;
    
    // If canvas is rotated 180 degrees, adjust the zoom center coordinates
    if (isRotated) {
      canvasCenterX = rect.width - canvasCenterX;
      canvasCenterY = rect.height - canvasCenterY;
    }

    const zoomFactor = delta > 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.1, Math.min(5, transform.scale * zoomFactor));
    
    // Calculate zoom towards the cursor/pinch center
    const scaleChange = newScale / transform.scale;
    const newX = canvasCenterX - (canvasCenterX - transform.x) * scaleChange;
    const newY = canvasCenterY - (canvasCenterY - transform.y) * scaleChange;
    
    onTransformChange({
      x: newX,
      y: newY,
      scale: newScale,
    });
  }, [transform, onTransformChange, isRotated]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;

    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      startPan(e.clientX, e.clientY);
      return;
    }

    if (e.button === 0 && !isPanning.current && onStartDrawing) { // Left mouse button
      e.preventDefault();
      const point = transformPoint(e.clientX, e.clientY);
      isDrawing.current = true;
      onStartDrawing(point);
    }
  }, [disabled, onStartDrawing, transformPoint, startPan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (disabled) return;

    if (isPanning.current) {
      updatePan(e.clientX, e.clientY);
      return;
    }

    if (isDrawing.current && onContinueDrawing) {
      e.preventDefault();
      const point = transformPoint(e.clientX, e.clientY);
      onContinueDrawing(point);
    }
  }, [disabled, onContinueDrawing, transformPoint, updatePan]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (disabled) return;

    if (isPanning.current) {
      endPan();
      return;
    }

    if (isDrawing.current && onEndDrawing) {
      e.preventDefault();
      isDrawing.current = false;
      onEndDrawing();
    }
  }, [disabled, onEndDrawing, endPan]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (disabled) return;
    e.preventDefault();
    zoom(-e.deltaY, e.clientX, e.clientY);
  }, [disabled, zoom]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    if (e.touches.length === 2) {
      // Two finger touch - prepare for pinch zoom
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      lastTouchDistance.current = distance;
      initialTouchDistance.current = distance;
      lastTouchCenter.current = { x: centerX, y: centerY };
      
      // Stop any drawing that might be in progress
      if (isDrawing.current && onEndDrawing) {
        isDrawing.current = false;
        onEndDrawing();
      }
    } else if (e.touches.length === 1) {
      // Single finger - start drawing if enabled
      if (onStartDrawing) {
        const point = transformPoint(e.touches[0].clientX, e.touches[0].clientY);
        isDrawing.current = true;
        onStartDrawing(point);
      }
    }
  }, [disabled, onStartDrawing, transformPoint, startPan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    
    if (e.touches.length === 2 && lastTouchDistance.current && lastTouchCenter.current && initialTouchDistance.current) {
      // Two finger: pinch zoom and pan
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      // Handle pinch zoom with improved sensitivity and smoothness
      const zoomRatio = distance / initialTouchDistance.current;
      const currentZoomRatio = lastTouchDistance.current / initialTouchDistance.current;
      const zoomChange = zoomRatio / currentZoomRatio;
      
      if (Math.abs(zoomChange - 1) > 0.01) { // Only zoom if there's a meaningful change
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          let canvasCenterX = centerX - rect.left;
          let canvasCenterY = centerY - rect.top;
          
          // If canvas is rotated 180 degrees, adjust the zoom center coordinates
          if (isRotated) {
            canvasCenterX = rect.width - canvasCenterX;
            canvasCenterY = rect.height - canvasCenterY;
          }
          
          // Apply zoom with the ratio change
          const newScale = Math.max(0.1, Math.min(5, transform.scale * zoomChange));
          const scaleChange = newScale / transform.scale;
          const newX = canvasCenterX - (canvasCenterX - transform.x) * scaleChange;
          const newY = canvasCenterY - (canvasCenterY - transform.y) * scaleChange;
          
          onTransformChange({
            x: newX,
            y: newY,
            scale: newScale,
          });
        }
      }
      
      // Handle two-finger panning (only if not zooming significantly)
      const panDeltaX = centerX - lastTouchCenter.current.x;
      const panDeltaY = centerY - lastTouchCenter.current.y;
      
      // Adjust pan deltas for rotated canvas
      let adjustedPanDeltaX = panDeltaX;
      let adjustedPanDeltaY = panDeltaY;
      if (isRotated) {
        adjustedPanDeltaX = -panDeltaX;
        adjustedPanDeltaY = -panDeltaY;
      }
      
      // Only pan if zoom change is minimal and there's meaningful movement
      if (Math.abs(zoomChange - 1) < 0.05 && (Math.abs(panDeltaX) > 2 || Math.abs(panDeltaY) > 2)) {
        onTransformChange({
          ...transform,
          x: transform.x + adjustedPanDeltaX,
          y: transform.y + adjustedPanDeltaY,
        });
      }
      
      lastTouchDistance.current = distance;
      lastTouchCenter.current = { x: centerX, y: centerY };
    } else if (e.touches.length === 1) {
      // Single finger - continue drawing if in progress
      if (isDrawing.current && onContinueDrawing) {
        const point = transformPoint(e.touches[0].clientX, e.touches[0].clientY);
        onContinueDrawing(point);
      }
    }
  }, [disabled, onContinueDrawing, transformPoint, transform, onTransformChange, isRotated]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    // End drawing if it was in progress
    if (isDrawing.current && onEndDrawing) {
      isDrawing.current = false;
      onEndDrawing();
    }

    // Reset touch tracking
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
  }, [disabled, onEndDrawing]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className={`touch-none select-none w-full h-full bg-white ${isRotated ? 'rotate-180' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
        style={{ 
          cursor: disabled ? 'default' : isPanning.current ? 'grabbing' : 'crosshair' 
        }}
      />
    </div>
  );
});

Canvas.displayName = 'Canvas';