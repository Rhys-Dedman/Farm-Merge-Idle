import { SHIPPED_GARDEN_IDS } from './gardens';
import { MAX_PLANT_TIER } from './plants';

/** Gardens shown on the collection screen (all shipped gardens, always visible). */
export const COLLECTION_GARDEN_IDS = SHIPPED_GARDEN_IDS;

/** Shelves after the first stack upward (negative = overlap). Less negative = more gap between shelves. */
export const COLLECTION_SHELF_STACK_MARGIN_TOP_PX = -40;

/** `collection_shelf_upgrade.png` placement on each shelf. */
export const COLLECTION_SHELF_UPGRADE_SPRITE_TOP_PX = 152;
export const COLLECTION_SHELF_UPGRADE_SPRITE_SCALE = 0.787;
/** Centered upgrade CTA — vertically aligned with the upgrade sprite strip. */
export const COLLECTION_SHELF_UPGRADE_BUTTON_TOP_PX = 173;
/** On-screen width of the green upgrade pill (screen px — no nested scale wrapper). */
export const COLLECTION_SHELF_UPGRADE_BUTTON_WIDTH_PX = 158;
export const COLLECTION_SHELF_UPGRADE_BUTTON_HEIGHT_PX = 28;
export const COLLECTION_SHELF_UPGRADE_BUTTON_FONT_PX = 14;
export const COLLECTION_SHELF_UPGRADE_BUTTON_COIN_PX = 20;
/** Outermost ring on the shelf upgrade CTA (matches collection progress bar stroke). */
export const COLLECTION_SHELF_UPGRADE_BUTTON_RING_COLOR = '#ad9467';
/** Dark green on the upgrade pill (border + label). */
export const COLLECTION_SHELF_UPGRADE_BUTTON_DARK_COLOR = '#6e8d2d';
export const COLLECTION_SHELF_UPGRADE_BUTTON_BORDER_PX = 1.5;

/** Collection golden-pot progress bar (panel + shelves). */
export const COLLECTION_PROGRESS_BAR_TRACK_HEIGHT_PX = 18;
export const COLLECTION_PROGRESS_BAR_BROWN_HEIGHT_PX = 25;
/** Inner track on shelves waiting for full plant discovery (no icons). */
export const COLLECTION_PROGRESS_BAR_DISCOVERY_BROWN = '#907154';
export const COLLECTION_PROGRESS_BAR_BORDER_WIDTH_PX = 3;
/** Light green highlight ring around the progress fill. */
export const COLLECTION_PROGRESS_BAR_FILL_LIGHT_OUTLINE_PX = 1;
export const COLLECTION_PROGRESS_BAR_INNER_PAD_PX = 1.5;
export const COLLECTION_PROGRESS_BAR_OUTER_HEIGHT_PX =
  COLLECTION_PROGRESS_BAR_BROWN_HEIGHT_PX + COLLECTION_PROGRESS_BAR_INNER_PAD_PX * 2;
/** Inner track width on discovered collection shelf progress bars (before bar `scale`). */
export const COLLECTION_SHELF_PROGRESS_BAR_WIDTH_PX = 420;
/** Wider track for undiscovered shelves (before bar `scale`). */
export const COLLECTION_SHELF_DISCOVERY_PROGRESS_BAR_WIDTH_PX = 420;
/** Undiscovered shelf bar: 10px shorter than the discovered bar. */
export const COLLECTION_SHELF_DISCOVERY_PROGRESS_BAR_OUTER_HEIGHT_PX =
  COLLECTION_PROGRESS_BAR_OUTER_HEIGHT_PX - 10;
export const COLLECTION_SHELF_DISCOVERY_PROGRESS_BAR_OPACITY = 0.5;

/** Shelves per garden: 5 shelves × 4 plants (levels 1–`MAX_PLANT_TIER`). */
export const BARN_SHELVES_PER_GARDEN = MAX_PLANT_TIER / 4;

/** Total shelves across all collection gardens (e.g. 10 for two gardens). */
export const BARN_SHELF_COUNT = BARN_SHELVES_PER_GARDEN * COLLECTION_GARDEN_IDS.length;

/** Total plant slots on the collection screen. */
export const COLLECTION_PLANT_COUNT = MAX_PLANT_TIER * COLLECTION_GARDEN_IDS.length;

/** Offset for shelves block below the collection panel. Screen-only. */
export const COLLECTION_SHELVES_MARGIN_TOP_PX = 228;
/** Extra gap before the first shelf when the unlocked collection panel is taller. */
export const COLLECTION_SHELVES_EXTRA_MARGIN_TOP_UNLOCKED_PX = 52;
export const COLLECTION_PHONE_SHELVES_EXTRA_MARGIN_TOP_UNLOCKED_PX = 52;

/** Collection panel crest above title (locked + unlocked base size). */
export const COLLECTION_PANEL_GARDEN_ICON_PX = 72;
export const COLLECTION_PANEL_GARDEN_ICON_UNLOCKED_SCALE = 1.3 * 1.15 * 0.8;

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
