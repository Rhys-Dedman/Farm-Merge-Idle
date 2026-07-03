/**
 * Multi-garden idle earnings: simulate absence for every started garden on app resume.
 */
import type { UpgradeState } from '../components/UpgradeList';
import { DEFAULT_GARDEN_ID, type GardenId } from '../constants/gardens';
import { getGlobalGoldenPotCount } from '../constants/goldenPotBonuses';
import type { GardenState } from '../types/gardenState';
import {
  flattenV2ToV1,
  type GameSaveGlobals,
  type GameSaveV2,
} from './gardenSave';
import {
  loadGameSave,
  loadGameSaveV2,
  normalizeGameSaveV1,
  persistGameSaveV2,
  type GameSaveV1,
} from './gameSave';
import {
  isOfflineCoinEarningsBlockedByFtue,
  simulateOfflineSeedHarvest,
  simulateWildGrowthOffline,
} from './offlineSimulate';
import {
  capOfflineSimSurplusCoins,
  clampOfflineEarningsBank,
  type OfflineEarningsCapContext,
} from './offlineEarningsCap';

/** Ignore sub-second gaps so quick refresh / garden switch does not re-sim. */
const MIN_IDLE_ABSENCE_MS = 1000;

/** Where simulated surplus coins land: pending bank (offline popup) vs wallet. */
export type IdleSurplusTarget = 'pending' | 'money';

function normalizeCropsState(cropsState: Record<string, UpgradeState>): Record<string, UpgradeState> {
  const cropsNorm = { ...cropsState };
  if (!cropsNorm.wild_growth) cropsNorm.wild_growth = { level: 0, progress: 0 };
  return cropsNorm;
}

function ftueBlocksOfflineFromGlobals(globals: GameSaveGlobals): boolean {
  return isOfflineCoinEarningsBlockedByFtue({
    activeFtueStage: globals.activeFtueStage,
    ftue7Scheduled: globals.ftue7Scheduled,
    ftue11StartQueued: globals.ftue11StartQueued,
  });
}

/** Simulate idle progress + surplus coins for one garden over `deltaMs`. */
export function simulateGardenIdleAbsence(
  garden: GardenState,
  gardenId: GardenId,
  allGardens: Partial<Record<GardenId, GardenState>>,
  globals: GameSaveGlobals,
  deltaMs: number,
  ftueBlocksOffline: boolean,
  surplusTarget: IdleSurplusTarget = 'pending',
): GardenState {
  if (deltaMs < MIN_IDLE_ABSENCE_MS) return garden;

  const cropsNorm = normalizeCropsState(garden.cropsState);
  const goldenPotN = getGlobalGoldenPotCount(
    garden.plantMasteryUnlockedLevels,
    allGardens,
    gardenId,
  );

  const sim = simulateOfflineSeedHarvest({
    savedAt: 0,
    deltaMs,
    seedProgress: garden.seedProgress,
    harvestProgress: garden.harvestProgress,
    harvestCharges: garden.harvestCharges,
    seedsInStorage: garden.seedsInStorage,
    seedsState: garden.seedsState,
    cropsState: cropsNorm,
    activeBoosts: globals.activeBoosts.map((b) => ({
      offerId: b.offerId,
      endTime: b.endTime,
      icon: b.icon,
    })),
    activeFtueStage: globals.activeFtueStage,
    ftue7Scheduled: globals.ftue7Scheduled,
    ftueSeedSurplusActivated: globals.ftueSeedSurplusActivated,
    ftueHarvestSurplusActivated: globals.ftueHarvestSurplusActivated,
    highestPlantEver: garden.highestPlantEver,
    earnOfflineCoins: !ftueBlocksOffline,
    goldenPotCount: goldenPotN,
  });

  const wildOut = simulateWildGrowthOffline({
    deltaMs,
    playerLevel: garden.playerLevel,
    wildGrowthUpgradeLevel: cropsNorm.wild_growth?.level ?? 0,
    grid: garden.grid,
    wildGrowthAccumMs: garden.wildGrowthAccumulatorMs ?? 0,
  });

  const pendingBank = ftueBlocksOffline ? 0 : (garden.pendingOfflineEarnings ?? 0);

  const capCtx: OfflineEarningsCapContext = {
    highestPlantEver: garden.highestPlantEver,
    seedsState: garden.seedsState,
    ftueSeedSurplusActivated: globals.ftueSeedSurplusActivated,
    ftueHarvestSurplusActivated: globals.ftueHarvestSurplusActivated,
  };
  // In-session ('money') credits mirror live active-garden play, so they are NOT subject to the
  // offline "welcome back" cap (which is scaled against a single 3h absence window). Applying that
  // cap per ~5s tick would throttle earnings to ~1 coin. Only the offline bank ('pending') is capped.
  const simCoins = ftueBlocksOffline
    ? 0
    : surplusTarget === 'money'
      ? Math.max(0, Math.round(sim.offlineSurplusCoins))
      : capOfflineSimSurplusCoins(sim.offlineSurplusCoins, capCtx, deltaMs);
  const pendingOfflineEarnings =
    ftueBlocksOffline || surplusTarget === 'money'
      ? pendingBank
      : clampOfflineEarningsBank(pendingBank + simCoins, capCtx, `garden:${gardenId}`);

  return {
    ...garden,
    seedProgress: sim.seedProgress,
    harvestProgress: sim.harvestProgress,
    harvestCharges: sim.harvestCharges,
    seedsInStorage: sim.seedsInStorage,
    cropsState: cropsNorm,
    grid: wildOut.grid,
    wildGrowthAccumulatorMs: wildOut.wildGrowthAccumMs,
    pendingOfflineEarnings,
    money:
      ftueBlocksOffline || surplusTarget !== 'money'
        ? garden.money
        : garden.money + simCoins,
  };
}

