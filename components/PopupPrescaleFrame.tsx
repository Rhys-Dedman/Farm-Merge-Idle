/**
 * Prescale (2×) cream content whose *layout* size matches the *visual* cream size.
 *
 * CSS `transform: scale(0.5)` does not shrink layout; hardcoded negative marginBottoms
 * were wrong for dynamic-height popups, so flex-centering put the visible panel high.
 * This frame measures the unscaled content and sizes its box to width/height × 0.5 so
 * the cream center is the flex center.
 */
import React, { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  POPUP_CREAM_HIT_TARGET,
  POPUP_LAYOUT_PASS_THROUGH,
} from '../constants/popupPointerEvents';

export const POPUP_PRESCALE_FACTOR = 0.5;

export interface PopupPrescaleFrameProps {
  /** Unscaled design width (e.g. 640 or 720). */
  prescaleWidthPx: number;
  children: ReactNode;
  /** Styles on the visual-size outer box (centered by the shell). */
  style?: CSSProperties;
  className?: string;
  /** Cream dismiss hit target on the outer visual box (default true). */
  creamHitTarget?: boolean;
}

export const PopupPrescaleFrame: React.FC<PopupPrescaleFrameProps> = ({
  prescaleWidthPx,
  children,
  style,
  className,
  creamHitTarget = true,
}) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [visualHeightPx, setVisualHeightPx] = useState(0);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const sync = () => {
      setVisualHeightPx(el.offsetHeight * POPUP_PRESCALE_FACTOR);
    };
    sync();

    const ro = new ResizeObserver(() => sync());
    ro.observe(el);
    return () => ro.disconnect();
  }, [prescaleWidthPx]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: `${prescaleWidthPx * POPUP_PRESCALE_FACTOR}px`,
        height: visualHeightPx > 0 ? `${visualHeightPx}px` : undefined,
        ...(creamHitTarget ? POPUP_CREAM_HIT_TARGET : POPUP_LAYOUT_PASS_THROUGH),
        ...style,
      }}
    >
      <div
        ref={innerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${prescaleWidthPx}px`,
          transform: `scale(${POPUP_PRESCALE_FACTOR})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
};
