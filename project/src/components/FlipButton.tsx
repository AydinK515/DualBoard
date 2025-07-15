import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface FlipButtonProps {
  onFlipRoles: () => void;
}

export const FlipButton: React.FC<FlipButtonProps> = ({ onFlipRoles }) => {
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (isAnimating) return; // Prevent multiple clicks during animation
    
    setIsAnimating(true);
    setRotation(prev => prev - 180); // Rotate -180 degrees and stay there
    onFlipRoles();
    
    // Reset spinning state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 600); // Match the animation duration
  };

  return (
    <button
      onClick={handleClick}
      className={`
        fixed left-1/2 -translate-x-1/2 z-30 w-10 h-10 rounded-full text-white transition-all duration-200 ease-out flex items-center justify-center overflow-hidden
        transition-transform duration-600 ease-out
      `}
      style={{
        top: '50vh', // Always at 50% of viewport height
        transform: 'translateX(-50%) translateY(-50%)', // Center horizontally and vertically on the divider line
        transform: `translateX(-50%) translateY(-50%) rotate(${rotation}deg)`, // Include rotation in transform
        background: 'linear-gradient(135deg, #10b981 50%, #3b82f6 50%)', // Green top-left diagonal, blue bottom-right diagonal
      }}
      title="Flip Editor/Viewer Roles"
      disabled={isAnimating}
    >
      <RotateCcw 
        size={18}
        strokeWidth={2.5}
      />
    </button>
  );
};