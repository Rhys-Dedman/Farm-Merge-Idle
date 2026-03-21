/**
 * **Reward** — reusable UI strip: pill panel + coin icon + reward line text + vertical divider + duration.
 *
 * Use in store coin rows, bundles, or anywhere you need 1–N reward lines:
 * - Render one `<Reward />` per reward; each instance is self-contained.
 * - For multiple rewards in one card, stack vertically (e.g. separate `absolute` bands with different `top`
 *   or wrap each in a row with its own `relative` + height) and duplicate props per reward.
 *
 * Layout constants are internal; adjust this file to retune all Reward instances at once.
 */
import React from 'react';
import { assetPath } from '../utils/assetPath';

const MIDDLE_ROW_Y_SHIFT = -7;

/** Nudge entire reward strip (pill + coin + text + divider + duration). */
const REWARD_SECTION_OFFSET_X_PX = -1;

const COIN_ICON_LEFT_PX = 114;
const COIN_ICON_TOP_ADJ_PX = 0;

const OFFER_LINE_LEFT_PX = 144;
const OFFER_LINE_TOP_ADJ_PX = 0;
const OFFER_LINE_MAX_WIDTH_PX = 150;

const DURATION_LEFT_PX = 268;
const DURATION_TOP_ADJ_PX = 0;
const DURATION_BOX_MAX_WIDTH_PX = 42;

const OFFER_DURATION_DIVIDER_LEFT_PX = 262;
const OFFER_DURATION_DIVIDER_WIDTH_PX = 3;
const OFFER_DURATION_DIVIDER_HEIGHT_PX = 20;
const OFFER_DURATION_DIVIDER_COLOR = '#fff7d5';
const OFFER_DURATION_DIVIDER_TOP_ADJ_PX = 0;

const COIN_ROW_PILL_LEFT_PX = 110;
const COIN_ROW_PILL_WIDTH_PX = 206;
const COIN_ROW_PILL_HEIGHT_PX = 34;

/** Inline box width — must match `layout="inline"` root width below. */
export const REWARD_INLINE_WIDTH_PX = 440;

/** Shift whole strip so pill center lines up with inline box center (for popup centering). */
export const REWARD_INLINE_PILL_ALIGN_TRANSLATE_X_PX =
  REWARD_INLINE_WIDTH_PX / 2 - (COIN_ROW_PILL_LEFT_PX + COIN_ROW_PILL_WIDTH_PX / 2);
const COIN_ROW_PILL_FILL = '#f4e6b9';
const COIN_ROW_PILL_STROKE = '#fff7d5';
const COIN_ROW_PILL_STROKE_PX = 2;

const REWARD_LINE_TEXT_STYLE: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 13,
  color: '#6c5851',
};

const DURATION_TEXT_STYLE: React.CSSProperties = {
  color: '#d3b07b',
  fontSize: 13,
};

const COIN_ROW_ICON_PX = 22 * 1.2;

function rowItemTransform(topAdjPx: number): React.CSSProperties {
  return {
    top: '50%',
    transform: `translateY(calc(-50% + ${MIDDLE_ROW_Y_SHIFT + topAdjPx}px))`,
  };
}

export interface RewardProps {
  /** Main reward label (e.g. boost name). */
  offerLineText: string;
  /** Duration string (e.g. `120s`), styled like store free-offer duration. */
  durationText: string;
  /** Optional coin / currency icon path (passed to `assetPath`). */
  coinIconPath?: string;
  className?: string;
  /**
   * `storeCard` — absolute overlay on full store row (default).
   * `inline` — relative strip (e.g. purchase-success popup); same art, fixed 440×44 box.
   */
  layout?: 'storeCard' | 'inline';
}

export const Reward: React.FC<RewardProps> = ({
  offerLineText,
  durationText,
  coinIconPath = '/assets/icons/icon_coin.png',
  className = '',
  layout = 'storeCard',
}) => {
  const isInline = layout === 'inline';
  return (
    <div
      className={`reward pointer-events-none select-none ${isInline ? 'relative' : 'absolute inset-0'} ${className}`.trim()}
      data-reward=""
      style={{
        transform: isInline
          ? `translateX(${REWARD_INLINE_PILL_ALIGN_TRANSLATE_X_PX}px)`
          : `translateX(${REWARD_SECTION_OFFSET_X_PX}px)`,
        ...(isInline ? { width: REWARD_INLINE_WIDTH_PX, height: 44, marginLeft: 'auto', marginRight: 'auto' } : {}),
      }}
    >
      {/* Pill — behind text row */}
      <div
        aria-hidden
        className="absolute z-0 rounded-full box-border"
        style={{
          left: COIN_ROW_PILL_LEFT_PX,
          width: COIN_ROW_PILL_WIDTH_PX,
          height: COIN_ROW_PILL_HEIGHT_PX,
          backgroundColor: COIN_ROW_PILL_FILL,
          border: `${COIN_ROW_PILL_STROKE_PX}px solid ${COIN_ROW_PILL_STROKE}`,
          ...rowItemTransform(0),
        }}
      />

      <div
        className="absolute z-[1] flex items-center justify-center"
        style={{ left: COIN_ICON_LEFT_PX, ...rowItemTransform(COIN_ICON_TOP_ADJ_PX) }}
      >
        <img
          src={assetPath(coinIconPath)}
          alt=""
          className="object-contain flex-shrink-0 pointer-events-none"
          style={{ width: COIN_ROW_ICON_PX, height: COIN_ROW_ICON_PX }}
        />
      </div>

      <div
        className="absolute z-[1] flex items-center justify-center overflow-hidden rounded-[4px] px-2 py-0.5"
        style={{
          left: OFFER_LINE_LEFT_PX,
          ...rowItemTransform(OFFER_LINE_TOP_ADJ_PX),
          maxWidth: OFFER_LINE_MAX_WIDTH_PX,
        }}
      >
        <span className="font-black leading-none whitespace-nowrap text-center" style={REWARD_LINE_TEXT_STYLE}>
          {offerLineText}
        </span>
      </div>

      <div
        aria-hidden
        className="absolute z-[1] shrink-0"
        style={{
          left: OFFER_DURATION_DIVIDER_LEFT_PX,
          width: OFFER_DURATION_DIVIDER_WIDTH_PX,
          height: OFFER_DURATION_DIVIDER_HEIGHT_PX,
          backgroundColor: OFFER_DURATION_DIVIDER_COLOR,
          borderRadius: 1.5,
          ...rowItemTransform(OFFER_DURATION_DIVIDER_TOP_ADJ_PX),
        }}
      />

      <div
        className="absolute z-[1] flex items-center justify-center overflow-hidden rounded-[4px] py-0.5"
        style={{
          left: DURATION_LEFT_PX,
          ...rowItemTransform(DURATION_TOP_ADJ_PX),
          paddingLeft: 6,
          paddingRight: 6,
          minWidth: 28,
          maxWidth: DURATION_BOX_MAX_WIDTH_PX,
        }}
      >
        <span className="font-black leading-none whitespace-nowrap" style={DURATION_TEXT_STYLE}>
          {durationText}
        </span>
      </div>
    </div>
  );
};
