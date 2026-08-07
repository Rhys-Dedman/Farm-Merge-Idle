/**
 * Locked-size "Special Deliveries" title: single line, keep box size,
 * drop L/R padding if needed, then auto-shrink font to fit.
 */
import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  COLLECTION_SPECIAL_DELIVERY_TITLE_FONT_PX,
  COLLECTION_SPECIAL_DELIVERY_TITLE_PAD_X_PX,
  COLLECTION_SPECIAL_DELIVERY_TITLE_PAD_Y_PX,
} from '../constants/barnShelves';

const TITLE_TEXT = 'Special Deliveries';
const MIN_FONT_PX = 12;

let measureCanvas: HTMLCanvasElement | null = null;

function measureTextWidthPx(fontPx: number): number {
  if (typeof document === 'undefined') return fontPx * TITLE_TEXT.length * 0.55;
  measureCanvas ??= document.createElement('canvas');
  const ctx = measureCanvas.getContext('2d');
  if (!ctx) return fontPx * TITLE_TEXT.length * 0.55;
  ctx.font = `900 ${fontPx}px Inter, sans-serif`;
  return ctx.measureText(TITLE_TEXT).width;
}

interface SpecialDeliveryTitleProps {
  topPx: number;
}

export function SpecialDeliveryTitle({ topPx }: SpecialDeliveryTitleProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const lockedWidthRef = useRef<number | null>(null);
  const [padX, setPadX] = useState(COLLECTION_SPECIAL_DELIVERY_TITLE_PAD_X_PX);
  const [fontPx, setFontPx] = useState(COLLECTION_SPECIAL_DELIVERY_TITLE_FONT_PX);
  const [lockedWidthPx, setLockedWidthPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // First pass: render at base size, lock that outer box width.
    if (lockedWidthRef.current == null) {
      const w = el.offsetWidth;
      lockedWidthRef.current = w;
      setLockedWidthPx(w);
      return;
    }

    const boxW = lockedWidthRef.current;
    const baseFont = COLLECTION_SPECIAL_DELIVERY_TITLE_FONT_PX;
    const basePad = COLLECTION_SPECIAL_DELIVERY_TITLE_PAD_X_PX;
    const textAtBase = measureTextWidthPx(baseFont);

    let nextPad = basePad;
    let nextFont = baseFont;

    if (textAtBase <= boxW - basePad * 2) {
      nextPad = basePad;
      nextFont = baseFont;
    } else if (textAtBase <= boxW) {
      nextPad = 0;
      nextFont = baseFont;
    } else {
      nextPad = 0;
      let lo = MIN_FONT_PX;
      let hi = baseFont;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (measureTextWidthPx(mid) <= boxW) lo = mid;
        else hi = mid - 1;
      }
      nextFont = lo;
    }

    setPadX(nextPad);
    setFontPx(nextFont);
  }, [lockedWidthPx]);

  return (
    <h2
      ref={ref}
      className="font-black tracking-tight text-center"
      style={{
        position: 'absolute',
        left: '50%',
        top: topPx,
        transform: 'translateX(-50%)',
        color: '#5c4a32',
        fontFamily: 'Inter, sans-serif',
        fontSize: `${fontPx}px`,
        lineHeight: 1,
        width: lockedWidthPx != null ? lockedWidthPx : 'fit-content',
        maxWidth: lockedWidthPx != null ? lockedWidthPx : undefined,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        paddingLeft: padX,
        paddingRight: padX,
        paddingTop: COLLECTION_SPECIAL_DELIVERY_TITLE_PAD_Y_PX,
        paddingBottom: COLLECTION_SPECIAL_DELIVERY_TITLE_PAD_Y_PX,
        boxSizing: 'border-box',
        margin: 0,
      }}
    >
      {TITLE_TEXT}
    </h2>
  );
}
