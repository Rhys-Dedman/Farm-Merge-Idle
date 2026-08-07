/**
 * After the FTUE trophy lands on the shelf — centered teaching textbox + forced CTA.
 *
 * Dim cutout is viewport-fixed (full device width). The cream textbox is portaled in the
 * same design-space × appScale box as other FTUEs so phone/iPad sizing matches.
 */
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { COLLECTION_FTUE_BONUSES_BLOCKER_TINT } from '../constants/collectionFtue';
import { SPECIAL_DELIVERY_FTUE_OOO_SHINY_BUTTON_ID } from '../constants/specialDeliveryFtue';
import {
  FTUE_TEXTBOX,
  FTUE_TEXTBOX_DIVIDER_MARGIN_BOTTOM,
  FTUE_TEXTBOX_TEXT,
  FTUE_TEXTBOX_BUTTON_TEXT,
  FTUE_VISUAL_SCALE,
  ftueTextboxButtonChrome,
} from '../ftue/ftueTextboxStyles';
import { assetPath } from '../utils/assetPath';
import { playSfx, SFX_IDS } from '../utils/sfx';

const FADE_IN_MS = 280;
const FADE_OUT_MS = 220;
/** Tighten the shelf spotlight vertically around trophies + progress bar. */
const SHELF_HOLE_TOP_INSET_PX = 10;
const SHELF_HOLE_BOTTOM_INSET_PX = 80;

export interface SpecialDeliveryPostTrophyFtuePortalRect {
  left: number;
  top: number;
  width: number;
  height: number;
  scale: number;
}

interface SpecialDeliveryPostTrophyFtueProps {
  /** Same rect used by the coin-panel FTUE portal (design size + appScale). */
  portalRect: SpecialDeliveryPostTrophyFtuePortalRect;
  /**
   * Extra gap between the textbox bottom and the top-dim / shelf-hole edge.
   * Negative pulls the box down into the clear shelf band.
   */
  offsetYPx?: number;
  isFadingOut?: boolean;
  onConfirm: () => void;
}

