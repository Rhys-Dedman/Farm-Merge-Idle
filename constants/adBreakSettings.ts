/**
 * Interstitial / ad-break tuning — values live in remote config defaults.
 * See `constants/remoteConfigDefaults.ts` → `ads`.
 *
 * ## Triggers / blockers
 * Documented historically below; cadence numbers come from `getRemoteConfig().ads`.
 */

import { getRemoteConfig } from '../utils/remoteConfig';

export type AdBreakTriggerId =
  | 'discovery_add'
  | 'level_up_continue'
  | 'leave_store'
  | 'leave_collection'
  | 'switch_garden'
  | 'collection_bonus_close'
  | 'fallback_idle';

/**
 * Live ad-break settings (reads remote config each access so Firebase overrides apply).
 * Shape matches the old `AD_BREAK_SETTINGS` object for call-site compatibility.
 */
export const AD_BREAK_SETTINGS = {
  get cooldownMs() {
    return getRemoteConfig().ads.interstitialCooldownMs;
  },
  get rewardedBufferMs() {
    return getRemoteConfig().ads.interstitialCooldownAfterRewardedMs;
  },
  get minPlayerLevel() {
    return getRemoteConfig().ads.interstitialMinPlayerLevel;
  },
  get minActivePlaytimeMs() {
    return getRemoteConfig().ads.interstitialMinActivePlaytimeMs;
  },
  get returnGraceMs() {
    return getRemoteConfig().ads.interstitialGracePeriodMs;
  },
  /** How often to re-check fallback while playing (not remote-tuned). */
  fallbackPollMs: 5 * 1000,
} as const;
