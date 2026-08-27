/**
 * Single source of truth for Pocket Garden’s Infinity identity.
 * Bundle ID must match these Android/Capacitor locations (no shared import there):
 * - capacitor.config.ts → appId / appName
 * - android/app/build.gradle → namespace + applicationId
 * - android/app/src/main/res/values/strings.xml → package_name, custom_url_scheme, app_name
 * - ios PRODUCT_BUNDLE_IDENTIFIER (N/A until iOS project exists)
 * - IAP APP_ID below (store SKU prefix)
 *
 * Analytics / Facebook / Firebase keys: ask creator for live values (placeholders until then).
 */

/** Bundle suffix: com.infinitygames.<GAME_KEY> */
export const GAME_KEY = 'pocketgarden' as const;

/** Play / store display name */
export const APP_NAME = 'Pocket Garden' as const;

/** Full application id — identical everywhere */
export const BUNDLE_ID = `com.infinitygames.${GAME_KEY}` as const;

/**
 * IAP store SKU prefix. Infinity: every storeId = `${APP_ID}.<snake_case_suffix>`.
 * Same string as BUNDLE_ID for this game.
 */
export const APP_ID = BUNDLE_ID;

export const RATE_US_PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${BUNDLE_ID}`;

/** Placeholder analytics keys — replace when Genesis / Arena issue game-specific credentials. */
export const ANALYTICS_KEYS = {
  APPSFLYER_DEV_KEY_ANDROID: '',
  APPSFLYER_DEV_KEY_IOS: '',
  DEVTODEV_APP_ID_ANDROID: '',
  DEVTODEV_APP_ID_IOS: '',
  FACEBOOK_APP_ID: '',
  FACEBOOK_CLIENT_TOKEN: '',
  /** iOS App Store numeric id (Rate Us / store links on iOS). */
  IOS_APP_ID: '',
} as const;
