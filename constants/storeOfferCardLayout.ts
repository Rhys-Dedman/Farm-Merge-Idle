/**
 * Shared overlay layout for `ui_store_small` and `ui_store_large` store rows.
 * Distances are from the top of the sprite (title band) or from bottom/right (purchase chip).
 */
import type { CSSProperties } from 'react';
import { STORE_COIN_OFFER_HEADER_ICON_PX } from '../offers';

/** Main product art — same formula as coin rows. */
export const STORE_OFFER_CARD_HEADER_ICON_PX = STORE_COIN_OFFER_HEADER_ICON_PX * 1.25;

/** Bundle header: two icons stacked; each drawn at 95% of main header icon slot. */
export const STORE_BUNDLE_STACKED_ICON_GAP_PX = 6;
export const STORE_BUNDLE_STACKED_HEADER_ICON_PX = Math.round(STORE_OFFER_CARD_HEADER_ICON_PX * 0.95);
/** Per-icon vertical nudge (transform only; flex layout unchanged). */
export const STORE_BUNDLE_STACKED_TOP_ICON_TRANSLATE_Y_PX = -8;
export const STORE_BUNDLE_STACKED_BOTTOM_ICON_TRANSLATE_Y_PX = -1;

/** Bundle / shared title look (unscaled). Coin row applies `STORE_COIN_OFFER_ROW_SCALE` to the whole card. */
export const STORE_OFFER_CARD_TITLE_STYLE: CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 16,
  fontWeight: 900,
  letterSpacing: '-0.02em',
  color: '#62873b',
};

/**
 * Coin pack row scales the whole sprite with `STORE_COIN_OFFER_ROW_SCALE`; shrink title so it matches the
 * bundle title on screen (same boldness/tracking as `STORE_OFFER_CARD_TITLE_STYLE`).
 */
export const STORE_COIN_OFFER_ROW_SCALE = 1.03;
/** Bundle large-card row — independent from coin row scale. */
export const STORE_BUNDLE_OFFER_ROW_SCALE = 1.02;
export const STORE_COIN_PACK_TITLE_STYLE: CSSProperties = {
  ...STORE_OFFER_CARD_TITLE_STYLE,
  fontSize: `${16 / STORE_COIN_OFFER_ROW_SCALE}px`,
};

/** Bundle title: pre-scaled font + blue (card is scaled `STORE_BUNDLE_OFFER_ROW_SCALE`). */
export const STORE_BUNDLE_CARD_TITLE_STYLE: CSSProperties = {
  ...STORE_OFFER_CARD_TITLE_STYLE,
  fontSize: `${16 / STORE_BUNDLE_OFFER_ROW_SCALE}px`,
  color: '#4681aa',
};

/** Fine nudge on bundle `<h2>`. */
export const STORE_OFFER_CARD_TITLE_TRANSLATE_Y_PX = 3;

/** Coin pack title — 2px higher than bundle (same logical layout, scaled row). */
export const STORE_COIN_PACK_TITLE_TRANSLATE_Y_PX = STORE_OFFER_CARD_TITLE_TRANSLATE_Y_PX - 2;

/** Title row — padding/minHeight measured from top of card. */
export const STORE_OFFER_CARD_TITLE_BAND = {
  paddingTop: 16,
  paddingBottom: 3,
  paddingLeft: 110,
  paddingRight: 16,
  minHeight: 44,
} as const;

/** Main icon cluster — coin / no-ads small store rows (`StoreCoinOffer`). */
export const STORE_OFFER_CARD_ICON_WRAP: Pick<CSSProperties, 'paddingLeft' | 'transform'> = {
  paddingLeft: 52,
  transform: 'translate(-22px, -22px)',
};

/** Bundle main icon — +20px down vs coin row baseline; tweak X/Y to nudge cluster. */
export const STORE_BUNDLE_CARD_ICON_WRAP: Pick<CSSProperties, 'paddingLeft' | 'transform'> = {
  paddingLeft: 52,
  transform: 'translate(-22px, -10px)',
};

/** Nudge the `<Reward />` strip upward (px) — coin rows. */
export const STORE_OFFER_CARD_REWARD_STRIP_TRANSLATE_Y_PX = -4;

/** Bundle reward overlay — 30px further up than coin strip nudge. */
export const STORE_BUNDLE_CARD_REWARD_STRIP_TRANSLATE_Y_PX =
  STORE_OFFER_CARD_REWARD_STRIP_TRANSLATE_Y_PX - 30;

/**
 * Bundle rewards: first row keeps the 132px slot (pill vertically centered). Matches `Reward` pill height.
 * Rows 2+ use tight bands; `STORE_BUNDLE_REWARD_PILL_GAP_PX` is the space from pill bottom → next pill top.
 */
export const STORE_BUNDLE_REWARD_FIRST_ROW_HEIGHT_PX = 132;
/** Same as `Reward` `COIN_ROW_PILL_HEIGHT_PX` — row band height for stacked strips. */
export const STORE_BUNDLE_REWARD_PILL_HEIGHT_PX = 34;
export const STORE_BUNDLE_REWARD_FOLLOWING_ROW_HEIGHT_PX = STORE_BUNDLE_REWARD_PILL_HEIGHT_PX;
export const STORE_BUNDLE_REWARD_PILL_GAP_PX = 4;

const STORE_BUNDLE_PILL1_BOTTOM_PX =
  STORE_BUNDLE_REWARD_FIRST_ROW_HEIGHT_PX / 2 + STORE_BUNDLE_REWARD_PILL_HEIGHT_PX / 2;
const STORE_BUNDLE_ROW2_TOP_PX = STORE_BUNDLE_PILL1_BOTTOM_PX + STORE_BUNDLE_REWARD_PILL_GAP_PX;

/** Pulls row 2 up so its pill starts `PILL_GAP_PX` under pill 1 (flex `gap` would leave ~49px empty). */
export const STORE_BUNDLE_REWARD_SECOND_ROW_MARGIN_TOP_PX =
  STORE_BUNDLE_ROW2_TOP_PX - STORE_BUNDLE_REWARD_FIRST_ROW_HEIGHT_PX;

export function storeBundleRewardOverlayHeightPx(rowCount: number): number {
  const n = Math.max(1, rowCount);
  if (n === 1) return STORE_BUNDLE_REWARD_FIRST_ROW_HEIGHT_PX;
  const P = STORE_BUNDLE_REWARD_PILL_HEIGHT_PX;
  const G = STORE_BUNDLE_REWARD_PILL_GAP_PX;
  return STORE_BUNDLE_ROW2_TOP_PX + (n - 1) * P + (n - 2) * G;
}

/** Purchase button — anchored from bottom/right of sprite (matches coin row). */
export const STORE_OFFER_CARD_PURCHASE_ANCHOR = {
  bottom: 26,
  right: 27,
} as const;

/** Bundle purchase — 2px toward the right edge vs coin rows (`right` is smaller). */
export const STORE_BUNDLE_CARD_PURCHASE_ANCHOR = {
  bottom: 26,
  right: 25,
} as const;

export const STORE_OFFER_CARD_PURCHASE_BG = '#b8d458';
export const STORE_OFFER_CARD_PURCHASE_BORDER = '#8fb33a';
export const STORE_OFFER_CARD_PURCHASE_TEXT = '#4a6b1e';
export const STORE_OFFER_CARD_PURCHASE_PRESSED_BG = '#9fc044';
