/**
 * Real interstitial ad layer — sits ABOVE the ad-break loading plate (`FakeAdPopup`).
 *
 * Plug-and-play spot for SDK creatives:
 * - Mounted only after fade-to-black (`active` becomes true from App).
 * - Calls `interstitialAdBridge.show()` on activate.
 * - While `covering` (SDK reported onOpened), blocks input to the loading plate / Return To Game.
 * - On SDK close → `onClosed` → App fades out black and resumes gameplay.
 *
 * Wire real ads in `utils/adBreak/interstitialAdBridge.ts` only — leave this component as the slot.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  clearInterstitialAdBridgeSession,
  interstitialAdBridge,
  type InterstitialAdCloseResult,
} from '../utils/adBreak/interstitialAdBridge';

export interface InterstitialAdLayerProps {
  /** True once ad-break intro finished and loading plate is up. */
  active: boolean;
  /** Fired when the real ad session ends (or stub never opened and App cancels). */
  onClosed: (result: InterstitialAdCloseResult) => void;
}

/** z-index above FakeAdPopup (117) and AdBreakIntroOverlay (115). */
export const INTERSTITIAL_AD_LAYER_Z_INDEX = 120;

export const InterstitialAdLayer: React.FC<InterstitialAdLayerProps> = ({
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
      clearInterstitialAdBridgeSession();
      return;
    }

    const sessionId = ++sessionIdRef.current;
    setCovering(false);

    interstitialAdBridge.show({
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
      // Session superseded / unmounted — drop callbacks; App owns cancel via Return To Game.
      if (sessionIdRef.current === sessionId) {
        clearInterstitialAdBridgeSession();
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      id="interstitial-ad-layer"
      data-ad-slot="interstitial"
      className="fixed inset-0"
      style={{
        zIndex: INTERSTITIAL_AD_LAYER_Z_INDEX,
        // Stub: pass-through so Return To Game works.
        // When SDK calls onOpened, covering=true blocks the loading plate underneath.
        pointerEvents: covering ? 'auto' : 'none',
        backgroundColor: covering ? '#000' : 'transparent',
      }}
      aria-hidden={!covering}
    >
      {/*
        REAL AD MOUNT POINT
        Prefer SDK fullscreen APIs from interstitialAdBridge.ts.
        If your SDK needs a DOM host, render/attach it inside this node.
      */}
      <div id="interstitial-ad-mount" className="absolute inset-0" />
    </div>
  );
};
