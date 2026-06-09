import { getSeedLevelFromHighestPlant } from '../components/UpgradeList';

/**
 * Plant levels valid for Plant Merge daily tasks at roll time.
 * Excludes top discovered tier (discovery task) and tiers below current seed level.
 */
export function getEligibleDailyTaskPlantLevels(highestPlantEver: number): number[] {
  const highest = Math.max(1, Math.floor(highestPlantEver));
  if (highest <= 1) return [];
  const seedLevel = getSeedLevelFromHighestPlant(highest);
  const levels: number[] = [];
  for (let level = seedLevel; level < highest; level += 1) {
    levels.push(level);
  }
  return levels;
}

export function canRollPlantTargetDailyTask(highestPlantEver: number): boolean {
  return getEligibleDailyTaskPlantLevels(highestPlantEver).length > 0;
}

/**
 * Grow Plants: at least seed+1 and at most highest−1 (needs enough discovered tiers).
 */
export function getEligibleGrowPlantsDailyTaskLevels(highestPlantEver: number): number[] {
  const highest = Math.max(1, Math.floor(highestPlantEver));
  const seedLevel = getSeedLevelFromHighestPlant(highest);
  const minLevel = seedLevel + 1;
  const maxLevel = highest - 1;
  if (minLevel > maxLevel) return [];
  const levels: number[] = [];
  for (let level = minLevel; level <= maxLevel; level += 1) {
    levels.push(level);
  }
  return levels;
}

export function getAvailableGrowPlantsDailyTaskLevels(
  highestPlantEver: number,
  excludePlantLevel?: number,
): number[] {
  const eligible = getEligibleGrowPlantsDailyTaskLevels(highestPlantEver);
  if (excludePlantLevel == null) return eligible;
  return eligible.filter((level) => level !== excludePlantLevel);
}

export function canRollGrowPlantsDailyTask(
  highestPlantEver: number,
  lastGrowPlantLevel?: number,
): boolean {
  return getAvailableGrowPlantsDailyTaskLevels(highestPlantEver, lastGrowPlantLevel).length > 0;
}

export function pickDailyTaskPlantLevel(highestPlantEver: number): number | null {
  const pool = getEligibleDailyTaskPlantLevels(highestPlantEver);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
