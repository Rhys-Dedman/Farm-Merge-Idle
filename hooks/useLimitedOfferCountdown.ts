import { useEffect, useState } from 'react';
import {
  readLimitedOfferCountdownEndMs,
  type ReadLimitedOfferCountdownOptions,
} from '../utils/limitedOfferCountdown';

export function useLimitedOfferCountdown(
  storageKey: string | undefined,
  durationMs: number | undefined,
  options?: ReadLimitedOfferCountdownOptions & { refreshKey?: number },
): number {
  const [remainingMs, setRemainingMs] = useState(0);
  const autoStart = options?.autoStart !== false;
  const refreshKey = options?.refreshKey ?? 0;

  useEffect(() => {
    if (!storageKey || !durationMs) {
      setRemainingMs(0);
      return;
    }

    const endMs = readLimitedOfferCountdownEndMs(storageKey, durationMs, { autoStart });
    const tick = () => setRemainingMs(Math.max(0, endMs - Date.now()));
    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [storageKey, durationMs, autoStart, refreshKey]);

  return remainingMs;
}
