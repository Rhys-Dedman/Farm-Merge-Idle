import { SHIPPED_GARDEN_IDS, type GardenId } from '../constants/gardens';
import { getGlobalGoldenPotCount } from '../constants/goldenPotBonuses';
import { getGoldenPotUpgradeableLevels } from '../constants/plantMastery';
import { MAX_PLANT_TIER } from '../constants/plants';
import type { GardenState } from '../types/gardenState';
import type { GameSaveV2 } from './gardenSave';
import { createFreshGardenState } from './gardenSave';

export type GardenCollectionSnapshot = {
  highestPlantEver: number;
  unlockedLevels: readonly number[];
  money: number;
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
  };
}

export function ensureGardenStartedInSave(v2: GameSaveV2, gardenId: GardenId): GameSaveV2 {
  if (v2.gardens[gardenId]) return v2;
  const activeId = v2.activeGardenId;
  const globalGoldenPotCount = getGlobalGoldenPotCount(
    v2.gardens[activeId]?.plantMasteryUnlockedLevels ?? [],
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
): { gardenId: GardenId; snapshot: GardenCollectionSnapshot }[] {
  return SHIPPED_GARDEN_IDS.map((gardenId) => ({
    gardenId,
    snapshot: getGardenCollectionSnapshot(gardenId, activeGardenId, active, gardens),
  }));
}

export function hasAnyDevUnlockPlantRemaining(
  activeGardenId: GardenId,
  active: GardenCollectionSnapshot,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
): boolean {
  return iterGardenSnapshots(activeGardenId, active, gardens).some(
    ({ snapshot }) => snapshot.highestPlantEver < MAX_PLANT_TIER,
  );
}

export function findNextDevUnlockPlantTarget(
  activeGardenId: GardenId,
  active: GardenCollectionSnapshot,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
): { gardenId: GardenId; newLevel: number } | null {
  for (const { gardenId, snapshot } of iterGardenSnapshots(activeGardenId, active, gardens)) {
    if (snapshot.highestPlantEver < MAX_PLANT_TIER) {
      return { gardenId, newLevel: snapshot.highestPlantEver + 1 };
    }
  }
  return null;
}

export function findNextDevGoldenPotTarget(
  activeGardenId: GardenId,
  active: GardenCollectionSnapshot,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
): { gardenId: GardenId; level: number } | null {
  for (const { gardenId, snapshot } of iterGardenSnapshots(activeGardenId, active, gardens)) {
    const nextLevel = getGoldenPotUpgradeableLevels(
      snapshot.highestPlantEver,
      snapshot.unlockedLevels,
    )[0];
    if (nextLevel != null) return { gardenId, level: nextLevel };
  }
  return null;
}
