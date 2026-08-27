/**
 * Dev Tools interstitial bypass — disables forced ad breaks when ON.
 * (Rewarded auto-grant is handled by Debug Menu grant buttons.)
 */
let interstitialBypass = false;

export function getInterstitialBypass(): boolean {
  return interstitialBypass;
}

export function setInterstitialBypass(on: boolean): void {
  interstitialBypass = on;
}
