/** Goals to complete at each player level before leveling up: 8…30, then 30 forever. */
const GOALS_TO_LEVEL_UP_TABLE = [8, 10, 12, 15, 20, 25, 30] as const;
const GOALS_TO_LEVEL_UP_CAP = 30;

export function getGoalsRequiredForLevel(level: number): number {
  const L = Math.max(1, Math.floor(level));
  if (L > GOALS_TO_LEVEL_UP_TABLE.length) return GOALS_TO_LEVEL_UP_CAP;
  return GOALS_TO_LEVEL_UP_TABLE[L - 1];
}

export function getPlayerLevelProgressRatio(
  playerLevel: number,
  playerLevelProgress: number,
): number {
  const required = getGoalsRequiredForLevel(playerLevel);
  if (required <= 0) return 0;
  return Math.min(1, Math.max(0, playerLevelProgress / required));
}

/** Daily Level Up task slot from progress at roll time: low % → slot 3, high % → slot 1. */
export function getLevelUpTaskSlot(
  playerLevel: number,
  playerLevelProgress: number,
): 1 | 2 | 3 {
  const ratio = getPlayerLevelProgressRatio(playerLevel, playerLevelProgress);
  if (ratio >= 0.7) return 1;
  if (ratio >= 0.35) return 2;
  return 3;
}