/** Bank idle earnings for every started garden since `v2.savedAt`; bumps `savedAt` to `now`. */
export function applyIdleEarningsToAllGardens(v2: GameSaveV2, now = Date.now()): GameSaveV2 {
  const deltaMs = Math.max(0, now - v2.savedAt);
  if (deltaMs < MIN_IDLE_ABSENCE_MS) {
    return { ...v2, savedAt: now };
  }

  const ftueBlocksOffline = ftueBlocksOfflineFromGlobals(v2.globals);
  const started = new Set(v2.gardensStarted ?? [DEFAULT_GARDEN_ID]);
  started.add(DEFAULT_GARDEN_ID);

  const gardens = { ...v2.gardens };
  for (const id of started) {
    const garden = gardens[id];
    if (!garden) continue;
    gardens[id] = simulateGardenIdleAbsence(
      garden,
      id,
      gardens,
      v2.globals,
      deltaMs,
      ftueBlocksOffline,
    );
  }

  return { ...v2, gardens, savedAt: now };
}

/**
 * While the player is in-session on one garden, simulate recharge/surplus for every other
 * started garden and credit coins directly to each garden wallet (no welcome-back popup).
 */
export function applyIdleEarningsToInactiveGardens(v2: GameSaveV2, now = Date.now()): GameSaveV2 {
  const ftueBlocksOffline = ftueBlocksOfflineFromGlobals(v2.globals);
  const started = new Set(v2.gardensStarted ?? [DEFAULT_GARDEN_ID]);
  started.add(DEFAULT_GARDEN_ID);
  const activeId = v2.activeGardenId;

  const gardens = { ...v2.gardens };
  let anySimulated = false;
  for (const id of started) {
    if (id === activeId) continue;
    const garden = gardens[id];
    if (!garden) continue;

    const anchor = garden.lastInactiveSimAt ?? v2.savedAt;
    const deltaMs = Math.max(0, now - anchor);
    if (deltaMs < MIN_IDLE_ABSENCE_MS) continue;

    anySimulated = true;
    gardens[id] = {
      ...simulateGardenIdleAbsence(
        garden,
        id,
        gardens,
        v2.globals,
        deltaMs,
        ftueBlocksOffline,
        'money',
      ),
      lastInactiveSimAt: now,
    };
  }

  return { ...v2, gardens, savedAt: anySimulated ? now : v2.savedAt };
}

/** Stamp when a garden stops being active so in-session idle sim can measure elapsed time. */
export function markGardenBecameInactive(
  v2: GameSaveV2,
  gardenId: GardenId,
  now = Date.now(),
): GameSaveV2 {
  const garden = v2.gardens[gardenId];
  if (!garden) return v2;
  return {
    ...v2,
    gardens: {
      ...v2.gardens,
      [gardenId]: { ...garden, lastInactiveSimAt: now },
    },
  };
}

/** Load save and apply multi-garden idle sim when v2 is present. */
export function loadGameSaveWithIdleAbsenceApplied(): GameSaveV1 | null {
  const v2 = loadGameSaveV2();
  if (v2) {
    const processed = applyIdleEarningsToAllGardens(v2);
    persistGameSaveV2(processed);
    return normalizeGameSaveV1(flattenV2ToV1(processed));
  }
  return loadGameSave();
}
