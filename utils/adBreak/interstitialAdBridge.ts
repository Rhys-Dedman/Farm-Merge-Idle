/**
 * Plug-and-play interstitial (ad-break) SDK bridge.
 *
 * WHEN WIRING REAL ADS:
 * 1. Keep calling this from `InterstitialAdLayer` (do not bypass App timing).
 * 2. Replace the stub `show` / `cancel` bodies with your SDK (AdMob, ironSource, etc.).
 * 3. Call `callbacks.onOpened()` once the creative is on-screen (covers loading plate).
 * 4. Call `callbacks.onClosed(result)` when the ad finishes, fails, or is dismissed.
 *
 * Timing contract: `show()` is only invoked AFTER the ad-break fade-to-black completes.
 * The loading plate ("Ad Loading…" / "Return To Game") stays underneath this layer.
 *
 * Close results:
 * - `completed` / `skipped` / `failed` → App dismisses plate + fades gameplay in
 * - `no_fill` → App keeps loading plate so Return To Game still works
 * - `cancelled` → reserved; App cancel path does not use onClosed
 */

export type InterstitialAdCloseResult =
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'no_fill'
  | 'cancelled';

export interface InterstitialAdShowCallbacks {
  /** Real creative is visible and covering the loading plate. */
  onOpened: () => void;
  /** Ad session ended — App dismisses loading plate + fades gameplay back in. */
  onClosed: (result: InterstitialAdCloseResult) => void;
}

export interface InterstitialAdBridge {
  /**
   * Request / show an interstitial above the ad-break loading plate.
   * Must be safe to call every ad break; cancel any previous in-flight show first.
   */
  show: (callbacks: InterstitialAdShowCallbacks) => void;
  /** Abort in-flight show (e.g. player tapped Return To Game on the loading plate). */
  cancel: () => void;
}

let activeCallbacks: InterstitialAdShowCallbacks | null = null;

/**
 * Stub bridge — no real ads yet.
 * Loading plate remains visible; player uses Return To Game / timeout escape.
 * Swap this implementation when the SDK is ready (same function signatures).
 */
export const interstitialAdBridge: InterstitialAdBridge = {
  show(callbacks) {
    activeCallbacks = callbacks;
    // TODO(real-ads): preload/show interstitial here, then:
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
export function clearInterstitialAdBridgeSession(): void {
  activeCallbacks = null;
}
