/**
 * Persistent game save (localStorage). FTUE + progression + offline earnings bank.
 */
import type { BoardCell, ScreenType, TabType } from '../types';
import type { FtueStageId } from '../ftue/ftueConfig';
import type {
  HarvestState,
  RewardedOffer,
  SeedsState,
  UpgradeState,
} from '../components/UpgradeList';
import type { ActiveBoostData } from '../components/ActiveBoostIndicator';
import {
  STORE_FIELD_PACK_COUNTDOWN_END_MS_KEY,
  STORE_FIELD_PACK_PURCHASED_KEY,
  STORE_FIELD_PACK_UNLOCKED_KEY,
  STORE_STARTER_PACK_COUNTDOWN_END_MS_KEY,
  STORE_STARTER_PACK_PURCHASED_KEY,
  STORE_STARTER_PACK_UNLOCKED_KEY,
} from '../offers';
import { normalizeBarnShelvesUnlocked } from '../constants/barnShelves';
import { PLANT_MASTERY_ORDERS_PER_SEGMENT, getMaxStoredOrdersProgressForTarget } from '../constants/plantMastery';
import { parseCollectionFtuePhase } from '../constants/collectionFtue';
import { parseNewGardenFtuePhase } from '../constants/newGardenFtue';
import { PLANT_COLLECTION_UI_UNLOCK_LEVEL } from '../constants/playerLevelUnlocks';
import { getGoalsRequiredForLevel } from './playerLevelGoals';
import { AUTO_MERGE_STORAGE_KEY } from './autoMergeMode';
import {
  LIMITED_OFFER_INTRO_CYCLE_COMPLETE_KEY,
  LIMITED_OFFER_INTRO_CYCLE_SEEN_IDS_KEY,
} from './limitedOfferIntroCycle';
import { clearRateUsPromptStorage } from './rateUsDismiss';
import {
  DAILY_TASKS_COUNTDOWN_END_MS_KEY,
  DAILY_TASKS_UNLOCKED_KEY,
} from './dailyTasksCountdown';
import { clearAllDailyTasksDayStorage } from './dailyTasksGardenScope';
import { DEFAULT_GARDEN_ID, type GardenId } from '../constants/gardens';
import { MAX_PLANT_TIER } from '../constants/plants';
import {
  flattenV2ToV1,
  GAME_SAVE_V2_VERSION,
  mergeV1IntoV2,
  migrateV1ToV2,
  parseActiveGardenId,
  parseGardensStarted,
  type GameSaveV2,
} from './gardenSave';

function normalizePlantMasteryUnlockPending(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const set = new Set<number>();
  for (const x of raw) {
    const n = typeof x === 'number' ? x : Number.parseInt(String(x), 10);
    if (Number.isFinite(n)) {
      const k = Math.floor(n);
      if (k >= 1 && k <= MAX_PLANT_TIER) set.add(k);
    }
  }
  return [...set].sort((a, b) => a - b);
}

function normalizePlantMasteryUnlockedLevels(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const set = new Set<number>();
  for (const x of raw) {
    const n = typeof x === 'number' ? x : Number.parseInt(String(x), 10);
    if (Number.isFinite(n)) {
      const k = Math.floor(n);
      if (k >= 1 && k <= MAX_PLANT_TIER) set.add(k);
    }
  }
  return [...set].sort((a, b) => a - b);
}

export const GAME_SAVE_STORAGE_KEY = 'pocket-garden-save-v1';

export const GAME_SAVE_VERSION = 1 as const;

/** Full buffer of normal goals before a +1 discovery order may spawn. Same curve as runtime discovery pacing. */
export function getDiscoveryGoalBuffer(highestPlant: number): number {
  const h = Math.max(0, Math.floor(highestPlant));
  if (h <= 3) return 3;
  if (h <= 4) return 5;
  if (h <= 5) return 8;
  if (h <= 6) return 10;
  if (h <= 7) return 12;
  if (h <= 8) return 14;
  if (h <= 9) return 16;
  if (h <= 10) return 18;
  return 20;
}

