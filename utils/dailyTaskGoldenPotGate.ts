import {
  isPlantCollectionUiUnlockedGlobally,
  PLANT_COLLECTION_UI_UNLOCK_LEVEL,
} from '../constants/playerLevelUnlocks';

export function canRollGoldenPotDailyTask(
  garden1PlayerLevel: number,
  goldenPotUpgradeableCount: number,
): boolean {
  return (
    isPlantCollectionUiUnlockedGlobally(garden1PlayerLevel) &&
    goldenPotUpgradeableCount > 0
  );
}
