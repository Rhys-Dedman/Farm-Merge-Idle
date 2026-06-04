import { useEffect, useState } from 'react';
import { getDailyTasksCountdownRemainingMs } from '../utils/dailyTasksCountdown';

/** Live remaining ms for the daily-tasks 24h window (0 when not unlocked or expired). */
export function useDailyTasksCountdown(tasksUnlocked: boolean, refreshKey = 0): number {
  const [remainingMs, setRemainingMs] = useState(() =>
    tasksUnlocked ? getDailyTasksCountdownRemainingMs() : 0,
  );

  useEffect(() => {
    if (!tasksUnlocked) {
      setRemainingMs(0);
      return;
    }
    const tick = () => setRemainingMs(getDailyTasksCountdownRemainingMs());
    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [tasksUnlocked, refreshKey]);

  return remainingMs;
}
