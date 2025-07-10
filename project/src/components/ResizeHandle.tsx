import React from 'react';
import { GripHorizontal } from 'lucide-react';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  position: 'top' | 'bottom';
  label: string;
  isTutorHandle?: boolean;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ onMouseDown, position, label, isTutorHandle = false }) => {
  return (
    <div
      className={`
        relative z-20 bg-gray-100 border-gray-300 hover:bg-gray-200 transition-colors cursor-ns-resize
        ${position === 'top' ? 'border-b' : 'border-t'}
      `}
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center justify-center py-2">
        <div className={`flex items-center space-x-2 ${isTutorHandle ? 'rotate-180' : ''}`}>
          <GripHorizontal size={16} className="text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">{label}</span>
          <GripHorizontal size={16} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default ResizeHandle;