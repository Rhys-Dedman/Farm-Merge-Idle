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
