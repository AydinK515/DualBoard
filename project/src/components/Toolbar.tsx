// src/components/Toolbar.tsx
import React, { useState } from 'react';
import {
  Pen,
  Eraser,
  Undo,
  Redo,
  RotateCcw,
  Download,
  Palette,
  Type,
  Fullscreen,
  Minimize2,
} from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

interface ToolbarProps {
  tool: 'pen' | 'eraser' | 'textbox';
  setTool: (tool: 'pen' | 'eraser' | 'textbox') => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  color: string;
  setColor: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isTutorFacing?: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  setTool,
  brushSize,
  setBrushSize,
  color,
  setColor,
  onUndo,
  onRedo,
  onClear,
  onExport,
  canUndo,
  canRedo,
  isTutorFacing = false,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [showCustom, setShowCustom] = useState(false);
  const presets = ['#000000', '#ff0000', '#0000ff'];

  return (
    <div
      className={`relative z-50 bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm ${
        isTutorFacing ? 'rotate-180' : ''
      }`}
    >
      {/* Left group: Pen/Eraser, Size, Color */}
      <div className="flex items-center space-x-4">
        {/* Pen / Eraser */}
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
                    <button
            onClick={() => setTool('textbox')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'textbox'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Text Box"
          >
            <Type size={20} />
          </button>
        </div>

        {/* Size Slider */}
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

        {/* Color Picker */}
        <div className="relative flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Color:</span>
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setColor(preset);
                setShowCustom(false);
              }}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                color === preset ? 'border-blue-500' : 'border-gray-300'
              }`}
              style={{ backgroundColor: preset }}
              title={preset}
            />
          ))}

          {/* Toggle custom wheel */}
          <button
            onClick={() => setShowCustom((v) => !v)}
            className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center transition-transform hover:scale-110"
            title="Custom Color"
          >
            <Palette size={16} />
          </button>

          {showCustom && (
            <div
              className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded shadow-lg z-50"
              style={{
                transform: isTutorFacing ? 'rotate(180deg)' : undefined,
              }}
            >
              <HexColorPicker color={color} onChange={setColor} />
            </div>
          )}
        </div>
      </div>

      {/* Tutor perspective notice */}
      {isTutorFacing && (
        <div className="absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 rotate-180">
          <span className="text-xs text-gray-500 whitespace-nowrap">
            Controls are flipped for tutor's perspective
          </span>
        </div>
      )}

      {/* Right group: Undo, Redo, Clear, Export, Fullscreen */}
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
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Fullscreen size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
