import React from 'react';
import { Pen, Eraser, Undo, Redo, RotateCcw, Download } from 'lucide-react';

interface ToolbarProps {
  tool: 'pen' | 'eraser';
  setTool: (tool: 'pen' | 'eraser') => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isTutorFacing?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  setTool,
  brushSize,
  setBrushSize,
  onUndo,
  onRedo,
  onClear,
  onExport,
  canUndo,
  canRedo,
  isTutorFacing = false,
}) => {
  return (
    <div className={`bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm ${
      isTutorFacing ? 'rotate-180' : ''
    }`}>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'pen'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Pen"
          >
            <Pen size={20} />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'eraser'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Eraser"
          >
            <Eraser size={20} />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Size:</span>
          <input
            type="range"
            min="1"
            max="30"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-32 h-4 cursor-pointer accent-blue-500"
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              height: '6px',
              borderRadius: '4px',
              backgroundColor: '#e5e7eb',
              outline: 'none',
            }}
          />
          <span className="text-sm text-gray-600 w-8">{brushSize}</span>
        </div>
      </div>

      {isTutorFacing && (
        <div className="absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 rotate-180">
          <span className="text-xs text-gray-500 whitespace-nowrap">
            Controls are flipped for tutor's perspective
          </span>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded-lg transition-colors ${
            canUndo
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
          title="Undo"
        >
          <Undo size={20} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-2 rounded-lg transition-colors ${
            canRedo
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
          title="Redo"
        >
          <Redo size={20} />
        </button>
        <button
          onClick={onClear}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          title="Clear canvas"
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={onExport}
          className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
          title="Export as PNG"
        >
          <Download size={20} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