export interface GameSaveV1 {
  v: typeof GAME_SAVE_VERSION;
  savedAt: number;
  /** Uncollected offline surplus total (shown in Offline Earnings popup + new sim on load) */
  pendingOfflineEarnings: number;
  money: number;
  grid: BoardCell[];
  seedProgress: number;
  harvestProgress: number;
  harvestCharges: number;
  seedsState: SeedsState;
  harvestState: HarvestState;
  cropsState: Record<string, UpgradeState>;
  seedsInStorage: number;
  highestPlantEver: number;
  playerLevel: number;
  playerLevelProgress: number;
  /** Lifetime count of completed goals/orders (legacy / analytics). */
  plantMasteryGoalsCompleted: number;
  /** Orders completed toward current plant mastery segment (0..ordersPerSegment-1 while filling; segment max when terminal). */
  plantMasteryOrdersProgress: number;
  /** Next plant level (1–24) shown beside the mastery bar; segment credit applies to this plant when the bar fills. */
  plantMasteryTargetLevel: number;
  /** Plant levels (1–24) with mastery unlock available from the bar (not yet purchased). */
  plantMasteryUnlockPending: number[];
  /** Plant levels (1–24) where mastery has been purchased. */
  plantMasteryUnlockedLevels: number[];
  /**
   * After first Collection visit from collection unlock level: bar shows fake 15/15 until intro clears, then normal level tally.
   * Next collected goal clears this; bar then mirrors player level progress; golden-pot queue advances on player level-up.
   */
  plantMasteryIntroBarComplete?: boolean;
  /** After collection FTUE fully finished (tapped Garden at end). */
  collectionFtueCompleted?: boolean;
  /** Resumable step for collection FTUE; cleared when completed. */
  collectionFtuePhase?: string | null;
  /** True after the Collection Bonuses popup has opened during FTUE (fail-safe checkpoint). */
  collectionFtueBonusesReached?: boolean;
  /** Set when a mid-FTUE save is reset; triggers collection level-up popup on next load. */
  collectionFtueRestartPending?: boolean;
  /** Daily tasks FTUE started (level 5 unlock now tapped); cleared when completed. */
  tasksFtueStarted?: boolean;
  /** Tasks floating button swapped from locked to normal (bounce played). */
  tasksFtueUnlockRevealed?: boolean;
  /** Daily tasks FTUE finished (player opened tasks popup). */
  tasksFtueCompleted?: boolean;
  /** Gardens floating button FTUE started (level 10 unlock now tapped). */
  gardensFtueStarted?: boolean;
  /** Gardens floating button swapped from locked to normal (bounce played). */
  gardensFtueUnlockRevealed?: boolean;
  /** Gardens FTUE finished (player opened gardens picker). */
  gardensFtueCompleted?: boolean;
  /** Epoch ms when the last interstitial ad break finished. */
  lastAdBreakAt?: number;
  /** Epoch ms when the last rewarded ad finished. */
  lastRewardedAdAt?: number;
  /** Active playtime (ms) toward the ad-break unlock gate. */
  adBreakActivePlaytimeMs?: number;
  /** First garden purchase FTUE finished (player opened gardens picker on garden 2). */
  newGardenFtueCompleted?: boolean;
  /** Resumable step for new-garden FTUE; cleared when completed. */
  newGardenFtuePhase?: string | null;
  activeTab: TabType;
  activeScreen: ScreenType;
  isExpanded: boolean;
  rewardedOffers: RewardedOffer[];
  barnNotification: boolean;
  goalSlots: ('empty' | 'loading' | 'green' | 'completed')[];
  goalPlantTypes: number[];
  goalLoadingSeconds: number;
  goalCounts: number[];
  goalAmountsRequired: number[];
  goalCompletedValues: number[];
  goalDisplayOrder: number[];
  /** Discovery-order light-green frame until first crop bounce ends; optional on older saves. */
  goalDiscoveryLightGreenActive?: boolean[];
  coinGoalVisible: boolean;
  coinGoalValue: number;
  coinGoalTimeRemaining: number;
  /** @deprecated Derived on save as `buffer - discoveryGoalsRemaining` for older readers. */
  newGoalsSinceDiscovery: number;
  /** Goals remaining until a discovery order may spawn; authoritative when present. */
  discoveryGoalsRemaining?: number;
  lastMergeDiscoveryLevel: number;
  lastSpawnedGoalLevels: [number, number];
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
  pendingUnlockUpgradeId: string | null;
  levelUpPopupQueue: number[];
  /**
   * Wild Growth: ms accumulated toward next auto-duplicate (0 when upgrade inactive).
   * Missing on old saves → 0.
   */
  wildGrowthAccumulatorMs?: number;
  /** Shed shelves unlocked (6); missing on old saves → treated as all true in loader. */
  barnShelvesUnlocked: boolean[];
  /** Local day key when daily store allowance was claimed in this garden. */
  dailyAllowanceClaimedDayKey?: string;
  /** Per-garden store free-offer ids (slot 0 may show allowance before these apply). */
  storeFreeOfferSlots?: [string, string];
  /** Per-garden store slot cooldown end timestamps (ms). */
  storeSlotCooldownEnds?: [number, number];
}