export const SpecialDeliveryPostTrophyFtue: React.FC<SpecialDeliveryPostTrophyFtueProps> = ({
  portalRect,
  offsetYPx = -10,
  isFadingOut = false,
  onConfirm,
}) => {
  const [opacity, setOpacity] = useState(0);
  const [buttonPressed, setButtonPressed] = useState(false);
  /** Viewport Y band for the full-bleed shelf cutout. */
  const [shelfBandViewport, setShelfBandViewport] = useState<{
    top: number;
    height: number;
  } | null>(null);
  /** Design-space Y of the shelf spotlight top (portal coords). */
  const [shelfTopDesign, setShelfTopDesign] = useState<number | null>(null);

  useEffect(() => {
    if (isFadingOut) {
      setOpacity(0);
      return;
    }
    const raf = requestAnimationFrame(() => setOpacity(1));
    return () => cancelAnimationFrame(raf);
  }, [isFadingOut]);

  useLayoutEffect(() => {
    if (isFadingOut) return;
    const measure = () => {
      const shelf = document.querySelector(
        '[data-collection-shelf-garden="garden_1"][data-collection-shelf-in-garden="0"]',
      ) as HTMLElement | null;
      const container = document.getElementById('game-container');
      if (!shelf || !container) {
        setShelfBandViewport(null);
        setShelfTopDesign(null);
        return;
      }
      const sr = shelf.getBoundingClientRect();
      const cr = container.getBoundingClientRect();
      const scale = portalRect.scale > 0 ? portalRect.scale : 1;

      const topVp = Math.max(0, sr.top + SHELF_HOLE_TOP_INSET_PX * scale);
      const bottomVp = Math.min(
        window.innerHeight,
        sr.bottom - SHELF_HOLE_BOTTOM_INSET_PX * scale,
      );
      setShelfBandViewport({
        top: topVp,
        height: Math.max(0, bottomVp - topVp),
      });

      setShelfTopDesign(
        Math.max(0, (sr.top - cr.top) / scale + SHELF_HOLE_TOP_INSET_PX),
      );
    };
    measure();
    const t1 = window.setTimeout(measure, 80);
    const t2 = window.setTimeout(measure, 240);
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('scroll', measure);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('scroll', measure);
    };
  }, [isFadingOut, portalRect.scale]);

  const dimPanelStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: COLLECTION_FTUE_BONUSES_BLOCKER_TINT,
    opacity,
    transition: `opacity ${isFadingOut ? FADE_OUT_MS : FADE_IN_MS}ms ease`,
    pointerEvents: 'auto',
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Full-bleed dim (viewport px) — cutout reaches both device edges. */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 240 }}>
        {shelfBandViewport ? (
          <>
            <div
              style={{
                ...dimPanelStyle,
                left: 0,
                right: 0,
                top: 0,
                height: shelfBandViewport.top,
              }}
            />
            <div
              style={{
                ...dimPanelStyle,
                left: 0,
                right: 0,
                top: shelfBandViewport.top + shelfBandViewport.height,
                bottom: 0,
              }}
            />
            <div
              className="absolute pointer-events-auto"
              style={{
                left: 0,
                top: shelfBandViewport.top,
                width: '100%',
                height: shelfBandViewport.height,
              }}
              aria-hidden
            />
          </>
        ) : (
          <div className="absolute inset-0" style={dimPanelStyle} aria-hidden />
        )}
      </div>

      {/* Textbox in design space × appScale — same sizing path as Ftue4 / Gardens FTUE. */}
      <div
        className="fixed pointer-events-none"
        style={{
          left: portalRect.left,
          top: portalRect.top,
          width: portalRect.width,
          height: portalRect.height,
          transform: `scale(${portalRect.scale})`,
          transformOrigin: 'top left',
          zIndex: 241,
        }}
      >
        <div
          className="absolute pointer-events-auto"
          style={{
            left: '50%',
            top: shelfTopDesign != null ? shelfTopDesign + offsetYPx : '50%',
            transform:
              shelfTopDesign != null ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)',
            ...FTUE_TEXTBOX,
            width: 480 * FTUE_VISUAL_SCALE,
            maxWidth: 'calc(100% - 24px)',
            opacity,
            transition: `opacity ${isFadingOut ? FADE_OUT_MS : FADE_IN_MS}ms ease`,
          }}
        >
          <div
            className="w-full flex items-center justify-center"
            style={{ marginBottom: FTUE_TEXTBOX_DIVIDER_MARGIN_BOTTOM }}
          >
            <img
              src={assetPath('/assets/ui/popup_divider.png')}
              alt=""
              className="h-auto object-contain"
              style={{ width: '100%' }}
              draggable={false}
            />
          </div>
          <p
            className="text-center m-0 font-medium italic leading-snug"
            style={{ ...FTUE_TEXTBOX_TEXT, paddingLeft: 4, paddingRight: 4 }}
          >
            Collect trophies to unlock powerful rewards
          </p>
          <div className="mt-4 flex justify-center">
            <button
              id={SPECIAL_DELIVERY_FTUE_OOO_SHINY_BUTTON_ID}
              type="button"
              className="font-black tracking-tight"
              style={{
                ...ftueTextboxButtonChrome(buttonPressed),
                color: FTUE_TEXTBOX_BUTTON_TEXT,
                fontFamily: 'Inter, sans-serif',
                fontSize: 22 * FTUE_VISUAL_SCALE,
                padding: `${10 * FTUE_VISUAL_SCALE}px ${28 * FTUE_VISUAL_SCALE}px`,
                cursor: 'pointer',
              }}
              onPointerDown={() => setButtonPressed(true)}
              onPointerUp={() => setButtonPressed(false)}
              onPointerCancel={() => setButtonPressed(false)}
              onPointerLeave={() => setButtonPressed(false)}
              onClick={() => {
                if (isFadingOut) return;
                playSfx(SFX_IDS.uiConfirmNormal);
                onConfirm();
              }}
            >
              Ooo, Shiny!
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};
