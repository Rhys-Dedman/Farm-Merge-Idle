import type { CSSProperties } from 'react';

/**
 * Backdrop-dismiss hit testing for discovery-style popups:
 * oversized shells / header sprites / scale wrappers sit above the dimmer and used
 * to swallow “just outside the cream” taps. Keep visuals; only retarget pointer-events
 * so the cream panel (+ close X) count as inside.
 */

/** App-scale / outer card shell — layout only; must not block the dimmer. */
export const POPUP_LAYOUT_PASS_THROUGH: CSSProperties = { pointerEvents: 'none' };

/** Header ring + icon — large transparent PNG; ignore for dismiss. */
export const POPUP_HEADER_PASS_THROUGH: CSSProperties = { pointerEvents: 'none' };

/** Cream panel body (padded wrapper around `PopupVectorBackground`). */
export const POPUP_CREAM_HIT_TARGET: CSSProperties = { pointerEvents: 'auto' };

/** Close X lives on the shell; re-enable after shell is pass-through. */
export const POPUP_CLOSE_HIT_TARGET: CSSProperties = { pointerEvents: 'auto' };

/** Panel drop-shadow on the cream fill (not the hit wrapper) so filter halos don’t inflate hits. */
export const POPUP_CREAM_DROP_SHADOW_FILTER =
  'drop-shadow(0 16px 48px rgba(0, 0, 0, 0.3))';

/**
 * Discovery-style vertical centering: flex-centers the cream panel.
 * Header ring hangs above and is ignored for centering.
 */
export const POPUP_HEADER_TOP_PX = -56;

/** Cream / prescale stack under the absolute header — 0 so cream alone is centered. */
export const POPUP_CREAM_STACK_MARGIN_TOP_PX = 0;

/**
 * Close X top on the shell after cream stacking margin became 0.
 * Was typically 56 with cream `marginTop` 36 → keep ~20px into the cream corner.
 */
export const POPUP_CLOSE_TOP_PX = 20;

/** Full-screen overlay: no paddingTop; pass pointerEvents (and zIndex overrides) via extras. */
export function popupOverlayStyle(extras?: CSSProperties): CSSProperties {
  return {
    zIndex: 100,
    overflow: 'hidden',
    ...extras,
  };
}

/** App-scale wrapper: layout pass-through + scale only (no translateY). */
export function popupAppScaleStyle(appScale: number, extras?: CSSProperties): CSSProperties {
  return {
    transform: `scale(${appScale})`,
    transformOrigin: 'center center',
    ...POPUP_LAYOUT_PASS_THROUGH,
    ...extras,
  };
}
