import { TASKS_FLOATING_BUTTON_UNLOCK_LEVEL } from '../constants/playerLevelUnlocks';

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
