import type { DailyTaskClaimFx } from '../components/DailyTaskRow';

export function getDailyTaskClaimFxFromDom(taskId: string): DailyTaskClaimFx | null {
  const rowEl = document.querySelector(`[data-daily-task-id="${taskId}"]`);
  const rewardEl = rowEl?.querySelector('[data-daily-task-reward]');
  if (!rowEl || !rewardEl) return null;
  const rewardRect = rewardEl.getBoundingClientRect();
  const rowRect = rowEl.getBoundingClientRect();
  return {
    rewardCenter: {
      x: rewardRect.left + rewardRect.width / 2,
      y: rewardRect.top + rewardRect.height / 2,
    },
    rowCenter: {
      x: rowRect.left + rowRect.width / 2,
      y: rowRect.top + rowRect.height / 2,
    },
    rowWidth: rowRect.width,
    rowHeight: rowRect.height,
  };
}
