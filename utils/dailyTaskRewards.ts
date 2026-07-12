import { TASKS_FLOATING_BUTTON_UNLOCK_LEVEL } from '../constants/playerLevelUnlocks';
import {
  GOLDEN_POT_BONUS_DAILY_TASKS_2X_AT,
  type GoldenPotUnlockInput,
  hasGoldenPotDailyTasks2x,
} from '../constants/goldenPotBonuses';

/** Base coin rewards per slot at tasks unlock level. */
const DAILY_TASK_SLOT_REWARD_BASE: readonly [number, number, number] = [250, 500, 1000];

/** Added per slot for each player level above tasks unlock. */
const DAILY_TASK_SLOT_REWARD_PER_LEVEL: readonly [number, number, number] = [50, 100, 200];

export function getDailyTaskSlotRewardCoins(slot: 1 | 2 | 3, playerLevel: number): number {
  const levelsAboveUnlock = Math.max(
    0,
    Math.floor(playerLevel) - TASKS_FLOATING_BUTTON_UNLOCK_LEVEL,
  );
  const idx = slot - 1;
  return (
    DAILY_TASK_SLOT_REWARD_BASE[idx] +
    levelsAboveUnlock * DAILY_TASK_SLOT_REWARD_PER_LEVEL[idx]
  );
}

/**
 * Garden coin reward for generic (post-feature) level-up popups.
 * Matches daily task slot 2 base scaling — no golden-pot 2× (that bonus is task-only).
 */
export function getLevelUpRewardCoins(playerLevel: number): number {
  return getDailyTaskSlotRewardCoins(2, playerLevel);
}

/** Slot + level base reward, with Daily Rewards golden pot bonus (2×) applied when unlocked. */
export function getDailyTaskRewardCoins(
  slot: 1 | 2 | 3,
  playerLevel: number,
  unlocked: GoldenPotUnlockInput,
): number {
  const base = getDailyTaskSlotRewardCoins(slot, playerLevel);
  return hasGoldenPotDailyTasks2x(unlocked) ? base * 2 : base;
}
