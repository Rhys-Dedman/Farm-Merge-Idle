import { MAX_PLANT_TIER } from './plants';
import { getRemoteConfig } from '../utils/remoteConfig';

/** Completed customer orders needed to fill one plant mastery segment. */
export const PLANT_MASTERY_ORDERS_PER_SEGMENT = 50;

/**
 * Legacy save cap for `ordersProgress` (no longer drives collection UI).
 */
export function getMaxStoredOrdersProgressForTarget(
  targetLevel: number,
  seg: number = PLANT_MASTERY_ORDERS_PER_SEGMENT,
  introBarComplete?: boolean,
): number {
  if (targetLevel >= MAX_PLANT_TIER) return seg;
  if (targetLevel === 1 && introBarComplete) return seg;
  return seg - 1;
}
/** Additive glow pulse duration (synced across plants). */
export const PLANT_MASTERY_GLOW_MS = 2000;

/** Mastery coin cost for unlocking the golden pot on `level` (1-based plant tier). Plant 1 is 0 (free purchase flow). */
export function getPlantMasteryUnlockCost(level: number): number {
  const safeLevel = Math.max(1, Math.min(MAX_PLANT_TIER, Math.floor(level)));
  const costs = getRemoteConfig().currency.goldenPotUnlockCostByPlant;
  return costs[safeLevel] ?? 0;
}

/** Discovered plant tiers that do not yet have a golden pot. */
export function getGoldenPotUpgradeableLevels(
  highestPlantEver: number,
  unlockedLevels: readonly number[],
): number[] {
  const unlocked = new Set(unlockedLevels);
  const levels: number[] = [];
  const max = Math.max(0, Math.floor(highestPlantEver));
  for (let level = 1; level <= max; level++) {
    if (!unlocked.has(level)) levels.push(level);
  }
  return levels;
}

export function countGoldenPotUpgradeablePlants(
  highestPlantEver: number,
  unlockedLevels: readonly number[],
): number {
  return getGoldenPotUpgradeableLevels(highestPlantEver, unlockedLevels).length;
}

export function canPurchaseGoldenPotForLevel(
  level: number,
  highestPlantEver: number,
  unlockedLevels: readonly number[],
): boolean {
  const safeLevel = Math.max(1, Math.min(MAX_PLANT_TIER, Math.floor(level)));
  return safeLevel <= highestPlantEver && !unlockedLevels.includes(safeLevel);
}
