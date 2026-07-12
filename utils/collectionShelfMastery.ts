import {
  BARN_SHELF_COUNT,
  BARN_SHELVES_PER_GARDEN,
  COLLECTION_GARDEN_IDS,
  getCollectionShelfMeta,
} from '../constants/barnShelves';
import type { GoldenPotBonusIconSlug } from '../constants/goldenPotBonuses';
import {
  getGoldenPotBonusTierForPotCount,
  getGoldenPotBonusTierInProgress,
} from '../constants/goldenPotBonuses';
import { SHIPPED_GARDEN_IDS, type GardenId } from '../constants/gardens';
import {
  getGardenCollectionSnapshot,
  type GardenCollectionSnapshot,
} from './collectionGardenState';
import type { GardenState } from '../types/gardenState';

const PLANTS_PER_SHELF = 4;

export function getShelfPlantLevels(shelfIndex: number): number[] {
  const { startPlant } = getCollectionShelfMeta(shelfIndex);
  return [0, 1, 2, 3].map((offset) => startPlant + offset);
}

export function getShelfMasteredCount(
  snapshot: GardenCollectionSnapshot,
  shelfIndex: number,
): number {
  return getShelfPlantLevels(shelfIndex).filter(
    (level) =>
      level <= snapshot.highestPlantEver && snapshot.unlockedLevels.includes(level),
  ).length;
}

export function isShelfFullyDiscovered(
  snapshot: GardenCollectionSnapshot,
  shelfIndex: number,
): boolean {
  return getShelfPlantLevels(shelfIndex).every((level) => level <= snapshot.highestPlantEver);
}

export function isShelfFullyMastered(
  snapshot: GardenCollectionSnapshot,
  shelfIndex: number,
): boolean {
  return getShelfPlantLevels(shelfIndex).every((level) =>
    snapshot.unlockedLevels.includes(level),
  );
}

/** Left → right: first discovered plant on the shelf without a golden pot. */
export function getNextUpgradeablePlantOnShelf(
  snapshot: GardenCollectionSnapshot,
  shelfIndex: number,
): number | null {
  for (const level of getShelfPlantLevels(shelfIndex)) {
    if (level <= snapshot.highestPlantEver && !snapshot.unlockedLevels.includes(level)) {
      return level;
    }
  }
  return null;
}

export function getShelfIndexForGarden(gardenId: GardenId, shelfInGarden: number): number {
  const gardenIndex = Math.max(0, COLLECTION_GARDEN_IDS.indexOf(gardenId));
  return gardenIndex * BARN_SHELVES_PER_GARDEN + shelfInGarden;
}

/**
 * First shelf in this garden that is not fully mastered (shelf 0 before shelf 1, etc.).
 * Garden-local only — other gardens do not block this.
 */
export function getActiveUpgradeShelfInGarden(
  snapshot: GardenCollectionSnapshot,
  gardenId: GardenId,
): number | null {
  for (let shelfInGarden = 0; shelfInGarden < BARN_SHELVES_PER_GARDEN; shelfInGarden++) {
    const shelfIndex = getShelfIndexForGarden(gardenId, shelfInGarden);
    if (!isShelfFullyMastered(snapshot, shelfIndex)) return shelfInGarden;
  }
  return null;
}

export function shouldShowShelfUpgradeUi(
  shelfIndex: number,
  shelfInGarden: number,
  gardenId: GardenId,
  snapshot: GardenCollectionSnapshot,
  options?: {
    bonusPopupOpen?: boolean;
    bonusRevealShelfIndex?: number | null;
  },
): boolean {
  const activeShelfInGarden = getActiveUpgradeShelfInGarden(snapshot, gardenId);
  if (activeShelfInGarden === null) return false;

  if (
    options?.bonusPopupOpen &&
    options.bonusRevealShelfIndex != null &&
    options.bonusRevealShelfIndex === shelfIndex
  ) {
    return false;
  }

  return shelfInGarden === activeShelfInGarden;
}

/** Shelf is fully discovered but upgrades happen on a different shelf in this garden. */
export function isShelfActiveUpgradeTarget(
  snapshot: GardenCollectionSnapshot,
  shelfIndex: number,
  gardenId: GardenId,
): boolean {
  const { shelfInGarden, gardenId: shelfGardenId } = getCollectionShelfMeta(shelfIndex);
  if (shelfGardenId !== gardenId) return false;
  const activeShelfInGarden = getActiveUpgradeShelfInGarden(snapshot, gardenId);
  return activeShelfInGarden !== null && activeShelfInGarden === shelfInGarden;
}

/**
 * Progress bar / bonus icons are non-interactive only when locked:
 * undiscovered shelves with no mastery yet, or shelves waiting on a prior row in this garden.
 * In-progress and completed shelves open View Bonuses (scrolled to that tier).
 */
