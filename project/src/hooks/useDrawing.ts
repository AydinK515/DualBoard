import { useState, useCallback, useRef } from 'react';
import { DrawingState, DrawingElement, DrawingStroke, DrawingShape, DrawingText, DrawingImage, Point } from '../types/drawing';

export const useDrawing = () => {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    elements: [],
    undoStack: [],
    redoStack: [],
    currentTool: 'pen',
    currentColor: '#000000',
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
          // For shapes, use proper geometric collision detection
          const shape = element as DrawingShape;
          
          if (shape.type === 'rectangle') {
            // Check if point is within rectangle bounds + eraser radius
            const minX = Math.min(shape.startPoint.x, shape.endPoint.x);
            const maxX = Math.max(shape.startPoint.x, shape.endPoint.x);
            const minY = Math.min(shape.startPoint.y, shape.endPoint.y);
            const maxY = Math.max(shape.startPoint.y, shape.endPoint.y);
            return !(point.x >= minX - eraseRadius && point.x <= maxX + eraseRadius &&
                     point.y >= minY - eraseRadius && point.y <= maxY + eraseRadius);
          }
          
          if (shape.type === 'ellipse') {
            // Check if point is within ellipse + eraser radius
            const centerX = (shape.startPoint.x + shape.endPoint.x) / 2;
            const centerY = (shape.startPoint.y + shape.endPoint.y) / 2;
            const radiusX = Math.abs(shape.endPoint.x - shape.startPoint.x) / 2;
            const radiusY = Math.abs(shape.endPoint.y - shape.startPoint.y) / 2;
            
            // Expand the ellipse by the eraser radius
            const expandedRadiusX = radiusX + eraseRadius;
            const expandedRadiusY = radiusY + eraseRadius;
            
            // Check if point is within the expanded ellipse
            const normalizedX = (point.x - centerX) / expandedRadiusX;
            const normalizedY = (point.y - centerY) / expandedRadiusY;
            const distanceSquared = normalizedX * normalizedX + normalizedY * normalizedY;
            
            return distanceSquared > 1; // Return true to keep (not erase), false to erase
          }
          
          if (shape.type === 'line' || shape.type === 'arrow') {
            // Check distance from point to line segment
            const lineLength = Math.sqrt(
              Math.pow(shape.endPoint.x - shape.startPoint.x, 2) + 
              Math.pow(shape.endPoint.y - shape.startPoint.y, 2)
            );
            
            if (lineLength === 0) {
              // Line is actually a point
              const distance = Math.sqrt(
                Math.pow(point.x - shape.startPoint.x, 2) + 
                Math.pow(point.y - shape.startPoint.y, 2)
              );
              return distance > eraseRadius;
            }
            
            // Calculate distance from point to line segment
            const t = Math.max(0, Math.min(1, 
              ((point.x - shape.startPoint.x) * (shape.endPoint.x - shape.startPoint.x) + 
               (point.y - shape.startPoint.y) * (shape.endPoint.y - shape.startPoint.y)) / 
              (lineLength * lineLength)
            ));
            
            const projectionX = shape.startPoint.x + t * (shape.endPoint.x - shape.startPoint.x);
            const projectionY = shape.startPoint.y + t * (shape.endPoint.y - shape.startPoint.y);
            
            const distance = Math.sqrt(
              Math.pow(point.x - projectionX, 2) + 
              Math.pow(point.y - projectionY, 2)
            );
            
            return distance > eraseRadius;
          }
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