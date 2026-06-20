import type { UpgradeState } from '../types';
import type { HarvestState, SeedsState } from '../components/UpgradeList';
import {
  isBonusSeedMaxed,
  isCropYieldMaxed,
  isCustomerSpeedMaxed,
  isDoubleSeedsMaxed,
  isHappyCustomerMaxed,
  isMarketValueMaxed,
  isPlotExpansionMaxed,
  isSurplusRechargesMaxed,
} from '../components/UpgradeList';
import { WILD_GROWTH_UNLOCK_PLAYER_LEVEL } from '../constants/playerLevelUnlocks';
import { isWildGrowthMaxLevel, WILD_GROWTH_MAX_LEVEL } from './wildGrowth';

export const SEEDS_TAB_UPGRADE_IDS = [
  'seed_production',
  'double_seeds',
  'bonus_seeds',
] as const;

export const CROPS_TAB_UPGRADE_IDS = [
  'harvest_speed',
  'plot_expansion',
  'wild_growth',
  'crop_value',
] as const;

export const HARVEST_TAB_UPGRADE_IDS = [
  'customer_speed',
  'market_value',
  'seed_surplus',
  'happy_customer',
] as const;

export const ALL_PURCHASABLE_UPGRADE_IDS = [
  ...SEEDS_TAB_UPGRADE_IDS,
  ...CROPS_TAB_UPGRADE_IDS,
  ...HARVEST_TAB_UPGRADE_IDS,
] as const;

const UNLOCK_LEVEL_BY_ID: Record<string, number> = {
  seed_production: 1,
  double_seeds: 6,
  bonus_seeds: 9,
  harvest_speed: 1,
  plot_expansion: 2,
  wild_growth: WILD_GROWTH_UNLOCK_PLAYER_LEVEL,
  crop_value: 11,
  customer_speed: 1,
  market_value: 3,
  seed_surplus: 3,
  happy_customer: 12,
};

export type UpgradeTabId = 'SEEDS' | 'CROPS' | 'HARVEST';

export const UPGRADE_TAB_BY_ID: Record<string, UpgradeTabId> = {
  seed_production: 'SEEDS',
  double_seeds: 'SEEDS',
  bonus_seeds: 'SEEDS',
  harvest_speed: 'CROPS',
  plot_expansion: 'CROPS',
  wild_growth: 'CROPS',
  crop_value: 'CROPS',
  customer_speed: 'HARVEST',
  market_value: 'HARVEST',
  seed_surplus: 'HARVEST',
  happy_customer: 'HARVEST',
};

export interface UpgradeGateContext {
  playerLevel: number;
  lockedCellCount: number;
  goldenPotCount: number;
  seedsState: SeedsState;
  harvestState: HarvestState;
  cropsState: Record<string, UpgradeState>;
}

function getUpgradeLevel(upgradeId: string, ctx: UpgradeGateContext): number {
  if (upgradeId === 'seed_surplus') {
    return ctx.seedsState.seed_surplus?.level ?? 0;
  }
  if ((SEEDS_TAB_UPGRADE_IDS as readonly string[]).includes(upgradeId)) {
    return ctx.seedsState[upgradeId]?.level ?? 0;
  }
  if ((CROPS_TAB_UPGRADE_IDS as readonly string[]).includes(upgradeId)) {
    return ctx.cropsState[upgradeId]?.level ?? 0;
  }
  return ctx.harvestState[upgradeId]?.level ?? 0;
}

export function isUpgradeUnlockedForPlayer(upgradeId: string, playerLevel: number): boolean {
  return playerLevel >= (UNLOCK_LEVEL_BY_ID[upgradeId] ?? 1);
}

export function isUpgradeMaxedForDailyTasks(upgradeId: string, ctx: UpgradeGateContext): boolean {
  const level = getUpgradeLevel(upgradeId, ctx);
  switch (upgradeId) {
    case 'seed_production':
      return level >= 9;
    case 'seed_surplus':
      return isSurplusRechargesMaxed(ctx.seedsState);
    case 'double_seeds':
      return isDoubleSeedsMaxed(ctx.seedsState);
    case 'bonus_seeds':
      return isBonusSeedMaxed(ctx.seedsState);
    case 'harvest_speed':
      return level >= 9;
    case 'plot_expansion':
      return isPlotExpansionMaxed(ctx.lockedCellCount);
    case 'wild_growth':
      return isWildGrowthMaxLevel(level);
    case 'crop_value':
      return isCropYieldMaxed(ctx.cropsState);
    case 'customer_speed':
      return isCustomerSpeedMaxed(ctx.harvestState, ctx.goldenPotCount);
    case 'market_value':
      return isMarketValueMaxed(ctx.harvestState);
    case 'happy_customer':
      return isHappyCustomerMaxed(ctx.harvestState);
    default:
      return false;
  }
}

export function getRemainingPurchasesForUpgrade(
  upgradeId: string,
  ctx: UpgradeGateContext,
): number {
  if (!isUpgradeUnlockedForPlayer(upgradeId, ctx.playerLevel)) return 0;
  if (isUpgradeMaxedForDailyTasks(upgradeId, ctx)) return 0;

  const level = getUpgradeLevel(upgradeId, ctx);
  switch (upgradeId) {
    case 'plot_expansion':
      return Math.max(0, ctx.lockedCellCount);
    case 'seed_production':
    case 'harvest_speed':
    case 'crop_value':
    case 'seed_surplus':
      return Math.max(0, 9 - level);
    case 'wild_growth':
      return Math.max(0, WILD_GROWTH_MAX_LEVEL - level);
    case 'double_seeds':
    case 'bonus_seeds':
    case 'customer_speed':
    case 'market_value':
    case 'happy_customer':
      return Math.max(0, 10 - level);
    default:
      return 0;
  }
}

export function countRemainingPurchases(
  upgradeIds: readonly string[],
  ctx: UpgradeGateContext,
): number {
  return upgradeIds.reduce((sum, id) => sum + getRemainingPurchasesForUpgrade(id, ctx), 0);
}

export function countAllRemainingUpgradePurchases(ctx: UpgradeGateContext): number {
  return countRemainingPurchases(ALL_PURCHASABLE_UPGRADE_IDS, ctx);
}

export function canRollPurchaseUpgradeTask(slot: 1 | 2 | 3, ctx: UpgradeGateContext): boolean {
  return countAllRemainingUpgradePurchases(ctx) >= slot;
}

export function canRollExpandGardenTask(ctx: UpgradeGateContext): boolean {
  return (
    ctx.lockedCellCount > 0 &&
    isUpgradeUnlockedForPlayer('plot_expansion', ctx.playerLevel) &&
    !isPlotExpansionMaxed(ctx.lockedCellCount)
  );
}

export function canRollTabUpgradeTask(
  tab: UpgradeTabId,
  slot: 1 | 2 | 3,
  ctx: UpgradeGateContext,
): boolean {
  const ids =
    tab === 'SEEDS'
      ? SEEDS_TAB_UPGRADE_IDS
      : tab === 'CROPS'
        ? CROPS_TAB_UPGRADE_IDS
        : HARVEST_TAB_UPGRADE_IDS;
  return countRemainingPurchases(ids, ctx) >= slot;
}
