import { DEFAULT_GARDEN_ID, SHIPPED_GARDEN_IDS, type GardenId } from './gardens';
import type { GardenState } from '../types/gardenState';
import { getDailyTaskSlotRewardCoins } from '../utils/dailyTaskRewards';

/**
 * Golden pot count = `plantMastery.unlockedLevels.length`.
 * Milestones every 4 pots (4 → 40); display + gameplay hooks share this table.
 */
export const GOLDEN_POT_BONUS_TIERS = [
  { potCount: 4, title: 'More Customers', subtitle: 'Unlock a 4th order slot', iconSlug: 'MoreCustomers' },
  { potCount: 8, title: 'Daily Allowance', subtitle: 'Free coins from store daily', iconSlug: 'DailyAllowance' },
  { potCount: 12, title: 'Merge Bonus', subtitle: '+25% coins from merging', iconSlug: 'mergecoins' },
  { potCount: 16, title: 'Daily Rewards', subtitle: '2x Daily task rewards', iconSlug: 'DailyRewards' },
  { potCount: 20, title: 'Seed Storage', subtitle: '+1 max seed recharges', iconSlug: 'SeedStorage' },
  { potCount: 24, title: 'Offline Boost', subtitle: '+25% offline coins earned', iconSlug: 'OfflineBoost' },
  { potCount: 28, title: 'Harvest Storage', subtitle: '+1 max harvest recharges', iconSlug: 'HarvestStorage' },
  { potCount: 32, title: 'Extra Tasks', subtitle: '+1 Daily Task', iconSlug: 'ExtraTasks' },
  { potCount: 36, title: 'Seed Speed', subtitle: '+25% Seed production', iconSlug: 'SeedSpeed' },
  { potCount: 40, title: 'Harvest Speed', subtitle: '+25% Harvest Production', iconSlug: 'HarvestSpeed' },
] as const;

export type GoldenPotBonusTier = (typeof GOLDEN_POT_BONUS_TIERS)[number];

/** Thresholds in display order (top → bottom of bonuses popup). */
export const GOLDEN_POT_BONUS_TIER_THRESHOLDS = GOLDEN_POT_BONUS_TIERS.map((t) => t.potCount);

export const GOLDEN_POT_BONUS_FOURTH_ORDER_SLOT_AT = 4;
export const GOLDEN_POT_BONUS_DAILY_ALLOWANCE_AT = 8;
export const GOLDEN_POT_BONUS_MERGE_COINS_25_AT = 12;
export const GOLDEN_POT_BONUS_DAILY_TASKS_2X_AT = 16;
export const GOLDEN_POT_BONUS_SEED_RECHARGE_AT = 20;
export const GOLDEN_POT_BONUS_OFFLINE_25_AT = 24;
export const GOLDEN_POT_BONUS_HARVEST_RECHARGE_AT = 28;
export const GOLDEN_POT_BONUS_EXTRA_TASKS_AT = 32;
export const GOLDEN_POT_BONUS_SEED_SPEED_25_AT = 36;
export const GOLDEN_POT_BONUS_HARVEST_SPEED_25_AT = 40;

/** Slug suffix for `icon_collection_<slug>.png` (matches filenames under `/assets/icons/collection/`). */
export type GoldenPotBonusIconSlug = (typeof GOLDEN_POT_BONUS_TIERS)[number]['iconSlug'];

export function getGoldenPotBonusTierForPotCount(potCount: number): GoldenPotBonusTier | undefined {
  return GOLDEN_POT_BONUS_TIERS.find((tier) => tier.potCount === potCount);
}

/** Unlocked bonus tiers by pot threshold (e.g. 4, 24). Prefer this over raw pot count for gameplay. */
export type GoldenPotUnlockedTiers = ReadonlySet<number>;

/** `number` = legacy pot-count threshold; `Set` = per-shelf unlocks. */
export type GoldenPotUnlockInput = number | GoldenPotUnlockedTiers;

function isGoldenPotTierUnlocked(input: GoldenPotUnlockInput, threshold: number): boolean {
  if (typeof input === 'number') return input >= threshold;
  return input.has(threshold);
}

/**
 * Bonuses popup order: unlocked → in-progress → locked.
 * Within each group, keep table order (pot threshold ascending).
 */
