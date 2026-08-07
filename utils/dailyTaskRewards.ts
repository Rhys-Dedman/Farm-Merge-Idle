import { TASKS_FLOATING_BUTTON_UNLOCK_LEVEL } from '../constants/playerLevelUnlocks';
import {
  type GoldenPotUnlockInput,
  hasGoldenPotDailyTasks2x,
} from '../constants/goldenPotBonuses';

/** Fixed key payout by daily-task slot. These never scale with level or day. */
const DAILY_TASK_SLOT_REWARD_KEYS: readonly [number, number, number] = [5, 10, 15];

export function getDailyTaskSlotRewardKeys(slot: 1 | 2 | 3): number {
  return DAILY_TASK_SLOT_REWARD_KEYS[slot - 1];
}

/** Garden-1 intro trio (slots 1+2+3) total keys shown on the Collection nav badge as `n/30`. */
export const GARDEN_1_INTRO_DAILY_TASKS_KEY_GOAL =
  DAILY_TASK_SLOT_REWARD_KEYS[0] + DAILY_TASK_SLOT_REWARD_KEYS[1] + DAILY_TASK_SLOT_REWARD_KEYS[2];

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
