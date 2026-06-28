import { assetPath } from './assetPath';
import {
  getGardenCoinIconPath,
  getGoalIconPathForGarden,
} from './gardenAssets';
import type { BoardCell } from '../types';
import type { DailyTaskDefinition, DailyTaskRowState } from '../components/DailyTaskRow';
import {
  DAILY_TASK_CATALOG,
  DAILY_TASK_BOOSTER_POOL_IDS,
  DAILY_TASK_CORE_POOL_IDS,
  DAILY_TASK_DISCOVERY_POOL_IDS,
  DAILY_TASK_GAMEPLAY_EXTRA_POOL_IDS,
  DAILY_TASK_HARVEST_EXTRA_POOL_IDS,
  DAILY_TASK_MERGING_EXTRA_POOL_IDS,
  DAILY_TASK_PLANTS_EXTRA_POOL_IDS,
  DAILY_TASK_ORDERS_EXTRA_POOL_IDS,
  DAILY_TASK_UPGRADE_POOL_IDS,
  type DailyTaskCatalogCategory,
  type DailyTaskPoolId,
} from '../constants/dailyTaskCatalog';
import { getPlantDisplayName } from '../constants/plantData';
import { MAX_PLANT_TIER } from '../constants/plants';
import { SHIPPED_GARDEN_IDS, type GardenId } from '../constants/gardens';
import {
  clearAllDailyTasksDayStorage,
  DAILY_TASKS_DAY_STATE_LEGACY_KEY,
  getDailyTasksActiveGarden,
  getDailyTasksDayStateStorageKey,
} from './dailyTasksGardenScope';
import {
  canRollExpandGardenTask,
  canRollPurchaseUpgradeTask,
  canRollTabUpgradeTask,
  type UpgradeGateContext,
  type UpgradeTabId,
  UPGRADE_TAB_BY_ID,
} from './dailyTaskUpgradeGates';
import {
  canRollGrowPlantsDailyTask,
  canRollPlantTargetDailyTask,
  getEligibleDailyTaskPlantLevels,
  getAvailableGrowPlantsDailyTaskLevels,
  getEligibleGrowPlantsDailyTaskLevels,
} from './dailyTaskPlantTargets';
import { canRollGoldenPotDailyTask } from './dailyTaskGoldenPotGate';
import {
  readDailyTasksCountdownEndMs,
  startDailyTasksCountdown,
} from './dailyTasksCountdown';
import { getCropYieldPerHarvest } from '../components/UpgradeList';
import { getLevelUpTaskSlot } from './playerLevelGoals';
import { getGoalIconForPlantLevel } from './plantGoalIcons';
import { getDailyTaskRewardCoins } from './dailyTaskRewards';
import { hasGoldenPotExtraTasks } from '../constants/goldenPotBonuses';

export type DailyTaskSlot = 1 | 2 | 3 | 4;

/** Reward + roll rules tier (extra slot 4 mirrors slot 2). */
export function getDailyTaskSlotTier(slot: DailyTaskSlot): 1 | 2 | 3 {
  return slot === 4 ? 2 : slot;
}

const DAILY_TASK_DISPLAY_ORDER: Record<DailyTaskSlot, number> = {
  1: 0,
  2: 1,
  4: 2,
  3: 3,
};

function sortTasksForDisplay(tasks: DailyTaskInstanceState[]): DailyTaskInstanceState[] {
  return [...tasks].sort(
    (a, b) => DAILY_TASK_DISPLAY_ORDER[a.slot] - DAILY_TASK_DISPLAY_ORDER[b.slot],
  );
}

function hasExtraDailyTaskSlot(ctx: DailyTaskRollContext): boolean {
  return hasGoldenPotExtraTasks(ctx.globalGoldenPotCount ?? 0);
}

/** @deprecated Use per-garden keys via `getDailyTasksDayStateStorageKey`. */
export const DAILY_TASKS_DAY_STATE_KEY = DAILY_TASKS_DAY_STATE_LEGACY_KEY;
const SLOT_1_ONLY: ReadonlySet<DailyTaskPoolId> = new Set([
  'seed_rush',
  'fill_garden_seeds',
  'harvest_three_cells',
  'coin_order',
  'activate_any_booster',
  'claim_free_store_offer',
]);
const SLOT_2_ONLY: ReadonlySet<DailyTaskPoolId> = new Set([
  'discover_plant',
  'expand_garden_slot',
  'order_rush',
]);
const SLOT_3_ONLY: ReadonlySet<DailyTaskPoolId> = new Set(['collection_upgrade']);
const SINGLE_COUNT_TASKS: ReadonlySet<DailyTaskPoolId> = new Set([
  'discover_plant',
  'harvest_three_cells',
  'expand_garden_slot',
  'level_up',
  'coin_order',
  'collection_upgrade',
  'activate_any_booster',
  'claim_free_store_offer',
]);

const HARVEST_THREE_CELLS_REQUIRED = 3;

const TEMPLATE_CATEGORY_BY_ID = Object.fromEntries(
  DAILY_TASK_CATALOG.map((entry) => [entry.id, entry.category]),
) as Record<DailyTaskPoolId, DailyTaskCatalogCategory>;

function getTemplateCategory(templateId: DailyTaskPoolId): DailyTaskCatalogCategory {
  return TEMPLATE_CATEGORY_BY_ID[templateId];
}

function isPlantTargetTask(templateId: DailyTaskPoolId): boolean {
  return templateId === 'merge_specific_plant' || templateId === 'create_specific_plant';
}

function getTemplateIcon(templateId: DailyTaskPoolId): string {
  if (templateId === 'merge_coins' || templateId === 'upgrade_harvest_tab') {
    return getGardenCoinIconPath();
  }
  if (templateId === 'upgrade_crops_tab') {
    return getGoalIconPathForGarden(14);
  }
  return TEMPLATE_META[templateId].icon;
}

function pickPlantLevelForTask(
  templateId: DailyTaskPoolId,
  highestPlantEver: number,
  pickedIcons: Set<string>,
  excludePlantLevels: ReadonlySet<number> = new Set(),
): number | undefined {
  const eligible =
    templateId === 'create_specific_plant'
      ? getEligibleGrowPlantsDailyTaskLevels(highestPlantEver)
      : getEligibleDailyTaskPlantLevels(highestPlantEver);
  let available = eligible.filter(
    (level) =>
      !pickedIcons.has(getGoalIconForPlantLevel(level)) && !excludePlantLevels.has(level),
  );
  if (
    available.length === 0 &&
    excludePlantLevels.size > 0 &&
    templateId !== 'create_specific_plant'
  ) {
    available = eligible.filter((level) => !pickedIcons.has(getGoalIconForPlantLevel(level)));
  }
  if (available.length === 0) return undefined;
  return available[Math.floor(Math.random() * available.length)];
}

