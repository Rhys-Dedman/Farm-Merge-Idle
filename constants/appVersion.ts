/**
 * Player-facing / store version — single source of truth.
 * Bumped on every "push and build" (see `.cursor/rules/push-and-build.mdc`).
 *
 * Display: `v${APP_VERSION}` in Settings
 * Android: `versionName` = APP_VERSION, `versionCode` = APP_VERSION_CODE
 */
export const APP_VERSION = '0.6.3';

/** Play Store / APK integer. Increment by 1 on every push-and-build. */
export const APP_VERSION_CODE = 20;
