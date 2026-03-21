/**
 * Single real-money coin offer row (ui_store_small). Layout is self-contained — only props/config change when reordering.
 */
import React, { useState } from 'react';
import { assetPath } from '../utils/assetPath';
import { STORE_COIN_OFFER_HEADER_ICON_PX, type StoreCoinOfferConfig } from '../offers';
import { Reward } from './Reward';

/** Base = half of free-offer icon; +25% per store layout. */
const HEADER_ICON_PX = STORE_COIN_OFFER_HEADER_ICON_PX * 1.25;

/** Settings popup title: font-black + Inter + tracking-tight; these are the coin-offer overrides. */
const TITLE_STYLE: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 16,
  color: '#62873b',
};

/** Green fill; border/outline/depth match StoreFreeOffer FREE button (orange → green). */
const PURCHASE_BG = '#b8d458';
const PURCHASE_BORDER = '#8fb33a';
const PURCHASE_TEXT = '#4a6b1e';
const PURCHASE_PRESSED_BG = '#9fc044';

export interface StoreCoinOfferProps {
  config: StoreCoinOfferConfig;
  onPurchase?: (id: string) => void;
  className?: string;
}

export const StoreCoinOffer: React.FC<StoreCoinOfferProps> = ({ config, onPurchase, className = '' }) => {
  const [pressed, setPressed] = useState(false);
  const { id, title, headerIcon, offerLineText, durationText, priceLabel } = config;

  return (
    <div className={`relative w-[440px] max-w-full flex-shrink-0 ${className}`}>
      <img
        src={assetPath('/assets/topui/ui_store_small.png')}
        alt=""
        className="w-full h-auto block pointer-events-none select-none"
      />
      <div className="absolute inset-0 flex flex-col pointer-events-none select-none">
        {/* Title — left, heavy left padding (independent band) */}
        <div
          className="shrink-0 w-full flex items-start justify-start box-border"
          style={{
            paddingTop: 16,
            paddingBottom: 3,
            paddingLeft: 110,
            paddingRight: 16,
            minHeight: 44,
          }}
        >
          <h2
            className="font-black tracking-tight text-left leading-tight"
            style={{ ...TITLE_STYLE, transform: 'translateY(1px)' }}
          >
            {title}
          </h2>
        </div>

        {/* Middle band: main product icon + Reward strip (coin, line, divider, duration, pill) */}
        <div className="flex-1 min-h-0 w-full relative flex flex-row items-center">
          <div
            className="relative z-[2] flex items-center justify-center shrink-0 self-center box-border"
            style={{ paddingLeft: 52, transform: 'translate(-24px, -20px)' }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{ width: HEADER_ICON_PX, height: HEADER_ICON_PX }}
            >
              <img
                src={assetPath(headerIcon)}
                alt=""
                className="object-contain block max-w-none max-h-none"
                style={{ width: HEADER_ICON_PX, height: HEADER_ICON_PX }}
              />
            </div>
          </div>

          <Reward offerLineText={offerLineText} durationText={durationText} />
        </div>

        {/* Purchase — bottom right */}
        <div className="absolute z-[2] pointer-events-none" style={{ bottom: 26, right: 27 }}>
          <button
            type="button"
            className="pointer-events-auto flex items-center justify-center px-[8px] rounded-[9px] transition-all border outline outline-1"
            style={{
              height: 36,
              backgroundColor: pressed ? PURCHASE_PRESSED_BG : PURCHASE_BG,
              borderColor: PURCHASE_BORDER,
              borderBottomWidth: pressed ? 0 : 4,
              marginBottom: pressed ? 4 : 0,
              outlineColor: PURCHASE_BORDER,
              minWidth: '86px',
              transform: pressed ? 'translateY(2px)' : 'translateY(0)',
              boxShadow: pressed
                ? 'inset 0 2px 4px rgba(0,0,0,0.15)'
                : 'inset 0 1px 1px rgba(255,255,255,0.4)',
              cursor: 'pointer',
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              setPressed(true);
            }}
            onPointerUp={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
            onClick={(e) => {
              e.stopPropagation();
              onPurchase?.(id);
            }}
          >
            <span className="text-[15px] font-black tracking-tight leading-none" style={{ color: PURCHASE_TEXT }}>
              {priceLabel}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
