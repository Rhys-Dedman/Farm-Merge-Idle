/**
 * Infinity IAP uniformization — store SKUs are `${APP_ID}.<snake_case>`.
 * Internal offer ids (in offers.ts) stay game-local; only APP_ID changes per game.
 * Billing SDK wiring is Genesis; this catalog is the store-creation source of truth.
 */
import { APP_ID } from '../constants/appIdentity';

/** Shared Infinity-style snake_case suffixes (do not rename per game — change APP_ID only). */
export const IAP_STORE_SUFFIX = {
  coin_boost: 'coin_boost',
  coin_mega_boost: 'coin_mega_boost',
  coin_ultra_boost: 'coin_ultra_boost',
  remove_ads: 'remove_ads',
  starter_pack: 'starter_pack',
  field_pack: 'field_pack',
  harvesters_pack: 'harvesters_pack',
} as const;

export type IapStoreSuffix = (typeof IAP_STORE_SUFFIX)[keyof typeof IAP_STORE_SUFFIX];

export function storeSku(suffix: IapStoreSuffix | string): string {
  return `${APP_ID}.${suffix}`;
}

/**
 * Internal offer id (offers.ts) → Play/App Store product suffix.
 * Keep suffixes identical across Infinity games; only APP_ID differs.
 */
export const IAP_INTERNAL_TO_STORE_SUFFIX: Record<string, IapStoreSuffix> = {
  store_coin_boost: IAP_STORE_SUFFIX.coin_boost,
  store_coin_mega_boost: IAP_STORE_SUFFIX.coin_mega_boost,
  store_coin_ultra_boost: IAP_STORE_SUFFIX.coin_ultra_boost,
  store_no_ads: IAP_STORE_SUFFIX.remove_ads,
  store_bundle_starter_pack: IAP_STORE_SUFFIX.starter_pack,
  store_bundle_field_pack: IAP_STORE_SUFFIX.field_pack,
  store_bundle_harvesters_pack: IAP_STORE_SUFFIX.harvesters_pack,
};

export function getStoreProductId(internalOfferId: string): string | null {
  const suffix = IAP_INTERNAL_TO_STORE_SUFFIX[internalOfferId];
  if (!suffix) return null;
  return storeSku(suffix);
}

export type IapProductRow = {
  internalId: string;
  storeSuffix: IapStoreSuffix;
  /** Full Play / App Store SKU */
  storeId: string;
  /** Optional iOS-only SKU if platform split is needed later */
  storeIdIos?: string;
  displayName: string;
};

const DISPLAY_NAMES: Record<string, string> = {
  store_coin_boost: 'Coin Boost',
  store_coin_mega_boost: 'Coin Mega Boost',
  store_coin_ultra_boost: 'Coin Ultra Boost',
  store_no_ads: 'Remove Ads',
  store_bundle_starter_pack: 'Starter Pack',
  store_bundle_field_pack: 'Field Pack',
  store_bundle_harvesters_pack: 'Harvester Pack',
};

/** Full catalog for store console creation (Android; iOS same SKUs unless storeIdIos set). */
export const IAP_PRODUCT_CATALOG: readonly IapProductRow[] = (
  Object.entries(IAP_INTERNAL_TO_STORE_SUFFIX) as [string, IapStoreSuffix][]
).map(([internalId, storeSuffix]) => ({
  internalId,
  storeSuffix,
  storeId: storeSku(storeSuffix),
  displayName: DISPLAY_NAMES[internalId] ?? internalId,
}));

/** Every Android (and default iOS) SKU string for store console setup. */
export function listAllStoreSkus(): { android: string[]; ios: string[] } {
  const android = IAP_PRODUCT_CATALOG.map((p) => p.storeId);
  const ios = IAP_PRODUCT_CATALOG.map((p) => p.storeIdIos ?? p.storeId);
  return { android, ios };
}
