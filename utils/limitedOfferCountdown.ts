export function formatBundleLimitedCountdown(remainingMs: number): string {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;

  if (h > 0) {
    return `${h}h ${m}m`;
  }
  if (m > 0) {
    return `${m}m ${sec}s`;
  }
  return `${sec}s`;
}

export type ReadLimitedOfferCountdownOptions = {
  /** When false, returns 0 if no end timestamp exists yet (does not start the timer). Default true. */
  autoStart?: boolean;
};

export function readLimitedOfferCountdownEndMs(
  storageKey: string,
  durationMs: number,
  options?: ReadLimitedOfferCountdownOptions,
): number {
  const autoStart = options?.autoStart !== false;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw == null) {
      if (!autoStart) return 0;
      const endMs = Date.now() + durationMs;
      localStorage.setItem(storageKey, String(endMs));
      return endMs;
    }

    const endMs = parseInt(raw, 10);
    if (!Number.isFinite(endMs)) {
      const nextEndMs = Date.now() + durationMs;
      localStorage.setItem(storageKey, String(nextEndMs));
      return nextEndMs;
    }

    return endMs;
  } catch {
    return Date.now() + durationMs;
  }
}
