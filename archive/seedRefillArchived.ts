/**
 * ARCHIVED — Seed Refill (not used in game; Storage Capacity is active again).
 * If you re-enable: production cycle at 100% would add getSeedsRefillPerCycle() seeds
 * instead of 1; storage cap was fixed at 10; upgrade panel showed "+1" and dynamic
 * "Production cycles refill your storage with X seed(s)".
 *
 * Re-integrate by: App seed 100% effect → add getSeedsRefillPerCycleArchived(seedsState);
 * UpgradeList seed_storage row → Seed Refill copy + green X in description;
 * isSeedStorageMaxed / max level tied to refill tiers instead of storage max.
 */
export type SeedsStateLike = { seed_storage?: { level: number } };

export const SEED_REFILL_ARCHIVED_MAX_LEVEL = 10;

/** Level 0 → 1 seed/cycle; level 1 → 2; … capped at 10 per cycle. */
export function getSeedsRefillPerCycleArchived(seedsState: SeedsStateLike): number {
  const level = seedsState?.seed_storage?.level ?? 0;
  return Math.min(10, level === 0 ? 1 : 1 + level);
}

export const SEED_REFILL_ARCHIVED_PANEL = {
  title: 'Seed Refill',
  amountGreen: '+1',
  descriptionTemplate: (n: number) =>
    n === 1
      ? 'Production cycles refill your storage with 1 seed'
      : `Production cycles refill your storage with ${n} seeds`,
  levelUpTitle: 'Seed Refill',
  levelUpBody: 'Increase how many seeds are refilled into your storage each cycle.',
} as const;