export function getGoldenPotBonusTiersForDisplay(
  unlocked: GoldenPotUnlockInput,
  inProgress: ReadonlySet<number> | readonly number[] = [],
): GoldenPotBonusTier[] {
  const inProgressSet =
    inProgress instanceof Set ? inProgress : new Set(inProgress);
  const completed: GoldenPotBonusTier[] = [];
  const progressing: GoldenPotBonusTier[] = [];
  const locked: GoldenPotBonusTier[] = [];
  for (const tier of GOLDEN_POT_BONUS_TIERS) {
    if (isGoldenPotTierUnlocked(unlocked, tier.potCount)) completed.push(tier);
    else if (inProgressSet.has(tier.potCount)) progressing.push(tier);
    else locked.push(tier);
  }
  return [...completed, ...progressing, ...locked];
}

/** Bonus tier pot threshold for a collection shelf (shelf 0 → 4 pots, shelf 1 → 8, shelf 2 → 12, …). */
export function getGoldenPotBonusTierPotCountForShelf(shelfIndex: number): number {
  return (shelfIndex + 1) * 4;
}

/** Bonus tier metadata for a shelf, if defined at that shelf's pot threshold. */
export function getGoldenPotBonusTierForShelf(shelfIndex: number): GoldenPotBonusTier | undefined {
  return getGoldenPotBonusTierForPotCount(getGoldenPotBonusTierPotCountForShelf(shelfIndex));
}

/** Bonus tier the collection bar is progressing toward (first threshold strictly above count). */
export function getGoldenPotBonusTierInProgress(goldenPotCount: number): GoldenPotBonusTier {
  for (const tier of GOLDEN_POT_BONUS_TIERS) {
    if (goldenPotCount < tier.potCount) return tier;
  }
  return GOLDEN_POT_BONUS_TIERS[GOLDEN_POT_BONUS_TIERS.length - 1]!;
}

export function getGoldenPotBonusIconSlugForPotCount(potCount: number): GoldenPotBonusIconSlug {
  return getGoldenPotBonusTierForPotCount(potCount)?.iconSlug ?? GOLDEN_POT_BONUS_TIERS[0]!.iconSlug;
}

export function getCollectionRewardIconSlug(goldenPotCount: number): GoldenPotBonusIconSlug {
  return getGoldenPotBonusTierInProgress(goldenPotCount).iconSlug;
}

/** If `newCount` just crossed a bonus tier (was strictly below, now at or above), return that tier's pot count; else null. */
export function getGoldenPotBonusTierJustUnlocked(prevCount: number, newCount: number): number | null {
  if (newCount <= prevCount) return null;
  for (const t of GOLDEN_POT_BONUS_TIER_THRESHOLDS) {
    if (prevCount < t && newCount >= t) return t;
  }
  return null;
}

export function hasGoldenPotFourthOrderSlot(unlocked: GoldenPotUnlockInput): boolean {
  return isGoldenPotTierUnlocked(unlocked, GOLDEN_POT_BONUS_FOURTH_ORDER_SLOT_AT);
}

/** Plant goal slots (indices 0–3): 3 until enough golden pots; 4 after tier unlock. Coin goal stays separate (5th UI slot). */
export function getMaxPlantGoalSlots(unlocked: GoldenPotUnlockInput): number {
  return hasGoldenPotFourthOrderSlot(unlocked) ? 4 : 3;
}

export function hasGoldenPotDailyAllowance(unlocked: GoldenPotUnlockInput): boolean {
  return isGoldenPotTierUnlocked(unlocked, GOLDEN_POT_BONUS_DAILY_ALLOWANCE_AT);
}

export function hasGoldenPotMergeCoins25(unlocked: GoldenPotUnlockInput): boolean {
  return isGoldenPotTierUnlocked(unlocked, GOLDEN_POT_BONUS_MERGE_COINS_25_AT);
}

/** +25% merge coin payout; rounded to nearest 5, at least +5 over base. */
export const GOLDEN_POT_MERGE_COINS_BONUS_MULTIPLIER = 1.25;
export const GOLDEN_POT_MERGE_COINS_ROUND_STEP = 5;
export const GOLDEN_POT_MERGE_COINS_MIN_EXTRA = 5;

