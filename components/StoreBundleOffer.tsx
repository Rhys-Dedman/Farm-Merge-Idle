/**
 * Store bundle row (`ui_store_large`) — same overlay layout as coin boosters, from top of sprite.
 */
import React, { useState } from 'react';
import { assetPath } from '../utils/assetPath';
import type { StoreBundleOfferConfig } from '../offers';
import { Reward } from './Reward';
import {
  STORE_BUNDLE_CARD_ICON_WRAP,
  STORE_BUNDLE_CARD_PURCHASE_ANCHOR,
  STORE_BUNDLE_CARD_TITLE_STYLE,
  STORE_BUNDLE_OFFER_ROW_SCALE,
  STORE_BUNDLE_CARD_REWARD_STRIP_TRANSLATE_Y_PX,
  STORE_BUNDLE_REWARD_FIRST_ROW_HEIGHT_PX,
  STORE_BUNDLE_REWARD_FOLLOWING_ROW_HEIGHT_PX,
  STORE_BUNDLE_REWARD_PILL_GAP_PX,
  STORE_BUNDLE_REWARD_SECOND_ROW_MARGIN_TOP_PX,
  storeBundleRewardOverlayHeightPx,
  STORE_OFFER_CARD_HEADER_ICON_PX,
  STORE_OFFER_CARD_PURCHASE_BG,
  STORE_OFFER_CARD_PURCHASE_BORDER,
  STORE_OFFER_CARD_PURCHASE_PRESSED_BG,
  STORE_OFFER_CARD_PURCHASE_TEXT,
  STORE_OFFER_CARD_TITLE_BAND,
  STORE_OFFER_CARD_TITLE_TRANSLATE_Y_PX,
} from '../constants/storeOfferCardLayout';

const CARD_WIDTH_PX = 440;

export interface StoreBundleOfferProps {
  config: StoreBundleOfferConfig;
  onPurchase?: (id: string) => void;
  className?: string;
}

export const StoreBundleOffer: React.FC<StoreBundleOfferProps> = ({ config, onPurchase, className = '' }) => {
  const [pressed, setPressed] = useState(false);
  const { id, title, headerIcon, offerLineText, durationText, priceLabel, extraRewardRows = [] } = config;

  const rewardRows = [
    { offerLineText, durationText },
    ...extraRewardRows.map((r) => ({ offerLineText: r.offerLineText, durationText: r.durationText })),
  ];
  const rewardOverlayHeightPx = storeBundleRewardOverlayHeightPx(rewardRows.length);

  return (
    <div className={`flex w-full justify-center flex-shrink-0 ${className}`}>
      <div
        style={{
          width: CARD_WIDTH_PX,
          transform: `scale(${STORE_BUNDLE_OFFER_ROW_SCALE})`,
          transformOrigin: 'top center',
        }}
      >
        <div className="relative max-w-full flex-shrink-0" style={{ width: CARD_WIDTH_PX, overflow: 'visible' }}>
        <img
          src={assetPath('/assets/topui/ui_store_large.png')}
          alt=""
          className="w-full h-auto block pointer-events-none select-none"
        />
        <div
          className="absolute inset-0 flex flex-col pointer-events-none select-none"
          style={{ overflow: 'visible' }}
        >
          <div
            className="shrink-0 w-full flex items-start justify-start box-border"
            style={{ ...STORE_OFFER_CARD_TITLE_BAND }}
          >
            <h2
              className="text-left leading-tight"
              style={{
                ...STORE_BUNDLE_CARD_TITLE_STYLE,
                transform: `translateY(${STORE_OFFER_CARD_TITLE_TRANSLATE_Y_PX}px)`,
              }}
            >
              {title}
            </h2>
          </div>

          <div
            className="flex-1 min-h-0 w-full relative flex flex-row items-start overflow-visible"
          >
            <div
              className="relative z-[2] flex shrink-0 self-start items-center justify-center box-border overflow-visible"
              style={{ ...STORE_BUNDLE_CARD_ICON_WRAP }}
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
              className="pointer-events-none absolute left-0 right-0 top-0 z-[1] overflow-visible flex flex-col"
              style={{
                height: rewardOverlayHeightPx,
                transform: `translateY(${STORE_BUNDLE_CARD_REWARD_STRIP_TRANSLATE_Y_PX}px)`,
              }}
            >
              {rewardRows.map((row, idx) => (
                <div
                  key={idx}
                  className="relative w-full shrink-0 overflow-visible"
                  style={{
                    height: idx === 0 ? STORE_BUNDLE_REWARD_FIRST_ROW_HEIGHT_PX : STORE_BUNDLE_REWARD_FOLLOWING_ROW_HEIGHT_PX,
                    marginTop:
                      idx === 0
                        ? 0
                        : idx === 1
                          ? STORE_BUNDLE_REWARD_SECOND_ROW_MARGIN_TOP_PX
                          : STORE_BUNDLE_REWARD_PILL_GAP_PX,
                  }}
                >
                  <Reward offerLineText={row.offerLineText} durationText={row.durationText} />
                </div>
              ))}
            </div>
          </div>

          <div
            className="absolute z-[2] pointer-events-none"
            style={{
              bottom: STORE_BUNDLE_CARD_PURCHASE_ANCHOR.bottom,
              right: STORE_BUNDLE_CARD_PURCHASE_ANCHOR.right,
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
              <span className="text-[15px] font-black tracking-tight leading-none" style={{ color: STORE_OFFER_CARD_PURCHASE_TEXT }}>
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
