import { useEffect, useState } from 'react';
import { getFieldPackCountdownRemainingMs, getStarterPackCountdownRemainingMs } from '../offers';

/** Live remaining ms for a 24h limited bundle offer (0 when not unlocked or expired). */
function useLimitedBundleCountdown(
  unlocked: boolean,
  refreshKey: number,
  getRemainingMs: (atTimeMs?: number) => number,
): number {
  const [remainingMs, setRemainingMs] = useState(() =>
    unlocked ? getRemainingMs() : 0,
  );

  useEffect(() => {
    if (!unlocked) {
      setRemainingMs(0);
      return;
    }
    const tick = () => setRemainingMs(getRemainingMs());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [unlocked, refreshKey, getRemainingMs]);

  return remainingMs;
}

/** Live remaining ms for the starter-pack 24h offer (0 when not unlocked or expired). */
export function useStarterPackCountdown(
  starterPackUnlocked: boolean,
  refreshKey = 0,
): number {
  return useLimitedBundleCountdown(
    starterPackUnlocked,
    refreshKey,
    getStarterPackCountdownRemainingMs,
  );
}

/** Live remaining ms for the field-pack 24h offer (0 when not unlocked or expired). */
export function useFieldPackCountdown(
  fieldPackUnlocked: boolean,
  refreshKey = 0,
): number {
  return useLimitedBundleCountdown(
    fieldPackUnlocked,
    refreshKey,
    getFieldPackCountdownRemainingMs,
  );
}