/** Non-goal merge coin value after Merge Bonus tier (+25%, nearest 5, min +5). */
export function applyGoldenPotMergeCoinBonus(
  baseCoins: number,
  unlocked: GoldenPotUnlockInput,
): number {
  if (baseCoins <= 0) return baseCoins;
  if (!hasGoldenPotMergeCoins25(unlocked)) return baseCoins;
  const boosted = baseCoins * GOLDEN_POT_MERGE_COINS_BONUS_MULTIPLIER;
  const rounded =
    Math.round(boosted / GOLDEN_POT_MERGE_COINS_ROUND_STEP) * GOLDEN_POT_MERGE_COINS_ROUND_STEP;
  return Math.max(rounded, baseCoins + GOLDEN_POT_MERGE_COINS_MIN_EXTRA);
}

/** Free store coins granted once per garden per local day (Daily Allowance bonus). */
export function getDailyAllowanceCoinAmount(playerLevel: number): number {
  return getDailyTaskSlotRewardCoins(1, playerLevel);
}

/** Account-wide golden pot count (sum across all shipped gardens). */
export function getGlobalGoldenPotCount(
  activeGardenUnlockedLevels: readonly number[],
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
  activeGardenId: GardenId = DEFAULT_GARDEN_ID,
): number {
  let total = 0;
  for (const id of SHIPPED_GARDEN_IDS) {
    if (id === activeGardenId) {
      total += activeGardenUnlockedLevels.length;
    } else {
      total += gardens?.[id]?.plantMasteryUnlockedLevels?.length ?? 0;
    }
  }
  return total;
}

/** @deprecated Alias for `getGlobalGoldenPotCount` (same sum semantics). */
export function getTotalGoldenPotCountAcrossGardens(
  activeGardenId: GardenId,
  activeGardenUnlockedLevels: readonly number[],
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
): number {
  return getGlobalGoldenPotCount(activeGardenUnlockedLevels, gardens, activeGardenId);
}

/** Whether the player may switch to this garden (started gardens only; purchase via picker). */
export function isGardenSelectable(gardenId: GardenId, alreadyStarted: boolean): boolean {
  if (gardenId === DEFAULT_GARDEN_ID) return true;
  return alreadyStarted;
}

export function hasGoldenPotDailyTasks2x(unlocked: GoldenPotUnlockInput): boolean {
  return isGoldenPotTierUnlocked(unlocked, GOLDEN_POT_BONUS_DAILY_TASKS_2X_AT);
}

export function hasGoldenPotExtraSeedRecharge(unlocked: GoldenPotUnlockInput): boolean {
  return isGoldenPotTierUnlocked(unlocked, GOLDEN_POT_BONUS_SEED_RECHARGE_AT);
}

export function hasGoldenPotOfflineEarnings25(unlocked: GoldenPotUnlockInput): boolean {
  return isGoldenPotTierUnlocked(unlocked, GOLDEN_POT_BONUS_OFFLINE_25_AT);
}

/** @deprecated Use `hasGoldenPotOfflineEarnings25` — offline is +25% at 24 pots, not 2× at 8. */
export function hasGoldenPotOfflineEarningsDouble(unlocked: GoldenPotUnlockInput): boolean {
  return hasGoldenPotOfflineEarnings25(unlocked);
}

export function hasGoldenPotExtraHarvestRecharge(unlocked: GoldenPotUnlockInput): boolean {
  return isGoldenPotTierUnlocked(unlocked, GOLDEN_POT_BONUS_HARVEST_RECHARGE_AT);
}

/** Base harvest charge cap before golden pot Harvest Storage bonus. */
export const HARVEST_CHARGES_BASE_MAX = 3;

export function getGoldenPotSeedStorageMaxBonus(unlocked: GoldenPotUnlockInput): number {
  return hasGoldenPotExtraSeedRecharge(unlocked) ? 1 : 0;
}

export function getGoldenPotHarvestStorageMaxBonus(unlocked: GoldenPotUnlockInput): number {
  return hasGoldenPotExtraHarvestRecharge(unlocked) ? 1 : 0;
}

