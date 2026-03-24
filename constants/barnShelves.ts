/** Shed collection: 6 shelves × 4 plants (levels 1–24). */
export const BARN_SHELF_COUNT = 6;

/** All shelves are always available (no coin unlock). */
export function normalizeBarnShelvesUnlocked(_raw?: unknown): boolean[] {
  return Array.from({ length: BARN_SHELF_COUNT }, () => true);
}
