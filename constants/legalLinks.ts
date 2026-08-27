/**
 * Legal links required by Infinity Arena Settings checklist.
 */
export const PRIVACY_POLICY_URL = 'https://infinitygames.io/privacy-policy/';
export const TERMS_OF_SERVICE_URL = 'https://infinitygames.io/tos/';

function openExternalUrl(url: string): void {
  try {
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch {
    try {
      window.location.href = url;
    } catch {
      /* ignore */
    }
  }
}

export function openPrivacyPolicy(): void {
  openExternalUrl(PRIVACY_POLICY_URL);
}

export function openTermsOfService(): void {
  openExternalUrl(TERMS_OF_SERVICE_URL);
}
