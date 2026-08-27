/**
 * Rate Us opens the Play Store listing (package matches Capacitor appId / BUNDLE_ID).
 * Listing may 404 until published — correct destination for Genesis / store setup.
 */
import { RATE_US_PLAY_STORE_URL } from './appIdentity';

export const RATE_US_STORE_URL = RATE_US_PLAY_STORE_URL;

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
