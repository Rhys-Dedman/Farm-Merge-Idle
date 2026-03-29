/**
 * Golden pot count = `plantMastery.unlockedLevels.length` (tiers 1–24).
 * Thresholds match `GOLD_POT_BONUS_TIERS` in GoldenPotBonusesPopup.
 */
export const GOLDEN_POT_BONUS_OFFLINE_2X_AT = 4;
export const GOLDEN_POT_BONUS_INSTANT_ORDERS_AT = 8;
export const GOLDEN_POT_BONUS_PRODUCTION_150_AT = 12;
export const GOLDEN_POT_BONUS_HARVEST_150_AT = 16;
export const GOLDEN_POT_BONUS_MERGE_COINS_2X_AT = 20;
export const GOLDEN_POT_BONUS_AUTO_MERGE_AT = 24;

export function hasGoldenPotOfflineEarningsDouble(count: number): boolean {
  return count >= GOLDEN_POT_BONUS_OFFLINE_2X_AT;
}

export function hasGoldenPotInstantOrders(count: number): boolean {
  return count >= GOLDEN_POT_BONUS_INSTANT_ORDERS_AT;
}

export function hasGoldenPotProduction150(count: number): boolean {
  return count >= GOLDEN_POT_BONUS_PRODUCTION_150_AT;
}

export function hasGoldenPotHarvest150(count: number): boolean {
  return count >= GOLDEN_POT_BONUS_HARVEST_150_AT;
}

export function hasGoldenPotMergeCoinsDouble(count: number): boolean {
  return count >= GOLDEN_POT_BONUS_MERGE_COINS_2X_AT;
}

export function hasGoldenPotAutoMergeUnlocked(count: number): boolean {
  return count >= GOLDEN_POT_BONUS_AUTO_MERGE_AT;
}

/**
 * Upgrade list shows Production/Harvest speed as 10% + 10% per level (max 100%); golden pot tiers show 150%.
 * Recharge bars use the same scale: linear from 10%→3/min to 100%→10/min, extrapolated to 150%.
 */
const RECHARGE_RAPID_PER_MIN = 15;
const RECHARGE_PCT_MIN = 10;
const RECHARGE_PCT_BASELINE_MAX = 100;
const RECHARGE_PER_MIN_AT_MIN_PCT = 3;
const RECHARGE_PER_MIN_AT_BASELINE_MAX = 10;

export function getSeedProductionDisplayPercent(seedProductionLevel: number, goldenPotCount: number): number {
  if (hasGoldenPotProduction150(goldenPotCount)) return 150;
  const L = Math.min(9, Math.max(0, seedProductionLevel));
  return Math.min(100, 10 + L * 10);
}

export function getHarvestSpeedDisplayPercent(harvestSpeedLevel: number, goldenPotCount: number): number {
  if (hasGoldenPotHarvest150(goldenPotCount)) return 150;
  const L = Math.min(9, Math.max(0, harvestSpeedLevel));
  return Math.min(100, 10 + L * 10);
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

