import { DEFAULT_GARDEN_ID, type GardenId } from '../../constants/gardens';
import {
  GARDENS_FLOATING_BUTTON_UNLOCK_LEVEL,
  PLANT_COLLECTION_UI_UNLOCK_LEVEL,
  TASKS_FLOATING_BUTTON_UNLOCK_LEVEL,
} from '../../constants/playerLevelUnlocks';

export interface LevelUpAdBreakSkipContext {
  level: number;
  /** Active garden when the level-up popup is shown. */
  gardenId?: GardenId;
  /** Collection mini-FTUE finished (account-wide). */
  collectionFtueCompleted: boolean;
  /** Daily tasks mini-FTUE finished (account-wide). */
  tasksFtueCompleted: boolean;
  /** Gardens floating-button mini-FTUE finished (account-wide). */
  gardensFtueCompleted: boolean;
}

/**
 * Skip `level_up_continue` ad breaks when the confirm button starts a forced follow-up FTUE.
 *
 * Daily Tasks / Plant Collection / Gardens unlocks that still have their mini-FTUE pending
 * (normally garden 1; flags are account-wide so garden 2+ is fine once FTUE is done).
 *
 * Upgrade-panel open / flash unlocks are NOT skipped — those already wait until after the ad
 * and level-up dismiss via `applyLevelUpPopupUnlock`.
 */
export function shouldSkipLevelUpAdBreak(ctx: LevelUpAdBreakSkipContext): boolean {
  const {
    level,
    gardenId = DEFAULT_GARDEN_ID,
    collectionFtueCompleted,
    tasksFtueCompleted,
    gardensFtueCompleted,
  } = ctx;

  if (level === TASKS_FLOATING_BUTTON_UNLOCK_LEVEL && !tasksFtueCompleted) return true;
  if (level === PLANT_COLLECTION_UI_UNLOCK_LEVEL && !collectionFtueCompleted) return true;
  if (
    gardenId === DEFAULT_GARDEN_ID &&
    level === GARDENS_FLOATING_BUTTON_UNLOCK_LEVEL &&
    !gardensFtueCompleted
  ) {
    return true;
  }

  return false;
}
