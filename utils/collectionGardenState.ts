import { SHIPPED_GARDEN_IDS, type GardenId } from '../constants/gardens';
import { getGlobalGoldenPotCount } from '../constants/goldenPotBonuses';
import { MAX_PLANT_TIER } from '../constants/plants';
import { gardenHasTrophyArt } from '../constants/trophies';
import type { GardenState } from '../types/gardenState';
import type { GameSaveV2 } from './gardenSave';
import { createFreshGardenState } from './gardenSave';

export type GardenCollectionSnapshot = {
  highestPlantEver: number;
  unlockedLevels: readonly number[];
  money: number;
  /** Plant tiers whose Special Delivery trophy has been won (drives shelves + bonus tiers). */
  trophyLevels: readonly number[];
};

export function getCollectionPlantKey(gardenId: GardenId, plantLevel: number): string {
  return `${gardenId}:${plantLevel}`;
}

export function getGardenCollectionSnapshot(
  gardenId: GardenId,
  activeGardenId: GardenId,
  active: GardenCollectionSnapshot,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
): GardenCollectionSnapshot {
  if (gardenId === activeGardenId) return active;
  const g = gardens?.[gardenId];
  return {
    highestPlantEver: g?.highestPlantEver ?? 0,
    unlockedLevels: g?.plantMasteryUnlockedLevels ?? [],
    money: g?.money ?? 0,
    trophyLevels: g?.trophyLevels ?? [],
  };
}

export function ensureGardenStartedInSave(v2: GameSaveV2, gardenId: GardenId): GameSaveV2 {
  if (v2.gardens[gardenId]) return v2;
  const activeId = v2.activeGardenId;
  const globalGoldenPotCount = getGlobalGoldenPotCount(
    v2.gardens[activeId]?.trophyLevels ?? [],
    v2.gardens,
    activeId,
  );
  return {
    ...v2,
    gardens: {
      ...v2.gardens,
      [gardenId]: createFreshGardenState(globalGoldenPotCount),
    },
    gardensStarted: [...new Set([...v2.gardensStarted, gardenId])],
  };
}

function iterGardenSnapshots(
  activeGardenId: GardenId,
  active: GardenCollectionSnapshot,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
  allowedGardenIds?: readonly GardenId[],
): { gardenId: GardenId; snapshot: GardenCollectionSnapshot }[] {
  const allowed = allowedGardenIds ? new Set(allowedGardenIds) : null;
  return SHIPPED_GARDEN_IDS.filter(
    (gardenId) => gardenId === activeGardenId || !allowed || allowed.has(gardenId),
  ).map((gardenId) => ({
    gardenId,
    snapshot: getGardenCollectionSnapshot(gardenId, activeGardenId, active, gardens),
  }));
}

export function hasAnyDevUnlockPlantRemaining(
  activeGardenId: GardenId,
  active: GardenCollectionSnapshot,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
  allowedGardenIds?: readonly GardenId[],
): boolean {
  return iterGardenSnapshots(activeGardenId, active, gardens, allowedGardenIds).some(
    ({ snapshot }) => snapshot.highestPlantEver < MAX_PLANT_TIER,
  );
}

export function findNextDevUnlockPlantTarget(
  activeGardenId: GardenId,
  active: GardenCollectionSnapshot,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
  allowedGardenIds?: readonly GardenId[],
): { gardenId: GardenId; newLevel: number } | null {
  for (const { gardenId, snapshot } of iterGardenSnapshots(
    activeGardenId,
    active,
    gardens,
    allowedGardenIds,
  )) {
    if (snapshot.highestPlantEver < MAX_PLANT_TIER) {
      return { gardenId, newLevel: snapshot.highestPlantEver + 1 };
    }
  }
  return null;
}

/**
 * Dev cheat target: next empty trophy slot in shelf order (plant 1 → 20), then the next
 * garden with trophy art. Fills gaps before advancing; ignores discovery (caller may unlock).
 */
export function findNextDevTrophyTarget(
  activeGardenId: GardenId,
  active: GardenCollectionSnapshot,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
  allowedGardenIds?: readonly GardenId[],
): { gardenId: GardenId; level: number } | null {
  for (const { gardenId, snapshot } of iterGardenSnapshots(
    activeGardenId,
    active,
    gardens,
    allowedGardenIds,
  )) {
    if (!gardenHasTrophyArt(gardenId)) continue;
    const owned = new Set(snapshot.trophyLevels);
    for (let level = 1; level <= MAX_PLANT_TIER; level++) {
      if (!owned.has(level)) return { gardenId, level };
    }
  }
  return null;
}
