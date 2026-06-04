import { formatBundleLimitedCountdown } from './limitedOfferCountdown';
import { resetDailyTasksProgressForDay } from './dailyTasksProgress';

export const DAILY_TASKS_UNLOCKED_KEY = 'daily-tasks-unlocked';
export const DAILY_TASKS_COUNTDOWN_END_MS_KEY = 'daily-tasks-countdown-end-ms';

export const DAILY_TASKS_COUNTDOWN_DURATION_MS = 24 * 60 * 60 * 1000;

export function readDailyTasksCountdownEndMs(): number | null {
  try {
    const raw = localStorage.getItem(DAILY_TASKS_COUNTDOWN_END_MS_KEY);
    if (raw == null) return null;
    const endMs = parseInt(raw, 10);
    return Number.isFinite(endMs) ? endMs : null;
  } catch {
    return null;
  }
}

export function readDailyTasksUnlocked(): boolean {
  try {
    if (localStorage.getItem(DAILY_TASKS_UNLOCKED_KEY) === '1') return true;
  } catch {
    /* ignore */
  }
  return readDailyTasksCountdownEndMs() != null;
}

export function startDailyTasksCountdown(atTimeMs = Date.now()): number {
  const endMs = atTimeMs + DAILY_TASKS_COUNTDOWN_DURATION_MS;
  try {
    localStorage.setItem(DAILY_TASKS_COUNTDOWN_END_MS_KEY, String(endMs));
  } catch {
    /* ignore */
  }
  return endMs;
}

/** Starts the 24h window once when daily tasks unlock (level 5+). */
export function markDailyTasksUnlocked(): void {
  try {
    localStorage.setItem(DAILY_TASKS_UNLOCKED_KEY, '1');
  } catch {
    /* ignore */
  }
  if (readDailyTasksCountdownEndMs() == null) {
    startDailyTasksCountdown();
  }
}

export function getDailyTasksCountdownRemainingMs(atTimeMs = Date.now()): number {
  if (!readDailyTasksUnlocked()) return 0;
  const endMs = readDailyTasksCountdownEndMs();
  if (endMs == null) return 0;
  return Math.max(0, endMs - atTimeMs);
}

export function formatDailyTasksCountdown(remainingMs: number): string {
  return formatBundleLimitedCountdown(remainingMs);
}

/** When the 24h window ends: reset task progress/claims and start the next period. */
export function rollDailyTasksPeriodIfExpired(atTimeMs = Date.now()): boolean {
  if (!readDailyTasksUnlocked()) return false;
  const endMs = readDailyTasksCountdownEndMs();
  if (endMs == null || atTimeMs < endMs) return false;
  resetDailyTasksProgressForDay();
  startDailyTasksCountdown(atTimeMs);
  return true;
}