/** Best-effort when `goalDiscoveryLightGreenActive` missing (any goal tier above highest discovered). */
export function deriveGoalDiscoveryLightGreenActive(
  goalSlots: GameSaveV1['goalSlots'],
  goalPlantTypes: number[],
  highestPlantEver: number
): boolean[] {
  const h = Math.max(0, Math.floor(highestPlantEver));
  if (h >= MAX_PLANT_TIER) return [false, false, false, false, false];
  return [0, 1, 2, 3, 4].map((i) => {
    const st = goalSlots[i];
    if (st !== 'green' && st !== 'loading') return false;
    const pl = goalPlantTypes[i] ?? 0;
    return pl >= 1 && pl > h;
  });
}

function readGameSaveRaw(): unknown {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(GAME_SAVE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function coerceGameSaveV2(data: unknown): GameSaveV2 | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as GameSaveV2;
  if (d.v !== GAME_SAVE_V2_VERSION) return null;
  const gardens = d.gardens && typeof d.gardens === 'object' ? d.gardens : {};
  if (!gardens[DEFAULT_GARDEN_ID]?.grid) return null;
  return {
    ...d,
    activeGardenId: parseActiveGardenId(d.activeGardenId),
    gardensStarted: parseGardensStarted(d.gardensStarted),
    gardens,
    globals: d.globals ?? ({} as GameSaveV2['globals']),
  };
}

function writeGameSaveV2(save: GameSaveV2): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(GAME_SAVE_STORAGE_KEY, JSON.stringify(save));
  } catch {
    /* quota / private mode */
  }
}

