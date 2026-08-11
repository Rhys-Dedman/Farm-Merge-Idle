import type { GardenId } from './gardens';
import { DEFAULT_GARDEN_ID } from './gardens';
import { PLANT_COLLECTION_UI_UNLOCK_LEVEL } from './playerLevelUnlocks';

/** Special Delivery intro FTUE (garden 1 level 7). */
export type SpecialDeliveryFtuePhase =
  | 'claim_tasks'
  | 'point_collection'
  | 'vine_lock'
  | 'explain_panel'
  | 'guide_doors_coins'
  | 'await_coins_land'
  | 'guide_doors_trophy'
  | 'post_trophy';

/** DOM id for the invisible Collection-nav hit target during `point_collection`. */
export const SPECIAL_DELIVERY_FTUE_COLLECTION_NAV_HIT_ID =
  'special-delivery-ftue-collection-nav-hit';

/** Prefix for door hit buttons — `${prefix}${doorIndex}`. */
export const SPECIAL_DELIVERY_FTUE_DOOR_HIT_ID_PREFIX = 'special-delivery-door-hit-';

export const SPECIAL_DELIVERY_FTUE_SOUNDS_GREAT_BUTTON_ID =
  'special-delivery-ftue-sounds-great';

export const SPECIAL_DELIVERY_FTUE_UNLOCK_LEVEL = PLANT_COLLECTION_UI_UNLOCK_LEVEL;

/** Forced plant-1 / garden-1 trophy for the second FTUE match. */
export const SPECIAL_DELIVERY_FTUE_TROPHY_GARDEN_ID: GardenId = DEFAULT_GARDEN_ID;
export const SPECIAL_DELIVERY_FTUE_TROPHY_PLANT_LEVEL = 1;

export function shouldStartSpecialDeliveryFtue(
  gardenId: GardenId,
  level: number,
  ftueCompleted: boolean,
): boolean {
  return (
    gardenId === DEFAULT_GARDEN_ID &&
    level === SPECIAL_DELIVERY_FTUE_UNLOCK_LEVEL &&
    !ftueCompleted
  );
}

export function parseSpecialDeliveryFtuePhase(raw: unknown): SpecialDeliveryFtuePhase | null {
  if (
    raw === 'claim_tasks' ||
    raw === 'point_collection' ||
    raw === 'vine_lock' ||
    raw === 'explain_panel' ||
    raw === 'guide_doors_coins' ||
    raw === 'await_coins_land' ||
    raw === 'guide_doors_trophy' ||
    raw === 'post_trophy'
  ) {
    return raw;
  }
  return null;
}

/**
 * Ordered claim queue for L7 SD FTUE: intro slot 2 then slot 3 only.
 * Skips already-claimed rows so a prior task-2 claim jumps straight to task 3.
 */
export function getSdFtueOrderedClaimTaskIds(
  rows: ReadonlyArray<{ id: string; state: string }>,
): string[] {
  const completeIds = new Set(
    rows.filter((t) => t.state === 'complete').map((t) => t.id),
  );
  const ordered: string[] = [];
  for (const id of ['daily-slot-2', 'daily-slot-3'] as const) {
    if (completeIds.has(id)) ordered.push(id);
  }
  for (const t of rows) {
    if (t.state === 'complete' && !ordered.includes(t.id)) ordered.push(t.id);
  }
  return ordered;
}

export function isSpecialDeliveryDoorGuidePhase(
  phase: SpecialDeliveryFtuePhase | null,
): boolean {
  return phase === 'guide_doors_coins' || phase === 'guide_doors_trophy';
}
