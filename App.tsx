
import React, { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { HexBoard, type HexBoardHandle } from './components/HexBoard';
import { UpgradeTabs } from './components/UpgradeTabs';
import { UpgradeList, createInitialSeedsState, createInitialHarvestState, createInitialCropsState, getSeedLevelFromHighestPlant, getBonusSeedChance, getSeedSurplusValue, getSeedStorageMax, getCropYieldPerHarvest, getHarvestSpeedLevel, getMergeHarvestChance, getGoalLoadingSeconds, getMarketValueMultiplier, getPremiumOrdersMinLevel, getSurplusSalesMultiplier, isSurplusSalesUnlocked, getHappyCustomerChance, HarvestState, UpgradeState, RewardedOffer, getLevelUnlockInfo, isCustomerSpeedMaxed } from './components/UpgradeList';
import {
  PLANT_COLLECTION_UI_UNLOCK_LEVEL,
  isPlantCollectionUiUnlockedForGarden,
  isPlantCollectionUiUnlockedGlobally,
  FLOATING_BUTTONS_UNLOCK_LEVEL,
  shouldShowFarmFloatingButtons,
  GARDENS_FLOATING_BUTTON_UI_VISIBLE,
  TASKS_FLOATING_BUTTON_UNLOCK_LEVEL,
  GARDENS_FLOATING_BUTTON_UNLOCK_LEVEL,
  STARTER_PACK_FORCE_POPUP_LEVEL,
} from './constants/playerLevelUnlocks';
import { TASKS_FTUE_FLOATING_BUTTON_ID } from './constants/tasksFtue';
import { GARDENS_FTUE_FLOATING_BUTTON_ID } from './constants/gardensFtue';
import { getFloatingButtonStackTopPx } from './constants/floatingButtonLayout';
import { FAKE_SAFE_AREA_TOP_PX } from './constants/debugSafeArea';
import { FakeNotchOverlay } from './components/FakeNotchOverlay';
import { Navbar } from './components/Navbar';
import { StoreScreen } from './components/StoreScreen';
import { SideAction } from './components/SideAction';
import { FloatingButton } from './components/FloatingButton';
import { FloatingButtonStack } from './components/FloatingButtonStack';
import { FarmLeftFloatingButtonStack } from './components/FarmLeftFloatingButtonStack';
import { Projectile } from './components/Projectile';
import { LeafBurst, LEAF_BURST_BASELINE_COUNT, LEAF_BURST_SMALL_COUNT } from './components/LeafBurst';
import { PopupRectLeafBurst } from './components/PopupRectLeafBurst';
import { AmbientFallingLeaves } from './components/AmbientFallingLeaves';
import { FarmVfxLayer } from './components/FarmVfxLayer';
import { CellHighlightBeam } from './components/CellHighlightBeam';
import { CoinPanel, CoinPanelData } from './components/CoinPanel';
import { PlantPanel, PlantPanelData } from './components/PlantPanel';
import { GoalCoinParticle, GoalCoinParticleData } from './components/GoalCoinParticle';
import { UpgradeParticle, type UpgradeParticleData } from './components/UpgradeParticle';
import { GoldenPotProgressParticle, type GoldenPotProgressParticleData } from './components/GoldenPotProgressParticle';
import { WalletImpactBurst } from './components/WalletImpactBurst';
import { PageHeader, MAX_VISIBLE_BOOST_SLOTS, SETTINGS_GEAR_ICON_PX, SETTINGS_GEAR_PX } from './components/PageHeader';
import { DiscoveryPopup } from './components/DiscoveryPopup';
import { GoldenPotBonusesPopup } from './components/GoldenPotBonusesPopup';
import { PurchaseSuccessfulPopup, type PurchaseSuccessfulRewardRow } from './components/PurchaseSuccessfulPopup';
import { IapOfferPopup } from './components/IapOfferPopup';
import { FieldPackPopup } from './components/FieldPackPopup';
import { StarterPackPopup } from './components/StarterPackPopup';
import { LevelUpPopup } from './components/LevelUpPopup';
import { GardenLevelPopup } from './components/GardenLevelPopup';
import { PlantInfoPopup } from './components/PlantInfoPopup';
import { PlantWithPot } from './components/PlantWithPot';
import { LimitedOfferPopup } from './components/LimitedOfferPopup';
import { FakeAdPopup } from './components/FakeAdPopup';
import { AdFullscreenFadeOverlay } from './components/AdFullscreenFadeOverlay';
import { AdBreakIntroOverlay } from './components/AdBreakIntroOverlay';
import { InterstitialAdLayer } from './components/InterstitialAdLayer';
import { RewardedAdLayer } from './components/RewardedAdLayer';
import {
  spawnButtonLeafBurst,
  spawnGoalCoinLeafBurst,
  spawnLeafBurst,
  spawnLeafBurstSmall,
  spawnLeafBurstsSmallMany,
  spawnMasteryConeBurst,
  spawnUnlockBurst,
} from './utils/farmVfxStore';
import {
  AD_REWARDED_FADE_IN_MS,
  AD_REWARDED_FADE_OUT_MS,
  SCREEN_NAV_AD_BREAK_DELAY_MS,
} from './constants/adPresentation';
import type { FakeAdVariant } from './constants/adPresentation';
import type { AdBreakTriggerId } from './constants/adBreakSettings';
import { AD_BREAK_SETTINGS } from './constants/adBreakSettings';
import {
  applyAdBreakReturnPolicy,
  canShowAdBreakNow,
  shouldFlagAdBreakFallback,
  interstitialAdBridge,
  rewardedAdBridge,
  shouldSkipLevelUpAdBreak,
  type AdBreakBlockerContext,
  type AdBreakRuntimeState,
  type InterstitialAdCloseResult,
  type RewardedAdCloseResult,
} from './utils/adBreak';
import { PauseMenuPopup } from './components/PauseMenuPopup';
import { SettingsPopup } from './components/SettingsPopup';
import { GardenPickerPopup } from './components/GardenPickerPopup';
import { RateUsPopup } from './components/RateUsPopup';
import { RateUsThankYouPopup } from './components/RateUsThankYouPopup';
import { DailyTasksPopup } from './components/DailyTasksPopup';
import {
  LockedFloatingFeaturePopup,
  LOCKED_DAILY_TASKS_POPUP_DESCRIPTION,
  LOCKED_GARDENS_POPUP_DESCRIPTION,
} from './components/LockedFloatingFeaturePopup';
import { type DailyTaskClaimFx, type DailyTaskDefinition } from './components/DailyTaskRow';
import {
  clearDailyTasksProgressStorage,
  ensureDailyTasksDay,
  findNewlyCompletedDailyTasks,
  getDailyTaskRollContext,
  markDailyTaskClaimed,
  markDailyTasksClaimed,
  completeNextDailyTaskForDev,
  recordDailyTaskBoosterActivated,
  recordDailyTaskCoinOrder,
  recordDailyTaskFreeOfferClaimed,
  recordDailyTaskGoldenPot,
  recordDailyTaskHarvestCrops,
  recordDailyTaskHarvestThreeCells,
  recordDailyTaskLevelUp,
  recordDailyTaskMerge,
  recordDailyTaskMergeCoins,
  recordDailyTaskMergeHarvestCrops,
  recordDailyTaskNewDiscovery,
  recordDailyTaskOrderComplete,
  recordDailyTaskSeedPlanted,
  recordDailyTaskUpgradePurchased,
  resetDailyTasksForDev,
  rollDailyTasksNextPeriod,
  syncDailyTasksGrid,
  tickDailyTaskPlaytime,
} from './utils/dailyTasksProgress';
import { useDailyTasksCountdown } from './hooks/useDailyTasksCountdown';
import { FloatingButtonTasks } from './components/FloatingButtonTasks';
import { FloatingButtonGardens } from './components/FloatingButtonGardens';
import {
  DAILY_TASKS_AUTO_CLAIM_BEFORE_END_MS,
  DAILY_TASKS_COUNTDOWN_END_MS_KEY,
  DAILY_TASKS_UNLOCKED_KEY,
  markDailyTasksUnlocked,
  readDailyTasksUnlocked,
  rollDailyTasksPeriodIfExpired,
  getLocalDayKey,
  isDailyAllowanceClaimedForDay,
} from './utils/dailyTasksCountdown';
import { getDailyTaskClaimFxFromDom } from './utils/dailyTaskClaimFx';
import { BoostParticle, BoostParticleData } from './components/BoostParticle';
import { ActiveBoostData, ACTIVE_BOOST_INDICATOR_SIZE_PX } from './components/ActiveBoostIndicator';
import { UpgradeTabsRef } from './components/UpgradeTabs';
import { BarnParticle, BarnParticleData } from './components/BarnParticle';
import { LoadingScreen } from './components/LoadingScreen';
import { FtuePopup } from './components/FtuePopup';
import { CorruptSavePopup } from './components/CorruptSavePopup';
import { Ftue2Overlay } from './components/Ftue2Overlay';
import { Ftue3Overlay } from './components/Ftue3Overlay';
import { Ftue4Overlay } from './components/Ftue4Overlay';
import { Ftue5Overlay } from './components/Ftue5Overlay';
import { Ftue6Overlay } from './components/Ftue6Overlay';
import { Ftue7Overlay } from './components/Ftue7Overlay';
import { Ftue8Overlay } from './components/Ftue8Overlay';
import { Ftue9Overlay } from './components/Ftue9Overlay';
import { Ftue10Overlay } from './components/Ftue10Overlay';
import { Ftue11Overlay } from './components/Ftue11Overlay';
import { Ftue95Overlay } from './components/Ftue95Overlay';
import { SoftHarvestNudgeOverlay } from './components/SoftHarvestNudgeOverlay';
import { TabType, ScreenType, BoardCell, Item, DragState } from './types';
import type { FtueStageId } from './ftue/ftueConfig';
import { assetPath } from './utils/assetPath';
import { getTickCount60, TARGET_FRAME_MS, scheduleNextFrame } from './utils/raf60';
import { getPerformanceMode, setPerformanceMode, shouldPlayPopupLeafBurst } from './utils/performanceMode';
import { getAutoMergeMode, setAutoMergeMode } from './utils/autoMergeMode';
import { playMusicLoop, playSfx, setAudioSettings, setAdAudioSuspended, SFX_IDS, applySavedAudioSettingsEarly } from './utils/sfx';
import { loadUserPrefs, persistUserPrefs, resetUserPrefsTogglesToDefaults } from './utils/userPrefs';
import { openRateUsStore } from './constants/rateUsStore';
import {
  cancelReturnReminders,
  ensureReturnReminderDeliveryListener,
  scheduleReturnReminders,
  tryRequestPermissionOnceAfterFtue,
  requestNotificationPermission,
} from './utils/localNotifications';
import {
  getDoubleCoinsActiveBoostIcon,
  DOUBLE_COINS_OFFER_ID,
  LIMITED_OFFERS,
  LIMITED_OFFERS_AD_POOL,
  STORE_BUNDLE_OFFERS,
  STORE_COIN_OFFERS,
  STORE_IAP_OFFER_FIELD_PACK_ID,
  STORE_IAP_OFFER_REMOVE_ADS_ID,
  STORE_IAP_OFFER_STARTER_PACK_ID,
  getOfferById,
  resolveStorePriceLabel,
  isLimitedStarterStyleBundleOfferId,
  isStorePremiumOnlyOfferId,
  applyDoubleCoinsVisualAmount,
  isCoinMultiplierBoostId,
  isLegacyCoinMultiplierOfferId,
  pickInitialStoreFreeOfferSlots,
  pickStoreDurationOfferId,
  normalizeStoreSlotCooldownEnds,
  STORE_DAILY_ALLOWANCE_OFFER_ID,
  getStorePurchaseBoostGrants,
  hasActiveRemoveAdsBoost,
  STORE_FIELD_PACK_COUNTDOWN_END_MS_KEY,
  STORE_FIELD_PACK_PURCHASED_KEY,
  STORE_FIELD_PACK_UNLOCKED_KEY,
  STORE_STARTER_PACK_COUNTDOWN_END_MS_KEY,
  STORE_STARTER_PACK_PURCHASED_KEY,
  STORE_STARTER_PACK_UNLOCKED_KEY,
  markFieldPackPurchased,
  markFieldPackUnlocked,
  markStarterPackPurchased,
  markStarterPackUnlocked,
  readFieldPackPurchased,
  readFieldPackUnlocked,
  readStarterPackPurchased,
  readStarterPackUnlocked,
  restoreFieldPackOfferAfterClearBoosts,
  restoreStarterPackOfferAfterClearBoosts,
  type StoreBundleOfferConfig,
  type StoreCoinOfferConfig,
} from './offers';
import {
  loadGameSave,
  loadGameSaveV2,
  persistGameSave,
  persistGameSaveV2,
  normalizeGameSaveV1,
  clearGameSave,
  consumeRestoredFromBackupFlag,
  type GameSaveV1,
  GAME_SAVE_VERSION,
  getDiscoveryGoalBuffer,
  deriveGoalDiscoveryLightGreenActive,
} from './utils/gameSave';
import { writeLevelUpBackupSave } from './utils/saveBackup';
import {
  DEFAULT_GARDEN_ID,
  GARDEN_IDS,
  getGardenDisplayLabel,
  getCollectionPanelTitle,
  SHIPPED_GARDEN_IDS,
  type GardenId,
} from './constants/gardens';
import {
  getGardenBackgroundPaths,
  getGardenAmbientLeafSpritePath,
  getGardenCoinIconPath,
  getGardenPlantSpritePath,
  getGardenPickerGardenIconPath,
  getCollectionBonusIconPath,
  getCollectionShelfGoldenPotIconPath,
  getCollectionShelfGoldenPotCompleteIconPath,
  getCollectionGardenIconPath,
  getCollectionLockGardenIconPath,
  getCollectionShelfLockedIconPath,
  getPlantPotGoldPath,
  getSpecialDeliveryPlantLevel,
  getSpecialDeliveryPlantSpritePath,
  setActiveGardenAssetContext,
  getGoalSlotUiPath,
  getTopUiAssetPath,
  preloadGardenSwitchAssets,
} from './utils/gardenAssets';
import { getGardenGoalTextColors } from './constants/gardenGoalTheme';
import { setDailyTasksActiveGarden } from './utils/dailyTasksGardenScope';
import {
  activateGardenInSave,
  applyCollectionScrollYToV2,
  clearDailyAllowanceClaimedForAllGardens,
  flattenV2ToV1,
  mergeV1IntoV2,
  readCollectionScrollYFromV2,
} from './utils/gardenSave';
import {
  ensureGardenStartedInSave,
  findNextDevGoldenPotTarget,
  findNextDevUnlockPlantTarget,
  getCollectionPlantKey,
  getGardenCollectionSnapshot,
  hasAnyDevUnlockPlantRemaining,
  type GardenCollectionSnapshot,
} from './utils/collectionGardenState';
import {
  getGlobalBonusProgressPotCount,
  getGlobalCompletedShelfCount,
  getUnlockedGoldenPotBonusTierPotCounts,
  getNextUpgradeablePlantOnShelf,
  getShelfIndexForGarden,
  getShelfMasteredCount,
  getShelfRewardBarStateForSnapshot,
  isShelfActiveUpgradeTarget,
  isShelfRewardBarLocked,
  isShelfFullyDiscovered,
  isShelfFullyMastered,
  shouldShowShelfUpgradeUi,
  getInProgressBonusTierPotCounts,
} from './utils/collectionShelfMastery';
import { createPostFtueCleanSaveV2 } from './utils/postFtueCleanSave';
import {
  getLimitedOfferAutoPopupPool,
  getNextLimitedOfferIntroPopup,
  isLimitedOfferIntroCycleComplete,
  markLimitedOfferIntroPopupSeen,
  syncLimitedOfferIntroCyclePersistedState,
} from './utils/limitedOfferIntroCycle';
import {
  createRewardedOfferPanelEntry,
  hasActiveRewardedOfferInPanel,
  normalizeRewardedOfferForSave,
  normalizeRewardedOffersForLoad,
  pruneExpiredRewardedOffers,
} from './utils/rewardedOfferPanel';
import {
  canAutoShowRateUsPrompt,
  canEverShowRateUs,
  clearRateUsPromptStorage,
  markRateUsPermanentlyDismissed,
  markRateUsSoftDismissed,
} from './utils/rateUsDismiss';
import { isOfflineCoinEarningsBlockedByFtue, simulateOfflineSeedHarvest, simulateWildGrowthOffline } from './utils/offlineSimulate';
import { applyIdleEarningsToInactiveGardens, catchUpGardenAbsence, loadGameSaveWithIdleAbsenceApplied, markGardenBecameInactive } from './utils/gardenIdleEarnings';
import { healNewGardenFtueSave } from './utils/healNewGardenFtue';
import { clampOfflineEarningsBank } from './utils/offlineEarningsCap';
import {
  getWildGrowthIntervalMsForLevel,
  pickWildGrowthPreviewPlant,
  pickWildGrowthSpawn,
  WILD_GROWTH_UNLOCK_PLAYER_LEVEL,
} from './utils/wildGrowth';
import { OfflineEarningsPopup } from './components/OfflineEarningsPopup';
import { BARN_SHELF_COUNT, BARN_SHELVES_PER_GARDEN, COLLECTION_PANEL_GARDEN_ICON_PX, COLLECTION_PANEL_GARDEN_ICON_UNLOCKED_SCALE, COLLECTION_PANEL_LOCKED_CREST_SCALE, COLLECTION_PANEL_LOCKED_CREST_TOP_PX, COLLECTION_PANEL_LOCKED_LEVEL_BUTTON_HEIGHT_PX, COLLECTION_PANEL_LOCKED_LEVEL_BUTTON_PADDING_X_PX, COLLECTION_PANEL_UNLOCKED_CREST_TOP_PX, COLLECTION_PHONE_PLANT_PANEL_SCALE, COLLECTION_PHONE_PLANT_PANEL_TOP_PX, COLLECTION_PHONE_ROOF_LAYOUT_SCALE, COLLECTION_PHONE_ROOF_SCALE, COLLECTION_PHONE_SHELF_WIDTH_SCALE, COLLECTION_PHONE_SHELVES_EXTRA_MARGIN_TOP_UNLOCKED_PX, COLLECTION_PHONE_SHELVES_MARGIN_TOP_PX, COLLECTION_PLANT_COUNT, COLLECTION_PLANT_PANEL_TOP_PX, COLLECTION_SCROLL_BOTTOM_PAD_PX, COLLECTION_SHELF_STACK_MARGIN_TOP_PX, COLLECTION_SHELF_UPGRADE_BUTTON_BORDER_PX, COLLECTION_SHELF_UPGRADE_BUTTON_COIN_PX, COLLECTION_SHELF_UPGRADE_BUTTON_DARK_COLOR, COLLECTION_SHELF_UPGRADE_BUTTON_FONT_PX, COLLECTION_SHELF_UPGRADE_BUTTON_HEIGHT_PX, COLLECTION_SHELF_UPGRADE_BUTTON_RING_COLOR, COLLECTION_SHELF_UPGRADE_BUTTON_TOP_PX, COLLECTION_SHELF_UPGRADE_BUTTON_WIDTH_PX, COLLECTION_SHELF_UPGRADE_SPRITE_SCALE, COLLECTION_SHELF_UPGRADE_SPRITE_TOP_PX, COLLECTION_SHELVES_EXTRA_MARGIN_TOP_UNLOCKED_PX, COLLECTION_SHELVES_MARGIN_TOP_PX, getCollectionShelfMeta, normalizeBarnShelvesUnlocked } from './constants/barnShelves';
import { getGardenPickerPurchaseCoinPrice } from './constants/gardenPicker';
import { areAdsEnabled, getRemoteConfig, isStoreIapEnabled } from './utils/remoteConfig';
import { canAffordNextGardenPurchase, isGardensFloatingButtonUnlocked } from './utils/gardenPickerFloatingButton';
import { MAX_PLANT_TIER } from './constants/plants';
import {
  PLANT_MASTERY_GLOW_MS,
  canPurchaseGoldenPotForLevel,
  countGoldenPotUpgradeablePlants,
  getGoldenPotUpgradeableLevels,
  getPlantMasteryUnlockCost,
} from './constants/plantMastery';
import {
  getHarvestRechargePerMinute,
  getMaxPlantGoalSlots,
  getDailyAllowanceCoinAmount,
  hasGoldenPotDailyAllowance,
  isGardenSelectable,
  getHarvestChargesMax,
  getGoldenPotHarvestStorageMaxBonus,
  getGoldenPotSeedStorageMaxBonus,
  applyGoldenPotOfflineEarningsBonus,
  applyGoldenPotMergeCoinBonus,
  getSeedRechargePerMinute,
  getGoldenPotBonusTierPotCountForShelf,
} from './constants/goldenPotBonuses';
import { CollectionFtueOverlay } from './components/CollectionFtueOverlay';
import { CollectionBonusesFtueOverlay } from './components/CollectionBonusesFtueOverlay';
import { CollectionRewardProgressBar } from './components/CollectionRewardProgressBar';
import { NewGardenGardensFbFtueOverlay } from './components/NewGardenGardensFbFtueOverlay';
import type { CollectionFtuePhase } from './constants/collectionFtue';
import { COLLECTION_FTUE_BLOCKER_TINT, COLLECTION_FTUE_BONUSES_MESSAGE, COLLECTION_FTUE_PANEL_COPY_ID, COLLECTION_FTUE_SHELF0_REWARD_ICON_ID, parseCollectionFtuePhase } from './constants/collectionFtue';
import type { NewGardenFtuePhase } from './constants/newGardenFtue';
import {
  NEW_GARDEN_FTUE_GARDENS_BUTTON_ID,
  NEW_GARDEN_FTUE_WELCOME_DESCRIPTION,
  NEW_GARDEN_FTUE_WELCOME_TITLE,
  NEW_GARDEN_FTUE_WELCOME_TITLE_FONT_SIZE_REM,
  parseNewGardenFtuePhase,
} from './constants/newGardenFtue';
import { formatCompactNumber } from './utils/formatCompactNumber';
import { getPlantData } from './constants/plantData';
import { getPlantCoinValue } from './utils/plantValue';
import { getGoalsRequiredForLevel } from './utils/playerLevelGoals';
import { getGoalIconForPlantLevel } from './utils/plantGoalIcons';

const _earlyUserPrefs = loadUserPrefs();
const _earlyAudio = applySavedAudioSettingsEarly();

/** Coin per plant level (economy). */
export function getCoinValueForLevel(level: number): number {
  return getPlantCoinValue(level);
}

/** Dev cheat: coins added per "+1Mil Coins" tap / Shift+M. */
const DEV_CHEAT_ADD_MONEY_AMOUNT = 1_000_000;

type DevCheatOptions = {
  /** When true (default), discovery / level-up popups wait until settings closes. */
  deferPopups?: boolean;
};

const GOALS_AREA_LEFT_MARGIN_PX = 20;
const GOALS_AREA_RIGHT_MARGIN_PX = 40;
const GOALS_SLOT_STEP_PX = 75;
const COIN_GOAL_SLOT_INDEX = 4;
/** Wide layouts: if a 6th slot would fit, pin coin goal to the far right instead of slot 5. */
const COIN_GOAL_PIN_RIGHT_MIN_TRACK_PX = (COIN_GOAL_SLOT_INDEX + 2) * GOALS_SLOT_STEP_PX;

function firstThreePlantGoalSlotsFilled(slots: ('empty' | 'loading' | 'green' | 'completed')[]): boolean {
  return [0, 1, 2].every((i) => (slots[i] ?? 'empty') !== 'empty');
}

/** Collection FTUE: after “View Collection”, defer hole + finger until barn slide finishes. */
const COLLECTION_FTUE_INTRO_CTA_OVERLAY_DELAY_MS = 600;
/** Bounce + leaf burst on the flower panel before the intro finger fades in. */
const COLLECTION_FTUE_PANEL_BOUNCE_MS = 320;
/** Extra wait after bounce before the “Let’s upgrade” finger fades in. */
const COLLECTION_FTUE_INTRO_CTA_FINGER_DELAY_MS = 500;
/** Inset top edge of panel leaf burst so leaves spawn a bit lower than the panel top. */
const COLLECTION_FTUE_PANEL_LEAF_BURST_TOP_INSET_PX = 36;
/** After “Let’s upgrade”: pause before shelf plant bounce sequence. */
const COLLECTION_FTUE_SHELF_BOUNCE_START_DELAY_MS = 250;
/** Stagger between plant 1→4→FREE bounces on the FTUE shelf. */
const COLLECTION_FTUE_SHELF_PLANT_BOUNCE_STAGGER_MS = 250;
/** Matches `.mastery-unlock-purchase-bounce` duration. */
const COLLECTION_FTUE_SHELF_PLANT_BOUNCE_MS = 500;
/** FREE upgrade button bounce (1 → 1.2 → 1). */
const COLLECTION_FTUE_SHELF_FREE_BOUNCE_MS = 320;
/** After FREE bounce: pause before unlock finger fades in. */
const COLLECTION_FTUE_SHELF_FREE_FINGER_DELAY_MS = 500;
/** After bonuses panel bounce: pause before View Bonuses finger overlay. */
const COLLECTION_FTUE_BONUSES_OVERLAY_DELAY_MS = 500;
/** Fade-in for View Bonuses handoff. */
const COLLECTION_FTUE_UI_FADE_MS = 320;
/** Panel copy cream color; highlight green lives in `.collection-ftue-copy-color-settle` (#587e26). */
const COLLECTION_PANEL_COPY_COLOR = '#c2b280';

/** Merge with no matching goal: coin panel uses seed-surplus scale (default cream panel bg). */
const MERGE_COIN_HARVEST_PANEL_SCALE = 1.5;

/** sessionStorage: after Shift+L skips starter FTUE, show this level-up on next load. */
const DEV_SKIP_STARTER_FTUE_LEVEL_UP_KEY = 'pg_dev_skip_starter_ftue_level_up';

/** Goal difficulty scaling: 0.9 = easier, 1.0 = normal, 1.1 = harder, 1.2 = much harder */
const GOAL_DIFFICULTY_SCALING = 1.0;

/**
 * Strict Mode / duplicate updaters may run one logical spawn twice; one monotonic id per commit so remaining drops by at most 1.
 */
let goalDiscoverySpawnCommitSeq = 0;
let lastAppliedGoalDiscoverySpawnCommitSeq = -1;

function applyDiscoveryRemainingAfterSpawn(
  commitSeq: number,
  plantLevel: number,
  highestPlantEverMergeRef: { current: number },
  highestPlantEverStateRef: { current: number },
  remainingRef: { current: number }
): void {
  if (lastAppliedGoalDiscoverySpawnCommitSeq === commitSeq) return;
  lastAppliedGoalDiscoverySpawnCommitSeq = commitSeq;
  const h = Math.max(highestPlantEverMergeRef.current, highestPlantEverStateRef.current);
  if (plantLevel > h) {
    remainingRef.current = getDiscoveryGoalBuffer(h);
  } else {
    remainingRef.current = Math.max(0, remainingRef.current - 1);
  }
}

/** Authoritative highest for discovery: ref can lead/lag state for one tick — never use the lower of the two. */
function effectiveHighestPlantEverForDiscovery(
  mergeRef: { current: number },
  stateRef: { current: number }
): number {
  return Math.max(mergeRef.current, stateRef.current);
}

/**
 * When `dueDiscovery` was captured at spawn start (counter at 0, no live discovery elsewhere),
 * force exactly `effectiveHighest + 1`. Re-reads slot refs so sibling state is fresh.
 */
function finalizeDiscoveryGoalPlantLevelForSpawn(
  plantLevel: number,
  loadingIdx: number,
  dueDiscovery: boolean,
  mergeRef: { current: number },
  stateRef: { current: number },
  goalSlotsRef: { current: ('empty' | 'loading' | 'green' | 'completed')[] },
  goalPlantTypesRef: { current: number[] }
): number {
  if (!dueDiscovery) return plantLevel;
  const h = effectiveHighestPlantEverForDiscovery(mergeRef, stateRef);
  if (h >= MAX_PLANT_TIER) return plantLevel;
  const slots = goalSlotsRef.current;
  const types = goalPlantTypesRef.current;
  if (hasActiveDiscoveryGoalOnBoard(slots, types, loadingIdx, h)) return plantLevel;
  return h + 1;
}

/** Goal crop impact: clear bounce/flash after this many ms (matches ~500ms keyframes). */
const GOAL_IMPACT_CLEAR_MS = 400;
/** Coin goal (slot 5) hide animation duration — must match `.goal-slide-up-exit` in index.html. */
const COIN_GOAL_EXIT_MS = 400;

/**
 * Light-green “undiscovered tier” goal frame (only after FTUE 11 persistence is on).
 * FTUE-11 triple spawn: only plant 3 while highest < 3. Otherwise: any goal tier above highest discovered.
 */
function isDiscoveryLightGreenEligible(
  postFtue11: boolean,
  ftue11ThreePlantWindow: boolean,
  plantLevel: number,
  highestPlantEver: number
): boolean {
  if (!postFtue11) return false;
  if (ftue11ThreePlantWindow) return plantLevel === 3 && highestPlantEver < 3;
  const h = Math.max(0, Math.floor(highestPlantEver));
  return plantLevel > h && plantLevel >= 1 && h < MAX_PLANT_TIER;
}

/** Double Coins duration when granted from a limited-offer / upgrade-panel rewarded ad (offer has no duration in config). */
const REWARDED_DOUBLE_COINS_AD_DURATION_MS = 30 * 60 * 1000;
/** Pause after fake ad closes before daily-task 2× claim VFX (lets ad dismiss finish). */
/** Pause after daily allowance claim before swapping card art to the normal free offer. */
const DAILY_ALLOWANCE_UI_HOLD_AFTER_CLAIM_MS = 1000;
/** Delay after rewarded ad closes before applying daily-task 2x claim presentation. */
const DAILY_TASK_2X_CLAIM_AFTER_AD_MS = 250;

function buildPurchaseSuccessRewards(config: StoreCoinOfferConfig): PurchaseSuccessfulRewardRow[] {
  const rows: PurchaseSuccessfulRewardRow[] = [
    {
      offerLineText: config.offerLineText,
      durationText: config.durationText,
      ...(config.rewardStripIconPath ? { coinIconPath: config.rewardStripIconPath } : {}),
    },
  ];
  if ('extraRewardRows' in config && config.extraRewardRows?.length) {
    for (const r of config.extraRewardRows) {
      rows.push({
        offerLineText: r.offerLineText,
        durationText: r.durationText,
        ...(r.coinIconPath ? { coinIconPath: r.coinIconPath } : {}),
        ...(r.coinIconScale != null ? { coinIconScale: r.coinIconScale } : {}),
      });
    }
  }
  return rows;
}

/** Build limited offer popup state from offer id (uses offers.ts config). */
function buildLimitedOfferPopupState(
  offerId: string,
  overrides?: { activeBoostEndTime?: number; highestPlantEver?: number }
): {
  isVisible: boolean;
  title: string;
  imageSrc: string;
  subtitle: string;
  description: string;
  buttonText: string;
  offerId: string;
  tab: TabType;
  durationMinutes: number | null;
  durationSeconds?: number | null;
  activeBoostEndTime?: number;
  subtitleSettingsStyle?: boolean;
  hideOfferDurationBlock?: boolean;
  imageLevel?: number;
} | null {
  const resolvedOfferId = isLegacyCoinMultiplierOfferId(offerId) ? DOUBLE_COINS_OFFER_ID : offerId;
  const offer = getOfferById(resolvedOfferId);
  if (!offer) return null;
  const specialDeliveryLevel =
    offer.id === 'special_delivery'
      ? getSpecialDeliveryPlantLevel(overrides?.highestPlantEver)
      : null;
  const isCoinMult = isCoinMultiplierBoostId(resolvedOfferId);
  const imageSrc =
    specialDeliveryLevel != null
      ? getSpecialDeliveryPlantSpritePath(overrides?.highestPlantEver)
      : isCoinMult
        ? assetPath(getDoubleCoinsActiveBoostIcon())
        : assetPath(offer.headerIcon);
  return {
    isVisible: true,
    title: 'Limited Offer',
    imageSrc,
    ...(specialDeliveryLevel != null ? { imageLevel: specialDeliveryLevel } : {}),
    subtitle: isCoinMult ? 'Double Coins' : offer.title,
    description: offer.description,
    buttonText: 'Accept Offer',
    offerId: offer.id,
    tab: offer.upgradeTab,
    durationMinutes: isCoinMult ? null : offer.durationMinutes,
    durationSeconds: isCoinMult ? null : offer.durationSeconds ?? null,
    subtitleSettingsStyle: isCoinMult,
    ...overrides,
  };
}

function normalizeBoostOfferIdForMerge(offerId: string | undefined): string | undefined {
  if (!offerId) return undefined;
  return isLegacyCoinMultiplierOfferId(offerId) ? DOUBLE_COINS_OFFER_ID : offerId;
}

function boostIconForOfferId(offerId: string, fallbackIcon?: string): string {
  if (isCoinMultiplierBoostId(offerId)) return getDoubleCoinsActiveBoostIcon();
  const o = getOfferById(offerId);
  return o?.headerIcon ?? fallbackIcon ?? '/assets/icons/upgrades/icon_seedproduction.png';
}

function predictBoostParticleTargetSlot(prev: ActiveBoostData[], offerId: string | undefined): number {
  const oid = normalizeBoostOfferIdForMerge(offerId);
  if (!oid) return Math.min(Math.max(0, prev.length), MAX_VISIBLE_BOOST_SLOTS - 1);
  const idx = prev.findIndex((b) => normalizeBoostOfferIdForMerge(b.offerId) === oid);
  const raw = idx >= 0 ? idx : prev.length;
  return Math.min(raw, MAX_VISIBLE_BOOST_SLOTS - 1);
}

/** Same-offer boosts stack (one entry, time added). Distinct offers can exceed 5; bar shows first N visible. */
function applyBoostParticleImpact(prev: ActiveBoostData[], data: BoostParticleData): ActiveBoostData[] {
  let oid = normalizeBoostOfferIdForMerge(data.offerId ?? '');
  const iconPath = data.icon ?? '';
  if (!oid && (iconPath.includes('coinmultiplier') || iconPath.includes('coin_multiplier'))) {
    oid = DOUBLE_COINS_OFFER_ID;
  }
  const now = Date.now();
  /** Min 1ms: duration 0 used to make boosts instantly expired and broke wallet multipliers + indicator. */
  const added = Math.max(1, data.durationMs ?? 60000);

  if (!oid) {
    return [
      ...prev,
      {
        id: `boost-${now}`,
        endTime: now + added,
        durationMs: added,
        icon: data.icon ?? '/assets/icons/upgrades/icon_seedproduction.png',
        offerId: data.offerId,
      },
    ];
  }

  const matchIndex = prev.findIndex((b) => normalizeBoostOfferIdForMerge(b.offerId) === oid);

  if (matchIndex < 0) {
    const icon = boostIconForOfferId(oid, data.icon);
    return [
      ...prev,
      {
        id: `boost-${oid}-${now}`,
        endTime: now + added,
        durationMs: added,
        icon,
        offerId: oid,
      },
    ];
  }

  const existing = prev[matchIndex];
  const remaining = Math.max(0, existing.endTime - now);
  const newRemaining = remaining + added;
  const icon = boostIconForOfferId(oid, existing.icon || data.icon);

  return prev.map((b, i) =>
    i === matchIndex
      ? {
          ...b,
          endTime: now + newRemaining,
          durationMs: newRemaining,
          icon,
          offerId: oid,
        }
      : b
  );
}

function normalizeActiveBoostsAfterLoad(boosts: ActiveBoostData[]): ActiveBoostData[] {
  const now = Date.now();
  const list = boosts
    .filter((b) => b.endTime > now)
    .map((b) => {
      let oid = normalizeBoostOfferIdForMerge(b.offerId) ?? b.offerId;
      const ic = b.icon ?? '';
      if (!oid && (ic.includes('coinmultiplier') || ic.includes('coin_multiplier'))) {
        oid = DOUBLE_COINS_OFFER_ID;
      }
      const remaining = Math.max(0, b.endTime - now);
      const durationMs = b.durationMs > 0 ? b.durationMs : Math.max(1, remaining);
      return {
        ...b,
        offerId: oid,
        icon: boostIconForOfferId(oid ?? '', b.icon),
        durationMs,
      };
    });

  const byOffer = new Map<string, ActiveBoostData[]>();
  for (const b of list) {
    const key = b.offerId ?? '';
    if (!byOffer.has(key)) byOffer.set(key, []);
    byOffer.get(key)!.push(b);
  }

  const merged: ActiveBoostData[] = [];
  for (const [oid, group] of byOffer) {
    if (group.length === 1) {
      merged.push(group[0]);
      continue;
    }
    const totalRemain = group.reduce((s, b) => s + Math.max(0, b.endTime - now), 0);
    const first = group[0];
    merged.push({
      ...first,
      offerId: oid,
      icon: boostIconForOfferId(oid, first.icon),
      endTime: now + totalRemain,
      durationMs: totalRemain,
    });
  }
  return merged;
}

/** Discovery popup coin reward = `getCoinValueForLevel(plant)` × this (before Double Coins boost). */
const PLANT_DISCOVERY_COIN_MULTIPLIER = 10;

/** After every committed goal plant level (loading→green), including discovery `highest+1` and FTUE spawns. Keeps save tuple + HUD in sync. */
function recordSpawnedGoalPlantLevel(
  plantLevel: number,
  tupleRef: { current: [number, number] },
  hudRef: { current: number }
): void {
  tupleRef.current = [tupleRef.current[1], plantLevel];
  hudRef.current = plantLevel;
}

/** Plant tiers already used by other goal slots (green / loading / completed). Excludes `exceptSlotIdx` (the slot we are filling). */
function collectOccupiedGoalPlantTiers(
  slots: ('empty' | 'loading' | 'green' | 'completed')[],
  types: number[],
  exceptSlotIdx: number
): Set<number> {
  const out = new Set<number>();
  slots.forEach((st, i) => {
    if (i === exceptSlotIdx) return;
    if (st !== 'green' && st !== 'loading' && st !== 'completed') return;
    const t = types[i] ?? 0;
    if (t >= 1) out.add(t);
  });
  return out;
}

/** Same as `collectOccupiedGoalPlantTiers` but only green/loading — completed orders must not block the next discovery spawn. */
function collectOccupiedGoalPlantTiersActive(
  slots: ('empty' | 'loading' | 'green' | 'completed')[],
  types: number[],
  exceptSlotIdx: number
): Set<number> {
  const out = new Set<number>();
  slots.forEach((st, i) => {
    if (i === exceptSlotIdx) return;
    if (st !== 'green' && st !== 'loading') return;
    const t = types[i] ?? 0;
    if (t >= 1) out.add(t);
  });
  return out;
}

/** True if another slot already has a live discovery-order tier (`highest + 1`). Completed slots do not count. */
function hasActiveDiscoveryGoalOnBoard(
  slots: ('empty' | 'loading' | 'green' | 'completed')[],
  types: number[],
  exceptSlotIdx: number,
  highestPlantEver: number
): boolean {
  if (highestPlantEver >= MAX_PLANT_TIER) return false;
  const d = highestPlantEver + 1;
  return slots.some(
    (s, i) =>
      i !== exceptSlotIdx &&
      (s === 'green' || s === 'loading') &&
      (types[i] ?? 0) === d
  );
}

function tiersInRangeAvoidingForbidden(
  minL: number,
  maxL: number,
  forbidden: Set<number>
): number[] {
  const c: number[] = [];
  for (let L = minL; L <= maxL; L++) {
    if (!forbidden.has(L)) c.push(L);
  }
  return c;
}

/**
 * If `chosen` collides with `forbidden`, pick another tier (preferred band → seed floor..discovered → discovery or duplicate).
 * Discovery fallback only when `allowDiscoveryTierFallback` (counter exhausted + no discovery order already on board).
 */
function resolveGoalPlantLevelAgainstForbidden(
  chosen: number,
  forbidden: Set<number>,
  highestPlantEver: number,
  minLevel: number,
  seedLevel: number,
  allowDiscoveryTierFallback: boolean
): number {
  if (chosen > highestPlantEver) return chosen;
  if (!forbidden.has(chosen)) return chosen;
  const maxDiscovered = Math.min(MAX_PLANT_TIER, Math.max(1, highestPlantEver));
  const effectiveMin = Math.max(minLevel, seedLevel);
  const seedFloor = Math.max(1, seedLevel);
  const bands = [
    tiersInRangeAvoidingForbidden(effectiveMin, maxDiscovered, forbidden),
    tiersInRangeAvoidingForbidden(seedFloor, maxDiscovered, forbidden),
  ];
  for (const pool of bands) {
    if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
  }
  if (
    allowDiscoveryTierFallback &&
    highestPlantEver < MAX_PLANT_TIER &&
    !forbidden.has(highestPlantEver + 1)
  ) {
    return highestPlantEver + 1;
  }
  for (let L = effectiveMin; L <= maxDiscovered; L++) {
    return L;
  }
  for (let L = seedFloor; L <= maxDiscovered; L++) {
    return L;
  }
  return chosen;
}

/**
 * Pick plant level for a new goal.
 * - `lastCommitted`: last HUD spawn tier before this pick (frozen snapshot).
 * - `occupiedSiblingTiers`: tiers already on other goal slots — never duplicate these when any alternative exists.
 */
const pickGoalPlantLevel = (
  highestPlantEver: number,
  minLevel: number,
  seedLevel: number,
  discoveryGoalsRemainingRef: { current: number },
  lastMergeDiscoveryLevelRef: { current: number },
  lastCommitted: number,
  occupiedSiblingTiers: Set<number>,
  occupiedActiveSiblingTiers: Set<number>,
  hasDiscoveryGoalOnBoard: boolean
): number => {
  const forbiddenBase = (): Set<number> => {
    const f = new Set(occupiedSiblingTiers);
    if (lastCommitted >= 1) f.add(lastCommitted);
    return f;
  };
  /** Only other live slots can block the next discovery tier — not lastCommitted (can be stale after completes). */
  const forbiddenDiscovery = (): Set<number> => new Set(occupiedActiveSiblingTiers);

  const pickRandomNormalGoal = (): number => {
    const effectiveMin = Math.max(minLevel, seedLevel);
    const maxForRandom = Math.min(MAX_PLANT_TIER, highestPlantEver);
    const forbidden = forbiddenBase();
    const preferred = tiersInRangeAvoidingForbidden(effectiveMin, maxForRandom, forbidden);
    if (preferred.length > 0) {
      return preferred[Math.floor(Math.random() * preferred.length)];
    }
    const seedFloor = Math.max(1, seedLevel);
    const wide = tiersInRangeAvoidingForbidden(seedFloor, maxForRandom, forbidden);
    if (wide.length > 0) {
      return wide[Math.floor(Math.random() * wide.length)];
    }
    if (effectiveMin <= maxForRandom) {
      const levels: number[] = [];
      for (let L = effectiveMin; L <= maxForRandom; L++) levels.push(L);
      return levels[Math.floor(Math.random() * levels.length)];
    }
    return Math.max(seedLevel, Math.min(MAX_PLANT_TIER, effectiveMin));
  };

  if (hasDiscoveryGoalOnBoard) {
    return pickRandomNormalGoal();
  }
  if (lastMergeDiscoveryLevelRef.current !== highestPlantEver) {
    lastMergeDiscoveryLevelRef.current = highestPlantEver;
    // Do not refill remaining here — that erases real countdown progress when lastMerge was stale vs hydrate/highest.
  }
  if (highestPlantEver < MAX_PLANT_TIER && discoveryGoalsRemainingRef.current <= 0) {
    const nextDiscover = highestPlantEver + 1;
    const forbidden = forbiddenDiscovery();
    if (forbidden.has(nextDiscover)) {
      return pickRandomNormalGoal();
    }
    return nextDiscover;
  }
  return pickRandomNormalGoal();
};

/** Crops required for goal order. Scales with player level (+1 base every 2 levels), crop yield, and has random variation. */
const getGoalCropRequired = (
  playerLevel: number,
  cropYieldLevel: number,
  goalDifficultyScaling: number = GOAL_DIFFICULTY_SCALING
): number => {
  const baseGoal =
    3 + Math.floor(cropYieldLevel * 0.5) + Math.floor(playerLevel / 2);
  const variationRange = 1 + Math.floor(playerLevel / 10);
  const randomOffset = Math.floor(Math.random() * (2 * variationRange + 1)) - variationRange;
  const variedGoal = baseGoal + randomOffset;
  const scaledGoal = Math.round(variedGoal * goalDifficultyScaling);
  return Math.max(3, scaledGoal);
};
import { ErrorBoundary } from './components/ErrorBoundary';

/**
 * Upgrade panel open height is a % of the design canvas (same idea as the old 42% / 45vh / 30vh
 * system). Closed peek is tabs-only. Open/close is TRANSFORM-ONLY via WAAPI tweens (no per-frame
 * JS style writes; browser interpolates panel / seed-harvest / hex poses).
 *
 * Git history: h-[42%] → calc(45vh - 55px) → calc(30vh - 55px) (hex/customer safe areas) → fixed 279.
 * Restored as 25% of designHeight (tuned from the historical 30vh / 42% lineage).
 */
const UPGRADE_PANEL_OPEN_HEIGHT_FRAC = 0.25;
/** Visible closed peek above the column bottom (= UpgradeTabs 43px + thin pad). */
const UPGRADE_PANEL_CLOSED_VISIBLE_PX = 50;
/** Floor / ceiling so extreme aspect ratios stay usable. */
const UPGRADE_PANEL_EXPANDED_MIN_PX = 180;
const UPGRADE_PANEL_EXPANDED_MAX_PX = 420;

function getUpgradePanelExpandedHeightPx(designHeightPx: number): number {
  const raw = Math.round(designHeightPx * UPGRADE_PANEL_OPEN_HEIGHT_FRAC);
  return Math.max(
    UPGRADE_PANEL_EXPANDED_MIN_PX,
    Math.min(UPGRADE_PANEL_EXPANDED_MAX_PX, raw),
  );
}

/** Shared scale for bottom / left / right / gradient garden sprites (relative to each other). */
const GARDEN_SIDE_SPRITE_SCALE = 0.6;
/** Pin garden backgrounds this many px below the upgrade panel tab underline. */
const GARDEN_BG_TAB_LINE_OFFSET_PX = 20;
/**
 * Extra downward shift for garden side/bottom/gradient layers when the panel is closed
 * (open pose unchanged). Matches pre-simplify panel motion.
 */
const GARDEN_BG_CLOSED_EXTRA_DOWN_PX = 10;
/**
 * Closed-only lift for bottom/left/right/gradient (same Y so bottoms line up).
 * Open pose unchanged. Slightly less than prior 30px side lift = tiny bit lower.
 */
const GARDEN_SIDE_CLOSED_LIFT_PX = 20;
/** Nudge collection column right to clear subpixel seam bleed on garden (design px). */
const BARN_CAROUSEL_SEAM_OFFSET_PX = 1;
const COLLECTION_BACKGROUND_WIDTH_PX = 2000;
const COLLECTION_BACKGROUND_IMAGE = assetPath('/assets/collection/background_collection.webp');
const COLLECTION_CONTENT_BOTTOM_PAD_PX = 140;
/** Widest collection art (shelf); barn scale targets filling the design column on phones. */
const COLLECTION_BARN_LAYOUT_WIDTH_PX = 490;
const COLLECTION_ROOF_WIDTH_PX = 800;
/** Native `collection_roof.png` height ÷ width (2048×512). */
const COLLECTION_ROOF_ASPECT_HEIGHT = 512 / 2048;

/**
 * Panel open/close: browser WAAPI tweens (same poses / travels / ease-out curve as before).
 * Movers: panel + seed/harvest (full --ppd), hex + centers (half --pcd), grass (half),
 * sides/bottom/gradient (--pgd + shared closed lift so bottoms align).
 */
const UPGRADE_PANEL_ANIM_DURATION_MS = 800;
/** Matches prior easeOutQuint (1-(1-t)^5) closely for WAAPI. */
const UPGRADE_PANEL_WAAPI_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

// Preload popup assets on module load to prevent flash of unstyled content
const POPUP_ASSETS_TO_PRELOAD = [
  assetPath('/assets/ui/popup_header.png'),
  assetPath('/assets/ui/popup_divider.png'),
  assetPath('/assets/vfx/particle_leaf_green_1.png'),
  assetPath('/assets/vfx/particle_leaf_green_2.png'),
  assetPath('/assets/plants/pots/pot_normal.png'),
  assetPath('/assets/plants/pots/pot_gold.png'),
  ...SHIPPED_GARDEN_IDS.flatMap((gardenId) =>
    [1, 2, 3, 4, 5].map((n) =>
      assetPath(`/assets/icons/goals/${gardenId}/icon_goal_${n}.png`),
    ),
  ),
];

POPUP_ASSETS_TO_PRELOAD.forEach((src) => {
  const img = new Image();
  img.src = src;
});

/** Load + decode icon before goal bounce/transition so the sprite does not pop in mid-animation. */
function preloadGoalOrderIcon(plantLevel: number): Promise<void> {
  const url = getGoalIconForPlantLevel(plantLevel);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    };
    img.onerror = () => resolve();
    img.src = url;
  });
}

/** Negative animation-delay so every barn plant mastery glow shares the same phase. */
const PLANT_MASTERY_GLOW_ANIM_DELAY_SEC = -((Date.now() % PLANT_MASTERY_GLOW_MS) / 1000);

type PlantMasterySlice = {
  ordersProgress: number;
  targetLevel: number;
  unlockPending: number[];
  unlockedLevels: number[];
  /** First barn visit from L5: fake 4 + 15/15 bar, then real L5 + 0/20 after intro clears. */
  plantMasteryIntroBarComplete: boolean;
};

// Helper to calculate hex distance from center (0,0) in axial coordinates
const getHexDistance = (q: number, r: number): number => {
  return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
};

/** FTUE_2: first two seeds always land in these two cells (4 and 13). Order doesn't matter. */
const FTUE_2_SEED_CELL_A = 4;
const FTUE_2_SEED_CELL_B = 13;

const generateInitialGrid = (): BoardCell[] => {
  const cells: BoardCell[] = [];
  for (let q = -2; q <= 2; q++) {
    const r1 = Math.max(-2, -q - 2);
    const r2 = Math.min(2, -q + 2);
    for (let r = r1; r <= r2; r++) {
      // Outer ring (distance 2 from center) starts locked
      const distance = getHexDistance(q, r);
      const locked = distance === 2;
      cells.push({ q, r, item: null, locked });
    }
  }
  return cells;
};

export interface ProjectileData {
  id: string;
  startX: number;
  startY: number;
  targetIdx: number;
  plantLevel: number; // The level of plant to spawn on impact
  /** When true, projectile is Special Delivery: on impact spawn or upgrade cell, then beam + bounce */
  isSpecialDelivery?: boolean;
  /** Lucky Seed bonus shot: distinct yellow trail / head (coin gold tone). */
  isLuckyGrowth?: boolean;
}

/** First mount after "Reset progress": strip stray save + skip quick resume. Also used for normal quick-resume detection. */
function getInitialQuickResumeLoad(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem('pocket-garden-reset-v1') === '1') {
      sessionStorage.removeItem('pocket-garden-reset-v1');
      clearGameSave();
      return false;
    }
  } catch {
    /* ignore */
  }
  try {
    const s = loadGameSave();
    return !!(s && s.v === GAME_SAVE_VERSION);
  } catch {
    return false;
  }
}

/**
 * Max merge **result** tier allowed while plant orders are open: `min` of active green goal plant types.
 * Merging L+L → (L+1) must satisfy (L+1) ≤ cap, so we never auto-merge past the strictest open order (e.g. order for 4 blocks 4+4→5).
 * No plant goals → null (no cap except level 24).
 */
function getActiveOrderMergeResultCap(
  goalPlantTypes: number[],
  goalSlots: ('empty' | 'loading' | 'green' | 'completed')[],
  goalCounts: number[]
): number | null {
  const tiers: number[] = [];
  for (let i = 0; i < goalPlantTypes.length; i++) {
    const pt = goalPlantTypes[i];
    if (pt < 1 || pt > MAX_PLANT_TIER) continue;
    if (goalSlots[i] !== 'green') continue;
    if ((goalCounts[i] ?? 0) <= 0) continue;
    tiers.push(pt);
  }
  if (tiers.length === 0) return null;
  return Math.min(...tiers);
}

/**
 * Targets of in-flight seeds whose plant is not on the grid yet (`spawnCropAt` runs in onImpact but the
 * projectile stays mounted until the fly animation ends). Excluding only these cells fixes auto-merge stalling
 * while other mergable pairs are already valid.
 */
function getPendingSeedImpactTargets(grid: BoardCell[], projectiles: ProjectileData[]): Set<number> {
  const pending = new Set<number>();
  for (const p of projectiles) {
    const cell = grid[p.targetIdx];
    if (!cell?.item) pending.add(p.targetIdx);
  }
  return pending;
}

/** Same merge eligibility as manual play (HexBoard drop): same level + type, not locked, not max tier; not hex-adjacency. */
function canAutoMergePlantPair(
  grid: BoardCell[],
  i: number,
  j: number,
  mergeResultCap: number | null,
  excludeCells?: ReadonlySet<number>
): boolean {
  if (excludeCells?.has(i) || excludeCells?.has(j)) return false;
  const cell = grid[i];
  const other = grid[j];
  if (!cell?.item || cell.locked || !other?.item || other.locked) return false;
  if (other.item.level !== cell.item.level || other.item.type !== cell.item.type) return false;
  const L = cell.item.level;
  if (L >= MAX_PLANT_TIER) return false;
  if (mergeResultCap != null && L + 1 > mergeResultCap) return false;
  return true;
}

/**
 * Pick a merge pair matching **player** rules: any two unlocked plants with same level/type may merge (fly across the board).
 * Lowest tier first, then deterministic (smaller source index, then target).
 */
function findBestAutoMergePair(
  grid: BoardCell[],
  mergeResultCap: number | null,
  excludeCells?: ReadonlySet<number>
): { sourceIdx: number; targetIdx: number } | null {
  let minTier = Infinity;
  for (let i = 0; i < grid.length; i++) {
    for (let j = i + 1; j < grid.length; j++) {
      if (!canAutoMergePlantPair(grid, i, j, mergeResultCap, excludeCells)) continue;
      const L = grid[i].item!.level;
      if (L < minTier) minTier = L;
    }
  }
  if (minTier === Infinity) return null;

  let bestA = -1;
  let bestB = -1;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i].item?.level !== minTier) continue;
    for (let j = i + 1; j < grid.length; j++) {
      if (!canAutoMergePlantPair(grid, i, j, mergeResultCap, excludeCells)) continue;
      if (grid[j].item!.level !== minTier) continue;
      if (bestA < 0 || i < bestA || (i === bestA && j < bestB)) {
        bestA = i;
        bestB = j;
      }
    }
  }
  if (bestA < 0) return null;
  return { sourceIdx: bestA, targetIdx: bestB };
}

/** Wait after seed impact or merge settle before running auto-merge scan. */
const AUTO_MERGE_POST_SETTLE_MS = 500;
/** Second full-board scan after a programmatic merge (catches another pair if the first try was early or state was still settling). */
const AUTO_MERGE_POST_MERGE_FOLLOWUP_MS = AUTO_MERGE_POST_SETTLE_MS + 120;
const AUTO_MERGE_POLL_MS = 320;
/** When the primary scan finds no pair, retry after this delay (transient mid-merge / React commit timing). Up to 2 passes per “empty” streak. */
const AUTO_MERGE_NULL_BACKUP_MS = 500;
/** Auto-merge must not start until this long after a plant lands from a seed, if that plant is part of the chosen pair. */
const AUTO_MERGE_SEED_INVOLVED_GRACE_MS = 1000;

function autoMergeSeedGraceRemainMsForPair(
  sourceIdx: number,
  targetIdx: number,
  now: number,
  landMap: ReadonlyMap<number, number>
): number {
  let remain = 0;
  for (const idx of [sourceIdx, targetIdx]) {
    const ts = landMap.get(idx);
    if (ts != null) remain = Math.max(remain, AUTO_MERGE_SEED_INVOLVED_GRACE_MS - (now - ts));
  }
  return remain;
}

type BarnShelfPlantSlotProps = {
  gardenId: GardenId;
  plantLevel: number;
  isPlantDiscovered: boolean;
  showMasteryUnlock: boolean;
  isMasteryPurchaseBounce: boolean;
  barnCellStackZ: number;
  mastered: boolean;
  masteryAdditiveGlow: boolean;
  masteryGlowDelaySec: number;
  onOpenPlantInfo: () => void;
};

type BarnShelfUpgradeButtonProps = {
  gardenId: GardenId;
  coinCost?: number;
  canAfford?: boolean;
  ftueUnlockTarget?: boolean;
  /** FTUE: bounce + brown→green color settle when FREE reveals. */
  ftueRevealBounce?: boolean;
  /** Disabled CTA when the active shelf has no discovered plants left to upgrade. */
  discoverMorePlants?: boolean;
  leafBurst?: { id: string; rectWidth: number; rectHeight: number } | null;
  onLeafBurstComplete?: () => void;
  buttonRootRef?: React.RefObject<HTMLDivElement | null>;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

/** One upgrade CTA per shelf — centered on the upgrade sprite strip. */
function BarnShelfUpgradeButton({
  gardenId,
  coinCost = 0,
  canAfford = true,
  ftueUnlockTarget = false,
  ftueRevealBounce = false,
  discoverMorePlants = false,
  leafBurst = null,
  onLeafBurstComplete,
  buttonRootRef,
  onClick,
}: BarnShelfUpgradeButtonProps) {
  const [pressed, setPressed] = useState(false);
  const disabledBrown = discoverMorePlants || !canAfford;
  const buttonBg = disabledBrown ? '#e3c28c' : '#b8d458';
  const buttonBorder = disabledBrown ? '#c7a36e' : COLLECTION_SHELF_UPGRADE_BUTTON_DARK_COLOR;
  const buttonText = disabledBrown ? '#a68e64' : COLLECTION_SHELF_UPGRADE_BUTTON_DARK_COLOR;
  const buttonShadow = disabledBrown
    ? 'none'
    : '0 3px 0 #6e8d2d, 0 5px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.35)';
  const colorTransition = ftueRevealBounce
    ? `background-color ${COLLECTION_FTUE_SHELF_FREE_BOUNCE_MS}ms ease-out, border-color ${COLLECTION_FTUE_SHELF_FREE_BOUNCE_MS}ms ease-out, color ${COLLECTION_FTUE_SHELF_FREE_BOUNCE_MS}ms ease-out, box-shadow ${COLLECTION_FTUE_SHELF_FREE_BOUNCE_MS}ms ease-out`
    : undefined;

  useEffect(() => {
    if (!pressed) return;
    const clear = () => setPressed(false);
    window.addEventListener('pointerup', clear);
    window.addEventListener('pointercancel', clear);
    return () => {
      window.removeEventListener('pointerup', clear);
      window.removeEventListener('pointercancel', clear);
    };
  }, [pressed]);

  return (
    <div
      ref={buttonRootRef}
      className="absolute left-1/2 pointer-events-auto"
      style={{
        top: COLLECTION_SHELF_UPGRADE_BUTTON_TOP_PX,
        transform: 'translate(-50%, -50%)',
        zIndex: 8,
      }}
    >
      {leafBurst && (
        <div
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            width: leafBurst.rectWidth,
            height: leafBurst.rectHeight,
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
          }}
        >
          <PopupRectLeafBurst
            key={leafBurst.id}
            rectWidth={leafBurst.rectWidth}
            rectHeight={leafBurst.rectHeight}
            zIndex={0}
            onComplete={onLeafBurstComplete}
          />
        </div>
      )}
      <div
        className={`relative inline-flex rounded-full${ftueRevealBounce ? ' collection-ftue-free-button-bounce' : ''}`}
        style={{
          backgroundColor: COLLECTION_SHELF_UPGRADE_BUTTON_RING_COLOR,
          boxSizing: 'border-box',
          padding: 2,
          zIndex: 1,
        }}
      >
        <button
            type="button"
            id={ftueUnlockTarget ? 'collection-ftue-unlock-1' : undefined}
            disabled={disabledBrown}
            className={`flex select-none items-center justify-center rounded-full font-bold whitespace-nowrap ${
              disabledBrown
                ? 'cursor-default'
                : 'shadow-[0_3px_0_#6e8d2d,0_5px_10px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.35)] active:translate-y-[1px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]'
            }`}
            style={{
              boxSizing: 'border-box',
              width: COLLECTION_SHELF_UPGRADE_BUTTON_WIDTH_PX,
              height: COLLECTION_SHELF_UPGRADE_BUTTON_HEIGHT_PX,
              paddingLeft: discoverMorePlants ? 0 : 10,
              paddingRight: discoverMorePlants ? 0 : 10,
              gap: 6,
              backgroundColor: buttonBg,
              border: `${COLLECTION_SHELF_UPGRADE_BUTTON_BORDER_PX}px solid ${buttonBorder}`,
              color: buttonText,
              fontFamily: 'Inter, sans-serif',
              fontSize: COLLECTION_SHELF_UPGRADE_BUTTON_FONT_PX,
              letterSpacing: discoverMorePlants ? '-0.045em' : undefined,
              lineHeight: 1,
              textShadow: disabledBrown ? 'none' : '0 1px 0 rgba(255,255,255,0.3)',
              boxShadow: buttonShadow,
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              transition: colorTransition,
            }}
            onPointerDown={(e) => {
              if (e.button !== 0 || disabledBrown) return;
              setPressed(true);
            }}
            onKeyDown={(e) => {
              if (disabledBrown) return;
              if (e.key === 'Enter' || e.key === ' ') setPressed(true);
            }}
            onKeyUp={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setPressed(false);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setPressed(false);
              if (disabledBrown || discoverMorePlants) return;
              onClick?.(e);
            }}
          >
            {discoverMorePlants ? (
              'Discover More Plants'
            ) : (
              <>
                Upgrade
                <img
                  src={getGardenCoinIconPath(gardenId)}
                  alt=""
                  className="shrink-0 object-contain"
                  style={{
                    width: COLLECTION_SHELF_UPGRADE_BUTTON_COIN_PX,
                    height: COLLECTION_SHELF_UPGRADE_BUTTON_COIN_PX,
                  }}
                  draggable={false}
                />
                {coinCost === 0 ? 'FREE' : formatCompactNumber(coinCost)}
              </>
            )}
          </button>
      </div>
    </div>
  );
}

/** Shelf cell: plant sprite + tap hitbox; shared sprite press feedback (CDN Tailwind :has() was unreliable). */
function BarnShelfPlantSlot({
  gardenId,
  plantLevel,
  isPlantDiscovered,
  showMasteryUnlock,
  isMasteryPurchaseBounce,
  barnCellStackZ,
  mastered,
  masteryAdditiveGlow,
  masteryGlowDelaySec,
  onOpenPlantInfo,
}: BarnShelfPlantSlotProps) {
  const [spritePressed, setSpritePressed] = useState(false);
  const isAnyShelfBounceActive = isMasteryPurchaseBounce;
  const barnPlantHitboxW = 72;
  const barnPlantHitboxH = Math.round(barnPlantHitboxW * 1.2);

  useEffect(() => {
    if (!spritePressed) return;
    const clear = () => setSpritePressed(false);
    window.addEventListener('pointerup', clear);
    window.addEventListener('pointercancel', clear);
    return () => {
      window.removeEventListener('pointerup', clear);
      window.removeEventListener('pointercancel', clear);
    };
  }, [spritePressed]);

  const onSpritePressPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setSpritePressed(true);
  };

  return (
    <div
      data-barn-plant-key={getCollectionPlantKey(gardenId, plantLevel)}
      className={`relative flex items-center justify-center shrink-0 pointer-events-none ${
        isMasteryPurchaseBounce ? 'mastery-unlock-purchase-bounce' : ''
      }`}
      style={{
        width: '95px',
        height: '95px',
        // Bounce above neighbors even when the pot is empty (undiscovered).
        zIndex: isMasteryPurchaseBounce ? 40 + plantLevel : barnCellStackZ,
      }}
    >
      <div
        className={`relative z-10 flex h-full w-full items-center justify-center pointer-events-none ${
          isPlantDiscovered
            ? isAnyShelfBounceActive
              ? ''
              : 'transition-transform duration-75'
            : ''
        } ${spritePressed ? 'scale-95' : ''}`}
      >
        <PlantWithPot
          level={isPlantDiscovered ? plantLevel : 0}
          gardenId={gardenId}
          mastered={mastered}
          className={isMasteryPurchaseBounce ? 'mastery-unlock-white-flash' : ''}
          wrapperClassName="h-full w-full"
          masteryAdditiveGlow={masteryAdditiveGlow}
          masteryGlowDelaySec={masteryGlowDelaySec}
        />
      </div>
      <button
        type="button"
        aria-label={
          isPlantDiscovered ? `Open plant ${plantLevel} details` : `Plant ${plantLevel} locked`
        }
        tabIndex={isPlantDiscovered ? 0 : -1}
        className={`absolute rounded-md p-0 outline-none ${isPlantDiscovered ? 'cursor-pointer' : 'cursor-default'}`}
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: barnPlantHitboxW,
          height: barnPlantHitboxH,
          zIndex: 25,
          backgroundColor: 'transparent',
          border: 'none',
          pointerEvents: isPlantDiscovered ? 'auto' : 'none',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
        onPointerDown={onSpritePressPointerDown}
        onClick={(e) => {
          e.stopPropagation();
          if (!isPlantDiscovered) return;
          onOpenPlantInfo();
        }}
        onKeyDown={(e) => {
          if (!isPlantDiscovered) return;
          if (e.key === 'Enter' || e.key === ' ') {
            setSpritePressed(true);
            e.preventDefault();
            e.stopPropagation();
            onOpenPlantInfo();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setSpritePressed(false);
        }}
      />
    </div>
  );
}

const GARDEN_SWITCH_OVERLAY_COLOR = '#282020';
const GARDEN_SWITCH_FADE_OUT_MS = 400;
const GARDEN_SWITCH_HOLD_MS = 200;
const GARDEN_SWITCH_FADE_IN_MS = 400;

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function animateGardenSwitchOverlayOpacity(
  setOpacity: (value: number) => void,
  from: number,
  to: number,
  durationMs: number,
): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setOpacity(from + (to - from) * t);
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

export default function App() {
  // Loading screen state
  const [isLoading, setIsLoading] = useState(true);
  const [gameOpacity, setGameOpacity] = useState(0);
  /** Skip splash when a valid save exists at first paint (quick black fade instead). */
  const [useQuickResumeLoad] = useState(getInitialQuickResumeLoad);
  const pendingQuickLoadFinishRef = useRef(false);
  
  const [activeTab, setActiveTab] = useState<TabType>('SEEDS');
  const [activeScreen, setActiveScreen] = useState<ScreenType>('FARM');
  const activeScreenRef = useRef<ScreenType>(activeScreen);
  activeScreenRef.current = activeScreen;
  const [storeScrollToCoinSectionRequest, setStoreScrollToCoinSectionRequest] = useState(0);
  const [starterPackPurchased, setStarterPackPurchased] = useState(readStarterPackPurchased);
  const [starterPackUnlocked, setStarterPackUnlocked] = useState(readStarterPackUnlocked);
  const [starterPackCountdownRefreshKey, setStarterPackCountdownRefreshKey] = useState(0);
  const [fieldPackPurchased, setFieldPackPurchased] = useState(readFieldPackPurchased);
  const [fieldPackUnlocked, setFieldPackUnlocked] = useState(readFieldPackUnlocked);
  const [fieldPackCountdownRefreshKey, setFieldPackCountdownRefreshKey] = useState(0);
  const [dailyTasksCountdownRefreshKey, setDailyTasksCountdownRefreshKey] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  /** Live open/close progress (0 = closed, 1 = open). Settled by WAAPI; used to undo slides when measuring. */
  const panelProgressRef = useRef(0);
  /** Settled open panel height (design px); updated when designHeight changes. */
  const upgradePanelExpandedHeightRef = useRef(getUpgradePanelExpandedHeightPx(796));
  const isExpandedRef = useRef(isExpanded);
  isExpandedRef.current = isExpanded;
  /** True once the panel's close animation has fully settled (or it never opened). Gates FTUE 11. */
  const [panelClosed, setPanelClosed] = useState(!isExpanded);
  /** True only while open/close rAF is running — pauses ambient leaves for that window. */
  const [panelMotionActive, setPanelMotionActive] = useState(false);
  /** Open-pose garden bg anchors (panel height is fixed; full-bleed layers do not tween). */
  const gardenBgOpenRef = useRef<{ gl: number; cl: number; ct: number } | null>(null);
  /** While true, ResizeObserver must not remeasure garden anchors (WAAPI owns transforms). */
  const panelBgAnimatingRef = useRef(false);
  const [money, setMoney] = useState(0);
  // Used for synchronous updates during pagehide/unload so persisted snapshots are correct.
  const moneyRef = useRef<number>(money);
  useEffect(() => {
    moneyRef.current = money;
  }, [money]);

  const [grid, setGrid] = useState<BoardCell[]>(generateInitialGrid());
  const [seedProgress, setSeedProgress] = useState(0);
  const [harvestProgress, setHarvestProgress] = useState(0);
  const [isSeedFlashing, setIsSeedFlashing] = useState(false);
  const [harvestCharges, setHarvestCharges] = useState(3);
  const harvestChargesRef = useRef(3);
  harvestChargesRef.current = harvestCharges;
  /** Ephemeral label above seed/harvest SideAction when an action is blocked (white text, no panel) */
  const [sideButtonToast, setSideButtonToast] = useState<{
    anchor: 'seed' | 'harvest';
    message: string;
    id: number;
  } | null>(null);
  const sideButtonToastTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const sideButtonToastIdRef = useRef(0);
  const [seedsState, setSeedsState] = useState(createInitialSeedsState);
  const [harvestState, setHarvestState] = useState<HarvestState>(createInitialHarvestState);
  const [cropsState, setCropsState] = useState<Record<string, UpgradeState>>(createInitialCropsState);
  const [highestPlantEver, setHighestPlantEver] = useState(1); // Track highest plant level ever created
  const highestPlantEverRef = useRef(1);
  /** Latest committed React state — mergeRef can update before re-render; max(merge, state) is the real highest for goals. */
  const highestPlantEverStateRef = useRef(highestPlantEver);
  highestPlantEverStateRef.current = highestPlantEver;
  const [seedsInStorage, setSeedsInStorage] = useState(5); // Start 5/5; max grows with Storage Capacity (15)
  /** Persist/hydrate must use this — React state can lag and overwrite idle-simmed seed counts with 0. */
  const seedsInStorageRef = useRef(5);
  seedsInStorageRef.current = seedsInStorage;
  
  // Discovery popup state
  const [discoveryPopup, setDiscoveryPopup] = useState<{ isVisible: boolean; level: number } | null>(null);
  const [goldenPotBonusesPopupOpen, setGoldenPotBonusesPopupOpen] = useState(false);
  /** Auto-reveal this tier row (disabled → green) in bonuses popup after golden pot bounce + open. */
  const [goldenPotBonusRevealTier, setGoldenPotBonusRevealTier] = useState<number | null>(null);
  /** Scroll bonuses list to this tier when opening from a shelf progress bar tap. */
  const [goldenPotBonusScrollTierPotCount, setGoldenPotBonusScrollTierPotCount] = useState<number | null>(null);
  /** Shelf whose upgrade UI is hidden while the bonuses popup celebrates that shelf's completion. */
  const [goldenPotBonusRevealShelfIndex, setGoldenPotBonusRevealShelfIndex] = useState<number | null>(null);
  const goldenPotTierUnlockPopupTimeoutRef = useRef<number | null>(null);
  const goldenPotCountForTierPopupRef = useRef<number | null>(null);
  /** First-time collection flow after Plant Collection unlock (golden pot + bonuses + garden hint). */
  const [collectionFtuePhase, setCollectionFtuePhase] = useState<CollectionFtuePhase | null>(null);
  const [collectionFtueCompleted, setCollectionFtueCompleted] = useState(false);
  const [collectionFtueBonusesReached, setCollectionFtueBonusesReached] = useState(false);
  const [collectionFtueRestartPending, setCollectionFtueRestartPending] = useState(false);
  const [collectionFtueBonusesFading, setCollectionFtueBonusesFading] = useState(false);
  /** Fade collection FTUE finger out before switching hole target (0.2s). */
  const [collectionFtueOverlayFadingOut, setCollectionFtueOverlayFadingOut] = useState(false);
  const collectionFtueOverlayFadeTimeoutRef = useRef<number | null>(null);
  /** Shows a level-up popup; collection unlock stays forced across refresh until View Collection. */
  const presentLevelUpPopupRef = useRef<(level: number) => void>(() => {});
  const skipStarterFtueAndLevelUpRef = useRef<() => void>(() => {});
  const [tasksFtueStarted, setTasksFtueStarted] = useState(false);
  const [tasksFtueUnlockRevealed, setTasksFtueUnlockRevealed] = useState(false);
  const [tasksFtueCompleted, setTasksFtueCompleted] = useState(false);
  const [gardensFtueStarted, setGardensFtueStarted] = useState(false);
  const [gardensFtueUnlockRevealed, setGardensFtueUnlockRevealed] = useState(false);
  const [gardensFtueCompleted, setGardensFtueCompleted] = useState(false);
  const [newGardenFtueCompleted, setNewGardenFtueCompleted] = useState(false);
  const [newGardenFtuePhase, setNewGardenFtuePhase] = useState<NewGardenFtuePhase | null>(null);
  const [tasksFtueHoleRect, setTasksFtueHoleRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const pendingTasksFtueRevealRef = useRef(false);
  const tasksFtueRevealPlayedRef = useRef(false);
  const [collectionFtueHoleRect, setCollectionFtueHoleRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  /** After “View Collection” → barn, wait for the screen slide to finish before measuring the golden-pot CTA + finger. */
  const [collectionFtueIntroCtaOverlayReady, setCollectionFtueIntroCtaOverlayReady] = useState(false);
  /** Flower-collection panel bounce + leaf burst (intro unlock + post-free-upgrade copy swap). */
  const [collectionFtuePanelBouncing, setCollectionFtuePanelBouncing] = useState(false);
  /**
   * During collection FTUE intro: panel chrome starts locked (plants/shelves already unlocked),
   * then fades to unlocked when the bounce plays.
   */
  const [collectionFtuePanelChromeUnlocked, setCollectionFtuePanelChromeUnlocked] = useState(true);
  const [collectionFtuePanelLeafBurst, setCollectionFtuePanelLeafBurst] = useState<{
    id: string;
    rectWidth: number;
    rectHeight: number;
  } | null>(null);
  const collectionFtuePanelRef = useRef<HTMLDivElement>(null);
  const collectionFtuePanelBounceDoneTimerRef = useRef<number | null>(null);
  /** Plant keys currently playing the FTUE shelf bounce sequence. */
  const [collectionFtuePlantBounceKeys, setCollectionFtuePlantBounceKeys] = useState<string[]>([]);
  /** After free upgrade: keep disabled Let’s Upgrade until panel bounce, then reveal View Bonuses. */
  const [collectionFtueBonusesUiRevealed, setCollectionFtueBonusesUiRevealed] = useState(false);
  /** Delay View Bonuses finger overlay until after the bonuses panel bounce. */
  const [collectionFtueBonusesOverlayReady, setCollectionFtueBonusesOverlayReady] = useState(false);
  /** Remount key so copy color settle (green → cream) restarts on each bounce reveal. */
  const [collectionFtueCopyFlash, setCollectionFtueCopyFlash] = useState<{
    kind: 'intro' | 'bonuses';
    gen: number;
  } | null>(null);
  /** After plant 1–4 bounce: FREE button turns green + pops before the finger. */
  const [collectionFtueFreeButtonGreen, setCollectionFtueFreeButtonGreen] = useState(false);
  const [collectionFtueFreeButtonBouncing, setCollectionFtueFreeButtonBouncing] = useState(false);
  const [collectionFtueFreeButtonLeafBurst, setCollectionFtueFreeButtonLeafBurst] = useState<{
    id: string;
    rectWidth: number;
    rectHeight: number;
  } | null>(null);
  const collectionFtueFreeButtonRef = useRef<HTMLDivElement>(null);
  const goldenPotBonusesWasOpenRef = useRef(false);
  /** Paid store purchase confirmation (IAP stub); Collect fires boost particles + activation. */
  const [purchaseSuccessfulUi, setPurchaseSuccessfulUi] = useState<{
    headerImageSrc: string;
    rewards: PurchaseSuccessfulRewardRow[];
  } | null>(null);
  const [iapOfferUi, setIapOfferUi] = useState<{ offerId: string } | null>(null);
  const pendingPurchaseBoostsRef = useRef<{ offerId: string; durationMs: number; icon: string }[]>([]);
  // Plant info popup state (for barn)
  const [plantInfoPopup, setPlantInfoPopup] = useState<{ isVisible: boolean; level: number; gardenId: GardenId } | null>(null);
  /** Bumps when inactive-garden collection data is patched in v2 save (re-read shelves / popup wallet). */
  const [collectionSaveRevision, setCollectionSaveRevision] = useState(0);
  // Limited offer popup state
  const [limitedOfferPopup, setLimitedOfferPopup] = useState<{
    isVisible: boolean;
    title?: string;
    imageSrc: string;
    subtitle: string;
    description: string;
    buttonText: string;
    offerId?: string;
    tab?: TabType;
    durationMinutes?: number | null;
    durationSeconds?: number | null;
    activeBoostEndTime?: number;
    subtitleSettingsStyle?: boolean;
    hideOfferDurationBlock?: boolean;
    imageLevel?: number;
  } | null>(null);
  const lastLimitedOfferShownAtRef = useRef<number>(0);
  const lastShownOfferIdRef = useRef<string | null>(null);
  const lastShownOfferTabRef = useRef<TabType | null>(null);
  const lastLimitedOfferClosedAtRef = useRef<number>(0);
  const suppressDiscoveryDeclineSfxRef = useRef(false);
  const suppressLevelUpDeclineSfxRef = useRef(false);
  const suppressLimitedOfferDeclineSfxRef = useRef(false);
  const suppressPlantInfoDeclineSfxRef = useRef(false);
  const suppressPurchaseSuccessDeclineSfxRef = useRef(false);
  const lastFakeAdClosedAtRef = useRef<number>(0); // 10s cooldown before showing limited offer popup after closing fake ad
  /** 10s cooldown after any blocking popup closes before auto limited-offer popups. */
  const lastOtherPopupClosedAtRef = useRef<number>(0);
  const showFakeAdRef = useRef<boolean>(false); // so timers can pause while fake ad is visible
  /** True while any modal/popup should suppress auto limited-offer popups (kept fresh for the 2s poll). */
  const blockingPopupOpenForLimitedOfferRef = useRef(false);
  const prevBlockingPopupForLimitedOfferRef = useRef(false);
  const limitedOfferCooldownInitializedRef = useRef(false);
  // Rewarded offers shown in upgrade list (when player declines popup)
  const [rewardedOffers, setRewardedOffers] = useState<RewardedOffer[]>([]);
  const rewardedOffersRef = useRef<RewardedOffer[]>([]);
  rewardedOffersRef.current = rewardedOffers;
  // Discovery reward particles: fly from discovery popup reward icon to wallet.
  const [activeDiscoveryCoinParticles, setActiveDiscoveryCoinParticles] = useState<GoalCoinParticleData[]>([]);
  const [activeGoldenPotProgressParticles, setActiveGoldenPotProgressParticles] = useState<
    GoldenPotProgressParticleData[]
  >([]);
  const [collectionBarHeldNumeratorCount, setCollectionBarHeldNumeratorCount] = useState<number | null>(null);
  // Discovery CTA particle: fly from popup button to Collection nav button.
  const [activeBarnParticles, setActiveBarnParticles] = useState<BarnParticleData[]>([]);
  // Active rewarded-ad boosts (max 5); each has endTime and duration for radial countdown
  const [activeBoosts, setActiveBoostsState] = useState<ActiveBoostData[]>([]);
  /** Keep in sync with `activeBoosts` on every commit *inside* the setter so rAF / timers see boosts immediately (before the next render). */
  const activeBoostsRef = useRef<ActiveBoostData[]>(activeBoosts);
  /**
   * Flush synchronously so `activeBoostsRef` matches committed boosts before any other work in this
   * tick (e.g. another rAF batching wallet credits). React 18 otherwise may defer updaters past rAF.
   */
  const setActiveBoosts = useCallback((action: React.SetStateAction<ActiveBoostData[]>) => {
    flushSync(() => {
      if (typeof action === 'function') {
        setActiveBoostsState((prev) => {
          const next = action(prev);
          activeBoostsRef.current = next;
          return next;
        });
      } else {
        activeBoostsRef.current = action;
        setActiveBoostsState(action);
      }
    });
  }, []);
  /** Two store slots: current duration-boost offer id each (rotates after 15m cooldown). */
  const [storeFreeOfferSlots, setStoreFreeOfferSlots] = useState<[string, string]>(() => pickInitialStoreFreeOfferSlots());
  /** Per-slot cooldown end (ms); 0 = FREE available. */
  const [storeSlotCooldownEnds, setStoreSlotCooldownEnds] = useState<[number, number]>([0, 0]);
  const [dailyAllowanceClaimedDayKey, setDailyAllowanceClaimedDayKey] = useState<string | undefined>();
  const [storeCoinParticles, setStoreCoinParticles] = useState<GoalCoinParticleData[]>([]);
  const [storeLeafBursts, setStoreLeafBursts] = useState<
    { id: string; x: number; y: number; startTime: number }[]
  >([]);
  const [dailyAllowanceDayRefreshKey, setDailyAllowanceDayRefreshKey] = useState(0);
  const [dailyAllowanceUiHoldUntilMs, setDailyAllowanceUiHoldUntilMs] = useState(0);
  const dailyAllowanceUiHoldTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStoreSlotCooldownEnded = useCallback((slotIndex: number) => {
    setStoreFreeOfferSlots((slots) => {
      const prevThis = slots[slotIndex];
      const other = slots[1 - slotIndex];
      const nextId = pickStoreDurationOfferId(new Set([prevThis, other]));
      const next: [string, string] = [...slots] as [string, string];
      next[slotIndex] = nextId;
      return next;
    });
    setStoreSlotCooldownEnds((ends) => {
      const next: [number, number] = [...ends] as [number, number];
      next[slotIndex] = 0;
      return next;
    });
  }, []);

  const [boostParticles, setBoostParticles] = useState<BoostParticleData[]>([]);
  const [boostBursts, setBoostBursts] = useState<{ id: string; x: number; y: number; startTime: number }[]>([]);
  const activeBoostAreaRef = useRef<HTMLDivElement>(null);
  const headerLeftWrapperRef = useRef<HTMLDivElement>(null);
  const storeActiveBoostAreaRef = useRef<HTMLDivElement>(null);
  const storeHeaderLeftWrapperRef = useRef<HTMLDivElement>(null);
  const storeWalletRef = useRef<HTMLButtonElement>(null);
  const storeWalletIconRef = useRef<HTMLSpanElement>(null);
  // When user closes limited offer (X): open panel, scroll to offer, flash yellow then return to light yellow
  const [pendingOfferHighlightId, setPendingOfferHighlightId] = useState<string | null>(null);
  // Pause menu (opened from settings/gear button)
  const [pauseMenuOpen, setPauseMenuOpen] = useState(false);
  const [rateUsPopupOpen, setRateUsPopupOpen] = useState(false);
  const [rateUsThankYouOpen, setRateUsThankYouOpen] = useState(false);
  const [corruptSavePopupOpen, setCorruptSavePopupOpen] = useState(false);
  /** Set on load if main save was recovered from a level-up checkpoint; shown after offline earnings. */
  const pendingCorruptSavePopupRef = useRef(false);
  const [dailyTasksPopupOpen, setDailyTasksPopupOpen] = useState(false);
  const [lockedDailyTasksPopupOpen, setLockedDailyTasksPopupOpen] = useState(false);
  const dailyTasksPopupOpenRef = useRef(dailyTasksPopupOpen);
  dailyTasksPopupOpenRef.current = dailyTasksPopupOpen;
  /** After first Daily Tasks FTUE open, show Rate Us when that popup closes. */
  const pendingRateUsAfterDailyTasksCloseRef = useRef(false);
  const [dailyTaskRows, setDailyTaskRows] = useState<DailyTaskDefinition[]>([]);
  const dailyTaskRowsRef = useRef(dailyTaskRows);
  dailyTaskRowsRef.current = dailyTaskRows;
  const [tasksFbReadyBounceNonce, setTasksFbReadyBounceNonce] = useState(0);
  const [tasksFbLeafBursts, setTasksFbLeafBursts] = useState<
    { id: string; x: number; y: number; startTime: number }[]
  >([]);
  const tasksFloatingButtonRef = useRef<HTMLDivElement>(null);
  const nextTasksFbLeafBurstIdRef = useRef(0);
  const [gardensFbReadyBounceNonce, setGardensFbReadyBounceNonce] = useState(0);
  const [gardensFbLeafBursts, setGardensFbLeafBursts] = useState<
    { id: string; x: number; y: number; startTime: number }[]
  >([]);
  const gardensFloatingButtonRef = useRef<HTMLDivElement>(null);
  const nextGardensFbLeafBurstIdRef = useRef(0);
  const prevCanAffordGardenPurchaseRef = useRef(false);
  const gardensAffordThresholdInitializedRef = useRef(false);
  const pendingGardensFtueRevealRef = useRef(false);
  const gardensFtueRevealPlayedRef = useRef(false);
  const [gardensFtueHoleRect, setGardensFtueHoleRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const dailyTasksPeriodRolledRef = useRef(false);
  const dailyTasksAutoClaimedAt1sRef = useRef(false);
  const lastDailyPlaytimeTickRef = useRef<number | null>(null);
  const lastAdBreakPlaytimeTickRef = useRef<number | null>(null);
  const [dailyTaskClaimBounceIds, setDailyTaskClaimBounceIds] = useState<string[]>([]);
  const [dailyTaskLeafBursts, setDailyTaskLeafBursts] = useState<
    { id: string; x: number; y: number; rectWidth: number; rectHeight: number }[]
  >([]);
  const pendingDailyTaskClaimRef = useRef<{
    taskId: string;
    fx: DailyTaskClaimFx;
    coinMultiplier: number;
  } | null>(null);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  /** Session-only: secret version taps unlock the Settings Dev Tools button (default off). */
  const [devToolsUnlocked, setDevToolsUnlocked] = useState(false);
  const [activeGardenId, setActiveGardenId] = useState<GardenId>(DEFAULT_GARDEN_ID);
  const activeGardenIdRef = useRef<GardenId>(DEFAULT_GARDEN_ID);
  const [garden1PlayerLevel, setGarden1PlayerLevel] = useState(1);
  const [gardenPickerOpen, setGardenPickerOpen] = useState(false);
  const [lockedGardenPickerPopupOpen, setLockedGardenPickerPopupOpen] = useState(false);
  const [gardenSwitchOverlayActive, setGardenSwitchOverlayActive] = useState(false);
  const [gardenSwitchOverlayOpacity, setGardenSwitchOverlayOpacity] = useState(0);
  const gardenSwitchTransitionRef = useRef(false);
  const [fakeNotchPreviewEnabled, setFakeNotchPreviewEnabled] = useState(
    _earlyUserPrefs.fakeNotchPreviewEnabled,
  );
  const [musicEnabled, setMusicEnabled] = useState(_earlyAudio.musicEnabled);
  const [sfxEnabled, setSfxEnabled] = useState(_earlyAudio.sfxEnabled);
  const [returnRemindersEnabled, setReturnRemindersEnabled] = useState(
    () => _earlyUserPrefs.returnRemindersEnabled,
  );
  const [settingsOpenedFromFtue, setSettingsOpenedFromFtue] = useState(false);
  const [ftueSettingsButtonRect, setFtueSettingsButtonRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [autoMergeSetting, setAutoMergeSetting] = useState(() => getAutoMergeMode());
  /** Skip treating 0→24 (hydrate) as “just unlocked”; only 23→24 in-session turns auto-merge on. */
  const autoMergePotCountInitRef = useRef(true);
  const lastGoldenPotCountForAutoMergeRef = useRef(0);
  /** Uncollected offline surplus (persistent); also drives save version for popup. */
  const pendingOfflineEarningsRef = useRef(0);
  /** Synced to offline earnings popup display amount (for reliable collect payout). */
  const offlinePopupAmountRef = useRef(0);
  const [offlineEarningsUi, setOfflineEarningsUi] = useState<{
    open: boolean;
    amount: number;
    showDoubleButton: boolean;
    rewardBounceKey: number;
  } | null>(null);
  /**
   * While offline earnings is pending/open, hold new-garden FTUE UI (picker / welcome / gardens finger)
   * so it doesn't stack on top of the collect popup.
   */
  const [deferNewGardenFtueUiForOffline, setDeferNewGardenFtueUiForOffline] = useState(false);
  /** After offline earnings closes, block limited/rewarded offer popups for 10s (auto + manual). */
  const lastOfflineEarningsClosedAtRef = useRef<number>(0);
  const prevOfflineEarningsOpenRef = useRef(false);
  /** Ref so pagehide/visibility flush can safely detect the popup state without stale closures. */
  const offlineEarningsOpenRef = useRef(false);
  /** Per-popup guard so we only auto-credit once per offline earnings popup open. */
  const offlineEarningsAutoCollectedRef = useRef(false);
  /** Latest save closure for interval / pagehide (updated every render). */
  const persistGameSnapshotRef = useRef<() => void>(() => {});
  /** When true, skip all persists (prevents pagehide flush from re-saving after clearGameSave + reload). */
  const suppressGameSaveRef = useRef(false);
  /** Only allow writing progress to localStorage after FTUE 11 is fully closed. */
  const ftue11PersistenceEnabledRef = useRef(false);
  /** After level commits in React state, flush main save then write a level-up checkpoint backup. */
  const pendingLevelUpBackupRef = useRef<{ gardenId: GardenId; level: number } | null>(null);
  /** Farm floating buttons (left + right) — fade in when level-up popup hits level 2 (after FTUE). */
  const [farmFloatingButtonsVisible, setFarmFloatingButtonsVisible] = useState(false);
  const [farmFloatingButtonsFadedIn, setFarmFloatingButtonsFadedIn] = useState(false);
  /** After spamming Unlock plant, show discovery only for this level when pause closes */
  const discoveryLevelAfterPauseCloseRef = useRef<number | null>(null);

  const prevPopupOpenRef = useRef({
    levelUp: false,
    gardenLevel: false,
    discovery: false,
    limitedOffer: false,
    plantInfo: false,
    goldenPot: false,
    purchaseSuccess: false,
    iapOffer: false,
    rateUs: false,
    dailyTasks: false,
    gardenPicker: false,
    lockedDailyTasks: false,
    lockedGardenPicker: false,
    rateUsThankYou: false,
    corruptSave: false,
    pauseMenu: false,
    outOfSpaceFtue: false,
    newGardenWelcome: false,
  });
  useEffect(() => {
    setActiveGardenAssetContext(activeGardenId);
    activeGardenIdRef.current = activeGardenId;
  }, [activeGardenId]);

  useEffect(() => {
    setAudioSettings({ musicEnabled, sfxEnabled });
    persistUserPrefs({ musicEnabled, sfxEnabled });
  }, [musicEnabled, sfxEnabled]);

  useEffect(() => {
    persistUserPrefs({ returnRemindersEnabled });
  }, [returnRemindersEnabled]);

  /** Schedule return reminders when leaving; cancel when returning / on mount. */
  useEffect(() => {
    void ensureReturnReminderDeliveryListener();
    void cancelReturnReminders();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistUserPrefs({ adBreakLastBackgroundAt: Date.now() });
        void scheduleReturnReminders(Date.now());
      } else {
        void cancelReturnReminders();
      }
    };
    const onPageHide = () => {
      persistUserPrefs({ adBreakLastBackgroundAt: Date.now() });
      void scheduleReturnReminders(Date.now());
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  useEffect(() => {
    persistUserPrefs({ fakeNotchPreviewEnabled });
  }, [fakeNotchPreviewEnabled]);

  useEffect(() => {
    if (isLoading) return;
    playMusicLoop();
  }, [isLoading]);

  // Fake ad popup: show full-screen "ad", on Complete ad run callback then close
  const [showFakeAd, setShowFakeAd] = useState(false);
  const [rewardedAdFadeInActive, setRewardedAdFadeInActive] = useState(false);
  const [rewardedAdBlackHoldActive, setRewardedAdBlackHoldActive] = useState(false);
  const [rewardedAdFadeOutActive, setRewardedAdFadeOutActive] = useState(false);
  const [adBreakIntroActive, setAdBreakIntroActive] = useState(false);
  const [adBreakFadeOutActive, setAdBreakFadeOutActive] = useState(false);
  /** Real interstitial slot — active after fade-to-black while loading plate is up. */
  const [interstitialAdSlotActive, setInterstitialAdSlotActive] = useState(false);
  /** Real rewarded slot — active after fade-to-black while loading plate is up. */
  const [rewardedAdSlotActive, setRewardedAdSlotActive] = useState(false);
  const [fakeAdVariant, setFakeAdVariant] = useState<FakeAdVariant>('rewarded');
  const rewardedAdFadeTimeoutRef = useRef<number | null>(null);
  const adBreakRuntimeRef = useRef<AdBreakRuntimeState>({
    lastAdBreakAt: 0,
    lastRewardedAdAt: 0,
    activePlaytimeMs: 0,
    fallbackPending: false,
    graceUntil: 0,
  });
  const pendingAdBreakCompleteRef = useRef<(() => void) | null>(null);
  const pendingSwitchGardenAdBreakRef = useRef(false);
  const prevActiveScreenForAdBreakRef = useRef<ScreenType>(activeScreen);
  showFakeAdRef.current =
    showFakeAd ||
    rewardedAdFadeInActive ||
    rewardedAdBlackHoldActive ||
    rewardedAdFadeOutActive ||
    adBreakIntroActive ||
    interstitialAdSlotActive ||
    rewardedAdSlotActive;

  useEffect(() => {
    setAdAudioSuspended(showFakeAdRef.current);
  }, [
    showFakeAd,
    rewardedAdFadeInActive,
    rewardedAdBlackHoldActive,
    rewardedAdFadeOutActive,
    adBreakIntroActive,
    interstitialAdSlotActive,
    rewardedAdSlotActive,
  ]);

  const [pendingAdComplete, setPendingAdComplete] = useState<(() => void) | null>(null);
  // Ref for upgrade tabs to get tab element positions
  const upgradeTabsRef = useRef<UpgradeTabsRef>(null);
  // Barn notification: unread mastery unlocks waiting in Shed.
  const [barnNotification, setBarnNotification] = useState(false);
  const [seenMasteryUnlockLevels, setSeenMasteryUnlockLevels] = useState<number[]>([]);
  const [unlockingCellIndices, setUnlockingCellIndices] = useState<number[]>([]); // Cells currently playing unlock animation
  // Goals: 3 plant slots until 4 golden pots; then 4. Slot index 4 is coin goal only.
  const [goalSlots, setGoalSlots] = useState<('empty' | 'loading' | 'green' | 'completed')[]>(['green', 'green', 'green', 'empty', 'empty']);
  const [goalPlantTypes, setGoalPlantTypes] = useState<number[]>([1, 2, 3, 0, 0]); // plant level 1-5 per slot when green
  const goalSlotsRef = useRef(goalSlots);
  const goalPlantTypesRef = useRef(goalPlantTypes);
  goalSlotsRef.current = goalSlots;
  goalPlantTypesRef.current = goalPlantTypes;
  /** Normal goal spawns: −1. Merge to new highest or discovery spawn: refill to full buffer for that tier. */
  const discoveryGoalsRemainingRef = useRef(getDiscoveryGoalBuffer(1));
  const lastMergeDiscoveryLevelRef = useRef(0); // highest level when we last synced remaining; discovery only when this === current highest (same "cycle")
  /** [second-to-last, last] spawned goal plant tier; matches initial goals [1,2,3] → last committed is 3. Persisted. */
  const lastSpawnedGoalLevelsRef = useRef<[number, number]>([2, 3]);
  /** Last committed goal plant tier for variety / anti-collision (mirrors tuple [1]; updated on every spawn including discovery). */
  const lastSpawnedGoalPlantLevelHUDRef = useRef(3);
  const lastProcessedGoalLoadingSlotRef = useRef<number | null>(null); // prevent duplicate pick/increment when effect runs twice (e.g. Strict Mode) for same loading slot
  /** Prevents double goal pick when React Strict Mode runs `setGoalLoadingSeconds` updater twice on the same tick. */
  const goalCountdownSpawnLockRef = useRef(false);
  const nextGoalSpawnIdRef = useRef(0);
  const goalSpawnPreloadTokenRef = useRef<{ loadingIdx: number; spawnId: number } | null>(null);
  const [goalLoadingSeconds, setGoalLoadingSeconds] = useState(15); // countdown 15->0 (Order Speed: 15 base - 2 per level)
  const [goalTransitionSlot, setGoalTransitionSlot] = useState<number | null>(null); // slot transitioning loading->green (for fade)
  const [goalTransitionFade, setGoalTransitionFade] = useState(false); // triggers fade: loading out, green in
  const [goalSlotFadeInSlot, setGoalSlotFadeInSlot] = useState<number | null>(null); // slot fading in 0→100% over 500ms; countdown waits until done
  const [goalCounts, setGoalCounts] = useState<number[]>([3, 3, 3, 0, 0]); // remaining count per slot when green (e.g. 3→2→1)
  const [goalAmountsRequired, setGoalAmountsRequired] = useState<number[]>([3, 3, 3, 0, 0]); // crops required when goal was created (for reward calc)
  const [goalCompletedValues, setGoalCompletedValues] = useState<number[]>([0, 0, 0, 0, 0]); // coin value when completed (plantValue × amountRequired × 2)
  const [goalImpactSlots, setGoalImpactSlots] = useState<number[]>([]); // slots currently playing impact (white flash + icon scale)
  /**
   * After first crop hits a light-green discovery goal, stay on normal green. Reset to false when the slot gets a new plant.
   */
  const [discoveryGoalLightGreenDismissed, setDiscoveryGoalLightGreenDismissed] = useState<boolean[]>([
    false, false, false, false, false,
  ]);
  const discoveryGoalLightGreenDismissedRef = useRef<boolean[]>([false, false, false, false, false]);
  discoveryGoalLightGreenDismissedRef.current = discoveryGoalLightGreenDismissed;
  /** Discovery-order light-green art until first harvest impact (persists across merge that discovers the tier). */
  const [goalDiscoveryLightGreenActive, setGoalDiscoveryLightGreenActive] = useState<boolean[]>([
    false, false, false, false, false,
  ]);
  const goalDiscoveryLightGreenActiveRef = useRef<boolean[]>([false, false, false, false, false]);
  goalDiscoveryLightGreenActiveRef.current = goalDiscoveryLightGreenActive;
  /** True briefly after FTUE 11 spawns the 1/2/3 goals so only plant 3 can use the light-green frame. */
  const [ftue11ThreePlantGoalWindowActive, setFtue11ThreePlantGoalWindowActive] = useState(false);
  const [goalBounceSlots, setGoalBounceSlots] = useState<number[]>([]); // slots currently bouncing (panel down)
  const [goalSlidingUpSlots, setGoalSlidingUpSlots] = useState<Set<number>>(new Set()); // slots currently playing slide-up animation
  const [goalCompactionStagger, setGoalCompactionStagger] = useState<{ completedSlotIdx: number; completedPosition: number; oldDisplayIndices: number[]; isOverlapping?: boolean } | null>(null);
  const [goalDisplayOrder, setGoalDisplayOrder] = useState<number[]>([0, 1, 2]); // Fixed left-to-right order; never reshuffle by plant type
  const [activeGoalCoinParticles, setActiveGoalCoinParticles] = useState<GoalCoinParticleData[]>([]);
  const [activeUpgradeParticles, setActiveUpgradeParticles] = useState<UpgradeParticleData[]>([]);
  const goalIconRef0 = useRef<HTMLImageElement>(null);
  const goalIconRef1 = useRef<HTMLImageElement>(null);
  const goalIconRef2 = useRef<HTMLImageElement>(null);
  const goalIconRef3 = useRef<HTMLImageElement>(null);
  const goalIconRef4 = useRef<HTMLImageElement>(null);
  const goalIconRefs = [goalIconRef0, goalIconRef1, goalIconRef2, goalIconRef3, goalIconRef4];
  // Coin goal: always in 5th slot (index 4), 30s timer, 30s between spawns, tap → fake ad → explode to wallet
  const [coinGoalVisible, setCoinGoalVisible] = useState(false);
  const [coinGoalValue, setCoinGoalValue] = useState(0);
  const [coinGoalTimeRemaining, setCoinGoalTimeRemaining] = useState(30);
  const [coinGoalBounce, setCoinGoalBounce] = useState(false);
  /** True while playing slide-up exit (timer expired or level dropped); then goal unmounts. */
  const [coinGoalExitAnim, setCoinGoalExitAnim] = useState(false);
  const coinGoalExpiryExitStartedRef = useRef(false);
  const coinGoalIconRef = useRef<HTMLImageElement>(null);
  const lastCoinGoalHiddenAtRef = useRef<number>(Date.now());
  const nextCoinGoalDelayRef = useRef<number>(30000 + Math.random() * 30000); // 30–60s until next spawn, new random each hide
  const pendingAdSourceRef = useRef<
    | 'limitedOffer'
    | 'upgradeList'
    | 'coinGoal'
    | 'offlineEarnings'
    | 'storeFreeOffer'
    | 'dailyTaskClaim2x'
    | 'adBreak'
    | null
  >(null);
  const pendingOfferIdRef = useRef<string | null>(null); // for boost particle: only shoot if offer has duration
  const [activePlantPanels, setActivePlantPanels] = useState<PlantPanelData[]>([]);
  const [fertilizingCellIndices, setFertilizingCellIndices] = useState<number[]>([]); // Cells currently playing fertilize animation

  // Calculate locked cell count from grid
  const lockedCellCount = grid.filter(cell => cell.locked).length;
  // Calculate fertilizable cell count (unlocked and not already fertile)
  const fertilizableCellCount = grid.filter(cell => !cell.locked && !cell.fertile).length;
  const [seedBounceTrigger, setSeedBounceTrigger] = useState(0); // increment each 100% so bounce animation re-runs
  const [harvestBounceTrigger, setHarvestBounceTrigger] = useState(0); // increment each harvest so bounce animation re-runs

  const seedStorageLevel = seedsState?.seed_storage?.level ?? 0;
  const seedLevel = getSeedLevelFromHighestPlant(highestPlantEver); // Seed level scales with highest plant discovered
  
  const gridRef = useRef<BoardCell[]>([]);
  gridRef.current = grid;
  const [activeProjectiles, setActiveProjectiles] = useState<ProjectileData[]>([]);
  const activeProjectilesRef = useRef<ProjectileData[]>([]);
  activeProjectilesRef.current = activeProjectiles;
  const hexBoardRef = useRef<HexBoardHandle>(null);
  const autoMergeRecheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Absolute timestamp (Date.now()) for the next scheduled tryStart; coalesces so a later schedule() never cancels an earlier retry. */
  const nextAutoMergeTryAtRef = useRef<number | null>(null);
  /** Cell index → time a seed-planted crop landed (for 1s merge grace when that plant is in the pair). */
  const recentSeedLandTimesRef = useRef<Map<number, number>>(new Map());
  /** After a null-pair scan, arm one “wave” of two delayed retries (poll would exhaust a counter before delays fire). */
  const autoMergeNullBackupWaveArmedRef = useRef(false);
  const scheduleAutoMergeRecheckRef = useRef<(delayMs: number) => void>(() => {});
  /** Batches simultaneous seed impacts into one setGrid (double seeds landing same frame). */
  const pendingProjectileCropSpawnsRef = useRef<Map<number, number>>(new Map());
  const projectileCropSpawnFlushScheduledRef = useRef(false);
  const tryStartAutoMergeRef = useRef<() => void>(() => {});
  const prevAutoMergeCapRef = useRef<number | null | undefined>(undefined);
  const wildGrowthAccumMsRef = useRef(0);
  const applyWildGrowthSpawnAtCellRef = useRef<(targetIdx: number, plantLevel: number) => void>(() => {});
  const [impactCellIdx, setImpactCellIdx] = useState<number | null>(null);
  const [returnImpactCellIdx, setReturnImpactCellIdx] = useState<number | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [sourceCellFadeOutIdx, setSourceCellFadeOutIdx] = useState<number | null>(null);
  const [newCellImpactIdx, setNewCellImpactIdx] = useState<number | null>(null);
  const [cellHighlightBeams, setCellHighlightBeams] = useState<{ id: string; x: number; y: number; cellWidth: number; cellHeight: number; startTime: number; showHexSprite?: boolean; sparkleCount?: number; sparkleSizeScale?: number; sparkleHeightScale?: number }[]>([]);
  const [activeCoinPanels, setActiveCoinPanels] = useState<CoinPanelData[]>([]);
  const [coinPanelPortalRect, setCoinPanelPortalRect] = useState<{ left: number; top: number; width: number; height: number; scale: number } | null>(null);
  const [harvestBounceCellIndices, setHarvestBounceCellIndices] = useState<number[]>([]);
  const [maxPlantToasts, setMaxPlantToasts] = useState<{ id: string; x: number; y: number; startTime: number }[]>([]);
  const [walletFlashActive, setWalletFlashActive] = useState(false);
  const [walletBursts, setWalletBursts] = useState<{ id: number; trigger: number }[]>([]);
  /** Increments on coin impact to trigger wallet icon bounce (sparkles removed, bounce kept). */
  const [walletBounceTrigger, setWalletBounceTrigger] = useState(0);
  const [goldenPotWalletFlashActive, setGoldenPotWalletFlashActive] = useState(false);
  const [goldenPotWalletBounceTrigger, setGoldenPotWalletBounceTrigger] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerLevelProgress, setPlayerLevelProgress] = useState(0); // 0 .. getGoalsRequiredForLevel(playerLevel)-1
  const [plantMasteryGoalsCompleted, setPlantMasteryGoalsCompleted] = useState(0);
  const [plantMastery, setPlantMastery] = useState<PlantMasterySlice>({
    ordersProgress: 0,
    targetLevel: 1,
    unlockPending: [],
    unlockedLevels: [],
    plantMasteryIntroBarComplete: false,
  });
  const goldenPotCount = plantMastery.unlockedLevels.length;
  const goldenPotCountRef = useRef(goldenPotCount);
  goldenPotCountRef.current = goldenPotCount;

  const collectionV2Gardens = useMemo(
    () => loadGameSaveV2()?.gardens,
    [collectionSaveRevision, activeGardenId, plantMastery.unlockedLevels, highestPlantEver, money],
  );
  const activeCollectionSnapshot = useMemo(
    (): GardenCollectionSnapshot => ({
      highestPlantEver,
      unlockedLevels: plantMastery.unlockedLevels,
      money,
    }),
    [highestPlantEver, plantMastery.unlockedLevels, money],
  );
  const globalBonusPotCount = useMemo(
    () =>
      getGlobalBonusProgressPotCount(activeGardenId, activeCollectionSnapshot, collectionV2Gardens),
    [activeGardenId, activeCollectionSnapshot, collectionV2Gardens],
  );
  const unlockedBonusTier = useMemo(
    () =>
      getUnlockedGoldenPotBonusTierPotCounts(
        activeGardenId,
        activeCollectionSnapshot,
        collectionV2Gardens,
      ),
    [activeGardenId, activeCollectionSnapshot, collectionV2Gardens],
  );
  const unlockedBonusTierSet = useMemo(
    () => new Set(unlockedBonusTier),
    [unlockedBonusTier],
  );
  const globalBonusPotCountRef = useRef(globalBonusPotCount);
  globalBonusPotCountRef.current = globalBonusPotCount;
  const unlockedBonusTierSetRef = useRef(unlockedBonusTierSet);
  unlockedBonusTierSetRef.current = unlockedBonusTierSet;

  const harvestChargesMax = useMemo(
    () => getHarvestChargesMax(unlockedBonusTierSet),
    [unlockedBonusTierSet],
  );
  const harvestChargesMaxRef = useRef(harvestChargesMax);
  harvestChargesMaxRef.current = harvestChargesMax;
  const seedStorageMax = useMemo(
    () => getSeedStorageMax(seedsState, unlockedBonusTierSet),
    [seedsState, unlockedBonusTierSet, seedStorageLevel],
  );
  const seedStorageMaxRef = useRef(seedStorageMax);
  seedStorageMaxRef.current = seedStorageMax;

  const prevSeedStorageBonusRef = useRef(getGoldenPotSeedStorageMaxBonus(unlockedBonusTierSet));
  const prevHarvestStorageBonusRef = useRef(getGoldenPotHarvestStorageMaxBonus(unlockedBonusTierSet));

  useEffect(() => {
    const seedBonus = getGoldenPotSeedStorageMaxBonus(unlockedBonusTierSet);
    const harvestBonus = getGoldenPotHarvestStorageMaxBonus(unlockedBonusTierSet);
    const prevSeedBonus = prevSeedStorageBonusRef.current;
    const prevHarvestBonus = prevHarvestStorageBonusRef.current;

    if (seedBonus > prevSeedBonus) {
      const added = seedBonus - prevSeedBonus;
      const newMax = getSeedStorageMax(seedsState, unlockedBonusTierSet);
      const oldMax = newMax - added;
      setSeedsInStorage((prev) => {
        if (prev >= oldMax) return Math.min(newMax, prev + added);
        return Math.min(prev, newMax);
      });
    } else if (seedBonus < prevSeedBonus) {
      setSeedsInStorage((prev) => Math.min(prev, getSeedStorageMax(seedsState, unlockedBonusTierSet)));
    }

    if (harvestBonus > prevHarvestBonus) {
      const added = harvestBonus - prevHarvestBonus;
      const newMax = getHarvestChargesMax(unlockedBonusTierSet);
      const oldMax = newMax - added;
      setHarvestCharges((prev) => {
        const next = prev >= oldMax ? Math.min(newMax, prev + added) : Math.min(prev, newMax);
        harvestChargesRef.current = next;
        return next;
      });
    } else if (harvestBonus < prevHarvestBonus) {
      setHarvestCharges((prev) => {
        const next = Math.min(prev, getHarvestChargesMax(unlockedBonusTierSet));
        harvestChargesRef.current = next;
        return next;
      });
    }

    prevSeedStorageBonusRef.current = seedBonus;
    prevHarvestStorageBonusRef.current = harvestBonus;
  }, [unlockedBonusTierSet, seedsState, seedStorageLevel]);

  const dailyAllowanceCoinAmount = getDailyAllowanceCoinAmount(playerLevel);

  const dailyAllowanceHideIcon =
    isDailyAllowanceClaimedForDay(dailyAllowanceClaimedDayKey) && dailyAllowanceUiHoldUntilMs > Date.now();

  const dailyAllowanceSlot0 = useMemo(() => {
    if (!hasGoldenPotDailyAllowance(unlockedBonusTierSet)) return null;
    const claimedToday = isDailyAllowanceClaimedForDay(dailyAllowanceClaimedDayKey);
    const holdingAllowanceUi = dailyAllowanceUiHoldUntilMs > Date.now();
    if (claimedToday && !holdingAllowanceUi) return null;
    return {
      coinIconPath: getGardenCoinIconPath(activeGardenId),
      coinAmount: dailyAllowanceCoinAmount,
    };
  }, [
    unlockedBonusTierSet,
    dailyAllowanceClaimedDayKey,
    activeGardenId,
    dailyAllowanceDayRefreshKey,
    dailyAllowanceCoinAmount,
    playerLevel,
    dailyAllowanceUiHoldUntilMs,
  ]);

  useEffect(() => {
    if (dailyAllowanceUiHoldUntilMs <= Date.now()) return;
    if (dailyAllowanceUiHoldTimeoutRef.current) {
      clearTimeout(dailyAllowanceUiHoldTimeoutRef.current);
    }
    dailyAllowanceUiHoldTimeoutRef.current = setTimeout(() => {
      dailyAllowanceUiHoldTimeoutRef.current = null;
      setDailyAllowanceUiHoldUntilMs(0);
    }, dailyAllowanceUiHoldUntilMs - Date.now());
    return () => {
      if (dailyAllowanceUiHoldTimeoutRef.current) {
        clearTimeout(dailyAllowanceUiHoldTimeoutRef.current);
        dailyAllowanceUiHoldTimeoutRef.current = null;
      }
    };
  }, [dailyAllowanceUiHoldUntilMs]);

  const handleDailyAllowanceClaim = useCallback(
    (_buttonRect: DOMRect, particleOriginRect?: DOMRect) => {
      playSfx(SFX_IDS.uiConfirmReward);
      const origin = particleOriginRect ?? _buttonRect;
      const container = containerRef.current;
      if (container) {
        const cr = container.getBoundingClientRect();
        const containerScale = container.offsetWidth > 0 ? cr.width / container.offsetWidth : 1;
        const originX = origin.left + origin.width / 2;
        const originY = origin.top + origin.height / 2;
        const startX = (originX - cr.left) / containerScale;
        const startY = (originY - cr.top) / containerScale;
        flushSync(() => {
          setStoreCoinParticles((prev) => [
            ...prev,
            {
              id: `store-allowance-coin-${Date.now()}`,
              startX,
              startY,
              value: dailyAllowanceCoinAmount,
              skipHappyCustomerRoll: true,
            },
          ]);
          if (!getPerformanceMode()) {
            setStoreLeafBursts((prev) => [
              ...prev,
              {
                id: `store-allowance-lb-${Date.now()}`,
                // LeafBurst is `position: fixed` under scaled #game-container — use container layout coords.
                x: startX,
                y: startY,
                startTime: Date.now(),
              },
            ]);
          }
        });
      }
      setDailyAllowanceClaimedDayKey(getLocalDayKey());
      setDailyAllowanceUiHoldUntilMs(Date.now() + DAILY_ALLOWANCE_UI_HOLD_AFTER_CLAIM_MS);
      setStoreSlotCooldownEnds((ends) => {
        const next: [number, number] = [...ends] as [number, number];
        next[0] = Date.now() + getRemoteConfig().ads.specialOffer.storeFreeOfferCooldownMs;
        return next;
      });
    },
    [dailyAllowanceCoinAmount],
  );

  const dailyTaskUpgradeCtxRef = useRef({
    playerLevel: 1,
    playerLevelProgress: 0,
    lockedCellCount: 0,
    goldenPotCount: 0,
    plantMasteryUnlockPendingCount: 0,
    seedsState: createInitialSeedsState(),
    harvestState: createInitialHarvestState(),
    cropsState: createInitialCropsState(),
    gardenId: DEFAULT_GARDEN_ID as GardenId,
  });
  dailyTaskUpgradeCtxRef.current = {
    playerLevel,
    playerLevelProgress,
    lockedCellCount,
    goldenPotCount,
    plantMasteryUnlockPendingCount: countGoldenPotUpgradeablePlants(
      highestPlantEverRef.current,
      plantMastery.unlockedLevels,
    ),
    seedsState,
    harvestState,
    cropsState,
    gardenId: activeGardenId,
  };
  const getDailyTasksCtx = () => ({
    ...getDailyTaskRollContext(
      gridRef.current,
      highestPlantEverRef.current,
      dailyTaskUpgradeCtxRef.current,
    ),
    globalGoldenPotCount: globalBonusPotCountRef.current,
    globalGoldenPotUnlockedTiers: unlockedBonusTierSetRef.current,
    garden1PlayerLevel,
  });
  /** Defer starting loading in plant goal slot 3 until player returns to FARM (see fourth-slot unlock flow). */
  const pendingFourthPlantGoalSlotRef = useRef(false);

  const prevUnlockedBonusTiersRef = useRef<Set<number> | null>(null);
  useEffect(() => {
    // While loading / hydrating, do not treat baseline shelves as "just unlocked".
    if (isLoading) return;
    const prev = prevUnlockedBonusTiersRef.current;
    prevUnlockedBonusTiersRef.current = new Set(unlockedBonusTierSet);
    if (prev == null) return;
    let newlyUnlockedTier: number | null = null;
    for (const tier of unlockedBonusTierSet) {
      if (!prev.has(tier)) {
        newlyUnlockedTier = newlyUnlockedTier == null ? tier : Math.max(newlyUnlockedTier, tier);
      }
    }
    if (newlyUnlockedTier == null) return;
    const revealShelfIndex = newlyUnlockedTier / 4 - 1;
    if (goldenPotTierUnlockPopupTimeoutRef.current != null) {
      window.clearTimeout(goldenPotTierUnlockPopupTimeoutRef.current);
    }
    goldenPotTierUnlockPopupTimeoutRef.current = window.setTimeout(() => {
      goldenPotTierUnlockPopupTimeoutRef.current = null;
      setGoldenPotBonusRevealShelfIndex(
        revealShelfIndex >= 0 && revealShelfIndex < BARN_SHELF_COUNT ? revealShelfIndex : null,
      );
      setGoldenPotBonusRevealTier(newlyUnlockedTier);
      setGoldenPotBonusScrollTierPotCount(null);
      setGoldenPotBonusesPopupOpen(true);
    }, 650);
    return () => {
      if (goldenPotTierUnlockPopupTimeoutRef.current != null) {
        window.clearTimeout(goldenPotTierUnlockPopupTimeoutRef.current);
        goldenPotTierUnlockPopupTimeoutRef.current = null;
      }
    };
  }, [unlockedBonusTierSet, isLoading]);
  const [masteryPurchaseRevealLevels, setMasteryPurchaseRevealLevels] = useState<string[]>([]);
  const masteryPurchaseRevealTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const n = plantMastery.unlockedLevels.length;
    const prev = lastGoldenPotCountForAutoMergeRef.current;
    if (autoMergePotCountInitRef.current) {
      autoMergePotCountInitRef.current = false;
      lastGoldenPotCountForAutoMergeRef.current = n;
      if (n < MAX_PLANT_TIER) {
        setAutoMergeMode(false);
        setAutoMergeSetting(false);
      }
      return;
    }
    lastGoldenPotCountForAutoMergeRef.current = n;
    if (n < MAX_PLANT_TIER) {
      setAutoMergeMode(false);
      setAutoMergeSetting(false);
      return;
    }
    if (prev === MAX_PLANT_TIER - 1 && n === MAX_PLANT_TIER) {
      setAutoMergeMode(true);
      setAutoMergeSetting(true);
    }
  }, [plantMastery.unlockedLevels.length]);
  const skipNextBarnPendingBounceRef = useRef(false);

  /** One increment per collected goal — same moment as player level XP (not on plant-panel impact; avoids double-count). */
  const applyGoalCollectedProgress = useCallback(() => {
    setPlantMasteryGoalsCompleted((c) => c + 1);
  }, []);

  const goldenPotUpgradeableLevels = getGoldenPotUpgradeableLevels(
    highestPlantEver,
    plantMastery.unlockedLevels,
  );

  const dailyTasksUnlocked = playerLevel >= TASKS_FLOATING_BUTTON_UNLOCK_LEVEL;
  const dailyTasksRemainingMs = useDailyTasksCountdown(
    dailyTasksUnlocked && readDailyTasksUnlocked(),
    dailyTasksCountdownRefreshKey,
  );

  useEffect(() => {
    if (playerLevel >= TASKS_FLOATING_BUTTON_UNLOCK_LEVEL) {
      markDailyTasksUnlocked();
      setDailyTasksCountdownRefreshKey((k) => k + 1);
    }
  }, [playerLevel]);

  const triggerDailyTaskClaimBounce = useCallback((taskId: string) => {
    setDailyTaskClaimBounceIds((prev) => [...prev, taskId]);
    window.setTimeout(() => {
      setDailyTaskClaimBounceIds((prev) => prev.filter((id) => id !== taskId));
    }, 200);
  }, []);

  const triggerTasksFloatingButtonReadyFx = useCallback(() => {
    setTasksFbReadyBounceNonce((n) => n + 1);
    if (getPerformanceMode()) return;
    const el = tasksFloatingButtonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTasksFbLeafBursts((prev) => [
      ...prev,
      {
        id: `tasks-fb-lb-${nextTasksFbLeafBurstIdRef.current++}`,
        x: r.left + r.width / 2,
        y: r.top + r.height / 2 + 30,
        startTime: Date.now(),
      },
    ]);
  }, []);

  const triggerGardensFloatingButtonReadyFx = useCallback(() => {
    setGardensFbReadyBounceNonce((n) => n + 1);
    if (getPerformanceMode()) return;
    const el = gardensFloatingButtonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setGardensFbLeafBursts((prev) => [
      ...prev,
      {
        id: `gardens-fb-lb-${nextGardensFbLeafBurstIdRef.current++}`,
        x: r.left + r.width / 2,
        y: r.top + r.height / 2 + 30,
        startTime: Date.now(),
      },
    ]);
  }, []);

  const playTasksFtueUnlockReveal = useCallback(() => {
    if (tasksFtueRevealPlayedRef.current) return;
    tasksFtueRevealPlayedRef.current = true;
    playSfx(SFX_IDS.uiUnlockUpgrade);
    setTasksFtueUnlockRevealed(true);
    triggerTasksFloatingButtonReadyFx();
  }, [triggerTasksFloatingButtonReadyFx]);

  const playGardensFtueUnlockReveal = useCallback(() => {
    if (gardensFtueRevealPlayedRef.current) return;
    gardensFtueRevealPlayedRef.current = true;
    playSfx(SFX_IDS.uiUnlockUpgrade);
    setGardensFtueUnlockRevealed(true);
    triggerGardensFloatingButtonReadyFx();
  }, [triggerGardensFloatingButtonReadyFx]);

  const spawnTasksFbCoinToWallet = useCallback((value: number) => {
    if (value <= 0) return;
    const container = containerRef.current;
    const walletIcon = walletIconRef.current;
    const wallet = walletRef.current;
    const fbEl = tasksFloatingButtonRef.current;
    if (!container || !fbEl || !(walletIcon || wallet)) return;

    const scale = appScaleRef.current;
    const containerRect = container.getBoundingClientRect();
    const fbRect = fbEl.getBoundingClientRect();
    const startX = (fbRect.left + fbRect.width / 2 - containerRect.left) / scale;
    const startY = (fbRect.top + fbRect.height / 2 - containerRect.top) / scale;
    const panelHeightPx = 14;
    const offsetUp = (panelHeightPx / 2 + 4) * 0.8;
    const hoverY = startY - offsetUp;

    setActiveCoinPanels((prev) => [
      ...prev,
      {
        id: `tasks-period-auto-claim-${Date.now()}`,
        value,
        startX,
        startY,
        hoverX: startX,
        hoverY,
        moveToWalletDelayMs: 0,
      },
    ]);
  }, []);

  const finishDailyTasksPeriodRoll = useCallback(() => {
    const next = rollDailyTasksNextPeriod(getDailyTasksCtx());
    dailyTaskRowsRef.current = next;
    setDailyTaskRows(next);
    setDailyTasksCountdownRefreshKey((k) => k + 1);
  }, []);

  const playDailyTaskClaimPresentation = useCallback(
    (
      taskId: string,
      payout: number,
      fx: DailyTaskClaimFx,
      options?: { playSfx?: boolean },
    ) => {
      if (options?.playSfx !== false) {
        playSfx(SFX_IDS.uiConfirmReward);
      }

      triggerDailyTaskClaimBounce(taskId);

      if (!getPerformanceMode()) {
        setDailyTaskLeafBursts((prev) => [
          ...prev,
          {
            id: `daily-task-claim-${taskId}-${Date.now()}`,
            x: fx.rowCenter.x,
            y: fx.rowCenter.y,
            rectWidth: fx.rowWidth,
            rectHeight: fx.rowHeight,
          },
        ]);
      }

      const layer = discoveryRewardFxLayerRef.current;
      if (layer) {
        const lr = layer.getBoundingClientRect();
        setActiveDiscoveryCoinParticles((prev) => [
          ...prev,
          {
            id: `daily-task-reward-${taskId}-${Date.now()}`,
            startX: fx.rewardCenter.x - lr.left,
            startY: fx.rewardCenter.y - lr.top,
            value: payout,
          },
        ]);
      }
    },
    [triggerDailyTaskClaimBounce],
  );

  const autoClaimCompleteTasksInPopup = useCallback(() => {
    const ctx = getDailyTasksCtx();
    const rows = dailyTaskRowsRef.current;
    const unclaimedComplete = rows.filter((t) => t.state === 'complete');
    if (unclaimedComplete.length === 0) return;

    const claimSnapshots: { task: DailyTaskDefinition; fx: DailyTaskClaimFx }[] = [];
    for (const task of unclaimedComplete) {
      const fx = getDailyTaskClaimFxFromDom(task.id);
      if (fx) claimSnapshots.push({ task, fx });
    }

    const claimedRows = markDailyTasksClaimed(
      unclaimedComplete.map((t) => t.id),
      ctx,
    );
    dailyTaskRowsRef.current = claimedRows;
    setDailyTaskRows(claimedRows);

    if (claimSnapshots.length > 0) {
      playSfx(SFX_IDS.uiConfirmReward);
    }
    for (const { task, fx } of claimSnapshots) {
      playDailyTaskClaimPresentation(task.id, task.rewardCoins, fx, { playSfx: false });
    }

    const fxTaskIds = new Set(claimSnapshots.map(({ task }) => task.id));
    const missingPayout = unclaimedComplete
      .filter((task) => !fxTaskIds.has(task.id))
      .reduce((sum, task) => sum + task.rewardCoins, 0);
    if (missingPayout > 0) {
      setMoney((m) => m + missingPayout);
    }
  }, [playDailyTaskClaimPresentation]);

  const executeDailyTasksPeriodRollover = useCallback(
    (options?: { forcePopupOpen?: boolean }) => {
      if (!rollDailyTasksPeriodIfExpired()) return;
      setDailyAllowanceDayRefreshKey((k) => k + 1);

      if (hasGoldenPotDailyAllowance(unlockedBonusTierSet)) {
        const v2 = loadGameSaveV2();
        if (v2) {
          persistGameSaveV2(clearDailyAllowanceClaimedForAllGardens(v2));
        }
        setDailyAllowanceClaimedDayKey(undefined);
        setDailyAllowanceUiHoldUntilMs(0);
        if (dailyAllowanceUiHoldTimeoutRef.current) {
          clearTimeout(dailyAllowanceUiHoldTimeoutRef.current);
          dailyAllowanceUiHoldTimeoutRef.current = null;
        }
      }

      const popupOpen = options?.forcePopupOpen ?? dailyTasksPopupOpenRef.current;
      const ctx = getDailyTasksCtx();
      const rows = dailyTaskRowsRef.current;
      const unclaimedComplete = rows.filter((t) => t.state === 'complete');
      const totalPayout = unclaimedComplete.reduce((sum, t) => sum + t.rewardCoins, 0);

      if (popupOpen) {
        if (unclaimedComplete.length > 0) {
          autoClaimCompleteTasksInPopup();
        }
        finishDailyTasksPeriodRoll();
        return;
      }

      if (unclaimedComplete.length > 0) {
        const claimedRows = markDailyTasksClaimed(
          unclaimedComplete.map((t) => t.id),
          ctx,
        );
        dailyTaskRowsRef.current = claimedRows;
        setDailyTaskRows(claimedRows);

        triggerTasksFloatingButtonReadyFx();
        if (totalPayout > 0) {
          spawnTasksFbCoinToWallet(totalPayout);
        }
      }

      finishDailyTasksPeriodRoll();
    },
    [
      autoClaimCompleteTasksInPopup,
      finishDailyTasksPeriodRoll,
      globalBonusPotCount,
      spawnTasksFbCoinToWallet,
      triggerTasksFloatingButtonReadyFx,
    ],
  );

  useEffect(() => {
    if (dailyTasksRemainingMs > DAILY_TASKS_AUTO_CLAIM_BEFORE_END_MS) {
      dailyTasksAutoClaimedAt1sRef.current = false;
    }
  }, [dailyTasksRemainingMs]);

  useEffect(() => {
    if (!dailyTasksUnlocked || !readDailyTasksUnlocked()) return;
    if (!dailyTasksPopupOpen) return;
    if (
      dailyTasksRemainingMs <= 0 ||
      dailyTasksRemainingMs > DAILY_TASKS_AUTO_CLAIM_BEFORE_END_MS
    ) {
      return;
    }
    if (dailyTasksAutoClaimedAt1sRef.current) return;
    dailyTasksAutoClaimedAt1sRef.current = true;
    autoClaimCompleteTasksInPopup();
  }, [
    autoClaimCompleteTasksInPopup,
    dailyTasksPopupOpen,
    dailyTasksRemainingMs,
    dailyTasksUnlocked,
  ]);

  useEffect(() => {
    if (!dailyTasksUnlocked || !readDailyTasksUnlocked()) return;
    if (dailyTasksRemainingMs > 0) {
      dailyTasksPeriodRolledRef.current = false;
      return;
    }
    if (dailyTasksPeriodRolledRef.current) return;
    dailyTasksPeriodRolledRef.current = true;
    executeDailyTasksPeriodRollover();
  }, [dailyTasksUnlocked, dailyTasksRemainingMs, executeDailyTasksPeriodRollover]);

  const applyDailyTaskRowsUpdate = useCallback(
    (next: DailyTaskDefinition[]) => {
      const prev = dailyTaskRowsRef.current;
      dailyTaskRowsRef.current = next;
      if (findNewlyCompletedDailyTasks(prev, next)) {
        window.setTimeout(() => triggerTasksFloatingButtonReadyFx(), 0);
      }
      setDailyTaskRows(next);
    },
    [triggerTasksFloatingButtonReadyFx],
  );

  const applyDailyTaskSeedProgress = useCallback(() => {
    applyDailyTaskRowsUpdate(recordDailyTaskSeedPlanted(getDailyTasksCtx()));
  }, [applyDailyTaskRowsUpdate]);

  const recordDailyTaskPlayerLeveledUp = useCallback(() => {
    applyDailyTaskRowsUpdate(recordDailyTaskLevelUp(getDailyTasksCtx()));
  }, [applyDailyTaskRowsUpdate]);

  const recordDailyTaskBoostUsed = useCallback(() => {
    applyDailyTaskRowsUpdate(recordDailyTaskBoosterActivated(getDailyTasksCtx()));
  }, [applyDailyTaskRowsUpdate]);

  useEffect(() => {
    if (isLoading || !dailyTasksUnlocked || !readDailyTasksUnlocked()) return;
    rollDailyTasksPeriodIfExpired();
    const next = ensureDailyTasksDay(getDailyTasksCtx());
    dailyTaskRowsRef.current = next;
    setDailyTaskRows(next);
  }, [isLoading, dailyTasksUnlocked, playerLevel, globalBonusPotCount]);

  useEffect(() => {
    if (isLoading || !dailyTasksUnlocked || !readDailyTasksUnlocked()) return;
    setDailyTaskRows((prev) => {
      const next = syncDailyTasksGrid(getDailyTasksCtx());
      dailyTaskRowsRef.current = next;
      if (findNewlyCompletedDailyTasks(prev, next)) {
        window.setTimeout(() => triggerTasksFloatingButtonReadyFx(), 0);
      }
      return next;
    });
  }, [grid, isLoading, dailyTasksUnlocked, triggerTasksFloatingButtonReadyFx]);

  useEffect(() => {
    if (isLoading || !dailyTasksUnlocked || !readDailyTasksUnlocked()) return;

    const resetPlaytimeClock = () => {
      lastDailyPlaytimeTickRef.current = Date.now();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetPlaytimeClock();
      } else {
        lastDailyPlaytimeTickRef.current = null;
      }
    };

    if (document.visibilityState === 'visible') {
      resetPlaytimeClock();
    }

    const TICK_MS = 1000;

    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;

      const now = Date.now();
      const last = lastDailyPlaytimeTickRef.current;
      if (last == null) {
        lastDailyPlaytimeTickRef.current = now;
        return;
      }
      lastDailyPlaytimeTickRef.current = now;
      const deltaMs = Math.min(Math.max(0, now - last), 60_000);
      if (deltaMs === 0) return;

      const prev = dailyTaskRowsRef.current;
      const next = tickDailyTaskPlaytime(getDailyTasksCtx(), deltaMs);
      dailyTaskRowsRef.current = next;
      if (findNewlyCompletedDailyTasks(prev, next)) {
        window.setTimeout(() => triggerTasksFloatingButtonReadyFx(), 0);
      }
      setDailyTaskRows(next);
    }, TICK_MS);

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      lastDailyPlaytimeTickRef.current = null;
    };
  }, [isLoading, dailyTasksUnlocked, triggerTasksFloatingButtonReadyFx]);

  const openRewardedFakeAd = useCallback(() => {
    if (!areAdsEnabled()) return;
    setFakeAdVariant('rewarded');
    setRewardedAdFadeOutActive(false);
    setRewardedAdBlackHoldActive(false);
    setRewardedAdSlotActive(false);
    setRewardedAdFadeInActive(true);
    if (rewardedAdFadeTimeoutRef.current != null) {
      window.clearTimeout(rewardedAdFadeTimeoutRef.current);
    }
    rewardedAdFadeTimeoutRef.current = window.setTimeout(() => {
      // Loading plate + real rewarded slot after fade-to-black (same timing contract as interstitial).
      setRewardedAdBlackHoldActive(true);
      setShowFakeAd(true);
      setRewardedAdSlotActive(true);
      setRewardedAdFadeInActive(false);
      rewardedAdFadeTimeoutRef.current = null;
    }, AD_REWARDED_FADE_IN_MS);
  }, []);

  const beginRewardedOutro = useCallback(() => {
    rewardedAdBridge.cancel();
    setRewardedAdSlotActive(false);
    setShowFakeAd(false);
    setRewardedAdBlackHoldActive(false);
    setRewardedAdFadeOutActive(true);
  }, []);

  useEffect(() => {
    if (!rewardedAdFadeOutActive) return;
    const t = window.setTimeout(() => setRewardedAdFadeOutActive(false), AD_REWARDED_FADE_OUT_MS);
    return () => window.clearTimeout(t);
  }, [rewardedAdFadeOutActive]);

  const openAdBreakFakeAd = useCallback((onComplete?: () => void, options?: { force?: boolean }) => {
    if (!options?.force && !areAdsEnabled()) {
      onComplete?.();
      return;
    }
    setFakeAdVariant('adBreak');
    pendingAdSourceRef.current = 'adBreak';
    setPendingAdComplete(null);
    pendingAdBreakCompleteRef.current = onComplete ?? null;
    setAdBreakFadeOutActive(false);
    setInterstitialAdSlotActive(false);
    setAdBreakIntroActive(true);
  }, []);

  const handleAdBreakIntroComplete = useCallback(() => {
    // Loading plate first, then real-ad slot (above it) — SDK show happens in InterstitialAdLayer.
    setShowFakeAd(true);
    setInterstitialAdSlotActive(true);
  }, []);

  const beginAdBreakOutro = useCallback(() => {
    interstitialAdBridge.cancel();
    setInterstitialAdSlotActive(false);
    setShowFakeAd(false);
    pendingAdSourceRef.current = null;
    setAdBreakFadeOutActive(true);
  }, []);

  const handleInterstitialAdClosed = useCallback(
    (result: InterstitialAdCloseResult) => {
      // No creative available — keep loading plate + Return To Game escape.
      if (result === 'no_fill') {
        setInterstitialAdSlotActive(false);
        return;
      }
      // completed / failed / skipped / cancelled-from-SDK — dismiss plate and fade back.
      beginAdBreakOutro();
    },
    [beginAdBreakOutro],
  );

  const handleAdBreakFadeOutComplete = useCallback(() => {
    const now = Date.now();
    adBreakRuntimeRef.current.lastAdBreakAt = now;
    adBreakRuntimeRef.current.fallbackPending = false;
    persistGameSnapshotRef.current();
    setAdBreakIntroActive(false);
    setAdBreakFadeOutActive(false);
    setInterstitialAdSlotActive(false);
    const onAdBreakDone = pendingAdBreakCompleteRef.current;
    pendingAdBreakCompleteRef.current = null;
    onAdBreakDone?.();
  }, []);

  useEffect(() => {
    return () => {
      if (rewardedAdFadeTimeoutRef.current != null) {
        window.clearTimeout(rewardedAdFadeTimeoutRef.current);
      }
    };
  }, []);

  const handleDailyTaskClaim2x = useCallback((taskId: string, fx: DailyTaskClaimFx) => {
    const task = dailyTaskRows.find((t) => t.id === taskId);
    if (!task || task.state !== 'complete') return;
    playSfx(SFX_IDS.uiConfirmNormal);
    pendingDailyTaskClaimRef.current = { taskId, fx, coinMultiplier: 2 };
    pendingAdSourceRef.current = 'dailyTaskClaim2x';
    setPendingAdComplete(null);
    openRewardedFakeAd();
  }, [dailyTaskRows, openRewardedFakeAd]);

  const performDailyTaskClaim = useCallback(
    (taskId: string, fx: DailyTaskClaimFx, coinMultiplier = 1) => {
      const task = dailyTaskRowsRef.current.find((t) => t.id === taskId);
      if (!task || task.state !== 'complete') return;

      setShowFakeAd(false);
      pendingAdSourceRef.current = null;
      pendingDailyTaskClaimRef.current = null;
      setPendingAdComplete(null);

      const next = markDailyTaskClaimed(taskId, getDailyTasksCtx());
      dailyTaskRowsRef.current = next;
      setDailyTaskRows(next);
      playDailyTaskClaimPresentation(taskId, task.rewardCoins * coinMultiplier, fx);
    },
    [playDailyTaskClaimPresentation],
  );

  const handleDailyTaskClaim = useCallback(
    (taskId: string, fx: DailyTaskClaimFx) => {
      performDailyTaskClaim(taskId, fx);
    },
    [performDailyTaskClaim],
  );

  const applyPendingRewardedAdCompletion = useCallback(() => {
    lastFakeAdClosedAtRef.current = Date.now();
    const adSource = pendingAdSourceRef.current;
    pendingAdSourceRef.current = null;

    adBreakRuntimeRef.current.lastRewardedAdAt = Date.now();
    persistGameSnapshotRef.current();

    if (adSource === 'dailyTaskClaim2x') {
      const pending = pendingDailyTaskClaimRef.current;
      pendingDailyTaskClaimRef.current = null;
      if (pending) {
        window.setTimeout(() => {
          performDailyTaskClaim(pending.taskId, pending.fx, pending.coinMultiplier);
        }, DAILY_TASK_2X_CLAIM_AFTER_AD_MS);
      }
      return;
    }

    if (adSource === 'storeFreeOffer') {
      applyDailyTaskRowsUpdate(recordDailyTaskFreeOfferClaimed(getDailyTasksCtx()));
    }

    const applyReward = pendingAdComplete;
    setPendingAdComplete(null);
    window.setTimeout(() => applyReward?.(), 250);
  }, [applyDailyTaskRowsUpdate, getDailyTasksCtx, performDailyTaskClaim]);

  const handleRewardedLoadingPlateComplete = useCallback(() => {
    // Claim Reward on loading plate — cancel any in-flight real ad, grant reward, fade out.
    beginRewardedOutro();
    applyPendingRewardedAdCompletion();
  }, [applyPendingRewardedAdCompletion, beginRewardedOutro]);

  const handleRewardedAdClosed = useCallback(
    (result: RewardedAdCloseResult) => {
      if (result === 'no_fill') {
        setRewardedAdSlotActive(false);
        return;
      }
      beginRewardedOutro();
      applyPendingRewardedAdCompletion();
    },
    [applyPendingRewardedAdCompletion, beginRewardedOutro],
  );

  // Testing cheat: grant the next purchasable golden pot on the active garden only.
  const completeMasterySegmentCheat = useCallback(() => {
    const activeId = activeGardenIdRef.current;
    const activeSnap: GardenCollectionSnapshot = {
      highestPlantEver: highestPlantEverRef.current,
      unlockedLevels: plantMastery.unlockedLevels,
      money: moneyRef.current,
    };
    const v2 = loadGameSaveV2();
    const target = findNextDevGoldenPotTarget(
      activeId,
      activeSnap,
      v2?.gardens,
      [activeId],
    );
    if (!target) return;

    if (target.gardenId === activeId) {
      setPlantMastery((m) => ({
        ...m,
        unlockedLevels: m.unlockedLevels.includes(target.level)
          ? m.unlockedLevels
          : [...m.unlockedLevels, target.level].sort((a, b) => a - b),
      }));
      return;
    }

    if (!v2) return;
    let nextV2 = ensureGardenStartedInSave(v2, target.gardenId);
    const g = nextV2.gardens[target.gardenId];
    if (!g) return;
    const updatedLevels = g.plantMasteryUnlockedLevels.includes(target.level)
      ? g.plantMasteryUnlockedLevels
      : [...g.plantMasteryUnlockedLevels, target.level].sort((a, b) => a - b);
    nextV2 = {
      ...nextV2,
      gardens: {
        ...nextV2.gardens,
        [target.gardenId]: {
          ...g,
          plantMasteryUnlockedLevels: updatedLevels,
        },
      },
      savedAt: Date.now(),
    };
    persistGameSaveV2(nextV2);
    setCollectionSaveRevision((r) => r + 1);
  }, [plantMastery.unlockedLevels]);

  const handleDevLevelUpClick = useCallback((options?: DevCheatOptions) => {
    // Shift+L during starter FTUE: skip tutorial → post-FTUE level 2 + level-up popup.
    if (activeFtueStageRef.current != null) {
      skipStarterFtueAndLevelUpRef.current();
      return;
    }

    const deferPopups = options?.deferPopups !== false;
    playSfx(SFX_IDS.uiConfirmNormal);

    const presentOrQueueLevel = (level: number) => {
      setPlayerLevel(level);
      pendingLevelUpBackupRef.current = {
        gardenId: activeGardenIdRef.current,
        level,
      };
      recordDailyTaskPlayerLeveledUp();
      setPlayerLevelProgress(0);
      setPlayerLevelFlashTrigger((t) => t + 1);
      if (deferPopups) {
        if (
          level === PLANT_COLLECTION_UI_UNLOCK_LEVEL &&
          !collectionFtueCompleted &&
          activeGardenIdRef.current === DEFAULT_GARDEN_ID
        ) {
          setCollectionFtueRestartPending(true);
        }
        setLevelUpPopupQueue((q) => [...q, level]);
      } else {
        presentLevelUpPopupRef.current(level);
      }
    };

    // Shift+L while Starter/Field Pack is open: dismiss it and continue to the next level-up.
    if (!deferPopups && pendingLevelUpAfterStarterPackRef.current != null) {
      const grantedLevel = pendingLevelUpAfterStarterPackRef.current;
      pendingLevelUpAfterStarterPackRef.current = null;
      setIapOfferUi(null);
      levelUpGuardRef.current = false;
      presentOrQueueLevel(grantedLevel + 1);
      return;
    }

    const nextLevel = playerLevel + 1;
    if (nextLevel === STARTER_PACK_FORCE_POPUP_LEVEL) {
      const useStarter =
        activeGardenIdRef.current === DEFAULT_GARDEN_ID &&
        isStoreIapEnabled(STORE_IAP_OFFER_STARTER_PACK_ID);
      const useField =
        activeGardenIdRef.current !== DEFAULT_GARDEN_ID &&
        isStoreIapEnabled(STORE_IAP_OFFER_FIELD_PACK_ID);
      if (useStarter || useField) {
        setLevelUpPopup(null);
        if (useStarter) {
          markStarterPackUnlocked();
          setStarterPackUnlocked(true);
          pendingLevelUpAfterStarterPackRef.current = nextLevel;
          setIapOfferUi({ offerId: STORE_IAP_OFFER_STARTER_PACK_ID });
        } else {
          markFieldPackUnlocked();
          setFieldPackUnlocked(true);
          pendingLevelUpAfterStarterPackRef.current = nextLevel;
          setIapOfferUi({ offerId: STORE_IAP_OFFER_FIELD_PACK_ID });
        }
        return;
      }
      // IAP killed — fall through to normal level-up.
    }
    presentOrQueueLevel(nextLevel);
  }, [playerLevel, recordDailyTaskPlayerLeveledUp, collectionFtueCompleted]);

  const handleDevUnlockPlantClick = useCallback((options?: DevCheatOptions) => {
    const deferPopups = options?.deferPopups !== false;
    playSfx(SFX_IDS.uiConfirmNormal);
    const activeId = activeGardenIdRef.current;
    const activeSnap: GardenCollectionSnapshot = {
      highestPlantEver: highestPlantEverRef.current,
      unlockedLevels: plantMastery.unlockedLevels,
      money: moneyRef.current,
    };
    const v2ForUnlock = loadGameSaveV2();
    const v2Gardens = v2ForUnlock?.gardens;
    // Active garden only (same scope as pause-menu Golden Pot cheat).
    const activeOnly = [activeId] as const;
    if (!hasAnyDevUnlockPlantRemaining(activeId, activeSnap, v2Gardens, activeOnly)) return;
    const target = findNextDevUnlockPlantTarget(activeId, activeSnap, v2Gardens, activeOnly);
    if (!target) return;
    const { gardenId: targetGardenId, newLevel } = target;

    if (targetGardenId === activeId) {
      setHighestPlantEver(newLevel);
      highestPlantEverRef.current = newLevel;
      discoveryGoalsRemainingRef.current = getDiscoveryGoalBuffer(newLevel);
      lastMergeDiscoveryLevelRef.current = newLevel;
      if (deferPopups) {
        discoveryLevelAfterPauseCloseRef.current = newLevel;
      } else {
        setDiscoveryPopup({ isVisible: true, level: newLevel });
      }
      return;
    }

    let v2 = loadGameSaveV2();
    if (!v2) return;
    v2 = ensureGardenStartedInSave(v2, targetGardenId);
    const g = v2.gardens[targetGardenId];
    if (!g) return;
    v2 = {
      ...v2,
      gardens: {
        ...v2.gardens,
        [targetGardenId]: {
          ...g,
          highestPlantEver: newLevel,
          discoveryGoalsRemaining: getDiscoveryGoalBuffer(newLevel),
          lastMergeDiscoveryLevel: newLevel,
        },
      },
      savedAt: Date.now(),
    };
    persistGameSaveV2(v2);
    setCollectionSaveRevision((r) => r + 1);
  }, [plantMastery.unlockedLevels]);

  const handleDevGoldenPotClick = useCallback(() => {
    playSfx(SFX_IDS.uiConfirmNormal);
    completeMasterySegmentCheat();
  }, [completeMasterySegmentCheat]);

  const handleDevAddMoneyClick = useCallback(() => {
    playSfx(SFX_IDS.uiConfirmNormal);
    setMoney((prev) => prev + DEV_CHEAT_ADD_MONEY_AMOUNT);
  }, []);

  const handleDevClearCoinsClick = useCallback(() => {
    playSfx(SFX_IDS.uiConfirmNormal);
    setMoney(0);
    const v2 = loadGameSaveV2();
    if (!v2) return;
    const gardens = { ...v2.gardens };
    for (const id of Object.keys(gardens) as GardenId[]) {
      const garden = gardens[id];
      if (!garden) continue;
      gardens[id] = { ...garden, money: 0 };
    }
    persistGameSaveV2({ ...v2, gardens, savedAt: Date.now() });
    setCollectionSaveRevision((r) => r + 1);
  }, []);

  const handlePostFtueCleanRestart = useCallback((confirmMessage: string) => {
    playSfx(SFX_IDS.uiConfirmNormal);
    if (!window.confirm(confirmMessage)) {
      return;
    }
    suppressGameSaveRef.current = true;
    setAutoMergeMode(false);
    try { localStorage.removeItem(STORE_STARTER_PACK_COUNTDOWN_END_MS_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(STORE_STARTER_PACK_UNLOCKED_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(STORE_STARTER_PACK_PURCHASED_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(STORE_FIELD_PACK_COUNTDOWN_END_MS_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(STORE_FIELD_PACK_UNLOCKED_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(STORE_FIELD_PACK_PURCHASED_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(DAILY_TASKS_COUNTDOWN_END_MS_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(DAILY_TASKS_UNLOCKED_KEY); } catch { /* ignore */ }
    clearDailyTasksProgressStorage();
    setTasksFtueStarted(false);
    setTasksFtueUnlockRevealed(false);
    setTasksFtueCompleted(false);
    tasksFtueRevealPlayedRef.current = false;
    pendingTasksFtueRevealRef.current = false;
    setGardensFtueStarted(false);
    setGardensFtueUnlockRevealed(false);
    setGardensFtueCompleted(false);
    gardensFtueRevealPlayedRef.current = false;
    pendingGardensFtueRevealRef.current = false;
    gardensAffordThresholdInitializedRef.current = false;
    prevCanAffordGardenPurchaseRef.current = false;
    setNewGardenFtueCompleted(false);
    setNewGardenFtuePhase(null);
    setStarterPackUnlocked(false);
    setStarterPackPurchased(false);
    setStarterPackCountdownRefreshKey((k) => k + 1);
    setFieldPackUnlocked(false);
    setFieldPackPurchased(false);
    setFieldPackCountdownRefreshKey((k) => k + 1);
    setDailyTasksCountdownRefreshKey((k) => k + 1);
    persistGameSaveV2(createPostFtueCleanSaveV2());
    window.location.reload();
  }, []);

  /**
   * Dev: Shift+L during starter FTUE — jump to post-tutorial clean state at level 2
   * and show the level-up popup after reload (as if tutorial finished then leveled up).
   */
  const handleDevSkipStarterFtueAndLevelUp = useCallback(() => {
    playSfx(SFX_IDS.uiConfirmNormal);
    suppressGameSaveRef.current = true;
    setAutoMergeMode(false);
    try { localStorage.removeItem(STORE_STARTER_PACK_COUNTDOWN_END_MS_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(STORE_STARTER_PACK_UNLOCKED_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(STORE_STARTER_PACK_PURCHASED_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(STORE_FIELD_PACK_COUNTDOWN_END_MS_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(STORE_FIELD_PACK_UNLOCKED_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(STORE_FIELD_PACK_PURCHASED_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(DAILY_TASKS_COUNTDOWN_END_MS_KEY); } catch { /* ignore */ }
    try { localStorage.removeItem(DAILY_TASKS_UNLOCKED_KEY); } catch { /* ignore */ }
    clearDailyTasksProgressStorage();
    try {
      sessionStorage.setItem(DEV_SKIP_STARTER_FTUE_LEVEL_UP_KEY, '2');
    } catch { /* ignore */ }
    const v2 = createPostFtueCleanSaveV2();
    const g = v2.gardens[DEFAULT_GARDEN_ID];
    if (g) {
      v2.gardens[DEFAULT_GARDEN_ID] = {
        ...g,
        playerLevel: 2,
        playerLevelProgress: 0,
      };
    }
    persistGameSaveV2(v2);
    window.location.reload();
  }, []);

  skipStarterFtueAndLevelUpRef.current = handleDevSkipStarterFtueAndLevelUp;

  const flushDeferredCheatPopups = useCallback(() => {
    const plantLevelToDiscover = discoveryLevelAfterPauseCloseRef.current;
    discoveryLevelAfterPauseCloseRef.current = null;
    if (plantLevelToDiscover != null) {
      setDiscoveryPopup({ isVisible: true, level: plantLevelToDiscover });
    }
    setLevelUpPopupQueue((q) => {
      if (q.length > 0) {
        presentLevelUpPopupRef.current(q[0]);
        return q.slice(1);
      }
      return q;
    });
  }, []);

  const devCheatHandlersRef = useRef({
    unlockPlant: handleDevUnlockPlantClick,
    levelUp: handleDevLevelUpClick,
    goldenPot: handleDevGoldenPotClick,
    addMoney: handleDevAddMoneyClick,
    addGoal: (() => {}) as () => void,
    skipTutorial: (() => {}) as () => void,
  });
  devCheatHandlersRef.current = {
    ...devCheatHandlersRef.current,
    unlockPlant: handleDevUnlockPlantClick,
    levelUp: handleDevLevelUpClick,
    goldenPot: handleDevGoldenPotClick,
    addMoney: handleDevAddMoneyClick,
  };

  const purchasePlantMasteryForLevel = useCallback(
    (level: number, gardenId: GardenId) => {
      const cost = getPlantMasteryUnlockCost(level);
      const isActiveGarden = gardenId === activeGardenIdRef.current;

      if (isActiveGarden) {
        // Side effects (money deduction, daily-task record) must live OUTSIDE the
        // setState updater: React double-invokes updaters, which would otherwise
        // deduct `cost` twice and push the wallet negative.
        if (
          !canPurchaseGoldenPotForLevel(
            level,
            highestPlantEverRef.current,
            plantMastery.unlockedLevels,
          )
        ) {
          return;
        }
        if (moneyRef.current < cost) return;
        moneyRef.current -= cost;
        setMoney((m) => m - cost);
        setPlantMastery((prev) => ({
          ...prev,
          unlockPending: prev.unlockPending.filter((x) => x !== level),
          unlockedLevels: prev.unlockedLevels.includes(level)
            ? prev.unlockedLevels
            : [...prev.unlockedLevels, level].sort((a, b) => a - b),
        }));
        queueMicrotask(() => {
          applyDailyTaskRowsUpdate(recordDailyTaskGoldenPot(getDailyTasksCtx()));
        });
        return;
      }

      const v2 = loadGameSaveV2();
      if (!v2) return;
      let nextV2 = ensureGardenStartedInSave(v2, gardenId);
      const g = nextV2.gardens[gardenId];
      if (!g) return;
      if (!canPurchaseGoldenPotForLevel(level, g.highestPlantEver, g.plantMasteryUnlockedLevels)) return;
      if (g.money < cost) return;

      const updatedLevels = g.plantMasteryUnlockedLevels.includes(level)
        ? g.plantMasteryUnlockedLevels
        : [...g.plantMasteryUnlockedLevels, level].sort((a, b) => a - b);
      nextV2 = {
        ...nextV2,
        gardens: {
          ...nextV2.gardens,
          [gardenId]: {
            ...g,
            money: g.money - cost,
            plantMasteryUnlockPending: g.plantMasteryUnlockPending.filter((x) => x !== level),
            plantMasteryUnlockedLevels: updatedLevels,
          },
        },
        savedAt: Date.now(),
      };
      persistGameSaveV2(nextV2);
      setCollectionSaveRevision((r) => r + 1);
      queueMicrotask(() => {
        applyDailyTaskRowsUpdate(recordDailyTaskGoldenPot(getDailyTasksCtx()));
      });
    },
    [applyDailyTaskRowsUpdate, getDailyTasksCtx, plantMastery.unlockedLevels],
  );

  const triggerMasteryPurchaseReveal = useCallback((level: number, gardenId: GardenId) => {
    if (masteryPurchaseRevealTimeoutRef.current) {
      window.clearTimeout(masteryPurchaseRevealTimeoutRef.current);
    }
    const el = barnScrollRef.current;
    const plantKey = getCollectionPlantKey(gardenId, level);
    const plantEl = el?.querySelector(`[data-barn-plant-key="${plantKey}"]`) as HTMLElement | null;
    const r = plantEl?.getBoundingClientRect();
    if (r) {
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const startTime = Date.now();
      spawnMasteryConeBurst({ id: `mastery-buy-cone-${level}-${startTime}-${Math.random().toString(36).slice(2)}`, x: cx, y: cy, startTime });
      setCellHighlightBeams((prev) => [
        ...prev,
        {
          id: `mastery-buy-beam-${level}-${startTime}-${Math.random().toString(36).slice(2)}`,
          x: cx,
          y: cy,
          cellWidth: r.width,
          cellHeight: r.height,
          startTime,
          showHexSprite: false,
          sparkleCount: 20,
          sparkleSizeScale: 2,
          sparkleHeightScale: 1.9,
        },
      ]);
    }
    setMasteryPurchaseRevealLevels((prev) => (prev.includes(plantKey) ? prev : [...prev, plantKey]));
    masteryPurchaseRevealTimeoutRef.current = window.setTimeout(() => {
      setMasteryPurchaseRevealLevels((prev) => prev.filter((x) => x !== plantKey));
      masteryPurchaseRevealTimeoutRef.current = null;
    }, 650);
  }, []);

  const handleShelfUpgradeClick = useCallback(
    (shelfIndex: number, gardenId: GardenId, event: React.MouseEvent<HTMLButtonElement>) => {
      const gardenSnap = getGardenCollectionSnapshot(
        gardenId,
        activeGardenId,
        activeCollectionSnapshot,
        collectionV2Gardens,
      );
      const nextLevel = getNextUpgradeablePlantOnShelf(gardenSnap, shelfIndex);
      if (nextLevel == null) return;
      const cost = getPlantMasteryUnlockCost(nextLevel);
      if (gardenSnap.money < cost) return;

      playSfx(SFX_IDS.uiConfirmReward);
      const isFtueShelfPurchase =
        collectionFtuePhase === 'point_unlock' &&
        gardenId === DEFAULT_GARDEN_ID &&
        nextLevel === 1 &&
        !collectionFtueCompleted;

      const prevBonusPotCount = globalBonusPotCountRef.current;
      purchasePlantMasteryForLevel(nextLevel, gardenId);

      const btnRect = event.currentTarget.getBoundingClientRect();
      setActiveGoldenPotProgressParticles((prev) => [
        ...prev,
        {
          id: `golden-pot-bar-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          startX: btnRect.left + btnRect.width / 2,
          startY: btnRect.top + btnRect.height / 2,
        },
      ]);
      setCollectionBarHeldNumeratorCount(prevBonusPotCount);

      if (isFtueShelfPurchase) {
        if (collectionFtueOverlayFadeTimeoutRef.current != null) {
          window.clearTimeout(collectionFtueOverlayFadeTimeoutRef.current);
        }
        setCollectionFtueOverlayFadingOut(true);
        collectionFtueOverlayFadeTimeoutRef.current = window.setTimeout(() => {
          collectionFtueOverlayFadeTimeoutRef.current = null;
          setCollectionFtueOverlayFadingOut(false);
          setCollectionFtuePhase('wait_reveal');
          window.setTimeout(() => {
            setCollectionFtuePhase('point_bonuses');
          }, 720);
        }, 200);
      }

      triggerMasteryPurchaseReveal(nextLevel, gardenId);
    },
    [
      activeGardenId,
      activeCollectionSnapshot,
      collectionV2Gardens,
      collectionFtuePhase,
      collectionFtueCompleted,
      purchasePlantMasteryForLevel,
      triggerMasteryPurchaseReveal,
      playSfx,
    ],
  );

  const [playerLevelFlashTrigger, setPlayerLevelFlashTrigger] = useState(0);
  const [levelUpPopup, setLevelUpPopup] = useState<{ isVisible: boolean; level: number } | null>(null);
  /** Dev Shift+T: bump to skip garden1 L2 level-up intro reveal. */
  const [gardenLevelIntroSkipNonce, setGardenLevelIntroSkipNonce] = useState(0);
  const levelUpPopupRef = useRef(levelUpPopup);
  levelUpPopupRef.current = levelUpPopup;
  const [gardenLevelPopupOpen, setGardenLevelPopupOpen] = useState(false);
  /** Queued level-up popups (e.g. from pause menu fast-level); shown one by one after pause menu closes. */
  const [levelUpPopupQueue, setLevelUpPopupQueue] = useState<number[]>([]);
  presentLevelUpPopupRef.current = (level: number) => {
    if (
      level === PLANT_COLLECTION_UI_UNLOCK_LEVEL &&
      !collectionFtueCompleted &&
      activeGardenIdRef.current === DEFAULT_GARDEN_ID
    ) {
      setCollectionFtueRestartPending(true);
    }
    setLevelUpPopup({ isVisible: true, level });
  };
  useEffect(() => {
    const was = prevPopupOpenRef.current;
    const isLevelUpOpen = !!levelUpPopup?.isVisible;
    const isGardenLevelOpen = gardenLevelPopupOpen;
    const isDiscoveryOpen = !!discoveryPopup?.isVisible;
    const isLimitedOfferOpen = !!limitedOfferPopup?.isVisible;
    const isPlantInfoOpen = !!plantInfoPopup?.isVisible;
    const isGoldenPotOpen = goldenPotBonusesPopupOpen;
    const isPurchaseSuccessOpen = !!purchaseSuccessfulUi;
    const isIapOfferOpen = !!iapOfferUi;
    const isRateUsOpen = rateUsPopupOpen;
    const isDailyTasksOpen = dailyTasksPopupOpen;
    const isGardenPickerOpen = gardenPickerOpen;
    const isLockedDailyTasksOpen = lockedDailyTasksPopupOpen;
    const isLockedGardenPickerOpen = lockedGardenPickerPopupOpen;
    const isRateUsThankYouOpen = rateUsThankYouOpen;
    const isCorruptSaveOpen = corruptSavePopupOpen;
    const isPauseMenuOpen = pauseMenuOpen;

    if (!was.levelUp && isLevelUpOpen) playSfx(SFX_IDS.popupLevelUp);
    if (!was.gardenLevel && isGardenLevelOpen) playSfx(SFX_IDS.popupLevelUp);
    if (!was.discovery && isDiscoveryOpen) playSfx(SFX_IDS.popupPlantDiscovery);
    if (!was.limitedOffer && isLimitedOfferOpen) playSfx(SFX_IDS.popupNormal);
    if (!was.plantInfo && isPlantInfoOpen) playSfx(SFX_IDS.popupNormal);
    if (!was.goldenPot && isGoldenPotOpen) {
      // Shelf-complete auto-open stages a reveal tier; manual / FTUE opens stay popupNormal.
      playSfx(
        goldenPotBonusRevealTier != null
          ? SFX_IDS.popupPlantDiscovery
          : SFX_IDS.popupNormal,
      );
    }
    if (!was.purchaseSuccess && isPurchaseSuccessOpen) playSfx(SFX_IDS.popupNormal);
    if (!was.iapOffer && isIapOfferOpen) playSfx(SFX_IDS.popupNormal);
    if (!was.rateUs && isRateUsOpen) playSfx(SFX_IDS.popupNormal);
    if (!was.dailyTasks && isDailyTasksOpen) playSfx(SFX_IDS.popupNormal);
    if (!was.gardenPicker && isGardenPickerOpen) playSfx(SFX_IDS.popupNormal);
    if (!was.lockedDailyTasks && isLockedDailyTasksOpen) playSfx(SFX_IDS.popupNormal);
    if (!was.lockedGardenPicker && isLockedGardenPickerOpen) playSfx(SFX_IDS.popupNormal);
    if (!was.rateUsThankYou && isRateUsThankYouOpen) playSfx(SFX_IDS.popupNormal);
    if (!was.corruptSave && isCorruptSaveOpen) playSfx(SFX_IDS.popupNormal);
    if (!was.pauseMenu && isPauseMenuOpen) playSfx(SFX_IDS.popupNormal);

    prevPopupOpenRef.current = {
      ...prevPopupOpenRef.current,
      levelUp: isLevelUpOpen,
      gardenLevel: isGardenLevelOpen,
      discovery: isDiscoveryOpen,
      limitedOffer: isLimitedOfferOpen,
      plantInfo: isPlantInfoOpen,
      goldenPot: isGoldenPotOpen,
      purchaseSuccess: isPurchaseSuccessOpen,
      iapOffer: isIapOfferOpen,
      rateUs: isRateUsOpen,
      dailyTasks: isDailyTasksOpen,
      gardenPicker: isGardenPickerOpen,
      lockedDailyTasks: isLockedDailyTasksOpen,
      lockedGardenPicker: isLockedGardenPickerOpen,
      rateUsThankYou: isRateUsThankYouOpen,
      corruptSave: isCorruptSaveOpen,
      pauseMenu: isPauseMenuOpen,
    };
  }, [
    levelUpPopup,
    gardenLevelPopupOpen,
    discoveryPopup,
    limitedOfferPopup,
    plantInfoPopup,
    goldenPotBonusesPopupOpen,
    goldenPotBonusRevealTier,
    purchaseSuccessfulUi,
    iapOfferUi,
    rateUsPopupOpen,
    dailyTasksPopupOpen,
    gardenPickerOpen,
    lockedDailyTasksPopupOpen,
    lockedGardenPickerPopupOpen,
    rateUsThankYouOpen,
    corruptSavePopupOpen,
    pauseMenuOpen,
  ]);
  /** FTUE: current stage (e.g. 'welcome' after splash); null when not in FTUE */
  const [activeFtueStage, setActiveFtueStage] = useState<FtueStageId | null>(null);
  const activeFtueStageRef = useRef<FtueStageId | null>(null);
  activeFtueStageRef.current = activeFtueStage;

  /** After main FTUE (or on load for completed saves): ask once for notification permission. */
  useEffect(() => {
    if (isLoading) return;
    if (activeFtueStage != null) return;
    if (!ftue11PersistenceEnabledRef.current) return;
    void tryRequestPermissionOnceAfterFtue();
  }, [isLoading, activeFtueStage]);

  const prevWelcomeFtueOpenRef = useRef(false);
  useEffect(() => {
    const isWelcomeOpen = activeFtueStage === 'welcome';
    if (!prevWelcomeFtueOpenRef.current && isWelcomeOpen) {
      playSfx(SFX_IDS.popupNormal);
    }
    prevWelcomeFtueOpenRef.current = isWelcomeOpen;
  }, [activeFtueStage]);

  useEffect(() => {
    if (tasksFtueCompleted || tasksFtueUnlockRevealed) {
      pendingTasksFtueRevealRef.current = false;
      return;
    }
    if (levelUpPopup?.isVisible) return;
    const pendingReveal = pendingTasksFtueRevealRef.current;
    if (!pendingReveal && !tasksFtueStarted) return;
    if (!pendingReveal && activeScreen !== 'FARM') return;
    pendingTasksFtueRevealRef.current = false;
    playTasksFtueUnlockReveal();
  }, [
    activeScreen,
    levelUpPopup?.isVisible,
    tasksFtueCompleted,
    tasksFtueStarted,
    tasksFtueUnlockRevealed,
    playTasksFtueUnlockReveal,
  ]);

  useEffect(() => {
    if (gardensFtueCompleted || gardensFtueUnlockRevealed) {
      pendingGardensFtueRevealRef.current = false;
      return;
    }
    if (levelUpPopup?.isVisible) return;
    const pendingReveal = pendingGardensFtueRevealRef.current;
    if (!pendingReveal && !gardensFtueStarted) return;
    if (!pendingReveal && activeScreen !== 'FARM') return;
    pendingGardensFtueRevealRef.current = false;
    playGardensFtueUnlockReveal();
  }, [
    activeScreen,
    levelUpPopup?.isVisible,
    gardensFtueCompleted,
    gardensFtueStarted,
    gardensFtueUnlockRevealed,
    playGardensFtueUnlockReveal,
  ]);

  useLayoutEffect(() => {
    if (activeFtueStage == null) {
      setFtueSettingsButtonRect(null);
      return;
    }
    const measure = () => {
      const candidates = Array.from(document.querySelectorAll<HTMLElement>('#settings-gear-button'));
      if (candidates.length === 0) {
        setFtueSettingsButtonRect(null);
        return;
      }
      const visible = candidates
        .map((el) => el.getBoundingClientRect())
        .filter((r) => {
          const hasSize = r.width > 0 && r.height > 0;
          const inViewport =
            r.right > 0 &&
            r.bottom > 0 &&
            r.left < window.innerWidth &&
            r.top < window.innerHeight;
          return hasSize && inViewport;
        });
      const r =
        visible.sort((a, b) => {
          // Prefer the right-most button; if tied, pick the top-most.
          if (b.right !== a.right) return b.right - a.right;
          return a.top - b.top;
        })[0] ?? null;
      if (!r) {
        setFtueSettingsButtonRect(null);
        return;
      }
      setFtueSettingsButtonRect({
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
      });
    };
    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    const raf = requestAnimationFrame(measure);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, [activeFtueStage, activeScreen]);
  /** Warning FTUE: shown when unlocked grid is full and all plants are unique. */
  const [outOfSpaceFtueVisible, setOutOfSpaceFtueVisible] = useState(false);
  useEffect(() => {
    const was = prevPopupOpenRef.current.outOfSpaceFtue;
    if (!was && outOfSpaceFtueVisible) playSfx(SFX_IDS.popupNormal);
    prevPopupOpenRef.current.outOfSpaceFtue = outOfSpaceFtueVisible;
  }, [outOfSpaceFtueVisible]);
  /** Gate so dismissing doesn't instantly re-open until condition clears then re-enters. */
  const outOfSpaceArmedRef = useRef(true);
  /** FTUE_2: number of seeds fired (must be exactly 2 to complete); block 3rd tap */
  const [ftue2SeedFireCount, setFtue2SeedFireCount] = useState(0);
  /** FTUE_2: true when fading out finger + text after 2 seeds */
  const [ftue2FadingOut, setFtue2FadingOut] = useState(false);
  /** FTUE_2: block further seed taps after 2 (ref so rapid 3rd tap can't slip through before state updates) */
  const ftue2SeedsBlockedRef = useRef(false);
  /** FTUE_3: true when fading out finger + textbox after successful 4→13 merge */
  const [ftue3FadingOut, setFtue3FadingOut] = useState(false);
  /** FTUE_4: true when fading out textbox after "Lets Harvest!" click */
  const [ftue4FadingOut, setFtue4FadingOut] = useState(false);
  /** FTUE_4: true after FTUE 3 completes; start FTUE 4 only when player clicks "Excellent!" on plant 2 discovery */
  const [ftue4Pending, setFtue4Pending] = useState(false);
  type FtueRect = { left: number; top: number; width: number; height: number };
  /** FTUE: button rects in game-container coordinates (448×796 space) so overlays scale with the app. */
  const [seedButtonRect, setSeedButtonRect] = useState<FtueRect | null>(null);
  const [harvestButtonRect, setHarvestButtonRect] = useState<FtueRect | null>(null);
  /** FTUE: hide player level section until we reveal it (set to true when FTUE 6 shows) */
  const [ftuePlayerLevelVisible, setFtuePlayerLevelVisible] = useState(false);
  /** FTUE 7: after collecting in FTUE 6, schedule spawn of 2 goals then show "more orders" overlay */
  const [ftue7Scheduled, setFtue7Scheduled] = useState(false);
  const ftue7SkipLoadingSlot0Ref = useRef(false); // skip standard "start loading" for slot 0 when FTUE 7 will spawn goals
  /** Slots 0/1 in position but hidden until we reveal (fade-in); use goal-no-transition for both during this phase */
  const [ftue7UnrevealedSlots, setFtue7UnrevealedSlots] = useState<number[]>([]);
  const [ftue7RevealMode, setFtue7RevealMode] = useState(false); // true from first reveal until we clear fade-in slot
  /** Slots playing spawn bounce (panel + icon bounce, no white flash); cleared after 500ms */
  const [goalSpawnBounceSlots, setGoalSpawnBounceSlots] = useState<number[]>([]);
  const [ftue7SeedFireCount, setFtue7SeedFireCount] = useState(0);
  const [ftue7FadingOut, setFtue7FadingOut] = useState(false);
  const [ftue8FadingOut, setFtue8FadingOut] = useState(false);
  /** FTUE 9: collect both goals – finger on slot 1; fade out after both collected. No new goal loading during FTUE 9. */
  const [ftue9CollectedCount, setFtue9CollectedCount] = useState(0);
  const [ftue9FadingOut, setFtue9FadingOut] = useState(false);
  const ftue9NoNewGoalsRef = useRef(false);
  /** FTUE 10: manual – point_orders (tap Orders to open), panel_open_orders (tap Seeds), finger (tap purchase) */
  type Ftue10Phase = 'point_orders' | 'panel_open_orders' | 'finger';
  const [ftue10Phase, setFtue10Phase] = useState<Ftue10Phase | null>(null);
  const [ftue10GreenFlashUpgradeId, setFtue10GreenFlashUpgradeId] = useState<string | null>(null);
  const [ftue10FadingOut, setFtue10FadingOut] = useState(false);
  const ftue10PostPurchaseHoldTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ftueSeedSurplusActivated, setFtueSeedSurplusActivated] = useState(false);
  const [ftueHarvestSurplusActivated, setFtueHarvestSurplusActivated] = useState(false);
  const [ftue10PostClosePending, setFtue10PostClosePending] = useState(false);
  const [ftue11StartQueued, setFtue11StartQueued] = useState(false);
  /**
   * Soft harvest nudge after FTUE 11.
   * null = never armed (legacy / pre-release); false = armed; true = done forever.
   */
  const [postFtueHarvestNudgeDone, setPostFtueHarvestNudgeDone] = useState<boolean | null>(null);
  const [softHarvestNudgeVisible, setSoftHarvestNudgeVisible] = useState(false);
  const softHarvestNudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const postFtueHarvestNudgeDoneRef = useRef<boolean | null>(null);
  postFtueHarvestNudgeDoneRef.current = postFtueHarvestNudgeDone;
  const [ftue10BigBounceActive, setFtue10BigBounceActive] = useState(false);
  const [ftue10ButtonsNormalEarly, setFtue10ButtonsNormalEarly] = useState(false);
  const [ftue95ShowTextbox, setFtue95ShowTextbox] = useState(false);
  const [ftue95FadingOut, setFtue95FadingOut] = useState(false);
  const ftue11Delay1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ftue11Delay2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ftue11InFlightRef = useRef(false);
  const ftue10BigBounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ftue95EnterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ftue95StartOnceRef = useRef(false);

  // FTUE 10 → 11: wait until upgrade panel is fully closed, enable surplus, then show FTUE 11.
  useEffect(() => {
    if (!ftue11StartQueued) return;
    // Wait until the upgrade panel has fully finished its close animation.
    if (!panelClosed) return;

    // Prevent double-scheduling if this effect re-fires while already in flight.
    if (ftue11InFlightRef.current) return;
    ftue11InFlightRef.current = true;

    if (ftue11Delay1Ref.current) clearTimeout(ftue11Delay1Ref.current);
    if (ftue11Delay2Ref.current) clearTimeout(ftue11Delay2Ref.current);

    // upgrade panel closes -> immediately set progress -> immediately show FTUE11 textbox
    if (ftue10PostClosePending) {
      setFtueSeedSurplusActivated(true);
      setFtueHarvestSurplusActivated(true);
      setHarvestCharges(harvestChargesMaxRef.current);
      harvestChargesRef.current = harvestChargesMaxRef.current;
      setFtue10PostClosePending(false);
    }

    setActiveFtueStage('recharge_intro');
    setFtue11StartQueued(false);
    ftue11InFlightRef.current = false;
  }, [ftue11StartQueued, panelClosed, ftue10PostClosePending]);

  const clearSoftHarvestNudgeTimer = useCallback(() => {
    if (softHarvestNudgeTimerRef.current) {
      clearTimeout(softHarvestNudgeTimerRef.current);
      softHarvestNudgeTimerRef.current = null;
    }
  }, []);

  /** Arm soft harvest nudge: 5s grace, then fade in finger if harvest still untouched. */
  const armSoftHarvestNudge = useCallback(() => {
    if (postFtueHarvestNudgeDoneRef.current === true) return;
    setPostFtueHarvestNudgeDone(false);
    postFtueHarvestNudgeDoneRef.current = false;
    setSoftHarvestNudgeVisible(false);
    clearSoftHarvestNudgeTimer();
    softHarvestNudgeTimerRef.current = setTimeout(() => {
      softHarvestNudgeTimerRef.current = null;
      if (postFtueHarvestNudgeDoneRef.current === false) {
        setSoftHarvestNudgeVisible(true);
      }
    }, 5000);
  }, [clearSoftHarvestNudgeTimer]);

  /** First harvest tap after FTUE 11 forever dismisses the soft nudge (even during the 5s wait). */
  const completeSoftHarvestNudge = useCallback(() => {
    if (postFtueHarvestNudgeDoneRef.current !== false) return;
    clearSoftHarvestNudgeTimer();
    setSoftHarvestNudgeVisible(false);
    setPostFtueHarvestNudgeDone(true);
    postFtueHarvestNudgeDoneRef.current = true;
    persistGameSnapshotRef.current();
  }, [clearSoftHarvestNudgeTimer]);

  // When armed (false), start the 5s grace timer once — after FTUE 11 confirm or on reload mid-nudge.
  useEffect(() => {
    if (isLoading) return;
    if (postFtueHarvestNudgeDone !== false) return;
    if (softHarvestNudgeTimerRef.current != null || softHarvestNudgeVisible) return;
    armSoftHarvestNudge();
  }, [isLoading, postFtueHarvestNudgeDone, softHarvestNudgeVisible, armSoftHarvestNudge]);

  useEffect(() => {
    return () => clearSoftHarvestNudgeTimer();
  }, [clearSoftHarvestNudgeTimer]);

  const buildAdBreakBlockerContext = useCallback(
    (now: number): AdBreakBlockerContext => ({
      now,
      playerLevel,
      activePlaytimeMs: adBreakRuntimeRef.current.activePlaytimeMs,
      hasNoAds: hasActiveRemoveAdsBoost(activeBoostsRef.current),
      isDragging: dragState != null,
      isLoading,
      activeFtueStage,
      ftue11StartQueued,
      collectionFtueActive: collectionFtuePhase != null && !collectionFtueCompleted,
      tasksFtueActive: tasksFtueStarted && !tasksFtueCompleted,
      gardensFtueActive: gardensFtueStarted && !gardensFtueCompleted,
      newGardenFtueActive: newGardenFtuePhase != null && !newGardenFtueCompleted,
      adPresentationActive:
        showFakeAd ||
        rewardedAdFadeInActive ||
        rewardedAdBlackHoldActive ||
        rewardedAdFadeOutActive ||
        adBreakIntroActive ||
        interstitialAdSlotActive ||
        rewardedAdSlotActive,
      gardenSwitchActive: gardenSwitchOverlayActive || gardenSwitchTransitionRef.current,
      offlineEarningsOpen: offlineEarningsUi?.open === true,
      returnGraceUntil: adBreakRuntimeRef.current.graceUntil,
      inStore: activeScreen === 'STORE',
      pauseMenuOpen,
      devToolsOpen,
      blockingPopupOpen:
        purchaseSuccessfulUi != null ||
        iapOfferUi != null ||
        rateUsPopupOpen ||
        rateUsThankYouOpen ||
        corruptSavePopupOpen ||
        dailyTasksPopupOpen ||
        lockedDailyTasksPopupOpen ||
        lockedGardenPickerPopupOpen ||
        gardenPickerOpen ||
        plantInfoPopup?.isVisible === true ||
        limitedOfferPopup?.isVisible === true ||
        gardenLevelPopupOpen,
      discoveryPopupOpen: discoveryPopup != null,
      levelUpPopupOpen: levelUpPopup != null,
      goldenPotBonusesPopupOpen,
    }),
    [
      playerLevel,
      dragState,
      isLoading,
      activeFtueStage,
      ftue11StartQueued,
      collectionFtuePhase,
      collectionFtueCompleted,
      tasksFtueStarted,
      tasksFtueCompleted,
      gardensFtueStarted,
      gardensFtueCompleted,
      newGardenFtuePhase,
      newGardenFtueCompleted,
      showFakeAd,
      rewardedAdFadeInActive,
      rewardedAdBlackHoldActive,
      rewardedAdFadeOutActive,
      adBreakIntroActive,
      interstitialAdSlotActive,
      rewardedAdSlotActive,
      gardenSwitchOverlayActive,
      offlineEarningsUi?.open,
      activeScreen,
      pauseMenuOpen,
      devToolsOpen,
      purchaseSuccessfulUi,
      iapOfferUi,
      rateUsPopupOpen,
      rateUsThankYouOpen,
      corruptSavePopupOpen,
      dailyTasksPopupOpen,
      lockedDailyTasksPopupOpen,
      lockedGardenPickerPopupOpen,
      gardenPickerOpen,
      plantInfoPopup?.isVisible,
      limitedOfferPopup?.isVisible,
      discoveryPopup,
      levelUpPopup,
      gardenLevelPopupOpen,
      goldenPotBonusesPopupOpen,
    ],
  );

  const tryShowAdBreak = useCallback(
    (trigger: AdBreakTriggerId, onComplete?: () => void): boolean => {
      const now = Date.now();
      const state = adBreakRuntimeRef.current;
      if (shouldFlagAdBreakFallback(state, now)) {
        state.fallbackPending = true;
      }
      const ctx = buildAdBreakBlockerContext(now);
      if (!canShowAdBreakNow(state, ctx, trigger)) {
        return false;
      }
      state.fallbackPending = false;
      openAdBreakFakeAd(onComplete);
      return true;
    },
    [buildAdBreakBlockerContext, openAdBreakFakeAd],
  );

  const tryShowAdBreakRef = useRef(tryShowAdBreak);
  tryShowAdBreakRef.current = tryShowAdBreak;

  const applyDiscoveryAddToCollectionEffects = useCallback(
    (level: number, startPoint: { x: number; y: number }) => {
      suppressDiscoveryDeclineSfxRef.current = true;
      const rewardValue = applyDoubleCoinsVisualAmount(
        getCoinValueForLevel(level) * PLANT_DISCOVERY_COIN_MULTIPLIER,
        activeBoostsRef.current,
      );
      const layer = discoveryRewardFxLayerRef.current;
      if (layer) {
        const lr = layer.getBoundingClientRect();
        const startX = startPoint.x - lr.left;
        const startY = startPoint.y - lr.top;
        setActiveDiscoveryCoinParticles((prev) => [
          ...prev,
          {
            id: `discovery-reward-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            startX,
            startY,
            value: rewardValue,
          },
        ]);
      }
      // FTUE plant-2 "Excellent!": skip collection-nav particle so attention stays on the farm/goals.
      const skipCollectionParticle = level === 2 && ftue4Pending;
      if (!skipCollectionParticle && containerRef.current) {
        const cr = containerRef.current.getBoundingClientRect();
        const scale = appScaleRef.current;
        setActiveBarnParticles((prev) => [
          ...prev,
          {
            id: `discovery-collection-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            startX: (startPoint.x - cr.left) / scale,
            startY: (startPoint.y - cr.top) / scale,
          },
        ]);
      }
      if (level === 2 && ftue4Pending) {
        setFtue4Pending(false);
        setActiveFtueStage('first_goal');
        setGoalSlots(['green', 'empty', 'empty', 'empty', 'empty']);
        setGoalPlantTypes([2, 0, 0, 0, 0]);
        setDiscoveryGoalLightGreenDismissed([false, false, false, false, false]);
        setGoalDiscoveryLightGreenActive([false, false, false, false, false]);
        recordSpawnedGoalPlantLevel(2, lastSpawnedGoalLevelsRef, lastSpawnedGoalPlantLevelHUDRef);
        setGoalCounts([3, 0, 0, 0, 0]);
        setGoalAmountsRequired([3, 0, 0, 0, 0]);
        setGoalDisplayOrder([0]);
      }
    },
    [ftue4Pending],
  );

  const finishDiscoveryPopupAfterAdBreak = useCallback(() => {
    suppressDiscoveryDeclineSfxRef.current = true;
    lastOtherPopupClosedAtRef.current = Date.now();
    setDiscoveryPopup(null);
    queueMicrotask(() => {
      tryStartAutoMergeRef.current();
      scheduleAutoMergeRecheckRef.current(0);
    });
  }, []);

  const finishLevelUpPopupAfterAdBreak = useCallback(() => {
    // Keep mounted with isVisible false so LevelUpPopup can play its leave animation;
    // onClose then clears state / advances the queue (same as a normal Unlock Now dismiss).
    suppressLevelUpDeclineSfxRef.current = true;
    setLevelUpPopup((prev) => (prev ? { ...prev, isVisible: false } : null));
  }, []);

  useEffect(() => {
    if (isLoading || !ftue11PersistenceEnabledRef.current) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      const state = adBreakRuntimeRef.current;
      if (shouldFlagAdBreakFallback(state, now)) {
        state.fallbackPending = true;
      }
      if (!state.fallbackPending) return;
      tryShowAdBreakRef.current('fallback_idle');
    }, AD_BREAK_SETTINGS.fallbackPollMs);
    return () => window.clearInterval(id);
  }, [isLoading, activeFtueStage]);

  /** New session vs short-break ad policy when loading finishes or app resumes. */
  const applyAdBreakReturnFromAway = useCallback(() => {
    const now = Date.now();
    const lastBg = loadUserPrefs().adBreakLastBackgroundAt;
    const awayMs = lastBg > 0 ? Math.max(0, now - lastBg) : Number.POSITIVE_INFINITY;
    applyAdBreakReturnPolicy(adBreakRuntimeRef.current, now, awayMs, {
      hadPriorSession: lastBg > 0,
    });
  }, []);

  const prevIsLoadingForAdReturnRef = useRef(true);
  useEffect(() => {
    if (prevIsLoadingForAdReturnRef.current && !isLoading) {
      applyAdBreakReturnFromAway();
    }
    prevIsLoadingForAdReturnRef.current = isLoading;
  }, [isLoading, applyAdBreakReturnFromAway]);

  /** Resume from background without a full reload (same policy as load finish). */
  useEffect(() => {
    if (isLoading) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        applyAdBreakReturnFromAway();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isLoading, applyAdBreakReturnFromAway]);

  useEffect(() => {
    if (isLoading) return;
    prevActiveScreenForAdBreakRef.current = activeScreen;
  }, [isLoading]);

  useEffect(() => {
    const prev = prevActiveScreenForAdBreakRef.current;
    prevActiveScreenForAdBreakRef.current = activeScreen;

    let trigger: AdBreakTriggerId | null = null;
    if (activeScreen === 'FARM' && prev === 'STORE') {
      trigger = 'leave_store';
    } else if (activeScreen === 'FARM' && prev === 'BARN') {
      trigger = 'leave_collection';
    }
    if (!trigger) return;

    // One-shot at mid-nav only — if cooldown/blockers aren't ready, miss this trigger
    // (do not retry later while idle on Farm).
    const timeoutId = window.setTimeout(() => {
      tryShowAdBreak(trigger);
    }, SCREEN_NAV_AD_BREAK_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeScreen, tryShowAdBreak]);

  useEffect(() => {
    if (isLoading || !ftue11PersistenceEnabledRef.current) return;

    const resetPlaytimeClock = () => {
      lastAdBreakPlaytimeTickRef.current = Date.now();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetPlaytimeClock();
      } else {
        lastAdBreakPlaytimeTickRef.current = null;
      }
    };

    if (document.visibilityState === 'visible') {
      resetPlaytimeClock();
    }

    const TICK_MS = 1000;

    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;

      const now = Date.now();
      const last = lastAdBreakPlaytimeTickRef.current;
      if (last == null) {
        lastAdBreakPlaytimeTickRef.current = now;
        return;
      }
      lastAdBreakPlaytimeTickRef.current = now;
      const deltaMs = Math.min(Math.max(0, now - last), 60_000);
      if (deltaMs === 0) return;

      adBreakRuntimeRef.current.activePlaytimeMs += deltaMs;
    }, TICK_MS);

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      lastAdBreakPlaytimeTickRef.current = null;
    };
  }, [isLoading, activeFtueStage]);

  /** FTUE 10: purchase button rect (measured in App like harvest/seed) so overlay uses same viewport coords */
  const [ftue10PurchaseButtonRect, setFtue10PurchaseButtonRect] = useState<FtueRect | null>(null);
  const ftue10PurchaseButtonRef = useRef<HTMLButtonElement | null>(null);
  /** FTUE: hide upgrade panel until we reveal it (set to true when ready) */
  const [ftueUpgradePanelVisible, setFtueUpgradePanelVisible] = useState(false);

  const applyLevelUpCoinReward = useCallback(
    (amount: number, startPoint?: { x: number; y: number }) => {
      if (amount <= 0) return;
      const layer = discoveryRewardFxLayerRef.current;
      if (layer && startPoint) {
        const lr = layer.getBoundingClientRect();
        setActiveDiscoveryCoinParticles((prev) => [
          ...prev,
          {
            id: `levelup-reward-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            startX: startPoint.x - lr.left,
            startY: startPoint.y - lr.top,
            value: amount,
          },
        ]);
        return;
      }
      setMoney((m) => m + amount);
    },
    [],
  );

  const applyLevelUpPopupUnlock = useCallback((level: number, rewardStartPoint?: { x: number; y: number }) => {
    const gardenId = activeGardenIdRef.current;
    const unlockInfo = getLevelUnlockInfo(level, gardenId);
    suppressLevelUpDeclineSfxRef.current = true;
    if (level === TASKS_FLOATING_BUTTON_UNLOCK_LEVEL && !tasksFtueCompleted) {
      setTasksFtueStarted(true);
      pendingTasksFtueRevealRef.current = true;
    }
    if (
      gardenId === DEFAULT_GARDEN_ID &&
      level === GARDENS_FLOATING_BUTTON_UNLOCK_LEVEL &&
      !gardensFtueCompleted
    ) {
      setGardensFtueStarted(true);
      pendingGardensFtueRevealRef.current = true;
    }
    setPlayerLevel((l) => {
      if (l < level) {
        recordDailyTaskPlayerLeveledUp();
        pendingLevelUpBackupRef.current = { gardenId, level: l + 1 };
        return l + 1;
      }
      return l;
    });
    setPlayerLevelProgress(0);
    if (unlockInfo.rewardCoins != null && unlockInfo.rewardCoins > 0) {
      applyLevelUpCoinReward(unlockInfo.rewardCoins, rewardStartPoint);
    }
    if (unlockInfo.navigateToBarnOnUnlock) {
      // Collection FTUE needs the shelf at the top; clear any remembered scroll first.
      if (!collectionFtueCompleted) {
        barnScrollYByGardenRef.current[gardenId] = 0;
        barnScrollYRef.current = 0;
        setBarnScrollY(0);
        setCollectionFtueRestartPending(false);
        setCollectionFtuePhase('intro_cta');
      }
      setActiveScreen('BARN');
      skipNextBarnPendingBounceRef.current = true;
    }
    if (unlockInfo.tab && ftueUpgradePanelVisible && !unlockInfo.navigateToBarnOnUnlock) {
      setIsExpanded(true);
      setActiveTab(unlockInfo.tab);
      if (unlockInfo.upgradeId) {
        setPendingUnlockUpgradeId(unlockInfo.upgradeId);
        setTimeout(() => setPendingUnlockUpgradeId(null), 2500);
      }
    }
  }, [
    tasksFtueCompleted,
    gardensFtueCompleted,
    collectionFtueCompleted,
    ftueUpgradePanelVisible,
    applyLevelUpCoinReward,
  ]);

  /** After React commits the new level, flush main save then store a level-up checkpoint (any garden). */
  useEffect(() => {
    const pending = pendingLevelUpBackupRef.current;
    if (!pending) return;
    if (playerLevel !== pending.level) return;
    pendingLevelUpBackupRef.current = null;
    if (!ftue11PersistenceEnabledRef.current) return;
    persistGameSnapshotRef.current();
    const v2 = loadGameSaveV2();
    if (!v2) return;
    writeLevelUpBackupSave(v2, `${pending.gardenId}@${pending.level}`);
  }, [playerLevel]);

  /** FTUE: hide seeds button during loading and welcome; reveal when FTUE_2 (seed_tap) shows. Hidden from first frame so no fade-in flash. */
  const ftueHideSeedsButton = isLoading || activeFtueStage === 'welcome';
  /** FTUE: hide harvest button during loading and welcome/seed_tap/merge_drag/first_goal (visible during first_harvest and first_harvest_multi for FTUE 5 & 8). */
  const ftueHideHarvestButton = isLoading || activeFtueStage === 'welcome' || activeFtueStage === 'seed_tap' || activeFtueStage === 'merge_drag' || activeFtueStage === 'first_goal';
  /** FTUE: hide goals area during welcome/seed_tap/merge_drag (empty during FTUE 1–3) */
  const ftueHideGoals = activeFtueStage === 'welcome' || activeFtueStage === 'seed_tap' || activeFtueStage === 'merge_drag';
  /**
   * Seeds button in "free" mode – 0% progress, badge "FREE".
   * - Stay green-free through FTUE 1–10 (including FTUE 10 close), and only switch to normal when FTUE 11 textbox shows.
   */
  const seedsFreeMode =
    (
      (activeFtueStage != null && activeFtueStage !== 'recharge_intro') ||
      ftue7Scheduled
    ) &&
    // During FTUE 10 ("first_upgrade") we still want to see normal seed progress.
    activeFtueStage !== 'first_upgrade' &&
    !ftue10ButtonsNormalEarly;
  /**
   * Harvest button free mode:
   * - Stay green-free through FTUE 5–10 (including FTUE 10 close), and only switch to normal when FTUE 11 textbox shows.
   */
  const harvestFreeMode =
    (
      (activeFtueStage != null && activeFtueStage !== 'recharge_intro') ||
      ftue7Scheduled
    ) &&
    activeFtueStage !== 'welcome' &&
    activeFtueStage !== 'seed_tap' &&
    activeFtueStage !== 'merge_drag' &&
    activeFtueStage !== 'first_goal' &&
    !ftue10ButtonsNormalEarly;
  const [pendingUnlockUpgradeId, setPendingUnlockUpgradeId] = useState<string | null>(null);
  const nextWalletBurstIdRef = useRef(0);
  const nextGoalCoinBurstIdRef = useRef(0);
  const levelUpGuardRef = useRef(false);
  /** Completes level-up after Starter Pack IAP closes (level 4 uses IAP instead of level-up popup). */
  const pendingLevelUpAfterStarterPackRef = useRef<number | null>(null);
  const walletFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goldenPotWalletFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Batch coin panel impacts (many harvests) to one setState flush per frame for FPS. */
  const pendingCoinImpactRef = useRef({ total: 0, scheduled: false });
  const walletImpactFlushRafRef = useRef<number>(0);
  const pendingMergeLevelIncreaseRef = useRef<number>(1);
  const plantButtonRef = useRef<HTMLDivElement>(null);
  const harvestButtonRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  /** Full-viewport layer for discovery reward coin VFX — same CSS space as modal popups so spawn matches getBoundingClientRect. */
  const discoveryRewardFxLayerRef = useRef<HTMLDivElement>(null);
  // Coin panel portal: compute the scaled game-container position so coin panels can render above FTUE overlays.
  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const s = appScaleRef.current || 1;
      setCoinPanelPortalRect({ left: r.left, top: r.top, width: r.width / s, height: r.height / s, scale: s });
    };
    update();
    window.addEventListener('resize', update);
    const raf = requestAnimationFrame(update);
    return () => {
      window.removeEventListener('resize', update);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Barn scroll: drag with momentum (state must exist before collection FTUE layout effect deps).
  const [barnScrollY, setBarnScrollY] = useState(0);

  useLayoutEffect(() => {
    if (activeScreen !== 'BARN' || !collectionFtuePhase || collectionFtueCompleted) {
      setCollectionFtueHoleRect(null);
      return;
    }
    if (collectionFtuePhase === 'point_bonuses' || collectionFtuePhase === 'point_garden_nav') {
      setCollectionFtueHoleRect(null);
      return;
    }
    if (collectionFtuePhase === 'wait_reveal' || collectionFtuePhase === 'shelf_plant_bounce') {
      setCollectionFtueHoleRect(null);
      return;
    }
    if (collectionFtuePhase === 'popup_free' && plantInfoPopup?.isVisible) {
      setCollectionFtueHoleRect(null);
      return;
    }
    if (collectionFtuePhase === 'intro_cta' && !collectionFtueIntroCtaOverlayReady) {
      setCollectionFtueHoleRect(null);
      return;
    }
    const container = document.getElementById('game-container');
    const scale = appScaleRef.current || 1;
    const measureEl = (id: string) => {
      const el = document.getElementById(id);
      if (!el || !container) return null;
      const cr = container.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return {
        left: (r.left - cr.left) / scale,
        top: (r.top - cr.top) / scale,
        width: r.width / scale,
        height: r.height / scale,
      };
    };
    const id =
      collectionFtuePhase === 'intro_cta'
        ? 'collection-ftue-cta'
        : collectionFtuePhase === 'point_unlock'
          ? 'collection-ftue-unlock-1'
          : null;
    const apply = () => setCollectionFtueHoleRect(id ? measureEl(id) : null);
    apply();
    const t = window.setTimeout(apply, 120);
    const onResize = () => apply();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(t);
    };
  }, [
    activeScreen,
    collectionFtuePhase,
    collectionFtueCompleted,
    plantInfoPopup?.isVisible,
    goldenPotBonusesPopupOpen,
    barnScrollY,
    collectionFtueIntroCtaOverlayReady,
  ]);

  useLayoutEffect(() => {
    const tasksFtueOverlayActive =
      tasksFtueStarted &&
      tasksFtueUnlockRevealed &&
      !tasksFtueCompleted &&
      activeScreen === 'FARM';
    if (!tasksFtueOverlayActive) {
      setTasksFtueHoleRect(null);
      return;
    }
    const container = document.getElementById('game-container');
    const scale = appScaleRef.current || 1;
    const apply = () => {
      const el = document.getElementById(TASKS_FTUE_FLOATING_BUTTON_ID);
      if (!el || !container) {
        setTasksFtueHoleRect(null);
        return;
      }
      const cr = container.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      setTasksFtueHoleRect({
        left: (r.left - cr.left) / scale,
        top: (r.top - cr.top) / scale,
        width: r.width / scale,
        height: r.height / scale,
      });
    };
    apply();
    const t = window.setTimeout(apply, 120);
    const onResize = () => apply();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(t);
    };
  }, [tasksFtueStarted, tasksFtueUnlockRevealed, tasksFtueCompleted, activeScreen]);

  useLayoutEffect(() => {
    const gardensFtueOverlayActive =
      gardensFtueStarted &&
      gardensFtueUnlockRevealed &&
      !gardensFtueCompleted &&
      activeScreen === 'FARM';
    if (!gardensFtueOverlayActive) {
      setGardensFtueHoleRect(null);
      return;
    }
    const container = document.getElementById('game-container');
    const scale = appScaleRef.current || 1;
    const apply = () => {
      const el = document.getElementById(GARDENS_FTUE_FLOATING_BUTTON_ID);
      if (!el || !container) {
        setGardensFtueHoleRect(null);
        return;
      }
      const cr = container.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      setGardensFtueHoleRect({
        left: (r.left - cr.left) / scale,
        top: (r.top - cr.top) / scale,
        width: r.width / scale,
        height: r.height / scale,
      });
    };
    apply();
    const t = window.setTimeout(apply, 120);
    const onResize = () => apply();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(t);
    };
  }, [gardensFtueStarted, gardensFtueUnlockRevealed, gardensFtueCompleted, activeScreen]);

  useEffect(() => {
    return () => {
      if (ftue11Delay1Ref.current) clearTimeout(ftue11Delay1Ref.current);
      if (ftue11Delay2Ref.current) clearTimeout(ftue11Delay2Ref.current);
      if (ftue10BigBounceTimeoutRef.current) clearTimeout(ftue10BigBounceTimeoutRef.current);
      if (ftue10PostPurchaseHoldTimeoutRef.current) clearTimeout(ftue10PostPurchaseHoldTimeoutRef.current);
      if (ftue95EnterTimeoutRef.current) clearTimeout(ftue95EnterTimeoutRef.current);
      if (sideButtonToastTimeoutRef.current) clearTimeout(sideButtonToastTimeoutRef.current);
    };
  }, []);

  // FTUE 9.5: big bounce -> show textbox -> loop bounce until confirm
  useEffect(() => {
    if (activeFtueStage !== 'recharge_pre_upgrade') {
      ftue95StartOnceRef.current = false;
      setFtue95ShowTextbox(false);
      setFtue95FadingOut(false);
      return;
    }
    if (ftue95StartOnceRef.current) return;
    ftue95StartOnceRef.current = true;

    setFtue95ShowTextbox(false);
    setFtue95FadingOut(false);

    // Enable the recharge/surplus behavior now, and move bars to 75% to demonstrate quickly.
    setFtueSeedSurplusActivated(true);
    setFtueHarvestSurplusActivated(true);
    seedProgressRef.current = 75;
    setSeedProgress(75);
    harvestProgressRef.current = 75;
    setHarvestProgress(75);
    setHarvestCharges(harvestChargesMaxRef.current);
    harvestChargesRef.current = harvestChargesMaxRef.current;

    // Swap buttons to normal + leaf burst + big bounce.
    playSfx(SFX_IDS.uiUnlockUpgrade);
    setFtue10ButtonsNormalEarly(true);
    triggerSeedButtonLeafBurst();
    triggerHarvestButtonLeafBurst();
    setFtue10BigBounceActive(true);
    if (ftue10BigBounceTimeoutRef.current) clearTimeout(ftue10BigBounceTimeoutRef.current);
    ftue10BigBounceTimeoutRef.current = setTimeout(() => setFtue10BigBounceActive(false), 500);

    if (ftue95EnterTimeoutRef.current) clearTimeout(ftue95EnterTimeoutRef.current);
    ftue95EnterTimeoutRef.current = setTimeout(() => {
      setFtue95ShowTextbox(true);
    }, 500);
  }, [activeFtueStage]);
  const farmColumnRef = useRef<HTMLDivElement>(null);
  const upgradePanelRef = useRef<HTMLDivElement>(null);
  /** Natural pixel height of garden_1 gradient sprite (fixed vertical size; width stretches). */
  const [gardenGradientHeightPx, setGardenGradientHeightPx] = useState<number | null>(null);
  const hexGridBgRef = useRef<HTMLDivElement>(null);
  const hexAreaRef = useRef<HTMLDivElement>(null);
  const seedHarvestRowRef = useRef<HTMLDivElement>(null);
  const gardenCenterBgRef = useRef<HTMLImageElement>(null);
  const gardenCenterTopBgRef = useRef<HTMLImageElement>(null);
  const gardenGrassBgRef = useRef<HTMLDivElement>(null);
  const gardenBottomBgRef = useRef<HTMLImageElement>(null);
  const gardenLeftBgRef = useRef<HTMLImageElement>(null);
  const gardenRightBgRef = useRef<HTMLImageElement>(null);
  const gardenGradientBgRef = useRef<HTMLDivElement>(null);
  /** In-flight panel open/close WAAPI animations (cancelled on retarget). */
  const panelAnimsRef = useRef<Animation[]>([]);
  const walletRef = useRef<HTMLButtonElement>(null);
  const walletIconRef = useRef<HTMLSpanElement>(null);
  const goldenPotWalletRef = useRef<HTMLButtonElement>(null);
  const goldenPotWalletIconRef = useRef<HTMLSpanElement>(null);
  const barnButtonRef = useRef<HTMLButtonElement>(null);
  const barnScrollRef = useRef<HTMLDivElement>(null);
  const barnScrollYRef = useRef(0);
  const barnScrollYByGardenRef = useRef<Partial<Record<GardenId, number>>>({});
  const barnScrollGardenIdRef = useRef<GardenId>(DEFAULT_GARDEN_ID);
  const prevActiveScreenForBarnScrollRef = useRef<ScreenType>(activeScreen);
  const barnEnterFocusTimeoutRef = useRef<number | null>(null);
  // Slots with in-flight crops that will complete the goal; exclude from routing so follow-up harvests go to next goal
  const goalsPendingCompletionRef = useRef<Set<number>>(new Set());
  /** Crop amount already flying to each goal slot (mid-air panels); subtract on impact so rapid harvest taps can't over-commit */
  const goalInFlightHarvestBySlotRef = useRef<Record<number, number>>({});
  /** Per open order: manual vs merge-sourced crops contributed (for Merge Order daily task). */
  const goalOrderHarvestSourcesRef = useRef<Record<number, { manual: number; merge: number }>>({});
  const nextRewardedAdOfferIndexRef = useRef(0);
  activeBoostsRef.current = activeBoosts;

  useEffect(() => {
    goalSlots.forEach((s, i) => {
      if (s === 'green') goalsPendingCompletionRef.current.delete(i);
      if (s !== 'green') {
        goalInFlightHarvestBySlotRef.current[i] = 0;
        delete goalOrderHarvestSourcesRef.current[i];
      }
    });
  }, [goalSlots]);

  useEffect(() => { highestPlantEverRef.current = highestPlantEver; }, [highestPlantEver]);

  const toContainerRect = useCallback((r: DOMRect): FtueRect | null => {
    const container = containerRef.current;
    const s = appScaleRef.current || 1;
    if (!container) return null;
    const cr = container.getBoundingClientRect();
    return {
      left: (r.left - cr.left) / s,
      top: (r.top - cr.top) / s,
      width: r.width / s,
      height: r.height / s,
    };
  }, []);

  // FTUE_2: keep seed button rect for overlay hole + finger + text position
  const updateSeedButtonRect = useCallback(() => {
    const btn = plantButtonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setSeedButtonRect(toContainerRect(r));
  }, [toContainerRect]);
  useEffect(() => {
    if (activeFtueStage !== 'seed_tap' && !ftue2FadingOut && activeFtueStage !== 'first_more_orders' && !ftue7FadingOut) return;
    updateSeedButtonRect();
    window.addEventListener('resize', updateSeedButtonRect);
    const raf = requestAnimationFrame(updateSeedButtonRect);
    return () => {
      window.removeEventListener('resize', updateSeedButtonRect);
      cancelAnimationFrame(raf);
    };
  }, [activeFtueStage, ftue2FadingOut, ftue7FadingOut, updateSeedButtonRect]);

  // FTUE 6: fade in player level section when collect-coins step shows
  useEffect(() => {
    if (activeFtueStage === 'first_goal_collect') setFtuePlayerLevelVisible(true);
  }, [activeFtueStage]);

  // FTUE 7: 700ms after FTUE 6 collect, put both goals in position then reveal (500ms apart), then 0.5s later show textbox/finger
  useEffect(() => {
    if (!ftue7Scheduled) return;
    const t1 = setTimeout(() => {
      ftue7SkipLoadingSlot0Ref.current = false;
      playSfx(SFX_IDS.goalSpawnNormal);
      setGoalSlots((s) => { const n = [...s]; n[0] = 'green'; n[1] = 'green'; return n; });
      setGoalPlantTypes((p) => { const n = [...p]; n[0] = 1; n[1] = 2; return n; });
      recordSpawnedGoalPlantLevel(1, lastSpawnedGoalLevelsRef, lastSpawnedGoalPlantLevelHUDRef);
      recordSpawnedGoalPlantLevel(2, lastSpawnedGoalLevelsRef, lastSpawnedGoalPlantLevelHUDRef);
      setDiscoveryGoalLightGreenDismissed((p) => { const n = [...p]; n[0] = false; n[1] = false; return n; });
      setGoalDiscoveryLightGreenActive((p) => { const n = [...p]; n[0] = false; n[1] = false; return n; });
      setGoalCounts((c) => { const n = [...c]; n[0] = 5; n[1] = 3; return n; });
      setGoalAmountsRequired((a) => { const n = [...a]; n[0] = 5; n[1] = 3; return n; });
      setGoalDisplayOrder([0, 1]);
      setFtue7UnrevealedSlots([0, 1]);
      setFtue7RevealMode(true);
      setGoalSlotFadeInSlot(0);
      setGoalBounceSlots((prev) => (prev.includes(0) ? prev : [...prev, 0]));
      setGoalSpawnBounceSlots((prev) => (prev.includes(0) ? prev : [...prev, 0]));
    }, 700);
    const t2 = setTimeout(() => {
      setGoalBounceSlots((prev) => prev.filter((s) => s !== 0));
      setGoalSpawnBounceSlots((prev) => prev.filter((s) => s !== 0));
      setGoalSlotFadeInSlot(1);
      setFtue7UnrevealedSlots((prev) => prev.filter((s) => s !== 0));
      playSfx(SFX_IDS.goalSpawnNormal);
      setGoalBounceSlots((prev) => (prev.includes(1) ? prev : [...prev, 1]));
      setGoalSpawnBounceSlots((prev) => (prev.includes(1) ? prev : [...prev, 1]));
    }, 1200);
    const t3 = setTimeout(() => {
      setGoalBounceSlots((prev) => prev.filter((s) => s !== 1));
      setGoalSpawnBounceSlots((prev) => prev.filter((s) => s !== 1));
      setGoalSlotFadeInSlot(null);
      setFtue7UnrevealedSlots([]);
      setFtue7RevealMode(false);
    }, 1700);
    const t4 = setTimeout(() => {
      setActiveFtueStage('first_more_orders');
      setFtue7Scheduled(false);
    }, 1700); // 0.5s after goal 2 (goal 2 at 1.2s, textbox at 1.7s)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [ftue7Scheduled]);

  // FTUE_5: keep harvest button rect for overlay hole + finger + text
  const updateHarvestButtonRect = useCallback(() => {
    const btn = harvestButtonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setHarvestButtonRect(toContainerRect(r));
  }, [toContainerRect]);
  // Measure harvest button before paint whenever it is visible in the FTUE chain so FTUE 8 has a rect the same frame it mounts.
  useLayoutEffect(() => {
    if (
      activeFtueStage !== 'first_harvest' &&
      activeFtueStage !== 'first_goal_collect' &&
      activeFtueStage !== 'first_more_orders' &&
      activeFtueStage !== 'first_harvest_multi' &&
      activeFtueStage !== 'first_upgrade' &&
      activeFtueStage !== 'recharge_pre_upgrade' &&
      activeFtueStage !== 'recharge_intro'
    ) {
      return;
    }
    updateHarvestButtonRect();
    window.addEventListener('resize', updateHarvestButtonRect);
    const raf = requestAnimationFrame(updateHarvestButtonRect);
    return () => {
      window.removeEventListener('resize', updateHarvestButtonRect);
      cancelAnimationFrame(raf);
    };
  }, [activeFtueStage, updateHarvestButtonRect]);

  // FTUE_10: measure purchase button in App (same as harvest/seed) so overlay finger uses correct viewport coords
  const updateFtue10PurchaseButtonRect = useCallback(() => {
    const btn = ftue10PurchaseButtonRef.current;
    if (!btn) {
      setFtue10PurchaseButtonRect(null);
      return;
    }
    const r = btn.getBoundingClientRect();
    setFtue10PurchaseButtonRect(toContainerRect(r));
  }, [toContainerRect]);
  useEffect(() => {
    if (ftue10Phase !== 'finger') {
      setFtue10PurchaseButtonRect(null);
      return;
    }
    updateFtue10PurchaseButtonRect();
    // Garden tab slides over 700ms — only trust rects after the transition settles.
    const t0 = setTimeout(updateFtue10PurchaseButtonRect, 0);
    const t1 = setTimeout(updateFtue10PurchaseButtonRect, 720);
    const t2 = setTimeout(updateFtue10PurchaseButtonRect, 860);
    const t3 = setTimeout(updateFtue10PurchaseButtonRect, 940);
    window.addEventListener('resize', updateFtue10PurchaseButtonRect);
    const raf = requestAnimationFrame(updateFtue10PurchaseButtonRect);
    let ro: ResizeObserver | null = null;
    const tObserve = setTimeout(() => {
      const btn =
        ftue10PurchaseButtonRef.current ??
        document.getElementById('ftue10-purchase-harvest_speed');
      if (!btn) return;
      ro = new ResizeObserver(updateFtue10PurchaseButtonRect);
      ro.observe(btn);
    }, 0);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tObserve);
      window.removeEventListener('resize', updateFtue10PurchaseButtonRect);
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [ftue10Phase, updateFtue10PurchaseButtonRect]);

  // FTUE: keep seeds and harvest progress bars at 0% (reset refs + state) during early FTUEs.
  // After FTUE 10 purchase (ftue10FadingOut) and during FTUE 11 (recharge_intro), allow normal recharge timers to run.
  useEffect(() => {
    const isFtue10PostPurchaseFade = activeFtueStage === 'first_upgrade' && ftue10FadingOut;
    if (
      (
        activeFtueStage != null &&
        activeFtueStage !== 'recharge_pre_upgrade' &&
        activeFtueStage !== 'first_upgrade' &&
        activeFtueStage !== 'recharge_intro' &&
        !isFtue10PostPurchaseFade
      ) ||
      ftue7Scheduled
    ) {
      seedProgressRef.current = 0;
      setSeedProgress(0);
    }
    if (activeFtueStage === 'first_harvest' || activeFtueStage === 'first_goal_collect' || activeFtueStage === 'first_more_orders' || activeFtueStage === 'first_harvest_multi' || ftue7Scheduled) {
      harvestProgressRef.current = 0;
      setHarvestProgress(0);
    }
  }, [activeFtueStage, ftue7Scheduled, ftue10FadingOut]);

  // FTUE 8: when both goals (slot 0 and 1) are completed, start FTUE 9 immediately (block collect) and fade out FTUE 8 overlay
  useEffect(() => {
    if (activeFtueStage !== 'first_harvest_multi') return;
    if (goalSlots[0] === 'completed' && goalSlots[1] === 'completed') {
      setActiveFtueStage('first_collect_both'); // FTUE 9 blocks taps immediately so player can't collect before overlay shows
      setFtue8FadingOut(true);
    }
  }, [activeFtueStage, goalSlots]);

  // FTUE 9: block new goal loading while active or fading out (collect 1 → 1 goal left, no loading)
  useEffect(() => {
    ftue9NoNewGoalsRef.current = activeFtueStage === 'first_collect_both' || ftue9FadingOut;
  }, [activeFtueStage, ftue9FadingOut]);

  const prevSeedLevelRef = useRef(0);

  // Track viewport dimensions for responsive scaling
  // Use visualViewport when available (more accurate on mobile when browser chrome shows/hides)
  const getViewportSize = () => {
    if (typeof window === 'undefined') return { width: 420, height: 800, offsetTop: 0 };
    const vv = window.visualViewport;
    if (vv) {
      // Use the smaller of visualViewport and innerWidth for width - ensures we never overflow on devices where they differ
      const width = Math.min(vv.width, window.innerWidth);
      return { width, height: vv.height, offsetTop: vv.offsetTop ?? 0 };
    }
    return { width: window.innerWidth, height: window.innerHeight, offsetTop: 0 };
  };
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? getViewportSize().width : 420);
  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' ? getViewportSize().height : 800);
  const [viewportOffsetTop, setViewportOffsetTop] = useState(typeof window !== 'undefined' ? getViewportSize().offsetTop : 0);
  const viewportWrapperRef = useRef<HTMLDivElement | null>(null);
  const safeInsetProbeRef = useRef<HTMLDivElement | null>(null);
  const [safeTopInsetScreen, setSafeTopInsetScreen] = useState(0);

  useEffect(() => {
    const update = () => {
      const { width, height, offsetTop } = getViewportSize();
      setViewportWidth(width);
      setViewportHeight(height);
      setViewportOffsetTop(offsetTop);
      // Prevent scroll accumulation causing apparent vertical drift while resizing.
      if (viewportWrapperRef.current) viewportWrapperRef.current.scrollTop = 0;
    };
    update();
    window.addEventListener('resize', update);
    const vv = window.visualViewport;
    if (vv) vv.addEventListener('resize', update);
    if (vv) vv.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      }
    };
  }, []);

  // Measure notch / status-bar inset (CSS env + mobile visualViewport offset) in screen px.
  useLayoutEffect(() => {
    const measure = () => {
      const probe = safeInsetProbeRef.current;
      if (!probe) return;
      setSafeTopInsetScreen(parseFloat(getComputedStyle(probe).paddingTop) || 0);
    };
    measure();
    window.addEventListener('resize', measure);
    const vv = window.visualViewport;
    if (vv) vv.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      if (vv) vv.removeEventListener('resize', measure);
    };
  }, [viewportWidth, viewportHeight, viewportOffsetTop]);

  // Upgrade-panel offer expiry uses wall clock (runs while app is closed / unfocused).
  const protectedOfferId = limitedOfferPopup?.isVisible ? (limitedOfferPopup?.offerId ?? null) : null;
  useEffect(() => {
    const tickExpiry = () => {
      const now = Date.now();
      setRewardedOffers((prev) => {
        const pruned = pruneExpiredRewardedOffers(prev, now, protectedOfferId);
        if (pruned.length === 0) return prev.length === 0 ? prev : pruned;
        // Re-render each tick so the wall-clock countdown label updates.
        return pruned;
      });
    };

    if (rewardedOffers.length === 0) return;

    tickExpiry();
    const interval = setInterval(() => {
      if (showFakeAdRef.current) return;
      tickExpiry();
    }, 1000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') tickExpiry();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', tickExpiry);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', tickExpiry);
    };
  }, [rewardedOffers.length > 0, protectedOfferId]);

  useEffect(() => {
    const open = offlineEarningsUi?.open === true;
    offlineEarningsOpenRef.current = open;
    if (open && !prevOfflineEarningsOpenRef.current) {
      offlineEarningsAutoCollectedRef.current = false;
      playSfx(SFX_IDS.popupNormal);
    }
    if (prevOfflineEarningsOpenRef.current && !open) {
      lastOfflineEarningsClosedAtRef.current = Date.now();
      // Re-apply return policy so new-session cooldown starts after welcome-back, not during splash.
      applyAdBreakReturnFromAway();
    }
    prevOfflineEarningsOpenRef.current = open;
  }, [offlineEarningsUi?.open, applyAdBreakReturnFromAway]);

  /** Dismiss limited offer if offline earnings takes priority (no double popup). */
  useEffect(() => {
    if (!offlineEarningsUi?.open) return;
    setLimitedOfferPopup((prev) => {
      if (!prev?.isVisible) return prev;
      const now = Date.now();
      lastLimitedOfferClosedAtRef.current = now;
      lastLimitedOfferShownAtRef.current = now;
      return null;
    });
  }, [offlineEarningsUi?.open]);

  const completePremiumStorePurchase = useCallback((offerId: string) => {
    if (!isStoreIapEnabled(offerId)) return;
    playSfx(SFX_IDS.uiConfirmReward);
    const config =
      STORE_COIN_OFFERS.find((c) => c.id === offerId) ??
      STORE_BUNDLE_OFFERS.find((c) => c.id === offerId);
    if (!config) return;
    if (offerId === STORE_IAP_OFFER_STARTER_PACK_ID) {
      markStarterPackPurchased();
      setStarterPackPurchased(true);
    }
    if (offerId === STORE_IAP_OFFER_FIELD_PACK_ID) {
      markFieldPackPurchased();
      setFieldPackPurchased(true);
    }
    pendingPurchaseBoostsRef.current = getStorePurchaseBoostGrants(config);
    setPurchaseSuccessfulUi({
      headerImageSrc: assetPath(config.headerIcon),
      rewards: buildPurchaseSuccessRewards(config),
    });
  }, []);

  useEffect(() => {
    if (activeFtueStage !== null) return;
    if (activeGardenId !== DEFAULT_GARDEN_ID) {
      setFarmFloatingButtonsVisible(true);
      return;
    }
    if (levelUpPopup?.isVisible && levelUpPopup.level >= FLOATING_BUTTONS_UNLOCK_LEVEL) {
      setFarmFloatingButtonsVisible(true);
    }
  }, [activeFtueStage, activeGardenId, levelUpPopup]);

  useEffect(() => {
    if (!farmFloatingButtonsVisible) {
      setFarmFloatingButtonsFadedIn(false);
      return;
    }
    const id = requestAnimationFrame(() => setFarmFloatingButtonsFadedIn(true));
    return () => cancelAnimationFrame(id);
  }, [farmFloatingButtonsVisible]);

  const showLevelUpForNextLevel = useCallback((nextLevel: number) => {
    if (nextLevel === STARTER_PACK_FORCE_POPUP_LEVEL) {
      const useStarter =
        activeGardenIdRef.current === DEFAULT_GARDEN_ID &&
        isStoreIapEnabled(STORE_IAP_OFFER_STARTER_PACK_ID);
      const useField =
        activeGardenIdRef.current !== DEFAULT_GARDEN_ID &&
        isStoreIapEnabled(STORE_IAP_OFFER_FIELD_PACK_ID);
      if (useStarter || useField) {
        if (useStarter) {
          markStarterPackUnlocked();
          setStarterPackUnlocked(true);
          pendingLevelUpAfterStarterPackRef.current = nextLevel;
          setIapOfferUi({ offerId: STORE_IAP_OFFER_STARTER_PACK_ID });
        } else {
          markFieldPackUnlocked();
          setFieldPackUnlocked(true);
          pendingLevelUpAfterStarterPackRef.current = nextLevel;
          setIapOfferUi({ offerId: STORE_IAP_OFFER_FIELD_PACK_ID });
        }
        return;
      }
    }
    presentLevelUpPopupRef.current(nextLevel);
  }, [recordDailyTaskPlayerLeveledUp]);

  const canOpenLimitedOfferRewardPopup = useCallback(() => {
    if (offlineEarningsUi?.open) return false;
    const t = lastOfflineEarningsClosedAtRef.current;
    if (t > 0 && Date.now() - t < 10000) return false;
    return true;
  }, [offlineEarningsUi?.open]);

  /** Auto Rate Us (post Daily Tasks FTUE, soft-dismiss retries). Never overlaps other popups. */
  const tryOpenRateUsAuto = useCallback((options?: { forceFirstShow?: boolean }) => {
    if (options?.forceFirstShow) {
      if (!canEverShowRateUs()) return false;
    } else if (!canAutoShowRateUsPrompt()) {
      return false;
    } else if (blockingPopupOpenForLimitedOfferRef.current) {
      return false;
    }
    if (showFakeAdRef.current) return false;
    // Don't ask for a rating right after an ad — feels punitive.
    const now = Date.now();
    const RATE_US_POST_AD_COOLDOWN_MS = 60_000;
    if (
      lastFakeAdClosedAtRef.current > 0 &&
      now - lastFakeAdClosedAtRef.current < RATE_US_POST_AD_COOLDOWN_MS
    ) {
      return false;
    }
    if (
      adBreakRuntimeRef.current.lastRewardedAdAt > 0 &&
      now - adBreakRuntimeRef.current.lastRewardedAdAt < RATE_US_POST_AD_COOLDOWN_MS
    ) {
      return false;
    }
    if (
      adBreakRuntimeRef.current.lastAdBreakAt > 0 &&
      now - adBreakRuntimeRef.current.lastAdBreakAt < RATE_US_POST_AD_COOLDOWN_MS
    ) {
      return false;
    }
    if (!options?.forceFirstShow && dailyTasksPopupOpenRef.current) return false;
    if (rateUsPopupOpen || rateUsThankYouOpen) return false;
    if (activeScreen !== 'FARM') return false;
    if (activeFtueStage != null) return false;
    setRateUsPopupOpen(true);
    return true;
  }, [
    rateUsPopupOpen,
    rateUsThankYouOpen,
    activeScreen,
    activeFtueStage,
  ]);

  /** After intro cycle: yellow upgrade-row hint only (open panel, scroll, flash) — no interrupt popup. */
  const notifyLimitedOfferSoft = useCallback(
    (offerId: string) => {
      const offerConfig = getOfferById(offerId);
      if (!offerConfig || isStorePremiumOnlyOfferId(offerId)) return;
      const now = Date.now();
      setRewardedOffers((prev) => {
        const active = pruneExpiredRewardedOffers(prev, now);
        if (hasActiveRewardedOfferInPanel(active, now)) return active;
        if (active.some((o) => o.id === offerId)) return active;
        return [createRewardedOfferPanelEntry(offerConfig, now)];
      });
      if (ftueUpgradePanelVisible) {
        setIsExpanded(true);
        setActiveTab(offerConfig.upgradeTab);
        setPendingOfferHighlightId(offerId);
      }
      window.setTimeout(() => setPendingOfferHighlightId(null), 2500);
    },
    [ftueUpgradePanelVisible],
  );

  // Keep a live “any popup open?” flag for the limited-offer auto poll (avoids stale interval closures).
  const farmOverlayBlocksAmbientVfx =
    !!limitedOfferPopup?.isVisible ||
    !!levelUpPopup?.isVisible ||
    gardenLevelPopupOpen ||
    !!discoveryPopup?.isVisible ||
    goldenPotBonusesPopupOpen ||
    !!purchaseSuccessfulUi ||
    !!iapOfferUi ||
    !!plantInfoPopup?.isVisible ||
    rateUsPopupOpen ||
    rateUsThankYouOpen ||
    corruptSavePopupOpen ||
    dailyTasksPopupOpen ||
    lockedDailyTasksPopupOpen ||
    lockedGardenPickerPopupOpen ||
    gardenPickerOpen ||
    pauseMenuOpen ||
    devToolsOpen ||
    !!offlineEarningsUi?.open ||
    showFakeAd;

  useEffect(() => {
    const blocking = farmOverlayBlocksAmbientVfx || showFakeAdRef.current;

    if (prevBlockingPopupForLimitedOfferRef.current && !blocking) {
      lastOtherPopupClosedAtRef.current = Date.now();
    }
    prevBlockingPopupForLimitedOfferRef.current = blocking;
    blockingPopupOpenForLimitedOfferRef.current = blocking;
  }, [
    farmOverlayBlocksAmbientVfx,
    showFakeAd,
    rewardedAdFadeInActive,
    rewardedAdBlackHoldActive,
    rewardedAdFadeOutActive,
    adBreakIntroActive,
    interstitialAdSlotActive,
    rewardedAdSlotActive,
  ]);

  // Auto-trigger limited offers: intro cycle shows each unique popup once, then soft-only upgrade hints.
  useEffect(() => {
    if (playerLevel < 2 || LIMITED_OFFERS.length === 0) return;
    if (!farmFloatingButtonsVisible || activeFtueStage !== null) return;
    if (!limitedOfferCooldownInitializedRef.current) {
      limitedOfferCooldownInitializedRef.current = true;
      lastLimitedOfferShownAtRef.current = Date.now();
    }

    const interval = setInterval(() => {
      syncLimitedOfferIntroCyclePersistedState();
      const introCycleComplete = isLimitedOfferIntroCycleComplete();
      const autoPopupPool = getLimitedOfferAutoPopupPool();
      if (blockingPopupOpenForLimitedOfferRef.current) return;
      if (showFakeAdRef.current) return;
      if (activeScreen !== 'FARM') return;
      if (lastOfflineEarningsClosedAtRef.current > 0 && Date.now() - lastOfflineEarningsClosedAtRef.current < getRemoteConfig().ads.specialOffer.quietAfterCloseMs) return;
      const now = Date.now();
      const quietMs = getRemoteConfig().ads.specialOffer.quietAfterCloseMs;
      if (lastLimitedOfferClosedAtRef.current && now - lastLimitedOfferClosedAtRef.current < quietMs) return;
      if (lastFakeAdClosedAtRef.current && now - lastFakeAdClosedAtRef.current < quietMs) return;
      if (lastOtherPopupClosedAtRef.current && now - lastOtherPopupClosedAtRef.current < quietMs) return;
      const elapsed = now - lastLimitedOfferShownAtRef.current;
      if (elapsed < getRemoteConfig().ads.specialOffer.minGapMs) return;
      const unlockedCount = grid.filter((c) => !c.locked).length;
      const filledCount = grid.filter((c) => !c.locked && c.item != null).length;
      const gardenFillPercent = unlockedCount > 0 ? filledCount / unlockedCount : 0;
      const lastId = lastShownOfferIdRef.current;
      const lastTab = lastShownOfferTabRef.current;
      const hasGoalAvailable = goalSlots.some((s) => s === 'green' || s === 'loading');

      const matchesTrigger = (o: (typeof LIMITED_OFFERS)[0]) => {
        if (o.trigger === 'garden_fill_max_50') return gardenFillPercent <= 0.5;
        if (o.trigger === 'wallet_empty') return money === 0;
        if (o.trigger === 'anytime') return true;
        if (o.trigger === 'order_speed_not_maxed') return !isCustomerSpeedMaxed(harvestState, goldenPotCount);
        if (o.trigger === 'has_goal_available') return hasGoalAvailable;
        return false;
      };

      const pickFrom = (list: typeof autoPopupPool) => {
        if (list.length === 0) return null;
        const differentTab = list.filter((o) => o.upgradeTab !== lastTab);
        const pool = differentTab.length > 0 ? differentTab : list;
        return pool[Math.floor(Math.random() * pool.length)];
      };

      let offerToShow: (typeof autoPopupPool)[0] | null = null;

      if (!introCycleComplete) {
        // Intro: show every current auto-popup offer once (no trigger gate).
        offerToShow = getNextLimitedOfferIntroPopup();
      } else {
        const eligible = autoPopupPool.filter(
          (o) => matchesTrigger(o) && o.id !== lastId,
        );
        if (eligible.length > 0) {
          offerToShow = pickFrom(eligible);
        } else if (elapsed >= getRemoteConfig().ads.specialOffer.anytimeFallbackMs) {
          const other = autoPopupPool.filter(
            (o) => matchesTrigger(o) && o.id !== lastId,
          );
          offerToShow = pickFrom(other);
        }
      }

      if (!offerToShow) return;

      if (introCycleComplete && hasActiveRewardedOfferInPanel(rewardedOffersRef.current, now)) {
        return;
      }

      // Re-check immediately before opening — a popup may have opened since the poll started.
      if (blockingPopupOpenForLimitedOfferRef.current || showFakeAdRef.current) return;

      lastShownOfferIdRef.current = offerToShow.id;
      lastShownOfferTabRef.current = offerToShow.upgradeTab;
      lastLimitedOfferShownAtRef.current = now;

      if (!introCycleComplete) {
        const state = buildLimitedOfferPopupState(offerToShow.id, { highestPlantEver });
        if (state) {
          markLimitedOfferIntroPopupSeen(offerToShow.id);
          setLimitedOfferPopup(state);
        }
      } else {
        notifyLimitedOfferSoft(offerToShow.id);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [
    playerLevel,
    grid,
    money,
    goalSlots,
    harvestState,
    highestPlantEver,
    activeScreen,
    goldenPotCount,
    farmFloatingButtonsVisible,
    activeFtueStage,
    notifyLimitedOfferSoft,
  ]);

  // Derive which tabs have offers (for tab notification coloring)
  const tabsWithOffers = new Set(rewardedOffers.map(o => o.tab));
  
  // Adaptive scale: grow canvas on the axis that would letterbox (width on iPad, height on phones).
  const baseWidth = 448;
  const baseHeight = 796;
  const mobileBreakpoint = 500;
  const safeTop = viewportWidth < mobileBreakpoint ? viewportOffsetTop : 0;
  // Full viewport height — backgrounds bleed under the notch; UI inset is applied inside the canvas.
  const availableHeight = viewportHeight;
  const scaleX = viewportWidth / baseWidth;
  const scaleY = availableHeight / baseHeight;
  const isWideViewport = scaleX > scaleY;
  const appScale = isWideViewport ? scaleY : scaleX;
  const designWidth = isWideViewport ? viewportWidth / appScale : baseWidth;
  const designHeight = isWideViewport ? baseHeight : availableHeight / appScale;
  /** Open height = 25% of design canvas (clamped). Close travel derived in updateGardenBgLayout. */
  const upgradePanelExpandedPx = getUpgradePanelExpandedHeightPx(designHeight);
  upgradePanelExpandedHeightRef.current = upgradePanelExpandedPx;
  const effectiveSafeTopInsetScreen = fakeNotchPreviewEnabled
    ? FAKE_SAFE_AREA_TOP_PX
    : safeTopInsetScreen;
  const safeTopInsetDesign = effectiveSafeTopInsetScreen / appScale;
  const farmFloatingButtonStackTopPx = getFloatingButtonStackTopPx(safeTopInsetDesign);
  const appScaleRef = useRef(appScale);
  appScaleRef.current = appScale;
  const goalsTrackWidthPx = designWidth - GOALS_AREA_LEFT_MARGIN_PX;
  const coinGoalPinnedRight = goalsTrackWidthPx >= COIN_GOAL_PIN_RIGHT_MIN_TRACK_PX;
  const isCollectionPhoneLayout = viewportWidth < mobileBreakpoint;
  const collectionPlantPanelTopPx = isCollectionPhoneLayout
    ? COLLECTION_PHONE_PLANT_PANEL_TOP_PX
    : COLLECTION_PLANT_PANEL_TOP_PX;
  const collectionShelvesMarginTopPx = isCollectionPhoneLayout
    ? COLLECTION_PHONE_SHELVES_MARGIN_TOP_PX
    : COLLECTION_SHELVES_MARGIN_TOP_PX;
  const collectionRoofVisualWidthPx =
    COLLECTION_ROOF_WIDTH_PX * (isCollectionPhoneLayout ? COLLECTION_PHONE_ROOF_SCALE : 1);
  const collectionRoofLayoutWidthPx = isCollectionPhoneLayout
    ? COLLECTION_ROOF_WIDTH_PX * COLLECTION_PHONE_ROOF_LAYOUT_SCALE
    : collectionRoofVisualWidthPx;
  const collectionRoofLayoutHeightPx =
    collectionRoofLayoutWidthPx * COLLECTION_ROOF_ASPECT_HEIGHT;
  // Collection is inside the design column (448px on phones), which appScale already fits to the device.
  // On narrow viewports, scale barn content to fill that column — not viewportWidth (that double-shrinks).
  const barnScale =
    viewportWidth >= mobileBreakpoint
      ? 1
      : Math.min(
          1,
          (designWidth / COLLECTION_BARN_LAYOUT_WIDTH_PX) * COLLECTION_PHONE_SHELF_WIDTH_SCALE,
        );

  const plantInfoPopupGardenSnap = useMemo(() => {
    if (!plantInfoPopup) return null;
    return getGardenCollectionSnapshot(
      plantInfoPopup.gardenId,
      activeGardenId,
      activeCollectionSnapshot,
      collectionV2Gardens,
    );
  }, [plantInfoPopup, activeGardenId, activeCollectionSnapshot, collectionV2Gardens]);

  /** Barn Plant Collection header wallet: golden pots toward collection rewards. */
  const displayNumeratorPotCount = collectionBarHeldNumeratorCount ?? globalBonusPotCount;
  const isPlantCollectionUiUnlocked = isPlantCollectionUiUnlockedForGarden(playerLevel);
  /** Panel crest/divider/copy/button look unlocked (shelves use `isPlantCollectionUiUnlocked` separately). */
  const collectionPanelChromeUnlocked =
    isPlantCollectionUiUnlocked &&
    (collectionFtuePhase !== 'intro_cta' || collectionFtuePanelChromeUnlocked);
  const collectionPanelTitle = getCollectionPanelTitle(activeGardenId);
  const goldenPotWalletHeaderProps =
    activeScreen === 'BARN' && isPlantCollectionUiUnlocked
    ? {
        count: displayNumeratorPotCount,
        totalCount: COLLECTION_PLANT_COUNT,
        walletRef: goldenPotWalletRef,
        walletIconRef: goldenPotWalletIconRef,
        flashActive: goldenPotWalletFlashActive,
        burstCount: goldenPotWalletBounceTrigger,
      }
    : undefined;

  const openCollectionBonusesFromFtue = useCallback(() => {
    if (collectionFtueBonusesFading) return;
    playSfx(SFX_IDS.uiConfirmNormal);
    setCollectionFtueBonusesFading(true);
    setCollectionFtueBonusesReached(true);
    setCollectionFtueRestartPending(false);
    // Opening bonuses ends forced collection FTUE — player can freely explore after this.
    setCollectionFtuePhase(null);
    setCollectionFtueCompleted(true);
    const tierPotCount = getGoldenPotBonusTierPotCountForShelf(0);
    setGoldenPotBonusRevealTier(null);
    setGoldenPotBonusScrollTierPotCount(tierPotCount);
    setGoldenPotBonusesPopupOpen(true);
    window.setTimeout(() => setCollectionFtueBonusesFading(false), 220);
  }, [collectionFtueBonusesFading, playSfx]);

  const renderCollectionShelf = useCallback(
    (shelfIndex: number) => {
      const shelfInGarden = shelfIndex % BARN_SHELVES_PER_GARDEN;
      const { gardenId: shelfGardenId, startPlant } = getCollectionShelfMeta(shelfIndex);
      const gardenSnap = getGardenCollectionSnapshot(
        shelfGardenId,
        activeGardenId,
        activeCollectionSnapshot,
        collectionV2Gardens,
      );
      const shelfRewardBar = getShelfRewardBarStateForSnapshot(shelfIndex, gardenSnap);
      const shelfFullyDiscovered = isShelfFullyDiscovered(gardenSnap, shelfIndex);
      const shelfFullyMastered = isShelfFullyMastered(gardenSnap, shelfIndex);
      const isActiveUpgradeShelf = isShelfActiveUpgradeTarget(gardenSnap, shelfIndex, shelfGardenId);
      const shelfProgressLeftIconSrc = shelfFullyMastered
        ? getCollectionShelfGoldenPotCompleteIconPath()
        : isActiveUpgradeShelf
          ? getCollectionShelfGoldenPotIconPath()
          : getCollectionShelfLockedIconPath();
      const shelfUsesLockedLeftIcon =
        shelfFullyDiscovered && !shelfFullyMastered && !isActiveUpgradeShelf;
      const shelfRewardBarLocked = isShelfRewardBarLocked(gardenSnap, shelfIndex, shelfGardenId);
      const shelfProgressBarInteractive = !shelfRewardBarLocked;
      const showUpgradeUi =
        isPlantCollectionUiUnlocked &&
        shouldShowShelfUpgradeUi(shelfIndex, shelfInGarden, shelfGardenId, gardenSnap, {
          bonusPopupOpen: goldenPotBonusesPopupOpen,
          bonusRevealShelfIndex: goldenPotBonusRevealShelfIndex,
        });
      const nextUpgradeLevel = showUpgradeUi
        ? getNextUpgradeablePlantOnShelf(gardenSnap, shelfIndex)
        : null;
      const showDiscoverMorePlantsCta = showUpgradeUi && nextUpgradeLevel == null;
      const upgradeCost = nextUpgradeLevel != null ? getPlantMasteryUnlockCost(nextUpgradeLevel) : 0;
      const canAffordUpgrade = nextUpgradeLevel != null && gardenSnap.money >= upgradeCost;
      const ftueUpgradeWaitingForIntroCta =
        (collectionFtuePhase === 'intro_cta' ||
          (collectionFtuePhase === 'shelf_plant_bounce' && !collectionFtueFreeButtonGreen)) &&
        !collectionFtueCompleted &&
        shelfGardenId === DEFAULT_GARDEN_ID &&
        nextUpgradeLevel === 1;
      const ftueFreeButtonTarget =
        shelfGardenId === DEFAULT_GARDEN_ID &&
        nextUpgradeLevel === 1 &&
        (collectionFtuePhase === 'point_unlock' ||
          (collectionFtuePhase === 'shelf_plant_bounce' && collectionFtueFreeButtonGreen));
      const ftueFreeRevealBounce =
        shelfGardenId === DEFAULT_GARDEN_ID &&
        nextUpgradeLevel === 1 &&
        collectionFtueFreeButtonBouncing;
      const openShelfPlantInfo = (plantLevel: number) => {
        playSfx(SFX_IDS.uiConfirmNormal);
        setPlantInfoPopup({ isVisible: true, level: plantLevel, gardenId: shelfGardenId });
      };
      return (
        <div
          key={`${shelfGardenId}-${shelfIndex}`}
          className="flex-shrink-0 relative"
          style={{
            marginTop: shelfInGarden === 0 ? 0 : COLLECTION_SHELF_STACK_MARGIN_TOP_PX,
            width: '490px',
          }}
        >
          <img
            src={assetPath('/assets/collection/collection_shelf.png')}
            alt={`Shelf ${shelfIndex + 1}`}
            className="pointer-events-none"
            style={{ width: '100%', height: 'auto' }}
          />
          {showUpgradeUi && (
            <img
              src={assetPath('/assets/collection/collection_shelf_upgrade.png')}
              alt=""
              className="absolute left-1/2 pointer-events-none"
              style={{
                top: COLLECTION_SHELF_UPGRADE_SPRITE_TOP_PX,
                width: '100%',
                height: 'auto',
                transform: `translateX(-50%) scale(${COLLECTION_SHELF_UPGRADE_SPRITE_SCALE})`,
                transformOrigin: 'center top',
                zIndex: 5,
              }}
            />
          )}
          {showUpgradeUi && (
            <BarnShelfUpgradeButton
              gardenId={shelfGardenId}
              coinCost={upgradeCost}
              canAfford={canAffordUpgrade && !ftueUpgradeWaitingForIntroCta}
              ftueUnlockTarget={ftueFreeButtonTarget}
              ftueRevealBounce={ftueFreeRevealBounce}
              discoverMorePlants={showDiscoverMorePlantsCta}
              leafBurst={
                shelfGardenId === DEFAULT_GARDEN_ID && nextUpgradeLevel === 1
                  ? collectionFtueFreeButtonLeafBurst
                  : null
              }
              onLeafBurstComplete={() => setCollectionFtueFreeButtonLeafBurst(null)}
              buttonRootRef={
                shelfGardenId === DEFAULT_GARDEN_ID && nextUpgradeLevel === 1
                  ? collectionFtueFreeButtonRef
                  : undefined
              }
              onClick={(e) => handleShelfUpgradeClick(shelfIndex, shelfGardenId, e)}
            />
          )}
          {isPlantCollectionUiUnlocked && (
            <div
              className="absolute flex justify-center items-center"
              style={{
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: '125px',
                gap: '-10px',
                zIndex: 10,
                minHeight: '95px',
                width: '100%',
                isolation: 'isolate',
              }}
            >
              {[0, 1, 2, 3].map((plantOffset) => {
                const plantLevel = startPlant + plantOffset;
                const isPlantDiscovered = plantLevel <= gardenSnap.highestPlantEver;
                const isGarden1FtuePlant =
                  shelfGardenId === DEFAULT_GARDEN_ID && plantLevel === 1;
                const hideFtueMasteryCue =
                  isGarden1FtuePlant &&
                  (collectionFtuePhase === 'intro_cta' ||
                    collectionFtuePhase === 'shelf_plant_bounce');
                /** Linear shelf progression: only the next left→right upgrade on the active shelf blinks. */
                const isNextUpgradeablePlant =
                  showUpgradeUi && nextUpgradeLevel === plantLevel && !hideFtueMasteryCue;
                const plantKey = getCollectionPlantKey(shelfGardenId, plantLevel);
                const isMasteryPurchaseBounce =
                  masteryPurchaseRevealLevels.includes(plantKey) ||
                  collectionFtuePlantBounceKeys.includes(plantKey);
                const barnCellStackZ = isNextUpgradeablePlant
                  ? 20 + plantOffset
                  : isPlantDiscovered
                    ? 2
                    : 0;
                return (
                  <BarnShelfPlantSlot
                    key={plantOffset}
                    gardenId={shelfGardenId}
                    plantLevel={plantLevel}
                    isPlantDiscovered={isPlantDiscovered}
                    showMasteryUnlock={isNextUpgradeablePlant}
                    isMasteryPurchaseBounce={isMasteryPurchaseBounce}
                    barnCellStackZ={barnCellStackZ}
                    mastered={isPlantDiscovered && gardenSnap.unlockedLevels.includes(plantLevel)}
                    masteryAdditiveGlow={
                      activeScreen === 'BARN' && (isNextUpgradeablePlant || isMasteryPurchaseBounce)
                    }
                    masteryGlowDelaySec={PLANT_MASTERY_GLOW_ANIM_DELAY_SEC}
                    onOpenPlantInfo={() => openShelfPlantInfo(plantLevel)}
                  />
                );
              })}
            </div>
          )}
          {isPlantCollectionUiUnlocked && shelfRewardBar && (
            <div
              className={`absolute left-1/2 ${shelfProgressBarInteractive ? 'pointer-events-auto' : 'pointer-events-none'}`}
              style={{
                bottom: '77px',
                transform: 'translateX(calc(-50% - 2px))',
                zIndex: 12,
              }}
            >
              <CollectionRewardProgressBar
                variant="progress"
                numerator={shelfRewardBar.numerator}
                denominator={shelfRewardBar.denominator}
                fillPct={shelfRewardBar.fillPct}
                rewardIconSrc={getCollectionBonusIconPath(
                  shelfRewardBar.rewardIconSlug,
                  shelfRewardBarLocked,
                )}
                rewardIconId={
                  shelfGardenId === DEFAULT_GARDEN_ID &&
                  shelfInGarden === 0 &&
                  collectionFtuePhase === 'point_bonuses'
                    ? COLLECTION_FTUE_SHELF0_REWARD_ICON_ID
                    : undefined
                }
                leftIconSrc={shelfProgressLeftIconSrc}
                showCenterLabel={isActiveUpgradeShelf || (shelfFullyDiscovered && !shelfUsesLockedLeftIcon)}
                scale={0.8}
                onBarClick={
                  shelfProgressBarInteractive
                    ? () => {
                        if (collectionFtuePhase != null && !collectionFtueCompleted) {
                          if (collectionFtuePhase === 'wait_reveal') return;
                          if (
                            collectionFtuePhase === 'intro_cta' ||
                            collectionFtuePhase === 'shelf_plant_bounce' ||
                            collectionFtuePhase === 'point_unlock'
                          ) {
                            return;
                          }
                          if (collectionFtuePhase === 'point_bonuses') {
                            openCollectionBonusesFromFtue();
                            return;
                          }
                        }
                        const tierPotCount = shelfRewardBar?.rewardTierPotCount;
                        if (tierPotCount == null) return;
                        playSfx(SFX_IDS.uiConfirmNormal);
                        setGoldenPotBonusRevealTier(null);
                        setGoldenPotBonusScrollTierPotCount(tierPotCount);
                        setGoldenPotBonusesPopupOpen(true);
                      }
                    : undefined
                }
              />
            </div>
          )}
        </div>
      );
    },
    [
      activeGardenId,
      activeCollectionSnapshot,
      collectionV2Gardens,
      isPlantCollectionUiUnlocked,
      collectionFtuePhase,
      collectionFtueCompleted,
      masteryPurchaseRevealLevels,
      collectionFtuePlantBounceKeys,
      collectionFtueFreeButtonGreen,
      collectionFtueFreeButtonBouncing,
      collectionFtueFreeButtonLeafBurst,
      activeScreen,
      goldenPotBonusesPopupOpen,
      goldenPotBonusRevealShelfIndex,
      handleShelfUpgradeClick,
      openCollectionBonusesFromFtue,
      setPlantInfoPopup,
      playSfx,
    ],
  );

  const collectionFtueActive = collectionFtuePhase != null && !collectionFtueCompleted;
  const tasksFtueHoldLockedVisual =
    dailyTasksUnlocked && !tasksFtueUnlockRevealed && !tasksFtueCompleted;
  const tasksFtueActive =
    tasksFtueStarted &&
    tasksFtueUnlockRevealed &&
    !tasksFtueCompleted &&
    activeScreen === 'FARM' &&
    !isLoading;

  const gardensFloatingButtonUnlocked = isGardensFloatingButtonUnlocked(
    garden1PlayerLevel,
    GARDENS_FLOATING_BUTTON_UNLOCK_LEVEL,
    loadGameSaveV2()?.gardensStarted ?? [DEFAULT_GARDEN_ID],
    activeGardenId,
  );
  const gardensFtueHoldLockedVisual =
    activeGardenId === DEFAULT_GARDEN_ID &&
    gardensFloatingButtonUnlocked &&
    !gardensFtueUnlockRevealed &&
    !gardensFtueCompleted;
  const gardensFtueActive =
    gardensFtueStarted &&
    gardensFtueUnlockRevealed &&
    !gardensFtueCompleted &&
    activeScreen === 'FARM' &&
    !isLoading;

  const newGardenGardensFbFtueActive =
    newGardenFtuePhase === 'point_gardens_fb' &&
    !newGardenFtueCompleted &&
    activeGardenId === 'garden_2' &&
    activeScreen === 'FARM' &&
    !gardenSwitchOverlayActive &&
    !isLoading &&
    !deferNewGardenFtueUiForOffline &&
    !offlineEarningsUi?.open;

  const newGardenWelcomeFtueActive =
    newGardenFtuePhase === 'welcome' &&
    !newGardenFtueCompleted &&
    activeGardenId === 'garden_2' &&
    activeScreen === 'FARM' &&
    !gardenSwitchOverlayActive &&
    !isLoading &&
    !deferNewGardenFtueUiForOffline &&
    !offlineEarningsUi?.open;

  useEffect(() => {
    const was = prevPopupOpenRef.current.newGardenWelcome;
    if (!was && newGardenWelcomeFtueActive) playSfx(SFX_IDS.popupNormal);
    prevPopupOpenRef.current.newGardenWelcome = newGardenWelcomeFtueActive;
  }, [newGardenWelcomeFtueActive]);

  const newGardenPickerFtueActive =
    newGardenFtuePhase === 'picker_view' && !newGardenFtueCompleted && gardenPickerOpen;

  const showCollectionFtueCta =
    collectionFtueActive &&
    (collectionFtuePhase === 'intro_cta' ||
      collectionFtuePhase === 'shelf_plant_bounce' ||
      collectionFtuePhase === 'point_unlock' ||
      collectionFtuePhase === 'wait_reveal' ||
      collectionFtuePhase === 'point_bonuses');
  const collectionFtueCtaDisabled =
    collectionFtuePhase !== 'intro_cta' || collectionFtueBonusesUiRevealed;
  /** Mount View Bonuses early (opacity 0) so it can fade in on the bonuses bounce. */
  const showCollectionFtueViewBonusesMount =
    isPlantCollectionUiUnlocked &&
    (!collectionFtueActive ||
      collectionFtueBonusesUiRevealed ||
      collectionFtuePhase === 'wait_reveal' ||
      collectionFtuePhase === 'point_bonuses');
  const collectionFtueViewBonusesVisible =
    !collectionFtueActive || collectionFtueBonusesUiRevealed;
  const collectionFtueBlockViewBonuses =
    collectionFtueActive && !collectionFtueBonusesUiRevealed;
  const collectionFtueBonusesCopyActive =
    collectionFtueActive && collectionFtueBonusesUiRevealed;
  /** Full-screen dim only: barn transition after View Collection, before CTA hole + finger. */
  const collectionFtueIntroCtaBlockOnly =
    collectionFtuePhase === 'intro_cta' && activeScreen === 'BARN' && !collectionFtueIntroCtaOverlayReady;
  const collectionFtueShelfBounceBlockOnly = collectionFtuePhase === 'shelf_plant_bounce';
  /** Collection FTUE: no barn pan/scroll while finger is on golden-pot CTA or plant 1 Unlock. */
  const collectionFtueBarnScrollLocked =
    activeScreen === 'BARN' &&
    !collectionFtueCompleted &&
    (collectionFtuePhase === 'intro_cta' ||
      collectionFtuePhase === 'shelf_plant_bounce' ||
      collectionFtuePhase === 'point_unlock' ||
      collectionFtuePhase === 'point_bonuses');
  const unreadMasteryUnlockLevels = goldenPotUpgradeableLevels.filter(
    (level) => !seenMasteryUnlockLevels.includes(level),
  );

  const applyUpgradePanelPoseRef = useRef<(pp: number) => void>(() => {});

  const updateGardenBgLayout = useCallback(() => {
    // During open/close WAAPI owns transforms; base vars only change on real layout/resize.
    if (panelBgAnimatingRef.current) return;
    const col = farmColumnRef.current;
    if (!col) return;
    const scale = appScaleRef.current || 1;

    // Panel height is FIXED. All garden/hex poses are WAAPI-tweened; measure open anchors here.
    // Undo live panel/hex slides when reading so --pgl/--pct stay open-pose.
    const expandedH = upgradePanelExpandedHeightRef.current;
    const ppd = expandedH - UPGRADE_PANEL_CLOSED_VISIBLE_PX;
    // Hex/grass move ~half the panel travel (same as historical centered flex reflow).
    const pcd = ppd / 2;
    const pgd = ppd + GARDEN_BG_CLOSED_EXTRA_DOWN_PX;
    const pp = panelProgressRef.current;
    const panelSlideY = (1 - pp) * ppd * scale;
    const hexSlideY = (1 - pp) * pcd * scale;

    const colRect = col.getBoundingClientRect();
    const tabLine = document.getElementById('upgrade-panel-tab-line');
    const grid = hexGridBgRef.current;
    let gl = 0;
    let cl = 0;
    let ct = 0;
    if (tabLine) {
      const lineRect = tabLine.getBoundingClientRect();
      const lineBottomOpen = lineRect.bottom - panelSlideY;
      gl = Math.max(0, (colRect.bottom - lineBottomOpen) / scale - GARDEN_BG_TAB_LINE_OFFSET_PX);
    }
    if (grid) {
      const gridRect = grid.getBoundingClientRect();
      const HEX_GRID_CENTER_Y_RATIO = 0.48;
      cl = (gridRect.left + gridRect.width / 2 - colRect.left) / scale;
      const ctMeasured =
        (gridRect.top + gridRect.height * HEX_GRID_CENTER_Y_RATIO - colRect.top) / scale;
      // Hex follows open/close pose; undo so --pct stays the open-pose anchor for center sprites.
      ct = ctMeasured - hexSlideY / scale;
    }

    gardenBgOpenRef.current = { gl, cl, ct };

    col.style.setProperty('--ppd', `${ppd}px`);
    col.style.setProperty('--pcd', `${pcd}px`);
    col.style.setProperty('--pgd', `${pgd}px`);
    col.style.setProperty('--pgl', `${gl}px`);
    col.style.setProperty('--pct', `${ct}px`);
    col.style.setProperty('--pcl', `${cl}px`);

    // Keep center pins locked to updated anchors when settled (WAAPI owns transforms while moving).
    applyUpgradePanelPoseRef.current?.(pp);
  }, []);

  const cancelUpgradePanelAnims = useCallback(() => {
    for (const anim of panelAnimsRef.current) {
      try {
        anim.cancel();
      } catch {
        /* ignore */
      }
    }
    panelAnimsRef.current = [];
  }, []);

  const applyUpgradePanelPose = useCallback((pp: number) => {
    const expandedH = upgradePanelExpandedHeightRef.current;
    const ppd = expandedH - UPGRADE_PANEL_CLOSED_VISIBLE_PX;
    const pcd = ppd / 2;
    const pgd = ppd + GARDEN_BG_CLOSED_EXTRA_DOWN_PX;
    const col = farmColumnRef.current;
    const pcl = col?.style.getPropertyValue('--pcl')?.trim() || '0px';
    const pct = parseFloat(col?.style.getPropertyValue('--pct') || '0') || 0;
    const pgl = parseFloat(col?.style.getPropertyValue('--pgl') || '0') || 0;
    const yFull = (1 - pp) * ppd;
    const yHalf = (1 - pp) * pcd;
    const closedT = 1 - pp;
    const yGarden = -pgl + closedT * pgd - closedT * GARDEN_SIDE_CLOSED_LIFT_PX;
    const yGrass = -pp * pcd;
    const centerXf = `translate(${pcl}, ${pct + yHalf}px) translate(-50%, -50%) scale(0.75)`;
    const sideScale = GARDEN_SIDE_SPRITE_SCALE;
    const panel = upgradePanelRef.current;
    const seedRow = seedHarvestRowRef.current;
    const hex = hexGridBgRef.current;
    const center = gardenCenterBgRef.current;
    const centerTop = gardenCenterTopBgRef.current;
    const grass = gardenGrassBgRef.current;
    const bottom = gardenBottomBgRef.current;
    const left = gardenLeftBgRef.current;
    const right = gardenRightBgRef.current;
    const gradient = gardenGradientBgRef.current;
    if (panel) panel.style.transform = `translateY(${yFull}px)`;
    if (seedRow) seedRow.style.transform = `translateY(${yFull}px)`;
    if (hex) hex.style.transform = `translateY(${yHalf}px)`;
    if (center) center.style.transform = centerXf;
    if (centerTop) centerTop.style.transform = centerXf;
    if (grass) {
      grass.style.height = `calc(100% + ${pcd}px)`;
      grass.style.transform = `translateY(${yGrass}px)`;
    }
    if (bottom) {
      bottom.style.transform = `translate(-50%, ${yGarden}px) scale(${sideScale})`;
    }
    if (left) left.style.transform = `translateY(${yGarden}px) scale(${sideScale})`;
    if (right) right.style.transform = `translateY(${yGarden}px) scale(${sideScale})`;
    if (gradient) gradient.style.transform = `translateY(${yGarden}px)`;
    panelProgressRef.current = pp;
  }, []);
  applyUpgradePanelPoseRef.current = applyUpgradePanelPose;

  useLayoutEffect(() => {
    updateGardenBgLayout();
    const col = farmColumnRef.current;
    const grid = hexGridBgRef.current;
    if (!col) return;
    // Panel size is fixed during open/close — observing it only caused spurious remeasures.
    const ro = new ResizeObserver(updateGardenBgLayout);
    ro.observe(col);
    if (grid) ro.observe(grid);
    return () => ro.disconnect();
  }, [updateGardenBgLayout, designWidth, designHeight, appScale, ftueUpgradePanelVisible]);

  // Open/close: one WAAPI tween per mover (same duration + easing). Browser owns interpolation.
  const panelAnimFirstSyncRef = useRef(true);
  useLayoutEffect(() => {
    const target = isExpanded ? 1 : 0;

    // FTUE / other openers may only set isExpanded — keep panelClosed in sync (no-op if already false).
    if (isExpanded) setPanelClosed(false);

    const endMotion = () => {
      panelBgAnimatingRef.current = false;
      setPanelMotionActive(false);
    };

    const sampleProgressFromPanel = (): number => {
      const panel = upgradePanelRef.current;
      const ppd = upgradePanelExpandedHeightRef.current - UPGRADE_PANEL_CLOSED_VISIBLE_PX;
      if (!panel || ppd <= 0) return panelProgressRef.current;
      try {
        const t = getComputedStyle(panel).transform;
        if (!t || t === 'none') return panelProgressRef.current;
        const y = new DOMMatrixReadOnly(t).m42;
        return Math.max(0, Math.min(1, 1 - y / ppd));
      } catch {
        return panelProgressRef.current;
      }
    };

    // Mount: snap to settled progress, no animation.
    if (panelAnimFirstSyncRef.current) {
      panelAnimFirstSyncRef.current = false;
      cancelUpgradePanelAnims();
      applyUpgradePanelPose(target);
      endMotion();
      if (!isExpanded) setPanelClosed(true);
      return;
    }

    const from = panelProgressRef.current;
    if (Math.abs(from - target) < 0.001) {
      cancelUpgradePanelAnims();
      applyUpgradePanelPose(target);
      endMotion();
      if (!isExpanded) setPanelClosed(true);
      return;
    }

    cancelUpgradePanelAnims();
    panelBgAnimatingRef.current = true;
    setPanelMotionActive(true);

    const expandedH = upgradePanelExpandedHeightRef.current;
    const ppd = expandedH - UPGRADE_PANEL_CLOSED_VISIBLE_PX;
    const pcd = ppd / 2;
    const pgd = ppd + GARDEN_BG_CLOSED_EXTRA_DOWN_PX;
    const col = farmColumnRef.current;
    const pcl = col?.style.getPropertyValue('--pcl')?.trim() || '0px';
    const pct = parseFloat(col?.style.getPropertyValue('--pct') || '0') || 0;
    const pgl = parseFloat(col?.style.getPropertyValue('--pgl') || '0') || 0;
    const fromFull = (1 - from) * ppd;
    const toFull = (1 - target) * ppd;
    const fromHalf = (1 - from) * pcd;
    const toHalf = (1 - target) * pcd;
    const fromGarden = -pgl + (1 - from) * pgd - (1 - from) * GARDEN_SIDE_CLOSED_LIFT_PX;
    const toGarden = -pgl + (1 - target) * pgd - (1 - target) * GARDEN_SIDE_CLOSED_LIFT_PX;
    const fromGrass = -from * pcd;
    const toGrass = -target * pcd;
    const fromCenter = `translate(${pcl}, ${pct + fromHalf}px) translate(-50%, -50%) scale(0.75)`;
    const toCenter = `translate(${pcl}, ${pct + toHalf}px) translate(-50%, -50%) scale(0.75)`;
    const sideScale = GARDEN_SIDE_SPRITE_SCALE;

    const opts: KeyframeAnimationOptions = {
      duration: UPGRADE_PANEL_ANIM_DURATION_MS,
      easing: UPGRADE_PANEL_WAAPI_EASING,
      fill: 'forwards',
    };

    const anims: Animation[] = [];
    const tween = (el: HTMLElement | null, fromXf: string, toXf: string) => {
      if (!el) return;
      anims.push(el.animate([{ transform: fromXf }, { transform: toXf }], opts));
    };
    tween(upgradePanelRef.current, `translateY(${fromFull}px)`, `translateY(${toFull}px)`);
    tween(seedHarvestRowRef.current, `translateY(${fromFull}px)`, `translateY(${toFull}px)`);
    tween(hexGridBgRef.current, `translateY(${fromHalf}px)`, `translateY(${toHalf}px)`);
    tween(gardenCenterBgRef.current, fromCenter, toCenter);
    tween(gardenCenterTopBgRef.current, fromCenter, toCenter);
    tween(gardenGrassBgRef.current, `translateY(${fromGrass}px)`, `translateY(${toGrass}px)`);
    tween(
      gardenBottomBgRef.current,
      `translate(-50%, ${fromGarden}px) scale(${sideScale})`,
      `translate(-50%, ${toGarden}px) scale(${sideScale})`,
    );
    tween(
      gardenLeftBgRef.current,
      `translateY(${fromGarden}px) scale(${sideScale})`,
      `translateY(${toGarden}px) scale(${sideScale})`,
    );
    tween(
      gardenRightBgRef.current,
      `translateY(${fromGarden}px) scale(${sideScale})`,
      `translateY(${toGarden}px) scale(${sideScale})`,
    );
    tween(gardenGradientBgRef.current, `translateY(${fromGarden}px)`, `translateY(${toGarden}px)`);
    panelAnimsRef.current = anims;

    let cancelled = false;
    void Promise.all(anims.map((a) => a.finished.catch(() => undefined))).then(() => {
      if (cancelled) return;
      applyUpgradePanelPose(target);
      cancelUpgradePanelAnims();
      endMotion();
      if (!isExpanded) setPanelClosed(true);
    });

    return () => {
      cancelled = true;
      const p = sampleProgressFromPanel();
      panelProgressRef.current = p;
      // Keep panelBgAnimatingRef true across teardown → next setup (avoids RO measure mid-retarget).
      cancelUpgradePanelAnims();
      applyUpgradePanelPose(p);
    };
  }, [isExpanded, applyUpgradePanelPose, cancelUpgradePanelAnims]);

  const [plantCollectionViewBonusesPressed, setPlantCollectionViewBonusesPressed] = useState(false);
  const [collectionFtueCtaPressed, setCollectionFtueCtaPressed] = useState(false);

  const saveBarnScrollForGarden = useCallback((gardenId: GardenId) => {
    // Locked, or collection FTUE still pending: never remember scroll — always top.
    if (!isPlantCollectionUiUnlockedForGarden(playerLevel) || !collectionFtueCompleted) {
      barnScrollYByGardenRef.current[gardenId] = 0;
      return;
    }
    barnScrollYByGardenRef.current[gardenId] = barnScrollYRef.current;
  }, [playerLevel, collectionFtueCompleted]);

  const restoreBarnScrollForGarden = useCallback((gardenId: GardenId) => {
    barnScrollGardenIdRef.current = gardenId;
    // Locked, or collection FTUE still pending: always land at top (View Collection → FTUE).
    if (!isPlantCollectionUiUnlockedForGarden(playerLevel) || !collectionFtueCompleted) {
      barnScrollYRef.current = 0;
      barnScrollYByGardenRef.current[gardenId] = 0;
      setBarnScrollY(0);
      return;
    }
    const scrollY = barnScrollYByGardenRef.current[gardenId] ?? 0;
    barnScrollYRef.current = scrollY;
    setBarnScrollY(scrollY);
  }, [playerLevel, collectionFtueCompleted]);

  const clampBarnScrollToContent = useCallback(() => {
    const el = barnScrollRef.current;
    if (!el) return;
    const scrollEnd = el.querySelector('[data-barn-scroll-end]') as HTMLElement | null;
    if (!scrollEnd) return;
    const maxScroll = Math.max(
      0,
      (scrollEnd.offsetTop + scrollEnd.offsetHeight) * barnScale - el.clientHeight,
    );
    if (barnScrollYRef.current <= maxScroll) return;
    const clamped = maxScroll;
    barnScrollYRef.current = clamped;
    setBarnScrollY(clamped);
    barnScrollYByGardenRef.current[barnScrollGardenIdRef.current] = clamped;
  }, [barnScale]);

  useEffect(() => {
    const prev = prevActiveScreenForBarnScrollRef.current;
    if (prev === 'BARN' && activeScreen !== 'BARN') {
      saveBarnScrollForGarden(barnScrollGardenIdRef.current);
    }
    prevActiveScreenForBarnScrollRef.current = activeScreen;
  }, [activeScreen, saveBarnScrollForGarden]);

  useLayoutEffect(() => {
    if (activeScreen !== 'BARN') return;
    restoreBarnScrollForGarden(activeGardenId);
    const raf = requestAnimationFrame(() => clampBarnScrollToContent());
    return () => cancelAnimationFrame(raf);
  }, [activeScreen, activeGardenId, barnScale, restoreBarnScrollForGarden, clampBarnScrollToContent]);

  useEffect(() => {
    const el = barnScrollRef.current;
    if (!el) return;
    if (collectionFtueBarnScrollLocked) {
      return () => {};
    }

    let isDown = false;
    let startY = 0;
    let startScrollY = 0;
    let velocityY = 0;
    let lastY = 0;
    let lastTime = 0;
    let rafId: number;
    
    const getMaxScroll = () => {
      const scrollEnd = el.querySelector('[data-barn-scroll-end]') as HTMLElement;
      if (!scrollEnd) return 0;
      const contentBottom = (scrollEnd.offsetTop + scrollEnd.offsetHeight) * barnScale;
      const viewportHeight = el.clientHeight;
      return Math.max(0, contentBottom - viewportHeight);
    };
    
    const updateScroll = (newValue: number) => {
      barnScrollYRef.current = newValue;
      barnScrollYByGardenRef.current[barnScrollGardenIdRef.current] = newValue;
      setBarnScrollY(newValue);
    };
    
    const momentumLoop = () => {
      if (!isDown && Math.abs(velocityY) > 0.1) {
        const maxScroll = getMaxScroll();
        const newScroll = Math.max(0, Math.min(barnScrollYRef.current - velocityY, maxScroll));
        updateScroll(newScroll);
        velocityY *= 0.94;
        rafId = requestAnimationFrame(momentumLoop);
      }
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      velocityY = 0;
      cancelAnimationFrame(rafId);
      startY = e.pageY;
      startScrollY = barnScrollYRef.current;
      lastY = e.pageY;
      lastTime = Date.now();
      window.addEventListener('mousemove', handleMouseMoveGlobal);
      window.addEventListener('mouseup', handleMouseUpGlobal);
    };
    
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      if (!isDown) return;
      const dy = e.pageY - startY;
      const now = Date.now();
      if (now - lastTime > 0) velocityY = velocityY * 0.2 + (e.pageY - lastY) * 0.8;
      const maxScroll = getMaxScroll();
      const newScroll = Math.max(0, Math.min(startScrollY - dy, maxScroll));
      updateScroll(newScroll);
      lastY = e.pageY;
      lastTime = now;
    };
    
    const handleMouseUpGlobal = () => {
      if (!isDown) return;
      isDown = false;
      window.removeEventListener('mousemove', handleMouseMoveGlobal);
      window.removeEventListener('mouseup', handleMouseUpGlobal);
      if (Math.abs(velocityY) > 1) {
        rafId = requestAnimationFrame(momentumLoop);
      }
    };
    
    // Touch support
    const handleTouchStart = (e: TouchEvent) => {
      isDown = true;
      velocityY = 0;
      cancelAnimationFrame(rafId);
      startY = e.touches[0].pageY;
      startScrollY = barnScrollYRef.current;
      lastY = e.touches[0].pageY;
      lastTime = Date.now();
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDown) return;
      const dy = e.touches[0].pageY - startY;
      const now = Date.now();
      if (now - lastTime > 0) velocityY = velocityY * 0.2 + (e.touches[0].pageY - lastY) * 0.8;
      const maxScroll = getMaxScroll();
      const newScroll = Math.max(0, Math.min(startScrollY - dy, maxScroll));
      updateScroll(newScroll);
      lastY = e.touches[0].pageY;
      lastTime = now;
    };
    
    const handleTouchEnd = () => {
      if (!isDown) return;
      isDown = false;
      if (Math.abs(velocityY) > 1) {
        rafId = requestAnimationFrame(momentumLoop);
      }
    };
    
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousemove', handleMouseMoveGlobal);
      window.removeEventListener('mouseup', handleMouseUpGlobal);
      cancelAnimationFrame(rafId);
    };
  }, [barnScale, collectionFtueBarnScrollLocked]);

  useEffect(() => {
    if (activeScreen === 'BARN') {
      setBarnNotification(false);
    }
  }, [activeScreen]);

  useEffect(() => {
    if (activeScreen !== 'BARN') return;
    if (!isPlantCollectionUiUnlocked) return;
    if (goldenPotUpgradeableLevels.length === 0) return;
    if (collectionFtuePhase === 'intro_cta') return;
    if (skipNextBarnPendingBounceRef.current) {
      skipNextBarnPendingBounceRef.current = false;
      return;
    }

    if (barnEnterFocusTimeoutRef.current) window.clearTimeout(barnEnterFocusTimeoutRef.current);
    barnEnterFocusTimeoutRef.current = window.setTimeout(() => {
      const targetLevel = goldenPotUpgradeableLevels[0];
      if (!barnScrollRef.current) return;
      setSeenMasteryUnlockLevels((prev) => (prev.includes(targetLevel) ? prev : [...prev, targetLevel]));
      barnEnterFocusTimeoutRef.current = null;
    }, 150);
  }, [activeScreen, barnScale, goldenPotUpgradeableLevels, isPlantCollectionUiUnlocked, collectionFtuePhase]);

  /** Resume collection FTUE when re-entering barn on garden 1 (e.g. after save load). */
  useEffect(() => {
    if (activeScreen !== 'BARN') return;
    if (activeGardenId !== DEFAULT_GARDEN_ID) return;
    if (collectionFtueCompleted) return;
    if (!isPlantCollectionUiUnlockedGlobally(garden1PlayerLevel)) return;
    if (plantMastery.unlockedLevels.includes(1)) return;
    setCollectionFtuePhase((p) => (p == null ? 'intro_cta' : p));
  }, [activeScreen, activeGardenId, collectionFtueCompleted, garden1PlayerLevel, plantMastery.unlockedLevels]);

  useEffect(() => {
    if (goldenPotBonusesWasOpenRef.current && !goldenPotBonusesPopupOpen && collectionFtuePhase === 'point_bonuses') {
      setCollectionFtuePhase('point_garden_nav');
    }
    goldenPotBonusesWasOpenRef.current = goldenPotBonusesPopupOpen;
  }, [goldenPotBonusesPopupOpen, collectionFtuePhase]);

  const triggerCollectionFtuePanelBounce = useCallback(() => {
    if (collectionFtuePanelBounceDoneTimerRef.current != null) {
      window.clearTimeout(collectionFtuePanelBounceDoneTimerRef.current);
      collectionFtuePanelBounceDoneTimerRef.current = null;
    }
    setCollectionFtuePanelBouncing(true);
    playSfx(SFX_IDS.popupLevelUp);
    const panelEl = collectionFtuePanelRef.current;
    if (panelEl && shouldPlayPopupLeafBurst()) {
      const w = panelEl.offsetWidth;
      const h = panelEl.offsetHeight;
      if (w > 0 && h > 0) {
        setCollectionFtuePanelLeafBurst({
          id: `collection-ftue-panel-lb-${Date.now()}`,
          rectWidth: w,
          rectHeight: h,
        });
      }
    }
    const bounceDoneTimer = window.setTimeout(() => {
      collectionFtuePanelBounceDoneTimerRef.current = null;
      setCollectionFtuePanelBouncing(false);
    }, COLLECTION_FTUE_PANEL_BOUNCE_MS);
    collectionFtuePanelBounceDoneTimerRef.current = bounceDoneTimer;
    return bounceDoneTimer;
  }, [playSfx]);

  useEffect(() => {
    if (collectionFtueCompleted || collectionFtuePhase !== 'intro_cta' || activeScreen !== 'BARN') {
      setCollectionFtueIntroCtaOverlayReady(false);
      if (collectionFtuePhase !== 'intro_cta') {
        setCollectionFtuePanelChromeUnlocked(true);
      }
      return;
    }
    setCollectionFtueIntroCtaOverlayReady(false);
    setCollectionFtuePanelBouncing(false);
    setCollectionFtuePanelChromeUnlocked(false);
    setCollectionFtuePanelLeafBurst(null);
    setCollectionFtueBonusesUiRevealed(false);
    setCollectionFtueBonusesOverlayReady(false);
    setCollectionFtuePlantBounceKeys([]);
    setCollectionFtueCopyFlash(null);
    setCollectionFtueFreeButtonGreen(false);
    setCollectionFtueFreeButtonBouncing(false);
    setCollectionFtueFreeButtonLeafBurst(null);
    let bounceDoneTimer: number | null = null;
    let fingerReadyTimer: number | null = null;
    const slideTimer = window.setTimeout(() => {
      setCollectionFtuePanelChromeUnlocked(true);
      setCollectionFtueCopyFlash({ kind: 'intro', gen: Date.now() });
      bounceDoneTimer = triggerCollectionFtuePanelBounce();
      fingerReadyTimer = window.setTimeout(() => {
        setCollectionFtueIntroCtaOverlayReady(true);
      }, COLLECTION_FTUE_PANEL_BOUNCE_MS + COLLECTION_FTUE_INTRO_CTA_FINGER_DELAY_MS);
    }, COLLECTION_FTUE_INTRO_CTA_OVERLAY_DELAY_MS);
    return () => {
      window.clearTimeout(slideTimer);
      if (bounceDoneTimer != null) window.clearTimeout(bounceDoneTimer);
      if (fingerReadyTimer != null) window.clearTimeout(fingerReadyTimer);
    };
  }, [collectionFtuePhase, activeScreen, collectionFtueCompleted, triggerCollectionFtuePanelBounce]);

  /** After “Let’s upgrade”: bounce shelf plants 1–4, then FREE (same 200ms stagger), then finger. */
  useEffect(() => {
    if (collectionFtueCompleted || collectionFtuePhase !== 'shelf_plant_bounce' || activeScreen !== 'BARN') {
      return;
    }
    setCollectionFtuePlantBounceKeys([]);
    setCollectionFtueFreeButtonGreen(false);
    setCollectionFtueFreeButtonBouncing(false);
    setCollectionFtueFreeButtonLeafBurst(null);
    const timers: number[] = [];
    const plantKeys = [1, 2, 3, 4].map((level) => getCollectionPlantKey(DEFAULT_GARDEN_ID, level));
    timers.push(
      window.setTimeout(() => {
        // 1 → 2 → 3 → 4 → FREE, each step 200ms after the previous starts.
        plantKeys.forEach((plantKey, i) => {
          timers.push(
            window.setTimeout(() => {
              playSfx(SFX_IDS.uiConfirmNormal);
              setCollectionFtuePlantBounceKeys((prev) =>
                prev.includes(plantKey) ? prev : [...prev, plantKey],
              );
              timers.push(
                window.setTimeout(() => {
                  setCollectionFtuePlantBounceKeys((prev) => prev.filter((k) => k !== plantKey));
                }, COLLECTION_FTUE_SHELF_PLANT_BOUNCE_MS),
              );
            }, i * COLLECTION_FTUE_SHELF_PLANT_BOUNCE_STAGGER_MS),
          );
        });
        timers.push(
          window.setTimeout(() => {
            playSfx(SFX_IDS.popupLevelUp);
            setCollectionFtueFreeButtonBouncing(true);
            const btnEl = collectionFtueFreeButtonRef.current;
            if (btnEl && shouldPlayPopupLeafBurst()) {
              const w = btnEl.offsetWidth;
              const h = btnEl.offsetHeight;
              if (w > 0 && h > 0) {
                setCollectionFtueFreeButtonLeafBurst({
                  id: `collection-ftue-free-lb-${Date.now()}`,
                  rectWidth: w,
                  rectHeight: h,
                });
              }
            }
            timers.push(
              window.setTimeout(() => {
                setCollectionFtueFreeButtonGreen(true);
              }, 16),
            );
            timers.push(
              window.setTimeout(() => {
                setCollectionFtueFreeButtonBouncing(false);
                timers.push(
                  window.setTimeout(() => {
                    setCollectionFtuePhase('point_unlock');
                  }, COLLECTION_FTUE_SHELF_FREE_FINGER_DELAY_MS),
                );
              }, COLLECTION_FTUE_SHELF_FREE_BOUNCE_MS),
            );
          }, plantKeys.length * COLLECTION_FTUE_SHELF_PLANT_BOUNCE_STAGGER_MS),
        );
      }, COLLECTION_FTUE_SHELF_BOUNCE_START_DELAY_MS),
    );
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      setCollectionFtuePlantBounceKeys([]);
      setCollectionFtueFreeButtonBouncing(false);
      setCollectionFtueFreeButtonLeafBurst(null);
    };
  }, [collectionFtuePhase, activeScreen, collectionFtueCompleted, playSfx]);

  /** After free upgrade: bounce + leaf burst when panel copy / View Bonuses crossfade. */
  useEffect(() => {
    if (collectionFtueCompleted || collectionFtuePhase !== 'point_bonuses' || activeScreen !== 'BARN') {
      if (collectionFtuePhase !== 'point_bonuses') {
        setCollectionFtueBonusesOverlayReady(false);
      }
      return;
    }
    setCollectionFtueBonusesOverlayReady(false);
    setCollectionFtueBonusesUiRevealed(true);
    setCollectionFtueCopyFlash({ kind: 'bonuses', gen: Date.now() });
    const bounceDoneTimer = triggerCollectionFtuePanelBounce();
    const overlayTimer = window.setTimeout(() => {
      setCollectionFtueBonusesOverlayReady(true);
    }, COLLECTION_FTUE_PANEL_BOUNCE_MS + COLLECTION_FTUE_BONUSES_OVERLAY_DELAY_MS);
    return () => {
      if (bounceDoneTimer != null) window.clearTimeout(bounceDoneTimer);
      window.clearTimeout(overlayTimer);
    };
  }, [collectionFtuePhase, activeScreen, collectionFtueCompleted, triggerCollectionFtuePanelBounce]);

  /** Fail-safe: collection level-up / mid-FTUE reload keeps forcing the popup until View Collection. */
  useEffect(() => {
    if (isLoading || collectionFtueCompleted || !collectionFtueRestartPending) return;
    // Keep restartPending true until View Collection clears it — refresh while the popup is open must still restore it.
    setCollectionFtuePhase(null);
    presentLevelUpPopupRef.current(PLANT_COLLECTION_UI_UNLOCK_LEVEL);
  }, [isLoading, collectionFtueCompleted, collectionFtueRestartPending]);

  useEffect(() => {
    return () => {
      if (barnEnterFocusTimeoutRef.current) {
        window.clearTimeout(barnEnterFocusTimeoutRef.current);
      }
      if (masteryPurchaseRevealTimeoutRef.current) {
        window.clearTimeout(masteryPurchaseRevealTimeoutRef.current);
      }
    };
  }, []);

  // Get cells that have projectiles in flight (reserved)
  const reservedCellsSet = new Set(activeProjectiles.map(p => p.targetIdx));
  
  // Grid is "full" when all unlocked cells have items OR have incoming projectiles
  const isGridFull = grid.every((cell, idx) => cell.locked || cell.item !== null || reservedCellsSet.has(idx));

  // Out-of-space condition: every unlocked cell is filled AND every plant level is unique.
  const isOutOfSpaceUniqueFill = (() => {
    const unlocked = grid.filter((c) => !c.locked);
    if (unlocked.length === 0) return false;
    const seen = new Set<number>();
    for (const c of unlocked) {
      const lvl = c.item?.level;
      if (lvl == null) return false;
      if (seen.has(lvl)) return false;
      seen.add(lvl);
    }
    return true;
  })();

  useEffect(() => {
    // If the FTUE overlay system isn't mounted yet, don't attempt to show.
    if (!coinPanelPortalRect) return;
    if (!isOutOfSpaceUniqueFill) {
      outOfSpaceArmedRef.current = true;
      setOutOfSpaceFtueVisible(false);
      return;
    }
    if (outOfSpaceArmedRef.current) {
      outOfSpaceArmedRef.current = false;
      setOutOfSpaceFtueVisible(true);
    }
  }, [isOutOfSpaceUniqueFill, coinPanelPortalRect]);

  const spawnProjectile = useCallback((targetIdx: number, plantLevel: number, isSpecialDelivery?: boolean, isLuckyGrowth?: boolean) => {
    if (plantButtonRef.current && containerRef.current) {
      const scale = appScaleRef.current;
      const btnRect = plantButtonRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const startX = ((btnRect.left + btnRect.width / 2) - containerRect.left) / scale;
      const startY = ((btnRect.top + btnRect.height / 2) - containerRect.top) / scale;
      
      const newProj: ProjectileData = {
        id: Math.random().toString(36).substr(2, 9),
        startX,
        startY,
        targetIdx,
        plantLevel,
        ...(isSpecialDelivery ? { isSpecialDelivery: true } : {}),
        ...(isLuckyGrowth ? { isLuckyGrowth: true } : {}),
      };
      setActiveProjectiles(prev => [...prev, newProj]);
      applyDailyTaskSeedProgress();
    }
  }, [applyDailyTaskSeedProgress]);

  const wildGrowthUpgradeLevel = cropsState.wild_growth?.level ?? 0;
  useEffect(() => {
    if (playerLevel < WILD_GROWTH_UNLOCK_PLAYER_LEVEL) {
      wildGrowthAccumMsRef.current = 0;
    }
  }, [playerLevel]);

  // Wild Growth: auto-duplicate at interval once player level ≥ unlock (no seed flight); spawn + beam via ref.
  useEffect(() => {
    if (isLoading) return;
    if (playerLevel < WILD_GROWTH_UNLOCK_PLAYER_LEVEL) return;
    const intervalMs = getWildGrowthIntervalMsForLevel(wildGrowthUpgradeLevel);
    if (intervalMs <= 0) return;

    let last = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min(now - last, 4000);
      last = now;
      if (dt <= 0) return;

      const g = gridRef.current;
      const hasPlant = g.some((c) => !c.locked && c.item != null);
      if (!hasPlant) return;

      let acc = wildGrowthAccumMsRef.current;
      if (acc < intervalMs) {
        acc = Math.min(intervalMs, acc + dt);
        wildGrowthAccumMsRef.current = acc;
        return;
      }

      const reserved = new Set(activeProjectilesRef.current.map((p) => p.targetIdx));
      const pick = pickWildGrowthSpawn(g, reserved);
      if (!pick) {
        wildGrowthAccumMsRef.current = intervalMs;
        return;
      }

      wildGrowthAccumMsRef.current = 0;
      applyWildGrowthSpawnAtCellRef.current(pick.targetIdx, pick.plantLevel);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isLoading, playerLevel, wildGrowthUpgradeLevel]);

  // Tap decay: progress per tap goes from 40% down to 10% the more taps in the last 5 seconds. Resets after 5s idle.
  const TAP_DECAY_WINDOW_MS = 5000;
  const seedTapTimestampsRef = useRef<number[]>([]);
  const harvestTapTimestampsRef = useRef<number[]>([]);
  const getTapProgressPercent = (timestampsRef: React.MutableRefObject<number[]>) => {
    const now = Date.now();
    const cutoff = now - TAP_DECAY_WINDOW_MS;
    timestampsRef.current = timestampsRef.current.filter(t => t >= cutoff);
    const count = timestampsRef.current.length;
    const percent = Math.max(10, 35 - count * 5);
    timestampsRef.current.push(now);
    return percent;
  };

  // Seed Production upgrade: auto-increase progress. Visual: 10%..100% (+10% per level). Rate: 3/min..10/min (linear).
  const seedProductionLevel = seedsState?.seed_production?.level ?? 0;
  const lastSeedProgressTimeRef = useRef<number>(0);
  const seedProgressRef = useRef<number>(0);
  const seedRaf60LastTickRef = useRef<number>(0);
  const tapZoomRef = useRef<{ start: number; end: number; startTime: number; duration: number } | null>(null);
  const [tapZoomTrigger, setTapZoomTrigger] = useState(0);

  /** Tap on empty seed/harvest button (no charges): +5% bar per tap */
  const TAP_BAR_PERCENT = 5;
  /** Merge same-level plants: +20% on both seed and harvest bars */
  const MERGE_BAR_PERCENT = 20;
  // Tap zoom: animate tap % per seed tap over a very short duration (fast smooth zoom)
  useEffect(() => {
    const zoom = tapZoomRef.current;
    if (!zoom) return;
    let rafId: number;
    const durationMs = 100;
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
    const tick = () => {
      const zoom = tapZoomRef.current;
      if (!zoom) return;
      const elapsed = Date.now() - zoom.startTime;
      const t = Math.min(1, elapsed / durationMs);
      const alpha = easeOutCubic(t);
      const value = zoom.start + (zoom.end - zoom.start) * alpha;
      seedProgressRef.current = value;
      if (t >= 1) {
        seedProgressRef.current = zoom.end;
        tapZoomRef.current = null;
        if (zoom.end >= 100) {
          setSeedProgress(100);
          setIsSeedFlashing(true);
        }
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [tapZoomTrigger]);

  // Only update React state when we hit 100% or reset; progress bar is driven at 60fps via progressRef in SideAction
  useEffect(() => {
    // Don't start progress until loading is complete
    if (isLoading) return;
    
    // Same % scale as upgrade list (10% steps → 100%; golden pot → 150%) mapped to seeds/min.
    const hasRapidSeedsBoost = activeBoosts.some(b => b.offerId === 'rapid_seeds');
    const perMinute = getSeedRechargePerMinute(seedProductionLevel, unlockedBonusTierSet, hasRapidSeedsBoost);
    lastSeedProgressTimeRef.current = Date.now();
    let rafId: number;
    const percentPerMs = (perMinute * 100) / (60 * 1000); // % progress per millisecond
    const tick = () => {
      if (tapZoomRef.current) {
        lastSeedProgressTimeRef.current = Date.now();
        rafId = requestAnimationFrame(tick);
        return;
      }
    // FTUE: seeds in free mode – don't advance progress.
    // Allow normal recharge during FTUE 9.5 (recharge_pre_upgrade), FTUE 10 (first_upgrade), and beyond.
    if (
      activeFtueStage != null &&
      activeFtueStage !== 'recharge_pre_upgrade' &&
      activeFtueStage !== 'first_upgrade' &&
      activeFtueStage !== 'recharge_intro'
    ) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const n = getTickCount60(seedRaf60LastTickRef);
      if (n === 0) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      lastSeedProgressTimeRef.current = Date.now();
      const deltaMs = Math.min(n * TARGET_FRAME_MS, 50); // cap for tab backgrounding
      const added = deltaMs * percentPerMs;
      const next = Math.min(100, seedProgressRef.current + added);
      seedProgressRef.current = next;
      if (next >= 100) {
        setSeedProgress(100);
        setIsSeedFlashing(true);
        setSeedBounceTrigger((t) => t + 1); // increment so bounce re-runs every revolution
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [seedProductionLevel, isLoading, activeBoosts, activeFtueStage, unlockedBonusTierSet]);

  // Goal loading countdown: Order Speed (15s base - 1s per level, min 5). Rush Orders boost = 0s. Don't start until slot is 100% faded in.
  const goalIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (isLoading) return;
    const loadingIdx = goalSlots.findIndex((s) => s === 'loading');
    if (loadingIdx < 0) return;
    // Don't run countdown while slot is fading in (0→100% over 500ms)
    if (loadingIdx === goalSlotFadeInSlot) return;
    const hasRushOrdersBoost = activeBoosts.some(b => b.offerId === 'rush_orders');
    const effectiveGoalLoadingSeconds = hasRushOrdersBoost ? 0 : getGoalLoadingSeconds(harvestState, goldenPotCount);
    // Only process each loading slot once (avoids double-counting in React Strict Mode / duplicate effect runs)
    if (lastProcessedGoalLoadingSlotRef.current === loadingIdx) {
      if (goalIntervalRef.current) clearInterval(goalIntervalRef.current);
      if (effectiveGoalLoadingSeconds <= 0) return () => {}; // duplicate instant run: skip entirely
      // else fall through so we re-set the interval (cleanup may have cleared it)
    } else {
      lastProcessedGoalLoadingSlotRef.current = loadingIdx;
    }
    if (goalIntervalRef.current) clearInterval(goalIntervalRef.current);

    const commitSpawnVisuals = (
      plantLevel: number,
      discoveryCommitSeq: number,
      rush: boolean
    ) => {
      recordSpawnedGoalPlantLevel(plantLevel, lastSpawnedGoalLevelsRef, lastSpawnedGoalPlantLevelHUDRef);
      applyDiscoveryRemainingAfterSpawn(
        discoveryCommitSeq,
        plantLevel,
        highestPlantEverRef,
        highestPlantEverStateRef,
        discoveryGoalsRemainingRef
      );
      const existing = goalPlantTypesRef.current;
      const patchedTypes = [...(existing ?? [])];
      while (patchedTypes.length <= loadingIdx) patchedTypes.push(0);
      patchedTypes[loadingIdx] = plantLevel;
      goalPlantTypesRef.current = patchedTypes;
      setGoalPlantTypes((p) => {
        const n = [...p];
        n[loadingIdx] = plantLevel;
        return n;
      });
      setDiscoveryGoalLightGreenDismissed((p) => {
        const n = [...p];
        n[loadingIdx] = false;
        return n;
      });
      const hSpawn = effectiveHighestPlantEverForDiscovery(highestPlantEverRef, highestPlantEverStateRef);
      const isDiscoverySpawn = plantLevel > hSpawn;
      // Spawn SFX should fire when the goal starts bouncing into active, not after settle.
      playSfx(isDiscoverySpawn ? SFX_IDS.goalSpawnUndiscovered : SFX_IDS.goalSpawnNormal);
      const markDiscoveryLightGreen = isDiscoveryLightGreenEligible(
        ftue11PersistenceEnabledRef.current,
        ftue11ThreePlantGoalWindowActive,
        plantLevel,
        hSpawn
      );
      setGoalDiscoveryLightGreenActive((p) => {
        const n = [...p];
        n[loadingIdx] = markDiscoveryLightGreen;
        return n;
      });
      const cropYieldLevel = cropsState?.crop_value?.level ?? 0;
      const goalRequired = getGoalCropRequired(playerLevel, cropYieldLevel);
      setGoalCounts((c) => {
        const next = [...c];
        next[loadingIdx] = goalRequired;
        return next;
      });
      setGoalAmountsRequired((a) => {
        const next = [...a];
        next[loadingIdx] = goalRequired;
        return next;
      });
      requestAnimationFrame(() => requestAnimationFrame(() => setGoalTransitionFade(true)));
      setTimeout(() => {
        lastProcessedGoalLoadingSlotRef.current = null;
        const slotsNow = goalSlotsRef.current;
        const maxSlots = getMaxPlantGoalSlots(unlockedBonusTierSetRef.current);
        const firstEmptyIdx = slotsNow.findIndex((s, i) => s === 'empty' && i < maxSlots);
        const deferFourthSlotLoad =
          firstEmptyIdx === 3 &&
          activeScreenRef.current !== 'FARM' &&
          firstThreePlantGoalSlotsFilled(slotsNow);
        if (deferFourthSlotLoad) pendingFourthPlantGoalSlotRef.current = true;
        setGoalBounceSlots((prev) => prev.filter((s) => s !== loadingIdx));
        setGoalSlots((slotsIn) => {
          const next = [...slotsIn];
          next[loadingIdx] = 'green';
          if (firstEmptyIdx >= 0 && !deferFourthSlotLoad) next[firstEmptyIdx] = 'loading';
          return next;
        });
        if (firstEmptyIdx >= 0 && !deferFourthSlotLoad) {
          setGoalDisplayOrder((prev) => (prev.includes(firstEmptyIdx) ? prev : [...prev, firstEmptyIdx]));
          setGoalSlotFadeInSlot(firstEmptyIdx);
          setGoalLoadingSeconds(rush ? 0 : getGoalLoadingSeconds(harvestState, goldenPotCountRef.current));
          setTimeout(() => setGoalSlotFadeInSlot(null), 500);
        }
        setGoalTransitionSlot(null);
        setGoalTransitionFade(false);
      }, 500);
    };

    const pickPlantAndPreloadCommit = (discoveryCommitSeq: number, rush: boolean) => {
      const minLevel = getPremiumOrdersMinLevel(harvestState);
      const hDisc = effectiveHighestPlantEverForDiscovery(highestPlantEverRef, highestPlantEverStateRef);
      const seedLevel = getSeedLevelFromHighestPlant(hDisc);
      const slots = goalSlotsRef.current;
      const types = goalPlantTypesRef.current;
      const hasDiscoveryOnBoard = hasActiveDiscoveryGoalOnBoard(slots, types, loadingIdx, hDisc);
      const dueDiscovery =
        hDisc < MAX_PLANT_TIER && discoveryGoalsRemainingRef.current <= 0 && !hasDiscoveryOnBoard;
      const occupiedSiblings = collectOccupiedGoalPlantTiers(slots, types, loadingIdx);
      const occupiedActiveSiblings = collectOccupiedGoalPlantTiersActive(slots, types, loadingIdx);
      const lastCommittedSnapshot = lastSpawnedGoalPlantLevelHUDRef.current;
      let plantLevel = pickGoalPlantLevel(
        hDisc,
        minLevel,
        seedLevel,
        discoveryGoalsRemainingRef,
        lastMergeDiscoveryLevelRef,
        lastCommittedSnapshot,
        occupiedSiblings,
        occupiedActiveSiblings,
        hasDiscoveryOnBoard
      );
      const allowDiscoveryTierFallback =
        discoveryGoalsRemainingRef.current <= 0 && !hasDiscoveryOnBoard;
      const forbid1 = new Set(occupiedSiblings);
      if (lastCommittedSnapshot >= 1) forbid1.add(lastCommittedSnapshot);
      plantLevel = resolveGoalPlantLevelAgainstForbidden(
        plantLevel,
        forbid1,
        hDisc,
        minLevel,
        seedLevel,
        allowDiscoveryTierFallback
      );
      const occupiedNow = collectOccupiedGoalPlantTiers(goalSlotsRef.current, goalPlantTypesRef.current, loadingIdx);
      const forbid2 = new Set(occupiedNow);
      const hudNow = lastSpawnedGoalPlantLevelHUDRef.current;
      if (hudNow >= 1) forbid2.add(hudNow);
      plantLevel = resolveGoalPlantLevelAgainstForbidden(
        plantLevel,
        forbid2,
        hDisc,
        minLevel,
        seedLevel,
        allowDiscoveryTierFallback
      );
      plantLevel = finalizeDiscoveryGoalPlantLevelForSpawn(
        plantLevel,
        loadingIdx,
        dueDiscovery,
        highestPlantEverRef,
        highestPlantEverStateRef,
        goalSlotsRef,
        goalPlantTypesRef
      );

      const spawnId = nextGoalSpawnIdRef.current++;
      goalSpawnPreloadTokenRef.current = { loadingIdx, spawnId };
      void preloadGoalOrderIcon(plantLevel).then(() => {
        const t = goalSpawnPreloadTokenRef.current;
        if (!t || t.loadingIdx !== loadingIdx || t.spawnId !== spawnId) return;
        commitSpawnVisuals(plantLevel, discoveryCommitSeq, rush);
      });
    };

    if (effectiveGoalLoadingSeconds <= 0) {
      const discoverySpawnCommitSeq = ++goalDiscoverySpawnCommitSeq;
      setGoalBounceSlots((prev) => (prev.includes(loadingIdx) ? prev : [...prev, loadingIdx]));
      setGoalTransitionSlot(loadingIdx);
      setGoalTransitionFade(false);
      pickPlantAndPreloadCommit(discoverySpawnCommitSeq, hasRushOrdersBoost);
      return () => {};
    }
    goalIntervalRef.current = setInterval(() => {
      let discoveryCommitSeqForThisIntervalTick: number | null = null;
      setGoalLoadingSeconds((prev) => {
        if (prev <= 1) {
          if (goalCountdownSpawnLockRef.current) {
            if (goalIntervalRef.current) {
              clearInterval(goalIntervalRef.current);
              goalIntervalRef.current = null;
            }
            return 0;
          }
          if (discoveryCommitSeqForThisIntervalTick === null) {
            discoveryCommitSeqForThisIntervalTick = ++goalDiscoverySpawnCommitSeq;
          }
          goalCountdownSpawnLockRef.current = true;
          try {
            if (goalIntervalRef.current) {
              clearInterval(goalIntervalRef.current);
              goalIntervalRef.current = null;
            }
            setGoalBounceSlots((p) => (p.includes(loadingIdx) ? p : [...p, loadingIdx]));
            setGoalTransitionSlot(loadingIdx);
            setGoalTransitionFade(false);
            pickPlantAndPreloadCommit(discoveryCommitSeqForThisIntervalTick!, hasRushOrdersBoost);
          } finally {
            queueMicrotask(() => {
              goalCountdownSpawnLockRef.current = false;
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (goalIntervalRef.current) {
        clearInterval(goalIntervalRef.current);
        goalIntervalRef.current = null;
      }
    };
  }, [
    isLoading,
    goalSlots,
    goalSlotFadeInSlot,
    harvestState,
    playerLevel,
    cropsState,
    activeBoosts,
    goldenPotCount,
    ftue11ThreePlantGoalWindowActive,
  ]);

  // When 4th plant slot unlocks (golden pots), start loading in slot 3 if empty and no other loading
  useEffect(() => {
    if (isLoading) return;
    const maxSlots = getMaxPlantGoalSlots(unlockedBonusTierSet);
    const hasLoading = goalSlots.some((s) => s === 'loading');
    if (hasLoading) return;
    for (let i = 3; i < maxSlots; i++) {
      if (goalSlots[i] !== 'empty') continue;
      if (
        i === 3 &&
        activeScreen !== 'FARM' &&
        firstThreePlantGoalSlotsFilled(goalSlots)
      ) {
        pendingFourthPlantGoalSlotRef.current = true;
        break;
      }
      setGoalSlots((s) => { const n = [...s]; n[i] = 'loading'; return n; });
      setGoalDisplayOrder((prev) => (prev.includes(i) ? prev : [...prev, i]));
      setGoalSlotFadeInSlot(i);
      setGoalLoadingSeconds(getGoalLoadingSeconds(harvestState, goldenPotCount));
      setTimeout(() => setGoalSlotFadeInSlot(null), 500);
      break;
    }
  }, [isLoading, goalSlots, harvestState, goldenPotCount, activeScreen]);

  // Finish deferred 4th-slot load once player is on the garden
  useEffect(() => {
    if (isLoading || activeScreen !== 'FARM') return;
    if (!pendingFourthPlantGoalSlotRef.current) return;
    const maxSlots = getMaxPlantGoalSlots(unlockedBonusTierSet);
    if (maxSlots < 4 || goalSlots[3] !== 'empty') {
      pendingFourthPlantGoalSlotRef.current = false;
      return;
    }
    if (goalSlots.some((s) => s === 'loading')) return;
    if (!firstThreePlantGoalSlotsFilled(goalSlots)) {
      pendingFourthPlantGoalSlotRef.current = false;
      return;
    }
    pendingFourthPlantGoalSlotRef.current = false;
    setGoalSlots((s) => { const n = [...s]; n[3] = 'loading'; return n; });
    setGoalDisplayOrder((prev) => (prev.includes(3) ? prev : [...prev, 3]));
    setGoalSlotFadeInSlot(3);
    setGoalLoadingSeconds(getGoalLoadingSeconds(harvestState, goldenPotCount));
    setTimeout(() => setGoalSlotFadeInSlot(null), 500);
  }, [activeScreen, isLoading, goalSlots, harvestState, goldenPotCount]);

  // Coin goal: show after 30–60s (random) since last hide; only from level 2; repeats forever
  useEffect(() => {
    if (playerLevel < 2 || coinGoalVisible) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastCoinGoalHiddenAtRef.current >= nextCoinGoalDelayRef.current) {
        const cropYieldLevel = cropsState?.crop_value?.level ?? 0;
        const amountRequired = getGoalCropRequired(playerLevel, cropYieldLevel);
        const plantValue = getCoinValueForLevel(highestPlantEver);
        const marketMultiplier = getMarketValueMultiplier(harvestState);
        const rawValue = plantValue * amountRequired * marketMultiplier * 1.0;
        const roundedValue = Math.round(rawValue / 5) * 5;
        setCoinGoalValue(roundedValue);
        setCoinGoalTimeRemaining(30);
        setCoinGoalExitAnim(false);
        coinGoalExpiryExitStartedRef.current = false;
        setCoinGoalVisible(true);
        playSfx(SFX_IDS.goalSpawnNormal);
        setCoinGoalBounce(true);
        setTimeout(() => setCoinGoalBounce(false), 400);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [coinGoalVisible, playerLevel, highestPlantEver, cropsState, harvestState]);
  // Hide coin goal if player drops below level 2 (same slide-up exit as timer expiry)
  useEffect(() => {
    if (playerLevel >= 2 || !coinGoalVisible) return;
    if (coinGoalExpiryExitStartedRef.current) return;
    coinGoalExpiryExitStartedRef.current = true;
    setCoinGoalExitAnim(true);
    const t = window.setTimeout(() => {
      coinGoalExpiryExitStartedRef.current = false;
      setCoinGoalVisible(false);
      setCoinGoalExitAnim(false);
      setCoinGoalTimeRemaining(30);
      lastCoinGoalHiddenAtRef.current = Date.now();
      nextCoinGoalDelayRef.current = 30000 + Math.random() * 30000;
    }, COIN_GOAL_EXIT_MS);
    return () => {
      clearTimeout(t);
      coinGoalExpiryExitStartedRef.current = false;
      setCoinGoalExitAnim(false);
    };
  }, [playerLevel, coinGoalVisible]);

  // Coin goal: 30s countdown; at 0 hide and schedule next spawn (30–60s random). Pause while fake ad is visible.
  useEffect(() => {
    if (!coinGoalVisible) return;
    const interval = setInterval(() => {
      if (showFakeAdRef.current) return;
      setCoinGoalTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [coinGoalVisible]);
  useEffect(() => {
    if (!coinGoalVisible) {
      coinGoalExpiryExitStartedRef.current = false;
      return;
    }
    if (coinGoalTimeRemaining > 0) {
      coinGoalExpiryExitStartedRef.current = false;
      return;
    }
    if (coinGoalExpiryExitStartedRef.current) return;
    coinGoalExpiryExitStartedRef.current = true;
    setCoinGoalExitAnim(true);
    const t = window.setTimeout(() => {
      coinGoalExpiryExitStartedRef.current = false;
      lastCoinGoalHiddenAtRef.current = Date.now();
      nextCoinGoalDelayRef.current = 30000 + Math.random() * 30000;
      setCoinGoalVisible(false);
      setCoinGoalExitAnim(false);
      setCoinGoalTimeRemaining(30);
    }, COIN_GOAL_EXIT_MS);
    return () => clearTimeout(t);
  }, [coinGoalVisible, coinGoalTimeRemaining]);

  // When seed level increases: auto-level plants below seed level (with beam VFX) and bump any lower-level goals up to the new seed level.
  useEffect(() => {
    const newSeedLevel = getSeedLevelFromHighestPlant(highestPlantEver);
    if (newSeedLevel <= prevSeedLevelRef.current) return;
    prevSeedLevelRef.current = newSeedLevel;

    // 1. Auto-level plants on board that are below seed level
    setGrid((prevGrid) => {
      const cellsToUpgrade: number[] = [];
      prevGrid.forEach((cell, idx) => {
        if (cell.item && cell.item.level < newSeedLevel) cellsToUpgrade.push(idx);
      });
      if (cellsToUpgrade.length === 0) return prevGrid;
      // Spawn beams for each cell (after DOM update)
      requestAnimationFrame(() => {
        const beams: { id: string; x: number; y: number; cellWidth: number; cellHeight: number; startTime: number }[] = [];
        cellsToUpgrade.forEach((cellIdx) => {
          const hexEl = document.getElementById(`hex-${cellIdx}`);
          if (hexEl) {
            const rect = hexEl.getBoundingClientRect();
            beams.push({
              id: `seed-level-up-${cellIdx}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
              cellWidth: rect.width,
              cellHeight: rect.height,
              startTime: Date.now(),
            });
          }
        });
        if (beams.length > 0) setCellHighlightBeams((b) => [...b, ...beams]);
      });
      const newGrid = prevGrid.map((cell, idx) => {
        if (cell.item && cell.item.level < newSeedLevel) {
          return { ...cell, item: { ...cell.item, level: newSeedLevel } };
        }
        return cell;
      });
      return newGrid;
    });

    // 2. Upgrade any lower-level goals to the new seed level so they never become impossible.
    const slotsToUpgrade: number[] = [];
    goalSlots.forEach((s, i) => {
      if (s === 'green' && (goalPlantTypes[i] ?? 0) < newSeedLevel) slotsToUpgrade.push(i);
    });
    if (slotsToUpgrade.length > 0) {
      // Swap the goal icon/type but keep the required amount + remaining count the same.
      setGoalPlantTypes((prev) => {
        const next = [...prev];
        slotsToUpgrade.forEach((slotIdx) => { next[slotIdx] = newSeedLevel; });
        return next;
      });
      setDiscoveryGoalLightGreenDismissed((prev) => {
        const next = [...prev];
        slotsToUpgrade.forEach((slotIdx) => {
          next[slotIdx] = false;
        });
        return next;
      });
      setGoalDiscoveryLightGreenActive((prev) => {
        const next = [...prev];
        slotsToUpgrade.forEach((slotIdx) => {
          next[slotIdx] = false;
        });
        return next;
      });
      slotsToUpgrade.forEach((slotIdx) => {
        setGoalBounceSlots((prev) => prev.includes(slotIdx) ? prev : [...prev, slotIdx]);
        setTimeout(() => setGoalBounceSlots((b) => b.filter((i) => i !== slotIdx)), 400);
      });
    }
  }, [highestPlantEver, harvestState, playerLevel, goalSlots, goalPlantTypes, goalAmountsRequired, grid]);

  /**
   * At 100% seed progress: +1 seed; cap at storage max. Excess → surplus coin or lost.
   */
  useEffect(() => {
    if (seedProgress !== 100 || !isSeedFlashing) return;
    seedProgressRef.current = 0;
    setSeedProgress(0);
    setTimeout(() => setIsSeedFlashing(false), 300);

    const doubleSeedsLevel = seedsState?.double_seeds?.level ?? 0;
    const doubleChance = Math.min(1, doubleSeedsLevel * 0.1);
    const seedsToAdd = Math.random() < doubleChance ? 2 : 1;
    const surplusValue = getSeedSurplusValue(
      ftueSeedSurplusActivated
        ? ({ ...seedsState, seed_surplus: { level: Math.max(1, seedsState?.seed_surplus?.level ?? 0), progress: 0 } } as any)
        : seedsState,
      highestPlantEver
    );
    const maxCap = getSeedStorageMax(seedsState, unlockedBonusTierSetRef.current);

    const total = seedsInStorage + seedsToAdd;
    const capped = Math.min(maxCap, total);
    const excess = total - capped;

    setSeedsInStorage(capped);

    if (excess > 0 && surplusValue > 0) {
      const container = containerRef.current;
      const plantBtn = plantButtonRef.current;
      const walletIcon = walletIconRef.current;
      const wallet = walletRef.current;
      const walletEl = walletIcon || wallet;
      if (container && plantBtn && walletEl) {
        const scale = appScaleRef.current;
        const containerRect = container.getBoundingClientRect();
        const btnRect = plantBtn.getBoundingClientRect();
        const startX = (btnRect.left + btnRect.width / 2 - containerRect.left) / scale;
        const startY = (btnRect.top + btnRect.height / 2 - containerRect.top) / scale;
        const hoverX = startX;
        const panelHeightPx = 14;
        const offsetUp = (panelHeightPx / 2 + 4) * 1.2;
        const hoverY = (btnRect.top - containerRect.top) / scale - offsetUp;
        const panelsToAdd = Array.from({ length: excess }, (_, i) => ({
          id: `seed-surplus-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
          value: applyDoubleCoinsVisualAmount(surplusValue, activeBoostsRef.current),
          startX,
          startY,
          hoverX,
          hoverY,
          moveToWalletDelayMs: 0,
          scale: 1.5,
        }));
        setActiveCoinPanels((p) => [...p, ...panelsToAdd]);
      }
    }
  }, [seedProgress, isSeedFlashing, seedsInStorage, seedsState, seedStorageMax, ftueSeedSurplusActivated, highestPlantEver]);

  // Harvest surplus coin panels: when harvest charges overflow at 100% capacity, turn the overflow into coins.
  const spawnHarvestSurplusCoinPanels = (overflowCycles: number) => {
    if (overflowCycles <= 0) return;
    // Harvest surplus uses the same multiplier as Seed Surplus (seed_surplus upgrade).
    const surplusValue = getSeedSurplusValue(
      ftueSeedSurplusActivated
        ? ({ ...seedsState, seed_surplus: { level: Math.max(1, seedsState?.seed_surplus?.level ?? 0), progress: 0 } } as any)
        : seedsState,
      highestPlantEverRef.current
    );
    if (surplusValue <= 0) return;

    const container = containerRef.current;
    const harvestBtn = harvestButtonRef.current;
    const walletIcon = walletIconRef.current;
    const wallet = walletRef.current;
    const walletEl = walletIcon || wallet;

    if (!container || !harvestBtn || !walletEl) return;

    const scale = appScaleRef.current;
    const containerRect = container.getBoundingClientRect();
    const btnRect = harvestBtn.getBoundingClientRect();
    const startX = (btnRect.left + btnRect.width / 2 - containerRect.left) / scale;
    const startY = (btnRect.top + btnRect.height / 2 - containerRect.top) / scale;
    const hoverX = startX;
    const panelHeightPx = 14;
    const offsetUp = (panelHeightPx / 2 + 4) * 1.2;
    const hoverY = (btnRect.top - containerRect.top) / scale - offsetUp;

    const panelsToAdd = Array.from({ length: overflowCycles }, (_, i) => ({
      id: `harvest-surplus-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
      value: applyDoubleCoinsVisualAmount(surplusValue, activeBoostsRef.current),
      startX,
      startY,
      hoverX,
      hoverY,
      moveToWalletDelayMs: 0,
      scale: 1.5,
    }));

    setActiveCoinPanels((p) => [...p, ...panelsToAdd]);
  };

  const harvestProgressRef = useRef<number>(0);
  const harvestTapZoomRef = useRef<{ start: number; end: number; startTime: number; duration: number } | null>(null);
  const [harvestTapZoomTrigger, setHarvestTapZoomTrigger] = useState(0);
  const harvestSpeedLevel = getHarvestSpeedLevel(cropsState);
  const lastHarvestProgressTimeRef = useRef<number>(0);
  const harvestRaf60LastTickRef = useRef<number>(0);

  // Harvest auto-progress (Harvest Speed + Rapid Harvest); at 100% +1 charge (waste if full), reset bar — like seeds production
  useEffect(() => {
    if (isLoading) return;
    const hasRapidHarvestBoost = activeBoosts.some(b => b.offerId === 'rapid_harvest');
    const perMinute = getHarvestRechargePerMinute(harvestSpeedLevel, unlockedBonusTierSet, hasRapidHarvestBoost);
    lastHarvestProgressTimeRef.current = Date.now();
    let rafId: number;
    const percentPerMs = (perMinute * 100) / (60 * 1000);
    const tick = () => {
      if (harvestTapZoomRef.current) {
        lastHarvestProgressTimeRef.current = Date.now();
        rafId = scheduleNextFrame(tick);
        return;
      }
      // FTUE 5–8 + gap before FTUE 7: harvest in free mode – don't advance progress
      if (activeFtueStage === 'first_harvest' || activeFtueStage === 'first_goal_collect' || activeFtueStage === 'first_more_orders' || activeFtueStage === 'first_harvest_multi' || ftue7Scheduled) {
        rafId = scheduleNextFrame(tick);
        return;
      }
      const n = getTickCount60(harvestRaf60LastTickRef);
      if (n === 0) {
        rafId = scheduleNextFrame(tick);
        return;
      }
      const deltaMs = Math.min(n * TARGET_FRAME_MS, 50);
      let next = harvestProgressRef.current + deltaMs * percentPerMs;
      let cycled = false;
      let overflowCycles = 0;
      let c = harvestChargesRef.current;
      while (next >= 100) {
        next -= 100;
        cycled = true;
        if (c < harvestChargesMaxRef.current) {
          c++;
        } else {
          overflowCycles++;
        }
        setHarvestBounceTrigger((t) => t + 1);
      }
      harvestProgressRef.current = next;
      if (cycled) setHarvestProgress(next);
      if (cycled) {
        harvestChargesRef.current = c;
        setHarvestCharges(c);
      }
      if (overflowCycles > 0) spawnHarvestSurplusCoinPanels(overflowCycles);
      rafId = scheduleNextFrame(tick);
    };
    rafId = scheduleNextFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [harvestSpeedLevel, isLoading, activeBoosts, activeFtueStage, ftue7Scheduled, ftueHarvestSurplusActivated, ftueSeedSurplusActivated, seedsState, unlockedBonusTierSet]);

  // Harvest tap zoom: TAP_BAR_PERCENT per tap when no charges (fast smooth zoom)
  useEffect(() => {
    const zoom = harvestTapZoomRef.current;
    if (!zoom) return;
    let rafId: number;
    const durationMs = 100;
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
    const tick = () => {
      const zoom = harvestTapZoomRef.current;
      if (!zoom) return;
      const elapsed = Date.now() - zoom.startTime;
      const t = Math.min(1, elapsed / durationMs);
      const alpha = easeOutCubic(t);
      const value = zoom.start + (zoom.end - zoom.start) * alpha;
      harvestProgressRef.current = value;
      if (t >= 1) {
        harvestProgressRef.current = zoom.end;
        harvestTapZoomRef.current = null;
        if (zoom.end >= 100) {
          let p = zoom.end;
          let c = harvestChargesRef.current;
          let overflowCycles = 0;
          while (p >= 100) {
            p -= 100;
            if (c < harvestChargesMaxRef.current) c++;
            else overflowCycles++;
          }
          harvestProgressRef.current = p;
          setHarvestProgress(p);
          harvestChargesRef.current = c;
          setHarvestCharges(c);
          setHarvestBounceTrigger((t) => t + 1);
          if (overflowCycles > 0) {
            spawnHarvestSurplusCoinPanels(overflowCycles);
          }
        }
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [harvestTapZoomTrigger, ftueHarvestSurplusActivated, ftueSeedSurplusActivated, seedsState]);

  // Leaf burst when harvest gains first charge (button turns white)
  const prevHarvestChargesRef = useRef(harvestCharges);
  useEffect(() => {
    const prev = prevHarvestChargesRef.current;
    prevHarvestChargesRef.current = harvestCharges;
    if (prev === 0 && harvestCharges > 0 && harvestButtonRef.current && !getPerformanceMode()) {
      const rect = harvestButtonRef.current.getBoundingClientRect();
      spawnButtonLeafBurst({
        id: `harvest-${Date.now()}`,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        startTime: Date.now()
      });
    }
  }, [harvestCharges]);

  // Helper function to trigger seed button leaf burst (called when shooting a seed)
  const triggerSeedButtonLeafBurst = useCallback(() => {
    if (plantButtonRef.current && !getPerformanceMode()) {
      const rect = plantButtonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      spawnButtonLeafBurst({
        id: `seed-${Date.now()}`,
        x: centerX,
        y: centerY,
        startTime: Date.now()
      });
    }
  }, []);

  const triggerHarvestButtonLeafBurst = useCallback(() => {
    if (harvestButtonRef.current && !getPerformanceMode()) {
      const rect = harvestButtonRef.current.getBoundingClientRect();
      spawnButtonLeafBurst({
        id: `harvest-tap-${Date.now()}`,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        startTime: Date.now()
      });
    }
  }, []);

  const spawnCropAt = useCallback((index: number, plantLevel: number = 1) => {
    setGrid(prev => {
      const newGrid = [...prev];
      if (newGrid[index] && newGrid[index].item === null) {
        recentSeedLandTimesRef.current.set(index, Date.now());
        newGrid[index] = {
          ...newGrid[index],
          item: {
            id: Math.random().toString(36).substr(2, 9),
            level: plantLevel,
            type: 'CROP'
          }
        };
      }
      return newGrid;
    });
    setImpactCellIdx(index);
    setTimeout(() => setImpactCellIdx(null), 500);
  }, []);

  const flushPendingProjectileCropSpawns = useCallback(() => {
    projectileCropSpawnFlushScheduledRef.current = false;
    const pending = pendingProjectileCropSpawnsRef.current;
    if (pending.size === 0) return;
    const entries = Array.from(pending.entries());
    pending.clear();
    setGrid((prev) => {
      let next = [...prev];
      let changed = false;
      for (const [index, plantLevel] of entries) {
        const cell = next[index];
        if (cell && cell.item === null) {
          playSfx(SFX_IDS.gameplayPlantSpawn);
          recentSeedLandTimesRef.current.set(index, Date.now());
          next[index] = {
            ...cell,
            item: {
              id: Math.random().toString(36).slice(2, 11),
              level: plantLevel,
              type: 'CROP',
            },
          };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    const lastIdx = entries[entries.length - 1]![0];
    setImpactCellIdx(lastIdx);
    setTimeout(() => setImpactCellIdx(null), 500);
    scheduleAutoMergeRecheckRef.current(AUTO_MERGE_POST_SETTLE_MS);
  }, []);

  const queueSpawnCropFromProjectile = useCallback(
    (index: number, plantLevel: number) => {
      pendingProjectileCropSpawnsRef.current.set(index, plantLevel);
      if (!projectileCropSpawnFlushScheduledRef.current) {
        projectileCropSpawnFlushScheduledRef.current = true;
        queueMicrotask(() => {
          flushPendingProjectileCropSpawns();
        });
      }
    },
    [flushPendingProjectileCropSpawns]
  );

  const applyWildGrowthSpawnAtCell = useCallback((targetIdx: number, plantLevel: number) => {
    playSfx(SFX_IDS.gameplayPlantSpawn);
    spawnCropAt(targetIdx, plantLevel);
    queueMicrotask(() => scheduleAutoMergeRecheckRef.current(AUTO_MERGE_POST_SETTLE_MS));
    requestAnimationFrame(() => {
      const hexEl = document.getElementById(`hex-${targetIdx}`);
      if (!hexEl) return;
      const r = hexEl.getBoundingClientRect();
      if (!getPerformanceMode()) {
        spawnLeafBurstSmall({
            id: `wild-growth-burst-${targetIdx}-${Date.now()}`,
            x: r.left + r.width / 2,
            y: r.top + r.height / 2,
            startTime: Date.now(),
          });
      }
      setCellHighlightBeams((prev) => [
        ...prev,
        {
          id: `wild-growth-beam-${targetIdx}-${Date.now()}`,
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
          cellWidth: r.width,
          cellHeight: r.height,
          startTime: Date.now(),
        },
      ]);
    });
  }, [spawnCropAt]);

  useEffect(() => {
    applyWildGrowthSpawnAtCellRef.current = applyWildGrowthSpawnAtCell;
  }, [applyWildGrowthSpawnAtCell]);

  const handleTabChange = (tab: TabType) => {
    if (activeFtueStage === 'first_upgrade' && ftue10Phase === 'point_orders' && tab === 'SEEDS') {
      playSfx(SFX_IDS.uiConfirmNormal);
      setIsExpanded(true);
      setFtue10Phase('panel_open_orders');
      return;
    }
    if (activeFtueStage === 'first_upgrade' && ftue10Phase === 'panel_open_orders' && tab === 'CROPS') {
      playSfx(SFX_IDS.uiConfirmNormal);
      setActiveTab('CROPS');
      setFtue10Phase('finger');
      setFtue10GreenFlashUpgradeId('harvest_speed');
      return;
    }
    setActiveTab(tab);
    if (!ftueUpgradePanelVisible) return; // FTUE: panel hidden until we reveal it
    playSfx(SFX_IDS.uiConfirmNormal);
    setIsExpanded(true);
  };

  // When upgrade panel is hidden by FTUE, keep it collapsed so state is correct when we reveal later
  useEffect(() => {
    if (!ftueUpgradePanelVisible && isExpanded) setIsExpanded(false);
  }, [ftueUpgradePanelVisible, isExpanded]);

  // Handle tap on locked cell: open CROPS tab (opens the upgrade panel). Set to false to disable.
  const ENABLE_LOCKED_CELL_TAP = false;
  const handleLockedCellTap = useCallback(() => {
    if (!ftueUpgradePanelVisible) return;
    setActiveTab('CROPS');
    setIsExpanded(true);
  }, [ftueUpgradePanelVisible]);

  // Unlock a specific locked cell (used by plot_expansion upgrade particle impact).
  const unlockCellAt = useCallback((cellIdx: number) => {
    const cell = gridRef.current[cellIdx];
    if (!cell?.locked) return;

    setUnlockingCellIndices((prev) => (prev.includes(cellIdx) ? prev : [...prev, cellIdx]));

    const hexEl = document.getElementById(`hex-${cellIdx}`);
    if (hexEl) {
      const rect = hexEl.getBoundingClientRect();
      spawnUnlockBurst({
          id: `unlock-${cellIdx}-${Date.now()}`,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          startTime: Date.now(),
        });
      setCellHighlightBeams((prev) => [
        ...prev,
        {
          id: `unlock-beam-${cellIdx}-${Date.now()}`,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          cellWidth: rect.width,
          cellHeight: rect.height,
          startTime: Date.now(),
        },
      ]);
    }

    setTimeout(() => {
      setGrid((prev) => {
        const newGrid = [...prev];
        if (!newGrid[cellIdx]?.locked) return prev;
        newGrid[cellIdx] = { ...newGrid[cellIdx], locked: false };
        return newGrid;
      });
      setUnlockingCellIndices((prev) => prev.filter((idx) => idx !== cellIdx));
    }, 200);
  }, []);

  /** Wild Growth upgrade preview: glow only (no spawn). */
  const showWildGrowthPreviewGlow = useCallback((targetIdx: number) => {
    requestAnimationFrame(() => {
      const hexEl = document.getElementById(`hex-${targetIdx}`);
      if (!hexEl) return;
      const r = hexEl.getBoundingClientRect();
      setCellHighlightBeams((prev) => [
        ...prev,
        {
          id: `wild-growth-preview-${targetIdx}-${Date.now()}`,
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
          cellWidth: r.width,
          cellHeight: r.height,
          startTime: Date.now(),
        },
      ]);
    });
  }, []);

  // Handle fertilizing a cell when fertile_soil is upgraded
  const handleFertilizeCell = useCallback(() => {
    // Find all fertilizable cell indices (unlocked and not already fertile)
    // Prioritize empty cells
    const fertilizableEmptyIndices = grid.map((cell, idx) => 
      !cell.locked && !cell.fertile && !cell.item ? idx : -1
    ).filter(idx => idx !== -1);
    
    const fertilizableWithPlantIndices = grid.map((cell, idx) => 
      !cell.locked && !cell.fertile && cell.item ? idx : -1
    ).filter(idx => idx !== -1);
    
    // Try empty cells first, then cells with plants
    let targetIndices = fertilizableEmptyIndices.length > 0 
      ? fertilizableEmptyIndices 
      : fertilizableWithPlantIndices;
    
    if (targetIndices.length === 0) return;
    
    // Pick a random fertilizable cell
    const randomIdx = targetIndices[Math.floor(Math.random() * targetIndices.length)];
    
    // Start fertilize animation
    setFertilizingCellIndices(prev => [...prev, randomIdx]);
    
    // Spawn yellow highlight beam VFX at the cell
    const hexEl = document.getElementById(`hex-${randomIdx}`);
    if (hexEl) {
      const rect = hexEl.getBoundingClientRect();
      setCellHighlightBeams(prev => [
        ...prev,
        {
          id: `fertilize-${randomIdx}-${Date.now()}`,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          cellWidth: rect.width,
          cellHeight: rect.height,
          startTime: Date.now(),
        },
      ]);
    }
    
    // After animation, mark the cell as fertile (sync with beam animation ~200ms for the sprite swap)
    setTimeout(() => {
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid[randomIdx] = { ...newGrid[randomIdx], fertile: true };
        return newGrid;
      });
      setFertilizingCellIndices(prev => prev.filter(idx => idx !== randomIdx));
    }, 200);
  }, [grid]);

  const showSideButtonToast = (anchor: 'seed' | 'harvest', message: string) => {
    if (sideButtonToastTimeoutRef.current != null) {
      clearTimeout(sideButtonToastTimeoutRef.current);
      sideButtonToastTimeoutRef.current = null;
    }
    const id = ++sideButtonToastIdRef.current;
    setSideButtonToast({ anchor, message, id });
    // Match .side-action-toast-text duration in index.html (1.15s) + small buffer
    sideButtonToastTimeoutRef.current = window.setTimeout(() => {
      setSideButtonToast(null);
      sideButtonToastTimeoutRef.current = null;
    }, 1250);
  };

  /** True if harvest can route crops to goals (or surplus sales is active). */
  const computeCanSpendHarvestCharge = (): boolean => {
    if (isSurplusSalesUnlocked(harvestState, playerLevel)) return true;
    for (let i = 0; i < goalSlots.length; i++) {
      if (goalSlots[i] !== 'green' || (goalCounts[i] ?? 0) <= 0) continue;
      const inFlight = goalInFlightHarvestBySlotRef.current[i] ?? 0;
      if ((goalCounts[i] ?? 0) - inFlight <= 0) continue;
      const pt = goalPlantTypes[i] ?? 0;
      if (grid.some((cell) => cell.item && cell.item.level === pt)) return true;
    }
    return false;
  };

  const handlePlantClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // FTUE_2: must tap exactly 2 times to plant 2 seeds; block 3rd tap (ref so rapid taps can't slip through before state updates)
    if (activeFtueStage === 'seed_tap' && (ftue2SeedFireCount >= 2 || ftue2SeedsBlockedRef.current)) return;
    // FTUE_3: seeds button blocked during merge-drag step
    if (activeFtueStage === 'merge_drag') return;
    // FTUE_7→8: block extra seed taps while the "more orders" overlay is fading out (stage may already be first_harvest_multi)
    if (ftue7FadingOut) return;
    // FTUE_7: must tap exactly 2 times; block 3rd tap
    if (activeFtueStage === 'first_more_orders' && ftue7SeedFireCount >= 2) return;

    if (
      activeFtueStage === 'seed_tap' ||
      activeFtueStage === 'first_more_orders' ||
      activeFtueStage === 'first_upgrade'
    ) {
      playSfx(SFX_IDS.uiConfirmNormal);
    }

    // When white (seeds in storage) or FTUE 7 (free 2 seeds): only fire seed, no progress
    if (seedsInStorage > 0 || activeFtueStage === 'first_more_orders') {
      // Get cells that have projectiles in flight (reserved)
      const reservedCells = new Set(activeProjectiles.map(p => p.targetIdx));
      
      // Only target unlocked empty cells that don't have incoming projectiles
      const emptyIndices = grid
        .map((cell, idx) => (cell.item === null && !cell.locked && !reservedCells.has(idx) ? idx : null))
        .filter((idx): idx is number => idx !== null);
      if (emptyIndices.length > 0) {
        // FTUE_2: first seed → cell 4, second seed → cell 13. Pick by which is still empty (avoids stale state on second tap).
        let targetIdx: number;
        if (activeFtueStage === 'seed_tap') {
          if (emptyIndices.includes(FTUE_2_SEED_CELL_A)) targetIdx = FTUE_2_SEED_CELL_A;
          else if (emptyIndices.includes(FTUE_2_SEED_CELL_B)) targetIdx = FTUE_2_SEED_CELL_B;
          else targetIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        } else if (activeFtueStage === 'first_more_orders') {
          targetIdx = ftue7SeedFireCount === 0 ? 4 : 8;
        } else {
          targetIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        }
        // First projectile: always standard tier from current seed level.
        spawnProjectile(targetIdx, seedLevel);
        playSfx(SFX_IDS.gameplaySeed);
        if (!seedsFreeMode) setSeedsInStorage((prev) => Math.max(0, prev - 1));
        triggerSeedButtonLeafBurst();
        // FTUE_2: count this seed; after 2, start fade out
        if (activeFtueStage === 'seed_tap') {
          setFtue2SeedFireCount((c) => {
            const next = c + 1;
            if (next >= 2) {
              ftue2SeedsBlockedRef.current = true;
              setFtue2FadingOut(true);
              setTimeout(() => setActiveFtueStage('merge_drag'), 400); // Delay before FTUE_3 (match FTUE 2 fade-out so unblock is immediate)
            }
            return next;
          });
        }
        // FTUE_7: count this seed; after 2, start fade out
        if (activeFtueStage === 'first_more_orders') {
          setFtue7SeedFireCount((c) => {
            const next = c + 1;
            if (next >= 2) {
              setFtue7FadingOut(true);
              // 0.5s beat after second seed, then FTUE 8 (still overlaps FTUE 7 fade for a smooth handoff)
              setTimeout(() => setActiveFtueStage('first_harvest_multi'), 500);
            }
            return next;
          });
        }

        // Double Seeds + Lucky Seed: independent rolls. Both can proc → 3 projectiles (2× standard + 1× seedLevel+1 bonus).
        const skipExtraSeeds = activeFtueStage === 'seed_tap' || activeFtueStage === 'first_more_orders';
        const doubleSeedsLevel = seedsState?.double_seeds?.level ?? 0;
        const doubleChancePct = skipExtraSeeds ? 0 : Math.min(100, doubleSeedsLevel * 10);
        const luckyChancePct = skipExtraSeeds ? 0 : getBonusSeedChance(seedsState);
        const doubleProcs = doubleChancePct > 0 && Math.random() * 100 < doubleChancePct;
        const luckyProcs = luckyChancePct > 0 && Math.random() * 100 < luckyChancePct;

        const usedTargets = new Set<number>([targetIdx]);
        const pickNextTarget = (): number | null => {
          const cand = emptyIndices.filter((i) => !usedTargets.has(i));
          if (cand.length === 0) return null;
          const pick = cand[Math.floor(Math.random() * cand.length)];
          usedTargets.add(pick);
          return pick;
        };

        let staggerMs = 50;
        if (doubleProcs) {
          const t2 = pickNextTarget();
          if (t2 != null) {
            window.setTimeout(() => spawnProjectile(t2, seedLevel), staggerMs);
            staggerMs += 50;
          }
        }
        if (luckyProcs) {
          const bonusLevel = Math.min(MAX_PLANT_TIER, Math.max(1, seedLevel + 1));
          const t3 = pickNextTarget();
          if (t3 != null) {
            window.setTimeout(() => spawnProjectile(t3, bonusLevel, false, true), staggerMs);
          }
        }
      } else {
        // Has charges but nowhere valid to spawn (board/reservations full) → same feedback as no charges.
        playSfx(SFX_IDS.gameplayNoCharges);
        showSideButtonToast('seed', 'No space\nin garden');
      }
      return;
    }

    if (isSeedFlashing) return;

    // FTUE 1–4 free mode: progress bar doesn't move, don't add progress on tap
    if (seedsFreeMode) return;
    if (seedsInStorage <= 0) playSfx(SFX_IDS.gameplayNoCharges);

    // Seed button: TAP_BAR_PERCENT when empty (no seeds to fire)
    const tapPercent = TAP_BAR_PERCENT;
    const start = Math.max(0, seedProgressRef.current);
    const totalAfterTap = start + tapPercent;
    
    if (totalAfterTap > 100) {
      // Tap goes past 100%: add 1 seed (cap storage max). If already full, excess → surplus coin or lost.
      const remainder = totalAfterTap - 100;
      const surplusValue = getSeedSurplusValue(
        ftueSeedSurplusActivated
          ? ({ ...seedsState, seed_surplus: { level: Math.max(1, seedsState?.seed_surplus?.level ?? 0), progress: 0 } } as any)
          : seedsState,
        highestPlantEverRef.current
      );
      if (seedsInStorage >= seedStorageMax && surplusValue > 0) {
        const container = containerRef.current;
        const plantBtn = plantButtonRef.current;
        const walletIcon = walletIconRef.current;
        const wallet = walletRef.current;
        const walletEl = walletIcon || wallet;
        if (container && plantBtn && walletEl) {
          const scale = appScaleRef.current;
          const containerRect = container.getBoundingClientRect();
          const btnRect = plantBtn.getBoundingClientRect();
          const startX = (btnRect.left + btnRect.width / 2 - containerRect.left) / scale;
          const startY = (btnRect.top + btnRect.height / 2 - containerRect.top) / scale;
          const panelHeightPx = 14;
          const offsetUp = (panelHeightPx / 2 + 4) * 1.2;
          const hoverY = (btnRect.top - containerRect.top) / scale - offsetUp;
          setActiveCoinPanels((p) => [...p, { id: `seed-surplus-tap-${Date.now()}`, value: applyDoubleCoinsVisualAmount(surplusValue, activeBoostsRef.current), startX, startY, hoverX: startX, hoverY, moveToWalletDelayMs: 0, scale: 1.5 }]);
        }
      }
      setSeedsInStorage((prev) => Math.min(seedStorageMax, prev + 1));
      seedProgressRef.current = 0;
      setSeedProgress(0);
      setIsSeedFlashing(false);
      setSeedBounceTrigger((t) => t + 1);
      tapZoomRef.current = { start: 0, end: remainder, startTime: Date.now(), duration: 100 };
      setTapZoomTrigger((n) => n + 1);
    } else {
      // Normal tap: zoom from start to end (capped at 100%)
      const end = Math.min(100, totalAfterTap);
      tapZoomRef.current = { start, end, startTime: Date.now(), duration: 100 };
      setTapZoomTrigger((n) => n + 1);
    }

  };

  const calculateFarmValue = useCallback(() => {
    return grid.reduce((acc, cell) => {
      if (!cell.item) return acc;
      return acc + Math.pow(3, cell.item.level - 1) * 25;
    }, 0);
  }, [grid]);

  const handleHarvestClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    completeSoftHarvestNudge();
    if (harvestTapZoomRef.current) return;

    if (
      activeFtueStage === 'first_harvest' ||
      activeFtueStage === 'first_harvest_multi' ||
      activeFtueStage === 'first_upgrade'
    ) {
      playSfx(SFX_IDS.uiConfirmNormal);
    }

    // FTUE 5 free mode: harvest works but doesn't consume charges; no progress bar fill
    if (harvestFreeMode) {
      const hasPlant = grid.some((c) => c.item);
      if (!hasPlant) {
        playSfx(SFX_IDS.gameplayNoCharges);
        return;
      }
      if (!computeCanSpendHarvestCharge()) {
        playSfx(SFX_IDS.gameplayNoCharges);
        return;
      }
      playSfx(SFX_IDS.gameplayHarvest);
      performHarvest(0, '');
      triggerHarvestButtonLeafBurst();
      setHarvestBounceTrigger((t) => t + 1);
      return;
    }

    if (harvestCharges > 0) {
      const hasPlant = grid.some((c) => c.item);
      if (!hasPlant) {
        playSfx(SFX_IDS.gameplayNoCharges);
        showSideButtonToast('harvest', "Plants don't\nmatch orders");
        return;
      }
      if (!computeCanSpendHarvestCharge()) {
        playSfx(SFX_IDS.gameplayNoCharges);
        showSideButtonToast('harvest', "Plants don't\nmatch orders");
        return;
      }
      playSfx(SFX_IDS.gameplayHarvest);
      performHarvest(0, '');
      triggerHarvestButtonLeafBurst();
      setHarvestBounceTrigger((t) => t + 1);
      setHarvestCharges((c) => Math.max(0, c - 1));
      return;
    }
    playSfx(SFX_IDS.gameplayNoCharges);

    const tapPercent = TAP_BAR_PERCENT;
    const current = harvestProgressRef.current;
    const totalAfter = current + tapPercent;
    if (totalAfter >= 100) {
      const remainder = totalAfter - 100;
      let c = harvestChargesRef.current;
      if (c < harvestChargesMaxRef.current) c++;
      harvestProgressRef.current = remainder;
      setHarvestProgress(remainder);
      setHarvestCharges(c);
      setHarvestBounceTrigger((t) => t + 1);
      harvestTapZoomRef.current = { start: 0, end: remainder, startTime: Date.now(), duration: 100 };
      setHarvestTapZoomTrigger((t) => t + 1);
    } else {
      harvestTapZoomRef.current = { start: current, end: totalAfter, startTime: Date.now(), duration: 100 };
      setHarvestTapZoomTrigger((t) => t + 1);
    }
  };

  // Helper: get hex neighbors in axial coordinates
  const getHexNeighborCoords = (q: number, r: number): [number, number][] => {
    return [
      [q + 1, r], [q - 1, r],
      [q, r + 1], [q, r - 1],
      [q + 1, r - 1], [q - 1, r + 1]
    ];
  };

  // Helper: check if a cell has an adjacent cell with the same level plant
  const hasAdjacentSameLevel = (cellIdx: number, gridSnapshot: BoardCell[]): boolean => {
    const cell = gridSnapshot[cellIdx];
    if (!cell.item) return false;
    const neighbors = getHexNeighborCoords(cell.q, cell.r);
    return gridSnapshot.some((other, otherIdx) => {
      if (otherIdx === cellIdx || !other.item) return false;
      return neighbors.some(([nq, nr]) => other.q === nq && other.r === nr && other.item!.level === cell.item!.level);
    });
  };

  // Helper: get adjacent cell indices for a given cell
  const getAdjacentCellIndices = (cellIdx: number, gridSnapshot: BoardCell[]): number[] => {
    const cell = gridSnapshot[cellIdx];
    if (!cell) return [];
    const neighbors = getHexNeighborCoords(cell.q, cell.r);
    const adjacentIndices: number[] = [];
    gridSnapshot.forEach((other, otherIdx) => {
      if (otherIdx === cellIdx) return;
      if (neighbors.some(([nq, nr]) => other.q === nq && other.r === nr)) {
        adjacentIndices.push(otherIdx);
      }
    });
    return adjacentIndices;
  };

  // Perform a single harvest
  // Plant harvest: if goal exists for plant level (1-5 → slot 0-4), spawn plant panel to goal. Else spawn coin panel.
  const performHarvest = useCallback((delayMs: number = 0, idSuffix: string = '') => {
    const container = containerRef.current;
    const wallet = walletRef.current;
    const walletIcon = walletIconRef.current;
    const walletEl = walletIcon || wallet;
    const harvestCellIndices: number[] = [];

    if (container && walletEl) {
      const scale = appScaleRef.current;
      const containerRect = container.getBoundingClientRect();
      const walletRect = walletEl.getBoundingClientRect();
      const walletCenterX = (walletRect.left + walletRect.width / 2 - containerRect.left) / scale;
      const walletCenterY = (walletRect.top + walletRect.height / 2 - containerRect.top) / scale;

      const coinPanelsWithDist: { panel: CoinPanelData; dist: number }[] = [];
      const plantPanelsWithDist: { panel: PlantPanelData; dist: number }[] = [];

      const cropYieldPerHarvest = getCropYieldPerHarvest(cropsState);
      const hasDoubleHarvestBoost = activeBoosts.some(b => b.offerId === 'double_harvest');
      const effectiveCropYield = hasDoubleHarvestBoost ? cropYieldPerHarvest * 2 : cropYieldPerHarvest;

      const getGoalIconCenter = (slotIdx: number): { x: number; y: number } | null => {
        const iconEl = goalIconRefs[slotIdx]?.current;
        if (!iconEl) return null;
        const r = iconEl.getBoundingClientRect();
        return {
          x: (r.left + r.width / 2 - containerRect.left) / scale,
          y: (r.top + r.height / 2 - containerRect.top) / scale,
        };
      };

      const surplusMultiplier = getSurplusSalesMultiplier(harvestState);
      const surplusSalesUnlocked = isSurplusSalesUnlocked(harvestState, playerLevel);
      const allocated: Record<number, number> = {}; // per-slot allocation within this harvest
      // Snapshot so one performHarvest pass doesn't double-count panels we spawn in this same pass
      const inFlightAtStart: Record<number, number> = { ...goalInFlightHarvestBySlotRef.current };
      grid.forEach((cell, cellIdx) => {
        if (!cell.item) return;
        const level = cell.item.level;
        const slotIdx = level >= 1 && level <= MAX_PLANT_TIER
          ? (() => {
              let best = -1;
              let minRemaining = Infinity;
              goalPlantTypes.forEach((pt, i) => {
                if (pt !== level || goalSlots[i] !== 'green' || (goalCounts[i] ?? 0) <= 0 || goalsPendingCompletionRef.current.has(i)) return;
                const remaining = (goalCounts[i] ?? 0) - (inFlightAtStart[i] ?? 0) - (allocated[i] ?? 0);
                if (remaining > 0 && remaining < minRemaining) {
                  minRemaining = remaining;
                  best = i;
                }
              });
              return best;
            })()
          : -1;
        const hasGoalForPlant = slotIdx >= 0;
        if (!hasGoalForPlant && !surplusSalesUnlocked) return;
        harvestCellIndices.push(cellIdx);

        const hexEl = document.getElementById(`hex-${cellIdx}`);
        if (!hexEl) return;
        const hexRect = hexEl.getBoundingClientRect();
        const startX = (hexRect.left + hexRect.width / 2 - containerRect.left) / scale;
        const startY = (hexRect.top + hexRect.height / 2 - containerRect.top) / scale;
        const hoverX = startX;
        const hexTopY = (hexRect.top - containerRect.top) / scale;
        const panelHeightPx = 14;
        const offsetUp = (panelHeightPx / 2 + 4) * 0.8;
        const hoverY = hexTopY - offsetUp;

        if (hasGoalForPlant) {
          // Fertile soil should yield double crops when harvesting (and stack on top of rewards like double_harvest).
          const cellCropYield = effectiveCropYield * (cell.fertile ? 2 : 1);
          allocated[slotIdx] = (allocated[slotIdx] ?? 0) + cellCropYield;
          goalInFlightHarvestBySlotRef.current[slotIdx] = (goalInFlightHarvestBySlotRef.current[slotIdx] ?? 0) + cellCropYield;
          if ((goalCounts[slotIdx] ?? 0) - (inFlightAtStart[slotIdx] ?? 0) - (allocated[slotIdx] ?? 0) <= 0) {
            goalsPendingCompletionRef.current.add(slotIdx);
          }
          const goalCenter = getGoalIconCenter(slotIdx);
          const dist = goalCenter ? Math.hypot(hoverX - goalCenter.x, hoverY - goalCenter.y) : 0;
          const plantLevel = goalPlantTypes[slotIdx] ?? slotIdx + 1;
          plantPanelsWithDist.push({
            dist,
            panel: {
              id: `plant-${cellIdx}-${Date.now()}-${Math.random().toString(36).slice(2)}${idSuffix}`,
              goalSlotIdx: slotIdx,
              iconSrc: getGoalIconForPlantLevel(plantLevel),
              harvestAmount: cellCropYield,
              startX,
              startY,
              hoverX,
              hoverY,
              moveToTargetDelayMs: delayMs,
              ...(activeFtueStage === 'first_harvest' ? { visualScale: 2 } : {}),
            },
          });
        } else {
          const baseValue = getCoinValueForLevel(level);
          let value = baseValue;
          if (cell.fertile) value *= 2;
          value = Math.floor(value * surplusMultiplier);
          if (hasDoubleHarvestBoost) value *= 2;
          value = applyDoubleCoinsVisualAmount(value, activeBoostsRef.current);
          const dist = Math.hypot(hoverX - walletCenterX, hoverY - walletCenterY);
          coinPanelsWithDist.push({
            dist,
            panel: {
              id: `coin-${cellIdx}-${Date.now()}-${Math.random().toString(36).slice(2)}${idSuffix}`,
              value,
              startX,
              startY,
              hoverX,
              hoverY,
              moveToWalletDelayMs: delayMs,
            },
          });
        }
      });

      if (harvestCellIndices.length >= 3) {
        applyDailyTaskRowsUpdate(
          recordDailyTaskHarvestThreeCells(getDailyTasksCtx(), harvestCellIndices.length),
        );
      }

      setTimeout(() => {
        setHarvestBounceCellIndices(harvestCellIndices);
        setTimeout(() => setHarvestBounceCellIndices([]), 250);

        // Batch leaf bursts; when many harvests reduce count + particles for FPS. Performance mode: stricter limits.
        const now = Date.now();
        const harvestCount = harvestCellIndices.length;
        const perfMode = getPerformanceMode();
        const manyHarvests = perfMode ? harvestCount > 4 : harvestCount > 10;
        const veryManyHarvests = perfMode ? harvestCount > 8 : harvestCount > 15;
        const cellIndicesToBurst = veryManyHarvests
          ? harvestCellIndices.filter((_, i) => i % (perfMode ? 4 : 3) === 0)
          : harvestCellIndices;
        const newBursts = cellIndicesToBurst
          .map((cellIdx) => {
            const hexEl = document.getElementById(`hex-${cellIdx}`);
            if (!hexEl) return null;
            const r = hexEl.getBoundingClientRect();
            return {
              id: `harvest-${cellIdx}-${now}-${Math.random().toString(36).slice(2)}${idSuffix}`,
              x: r.left + r.width / 2,
              y: r.top + r.height / 2,
              startTime: now,
              ...(manyHarvests ? { particleCount: veryManyHarvests || perfMode ? 1 : 2 } : {}),
            };
          })
          .filter((b): b is NonNullable<typeof b> => b !== null);
        if (newBursts.length > 0 && !getPerformanceMode()) {
          spawnLeafBurstsSmallMany(newBursts);
        }

        if (coinPanelsWithDist.length > 0) {
          const N = coinPanelsWithDist.length;
          const minDist = Math.min(...coinPanelsWithDist.map((x) => x.dist));
          const maxDist = Math.max(...coinPanelsWithDist.map((x) => x.dist));
          const range = maxDist - minDist || 1;
          const maxStaggerMs = N <= 1 ? 0 : Math.min(300, 300 * (N - 1) / 4);
          const panels: CoinPanelData[] = coinPanelsWithDist.map(({ panel, dist }) => ({
            ...panel,
            moveToWalletDelayMs: panel.moveToWalletDelayMs + ((dist - minDist) / range) * maxStaggerMs,
          }));
          setActiveCoinPanels(prev => [...prev, ...panels]);
        }

        if (plantPanelsWithDist.length > 0) {
          const N = plantPanelsWithDist.length;
          const minDist = Math.min(...plantPanelsWithDist.map((x) => x.dist));
          const maxDist = Math.max(...plantPanelsWithDist.map((x) => x.dist));
          const range = maxDist - minDist || 1;
          const maxStaggerMs = N <= 1 ? 0 : Math.min(300, 300 * (N - 1) / 4);
          const panels: PlantPanelData[] = plantPanelsWithDist.map(({ panel, dist }) => ({
            ...panel,
            moveToTargetDelayMs: panel.moveToTargetDelayMs + ((dist - minDist) / range) * maxStaggerMs,
          }));
          setActivePlantPanels(prev => [...prev, ...panels]);
        }
      }, delayMs);
    }
  }, [grid, cropsState, goalSlots, goalCounts, goalPlantTypes, harvestState, playerLevel, activeFtueStage, activeBoosts, applyDailyTaskRowsUpdate]);

  // Perform merge harvest: roll chance per adjacent cell to harvest (spawn coin or plant panel) without removing plant
  const performMergeHarvest = useCallback((centerCellIdx: number, chancePercent: number, excludeCellIdx?: number) => {
    const container = containerRef.current;
    const wallet = walletRef.current;
    const walletIcon = walletIconRef.current;
    const walletEl = walletIcon || wallet;

    if (!container || !walletEl) return;

    const adjacentIndices = getAdjacentCellIndices(centerCellIdx, grid);
    const adjacentWithCrops = adjacentIndices.filter(idx => idx !== excludeCellIdx && grid[idx]?.item != null);
    if (adjacentWithCrops.length === 0) return;

    const triggeredCells = adjacentWithCrops.filter(() => Math.random() * 100 < chancePercent);
    if (triggeredCells.length === 0) return;

    const scale = appScaleRef.current;
    const containerRect = container.getBoundingClientRect();
    const walletRect = walletEl.getBoundingClientRect();
    const walletCenterX = (walletRect.left + walletRect.width / 2 - containerRect.left) / scale;
    const walletCenterY = (walletRect.top + walletRect.height / 2 - containerRect.top) / scale;

    const coinPanelsWithDist: { panel: CoinPanelData; dist: number }[] = [];
    const plantPanelsWithDist: { panel: PlantPanelData; dist: number }[] = [];
    /** Chain harvest (merge-adjacent): always 1 crop toward goals; no crop yield, no double-harvest ad */
    const mergeHarvestCropAmount = 1;
    const allocated: Record<number, number> = {};
    const inFlightAtStartMerge: Record<number, number> = { ...goalInFlightHarvestBySlotRef.current };

    const getGoalIconCenter = (slotIdx: number): { x: number; y: number } | null => {
      const iconEl = goalIconRefs[slotIdx]?.current;
      if (!iconEl) return null;
      const r = iconEl.getBoundingClientRect();
      return {
        x: (r.left + r.width / 2 - containerRect.left) / scale,
        y: (r.top + r.height / 2 - containerRect.top) / scale,
      };
    };

    const mergeBursts: { id: string; x: number; y: number; startTime: number; particleCount?: number }[] = [];
    const mergeBeams: { id: string; x: number; y: number; cellWidth: number; cellHeight: number; startTime: number }[] = [];
    const mergeNow = Date.now();
    const mergeCount = triggeredCells.length;
    const manyMergeHarvests = mergeCount > 10;
    const veryManyMergeHarvests = mergeCount > 15;

    triggeredCells.forEach((cellIdx) => {
      const cell = grid[cellIdx];
      if (!cell.item) return;

      const level = cell.item.level;
      const slotIdx = level >= 1 && level <= MAX_PLANT_TIER
        ? (() => {
            let best = -1;
            let minRemaining = Infinity;
            goalPlantTypes.forEach((pt, i) => {
              if (pt !== level || goalSlots[i] !== 'green' || (goalCounts[i] ?? 0) <= 0 || goalsPendingCompletionRef.current.has(i)) return;
              const remaining = (goalCounts[i] ?? 0) - (inFlightAtStartMerge[i] ?? 0) - (allocated[i] ?? 0);
              if (remaining > 0 && remaining < minRemaining) {
                minRemaining = remaining;
                best = i;
              }
            });
            return best;
          })()
        : -1;
      const hasGoalForPlant = slotIdx >= 0;

      const hexEl = document.getElementById(`hex-${cellIdx}`);
      if (!hexEl) return;

      const hexRect = hexEl.getBoundingClientRect();
      const startX = (hexRect.left + hexRect.width / 2 - containerRect.left) / scale;
      const startY = (hexRect.top + hexRect.height / 2 - containerRect.top) / scale;
      const hoverX = startX;
      const hexTopY = (hexRect.top - containerRect.top) / scale;
      const panelHeightPx = 14;
      const offsetUp = (panelHeightPx / 2 + 4) * 0.8;
      const hoverY = hexTopY - offsetUp;

      if (hasGoalForPlant) {
        allocated[slotIdx] = (allocated[slotIdx] ?? 0) + mergeHarvestCropAmount;
        goalInFlightHarvestBySlotRef.current[slotIdx] = (goalInFlightHarvestBySlotRef.current[slotIdx] ?? 0) + mergeHarvestCropAmount;
        if ((goalCounts[slotIdx] ?? 0) - (inFlightAtStartMerge[slotIdx] ?? 0) - (allocated[slotIdx] ?? 0) <= 0) {
          goalsPendingCompletionRef.current.add(slotIdx);
        }
        const goalCenter = getGoalIconCenter(slotIdx);
        const dist = goalCenter ? Math.hypot(hoverX - goalCenter.x, hoverY - goalCenter.y) : 0;
        const plantLevel = goalPlantTypes[slotIdx] ?? slotIdx + 1;
        plantPanelsWithDist.push({
          dist,
          panel: {
            id: `merge-plant-${cellIdx}-${mergeNow}-${Math.random().toString(36).slice(2)}`,
            goalSlotIdx: slotIdx,
            iconSrc: getGoalIconForPlantLevel(plantLevel),
            harvestAmount: mergeHarvestCropAmount,
            startX,
            startY,
            hoverX,
            hoverY,
            moveToTargetDelayMs: 0,
            fromMergeHarvest: true,
            ...(activeFtueStage === 'first_harvest' ? { visualScale: 2 } : {}),
          },
        });
      } else {
        let value = getCoinValueForLevel(level);
        if (cell.fertile) value *= 2;
        value = Math.floor(value);
        /* Coin panel → wallet when no goal; base tier value only (no Surplus Sales multiplier). */
        value = applyGoldenPotMergeCoinBonus(value, unlockedBonusTierSetRef.current);
        value = applyDoubleCoinsVisualAmount(value, activeBoostsRef.current);
        const dist = Math.hypot(hoverX - walletCenterX, hoverY - walletCenterY);
        coinPanelsWithDist.push({
          dist,
          panel: {
            id: `merge-harvest-${cellIdx}-${mergeNow}-${Math.random().toString(36).slice(2)}`,
            value,
            startX,
            startY,
            hoverX,
            hoverY,
            moveToWalletDelayMs: 0,
            scale: MERGE_COIN_HARVEST_PANEL_SCALE,
            dailyTaskCoinKind: 'merge',
          },
        });
      }

      mergeBursts.push({
        id: `merge-harvest-burst-${cellIdx}-${mergeNow}-${Math.random().toString(36).slice(2)}`,
        x: hexRect.left + hexRect.width / 2,
        y: hexRect.top + hexRect.height / 2,
        startTime: mergeNow,
        ...(manyMergeHarvests ? { particleCount: veryManyMergeHarvests ? 1 : 2 } : {}),
      });
      mergeBeams.push({
        id: `merge-harvest-highlight-${cellIdx}-${mergeNow}-${Math.random().toString(36).slice(2)}`,
        x: hexRect.left + hexRect.width / 2,
        y: hexRect.top + hexRect.height / 2,
        cellWidth: hexRect.width,
        cellHeight: hexRect.height,
        startTime: mergeNow,
      });
    });

    if (mergeBursts.length > 0 && !getPerformanceMode()) {
      spawnLeafBurstsSmallMany(mergeBursts);
    }
    if (mergeBeams.length > 0) {
      setCellHighlightBeams((prev) => [...prev, ...mergeBeams]);
    }

    if (coinPanelsWithDist.length > 0) {
      const N = coinPanelsWithDist.length;
      const minDist = Math.min(...coinPanelsWithDist.map((x) => x.dist));
      const maxDist = Math.max(...coinPanelsWithDist.map((x) => x.dist));
      const range = maxDist - minDist || 1;
      const maxStaggerMs = N <= 1 ? 0 : Math.min(200, 200 * (N - 1) / 4);
      const panels: CoinPanelData[] = coinPanelsWithDist.map(({ panel, dist }) => ({
        ...panel,
        moveToWalletDelayMs: ((dist - minDist) / range) * maxStaggerMs,
      }));
      setActiveCoinPanels(prev => [...prev, ...panels]);
    }

    if (plantPanelsWithDist.length > 0) {
      const N = plantPanelsWithDist.length;
      const minDist = Math.min(...plantPanelsWithDist.map((x) => x.dist));
      const maxDist = Math.max(...plantPanelsWithDist.map((x) => x.dist));
      const range = maxDist - minDist || 1;
      const maxStaggerMs = N <= 1 ? 0 : Math.min(200, 200 * (N - 1) / 4);
      const panels: PlantPanelData[] = plantPanelsWithDist.map(({ panel, dist }) => ({
        ...panel,
        moveToTargetDelayMs: ((dist - minDist) / range) * maxStaggerMs,
      }));
      setActivePlantPanels(prev => [...prev, ...panels]);
    }

    setHarvestBounceCellIndices(triggeredCells);
    setTimeout(() => setHarvestBounceCellIndices([]), 250);
  }, [grid, goalSlots, goalCounts, goalPlantTypes, harvestState, playerLevel, activeFtueStage, goldenPotCount, applyDailyTaskRowsUpdate]);

  // Called by HexBoard when starting a merge to calculate level increase
  const getMergeLevelIncrease = useCallback((_currentPlantLevel: number) => {
    pendingMergeLevelIncreaseRef.current = 1;
    return 1;
  }, []);

  const spawnMaxPlantReachedToast = useCallback((cellIdx: number) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(`hex-${cellIdx}`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Store viewport coordinates so we can render in a fixed portal (no dependency on coin panel portal rect).
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const id = `max-plant-${cellIdx}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const startTime = Date.now();
      setMaxPlantToasts((prev) => [...prev, { id, x, y, startTime }]);
      window.setTimeout(() => {
        setMaxPlantToasts((prev) => prev.filter((t) => t.id !== id));
      }, 1000);
    });
  }, []);

  const handleMerge = useCallback((sourceIdx: number, targetIdx: number) => {
    // Check if this will be a merge before updating state
    const source = grid[sourceIdx];
    const target = grid[targetIdx];
    const willMerge = source.item && target.item && target.item.level === source.item.level;
    if (willMerge && target.item) {
      const mergeResultLevel = target.item.level + pendingMergeLevelIncreaseRef.current;
      const hasGoalForResult =
        mergeResultLevel >= 1 &&
        mergeResultLevel <= MAX_PLANT_TIER &&
        goalPlantTypes.some((pt, i) => {
          if (pt !== mergeResultLevel) return false;
          if (goalSlots[i] !== 'green') return false;
          if ((goalCounts[i] ?? 0) <= 0) return false;
          if (goalsPendingCompletionRef.current.has(i)) return false;
          return true;
        });
      playSfx(hasGoalForResult ? SFX_IDS.gameplayMergeCrops : SFX_IDS.gameplayMergeCoins);
    }

    // Deny merges beyond max plant tier (24). Snap dragged plant back and show toast on the static plant.
    if (willMerge && source.item?.level === MAX_PLANT_TIER && target.item?.level === MAX_PLANT_TIER) {
      spawnMaxPlantReachedToast(targetIdx);
      return;
    }

    // FTUE_3: successful drag 4→13 merge → fade out finger + textbox
    if (activeFtueStage === 'merge_drag' && sourceIdx === 4 && targetIdx === 13 && willMerge) {
      setFtue3FadingOut(true);
    }
    
    // Use the level increase that was calculated when the merge started (by HexBoard calling getMergeLevelIncrease)
    const levelIncrease = pendingMergeLevelIncreaseRef.current;
    
    // Calculate the new level for tracking highest plant ever
    const newLevel = willMerge && target.item ? target.item.level + levelIncrease : null;
    
    setGrid(prev => {
      const newGrid = [...prev];
      const source = newGrid[sourceIdx];
      const target = newGrid[targetIdx];
      if (!source.item) return prev;
      if (target.item && target.item.level === source.item.level) {
        newGrid[targetIdx] = {
          ...target,
          item: { ...target.item, level: target.item.level + levelIncrease }
        };
        newGrid[sourceIdx] = { ...source, item: null };
      } else if (!target.item) {
        newGrid[targetIdx] = { ...target, item: source.item };
        newGrid[sourceIdx] = { ...source, item: null };
      }
      return newGrid;
    });
    
    // Update highest plant ever if we created a new record and show discovery popup.
    // Use ref (not state) so we always reset the discovery counter even if state is stale/batched.
    if (newLevel != null && newLevel > highestPlantEverRef.current) {
      applyDailyTaskRowsUpdate(
        recordDailyTaskNewDiscovery(getDailyTasksCtx(), newLevel),
      );
      setHighestPlantEver(newLevel);
      highestPlantEverRef.current = newLevel; // Sync ref so next goal spawn sees new level immediately
      discoveryGoalsRemainingRef.current = getDiscoveryGoalBuffer(newLevel);
      lastMergeDiscoveryLevelRef.current = newLevel; // same "cycle": only allow discovery when current highest === this (never use pre-merge count)
      // Show discovery popup immediately when merge starts (feels more responsive)
      setDiscoveryPopup({ isVisible: true, level: newLevel });
      // FTUE 3: discovery popup hides FTUE 3 overlay so onFadeOutComplete never runs; set ftue4Pending so "Excellent!" starts FTUE 4
      if (newLevel === 2 && activeFtueStage === 'merge_drag') setFtue4Pending(true);
    }
    
    // Chain Harvest: per-cell chance to instantly harvest adjacent crops (without removing them)
    if (willMerge && source.item && target.item) {
      applyDailyTaskRowsUpdate(
        recordDailyTaskMerge(getDailyTasksCtx(), {
          mergedPlantLevel: source.item.level,
          resultPlantLevel: newLevel ?? undefined,
        }),
      );
      const mergeHarvestChance = getMergeHarvestChance(cropsState);
      if (mergeHarvestChance > 0) {
        performMergeHarvest(targetIdx, mergeHarvestChance, sourceIdx);
      }
      // Harvest bar: MERGE_BAR_PERCENT per merge
      {
        let p = harvestProgressRef.current + MERGE_BAR_PERCENT;
        let c = harvestChargesRef.current;
        while (p >= 100) {
          p -= 100;
          if (c < harvestChargesMaxRef.current) c++;
        }
        harvestProgressRef.current = p;
        setHarvestProgress(p);
        setHarvestCharges(c);
        setHarvestBounceTrigger((t) => t + 1);
      }
      // Seed bar: MERGE_BAR_PERCENT per merge
      {
        const seedMergeDelta = MERGE_BAR_PERCENT;
        let sp = tapZoomRef.current ? tapZoomRef.current.end : seedProgressRef.current;
        sp += seedMergeDelta;
        if (sp >= 100) {
          const remainder = sp - 100;
          const surplusValue = getSeedSurplusValue(
            ftueSeedSurplusActivated
              ? ({ ...seedsState, seed_surplus: { level: Math.max(1, seedsState?.seed_surplus?.level ?? 0), progress: 0 } } as any)
              : seedsState,
            highestPlantEverRef.current
          );
          const maxCap = getSeedStorageMax(seedsState, unlockedBonusTierSetRef.current);
          setSeedsInStorage((prev) => {
            const wasFull = prev >= maxCap;
            const next = Math.min(maxCap, prev + 1);
            if (wasFull && surplusValue > 0) {
              const container = containerRef.current;
              const plantBtn = plantButtonRef.current;
              const walletIcon = walletIconRef.current;
              const wallet = walletRef.current;
              const walletEl = walletIcon || wallet;
              if (container && plantBtn && walletEl) {
                const scale = appScaleRef.current;
                const containerRect = container.getBoundingClientRect();
                const btnRect = plantBtn.getBoundingClientRect();
                const startX = (btnRect.left + btnRect.width / 2 - containerRect.left) / scale;
                const startY = (btnRect.top + btnRect.height / 2 - containerRect.top) / scale;
                const panelHeightPx = 14;
                const offsetUp = (panelHeightPx / 2 + 4) * 1.2;
                const hoverY = (btnRect.top - containerRect.top) / scale - offsetUp;
                queueMicrotask(() =>
                  setActiveCoinPanels((p) => [
                    ...p,
                    {
                      id: `seed-surplus-merge-${Date.now()}`,
                      value: applyDoubleCoinsVisualAmount(surplusValue, activeBoostsRef.current),
                      startX,
                      startY,
                      hoverX: startX,
                      hoverY,
                      moveToWalletDelayMs: 0,
                      scale: 1.5,
                    },
                  ])
                );
              }
            }
            return next;
          });
          seedProgressRef.current = remainder;
          setSeedProgress(remainder);
          setIsSeedFlashing(false);
          tapZoomRef.current =
            remainder > 0 ? { start: 0, end: remainder, startTime: Date.now(), duration: 100 } : null;
          setTapZoomTrigger((n) => n + 1);
          setSeedBounceTrigger((t) => t + 1);
        } else {
          seedProgressRef.current = sp;
          setSeedProgress(sp);
          if (tapZoomRef.current) {
            tapZoomRef.current.end = sp;
          } else {
            tapZoomRef.current = { start: sp - seedMergeDelta, end: sp, startTime: Date.now(), duration: 100 };
          }
          setTapZoomTrigger((n) => n + 1);
        }
      }
    }
  }, [
    grid,
    goalPlantTypes,
    goalSlots,
    goalCounts,
    activeFtueStage,
    cropsState,
    seedsState,
    ftueSeedSurplusActivated,
    spawnMaxPlantReachedToast,
  ]);

  const clearAutoMergeRecheckTimeoutOnly = useCallback(() => {
    if (autoMergeRecheckTimeoutRef.current != null) {
      window.clearTimeout(autoMergeRecheckTimeoutRef.current);
      autoMergeRecheckTimeoutRef.current = null;
    }
  }, []);

  const clearAutoMergeRecheckTimeout = useCallback(() => {
    clearAutoMergeRecheckTimeoutOnly();
    nextAutoMergeTryAtRef.current = null;
  }, [clearAutoMergeRecheckTimeoutOnly]);

  const scheduleAutoMergeRecheck = useCallback(
    (delayMs: number) => {
      const wantAt = Date.now() + delayMs;
      const existing = nextAutoMergeTryAtRef.current;
      if (existing != null && wantAt >= existing) {
        return;
      }
      clearAutoMergeRecheckTimeoutOnly();
      nextAutoMergeTryAtRef.current = wantAt;
      autoMergeRecheckTimeoutRef.current = window.setTimeout(() => {
        autoMergeRecheckTimeoutRef.current = null;
        nextAutoMergeTryAtRef.current = null;
        tryStartAutoMergeRef.current();
      }, Math.max(0, wantAt - Date.now()));
    },
    [clearAutoMergeRecheckTimeoutOnly]
  );

  const tryStartAutoMerge = useCallback(() => {
    if (!autoMergeSetting || !getAutoMergeMode()) return;
    if (isLoading) return;
    if (activeFtueStage !== null || ftue11StartQueued) return;
    // Never merge while Settings is open (user should see the board when merges run).
    if (pauseMenuOpen || rateUsPopupOpen || rateUsThankYouOpen || dailyTasksPopupOpen) return;
    // Intentionally allow auto-merge while discovery / level-up are open so merge chains do not stall
    // (e.g. L2+L2→L3 opens discovery while two L1 pairs are still on the board).
    if (offlineEarningsUi?.open) return;
    if (
      showFakeAd ||
      rewardedAdFadeInActive ||
      rewardedAdBlackHoldActive ||
      rewardedAdFadeOutActive ||
      adBreakIntroActive ||
      interstitialAdSlotActive ||
      rewardedAdSlotActive
    ) {
      return;
    }
    if (purchaseSuccessfulUi) return;
    if (iapOfferUi) return;
    if (limitedOfferPopup?.isVisible) return;
    if (plantInfoPopup?.isVisible) return;
    if (activeScreen !== 'FARM') return;
    // Board is always mounted on the farm column; merges must not depend on upgrade tab or panel height.
    if (dragState != null) return;
    const now = Date.now();
    const landMap = recentSeedLandTimesRef.current;
    for (const [idx, ts] of [...landMap]) {
      if (now - ts > AUTO_MERGE_SEED_INVOLVED_GRACE_MS + 2000) landMap.delete(idx);
    }
    const snap = gridRef.current;
    const pendingImpact = getPendingSeedImpactTargets(snap, activeProjectilesRef.current);
    const mergeCap = getActiveOrderMergeResultCap(goalPlantTypes, goalSlots, goalCounts);
    const pair = findBestAutoMergePair(snap, mergeCap, pendingImpact);
    if (!pair) {
      if (!autoMergeNullBackupWaveArmedRef.current) {
        autoMergeNullBackupWaveArmedRef.current = true;
        window.setTimeout(() => tryStartAutoMergeRef.current(), AUTO_MERGE_NULL_BACKUP_MS);
        window.setTimeout(() => {
          tryStartAutoMergeRef.current();
          autoMergeNullBackupWaveArmedRef.current = false;
        }, AUTO_MERGE_NULL_BACKUP_MS * 2);
      }
      return;
    }
    autoMergeNullBackupWaveArmedRef.current = false;
    const graceRemain = autoMergeSeedGraceRemainMsForPair(pair.sourceIdx, pair.targetIdx, now, landMap);
    if (graceRemain > 0) {
      scheduleAutoMergeRecheck(graceRemain);
      return;
    }
    const ok =
      hexBoardRef.current?.beginProgrammaticMerge(pair.sourceIdx, pair.targetIdx, snap) ?? false;
    if (!ok) scheduleAutoMergeRecheck(280);
  }, [
    autoMergeSetting,
    isLoading,
    activeFtueStage,
    ftue11StartQueued,
    pauseMenuOpen,
    rateUsPopupOpen,
    rateUsThankYouOpen,
    dailyTasksPopupOpen,
    offlineEarningsUi?.open,
    showFakeAd,
    rewardedAdFadeInActive,
    rewardedAdBlackHoldActive,
    rewardedAdFadeOutActive,
    adBreakIntroActive,
    interstitialAdSlotActive,
    rewardedAdSlotActive,
    purchaseSuccessfulUi,
    iapOfferUi,
    limitedOfferPopup?.isVisible,
    plantInfoPopup?.isVisible,
    activeScreen,
    dragState,
    goalPlantTypes,
    goalSlots,
    goalCounts,
    scheduleAutoMergeRecheck,
  ]);

  useEffect(() => {
    tryStartAutoMergeRef.current = tryStartAutoMerge;
  }, [tryStartAutoMerge]);

  useEffect(() => {
    scheduleAutoMergeRecheckRef.current = scheduleAutoMergeRecheck;
  }, [scheduleAutoMergeRecheck]);

  /** When open orders change the merge-result cap, retry (e.g. goal completed → can merge higher again). */
  useEffect(() => {
    const cap = getActiveOrderMergeResultCap(goalPlantTypes, goalSlots, goalCounts);
    if (prevAutoMergeCapRef.current === cap) return;
    prevAutoMergeCapRef.current = cap;
    if (!autoMergeSetting || !getAutoMergeMode()) return;
    if (pauseMenuOpen || rateUsPopupOpen || rateUsThankYouOpen || dailyTasksPopupOpen || isLoading) return;
    scheduleAutoMergeRecheck(0);
  }, [goalPlantTypes, goalSlots, goalCounts, autoMergeSetting, pauseMenuOpen, rateUsPopupOpen, rateUsThankYouOpen, dailyTasksPopupOpen, isLoading, scheduleAutoMergeRecheck]);

  useEffect(() => {
    if (!autoMergeSetting) return;
    const id = window.setInterval(() => tryStartAutoMergeRef.current(), AUTO_MERGE_POLL_MS);
    return () => clearInterval(id);
  }, [autoMergeSetting, activeFtueStage, isLoading, activeScreen, pauseMenuOpen]);

  /** Any grid mutation re-arms a merge attempt (debounced) so we never “miss” a pair after merges/seeds settle. */
  useEffect(() => {
    if (!autoMergeSetting || !getAutoMergeMode()) return;
    if (isLoading) return;
    const id = window.setTimeout(() => tryStartAutoMergeRef.current(), 400);
    return () => window.clearTimeout(id);
  }, [grid, autoMergeSetting, isLoading]);

  /** Cancel delayed rechecks while Settings is open; when it closes (or load finishes), try once so merges can start. */
  useEffect(() => {
    if (isLoading) return;
    if (pauseMenuOpen || rateUsPopupOpen || rateUsThankYouOpen || dailyTasksPopupOpen) {
      clearAutoMergeRecheckTimeout();
      return;
    }
    if (!autoMergeSetting || !getAutoMergeMode()) return;
    scheduleAutoMergeRecheck(0);
  }, [pauseMenuOpen, rateUsPopupOpen, rateUsThankYouOpen, dailyTasksPopupOpen, autoMergeSetting, isLoading, clearAutoMergeRecheckTimeout, scheduleAutoMergeRecheck]);

  useEffect(() => () => clearAutoMergeRecheckTimeout(), [clearAutoMergeRecheckTimeout]);

  const onProgrammaticMergeSettled = useCallback(() => {
    // Full-board scan after settle; extra delayed tries drain multiple same-tier merges (e.g. two L1+L1 before L2+L2).
    scheduleAutoMergeRecheck(AUTO_MERGE_POST_SETTLE_MS);
    window.setTimeout(() => tryStartAutoMergeRef.current(), AUTO_MERGE_POST_MERGE_FOLLOWUP_MS);
    window.setTimeout(() => tryStartAutoMergeRef.current(), AUTO_MERGE_POST_MERGE_FOLLOWUP_MS + 280);
    window.setTimeout(() => tryStartAutoMergeRef.current(), AUTO_MERGE_POST_MERGE_FOLLOWUP_MS + 600);
  }, [scheduleAutoMergeRecheck]);

  /** Stable HexBoard callbacks so memo(HexBoard) skips re-renders when unrelated App state changes (e.g. Settings open). */
  const handleHexReturnImpact = useCallback((idx: number | null) => {
    if (idx != null) playSfx(SFX_IDS.gameplayMovePlant);
    setReturnImpactCellIdx(idx);
    if (idx != null) setTimeout(() => setReturnImpactCellIdx(null), 100);
  }, []);

  const handleHexLandOnNewCell = useCallback((targetIdx: number) => {
    playSfx(SFX_IDS.gameplayMovePlant);
    setNewCellImpactIdx(targetIdx);
    setTimeout(() => setNewCellImpactIdx(null), 300);
  }, []);

  const handleHexReleaseFromCell = useCallback((cellIdx: number) => {
    setSourceCellFadeOutIdx(cellIdx);
    setTimeout(() => setSourceCellFadeOutIdx(null), 150);
  }, []);

  const handleHexMaxTierMergeAttempt = useCallback((staticCellIdx: number) => {
    spawnMaxPlantReachedToast(staticCellIdx);
  }, [spawnMaxPlantReachedToast]);

  const handleHexMergeImpactStart = useCallback((cellIdx: number, px: number, py: number, mergeResultLevel?: number) => {
    const container = containerRef.current;
    if (!container) return;
    const scale = appScaleRef.current;
    const rect = container.getBoundingClientRect();
    if (!getPerformanceMode()) {
      spawnLeafBurst({
        id: Math.random().toString(36).slice(2),
        x: rect.left + px * scale,
        y: rect.top + py * scale,
        startTime: Date.now(),
      });
    }
    if (mergeResultLevel != null) {
      const slotIdx = mergeResultLevel >= 1 && mergeResultLevel <= MAX_PLANT_TIER
        ? (() => {
            let best = -1;
            let minRemaining = Infinity;
            goalPlantTypes.forEach((pt, i) => {
              if (pt !== mergeResultLevel || goalSlots[i] !== 'green' || (goalCounts[i] ?? 0) <= 0 || goalsPendingCompletionRef.current.has(i)) return;
              const inFlight = goalInFlightHarvestBySlotRef.current[i] ?? 0;
              const remaining = (goalCounts[i] ?? 0) - inFlight;
              if (remaining > 0 && remaining < minRemaining) {
                minRemaining = remaining;
                best = i;
              }
            });
            return best;
          })()
        : -1;
      const hasGoalForPlant = slotIdx >= 0;
      /** Merge result cell: 1 crop to goal if any; else coin panel → wallet (base coin value for merged tier). */
      const harvestAmount = 1;
      const hexEl = document.getElementById(`hex-${cellIdx}`);
      const panelHeightPx = 14;
      const offsetUp = (panelHeightPx / 2 + 4) * 0.4;
      const hoverX = px;
      const hoverY = hexEl
        ? ((hexEl.getBoundingClientRect().top - rect.top) / scale) - offsetUp
        : py - offsetUp;
      if (hasGoalForPlant) {
        goalInFlightHarvestBySlotRef.current[slotIdx] = (goalInFlightHarvestBySlotRef.current[slotIdx] ?? 0) + harvestAmount;
        if ((goalCounts[slotIdx] ?? 0) - (goalInFlightHarvestBySlotRef.current[slotIdx] ?? 0) <= 0) {
          goalsPendingCompletionRef.current.add(slotIdx);
        }
        const plantLevel = goalPlantTypes[slotIdx] ?? slotIdx + 1;
        setActivePlantPanels((prev) => [
          ...prev,
          {
            id: `merge-plant-${cellIdx}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            goalSlotIdx: slotIdx,
            iconSrc: getGoalIconForPlantLevel(plantLevel),
            harvestAmount,
            startX: px,
            startY: py,
            hoverX,
            hoverY,
            moveToTargetDelayMs: 0,
            fromMergeHarvest: true,
            ...(activeFtueStage === 'first_harvest' ? { visualScale: 2 } : {}),
          },
        ]);
      } else {
        const cell = gridRef.current[cellIdx];
        let value = getCoinValueForLevel(mergeResultLevel);
        if (cell?.fertile) value *= 2;
        value = Math.floor(value);
        /* Same coin panel + wallet path as surplus harvest; no Surplus Sales multiplier. */
        value = applyGoldenPotMergeCoinBonus(value, unlockedBonusTierSetRef.current);
        value = applyDoubleCoinsVisualAmount(value, activeBoostsRef.current);
        setActiveCoinPanels((prev) => [
          ...prev,
          {
            id: `merge-${cellIdx}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            value,
            startX: px,
            startY: py,
            hoverX,
            hoverY,
            moveToWalletDelayMs: 0,
            scale: MERGE_COIN_HARVEST_PANEL_SCALE,
            dailyTaskCoinKind: 'merge',
          },
        ]);
      }
    }
  }, [goalPlantTypes, goalSlots, goalCounts, activeFtueStage]);

  const handleHexDeletePlant = useCallback((cellIdx: number, px: number, py: number) => {
    const container = containerRef.current;
    if (!container) return;
    playSfx(SFX_IDS.gameplayDeletePlant);
    const scale = appScaleRef.current;
    const rect = container.getBoundingClientRect();
    if (!getPerformanceMode()) {
      spawnLeafBurstSmall({
        id: `delete-${cellIdx}-${Date.now()}`,
        x: rect.left + px * scale,
        y: rect.top + py * scale,
        startTime: Date.now(),
        particleCount: 30,
        useCircle: true,
      });
    }
    setGrid((prev) => {
      const newGrid = [...prev];
      newGrid[cellIdx] = { ...newGrid[cellIdx], item: null };
      return newGrid;
    });
  }, []);

  // Swap plants when dropping on a non-mergeable plant
  const handleSwap = useCallback((sourceIdx: number, targetIdx: number) => {
    setGrid(prev => {
      const newGrid = [...prev];
      const sourceCell = newGrid[sourceIdx];
      const targetCell = newGrid[targetIdx];
      if (!sourceCell.item || !targetCell.item) return prev;
      // Swap the items
      const tempItem = sourceCell.item;
      newGrid[sourceIdx] = { ...sourceCell, item: targetCell.item };
      newGrid[targetIdx] = { ...targetCell, item: tempItem };
      return newGrid;
    });
  }, []);

  const getScreenIndex = () => {
    switch (activeScreen) {
      case 'STORE': return 0;
      case 'FARM': return 1;
      case 'BARN': return 2;
      default: return 1;
    }
  };

  const screenCarouselIndex = getScreenIndex();
  const screenTranslateX = `translateX(-${screenCarouselIndex * designWidth}px)`;
  const gardenBg = getGardenBackgroundPaths(activeGardenId);
  const goalSlotUi = useMemo(
    () => ({
      shadow: getGoalSlotUiPath('goal_shadow.png', activeGardenId),
      loading: getGoalSlotUiPath('goal_loading.png', activeGardenId),
      normal: getGoalSlotUiPath('goal_normal.png', activeGardenId),
      yellow: getGoalSlotUiPath('goal_yellow.png', activeGardenId),
      undiscovered: getGoalSlotUiPath('goal_undiscovered.png', activeGardenId),
      cream: getGoalSlotUiPath('goal_cream.png', activeGardenId),
    }),
    [activeGardenId],
  );
  const goalTextColors = useMemo(
    () => getGardenGoalTextColors(activeGardenId),
    [activeGardenId],
  );
  const topUiGradientSrc = useMemo(
    () => getTopUiAssetPath('topui_gradient.png', activeGardenId),
    [activeGardenId],
  );

  const showIdleEarningsPopup = useCallback((displayAmount: number, delayMs: number) => {
    if (displayAmount <= 0) {
      setOfflineEarningsUi(null);
      setDeferNewGardenFtueUiForOffline(false);
      return;
    }
    setOfflineEarningsUi(null);
    // Hold new-garden forced UI from schedule through collect (covers the delay window).
    setDeferNewGardenFtueUiForOffline(true);
    setTimeout(() => {
      setOfflineEarningsUi({
        open: true,
        amount: displayAmount,
        showDoubleButton: true,
        rewardBounceKey: 0,
      });
    }, delayMs);
  }, []);

  /** Heal new-garden FTUE crash states, then load save with idle absence sim. */
  const loadSaveForGameplayHydrate = useCallback(() => {
    const v2 = loadGameSaveV2();
    if (v2) {
      const { next, changed } = healNewGardenFtueSave(v2);
      if (changed) persistGameSaveV2(next);
    }
    return loadGameSaveWithIdleAbsenceApplied();
  }, []);

  /** Apply saved game + offline sim; returns display offline coin payout pending (not wallet). */
  const hydrateFromSave = useCallback((save: GameSaveV1, options?: { skipOfflineSim?: boolean }) => {
    const cropsNorm: Record<string, UpgradeState> = { ...save.cropsState };
    if (!cropsNorm.wild_growth) cropsNorm.wild_growth = { level: 0, progress: 0 };

    setMoney(save.money);
    setSeedsState(save.seedsState);
    setHarvestState(save.harvestState);
    setCropsState(cropsNorm);
    setSeedsInStorage(save.seedsInStorage);
    seedsInStorageRef.current = save.seedsInStorage;
    setHighestPlantEver(save.highestPlantEver);
    highestPlantEverRef.current = save.highestPlantEver;
    setPlayerLevel(save.playerLevel);
    setPlayerLevelProgress(save.playerLevelProgress);
    setPlantMasteryGoalsCompleted(save.plantMasteryGoalsCompleted ?? 0);
    setPlantMastery({
      ordersProgress: save.plantMasteryOrdersProgress,
      targetLevel: save.plantMasteryTargetLevel,
      unlockPending: [...save.plantMasteryUnlockPending],
      unlockedLevels: [...save.plantMasteryUnlockedLevels],
      plantMasteryIntroBarComplete: save.plantMasteryIntroBarComplete === true,
    });
    setCollectionFtueCompleted(
      save.collectionFtueCompleted === true || save.collectionFtueBonusesReached === true,
    );
    setCollectionFtueBonusesReached(save.collectionFtueBonusesReached === true);
    setCollectionFtueRestartPending(
      save.collectionFtueCompleted === true || save.collectionFtueBonusesReached === true
        ? false
        : save.collectionFtueRestartPending === true,
    );
    setCollectionFtuePhase(
      (() => {
        if (save.collectionFtueCompleted || save.collectionFtueBonusesReached) return null;
        const phase = parseCollectionFtuePhase(save.collectionFtuePhase) ?? null;
        if (phase === 'popup_free') return 'point_unlock';
        if (phase === 'shelf_plant_bounce') return 'intro_cta';
        if (phase === 'point_garden_nav') return null;
        return phase;
      })(),
    );
    const tasksFtueStartedLoaded = save.tasksFtueStarted === true;
    const tasksFtueCompletedLoaded = save.tasksFtueCompleted === true;
    setTasksFtueStarted(tasksFtueStartedLoaded);
    setTasksFtueCompleted(tasksFtueCompletedLoaded);
    const tasksFtueUnlockRevealedLoaded =
      save.tasksFtueUnlockRevealed === true ||
      tasksFtueCompletedLoaded ||
      (!tasksFtueStartedLoaded &&
        save.playerLevel >= TASKS_FLOATING_BUTTON_UNLOCK_LEVEL);
    setTasksFtueUnlockRevealed(tasksFtueUnlockRevealedLoaded);
    tasksFtueRevealPlayedRef.current = tasksFtueUnlockRevealedLoaded;
    const gardensFtueStartedLoaded = save.gardensFtueStarted === true;
    const gardensFtueCompletedLoaded = save.gardensFtueCompleted === true;
    setGardensFtueStarted(gardensFtueStartedLoaded);
    setGardensFtueCompleted(gardensFtueCompletedLoaded);
    const gardensFtueUnlockRevealedLoaded =
      save.gardensFtueUnlockRevealed === true ||
      gardensFtueCompletedLoaded ||
      (!gardensFtueStartedLoaded &&
        save.playerLevel >= GARDENS_FLOATING_BUTTON_UNLOCK_LEVEL);
    setGardensFtueUnlockRevealed(gardensFtueUnlockRevealedLoaded);
    gardensFtueRevealPlayedRef.current = gardensFtueUnlockRevealedLoaded;
    setNewGardenFtueCompleted(save.newGardenFtueCompleted === true);
    setNewGardenFtuePhase(
      save.newGardenFtueCompleted ? null : parseNewGardenFtuePhase(save.newGardenFtuePhase) ?? null,
    );
    setActiveTab(save.activeTab);
    setRewardedOffers(
      normalizeRewardedOffersForLoad(
        save.rewardedOffers.filter((o) => !isStorePremiumOnlyOfferId(o.id)),
        Date.now(),
      ),
    );
    setBarnNotification(save.barnNotification);
    setDailyAllowanceClaimedDayKey(save.dailyAllowanceClaimedDayKey);
    setStoreFreeOfferSlots(
      save.storeFreeOfferSlots?.length === 2
        ? ([...save.storeFreeOfferSlots] as [string, string])
        : pickInitialStoreFreeOfferSlots(),
    );
    setStoreSlotCooldownEnds(normalizeStoreSlotCooldownEnds(save.storeSlotCooldownEnds));
    setDailyAllowanceUiHoldUntilMs(0);
    if (dailyAllowanceUiHoldTimeoutRef.current) {
      clearTimeout(dailyAllowanceUiHoldTimeoutRef.current);
      dailyAllowanceUiHoldTimeoutRef.current = null;
    }
    const v2ForPots = loadGameSaveV2();
    const activeIdForPots = v2ForPots?.activeGardenId ?? DEFAULT_GARDEN_ID;
    const activeSnap: GardenCollectionSnapshot = {
      highestPlantEver: save.highestPlantEver,
      unlockedLevels: save.plantMasteryUnlockedLevels ?? [],
      money: save.money,
    };
    const goldenPotN = getGlobalBonusProgressPotCount(activeIdForPots, activeSnap, v2ForPots?.gardens);
    const unlockedTiersHydrate = new Set(
      getUnlockedGoldenPotBonusTierPotCounts(activeIdForPots, activeSnap, v2ForPots?.gardens),
    );
    goldenPotCountForTierPopupRef.current = goldenPotN;
    // Seed so post-load unlock detection does not re-fire for already-owned shelves.
    prevUnlockedBonusTiersRef.current = new Set(unlockedTiersHydrate);
    if (goldenPotTierUnlockPopupTimeoutRef.current != null) {
      window.clearTimeout(goldenPotTierUnlockPopupTimeoutRef.current);
      goldenPotTierUnlockPopupTimeoutRef.current = null;
    }
    setGoldenPotBonusRevealTier(null);
    setGoldenPotBonusRevealShelfIndex(null);
    setGoldenPotBonusesPopupOpen(false);
    const maxPlantSlotsHydrate = getMaxPlantGoalSlots(unlockedTiersHydrate);
    const slotsNorm = [...save.goalSlots] as GameSaveV1['goalSlots'];
    const typesNorm = [...save.goalPlantTypes];
    const countsNorm = [...save.goalCounts];
    const amtNorm = [...save.goalAmountsRequired];
    const completedNorm = [...save.goalCompletedValues];
    let orderNorm = [...save.goalDisplayOrder];
    if (maxPlantSlotsHydrate < 4 && slotsNorm[3] !== 'empty') {
      slotsNorm[3] = 'empty';
      typesNorm[3] = 0;
      countsNorm[3] = 0;
      amtNorm[3] = 0;
      completedNorm[3] = 0;
      orderNorm = orderNorm.filter((i) => i !== 3);
    }
    setGoalSlots(slotsNorm);
    setGoalPlantTypes(typesNorm);
    setDiscoveryGoalLightGreenDismissed([false, false, false, false, false]);
    if (Array.isArray(save.goalDiscoveryLightGreenActive) && save.goalDiscoveryLightGreenActive.length === 5) {
      const gdl = save.goalDiscoveryLightGreenActive.map((x) => x === true);
      if (maxPlantSlotsHydrate < 4) gdl[3] = false;
      setGoalDiscoveryLightGreenActive(gdl);
    } else {
      setGoalDiscoveryLightGreenActive(
        deriveGoalDiscoveryLightGreenActive(slotsNorm, typesNorm, save.highestPlantEver)
      );
    }
    setGoalLoadingSeconds(save.goalLoadingSeconds);
    setGoalCounts(countsNorm);
    setGoalAmountsRequired(amtNorm);
    setGoalCompletedValues(completedNorm);
    setGoalDisplayOrder(orderNorm);
    setCoinGoalVisible(save.coinGoalVisible);
    setCoinGoalValue(save.coinGoalValue);
    setCoinGoalTimeRemaining(save.coinGoalTimeRemaining);
    {
      const hDisc = save.highestPlantEver;
      const buf = getDiscoveryGoalBuffer(hDisc);
      if (save.discoveryGoalsRemaining != null && Number.isFinite(save.discoveryGoalsRemaining)) {
        discoveryGoalsRemainingRef.current = Math.min(buf, Math.max(0, Math.floor(save.discoveryGoalsRemaining)));
      } else {
        discoveryGoalsRemainingRef.current = Math.max(0, buf - (save.newGoalsSinceDiscovery ?? 0));
      }
    }
    lastMergeDiscoveryLevelRef.current = save.lastMergeDiscoveryLevel;
    const loadedSpawned = [...save.lastSpawnedGoalLevels] as [number, number];
    lastSpawnedGoalLevelsRef.current = loadedSpawned;
    lastSpawnedGoalPlantLevelHUDRef.current = loadedSpawned[1] ?? 0;
    setActiveFtueStage(save.activeFtueStage);
    setFtue2SeedFireCount(save.ftue2SeedFireCount);
    setFtue2FadingOut(save.ftue2FadingOut);
    setFtue3FadingOut(save.ftue3FadingOut);
    setFtue4Pending(save.ftue4Pending);
    setFtue4FadingOut(save.ftue4FadingOut);
    setFtue7Scheduled(save.ftue7Scheduled);
    setFtue7UnrevealedSlots(save.ftue7UnrevealedSlots);
    setFtue7RevealMode(save.ftue7RevealMode);
    setFtue7SeedFireCount(save.ftue7SeedFireCount);
    setFtue7FadingOut(save.ftue7FadingOut);
    setFtue8FadingOut(save.ftue8FadingOut);
    setFtue9CollectedCount(save.ftue9CollectedCount);
    setFtue9FadingOut(save.ftue9FadingOut);
    setFtue10Phase(save.ftue10Phase);
    setFtue10GreenFlashUpgradeId(save.ftue10GreenFlashUpgradeId);
    setFtue10FadingOut(save.ftue10FadingOut);
    setFtueSeedSurplusActivated(save.ftueSeedSurplusActivated);
    setFtueHarvestSurplusActivated(save.ftueHarvestSurplusActivated);
    setFtue10PostClosePending(save.ftue10PostClosePending);
    setFtue10ButtonsNormalEarly(save.ftue10ButtonsNormalEarly);
    setFtue11StartQueued(save.ftue11StartQueued);
    {
      const nudgeDone = save.postFtueHarvestNudgeDone;
      if (nudgeDone === true) {
        setPostFtueHarvestNudgeDone(true);
        postFtueHarvestNudgeDoneRef.current = true;
      } else if (nudgeDone === false) {
        setPostFtueHarvestNudgeDone(false);
        postFtueHarvestNudgeDoneRef.current = false;
      } else {
        setPostFtueHarvestNudgeDone(null);
        postFtueHarvestNudgeDoneRef.current = null;
      }
      setSoftHarvestNudgeVisible(false);
      if (softHarvestNudgeTimerRef.current) {
        clearTimeout(softHarvestNudgeTimerRef.current);
        softHarvestNudgeTimerRef.current = null;
      }
    }
    setFtueUpgradePanelVisible(save.ftueUpgradePanelVisible);
    setFtuePlayerLevelVisible(save.ftuePlayerLevelVisible);
    const now = Date.now();
    setActiveBoosts(normalizeActiveBoostsAfterLoad(save.activeBoosts.filter((b) => b.endTime > now)));
    const userPrefs = loadUserPrefs();
    setMusicEnabled(userPrefs.musicEnabled);
    setSfxEnabled(userPrefs.sfxEnabled);
    setReturnRemindersEnabled(userPrefs.returnRemindersEnabled);
    setFakeNotchPreviewEnabled(userPrefs.fakeNotchPreviewEnabled);
    setPendingUnlockUpgradeId(
      save.pendingUnlockUpgradeId === 'fertile_soil' ? 'wild_growth' : save.pendingUnlockUpgradeId
    );
    setLevelUpPopupQueue(save.levelUpPopupQueue);
    adBreakRuntimeRef.current = {
      lastAdBreakAt: save.lastAdBreakAt ?? 0,
      lastRewardedAdAt: save.lastRewardedAdAt ?? 0,
      activePlaytimeMs: save.adBreakActivePlaytimeMs ?? 0,
      fallbackPending: false,
      graceUntil: 0,
    };

    seedProgressRef.current = save.seedProgress;
    setSeedProgress(save.seedProgress);
    harvestProgressRef.current = save.harvestProgress;
    setHarvestProgress(save.harvestProgress);
    harvestChargesRef.current = save.harvestCharges;
    setHarvestCharges(save.harvestCharges);

    const ftueBlocksOffline = isOfflineCoinEarningsBlockedByFtue(save);
    const goldPotsForOffline = unlockedTiersHydrate;
    const clampOfflineBank = (amount: number, label: string) =>
      ftueBlocksOffline
        ? 0
        : clampOfflineEarningsBank(
            amount,
            {
              highestPlantEver: save.highestPlantEver,
              seedsState: save.seedsState,
              ftueSeedSurplusActivated: save.ftueSeedSurplusActivated,
              ftueHarvestSurplusActivated: save.ftueHarvestSurplusActivated,
            },
            label,
          );

    if (options?.skipOfflineSim) {
      wildGrowthAccumMsRef.current = save.wildGrowthAccumulatorMs ?? 0;
      setGrid(save.grid);
      const pendingBank = clampOfflineBank(save.pendingOfflineEarnings ?? 0, 'hydrate:load');
      pendingOfflineEarningsRef.current = pendingBank;
      return applyGoldenPotOfflineEarningsBonus(pendingBank, goldPotsForOffline);
    }

    const elapsed = Math.max(0, Date.now() - save.savedAt);
    const sim = simulateOfflineSeedHarvest({
      savedAt: save.savedAt,
      deltaMs: elapsed,
      seedProgress: save.seedProgress,
      harvestProgress: save.harvestProgress,
      harvestCharges: save.harvestCharges,
      seedsInStorage: save.seedsInStorage,
      seedsState: save.seedsState,
      cropsState: cropsNorm,
      activeBoosts: save.activeBoosts.map((b) => ({ offerId: b.offerId, endTime: b.endTime, icon: b.icon })),
      activeFtueStage: save.activeFtueStage,
      ftue7Scheduled: save.ftue7Scheduled,
      ftueSeedSurplusActivated: save.ftueSeedSurplusActivated,
      ftueHarvestSurplusActivated: save.ftueHarvestSurplusActivated,
      highestPlantEver: save.highestPlantEver,
      earnOfflineCoins: !ftueBlocksOffline,
      goldenPotCount: goldPotsForOffline,
    });
    seedProgressRef.current = sim.seedProgress;
    setSeedProgress(sim.seedProgress);
    harvestProgressRef.current = sim.harvestProgress;
    setHarvestProgress(sim.harvestProgress);
    harvestChargesRef.current = sim.harvestCharges;
    setHarvestCharges(sim.harvestCharges);
    seedsInStorageRef.current = sim.seedsInStorage;
    setSeedsInStorage(sim.seedsInStorage);

    const wildOut = simulateWildGrowthOffline({
      deltaMs: elapsed,
      playerLevel: save.playerLevel,
      wildGrowthUpgradeLevel: cropsNorm.wild_growth?.level ?? 0,
      grid: save.grid,
      wildGrowthAccumMs: save.wildGrowthAccumulatorMs ?? 0,
    });
    wildGrowthAccumMsRef.current = wildOut.wildGrowthAccumMs;
    setGrid(wildOut.grid);

    const pendingBank = clampOfflineBank(save.pendingOfflineEarnings ?? 0, 'hydrate:sim-bank');
    const rawOfflineTotal = clampOfflineBank(
      pendingBank + sim.offlineSurplusCoins,
      'hydrate:sim-total',
    );
    pendingOfflineEarningsRef.current = rawOfflineTotal;
    return applyGoldenPotOfflineEarningsBonus(rawOfflineTotal, goldPotsForOffline);
  }, []);

  const syncActiveGardenFromSave = useCallback(() => {
    const v2 = loadGameSaveV2();
    if (!v2) return;
    setActiveGardenId(v2.activeGardenId);
    activeGardenIdRef.current = v2.activeGardenId;
    setActiveGardenAssetContext(v2.activeGardenId);
    setDailyTasksActiveGarden(v2.activeGardenId);
    barnScrollYByGardenRef.current = readCollectionScrollYFromV2(v2);
    barnScrollGardenIdRef.current = v2.activeGardenId;
    const g1 = v2.gardens[DEFAULT_GARDEN_ID]?.playerLevel;
    if (g1 != null) setGarden1PlayerLevel(g1);
  }, []);

  const getSelectableGardenIds = useCallback((): GardenId[] => {
    const v2 = loadGameSaveV2();
    const started = new Set(v2?.gardensStarted ?? [DEFAULT_GARDEN_ID]);
    return SHIPPED_GARDEN_IDS.filter((id) => isGardenSelectable(id, started.has(id)));
  }, [collectionSaveRevision]);

  const gardensStartedList = useMemo((): GardenId[] => {
    return loadGameSaveV2()?.gardensStarted ?? [DEFAULT_GARDEN_ID];
  }, [collectionSaveRevision, gardenPickerOpen, activeGardenId]);

  const canAffordNextGardenPurchaseNow = useMemo(
    () =>
      canAffordNextGardenPurchase(
        gardensStartedList,
        activeGardenId,
        money,
        collectionV2Gardens,
      ),
    [gardensStartedList, activeGardenId, money, collectionV2Gardens],
  );

  useEffect(() => {
    if (isLoading) return;
    if (garden1PlayerLevel < GARDENS_FLOATING_BUTTON_UNLOCK_LEVEL) {
      prevCanAffordGardenPurchaseRef.current = false;
      gardensAffordThresholdInitializedRef.current = false;
      return;
    }
    if (!gardensAffordThresholdInitializedRef.current) {
      gardensAffordThresholdInitializedRef.current = true;
      prevCanAffordGardenPurchaseRef.current = canAffordNextGardenPurchaseNow;
      return;
    }
    const prev = prevCanAffordGardenPurchaseRef.current;
    if (canAffordNextGardenPurchaseNow && !prev) {
      triggerGardensFloatingButtonReadyFx();
    }
    prevCanAffordGardenPurchaseRef.current = canAffordNextGardenPurchaseNow;
  }, [
    canAffordNextGardenPurchaseNow,
    garden1PlayerLevel,
    isLoading,
    triggerGardensFloatingButtonReadyFx,
  ]);

  const inProgressBonusTierPotCounts = useMemo(
    () =>
      getInProgressBonusTierPotCounts(
        activeGardenId,
        activeCollectionSnapshot,
        collectionV2Gardens,
        gardensStartedList,
      ),
    [activeGardenId, activeCollectionSnapshot, collectionV2Gardens, gardensStartedList],
  );

  const syncNewGardenFtueToSave = useCallback((phase: NewGardenFtuePhase | null, completed: boolean) => {
    const v2 = loadGameSaveV2();
    if (!v2) return;
    persistGameSaveV2({
      ...v2,
      globals: {
        ...v2.globals,
        newGardenFtueCompleted: completed,
        newGardenFtuePhase: completed ? null : phase,
      },
      savedAt: Date.now(),
    });
  }, []);

  const setNewGardenFtuePhasePersisted = useCallback(
    (phase: NewGardenFtuePhase | null, completed = false) => {
      setNewGardenFtueCompleted(completed);
      setNewGardenFtuePhase(completed ? null : phase);
      syncNewGardenFtueToSave(phase, completed);
    },
    [syncNewGardenFtueToSave],
  );

  /** Dev Shift+G: +1 goal on the player level bar (same as header XP boost). */
  const handleDevAddGoalClick = useCallback(() => {
    playSfx(SFX_IDS.uiConfirmNormal);
    applyGoalCollectedProgress();
    setPlayerLevelProgress((prev) => {
      const next = prev + 1;
      const goalsRequired = getGoalsRequiredForLevel(playerLevel);
      if (next >= goalsRequired) {
        if (!levelUpGuardRef.current) {
          levelUpGuardRef.current = true;
          const nextLevel = playerLevel + 1;
          showLevelUpForNextLevel(nextLevel);
          setTimeout(() => {
            levelUpGuardRef.current = false;
          }, 0);
        }
        return goalsRequired;
      }
      return next;
    });
    setPlayerLevelFlashTrigger((t) => t + 1);
  }, [applyGoalCollectedProgress, playerLevel, showLevelUpForNextLevel]);

  /**
   * Dev Shift+T: skip the active tutorial to the next safe continue spot
   * (garden-level intro → starter FTUE → collection / tasks / gardens / new-garden FTUE).
   */
  const handleDevSkipTutorial = useCallback(() => {
    playSfx(SFX_IDS.uiConfirmNormal);
    const lup = levelUpPopupRef.current;
    if (
      lup?.isVisible &&
      lup.level === 2 &&
      activeGardenIdRef.current === DEFAULT_GARDEN_ID
    ) {
      setGardenLevelIntroSkipNonce((n) => n + 1);
      return;
    }
    if (activeFtueStageRef.current != null) {
      skipStarterFtueAndLevelUpRef.current();
      return;
    }
    if (collectionFtuePhase != null && !collectionFtueCompleted) {
      setCollectionFtuePhase(null);
      setCollectionFtueCompleted(true);
      setCollectionFtueBonusesReached(true);
      setCollectionFtuePanelChromeUnlocked(true);
      setCollectionFtueOverlayFadingOut(false);
      setCollectionFtueBonusesFading(false);
      setCollectionFtueHoleRect(null);
      return;
    }
    if (tasksFtueStarted && !tasksFtueCompleted) {
      setTasksFtueUnlockRevealed(true);
      setTasksFtueCompleted(true);
      setTasksFtueHoleRect(null);
      return;
    }
    if (gardensFtueStarted && !gardensFtueCompleted) {
      setGardensFtueUnlockRevealed(true);
      setGardensFtueCompleted(true);
      setGardensFtueHoleRect(null);
      return;
    }
    if (newGardenFtuePhase != null && !newGardenFtueCompleted) {
      setNewGardenFtuePhasePersisted(null, true);
    }
  }, [
    collectionFtuePhase,
    collectionFtueCompleted,
    tasksFtueStarted,
    tasksFtueCompleted,
    gardensFtueStarted,
    gardensFtueCompleted,
    newGardenFtuePhase,
    newGardenFtueCompleted,
    setNewGardenFtuePhasePersisted,
  ]);

  devCheatHandlersRef.current = {
    unlockPlant: handleDevUnlockPlantClick,
    levelUp: handleDevLevelUpClick,
    goldenPot: handleDevGoldenPotClick,
    addMoney: handleDevAddMoneyClick,
    addGoal: handleDevAddGoalClick,
    skipTutorial: handleDevSkipTutorial,
  };

  const purchaseGardenFromPicker = useCallback(
    (gardenId: GardenId) => {
      if (gardenId === DEFAULT_GARDEN_ID) return;

      const v2 = loadGameSaveV2();
      if (!v2) return;
      if ((v2.gardensStarted ?? []).includes(gardenId)) return;

      const price = getGardenPickerPurchaseCoinPrice();
      if (moneyRef.current < price) return;

      setMoney((m) => m - price);

      let nextV2 = ensureGardenStartedInSave(v2!, gardenId);
      const payerGardenId = activeGardenIdRef.current;
      const payerGarden = nextV2.gardens[payerGardenId];
      if (payerGarden) {
        nextV2 = {
          ...nextV2,
          gardens: {
            ...nextV2.gardens,
            [payerGardenId]: {
              ...payerGarden,
              money: payerGarden.money - price,
            },
          },
          savedAt: Date.now(),
        };
      } else {
        nextV2 = { ...nextV2, savedAt: Date.now() };
      }
      persistGameSaveV2(nextV2);
      setCollectionSaveRevision((r) => r + 1);

      const isFirstGarden2Purchase =
        gardenId === 'garden_2' && !newGardenFtueCompleted && !(v2.gardensStarted ?? []).includes('garden_2');
      if (isFirstGarden2Purchase) {
        setNewGardenFtuePhasePersisted('picker_view');
      }
    },
    [newGardenFtueCompleted, setNewGardenFtuePhasePersisted],
  );

  const applyGardenSwitchState = useCallback(
    (targetId: GardenId) => {
      if (activeScreenRef.current === 'BARN') {
        barnScrollYByGardenRef.current[activeGardenIdRef.current] = barnScrollYRef.current;
      }
      const savedAtBeforePersist = loadGameSaveV2()?.savedAt;
      persistGameSnapshotRef.current();
      let v2 = loadGameSaveV2();
      if (!v2) return 0;
      const leavingId = v2.activeGardenId;
      const now = Date.now();
      if (leavingId !== targetId) {
        v2 = markGardenBecameInactive(v2, leavingId, now);
      }
      // Ensure the garden we're entering gets seed/harvest catch-up (same sim as offline earnings).
      // No-ops if persist already idle-simmed it within the last second.
      v2 = catchUpGardenAbsence(v2, targetId, now, 'pending', {
        previousSavedAt: savedAtBeforePersist,
      });
      const nextV2 = activateGardenInSave(v2, targetId);
      persistGameSaveV2({ ...nextV2, savedAt: now });
      activeGardenIdRef.current = targetId;
      setActiveGardenId(targetId);
      setActiveGardenAssetContext(targetId);
      setDailyTasksActiveGarden(targetId);
      const flat = normalizeGameSaveV1(flattenV2ToV1({ ...nextV2, savedAt: Date.now() }));
      const idleDisplay = hydrateFromSave(flat, { skipOfflineSim: true });
      if (targetId === DEFAULT_GARDEN_ID) {
        setGarden1PlayerLevel(flat.playerLevel);
      }
      setFarmFloatingButtonsVisible(
        shouldShowFarmFloatingButtons(targetId, flat.playerLevel),
      );
      setIsExpanded(false);
      setActiveScreen('FARM');
      rollDailyTasksPeriodIfExpired();
      setDailyAllowanceDayRefreshKey((k) => k + 1);
      setDailyTaskRows(ensureDailyTasksDay(getDailyTasksCtx()));
      setDailyTasksCountdownRefreshKey((k) => k + 1);
      return idleDisplay;
    },
    [getDailyTasksCtx, hydrateFromSave],
  );

  const switchToGarden = useCallback(
    (targetId: GardenId, options?: { bypassUnlockCheck?: boolean }) => {
      if (targetId === activeGardenIdRef.current) return;
      if (gardenSwitchTransitionRef.current) return;
      if (!options?.bypassUnlockCheck && targetId !== DEFAULT_GARDEN_ID) {
        const selectable = getSelectableGardenIds();
        if (!selectable.includes(targetId)) return;
      }

      gardenSwitchTransitionRef.current = true;
      setGardenPickerOpen(false);

      const preloadPromise = preloadGardenSwitchAssets(targetId);
      setGardenSwitchOverlayActive(true);
      setGardenSwitchOverlayOpacity(0);

      void (async () => {
        try {
          await animateGardenSwitchOverlayOpacity(
            setGardenSwitchOverlayOpacity,
            0,
            1,
            GARDEN_SWITCH_FADE_OUT_MS,
          );

          const holdDeadline = Date.now() + GARDEN_SWITCH_HOLD_MS;
          const idleDisplay = applyGardenSwitchState(targetId);
          await preloadPromise;
          const holdRemaining = holdDeadline - Date.now();
          if (holdRemaining > 0) await sleepMs(holdRemaining);

          await animateGardenSwitchOverlayOpacity(
            setGardenSwitchOverlayOpacity,
            1,
            0,
            GARDEN_SWITCH_FADE_IN_MS,
          );

          if (idleDisplay > 0) {
            pendingSwitchGardenAdBreakRef.current = true;
            showIdleEarningsPopup(idleDisplay, 300);
          } else {
            tryShowAdBreakRef.current('switch_garden');
          }
        } finally {
          gardenSwitchTransitionRef.current = false;
          setGardenSwitchOverlayOpacity(0);
          setGardenSwitchOverlayActive(false);
        }
      })();
    },
    [applyGardenSwitchState, getSelectableGardenIds, showIdleEarningsPopup],
  );

  const cycleActiveGarden = useCallback(() => {
    const selectable = getSelectableGardenIds();
    if (selectable.length <= 1) return;
    const current = activeGardenIdRef.current;
    const idx = selectable.indexOf(current);
    const next = selectable[(idx >= 0 ? idx + 1 : 0) % selectable.length];
    switchToGarden(next);
  }, [getSelectableGardenIds, switchToGarden]);

  useEffect(() => {
    if (activeGardenId === DEFAULT_GARDEN_ID) {
      setGarden1PlayerLevel(playerLevel);
    } else {
      const v2 = loadGameSaveV2();
      setGarden1PlayerLevel(v2?.gardens[DEFAULT_GARDEN_ID]?.playerLevel ?? 1);
    }
  }, [activeGardenId, playerLevel]);

  const handleQuickResumeHydrate = useCallback(() => {
    const save = loadSaveForGameplayHydrate();
    if (!save || save.v !== GAME_SAVE_VERSION) return;
    syncActiveGardenFromSave();
    pendingQuickLoadFinishRef.current = true;
    const ftue11Completed =
      save.activeFtueStage === null &&
      save.ftueSeedSurplusActivated === true &&
      save.ftueHarvestSurplusActivated === true;

    // If FTUE 11 wasn't completed, treat this as a fresh run:
    // clear any partial progress save so the user restarts from splash/FTUE welcome.
    if (!ftue11Completed) {
      suppressGameSaveRef.current = true;
      clearGameSave();
      suppressGameSaveRef.current = false;

      ftue11PersistenceEnabledRef.current = false;
      pendingOfflineEarningsRef.current = 0;
      setOfflineEarningsUi(null);
      setDeferNewGardenFtueUiForOffline(false);
      pendingCorruptSavePopupRef.current = false;
      consumeRestoredFromBackupFlag();
      setActiveFtueStage('welcome');
      setIsExpanded(false);
      setActiveScreen('FARM');
      return;
    }

    ftue11PersistenceEnabledRef.current = true;
    const totalOffline = hydrateFromSave(save, { skipOfflineSim: true });
    if (consumeRestoredFromBackupFlag()) {
      pendingCorruptSavePopupRef.current = true;
    }
    const v2AfterLoad = loadGameSaveV2();
    const gardenId = v2AfterLoad?.activeGardenId ?? DEFAULT_GARDEN_ID;
    if (shouldShowFarmFloatingButtons(gardenId, save.playerLevel)) {
      setFarmFloatingButtonsVisible(true);
    }
    setIsExpanded(false);
    setActiveScreen('FARM');
    showIdleEarningsPopup(totalOffline, 610);
  }, [hydrateFromSave, loadSaveForGameplayHydrate, showIdleEarningsPopup, syncActiveGardenFromSave]);

  // Splash complete OR quick resume black fade complete — fade in gameplay
  const handleLoadComplete = useCallback(() => {
    if (pendingQuickLoadFinishRef.current) {
      pendingQuickLoadFinishRef.current = false;
      setIsLoading(false);
      const fadeInDuration = 340;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const newOpacity = Math.min(1, elapsed / fadeInDuration);
        setGameOpacity(newOpacity);
        if (elapsed < fadeInDuration) requestAnimationFrame(animate);
        else setGameOpacity(1);
      };
      requestAnimationFrame(animate);
      return;
    }

    const save = loadSaveForGameplayHydrate();
    if (save && save.v === GAME_SAVE_VERSION) {
      syncActiveGardenFromSave();
      const ftue11Completed =
        save.activeFtueStage === null &&
        save.ftueSeedSurplusActivated === true &&
        save.ftueHarvestSurplusActivated === true;

      if (!ftue11Completed) {
        suppressGameSaveRef.current = true;
        clearGameSave();
        suppressGameSaveRef.current = false;

        ftue11PersistenceEnabledRef.current = false;
        setActiveFtueStage('welcome');
        pendingOfflineEarningsRef.current = 0;
        setOfflineEarningsUi(null);
        setDeferNewGardenFtueUiForOffline(false);
        pendingCorruptSavePopupRef.current = false;
        consumeRestoredFromBackupFlag();
        setIsExpanded(false);
        setActiveScreen('FARM');
      } else {
        ftue11PersistenceEnabledRef.current = true;
        const totalOffline = hydrateFromSave(save, { skipOfflineSim: true });
        if (consumeRestoredFromBackupFlag()) {
          pendingCorruptSavePopupRef.current = true;
        }
        const v2AfterLoad = loadGameSaveV2();
        const gardenId = v2AfterLoad?.activeGardenId ?? DEFAULT_GARDEN_ID;
        if (shouldShowFarmFloatingButtons(gardenId, save.playerLevel)) {
          setFarmFloatingButtonsVisible(true);
        }
        setIsExpanded(false);
        setActiveScreen('FARM');
        showIdleEarningsPopup(totalOffline, 770);
        try {
          const pendingLevel = sessionStorage.getItem(DEV_SKIP_STARTER_FTUE_LEVEL_UP_KEY);
          if (pendingLevel) {
            sessionStorage.removeItem(DEV_SKIP_STARTER_FTUE_LEVEL_UP_KEY);
            const level = Number(pendingLevel);
            if (Number.isFinite(level) && level > 0) {
              pendingLevelUpBackupRef.current = {
                gardenId,
                level,
              };
              window.setTimeout(() => {
                presentLevelUpPopupRef.current(level);
              }, 600);
            }
          }
        } catch { /* ignore */ }
      }
    } else {
      ftue11PersistenceEnabledRef.current = false;
      setActiveFtueStage('welcome');
      pendingOfflineEarningsRef.current = 0;
      setOfflineEarningsUi(null);
      setDeferNewGardenFtueUiForOffline(false);
    }

    setIsLoading(false);
    const fadeInDuration = 500;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newOpacity = Math.min(1, elapsed / fadeInDuration);
      setGameOpacity(newOpacity);
      if (elapsed < fadeInDuration) {
        requestAnimationFrame(animate);
      } else {
        setGameOpacity(1);
      }
    };
    requestAnimationFrame(animate);
  }, [hydrateFromSave, loadSaveForGameplayHydrate, showIdleEarningsPopup, syncActiveGardenFromSave]);

  const resumeIdleEarningsFromBackgroundRef = useRef<() => void>(() => {});
  resumeIdleEarningsFromBackgroundRef.current = () => {
    if (!ftue11PersistenceEnabledRef.current) return;
    const save = loadSaveForGameplayHydrate();
    if (!save || save.v !== GAME_SAVE_VERSION) return;
    syncActiveGardenFromSave();
    const totalOffline = hydrateFromSave(save, { skipOfflineSim: true });
    if (totalOffline > 0 && !offlineEarningsOpenRef.current) {
      showIdleEarningsPopup(totalOffline, 300);
    }
  };

  persistGameSnapshotRef.current = () => {
    if (suppressGameSaveRef.current) return;
    if (!ftue11PersistenceEnabledRef.current) return;
    if (isLoading) return;
    const payload: GameSaveV1 = {
      v: GAME_SAVE_VERSION,
      savedAt: Date.now(),
      pendingOfflineEarnings: pendingOfflineEarningsRef.current,
      money: moneyRef.current,
      grid,
      seedProgress: seedProgressRef.current,
      harvestProgress: harvestProgressRef.current,
      harvestCharges: harvestChargesRef.current,
      seedsState,
      harvestState,
      cropsState,
      seedsInStorage: seedsInStorageRef.current,
      highestPlantEver,
      playerLevel,
      playerLevelProgress,
      plantMasteryGoalsCompleted,
      plantMasteryOrdersProgress: plantMastery.ordersProgress,
      plantMasteryTargetLevel: plantMastery.targetLevel,
      plantMasteryUnlockPending: [...plantMastery.unlockPending],
      plantMasteryUnlockedLevels: [...plantMastery.unlockedLevels],
      plantMasteryIntroBarComplete: plantMastery.plantMasteryIntroBarComplete,
      collectionFtueCompleted,
      collectionFtuePhase: collectionFtueCompleted ? null : collectionFtuePhase,
      collectionFtueBonusesReached,
      collectionFtueRestartPending,
      tasksFtueStarted,
      tasksFtueUnlockRevealed,
      tasksFtueCompleted,
      gardensFtueStarted,
      gardensFtueUnlockRevealed,
      gardensFtueCompleted,
      newGardenFtueCompleted,
      newGardenFtuePhase: newGardenFtueCompleted ? null : newGardenFtuePhase,
      activeTab,
      activeScreen,
      isExpanded,
      rewardedOffers: rewardedOffers.map((o) => normalizeRewardedOfferForSave(o)),
      barnNotification,
      barnShelvesUnlocked: normalizeBarnShelvesUnlocked(),
      goalSlots,
      goalPlantTypes,
      goalLoadingSeconds,
      goalCounts,
      goalAmountsRequired,
      goalCompletedValues,
      goalDisplayOrder,
      goalDiscoveryLightGreenActive: [...goalDiscoveryLightGreenActive],
      coinGoalVisible,
      coinGoalValue,
      coinGoalTimeRemaining,
      newGoalsSinceDiscovery: Math.max(
        0,
        getDiscoveryGoalBuffer(highestPlantEver) - discoveryGoalsRemainingRef.current
      ),
      discoveryGoalsRemaining: discoveryGoalsRemainingRef.current,
      lastMergeDiscoveryLevel: lastMergeDiscoveryLevelRef.current,
      lastSpawnedGoalLevels: [...lastSpawnedGoalLevelsRef.current] as [number, number],
      activeFtueStage,
      ftue2SeedFireCount,
      ftue2FadingOut,
      ftue3FadingOut,
      ftue4Pending,
      ftue4FadingOut,
      ftue7Scheduled,
      ftue7UnrevealedSlots,
      ftue7RevealMode,
      ftue7SeedFireCount,
      ftue7FadingOut,
      ftue8FadingOut,
      ftue9CollectedCount,
      ftue9FadingOut,
      ftue10Phase,
      ftue10GreenFlashUpgradeId,
      ftue10FadingOut,
      ftueSeedSurplusActivated,
      ftueHarvestSurplusActivated,
      ftue10PostClosePending,
      ftue10ButtonsNormalEarly,
      ftue11StartQueued,
      postFtueHarvestNudgeDone: postFtueHarvestNudgeDone === null ? undefined : postFtueHarvestNudgeDone,
      ftueUpgradePanelVisible,
      ftuePlayerLevelVisible,
      activeBoosts,
      musicEnabled,
      sfxEnabled,
      pendingUnlockUpgradeId,
      levelUpPopupQueue,
      wildGrowthAccumulatorMs: wildGrowthAccumMsRef.current,
      dailyAllowanceClaimedDayKey,
      storeFreeOfferSlots,
      storeSlotCooldownEnds,
      lastAdBreakAt: adBreakRuntimeRef.current.lastAdBreakAt || undefined,
      lastRewardedAdAt: adBreakRuntimeRef.current.lastRewardedAdAt || undefined,
      adBreakActivePlaytimeMs: adBreakRuntimeRef.current.activePlaytimeMs || undefined,
    };
    const normalized = normalizeGameSaveV1({ ...payload, v: GAME_SAVE_VERSION });
    const existing = loadGameSaveV2();
    if (!existing) {
      persistGameSave(payload, { activeGardenId: activeGardenIdRef.current });
      return;
    }
    const previousSavedAt = existing.savedAt;
    let v2 = mergeV1IntoV2(existing, normalized);
    if (activeScreenRef.current === 'BARN') {
      barnScrollYByGardenRef.current[activeGardenIdRef.current] = barnScrollYRef.current;
    }
    v2.activeGardenId = activeGardenIdRef.current;
    v2 = applyIdleEarningsToInactiveGardens(v2, payload.savedAt, { previousSavedAt });
    v2 = applyCollectionScrollYToV2(v2, barnScrollYByGardenRef.current);
    persistGameSaveV2(v2);
  };

  const autoCollectOfflineEarningsForUnload = () => {
    if (!offlineEarningsOpenRef.current) return;
    if (offlineEarningsAutoCollectedRef.current) return;

    // Only trust the pending bank value: collect button immediately sets this to 0.
    // That prevents any chance of double-credit if pagehide happens right after Collect.
    const amtToCollect = applyGoldenPotOfflineEarningsBonus(
      pendingOfflineEarningsRef.current,
      unlockedBonusTierSetRef.current,
    );
    if (amtToCollect <= 0) {
      pendingOfflineEarningsRef.current = 0;
      offlinePopupAmountRef.current = 0;
      offlineEarningsAutoCollectedRef.current = true;
      setOfflineEarningsUi(null);
      setDeferNewGardenFtueUiForOffline(false);
      lastOfflineEarningsClosedAtRef.current = Date.now();
      return;
    }

    pendingOfflineEarningsRef.current = 0;
    offlinePopupAmountRef.current = 0;
    offlineEarningsAutoCollectedRef.current = true;

    // Synchronous update for persistence (pagehide may happen before React re-renders).
    // Offline bank already reflects boosted surplus etc. from sim — no shop Double Coins here.
    const credit = amtToCollect;
    moneyRef.current += credit;
    setMoney((prev) => prev + credit);

    // Prevent "welcome back" popup on next launch.
    setOfflineEarningsUi(null);
    setDeferNewGardenFtueUiForOffline(false);
    lastOfflineEarningsClosedAtRef.current = Date.now();
  };

  useEffect(() => {
    offlinePopupAmountRef.current = offlineEarningsUi?.amount ?? 0;
  }, [offlineEarningsUi?.amount]);

  /** Re-apply Offline Boost (+25%) when golden pot count crosses 24 or popup is open. */
  useEffect(() => {
    const raw = pendingOfflineEarningsRef.current;
    if (raw <= 0) return;
    const display = applyGoldenPotOfflineEarningsBonus(raw, unlockedBonusTierSet);
    if (!offlineEarningsUi?.open) return;
    if (display === offlineEarningsUi.amount) return;
    setOfflineEarningsUi((prev) =>
      prev?.open ? { ...prev, amount: display } : prev,
    );
  }, [unlockedBonusTierSet, offlineEarningsUi?.open, offlineEarningsUi?.amount]);

  /** Persist once when leaving loading screen so quick refresh doesn’t lose a new session. */
  useEffect(() => {
    if (isLoading) return;
    persistGameSnapshotRef.current();
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;
    if (deferNewGardenFtueUiForOffline) return;
    if (offlineEarningsUi?.open) return;
    if (newGardenFtueCompleted) return;
    if (newGardenFtuePhase !== 'picker_view') return;
    if (gardenPickerOpen) return;
    setGardenPickerOpen(true);
  }, [
    isLoading,
    deferNewGardenFtueUiForOffline,
    offlineEarningsUi?.open,
    newGardenFtueCompleted,
    newGardenFtuePhase,
    gardenPickerOpen,
  ]);

  /** Corrupt-save notice after idle coins (same gate as forced new-garden picker). */
  useEffect(() => {
    if (isLoading) return;
    if (!pendingCorruptSavePopupRef.current) return;
    if (deferNewGardenFtueUiForOffline) return;
    if (offlineEarningsUi?.open) return;
    if (corruptSavePopupOpen) return;
    pendingCorruptSavePopupRef.current = false;
    setCorruptSavePopupOpen(true);
  }, [
    isLoading,
    deferNewGardenFtueUiForOffline,
    offlineEarningsUi?.open,
    corruptSavePopupOpen,
  ]);

  const appHiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) return;
    const id = window.setInterval(() => persistGameSnapshotRef.current(), 5000);
    const flush = () => {
      autoCollectOfflineEarningsForUnload();
      persistGameSnapshotRef.current();
    };
    window.addEventListener('pagehide', flush);
    const vis = () => {
      if (document.visibilityState === 'hidden') {
        appHiddenAtRef.current = Date.now();
        flush();
        return;
      }
      if (document.visibilityState !== 'visible') return;
      const hiddenAt = appHiddenAtRef.current;
      appHiddenAtRef.current = null;
      if (hiddenAt == null || Date.now() - hiddenAt < 1000) return;
      resumeIdleEarningsFromBackgroundRef.current();
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      clearInterval(id);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', vis);
    };
  }, [isLoading]);

  /** Dev keyboard shortcuts — work whenever the game tab is focused (not only when Dev Tools is open).
   * Shift+P unlock plant · Shift+L level up · Shift+G +1 goal · Shift+T skip tutorial · Shift+M money
   */
  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      return target.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();
      const cheats = devCheatHandlersRef.current;
      if (key === 'p') {
        e.preventDefault();
        cheats.unlockPlant({ deferPopups: false });
      } else if (key === 'l') {
        e.preventDefault();
        cheats.levelUp({ deferPopups: false });
      } else if (key === 'g') {
        e.preventDefault();
        cheats.addGoal();
      } else if (key === 't') {
        e.preventDefault();
        cheats.skipTutorial();
      } else if (key === 'm') {
        e.preventDefault();
        cheats.addMoney();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, []);

  return (
    <ErrorBoundary>
      <>
        <style>{`
          @keyframes ftue11ButtonBigBounce {
            0% { transform: scale(0.99); }
            30% { transform: scale(1.32); }
            55% { transform: scale(0.88); }
            75% { transform: scale(1.045); }
            100% { transform: scale(0.99); }
          }
          @keyframes ftue11ButtonBounce {
            0%, 100% { transform: scale(0.99); }
            50% { transform: scale(1.1); }
          }
        `}</style>
      {/* Loading Screen */}
      {isLoading && (
        <LoadingScreen
          variant="splash"
          onLoadComplete={handleLoadComplete}
        />
      )}
      {gardenSwitchOverlayActive ? (
        <div
          className="fixed inset-0 pointer-events-auto"
          style={{
            zIndex: 5000,
            backgroundColor: GARDEN_SWITCH_OVERLAY_COLOR,
            opacity: gardenSwitchOverlayOpacity,
          }}
          aria-hidden
        />
      ) : null}
      <div
        ref={viewportWrapperRef}
        className="fixed inset-0 flex justify-center items-center overflow-hidden bg-black"
        style={{
          opacity: gameOpacity,
          height: viewportHeight,
          minHeight: viewportHeight,
          boxSizing: 'border-box',
        }}
      >
      <FakeNotchOverlay visible={fakeNotchPreviewEnabled && !isLoading} />
      <div
        ref={safeInsetProbeRef}
        aria-hidden
        className="fixed top-0 left-0 h-0 w-0 pointer-events-none overflow-hidden"
        style={{ paddingTop: `max(${safeTop}px, env(safe-area-inset-top, 0px))` }}
      />
      <div
        className="relative flex items-end justify-center overflow-hidden shrink-0 box-border w-full h-full"
        style={{
          width: viewportWidth,
          height: viewportHeight,
          // Do NOT pad safe-area-inset-bottom here. Navbar already extends into the home-indicator
          // zone. paddingBottom + border-box + items-center made the canvas taller than the content
          // box and vertically centered it — on tall phones (iPhone 12, Fold) that shifted the whole
          // UI up so the closed upgrade peek looked too high. SE / iPad (≈0 inset) were unaffected.
        }}
      >
      <div
        className="relative overflow-hidden shrink-0"
        style={{
          width: designWidth * appScale,
          height: designHeight * appScale,
        }}
      >
      <div
        ref={containerRef}
        id="game-container"
        className="absolute left-0 top-0 overflow-hidden flex flex-col select-none font-['Inter'] bg-black"
        style={{
          width: `${designWidth}px`,
          height: `${designHeight}px`,
          transform: `scale(${appScale})`,
          transformOrigin: 'top left',
        }}
      >
        <div className="flex-grow relative overflow-hidden min-h-0" style={{ zIndex: 10 }}>
          <div 
            className="absolute inset-0 flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: screenTranslateX, width: designWidth * 3 }}
          >
            <div className="h-full shrink-0 bg-[#5b433c] flex flex-col min-h-0" style={{ width: designWidth }}>
              <StoreScreen
                safeTopInsetPx={safeTopInsetDesign}
                money={money}
                walletFlashActive={walletFlashActive}
                onAddMoney={(amt) => setMoney(prev => prev + amt)}
                onSettingsClick={() => {
                  playSfx(SFX_IDS.uiConfirmNormal);
                  setPauseMenuOpen(true);
                }}
                onFreeOfferClick={(offerId, slotIndex, buttonRect, particleOriginRect) => {
                  if (offerId === STORE_DAILY_ALLOWANCE_OFFER_ID) {
                    handleDailyAllowanceClaim(buttonRect, particleOriginRect);
                    return;
                  }
                  playSfx(SFX_IDS.uiConfirmReward);
                  pendingAdSourceRef.current = 'storeFreeOffer';
                  pendingOfferIdRef.current = offerId;
                  openRewardedFakeAd();
                  setPendingAdComplete(() => () => {
                    setShowFakeAd(false);
                    setStoreSlotCooldownEnds((ends) => {
                      const next: [number, number] = [...ends] as [number, number];
                      next[slotIndex] = Date.now() + getRemoteConfig().ads.specialOffer.storeFreeOfferCooldownMs;
                      return next;
                    });
                  });
                }}
                activeBoosts={activeBoosts}
                activeBoostAreaRef={storeActiveBoostAreaRef}
                headerLeftWrapperRef={storeHeaderLeftWrapperRef}
                onBoostComplete={(id, rect) => {
                  setActiveBoosts((prev) => prev.filter((b) => b.id !== id));
                  if (rect) {
                    setBoostBursts((prev) => [
                      ...prev,
                      {
                        id: `boost-burst-${Date.now()}`,
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                        startTime: Date.now(),
                      },
                    ]);
                  }
                }}
                onBoostClick={(boost) => {
                  playSfx(SFX_IDS.uiConfirmNormal);
                  if (!boost.offerId) return;
                  if (!canOpenLimitedOfferRewardPopup()) return;
                  const state = buildLimitedOfferPopupState(boost.offerId, { activeBoostEndTime: boost.endTime, highestPlantEver });
                  if (state) setLimitedOfferPopup(state);
                }}
                walletRef={storeWalletRef}
                walletIconRef={storeWalletIconRef}
                dailyAllowanceSlot0={dailyAllowanceSlot0}
                dailyAllowanceHideIcon={dailyAllowanceHideIcon}
                storeFreeOfferSlots={storeFreeOfferSlots}
                storeSlotCooldownEnds={storeSlotCooldownEnds}
                onStoreSlotCooldownEnded={handleStoreSlotCooldownEnded}
                onStoreCoinPurchase={completePremiumStorePurchase}
                scrollToCoinSectionRequest={storeScrollToCoinSectionRequest}
                starterPackPurchased={starterPackPurchased}
                starterPackUnlocked={starterPackUnlocked}
                starterPackCountdownRefreshKey={starterPackCountdownRefreshKey}
                fieldPackPurchased={fieldPackPurchased}
                fieldPackUnlocked={fieldPackUnlocked}
                fieldPackCountdownRefreshKey={fieldPackCountdownRefreshKey}
              />
            </div>

            <div
              ref={farmColumnRef}
              className="h-full shrink-0 flex flex-col relative overflow-hidden bg-black"
              style={{ width: designWidth }}
            >
              {/* Grass: full-bleed; shifts with hex half-travel so coverage never gaps. */}
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden z-[5]"
                aria-hidden
              >
                <div
                  ref={gardenGrassBgRef}
                  className="absolute left-0 right-0 top-0 bg-no-repeat"
                  style={{
                    backgroundImage: `url(${assetPath(gardenBg.grass)})`,
                    backgroundSize: 'auto 100%',
                    backgroundPosition: 'top center',
                  }}
                />
              </div>

              {/* Center: pinned to hex grid; above grass, below bottom/left/right/gradient */}
              <img
                ref={gardenCenterBgRef}
                src={assetPath(gardenBg.center)}
                alt=""
                className="absolute pointer-events-none z-[5] max-w-none"
                draggable={false}
                style={{
                  left: 0,
                  top: 0,
                  width: 'auto',
                  height: 'auto',
                }}
                aria-hidden
              />

              {/* Bottom accent: bottom-center pinned; above center, below left/right */}
              <img
                ref={gardenBottomBgRef}
                src={assetPath(gardenBg.bottom)}
                alt=""
                className="absolute bottom-0 left-1/2 pointer-events-none z-[6] max-w-none"
                draggable={false}
                style={{
                  width: 'auto',
                  height: 'auto',
                  transformOrigin: 'bottom center',
                }}
                aria-hidden
              />

              {/* Side sprites: bottom corners; above bottom, below gradient */}
              <img
                ref={gardenLeftBgRef}
                src={assetPath(gardenBg.left)}
                alt=""
                className="absolute bottom-0 left-0 pointer-events-none z-[7] max-w-none"
                draggable={false}
                style={{
                  width: 'auto',
                  height: 'auto',
                  transformOrigin: 'bottom left',
                }}
                aria-hidden
              />
              <img
                ref={gardenRightBgRef}
                src={assetPath(gardenBg.right)}
                alt=""
                className="absolute bottom-0 right-0 pointer-events-none z-[7] max-w-none"
                draggable={false}
                style={{
                  width: 'auto',
                  height: 'auto',
                  transformOrigin: 'bottom right',
                }}
                aria-hidden
              />

              {/* Center top: same hex anchor as center; above bottom/left/right, below gradient */}
              <img
                ref={gardenCenterTopBgRef}
                src={assetPath(gardenBg.centerTop)}
                alt=""
                className="absolute pointer-events-none z-[7] max-w-none"
                draggable={false}
                style={{
                  left: 0,
                  top: 0,
                  width: 'auto',
                  height: 'auto',
                }}
                aria-hidden
              />

              {/* Bottom gradient: same scale as bottom/left/right; full width stretch; height not stretched */}
              <div
                ref={gardenGradientBgRef}
                className="absolute left-0 right-0 bottom-0 pointer-events-none overflow-hidden z-[8]"
                aria-hidden
              >
                <img
                  src={assetPath(gardenBg.gradient)}
                  alt=""
                  className="block w-full max-w-none"
                  draggable={false}
                  style={{
                    width: '100%',
                    height:
                      gardenGradientHeightPx != null
                        ? gardenGradientHeightPx * GARDEN_SIDE_SPRITE_SCALE
                        : 'auto',
                    objectFit: 'fill',
                    objectPosition: 'bottom center',
                  }}
                  onLoad={(e) => {
                    const h = e.currentTarget.naturalHeight;
                    if (h > 0) setGardenGradientHeightPx(h);
                  }}
                />
              </div>

              {/* Top UI gradient: above grass, below top UI & hex; top pinned; full sprite visible, stretched horizontally */}
              <div
                className="absolute left-0 right-0 top-0 pointer-events-none z-[6] overflow-hidden"
                style={{ height: '280px' }}
              >
                <img
                  src={topUiGradientSrc}
                  alt=""
                  className="block w-full h-full"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'fill',
                    objectPosition: 'top center',
                  }}
                />
              </div>

              {/* Gameplay UI — inset below notch; backgrounds above stay full-bleed to the physical top */}
              <div
                className="relative flex flex-col flex-grow min-h-0 z-10"
                style={{ paddingTop: safeTopInsetDesign }}
              >
              {/* Farm header only while Farm is the active column so walletRef targets the visible coin button */}
              <div className="relative z-50 w-full shrink-0">
                {activeScreen === 'FARM' ? (
                  <PageHeader
                    money={money}
                    walletRef={walletRef}
                    walletIconRef={walletIconRef}
                    walletFlashActive={walletFlashActive}
                    walletBurstCount={walletBounceTrigger}
                    onWalletClick={() => {
                      playSfx(SFX_IDS.uiConfirmNormal);
                      setActiveScreen('STORE');
                    }}
                    hidePlayerLevel={!ftuePlayerLevelVisible}
                    playerLevel={playerLevel}
                    playerLevelProgress={playerLevelProgress}
                    playerLevelFlashTrigger={playerLevelFlashTrigger}
                    playerLevelGoalsRequired={getGoalsRequiredForLevel(playerLevel)}
                    onPlayerLevelClick={() => {
                      if (!ftuePlayerLevelVisible) return;
                      setGardenLevelPopupOpen(true);
                    }}
                    onXpBoostClick={() => {
                      applyGoalCollectedProgress();
                      setPlayerLevelProgress((prev) => {
                        const next = prev + 1;
                        const goalsRequired = getGoalsRequiredForLevel(playerLevel);
                        if (next >= goalsRequired) {
                          if (!levelUpGuardRef.current) {
                            levelUpGuardRef.current = true;
                            const nextLevel = playerLevel + 1;
                            showLevelUpForNextLevel(nextLevel);
                            setTimeout(() => { levelUpGuardRef.current = false; }, 0);
                          }
                          return goalsRequired;
                        }
                        return next;
                      });
                      setPlayerLevelFlashTrigger((t) => t + 1);
                    }}
                    onGiftClick={() => {
                      if (!canOpenLimitedOfferRewardPopup()) return;
                      const state = buildLimitedOfferPopupState('seed_storm');
                      if (state) setLimitedOfferPopup(state);
                    }}
                    onPauseClick={() => {
                      playSfx(SFX_IDS.uiConfirmNormal);
                      setSettingsOpenedFromFtue(false);
                      setPauseMenuOpen(true);
                    }}
                    settingsButtonVisuallyHidden={activeFtueStage != null}
                    activeBoosts={activeBoosts}
                    activeBoostAreaRef={activeBoostAreaRef}
                    activeBoostMinWidthPx={ACTIVE_BOOST_INDICATOR_SIZE_PX}
                    headerLeftWrapperRef={headerLeftWrapperRef}
                    onBoostComplete={(id, rect) => {
                      setActiveBoosts((prev) => prev.filter((b) => b.id !== id));
                      if (rect) {
                        setBoostBursts((prev) => [
                          ...prev,
                          {
                            id: `boost-burst-${Date.now()}`,
                            x: rect.left + rect.width / 2,
                            y: rect.top + rect.height / 2,
                            startTime: Date.now(),
                          },
                        ]);
                      }
                    }}
                    onBoostClick={(boost) => {
                      playSfx(SFX_IDS.uiConfirmNormal);
                      if (!boost.offerId) return;
                      if (!canOpenLimitedOfferRewardPopup()) return;
                      const state = buildLimitedOfferPopupState(boost.offerId, { activeBoostEndTime: boost.endTime, highestPlantEver });
                      if (state) setLimitedOfferPopup(state);
                    }}
                    hideFps={false}
                    gardenId={activeGardenId}
                  />
                ) : (
                  <div className="min-h-[60px] shrink-0" aria-hidden />
                )}
              </div>

              {/* Goals Area - 5 goals, overlapping, left justified; compact when one completes (slide-over) */}
              <div 
                className="relative w-full z-20 flex-shrink-0 pointer-events-none"
                style={{ height: '85px', marginLeft: GOALS_AREA_LEFT_MARGIN_PX }}
              >
                <div 
                  className="absolute left-0 right-0 overflow-hidden"
                  style={{ top: -25, height: 110, paddingTop: 25 }}
                  data-goals-track
                >
                {[0, 1, 2, 3, 4].map((slotIdx) => {
                  const maxGoalSlots = getMaxPlantGoalSlots(unlockedBonusTierSet);
                  const visibleOrder = goalDisplayOrder.filter((i) => goalSlots[i] !== 'empty' && i < maxGoalSlots);
                  const goalDisplayIndex = visibleOrder.indexOf(slotIdx);
                  const state = goalSlots[slotIdx];
                  const isBouncing = goalBounceSlots.includes(slotIdx);
                  const isFtue4Bounce = activeFtueStage === 'first_goal' && slotIdx === 0 && !ftue4FadingOut;
                  const isTransitioning = goalTransitionSlot === slotIdx;
                  const isLoadingState = state === 'loading';
                  const isGreenState = state === 'green';
                  const isCompletedState = state === 'completed';
                  const isEmpty = state === 'empty';
                  const isFadingIn = slotIdx === goalSlotFadeInSlot;
                  const isFtue7RevealNoSlide = ftue7RevealMode && (slotIdx === 0 || slotIdx === 1);
                  const isFtue7Hidden = ftue7UnrevealedSlots.includes(slotIdx) && slotIdx !== goalSlotFadeInSlot;
                  const isSlidingUp = goalSlidingUpSlots.has(slotIdx);
                  const showSlot = !ftueHideGoals && (!isEmpty || isTransitioning || isCompletedState);
                  const loadingOpacity = isLoadingState ? (goalTransitionFade ? 0 : 1) : isTransitioning ? (goalTransitionFade ? 0 : 1) : 0;
                  const greenOpacity = isGreenState ? 1 : isTransitioning ? (goalTransitionFade ? 1 : 0) : 0;
                  const showGreenContent = isGreenState || (isTransitioning && goalTransitionFade);
                  const showCompletedContent = isCompletedState;
                  const showLoadingText = isLoadingState && !goalTransitionFade;
                  const plantLevelForGoal = goalPlantTypes[slotIdx] ?? slotIdx + 1;
                  const hForDiscoveryUi = highestPlantEverRef.current;
                  const postFtue11 = ftue11PersistenceEnabledRef.current;
                  const lightGreenEligible = isDiscoveryLightGreenEligible(
                    postFtue11,
                    ftue11ThreePlantGoalWindowActive,
                    plantLevelForGoal,
                    hForDiscoveryUi
                  );
                  const lightGreenDismissed = discoveryGoalLightGreenDismissed[slotIdx];
                  const lightGreenHeldAfterDiscover = goalDiscoveryLightGreenActive[slotIdx];
                  const showLightGreenDiscoveryFrame =
                    showGreenContent &&
                    !showCompletedContent &&
                    (lightGreenEligible || lightGreenHeldAfterDiscover) &&
                    !lightGreenDismissed;
                  const goalImpactActive = goalImpactSlots.includes(slotIdx) && !isCompletedState;
                  const handleCompletedTap = () => {
                    if (!isCompletedState || isSlidingUp) return;
                    playSfx(SFX_IDS.goalClaim);
                    if (slotIdx === 0 && activeFtueStage === 'first_goal_collect') {
                      setActiveFtueStage(null);
                      ftue7SkipLoadingSlot0Ref.current = true;
                      setFtue7Scheduled(true);
                      setActivePlantPanels((prev) => prev.filter((p) => p.goalSlotIdx !== 0 && p.goalSlotIdx !== 1));
                    }
                    if (activeFtueStage === 'first_collect_both') {
                      setFtue9CollectedCount((c) => {
                        const next = c + 1;
                        if (next >= 2) setFtue9FadingOut(true);
                        return next;
                      });
                    }
                    setGoalSlidingUpSlots((prev) => new Set(prev).add(slotIdx));
                    const iconEl = goalIconRefs[slotIdx]?.current;
                    const container = containerRef.current;
                    if (iconEl && container) {
                      const r = iconEl.getBoundingClientRect();
                      const cr = container.getBoundingClientRect();
                      const startX = (r.left + r.width / 2 - cr.left) / appScale;
                      const startY = (r.top + r.height / 2 - cr.top) / appScale;
                      const baseValue = goalCompletedValues[slotIdx] ?? 0;
                      const preDouble = baseValue * (activeBoosts.some(b => b.offerId === 'happiest_customers') ? 2 : 1);
                      const value = applyDoubleCoinsVisualAmount(preDouble, activeBoostsRef.current);
                      setActiveGoalCoinParticles((prev) => [...prev, { id: `goal-coin-${slotIdx}-${Date.now()}`, startX, startY, value }]);
                      applyGoalCollectedProgress();
                      // Player level: +1 progress on tap (not when coins hit wallet). Goals required = 2^level (2, 4, 8, ...)
                      setPlayerLevelProgress((prev) => {
                        const next = prev + 1;
                        const goalsRequired = getGoalsRequiredForLevel(playerLevel);
                        if (next >= goalsRequired) {
                          if (!levelUpGuardRef.current) {
                            levelUpGuardRef.current = true;
                            const nextLevel = playerLevel + 1;
                            showLevelUpForNextLevel(nextLevel);
                            setTimeout(() => { levelUpGuardRef.current = false; }, 0);
                          }
                          return goalsRequired; // Stay at 100% until Unlock Now clicked
                        }
                        return next;
                      });
                      setPlayerLevelFlashTrigger((t) => t + 1);
                      if (!getPerformanceMode()) {
                        spawnGoalCoinLeafBurst({
                          id: `goal-coin-lb-${nextGoalCoinBurstIdRef.current++}`,
                          x: r.left + r.width / 2,
                          y: r.top + r.height / 2 + 30,
                          startTime: Date.now(),
                        });
                      }
                    }
                    setTimeout(() => {
                      const displayOrderBefore = goalDisplayOrder.filter((i) => goalSlots[i] !== 'empty');
                      const completedPosition = displayOrderBefore.indexOf(slotIdx);
                      const oldDisplayIndices = [0, 1, 2, 3, 4].map((i) => {
                        const p = displayOrderBefore.indexOf(i);
                        return p >= 0 ? p : -1;
                      });
                      const numSlidingGoals = displayOrderBefore.filter((_, pos) => pos > completedPosition).length;
                      const slideDurationMs = 350;
                      const staggerMs = 75;
                      const totalSlideMs = slideDurationMs + Math.max(0, numSlidingGoals - 1) * staggerMs;

                      setGoalSlots((s) => { const n = [...s]; n[slotIdx] = 'empty'; return n; });
                      setGoalPlantTypes((p) => { const n = [...p]; n[slotIdx] = 0; return n; });
                      setDiscoveryGoalLightGreenDismissed((p) => { const n = [...p]; n[slotIdx] = false; return n; });
                      setGoalDiscoveryLightGreenActive((p) => { const n = [...p]; n[slotIdx] = false; return n; });
                      setGoalCompletedValues((v) => { const n = [...v]; n[slotIdx] = 0; return n; });
                      setGoalSlidingUpSlots((prev) => { const next = new Set(prev); next.delete(slotIdx); return next; });
                      setGoalDisplayOrder((prev) => prev.filter((i) => i !== slotIdx));
                      setGoalCompactionStagger((prev) => ({
                        completedSlotIdx: slotIdx,
                        completedPosition,
                        oldDisplayIndices,
                        isOverlapping: prev !== null,
                      }));

                      setTimeout(() => {
                        setGoalCompactionStagger(null);
                        const maxSlots = getMaxPlantGoalSlots(unlockedBonusTierSet);
                        setGoalSlots((s) => {
                          if (ftue9NoNewGoalsRef.current) return s; // FTUE 9: no new goal loading; keep slot empty
                          const hasLoading = s.some((state) => state === 'loading');
                          if (hasLoading) return s;
                          const n = [...s];
                          if (n[slotIdx] === 'empty' && slotIdx < maxSlots) {
                            if (slotIdx === 0 && ftue7SkipLoadingSlot0Ref.current) return s; // FTUE 7 spawns slot 0 & 1 at 1s/1.2s
                            if (
                              slotIdx === 3 &&
                              activeScreenRef.current !== 'FARM' &&
                              firstThreePlantGoalSlotsFilled(n)
                            ) {
                              pendingFourthPlantGoalSlotRef.current = true;
                              return n;
                            }
                            n[slotIdx] = 'loading';
                            setGoalDisplayOrder((prev) => (prev.includes(slotIdx) ? prev : [...prev, slotIdx]));
                            setGoalSlotFadeInSlot(slotIdx);
                            setGoalLoadingSeconds(getGoalLoadingSeconds(harvestState, goldenPotCount));
                            setTimeout(() => setGoalSlotFadeInSlot(null), 500);
                            return n;
                          }
                          return s;
                        });
                      }, totalSlideMs);
                    }, 500);
                  };
                  const slideDelayMs = goalCompactionStagger && goalCompactionStagger.oldDisplayIndices[slotIdx] > goalCompactionStagger.completedPosition
                    ? (goalCompactionStagger.isOverlapping ? 0 : (goalCompactionStagger.oldDisplayIndices[slotIdx] - goalCompactionStagger.completedPosition - 1) * 75)
                    : 0;
                  return (
                    <div
                      key={slotIdx}
                      id={slotIdx === 0 ? 'goal-slot-0' : slotIdx === 1 ? 'goal-slot-1' : undefined}
                      data-goal-slot={slotIdx}
                      className={`absolute ${(isFadingIn || isFtue7RevealNoSlide || goalSpawnBounceSlots.includes(slotIdx)) ? 'goal-no-transition' : 'goal-slide-over'} ${isFtue4Bounce ? 'goal-bounce-ftue4' : (isBouncing || goalSpawnBounceSlots.includes(slotIdx)) && !isFadingIn ? 'goal-bounce' : ''} ${isFadingIn && (isBouncing || goalSpawnBounceSlots.includes(slotIdx)) ? 'goal-slot-fade-in-with-bounce' : isFadingIn ? 'goal-slot-fade-in' : ''} ${isSlidingUp ? 'goal-slide-up' : ''} ${showCompletedContent ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`}
                      style={{
                        width: '105px',
                        height: '210px',
                        marginRight: '-30px',
                        marginTop: '-25px',
                        left: goalDisplayIndex >= 0 ? goalDisplayIndex * GOALS_SLOT_STEP_PX : -9999,
                        opacity: isFtue7Hidden ? 0 : (isFadingIn ? undefined : (showSlot ? 1 : 0)),
                        visibility: goalDisplayIndex >= 0 ? 'visible' : 'hidden',
                        transitionDelay: slideDelayMs ? `${slideDelayMs}ms` : undefined,
                      }}
                      onClick={showCompletedContent && !isSlidingUp ? handleCompletedTap : undefined}
                    >
                      {showSlot && (
                        <>
                          <img src={goalSlotUi.shadow} alt="" className="absolute inset-0 w-full h-full object-contain object-top transition-opacity duration-100" style={{ zIndex: 1, opacity: greenOpacity }} />
                          <img src={goalSlotUi.loading} alt="" className="absolute inset-0 w-full h-full object-contain object-top transition-opacity duration-100" style={{ zIndex: 2, opacity: loadingOpacity }} />
                          <img
                            src={goalSlotUi.normal}
                            alt=""
                            className="absolute inset-0 w-full h-full object-contain object-top transition-opacity duration-100"
                            style={{
                              zIndex: 3,
                              opacity: greenOpacity * (showLightGreenDiscoveryFrame ? 0 : 1),
                            }}
                          />
                          <img src={goalSlotUi.yellow} alt="" className="absolute inset-0 w-full h-full object-contain object-top" style={{ zIndex: 4, opacity: 0 }} />
                          <img
                            src={goalSlotUi.undiscovered}
                            alt=""
                            className={`absolute inset-0 w-full h-full object-contain object-top ${goalImpactActive ? 'goal-impact-lightgreen' : ''}`}
                            style={{
                              zIndex: 5,
                              opacity: goalImpactActive ? undefined : showLightGreenDiscoveryFrame ? greenOpacity : 0,
                            }}
                          />
                          <img src={goalSlotUi.cream} alt="" className="absolute inset-0 w-full h-full object-contain object-top" style={{ zIndex: 5, opacity: isCompletedState ? 1 : 0 }} />
                          {showGreenContent && !showCompletedContent && (
                            <>
                              <img
                                ref={goalIconRefs[slotIdx]}
                                src={getGoalIconForPlantLevel(plantLevelForGoal)}
                                alt=""
                                className={`absolute left-1/2 object-contain pointer-events-none transition-opacity duration-100 ${goalImpactSlots.includes(slotIdx) || goalSpawnBounceSlots.includes(slotIdx) ? 'goal-icon-bounce' : ''}`}
                                style={{ zIndex: 6, bottom: '71%', width: 40, height: 40, opacity: greenOpacity, transform: 'translate(-50%, -2px)' }}
                              />
                              <span
                                className="absolute left-1/2 font-bold pointer-events-none transition-opacity duration-100"
                                style={{
                                  zIndex: 6,
                                  bottom: '62%',
                                  color: goalImpactSlots.includes(slotIdx)
                                    ? goalTextColors.impact
                                    : showLightGreenDiscoveryFrame
                                      ? goalTextColors.undiscovered
                                      : goalTextColors.normal,
                                  fontSize: '15px',
                                  opacity: greenOpacity,
                                  transform: 'translate(-50%, -1px)',
                                }}
                              >
                                {goalCounts[slotIdx]}
                              </span>
                            </>
                          )}
                          {showCompletedContent && (
                            <>
                              <img ref={goalIconRefs[slotIdx]} src={getGardenCoinIconPath()} alt="" className={`absolute left-1/2 object-contain pointer-events-none ${isBouncing ? 'goal-icon-bounce' : ''}`} style={{ zIndex: 6, bottom: '71%', width: 40, height: 40, transform: 'translate(-50%, -2px)' }} />
                              <span className="absolute left-1/2 font-bold pointer-events-none" style={{ zIndex: 6, bottom: '62%', color: '#c99959', fontSize: '15px', transform: 'translate(-50%, -1px)' }}>{formatCompactNumber(applyDoubleCoinsVisualAmount((goalCompletedValues[slotIdx] ?? 0) * (activeBoosts.some(b => b.offerId === 'happiest_customers') ? 2 : 1), activeBoosts))}</span>
                            </>
                          )}
                          {showLoadingText && (
                            <>
                              {/* Same anchor as green plant icon so Order Speed particle / leaf burst hit the timer art. */}
                              <div
                                ref={goalIconRefs[slotIdx]}
                                className="absolute left-1/2 pointer-events-none"
                                style={{ zIndex: 6, bottom: '71%', width: 40, height: 40, transform: 'translate(-50%, -2px)' }}
                                aria-hidden
                              />
                              <span className="absolute left-1/2 font-bold pointer-events-none" style={{ zIndex: 6, bottom: '64%', color: '#fff4d0', fontSize: '13px', transform: 'translate(-50%, -1px)', opacity: 0.75 }}>{goalLoadingSeconds}s</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
                {/* Coin goal: slot 5 on phone; far-right (mirrors left margin) on wide layouts with room for a 6th slot */}
                {coinGoalVisible && playerLevel >= 2 && !ftueHideGoals && (
                  <div
                    className={`absolute goal-slide-over ${coinGoalExitAnim ? 'goal-slide-up-exit' : 'pointer-events-auto cursor-pointer'} ${coinGoalExitAnim ? '' : coinGoalBounce ? 'goal-bounce' : ''}`}
                    style={{
                      width: '105px',
                      height: '210px',
                      marginRight: coinGoalPinnedRight ? 0 : '-30px',
                      marginTop: '-25px',
                      ...(coinGoalPinnedRight
                        ? { left: 'auto', right: GOALS_AREA_RIGHT_MARGIN_PX }
                        : { left: COIN_GOAL_SLOT_INDEX * GOALS_SLOT_STEP_PX }),
                      zIndex: 10,
                    }}
                    onClick={() => {
                      if (
                        showFakeAd ||
                        rewardedAdFadeInActive ||
                        rewardedAdBlackHoldActive ||
                        rewardedAdFadeOutActive ||
                        adBreakIntroActive ||
                        interstitialAdSlotActive ||
                        rewardedAdSlotActive
                      ) {
                        return;
                      }
                      playSfx(SFX_IDS.uiConfirmReward);
                      pendingAdSourceRef.current = 'coinGoal';
                      openRewardedFakeAd();
                      setPendingAdComplete(() => () => {
                        pendingAdSourceRef.current = null;
                        playSfx(SFX_IDS.goalClaim);
                        const happiestActive = activeBoostsRef.current.some(b => b.offerId === 'happiest_customers');
                        const effectiveValue = coinGoalValue * (happiestActive ? 2 : 1);
                        const iconEl = coinGoalIconRef.current;
                        const container = containerRef.current;
                        if (iconEl && container) {
                          const r = iconEl.getBoundingClientRect();
                          const cr = container.getBoundingClientRect();
                          const startX = (r.left + r.width / 2 - cr.left) / appScale;
                          const startY = (r.top + r.height / 2 - cr.top) / appScale;
                          if (!getPerformanceMode()) {
                            spawnGoalCoinLeafBurst({
                              id: `goal-coin-lb-${nextGoalCoinBurstIdRef.current++}`,
                              x: r.left + r.width / 2,
                              y: r.top + r.height / 2 + 30,
                              startTime: Date.now(),
                            });
                          }
                          setActiveGoalCoinParticles((prev) => [
                            ...prev,
                            {
                              id: `coin-goal-${Date.now()}`,
                              startX,
                              startY,
                              value: effectiveValue,
                              skipHappyCustomerRoll: true,
                              skipDoubleCoinsMultiplier: true,
                            },
                          ]);
                        }
                        applyDailyTaskRowsUpdate(recordDailyTaskCoinOrder(getDailyTasksCtx()));
                        lastCoinGoalHiddenAtRef.current = Date.now();
                        nextCoinGoalDelayRef.current = 30000 + Math.random() * 30000;
                        setCoinGoalVisible(false);
                        setCoinGoalTimeRemaining(30);
                      });
                    }}
                  >
                    <img src={goalSlotUi.shadow} alt="" className="absolute inset-0 w-full h-full object-contain object-top" style={{ zIndex: 1, opacity: 0.4 }} />
                    <img src={goalSlotUi.yellow} alt="" className="absolute inset-0 w-full h-full object-contain object-top" style={{ zIndex: 2 }} />
                    <div className="absolute left-1/2 pointer-events-none" style={{ zIndex: 6, bottom: '70%', width: 42, height: 42, transform: 'translate(-50%, -1px)' }}>
                      <svg width="42" height="42" viewBox="0 0 42 42" className="absolute left-0 top-0 block" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="21" cy="21" r="20" fill="transparent" stroke="#ea9940" strokeWidth="2.5" />
                        <circle
                          cx="21"
                          cy="21"
                          r="20"
                          fill="transparent"
                          stroke="#c77d34"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 20}
                          style={{ strokeDashoffset: 2 * Math.PI * 20 * (1 - Math.max(0, coinGoalTimeRemaining) / 30), transition: 'stroke-dashoffset 0.2s linear' }}
                        />
                      </svg>
                      <img ref={coinGoalIconRef} src={assetPath('/assets/icons/coins/icon_coin_watchad.png')} alt="" className="object-contain absolute z-[1]" style={{ left: 1, top: 1, width: 40, height: 40, pointerEvents: 'none' }} />
                    </div>
                    <span className="absolute left-1/2 font-bold pointer-events-none" style={{ zIndex: 6, bottom: '62%', color: '#c77d34', fontSize: '13px', transform: 'translate(-50%, -1px)' }}>{formatCompactNumber(coinGoalValue * (activeBoosts.some(b => b.offerId === 'happiest_customers') ? 2 : 1))}</span>
                  </div>
                )}
                </div>
              </div>

              {activeScreen === 'FARM' && farmFloatingButtonsVisible && activeFtueStage === null ? (
                <>
                  <FarmLeftFloatingButtonStack
                    gardenId={activeGardenId}
                    topPx={farmFloatingButtonStackTopPx}
                    style={{
                      opacity: farmFloatingButtonsFadedIn ? 1 : 0,
                      transition: 'opacity 400ms ease-out',
                    }}
                    activeBoosts={activeBoosts}
                    starterPackPurchased={starterPackPurchased}
                    starterPackUnlocked={starterPackUnlocked}
                    starterPackCountdownRefreshKey={starterPackCountdownRefreshKey}
                    onStarterPackClick={() => {
                      if (!isStoreIapEnabled(STORE_IAP_OFFER_STARTER_PACK_ID)) return;
                      playSfx(SFX_IDS.uiConfirmNormal);
                      setIapOfferUi({ offerId: STORE_IAP_OFFER_STARTER_PACK_ID });
                    }}
                    fieldPackPurchased={fieldPackPurchased}
                    fieldPackUnlocked={fieldPackUnlocked}
                    fieldPackCountdownRefreshKey={fieldPackCountdownRefreshKey}
                    onFieldPackClick={() => {
                      if (!isStoreIapEnabled(STORE_IAP_OFFER_FIELD_PACK_ID)) return;
                      playSfx(SFX_IDS.uiConfirmNormal);
                      setIapOfferUi({ offerId: STORE_IAP_OFFER_FIELD_PACK_ID });
                    }}
                    onNoAdsClick={() => {
                      if (!isStoreIapEnabled(STORE_IAP_OFFER_REMOVE_ADS_ID)) return;
                      playSfx(SFX_IDS.uiConfirmNormal);
                      setIapOfferUi({ offerId: STORE_IAP_OFFER_REMOVE_ADS_ID });
                    }}
                    onCoinBoostClick={() => {
                      playSfx(SFX_IDS.uiConfirmNormal);
                      setActiveScreen('STORE');
                      setStoreScrollToCoinSectionRequest((n) => n + 1);
                    }}
                  />
                  <FloatingButtonStack
                    side="right"
                    topPx={farmFloatingButtonStackTopPx}
                    style={{
                      opacity: farmFloatingButtonsFadedIn ? 1 : 0,
                      transition: 'opacity 400ms ease-out',
                    }}
                  >
                    <div
                      id={TASKS_FTUE_FLOATING_BUTTON_ID}
                      ref={tasksFloatingButtonRef}
                      className="inline-block"
                    >
                      <FloatingButtonTasks
                        gardenId={activeGardenId}
                        tasksUnlocked={dailyTasksUnlocked}
                        unlockLevel={TASKS_FLOATING_BUTTON_UNLOCK_LEVEL}
                        tasks={dailyTaskRows}
                        readyBounceNonce={tasksFbReadyBounceNonce}
                        forceLockedVisual={tasksFtueHoldLockedVisual}
                        onClick={() => {
                          if (!dailyTasksUnlocked || tasksFtueHoldLockedVisual) {
                            playSfx(SFX_IDS.uiConfirmNormal);
                            setLockedDailyTasksPopupOpen(true);
                            return;
                          }
                          playSfx(SFX_IDS.uiConfirmNormal);
                          const completingTasksFtue = !tasksFtueCompleted;
                          if (completingTasksFtue) {
                            setTasksFtueCompleted(true);
                            if (
                              activeGardenId === DEFAULT_GARDEN_ID &&
                              canEverShowRateUs()
                            ) {
                              pendingRateUsAfterDailyTasksCloseRef.current = true;
                            }
                          }
                          if (dailyTasksRemainingMs <= 0) {
                            if (!dailyTasksPeriodRolledRef.current) {
                              dailyTasksPopupOpenRef.current = true;
                              dailyTasksPeriodRolledRef.current = true;
                              executeDailyTasksPeriodRollover({ forcePopupOpen: true });
                            } else {
                              setDailyTaskRows(ensureDailyTasksDay(getDailyTasksCtx()));
                            }
                          } else {
                            rollDailyTasksPeriodIfExpired();
                            setDailyTaskRows(ensureDailyTasksDay(getDailyTasksCtx()));
                          }
                          setDailyTasksPopupOpen(true);
                        }}
                      />
                    </div>
                    {GARDENS_FLOATING_BUTTON_UI_VISIBLE ? (
                      <div
                        id={GARDENS_FTUE_FLOATING_BUTTON_ID}
                        ref={gardensFloatingButtonRef}
                        className="inline-block"
                      >
                        <FloatingButtonGardens
                          gardenId={activeGardenId}
                          garden1PlayerLevel={garden1PlayerLevel}
                          unlockLevel={GARDENS_FLOATING_BUTTON_UNLOCK_LEVEL}
                          gardensStarted={gardensStartedList}
                          activeGardenId={activeGardenId}
                          activeMoney={money}
                          gardens={collectionV2Gardens}
                          readyBounceNonce={gardensFbReadyBounceNonce}
                          forceLockedVisual={gardensFtueHoldLockedVisual}
                          onClick={() => {
                            playSfx(SFX_IDS.uiConfirmNormal);
                            if (
                              !gardensFloatingButtonUnlocked ||
                              gardensFtueHoldLockedVisual
                            ) {
                              setLockedGardenPickerPopupOpen(true);
                              return;
                            }
                            if (newGardenGardensFbFtueActive) {
                              setNewGardenFtuePhasePersisted(null, true);
                            }
                            if (!gardensFtueCompleted) {
                              setGardensFtueCompleted(true);
                            }
                            setGardenPickerOpen(true);
                          }}
                        />
                      </div>
                    ) : null}
                  </FloatingButtonStack>
                </>
              ) : null}

              <div
                ref={hexAreaRef}
                className="relative flex-grow min-h-0 flex flex-col items-center justify-center overflow-visible z-10"
              >
                {/* Only tapping this backdrop (background) closes the panel; hex cells and plants do not */}
                <div
                  className="absolute inset-0 z-0 cursor-pointer"
                  style={{ touchAction: 'manipulation' }}
                  onClick={() => {
                    if (!isExpanded) return;
                    playSfx(SFX_IDS.uiConfirmNormal);
                    panelBgAnimatingRef.current = true;
                    setIsExpanded(false);
                  }}
                  aria-label="Close upgrade panel"
                />
                <div
                  ref={seedHarvestRowRef}
                  className="absolute bottom-[10px] w-full px-0 flex justify-between items-end z-20 pointer-events-none"
                >
                   <div
                     className="pointer-events-auto relative flex items-center justify-center"
                     ref={plantButtonRef}
                     style={{
                       transformOrigin: 'center center',
                       ...(ftue10BigBounceActive
                         ? { animation: 'ftue11ButtonBigBounce 500ms ease-in-out 1' }
                         : (activeFtueStage === 'recharge_pre_upgrade' && ftue95ShowTextbox && !ftue95FadingOut)
                         ? { animation: 'ftue11ButtonBounce 2s ease-in-out infinite' }
                         : { transform: 'scale(0.99)' }),
                       ...(ftueHideSeedsButton && { visibility: 'hidden' as const, pointerEvents: 'none' as const }),
                       ...(activeFtueStage === 'merge_drag' && { pointerEvents: 'none' as const }),
                     }}
                     onClick={(e) => e.stopPropagation()}
                   >
                    {sideButtonToast?.anchor === 'seed' && (
                      <div
                        className="absolute bottom-full left-1/2 z-[60] mb-1 min-w-[200px] max-w-[min(360px,calc(100vw-40px))] -translate-x-1/2 pointer-events-none px-2 text-center"
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        <span
                          key={sideButtonToast.id}
                          className="side-action-toast-text text-[13px] font-extrabold leading-snug tracking-tight"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {sideButtonToast.message}
                        </span>
                      </div>
                    )}
<SideAction
                        gardenId={activeGardenId}
                        label="Plant"
                        icon={getGardenPlantSpritePath(seedLevel)}
                        iconNode={<PlantWithPot level={seedLevel} mastered={plantMastery.unlockedLevels.includes(seedLevel)} wrapperClassName="h-full w-full" />}
                        iconScale={58 / 46}
                        iconOffsetY={-1}
                        progress={seedsFreeMode ? 0 : Math.max(0, Math.min(1, seedProgress / 100))}
                        progressRef={seedProgressRef}
                        color="#a7c957"
                        isActive={activeTab === 'SEEDS' && isExpanded}
                        isFlashing={seedsFreeMode ? (ftue7Scheduled ? false : (activeFtueStage === 'first_more_orders' ? (ftue7SeedFireCount >= 2 ? false : true) : (ftue2SeedFireCount >= 2 ? false : true))) : seedsInStorage > 0}
                        shouldAnimate={!isGridFull}
                        isBoardFull={isGridFull}
                        storageCount={seedsInStorage}
                        storageMax={seedStorageMax}
                        freeMode={seedsFreeMode}
                        bounceTrigger={seedBounceTrigger}
                        onClick={handlePlantClick}
                      />
                   </div>
                   <div
                     className="pointer-events-auto relative flex items-center justify-center"
                     ref={harvestButtonRef}
                     style={{
                       transformOrigin: 'center center',
                       ...(ftue10BigBounceActive
                         ? { animation: 'ftue11ButtonBigBounce 500ms ease-in-out 1' }
                         : (activeFtueStage === 'recharge_pre_upgrade' && ftue95ShowTextbox && !ftue95FadingOut)
                         ? { animation: 'ftue11ButtonBounce 2s ease-in-out infinite' }
                         : { transform: 'scale(0.99)' }),
                       ...(ftueHideHarvestButton && { visibility: 'hidden' as const, pointerEvents: 'none' as const }),
                     }}
                     onClick={(e) => e.stopPropagation()}
                   >
                    {sideButtonToast?.anchor === 'harvest' && (
                      <div
                        className="absolute bottom-full left-1/2 z-[60] mb-1 min-w-[200px] max-w-[min(360px,calc(100vw-40px))] -translate-x-1/2 pointer-events-none px-2 text-center"
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        <span
                          key={sideButtonToast.id}
                          className="side-action-toast-text text-[13px] font-extrabold leading-snug tracking-tight"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {sideButtonToast.message}
                        </span>
                      </div>
                    )}
                     <SideAction 
                        gardenId={activeGardenId}
                        label="Harvest" 
                        icon={assetPath('/assets/icons/upgrades/icon_harvest.png')} 
                        progress={harvestFreeMode ? 0 : harvestProgress / 100}
                        progressRef={harvestProgressRef}
                        color="#a7c957"
                        isActive={activeTab === 'HARVEST' && isExpanded}
                        isFlashing={harvestFreeMode ? (activeFtueStage === 'first_harvest' || activeFtueStage === 'first_harvest_multi') : harvestCharges > 0}
                        shouldAnimate={true}
                        isBoardFull={false}
                        noRotateOnFlash={true}
                        storageCount={harvestCharges}
                        storageMax={harvestChargesMax}
                        freeMode={harvestFreeMode}
                        bounceTrigger={harvestBounceTrigger}
                        iconScale={1.275}
                        iconOffsetY={-2}
                        onClick={handleHarvestClick}
                      />
                    <SoftHarvestNudgeOverlay
                      visible={softHarvestNudgeVisible && postFtueHarvestNudgeDone === false}
                    />
                   </div>
                </div>

                {/* Reduced height from 340px to 323px (5% smaller); pointer-events-none so taps on background close upgrade panel */}
                <div
                  ref={hexGridBgRef}
                  className="relative w-full flex items-center justify-center h-[323px] overflow-visible pointer-events-none"
                  style={{ marginBottom: '35px' }}
                >
                  <div className="relative w-full pointer-events-auto">
                  <HexBoard
                    ref={hexBoardRef}
                    isActive={activeTab === 'CROPS' && isExpanded}
                    grid={grid}
                    onMerge={handleMerge}
                    onSwap={handleSwap}
                    impactCellIdx={impactCellIdx}
                    returnImpactCellIdx={returnImpactCellIdx}
                    onReturnImpact={handleHexReturnImpact}
                    onLandOnNewCell={handleHexLandOnNewCell}
                    onReleaseFromCell={handleHexReleaseFromCell}
                    sourceCellFadeOutIdx={sourceCellFadeOutIdx}
                    newCellImpactIdx={newCellImpactIdx}
                    containerRef={containerRef}
                    dragState={dragState}
                    setDragState={setDragState}
                    harvestBounceCellIndices={harvestBounceCellIndices}
                    getMergeLevelIncrease={getMergeLevelIncrease}
                    onLockedCellTap={ENABLE_LOCKED_CELL_TAP ? handleLockedCellTap : undefined}
                    unlockingCellIndices={unlockingCellIndices}
                    fertilizingCellIndices={fertilizingCellIndices}
                    appScale={appScale}
                    ftue3OnlyMerge4To13={activeFtueStage === 'merge_drag'}
                    masteredPlantLevels={plantMastery.unlockedLevels}
                    onMaxTierMergeAttempt={handleHexMaxTierMergeAttempt}
                    onProgrammaticMergeSettled={onProgrammaticMergeSettled}
                    gardenId={activeGardenId}
                    onMergeImpactStart={handleHexMergeImpactStart}
                    onDeletePlant={handleHexDeletePlant}
                  />
                  </div>
                </div>
              </div>

              {/* Ambient leaves: two identical emitters (leaf 8 below, leaf 7 above); upgrade panel z-60 stays on top */}
              <AmbientFallingLeaves
                enabled={!isLoading && activeScreen === 'FARM' && !farmOverlayBlocksAmbientVfx && !panelMotionActive}
                spriteUrl={assetPath('/assets/vfx/particle_leaf_background_shadow.png')}
                zIndex={54}
                spawnIntervalMs={6000}
                noiseStrength={0.5}
              />
              <AmbientFallingLeaves
                enabled={!isLoading && activeScreen === 'FARM' && !farmOverlayBlocksAmbientVfx && !panelMotionActive}
                spriteUrl={getGardenAmbientLeafSpritePath()}
                zIndex={55}
                spawnIntervalMs={5000}
              />

              <div 
                ref={upgradePanelRef}
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col overflow-visible relative z-[60] flex-shrink-0 shadow-[0_-15px_50px_rgba(0,0,0,0.15)] rounded-t-[32px]"
                style={{
                  height: upgradePanelExpandedPx,
                  minHeight: 0,
                  background: '#fcf0c6',
                  borderTop: '1px solid #ebdbaf',
                  touchAction: 'manipulation',
                  opacity: ftueUpgradePanelVisible ? 1 : 0,
                  pointerEvents: ftueUpgradePanelVisible ? 'auto' : 'none',
                  // Transform set by WAAPI / applyUpgradePanelPose (full panel travel).
                  transition: 'opacity 400ms ease-out',
                }}
              >
                {/* Upgrade panel top UI: inside panel, anchored to its top edge so it moves together with open/close animation and opacity */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playSfx(SFX_IDS.uiConfirmNormal);
                    // Claim bg vars before React commits isExpanded — blocks ResizeObserver race.
                    panelBgAnimatingRef.current = true;
                    const next = !isExpandedRef.current;
                    // Batch with isExpanded so open does not double-render App.
                    if (next) setPanelClosed(false);
                    setIsExpanded(next);
                  }}
                  className="pointer-events-auto absolute left-1/2 top-0"
                  style={{
                    transform: 'translate(-50%, -100%)',
                    opacity: ftueUpgradePanelVisible ? 1 : 0,
                    transition: 'opacity 400ms ease-out',
                  }}
                >
                  <div className="relative">
                    <img
                      src={assetPath('/assets/ui/ui_upgradepanel_open.png')}
                      alt=""
                      className="block"
                      style={{ width: 120, height: 'auto' }}
                    />
                    <img
                      src={assetPath('/assets/ui/ui_upgradepanel_arrow.png')}
                      alt=""
                      className="absolute left-1/2 top-1/2"
                      style={{
                        width: 32,
                        height: 'auto',
                        transform: `translate(-50%, -28%) rotate(${isExpanded ? 0 : 180}deg)`,
                        transformOrigin: '50% 50%',
                        transition: 'transform 350ms cubic-bezier(0.05, 0, 0, 1)',
                      }}
                    />
                  </div>
                </button>

                <UpgradeTabs 
                  ref={upgradeTabsRef}
                  activeTab={activeTab} 
                  onTabChange={handleTabChange}
                  tabsWithOffers={tabsWithOffers}
                  isExpanded={isExpanded}
                  ftue10EmphasizeGardenTab={
                    activeFtueStage === 'first_upgrade' && ftue10Phase === 'panel_open_orders'
                  }
                />
                <div
                  className="flex-grow min-h-0 overflow-hidden relative flex flex-col"
                  style={{
                    // Keep the list mounted + laid out while closed (clipped off-screen by the
                    // column overflow + panel slide). Avoid maxHeight/opacity thrash on open.
                    pointerEvents: isExpanded ? 'auto' : 'none',
                  }}
                >
                  <UpgradeList 
                    activeTab={activeTab} 
                    onTabChange={handleTabChange} 
                    money={money} 
                    setMoney={setMoney}
                    seedsState={seedsState}
                    setSeedsState={setSeedsState}
                    harvestState={harvestState}
                    setHarvestState={setHarvestState}
                    cropsState={cropsState}
                    setCropsState={setCropsState}
                    lockedCellCount={lockedCellCount}
                    fertilizableCellCount={fertilizableCellCount}
                    onFertilizeCell={handleFertilizeCell}
                    highestPlantEver={highestPlantEver}
                    masteredPlantLevels={plantMastery.unlockedLevels}
                    rewardedOffers={rewardedOffers}
                    playerLevel={playerLevel}
                    gardenId={activeGardenId}
                    pendingUnlockUpgradeId={pendingUnlockUpgradeId}
                    pendingOfferHighlightId={pendingOfferHighlightId}
                    isExpanded={isExpanded}
                    protectedOfferId={limitedOfferPopup?.isVisible && limitedOfferPopup?.offerId ? limitedOfferPopup.offerId : null}
                    ftue10GreenFlashUpgradeId={ftue10GreenFlashUpgradeId}
                    ftue10PurchaseButtonRef={ftue10PurchaseButtonRef}
                    ftue10LockScroll={activeFtueStage === 'first_upgrade' && ftue10Phase === 'finger'}
                    ftue10DisableSeedProductionPurchase={
                      activeFtueStage === 'first_upgrade' &&
                      ftue10Phase === 'panel_open_orders' &&
                      activeTab === 'SEEDS'
                    }
                    goldenPotCount={unlockedBonusTierSet}
                    onUpgradePurchase={(upgradeId, purchaseTab, sourceButton) => {
                      playSfx(SFX_IDS.uiConfirmReward);
                      applyDailyTaskRowsUpdate(
                        recordDailyTaskUpgradePurchased(getDailyTasksCtx(), upgradeId, purchaseTab),
                      );
                      // Small leaf burst around the purchase button on every upgrade.
                      if (sourceButton && !getPerformanceMode()) {
                        const sr = sourceButton.getBoundingClientRect();
                        spawnButtonLeafBurst({
                            id: `upgrade-btn-${upgradeId}-${Date.now()}`,
                            x: sr.left + sr.width / 2,
                            y: sr.top + sr.height / 2,
                            startTime: Date.now(),
                            radiusScale: 0.55,
                            speedScale: 0.9,
                          });
                      }
                      // Seeds tab: green upgrade particle → seed button (bounce + leaf burst on impact).
                      if (
                        purchaseTab === 'SEEDS' &&
                        sourceButton &&
                        containerRef.current &&
                        plantButtonRef.current
                      ) {
                        const scale = appScaleRef.current;
                        const cr = containerRef.current.getBoundingClientRect();
                        const sr = sourceButton.getBoundingClientRect();
                        const tr = plantButtonRef.current.getBoundingClientRect();
                        setActiveUpgradeParticles((prev) => [
                          ...prev,
                          {
                            id: `upgrade-${upgradeId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                            startX: (sr.left + sr.width / 2 - cr.left) / scale,
                            startY: (sr.top + sr.height / 2 - cr.top) / scale,
                            endX: (tr.left + tr.width / 2 - cr.left) / scale,
                            endY: (tr.top + tr.height / 2 - cr.top) / scale,
                            gardenId: activeGardenId,
                            pathStyle: 'seed',
                            impactKind: 'seed',
                          },
                        ]);
                      }
                      // Crops tab: harvest_speed / crop_value → harvest button.
                      let spawnedHarvestParticle = false;
                      if (
                        purchaseTab === 'CROPS' &&
                        (upgradeId === 'harvest_speed' || upgradeId === 'crop_value') &&
                        sourceButton &&
                        containerRef.current &&
                        harvestButtonRef.current
                      ) {
                        const scale = appScaleRef.current;
                        const cr = containerRef.current.getBoundingClientRect();
                        const sr = sourceButton.getBoundingClientRect();
                        const tr = harvestButtonRef.current.getBoundingClientRect();
                        setActiveUpgradeParticles((prev) => [
                          ...prev,
                          {
                            id: `upgrade-${upgradeId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                            startX: (sr.left + sr.width / 2 - cr.left) / scale,
                            startY: (sr.top + sr.height / 2 - cr.top) / scale,
                            endX: (tr.left + tr.width / 2 - cr.left) / scale,
                            endY: (tr.top + tr.height / 2 - cr.top) / scale,
                            gardenId: activeGardenId,
                            pathStyle: 'harvest',
                            impactKind: 'harvest',
                          },
                        ]);
                        spawnedHarvestParticle = true;
                      }
                      // Crops: wild_growth → loft above hex grid → source plant cell (glow only on impact).
                      if (
                        purchaseTab === 'CROPS' &&
                        upgradeId === 'wild_growth' &&
                        sourceButton &&
                        containerRef.current
                      ) {
                        const reserved = new Set(activeProjectilesRef.current.map((p) => p.targetIdx));
                        const plantIdx = pickWildGrowthPreviewPlant(gridRef.current, reserved);
                        if (plantIdx != null) {
                          const hexEl = document.getElementById(`hex-${plantIdx}`);
                          if (hexEl) {
                            const scale = appScaleRef.current;
                            const cr = containerRef.current.getBoundingClientRect();
                            const sr = sourceButton.getBoundingClientRect();
                            const hr = hexEl.getBoundingClientRect();
                            setActiveUpgradeParticles((prev) => [
                              ...prev,
                              {
                                id: `upgrade-${upgradeId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                                startX: (sr.left + sr.width / 2 - cr.left) / scale,
                                startY: (sr.top + sr.height / 2 - cr.top) / scale,
                                endX: (hr.left + hr.width / 2 - cr.left) / scale,
                                endY: (hr.top + hr.height / 2 - cr.top) / scale,
                                gardenId: activeGardenId,
                                pathStyle: 'hexLoft',
                                impactKind: 'wildGrowthGlow',
                                cellIdx: plantIdx,
                              },
                            ]);
                          }
                        }
                      }
                      // Crops: plot_expansion → loft above hex grid → unlock cell on impact.
                      if (purchaseTab === 'CROPS' && upgradeId === 'plot_expansion') {
                        const lockedIndices = gridRef.current
                          .map((cell, idx) => (cell.locked ? idx : -1))
                          .filter((idx) => idx !== -1);
                        if (lockedIndices.length > 0) {
                          const cellIdx =
                            lockedIndices[Math.floor(Math.random() * lockedIndices.length)];
                          const hexEl = document.getElementById(`hex-${cellIdx}`);
                          if (sourceButton && containerRef.current && hexEl) {
                            const scale = appScaleRef.current;
                            const cr = containerRef.current.getBoundingClientRect();
                            const sr = sourceButton.getBoundingClientRect();
                            const hr = hexEl.getBoundingClientRect();
                            setActiveUpgradeParticles((prev) => [
                              ...prev,
                              {
                                id: `upgrade-${upgradeId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                                startX: (sr.left + sr.width / 2 - cr.left) / scale,
                                startY: (sr.top + sr.height / 2 - cr.top) / scale,
                                endX: (hr.left + hr.width / 2 - cr.left) / scale,
                                endY: (hr.top + hr.height / 2 - cr.top) / scale,
                                gardenId: activeGardenId,
                                pathStyle: 'hexLoft',
                                impactKind: 'plotUnlock',
                                cellIdx,
                              },
                            ]);
                          } else {
                            unlockCellAt(cellIdx);
                          }
                        }
                      }
                      // Market: surplus recharges → seed button + harvest button at once.
                      if (
                        purchaseTab === 'HARVEST' &&
                        upgradeId === 'seed_surplus' &&
                        sourceButton &&
                        containerRef.current
                      ) {
                        const scale = appScaleRef.current;
                        const cr = containerRef.current.getBoundingClientRect();
                        const sr = sourceButton.getBoundingClientRect();
                        const startX = (sr.left + sr.width / 2 - cr.left) / scale;
                        const startY = (sr.top + sr.height / 2 - cr.top) / scale;
                        const now = Date.now();
                        const dual: UpgradeParticleData[] = [];
                        if (plantButtonRef.current) {
                          const tr = plantButtonRef.current.getBoundingClientRect();
                          dual.push({
                            id: `upgrade-${upgradeId}-seed-${now}`,
                            startX,
                            startY,
                            endX: (tr.left + tr.width / 2 - cr.left) / scale,
                            endY: (tr.top + tr.height / 2 - cr.top) / scale,
                            gardenId: activeGardenId,
                            pathStyle: 'seed',
                            impactKind: 'seed',
                          });
                        }
                        if (harvestButtonRef.current) {
                          const tr = harvestButtonRef.current.getBoundingClientRect();
                          dual.push({
                            id: `upgrade-${upgradeId}-harvest-${now}`,
                            startX,
                            startY,
                            endX: (tr.left + tr.width / 2 - cr.left) / scale,
                            endY: (tr.top + tr.height / 2 - cr.top) / scale,
                            gardenId: activeGardenId,
                            pathStyle: 'harvest',
                            impactKind: 'harvest',
                          });
                        }
                        if (dual.length > 0) {
                          setActiveUpgradeParticles((prev) => [...prev, ...dual]);
                        }
                      }
                      // Market: order speed → loading goal (−1s) or last active goal (bounce).
                      if (
                        purchaseTab === 'HARVEST' &&
                        upgradeId === 'customer_speed' &&
                        sourceButton &&
                        containerRef.current
                      ) {
                        const scale = appScaleRef.current;
                        const cr = containerRef.current.getBoundingClientRect();
                        const sr = sourceButton.getBoundingClientRect();
                        const startX = (sr.left + sr.width / 2 - cr.left) / scale;
                        const startY = (sr.top + sr.height / 2 - cr.top) / scale;
                        const maxSlots = getMaxPlantGoalSlots(unlockedBonusTierSet);
                        const slotsNow = goalSlotsRef.current;
                        const loadingIdx = slotsNow.findIndex((s) => s === 'loading');
                        const activeGoalSlots = goalDisplayOrder.filter(
                          (i) => slotsNow[i] !== 'empty' && i < maxSlots,
                        );
                        const targetSlotIdx =
                          loadingIdx >= 0
                            ? loadingIdx
                            : activeGoalSlots.length > 0
                              ? activeGoalSlots[activeGoalSlots.length - 1]
                              : -1;
                        if (targetSlotIdx >= 0) {
                          const resolveGoalEnd = (
                            slotIdx: number,
                            fallbackDisplayIndex: number,
                          ): { endX: number; endY: number } | null => {
                            const icon = goalIconRefs[slotIdx]?.current;
                            if (icon) {
                              const r = icon.getBoundingClientRect();
                              if (r.width > 0 && r.left > -100) {
                                return {
                                  endX: (r.left + r.width / 2 - cr.left) / scale,
                                  endY: (r.top + r.height / 2 - cr.top) / scale,
                                };
                              }
                            }
                            const slotEl = document.querySelector(
                              `[data-goal-slot="${slotIdx}"]`,
                            ) as HTMLElement | null;
                            if (slotEl) {
                              const r = slotEl.getBoundingClientRect();
                              if (r.width > 0 && r.left > -100) {
                                return {
                                  endX: (r.left + r.width / 2 - cr.left) / scale,
                                  endY: (r.top + 40 - cr.top) / scale,
                                };
                              }
                            }
                            const track = document.querySelector(
                              '[data-goals-track]',
                            ) as HTMLElement | null;
                            if (!track) return null;
                            const tr = track.getBoundingClientRect();
                            const centerX =
                              tr.left + fallbackDisplayIndex * GOALS_SLOT_STEP_PX + 52.5;
                            const centerY = tr.top + 35;
                            return {
                              endX: (centerX - cr.left) / scale,
                              endY: (centerY - cr.top) / scale,
                            };
                          };
                          const displayIdx =
                            loadingIdx >= 0
                              ? Math.max(0, goalDisplayOrder.indexOf(loadingIdx))
                              : Math.max(0, activeGoalSlots.length - 1);
                          const end = resolveGoalEnd(targetSlotIdx, displayIdx);
                          if (end) {
                            setActiveUpgradeParticles((prev) => [
                              ...prev,
                              {
                                id: `upgrade-${upgradeId}-${Date.now()}`,
                                startX,
                                startY,
                                endX: end.endX,
                                endY: end.endY,
                                gardenId: activeGardenId,
                                pathStyle: 'goal',
                                impactKind: loadingIdx >= 0 ? 'goalLoading' : 'goal',
                                goalSlotIdx: targetSlotIdx,
                              },
                            ]);
                          }
                        }
                      }
                      // Market tab: market_value / happy_customer → one particle per active goal (or slot 2 if none).
                      if (
                        purchaseTab === 'HARVEST' &&
                        (upgradeId === 'market_value' || upgradeId === 'happy_customer') &&
                        sourceButton &&
                        containerRef.current
                      ) {
                        const scale = appScaleRef.current;
                        const cr = containerRef.current.getBoundingClientRect();
                        const sr = sourceButton.getBoundingClientRect();
                        const startX = (sr.left + sr.width / 2 - cr.left) / scale;
                        const startY = (sr.top + sr.height / 2 - cr.top) / scale;
                        const maxSlots = getMaxPlantGoalSlots(unlockedBonusTierSet);
                        const activeGoalSlots = goalDisplayOrder.filter(
                          (i) => goalSlots[i] !== 'empty' && i < maxSlots,
                        );
                        const targetSlots =
                          activeGoalSlots.length > 0 ? activeGoalSlots : [1]; // slot 2 (0-based index 1)

                        const resolveGoalEnd = (
                          slotIdx: number,
                          fallbackDisplayIndex: number,
                        ): { endX: number; endY: number } | null => {
                          const icon = goalIconRefs[slotIdx]?.current;
                          if (icon) {
                            const r = icon.getBoundingClientRect();
                            if (r.width > 0 && r.left > -100) {
                              return {
                                endX: (r.left + r.width / 2 - cr.left) / scale,
                                endY: (r.top + r.height / 2 - cr.top) / scale,
                              };
                            }
                          }
                          const slotEl = document.querySelector(
                            `[data-goal-slot="${slotIdx}"]`,
                          ) as HTMLElement | null;
                          if (slotEl) {
                            const r = slotEl.getBoundingClientRect();
                            if (r.width > 0 && r.left > -100) {
                              return {
                                endX: (r.left + r.width / 2 - cr.left) / scale,
                                endY: (r.top + 40 - cr.top) / scale,
                              };
                            }
                          }
                          const track = document.querySelector(
                            '[data-goals-track]',
                          ) as HTMLElement | null;
                          if (!track) return null;
                          const tr = track.getBoundingClientRect();
                          const centerX =
                            tr.left + fallbackDisplayIndex * GOALS_SLOT_STEP_PX + 52.5;
                          const centerY = tr.top + 35;
                          return {
                            endX: (centerX - cr.left) / scale,
                            endY: (centerY - cr.top) / scale,
                          };
                        };

                        const now = Date.now();
                        const particles = targetSlots.flatMap((slotIdx, i) => {
                          const fallbackDisplayIndex =
                            activeGoalSlots.length > 0 ? i : 1; // empty → aim at visual slot 2
                          const end = resolveGoalEnd(slotIdx, fallbackDisplayIndex);
                          if (!end) return [];
                          return [
                            {
                              id: `upgrade-${upgradeId}-goal${slotIdx}-${now}-${i}`,
                              startX,
                              startY,
                              endX: end.endX,
                              endY: end.endY,
                              gardenId: activeGardenId,
                              pathStyle: 'goal' as const,
                              impactKind: 'goal' as const,
                              goalSlotIdx: slotIdx,
                            },
                          ];
                        });
                        if (particles.length > 0) {
                          setActiveUpgradeParticles((prev) => [...prev, ...particles]);
                        }
                      }
                      if (upgradeId === 'harvest_speed' && activeFtueStage === 'first_upgrade') {
                        // FTUE 10: bounce harvest on particle impact when possible; hold panel open
                        // briefly so the purchase lands, then fade overlay and close panel.
                        if (!spawnedHarvestParticle) {
                          setHarvestBounceTrigger((t) => t + 1);
                        }
                        if (ftue10PostPurchaseHoldTimeoutRef.current) {
                          clearTimeout(ftue10PostPurchaseHoldTimeoutRef.current);
                        }
                        ftue10PostPurchaseHoldTimeoutRef.current = setTimeout(() => {
                          ftue10PostPurchaseHoldTimeoutRef.current = null;
                          setFtue10Phase(null);
                          setFtue10GreenFlashUpgradeId(null);
                          setFtue10FadingOut(true);
                          // Defer surplus activation until the upgrade panel has fully closed.
                          setFtue10PostClosePending(true);
                        }, 500);
                      }
                    }}
                    onRewardedOfferPanelClick={(offerId) => {
                      if (!canOpenLimitedOfferRewardPopup()) return;
                      playSfx(SFX_IDS.uiConfirmNormal);
                      const state = buildLimitedOfferPopupState(offerId, { highestPlantEver });
                      if (state) setLimitedOfferPopup(state);
                    }}
                    onRewardedOfferClick={(offerId) => {
                      playSfx(SFX_IDS.uiConfirmReward);
                      // Tap on Watch Ad button: open fake ad directly (skip popup), grant reward on Activate Reward
                      pendingAdSourceRef.current = 'upgradeList';
                      pendingOfferIdRef.current = offerId;
                      openRewardedFakeAd();
                      setPendingAdComplete(() => () => {
                        setRewardedOffers(prev => prev.filter(o => o.id !== offerId));
                        setShowFakeAd(false);
                        // Apply same offer rewards as limited offer popup path (e.g. Seed Storm)
                        if (offerId === 'seed_storm') {
                          const g = gridRef.current;
                          const reservedCells = new Set(activeProjectilesRef.current.map(p => p.targetIdx));
                          const emptyIndices = g
                            .map((cell, idx) => (cell.item === null && !cell.locked && !reservedCells.has(idx) ? idx : null))
                            .filter((idx): idx is number => idx !== null);
                          emptyIndices.forEach((targetIdx, i) => {
                            setTimeout(() => {
                              spawnProjectile(targetIdx, seedLevel);
                              playSfx(SFX_IDS.gameplaySeed);
                            }, 200 * i);
                          });
                        }
                        // Special Delivery: shoot a seed that spawns/upgrades to high-level plant; beam + bounce on impact
                        if (offerId === 'special_delivery') {
                          const plantLevel = Math.max(1, highestPlantEverRef.current - 1);
                          const g = gridRef.current;
                          const reserved = new Set(activeProjectilesRef.current.map(p => p.targetIdx));
                          const emptyIndices = g.map((c, i) => (!c.locked && c.item === null && !reserved.has(i) ? i : -1)).filter((i): i is number => i !== -1);
                          let targetIdx: number;
                          if (emptyIndices.length > 0) {
                            targetIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                          } else {
                            const withPlants = g.map((c, i) => (c.item ? { idx: i, level: c.item.level } : null)).filter((x): x is { idx: number; level: number } => x != null);
                            if (withPlants.length === 0) return;
                            withPlants.sort((a, b) => a.level - b.level);
                            targetIdx = withPlants[0].idx;
                          }
                          spawnProjectile(targetIdx, plantLevel, true, true);
                        }
                        if (offerId && isCoinMultiplierBoostId(offerId)) {
                          setActiveBoosts((prev) =>
                            applyBoostParticleImpact(prev, {
                              id: `boost-ad-${DOUBLE_COINS_OFFER_ID}-${Date.now()}`,
                              startX: 0,
                              startY: 0,
                              offerId: DOUBLE_COINS_OFFER_ID,
                              durationMs: REWARDED_DOUBLE_COINS_AD_DURATION_MS,
                              icon: getDoubleCoinsActiveBoostIcon(),
                            })
                          );
                          recordDailyTaskBoostUsed();
                        }
                      });
                    }}
                  />
                </div>
              </div>
              </div>
            </div>

            <div
              className="h-full shrink-0 flex flex-col relative overflow-hidden"
              style={{
                width: designWidth,
                transform: `translateX(${BARN_CAROUSEL_SEAM_OFFSET_PX}px)`,
              }}
            >
              {/* 1. Bleed: flat barn color, full column, behind sprite */}
              <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{ background: '#5c3d2e' }}
              />

              {/* Barn scrollable area - background and shelves move together */}
              <div 
                ref={barnScrollRef}
                className={`absolute inset-0 overflow-hidden select-none z-10 ${
                  collectionFtueBarnScrollLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                }`}
                style={collectionFtueBarnScrollLocked ? { touchAction: 'none' } : undefined}
              >
                {/* Content container that moves with scroll - fixed width centered, overflow visible for large elements */}
                <div 
                  data-barn-content
                  className="absolute"
                  style={{ 
                    left: '50%',
                    transform: `translateX(-50%) translateY(${-barnScrollY}px) scale(${barnScale})`,
                    transformOrigin: 'top center',
                    width: '420px',
                    minHeight: '150%',
                    paddingBottom: COLLECTION_CONTENT_BOTTOM_PAD_PX,
                    overflow: 'visible',
                  }}
                >
                  {/* Wood panel background — tiled vertically to cover full scroll height */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      zIndex: 0,
                      left: '50%',
                      top: 0,
                      bottom: 0,
                      width: `${COLLECTION_BACKGROUND_WIDTH_PX}px`,
                      transform: 'translateX(-50%)',
                      backgroundImage: `url(${COLLECTION_BACKGROUND_IMAGE})`,
                      backgroundRepeat: 'repeat-y',
                      backgroundSize: `${COLLECTION_BACKGROUND_WIDTH_PX}px auto`,
                      backgroundPosition: 'top center',
                    }}
                  />

                  {/* Barn roof at the top - fixed pixel size, centered */}
                  <div
                    className="relative pointer-events-none"
                    style={{
                      zIndex: 1,
                      overflow: 'visible',
                      height: isCollectionPhoneLayout ? collectionRoofLayoutHeightPx : undefined,
                    }}
                  >
                    <img
                      src={assetPath('/assets/collection/collection_roof.png')}
                      alt="Barn Roof"
                      style={{
                        width: `${collectionRoofVisualWidthPx}px`,
                        height: 'auto',
                        maxWidth: 'none',
                        position: isCollectionPhoneLayout ? 'absolute' : 'relative',
                        top: isCollectionPhoneLayout ? 0 : undefined,
                        left: '50%',
                        transform: 'translateX(-50%)',
                      }}
                    />
                  </div>

                  {/* Plant mastery panel in the added shelf gap (absolute so it doesn't shift layout). */}
                  <div
                    className="absolute pointer-events-auto"
                    style={{
                      zIndex: 2,
                      left: '50%',
                      top: collectionPlantPanelTopPx,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {collectionFtuePanelLeafBurst && (
                      <div
                        className="absolute left-1/2 top-0 pointer-events-none"
                        style={{
                          width: collectionFtuePanelLeafBurst.rectWidth,
                          height: collectionFtuePanelLeafBurst.rectHeight,
                          transform: isCollectionPhoneLayout
                            ? `translateX(-50%) scale(${COLLECTION_PHONE_PLANT_PANEL_SCALE})`
                            : 'translateX(-50%)',
                          transformOrigin: 'top center',
                          zIndex: 0,
                        }}
                      >
                        <PopupRectLeafBurst
                          key={collectionFtuePanelLeafBurst.id}
                          rectWidth={collectionFtuePanelLeafBurst.rectWidth}
                          rectHeight={collectionFtuePanelLeafBurst.rectHeight}
                          topEdgeInsetPx={COLLECTION_FTUE_PANEL_LEAF_BURST_TOP_INSET_PX}
                          zIndex={0}
                          onComplete={() => setCollectionFtuePanelLeafBurst(null)}
                        />
                      </div>
                    )}
                    <div
                      ref={collectionFtuePanelRef}
                      className={`relative${collectionFtuePanelBouncing ? ' collection-ftue-panel-bounce' : ''}`}
                      style={{
                        width: '320px',
                        zIndex: 1,
                        ['--panel-s' as string]: isCollectionPhoneLayout
                          ? COLLECTION_PHONE_PLANT_PANEL_SCALE
                          : 1,
                        transform: collectionFtuePanelBouncing
                          ? undefined
                          : isCollectionPhoneLayout
                            ? `scale(${COLLECTION_PHONE_PLANT_PANEL_SCALE})`
                            : undefined,
                        transformOrigin: collectionFtuePanelBouncing
                          ? '50% 40%'
                          : 'top center',
                      }}
                    >
                      <img
                        src={assetPath('/assets/ui/ui_plantmastery.png')}
                        alt={collectionPanelTitle}
                        style={{
                          width: '320px',
                          height: 'auto',
                          maxWidth: 'none',
                        }}
                      />
                      {/* Crest: lock ↔ garden crossfade (FTUE intro bounce). */}
                      <img
                        src={getCollectionLockGardenIconPath(activeGardenId)}
                        alt=""
                        className="absolute left-1/2 pointer-events-none object-contain"
                        style={{
                          top: COLLECTION_PANEL_LOCKED_CREST_TOP_PX,
                          width:
                            COLLECTION_PANEL_GARDEN_ICON_PX *
                            COLLECTION_PANEL_GARDEN_ICON_UNLOCKED_SCALE *
                            COLLECTION_PANEL_LOCKED_CREST_SCALE,
                          height: 'auto',
                          transform: 'translateX(-50%)',
                          opacity: collectionPanelChromeUnlocked ? 0 : 1,
                          transition: `opacity ${COLLECTION_FTUE_PANEL_BOUNCE_MS}ms ease-out`,
                        }}
                        draggable={false}
                      />
                      <img
                        src={getCollectionGardenIconPath(activeGardenId)}
                        alt=""
                        className="absolute left-1/2 pointer-events-none object-contain"
                        style={{
                          top: COLLECTION_PANEL_UNLOCKED_CREST_TOP_PX,
                          width:
                            COLLECTION_PANEL_GARDEN_ICON_PX * COLLECTION_PANEL_GARDEN_ICON_UNLOCKED_SCALE,
                          height: 'auto',
                          transform: 'translateX(-50%)',
                          opacity: collectionPanelChromeUnlocked ? 1 : 0,
                          transition: `opacity ${COLLECTION_FTUE_PANEL_BOUNCE_MS}ms ease-out`,
                        }}
                        draggable={false}
                      />
                      <div
                        className="absolute inset-0 flex flex-col items-center"
                        style={{
                          paddingTop: 126,
                          paddingLeft: 14,
                          paddingRight: 14,
                        }}
                      >
                        <h2
                          className="font-black tracking-tight text-center"
                          style={{
                            color: '#5c4a32',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '28px',
                            lineHeight: 1,
                          }}
                        >
                          {collectionPanelTitle}
                        </h2>
                        <div
                          className="relative w-full flex items-center justify-center"
                          style={{ marginTop: 4, marginBottom: 6, height: 14 }}
                        >
                          <img
                            src={assetPath('/assets/ui/popup_divider_blue.png')}
                            alt=""
                            className="absolute h-auto object-contain pointer-events-none"
                            style={{
                              width: '220px',
                              opacity: collectionPanelChromeUnlocked ? 0 : 1,
                              transition: `opacity ${COLLECTION_FTUE_PANEL_BOUNCE_MS}ms ease-out`,
                            }}
                          />
                          <img
                            src={assetPath('/assets/ui/popup_divider.png')}
                            alt=""
                            className="absolute h-auto object-contain pointer-events-none"
                            style={{
                              width: '220px',
                              opacity: collectionPanelChromeUnlocked ? 1 : 0,
                              transition: `opacity ${COLLECTION_FTUE_PANEL_BOUNCE_MS}ms ease-out`,
                            }}
                          />
                        </div>
                        <div className="relative w-full">
                          {/* Locked chrome (description + Level button) */}
                          <div
                            className="w-full flex flex-col items-center"
                            style={{
                              opacity: collectionPanelChromeUnlocked ? 0 : 1,
                              transition: `opacity ${COLLECTION_FTUE_PANEL_BOUNCE_MS}ms ease-out`,
                              pointerEvents: collectionPanelChromeUnlocked ? 'none' : 'auto',
                            }}
                            aria-hidden={collectionPanelChromeUnlocked}
                          >
                            <div className="relative w-full" style={{ minHeight: '2.75rem', marginBottom: 8 }}>
                              <p
                                className="font-medium text-center leading-relaxed italic w-full absolute inset-x-0 top-0"
                                style={{
                                  color: '#c2b280',
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '0.875rem',
                                  paddingLeft: 4,
                                  paddingRight: 4,
                                }}
                              >
                                Collect and upgrade plants here
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled
                              aria-disabled
                              className="relative mx-auto flex items-center justify-center gap-1 whitespace-nowrap border outline outline-1 rounded-[8px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                              style={{
                                height: COLLECTION_PANEL_LOCKED_LEVEL_BUTTON_HEIGHT_PX,
                                width: 'fit-content',
                                marginTop: 3,
                                paddingLeft: COLLECTION_PANEL_LOCKED_LEVEL_BUTTON_PADDING_X_PX,
                                paddingRight: COLLECTION_PANEL_LOCKED_LEVEL_BUTTON_PADDING_X_PX,
                                boxSizing: 'border-box',
                                backgroundColor: '#9cccdb',
                                borderColor: '#6aa3b7',
                                borderBottomWidth: '4px',
                                outlineColor: '#6aa3b7',
                                cursor: 'default',
                              }}
                            >
                              <span className="flex items-center gap-0.5 -translate-x-0.5">
                                <span
                                  aria-hidden
                                  className="w-4 h-4 shrink-0"
                                  style={{
                                    backgroundColor: '#3d7493',
                                    maskImage: `url(${assetPath('/assets/icons/generic_buttons/icon_lock.png')})`,
                                    maskSize: 'contain',
                                    maskRepeat: 'no-repeat',
                                    maskPosition: 'center',
                                    WebkitMaskImage: `url(${assetPath('/assets/icons/generic_buttons/icon_lock.png')})`,
                                    WebkitMaskSize: 'contain',
                                    WebkitMaskRepeat: 'no-repeat',
                                    WebkitMaskPosition: 'center',
                                  }}
                                />
                                <span
                                  className="font-black tracking-tighter"
                                  style={{ color: '#3d7493', fontSize: 15.6 }}
                                >
                                  Level  {PLANT_COLLECTION_UI_UNLOCK_LEVEL}
                                </span>
                              </span>
                            </button>
                          </div>
                          {/* Unlocked chrome — stacked for FTUE crossfade; also used when already unlocked */}
                          <div
                            className="w-full flex flex-col items-center"
                            style={{
                              ...(isPlantCollectionUiUnlocked
                                ? {
                                    position: 'absolute' as const,
                                    left: 0,
                                    right: 0,
                                    top: 0,
                                  }
                                : { display: 'none' as const }),
                              opacity: collectionPanelChromeUnlocked ? 1 : 0,
                              transition: `opacity ${COLLECTION_FTUE_PANEL_BOUNCE_MS}ms ease-out`,
                              pointerEvents: collectionPanelChromeUnlocked ? 'auto' : 'none',
                            }}
                            aria-hidden={!collectionPanelChromeUnlocked}
                          >
                            <div
                              id={COLLECTION_FTUE_PANEL_COPY_ID}
                              className="w-full flex flex-col items-center"
                            >
                            <div className="relative w-full" style={{ minHeight: '2.75rem', marginBottom: 8 }}>
                              <p
                                key={
                                  collectionFtueCopyFlash?.kind === 'intro'
                                    ? `intro-copy-${collectionFtueCopyFlash.gen}`
                                    : 'intro-copy'
                                }
                                className={`font-medium text-center leading-relaxed italic w-full absolute inset-x-0 top-0${
                                  collectionFtueCopyFlash?.kind === 'intro'
                                    ? ' collection-ftue-copy-color-settle'
                                    : ''
                                }`}
                                style={{
                                  ...(collectionFtueCopyFlash?.kind === 'intro'
                                    ? {}
                                    : { color: COLLECTION_PANEL_COPY_COLOR }),
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '0.875rem',
                                  paddingLeft: 4,
                                  paddingRight: 4,
                                  opacity: collectionFtueBonusesCopyActive ? 0 : 1,
                                  transition: `opacity ${COLLECTION_FTUE_PANEL_BOUNCE_MS}ms ease-out`,
                                  pointerEvents: 'none',
                                }}
                              >
                                <span className="block">Upgrade plants shelf by shelf.</span>
                                <span className="block">Finish a row to unlock Bonuses.</span>
                              </p>
                              <p
                                key={
                                  collectionFtueCopyFlash?.kind === 'bonuses'
                                    ? `bonuses-copy-${collectionFtueCopyFlash.gen}`
                                    : 'bonuses-copy'
                                }
                                className={`font-medium text-center leading-relaxed italic w-full absolute inset-x-0 top-0${
                                  collectionFtueCopyFlash?.kind === 'bonuses'
                                    ? ' collection-ftue-copy-color-settle'
                                    : ''
                                }`}
                                style={{
                                  ...(collectionFtueCopyFlash?.kind === 'bonuses'
                                    ? {}
                                    : { color: COLLECTION_PANEL_COPY_COLOR }),
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '0.875rem',
                                  paddingLeft: 4,
                                  paddingRight: 4,
                                  opacity: collectionFtueBonusesCopyActive ? 1 : 0,
                                  transition: `opacity ${COLLECTION_FTUE_PANEL_BOUNCE_MS}ms ease-out`,
                                  pointerEvents: 'none',
                                }}
                              >
                                {COLLECTION_FTUE_BONUSES_MESSAGE}
                              </p>
                            </div>
                            <div className="relative w-full flex flex-col items-center" style={{ minHeight: 37 }}>
                            {showCollectionFtueViewBonusesMount && (
                            <button
                              id="collection-ftue-view-bonuses"
                              type="button"
                              onMouseDown={() => setPlantCollectionViewBonusesPressed(true)}
                              onMouseUp={() => setPlantCollectionViewBonusesPressed(false)}
                              onMouseLeave={() => setPlantCollectionViewBonusesPressed(false)}
                              onClick={() => {
                                if (collectionFtuePhase === 'point_bonuses' && !collectionFtueCompleted) {
                                  openCollectionBonusesFromFtue();
                                  return;
                                }
                                playSfx(SFX_IDS.uiConfirmNormal);
                                setGoldenPotBonusRevealTier(null);
                                setGoldenPotBonusScrollTierPotCount(null);
                                setGoldenPotBonusesPopupOpen(true);
                              }}
                              className={`relative mx-auto flex items-center justify-center whitespace-nowrap transition-all border outline outline-1 rounded-[8px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:translate-y-[2px] active:border-b-0 active:mb-[4px]`}
                              style={{
                                height: 34,
                                width: 'fit-content',
                                minWidth: '64%',
                                marginTop: 3,
                                paddingLeft: 16,
                                paddingRight: 16,
                                backgroundColor: plantCollectionViewBonusesPressed ? '#61882b' : '#cae060',
                                borderColor: plantCollectionViewBonusesPressed ? '#61882b' : '#9db546',
                                borderBottomWidth: plantCollectionViewBonusesPressed ? '0px' : '4px',
                                marginBottom: plantCollectionViewBonusesPressed ? '4px' : '0px',
                                outlineColor: plantCollectionViewBonusesPressed ? '#61882b' : '#9db546',
                                opacity: collectionFtueViewBonusesVisible ? 1 : 0,
                                transition: `opacity ${COLLECTION_FTUE_UI_FADE_MS}ms ease-out`,
                                pointerEvents:
                                  collectionFtueViewBonusesVisible && !collectionFtueBlockViewBonuses
                                    ? 'auto'
                                    : 'none',
                                ...(showCollectionFtueCta
                                  ? {
                                      position: 'absolute' as const,
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      top: 0,
                                    }
                                  : {}),
                              }}
                            >
                              <span
                                className="font-black tracking-tighter"
                                style={{
                                  color: plantCollectionViewBonusesPressed ? '#cbe05d' : '#587e26',
                                  fontSize: 15.6,
                                }}
                              >
                                View Bonuses
                                </span>
                              </button>
                            )}
                            {showCollectionFtueCta && (
                              <button
                                id="collection-ftue-cta"
                                type="button"
                                onMouseDown={() => !collectionFtueCtaDisabled && setCollectionFtueCtaPressed(true)}
                                onMouseUp={() => setCollectionFtueCtaPressed(false)}
                                onMouseLeave={() => setCollectionFtueCtaPressed(false)}
                                onClick={() => {
                                  if (collectionFtueCtaDisabled || collectionFtueOverlayFadingOut) return;
                                  playSfx(SFX_IDS.uiConfirmNormal);
                                  if (collectionFtueOverlayFadeTimeoutRef.current != null) {
                                    window.clearTimeout(collectionFtueOverlayFadeTimeoutRef.current);
                                  }
                                  setCollectionFtueOverlayFadingOut(true);
                                  collectionFtueOverlayFadeTimeoutRef.current = window.setTimeout(() => {
                                    collectionFtueOverlayFadeTimeoutRef.current = null;
                                    setCollectionFtuePhase('shelf_plant_bounce');
                                    setCollectionFtueOverlayFadingOut(false);
                                  }, 200);
                                }}
                                className={`relative mx-auto flex items-center justify-center whitespace-nowrap transition-all border outline outline-1 rounded-[8px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] ${
                                  collectionFtueCtaDisabled ? '' : 'active:translate-y-[2px] active:border-b-0 active:mb-[4px]'
                                }`}
                                style={{
                                  height: 34,
                                  width: 'fit-content',
                                  minWidth: '64%',
                                  marginTop: 3,
                                  paddingLeft: 16,
                                  paddingRight: 16,
                                  boxSizing: 'border-box',
                                  backgroundColor: collectionFtueCtaDisabled
                                    ? '#e3c28c'
                                    : collectionFtueCtaPressed
                                      ? '#61882b'
                                      : '#cae060',
                                  borderColor: collectionFtueCtaDisabled
                                    ? '#c7a36e'
                                    : collectionFtueCtaPressed
                                      ? '#61882b'
                                      : '#9db546',
                                  borderBottomWidth: collectionFtueCtaPressed && !collectionFtueCtaDisabled ? '0px' : '4px',
                                  marginBottom: collectionFtueCtaPressed && !collectionFtueCtaDisabled ? '4px' : '0px',
                                  outlineColor: collectionFtueCtaDisabled
                                    ? '#c7a36e'
                                    : collectionFtueCtaPressed
                                      ? '#61882b'
                                      : '#9db546',
                                  opacity: collectionFtueBonusesUiRevealed ? 0 : 1,
                                  transition: `opacity ${COLLECTION_FTUE_UI_FADE_MS}ms ease-out`,
                                  pointerEvents: collectionFtueCtaDisabled ? 'none' : 'auto',
                                }}
                              >
                                <span
                                  className="font-bold tracking-tighter"
                                  style={{
                                    color: collectionFtueCtaDisabled
                                      ? '#a68e64'
                                      : collectionFtueCtaPressed
                                        ? '#cbe05d'
                                        : '#587e26',
                                    fontSize: 15.6,
                                    fontWeight: 700,
                                  }}
                                >
                                  Let&apos;s Upgrade a plant
                                </span>
                              </button>
                            )}
                            </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shelves: active garden only */}
                  <div
                    className="relative flex flex-col items-center"
                    style={{
                      marginTop:
                        collectionShelvesMarginTopPx +
                        (isCollectionPhoneLayout
                          ? COLLECTION_PHONE_SHELVES_EXTRA_MARGIN_TOP_UNLOCKED_PX
                          : COLLECTION_SHELVES_EXTRA_MARGIN_TOP_UNLOCKED_PX),
                    }}
                    data-barn-shelves
                  >
                    {Array.from({ length: BARN_SHELVES_PER_GARDEN }, (_, shelfInGarden) =>
                      renderCollectionShelf(getShelfIndexForGarden(activeGardenId, shelfInGarden)),
                    )}
                  </div>
                  <div
                    data-barn-scroll-end
                    aria-hidden
                    className="pointer-events-none shrink-0"
                    style={{ width: 1, height: COLLECTION_SCROLL_BOTTOM_PAD_PX }}
                  />
                </div>
              </div>

              {/* Shed header: coin wallet + boosts + settings; no level bar; tighter left inset (Collection only) */}
              {activeScreen === 'BARN' && (
                <div
                  className="absolute left-0 right-0 z-50 pointer-events-none"
                  style={{ top: safeTopInsetDesign }}
                >
                  <div className="pointer-events-auto">
                    <PageHeader
                      money={money}
                      walletRef={walletRef}
                      walletIconRef={walletIconRef}
                      walletFlashActive={walletFlashActive}
                      walletBurstCount={walletBounceTrigger}
                      goldenPotWallet={goldenPotWalletHeaderProps}
                      onWalletClick={() => {
                      playSfx(SFX_IDS.uiConfirmNormal);
                      setActiveScreen('STORE');
                    }}
                      omitPlayerLevelBlock
                      headerOuterPadLeftPx={0}
                      headerRowPadLeftPx={0}
                      headerClusterMarginLeftPx={14}
                      onGiftClick={() => {
                        if (!canOpenLimitedOfferRewardPopup()) return;
                        const state = buildLimitedOfferPopupState('seed_storm');
                        if (state) setLimitedOfferPopup(state);
                      }}
                      onPauseClick={() => {
                        playSfx(SFX_IDS.uiConfirmNormal);
                        setSettingsOpenedFromFtue(false);
                        setPauseMenuOpen(true);
                      }}
                      hideTopBarBg
                      hideFps
                      gardenId={activeGardenId}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Navbar 
          activeScreen={activeScreen} 
          onScreenChange={(screen) => {
            if (screen !== activeScreen) playSfx(SFX_IDS.uiConfirmNormal);
            if (screen === 'FARM' && collectionFtuePhase === 'point_garden_nav') {
              setCollectionFtuePhase(null);
              setCollectionFtueCompleted(true);
            }
            setActiveScreen(screen);
            if (screen === 'BARN') {
              setBarnNotification(false);
            }
          }} 
          barnButtonRef={barnButtonRef}
          notifications={{
            BARN: barnNotification && isPlantCollectionUiUnlocked,
          }}
          collectionFtueGardenFinger={collectionFtuePhase === 'point_garden_nav' && !collectionFtueCompleted}
          blockInput={tasksFtueActive || gardensFtueActive || newGardenGardensFbFtueActive}
        />

        {/* Leaf burst: portal to body so never clipped; viewport coords */}
        {(activeScreen === 'FARM' || activeScreen === 'BARN') && createPortal(
          <div className="fixed inset-0 pointer-events-none overflow-visible" style={{ zIndex: 55 }}>
            {maxPlantToasts.map((t) => (
              <div
                key={t.id}
                className="max-plant-toast absolute select-none"
                style={{
                  left: t.x,
                  top: t.y - 26,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 9999,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 900,
                  fontSize: '20px',
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                  textShadow:
                    `0 2px 0 rgba(0,0,0,0.25), ` +
                    `1.5px 0 0 #1f5a2a, ` +
                    `-1.5px 0 0 #1f5a2a, ` +
                    `0 1.5px 0 #1f5a2a, ` +
                    `0 -1.5px 0 #1f5a2a`,
                  whiteSpace: 'nowrap',
                  opacity: 1,
                }}
              >
                Max Plant Reached
              </div>
            ))}
            <FarmVfxLayer appScale={appScale} />
            {tasksFbLeafBursts.map((b) => (
              <LeafBurst
                key={b.id}
                x={b.x}
                y={b.y}
                startTime={b.startTime}
                particleCount={LEAF_BURST_BASELINE_COUNT}
                appScale={appScale}
                burstScale={1.25}
                onComplete={() => setTasksFbLeafBursts((prev) => prev.filter((x) => x.id !== b.id))}
              />
            ))}
            {gardensFbLeafBursts.map((b) => (
              <LeafBurst
                key={b.id}
                x={b.x}
                y={b.y}
                startTime={b.startTime}
                particleCount={LEAF_BURST_BASELINE_COUNT}
                appScale={appScale}
                burstScale={1.25}
                onComplete={() => setGardensFbLeafBursts((prev) => prev.filter((x) => x.id !== b.id))}
              />
            ))}
            {boostBursts.map((b) => (
              <LeafBurst
                key={b.id}
                x={b.x}
                y={b.y}
                startTime={b.startTime}
                particleCount={LEAF_BURST_SMALL_COUNT}
                appScale={appScale}
                spriteVariant="gold"
                burstScale={0.5}
                useCircle
                onComplete={() => setBoostBursts((prev) => prev.filter((x) => x.id !== b.id))}
              />
            ))}
            {cellHighlightBeams.map((b) => (
              <CellHighlightBeam
                key={b.id}
                x={b.x}
                y={b.y}
                cellWidth={b.cellWidth}
                cellHeight={b.cellHeight}
                startTime={b.startTime}
                showHexSprite={b.showHexSprite}
                sparkleCount={b.sparkleCount}
                sparkleSizeScale={b.sparkleSizeScale}
                sparkleHeightScale={b.sparkleHeightScale}
                gardenId={activeGardenId}
                onComplete={() => setCellHighlightBeams((prev) => prev.filter((x) => x.id !== b.id))}
              />
            ))}
          </div>,
          document.body
        )}

        {/* FTUE overlays: portal to body, but positioned + scaled to match game-container */}
        {coinPanelPortalRect && createPortal(
          <div
            className="fixed pointer-events-none"
            style={{
              left: coinPanelPortalRect.left,
              top: coinPanelPortalRect.top,
              width: coinPanelPortalRect.width,
              height: coinPanelPortalRect.height,
              transform: `scale(${coinPanelPortalRect.scale})`,
              transformOrigin: 'top left',
              zIndex: 100,
            }}
          >
            {/* FTUE: Welcome (FTUE_1) - only "Lets go!" is clickable */}
            {activeFtueStage === 'welcome' && (
              <FtuePopup
                isVisible={true}
                onClose={() => {
                  playSfx(SFX_IDS.uiConfirmNormal);
                  setActiveFtueStage('seed_tap');
                  setFtue2SeedFireCount(0);
                  setFtue2FadingOut(false);
                }}
                blockBackdropClick={true}
                header={{ icon: assetPath('/assets/icons/upgrades/icon_happycustomer.png') }}
                title="Welcome Gardener!"
                showDivider={true}
                description="Lets plant some seeds, grow some crops & make the customers happy"
                button={{ text: "Lets go!" }}
                burstWidth={260}
                burstHeight={320}
                appScale={1}
              />
            )}

            {/* Warning: Out of Space — blocks input; re-shows whenever grid becomes full+unique again */}
            <FtuePopup
              isVisible={outOfSpaceFtueVisible}
              onClose={() => {
                playSfx(SFX_IDS.uiConfirmNormal);
                setOutOfSpaceFtueVisible(false);
              }}
              blockBackdropClick={true}
              position="top"
              topOffsetPx={120}
              title="Out of Space"
              showDivider={true}
              description="You can remove plants by dragging them off the garden board"
              button={{ text: 'Thanks!' }}
              burstWidth={260}
              burstHeight={320}
              appScale={1}
            />
            {/* FTUE_2: overlay (hole + finger + text above Seeds button); fade in 1s after FTUE_1, fade out after 2 seeds */}
            {(activeFtueStage === 'seed_tap' || ftue2FadingOut) && (
              <Ftue2Overlay
                buttonRect={seedButtonRect}
                isActive={activeFtueStage === 'seed_tap'}
                isFadingOut={ftue2FadingOut}
                seedFireCount={ftue2SeedFireCount}
                onFadeOutComplete={() => {
                  setFtue2FadingOut(false);
                  /* keep ftue2SeedFireCount at 2 so seeds button stays green through FTUE 3–5 (and 6) */
                }}
              />
            )}
            {/* FTUE_3: finger slides 4→13, textbox "Merge these two plants together"; only valid move is drag 4→13; fades out on merge; hide when New Discovery (plant 2) popup is up */}
            {(activeFtueStage === 'merge_drag' || ftue3FadingOut) && !discoveryPopup && (
              <Ftue3Overlay
                isActive={activeFtueStage === 'merge_drag'}
                isFadingOut={ftue3FadingOut}
                appScale={appScale}
                onFadeOutComplete={() => {
                  setFtue3FadingOut(false);
                  setFtue4Pending(true);
                }}
              />
            )}
            {/* FTUE_4: textbox + "Lets Harvest!" next to goal slot 0; only button tappable; click stops bounce and fades out */}
            {(activeFtueStage === 'first_goal' || ftue4FadingOut) && (
              <Ftue4Overlay
                isActive={activeFtueStage === 'first_goal'}
                isFadingOut={ftue4FadingOut}
                appScale={appScale}
                onLetsHarvest={() => {
                  playSfx(SFX_IDS.uiConfirmNormal);
                  setGoalBounceSlots((prev) => prev.filter((s) => s !== 0));
                  setFtue4FadingOut(true);
                }}
                onFadeOutComplete={() => {
                  harvestProgressRef.current = 0;
                  setHarvestProgress(0);
                  setActiveFtueStage('first_harvest');
                  setFtue4FadingOut(false);
                }}
              />
            )}
            {/* FTUE_5: harvest visible (free mode); textbox + finger from other side; only harvest tappable; ends when goal slot 0 completed */}
            {(activeFtueStage === 'first_harvest') && (
              <Ftue5Overlay
                buttonRect={harvestButtonRect}
                isActive={activeFtueStage === 'first_harvest'}
              />
            )}
            {(activeFtueStage === 'first_harvest_multi' || ftue8FadingOut) && (
              <Ftue8Overlay
                buttonRect={harvestButtonRect}
                isActive={activeFtueStage === 'first_harvest_multi'}
                isFadingOut={ftue8FadingOut}
                onFadeOutComplete={() => {
                  setFtue8FadingOut(false);
                }}
              />
            )}
            {(activeFtueStage === 'first_collect_both' || ftue9FadingOut) && (
              <Ftue9Overlay
                isActive={activeFtueStage === 'first_collect_both'}
                isFadingOut={ftue9FadingOut}
                appScale={appScale}
                onFadeOutComplete={() => {
                  setFtue9FadingOut(false);
                  setFtue9CollectedCount(0);
                  // FTUE 9.5: recharge intro + bounce -> proceed to upgrade on confirm
                  setFtueUpgradePanelVisible(false);
                  setIsExpanded(false);
                  setActiveFtueStage('recharge_pre_upgrade');
                }}
              />
            )}
            {(activeFtueStage === 'recharge_pre_upgrade' || ftue95FadingOut) && (
              <Ftue95Overlay
                seedButtonRect={seedButtonRect}
                harvestButtonRect={harvestButtonRect}
                isVisible={activeFtueStage === 'recharge_pre_upgrade' && ftue95ShowTextbox}
                isFadingOut={ftue95FadingOut}
                onConfirm={() => {
                  playSfx(SFX_IDS.uiConfirmNormal);
                  setFtue95FadingOut(true);
                }}
                onFadeOutComplete={() => {
                  setFtue95FadingOut(false);
                  setFtue95ShowTextbox(false);
                  // Stop bouncing once we leave this stage.
                  setFtue10BigBounceActive(false);

                  // FTUE 10: reveal upgrade panel (closed on Seeds), then user opens it manually (finger 1).
                  setFtueUpgradePanelVisible(true);
                  setActiveTab('SEEDS');
                  setIsExpanded(false);
                  setActiveFtueStage('first_upgrade');
                  setFtue10Phase('point_orders');
                }}
              />
            )}
            {(activeFtueStage === 'first_upgrade' || ftue10FadingOut) && (
              <Ftue10Overlay
                harvestButtonRect={harvestButtonRect}
                upgradePanelOpenHeightPx={upgradePanelExpandedPx}
                phase={ftue10Phase}
                purchaseButtonRect={ftue10PurchaseButtonRect}
                appScale={appScale}
                isFadingOut={ftue10FadingOut}
                onFadeOutComplete={() => {
                  // FTUE 10 complete: close upgrade panel; no bounce changes here.
                  setFtue10FadingOut(false);
                  setFtue10Phase(null);
                  setIsExpanded(false);
                  // Keep panel visible in closed state
                  setFtueUpgradePanelVisible(true);
                  // Show FTUE 11 after the upgrade panel is fully closed.
                  setFtue11StartQueued(true);
                }}
              />
            )}
            {activeFtueStage === 'recharge_intro' && (
              <Ftue11Overlay
                seedButtonRect={seedButtonRect}
                harvestButtonRect={harvestButtonRect}
                onConfirm={() => {
                  playSfx(SFX_IDS.uiConfirmNormal);
                  // FTUE 11 is fully closed: from now on we save progress + allow offline earnings.
                  ftue11PersistenceEnabledRef.current = true;
                  // Soft helper: arm 5s harvest nudge (finger only if harvest unused).
                  setPostFtueHarvestNudgeDone(false);
                  postFtueHarvestNudgeDoneRef.current = false;
                  persistGameSnapshotRef.current();
                  setActiveFtueStage(null);
                  setFtue11ThreePlantGoalWindowActive(true);
                  window.setTimeout(() => setFtue11ThreePlantGoalWindowActive(false), 3200);

                  // Spawn 3 starter goals (plant 1/2/3) with 0.5s stagger and bounce.
                  const maxSlots = getMaxPlantGoalSlots(unlockedBonusTierSet);
                  const cropYieldLevel = getCropYieldPerHarvest(cropsState);
                  const plantLevels = [1, 2, 3];
                  const emptySlots: number[] = [];
                  for (let i = 0; i < maxSlots && emptySlots.length < plantLevels.length; i++) {
                    if (goalSlots[i] === 'empty') emptySlots.push(i);
                  }
                  emptySlots.forEach((slotIdx, index) => {
                    const level = plantLevels[index];
                    setTimeout(() => {
                      void preloadGoalOrderIcon(level).then(() => {
                        const isUndiscoveredSpawn = level > Math.max(0, Math.floor(highestPlantEverRef.current));
                        playSfx(isUndiscoveredSpawn ? SFX_IDS.goalSpawnUndiscovered : SFX_IDS.goalSpawnNormal);
                        const required = getGoalCropRequired(playerLevel, cropYieldLevel);
                        setGoalSlots((prev) => {
                          const next = [...prev];
                          next[slotIdx] = 'green';
                          return next;
                        });
                        setGoalPlantTypes((prev) => {
                          const next = [...prev];
                          next[slotIdx] = level;
                          return next;
                        });
                        recordSpawnedGoalPlantLevel(level, lastSpawnedGoalLevelsRef, lastSpawnedGoalPlantLevelHUDRef);
                        setDiscoveryGoalLightGreenDismissed((prev) => {
                          const next = [...prev];
                          next[slotIdx] = false;
                          return next;
                        });
                        const hFtue11 = Math.max(0, Math.floor(highestPlantEverRef.current));
                        setGoalDiscoveryLightGreenActive((prev) => {
                          const next = [...prev];
                          next[slotIdx] = isDiscoveryLightGreenEligible(true, true, level, hFtue11);
                          return next;
                        });
                        setGoalCounts((prev) => {
                          const next = [...prev];
                          next[slotIdx] = required;
                          return next;
                        });
                        setGoalAmountsRequired((prev) => {
                          const next = [...prev];
                          next[slotIdx] = required;
                          return next;
                        });
                        setGoalDisplayOrder((prev) => (prev.includes(slotIdx) ? prev : [...prev, slotIdx]));
                        setGoalSpawnBounceSlots((prev) => (prev.includes(slotIdx) ? prev : [...prev, slotIdx]));
                        setTimeout(() => {
                          setGoalSpawnBounceSlots((prev) => prev.filter((s) => s !== slotIdx));
                        }, 500);
                        persistGameSnapshotRef.current();
                      });
                    }, index * 500);
                  });
                }}
              />
            )}
            {/* FTUE_6: goal in coin state – textbox + finger on goal slot 0; only goal tappable; tap to collect and end */}
            {activeFtueStage === 'first_goal_collect' && (
              <Ftue6Overlay isActive={activeFtueStage === 'first_goal_collect'} appScale={appScale} />
            )}
            {/* Block all input from FTUE 6 collect until FTUE 7 overlay (finger + textbox) appears */}
            {ftue7Scheduled && (
              <div className="absolute inset-0 z-[98]" style={{ pointerEvents: 'auto' }} aria-hidden />
            )}
            {/* FTUE_7: more orders – textbox + finger at seeds; only seeds tappable; 2 taps then fade out */}
            {(activeFtueStage === 'first_more_orders' || ftue7FadingOut) && (
              <Ftue7Overlay
                buttonRect={seedButtonRect}
                isActive={activeFtueStage === 'first_more_orders'}
                isFadingOut={ftue7FadingOut}
                onFadeOutComplete={() => {
                  setFtue7FadingOut(false);
                  setFtue7SeedFireCount(0);
                }}
              />
            )}
            {activeScreen === 'BARN' &&
              collectionFtuePhase &&
              !collectionFtueCompleted &&
              collectionFtuePhase === 'point_bonuses' &&
              !collectionFtueBonusesOverlayReady &&
              !goldenPotBonusesPopupOpen && (
                <CollectionFtueOverlay
                  active
                  fullBlock
                  holeRect={null}
                  fingerStyle="seed"
                  blockerTint={COLLECTION_FTUE_BLOCKER_TINT}
                  holePaddingPx={6}
                />
              )}
            {activeScreen === 'BARN' &&
              collectionFtuePhase &&
              !collectionFtueCompleted &&
              collectionFtuePhase === 'point_bonuses' &&
              collectionFtueBonusesOverlayReady &&
              !goldenPotBonusesPopupOpen && (
                <CollectionBonusesFtueOverlay
                  active
                  appScale={appScale}
                  isFadingOut={collectionFtueBonusesFading}
                  onViewBonuses={openCollectionBonusesFromFtue}
                />
              )}
            {activeScreen === 'BARN' &&
              collectionFtuePhase &&
              !collectionFtueCompleted &&
              !(collectionFtuePhase === 'popup_free' && plantInfoPopup?.isVisible) &&
              collectionFtuePhase !== 'point_bonuses' &&
              collectionFtuePhase !== 'point_garden_nav' && (
                <CollectionFtueOverlay
                  active
                  fullBlock={
                    collectionFtuePhase === 'wait_reveal' ||
                    collectionFtueIntroCtaBlockOnly ||
                    collectionFtueShelfBounceBlockOnly
                  }
                  holeRect={
                    collectionFtuePhase === 'wait_reveal' ||
                    collectionFtueIntroCtaBlockOnly ||
                    collectionFtueShelfBounceBlockOnly
                      ? null
                      : collectionFtueHoleRect
                  }
                  fingerStyle="seed"
                  blockerTint={COLLECTION_FTUE_BLOCKER_TINT}
                  holePaddingPx={6}
                  isFadingOut={collectionFtueOverlayFadingOut}
                />
              )}
            {tasksFtueActive && (
              <CollectionFtueOverlay
                active
                holeRect={tasksFtueHoleRect}
                fingerStyle="point_right"
                blockerTint={COLLECTION_FTUE_BLOCKER_TINT}
                holePaddingPx={8}
              />
            )}
            {gardensFtueActive && (
              <CollectionFtueOverlay
                active
                holeRect={gardensFtueHoleRect}
                fingerStyle="point_right"
                blockerTint={COLLECTION_FTUE_BLOCKER_TINT}
                holePaddingPx={8}
              />
            )}
            {newGardenGardensFbFtueActive && (
              <NewGardenGardensFbFtueOverlay active appScale={appScale} />
            )}
          </div>,
          document.body
        )}
        {activeFtueStage != null && ftueSettingsButtonRect && createPortal(
          <div
            className="fixed pointer-events-none"
            style={{
              left: ftueSettingsButtonRect.left,
              top: ftueSettingsButtonRect.top,
              width: ftueSettingsButtonRect.width,
              height: ftueSettingsButtonRect.height,
              zIndex: 230,
            }}
          >
            <button
              type="button"
              onClick={() => {
                playSfx(SFX_IDS.uiConfirmNormal);
                setSettingsOpenedFromFtue(true);
                setPauseMenuOpen(true);
              }}
              className="pointer-events-auto flex h-full w-full flex-shrink-0 items-center justify-center rounded-full transition-all active:scale-95"
              style={{
                backgroundColor: '#775041',
                borderWidth: 1,
                borderColor: '#e9dcaf',
              }}
              aria-label="Settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.0}
                stroke="#fcf0c7"
                style={{
                  width: ftueSettingsButtonRect.width * (SETTINGS_GEAR_ICON_PX / SETTINGS_GEAR_PX),
                  height: ftueSettingsButtonRect.height * (SETTINGS_GEAR_ICON_PX / SETTINGS_GEAR_PX),
                  flexShrink: 0,
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>,
          document.body
        )}
        {/* Modals (level up, discovery, offers, pause): above surplus coin panels */}
        {createPortal(
          <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 220 }}>
            {dailyTaskLeafBursts.map((b) => (
              <PopupRectLeafBurst
                key={b.id}
                centerX={b.x}
                centerY={b.y}
                rectWidth={b.rectWidth}
                rectHeight={b.rectHeight}
                zIndex={221}
                onComplete={() => setDailyTaskLeafBursts((prev) => prev.filter((x) => x.id !== b.id))}
              />
            ))}
            {/* Level Up Popup */}
            {levelUpPopup && (() => {
              const unlockInfo = getLevelUnlockInfo(levelUpPopup.level, activeGardenId);
              const gardenLevelIntroFtue =
                activeGardenId === DEFAULT_GARDEN_ID && levelUpPopup.level === 2;
              return (
                <LevelUpPopup
                  isVisible={levelUpPopup.isVisible}
                  onClose={() => {
                    if (suppressLevelUpDeclineSfxRef.current) {
                      suppressLevelUpDeclineSfxRef.current = false;
                    }
                    lastOtherPopupClosedAtRef.current = Date.now();
                    setLevelUpPopup(null);
                    setGardenLevelIntroSkipNonce(0);
                    setLevelUpPopupQueue((q) => {
                      if (q.length > 0) {
                        presentLevelUpPopupRef.current(q[0]);
                        return q.slice(1);
                      }
                      return q;
                    });
                    queueMicrotask(() => {
                      tryStartAutoMergeRef.current();
                      scheduleAutoMergeRecheckRef.current(0);
                      // Soft-dismiss Rate Us retry: calm moment after a normal level-up.
                      if (
                        !pendingTasksFtueRevealRef.current &&
                        !pendingGardensFtueRevealRef.current
                      ) {
                        tryOpenRateUsAuto();
                      }
                    });
                  }}
                  level={levelUpPopup.level}
                  title={unlockInfo.title}
                  description={unlockInfo.description}
                  icon={
                    gardenLevelIntroFtue
                      ? assetPath('/assets/icons/upgrades/icon_levelup.png')
                      : unlockInfo.icon
                  }
                  headerIcon={
                    !gardenLevelIntroFtue && unlockInfo.plantCollectionHeader ? (
                      <PlantWithPot level={1} mastered wrapperClassName="h-full w-full scale-110" />
                    ) : undefined
                  }
                  buttonText={unlockInfo.levelUpButtonText}
                  iconScale={unlockInfo.headerIconScale ?? 1}
                  showGoldenPotAvailableRow={levelUpPopup.level === PLANT_COLLECTION_UI_UNLOCK_LEVEL}
                  rewardAmount={unlockInfo.rewardCoins}
                  gardenId={activeGardenId}
                  gardenLevelIntroFtue={gardenLevelIntroFtue}
                  introSkipNonce={gardenLevelIntroSkipNonce}
                  shouldDeferPrimaryClose={(startPoint) => {
                    if (gardenLevelIntroFtue) return false;
                    if (
                      shouldSkipLevelUpAdBreak({
                        level: levelUpPopup.level,
                        gardenId: activeGardenId,
                        collectionFtueCompleted,
                        tasksFtueCompleted,
                        gardensFtueCompleted,
                      })
                    ) {
                      return false;
                    }
                    const showed = tryShowAdBreak('level_up_continue', () => {
                      applyLevelUpPopupUnlock(levelUpPopup.level, startPoint);
                      finishLevelUpPopupAfterAdBreak();
                    });
                    if (showed) {
                      playSfx(
                        unlockInfo.rewardCoins != null && unlockInfo.rewardCoins > 0
                          ? SFX_IDS.uiConfirmReward
                          : SFX_IDS.uiConfirmNormal,
                      );
                      suppressLevelUpDeclineSfxRef.current = true;
                    }
                    return showed;
                  }}
                  onUnlockNow={(startPoint) => {
                    playSfx(
                      unlockInfo.rewardCoins != null && unlockInfo.rewardCoins > 0
                        ? SFX_IDS.uiConfirmReward
                        : SFX_IDS.uiConfirmNormal,
                    );
                    applyLevelUpPopupUnlock(levelUpPopup.level, startPoint);
                  }}
                  appScale={appScale}
                />
              );
            })()}

            {gardenLevelPopupOpen && (
              <GardenLevelPopup
                isVisible
                level={playerLevel}
                levelProgressFraction={
                  getGoalsRequiredForLevel(playerLevel) > 0
                    ? playerLevelProgress / getGoalsRequiredForLevel(playerLevel)
                    : 0
                }
                gardenId={activeGardenId}
                appScale={appScale}
                onUserDismiss={() => playSfx(SFX_IDS.uiDecline)}
                onClose={() => {
                  lastOtherPopupClosedAtRef.current = Date.now();
                  setGardenLevelPopupOpen(false);
                }}
              />
            )}

            {/* Discovery Popup */}
            {goldenPotBonusesPopupOpen && (
              <GoldenPotBonusesPopup
                isVisible
                goldenPotCount={globalBonusPotCount}
                unlockedTierPotCounts={unlockedBonusTier}
                maxGoldenPots={COLLECTION_PLANT_COUNT}
                appScale={appScale}
                revealTierPotCount={goldenPotBonusRevealTier}
                scrollToTierPotCount={goldenPotBonusScrollTierPotCount}
                inProgressTierPotCounts={inProgressBonusTierPotCounts}
                onUserDismiss={() => playSfx(SFX_IDS.uiDecline)}
                onClose={() => {
                  const hadUnlockReveal = goldenPotBonusRevealTier != null;
                  lastOtherPopupClosedAtRef.current = Date.now();
                  setGoldenPotBonusRevealTier(null);
                  setGoldenPotBonusScrollTierPotCount(null);
                  setGoldenPotBonusRevealShelfIndex(null);
                  setGoldenPotBonusesPopupOpen(false);
                  setCollectionFtuePhase((p) => (p === 'point_bonuses' ? 'point_garden_nav' : p));
                  queueMicrotask(() => {
                    tryStartAutoMergeRef.current();
                    scheduleAutoMergeRecheckRef.current(0);
                  });
                  if (hadUnlockReveal) {
                    tryShowAdBreak('collection_bonus_close');
                  }
                }}
              />
            )}

            {discoveryPopup && (
              <DiscoveryPopup
                isVisible={discoveryPopup.isVisible}
                gardenId={activeGardenId}
                onUserDismiss={() => {
                  if (suppressDiscoveryDeclineSfxRef.current) {
                    suppressDiscoveryDeclineSfxRef.current = false;
                  } else {
                    playSfx(SFX_IDS.uiDecline);
                  }
                }}
                onClose={() => {
                  if (suppressDiscoveryDeclineSfxRef.current) {
                    suppressDiscoveryDeclineSfxRef.current = false;
                  }
                  lastOtherPopupClosedAtRef.current = Date.now();
                  setDiscoveryPopup(null);
                  queueMicrotask(() => {
                    tryStartAutoMergeRef.current();
                    scheduleAutoMergeRecheckRef.current(0);
                  });
                }}
                title="New Discovery"
                imageSrc={getGardenPlantSpritePath(discoveryPopup.level, activeGardenId)}
                imageLevel={discoveryPopup.level}
                subtitle={getPlantData(discoveryPopup.level, activeGardenId).name}
                description={getPlantData(discoveryPopup.level, activeGardenId).description}
                buttonText={discoveryPopup.level === 2 ? 'Excellent!' : 'Add to Collection'}
                rewardAmount={applyDoubleCoinsVisualAmount(
                  getCoinValueForLevel(discoveryPopup.level) * PLANT_DISCOVERY_COIN_MULTIPLIER,
                  activeBoosts
                )}
                showCloseButton={false}
                closeOnBackdropClick={false}
                appScale={appScale}
                shouldDeferPrimaryClose={(startPoint) => {
                  const showed = tryShowAdBreak('discovery_add', () => {
                    applyDiscoveryAddToCollectionEffects(discoveryPopup.level, startPoint);
                    finishDiscoveryPopupAfterAdBreak();
                  });
                  if (showed) {
                    playSfx(SFX_IDS.uiConfirmReward);
                    suppressDiscoveryDeclineSfxRef.current = true;
                  }
                  return showed;
                }}
                onButtonClick={(startPoint) => {
                  playSfx(SFX_IDS.uiConfirmReward);
                  applyDiscoveryAddToCollectionEffects(discoveryPopup.level, startPoint);
                }}
              />
            )}

            {iapOfferUi && (() => {
              if (!isStoreIapEnabled(iapOfferUi.offerId)) return null;
              const config =
                STORE_BUNDLE_OFFERS.find((c) => c.id === iapOfferUi.offerId) ??
                STORE_COIN_OFFERS.find((c) => c.id === iapOfferUi.offerId);
              if (!config) return null;
              const isStarterStyleBundlePopup = isLimitedStarterStyleBundleOfferId(iapOfferUi.offerId);
              const isStarterPackPopup = iapOfferUi.offerId === STORE_IAP_OFFER_STARTER_PACK_ID;
              const isFieldPackPopup = iapOfferUi.offerId === STORE_IAP_OFFER_FIELD_PACK_ID;
              const isRemoveAdsPopup = iapOfferUi.offerId === STORE_IAP_OFFER_REMOVE_ADS_ID;
              const usesPremiumIapOfferChrome = isStarterStyleBundlePopup || isRemoveAdsPopup;
              const limitedBundleUnlocked = isStarterPackPopup
                ? readStarterPackUnlocked()
                : isFieldPackPopup
                  ? readFieldPackUnlocked()
                  : false;
              const sharedOfferProps = {
                isVisible: true as const,
                title: config.title,
                headerImageSrc: assetPath(config.headerIcon),
                rewards: buildPurchaseSuccessRewards(config),
                priceLabel: resolveStorePriceLabel(config.id, config.priceLabel),
                originalPriceLabel:
                  'originalPriceLabel' in config && typeof config.originalPriceLabel === 'string'
                    ? resolveStorePriceLabel(`${config.id}_original`, config.originalPriceLabel)
                    : undefined,
                appScale,
                description: isStarterPackPopup
                  ? 'Everything you need to get started'
                  : isFieldPackPopup
                    ? 'A special boost for your new field'
                    : isRemoveAdsPopup
                      ? 'Remove all forced Ads'
                      : undefined,
                titleColor: isRemoveAdsPopup
                  ? '#af233a'
                  : usesPremiumIapOfferChrome
                    ? '#764793'
                    : undefined,
                headerRingSrc: isRemoveAdsPopup
                  ? assetPath('/assets/ui/popup_header_red.png')
                  : usesPremiumIapOfferChrome
                    ? assetPath('/assets/ui/popup_header_purple.png')
                    : undefined,
                titleOffsetYPx: usesPremiumIapOfferChrome ? -10 : undefined,
                closeIconColor: isRemoveAdsPopup
                  ? '#d33d57'
                  : usesPremiumIapOfferChrome
                    ? '#995fb7'
                    : undefined,
                premiumIapTopAccentFill: isRemoveAdsPopup ? '#eb5761' : undefined,
                premiumIapTopAccentStrokeNarrow: isRemoveAdsPopup ? '#eb5761' : undefined,
                premiumIapTopAccentStrokeWide: isRemoveAdsPopup ? '#d33d57' : undefined,
                limitedOfferCountdownStorageKey:
                  isStarterStyleBundlePopup && limitedBundleUnlocked
                    ? (config as StoreBundleOfferConfig).limitedOfferCountdownStorageKey
                    : undefined,
                limitedOfferCountdownDurationMs:
                  isStarterStyleBundlePopup && limitedBundleUnlocked
                    ? (config as StoreBundleOfferConfig).limitedOfferCountdownDurationMs
                    : undefined,
                onUserDismiss: () => playSfx(SFX_IDS.uiDecline),
                onClose: () => {
                  lastOtherPopupClosedAtRef.current = Date.now();
                  setIapOfferUi(null);
                  const pendingLevel = pendingLevelUpAfterStarterPackRef.current;
                  if (pendingLevel != null) {
                    pendingLevelUpAfterStarterPackRef.current = null;
                    setPlayerLevel(pendingLevel);
                    pendingLevelUpBackupRef.current = {
                      gardenId: activeGardenIdRef.current,
                      level: pendingLevel,
                    };
                    recordDailyTaskPlayerLeveledUp();
                    setPlayerLevelProgress(0);
                    setPlayerLevelFlashTrigger((t) => t + 1);
                    levelUpGuardRef.current = false;
                  }
                },
                onPurchase: () => {
                  completePremiumStorePurchase(iapOfferUi.offerId);
                },
              };
              if (isFieldPackPopup) {
                return <FieldPackPopup {...sharedOfferProps} />;
              }
              if (isStarterPackPopup) {
                return <StarterPackPopup {...sharedOfferProps} />;
              }
              return (
                <IapOfferPopup
                  {...sharedOfferProps}
                  leafBurstVariant={isRemoveAdsPopup ? 'removeAds' : undefined}
                />
              );
            })()}

            {purchaseSuccessfulUi && (
              <PurchaseSuccessfulPopup
                isVisible
                headerImageSrc={purchaseSuccessfulUi.headerImageSrc}
                rewards={purchaseSuccessfulUi.rewards}
                appScale={appScale}
                onClose={() => {
                  if (suppressPurchaseSuccessDeclineSfxRef.current) {
                    suppressPurchaseSuccessDeclineSfxRef.current = false;
                  }
                  lastOtherPopupClosedAtRef.current = Date.now();
                  pendingPurchaseBoostsRef.current = [];
                  setPurchaseSuccessfulUi(null);
                }}
                onCollect={(buttonRect) => {
                  playSfx(SFX_IDS.uiConfirmNormal);
                  suppressPurchaseSuccessDeclineSfxRef.current = true;
                  const boosts = [...pendingPurchaseBoostsRef.current];
                  pendingPurchaseBoostsRef.current = [];
                  const isFromStore = activeScreen === 'STORE';
                  const wrapper = isFromStore ? storeHeaderLeftWrapperRef.current : headerLeftWrapperRef.current;
                  if (!wrapper || boosts.length === 0) return;
                  const wr = wrapper.getBoundingClientRect();
                  const scale = wr.width / wrapper.offsetWidth;
                  /** Premium Collect: spawn from right side of green button, then arc to boosts. */
                  const collectOriginX = buttonRect.right - 12;
                  const collectOriginY = buttonRect.top + buttonRect.height / 2;
                  /** Space impacts so each particle lands before the next slot prediction (~500ms flight). */
                  const staggerMs = boosts.length > 1 ? 560 : 175;
                  boosts.forEach((b, i) => {
                    window.setTimeout(() => {
                      const slot = predictBoostParticleTargetSlot(activeBoostsRef.current, b.offerId);
                      setBoostParticles((prev) => [
                        ...prev,
                        {
                          id: `boost-iap-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`,
                          startX: (collectOriginX - wr.left) / scale,
                          startY: (collectOriginY - wr.top) / scale,
                          targetSlotIndex: slot,
                          offerId: b.offerId,
                          durationMs: b.durationMs,
                          icon: b.icon,
                          sourceScreen: isFromStore ? 'store' : 'farm',
                        },
                      ]);
                    }, i * staggerMs);
                  });
                }}
              />
            )}

            {/* Plant Info Popup (Barn) */}
            {plantInfoPopup && plantInfoPopupGardenSnap && (
              <PlantInfoPopup
                isVisible={plantInfoPopup.isVisible}
                gardenId={plantInfoPopup.gardenId}
                onUserDismiss={() => {
                  if (suppressPlantInfoDeclineSfxRef.current) {
                    suppressPlantInfoDeclineSfxRef.current = false;
                  } else {
                    playSfx(SFX_IDS.uiDecline);
                  }
                }}
                onClose={() => {
                  if (suppressPlantInfoDeclineSfxRef.current) {
                    suppressPlantInfoDeclineSfxRef.current = false;
                  }
                  lastOtherPopupClosedAtRef.current = Date.now();
                  setPlantInfoPopup(null);
                }}
                plantLevel={plantInfoPopup.level}
                plantName={getPlantData(plantInfoPopup.level, plantInfoPopup.gardenId).name}
                plantDescription={getPlantData(plantInfoPopup.level, plantInfoPopup.gardenId).description}
                isUnlocked={plantInfoPopup.level <= plantInfoPopupGardenSnap.highestPlantEver}
                masteryPotUnlocked={plantInfoPopupGardenSnap.unlockedLevels.includes(plantInfoPopup.level)}
                appScale={appScale}
              />
            )}

            {/* Limited Offer Popup */}
            {limitedOfferPopup && (
              <LimitedOfferPopup
                isVisible={limitedOfferPopup.isVisible}
                onUserDismiss={() => {
                  if (suppressLimitedOfferDeclineSfxRef.current) {
                    suppressLimitedOfferDeclineSfxRef.current = false;
                  } else {
                    playSfx(SFX_IDS.uiDecline);
                  }
                }}
                onClose={() => {
                  if (suppressLimitedOfferDeclineSfxRef.current) {
                    suppressLimitedOfferDeclineSfxRef.current = false;
                  }
                  const now = Date.now();
                  lastLimitedOfferClosedAtRef.current = now;
                  lastLimitedOfferShownAtRef.current = now; // start 90s cooldown for next offer when timer starts
                  setLimitedOfferPopup(null);
                }}
                closeOnButtonClick={false}
                onCloseButtonClick={() => {
                  if (limitedOfferPopup.activeBoostEndTime != null) return;
                  if (limitedOfferPopup.offerId) {
                    notifyLimitedOfferSoft(limitedOfferPopup.offerId);
                  }
                }}
                title={limitedOfferPopup.title}
                imageSrc={limitedOfferPopup.imageSrc}
                imageLevel={limitedOfferPopup.imageLevel}
                imageMastered={
                  typeof limitedOfferPopup.imageLevel === 'number' &&
                  plantMastery.unlockedLevels.includes(limitedOfferPopup.imageLevel)
                }
                subtitle={limitedOfferPopup.subtitle}
                description={limitedOfferPopup.description}
                buttonText={limitedOfferPopup.buttonText}
                appScale={appScale}
                activeBoostEndTime={limitedOfferPopup.activeBoostEndTime}
                durationMinutes={limitedOfferPopup.durationMinutes}
                durationSeconds={limitedOfferPopup.durationSeconds}
                subtitleSettingsStyle={limitedOfferPopup.subtitleSettingsStyle}
                hideOfferDurationBlock={limitedOfferPopup.hideOfferDurationBlock}
                onButtonClick={() => {
                  playSfx(SFX_IDS.uiConfirmReward);
                  suppressLimitedOfferDeclineSfxRef.current = true;
                  // Show fake ad; when user taps "Complete ad", grant reward. Close limited offer popup now so it's gone when fake ad closes.
                  const offerId = limitedOfferPopup.offerId;
                  pendingAdSourceRef.current = 'limitedOffer';
                  pendingOfferIdRef.current = offerId ?? null;
                  setLimitedOfferPopup(null);
                  openRewardedFakeAd();
                  setPendingAdComplete(() => () => {
                    if (offerId) {
                      setRewardedOffers(prev => prev.filter(o => o.id !== offerId));
                    }
                    const now = Date.now();
                    lastLimitedOfferClosedAtRef.current = now;
                    lastLimitedOfferShownAtRef.current = now;
                    setLimitedOfferPopup(null);
                    setShowFakeAd(false);
                    // Seed Storm: fire free seeds to all empty unlocked cells, 1 every 200ms, no storage/progress cost
                    if (offerId === 'seed_storm') {
                      const g = gridRef.current;
                      const reservedCells = new Set(activeProjectilesRef.current.map(p => p.targetIdx));
                      const emptyIndices = g
                        .map((cell, idx) => (cell.item === null && !cell.locked && !reservedCells.has(idx) ? idx : null))
                        .filter((idx): idx is number => idx !== null);
                      emptyIndices.forEach((targetIdx, i) => {
                        setTimeout(() => {
                          spawnProjectile(targetIdx, seedLevel);
                          playSfx(SFX_IDS.gameplaySeed);
                        }, 200 * i);
                      });
                    }
                    // Special Delivery: shoot a seed that spawns/upgrades to high-level plant; beam + bounce on impact
                    if (offerId === 'special_delivery') {
                      const plantLevel = Math.max(1, highestPlantEverRef.current - 1);
                      const g = gridRef.current;
                      const reserved = new Set(activeProjectilesRef.current.map(p => p.targetIdx));
                      const emptyIndices = g.map((c, i) => (!c.locked && c.item === null && !reserved.has(i) ? i : -1)).filter((i): i is number => i !== -1);
                      let targetIdx: number;
                      if (emptyIndices.length > 0) {
                        targetIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                      } else {
                        const withPlants = g.map((c, i) => (c.item ? { idx: i, level: c.item.level } : null)).filter((x): x is { idx: number; level: number } => x != null);
                        if (withPlants.length === 0) return;
                        withPlants.sort((a, b) => a.level - b.level);
                        targetIdx = withPlants[0].idx;
                      }
                      spawnProjectile(targetIdx, plantLevel, true, true);
                    }
                    // Double Coins from rewarded ad: config has no duration so boost particle path is skipped — grant timed boost here.
                    if (offerId && isCoinMultiplierBoostId(offerId)) {
                      setActiveBoosts((prev) =>
                        applyBoostParticleImpact(prev, {
                          id: `boost-ad-${DOUBLE_COINS_OFFER_ID}-${Date.now()}`,
                          startX: 0,
                          startY: 0,
                          offerId: DOUBLE_COINS_OFFER_ID,
                          durationMs: REWARDED_DOUBLE_COINS_AD_DURATION_MS,
                          icon: getDoubleCoinsActiveBoostIcon(),
                        })
                      );
                      recordDailyTaskBoostUsed();
                    }
                  });
                }}
              />
            )}

            {/* Rewarded ad: full-black fade-in before fake ad */}
            <AdFullscreenFadeOverlay
              active={rewardedAdFadeInActive}
              durationMs={AD_REWARDED_FADE_IN_MS}
            />
            {rewardedAdBlackHoldActive ? (
              <div
                className="fixed inset-0"
                style={{ zIndex: 115, backgroundColor: '#000', pointerEvents: 'none' }}
                aria-hidden
              />
            ) : null}
            <AdFullscreenFadeOverlay
              active={rewardedAdFadeOutActive}
              durationMs={AD_REWARDED_FADE_OUT_MS}
              fromOpacity={1}
              toOpacity={0}
            />

            {/* Interstitial ad break: icon intro before fake ad (wired via openAdBreakFakeAd) */}
            <AdBreakIntroOverlay
              active={adBreakIntroActive}
              fadeOut={adBreakFadeOutActive}
              onIntroComplete={handleAdBreakIntroComplete}
              onFadeOutComplete={handleAdBreakFadeOutComplete}
            />

            {/* Loading plate under real ads (rewarded = Claim Reward, ad-break = Return To Game). */}
            <FakeAdPopup
              isVisible={showFakeAd}
              variant={fakeAdVariant}
              appScale={appScale}
              gameDesignWidth={designWidth}
              gameDesignHeight={designHeight}
              onActivateRewardClick={(buttonRect) => {
                if (pendingAdSourceRef.current === 'adBreak') return;
                if (pendingAdSourceRef.current === 'offlineEarnings') return;
                if (pendingAdSourceRef.current === 'coinGoal') return;
                if (pendingAdSourceRef.current === 'dailyTaskClaim2x') return;
                const offerId = pendingOfferIdRef.current;
                const offer = offerId ? getOfferById(offerId) : null;
                const hasDuration = offer && (offer.durationMinutes != null || (offer.durationSeconds != null && offer.durationSeconds > 0));
                if (!hasDuration) return;
                const isFromStore = pendingAdSourceRef.current === 'storeFreeOffer';
                const wrapper = isFromStore ? storeHeaderLeftWrapperRef.current : headerLeftWrapperRef.current;
                if (!wrapper) return;
                const wr = wrapper.getBoundingClientRect();
                const scale = wr.width / wrapper.offsetWidth;
                const targetSlotIndex = predictBoostParticleTargetSlot(activeBoostsRef.current, offer?.id);
                const durationMs = offer?.durationSeconds != null
                  ? offer.durationSeconds * 1000
                  : offer?.durationMinutes != null
                    ? offer.durationMinutes * 60 * 1000
                    : 60000;
                setBoostParticles((prev) => [
                  ...prev,
                  {
                    id: `boost-${Date.now()}`,
                    startX: (buttonRect.left + buttonRect.width / 2 - wr.left) / scale,
                    startY: (buttonRect.top + buttonRect.height / 2 - wr.top) / scale,
                    targetSlotIndex,
                    offerId: offer?.id,
                    durationMs,
                    icon: offer?.headerIcon,
                    sourceScreen: isFromStore ? 'store' as const : 'farm' as const,
                  },
                ]);
              }}
              onComplete={() => {
                if (pendingAdSourceRef.current === 'adBreak' || fakeAdVariant === 'adBreak') {
                  beginAdBreakOutro();
                  return;
                }
                handleRewardedLoadingPlateComplete();
              }}
            />

            {/*
              REAL INTERSTITIAL AD SLOT (above loading plate).
              Wire SDK in utils/adBreak/interstitialAdBridge.ts — this layer is the mount/cover.
            */}
            <InterstitialAdLayer
              active={interstitialAdSlotActive}
              onClosed={handleInterstitialAdClosed}
            />

            {/*
              REAL REWARDED AD SLOT (above loading plate).
              Wire SDK in utils/adBreak/rewardedAdBridge.ts — this layer is the mount/cover.
            */}
            <RewardedAdLayer
              active={rewardedAdSlotActive}
              onClosed={handleRewardedAdClosed}
            />

            <DailyTasksPopup
              isVisible={dailyTasksPopupOpen}
              onUserDismiss={() => playSfx(SFX_IDS.uiDecline)}
              onClose={() => {
                setDailyTasksPopupOpen(false);
                setDailyTaskClaimBounceIds([]);
                lastOtherPopupClosedAtRef.current = Date.now();
                if (pendingRateUsAfterDailyTasksCloseRef.current) {
                  pendingRateUsAfterDailyTasksCloseRef.current = false;
                  queueMicrotask(() => {
                    tryOpenRateUsAuto({ forceFirstShow: true });
                  });
                }
              }}
              closeOnBackdropClick
              appScale={appScale}
              tasks={dailyTaskRows}
              claimBounceTaskIds={dailyTaskClaimBounceIds}
              onClaimTask={handleDailyTaskClaim}
              onClaim2xTask={handleDailyTaskClaim2x}
              tasksUnlocked={playerLevel >= TASKS_FLOATING_BUTTON_UNLOCK_LEVEL}
              countdownRefreshKey={dailyTasksCountdownRefreshKey}
            />

            <LockedFloatingFeaturePopup
              isVisible={lockedDailyTasksPopupOpen}
              onUserDismiss={() => playSfx(SFX_IDS.uiDecline)}
              onClose={() => setLockedDailyTasksPopupOpen(false)}
              closeOnBackdropClick
              appScale={appScale}
              title="Daily Tasks"
              headerIconSrc={assetPath('/assets/icons/floating_buttons/icon_tasks.png')}
              headerIconPx={Math.round(70 * 1.15)}
              description={LOCKED_DAILY_TASKS_POPUP_DESCRIPTION}
              unlockLevel={TASKS_FLOATING_BUTTON_UNLOCK_LEVEL}
            />

            <LockedFloatingFeaturePopup
              isVisible={lockedGardenPickerPopupOpen}
              onUserDismiss={() => playSfx(SFX_IDS.uiDecline)}
              onClose={() => setLockedGardenPickerPopupOpen(false)}
              closeOnBackdropClick
              appScale={appScale}
              title="Your Gardens"
              headerIconSrc={assetPath('/assets/icons/floating_buttons/icon_fb_gardens.png')}
              headerIconPx={Math.round(80 * 1.15)}
              description={LOCKED_GARDENS_POPUP_DESCRIPTION}
              unlockLevel={GARDENS_FLOATING_BUTTON_UNLOCK_LEVEL}
            />

            <RateUsThankYouPopup
              isVisible={rateUsThankYouOpen}
              onUserDismiss={() => playSfx(SFX_IDS.uiDecline)}
              onDismissForever={() => {
                markRateUsPermanentlyDismissed();
                lastOtherPopupClosedAtRef.current = Date.now();
              }}
              onClose={() => setRateUsThankYouOpen(false)}
              closeOnBackdropClick
              appScale={appScale}
            />

            <CorruptSavePopup
              isVisible={corruptSavePopupOpen}
              onClose={() => {
                playSfx(SFX_IDS.uiConfirmNormal);
                setCorruptSavePopupOpen(false);
                lastOtherPopupClosedAtRef.current = Date.now();
              }}
              appScale={appScale}
            />

            <RateUsPopup
              isVisible={rateUsPopupOpen}
              onUserDismiss={() => playSfx(SFX_IDS.uiDecline)}
              onDismissWithoutComplete={() => {
                markRateUsSoftDismissed();
              }}
              onFifthStarChosen={() => {
                playSfx(SFX_IDS.uiConfirmNormal);
                setRateUsPopupOpen(false);
                openRateUsStore();
                setRateUsThankYouOpen(true);
              }}
              onLowRatingRateNow={() => {
                playSfx(SFX_IDS.uiConfirmNormal);
                setRateUsPopupOpen(false);
                setRateUsThankYouOpen(true);
              }}
              onClose={() => {
                setRateUsPopupOpen(false);
                lastOtherPopupClosedAtRef.current = Date.now();
              }}
              closeOnBackdropClick
              appScale={appScale}
            />

            {newGardenWelcomeFtueActive ? (
              <FtuePopup
                isVisible
                onClose={() => {
                  playSfx(SFX_IDS.uiConfirmNormal);
                  setNewGardenFtuePhasePersisted('point_gardens_fb');
                }}
                blockBackdropClick
                header={{ icon: getGardenPickerGardenIconPath('garden_2') }}
                title={NEW_GARDEN_FTUE_WELCOME_TITLE}
                titleFontSizeRem={NEW_GARDEN_FTUE_WELCOME_TITLE_FONT_SIZE_REM}
                showDivider
                description={NEW_GARDEN_FTUE_WELCOME_DESCRIPTION}
                button={{ text: "Lets go!" }}
                burstWidth={260}
                burstHeight={320}
                appScale={appScale}
              />
            ) : null}

            <GardenPickerPopup
              isVisible={gardenPickerOpen}
              onUserDismiss={() => playSfx(SFX_IDS.uiDecline)}
              onClose={() => setGardenPickerOpen(false)}
              activeGardenId={activeGardenId}
              gardensStarted={gardensStartedList}
              playerMoney={money}
              hasReachedSecondGarden={
                activeGardenId !== DEFAULT_GARDEN_ID ||
                (gardensStartedList.includes('garden_2') && newGardenFtueCompleted)
              }
              newGardenFtueViewGardenId={newGardenPickerFtueActive ? 'garden_2' : null}
              onSelectGarden={(gardenId) => {
                playSfx(SFX_IDS.uiConfirmNormal);
                if (newGardenFtuePhase === 'picker_view' && gardenId !== 'garden_2') return;
                if (newGardenFtuePhase === 'picker_view') {
                  setNewGardenFtuePhasePersisted('welcome');
                }
                switchToGarden(gardenId);
              }}
              onPurchaseGarden={purchaseGardenFromPicker}
              onPurchaseSound={() => playSfx(SFX_IDS.uiConfirmReward)}
              closeOnBackdropClick={!newGardenPickerFtueActive}
              appScale={appScale}
            />

            <SettingsPopup
              isVisible={pauseMenuOpen}
              onUserDismiss={() => playSfx(SFX_IDS.uiDecline)}
              onAnyButtonClick={() => playSfx(SFX_IDS.uiConfirmNormal)}
              musicEnabled={musicEnabled}
              sfxEnabled={sfxEnabled}
              onMusicEnabledChange={setMusicEnabled}
              onSfxEnabledChange={setSfxEnabled}
              notificationsEnabled={returnRemindersEnabled}
              onNotificationsEnabledChange={(enabled) => {
                setReturnRemindersEnabled(enabled);
                persistUserPrefs({ returnRemindersEnabled: enabled });
                if (!enabled) {
                  void cancelReturnReminders();
                  return;
                }
                void (async () => {
                  const prefs = loadUserPrefs();
                  if (!prefs.returnRemindersPermissionAsked && ftue11PersistenceEnabledRef.current) {
                    await tryRequestPermissionOnceAfterFtue();
                  } else if (prefs.returnRemindersPermissionAsked) {
                    await requestNotificationPermission();
                  }
                })();
              }}
              onRateUs={() => {
                setRateUsPopupOpen(true);
                setPauseMenuOpen(false);
                setSettingsOpenedFromFtue(false);
              }}
              onResetGame={() => {
                suppressGameSaveRef.current = true;
                clearGameSave();
                resetUserPrefsTogglesToDefaults();
                setPerformanceMode(false);
                try {
                  sessionStorage.setItem('pocket-garden-reset-v1', '1');
                } catch {
                  /* ignore */
                }
                window.location.reload();
              }}
              onClose={() => {
                setPauseMenuOpen(false);
                setSettingsOpenedFromFtue(false);
                setDevToolsOpen(false);
                flushDeferredCheatPopups();
              }}
              onOpenDevTools={() => setDevToolsOpen(true)}
              showDevToolsButton={devToolsUnlocked}
              onUnlockDevTools={() => setDevToolsUnlocked(true)}
              closeOnBackdropClick
              appScale={appScale}
            />

            <PauseMenuPopup
              isVisible={devToolsOpen}
              onUserDismiss={() => playSfx(SFX_IDS.uiDecline)}
              onAnyButtonClick={() => playSfx(SFX_IDS.uiConfirmNormal)}
              onClose={() => {
                setDevToolsOpen(false);
              }}
              onDisableDevTools={() => {
                setDevToolsUnlocked(false);
                setDevToolsOpen(false);
              }}
              activeGardenLabel={getGardenDisplayLabel(activeGardenId)}
              onCycleGardenClick={cycleActiveGarden}
              onSkipTutorial={
                settingsOpenedFromFtue
                  ? () =>
                      handlePostFtueCleanRestart(
                        'Skip the tutorial and start from level 1 with a fresh farm?'
                      )
                  : undefined
              }
              onPreviewCorruptSavePopup={() => {
                setDevToolsOpen(false);
                setPauseMenuOpen(false);
                setCorruptSavePopupOpen(true);
              }}
              onClearRating={() => {
                clearRateUsPromptStorage();
              }}
              onClearBoosts={() => {
                setBoostParticles([]);
                setActiveBoosts([]);
                setStoreFreeOfferSlots(pickInitialStoreFreeOfferSlots());
                setStoreSlotCooldownEnds([0, 0]);
                if (hasGoldenPotDailyAllowance(unlockedBonusTierSet)) {
                  const v2 = loadGameSaveV2();
                  if (v2) {
                    persistGameSaveV2(clearDailyAllowanceClaimedForAllGardens(v2));
                  }
                }
                setDailyAllowanceClaimedDayKey(undefined);
                setDailyAllowanceUiHoldUntilMs(0);
                if (dailyAllowanceUiHoldTimeoutRef.current) {
                  clearTimeout(dailyAllowanceUiHoldTimeoutRef.current);
                  dailyAllowanceUiHoldTimeoutRef.current = null;
                }
                if (starterPackUnlocked && !readStarterPackUnlocked()) {
                  markStarterPackUnlocked();
                }
                if (restoreStarterPackOfferAfterClearBoosts()) {
                  setStarterPackPurchased(false);
                  setStarterPackUnlocked(true);
                  setStarterPackCountdownRefreshKey((k) => k + 1);
                }
                if (fieldPackUnlocked && !readFieldPackUnlocked()) {
                  markFieldPackUnlocked();
                }
                if (restoreFieldPackOfferAfterClearBoosts()) {
                  setFieldPackPurchased(false);
                  setFieldPackUnlocked(true);
                  setFieldPackCountdownRefreshKey((k) => k + 1);
                }
              }}
              onResetProgress={() => {
                if (
                  !window.confirm(
                    'You will Reset your game & progress back to the start including all FTUE'
                  )
                ) {
                  return;
                }
                suppressGameSaveRef.current = true;
                clearGameSave();
                resetUserPrefsTogglesToDefaults();
                setPerformanceMode(false);
                try {
                  sessionStorage.setItem('pocket-garden-reset-v1', '1');
                } catch {
                  /* ignore */
                }
                window.location.reload();
              }}
              onRewardedAdClick={() => {
                if (!canOpenLimitedOfferRewardPopup()) return;
                if (LIMITED_OFFERS_AD_POOL.length === 0) return;
                const offer = LIMITED_OFFERS_AD_POOL[nextRewardedAdOfferIndexRef.current % LIMITED_OFFERS_AD_POOL.length];
                nextRewardedAdOfferIndexRef.current = (nextRewardedAdOfferIndexRef.current + 1) % LIMITED_OFFERS_AD_POOL.length;
                const state = buildLimitedOfferPopupState(offer.id, { highestPlantEver });
                if (state) setLimitedOfferPopup(state);
              }}
              onLevelUpClick={handleDevLevelUpClick}
              canUnlockPlant={hasAnyDevUnlockPlantRemaining(
                activeGardenId,
                activeCollectionSnapshot,
                collectionV2Gardens,
                [activeGardenId],
              )}
              onUnlockPlantClick={handleDevUnlockPlantClick}
              onGoldenPotClick={handleDevGoldenPotClick}
              onTestAdBreakClick={() => {
                setDevToolsOpen(false);
                setPauseMenuOpen(false);
                // Bypass cooldown/blockers — pause menu was blocking tryShowAdBreak.
                queueMicrotask(() => openAdBreakFakeAd(undefined, { force: true }));
              }}
              fakeNotchPreviewEnabled={fakeNotchPreviewEnabled}
              onFakeNotchToggle={() => {
                setFakeNotchPreviewEnabled((on) => !on);
              }}
              onCompleteTaskClick={() => {
                if (playerLevel >= TASKS_FLOATING_BUTTON_UNLOCK_LEVEL) {
                  markDailyTasksUnlocked();
                }
                applyDailyTaskRowsUpdate(completeNextDailyTaskForDev(getDailyTasksCtx()));
              }}
              onResetTasksClick={() => {
                if (playerLevel >= TASKS_FLOATING_BUTTON_UNLOCK_LEVEL) {
                  markDailyTasksUnlocked();
                }
                applyDailyTaskRowsUpdate(resetDailyTasksForDev(getDailyTasksCtx()));
                setDailyTaskClaimBounceIds([]);
              }}
              onAddMoney={() => handleDevAddMoneyClick()}
              onClearCoins={() => handleDevClearCoinsClick()}
              onClearProgress={() =>
                handlePostFtueCleanRestart(
                  'You will lose your progress and start from level 1 without the FTUE'
                )
              }
              closeOnBackdropClick
              appScale={appScale}
            />

            {offlineEarningsUi?.open ? (
              <OfflineEarningsPopup
                isVisible={offlineEarningsUi.open}
                onClose={() => {}}
                rewardAmount={offlineEarningsUi.amount}
                rewardBounceKey={offlineEarningsUi.rewardBounceKey}
                showDoubleButton={offlineEarningsUi.showDoubleButton}
                onDoubleCoinsClick={() => {
                  playSfx(SFX_IDS.uiConfirmReward);
                  setOfflineEarningsUi((prev) => (prev ? { ...prev, showDoubleButton: false } : prev));
                  pendingAdSourceRef.current = 'offlineEarnings';
                  setPendingAdComplete(() => () => {
                    pendingOfflineEarningsRef.current *= 2;
                    const nextAmount = applyGoldenPotOfflineEarningsBonus(
                      pendingOfflineEarningsRef.current,
                      unlockedBonusTierSetRef.current,
                    );
                    setOfflineEarningsUi((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        amount: nextAmount,
                        showDoubleButton: false,
                        rewardBounceKey: prev.rewardBounceKey + 1,
                      };
                    });
                  });
                  openRewardedFakeAd();
                }}
                onCollectClick={(startPoint) => {
                  playSfx(SFX_IDS.uiConfirmReward);
                  const amt = offlinePopupAmountRef.current;
                  const payout = amt;
                  pendingOfflineEarningsRef.current = 0;
                  setOfflineEarningsUi(null);
                  setDeferNewGardenFtueUiForOffline(false);
                  lastOfflineEarningsClosedAtRef.current = Date.now();
                  if (pendingSwitchGardenAdBreakRef.current) {
                    pendingSwitchGardenAdBreakRef.current = false;
                    queueMicrotask(() => tryShowAdBreakRef.current('switch_garden'));
                  }
                  const layer = discoveryRewardFxLayerRef.current;
                  if (layer) {
                    const lr = layer.getBoundingClientRect();
                    setActiveDiscoveryCoinParticles((prev) => [
                      ...prev,
                      {
                        id: `offline-earnings-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        startX: startPoint.x - lr.left,
                        startY: startPoint.y - lr.top,
                        value: payout,
                      },
                    ]);
                  }
                }}
                appScale={appScale}
              />
            ) : null}

            {/* Discovery reward coin VFX: viewport space (appScale 1) so spawn aligns with reward icon in modal */}
            <div
              ref={discoveryRewardFxLayerRef}
              className="pointer-events-none overflow-visible"
              style={{ position: 'fixed', inset: 0, zIndex: 230 }}
            >
              {activeDiscoveryCoinParticles.map((p) => (
                <GoalCoinParticle
                  key={p.id}
                  data={p}
                  containerRef={discoveryRewardFxLayerRef}
                  walletRef={walletRef}
                  walletIconRef={walletIconRef}
                  appScale={1}
                  variant="popupReward"
                  popupVisualScale={appScale}
                  activeCount={activeDiscoveryCoinParticles.length}
                  onImpact={(value) => {
                    setMoney((prev) => prev + value);
                    setWalletFlashActive(true);
                    playSfx(SFX_IDS.coinImpact);
                    setWalletBounceTrigger((t) => t + 1);
                    if (walletFlashTimeoutRef.current) clearTimeout(walletFlashTimeoutRef.current);
                    walletFlashTimeoutRef.current = setTimeout(() => setWalletFlashActive(false), 120);
                  }}
                  onComplete={() => setActiveDiscoveryCoinParticles((prev) => prev.filter((x) => x.id !== p.id))}
                />
              ))}
              {activeGoldenPotProgressParticles.map((p) => (
                <GoldenPotProgressParticle
                  key={p.id}
                  data={p}
                  walletFallbackTargetRef={goldenPotWalletIconRef}
                  onImpact={() => {
                    playSfx(SFX_IDS.coinImpact);
                    setGoldenPotWalletFlashActive(true);
                    setGoldenPotWalletBounceTrigger((t) => t + 1);
                    if (goldenPotWalletFlashTimeoutRef.current) {
                      clearTimeout(goldenPotWalletFlashTimeoutRef.current);
                    }
                    goldenPotWalletFlashTimeoutRef.current = setTimeout(
                      () => setGoldenPotWalletFlashActive(false),
                      120,
                    );
                    window.setTimeout(() => {
                      setCollectionBarHeldNumeratorCount(null);
                    }, 200);
                  }}
                  onComplete={() =>
                    setActiveGoldenPotProgressParticles((prev) => prev.filter((x) => x.id !== p.id))
                  }
                />
              ))}
            </div>
          </div>,
          document.body
        )}

        <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden">
          {activeBarnParticles.map((p) => (
            <BarnParticle
              key={p.id}
              data={p}
              containerRef={containerRef}
              barnButtonRef={barnButtonRef}
              appScale={appScale}
              onImpact={() => {
                if (isPlantCollectionUiUnlocked) {
                  setBarnNotification(true);
                }
              }}
              onComplete={() => setActiveBarnParticles((prev) => prev.filter((x) => x.id !== p.id))}
            />
          ))}
          {activeProjectiles.map(p => (
            <Projectile 
              key={p.id}
              data={p}
              appScale={appScale}
              onImpact={(targetIdx) => {
                // FTUE 8 starts only from FTUE 7 overlay onFadeOutComplete (no seed-land trigger) so 7→8 transition is instant
                if (p.isSpecialDelivery) {
                  // Special Delivery: spawn on empty cell or upgrade existing plant; then beam + bounce
                  const g = gridRef.current;
                  const cell = g?.[targetIdx];
                  if (cell && cell.item === null) {
                    queueSpawnCropFromProjectile(targetIdx, p.plantLevel);
                  } else {
                    setGrid(prev => {
                      const next = [...prev];
                      const cur = next[targetIdx]?.item;
                      if (next[targetIdx] && cur) next[targetIdx] = { ...next[targetIdx], item: { ...cur, level: p.plantLevel } };
                      return next;
                    });
                    setImpactCellIdx(targetIdx);
                    setTimeout(() => setImpactCellIdx(null), 500);
                    scheduleAutoMergeRecheck(AUTO_MERGE_POST_SETTLE_MS);
                  }
                  const hexEl = document.getElementById(`hex-${targetIdx}`);
                  if (hexEl) {
                    const r = hexEl.getBoundingClientRect();
                    if (!getPerformanceMode()) {
                      spawnLeafBurstSmall({ id: `sd-burst-${targetIdx}-${Date.now()}`, x: r.left + r.width / 2, y: r.top + r.height / 2, startTime: Date.now() });
                    }
                    setCellHighlightBeams((prev) => [...prev, { id: `special-delivery-${targetIdx}-${Date.now()}`, x: r.left + r.width / 2, y: r.top + r.height / 2, cellWidth: r.width, cellHeight: r.height, startTime: Date.now() }]);
                  }
                  return;
                }
                // Normal seed: spawn plant and optional seed-quality beam
                queueSpawnCropFromProjectile(targetIdx, p.plantLevel);
                const hexEl = document.getElementById(`hex-${targetIdx}`);
                if (hexEl) {
                  const r = hexEl.getBoundingClientRect();
                  if (!getPerformanceMode()) {
                    spawnLeafBurstSmall({
                        id: Math.random().toString(36).slice(2),
                        x: r.left + r.width / 2,
                        y: r.top + r.height / 2,
                        startTime: Date.now(),
                      });
                  }
                  
                  if (p.plantLevel > seedLevel) {
                    setCellHighlightBeams((prev) => [
                      ...prev,
                      {
                        id: `seed-quality-highlight-${targetIdx}-${Date.now()}`,
                        x: r.left + r.width / 2,
                        y: r.top + r.height / 2,
                        cellWidth: r.width,
                        cellHeight: r.height,
                        startTime: Date.now(),
                      },
                    ]);
                  }
                }
              }}
              onComplete={() => {
                setActiveProjectiles(prev => prev.filter(item => item.id !== p.id));
              }}
            />
          ))}
          {createPortal(
            coinPanelPortalRect ? (
              <div
                className="pointer-events-none overflow-visible"
                style={{
                  position: 'fixed',
                  left: coinPanelPortalRect.left,
                  top: coinPanelPortalRect.top,
                  width: coinPanelPortalRect.width,
                  height: coinPanelPortalRect.height,
                  transform: `scale(${coinPanelPortalRect.scale})`,
                  transformOrigin: 'top left',
                  zIndex: 110,
                  // When on shed/market, still run animations (surplus fires & credits) but hide so user doesn't see particles
                  visibility: activeScreen === 'FARM' ? 'visible' : 'hidden',
                }}
              >
                {activeCoinPanels.map((coin) => (
                  <CoinPanel
                    key={coin.id}
                    data={coin}
                    containerRef={containerRef}
                    walletRef={walletRef}
                    walletIconRef={walletIconRef}
                    appScale={appScale}
                    activePanelCount={activeCoinPanels.length}
                    onImpact={(value) => {
                      if (coin.dailyTaskCoinKind === 'merge') {
                        applyDailyTaskRowsUpdate(
                          recordDailyTaskMergeCoins(getDailyTasksCtx(), value),
                        );
                      }
                      playSfx(SFX_IDS.coinImpact);
                      pendingCoinImpactRef.current.total += value;
                        if (!pendingCoinImpactRef.current.scheduled) {
                          pendingCoinImpactRef.current.scheduled = true;
                          walletImpactFlushRafRef.current = requestAnimationFrame(() => {
                            const total = pendingCoinImpactRef.current.total;
                            pendingCoinImpactRef.current = { total: 0, scheduled: false };
                            walletImpactFlushRafRef.current = 0;
                            setMoney((prev) => prev + total);
                            setWalletBounceTrigger((t) => t + 1);
                            setWalletFlashActive(true);
                            if (walletFlashTimeoutRef.current) clearTimeout(walletFlashTimeoutRef.current);
                            walletFlashTimeoutRef.current = setTimeout(() => setWalletFlashActive(false), 120);
                          });
                        }
                      }}
                      onComplete={() => setActiveCoinPanels(prev => prev.filter((c) => c.id !== coin.id))}
                    />
                  ))}
                </div>
              ) : (
                <></>
              ),
              document.body
            )}
          {activePlantPanels.map((panel) => (
            <PlantPanel
              key={panel.id}
              data={panel}
              containerRef={containerRef}
              targetRef={goalIconRefs[panel.goalSlotIdx]}
              appScale={appScale}
              onImpact={(goalSlotIdx, amount) => {
                playSfx(SFX_IDS.goalImpact);
                if (amount > 0) {
                  applyDailyTaskRowsUpdate(
                    recordDailyTaskHarvestCrops(getDailyTasksCtx(), amount),
                  );
                  if (panel.fromMergeHarvest) {
                    applyDailyTaskRowsUpdate(
                      recordDailyTaskMergeHarvestCrops(getDailyTasksCtx(), amount),
                    );
                  }
                }
                const harvestSources = goalOrderHarvestSourcesRef.current[goalSlotIdx] ?? { manual: 0, merge: 0 };
                if (panel.fromMergeHarvest) harvestSources.merge += amount;
                else harvestSources.manual += amount;
                goalOrderHarvestSourcesRef.current[goalSlotIdx] = harvestSources;
                const plantLevelAtHit = goalPlantTypes[goalSlotIdx] ?? goalSlotIdx + 1;
                const hHit = highestPlantEverRef.current;
                const eligibleHit =
                  isDiscoveryLightGreenEligible(
                    ftue11PersistenceEnabledRef.current,
                    ftue11ThreePlantGoalWindowActive,
                    plantLevelAtHit,
                    hHit
                  ) || goalDiscoveryLightGreenActiveRef.current[goalSlotIdx];
                if (
                  eligibleHit &&
                  amount > 0 &&
                  !discoveryGoalLightGreenDismissedRef.current[goalSlotIdx]
                ) {
                  const dNext = [...discoveryGoalLightGreenDismissedRef.current];
                  dNext[goalSlotIdx] = true;
                  discoveryGoalLightGreenDismissedRef.current = dNext;
                  setDiscoveryGoalLightGreenDismissed(dNext);
                  setGoalDiscoveryLightGreenActive((prev) => {
                    const n = [...prev];
                    n[goalSlotIdx] = false;
                    goalDiscoveryLightGreenActiveRef.current = n;
                    return n;
                  });
                }

                goalInFlightHarvestBySlotRef.current[goalSlotIdx] = Math.max(0, (goalInFlightHarvestBySlotRef.current[goalSlotIdx] ?? 0) - amount);
                goalsPendingCompletionRef.current.delete(goalSlotIdx);
                setGoalBounceSlots((prev) => prev.includes(goalSlotIdx) ? prev : [...prev, goalSlotIdx]);
                setGoalImpactSlots((prev) => prev.includes(goalSlotIdx) ? prev : [...prev, goalSlotIdx]);
                const prevGoalCount = goalCounts[goalSlotIdx] ?? 0;
                const nextGoalCount = Math.max(0, prevGoalCount - amount);
                const orderFulfilled = nextGoalCount === 0 && prevGoalCount > 0;
                setGoalCounts((c) => {
                  const next = [...c];
                  const prevCount = next[goalSlotIdx] ?? 0;
                  next[goalSlotIdx] = Math.max(0, prevCount - amount);
                  if (next[goalSlotIdx] === 0) {
                    if (prevCount > 0) playSfx(SFX_IDS.goalImpactComplete);
                    const plantLevel = goalPlantTypes[goalSlotIdx] ?? goalSlotIdx + 1;
                    const plantValue = getCoinValueForLevel(plantLevel);
                    const amountRequired = goalAmountsRequired[goalSlotIdx] ?? 3;
                    const marketMultiplier = getMarketValueMultiplier(harvestState);
                    const rawValue = plantValue * amountRequired * marketMultiplier;
                    const roundedValue = Math.round(rawValue / 5) * 5;
                    setGoalCompletedValues((v) => {
                      const vNext = [...v];
                      vNext[goalSlotIdx] = roundedValue;
                      return vNext;
                    });
                    setGoalSlots((s) => {
                      const sNext = [...s];
                      sNext[goalSlotIdx] = 'completed';
                      return sNext;
                    });
                    if (goalSlotIdx === 0) setActiveFtueStage((stage) => (stage === 'first_harvest' ? 'first_goal_collect' : stage));
                  }
                  return next;
                });

                if (orderFulfilled && goalSlotIdx !== 4) {
                  const taskCtx = getDailyTasksCtx();
                  const sources = goalOrderHarvestSourcesRef.current[goalSlotIdx] ?? { manual: 0, merge: 0 };
                  const mergeOnlyOrder = sources.merge > 0 && sources.manual === 0;
                  delete goalOrderHarvestSourcesRef.current[goalSlotIdx];
                  applyDailyTaskRowsUpdate(recordDailyTaskOrderComplete(taskCtx, { mergeOnly: mergeOnlyOrder }));
                }

                window.setTimeout(() => {
                  setGoalBounceSlots((prev) => prev.filter((s) => s !== goalSlotIdx));
                  setGoalImpactSlots((prev) => prev.filter((s) => s !== goalSlotIdx));
                }, GOAL_IMPACT_CLEAR_MS);
              }}
              onComplete={() => setActivePlantPanels(prev => prev.filter((p) => p.id !== panel.id))}
            />
          ))}
          {walletBursts.map((burst) => (
            <WalletImpactBurst
              key={burst.id}
              trigger={burst.trigger}
              walletIconRef={walletIconRef}
              containerRef={containerRef}
              appScale={appScale}
              onComplete={() => setWalletBursts((prev) => prev.filter((b) => b.id !== burst.id))}
            />
          ))}
          {activeGoalCoinParticles.map((p) => (
            <GoalCoinParticle
              key={p.id}
              data={p}
              containerRef={containerRef}
              walletRef={walletRef}
              walletIconRef={walletIconRef}
              appScale={appScale}
              variant="goal"
              activeCount={activeGoalCoinParticles.length}
              onImpact={(value) => {
                let finalValue = value;
                if (!p.skipHappyCustomerRoll) {
                  const happiestCustomersActive = activeBoosts.some(b => b.offerId === 'happiest_customers');
                  if (!happiestCustomersActive) {
                    const happyChance = getHappyCustomerChance(harvestState);
                    if (happyChance > 0 && Math.random() * 100 < happyChance) finalValue *= 2;
                  }
                }
                setMoney((prev) => prev + finalValue);
                setWalletFlashActive(true);
                playSfx(SFX_IDS.coinImpact);
                setWalletBounceTrigger((t) => t + 1);
                if (walletFlashTimeoutRef.current) clearTimeout(walletFlashTimeoutRef.current);
                walletFlashTimeoutRef.current = setTimeout(() => setWalletFlashActive(false), 120);
              }}
              onComplete={() => setActiveGoalCoinParticles((prev) => prev.filter((x) => x.id !== p.id))}
            />
          ))}
          {activeUpgradeParticles.map((p) => (
            <UpgradeParticle
              key={p.id}
              data={p}
              activeCount={activeUpgradeParticles.length}
              onImpact={() => {
                const kind = p.impactKind ?? 'seed';
                if (kind === 'seed') {
                  playSfx(SFX_IDS.coinImpact);
                  setSeedBounceTrigger((t) => t + 1);
                  triggerSeedButtonLeafBurst();
                  return;
                }
                if (kind === 'harvest') {
                  playSfx(SFX_IDS.coinImpact);
                  setHarvestBounceTrigger((t) => t + 1);
                  triggerHarvestButtonLeafBurst();
                  return;
                }
                if (kind === 'wildGrowthGlow' && typeof p.cellIdx === 'number') {
                  playSfx(SFX_IDS.coinImpact);
                  showWildGrowthPreviewGlow(p.cellIdx);
                  return;
                }
                if (kind === 'plotUnlock' && typeof p.cellIdx === 'number') {
                  playSfx(SFX_IDS.coinImpact);
                  unlockCellAt(p.cellIdx);
                  return;
                }
                if (kind === 'goal' && typeof p.goalSlotIdx === 'number') {
                  const slotIdx = p.goalSlotIdx;
                  playSfx(SFX_IDS.coinImpact);
                  setGoalBounceSlots((prev) =>
                    prev.includes(slotIdx) ? prev : [...prev, slotIdx],
                  );
                  setTimeout(() => {
                    setGoalBounceSlots((b) => b.filter((i) => i !== slotIdx));
                  }, 400);
                  if (!getPerformanceMode()) {
                    const icon = goalIconRefs[slotIdx]?.current;
                    const slotEl = document.querySelector(
                      `[data-goal-slot="${slotIdx}"]`,
                    ) as HTMLElement | null;
                    const el = icon ?? slotEl;
                    if (el) {
                      const r = el.getBoundingClientRect();
                      spawnGoalCoinLeafBurst({
                          id: `goal-upg-lb-${nextGoalCoinBurstIdRef.current++}`,
                          x: r.left + r.width / 2,
                          y: r.top + r.height / 2 + 30,
                          startTime: Date.now(),
                          spriteVariant: 'default',
                        });
                    }
                  }
                  return;
                }
                if (kind === 'goalLoading' && typeof p.goalSlotIdx === 'number') {
                  const slotIdx = p.goalSlotIdx;
                  playSfx(SFX_IDS.coinImpact);
                  setGoalLoadingSeconds((prev) => Math.max(0, prev - 1));
                  setGoalBounceSlots((prev) =>
                    prev.includes(slotIdx) ? prev : [...prev, slotIdx],
                  );
                  setTimeout(() => {
                    setGoalBounceSlots((b) => b.filter((i) => i !== slotIdx));
                  }, 400);
                  if (!getPerformanceMode()) {
                    const icon = goalIconRefs[slotIdx]?.current;
                    const slotEl = document.querySelector(
                      `[data-goal-slot="${slotIdx}"]`,
                    ) as HTMLElement | null;
                    // Prefer timer/plant icon anchor; never use full slot center (210px tall → burst too low).
                    if (icon) {
                      const r = icon.getBoundingClientRect();
                      spawnGoalCoinLeafBurst({
                          id: `goal-load-lb-${nextGoalCoinBurstIdRef.current++}`,
                          x: r.left + r.width / 2,
                          y: r.top + r.height / 2 + 30,
                          startTime: Date.now(),
                          spriteVariant: 'default',
                        });
                    } else if (slotEl) {
                      const r = slotEl.getBoundingClientRect();
                      spawnGoalCoinLeafBurst({
                          id: `goal-load-lb-${nextGoalCoinBurstIdRef.current++}`,
                          x: r.left + r.width / 2,
                          y: r.top + 40 + 30,
                          startTime: Date.now(),
                          spriteVariant: 'default',
                        });
                    }
                  }
                }
              }}
              onComplete={() => setActiveUpgradeParticles((prev) => prev.filter((x) => x.id !== p.id))}
            />
          ))}

          {/* Boost particles: farm → Farm header; store → Store header (so particle flies to visible boost area) */}
          {activeScreen === 'FARM' &&
            headerLeftWrapperRef.current &&
            boostParticles.filter((p) => p.sourceScreen !== 'store').length > 0 &&
            createPortal(
              boostParticles
                .filter((p) => p.sourceScreen !== 'store')
                .map((particle) => (
                  <BoostParticle
                    key={particle.id}
                    data={particle}
                    containerRef={headerLeftWrapperRef}
                    boostAreaRef={activeBoostAreaRef}
                    onImpact={(data) => {
                      const wrapper = headerLeftWrapperRef.current;
                      const el = activeBoostAreaRef.current;
                      if (wrapper && el) {
                        const wr = wrapper.getBoundingClientRect();
                        const scale = wr.width / wrapper.offsetWidth;
                        const slotIndex = data.targetSlotIndex ?? 0;
                        const tx = el.offsetLeft + slotIndex * 28 + 13;
                        const ty = el.offsetTop + 11;
                        setBoostBursts((prev) => [
                          ...prev,
                          {
                            id: `boost-impact-${Date.now()}`,
                            x: wr.left + tx * scale,
                            y: wr.top + ty * scale,
                            startTime: Date.now(),
                          },
                        ]);
                      }
                      playSfx(SFX_IDS.coinImpact);
                      setActiveBoosts((prev) => applyBoostParticleImpact(prev, data));
                      recordDailyTaskBoostUsed();
                    }}
                    onComplete={() => setBoostParticles((prev) => prev.filter((p) => p.id !== particle.id))}
                  />
                )),
              headerLeftWrapperRef.current
            )}
          {activeScreen === 'STORE' &&
            storeHeaderLeftWrapperRef.current &&
            boostParticles.filter((p) => p.sourceScreen === 'store').length > 0 &&
            createPortal(
              boostParticles
                .filter((p) => p.sourceScreen === 'store')
                .map((particle) => (
                  <BoostParticle
                    key={particle.id}
                    data={particle}
                    containerRef={storeHeaderLeftWrapperRef}
                    boostAreaRef={storeActiveBoostAreaRef}
                    onImpact={(data) => {
                      const wrapper = storeHeaderLeftWrapperRef.current;
                      const el = storeActiveBoostAreaRef.current;
                      if (wrapper && el) {
                        const wr = wrapper.getBoundingClientRect();
                        const scale = wr.width / wrapper.offsetWidth;
                        const slotIndex = data.targetSlotIndex ?? 0;
                        const tx = el.offsetLeft + slotIndex * 28 + 13;
                        const ty = el.offsetTop + 11;
                        setBoostBursts((prev) => [
                          ...prev,
                          {
                            id: `boost-impact-${Date.now()}`,
                            x: wr.left + tx * scale,
                            y: wr.top + ty * scale,
                            startTime: Date.now(),
                          },
                        ]);
                      }
                      playSfx(SFX_IDS.coinImpact);
                      setActiveBoosts((prev) => applyBoostParticleImpact(prev, data));
                      recordDailyTaskBoostUsed();
                    }}
                    onComplete={() => setBoostParticles((prev) => prev.filter((p) => p.id !== particle.id))}
                  />
                )),
              storeHeaderLeftWrapperRef.current
            )}

          {activeScreen === 'STORE' &&
            storeLeafBursts.map((b) => (
              <LeafBurst
                key={b.id}
                x={b.x}
                y={b.y}
                startTime={b.startTime}
                particleCount={LEAF_BURST_BASELINE_COUNT}
                appScale={1}
                spriteVariant="gold"
                burstScale={1.25}
                spawnOffsetUpPx={0}
                onComplete={() => setStoreLeafBursts((prev) => prev.filter((x) => x.id !== b.id))}
              />
            ))}
          {activeScreen === 'STORE' &&
            storeCoinParticles.map((p) => (
              <GoalCoinParticle
                key={p.id}
                data={p}
                containerRef={containerRef}
                walletRef={storeWalletRef}
                walletIconRef={storeWalletIconRef}
                appScale={appScale}
                variant="goal"
                activeCount={storeCoinParticles.length}
                onImpact={(value) => {
                  setMoney((prev) => prev + value);
                  setWalletFlashActive(true);
                  playSfx(SFX_IDS.coinImpact);
                  setWalletBounceTrigger((t) => t + 1);
                  if (walletFlashTimeoutRef.current) clearTimeout(walletFlashTimeoutRef.current);
                  walletFlashTimeoutRef.current = setTimeout(() => setWalletFlashActive(false), 120);
                }}
                onComplete={() => setStoreCoinParticles((prev) => prev.filter((x) => x.id !== p.id))}
              />
            ))}

        </div>

      </div>
      </div>
      </div>
      </div>
      </>
    </ErrorBoundary>
  );
}
