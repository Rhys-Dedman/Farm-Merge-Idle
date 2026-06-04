/** Set when player confirms Rate Us with 1–4 stars + Rate Now; popup should not show again. */
export const RATE_US_PERMANENTLY_DISMISSED_KEY = 'rate_us_permanently_dismissed_v1';

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
  } catch {
    /* ignore */
  }
}
