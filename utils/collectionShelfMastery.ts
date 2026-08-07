/**
 * Collection shelf progress. Shelves hold trophies won from Special Deliveries — there is no
 * coin upgrade path, so a shelf advances only when the player wins another of its trophies.
 */
import {
  BARN_SHELF_COUNT,
  BARN_SHELVES_PER_GARDEN,
  COLLECTION_GARDEN_IDS,
  COLLECTION_PLANTS_PER_SHELF,
  getCollectionShelfMeta,
} from '../constants/barnShelves';
import type { GoldenPotBonusIconSlug } from '../constants/goldenPotBonuses';
import {
  getGoldenPotBonusTierForPotCount,
  getGoldenPotBonusTierInProgress,
} from '../constants/goldenPotBonuses';
import { type GardenId } from '../constants/gardens';
import { MAX_PLANT_TIER } from '../constants/plants';
import { gardenHasTrophyArt } from '../constants/trophies';
import {
  getGardenCollectionSnapshot,
  type GardenCollectionSnapshot,
} from './collectionGardenState';
import type { GardenState } from '../types/gardenState';

const PLANTS_PER_SHELF = COLLECTION_PLANTS_PER_SHELF;

export function getShelfPlantLevels(shelfIndex: number): number[] {
  const { startPlant } = getCollectionShelfMeta(shelfIndex);
  return [0, 1, 2, 3].map((offset) => startPlant + offset);
}

/** Trophies won on this shelf (0–4). Order is irrelevant — only the count matters. */
export function getShelfTrophyCount(
  snapshot: GardenCollectionSnapshot,
  shelfIndex: number,
): number {
  return getShelfPlantLevels(shelfIndex).filter((level) =>
    snapshot.trophyLevels.includes(level),
  ).length;
}

export function isShelfTrophyComplete(
  snapshot: GardenCollectionSnapshot,
  shelfIndex: number,
): boolean {
  return getShelfPlantLevels(shelfIndex).every((level) =>
    snapshot.trophyLevels.includes(level),
  );
}

/**
 * Plants the player has discovered but has no trophy for — the only trophies
 * Special Deliveries may deal (no duplicates, no undiscovered plants).
 */
export function getWinnableTrophyLevels(snapshot: GardenCollectionSnapshot): number[] {
  const owned = new Set(snapshot.trophyLevels);
  const discovered = Math.max(0, Math.min(MAX_PLANT_TIER, Math.floor(snapshot.highestPlantEver)));
  const levels: number[] = [];
  for (let level = 1; level <= discovered; level++) {
    if (!owned.has(level)) levels.push(level);
  }
  return levels;
}

export type WinnableTrophyTarget = {
  gardenId: GardenId;
  plantLevel: number;
};

/**
 * Discovered plants across gardens that still need a trophy. Only gardens with trophy art
 * (and that the player has started) are included.
 */
export function getWinnableTrophyTargetsAcrossGardens(
  activeGardenId: GardenId,
  activeSnapshot: GardenCollectionSnapshot,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
  gardensStarted: readonly GardenId[],
): WinnableTrophyTarget[] {
  const started = new Set(
    gardensStarted.length > 0 ? gardensStarted : [activeGardenId],
  );
  started.add(activeGardenId);
  const out: WinnableTrophyTarget[] = [];
  for (const gardenId of COLLECTION_GARDEN_IDS) {
    if (!started.has(gardenId)) continue;
    if (!gardenHasTrophyArt(gardenId)) continue;
    const snap = getGardenCollectionSnapshot(
      gardenId,
      activeGardenId,
      activeSnapshot,
      gardens,
    );
    for (const plantLevel of getWinnableTrophyLevels(snap)) {
      out.push({ gardenId, plantLevel });
    }
  }
  return out;
}

export function getShelfIndexForGarden(gardenId: GardenId, shelfInGarden: number): number {
  const gardenIndex = Math.max(0, COLLECTION_GARDEN_IDS.indexOf(gardenId));
  return gardenIndex * BARN_SHELVES_PER_GARDEN + shelfInGarden;
}

/** First shelf in this garden that isn't a full set of 4 trophies. */
export function getFirstIncompleteShelfInGarden(
  snapshot: GardenCollectionSnapshot,
  gardenId: GardenId,
): number | null {
  for (let shelfInGarden = 0; shelfInGarden < BARN_SHELVES_PER_GARDEN; shelfInGarden++) {
    const shelfIndex = getShelfIndexForGarden(gardenId, shelfInGarden);
    if (!isShelfTrophyComplete(snapshot, shelfIndex)) return shelfInGarden;
  }
  return null;
}

