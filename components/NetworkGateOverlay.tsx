/**
 * Offline / VPN gate — Discovery-style popup (Arena §10).
 * No X / no backdrop dismiss. Frontmost so limited offers etc. cannot cover it.
 * Auto-hides when `blocked` becomes false (connection restored).
 */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { APP_VERSION } from '../constants/appVersion';
import { assetPath } from '../utils/assetPath';
import { FtuePopup } from './FtuePopup';

const DEV_TOOLS_VERSION_TAP_COUNT = 7;
const DEV_TOOLS_VERSION_TAP_WINDOW_MS = 2500;

const HEADER_ICON = assetPath('/assets/icons/upgrades/icon_happycustomer.png');

export const NETWORK_GATE_TITLE = 'No Connection';
export const NETWORK_GATE_DESCRIPTION =
  'Please check your connection and reconnect to the internet';
export const NETWORK_GATE_BUTTON = 'Reconnect';

/** Above garden-switch (5000), FX (600), and modal portal (220). */
const NETWORK_GATE_Z_INDEX = 10000;

export interface NetworkGateOverlayProps {
  blocked: boolean;
  onRetry: () => void;
  appScale?: number;
  /** 7× version taps — unlock / open Dev Tools for QA while gated. */
  onVersionUnlockDevTools?: () => void;
}

export const NetworkGateOverlay: React.FC<NetworkGateOverlayProps> = ({
  blocked,
  onRetry,
  appScale = 1,
  onVersionUnlockDevTools,
}) => {
  const [mounted, setMounted] = useState(blocked);
  const tapCountRef = useRef(0);
  const tapWindowTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (blocked) setMounted(true);
  }, [blocked]);

  useEffect(() => {
    return () => {
      if (tapWindowTimeoutRef.current != null) {
        window.clearTimeout(tapWindowTimeoutRef.current);
      }
    };
  }, []);

  const onVersionTap = () => {
    tapCountRef.current += 1;
    if (tapWindowTimeoutRef.current != null) {
      window.clearTimeout(tapWindowTimeoutRef.current);
    }
    tapWindowTimeoutRef.current = window.setTimeout(() => {
      tapCountRef.current = 0;
      tapWindowTimeoutRef.current = null;
    }, DEV_TOOLS_VERSION_TAP_WINDOW_MS);

    if (tapCountRef.current >= DEV_TOOLS_VERSION_TAP_COUNT) {
      tapCountRef.current = 0;
      if (tapWindowTimeoutRef.current != null) {
        window.clearTimeout(tapWindowTimeoutRef.current);
        tapWindowTimeoutRef.current = null;
      }
      onVersionUnlockDevTools?.();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0"
      style={{ zIndex: NETWORK_GATE_Z_INDEX, pointerEvents: 'auto' }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="network-gate-title"
    >
      <FtuePopup
        isVisible={blocked}
        onClose={() => setMounted(false)}
        blockBackdropClick
        header={{ icon: HEADER_ICON }}
        title={NETWORK_GATE_TITLE}
        titleFontSizeRem={4.5}
        showDivider
        description={NETWORK_GATE_DESCRIPTION}
        button={{ text: NETWORK_GATE_BUTTON }}
        onPrimaryAction={onRetry}
        backdropOpacity={1 - (1 - 0.7) / 2}
        burstWidth={260}
        burstHeight={320}
        appScale={appScale}
      />
      {/* Hidden QA unlock (Settings-style 7× version taps) — gate sits above Debug Menu. */}
      <button
        type="button"
        onClick={onVersionTap}
        className="absolute bottom-3 left-0 right-0 text-center text-[10px]"
        style={{ color: 'rgba(255,255,255,0.25)', zIndex: 2 }}
        aria-label={`App version v${APP_VERSION}`}
      >
        {`v${APP_VERSION}`}
      </button>
    </div>,
    document.body,
  );
};