/** Normalize a flat v1-shaped save (active garden + globals merged). */
export function normalizeGameSaveV1(data: GameSaveV1): GameSaveV1 {
    if (!Array.isArray(data.levelUpPopupQueue)) data.levelUpPopupQueue = [];
    if (typeof data.pendingOfflineEarnings !== 'number' || Number.isNaN(data.pendingOfflineEarnings)) {
      data.pendingOfflineEarnings = 0;
    }
    if (typeof data.money !== 'number' || !Number.isFinite(data.money)) {
      data.money = 0;
    }
    if (!Array.isArray(data.activeBoosts)) data.activeBoosts = [];
    if (typeof data.musicEnabled !== 'boolean') data.musicEnabled = true;
    if (typeof data.sfxEnabled !== 'boolean') data.sfxEnabled = true;
    data.barnShelvesUnlocked = normalizeBarnShelvesUnlocked(data.barnShelvesUnlocked);
    if (typeof data.plantMasteryGoalsCompleted !== 'number' || !Number.isFinite(data.plantMasteryGoalsCompleted)) {
      data.plantMasteryGoalsCompleted = 0;
    }
    data.plantMasteryGoalsCompleted = Math.max(0, Math.floor(data.plantMasteryGoalsCompleted));
    if (typeof data.plantMasteryOrdersProgress !== 'number' || !Number.isFinite(data.plantMasteryOrdersProgress)) {
      data.plantMasteryOrdersProgress = 0;
    }
    data.plantMasteryOrdersProgress = Math.max(0, Math.floor(data.plantMasteryOrdersProgress));
    if (typeof data.plantMasteryTargetLevel !== 'number' || !Number.isFinite(data.plantMasteryTargetLevel)) {
      data.plantMasteryTargetLevel = 1;
    }
    data.plantMasteryTargetLevel = Math.max(1, Math.min(MAX_PLANT_TIER, Math.floor(data.plantMasteryTargetLevel)));
    if (typeof data.highestPlantEver === 'number' && Number.isFinite(data.highestPlantEver)) {
      data.highestPlantEver = Math.min(MAX_PLANT_TIER, Math.max(0, Math.floor(data.highestPlantEver)));
    }
    data.plantMasteryUnlockPending = normalizePlantMasteryUnlockPending(data.plantMasteryUnlockPending);
    data.plantMasteryUnlockedLevels = normalizePlantMasteryUnlockedLevels(
      (data as GameSaveV1 & { plantMasteryUnlockedLevels?: unknown }).plantMasteryUnlockedLevels
    );
    if (typeof data.plantMasteryIntroBarComplete !== 'boolean') {
      data.plantMasteryIntroBarComplete = false;
    }
    if (data.plantMasteryIntroBarComplete && data.plantMasteryTargetLevel !== 1) {
      data.plantMasteryIntroBarComplete = false;
    }
    const seg = PLANT_MASTERY_ORDERS_PER_SEGMENT;
    const maxP = getMaxStoredOrdersProgressForTarget(
      data.plantMasteryTargetLevel,
      seg,
      data.plantMasteryIntroBarComplete,
    );
    data.plantMasteryOrdersProgress = Math.min(data.plantMasteryOrdersProgress, maxP);
    if (typeof data.collectionFtueCompleted !== 'boolean') {
      data.collectionFtueCompleted = false;
    }
    if (typeof data.collectionFtueBonusesReached !== 'boolean') {
      data.collectionFtueBonusesReached = false;
    }
    let cPhase = parseCollectionFtuePhase(data.collectionFtuePhase);
    if (data.collectionFtueCompleted) {
      cPhase = null;
      data.collectionFtueRestartPending = false;
    } else if (!data.collectionFtueBonusesReached) {
      const ftueInProgress =
        cPhase != null ||
        (Array.isArray(data.plantMasteryUnlockedLevels) && data.plantMasteryUnlockedLevels.includes(1));
      if (ftueInProgress) {
        cPhase = null;
        if (Array.isArray(data.plantMasteryUnlockedLevels)) {
          data.plantMasteryUnlockedLevels = data.plantMasteryUnlockedLevels.filter((l) => l !== 1);
        }
        data.plantMasteryUnlockPending = (data.plantMasteryUnlockPending ?? []).filter((l) => l !== 1);
        data.collectionFtueBonusesReached = false;
        data.collectionFtueRestartPending = true;
      } else {
        // Level-up popup shown (or earned) but View Collection not clicked yet — force it on load.
        const level = Math.max(1, Math.floor(Number(data.playerLevel) || 1));
        const progress = Math.max(0, Math.floor(Number(data.playerLevelProgress) || 0));
        const awaitingCollectionLevelUpClick =
          level === PLANT_COLLECTION_UI_UNLOCK_LEVEL - 1 &&
          progress >= getGoalsRequiredForLevel(level);
        const unlockedWithoutFtue = level >= PLANT_COLLECTION_UI_UNLOCK_LEVEL;
        if (awaitingCollectionLevelUpClick || unlockedWithoutFtue || data.collectionFtueRestartPending === true) {
          data.collectionFtueRestartPending = true;
        } else if (typeof data.collectionFtueRestartPending !== 'boolean') {
          data.collectionFtueRestartPending = false;
        }
      }
    } else {
      // Bonuses opened = collection FTUE finished (even if refresh happens mid-popup).
      data.collectionFtueRestartPending = false;
      data.collectionFtueCompleted = true;
      cPhase = null;
    }
    data.collectionFtuePhase = cPhase;
    if (typeof data.newGardenFtueCompleted !== 'boolean') {
      data.newGardenFtueCompleted = false;
    }
    let ngPhase = parseNewGardenFtuePhase(data.newGardenFtuePhase);
    if (data.newGardenFtueCompleted) ngPhase = null;
    data.newGardenFtuePhase = ngPhase;
    const wg = (data as GameSaveV1).wildGrowthAccumulatorMs;
    if (typeof wg !== 'number' || !Number.isFinite(wg)) {
      (data as GameSaveV1).wildGrowthAccumulatorMs = 0;
    } else {
      (data as GameSaveV1).wildGrowthAccumulatorMs = Math.max(0, wg);
    }
    const gdl = data.goalDiscoveryLightGreenActive;
    if (!Array.isArray(gdl) || gdl.length !== 5) {
      data.goalDiscoveryLightGreenActive = deriveGoalDiscoveryLightGreenActive(
        data.goalSlots,
        data.goalPlantTypes,
        data.highestPlantEver
      );
    } else {
      data.goalDiscoveryLightGreenActive = gdl.map((x) => x === true);
    }
    return data;
}

