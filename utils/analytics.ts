/**
 * Analytics facade — Prototype stubs for Infinity Arena Prompt 1 / 2.
 *
 * Prompt 2 (Genesis): wire AppsFlyer + Facebook App Events + Firebase Analytics here.
 * Prompt 3 (Arena): add devtodev + TikTok after live.
 *
 * Do NOT send IAP revenue or ad revenue through AppsFlyer `logEvent` —
 * use purchase / ad-revenue APIs when SDKs land.
 */
import {
  AnalyticsEvents,
  type AnalyticsEventName,
  type AnalyticsParams,
  levelCompleteParams,
} from '../constants/analyticsEvents';

export type { AnalyticsEventName, AnalyticsParams };
export { AnalyticsEvents, levelCompleteParams };

type AnalyticsSink = (name: AnalyticsEventName | string, params?: AnalyticsParams) => void;

let sink: AnalyticsSink | null = null;
let sessionStarted = false;

/** Optional override for tests / future SDK bridge. */
export function setAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next;
}

function emit(name: AnalyticsEventName | string, params?: AnalyticsParams): void {
  if (sink) {
    sink(name, params);
    return;
  }
  if (typeof console !== 'undefined' && typeof console.debug === 'function') {
    console.debug('[analytics:stub]', name, params ?? {});
  }
}

export function logEvent(name: AnalyticsEventName | string, params?: AnalyticsParams): void {
  emit(name, params);
}

/** Once per cold start after splash / hydrate. */
export function trackSessionStart(params?: AnalyticsParams): void {
  if (sessionStarted) return;
  sessionStarted = true;
  logEvent(AnalyticsEvents.session_start, params);
}

export function trackLevelComplete(level: number): void {
  logEvent(AnalyticsEvents.level_complete, levelCompleteParams(level));
}

export function trackFtueComplete(kind: string = 'main'): void {
  logEvent(AnalyticsEvents.ftue_complete, { kind });
}

export function trackFtueStep(step: string): void {
  logEvent(AnalyticsEvents.ftue_step, { step });
}

export function trackPlantDiscovered(plantLevel: number, gardenId: string): void {
  logEvent(AnalyticsEvents.plant_discovered, { plant_level: plantLevel, garden_id: gardenId });
}

export function trackGardenUnlocked(gardenId: string): void {
  logEvent(AnalyticsEvents.garden_unlocked, { garden_id: gardenId });
}

export function trackInterstitialShow(trigger: string): void {
  logEvent(AnalyticsEvents.ad_interstitial_show, { trigger });
}

export function trackRewardedShow(source: string, offerId?: string | null): void {
  logEvent(AnalyticsEvents.ad_rewarded_show, {
    source,
    offer_id: offerId ?? null,
  });
}

export function trackRewardedComplete(source: string, offerId?: string | null): void {
  logEvent(AnalyticsEvents.ad_rewarded_complete, {
    source,
    offer_id: offerId ?? null,
  });
}

export function trackOfferShown(offerId: string, surface: string): void {
  logEvent(AnalyticsEvents.offer_shown, { offer_id: offerId, surface });
}

export function trackIapClick(offerId: string): void {
  logEvent(AnalyticsEvents.iap_click, { offer_id: offerId });
}

/** Prototype grant path only — not a store-validated purchase revenue event. */
export function trackIapGrantStub(offerId: string, storeProductId?: string | null): void {
  logEvent(AnalyticsEvents.iap_grant_stub, {
    offer_id: offerId,
    store_product_id: storeProductId ?? null,
  });
}

export function trackRateUsShown(reason: string): void {
  logEvent(AnalyticsEvents.rate_us_shown, { reason });
}

export function trackRateUsResult(result: 'rated' | 'soft_dismiss' | 'closed'): void {
  logEvent(AnalyticsEvents.rate_us_result, { result });
}

export function trackNotificationPermission(status: string): void {
  logEvent(AnalyticsEvents.notification_permission, { status });
}
