/**
 * Collection trophies: one per plant tier, won only from Special Deliveries.
 *
 * Special Delivery doors show one generic icon per garden (every flower trophy looks the
 * same behind a door); the match-3 reveal swaps in the real trophy art for the plant won.
 */
import { DEFAULT_GARDEN_ID, type GardenId } from './gardens';
import { MAX_PLANT_TIER } from './plants';

/** Gardens with per-plant trophy art (`trophy_1` … `trophy_20`) shipped. */
export const TROPHY_ART_GARDEN_IDS: readonly GardenId[] = ['garden_1', 'garden_2'];

/** Gardens with a trophy art folder (generic + empty sprites at minimum). */
const TROPHY_FOLDER_GARDEN_IDS: readonly GardenId[] = ['garden_1', 'garden_2'];

/** Generic door icon — shared by every trophy from that garden. */
const TROPHY_DOOR_ICON_FILE_BY_GARDEN: Partial<Record<GardenId, string>> = {
  garden_1: 'trophy_flower_icon.png',
  garden_2: 'trophy_fruit_icon.png',
};

function trophyDir(gardenId: GardenId): string {
  const folderGardenId = TROPHY_FOLDER_GARDEN_IDS.includes(gardenId)
    ? gardenId
    : DEFAULT_GARDEN_ID;
  return `/assets/icons/trophies/${folderGardenId}`;
}

/** Whether trophies can be won in this garden yet (per-plant art must exist). */
export function gardenHasTrophyArt(gardenId: GardenId): boolean {
  return TROPHY_ART_GARDEN_IDS.includes(gardenId);
}

/** Trophy art for a won plant tier. */
export function getTrophyIconSrc(gardenId: GardenId, plantLevel: number): string {
  const level = Math.max(1, Math.min(MAX_PLANT_TIER, Math.floor(plantLevel)));
  return `${trophyDir(gardenId)}/trophy_${level}.png`;
}

/** Shelf placeholder for a trophy the player has not won. */
export function getTrophyEmptyIconSrc(gardenId: GardenId): string {
  return `${trophyDir(gardenId)}/trophy_empty.png`;
}

/** Special Delivery door icon (identical for every trophy in the garden). */
export function getTrophyDoorIconSrc(gardenId: GardenId): string | null {
  const file = TROPHY_DOOR_ICON_FILE_BY_GARDEN[gardenId];
  return file ? `${trophyDir(gardenId)}/${file}` : null;
}
