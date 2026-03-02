import React from 'react';

export interface Item {
  id: string;
  level: number;
  type: string;
}

export interface BoardCell {
  q: number;
  r: number;
  item: Item | null;
  locked?: boolean;
  fertile?: boolean;
}

export interface Upgrade {
  id: string;
  name: string;
  value: string;
  level: number;
  cost: string;
  icon: React.ReactNode;
}

export type TabType = 'SEEDS' | 'CROPS' | 'HARVEST';

export type ScreenType = 'STORE' | 'FARM' | 'BARN';

export type DragPhase = 'holding' | 'flyingBack' | 'impact';

export interface DragState {
  phase: DragPhase;
  cellIdx: number;
  item: Item;
  pointerX: number;
  pointerY: number;
  originX: number;
  originY: number;
  liftProgress: number;
  scaleProgress: number;
  flyProgress?: number;
  flyBackDurationMs?: number;
  impactStartTime?: number;
  hoveredEmptyCellIdx?: number | null;
  hoveredMatchCellIdx?: number | null;
  hoveredSwapCellIdx?: number | null;
  targetCellIdx?: number;
  isMerge?: boolean;
  isSwap?: boolean;
  mergeResultLevel?: number;
}
