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

export interface PopupVectorBackgroundProps {
  borderRadiusPx?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const PopupVectorBackground: React.FC<PopupVectorBackgroundProps> = ({
  borderRadiusPx = POPUP_VECTOR_BG_BORDER_RADIUS_PX,
  className = '',
  style,
}) => (
  <div
    aria-hidden
    className={`pointer-events-none absolute inset-0 box-border ${className}`.trim()}
    style={{
      zIndex: 1,
      borderRadius: borderRadiusPx,
      backgroundColor: POPUP_VECTOR_BG_FILL,
      boxShadow: `inset 0 0 0 ${POPUP_VECTOR_STROKE_NARROW_PX}px ${POPUP_VECTOR_STROKE_NARROW_COLOR}, inset 0 0 0 ${POPUP_VECTOR_STROKE_WIDE_PX}px ${POPUP_VECTOR_STROKE_WIDE_COLOR}`,
      ...style,
    }}
  />
);
