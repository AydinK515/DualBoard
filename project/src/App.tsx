import React, { useState, useRef } from 'react';
import DrawingCanvas from './components/DrawingCanvas';
import MirrorCanvas from './components/MirrorCanvas';
import Toolbar from './components/Toolbar';
import ResizeHandle from './components/ResizeHandle';

function App() {
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [brushSize, setBrushSize] = useState(3);
  const [canvasData, setCanvasData] = useState<string>('');
  const [clearCanvas, setClearCanvas] = useState(false);
  const [undoAction, setUndoAction] = useState(false);
  const [redoAction, setRedoAction] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [tutorViewHeight, setTutorViewHeight] = useState(400); // pixels
  const [studentViewHeight, setStudentViewHeight] = useState(400); // pixels
  const [isResizing, setIsResizing] = useState<'tutor' | 'student' | null>(null);

  const handleHistoryChange = (data: string, canUndoState: boolean, canRedoState: boolean) => {
    setCanvasData(data);
    setCanUndo(canUndoState);
    setCanRedo(canRedoState);
  };

  const handleUndo = () => {
    setUndoAction(true);
  };

  const handleRedo = () => {
    setRedoAction(true);
  };

  const handleClear = () => {
    setClearCanvas(true);
  };

  const handleExport = () => {
    if (!canvasData) return;
    
    const link = document.createElement('a');
    link.download = `mirrorboard-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvasData;
    link.click();
  };

  const handleTutorResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing('tutor');
    const startY = e.clientY;
    const startHeight = tutorViewHeight;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(200, startHeight + deltaY);
      setTutorViewHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleStudentResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing('student');
    const startY = e.clientY;
    const startHeight = studentViewHeight;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(200, startHeight + deltaY);
      setStudentViewHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MirrorBoard</h1>
            <p className="text-sm text-gray-600">
              Split-screen whiteboard for face-to-face tutoring
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Tutor View</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Student View</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        tool={tool}
        setTool={setTool}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onExport={handleExport}
        canUndo={canUndo}
        canRedo={canRedo}
        isTutorFacing={true}
      />

      {/* Main Drawing Area */}
      <div className="flex flex-col">
        {/* Drawing Canvas */}
        <div 
          className="relative"
          style={{ height: `${tutorViewHeight}px` }}
        >
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 rotate-180">
            <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Tutor View</span>
              </div>
            </div>
          </div>
          <div className="h-full p-4">
            <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <DrawingCanvas
                isDrawing={isDrawing}
                setIsDrawing={setIsDrawing}
                tool={tool}
                brushSize={brushSize}
                onHistoryChange={handleHistoryChange}
                clearCanvas={clearCanvas}
                setClearCanvas={setClearCanvas}
                undoAction={undoAction}
                setUndoAction={setUndoAction}
                redoAction={redoAction}
                setRedoAction={setRedoAction}
              />
            </div>
          </div>
        </div>

        {/* Tutor Resize Handle */}
        <ResizeHandle
          onMouseDown={handleTutorResizeStart}
          position="bottom"
          label="Drag to resize tutor view"
          isTutorHandle={true}
        />

        {/* Mirror Canvas */}
        <div 
          className="relative"
          style={{ height: `${studentViewHeight}px` }}
        >
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Student View</span>
              </div>
            </div>
          </div>
          <div className="h-full p-4">
            <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <MirrorCanvas sourceData={canvasData} />
            </div>
          </div>
        </div>
        
        {/* Student Resize Handle */}
        <ResizeHandle
          onMouseDown={handleStudentResizeStart}
          position="bottom"
          label="Drag to resize student view"
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Tutor draws on top, student sees rotated version on bottom
          </div>
          <div className="text-sm text-gray-500">
            Works with touch, stylus, or mouse
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;