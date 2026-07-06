/**
 * Snapshot matching “right after FTUE 11”: FTUE done, level 1, empty grid, default upgrades, starter goals.
 */
import type { BoardCell } from '../types';
import {
  createInitialCropsState,
  createInitialHarvestState,
  createInitialSeedsState,
  getCropYieldPerHarvest,
} from '../components/UpgradeList';
import { normalizeBarnShelvesUnlocked } from '../constants/barnShelves';
import {
  GAME_SAVE_VERSION,
  deriveGoalDiscoveryLightGreenActive,
  type GameSaveV1,
  getDiscoveryGoalBuffer,
} from './gameSave';
import { DEFAULT_GARDEN_ID } from '../constants/gardens';
import {
  extractGardenStateFromV1,
  extractGlobalsFromV1,
  GAME_SAVE_V2_VERSION,
  type GameSaveV2,
} from './gardenSave';
import { loadUserPrefs } from './userPrefs';

const getHexDistance = (q: number, r: number): number => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;

function generateInitialGrid(): BoardCell[] {
  const cells: BoardCell[] = [];
  for (let q = -2; q <= 2; q++) {
    const r1 = Math.max(-2, -q - 2);
    const r2 = Math.min(2, -q + 2);
    for (let r = r1; r <= r2; r++) {
      const distance = getHexDistance(q, r);
      const locked = distance === 2;
      cells.push({ q, r, item: null, locked });
    }
  }
  return cells;
}

/** Same center as `getGoalCropRequired` with zero random offset (stable save). */
function postFtueGoalCropRequired(playerLevel: number, cropYieldLevel: number): number {
  const baseGoal = 3 + Math.floor(cropYieldLevel * 0.5) + Math.floor(playerLevel / 4);
  return Math.max(3, Math.round(baseGoal * 1.0));
}

export function createPostFtueCleanSave(): GameSaveV1 {
  const userPrefs = loadUserPrefs();
  const seedsState = createInitialSeedsState();
  const harvestState = createInitialHarvestState();
  const cropsState = createInitialCropsState();
  const playerLevel = 1;
  const cropYieldLevel = getCropYieldPerHarvest(cropsState);
  const req = postFtueGoalCropRequired(playerLevel, cropYieldLevel);
  const goalSlots: GameSaveV1['goalSlots'] = ['green', 'green', 'green', 'empty', 'empty'];
  const goalPlantTypes = [1, 2, 3, 0, 0];
  const highestPlantEver = 1;

  return {
    v: GAME_SAVE_VERSION,
    savedAt: Date.now(),
    pendingOfflineEarnings: 0,
    money: 0,
    grid: generateInitialGrid(),
    seedProgress: 0,
    harvestProgress: 0,
    harvestCharges: 3,
    seedsState,
    harvestState,
    cropsState,
    seedsInStorage: 5,
    highestPlantEver,
    playerLevel,
    playerLevelProgress: 0,
    plantMasteryGoalsCompleted: 0,
    plantMasteryOrdersProgress: 0,
    plantMasteryTargetLevel: 1,
    plantMasteryUnlockPending: [],
    plantMasteryUnlockedLevels: [],
    plantMasteryIntroBarComplete: false,
    collectionFtueCompleted: false,
    collectionFtuePhase: null,
    collectionFtueBonusesReached: false,
    collectionFtueRestartPending: false,
    activeTab: 'SEEDS',
    activeScreen: 'FARM',
    isExpanded: false,
    rewardedOffers: [],
    barnNotification: false,
    goalSlots,
    goalPlantTypes,
    goalLoadingSeconds: 15,
    goalCounts: [req, req, req, 0, 0],
    goalAmountsRequired: [req, req, req, 0, 0],
    goalCompletedValues: [0, 0, 0, 0, 0],
    goalDisplayOrder: [0, 1, 2],
    goalDiscoveryLightGreenActive: deriveGoalDiscoveryLightGreenActive(goalSlots, goalPlantTypes, highestPlantEver),
    coinGoalVisible: false,
    coinGoalValue: 0,
    coinGoalTimeRemaining: 30,
    newGoalsSinceDiscovery: 0,
    discoveryGoalsRemaining: getDiscoveryGoalBuffer(highestPlantEver),
    lastMergeDiscoveryLevel: 1,
    /** Matches starter orders 1→2→3 so “Last goal” HUD shows plant 3 after clear. */
    lastSpawnedGoalLevels: [2, 3],
    activeFtueStage: null,
    ftue2SeedFireCount: 0,
    ftue2FadingOut: false,
    ftue3FadingOut: false,
    ftue4Pending: false,
    ftue4FadingOut: false,
    ftue7Scheduled: false,
    ftue7UnrevealedSlots: [],
    ftue7RevealMode: false,
    ftue7SeedFireCount: 0,
    ftue7FadingOut: false,
    ftue8FadingOut: false,
    ftue9CollectedCount: 0,
    ftue9FadingOut: false,
    ftue10Phase: null,
    ftue10GreenFlashUpgradeId: null,
    ftue10FadingOut: false,
    ftueSeedSurplusActivated: true,
    ftueHarvestSurplusActivated: true,
    ftue10PostClosePending: false,
    ftue10ButtonsNormalEarly: false,
    ftue11StartQueued: false,
    ftueUpgradePanelVisible: true,
    ftuePlayerLevelVisible: true,
    activeBoosts: [],
    musicEnabled: userPrefs.musicEnabled,
    sfxEnabled: userPrefs.sfxEnabled,
    pendingUnlockUpgradeId: null,
    levelUpPopupQueue: [],
    tasksFtueStarted: false,
    tasksFtueUnlockRevealed: false,
    tasksFtueCompleted: false,
    gardensFtueStarted: false,
    gardensFtueUnlockRevealed: false,
    gardensFtueCompleted: false,
    newGardenFtueCompleted: false,
    newGardenFtuePhase: null,
    wildGrowthAccumulatorMs: 0,
    barnShelvesUnlocked: normalizeBarnShelvesUnlocked(),
  };
}

/** Post-FTUE clean account save — garden 1 only; other gardens are fully wiped. */
export function createPostFtueCleanSaveV2(): GameSaveV2 {
  const v1 = createPostFtueCleanSave();
  return {
    v: GAME_SAVE_V2_VERSION,
    savedAt: v1.savedAt,
    activeGardenId: DEFAULT_GARDEN_ID,
    gardensFeatureUnlocked: false,
    gardensStarted: [DEFAULT_GARDEN_ID],
    gardens: { [DEFAULT_GARDEN_ID]: extractGardenStateFromV1(v1) },
    globals: extractGlobalsFromV1(v1),
  };
}