function buildRollExclusionsFromPreviousTasks(previousTasks: DailyTaskInstanceState[]): Set<string> {
  const excludeTemplateIds = new Set<string>();
  for (const task of previousTasks) {
    if (task.templateId === 'create_specific_plant') continue;
    excludeTemplateIds.add(task.templateId);
  }
  return excludeTemplateIds;
}

function pickWeightedTemplate(pool: DailyTaskPoolId[]): DailyTaskPoolId {
  let totalWeight = 0;
  const weights = pool.map((id) => {
    const w = id === 'create_specific_plant' ? GROW_PLANTS_ROLL_WEIGHT : 1;
    totalWeight += w;
    return w;
  });
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
}

function getTaskIconForInstance(task: DailyTaskInstanceState): string {
  if (task.targetPlantLevel != null && isPlantTargetTask(task.templateId)) {
    return getGoalIconForPlantLevel(task.targetPlantLevel);
  }
  if (task.templateId === 'merge_coins' || task.templateId === 'upgrade_harvest_tab') {
    return getGardenCoinIconPath();
  }
  if (task.templateId === 'upgrade_crops_tab') {
    return getGoalIconPathForGarden(14);
  }
  return TEMPLATE_META[task.templateId].icon;
}

const QUANTITY_BY_SLOT: Record<
  | 'playtime_minutes'
  | 'complete_orders'
  | 'plant_seeds'
  | 'merge_plants'
  | 'merge_specific_plant'
  | 'merge_coins'
  | 'harvest_from_merge'
  | 'purchase_upgrade'
  | 'upgrade_harvest_tab'
  | 'upgrade_crops_tab'
  | 'upgrade_seeds_tab',
  readonly [number, number, number]
> = {
  playtime_minutes: [5, 10, 15],
  complete_orders: [5, 10, 15],
  plant_seeds: [5, 15, 30],
  merge_plants: [5, 15, 30],
  merge_specific_plant: [1, 2, 3],
  merge_coins: [150, 300, 750],
  harvest_from_merge: [5, 10, 15],
  purchase_upgrade: [1, 2, 3],
  upgrade_harvest_tab: [1, 2, 3],
  upgrade_crops_tab: [1, 2, 3],
  upgrade_seeds_tab: [1, 2, 3],
};

const SEED_RUSH_TARGET = 5;
const SEED_RUSH_WINDOW_MS = 5000;
const ORDER_RUSH_TARGET = 3;
const ORDER_RUSH_WINDOW_MS = 30000;
/** Base crop targets before Crop Yield multiplier (slot 1 / 2 / 3). */
const HARVEST_CROPS_BASE_BY_SLOT: readonly [number, number, number] = [10, 20, 40];
/** Grow Plants is ~4× as likely as any other eligible task per slot (still not guaranteed). */
const GROW_PLANTS_ROLL_WEIGHT = 4;
const GROW_PLANTS_TARGETS_BY_SLOT: readonly [number, number, number] = [2, 3, 5];

const TEMPLATE_META: Record<
  DailyTaskPoolId,
  { title: string; description: string; icon: string }
> = {
  plant_seeds: {
    title: 'Plant Seeds',
    description: 'Plant {n} seeds in your garden.',
    icon: assetPath('/assets/icons/upgrades/icon_plantseed.png'),
  },
  fill_garden_seeds: {
    title: 'Fill Garden',
    description: 'Fill all {n} plots in your garden.',
    icon: assetPath('/assets/icons/upgrades/icon_fillgarden.png'),
  },
  seed_rush: {
    title: 'Seed Rush',
    description: 'Plant {n} seeds within {s} seconds.',
    icon: assetPath('/assets/icons/upgrades/icon_seedproduction.png'),
  },
  merge_plants: {
    title: 'Merge Plants',
    description: 'Merge {n} plants in your garden.',
    icon: assetPath('/assets/icons/upgrades/icon_luckymerge.png'),
  },
  merge_specific_plant: {
    title: 'Plant Merge',
    description: 'Merge {p} together {n} times.',
    icon: assetPath('/assets/icons/upgrades/icon_luckymerge.png'),
  },
  create_specific_plant: {
    title: 'Grow Plants',
    description: 'Produce {n} unique {x} plants.',
    icon: assetPath('/assets/icons/upgrades/icon_luckymerge.png'),
  },
  merge_coins: {
    title: 'Merge Coins',
    description: 'Earn {n} coins from merging plants.',
    icon: assetPath('/assets/icons/coins/icon_coin_garden_1.png'),
  },
  harvest_crops: {
    title: 'Harvest Crops',
    description: 'Harvest {n} crops from your garden.',
    icon: assetPath('/assets/icons/upgrades/icon_harvest.png'),
  },
  harvest_from_merge: {
    title: 'Merge Harvest',
    description: 'Harvest {n} crops from merging.',
    icon: assetPath('/assets/icons/upgrades/icon_mergeharvest.png'),
  },
  complete_orders: {
    title: 'Fill Orders',
    description: 'Complete {n} customer orders.',
    icon: assetPath('/assets/icons/upgrades/icon_customerspeed.png'),
  },
  playtime_minutes: {
    title: 'Play Today',
    description: 'Play for {n} minutes today.',
    icon: assetPath('/assets/icons/upgrades/icon_timer_large.png'),
  },
  harvest_three_cells: {
    title: 'Multi Harvest',
    description: 'Harvest from 3 garden cells in a single harvest.',
    icon: assetPath('/assets/icons/upgrades/icon_harvest.png'),
  },
  order_rush: {
    title: 'Order Rush',
    description: 'Complete {n} orders in under {s} seconds.',
    icon: assetPath('/assets/icons/upgrades/icon_customerspeed.png'),
  },
  merge_only_order: {
    title: 'Merge Order',
    description: 'Complete {n} orders using only merged plants.',
    icon: assetPath('/assets/icons/upgrades/icon_luckymerge.png'),
  },
  coin_order: {
    title: 'Coin Order',
    description: 'Collect the coin order reward.',
    icon: assetPath('/assets/icons/coins/icon_coin_watchad.png'),
  },
  discover_plant: {
    title: 'Discover Plant',
    description: 'Discover a new plant in your garden.',
    icon: assetPath('/assets/icons/upgrades/icon_discoverplant.png'),
  },
  purchase_upgrade: {
    title: 'Buy Upgrade',
    description: 'Purchase {n} upgrades from any upgrade tab.',
    icon: assetPath('/assets/icons/upgrades/icon_marketvalue.png'),
  },
  expand_garden_slot: {
    title: 'Expand Garden',
    description: 'Unlock one more garden plot.',
    icon: assetPath('/assets/icons/upgrades/icon_plotexpansion.png'),
  },
  upgrade_harvest_tab: {
    title: 'Market Upgrade',
    description: 'Buy {n} upgrades in the Market tab.',
    icon: assetPath('/assets/icons/coins/icon_coin_garden_1.png'),
  },
  upgrade_crops_tab: {
    title: 'Garden Upgrade',
    description: 'Buy {n} upgrades in the Garden tab.',
    icon: assetPath('/assets/icons/goals/garden_1/icon_goal_14.png'),
  },
  upgrade_seeds_tab: {
    title: 'Seeds Upgrade',
    description: 'Buy {n} upgrades in the Seeds tab.',
    icon: assetPath('/assets/icons/upgrades/icon_plantseed.png'),
  },
  level_up: {
    title: 'Level Up',
    description: 'Level up your garden level.',
    icon: assetPath('/assets/icons/upgrades/icon_levelup.png'),
  },
  collection_upgrade: {
    title: 'Golden Pot',
    description: 'Upgrade {n} plant in the collection screen to unlock a golden pot.',
    icon: assetPath('/assets/icons/collection/icon_goldenpot.png'),
  },
  activate_any_booster: {
    title: 'Use Booster',
    description: 'Activate any booster.',
    icon: assetPath('/assets/icons/upgrades/icon_harvestboost.png'),
  },
  claim_free_store_offer: {
    title: 'Free Offer',
    description: 'Claim a {free} store offer.',
    icon: assetPath('/assets/icons/upgrades/icon_freeoffer.png'),
  },
};

