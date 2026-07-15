import type { GardenId } from '../constants/gardens';
import { parseNewGardenFtuePhase } from '../constants/newGardenFtue';
import { activateGardenInSave, type GameSaveV2 } from './gardenSave';

export type HealNewGardenFtueResult = {
  next: GameSaveV2;
  changed: boolean;
};

/**
 * Repair incomplete new-garden FTUE after crash/quit:
 * - Owns garden_2, FTUE incomplete, no phase → resume at `picker_view`
 * - Phase `welcome` / `point_gardens_fb` but not on garden_2 → force active garden to garden_2
 */
export function healNewGardenFtueSave(v2: GameSaveV2): HealNewGardenFtueResult {
  if (v2.globals.newGardenFtueCompleted === true) {
    return { next: v2, changed: false };
  }

  const started = v2.gardensStarted ?? [];
  const ownsGarden2 = started.includes('garden_2' as GardenId);
  if (!ownsGarden2) {
    return { next: v2, changed: false };
  }

  let next = v2;
  let changed = false;
  let phase = parseNewGardenFtuePhase(next.globals.newGardenFtuePhase);

  // Scenario A: purchased garden 2 but phase never persisted.
  if (phase == null) {
    phase = 'picker_view';
    next = {
      ...next,
      globals: {
        ...next.globals,
        newGardenFtueCompleted: false,
        newGardenFtuePhase: 'picker_view',
      },
      savedAt: Date.now(),
    };
    changed = true;
  }

  // Scenario C: mid-force-switch — FTUE step needs garden_2 but active garden didn't update.
  if (
    (phase === 'welcome' || phase === 'point_gardens_fb') &&
    next.activeGardenId !== 'garden_2'
  ) {
    next = activateGardenInSave(next, 'garden_2');
    next = {
      ...next,
      globals: {
        ...next.globals,
        newGardenFtueCompleted: false,
        newGardenFtuePhase: phase,
      },
      savedAt: Date.now(),
    };
    changed = true;
  }

  return { next, changed };
}
