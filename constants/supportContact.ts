/**
 * Contact Us opens this URL in the browser.
 * Replace with your real support/contact page when ready.
 */
export const SUPPORT_CONTACT_URL = 'https://example.com/pocket-garden-contact';

export function openSupportContact(): void {
  try {
    window.open(SUPPORT_CONTACT_URL, '_blank', 'noopener,noreferrer');
  } catch {
    try {
      window.location.href = SUPPORT_CONTACT_URL;
    } catch {
      /* ignore */
    }
  }
}
