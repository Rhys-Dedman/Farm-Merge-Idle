import type { DailyTaskDefinition } from '../components/DailyTaskRow';
import { assetPath } from './assetPath';
import {
  clearDailyTasksDayStorage,
  ensureDailyTasksDay,
  getDailyTaskRollContext,
  getGardenPlotStats,
  markDailyTaskClaimed,
  markDailyTasksClaimed,
  completeNextDailyTaskForDev,
  recordDailyTaskBoosterActivated,
  recordDailyTaskCoinOrder,
  recordDailyTaskFreeOfferClaimed,
  recordDailyTaskGoldenPot,
  recordDailyTaskHarvestCrops,
  recordDailyTaskHarvestThreeCells,
  recordDailyTaskLevelUp,
  recordDailyTaskMerge,
  recordDailyTaskMergeCoins,
  recordDailyTaskMergeHarvestCrops,
  recordDailyTaskNewDiscovery,
  recordDailyTaskOrderComplete,
  recordDailyTaskSeedPlanted,
  recordDailyTaskUpgradePurchased,
  resetDailyTasksForDev,
  rollDailyTasksNextPeriod,
  syncDailyTasksGrid,
  tickDailyTaskPlaytime,
} from './dailyTasksDay';

export type { DailyTaskRollContext, GardenPlotStats } from './dailyTasksDay';
export { getDailyTaskSlotRewardCoins } from './dailyTaskRewards';
export {
  ensureDailyTasksDay,
  getDailyTaskRollContext,
  getGardenPlotStats,
  markDailyTaskClaimed,
  markDailyTasksClaimed,
  completeNextDailyTaskForDev,
  recordDailyTaskBoosterActivated,
  recordDailyTaskCoinOrder,
  recordDailyTaskFreeOfferClaimed,
  recordDailyTaskGoldenPot,
  recordDailyTaskHarvestCrops,
  recordDailyTaskHarvestThreeCells,
  recordDailyTaskLevelUp,
  recordDailyTaskMerge,
  recordDailyTaskMergeCoins,
  recordDailyTaskMergeHarvestCrops,
  recordDailyTaskNewDiscovery,
  recordDailyTaskOrderComplete,
  recordDailyTaskSeedPlanted,
  recordDailyTaskUpgradePurchased,
  resetDailyTasksForDev,
  rollDailyTasksNextPeriod,
  syncDailyTasksGrid,
  tickDailyTaskPlaytime,
};

export function clearDailyTasksProgressStorage(): void {
  clearDailyTasksDayStorage();
}

export type TasksFloatingButtonVisual = 'locked' | 'normal' | 'claim' | 'completed';

const TASKS_FB_ICON_PATHS: Record<TasksFloatingButtonVisual, string> = {
  locked: '/assets/icons/floating_buttons/icon_fb_tasks_locked.png',
  normal: '/assets/icons/floating_buttons/icon_fb_tasks_normal.png',
  claim: '/assets/icons/floating_buttons/icon_fb_tasks_claim.png',
  completed: '/assets/icons/floating_buttons/icon_fb_tasks_completed.png',
};

export function getTasksFloatingButtonIconSrc(visual: TasksFloatingButtonVisual): string {
  return assetPath(TASKS_FB_ICON_PATHS[visual]);
}

export function getTasksFloatingButtonVisual(
  tasksUnlocked: boolean,
  rows: DailyTaskDefinition[],
): TasksFloatingButtonVisual {
  if (!tasksUnlocked) return 'locked';
  if (rows.some((t) => t.state === 'complete')) return 'claim';
  if (rows.length > 0 && rows.every((t) => t.state === 'claimed')) return 'completed';
  return 'normal';
}

export function findNewlyCompletedDailyTasks(
  prev: DailyTaskDefinition[],
  next: DailyTaskDefinition[],
): boolean {
  return next.some(
    (t) =>
      t.state === 'complete' && prev.find((p) => p.id === t.id)?.state === 'in_progress',
  );
}