/** Max harvest recharges (account-wide; every garden uses this cap). */
export function getHarvestChargesMax(unlocked: GoldenPotUnlockInput): number {
  return HARVEST_CHARGES_BASE_MAX + getGoldenPotHarvestStorageMaxBonus(unlocked);
}

export function hasGoldenPotExtraTasks(unlocked: GoldenPotUnlockInput): boolean {
  return isGoldenPotTierUnlocked(unlocked, GOLDEN_POT_BONUS_EXTRA_TASKS_AT);
}

export function hasGoldenPotSeedSpeed25(unlocked: GoldenPotUnlockInput): boolean {
  return isGoldenPotTierUnlocked(unlocked, GOLDEN_POT_BONUS_SEED_SPEED_25_AT);
}

export function hasGoldenPotHarvestSpeed25(unlocked: GoldenPotUnlockInput): boolean {
  return isGoldenPotTierUnlocked(unlocked, GOLDEN_POT_BONUS_HARVEST_SPEED_25_AT);
}

/** @deprecated Use `hasGoldenPotSeedSpeed25` — +25% seed recharge at 36 pots. */
export function hasGoldenPotProduction150(unlocked: GoldenPotUnlockInput): boolean {
  return hasGoldenPotSeedSpeed25(unlocked);
}

/** @deprecated Use `hasGoldenPotHarvestSpeed25` — +25% harvest recharge at 40 pots. */
export function hasGoldenPotHarvest150(unlocked: GoldenPotUnlockInput): boolean {
  return hasGoldenPotHarvestSpeed25(unlocked);
}

/** Lower golden-pot threshold for the segment containing `goldenPotCount` (0 before first tier). */
export function getGoldenPotBonusSegmentStart(goldenPotCount: number): number {
  let prev = 0;
  for (const threshold of GOLDEN_POT_BONUS_TIER_THRESHOLDS) {
    if (goldenPotCount < threshold) return prev;
    prev = threshold;
  }
  return prev;
}

/** Next bonus tier threshold strictly above `goldenPotCount`. */
export function getGoldenPotBonusSegmentEnd(goldenPotCount: number): number {
  for (const threshold of GOLDEN_POT_BONUS_TIER_THRESHOLDS) {
    if (goldenPotCount < threshold) return threshold;
  }
  return GOLDEN_POT_BONUS_TIER_THRESHOLDS[GOLDEN_POT_BONUS_TIER_THRESHOLDS.length - 1]!;
}

export type CollectionRewardBarState = {
  numerator: number;
  denominator: number;
  fillPct: number;
  rewardIconSlug: GoldenPotBonusIconSlug;
};

/** Barn collection bar: golden pots purchased toward the next bonus tier (e.g. 1/4). */
export function getCollectionRewardBarState(goldenPotCount: number): CollectionRewardBarState {
  const segmentStart = getGoldenPotBonusSegmentStart(goldenPotCount);
  const segmentEnd = getGoldenPotBonusSegmentEnd(goldenPotCount);
  const denominator = Math.max(1, segmentEnd - segmentStart);
  const numerator = Math.max(0, goldenPotCount - segmentStart);
  const fillPct = Math.min(100, (numerator / denominator) * 100);
  return {
    numerator,
    denominator,
    fillPct,
    rewardIconSlug: getCollectionRewardIconSlug(goldenPotCount),
  };
}

/** Per-shelf bar: shelf 1 → first bonus tier (4 pots), shelf 2 → second (8 pots), etc. */
export function getShelfRewardBarState(
  shelfIndex: number,
  goldenPotCount: number,
): CollectionRewardBarState | null {
  const tier = GOLDEN_POT_BONUS_TIERS[shelfIndex];
  if (!tier) return null;
  const segmentStart = shelfIndex === 0 ? 0 : GOLDEN_POT_BONUS_TIERS[shelfIndex - 1]!.potCount;
  const segmentEnd = tier.potCount;
  const denominator = Math.max(1, segmentEnd - segmentStart);
  const numerator = Math.min(denominator, Math.max(0, goldenPotCount - segmentStart));
  const fillPct = Math.min(100, (numerator / denominator) * 100);
  return {
    numerator,
    denominator,
    fillPct,
    rewardIconSlug: tier.iconSlug,
  };
}

