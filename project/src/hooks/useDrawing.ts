import { useState, useCallback, useRef } from 'react';
import { DrawingState, DrawingElement, DrawingStroke, DrawingShape, DrawingText, DrawingImage, Point } from '../types/drawing';

export const useDrawing = () => {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    elements: [],
    undoStack: [],
    redoStack: [],
    currentTool: 'pen',
    currentColor: '#2563eb',
    currentWidth: 3,
    showGrid: true,
    tutorAtBottom: true,
    isFullscreen: false,
  });

  const currentStrokeRef = useRef<DrawingStroke | null>(null);
  const currentShapeRef = useRef<DrawingShape | null>(null);
  const isDrawingRef = useRef(false);

  const addElement = useCallback((element: DrawingElement) => {
    setDrawingState(prev => ({
      ...prev,
      elements: [...prev.elements, element],
    }));
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<DrawingElement>) => {
    setDrawingState(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  }, []);

  const removeElement = useCallback((id: string) => {
    setDrawingState(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id),
    }));
  }, []);

  const saveToUndoStack = useCallback(() => {
    setDrawingState(prev => ({
      ...prev,
      undoStack: [...prev.undoStack, prev.elements],
      redoStack: [],
    }));
  }, []);
  const eraseAtPoint = useCallback((point: Point, eraseRadius: number = 20) => {
    setDrawingState(prev => ({
      ...prev,
      elements: prev.elements.filter(element => {
        if ('points' in element && element.points) {
          // For strokes, check if any point is within erase radius
          return !element.points.some(p => {
            const distance = Math.sqrt(Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2));
            return distance <= eraseRadius;
          });
        }
        if ('startPoint' in element && 'endPoint' in element) {
          // For shapes, check if point is within bounding box
          const minX = Math.min(element.startPoint.x, element.endPoint.x);
          const maxX = Math.max(element.startPoint.x, element.endPoint.x);
          const minY = Math.min(element.startPoint.y, element.endPoint.y);
          const maxY = Math.max(element.startPoint.y, element.endPoint.y);
          return !(point.x >= minX - eraseRadius && point.x <= maxX + eraseRadius &&
                   point.y >= minY - eraseRadius && point.y <= maxY + eraseRadius);
        }
        if ('position' in element) {
          // For text and images, check distance from position
          const distance = Math.sqrt(Math.pow(element.position.x - point.x, 2) + Math.pow(element.position.y - point.y, 2));
          return distance > eraseRadius;
        }
        return true;
      }),
    }));
  }, []);

  const startDrawing = useCallback((point: Point) => {
    isDrawingRef.current = true;
    
    // Save state before any drawing operation
    saveToUndoStack();

    if (drawingState.currentTool === 'pen') {
      const newStroke: DrawingStroke = {
        id: `stroke-${Date.now()}-${Math.random()}`,
        tool: 'pen',
        points: [point],
        color: drawingState.currentColor,
        width: drawingState.currentWidth,
        isComplete: false,
      };
      currentStrokeRef.current = newStroke;
      addElement(newStroke);
    } else if (drawingState.currentTool === 'eraser') {
      eraseAtPoint(point);
    } else if (['rectangle', 'ellipse', 'line', 'arrow'].includes(drawingState.currentTool)) {
      const newShape: DrawingShape = {
        id: `shape-${Date.now()}-${Math.random()}`,
        type: drawingState.currentTool as DrawingShape['type'],
        startPoint: point,
        endPoint: point,
        color: drawingState.currentColor,
        width: drawingState.currentWidth,
        isComplete: false,
      };
      currentShapeRef.current = newShape;
      addElement(newShape);
    }
  }, [drawingState.currentTool, drawingState.currentColor, drawingState.currentWidth, addElement, eraseAtPoint, saveToUndoStack]);

  const continueDrawing = useCallback((point: Point) => {
    if (!isDrawingRef.current) return;

    if (drawingState.currentTool === 'pen' && currentStrokeRef.current) {
      const updatedPoints = [...currentStrokeRef.current.points, point];
      currentStrokeRef.current = { ...currentStrokeRef.current, points: updatedPoints };
      updateElement(currentStrokeRef.current.id, { points: updatedPoints });
    } else if (drawingState.currentTool === 'eraser') {
      eraseAtPoint(point);
    } else if (['rectangle', 'ellipse', 'line', 'arrow'].includes(drawingState.currentTool) && currentShapeRef.current) {
      currentShapeRef.current = { ...currentShapeRef.current, endPoint: point };
      updateElement(currentShapeRef.current.id, { endPoint: point });
    }
  }, [drawingState.currentTool, updateElement, eraseAtPoint]);

  const endDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;

    if (currentStrokeRef.current) {
      updateElement(currentStrokeRef.current.id, { isComplete: true });
      currentStrokeRef.current = null;
    }

    if (currentShapeRef.current) {
      updateElement(currentShapeRef.current.id, { isComplete: true });
      currentShapeRef.current = null;
    }

    isDrawingRef.current = false;
  }, [updateElement]);

  const addText = useCallback((text: DrawingText) => {
    saveToUndoStack();
    addElement(text);
  }, [addElement, saveToUndoStack]);

  const addImage = useCallback((image: DrawingImage) => {
    saveToUndoStack();
    addElement(image);
  }, [addElement, saveToUndoStack]);

  const handleImageUpload = useCallback(async (file: File) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      return new Promise<void>((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(url);
          
          const newImage: DrawingImage = {
            id: `image-${Date.now()}-${Math.random()}`,
            src: img.src,
            position: { x: 50, y: 50 },
            width: Math.min(img.width, 400),
            height: Math.min(img.height, 300),
          };
          
          addImage(newImage);
          resolve();
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load image'));
        };
        
        img.src = url;
      });
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  }, [addImage]);

  const clearCanvas = useCallback(() => {
    saveToUndoStack();
    setDrawingState(prev => ({ 
      ...prev, 
      elements: []
    }));
  }, [saveToUndoStack]);

  const undo = useCallback(() => {
    setDrawingState(prev => {
      if (prev.undoStack.length === 0) return prev;
      
      const previousState = prev.undoStack[prev.undoStack.length - 1];
      const newUndoStack = prev.undoStack.slice(0, -1);
      const newRedoStack = [...prev.redoStack, prev.elements];
      
      return {
        ...prev,
        elements: previousState,
        undoStack: newUndoStack,
        redoStack: newRedoStack,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setDrawingState(prev => {
      if (prev.redoStack.length === 0) return prev;
      
      const nextState = prev.redoStack[prev.redoStack.length - 1];
      const newRedoStack = prev.redoStack.slice(0, -1);
      const newUndoStack = [...prev.undoStack, prev.elements];
      
      return {
        ...prev,
        elements: nextState,
        undoStack: newUndoStack,
        redoStack: newRedoStack,
      };
    });
  }, []);

  const setTool = useCallback((tool: DrawingState['currentTool']) => {
    setDrawingState(prev => ({ ...prev, currentTool: tool }));
  }, []);

  const setColor = useCallback((color: string) => {
    setDrawingState(prev => ({ ...prev, currentColor: color }));
  }, []);

  const setWidth = useCallback((width: number) => {
    setDrawingState(prev => ({ ...prev, currentWidth: width }));
  }, []);

  const toggleGrid = useCallback(() => {
    setDrawingState(prev => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);

  const flipRoles = useCallback(() => {
    setDrawingState(prev => ({ ...prev, tutorAtBottom: !prev.tutorAtBottom }));
  }, []);

  const setFullscreen = useCallback((isFullscreen: boolean) => {
    setDrawingState(prev => ({ ...prev, isFullscreen }));
  }, []);

  return {
    drawingState,
    startDrawing,
    continueDrawing,
    endDrawing,
    addText,
    addImage,
    handleImageUpload,
    clearCanvas,
    undo,
    redo,
    setTool,
    setColor,
    setWidth,
    toggleGrid,
    flipRoles,
    setFullscreen,
    isDrawing: isDrawingRef.current,
  };
};