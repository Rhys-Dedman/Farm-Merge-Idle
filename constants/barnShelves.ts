import { SHIPPED_GARDEN_IDS } from './gardens';
import { MAX_PLANT_TIER } from './plants';

/** Gardens shown on the collection screen (all shipped gardens, always visible). */
export const COLLECTION_GARDEN_IDS = SHIPPED_GARDEN_IDS;

/** Shelves per garden: 5 shelves × 4 plants (levels 1–`MAX_PLANT_TIER`). */
export const BARN_SHELVES_PER_GARDEN = MAX_PLANT_TIER / 4;

/** Total shelves across all collection gardens (e.g. 10 for two gardens). */
export const BARN_SHELF_COUNT = BARN_SHELVES_PER_GARDEN * COLLECTION_GARDEN_IDS.length;

/** Total plant slots on the collection screen. */
export const COLLECTION_PLANT_COUNT = MAX_PLANT_TIER * COLLECTION_GARDEN_IDS.length;

export function getCollectionShelfMeta(shelfIndex: number): {
  gardenId: (typeof COLLECTION_GARDEN_IDS)[number];
  shelfInGarden: number;
  startPlant: number;
} {
  const shelfInGarden = shelfIndex % BARN_SHELVES_PER_GARDEN;
  const gardenIndex = Math.floor(shelfIndex / BARN_SHELVES_PER_GARDEN);
  return {
    gardenId: COLLECTION_GARDEN_IDS[gardenIndex] ?? COLLECTION_GARDEN_IDS[0],
    shelfInGarden,
    startPlant: shelfInGarden * 4 + 1,
  };
}

/** All shelves are always available (no coin unlock). */
export function normalizeBarnShelvesUnlocked(_raw?: unknown): boolean[] {
  return Array.from({ length: BARN_SHELF_COUNT }, () => true);
}
