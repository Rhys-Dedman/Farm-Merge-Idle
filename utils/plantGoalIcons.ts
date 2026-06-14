import { getGoalIconPathForGarden } from './gardenAssets';

/** Goal-order icon for plant level in the active garden. */
export function getGoalIconForPlantLevel(plantLevel: number): string {
  return getGoalIconPathForGarden(plantLevel);
}
