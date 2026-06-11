/** Playable garden ids (farm columns share one ruleset each). */
export const GARDEN_IDS = ['garden_1', 'garden_2', 'garden_3'] as const;

export type GardenId = (typeof GARDEN_IDS)[number];

export const DEFAULT_GARDEN_ID: GardenId = 'garden_1';

/** Garden 1 player level required before switching / starting other gardens. */
export const GARDENS_SWITCH_UNLOCK_LEVEL = 10;

export function isGardenId(value: unknown): value is GardenId {
  return typeof value === 'string' && (GARDEN_IDS as readonly string[]).includes(value);
}
