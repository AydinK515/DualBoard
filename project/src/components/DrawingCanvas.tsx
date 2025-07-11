import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DrawingCanvasProps {
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  tool: 'pen' | 'eraser';
  brushSize: number;
  onHistoryChange: (canvasData: string, canUndo: boolean, canRedo: boolean) => void;
  clearCanvas: boolean;
  setClearCanvas: (clear: boolean) => void;
  undoAction: boolean;
  setUndoAction: (undo: boolean) => void;
  redoAction: boolean;
  setRedoAction: (redo: boolean) => void;
  isMirrored?: boolean;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isDrawing,
  setIsDrawing,
  tool,
  brushSize,
  onHistoryChange,
  clearCanvas,
  setClearCanvas,
  undoAction,
  setUndoAction,
  redoAction,
  setRedoAction,
  isMirrored = false,
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);

  const handleZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.2, Math.min(5, scale * delta));
    setScale(newScale);
  };

  const startPan = (e: React.MouseEvent) => {
    if (e.button !== 1) return;
    e.preventDefault();
    isPanning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const pan = (e: React.MouseEvent) => {
    if (!isPanning.current) return;
    e.preventDefault();
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const endPan = () => {
    isPanning.current = false;
  };

  const restoreFromHistory = useCallback((index: number) => {
    if (!context || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      context.drawImage(img, 0, 0);
      onHistoryChange(canvasRef.current!.toDataURL(), index > 0, index < history.length - 1);
    };
    img.src = history[index];
  }, [context, history, onHistoryChange]);

  const saveToHistory = useCallback(() => {
    if (!canvasRef.current) return;
    const canvasData = canvasRef.current.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(canvasData);
    setHistory(newHistory);
    const newIndex = newHistory.length - 1;
    setHistoryIndex(newIndex);
    onHistoryChange(canvasData, newIndex > 0, newIndex < newHistory.length - 1);
  }, [history, historyIndex, onHistoryChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 3000;
    canvas.height = 3000;
    ctx.scale(1, 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setContext(ctx);

    const initialState = canvas.toDataURL();
    setHistory([initialState]);
    setHistoryIndex(0);
    onHistoryChange(initialState, false, false);
  }, []);

  useEffect(() => {
    if (clearCanvas && context && canvasRef.current) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setClearCanvas(false);
      saveToHistory();
    }
  }, [clearCanvas, context, setClearCanvas]);

  useEffect(() => {
    if (undoAction && historyIndex > 0) {
      const newIndex = historyIndex - 1;
      restoreFromHistory(newIndex);
      setHistoryIndex(newIndex);
      setUndoAction(false);
    }
  }, [undoAction]);

  useEffect(() => {
    if (redoAction && historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      restoreFromHistory(newIndex);
      setHistoryIndex(newIndex);
      setRedoAction(false);
    }
  }, [redoAction]);

  const getPointFromEvent = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!context || isMirrored) return;
    if ('button' in e && e.button !== 0) return; // Only LMB
    const point = getPointFromEvent(e);
    if (!point) return;
    setIsDrawing(true);
    setLastPoint(point);
    context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    context.strokeStyle = tool === 'pen' ? '#000000' : '#ffffff';
    context.lineWidth = brushSize;
    context.beginPath();
    context.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
    context.fill();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !context || !lastPoint || isMirrored) return;
    const point = getPointFromEvent(e);
    if (!point) return;
    context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    context.strokeStyle = tool === 'pen' ? '#000000' : '#ffffff';
    context.lineWidth = brushSize;
    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    setLastPoint(point);
  };

  const stopDrawing = () => {
    if (!isDrawing || isMirrored) return;
    setIsDrawing(false);
    setLastPoint(null);
    saveToHistory();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (lastTouchDistance.current !== null) {
        const delta = distance / lastTouchDistance.current;
        setScale(prev => Math.max(0.2, Math.min(5, prev * delta)));
      }
      lastTouchDistance.current = distance;
    } else {
      draw(e);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    stopDrawing();
    if (e.touches.length < 2) lastTouchDistance.current = null;
  };

  return (
    <div
      ref={outerRef}
      onWheel={handleZoom}
      onMouseDown={startPan}
      onMouseMove={pan}
      onMouseUp={endPan}
      onMouseLeave={endPan}
      className="w-full h-full overflow-hidden relative"
      style={{ touchAction: 'none' }}
    >
      <div
        ref={transformRef}
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
        }}
      >
        <canvas
          ref={canvasRef}
          className={`border-0 cursor-crosshair ${isMirrored ? 'scale-x-[-1]' : ''}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none', backgroundColor: 'white' }}
        />
      </div>
    </div>
  );
};

export default DrawingCanvas;
