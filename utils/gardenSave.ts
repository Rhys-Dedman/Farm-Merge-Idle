import type { ScreenType, TabType } from '../types';
import type { FtueStageId } from '../ftue/ftueConfig';
import type { RewardedOffer } from '../components/UpgradeList';
import type { ActiveBoostData } from '../components/ActiveBoostIndicator';
import type { GardenState } from '../types/gardenState';
import {
  DEFAULT_GARDEN_ID,
  GARDENS_SWITCH_UNLOCK_LEVEL,
  type GardenId,
  isGardenId,
} from '../constants/gardens';
import type { GameSaveV1 } from './gameSave';

export const GAME_SAVE_V2_VERSION = 2 as const;

/** Account-wide save fields (not tied to a single garden's board/economy). */
export interface GameSaveGlobals {
  collectionFtueCompleted?: boolean;
  collectionFtuePhase?: string | null;
  tasksFtueStarted?: boolean;
  tasksFtueUnlockRevealed?: boolean;
  tasksFtueCompleted?: boolean;
  activeTab: TabType;
  activeScreen: ScreenType;
  isExpanded: boolean;
  rewardedOffers: RewardedOffer[];
  barnNotification: boolean;
  activeFtueStage: FtueStageId | null;
  ftue2SeedFireCount: number;
  ftue2FadingOut: boolean;
  ftue3FadingOut: boolean;
  ftue4Pending: boolean;
  ftue4FadingOut: boolean;
  ftue7Scheduled: boolean;
  ftue7UnrevealedSlots: number[];
  ftue7RevealMode: boolean;
  ftue7SeedFireCount: number;
  ftue7FadingOut: boolean;
  ftue8FadingOut: boolean;
  ftue9CollectedCount: number;
  ftue9FadingOut: boolean;
  ftue10Phase: 'point_orders' | 'panel_open_orders' | 'finger' | null;
  ftue10GreenFlashUpgradeId: string | null;
  ftue10FadingOut: boolean;
  ftueSeedSurplusActivated: boolean;
  ftueHarvestSurplusActivated: boolean;
  ftue10PostClosePending: boolean;
  ftue10ButtonsNormalEarly: boolean;
  ftue11StartQueued: boolean;
  ftueUpgradePanelVisible: boolean;
  ftuePlayerLevelVisible: boolean;
  activeBoosts: ActiveBoostData[];
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

export interface GameSaveV2 {
  v: typeof GAME_SAVE_V2_VERSION;
  savedAt: number;
  activeGardenId: GardenId;
  /** True when garden_1 player level has reached the gardens unlock threshold. */
  gardensFeatureUnlocked: boolean;
  /** Gardens the player has started (always includes garden_1 after first save). */
  gardensStarted: GardenId[];
  gardens: Partial<Record<GardenId, GardenState>>;
  globals: GameSaveGlobals;
}

export function extractGardenStateFromV1(save: GameSaveV1): GardenState {
  return {
    pendingOfflineEarnings: save.pendingOfflineEarnings,
    money: save.money,
    grid: save.grid,
    seedProgress: save.seedProgress,
    harvestProgress: save.harvestProgress,
    harvestCharges: save.harvestCharges,
    seedsState: save.seedsState,
    harvestState: save.harvestState,
    cropsState: save.cropsState,
    seedsInStorage: save.seedsInStorage,
    highestPlantEver: save.highestPlantEver,
    playerLevel: save.playerLevel,
    playerLevelProgress: save.playerLevelProgress,
    plantMasteryGoalsCompleted: save.plantMasteryGoalsCompleted,
    plantMasteryOrdersProgress: save.plantMasteryOrdersProgress,
    plantMasteryTargetLevel: save.plantMasteryTargetLevel,
    plantMasteryUnlockPending: [...save.plantMasteryUnlockPending],
    plantMasteryUnlockedLevels: [...save.plantMasteryUnlockedLevels],
    plantMasteryIntroBarComplete: save.plantMasteryIntroBarComplete,
    goalSlots: [...save.goalSlots],
    goalPlantTypes: [...save.goalPlantTypes],
    goalLoadingSeconds: save.goalLoadingSeconds,
    goalCounts: [...save.goalCounts],
    goalAmountsRequired: [...save.goalAmountsRequired],
    goalCompletedValues: [...save.goalCompletedValues],
    goalDisplayOrder: [...save.goalDisplayOrder],
    goalDiscoveryLightGreenActive: save.goalDiscoveryLightGreenActive
      ? [...save.goalDiscoveryLightGreenActive]
      : undefined,
    coinGoalVisible: save.coinGoalVisible,
    coinGoalValue: save.coinGoalValue,
    coinGoalTimeRemaining: save.coinGoalTimeRemaining,
    newGoalsSinceDiscovery: save.newGoalsSinceDiscovery,
    discoveryGoalsRemaining: save.discoveryGoalsRemaining,
    lastMergeDiscoveryLevel: save.lastMergeDiscoveryLevel,
    lastSpawnedGoalLevels: [...save.lastSpawnedGoalLevels] as [number, number],
    pendingUnlockUpgradeId: save.pendingUnlockUpgradeId,
    levelUpPopupQueue: [...save.levelUpPopupQueue],
    wildGrowthAccumulatorMs: save.wildGrowthAccumulatorMs,
    barnShelvesUnlocked: [...save.barnShelvesUnlocked],
  };
}

export function extractGlobalsFromV1(save: GameSaveV1): GameSaveGlobals {
  return {
    collectionFtueCompleted: save.collectionFtueCompleted,
    collectionFtuePhase: save.collectionFtuePhase,
    tasksFtueStarted: save.tasksFtueStarted,
    tasksFtueUnlockRevealed: save.tasksFtueUnlockRevealed,
    tasksFtueCompleted: save.tasksFtueCompleted,
    activeTab: save.activeTab,
    activeScreen: save.activeScreen,
    isExpanded: save.isExpanded,
    rewardedOffers: save.rewardedOffers,
    barnNotification: save.barnNotification,
    activeFtueStage: save.activeFtueStage,
    ftue2SeedFireCount: save.ftue2SeedFireCount,
    ftue2FadingOut: save.ftue2FadingOut,
    ftue3FadingOut: save.ftue3FadingOut,
    ftue4Pending: save.ftue4Pending,
    ftue4FadingOut: save.ftue4FadingOut,
    ftue7Scheduled: save.ftue7Scheduled,
    ftue7UnrevealedSlots: [...save.ftue7UnrevealedSlots],
    ftue7RevealMode: save.ftue7RevealMode,
    ftue7SeedFireCount: save.ftue7SeedFireCount,
    ftue7FadingOut: save.ftue7FadingOut,
    ftue8FadingOut: save.ftue8FadingOut,
    ftue9CollectedCount: save.ftue9CollectedCount,
    ftue9FadingOut: save.ftue9FadingOut,
    ftue10Phase: save.ftue10Phase,
    ftue10GreenFlashUpgradeId: save.ftue10GreenFlashUpgradeId,
    ftue10FadingOut: save.ftue10FadingOut,
    ftueSeedSurplusActivated: save.ftueSeedSurplusActivated,
    ftueHarvestSurplusActivated: save.ftueHarvestSurplusActivated,
    ftue10PostClosePending: save.ftue10PostClosePending,
    ftue10ButtonsNormalEarly: save.ftue10ButtonsNormalEarly,
    ftue11StartQueued: save.ftue11StartQueued,
    ftueUpgradePanelVisible: save.ftueUpgradePanelVisible,
    ftuePlayerLevelVisible: save.ftuePlayerLevelVisible,
    activeBoosts: [...save.activeBoosts],
    musicEnabled: save.musicEnabled,
    sfxEnabled: save.sfxEnabled,
  };
}

export function flattenV2ToV1(v2: GameSaveV2): GameSaveV1 {
  const garden = v2.gardens[v2.activeGardenId];
  if (!garden) {
    throw new Error(`Missing garden state for activeGardenId ${v2.activeGardenId}`);
  }
  const g = v2.globals;
  return {
    v: 1,
    savedAt: v2.savedAt,
    pendingOfflineEarnings: garden.pendingOfflineEarnings,
    money: garden.money,
    grid: garden.grid,
    seedProgress: garden.seedProgress,
    harvestProgress: garden.harvestProgress,
    harvestCharges: garden.harvestCharges,
    seedsState: garden.seedsState,
    harvestState: garden.harvestState,
    cropsState: garden.cropsState,
    seedsInStorage: garden.seedsInStorage,
    highestPlantEver: garden.highestPlantEver,
    playerLevel: garden.playerLevel,
    playerLevelProgress: garden.playerLevelProgress,
    plantMasteryGoalsCompleted: garden.plantMasteryGoalsCompleted,
    plantMasteryOrdersProgress: garden.plantMasteryOrdersProgress,
    plantMasteryTargetLevel: garden.plantMasteryTargetLevel,
    plantMasteryUnlockPending: [...garden.plantMasteryUnlockPending],
    plantMasteryUnlockedLevels: [...garden.plantMasteryUnlockedLevels],
    plantMasteryIntroBarComplete: garden.plantMasteryIntroBarComplete,
    collectionFtueCompleted: g.collectionFtueCompleted,
    collectionFtuePhase: g.collectionFtuePhase,
    tasksFtueStarted: g.tasksFtueStarted,
    tasksFtueUnlockRevealed: g.tasksFtueUnlockRevealed,
    tasksFtueCompleted: g.tasksFtueCompleted,
    activeTab: g.activeTab,
    activeScreen: g.activeScreen,
    isExpanded: g.isExpanded,
    rewardedOffers: g.rewardedOffers,
    barnNotification: g.barnNotification,
    barnShelvesUnlocked: [...garden.barnShelvesUnlocked],
    goalSlots: [...garden.goalSlots],
    goalPlantTypes: [...garden.goalPlantTypes],
    goalLoadingSeconds: garden.goalLoadingSeconds,
    goalCounts: [...garden.goalCounts],
    goalAmountsRequired: [...garden.goalAmountsRequired],
    goalCompletedValues: [...garden.goalCompletedValues],
    goalDisplayOrder: [...garden.goalDisplayOrder],
    goalDiscoveryLightGreenActive: garden.goalDiscoveryLightGreenActive
      ? [...garden.goalDiscoveryLightGreenActive]
      : undefined,
    coinGoalVisible: garden.coinGoalVisible,
    coinGoalValue: garden.coinGoalValue,
    coinGoalTimeRemaining: garden.coinGoalTimeRemaining,
    newGoalsSinceDiscovery: garden.newGoalsSinceDiscovery,
    discoveryGoalsRemaining: garden.discoveryGoalsRemaining,
    lastMergeDiscoveryLevel: garden.lastMergeDiscoveryLevel,
    lastSpawnedGoalLevels: [...garden.lastSpawnedGoalLevels] as [number, number],
    activeFtueStage: g.activeFtueStage,
    ftue2SeedFireCount: g.ftue2SeedFireCount,
    ftue2FadingOut: g.ftue2FadingOut,
    ftue3FadingOut: g.ftue3FadingOut,
    ftue4Pending: g.ftue4Pending,
    ftue4FadingOut: g.ftue4FadingOut,
    ftue7Scheduled: g.ftue7Scheduled,
    ftue7UnrevealedSlots: [...g.ftue7UnrevealedSlots],
    ftue7RevealMode: g.ftue7RevealMode,
    ftue7SeedFireCount: g.ftue7SeedFireCount,
    ftue7FadingOut: g.ftue7FadingOut,
    ftue8FadingOut: g.ftue8FadingOut,
    ftue9CollectedCount: g.ftue9CollectedCount,
    ftue9FadingOut: g.ftue9FadingOut,
    ftue10Phase: g.ftue10Phase,
    ftue10GreenFlashUpgradeId: g.ftue10GreenFlashUpgradeId,
    ftue10FadingOut: g.ftue10FadingOut,
    ftueSeedSurplusActivated: g.ftueSeedSurplusActivated,
    ftueHarvestSurplusActivated: g.ftueHarvestSurplusActivated,
    ftue10PostClosePending: g.ftue10PostClosePending,
    ftue10ButtonsNormalEarly: g.ftue10ButtonsNormalEarly,
    ftue11StartQueued: g.ftue11StartQueued,
    ftueUpgradePanelVisible: g.ftueUpgradePanelVisible,
    ftuePlayerLevelVisible: g.ftuePlayerLevelVisible,
    activeBoosts: [...g.activeBoosts],
    musicEnabled: g.musicEnabled,
    sfxEnabled: g.sfxEnabled,
    pendingUnlockUpgradeId: garden.pendingUnlockUpgradeId,
    levelUpPopupQueue: [...garden.levelUpPopupQueue],
    wildGrowthAccumulatorMs: garden.wildGrowthAccumulatorMs,
  };
}

export function migrateV1ToV2(v1: GameSaveV1): GameSaveV2 {
  const garden1 = extractGardenStateFromV1(v1);
  const gardensFeatureUnlocked = garden1.playerLevel >= GARDENS_SWITCH_UNLOCK_LEVEL;
  return {
    v: GAME_SAVE_V2_VERSION,
    savedAt: v1.savedAt,
    activeGardenId: DEFAULT_GARDEN_ID,
    gardensFeatureUnlocked,
    gardensStarted: [DEFAULT_GARDEN_ID],
    gardens: { [DEFAULT_GARDEN_ID]: garden1 },
    globals: extractGlobalsFromV1(v1),
  };
}

/** Update active garden + globals from a flat v1 snapshot (inactive gardens untouched). */
export function mergeV1IntoV2(v2: GameSaveV2, v1: GameSaveV1): GameSaveV2 {
  const activeId = v2.activeGardenId;
  const garden1Level =
    activeId === DEFAULT_GARDEN_ID
      ? v1.playerLevel
      : (v2.gardens[DEFAULT_GARDEN_ID]?.playerLevel ?? 1);

  return {
    ...v2,
    savedAt: v1.savedAt,
    gardensFeatureUnlocked:
      v2.gardensFeatureUnlocked || garden1Level >= GARDENS_SWITCH_UNLOCK_LEVEL,
    gardens: {
      ...v2.gardens,
      [activeId]: extractGardenStateFromV1(v1),
    },
    globals: extractGlobalsFromV1(v1),
  };
}

export function createEmptyV2FromV1(v1: GameSaveV1): GameSaveV2 {
  return migrateV1ToV2(v1);
}

export function parseActiveGardenId(raw: unknown): GardenId {
  return isGardenId(raw) ? raw : DEFAULT_GARDEN_ID;
}

export function parseGardensStarted(raw: unknown): GardenId[] {
  if (!Array.isArray(raw)) return [DEFAULT_GARDEN_ID];
  const started = raw.filter(isGardenId);
  if (!started.includes(DEFAULT_GARDEN_ID)) started.unshift(DEFAULT_GARDEN_ID);
  return [...new Set(started)];
}
