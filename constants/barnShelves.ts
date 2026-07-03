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

/** Offset for shelves block (space above Flower Garden label). Screen-only. */
export const COLLECTION_SHELVES_MARGIN_TOP_PX = 228;

/**
 * Space above labels that follow shelves (Fruit Garden, Coming Soon).
 * Shared so both move together when tuned.
 */
export const COLLECTION_GARDEN_LABEL_AFTER_SHELVES_MARGIN_TOP_PX = -58;

/** Gap under a garden label before its shelves. Screen-only. */
export const COLLECTION_GARDEN_LABEL_MARGIN_BOTTOM_PX = 10;

/** Teaser label when the next garden is not yet unlocked (no shelves). */
export const COLLECTION_UNDISCOVERED_GARDEN_LABEL = 'Undiscovered';

/** Teaser label below the last shipped garden shelves (no shelves yet). */
export const COLLECTION_COMING_SOON_LABEL = 'Coming Soon';

/** Scroll past the last label so it clears the viewport, with room below. */
export const COLLECTION_SCROLL_BOTTOM_PAD_PX = 110;

/** Phone collection layout tweaks (viewport < 500px; design column is already 448px). */
export const COLLECTION_PHONE_ROOF_SCALE = 1.045;
/** Layout footprint for roof on phone (unchanged when visual scale is tuned). */
export const COLLECTION_PHONE_ROOF_LAYOUT_SCALE = 1.1;
export const COLLECTION_PHONE_PLANT_PANEL_SCALE = 1.15;
export const COLLECTION_PHONE_GARDEN_LABEL_SCALE = 1.2;
/** Plant mastery panel `top` (design px); default applies on tablet/desktop. */
export const COLLECTION_PLANT_PANEL_TOP_PX = 170;
/** Lower on phone; shelves margin moves down with it, then tightened toward Flower Garden. */
export const COLLECTION_PHONE_PLANT_PANEL_TOP_PX = 214;
export const COLLECTION_PHONE_SHELVES_MARGIN_TOP_PX = 282;
/** Tighter gap between a garden label and the shelves directly above it (phone only). */
export const COLLECTION_PHONE_GARDEN_LABEL_AFTER_SHELVES_MARGIN_TOP_PX = -68;
/** Extra width fill for shelves on phone (applied to barn scale, capped at 1). */
export const COLLECTION_PHONE_SHELF_WIDTH_SCALE = 1.08;

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
