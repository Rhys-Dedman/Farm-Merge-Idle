import { assetPath } from './assetPath';

/** Goal-order icon for plant level (plants 1–24). */
export function getGoalIconForPlantLevel(plantLevel: number): string {
  return assetPath(
    `/assets/icons/goals/garden_1/icon_goal_${Math.max(1, Math.min(24, Math.floor(plantLevel)))}.png`,
  );
}
