/** Completed customer orders needed to fill one plant mastery segment. */
export const PLANT_MASTERY_ORDERS_PER_SEGMENT = 50;

/**
 * Max stored `ordersProgress` while filling a segment (before rollover on the next goal).
 * Until `plantMasteryIntroBarComplete`, bar shows 15/15 (fake L4); after intro, normal level goals (e.g. 0/20 at L5).
 */
export function getMaxStoredOrdersProgressForTarget(
  targetLevel: number,
  seg: number = PLANT_MASTERY_ORDERS_PER_SEGMENT,
  introBarComplete?: boolean,
): number {
  if (targetLevel >= 24) return seg;
  if (targetLevel === 1 && introBarComplete) return seg;
  return seg - 1;
}
/** Additive glow pulse duration (synced across plants). */
export const PLANT_MASTERY_GLOW_MS = 2000;

const PLANT_MASTERY_UNLOCK_COSTS: Readonly<Record<number, number>> = {
  1: 0,
  2: 5_000,
  3: 6_500,
  4: 8_000,
  5: 10_500,
  6: 13_000,
  7: 16_500,
  8: 21_000,
  9: 26_500,
  10: 34_000,
  11: 43_000,
  12: 55_000,
  13: 70_000,
  14: 90_000,
  15: 115_000,
  16: 140_000,
  17: 180_000,
  18: 230_000,
  19: 290_000,
  20: 360_000,
  21: 475_000,
  22: 600_000,
  23: 750_000,
  24: 1_000_000,
};

/** Mastery coin cost for unlocking the golden pot on `level` (1-based plant tier). Plant 1 is 0 (free purchase flow). */
export function getPlantMasteryUnlockCost(level: number): number {
  const safeLevel = Math.max(1, Math.min(24, Math.floor(level)));
  return PLANT_MASTERY_UNLOCK_COSTS[safeLevel] ?? 0;
}