export interface GardenPlotStats {
  unlockedPlotCount: number;
  filledPlotCount: number;
}

export interface DailyTaskRollContext extends UpgradeGateContext {
  stats: GardenPlotStats;
  highestPlantEver: number;
  maxPlantTier: number;
  playerLevelProgress: number;
  plantMasteryUnlockPendingCount: number;
  /** Account-wide golden pot count (max across gardens); drives Daily Rewards 2×. */
  globalGoldenPotCount?: number;
  /** Garden 1 player level — collection unlock is global once this reaches unlock level. */
  garden1PlayerLevel?: number;
}

export function getGardenPlotStats(grid: BoardCell[]): GardenPlotStats {
  const unlocked = grid.filter((c) => !c.locked);
  return {
    unlockedPlotCount: unlocked.length,
    filledPlotCount: unlocked.filter((c) => c.item != null).length,
  };
}

export function getDailyTaskRollContext(
  grid: BoardCell[],
  highestPlantEver: number,
  upgradeCtx: UpgradeGateContext & {
    playerLevelProgress?: number;
    plantMasteryUnlockPendingCount?: number;
  },
  maxPlantTier = MAX_PLANT_TIER,
): DailyTaskRollContext {
  return {
    stats: getGardenPlotStats(grid),
    highestPlantEver: Math.max(0, Math.floor(highestPlantEver)),
    maxPlantTier,
    ...upgradeCtx,
    playerLevelProgress: Math.max(0, Math.floor(upgradeCtx.playerLevelProgress ?? 0)),
    plantMasteryUnlockPendingCount: Math.max(
      0,
      Math.floor(upgradeCtx.plantMasteryUnlockPendingCount ?? 0),
    ),
  };
}

export function playerHasUndiscoveredPlants(
  highestPlantEver: number,
  maxPlantTier = MAX_PLANT_TIER,
): boolean {
  return highestPlantEver < maxPlantTier;
}

export interface DailyTaskInstanceState {
  instanceId: string;
  templateId: DailyTaskPoolId;
  slot: DailyTaskSlot;
  progress: number;
  target: number;
  claimed: boolean;
  fillGardenLocked?: boolean;
  seedRushWindowStartMs?: number | null;
  seedRushWindowCount?: number;
  orderRushWindowStartMs?: number | null;
  orderRushWindowCount?: number;
  /** Plant level for Plant Merge / Grow Plants (goal icon + name at roll). */
  targetPlantLevel?: number;
}

export interface DailyTasksDayState {
  v: 1;
  periodEndMs: number;
  tasks: DailyTaskInstanceState[];
  /** Template ids from the previous period — excluded on the next roll. */
  excludeTemplateIds: string[];
  /** Last plant level used for Grow Plants — never repeat until another is viable. */
  lastGrowPlantLevel?: number;
  playtimeMs: number;
}

function parseDayStateRaw(raw: string | null): DailyTasksDayState | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as DailyTasksDayState;
    if (data?.v !== 1 || !Array.isArray(data.tasks)) return null;
    if (data.lastGrowPlantLevel == null) {
      const fromTask = data.tasks.find((t) => t.templateId === 'create_specific_plant')
        ?.targetPlantLevel;
      if (fromTask != null) data.lastGrowPlantLevel = fromTask;
    }
    return data;
  } catch {
    return null;
  }
}

function readDayStateForGarden(gardenId: GardenId): DailyTasksDayState | null {
  try {
    const key = getDailyTasksDayStateStorageKey(gardenId);
    let raw = localStorage.getItem(key);
    if (!raw && gardenId === 'garden_1') {
      raw = localStorage.getItem(DAILY_TASKS_DAY_STATE_LEGACY_KEY);
      if (raw) {
        localStorage.setItem(key, raw);
        localStorage.removeItem(DAILY_TASKS_DAY_STATE_LEGACY_KEY);
      }
    }
    return parseDayStateRaw(raw);
  } catch {
    return null;
  }
}

function readDayState(): DailyTasksDayState | null {
  return readDayStateForGarden(getDailyTasksActiveGarden());
}

/** Template ids already assigned to other gardens for the same daily period. */
function getOtherGardensActiveTemplateIds(
  periodEndMs: number,
  forGardenId: GardenId = getDailyTasksActiveGarden(),
): Set<string> {
  const exclude = new Set<string>();
  for (const gardenId of SHIPPED_GARDEN_IDS) {
    if (gardenId === forGardenId) continue;
    const state = readDayStateForGarden(gardenId);
    if (!state || state.periodEndMs !== periodEndMs) continue;
    for (const task of state.tasks) {
      exclude.add(task.templateId);
    }
  }
  return exclude;
}

