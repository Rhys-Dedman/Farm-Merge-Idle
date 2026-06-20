import { PLANT_COLLECTION_UI_UNLOCK_LEVEL } from '../constants/playerLevelUnlocks';

export function canRollGoldenPotDailyTask(
  playerLevel: number,
  goldenPotUpgradeableCount: number,
): boolean {
  return (
    playerLevel >= PLANT_COLLECTION_UI_UNLOCK_LEVEL &&
    goldenPotUpgradeableCount > 0
  );
}
