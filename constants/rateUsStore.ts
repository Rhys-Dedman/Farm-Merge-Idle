/**
 * Rate Us opens this URL (Play Store listing / review page).
 * Replace with your real store URL when ready.
 */
export const RATE_US_STORE_URL = 'https://example.com/pocket-garden-rate';

export function openRateUsStore(): void {
  try {
    window.open(RATE_US_STORE_URL, '_blank', 'noopener,noreferrer');
  } catch {
    try {
      window.location.href = RATE_US_STORE_URL;
    } catch {
      /* ignore */
    }
  }
}