function writeDayState(state: DailyTasksDayState): void {
  try {
    localStorage.setItem(getDailyTasksDayStateStorageKey(), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function hasRemovedDailyTaskTemplates(state: DailyTasksDayState): boolean {
  return state.tasks.some((t) => !(t.templateId in TEMPLATE_META));
}

/** Re-roll when persisted tasks reference templates removed from the catalog. */
function rerollStaleDayState(
  state: DailyTasksDayState,
  ctx: DailyTaskRollContext,
): DailyTasksDayState {
  const previousTasks = state.tasks.filter(
    (t): t is DailyTaskInstanceState => t.templateId in TEMPLATE_META,
  );
  return rollDailyTasksDay(
    ctx,
    state.periodEndMs,
    previousTasks,
    state.lastGrowPlantLevel,
    getOtherGardensActiveTemplateIds(state.periodEndMs),
  );
}

function getDescriptionValues(
  task: DailyTaskInstanceState,
): Record<string, number | string> {
  const gardenId = getDailyTasksActiveGarden();
  if (task.templateId === 'seed_rush') {
    return { n: SEED_RUSH_TARGET, s: SEED_RUSH_WINDOW_MS / 1000 };
  }
  if (task.templateId === 'order_rush') {
    return { n: ORDER_RUSH_TARGET, s: ORDER_RUSH_WINDOW_MS / 1000 };
  }
  if (task.templateId === 'claim_free_store_offer') {
    return { free: 'free' };
  }
  if (task.templateId === 'create_specific_plant' && task.targetPlantLevel != null) {
    return {
      n: task.target,
      x: getPlantDisplayName(task.targetPlantLevel, gardenId),
    };
  }
  if (task.targetPlantLevel != null && isPlantTargetTask(task.templateId)) {
    return {
      n: task.target,
      p: getPlantDisplayName(task.targetPlantLevel, gardenId),
    };
  }
  return { n: task.target };
}

function rowState(task: DailyTaskInstanceState): DailyTaskRowState {
  if (task.claimed) return 'claimed';
  if (task.progress >= task.target) return 'complete';
  return 'in_progress';
}

function resolveTarget(
  templateId: DailyTaskPoolId,
  slot: DailyTaskSlot,
  ctx: DailyTaskRollContext,
): number {
  const slotTier = getDailyTaskSlotTier(slot);
  if (SINGLE_COUNT_TASKS.has(templateId)) return 1;
  if (templateId === 'seed_rush') return SEED_RUSH_TARGET;
  if (templateId === 'order_rush') return ORDER_RUSH_TARGET;
  if (templateId === 'merge_only_order') return slotTier;
  if (templateId === 'fill_garden_seeds') return Math.max(1, ctx.stats.unlockedPlotCount);
  if (templateId === 'harvest_crops') {
    const cropYield = getCropYieldPerHarvest(ctx.cropsState);
    return HARVEST_CROPS_BASE_BY_SLOT[slotTier - 1] * cropYield;
  }
  if (templateId === 'create_specific_plant') {
    return GROW_PLANTS_TARGETS_BY_SLOT[slotTier - 1];
  }
  const qty = QUANTITY_BY_SLOT[templateId as keyof typeof QUANTITY_BY_SLOT];
  return qty[slotTier - 1];
}

function isGardenFull(stats: GardenPlotStats): boolean {
  return stats.unlockedPlotCount > 0 && stats.filledPlotCount >= stats.unlockedPlotCount;
}

function rollPoolForContext(
  ctx: DailyTaskRollContext,
  lastGrowPlantLevel?: number,
): DailyTaskPoolId[] {
  const pool: DailyTaskPoolId[] = [
    ...DAILY_TASK_CORE_POOL_IDS,
    ...DAILY_TASK_UPGRADE_POOL_IDS,
    ...DAILY_TASK_ORDERS_EXTRA_POOL_IDS,
    ...DAILY_TASK_HARVEST_EXTRA_POOL_IDS,
    ...DAILY_TASK_GAMEPLAY_EXTRA_POOL_IDS,
    ...DAILY_TASK_BOOSTER_POOL_IDS,
  ];
  if (canRollPlantTargetDailyTask(ctx.highestPlantEver)) {
    pool.push(...DAILY_TASK_MERGING_EXTRA_POOL_IDS);
  }
  if (canRollGrowPlantsDailyTask(ctx.highestPlantEver, lastGrowPlantLevel)) {
    pool.push(...DAILY_TASK_PLANTS_EXTRA_POOL_IDS);
  }
  if (playerHasUndiscoveredPlants(ctx.highestPlantEver, ctx.maxPlantTier)) {
    pool.push(...DAILY_TASK_DISCOVERY_POOL_IDS);
  }
  return pool;
}

function canRollUpgradeTemplate(
  templateId: DailyTaskPoolId,
  slot: DailyTaskSlot,
  ctx: DailyTaskRollContext,
): boolean {
  const slotTier = getDailyTaskSlotTier(slot);
  switch (templateId) {
    case 'purchase_upgrade':
      return canRollPurchaseUpgradeTask(slotTier, ctx);
    case 'expand_garden_slot':
      return slotTier === 2 && canRollExpandGardenTask(ctx);
    case 'upgrade_harvest_tab':
      return canRollTabUpgradeTask('HARVEST', slotTier, ctx);
    case 'upgrade_crops_tab':
      return canRollTabUpgradeTask('CROPS', slotTier, ctx);
    case 'upgrade_seeds_tab':
      return canRollTabUpgradeTask('SEEDS', slotTier, ctx);
    default:
      return true;
  }
}

function eligibleForSlot(
  templateId: DailyTaskPoolId,
  slot: DailyTaskSlot,
  picked: Set<string>,
  pickedCategories: Set<DailyTaskCatalogCategory>,
  pickedIcons: Set<string>,
  excludeTemplateIds: Set<string>,
  hardExcludeTemplateIds: Set<string>,
  ctx: DailyTaskRollContext,
  allowExcludedFromPrevious: boolean,
  allowDuplicateCategory: boolean,
  allowDuplicateIcon: boolean,
  lastGrowPlantLevel?: number,
): boolean {
  const slotTier = getDailyTaskSlotTier(slot);
  if (hardExcludeTemplateIds.has(templateId)) return false;
  if (picked.has(templateId)) return false;
  if (!allowDuplicateCategory && pickedCategories.has(getTemplateCategory(templateId))) return false;
  if (
    !allowDuplicateIcon &&
    !isPlantTargetTask(templateId) &&
    pickedIcons.has(getTemplateIcon(templateId))
  ) {
    return false;
  }
  if (slotTier > 1 && SLOT_1_ONLY.has(templateId)) return false;
  if (slotTier !== 2 && SLOT_2_ONLY.has(templateId)) return false;
  if (slotTier !== 3 && SLOT_3_ONLY.has(templateId)) return false;
  if (templateId === 'fill_garden_seeds' && isGardenFull(ctx.stats)) return false;
  if (
    templateId === 'discover_plant' &&
    !playerHasUndiscoveredPlants(ctx.highestPlantEver, ctx.maxPlantTier)
  ) {
    return false;
  }
  if ((DAILY_TASK_UPGRADE_POOL_IDS as readonly string[]).includes(templateId)) {
    if (!canRollUpgradeTemplate(templateId, slot, ctx)) return false;
  }
  if (templateId === 'level_up') {
    if (slotTier !== getLevelUpTaskSlot(ctx.playerLevel, ctx.playerLevelProgress)) return false;
  }
  if (templateId === 'merge_specific_plant' && !canRollPlantTargetDailyTask(ctx.highestPlantEver)) {
    return false;
  }
  if (templateId === 'create_specific_plant') {
    if (!canRollGrowPlantsDailyTask(ctx.highestPlantEver, lastGrowPlantLevel)) return false;
    const growPlantOptions = getAvailableGrowPlantsDailyTaskLevels(
      ctx.highestPlantEver,
      lastGrowPlantLevel,
    ).filter((level) => !pickedIcons.has(getGoalIconForPlantLevel(level)));
    if (growPlantOptions.length === 0) return false;
  }
  if (
    templateId === 'collection_upgrade' &&
    !canRollGoldenPotDailyTask(
      ctx.garden1PlayerLevel ?? ctx.playerLevel,
      ctx.plantMasteryUnlockPendingCount,
    )
  ) {
    return false;
  }
  if (!allowExcludedFromPrevious && excludeTemplateIds.has(templateId)) return false;
  return true;
}

function pickTemplateForSlot(
  slot: DailyTaskSlot,
  picked: Set<string>,
  pickedCategories: Set<DailyTaskCatalogCategory>,
  pickedIcons: Set<string>,
  excludeTemplateIds: Set<string>,
  hardExcludeTemplateIds: Set<string>,
  ctx: DailyTaskRollContext,
  lastGrowPlantLevel?: number,
): DailyTaskPoolId {
  const poolIds = rollPoolForContext(ctx, lastGrowPlantLevel);
  const strict = poolIds.filter((id) =>
    eligibleForSlot(
      id, slot, picked, pickedCategories, pickedIcons, excludeTemplateIds, hardExcludeTemplateIds, ctx,
      false, false, false, lastGrowPlantLevel,
    ),
  );
  const pool =
    strict.length > 0
      ? strict
      : poolIds.filter((id) =>
          eligibleForSlot(
            id, slot, picked, pickedCategories, pickedIcons, excludeTemplateIds, hardExcludeTemplateIds, ctx,
            true, false, false, lastGrowPlantLevel,
          ),
        );
  if (pool.length === 0) {
    const duplicateCategoryAllowed = poolIds.filter((id) =>
      eligibleForSlot(
        id, slot, picked, pickedCategories, pickedIcons, new Set(), hardExcludeTemplateIds, ctx,
        true, true, false, lastGrowPlantLevel,
      ),
    );
    if (duplicateCategoryAllowed.length > 0) {
      return pickWeightedTemplate(duplicateCategoryAllowed);
    }
    const duplicateIconAllowed = poolIds.filter((id) =>
      eligibleForSlot(
        id, slot, picked, new Set(), pickedIcons, new Set(), hardExcludeTemplateIds, ctx,
        true, true, false, lastGrowPlantLevel,
      ),
    );
    if (duplicateIconAllowed.length > 0) {
      return pickWeightedTemplate(duplicateIconAllowed);
    }
    return poolIds.filter(
      (id) => eligibleForSlot(
        id, slot, picked, new Set(), new Set(), new Set(), hardExcludeTemplateIds, ctx,
        true, true, true, lastGrowPlantLevel,
      ),
    )[0];
  }
  return pickWeightedTemplate(pool);
}

function buildRollSlots(ctx: DailyTaskRollContext): DailyTaskSlot[] {
  return hasExtraDailyTaskSlot(ctx) ? [1, 2, 4, 3] : [1, 2, 3];
}

function rollTaskForSlot(
  slot: DailyTaskSlot,
  picked: Set<string>,
  pickedCategories: Set<DailyTaskCatalogCategory>,
  pickedIcons: Set<string>,
  exclude: Set<string>,
  hardExcludeTemplateIds: Set<string>,
  ctx: DailyTaskRollContext,
  lastGrowPlantLevel?: number,
): DailyTaskInstanceState {
  const templateId = pickTemplateForSlot(
    slot, picked, pickedCategories, pickedIcons, exclude, hardExcludeTemplateIds, ctx, lastGrowPlantLevel,
  );
  const growPlantExclude =
    templateId === 'create_specific_plant' && lastGrowPlantLevel != null
      ? new Set([lastGrowPlantLevel])
      : new Set<number>();
  const targetPlantLevel = isPlantTargetTask(templateId)
    ? pickPlantLevelForTask(templateId, ctx.highestPlantEver, pickedIcons, growPlantExclude)
    : undefined;
  return {
    instanceId: `daily-slot-${slot}`,
    templateId,
    slot,
    progress: 0,
    target: resolveTarget(templateId, slot, ctx),
    claimed: false,
    fillGardenLocked: false,
    seedRushWindowStartMs: null,
    seedRushWindowCount: 0,
    orderRushWindowStartMs: null,
    orderRushWindowCount: 0,
    ...(targetPlantLevel != null ? { targetPlantLevel } : {}),
  };
}

/** Add slot-4 task mid-period when Extra Tasks bonus unlocks. */
function syncExtraDailyTaskSlot(state: DailyTasksDayState, ctx: DailyTaskRollContext): boolean {
  if (!hasExtraDailyTaskSlot(ctx)) return false;
  if (state.tasks.some((t) => t.slot === 4)) return false;

  const picked = new Set(state.tasks.map((t) => t.templateId));
  const pickedCategories = new Set(state.tasks.map((t) => getTemplateCategory(t.templateId)));
  const pickedIcons = new Set(state.tasks.map((t) => getTaskIconForInstance(t)));
  const exclude = buildRollExclusionsFromPreviousTasks([]);
  const hardExclude = getOtherGardensActiveTemplateIds(state.periodEndMs);

  const task = rollTaskForSlot(
    4,
    picked,
    pickedCategories,
    pickedIcons,
    exclude,
    hardExclude,
    ctx,
    state.lastGrowPlantLevel,
  );
  picked.add(task.templateId);
  state.tasks.push(task);
  return true;
}

export function rollDailyTasksDay(
  ctx: DailyTaskRollContext,
  periodEndMs: number,
  previousTasks: DailyTaskInstanceState[] = [],
  lastGrowPlantLevel?: number,
  hardExcludeTemplateIds: Set<string> = getOtherGardensActiveTemplateIds(
    periodEndMs,
    getDailyTasksActiveGarden(),
  ),
): DailyTasksDayState {
  const picked = new Set<string>();
  const pickedCategories = new Set<DailyTaskCatalogCategory>();
  const pickedIcons = new Set<string>();
  const exclude = buildRollExclusionsFromPreviousTasks(previousTasks);
  const tasks: DailyTaskInstanceState[] = [];

  for (const slot of buildRollSlots(ctx)) {
    const task = rollTaskForSlot(
      slot,
      picked,
      pickedCategories,
      pickedIcons,
      exclude,
      hardExcludeTemplateIds,
      ctx,
      lastGrowPlantLevel,
    );
    picked.add(task.templateId);
    pickedCategories.add(getTemplateCategory(task.templateId));
    pickedIcons.add(getTaskIconForInstance(task));
    tasks.push(task);
  }

  const rolledGrowPlantLevel = tasks.find((t) => t.templateId === 'create_specific_plant')
    ?.targetPlantLevel;

  return {
    v: 1,
    periodEndMs,
    tasks,
    excludeTemplateIds: [],
    lastGrowPlantLevel: rolledGrowPlantLevel ?? lastGrowPlantLevel,
    playtimeMs: 0,
  };
}

function expireSeedRushWindow(task: DailyTaskInstanceState, now: number): void {
  if (task.templateId !== 'seed_rush' || task.claimed || task.progress >= task.target) return;
  const start = task.seedRushWindowStartMs;
  if (start == null) return;
  if (now - start > SEED_RUSH_WINDOW_MS) {
    task.seedRushWindowStartMs = null;
    task.seedRushWindowCount = 0;
  }
}

function expireOrderRushWindow(task: DailyTaskInstanceState, now: number): void {
  if (task.templateId !== 'order_rush' || task.claimed || task.progress >= task.target) return;
  const start = task.orderRushWindowStartMs;
  if (start == null) return;
  if (now - start > ORDER_RUSH_WINDOW_MS) {
    task.orderRushWindowStartMs = null;
    task.orderRushWindowCount = 0;
  }
}

function syncFillGardenTask(task: DailyTaskInstanceState, stats: GardenPlotStats): void {
  if (task.templateId !== 'fill_garden_seeds' || task.claimed) return;
  if (task.fillGardenLocked) {
    task.progress = task.target;
    return;
  }
  task.target = Math.max(1, stats.unlockedPlotCount);
  const filled = Math.min(stats.filledPlotCount, task.target);
  task.progress = filled;
  if (stats.filledPlotCount >= task.target && task.target > 0) {
    task.fillGardenLocked = true;
    task.progress = task.target;
  }
}

function instanceToRow(
  task: DailyTaskInstanceState,
  ctx: DailyTaskRollContext,
  now: number,
): DailyTaskDefinition {
  const meta = TEMPLATE_META[task.templateId];
  let progressCurrent = task.progress;
  if (task.templateId === 'seed_rush') {
    expireSeedRushWindow(task, now);
    progressCurrent = task.seedRushWindowCount ?? 0;
    if (task.progress >= task.target) progressCurrent = task.target;
  }
  if (task.templateId === 'order_rush') {
    expireOrderRushWindow(task, now);
    progressCurrent = task.orderRushWindowCount ?? 0;
    if (task.progress >= task.target) progressCurrent = task.target;
  }
  if (task.templateId === 'fill_garden_seeds' && task.fillGardenLocked) {
    progressCurrent = task.target;
  }
  progressCurrent = Math.min(progressCurrent, task.target);
  const state = rowState({ ...task, progress: Math.max(task.progress, progressCurrent) });
  const globalGoldenPotCount = ctx.globalGoldenPotCount ?? ctx.goldenPotCount;
  return {
    id: task.instanceId,
    state,
    title: meta.title,
    description: meta.description,
    descriptionValues: getDescriptionValues(task),
    progressCurrent,
    progressTotal: task.target,
    rewardCoins: getDailyTaskRewardCoins(
      getDailyTaskSlotTier(task.slot),
      ctx.playerLevel,
      globalGoldenPotCount,
    ),
    iconSrc: getTaskIconForInstance(task),
  };
}

export function buildDailyTaskRowsFromState(
  state: DailyTasksDayState,
  ctx: DailyTaskRollContext,
  now = Date.now(),
): DailyTaskDefinition[] {
  for (const task of state.tasks) {
    expireSeedRushWindow(task, now);
    expireOrderRushWindow(task, now);
    if (task.templateId === 'fill_garden_seeds') syncFillGardenTask(task, ctx.stats);
    if (task.templateId === 'playtime_minutes' && !task.claimed) {
      task.progress = Math.min(Math.floor(state.playtimeMs / 60000), task.target);
    }
  }
  writeDayState(state);
  return sortTasksForDisplay(state.tasks).map((t) => instanceToRow(t, ctx, now));
}

export function ensureDailyTasksDay(
  ctx: DailyTaskRollContext,
  atTimeMs = Date.now(),
): DailyTaskDefinition[] {
  const endMs = readDailyTasksCountdownEndMs();
  let state = readDayState();

  if (endMs != null && state != null && state.periodEndMs !== endMs) {
    state = rollDailyTasksDay(
      ctx,
      endMs,
      state.tasks,
      state.lastGrowPlantLevel,
      getOtherGardensActiveTemplateIds(endMs),
    );
    writeDayState(state);
  } else if (state == null) {
    const periodEnd = endMs ?? startDailyTasksCountdown(atTimeMs);
    state = rollDailyTasksDay(
      ctx,
      periodEnd,
      [],
      undefined,
      getOtherGardensActiveTemplateIds(periodEnd),
    );
    writeDayState(state);
  } else if (hasRemovedDailyTaskTemplates(state)) {
    state = rerollStaleDayState(state, ctx);
    writeDayState(state);
  }

  if (syncExtraDailyTaskSlot(state, ctx)) {
    writeDayState(state);
  }

  return buildDailyTaskRowsFromState(state, ctx, atTimeMs);
}

export function rollDailyTasksNextPeriod(
  ctx: DailyTaskRollContext,
  atTimeMs = Date.now(),
): DailyTaskDefinition[] {
  const prev = readDayState();
  const periodEnd = startDailyTasksCountdown(atTimeMs);
  const state = rollDailyTasksDay(
    ctx,
    periodEnd,
    prev?.tasks ?? [],
    prev?.lastGrowPlantLevel,
    getOtherGardensActiveTemplateIds(periodEnd),
  );
  writeDayState(state);
  return buildDailyTaskRowsFromState(state, ctx, atTimeMs);
}

function mutateDayState(
  mutator: (state: DailyTasksDayState) => void,
  ctx: DailyTaskRollContext,
  atTimeMs = Date.now(),
): DailyTaskDefinition[] {
  let state = readDayState();
  if (!state) {
    ensureDailyTasksDay(ctx, atTimeMs);
    state = readDayState();
  }
  if (!state) return [];
  mutator(state);
  return buildDailyTaskRowsFromState(state, ctx, atTimeMs);
}

function devCompleteTaskInstance(
  task: DailyTaskInstanceState,
  state: DailyTasksDayState,
): void {
  task.progress = task.target;
  switch (task.templateId) {
    case 'fill_garden_seeds':
      task.fillGardenLocked = true;
      break;
    case 'seed_rush':
      task.seedRushWindowCount = task.target;
      break;
    case 'order_rush':
      task.orderRushWindowCount = task.target;
      break;
    case 'playtime_minutes':
      state.playtimeMs = Math.max(state.playtimeMs, task.target * 60_000);
      break;
    default:
      break;
  }
}

export function syncDailyTasksGrid(ctx: DailyTaskRollContext): DailyTaskDefinition[] {
  return mutateDayState((state) => {
    for (const task of state.tasks) {
      if (task.templateId === 'fill_garden_seeds') syncFillGardenTask(task, ctx.stats);
    }
  }, ctx);
}

export function recordDailyTaskSeedPlanted(
  ctx: DailyTaskRollContext,
  now = Date.now(),
): DailyTaskDefinition[] {
  return mutateDayState((state) => {
    for (const task of state.tasks) {
      if (task.claimed) continue;
      if (task.templateId === 'plant_seeds' && task.progress < task.target) {
        task.progress += 1;
      }
      if (task.templateId === 'seed_rush' && task.progress < task.target) {
        expireSeedRushWindow(task, now);
        if (task.seedRushWindowStartMs == null) {
          task.seedRushWindowStartMs = now;
          task.seedRushWindowCount = 1;
        } else {
          task.seedRushWindowCount = (task.seedRushWindowCount ?? 0) + 1;
        }
        if (
          (task.seedRushWindowCount ?? 0) >= SEED_RUSH_TARGET &&
          now - (task.seedRushWindowStartMs ?? now) <= SEED_RUSH_WINDOW_MS
        ) {
          task.progress = SEED_RUSH_TARGET;
        }
      }
    }
  }, ctx);
}

export interface DailyTaskMergeOptions {
  /** Level of the two plants merged together (same-level merge). */
  mergedPlantLevel?: number;
  /** Resulting plant level after the merge. */
  resultPlantLevel?: number;
}

export function recordDailyTaskMerge(
  ctx: DailyTaskRollContext,
  options: DailyTaskMergeOptions = {},
): DailyTaskDefinition[] {
  const mergedPlantLevel = options.mergedPlantLevel;
  const resultPlantLevel = options.resultPlantLevel;
  return mutateDayState((state) => {
    for (const task of state.tasks) {
      if (task.claimed) continue;
      if (task.templateId === 'merge_plants' && task.progress < task.target) {
        task.progress += 1;
      }
      if (
        mergedPlantLevel != null &&
        task.templateId === 'merge_specific_plant' &&
        task.targetPlantLevel === mergedPlantLevel &&
        task.progress < task.target
      ) {
        task.progress += 1;
      }
      if (
        resultPlantLevel != null &&
        task.templateId === 'create_specific_plant' &&
        task.targetPlantLevel === resultPlantLevel &&
        task.progress < task.target
      ) {
        task.progress += 1;
      }
    }
  }, ctx);
}

export function recordDailyTaskHarvestCrops(
  ctx: DailyTaskRollContext,
  cropCount: number,
): DailyTaskDefinition[] {
  if (cropCount <= 0) {
    const state = readDayState();
    if (!state) return ensureDailyTasksDay(ctx);
    return buildDailyTaskRowsFromState(state, ctx);
  }
  return mutateDayState((state) => {
    for (const task of state.tasks) {
      if (task.claimed || task.templateId !== 'harvest_crops') continue;
      if (task.progress < task.target) {
        task.progress = Math.min(task.target, task.progress + cropCount);
      }
    }
  }, ctx);
}

export function recordDailyTaskMergeHarvestCrops(
  ctx: DailyTaskRollContext,
  cropCount: number,
): DailyTaskDefinition[] {
  if (cropCount <= 0) {
    const state = readDayState();
    if (!state) return ensureDailyTasksDay(ctx);
    return buildDailyTaskRowsFromState(state, ctx);
  }
  return mutateDayState((state) => {
    for (const task of state.tasks) {
      if (task.claimed || task.templateId !== 'harvest_from_merge') continue;
      if (task.progress < task.target) {
        task.progress = Math.min(task.target, task.progress + cropCount);
      }
    }
  }, ctx);
}

export function recordDailyTaskHarvestThreeCells(
  ctx: DailyTaskRollContext,
  harvestedCellCount: number,
): DailyTaskDefinition[] {
  if (harvestedCellCount < HARVEST_THREE_CELLS_REQUIRED) {
    const state = readDayState();
    if (!state) return ensureDailyTasksDay(ctx);
    return buildDailyTaskRowsFromState(state, ctx);
  }
  return mutateDayState((state) => {
    for (const task of state.tasks) {
      if (task.claimed || task.templateId !== 'harvest_three_cells') continue;
      if (task.progress < task.target) task.progress = task.target;
    }
  }, ctx);
}

export interface DailyTaskOrderFulfilledOptions {
  /** Order fulfilled entirely from merge-sourced crops (no manual harvest). */
  mergeOnly?: boolean;
  now?: number;
}

export function recordDailyTaskOrderComplete(
  ctx: DailyTaskRollContext,
  options: DailyTaskOrderFulfilledOptions = {},
): DailyTaskDefinition[] {
  const now = options.now ?? Date.now();
  const mergeOnly = options.mergeOnly ?? false;
  return mutateDayState((state) => {
    for (const task of state.tasks) {
      if (task.claimed) continue;
      if (task.templateId === 'complete_orders' && task.progress < task.target) {
        task.progress += 1;
      }
      if (task.templateId === 'order_rush' && task.progress < task.target) {
        expireOrderRushWindow(task, now);
        if (task.orderRushWindowStartMs == null) {
          task.orderRushWindowStartMs = now;
          task.orderRushWindowCount = 1;
        } else {
          task.orderRushWindowCount = (task.orderRushWindowCount ?? 0) + 1;
        }
        if (
          (task.orderRushWindowCount ?? 0) >= ORDER_RUSH_TARGET &&
          now - (task.orderRushWindowStartMs ?? now) <= ORDER_RUSH_WINDOW_MS
        ) {
          task.progress = ORDER_RUSH_TARGET;
        }
      }
      if (mergeOnly && task.templateId === 'merge_only_order' && task.progress < task.target) {
        task.progress += 1;
      }
    }
  }, ctx);
}

export function recordDailyTaskUpgradePurchased(
  ctx: DailyTaskRollContext,
  upgradeId: string,
  /** Tab list the player purchased from (Seeds / Garden / Market). */
  purchaseTab?: UpgradeTabId,
): DailyTaskDefinition[] {
  const tab = purchaseTab ?? UPGRADE_TAB_BY_ID[upgradeId];
  return mutateDayState((state) => {
    for (const task of state.tasks) {
      if (task.claimed) continue;
      if (task.templateId === 'purchase_upgrade' && task.progress < task.target) {
        task.progress += 1;
      }
      if (upgradeId === 'plot_expansion' && task.templateId === 'expand_garden_slot') {
        if (task.progress < task.target) task.progress = task.target;
      }
      if (tab === 'HARVEST' && task.templateId === 'upgrade_harvest_tab' && task.progress < task.target) {
        task.progress += 1;
      }
      if (tab === 'CROPS' && task.templateId === 'upgrade_crops_tab' && task.progress < task.target) {
        task.progress += 1;
      }
      if (tab === 'SEEDS' && task.templateId === 'upgrade_seeds_tab' && task.progress < task.target) {
        task.progress += 1;
      }
    }
  }, ctx);
}

export function recordDailyTaskNewDiscovery(
  ctx: DailyTaskRollContext,
  newPlantLevel: number,
): DailyTaskDefinition[] {
  if (
    !playerHasUndiscoveredPlants(ctx.highestPlantEver, ctx.maxPlantTier) ||
    newPlantLevel !== ctx.highestPlantEver + 1
  ) {
    const state = readDayState();
    if (!state) return ensureDailyTasksDay(ctx);
    return buildDailyTaskRowsFromState(state, ctx);
  }
  return mutateDayState((state) => {
    for (const task of state.tasks) {
      if (task.claimed || task.templateId !== 'discover_plant') continue;
      if (task.progress < task.target) task.progress += 1;
    }
  }, ctx);
}

export function recordDailyTaskLevelUp(ctx: DailyTaskRollContext): DailyTaskDefinition[] {
  return mutateDayState((state) => {
    for (const task of state.tasks) {
      if (task.claimed || task.templateId !== 'level_up') continue;
      if (task.progress < task.target) task.progress = task.target;
    }
  }, ctx);
}

export function recordDailyTaskBoosterActivated(ctx: DailyTaskRollContext): DailyTaskDefinition[] {
  return mutateDayState((state) => {
    for (const task of state.tasks) {
      if (task.claimed || task.templateId !== 'activate_any_booster') continue;
      if (task.progress < task.target) task.progress = task.target;
    }
  }, ctx);
}

export function recordDailyTaskFreeOfferClaimed(ctx: DailyTaskRollContext): DailyTaskDefinition[] {
  return mutateDayState((state) => {
    for (const task of state.tasks) {
      if (task.claimed || task.templateId !== 'claim_free_store_offer') continue;
      if (task.progress < task.target) task.progress = task.target;
    }
  }, ctx);
}

export function recordDailyTaskCoinOrder(ctx: DailyTaskRollContext): DailyTaskDefinition[] {
  return mutateDayState((state) => {
    for (const task of state.tasks) {
      if (task.claimed || task.templateId !== 'coin_order') continue;
      if (task.progress < task.target) task.progress = task.target;
    }
  }, ctx);
}

export function recordDailyTaskMergeCoins(
  ctx: DailyTaskRollContext,
  amount: number,
): DailyTaskDefinition[] {
  if (amount <= 0) {
    const state = readDayState();
    if (!state) return ensureDailyTasksDay(ctx);
    return buildDailyTaskRowsFromState(state, ctx);
  }
  return mutateDayState((state) => {
    for (const task of state.tasks) {
      if (task.claimed || task.templateId !== 'merge_coins') continue;
      if (task.progress < task.target) {
        task.progress = Math.min(task.target, task.progress + amount);
      }
    }
  }, ctx);
}

export function recordDailyTaskGoldenPot(ctx: DailyTaskRollContext): DailyTaskDefinition[] {
  return mutateDayState((state) => {
    for (const task of state.tasks) {
      if (task.claimed || task.templateId !== 'collection_upgrade') continue;
      if (task.progress < task.target) task.progress = task.target;
    }
  }, ctx);
}

export function tickDailyTaskPlaytime(
  ctx: DailyTaskRollContext,
  deltaMs: number,
): DailyTaskDefinition[] {
  return mutateDayState((state) => {
    state.playtimeMs += deltaMs;
    for (const task of state.tasks) {
      if (task.claimed || task.templateId !== 'playtime_minutes') continue;
      task.progress = Math.min(Math.floor(state.playtimeMs / 60000), task.target);
    }
  }, ctx);
}

export function markDailyTaskClaimed(
  instanceId: string,
  ctx: DailyTaskRollContext,
): DailyTaskDefinition[] {
  return mutateDayState((state) => {
    const task = state.tasks.find((t) => t.instanceId === instanceId);
    if (task && !task.claimed) task.claimed = true;
  }, ctx);
}

export function markDailyTasksClaimed(
  instanceIds: string[],
  ctx: DailyTaskRollContext,
): DailyTaskDefinition[] {
  const idSet = new Set(instanceIds);
  return mutateDayState((state) => {
    for (const task of state.tasks) {
      if (
        idSet.has(task.instanceId) &&
        !task.claimed &&
        task.progress >= task.target
      ) {
        task.claimed = true;
      }
    }
  }, ctx);
}

/** Dev: complete the next incomplete task top-to-bottom (slot 1 → 2 → 4 → 3). Does not claim. */
export function completeNextDailyTaskForDev(
  ctx: DailyTaskRollContext,
  atTimeMs = Date.now(),
): DailyTaskDefinition[] {
  return mutateDayState((state) => {
    const sorted = sortTasksForDisplay(state.tasks);
    for (const task of sorted) {
      if (task.claimed) continue;
      const row = instanceToRow({ ...task }, ctx, atTimeMs);
      if (row.state !== 'in_progress') continue;
      devCompleteTaskInstance(task, state);
      break;
    }
  }, ctx, atTimeMs);
}

export function resetDailyTasksForDev(ctx: DailyTaskRollContext): DailyTaskDefinition[] {
  return rollDailyTasksNextPeriod(ctx);
}

export function clearDailyTasksDayStorage(): void {
  clearAllDailyTasksDayStorage();
}
