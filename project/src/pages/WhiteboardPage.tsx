import React, { useRef } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, CanvasRef } from '../components/Canvas';
import { Toolbar } from '../components/Toolbar';
import { RoleIndicator } from '../components/RoleIndicator';
import { FlipButton } from '../components/FlipButton';
import { useDrawing } from '../hooks/useDrawing';
import { useFullscreen } from '../hooks/useFullscreen';
import { useCanvasInteractions } from '../hooks/useCanvasInteractions';
import { exportCanvas } from '../utils/export';

export const WhiteboardPage: React.FC = () => {
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  
  const {
    drawingState,
    startDrawing,
    continueDrawing,
    endDrawing,
    setTool,
    setColor,
    setWidth,
    undo,
    redo,
    clearCanvas,
    flipRoles,
    setFullscreen,
  } = useDrawing();

  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { transform, setTransform } = useCanvasInteractions();

  const tutorCanvasRef = useRef<CanvasRef>(null);
  const studentCanvasRef = useRef<CanvasRef>(null);

  // Sync fullscreen state
  React.useEffect(() => {
    setFullscreen(isFullscreen);
  }, [isFullscreen, setFullscreen]);

  const handleExport = () => {
    const canvas = tutorCanvasRef.current?.getCanvas();
    if (canvas) {
      const timestamp = new Date().toISOString().split('T')[0];
      exportCanvas(canvas, `dualboard-${timestamp}`);
    }
  };

  // Calculate exact heights to prevent scrolling
  const headerHeight = drawingState.isFullscreen ? 0 : 73; // Approximate header height
  const footerHeight = drawingState.isFullscreen ? 0 : 49; // Approximate footer height
  const availableHeight = `calc(100vh - ${headerHeight + footerHeight}px)`;
  const canvasHeight = `calc((100vh - ${headerHeight + footerHeight}px) / 2)`;

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header - Hidden in fullscreen */}
      {!drawingState.isFullscreen && (
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img 
                src="/public/Dualboard logo.jpg" 
                alt="DualBoard Logo" 
                className="w-8 h-8 rounded-lg object-cover"
              />
              <h1 className="text-xl font-semibold text-gray-900">DualBoard</h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Face-to-Face Collaboration
              </span>
            </Link>
            
            <div className="text-sm text-gray-600">
              <span className="font-medium">Elements:</span> {drawingState.elements.length}
            </div>
          </div>
        </header>
      )}

      {/* Main Canvas Area - Takes remaining space */}
      <div className="flex flex-col" style={{ height: availableHeight }}>
        {/* Student Canvas (Top half) */}
        <div className="relative border-b border-gray-300" style={{ height: canvasHeight }}>
          <Canvas
            ref={studentCanvasRef}
            drawingState={drawingState}
            isRotated={true}
            disabled={drawingState.tutorAtBottom}
            transform={transform}
            onTransformChange={setTransform}
            onStartDrawing={drawingState.tutorAtBottom ? undefined : startDrawing}
            onContinueDrawing={drawingState.tutorAtBottom ? undefined : continueDrawing}
            onEndDrawing={drawingState.tutorAtBottom ? undefined : endDrawing}
          />
          
          <RoleIndicator 
            role={drawingState.tutorAtBottom ? 'viewer' : 'editor'}
            tutorAtBottom={drawingState.tutorAtBottom}
          />
          
          {!drawingState.tutorAtBottom && (
            <Toolbar
              drawingState={drawingState}
              isCollapsed={isToolbarCollapsed}
              onToggleCollapse={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
              onToolChange={setTool}
              onColorChange={setColor}
              onWidthChange={setWidth}
              onUndo={undo}
              onRedo={redo}
              onClear={clearCanvas}
              onExport={handleExport}
              onToggleFullscreen={toggleFullscreen}
              isRotated={true}
            />
          )}
        </div>

        {/* Tutor Canvas (Bottom half) */}
        <div className="relative" style={{ height: canvasHeight }}>
          <Canvas
            ref={tutorCanvasRef}
            drawingState={drawingState}
            isRotated={false}
            disabled={!drawingState.tutorAtBottom}
            transform={transform}
            onTransformChange={setTransform}
            onStartDrawing={drawingState.tutorAtBottom ? startDrawing : undefined}
            onContinueDrawing={drawingState.tutorAtBottom ? continueDrawing : undefined}
            onEndDrawing={drawingState.tutorAtBottom ? endDrawing : undefined}
          />
          
          <RoleIndicator 
            role={drawingState.tutorAtBottom ? 'editor' : 'viewer'}
            tutorAtBottom={drawingState.tutorAtBottom}
          />
          
          {drawingState.tutorAtBottom && (
            <Toolbar
              drawingState={drawingState}
              isCollapsed={isToolbarCollapsed}
              onToggleCollapse={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
              onToolChange={setTool}
              onColorChange={setColor}
              onWidthChange={setWidth}
              onUndo={undo}
              onRedo={redo}
              onClear={clearCanvas}
              onExport={handleExport}
              onToggleFullscreen={toggleFullscreen}
              isRotated={false}
            />
          )}
        </div>
      </div>

      {/* Centered Flip Button */}
      <FlipButton onFlipRoles={flipRoles} />

      {/* Footer - Hidden in fullscreen */}
      {!drawingState.isFullscreen && (
        <footer className="bg-white border-t border-gray-200 px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>Current Tool: <span className="font-medium capitalize">{drawingState.currentTool}</span></span>
              <span>Color: <span className="font-medium">{drawingState.currentColor}</span></span>
              <span>Width: <span className="font-medium">{drawingState.currentWidth}px</span></span>
            </div>
            <div className="flex items-center gap-4">
              <span>Grid: <span className="font-medium">{drawingState.showGrid ? 'On' : 'Off'}</span></span>
              <span>Editor Position: <span className="font-medium">{drawingState.tutorAtBottom ? 'Bottom' : 'Top'}</span></span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};