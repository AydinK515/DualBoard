import React from 'react';
import { User } from 'lucide-react';

interface RoleIndicatorProps {
  role: 'editor' | 'viewer';
  tutorAtBottom: boolean;
}

export const RoleIndicator: React.FC<RoleIndicatorProps> = ({ role, tutorAtBottom }) => {
  // Determine position based on role and current layout  
  const getPosition = () => {
    if (role === 'editor') {
      // Editor always appears in their bottom-left corner
      if (tutorAtBottom) {
        // Editor is on bottom canvas, so bottom-left of screen
        return 'bottom-4 left-4';
      } else {
        // Editor is on top canvas, but from their perspective it's still bottom-left
        // Since they're rotated 180°, their bottom-left is actually top-right of screen
        return 'top-4 right-4 rotate-180';
      }
    } else {
      // Viewer always appears in their bottom-right corner (from their perspective)
      if (tutorAtBottom) {
        // Viewer is on top canvas, rotated 180°
        // Their bottom-right is actually top-left of screen
        return 'top-4 left-4 rotate-180';
      } else {
        // Viewer is on bottom canvas
        // Their bottom-right is bottom-right of screen, but toolbar might be on left
        // If toolbar is on left (when editor is on top), move indicator to right side
        return 'bottom-4 right-4';
      }
    }
  };

  return (
    <div 
      className={`absolute z-20 transition-all duration-500 ${getPosition()}`}
    >
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-md ${
        role === 'editor' 
          ? 'bg-blue-500 text-white' 
          : 'bg-green-500 text-white'
      }`}>
        <User size={16} />
        <span className="text-sm font-medium capitalize">{role}</span>
      </div>
    </div>
  );
};