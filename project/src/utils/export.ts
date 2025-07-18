export const exportCanvas = (canvasElement: HTMLCanvasElement, filename: string = 'dualboard-export') => {
  try {
    // Create a new canvas for export with white background
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) {
      throw new Error('Could not get canvas context');
    }
    
    // Set same dimensions as original canvas
    exportCanvas.width = canvasElement.width;
    exportCanvas.height = canvasElement.height;
    
    // Fill with white background
    exportCtx.fillStyle = 'white';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    
    // Draw the original canvas content on top
    exportCtx.drawImage(canvasElement, 0, 0);
    
    // Create download link
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to export canvas:', error);
    alert('Failed to export canvas. Please try again.');
  }
};

export const getCanvasAsDataURL = (canvasElement: HTMLCanvasElement): string => {
  return canvasElement.toDataURL('image/png');
};

export const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};