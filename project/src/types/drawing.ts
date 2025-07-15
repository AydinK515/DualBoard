export interface Point {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  tool: DrawingTool;
  points: Point[];
  color: string;
  width: number;
  isComplete: boolean;
}

export interface DrawingShape {
  id: string;
  type: 'rectangle' | 'ellipse' | 'line' | 'arrow';
  startPoint: Point;
  endPoint: Point;
  color: string;
  width: number;
  isComplete: boolean;
}

export interface DrawingText {
  id: string;
  text: string;
  position: Point;
  color: string;
  fontSize: number;
  fontFamily: string;
}

export interface DrawingImage {
  id: string;
  src: string;
  position: Point;
  width: number;
  height: number;
}

export type DrawingElement = DrawingStroke | DrawingShape | DrawingText | DrawingImage;

export type DrawingTool = 'pen' | 'eraser' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'text';

export interface DrawingState {
  elements: DrawingElement[];
  undoStack: DrawingElement[][];
  redoStack: DrawingElement[][];
  currentTool: DrawingTool;
  currentColor: string;
  currentWidth: number;
  showGrid: boolean;
  tutorAtBottom: boolean;
  isFullscreen: boolean;
}