/**
 * True once the player has discovered at least one plant that belongs on this shelf
 * (highest plant ever reaches that shelf's first plant).
 */
export function shelfHasDiscoveredPlant(
  snapshot: GardenCollectionSnapshot,
  shelfIndex: number,
): boolean {
  const { startPlant } = getCollectionShelfMeta(shelfIndex);
  return Math.floor(snapshot.highestPlantEver) >= startPlant;
}

/**
 * A shelf's bar and bonus icon stay locked only while no plants on that shelf have been
 * discovered. After the first discovery the bar is readable (even at 0/4 trophies) and
 * taps open View Bonuses at that tier.
 */
export function isShelfRewardBarLocked(
  snapshot: GardenCollectionSnapshot,
  shelfIndex: number,
  gardenId: GardenId,
): boolean {
  const { gardenId: shelfGardenId } = getCollectionShelfMeta(shelfIndex);
  if (shelfGardenId !== gardenId) return true;
  return !shelfHasDiscoveredPlant(snapshot, shelfIndex);
}

/**
 * Bonus tier pot threshold for a shelf icon / scroll target.
 * Fixed by shelf position (shelf 0 → 4, shelf 1 → 8, …) — does not change with unlock order.
 */
export function getShelfBonusTargetPotCount(shelfIndex: number): number {
  return (shelfIndex + 1) * PLANTS_PER_SHELF;
}

/**
 * Bonus tier pot counts for every incomplete shelf that already has a discovered plant.
 * Includes 0/4 shelves so bonuses can show as in progress before any trophy lands.
 */
export function getInProgressBonusTierPotCounts(
  activeGardenId: GardenId,
  activeSnapshot: GardenCollectionSnapshot,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
  _gardensStarted?: readonly GardenId[],
): number[] {
  const potCounts: number[] = [];
  for (let shelfIndex = 0; shelfIndex < BARN_SHELF_COUNT; shelfIndex++) {
    const { gardenId } = getCollectionShelfMeta(shelfIndex);
    const snapshot = getGardenCollectionSnapshot(gardenId, activeGardenId, activeSnapshot, gardens);
    if (isShelfTrophyComplete(snapshot, shelfIndex)) continue;
    if (!shelfHasDiscoveredPlant(snapshot, shelfIndex)) continue;
    potCounts.push(getShelfBonusTargetPotCount(shelfIndex));
  }
  return potCounts;
}

/**
 * Trophies owned on each in-progress shelf, keyed by that tier's pot threshold.
 * May be 0 when the shelf is unlocked by discovery but no trophies have been won yet.
 */
export function getInProgressBonusTierTrophyCounts(
  activeGardenId: GardenId,
  activeSnapshot: GardenCollectionSnapshot,
  gardens: Partial<Record<GardenId, GardenState>> | undefined,
  _gardensStarted?: readonly GardenId[],
): Record<number, number> {
  const counts: Record<number, number> = {};
  for (let shelfIndex = 0; shelfIndex < BARN_SHELF_COUNT; shelfIndex++) {
    const { gardenId } = getCollectionShelfMeta(shelfIndex);
    const snapshot = getGardenCollectionSnapshot(gardenId, activeGardenId, activeSnapshot, gardens);
    if (isShelfTrophyComplete(snapshot, shelfIndex)) continue;
    if (!shelfHasDiscoveredPlant(snapshot, shelfIndex)) continue;
    counts[getShelfBonusTargetPotCount(shelfIndex)] = getShelfTrophyCount(snapshot, shelfIndex);
  }
  return counts;
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
    if (isShelfTrophyComplete(snap, shelfIndex)) count++;
  }
  return count;
}

/**
 * Account-wide tally for the collection wallet: trophies won across all gardens.
 * Shelves are ordered per-garden only; Flower progress does not gate Fruit trophies.
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
    count += getShelfTrophyCount(snap, shelfIndex);
  }
  return count;
}

/**
 * Pot thresholds for bonuses granted by shelves with all 4 trophies.
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
    if (isShelfTrophyComplete(snap, shelfIndex)) {
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

/** Per-shelf bar: trophies won on this shelf toward that shelf's fixed bonus (0–4). */
export function getShelfRewardBarStateForSnapshot(
  shelfIndex: number,
  snapshot: GardenCollectionSnapshot,
): ShelfRewardBarState | null {
  const potThreshold = getShelfBonusTargetPotCount(shelfIndex);
  const tier =
    getGoldenPotBonusTierForPotCount(potThreshold) ??
    getGoldenPotBonusTierInProgress(potThreshold);
  const numerator = getShelfTrophyCount(snapshot, shelfIndex);
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
