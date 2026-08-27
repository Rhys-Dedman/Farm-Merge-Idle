/**
 * Support contact — Infinity Arena checklist: open the device email client.
 * Format: support+{gamename}@infinitygames.io
 */
export const SUPPORT_EMAIL = 'support+pocketgarden@infinitygames.io';

const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Pocket Garden Support')}`;

/** Opens the OS email client (mailto). Falls back to location assign on WebView. */
export function openSupportContact(): void {
  try {
    window.location.href = SUPPORT_MAILTO;
  } catch {
    try {
      window.open(SUPPORT_MAILTO, '_blank', 'noopener,noreferrer');
    } catch {
      /* ignore */
    }
  }
}
