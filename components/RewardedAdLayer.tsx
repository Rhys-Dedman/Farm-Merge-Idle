/**
 * Real rewarded ad layer — sits ABOVE the rewarded loading plate (`FakeAdPopup`).
 *
 * Plug-and-play spot for SDK creatives:
 * - Mounted only after fade-to-black (`active` becomes true from App).
 * - Calls `rewardedAdBridge.show()` on activate.
 * - While `covering` (SDK reported onOpened), blocks input to the loading plate / Claim Reward.
 * - On SDK close → `onClosed` → App continues reward flow + fades gameplay back in.
 *
 * Wire real ads in `utils/adBreak/rewardedAdBridge.ts` only — leave this component as the slot.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  clearRewardedAdBridgeSession,
  rewardedAdBridge,
  type RewardedAdCloseResult,
} from '../utils/adBreak/rewardedAdBridge';

export interface RewardedAdLayerProps {
  /** True once rewarded fade-to-black finished and loading plate is up. */
  active: boolean;
  /** Fired when the real ad session ends (or stub never opened and App cancels). */
  onClosed: (result: RewardedAdCloseResult) => void;
}

/** z-index above FakeAdPopup (117) — same band as interstitial slot. */
export const REWARDED_AD_LAYER_Z_INDEX = 120;

export const RewardedAdLayer: React.FC<RewardedAdLayerProps> = ({
  active,
  onClosed,
}) => {
  const [covering, setCovering] = useState(false);
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;
  const sessionIdRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setCovering(false);
      clearRewardedAdBridgeSession();
      return;
    }

    const sessionId = ++sessionIdRef.current;
    setCovering(false);

    rewardedAdBridge.show({
      onOpened: () => {
        if (sessionIdRef.current !== sessionId) return;
        setCovering(true);
      },
      onClosed: (result) => {
        if (sessionIdRef.current !== sessionId) return;
        setCovering(false);
        onClosedRef.current(result);
      },
    });

    return () => {
      if (sessionIdRef.current === sessionId) {
        clearRewardedAdBridgeSession();
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      id="rewarded-ad-layer"
      data-ad-slot="rewarded"
      className="fixed inset-0"
      style={{
        zIndex: REWARDED_AD_LAYER_Z_INDEX,
        pointerEvents: covering ? 'auto' : 'none',
        backgroundColor: covering ? '#000' : 'transparent',
      }}
      aria-hidden={!covering}
    >
      {/*
        REAL REWARDED AD MOUNT POINT
        Prefer SDK fullscreen APIs from rewardedAdBridge.ts.
        If your SDK needs a DOM host, render/attach it inside this node.
      */}
      <div id="rewarded-ad-mount" className="absolute inset-0" />
    </div>
  );
};
