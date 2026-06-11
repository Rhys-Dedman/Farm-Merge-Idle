import { MAX_PLANT_TIER } from './plants';

/** Shed collection: 5 shelves × 4 plants (levels 1–`MAX_PLANT_TIER`). */
export const BARN_SHELF_COUNT = MAX_PLANT_TIER / 4;

/** All shelves are always available (no coin unlock). */
export function normalizeBarnShelvesUnlocked(_raw?: unknown): boolean[] {
  return Array.from({ length: BARN_SHELF_COUNT }, () => true);
}
