import { formatBundleLimitedCountdown } from './limitedOfferCountdown';

export const DAILY_TASKS_UNLOCKED_KEY = 'daily-tasks-unlocked';
export const DAILY_TASKS_COUNTDOWN_END_MS_KEY = 'daily-tasks-countdown-end-ms';

/** @deprecated Period is now aligned to local midnight; kept for reference. */
export const DAILY_TASKS_COUNTDOWN_DURATION_MS = 24 * 60 * 60 * 1000;

/** Next local midnight (00:00) strictly after `fromMs`. */
export function getNextLocalMidnightMs(fromMs = Date.now()): number {
  const next = new Date(fromMs);
  next.setHours(0, 0, 0, 0);
  if (next.getTime() <= fromMs) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
}

/** When the daily-tasks popup is open, auto-claim completed tasks this many ms before period end. */
export const DAILY_TASKS_AUTO_CLAIM_BEFORE_END_MS = 1000;

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
  const endMs = getNextLocalMidnightMs(atTimeMs);
  try {
    localStorage.setItem(DAILY_TASKS_COUNTDOWN_END_MS_KEY, String(endMs));
  } catch {
    /* ignore */
  }
  return endMs;
}

/** Starts the 24h window once when daily tasks unlock (level 6+). */
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

/** Local calendar day key (`YYYY-MM-DD`) — same midnight boundary as daily tasks. */
export function getLocalDayKey(atTimeMs = Date.now()): string {
  const d = new Date(atTimeMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** True when the player already claimed daily allowance for `claimedDayKey` today (local time). */
export function isDailyAllowanceClaimedForDay(
  claimedDayKey: string | undefined,
  atTimeMs = Date.now(),
): boolean {
  if (!claimedDayKey) return false;
  return claimedDayKey === getLocalDayKey(atTimeMs);
}

/** When the 24h window ends: start the next period (caller rolls new tasks). */
export function rollDailyTasksPeriodIfExpired(atTimeMs = Date.now()): boolean {
  if (!readDailyTasksUnlocked()) return false;
  const endMs = readDailyTasksCountdownEndMs();
  if (endMs == null || atTimeMs < endMs) return false;
  startDailyTasksCountdown(atTimeMs);
  return true;
}
