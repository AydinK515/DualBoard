// src/components/DrawingCanvas.tsx
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';

interface TextBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  color: string;
  isEditing: boolean;
}

interface DrawingCanvasProps {
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  tool: 'pen' | 'eraser' | 'textbox';
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
  const transformRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedTextBox, setSelectedTextBox] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState<{
    textBoxId: string;
    corner: 'se';
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startFontSize: number;
  } | null>(null);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);

  // History management callbacks
  const restoreFromHistory = useCallback((index: number) => {
    if (!context || !canvasRef.current) return;
    
    try {
      const stateData = JSON.parse(history[index]);
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
      img.src = stateData.canvas;
      setTextBoxes(stateData.textBoxes || []);
    } catch (e) {
      // Handle old history format (just canvas data)
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
      setTextBoxes([]);
    }
  }, [context, history, onHistoryChange]);

  const saveToHistory = useCallback(() => {
    if (!canvasRef.current) return;
    const canvasData = canvasRef.current.toDataURL();
    const stateData = {
      canvas: canvasData,
      textBoxes: textBoxes
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(stateData));
    setHistory(newHistory);
    const idx = newHistory.length - 1;
    setHistoryIndex(idx);
    onHistoryChange(canvasData, idx > 0, idx < newHistory.length - 1);
  }, [history, historyIndex, onHistoryChange, textBoxes])

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

    const initialCanvasData = canvas.toDataURL();
    const initialState = {
      canvas: initialCanvasData,
      textBoxes: []
    };
    setHistory([JSON.stringify(initialState)]);
    setHistoryIndex(0);
    onHistoryChange(initialCanvasData, false, false);
  }, []);

  // Clear canvas action
  useEffect(() => {
    if (clearCanvas && context && canvasRef.current) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setTextBoxes([]);
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

  const createTextBox = (x: number, y: number) => {
    const newTextBox: TextBox = {
      id: Date.now().toString(),
      x,
      y,
      width: 200,
      height: 40,
      text: '',
      fontSize: 16,
      color,
      isEditing: true,
    };
    setTextBoxes(prev => [...prev, newTextBox]);
    setSelectedTextBox(newTextBox.id);
    // Save to history after a brief delay to allow state to update
    setTimeout(() => saveToHistory(), 10);
  };

  const deleteTextBox = (id: string) => {
    setTextBoxes(prev => prev.filter(tb => tb.id !== id));
    setSelectedTextBox(null);
    setTimeout(() => saveToHistory(), 10);
  };

  const saveTextBoxHistory = useCallback(() => {
    saveToHistory();
  }, [saveToHistory]);

  // Fixed zoom handler
  const handleZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!outerRef.current) return;
    
    const containerRect = outerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.1, Math.min(10, scale * delta));
    
    // Calculate the point in canvas space that should remain fixed
    const canvasPointX = (mouseX - translate.x) / scale;
    const canvasPointY = (mouseY - translate.y) / scale;
    
    // Calculate new translate to keep that canvas point under the mouse
    const newTranslateX = mouseX - canvasPointX * newScale;
    const newTranslateY = mouseY - canvasPointY * newScale;
    
    setScale(newScale);
    setTranslate({ x: newTranslateX, y: newTranslateY });
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

  // Convert event to canvas-space coordinates
  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    if (!outerRef.current) return null;
    
    const containerRect = outerRef.current.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Convert screen coordinates to canvas coordinates
    const mouseX = clientX - containerRect.left;
    const mouseY = clientY - containerRect.top;
    
    // Transform to canvas space
    const x = (mouseX - translate.x) / scale;
    const y = (mouseY - translate.y) / scale;
    
    return { x, y };
  };

  // Touch pinch-zoom implementation
  const handleTouchStart = (e: React.TouchEvent) => {
    setSelectedTextBox(null);
    
    if (e.touches.length === 2) {
      // Start pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      lastTouchDistance.current = distance;
    } else {
      // Start drawing
      startDraw(e);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && outerRef.current) {
      e.preventDefault();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (lastTouchDistance.current) {
        const delta = distance / lastTouchDistance.current;
        
        // Get center point of the pinch
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        
        const containerRect = outerRef.current.getBoundingClientRect();
        const mouseX = centerX - containerRect.left;
        const mouseY = centerY - containerRect.top;
        
        const newScale = Math.max(0.1, Math.min(10, scale * delta));
        
        // Calculate the point in canvas space that should remain fixed
        const canvasPointX = (mouseX - translate.x) / scale;
        const canvasPointY = (mouseY - translate.y) / scale;
        
        // Calculate new translate to keep that canvas point under the touch center
        const newTranslateX = mouseX - canvasPointX * newScale;
        const newTranslateY = mouseY - canvasPointY * newScale;
        
        setScale(newScale);
        setTranslate({ x: newTranslateX, y: newTranslateY });
      }
      
      lastTouchDistance.current = distance;
    } else {
      draw(e);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    stopDraw();
    if (e.touches.length < 2) {
      lastTouchDistance.current = null;
    }
  };

  // Drawing handlers
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!context || isMirrored) return;
    if ('button' in e && e.button !== 0) return;
    const pt = getPoint(e);
    if (!pt) return;
    
    if (tool === 'textbox') {
      createTextBox(pt.x, pt.y);
      return;
    }
    
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

  // Resize handlers
  const startResize = (e: React.MouseEvent, textBoxId: string) => {
    e.stopPropagation();
    const textBox = textBoxes.find(tb => tb.id === textBoxId);
    if (!textBox) return;
    
    setIsResizing({
      textBoxId,
      corner: 'se',
      startX: e.clientX,
      startY: e.clientY,
      startWidth: textBox.width,
      startHeight: textBox.height,
      startFontSize: textBox.fontSize,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const dx = e.clientX - isResizing.startX;
        const dy = e.clientY - isResizing.startY;
        
        const newWidth = Math.max(100, isResizing.startWidth + dx / scale);
        const newHeight = Math.max(30, isResizing.startHeight + dy / scale);
        
        const heightRatio = newHeight / isResizing.startHeight;
        const newFontSize = Math.max(8, Math.min(72, isResizing.startFontSize * heightRatio));
        
        setTextBoxes(prev =>
          prev.map(tb =>
            tb.id === isResizing.textBoxId
              ? {
                  ...tb,
                  width: newWidth,
                  height: newHeight,
                  fontSize: newFontSize,
                }
              : tb
          )
        );
      } else if (selectedTextBox && dragOffset.x !== 0 && dragOffset.y !== 0) {
        if (!outerRef.current) return;
        const containerRect = outerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;
        
        const x = (mouseX - dragOffset.x - translate.x) / scale;
        const y = (mouseY - dragOffset.y - translate.y) / scale;
        
        setTextBoxes(prev =>
          prev.map(tb =>
            tb.id === selectedTextBox ? { ...tb, x, y } : tb
          )
        );
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(null);
        setTimeout(() => saveTextBoxHistory(), 10);
      } else if (selectedTextBox && (dragOffset.x !== 0 || dragOffset.y !== 0)) {
        setTimeout(() => saveTextBoxHistory(), 10);
      }
      setDragOffset({ x: 0, y: 0 });
    };

    if (isResizing || selectedTextBox) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, selectedTextBox, dragOffset, scale, translate, saveTextBoxHistory]);

  return (
    <div
      ref={outerRef}
      onWheel={handleZoom}
      onMouseDown={(e) => {
        if (e.target === outerRef.current) {
          setSelectedTextBox(null);
        }
        startPan(e);
      }}
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
          className={`cursor-crosshair ${isMirrored ? 'scale-x-[-1]' : ''}`}
          onMouseDown={(e) => {
            setSelectedTextBox(null);
            startDraw(e);
          }}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            touchAction: 'none',
            backgroundColor: 'white',
            border: '4px solid #ccc',
          }}
        />
        
        {/* Text boxes */}
        {textBoxes.map((textBox) => (
          <div
            key={textBox.id}
            className={`absolute ${
              selectedTextBox === textBox.id 
                ? 'border-2 border-blue-500 bg-white bg-opacity-90' 
                : 'border-0 bg-transparent'
            }`}
            style={{
              left: textBox.x,
              top: textBox.y,
              width: textBox.width,
              height: textBox.height,
              fontSize: textBox.fontSize,
              color: textBox.color,
              overflow: 'visible',
              minWidth: '100px',
              minHeight: '30px',
              cursor: selectedTextBox === textBox.id && !textBox.isEditing ? 'move' : 'default',
            }}
            onMouseDown={(e) => {
              if (textBox.isEditing) return;
              e.stopPropagation();
              setSelectedTextBox(textBox.id);
              const rect = e.currentTarget.getBoundingClientRect();
              if (!outerRef.current) return;
              const containerRect = outerRef.current.getBoundingClientRect();
              setDragOffset({
                x: (e.clientX - containerRect.left - translate.x) / scale - textBox.x,
                y: (e.clientY - containerRect.top - translate.y) / scale - textBox.y,
              });
            }}
            onDoubleClick={() => {
              setTextBoxes(prev =>
                prev.map(tb =>
                  tb.id === textBox.id ? { ...tb, isEditing: true } : tb
                )
              );
            }}
          >
            {textBox.isEditing ? (
              <textarea
                className="w-full h-full border-0 resize-none outline-none bg-transparent p-1"
                value={textBox.text}
                placeholder="Type here..."
                onChange={(e) => {
                  setTextBoxes(prev =>
                    prev.map(tb =>
                      tb.id === textBox.id ? { ...tb, text: e.target.value } : tb
                    )
                  );
                }}
                onBlur={() => {
                  setTextBoxes(prev =>
                    prev.map(tb =>
                      tb.id === textBox.id ? { ...tb, isEditing: false } : tb
                    )
                  );
                  setTimeout(() => saveTextBoxHistory(), 10);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    setTextBoxes(prev =>
                      prev.map(tb =>
                        tb.id === textBox.id ? { ...tb, isEditing: false } : tb
                      )
                    );
                    setTimeout(() => saveTextBoxHistory(), 10);
                  }
                }}
                autoFocus
                style={{ fontSize: textBox.fontSize, color: textBox.color }}
              />
            ) : (
              <div
                className="w-full h-full p-1 whitespace-pre-wrap"
                style={{ fontSize: textBox.fontSize, color: textBox.color }}
              >
                {textBox.text || <span style={{ color: '#999', fontStyle: 'italic' }}>Type here...</span>}
              </div>
            )}
            
            {/* Delete button - only show when selected */}
            {selectedTextBox === textBox.id && (
              <button
                className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTextBox(textBox.id);
                }}
                title="Delete textbox"
                style={{ fontSize: '20px' }}
              >
                <span style={{ transform: 'translateY(-1px)' }}>×</span>
              </button>
            )}
            
            {/* Resize handle - only show when selected and not editing */}
            {selectedTextBox === textBox.id && !textBox.isEditing && (
              <div
                className="absolute w-4 h-4 flex items-center justify-center cursor-se-resize hover:bg-blue-100 transition-colors"
                style={{ right: -2, bottom: -2 }}
                onMouseDown={(e) => startResize(e, textBox.id)}
                title="Resize"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-blue-500">
                  <path d="M8 2L10 2L10 4M10 8L10 10L8 10M4 10L2 10L2 8M2 4L2 2L4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 6L10 2M6 6L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DrawingCanvas;