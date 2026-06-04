import { assetPath } from './assetPath';
import type { DailyTaskDefinition, DailyTaskRowState } from '../components/DailyTaskRow';

export const DAILY_TASKS_SEEDS_PLANTED_KEY = 'daily-tasks-seeds-planted';
export const DAILY_TASKS_CLAIMED_IDS_KEY = 'daily-tasks-claimed-ids';

const TASK_TITLE = 'Plant Seeds';
const TASK_DESCRIPTION = 'Produce seeds into the garden.';
const TASK_ICON = assetPath('/assets/icons/upgrades/icon_seedproduction.png');

export const DAILY_TASK_SPECS = [
  { id: 'plant-seeds-1', progressTotal: 1, rewardCoins: 250 },
  { id: 'plant-seeds-2', progressTotal: 3, rewardCoins: 500 },
  { id: 'plant-seeds-3', progressTotal: 5, rewardCoins: 1000 },
] as const;

export type DailyTaskId = (typeof DAILY_TASK_SPECS)[number]['id'];

function readSeedsPlanted(): number {
  try {
    const raw = localStorage.getItem(DAILY_TASKS_SEEDS_PLANTED_KEY);
    if (raw == null) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeSeedsPlanted(count: number): void {
  try {
    localStorage.setItem(DAILY_TASKS_SEEDS_PLANTED_KEY, String(Math.max(0, Math.floor(count))));
  } catch {
    /* ignore */
  }
}

function readClaimedIds(): DailyTaskId[] {
  try {
    const raw = localStorage.getItem(DAILY_TASKS_CLAIMED_IDS_KEY);
    if (raw == null) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const valid = new Set(DAILY_TASK_SPECS.map((t) => t.id));
    return parsed.filter((id): id is DailyTaskId => typeof id === 'string' && valid.has(id as DailyTaskId));
  } catch {
    return [];
  }
}

function writeClaimedIds(ids: DailyTaskId[]): void {
  try {
    localStorage.setItem(DAILY_TASKS_CLAIMED_IDS_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

function taskState(seedsPlanted: number, progressTotal: number, claimed: boolean): DailyTaskRowState {
  if (claimed) return 'claimed';
  if (seedsPlanted >= progressTotal) return 'complete';
  return 'in_progress';
}

export function buildDailyTaskRows(
  seedsPlanted = readSeedsPlanted(),
  claimedIds = readClaimedIds(),
): DailyTaskDefinition[] {
  const claimedSet = new Set(claimedIds);
  return DAILY_TASK_SPECS.map((spec) => {
    const claimed = claimedSet.has(spec.id);
    return {
      id: spec.id,
      state: taskState(seedsPlanted, spec.progressTotal, claimed),
      title: TASK_TITLE,
      description: TASK_DESCRIPTION,
      progressCurrent: Math.min(seedsPlanted, spec.progressTotal),
      progressTotal: spec.progressTotal,
      rewardCoins: spec.rewardCoins,
      iconSrc: TASK_ICON,
    };
  });
}

/** Increment shared seed counter and return updated rows. */
export function recordDailyTaskSeedPlanted(): DailyTaskDefinition[] {
  const next = readSeedsPlanted() + 1;
  writeSeedsPlanted(next);
  return buildDailyTaskRows(next, readClaimedIds());
}

export function markDailyTaskClaimed(taskId: DailyTaskId): DailyTaskDefinition[] {
  const claimed = readClaimedIds();
  if (!claimed.includes(taskId)) {
    writeClaimedIds([...claimed, taskId]);
  }
  return buildDailyTaskRows(readSeedsPlanted(), readClaimedIds());
}

/** Dev: reset today's task progress (seeds + claims) to zero. */
export function resetDailyTasksProgressForDay(): DailyTaskDefinition[] {
  writeSeedsPlanted(0);
  writeClaimedIds([]);
  return buildDailyTaskRows(0, []);
}

export function clearDailyTasksProgressStorage(): void {
  try {
    localStorage.removeItem(DAILY_TASKS_SEEDS_PLANTED_KEY);
    localStorage.removeItem(DAILY_TASKS_CLAIMED_IDS_KEY);
  } catch {
    /* ignore */
  }
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

/** Unlocked: claim if any task ready; else all claimed → completed; else normal. */
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