const GOLDEN_POT_SEED_SPEED_BONUS_PCT = 25;
const GOLDEN_POT_HARVEST_SPEED_BONUS_PCT = 25;
const GOLDEN_POT_OFFLINE_EARNINGS_MULTIPLIER = 1.25;

const RECHARGE_RAPID_PER_MIN = 15;
const RECHARGE_PCT_MIN = 10;
const RECHARGE_PCT_BASELINE_MAX = 100;
const RECHARGE_PER_MIN_AT_MIN_PCT = 3;
const RECHARGE_PER_MIN_AT_BASELINE_MAX = 10;

export function getSeedProductionDisplayPercent(
  seedProductionLevel: number,
  unlocked: GoldenPotUnlockInput,
): number {
  const L = Math.min(9, Math.max(0, seedProductionLevel));
  const base = Math.min(100, 10 + L * 10);
  return hasGoldenPotSeedSpeed25(unlocked) ? base + GOLDEN_POT_SEED_SPEED_BONUS_PCT : base;
}

export function getHarvestSpeedDisplayPercent(
  harvestSpeedLevel: number,
  unlocked: GoldenPotUnlockInput,
): number {
  const L = Math.min(9, Math.max(0, harvestSpeedLevel));
  const base = Math.min(100, 10 + L * 10);
  return hasGoldenPotHarvestSpeed25(unlocked) ? base + GOLDEN_POT_HARVEST_SPEED_BONUS_PCT : base;
}

/** Offline coin multiplier from golden pot milestones (1 = none). */
export function getGoldenPotOfflineEarningsMultiplier(unlocked: GoldenPotUnlockInput): number {
  return hasGoldenPotOfflineEarnings25(unlocked) ? GOLDEN_POT_OFFLINE_EARNINGS_MULTIPLIER : 1;
}

/** Apply Offline Boost (+25%) to a raw offline earnings total for popup display / collect. */
export function applyGoldenPotOfflineEarningsBonus(
  rawTotal: number,
  unlocked: GoldenPotUnlockInput,
): number {
  if (rawTotal <= 0) return 0;
  const mult = getGoldenPotOfflineEarningsMultiplier(unlocked);
  if (mult <= 1) return rawTotal;
  const boosted = rawTotal * mult;
  return Math.round(boosted / 5) * 5;
}

/** Persist unboosted bank so reload applies Offline Boost exactly once. */
export function getRawOfflineEarningsForSave(
  displayTotal: number,
  unlocked: GoldenPotUnlockInput,
): number {
  if (displayTotal <= 0) return 0;
  const mult = getGoldenPotOfflineEarningsMultiplier(unlocked);
  if (mult <= 1) return displayTotal;
  return Math.round(displayTotal / mult);
}

/** Bar fill rate (% of bar per minute / 100) from displayed %; same curve as seed + harvest recharge. */
export function getRechargePerMinuteForDisplayPercent(displayPercent: number): number {
  const p = Math.max(RECHARGE_PCT_MIN, Math.min(150, displayPercent));
  return (
    RECHARGE_PER_MIN_AT_MIN_PCT +
    ((p - RECHARGE_PCT_MIN) / (RECHARGE_PCT_BASELINE_MAX - RECHARGE_PCT_MIN)) *
      (RECHARGE_PER_MIN_AT_BASELINE_MAX - RECHARGE_PER_MIN_AT_MIN_PCT)
  );
}

export function getSeedRechargePerMinute(
  seedProductionLevel: number,
  unlocked: GoldenPotUnlockInput,
  hasRapidSeedsBoost: boolean
): number {
  if (hasRapidSeedsBoost) return RECHARGE_RAPID_PER_MIN;
  const pct = getSeedProductionDisplayPercent(seedProductionLevel, unlocked);
  return getRechargePerMinuteForDisplayPercent(pct);
}

export function getHarvestRechargePerMinute(
  harvestSpeedLevel: number,
  unlocked: GoldenPotUnlockInput,
  hasRapidHarvestBoost: boolean
): number {
  if (hasRapidHarvestBoost) return RECHARGE_RAPID_PER_MIN;
  const pct = getHarvestSpeedDisplayPercent(harvestSpeedLevel, unlocked);
  return getRechargePerMinuteForDisplayPercent(pct);
}
