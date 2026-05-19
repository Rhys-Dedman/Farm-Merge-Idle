import { useEffect, useState } from 'react';
import { getStarterPackCountdownRemainingMs } from '../offers';

/** Live remaining ms for the starter-pack 24h offer (0 when not unlocked or expired). */
export function useStarterPackCountdown(
  starterPackUnlocked: boolean,
  refreshKey = 0,
): number {
  const [remainingMs, setRemainingMs] = useState(() =>
    starterPackUnlocked ? getStarterPackCountdownRemainingMs() : 0,
  );

  useEffect(() => {
    if (!starterPackUnlocked) {
      setRemainingMs(0);
      return;
    }
    const tick = () => setRemainingMs(getStarterPackCountdownRemainingMs());
    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [starterPackUnlocked, refreshKey]);

  return remainingMs;
}
