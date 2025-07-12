// src/components/DrawingCanvas.tsx
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';

interface DrawingCanvasProps {
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  tool: 'pen' | 'eraser';
  brushSize: number;
  color: string;
  onHistoryChange: (canvasData: string, canUndo: boolean, canRedo: boolean) => void;
  clearCanvas: boolean;
  setClearCanvas: (clear: boolean) => void;
  undoAction: boolean;
  setUndoAction: (undo: boolean) => void;
  redoAction: boolean;
  setRedoAction: (redo: boolean) => void;
  isMirrored?: boolean;
  onViewChange?: (view: { scale: number; offsetX: number; offsetY: number }) => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isDrawing,
  setIsDrawing,
  tool,
  brushSize,
  color,
  onHistoryChange,
  clearCanvas,
  setClearCanvas,
  undoAction,
  setUndoAction,
  redoAction,
  setRedoAction,
  isMirrored = false,
  onViewChange,
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
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

  // History management callbacks
  const restoreFromHistory = useCallback((index: number) => {
    if (!context || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      context.drawImage(img, 0, 0);
      onHistoryChange(
        canvasRef.current!.toDataURL(),
        index > 0,
        index < history.length - 1
      );
    };
    img.src = history[index];
  }, [context, history, onHistoryChange]);

  const saveToHistory = useCallback(() => {
    if (!canvasRef.current) return;
    const data = canvasRef.current.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(data);
    setHistory(newHistory);
    const idx = newHistory.length - 1;
    setHistoryIndex(idx);
    onHistoryChange(data, idx > 0, idx < newHistory.length - 1);
  }, [history, historyIndex, onHistoryChange]);

  // Report pan/zoom changes
  useEffect(() => {
    onViewChange?.({ scale, offsetX: translate.x, offsetY: translate.y });
  }, [scale, translate.x, translate.y, onViewChange]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 3000;
    canvas.height = 3000;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setContext(ctx);

    const initial = canvas.toDataURL();
    setHistory([initial]);
    setHistoryIndex(0);
    onHistoryChange(initial, false, false);
  }, []);

  // Clear canvas action
  useEffect(() => {
    if (clearCanvas && context && canvasRef.current) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setClearCanvas(false);
      saveToHistory();
    }
  }, [clearCanvas, context, setClearCanvas, saveToHistory]);

  // Undo and redo
  useEffect(() => {
    if (undoAction && historyIndex > 0) {
      const newIndex = historyIndex - 1;
      restoreFromHistory(newIndex);
      setHistoryIndex(newIndex);
      setUndoAction(false);
    }
  }, [undoAction, historyIndex, restoreFromHistory, setUndoAction]);

  useEffect(() => {
    if (redoAction && historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      restoreFromHistory(newIndex);
      setHistoryIndex(newIndex);
      setRedoAction(false);
    }
  }, [redoAction, historyIndex, history.length, restoreFromHistory, setRedoAction]);

  // Zoom handler: center on cursor
  const handleZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!outerRef.current) return;
    const rect = outerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const delta = e.deltaY < 0 ? 1.1 : 0.9;

    setScale(prevScale => {
      const newScale = Math.max(0.2, Math.min(5, prevScale * delta));
      const factor = newScale / prevScale;
      setTranslate(prev => ({
        x: prev.x * factor + (1 - factor) * offsetX,
        y: prev.y * factor + (1 - factor) * offsetY,
      }));
      return newScale;
    });
  };

  // Pan handlers
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

  // Convert event to canvas-space
  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let cx: number, cy: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      cx = e.touches[0].clientX;
      cy = e.touches[0].clientY;
    } else {
      cx = e.clientX;
      cy = e.clientY;
    }
    return { x: (cx - rect.left) / scale, y: (cy - rect.top) / scale };
  };

  // Drawing handlers
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!context || isMirrored) return;
    if ('button' in e && e.button !== 0) return;
    const pt = getPoint(e);
    if (!pt) return;
    setIsDrawing(true);
    setLastPoint(pt);
    context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    context.strokeStyle = tool === 'pen' ? color : '#ffffff';
    context.lineWidth = brushSize;
    context.beginPath();
    context.arc(pt.x, pt.y, brushSize / 2, 0, Math.PI * 2);
    context.fill();
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !context || !lastPoint || isMirrored) return;
    const pt = getPoint(e);
    if (!pt) return;
    context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    context.strokeStyle = tool === 'pen' ? color : '#ffffff';
    context.lineWidth = brushSize;
    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(pt.x, pt.y);
    context.stroke();
    setLastPoint(pt);
  };
  const stopDraw = () => {
    if (!isDrawing || isMirrored) return;
    setIsDrawing(false);
    setLastPoint(null);
    saveToHistory();
  };

  // Touch pinch-zoom vs draw
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && outerRef.current) {
      /* pinch-zoom logic… */
    } else {
      draw(e);
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    stopDraw();
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
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
        }}
      >
        <canvas
          ref={canvasRef}
          className={`cursor-crosshair ${isMirrored ? 'scale-x-[-1]' : ''}`}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            touchAction: 'none',
            backgroundColor: 'white',
            border: '4px solid #ccc',
          }}
        />
      </div>
    </div>
  );
};

export default DrawingCanvas;
