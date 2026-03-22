/**
 * Single real-money coin offer row (ui_store_small). Layout is self-contained — only props/config change when reordering.
 */
import React, { useState } from 'react';
import { assetPath } from '../utils/assetPath';
import type { StoreCoinOfferConfig } from '../offers';
import { Reward } from './Reward';
import {
  STORE_COIN_OFFER_ROW_SCALE,
  STORE_COIN_PACK_TITLE_STYLE,
  STORE_COIN_PACK_TITLE_TRANSLATE_Y_PX,
  STORE_OFFER_CARD_HEADER_ICON_PX,
  STORE_OFFER_CARD_ICON_WRAP,
  STORE_OFFER_CARD_PURCHASE_ANCHOR,
  STORE_OFFER_CARD_PURCHASE_BG,
  STORE_OFFER_CARD_PURCHASE_BORDER,
  STORE_OFFER_CARD_PURCHASE_PRESSED_BG,
  STORE_OFFER_CARD_PURCHASE_TEXT,
  STORE_OFFER_CARD_REWARD_STRIP_TRANSLATE_Y_PX,
  STORE_OFFER_CARD_TITLE_BAND,
} from '../constants/storeOfferCardLayout';
/** Space below each row in the layout flow. */
const STORE_SMALL_ROW_MARGIN_BOTTOM_PX = 0;

const STORE_COIN_ROW_BACKGROUND_DEFAULT = '/assets/topui/ui_store_small.png';

export interface StoreCoinOfferProps {
  config: StoreCoinOfferConfig;
  onPurchase?: (id: string) => void;
  className?: string;
}

export const StoreCoinOffer: React.FC<StoreCoinOfferProps> = ({ config, onPurchase, className = '' }) => {
  const [pressed, setPressed] = useState(false);
  const {
    id,
    title,
    titleColor,
    headerIcon,
    offerLineText,
    durationText,
    priceLabel,
    rowBackgroundAsset = STORE_COIN_ROW_BACKGROUND_DEFAULT,
    rewardStripIconPath,
  } = config;

  return (
    <div
      className={`flex w-full justify-center flex-shrink-0 ${className}`}
      style={{ marginBottom: STORE_SMALL_ROW_MARGIN_BOTTOM_PX }}
    >
      <div
        style={{
          width: 440,
          transform: `scale(${STORE_COIN_OFFER_ROW_SCALE})`,
          transformOrigin: 'top center',
        }}
      >
        <div className="relative w-[440px] max-w-full flex-shrink-0">
          <img
            src={assetPath(rowBackgroundAsset)}
            alt=""
            className="w-full h-auto block pointer-events-none select-none"
          />
          <div className="absolute inset-0 flex flex-col pointer-events-none select-none">
            {/* Title — left, heavy left padding (independent band) */}
            <div className="shrink-0 w-full flex items-start justify-start box-border" style={{ ...STORE_OFFER_CARD_TITLE_BAND }}>
              <h2
                className="text-left leading-tight"
                style={{
                  ...STORE_COIN_PACK_TITLE_STYLE,
                  ...(titleColor ? { color: titleColor } : {}),
                  transform: `translateY(${STORE_COIN_PACK_TITLE_TRANSLATE_Y_PX}px)`,
                }}
              >
                {title}
              </h2>
            </div>

            {/* Middle band: main product icon + Reward strip (coin, line, divider, duration, pill) */}
            <div className="flex-1 min-h-0 w-full relative flex flex-row items-center">
              <div
                className="relative z-[2] flex items-center justify-center shrink-0 self-center box-border"
                style={{ ...STORE_OFFER_CARD_ICON_WRAP }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{ width: STORE_OFFER_CARD_HEADER_ICON_PX, height: STORE_OFFER_CARD_HEADER_ICON_PX }}
                >
                  <img
                    src={assetPath(headerIcon)}
                    alt=""
                    className="object-contain block max-w-none max-h-none"
                    style={{ width: STORE_OFFER_CARD_HEADER_ICON_PX, height: STORE_OFFER_CARD_HEADER_ICON_PX }}
                  />
                </div>
              </div>

              <div
                className="pointer-events-none absolute inset-0"
                style={{ transform: `translateY(${STORE_OFFER_CARD_REWARD_STRIP_TRANSLATE_Y_PX}px)` }}
              >
                <Reward
                  offerLineText={offerLineText}
                  durationText={durationText}
                  coinIconPath={rewardStripIconPath}
                />
              </div>
            </div>

            {/* Purchase — bottom right */}
            <div
              className="absolute z-[2] pointer-events-none"
              style={{
                bottom: STORE_OFFER_CARD_PURCHASE_ANCHOR.bottom,
                right: STORE_OFFER_CARD_PURCHASE_ANCHOR.right,
              }}
            >
              <button
                type="button"
                className="pointer-events-auto flex items-center justify-center px-[8px] rounded-[9px] transition-all border outline outline-1"
                style={{
                  height: 36,
                  backgroundColor: pressed ? STORE_OFFER_CARD_PURCHASE_PRESSED_BG : STORE_OFFER_CARD_PURCHASE_BG,
                  borderColor: STORE_OFFER_CARD_PURCHASE_BORDER,
                  borderBottomWidth: pressed ? 0 : 4,
                  marginBottom: pressed ? 4 : 0,
                  outlineColor: STORE_OFFER_CARD_PURCHASE_BORDER,
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
                <span
                  className="text-[15px] font-black tracking-tight leading-none"
                  style={{ color: STORE_OFFER_CARD_PURCHASE_TEXT }}
                >
                  {priceLabel}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
