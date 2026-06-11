import { assetPath } from './assetPath';

import { MAX_PLANT_TIER } from '../constants/plants';

/** Goal-order icon for plant level (plants 1–`MAX_PLANT_TIER`). */
export function getGoalIconForPlantLevel(plantLevel: number): string {
  return assetPath(
    `/assets/icons/goals/garden_1/icon_goal_${Math.max(1, Math.min(MAX_PLANT_TIER, Math.floor(plantLevel)))}.png`,
  );
}
