/**
 * Plug-and-play rewarded ad SDK bridge.
 *
 * WHEN WIRING REAL ADS:
 * 1. Keep calling this from `RewardedAdLayer` (do not bypass App timing).
 * 2. Replace the stub `show` / `cancel` bodies with your SDK (AdMob, ironSource, etc.).
 * 3. Call `callbacks.onOpened()` once the creative is on-screen (covers loading plate).
 * 4. Call `callbacks.onClosed(result)` when the ad finishes, fails, or is dismissed.
 *
 * Timing contract: `show()` is only invoked AFTER the rewarded fade-to-black completes.
 * The loading plate ("Ad Loading…" / "Claim Reward") stays underneath this layer.
 *
 * Close results:
 * - `completed` / `skipped` / `failed` → App dismisses plate + applies pending reward path
 * - `no_fill` → App keeps loading plate so Claim Reward still works
 * - `cancelled` → reserved; App cancel path does not use onClosed
 */

export type RewardedAdCloseResult =
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'no_fill'
  | 'cancelled';

export interface RewardedAdShowCallbacks {
  /** Real creative is visible and covering the loading plate. */
  onOpened: () => void;
  /** Ad session ended — App dismisses loading plate and continues reward flow. */
  onClosed: (result: RewardedAdCloseResult) => void;
}

export interface RewardedAdBridge {
  /**
   * Request / show a rewarded ad above the loading plate.
   * Must be safe to call every rewarded request; cancel any previous in-flight show first.
   */
  show: (callbacks: RewardedAdShowCallbacks) => void;
  /** Abort in-flight show (e.g. player tapped Claim Reward on the loading plate). */
  cancel: () => void;
}

let activeCallbacks: RewardedAdShowCallbacks | null = null;

/**
 * Stub bridge — no real ads yet.
 * Loading plate remains visible; player uses Claim Reward / timeout escape.
 * Swap this implementation when the SDK is ready (same function signatures).
 */
export const rewardedAdBridge: RewardedAdBridge = {
  show(callbacks) {
    activeCallbacks = callbacks;
    // TODO(real-ads): preload/show rewarded here, then:
    //   callbacks.onOpened();
    //   ... later ...
    //   callbacks.onClosed('completed' | 'failed' | 'skipped' | 'no_fill');
    //
    // Stub intentionally does not open or close — underlay loading plate handles escape.
  },

  cancel() {
    // Abort only — App owns UI teardown (loading plate + black fade-out).
    // TODO(real-ads): abort SDK show / destroy overlay if needed.
    activeCallbacks = null;
  },
};

/** Clear bridge bookkeeping without firing onClosed (App already tearing down). */
export function clearRewardedAdBridgeSession(): void {
  activeCallbacks = null;
}
