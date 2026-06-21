import { DEFAULT_GARDEN_ID, type GardenId } from './gardens';

export type GardenGoalTextColors = {
  /** Active order count on a normal (known) goal. */
  normal: string;
  /** Discovery / undiscovered plant order. */
  undiscovered: string;
  /** Brief flash when the order is hit. */
  impact: string;
};

export const GARDEN_1_GOAL_TEXT_COLORS: GardenGoalTextColors = {
  normal: '#a1b54e',
  undiscovered: '#3d5628',
  impact: '#537b38',
};

export const GARDEN_2_GOAL_TEXT_COLORS: GardenGoalTextColors = {
  normal: '#e4b34d',
  undiscovered: '#6e4c27',
  impact: '#6e4c27',
};

export function getGardenGoalTextColors(gardenId: GardenId = DEFAULT_GARDEN_ID): GardenGoalTextColors {
  return gardenId === 'garden_2' ? GARDEN_2_GOAL_TEXT_COLORS : GARDEN_1_GOAL_TEXT_COLORS;
}
