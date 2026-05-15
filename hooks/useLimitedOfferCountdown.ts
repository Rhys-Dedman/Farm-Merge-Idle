import { useEffect, useState } from 'react';
import { readLimitedOfferCountdownEndMs } from '../utils/limitedOfferCountdown';

export function useLimitedOfferCountdown(
  storageKey: string | undefined,
  durationMs: number | undefined,
): number {
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!storageKey || !durationMs) {
      setRemainingMs(0);
      return;
    }

    const endMs = readLimitedOfferCountdownEndMs(storageKey, durationMs);
    const tick = () => setRemainingMs(Math.max(0, endMs - Date.now()));
    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [storageKey, durationMs]);

  return remainingMs;
}
