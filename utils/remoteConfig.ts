/**
 * Runtime remote config — local defaults now, Firebase (or other) overrides later.
 *
 * Usage:
 *   import { getRemoteConfig } from './utils/remoteConfig';
 *   const cfg = getRemoteConfig();
 *
 * Firebase later:
 *   applyRemoteConfigOverrides(parsedFirebaseValues);
 */
import {
  REMOTE_CONFIG_DEFAULTS,
  type RemoteConfig,
} from '../constants/remoteConfigDefaults';

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepMerge(base: RemoteConfig, patch: DeepPartial<RemoteConfig>): RemoteConfig {
  const out = deepClone(base);
  mergeInto(out as unknown as Record<string, unknown>, patch as Record<string, unknown>);
  return out;
}

function mergeInto(target: Record<string, unknown>, patch: Record<string, unknown>): void {
  for (const key of Object.keys(patch)) {
    const next = patch[key];
    if (next == null) continue;
    const prev = target[key];
    if (
      typeof next === 'object' &&
      !Array.isArray(next) &&
      typeof prev === 'object' &&
      prev != null &&
      !Array.isArray(prev)
    ) {
      mergeInto(prev as Record<string, unknown>, next as Record<string, unknown>);
    } else {
      target[key] = next;
    }
  }
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

let activeConfig: RemoteConfig = deepClone(REMOTE_CONFIG_DEFAULTS);

/** Current effective config (defaults + any applied overrides). */
export function getRemoteConfig(): RemoteConfig {
  return activeConfig;
}

/** Reset to shipped defaults (clears Firebase / test overrides). */
export function resetRemoteConfigToDefaults(): void {
  activeConfig = deepClone(REMOTE_CONFIG_DEFAULTS);
}

/**
 * Merge a partial override tree onto defaults.
 * Call this after a Firebase Remote Config fetch (or from Dev Tools).
 */
export function applyRemoteConfigOverrides(patch: DeepPartial<RemoteConfig>): void {
  activeConfig = deepMerge(REMOTE_CONFIG_DEFAULTS, patch);
}

/** Convenience: max offline window in ms from `currency.maxOfflineEarningsHours`. */
export function getMaxOfflineAccumulationMs(): number {
  const hours = getRemoteConfig().currency.maxOfflineEarningsHours;
  return Math.max(0, hours) * 60 * 60 * 1000;
}

/** Convenience: new-garden coin price. */
export function getNewGardenUnlockCost(): number {
  return getRemoteConfig().currency.newGardenUnlockCost;
}

/** Convenience: ads master switch. */
export function areAdsEnabled(): boolean {
  return getRemoteConfig().ads.enabled;
}

const STORE_COIN_BOOST_IAP_IDS = [
  'store_coin_boost',
  'store_coin_mega_boost',
  'store_coin_ultra_boost',
] as const;

/** Per-offer store IAP kill switch. Unknown ids default to enabled. */
export function isStoreIapEnabled(offerId: string): boolean {
  const map = getRemoteConfig().monetization.iapEnabled;
  if (!Object.prototype.hasOwnProperty.call(map, offerId)) return true;
  return map[offerId] !== false;
}

/** True if any of the three Double Coins store IAP rows is enabled. */
export function isAnyStoreCoinBoostIapEnabled(): boolean {
  return STORE_COIN_BOOST_IAP_IDS.some((id) => isStoreIapEnabled(id));
}

/**
 * Placeholder for Firebase Remote Config fetch.
 * Wire SDK here later; until then this is a no-op that keeps local defaults.
 */
export async function fetchRemoteConfigFromBackend(): Promise<void> {
  // TODO(firebase): fetch Remote Config, parse JSON → applyRemoteConfigOverrides(...)
}
