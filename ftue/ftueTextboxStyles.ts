/**
 * Default FTUE textbox styles – use for all FTUE textboxes (with or without button).
 * Keep these locked in for consistency across welcome, seed_tap, and future steps.
 */

import {
  POPUP_VECTOR_BG_FILL,
  POPUP_VECTOR_STROKE_NARROW_COLOR,
  POPUP_VECTOR_STROKE_NARROW_PX,
  POPUP_VECTOR_STROKE_WIDE_COLOR,
  POPUP_VECTOR_STROKE_WIDE_PX,
} from '../components/PopupVectorBackground';

/**
 * FTUE visual scale:
 * - FTUE overlays are rendered in the same scaled coordinate space as the game (appScale).
 * - We keep FTUE copy/finger a bit smaller so it matches the original look,
 *   while still scaling at the exact same rate as the rest of the UI on resize.
 */
export const FTUE_VISUAL_SCALE = 0.7;
/** Debug: tint for FTUE blocker/backdrop areas (hole remains clear). */
export const FTUE_BLOCKER_TINT = 'rgba(0, 0, 0, 0)';

/**
 * Popups draw cream strokes in 2× pre-scale then `scale(0.5)`.
 * FTUE textboxes sit in app design space, so use half those values for the same on-screen look.
 */
const FTUE_CREAM_STROKE_WIDE_PX = POPUP_VECTOR_STROKE_WIDE_PX / 2; // 10 visual
const FTUE_CREAM_STROKE_NARROW_PX = POPUP_VECTOR_STROKE_NARROW_PX / 2; // 8 visual
/** FTUE textbox corner radius (design px). */
const FTUE_CREAM_BORDER_RADIUS_PX = 30;

/** Content pad beyond the wide inset stroke so copy clears the ring. */
const FTUE_CREAM_PAD_BEYOND_STROKE_Y_PX = 12 * FTUE_VISUAL_SCALE;
const FTUE_CREAM_PAD_BEYOND_STROKE_X_PX = 8 * FTUE_VISUAL_SCALE;

export const FTUE_TEXTBOX = {
  width: `${480 * FTUE_VISUAL_SCALE}px`,
  padding: `${FTUE_CREAM_STROKE_WIDE_PX + FTUE_CREAM_PAD_BEYOND_STROKE_Y_PX}px ${
    FTUE_CREAM_STROKE_WIDE_PX + FTUE_CREAM_PAD_BEYOND_STROKE_X_PX
  }px`,
  backgroundColor: POPUP_VECTOR_BG_FILL,
  borderRadius: `${FTUE_CREAM_BORDER_RADIUS_PX}px`,
  border: 'none',
  boxShadow: [
    '0 1px 14px rgba(0,0,0,0.96)',
    `inset 0 0 0 ${FTUE_CREAM_STROKE_NARROW_PX}px ${POPUP_VECTOR_STROKE_NARROW_COLOR}`,
    `inset 0 0 0 ${FTUE_CREAM_STROKE_WIDE_PX}px ${POPUP_VECTOR_STROKE_WIDE_COLOR}`,
  ].join(', '),
} as const;

export const FTUE_TEXTBOX_DIVIDER_MARGIN_BOTTOM = `${14 * FTUE_VISUAL_SCALE}px`;

export const FTUE_TEXTBOX_TEXT = {
  color: '#775041',
  fontFamily: 'Inter, sans-serif',
  fontSize: `${24 * FTUE_VISUAL_SCALE}px`,
  textAlign: 'center' as const,
} as const;

/** Green confirm button inside FTUE textboxes (Ftue4 / 11 / 95). */
export const FTUE_TEXTBOX_BUTTON_BG = '#b8d458';
export const FTUE_TEXTBOX_BUTTON_BG_PRESSED = '#9fc044';
export const FTUE_TEXTBOX_BUTTON_BORDER = '#8fb33a';
export const FTUE_TEXTBOX_BUTTON_TEXT = '#4a6b1e';
/** Outline 1px thinner than the prior `4 * FTUE_VISUAL_SCALE`. */
export const FTUE_TEXTBOX_BUTTON_BORDER_PX = Math.max(1, 4 * FTUE_VISUAL_SCALE - 1);
/** 3D bottom lip (was 6). */
export const FTUE_TEXTBOX_BUTTON_DEPTH_PX = 4;
/** Extra space under the button so the lip clears the cream stroke. */
export const FTUE_TEXTBOX_BUTTON_MARGIN_BOTTOM_PX = 10;

export function ftueTextboxButtonChrome(pressed: boolean): {
  backgroundColor: string;
  border: string;
  borderRadius: number;
  boxShadow: string;
  transform: string;
  marginBottom: number;
} {
  return {
    backgroundColor: pressed ? FTUE_TEXTBOX_BUTTON_BG_PRESSED : FTUE_TEXTBOX_BUTTON_BG,
    border: `${FTUE_TEXTBOX_BUTTON_BORDER_PX}px solid ${FTUE_TEXTBOX_BUTTON_BORDER}`,
    borderRadius: 16 * FTUE_VISUAL_SCALE,
    boxShadow: pressed
      ? 'inset 0 3px 6px rgba(0,0,0,0.15)'
      : `0 ${FTUE_TEXTBOX_BUTTON_DEPTH_PX}px 0 ${FTUE_TEXTBOX_BUTTON_BORDER}, 0 6px 12px rgba(0,0,0,0.12)`,
    transform: pressed
      ? `translateY(${Math.max(1, FTUE_TEXTBOX_BUTTON_DEPTH_PX / 2)}px)`
      : 'translateY(0)',
    marginBottom: FTUE_TEXTBOX_BUTTON_MARGIN_BOTTOM_PX,
  };
}

