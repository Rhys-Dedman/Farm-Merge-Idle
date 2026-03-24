/** Completed customer orders needed to fill one plant mastery segment. */
export const PLANT_MASTERY_ORDERS_PER_SEGMENT = 5;
/** Coins to purchase mastery for level 1 plant. */
export const PLANT_MASTERY_UNLOCK_COST_BASE = 5000;
/** Additive glow pulse duration (synced across plants). */
export const PLANT_MASTERY_GLOW_MS = 2000;

/** Mastery cost doubles for each next plant level: 5k, 10k, 20k, ... */
export function getPlantMasteryUnlockCost(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return PLANT_MASTERY_UNLOCK_COST_BASE * Math.pow(2, safeLevel - 1);
}
