import React, { useState, useRef, useEffect } from 'react';
import { 
  Pen, 
  Eraser, 
  Square, 
  Circle, 
  Minus, 
  ArrowRight, 
  Undo, 
  Redo,
  Trash2,
  Download,
  Maximize,
  Minimize,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { DrawingState } from '../types/drawing';

interface ToolbarProps {
  drawingState: DrawingState;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onToolChange: (tool: DrawingState['currentTool']) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  onToggleFullscreen: () => void;
  isRotated?: boolean;
}

const colors = [
  '#000000', // black
  '#dc2626', // red
  '#2563eb', // blue
];

export const Toolbar: React.FC<ToolbarProps> = ({
  drawingState,
  isCollapsed,
  onToggleCollapse,
  onToolChange,
  onColorChange,
  onWidthChange,
  onUndo,
  onRedo,
  onClear,
  onExport,
  onToggleFullscreen,
  isRotated = false,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close color picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (showColorPicker && 
          colorPickerRef.current && 
          colorButtonRef.current &&
          !colorPickerRef.current.contains(event.target as Node) &&
          !colorButtonRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showColorPicker]);

  // Calculate scale factor based on available space
  useEffect(() => {
    if (isCollapsed || !toolbarRef.current) {
      setScaleFactor(1);
      return;
    }

    const updateScale = () => {
      const toolbar = toolbarRef.current;
      if (!toolbar) return;

      // Get the canvas container (parent of toolbar)
      const canvasContainer = toolbar.closest('[style*="height"]') as HTMLElement;
      if (!canvasContainer) return;

      const containerHeight = canvasContainer.clientHeight;
      const toolbarHeight = toolbar.scrollHeight; // Natural height without scaling
      
      // Add some padding (40px top + 40px bottom = 80px total)
      const availableHeight = containerHeight - 80;
      
      if (toolbarHeight > availableHeight) {
        // Calculate scale factor needed to fit
        const newScale = Math.max(0.6, availableHeight / toolbarHeight); // Minimum scale of 0.6
        setScaleFactor(newScale);
      } else {
        setScaleFactor(1);
      }
    };

    // Update scale on mount and resize
    updateScale();
    window.addEventListener('resize', updateScale);
    
    // Use ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(updateScale);
    const canvasContainer = toolbarRef.current.closest('[style*="height"]') as HTMLElement;
    if (canvasContainer) {
      resizeObserver.observe(canvasContainer);
    }

    return () => {
      window.removeEventListener('resize', updateScale);
      resizeObserver.disconnect();
    };
  }, [isCollapsed]);
  const tools = [
    { id: 'pen', icon: Pen, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'ellipse', icon: Circle, label: 'Ellipse' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
  ] as const;

  // Determine positioning based on tutor position and collapse state
  const getToolbarPosition = () => {
    const baseClasses = 'absolute z-20 transition-all duration-300';
    
    if (drawingState.tutorAtBottom) {
      // Toolbar on right side
      if (isCollapsed) {
        return `${baseClasses} right-0 top-1/2 -translate-y-1/2 translate-x-full`;
      } else {
        return `${baseClasses} right-6 top-1/2 -translate-y-1/2`;
      }
    } else {
      // Toolbar on left side (rotated)
      if (isCollapsed) {
        return `${baseClasses} left-0 top-1/2 -translate-y-1/2 -translate-x-full rotate-180`;
      } else {
        return `${baseClasses} left-6 top-1/2 -translate-y-1/2 rotate-180`;
      }
    }
  };

  const getToggleButtonPosition = () => {
    const baseClasses = 'absolute z-30 transition-all duration-300';
    
    if (drawingState.tutorAtBottom) {
      // Arrow on left edge of toolbar (pointing toward center when collapsed)
      if (isCollapsed) {
        return `${baseClasses} right-0 top-1/2 -translate-y-1/2 -translate-x-1/2`;
      } else {
        return `${baseClasses} right-[120px] top-1/2 -translate-y-1/2`;
      }
    } else {
      // Arrow on right edge of toolbar (pointing toward center when collapsed, rotated)
      if (isCollapsed) {
        return `${baseClasses} left-0 top-1/2 -translate-y-1/2 translate-x-1/2`;
      } else {
        return `${baseClasses} left-[120px] top-1/2 -translate-y-1/2`;
      }
    }
  };

  const getArrowIcon = () => {
    // When tutor is at bottom (toolbar on right): normal arrow behavior
    // When tutor is at top (toolbar on left): flip the arrow directions
    if (drawingState.tutorAtBottom) {
      // Normal behavior: right arrow to collapse, left arrow to expand
      return isCollapsed ? ChevronLeft : ChevronRight;
    } else {
      // Flipped behavior: left arrow to collapse, right arrow to expand
      return isCollapsed ? ChevronRight : ChevronLeft;
    }
  };

  const ArrowIcon = getArrowIcon();

  // Calculate scaled dimensions
  const getScaledSize = (baseSize: number) => Math.round(baseSize * scaleFactor);
  const getScaledPadding = (basePadding: number) => Math.round(basePadding * scaleFactor);
  const getScaledGap = (baseGap: number) => Math.round(baseGap * scaleFactor);
  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className={`${getToggleButtonPosition()} bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg p-2 hover:bg-gray-50 transition-all duration-300 ${!drawingState.tutorAtBottom ? 'rotate-180' : ''}`}
        title={isCollapsed ? "Show Toolbar" : "Hide Toolbar"}
      >
        <ArrowIcon size={16} className={`text-gray-600 ${!drawingState.tutorAtBottom ? 'rotate-180' : ''}`} />
      </button>

      {/* Toolbar */}
      <div className={getToolbarPosition()}>
        <div 
          ref={toolbarRef}
          className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg origin-center transition-transform duration-300"
          style={{ 
            transform: `scale(${scaleFactor})`,
            padding: `${getScaledPadding(16)}px`
          }}
        >
          <div className="flex flex-col items-center w-20" style={{ gap: `${getScaledGap(12)}px` }}>
            {/* Tools - arranged in 2 columns */}
            <div className="flex flex-col items-center border-b border-gray-200" style={{ gap: `${getScaledGap(8)}px`, paddingBottom: `${getScaledGap(12)}px` }}>
              <div className="grid grid-cols-2 w-full" style={{ gap: `${getScaledGap(4)}px` }}>
                {tools.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => onToolChange(id as DrawingState['currentTool'])}
                    className={`rounded-lg transition-colors flex items-center justify-center ${
                      drawingState.currentTool === id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{ 
                      width: `${getScaledSize(36)}px`, 
                      height: `${getScaledSize(36)}px`,
                      padding: `${getScaledPadding(8)}px`
                    }}
                    title={label}
                  >
                    <Icon size={getScaledSize(16)} />
                  </button>
                ))}
              </div>
            </div>

            {/* Colors - 2x4 grid */}
            <div className="flex flex-col items-center border-b border-gray-200" style={{ gap: `${getScaledGap(8)}px`, paddingBottom: `${getScaledGap(12)}px` }}>
              <div className="grid grid-cols-2 w-full relative" style={{ gap: `${getScaledGap(4)}px` }}>
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onColorChange(color)}
                    className={`rounded-full border-2 transition-all ${
                      drawingState.currentColor === color
                        ? 'border-gray-800 scale-110'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                    style={{ 
                      backgroundColor: color,
                      width: `${getScaledSize(28)}px`,
                      height: `${getScaledSize(28)}px`
                    }}
                    title={`Color: ${color}`}
                  />
                ))}
                
                {/* Color Picker Button */}
                <div>
                  <button
                    ref={colorButtonRef}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className={`rounded-full border-2 transition-all flex items-center justify-center ${
                      showColorPicker
                        ? 'border-gray-800 scale-110'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                    style={{ 
                      background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`,
                      width: `${getScaledSize(28)}px`,
                      height: `${getScaledSize(28)}px`
                    }}
                    title="Custom Color Picker"
                  />
                </div>
              </div>
            </div>

            {/* Width - Slider */}
            <div className="flex flex-col items-center border-b border-gray-200" style={{ gap: `${getScaledGap(8)}px`, paddingBottom: `${getScaledGap(12)}px` }}>
              <div className="w-full" style={{ padding: `0 ${getScaledPadding(4)}px` }}>
                <div className="text-gray-500 text-center" style={{ fontSize: `${getScaledSize(12)}px`, marginBottom: `${getScaledGap(4)}px` }}>
                  {drawingState.currentWidth}px
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={drawingState.currentWidth}
                  onChange={(e) => onWidthChange(parseInt(e.target.value))}
                  className="w-full bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{ height: `${getScaledSize(8)}px` }}
                  title={`Width: ${drawingState.currentWidth}px`}
                />
                <style jsx>{`
                  .slider::-webkit-slider-thumb {
                    appearance: none;
                    height: ${getScaledSize(16)}px;
                    width: ${getScaledSize(16)}px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  }
                  .slider::-moz-range-thumb {
                    height: ${getScaledSize(16)}px;
                    width: ${getScaledSize(16)}px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  }
                `}</style>
              </div>
            </div>

            {/* Actions - 2 columns for most, single column for some */}
            <div className="flex flex-col items-center border-b border-gray-200" style={{ gap: `${getScaledGap(8)}px`, paddingBottom: `${getScaledGap(12)}px` }}>
              <div className="grid grid-cols-2 w-full" style={{ gap: `${getScaledGap(4)}px` }}>
                <button
                  onClick={onToggleFullscreen}
                  className="rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors flex items-center justify-center"
                  style={{ 
                    width: `${getScaledSize(36)}px`, 
                    height: `${getScaledSize(36)}px`,
                    padding: `${getScaledPadding(8)}px`
                  }}
                  title={drawingState.isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {drawingState.isFullscreen ? <Minimize size={getScaledSize(16)} /> : <Maximize size={getScaledSize(16)} />}
                </button>

                <button
                  onClick={onExport}
                  className="rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors flex items-center justify-center"
                  style={{ 
                    width: `${getScaledSize(36)}px`, 
                    height: `${getScaledSize(36)}px`,
                    padding: `${getScaledPadding(8)}px`
                  }}
                  title="Export Canvas"
                >
                  <Download size={getScaledSize(16)} />
                </button>
              </div>
            </div>

            {/* Undo/Redo/Clear Section */}
            <div className="flex flex-col items-center" style={{ gap: `${getScaledGap(8)}px` }}>
              <div className="grid grid-cols-2 w-full" style={{ gap: `${getScaledGap(4)}px` }}>
                <button
                  onClick={onUndo}
                  disabled={drawingState.undoStack.length === 0}
                  className={`rounded-lg transition-colors flex items-center justify-center ${
                    drawingState.undoStack.length === 0
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ 
                    width: `${getScaledSize(36)}px`, 
                    height: `${getScaledSize(36)}px`,
                    padding: `${getScaledPadding(8)}px`
                  }}
                  title="Undo"
                >
                  <Undo size={getScaledSize(16)} />
                </button>

                <button
                  onClick={onRedo}
                  disabled={drawingState.redoStack.length === 0}
                  className={`rounded-lg transition-colors flex items-center justify-center ${
                    drawingState.redoStack.length === 0
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ 
                    width: `${getScaledSize(36)}px`, 
                    height: `${getScaledSize(36)}px`,
                    padding: `${getScaledPadding(8)}px`
                  }}
                  title="Redo"
                >
                  <Redo size={getScaledSize(16)} />
                </button>
              </div>

              <button
                onClick={onClear}
                className="rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center justify-center"
                style={{ 
                  width: `${getScaledSize(36)}px`, 
                  height: `${getScaledSize(36)}px`,
                  padding: `${getScaledPadding(8)}px`
                }}
                title="Clear Canvas"
              >
                <Trash2 size={getScaledSize(16)} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Color Picker - Positioned completely outside toolbar */}
      {showColorPicker && (
        <div className={`fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 ${
          drawingState.tutorAtBottom 
            ? 'right-[140px] top-1/2 -translate-y-full translate-y-[-255px]' // To the left of toolbar, 255px higher
            : 'left-[140px] top-1/2 translate-y-[30px]' // To the right of toolbar, 30px lower
        }`}
        ref={colorPickerRef}>
          <HexColorPicker 
            color={drawingState.currentColor} 
            onChange={onColorChange}
          />
        </div>
      )}
    </>
  );
};