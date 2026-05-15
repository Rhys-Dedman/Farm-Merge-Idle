/**
 * Vector popup panel: fill + two inset strokes (replaces `popup_background` sprite).
 */
import React from 'react';

export const POPUP_VECTOR_BG_FILL = '#fcf0c7';
export const POPUP_VECTOR_STROKE_NARROW_COLOR = '#fcf0c7';
export const POPUP_VECTOR_STROKE_WIDE_COLOR = '#e9dcaf';
export const POPUP_VECTOR_STROKE_WIDE_PX = 20;
export const POPUP_VECTOR_STROKE_NARROW_PX = 16;
/** Matches level-up tuning (28 × 3 in pre-scale panel coords). */
export const POPUP_VECTOR_BG_BORDER_RADIUS_PX = 28 * 3;

/**
 * Premium IAP panel top band height in **pre-scale** coords (parent uses `transform: scale(0.5)`).
 * 250 here reads as ~125px tall on screen.
 */
export const PREMIUM_IAP_POPUP_TOP_ACCENT_HEIGHT_PRESCALE_PX = 250;

/** Premium IAP top band fill (outer + inner plateau); matches narrow inset ring. */
export const PREMIUM_IAP_POPUP_TOP_ACCENT_BLUE = '#ba82d8';

/**
 * Top corner radius for the blue band only (pre-scale panel coords). Cream panel keeps
 * `POPUP_VECTOR_BG_BORDER_RADIUS_PX`. Override via `premiumTopAccent.topCornerRadiusPx`.
 */
export const PREMIUM_IAP_TOP_ACCENT_BORDER_RADIUS_PX = 75;

/** Narrow inset ring (same as panel fill so the 20px wide ring reads as the main stroke). */
export const PREMIUM_IAP_TOP_ACCENT_STROKE_NARROW_COLOR = '#ba82d8';
/** Wide inset ring — visible “dark line” at panel edge (20px, same as `POPUP_VECTOR_STROKE_WIDE_PX`). */
export const PREMIUM_IAP_TOP_ACCENT_STROKE_WIDE_COLOR = '#995fb7';

/**
 * Tall transparent stroke layer (pre-scale). Inset shadows attach to this box’s bottom edge far below
 * the blue band; parent `overflow:hidden` clips off the bottom horizontal segment while keeping top
 * curve + vertical sides in the visible band.
 */
export const PREMIUM_IAP_POPUP_STROKE_EXTEND_PX = 8000;

export interface PopupVectorBackgroundProps {
  borderRadiusPx?: number;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Optional top band above the cream fill; top corners use `topCornerRadiusPx` (default 75), not the
   * main panel radius. Content (`z-index` above this layer) stays unchanged.
   */
  premiumTopAccent?: {
    heightPx: number;
    backgroundColor: string;
    /** Top-left / top-right radius for the blue band only; default `PREMIUM_IAP_TOP_ACCENT_BORDER_RADIUS_PX`. */
    topCornerRadiusPx?: number;
    /** Inset ring inside the wide stroke; defaults to `PREMIUM_IAP_TOP_ACCENT_STROKE_NARROW_COLOR`. */
    strokeNarrowColor?: string;
    /** 20px inset ring; defaults to `PREMIUM_IAP_TOP_ACCENT_STROKE_WIDE_COLOR`. */
    strokeWideColor?: string;
  };
}

export const PopupVectorBackground: React.FC<PopupVectorBackgroundProps> = ({
  borderRadiusPx = POPUP_VECTOR_BG_BORDER_RADIUS_PX,
  className = '',
  style,
  premiumTopAccent,
}) => {
  const accentR = premiumTopAccent
    ? premiumTopAccent.topCornerRadiusPx ?? PREMIUM_IAP_TOP_ACCENT_BORDER_RADIUS_PX
    : 0;
  const innerTopR = Math.max(0, accentR - POPUP_VECTOR_STROKE_WIDE_PX);

  return (
  <div
    aria-hidden
    className={`pointer-events-none absolute inset-0 box-border ${className}`.trim()}
    style={{
      zIndex: 1,
      ...style,
    }}
  >
    <div
      className="absolute inset-0 box-border"
      style={{
        borderRadius: borderRadiusPx,
        backgroundColor: POPUP_VECTOR_BG_FILL,
        boxShadow: `inset 0 0 0 ${POPUP_VECTOR_STROKE_NARROW_PX}px ${POPUP_VECTOR_STROKE_NARROW_COLOR}, inset 0 0 0 ${POPUP_VECTOR_STROKE_WIDE_PX}px ${POPUP_VECTOR_STROKE_WIDE_COLOR}`,
      }}
    />
    {premiumTopAccent ? (
      <div
        className="absolute left-0 right-0 top-0 box-border overflow-hidden"
        style={{
          height: premiumTopAccent.heightPx,
          borderTopLeftRadius: accentR,
          borderTopRightRadius: accentR,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <div
          className="absolute inset-0 box-border"
          style={{
            backgroundColor: premiumTopAccent.backgroundColor,
            borderTopLeftRadius: accentR,
            borderTopRightRadius: accentR,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
        />
        {/* Flat interior same as panel blue — avoids inner tint vs shadow compositing */}
        <div
          className="pointer-events-none absolute box-border"
          style={{
            left: POPUP_VECTOR_STROKE_WIDE_PX,
            right: POPUP_VECTOR_STROKE_WIDE_PX,
            top: POPUP_VECTOR_STROKE_WIDE_PX,
            bottom: 0,
            backgroundColor: premiumTopAccent.backgroundColor,
            borderTopLeftRadius: innerTopR,
            borderTopRightRadius: innerTopR,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
        />
        {/* Transparent + dual inset (narrow then wide, cream order); tall box clips bottom horizontal */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 box-border"
          style={{
            height: PREMIUM_IAP_POPUP_STROKE_EXTEND_PX,
            backgroundColor: 'transparent',
            borderTopLeftRadius: accentR,
            borderTopRightRadius: accentR,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            boxShadow: `inset 0 0 0 ${POPUP_VECTOR_STROKE_NARROW_PX}px ${
              premiumTopAccent.strokeNarrowColor ?? PREMIUM_IAP_TOP_ACCENT_STROKE_NARROW_COLOR
            }, inset 0 0 0 ${POPUP_VECTOR_STROKE_WIDE_PX}px ${
              premiumTopAccent.strokeWideColor ?? PREMIUM_IAP_TOP_ACCENT_STROKE_WIDE_COLOR
            }`,
          }}
        />
      </div>
    ) : null}
  </div>
  );
};
