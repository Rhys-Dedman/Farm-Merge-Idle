/** Playable garden ids (farm columns share one ruleset each). */
export const GARDEN_IDS = ['garden_1', 'garden_2', 'garden_3'] as const;

/** Gardens included in this build (picker, settings cycle, art preload). */
export const SHIPPED_GARDEN_IDS = ['garden_1', 'garden_2'] as const;

export type GardenId = (typeof GARDEN_IDS)[number];

export const DEFAULT_GARDEN_ID: GardenId = 'garden_1';

/** Garden 1 player level required before switching / starting other gardens. */
export const GARDENS_SWITCH_UNLOCK_LEVEL = 10;

export function isGardenId(value: unknown): value is GardenId {
  return typeof value === 'string' && (GARDEN_IDS as readonly string[]).includes(value);
}

export function getNextGardenId(current: GardenId): GardenId {
  const index = GARDEN_IDS.indexOf(current);
  if (index < 0) return DEFAULT_GARDEN_ID;
  return GARDEN_IDS[(index + 1) % GARDEN_IDS.length];
}

export function isShippedGardenId(value: GardenId): value is (typeof SHIPPED_GARDEN_IDS)[number] {
  return (SHIPPED_GARDEN_IDS as readonly string[]).includes(value);
}

/** Settings / debug label, e.g. `Garden 1`. */
export function getGardenDisplayLabel(gardenId: GardenId): string {
  const n = GARDEN_IDS.indexOf(gardenId) + 1;
  return `Garden ${n > 0 ? n : 1}`;
}