export function isShelfRewardBarLocked(
  snapshot: GardenCollectionSnapshot,
  shelfIndex: number,
  gardenId: GardenId,
): boolean {
  const { gardenId: shelfGardenId } = getCollectionShelfMeta(shelfIndex);
  if (shelfGardenId !== gardenId) return true;

  const shelfFullyDiscovered = isShelfFullyDiscovered(snapshot, shelfIndex);
  const shelfFullyMastered = isShelfFullyMastered(snapshot, shelfIndex);
  const isActiveUpgradeShelf = isShelfActiveUpgradeTarget(snapshot, shelfIndex, gardenId);
  const masteredOnShelf = getShelfMasteredCount(snapshot, shelfIndex);

  if (shelfFullyDiscovered && !shelfFullyMastered && !isActiveUpgradeShelf) {
    return true;
  }
  if (shelfFullyMastered || isActiveUpgradeShelf || masteredOnShelf > 0) {
    return false;
  }
  return !shelfFullyDiscovered;
}

/**
 * Bonus tier pot threshold for a shelf icon / scroll target.
 * Fixed by shelf position (shelf 0 → 4, shelf 1 → 8, …) — does not change with unlock order.
 */
export function getShelfBonusTargetPotCount(shelfIndex: number): number {
  return (shelfIndex + 1) * PLANTS_PER_SHELF;
}

/** Bonus tier pot counts for shelves currently showing the upgrade button (one per started garden). */
export function getInProgressBonusTierPotCounts(
  activeGardenId: GardenId,
  activeSnapshot: GardenCollectionSnapshot,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
  gardensStarted: readonly GardenId[],
): number[] {
  const potCounts: number[] = [];
  for (const gardenId of gardensStarted) {
    if (!(SHIPPED_GARDEN_IDS as readonly string[]).includes(gardenId)) continue;
    const snapshot = getGardenCollectionSnapshot(gardenId, activeGardenId, activeSnapshot, gardens);
    const activeShelfInGarden = getActiveUpgradeShelfInGarden(snapshot, gardenId);
    if (activeShelfInGarden === null) continue;
    const shelfIndex = getShelfIndexForGarden(gardenId, activeShelfInGarden);
    potCounts.push(getShelfBonusTargetPotCount(shelfIndex));
  }
  return potCounts;
}

export function getGlobalCompletedShelfCount(
  activeGardenId: GardenId,
  activeSnapshot: GardenCollectionSnapshot,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
): number {
  let count = 0;
  for (let shelfIndex = 0; shelfIndex < BARN_SHELF_COUNT; shelfIndex++) {
    const { gardenId } = getCollectionShelfMeta(shelfIndex);
    const snap = getGardenCollectionSnapshot(gardenId, activeGardenId, activeSnapshot, gardens);
    if (isShelfFullyMastered(snap, shelfIndex)) count++;
  }
  return count;
}

/**
 * Account-wide pot tally for bonus unlocks: sum of mastered plants across all gardens.
 * Shelves are ordered per-garden only; Flower progress does not gate Fruit pots.
 * Gameplay bonus unlocks use {@link getUnlockedGoldenPotBonusTierPotCounts} (per completed shelf).
 */
export function getGlobalBonusProgressPotCount(
  activeGardenId: GardenId,
  activeSnapshot: GardenCollectionSnapshot,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
): number {
  let count = 0;
  for (let shelfIndex = 0; shelfIndex < BARN_SHELF_COUNT; shelfIndex++) {
    const { gardenId } = getCollectionShelfMeta(shelfIndex);
    const snap = getGardenCollectionSnapshot(gardenId, activeGardenId, activeSnapshot, gardens);
    count += getShelfMasteredCount(snap, shelfIndex);
  }
  return count;
}

/**
 * Pot thresholds for bonuses granted by fully mastered shelves.
 * Each shelf unlocks its fixed bonus (shelf 0 → 4, shelf 5 → 24, …), independent of other shelves.
 */
export function getUnlockedGoldenPotBonusTierPotCounts(
  activeGardenId: GardenId,
  activeSnapshot: GardenCollectionSnapshot,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
): number[] {
  const out: number[] = [];
  for (let shelfIndex = 0; shelfIndex < BARN_SHELF_COUNT; shelfIndex++) {
    const { gardenId } = getCollectionShelfMeta(shelfIndex);
    const snap = getGardenCollectionSnapshot(gardenId, activeGardenId, activeSnapshot, gardens);
    if (isShelfFullyMastered(snap, shelfIndex)) {
      out.push(getShelfBonusTargetPotCount(shelfIndex));
    }
  }
  return out;
}

export type ShelfRewardBarState = {
  numerator: number;
  denominator: number;
  fillPct: number;
  rewardIconSlug: GoldenPotBonusIconSlug;
  /** Fixed pot threshold for this shelf (View Bonuses scroll / highlight). */
  rewardTierPotCount: number;
};

/** Per-shelf bar: plants mastered on this shelf toward that shelf's fixed bonus (0–4). */
export function getShelfRewardBarStateForSnapshot(
  shelfIndex: number,
  snapshot: GardenCollectionSnapshot,
): ShelfRewardBarState | null {
  const potThreshold = getShelfBonusTargetPotCount(shelfIndex);
  const tier =
    getGoldenPotBonusTierForPotCount(potThreshold) ??
    getGoldenPotBonusTierInProgress(potThreshold);
  const numerator = getShelfMasteredCount(snapshot, shelfIndex);
  const denominator = PLANTS_PER_SHELF;
  const fillPct = Math.min(100, (numerator / denominator) * 100);
  return {
    numerator,
    denominator,
    fillPct,
    rewardIconSlug: tier.iconSlug,
    rewardTierPotCount: potThreshold,
  };
}
