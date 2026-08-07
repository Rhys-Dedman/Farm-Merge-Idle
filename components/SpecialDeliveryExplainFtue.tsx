/**
 * Post-vine-lock explain: cream FTUE textbox behind Special Deliveries title /
 * divider / description, extended downward with a forced "Sounds Great" CTA.
 */
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { COLLECTION_FTUE_BLOCKER_TINT, COLLECTION_FTUE_BONUSES_BLOCKER_TINT } from '../constants/collectionFtue';
import { SPECIAL_DELIVERY_FTUE_SOUNDS_GREAT_BUTTON_ID } from '../constants/specialDeliveryFtue';
import {
  FTUE_TEXTBOX,
  FTUE_VISUAL_SCALE,
  FTUE_TEXTBOX_BUTTON_BORDER_PX,
  FTUE_TEXTBOX_BUTTON_TEXT,
  ftueTextboxButtonChrome,
} from '../ftue/ftueTextboxStyles';
import { CollectionFtueOverlay, type GameRect } from './CollectionFtueOverlay';
import { playSfx, SFX_IDS } from '../utils/sfx';

const FADE_IN_MS = 450;
const FADE_OUT_MS = 220;

export interface SpecialDeliveryExplainFtueProps {
  /** Panel-local top of the cream box (align with Special Deliveries title). */
  boxTopPx: number;
  boxInsetPx?: number;
  boxMinHeightPx: number;
  isFadingOut?: boolean;
  onConfirm: () => void;
}

export const SpecialDeliveryExplainFtue: React.FC<SpecialDeliveryExplainFtueProps> = ({
  boxTopPx,
  boxInsetPx = 80,
  boxMinHeightPx,
  isFadingOut = false,
  onConfirm,
}) => {
  const [opacity, setOpacity] = useState(0);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [panelHole, setPanelHole] = useState<GameRect | null>(null);

  /**
   * Shared geometry so the clickable CTA layer (above the input blocker) lines up
   * with the cream box that paints behind the title/divider/description.
   */
  const boxLayout = {
    left: boxInsetPx,
    right: boxInsetPx,
    top: boxTopPx,
    minHeight: boxMinHeightPx,
    width: 'auto',
    padding: FTUE_TEXTBOX.padding,
    paddingBottom: 18 * FTUE_VISUAL_SCALE,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-end',
    alignItems: 'center',
    boxSizing: 'border-box' as const,
  };

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
      const panel = document.querySelector('[data-sd-explain-ftue-panel]') as HTMLElement | null;
      if (!panel) {
        setPanelHole(null);
        return;
      }
      const pr = panel.getBoundingClientRect();
      setPanelHole({
        left: pr.left,
        top: pr.top,
        width: pr.width,
        height: pr.height,
      });
    };
    measure();
    const t1 = window.setTimeout(measure, 50);
    const t2 = window.setTimeout(measure, 200);
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', measure);
    };
  }, [isFadingOut, opacity, boxMinHeightPx, boxTopPx]);

  return (
    <>
      {typeof document !== 'undefined' &&
        panelHole &&
        createPortal(
          <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 240 }}>
            <CollectionFtueOverlay
              active
              holeRect={panelHole}
              fingerStyle="none"
              blockerTint={COLLECTION_FTUE_BONUSES_BLOCKER_TINT}
              holePaddingPx={0}
              zIndex={1}
              isFadingOut={isFadingOut}
              fadeInMs={FADE_IN_MS}
            />
          </div>,
          document.body,
        )}

      {/* Under title (z2): dim + cream. Title/divider/desc paint above. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
        aria-hidden={false}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: COLLECTION_FTUE_BONUSES_BLOCKER_TINT,
            opacity,
            transition: `opacity ${isFadingOut ? FADE_OUT_MS : FADE_IN_MS}ms ease`,
          }}
          aria-hidden
        />
        <div
          className="absolute"
          style={{
            ...FTUE_TEXTBOX,
            ...boxLayout,
            opacity,
            transition: `opacity ${isFadingOut ? FADE_OUT_MS : FADE_IN_MS}ms ease`,
          }}
          aria-hidden
        />
      </div>

      {/* Above doors (z5): transparent input block so only the CTA is tappable. */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 5,
          backgroundColor: COLLECTION_FTUE_BLOCKER_TINT,
          pointerEvents: isFadingOut ? 'none' : 'auto',
        }}
        aria-hidden
      />

      {/* CTA layer (z6): same geometry as the cream box, only the button is hittable. */}
      <div className="absolute pointer-events-none" style={{ ...boxLayout, zIndex: 6 }}>
        <button
          id={SPECIAL_DELIVERY_FTUE_SOUNDS_GREAT_BUTTON_ID}
          type="button"
          className="pointer-events-auto font-black tracking-tight"
          style={{
            ...ftueTextboxButtonChrome(buttonPressed),
            borderWidth: FTUE_TEXTBOX_BUTTON_BORDER_PX + 0.5,
            color: FTUE_TEXTBOX_BUTTON_TEXT,
            fontFamily: 'Inter, sans-serif',
            fontSize: 22 * FTUE_VISUAL_SCALE,
            padding: `${7 * FTUE_VISUAL_SCALE}px ${28 * FTUE_VISUAL_SCALE}px`,
            cursor: 'pointer',
            opacity,
            transition: `opacity ${isFadingOut ? FADE_OUT_MS : FADE_IN_MS}ms ease`,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            setButtonPressed(true);
          }}
          onPointerUp={() => setButtonPressed(false)}
          onPointerCancel={() => setButtonPressed(false)}
          onPointerLeave={() => setButtonPressed(false)}
          onClick={(e) => {
            e.stopPropagation();
            if (isFadingOut) return;
            playSfx(SFX_IDS.uiConfirmNormal);
            onConfirm();
          }}
        >
          Sounds Great
        </button>
      </div>
    </>
  );
};
