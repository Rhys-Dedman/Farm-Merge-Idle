/**
 * Rate Us opens the Play Store listing (package matches Capacitor appId).
 * Listing may 404 until published — correct destination for Genesis / store setup.
 */
export const RATE_US_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.infinitygames.pocketgarden';

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
