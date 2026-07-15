/**
 * Rate Us prompt eligibility.
 *
 * - Permanent dismiss after the player rates (thank-you path).
 * - Soft dismiss (X / backdrop) → auto-prompt again after ~1 day (max retries).
 * - Settings Rate Us is always shown; if already rated, Settings shows an "Already Rated" toast.
 */

export const RATE_US_PERMANENTLY_DISMISSED_KEY = 'rate_us_permanently_dismissed_v1';
export const RATE_US_NEXT_ELIGIBLE_AT_MS_KEY = 'rate_us_next_eligible_at_ms_v1';
export const RATE_US_SOFT_DISMISS_COUNT_KEY = 'rate_us_soft_dismiss_count_v1';
/** After this many soft dismisses, stop auto-prompting (Settings still allowed until rated). */
export const RATE_US_MAX_SOFT_DISMISSES = 3;
/** Wait this long after a soft dismiss before auto-showing again. */
export const RATE_US_SOFT_RETRY_DELAY_MS = 24 * 60 * 60 * 1000;

export function readRateUsPermanentlyDismissed(): boolean {
  try {
    return localStorage.getItem(RATE_US_PERMANENTLY_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markRateUsPermanentlyDismissed(): void {
  try {
    localStorage.setItem(RATE_US_PERMANENTLY_DISMISSED_KEY, '1');
    localStorage.removeItem(RATE_US_NEXT_ELIGIBLE_AT_MS_KEY);
  } catch {
    /* ignore */
  }
}

export function readRateUsSoftDismissCount(): number {
  try {
    const raw = localStorage.getItem(RATE_US_SOFT_DISMISS_COUNT_KEY);
    const n = raw != null ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch {
    return 0;
  }
}

export function readRateUsNextEligibleAtMs(): number | null {
  try {
    const raw = localStorage.getItem(RATE_US_NEXT_ELIGIBLE_AT_MS_KEY);
    if (raw == null) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Soft dismiss (X / backdrop) — schedule a later auto retry. */
export function markRateUsSoftDismissed(atTimeMs = Date.now()): void {
  if (readRateUsPermanentlyDismissed()) return;
  const nextCount = readRateUsSoftDismissCount() + 1;
  try {
    localStorage.setItem(RATE_US_SOFT_DISMISS_COUNT_KEY, String(nextCount));
    if (nextCount >= RATE_US_MAX_SOFT_DISMISSES) {
      // Stop auto prompts; leave permanent flag off so Settings Rate Us still works.
      localStorage.setItem(RATE_US_NEXT_ELIGIBLE_AT_MS_KEY, String(Number.MAX_SAFE_INTEGER));
    } else {
      localStorage.setItem(
        RATE_US_NEXT_ELIGIBLE_AT_MS_KEY,
        String(atTimeMs + RATE_US_SOFT_RETRY_DELAY_MS),
      );
    }
  } catch {
    /* ignore */
  }
}

/** True when an automatic Rate Us prompt may show (not Settings). */
export function canAutoShowRateUsPrompt(atTimeMs = Date.now()): boolean {
  if (readRateUsPermanentlyDismissed()) return false;
  if (readRateUsSoftDismissCount() >= RATE_US_MAX_SOFT_DISMISSES) return false;
  const nextAt = readRateUsNextEligibleAtMs();
  if (nextAt != null && atTimeMs < nextAt) return false;
  return true;
}

/** True until the player completes a rating (thank-you path). */
export function canEverShowRateUs(): boolean {
  return !readRateUsPermanentlyDismissed();
}

/**
 * Settings Rate Us — always available in Settings.
 * (Rated state shows an "Already Rated" toast in Settings instead of hiding the button.)
 */
export function canOpenRateUsFromSettings(): boolean {
  return !readRateUsPermanentlyDismissed();
}

export function clearRateUsPromptStorage(): void {
  try {
    localStorage.removeItem(RATE_US_PERMANENTLY_DISMISSED_KEY);
    localStorage.removeItem(RATE_US_NEXT_ELIGIBLE_AT_MS_KEY);
    localStorage.removeItem(RATE_US_SOFT_DISMISS_COUNT_KEY);
  } catch {
    /* ignore */
  }
}
