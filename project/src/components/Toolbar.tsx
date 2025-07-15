import React, { useState } from 'react';
import { 
  Pen, 
  Eraser, 
  Square, 
  Circle, 
  Minus, 
  ArrowRight, 
  Type, 
  Grid3X3, 
  Undo, 
  Trash2,
  RotateCcw,
  Download,
  Upload,
  Maximize,
  Minimize,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { DrawingState } from '../types/drawing';

interface ToolbarProps {
  drawingState: DrawingState;
  onToolChange: (tool: DrawingState['currentTool']) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onToggleGrid: () => void;
  onUndo: () => void;
  onClear: () => void;
  onFlipRoles: () => void;
  onExport: () => void;
  onImageUpload: (file: File) => void;
  onToggleFullscreen: () => void;
  isRotated?: boolean;
}

const colors = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#ea580c', // orange
  '#9333ea', // purple
  '#0891b2', // cyan
  '#000000', // black
  '#6b7280', // gray
];

const widths = [1, 2, 3, 5, 8, 12];

export const Toolbar: React.FC<ToolbarProps> = ({
  drawingState,
  onToolChange,
  onColorChange,
  onWidthChange,
  onToggleGrid,
  onUndo,
  onClear,
  onExport,
  onImageUpload,
  onToggleFullscreen,
  isRotated = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tools = [
    { id: 'pen', icon: Pen, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'ellipse', icon: Circle, label: 'Ellipse' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
    { id: 'text', icon: Type, label: 'Text' },
  ] as const;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
    // Reset input value to allow uploading the same file again
    e.target.value = '';
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Determine positioning based on tutor position and collapse state
  const getToolbarPosition = () => {
    const baseClasses = 'fixed z-20 transition-all duration-300';
    
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
    const baseClasses = 'fixed z-30 transition-all duration-300';
    
    if (drawingState.tutorAtBottom) {
      // Arrow on left edge of toolbar (pointing toward center when collapsed)
      if (isCollapsed) {
        return `${baseClasses} right-0 top-1/2 -translate-y-1/2 -translate-x-1/2`;
      } else {
        return `${baseClasses} right-[120px] top-1/2 -translate-y-1/2`; // 120px = toolbar width + gap
      }
    } else {
      // Arrow on right edge of toolbar (pointing toward center when collapsed, rotated)
      if (isCollapsed) {
        return `${baseClasses} left-0 top-1/2 -translate-y-1/2 translate-x-1/2`;
      } else {
        return `${baseClasses} left-[120px] top-1/2 -translate-y-1/2`; // 120px = toolbar width + gap
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

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleCollapse}
        className={`${getToggleButtonPosition()} bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg p-2 hover:bg-gray-50 transition-all duration-300 ${!drawingState.tutorAtBottom ? 'rotate-180' : ''}`}
        title={isCollapsed ? "Show Toolbar" : "Hide Toolbar"}
      >
        <ArrowIcon size={16} className={`text-gray-600 ${!drawingState.tutorAtBottom ? 'rotate-180' : ''}`} />
      </button>

      {/* Toolbar */}
      <div className={getToolbarPosition()}>
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-4">
          <div className="flex flex-col items-center gap-3 w-20">
            {/* Tools - arranged in 2 columns */}
            <div className="flex flex-col items-center gap-2 border-b border-gray-200 pb-3">
              <div className="grid grid-cols-2 gap-1 w-full">
                {tools.slice(0, 6).map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => onToolChange(id as DrawingState['currentTool'])}
                    className={`p-2 rounded-lg transition-colors w-9 h-9 flex items-center justify-center ${
                      drawingState.currentTool === id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={label}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
              {/* Text tool on its own row */}
              {tools.slice(6).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => onToolChange(id as DrawingState['currentTool'])}
                  className={`p-2 rounded-lg transition-colors w-9 h-9 flex items-center justify-center ${
                    drawingState.currentTool === id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={label}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>

            {/* Colors - 2x4 grid */}
            <div className="flex flex-col items-center gap-2 border-b border-gray-200 pb-3">
              <div className="grid grid-cols-2 gap-1 w-full">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onColorChange(color)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      drawingState.currentColor === color
                        ? 'border-gray-800 scale-110'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                    style={{ backgroundColor: color }}
                    title={`Color: ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Width - 2x3 grid */}
            <div className="flex flex-col items-center gap-2 border-b border-gray-200 pb-3">
              <div className="grid grid-cols-2 gap-1 w-full">
                {widths.map((width) => (
                  <button
                    key={width}
                    onClick={() => onWidthChange(width)}
                    className={`p-2 rounded-lg transition-colors w-9 h-9 flex items-center justify-center ${
                      drawingState.currentWidth === width
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={`Width: ${width}px`}
                  >
                    <div
                      className="rounded-full bg-current"
                      style={{ width: `${Math.max(width, 4)}px`, height: `${Math.max(width, 4)}px` }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Actions - 2 columns for most, single column for some */}
            <div className="flex flex-col items-center gap-2">
              <div className="grid grid-cols-2 gap-1 w-full">
                <button
                  onClick={onToggleGrid}
                  className={`p-2 rounded-lg transition-colors w-9 h-9 flex items-center justify-center ${
                    drawingState.showGrid
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Toggle Grid"
                >
                  <Grid3X3 size={16} />
                </button>

                <button
                  onClick={onUndo}
                  className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors w-9 h-9 flex items-center justify-center"
                  title="Undo"
                >
                  <Undo size={16} />
                </button>

                <button
                  onClick={onClear}
                  className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors w-9 h-9 flex items-center justify-center"
                  title="Clear Canvas"
                >
                  <Trash2 size={16} />
                </button>

                <label className="p-2 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors cursor-pointer w-9 h-9 flex items-center justify-center" title="Upload Image">
                  <Upload size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={onExport}
                  className="p-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors w-9 h-9 flex items-center justify-center"
                  title="Export Canvas"
                >
                  <Download size={16} />
                </button>

                <button
                  onClick={onToggleFullscreen}
                  className="p-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors w-9 h-9 flex items-center justify-center"
                  title={drawingState.isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {drawingState.isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};