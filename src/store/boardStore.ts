import { create } from 'zustand';
import { MeasureMode } from '../types/game';

export type ActiveTool = 'select' | 'ruler' | 'circle' | 'coherency';

export interface MeasureState {
  mode: MeasureMode;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  circleX: number;
  circleY: number;
  circleRadius: number;
  pinned: boolean;
}

interface BoardStore {
  // Camera transform (plain numbers; Reanimated SharedValues are in BoardProvider)
  panX: number;
  panY: number;
  scale: number;

  // Tool state
  activeTool: ActiveTool;
  measureState: MeasureState;
  showGrid: boolean;
  showDeploymentZones: boolean;

  // Actions
  setCamera: (panX: number, panY: number, scale: number) => void;
  resetCamera: () => void;
  setActiveTool: (tool: ActiveTool) => void;
  setMeasureState: (partial: Partial<MeasureState>) => void;
  resetMeasure: () => void;
  toggleGrid: () => void;
  toggleDeploymentZones: () => void;
}

const DEFAULT_MEASURE: MeasureState = {
  mode: 'off',
  startX: 0, startY: 0, endX: 0, endY: 0,
  circleX: 0, circleY: 0, circleRadius: 0,
  pinned: false,
};

export const useBoardStore = create<BoardStore>()((set) => ({
  panX: 0,
  panY: 0,
  scale: 1,

  activeTool: 'select',
  measureState: DEFAULT_MEASURE,
  showGrid: true,
  showDeploymentZones: false,

  setCamera: (panX, panY, scale) => set({ panX, panY, scale }),
  resetCamera: () => set({ panX: 0, panY: 0, scale: 1 }),
  setActiveTool: (tool) => set((s) => ({
    activeTool: tool,
    measureState: tool === 'select' ? DEFAULT_MEASURE : s.measureState,
  })),
  setMeasureState: (partial) => set((s) => ({
    measureState: { ...s.measureState, ...partial },
  })),
  resetMeasure: () => set({ measureState: DEFAULT_MEASURE }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleDeploymentZones: () => set((s) => ({ showDeploymentZones: !s.showDeploymentZones })),
}));
