import { DEFAULT_GARDEN_ID, GARDEN_IDS, type GardenId } from '../constants/gardens';

/** Legacy single-garden key — migrated into `garden_1` on first read. */
export const DAILY_TASKS_DAY_STATE_LEGACY_KEY = 'daily-tasks-day-state-v1';

let activeGardenId: GardenId = DEFAULT_GARDEN_ID;

export function setDailyTasksActiveGarden(gardenId: GardenId): void {
  activeGardenId = gardenId;
}

export function getDailyTasksActiveGarden(): GardenId {
  return activeGardenId;
}

export function getDailyTasksDayStateStorageKey(gardenId: GardenId = activeGardenId): string {
  return `${DAILY_TASKS_DAY_STATE_LEGACY_KEY}-${gardenId}`;
}

export function clearAllDailyTasksDayStorage(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    for (const id of GARDEN_IDS) {
      localStorage.removeItem(getDailyTasksDayStateStorageKey(id));
    }
    localStorage.removeItem(DAILY_TASKS_DAY_STATE_LEGACY_KEY);
  } catch {
    /* ignore */
  }
}
