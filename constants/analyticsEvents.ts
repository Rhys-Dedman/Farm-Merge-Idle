/**
 * Analytics event names + param helpers (Infinity Arena Prompt 1).
 * SDKs (AppsFlyer / Facebook / Firebase / devtodev) are Genesis — stubs only.
 *
 * Rules baked into the plan:
 * - Progress uses a single parameterized `level_complete` (player level).
 * - Store purchases / ad revenue MUST NOT go through AppsFlyer `logEvent`
 *   (use AF purchase / ad-revenue APIs when Genesis wires SDKs).
 */
import { GAME_KEY } from './appIdentity';

export const ANALYTICS_GAME_ID = GAME_KEY;

/** Player levels that also count as milestone markers on `level_complete`. */
export const LEVEL_COMPLETE_MILESTONE_LEVELS: ReadonlySet<number> = new Set([
  5, 7, 10, 15, 20, 25, 30,
]);

export const AnalyticsEvents = {
  session_start: 'session_start',
  level_complete: 'level_complete',
  ftue_complete: 'ftue_complete',
  ftue_step: 'ftue_step',
  plant_discovered: 'plant_discovered',
  garden_unlocked: 'garden_unlocked',
  ad_interstitial_show: 'ad_interstitial_show',
  ad_rewarded_show: 'ad_rewarded_show',
  ad_rewarded_complete: 'ad_rewarded_complete',
  offer_shown: 'offer_shown',
  iap_click: 'iap_click',
  /** Local grant stub — real purchase revenue uses store / AF purchase APIs, not logEvent. */
  iap_grant_stub: 'iap_grant_stub',
  rate_us_shown: 'rate_us_shown',
  rate_us_result: 'rate_us_result',
  notification_permission: 'notification_permission',
  soft_currency_sink: 'soft_currency_sink',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

export function levelCompleteParams(level: number): AnalyticsParams {
  return {
    level,
    milestone: LEVEL_COMPLETE_MILESTONE_LEVELS.has(level),
  };
}