export function loadGameSaveV2(): GameSaveV2 | null {
  const raw = readGameSaveRaw();
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as { v?: number };
  if (record.v === GAME_SAVE_V2_VERSION) {
    const v2 = coerceGameSaveV2(raw);
    if (!v2) return null;
    return v2;
  }
  if (record.v === GAME_SAVE_VERSION) {
    const v1 = normalizeGameSaveV1(raw as GameSaveV1);
    if (!Array.isArray(v1.grid)) return null;
    const v2 = migrateV1ToV2(v1);
    writeGameSaveV2(v2);
    return v2;
  }
  return null;
}

export function loadGameSave(): GameSaveV1 | null {
  try {
    const raw = readGameSaveRaw();
    if (!raw || typeof raw !== 'object') return null;
    const record = raw as { v?: number };

    if (record.v === GAME_SAVE_V2_VERSION) {
      const v2 = coerceGameSaveV2(raw);
      if (!v2) return null;
      const flat = flattenV2ToV1(v2);
      return normalizeGameSaveV1(flat);
    }

    if (record.v === GAME_SAVE_VERSION && Array.isArray((raw as GameSaveV1).grid)) {
      const v1 = normalizeGameSaveV1(raw as GameSaveV1);
      writeGameSaveV2(migrateV1ToV2(v1));
      return v1;
    }

    return null;
  } catch {
    return null;
  }
}

export function persistGameSaveV2(save: GameSaveV2): void {
  writeGameSaveV2(save);
}

export function persistGameSave(
  save: GameSaveV1,
  options?: { activeGardenId?: GardenId },
): void {
  const normalized = normalizeGameSaveV1({ ...save, v: GAME_SAVE_VERSION });
  const existing = loadGameSaveV2();
  let v2 = existing ? mergeV1IntoV2(existing, normalized) : migrateV1ToV2(normalized);
  if (options?.activeGardenId) {
    v2.activeGardenId = options.activeGardenId;
  }
  writeGameSaveV2(v2);
}

export function clearGameSave(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(GAME_SAVE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(STORE_STARTER_PACK_COUNTDOWN_END_MS_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(STORE_STARTER_PACK_UNLOCKED_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(STORE_STARTER_PACK_PURCHASED_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(STORE_FIELD_PACK_COUNTDOWN_END_MS_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(STORE_FIELD_PACK_UNLOCKED_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(STORE_FIELD_PACK_PURCHASED_KEY);
  } catch {
    /* ignore */
  }
  // Provisional garden_pack keys from early Field Pack wiring (safe no-op if unused).
  try {
    localStorage.removeItem('store_bundle_garden_pack_countdown_end_ms');
    localStorage.removeItem('store_bundle_garden_pack_unlocked');
    localStorage.removeItem('store_bundle_garden_pack_purchased');
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(AUTO_MERGE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(LIMITED_OFFER_INTRO_CYCLE_SEEN_IDS_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(LIMITED_OFFER_INTRO_CYCLE_COMPLETE_KEY);
  } catch {
    /* ignore */
  }
  clearRateUsPromptStorage();
  try {
    localStorage.removeItem('daily_tasks_ftue_intro_seeded_v1');
  } catch {
    /* ignore */
  }
  clearAllDailyTasksDayStorage();
  try {
    localStorage.removeItem(DAILY_TASKS_COUNTDOWN_END_MS_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(DAILY_TASKS_UNLOCKED_KEY);
  } catch {
    /* ignore */
  }
}
