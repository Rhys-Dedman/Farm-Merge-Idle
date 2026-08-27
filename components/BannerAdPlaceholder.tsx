/**
 * Placeholder strip for the bottom banner ad region (below Navbar — bottom-most chrome).
 * Real AdMob / MAX banner mounts here later; keep height = BANNER_AD_RESERVE_HEIGHT_PX.
 *
 * Z-order: above navbar tabs / gameplay chrome, below FTUE (100), ads (115+), and popups (220).
 */
import React from 'react';
import { BANNER_AD_RESERVE_HEIGHT_PX } from '../constants/bannerAdLayout';

/** Above Navbar (z-50); below FTUE portal (100). */
const BANNER_AD_Z_INDEX = 90;

export const BannerAdPlaceholder: React.FC = () => {
  return (
    <div
      id="banner-ad-slot"
      className="relative shrink-0 w-full flex items-center justify-center select-none"
      style={{
        height: BANNER_AD_RESERVE_HEIGHT_PX,
        backgroundColor: '#ff00aa',
        zIndex: BANNER_AD_Z_INDEX,
        pointerEvents: 'none',
      }}
      aria-hidden
    >
      <span
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 900,
          fontSize: 14,
          letterSpacing: '0.04em',
          color: '#ffffff',
        }}
      >
        Banner Ad
      </span>
    </div>
  );
};
