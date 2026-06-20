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
  { potCount: 12, title: 'Fruit Garden', subtitle: 'Unlock the next garden', iconSlug: 'FruitGarden' },
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
export const GOLDEN_POT_BONUS_NEW_GARDEN_AT = 12;
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

export function hasGoldenPotFourthOrderSlot(count: number): boolean {
  return count >= GOLDEN_POT_BONUS_FOURTH_ORDER_SLOT_AT;
}

/** Plant goal slots (indices 0–3): 3 until enough golden pots; 4 after tier unlock. Coin goal stays separate (5th UI slot). */
export function getMaxPlantGoalSlots(goldenPotCount: number): number {
  return hasGoldenPotFourthOrderSlot(goldenPotCount) ? 4 : 3;
}

export function hasGoldenPotDailyAllowance(count: number): boolean {
  return count >= GOLDEN_POT_BONUS_DAILY_ALLOWANCE_AT;
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

export function hasGoldenPotNewGardenUnlocked(count: number): boolean {
  return count >= GOLDEN_POT_BONUS_NEW_GARDEN_AT;
}

/** Golden pots required to start this garden (null = not golden-pot gated or garden 1). */
export function getGoldenPotCountRequiredForGarden(gardenId: GardenId): number | null {
  if (gardenId === 'garden_2') return GOLDEN_POT_BONUS_NEW_GARDEN_AT;
  return null;
}

/** Whether the player may switch to / start this garden (account-wide golden pot count). */
export function isGardenSelectableByGoldenPots(
  gardenId: GardenId,
  globalGoldenPotCount: number,
  alreadyStarted: boolean,
): boolean {
  if (gardenId === DEFAULT_GARDEN_ID) return true;
  if (alreadyStarted) return true;
  const required = getGoldenPotCountRequiredForGarden(gardenId);
  if (required == null) return false;
  return globalGoldenPotCount >= required;
}

export function hasGoldenPotDailyTasks2x(count: number): boolean {
  return count >= GOLDEN_POT_BONUS_DAILY_TASKS_2X_AT;
}

export function hasGoldenPotExtraSeedRecharge(count: number): boolean {
  return count >= GOLDEN_POT_BONUS_SEED_RECHARGE_AT;
}

export function hasGoldenPotOfflineEarnings25(count: number): boolean {
  return count >= GOLDEN_POT_BONUS_OFFLINE_25_AT;
}

/** @deprecated Use `hasGoldenPotOfflineEarnings25` — offline is +25% at 24 pots, not 2× at 8. */
export function hasGoldenPotOfflineEarningsDouble(count: number): boolean {
  return hasGoldenPotOfflineEarnings25(count);
}

export function hasGoldenPotExtraHarvestRecharge(count: number): boolean {
  return count >= GOLDEN_POT_BONUS_HARVEST_RECHARGE_AT;
}

/** Base harvest charge cap before golden pot Harvest Storage bonus. */
export const HARVEST_CHARGES_BASE_MAX = 3;

export function getGoldenPotSeedStorageMaxBonus(globalGoldenPotCount: number): number {
  return hasGoldenPotExtraSeedRecharge(globalGoldenPotCount) ? 1 : 0;
}

export function getGoldenPotHarvestStorageMaxBonus(globalGoldenPotCount: number): number {
  return hasGoldenPotExtraHarvestRecharge(globalGoldenPotCount) ? 1 : 0;
}

/** Max harvest recharges (account-wide; every garden uses this cap). */
export function getHarvestChargesMax(globalGoldenPotCount: number): number {
  return HARVEST_CHARGES_BASE_MAX + getGoldenPotHarvestStorageMaxBonus(globalGoldenPotCount);
}

export function hasGoldenPotExtraTasks(count: number): boolean {
  return count >= GOLDEN_POT_BONUS_EXTRA_TASKS_AT;
}

export function hasGoldenPotSeedSpeed25(count: number): boolean {
  return count >= GOLDEN_POT_BONUS_SEED_SPEED_25_AT;
}

export function hasGoldenPotHarvestSpeed25(count: number): boolean {
  return count >= GOLDEN_POT_BONUS_HARVEST_SPEED_25_AT;
}

/** @deprecated Use `hasGoldenPotSeedSpeed25` — +25% seed recharge at 36 pots. */
export function hasGoldenPotProduction150(count: number): boolean {
  return hasGoldenPotSeedSpeed25(count);
}

/** @deprecated Use `hasGoldenPotHarvestSpeed25` — +25% harvest recharge at 40 pots. */
export function hasGoldenPotHarvest150(count: number): boolean {
  return hasGoldenPotHarvestSpeed25(count);
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

const GOLDEN_POT_SEED_SPEED_BONUS_PCT = 25;
const GOLDEN_POT_HARVEST_SPEED_BONUS_PCT = 25;
const GOLDEN_POT_OFFLINE_EARNINGS_MULTIPLIER = 1.25;

const RECHARGE_RAPID_PER_MIN = 15;
const RECHARGE_PCT_MIN = 10;
const RECHARGE_PCT_BASELINE_MAX = 100;
const RECHARGE_PER_MIN_AT_MIN_PCT = 3;
const RECHARGE_PER_MIN_AT_BASELINE_MAX = 10;

export function getSeedProductionDisplayPercent(seedProductionLevel: number, goldenPotCount: number): number {
  const L = Math.min(9, Math.max(0, seedProductionLevel));
  const base = Math.min(100, 10 + L * 10);
  return hasGoldenPotSeedSpeed25(goldenPotCount) ? base + GOLDEN_POT_SEED_SPEED_BONUS_PCT : base;
}

export function getHarvestSpeedDisplayPercent(harvestSpeedLevel: number, goldenPotCount: number): number {
  const L = Math.min(9, Math.max(0, harvestSpeedLevel));
  const base = Math.min(100, 10 + L * 10);
  return hasGoldenPotHarvestSpeed25(goldenPotCount) ? base + GOLDEN_POT_HARVEST_SPEED_BONUS_PCT : base;
}

/** Offline coin multiplier from golden pot milestones (1 = none). */
export function getGoldenPotOfflineEarningsMultiplier(goldenPotCount: number): number {
  return hasGoldenPotOfflineEarnings25(goldenPotCount) ? GOLDEN_POT_OFFLINE_EARNINGS_MULTIPLIER : 1;
}

/** Apply Offline Boost (+25%) to a raw offline earnings total for popup display / collect. */
export function applyGoldenPotOfflineEarningsBonus(
  rawTotal: number,
  globalGoldenPotCount: number,
): number {
  if (rawTotal <= 0) return 0;
  const mult = getGoldenPotOfflineEarningsMultiplier(globalGoldenPotCount);
  if (mult <= 1) return rawTotal;
  const boosted = rawTotal * mult;
  return Math.round(boosted / 5) * 5;
}

/** Persist unboosted bank so reload applies Offline Boost exactly once. */
export function getRawOfflineEarningsForSave(
  displayTotal: number,
  globalGoldenPotCount: number,
): number {
  if (displayTotal <= 0) return 0;
  const mult = getGoldenPotOfflineEarningsMultiplier(globalGoldenPotCount);
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
  goldenPotCount: number,
  hasRapidSeedsBoost: boolean
): number {
  if (hasRapidSeedsBoost) return RECHARGE_RAPID_PER_MIN;
  const pct = getSeedProductionDisplayPercent(seedProductionLevel, goldenPotCount);
  return getRechargePerMinuteForDisplayPercent(pct);
}

export function getHarvestRechargePerMinute(
  harvestSpeedLevel: number,
  goldenPotCount: number,
  hasRapidHarvestBoost: boolean
): number {
  if (hasRapidHarvestBoost) return RECHARGE_RAPID_PER_MIN;
  const pct = getHarvestSpeedDisplayPercent(harvestSpeedLevel, goldenPotCount);
  return getRechargePerMinuteForDisplayPercent(pct);
}
