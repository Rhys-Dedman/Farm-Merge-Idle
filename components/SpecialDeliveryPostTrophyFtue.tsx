/**
 * After the FTUE trophy lands on the shelf — teaching textbox + whole-shelf dim
 * cutout + finger on the first-shelf reward icon. Only that reward is tappable.
 */
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  COLLECTION_FTUE_BONUSES_BLOCKER_TINT,
  COLLECTION_FTUE_SHELF0_REWARD_ICON_ID,
} from '../constants/collectionFtue';
import {
  FTUE_TEXTBOX,
  FTUE_TEXTBOX_DIVIDER_MARGIN_BOTTOM,
  FTUE_TEXTBOX_TEXT,
  FTUE_VISUAL_SCALE,
} from '../ftue/ftueTextboxStyles';
import { assetPath } from '../utils/assetPath';

const FADE_IN_MS = 280;
const FADE_OUT_MS = 220;
/** Tighten the shelf spotlight vertically around trophies + progress bar. */
const SHELF_HOLE_TOP_INSET_PX = 10;
const SHELF_HOLE_BOTTOM_INSET_PX = 80;

const FINGER_SIZE = 270 * FTUE_VISUAL_SCALE;
const POINT_AT_FINGER_OFFSET_UP_PX = 52 * FTUE_VISUAL_SCALE;
const POINT_DOWN_TAP_PX = 18 * FTUE_VISUAL_SCALE;

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
   * Negative pulls the box up; positive pushes it down into the clear shelf band.
   */
  offsetYPx?: number;
  isFadingOut?: boolean;
  onConfirm: () => void;
}

export const SpecialDeliveryPostTrophyFtue: React.FC<SpecialDeliveryPostTrophyFtueProps> = ({
  portalRect,
  // Was -10; +10 down → bottom of textbox sits on the shelf cutout top edge.
  offsetYPx = 0,
  isFadingOut = false,
  onConfirm,
}) => {
  const [opacity, setOpacity] = useState(0);
  /** Viewport Y band for the full-bleed shelf cutout. */
  const [shelfBandViewport, setShelfBandViewport] = useState<{
    top: number;
    height: number;
  } | null>(null);
  /** Design-space Y of the shelf spotlight top (portal coords). */
  const [shelfTopDesign, setShelfTopDesign] = useState<number | null>(null);
  /** Viewport rect for the invisible reward hit target. */
  const [rewardTapViewport, setRewardTapViewport] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  /** Design-space rect for the finger tip target. */
  const [rewardFingerDesign, setRewardFingerDesign] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (isFadingOut) {
      setOpacity(0);
      return;
    }
    const raf = requestAnimationFrame(() => setOpacity(1));
    return () => cancelAnimationFrame(raf);
  }, [isFadingOut]);

  const measure = useCallback(() => {
    const shelf = document.querySelector(
      '[data-collection-shelf-garden="garden_1"][data-collection-shelf-in-garden="0"]',
    ) as HTMLElement | null;
    const rewardEl = document.getElementById(COLLECTION_FTUE_SHELF0_REWARD_ICON_ID);
    const container = document.getElementById('game-container');
    if (!shelf || !container) {
      setShelfBandViewport(null);
      setShelfTopDesign(null);
      setRewardTapViewport(null);
      setRewardFingerDesign(null);
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

    if (!rewardEl) {
      setRewardTapViewport(null);
      setRewardFingerDesign(null);
      return;
    }
    const rr = rewardEl.getBoundingClientRect();
    const padVp = (20 + 52 * FTUE_VISUAL_SCALE) * scale;
    const padded = {
      left: rr.left - padVp,
      top: rr.top - padVp,
      width: rr.width + padVp * 2,
      height: rr.height + padVp * 2,
    };
    // Shrink hit target around the icon center (same as Collection bonuses FTUE).
    const scaleFactor = 0.35;
    const cx = padded.left + padded.width / 2;
    const cy = padded.top + padded.height / 2;
    const hitW = padded.width * scaleFactor;
    const hitH = padded.height * scaleFactor;
    setRewardTapViewport({
      left: cx - hitW / 2,
      top: cy - hitH / 2,
      width: hitW,
      height: hitH,
    });
    setRewardFingerDesign({
      left: (rr.left - cr.left) / scale,
      top: (rr.top - cr.top) / scale,
      width: rr.width / scale,
      height: rr.height / scale,
    });
  }, [portalRect.scale]);

  useLayoutEffect(() => {
    if (isFadingOut) return;
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
  }, [isFadingOut, measure]);

  const dimPanelStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: COLLECTION_FTUE_BONUSES_BLOCKER_TINT,
    opacity,
    transition: `opacity ${isFadingOut ? FADE_OUT_MS : FADE_IN_MS}ms ease`,
    pointerEvents: 'auto',
  };

  if (typeof document === 'undefined') return null;

  const fingerSize = FINGER_SIZE;

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
            {/* Invisible catcher over the clear shelf band (blocks trophies / bar). */}
            <div
              className="absolute"
              style={{
                left: 0,
                top: shelfBandViewport.top,
                width: '100%',
                height: shelfBandViewport.height,
                pointerEvents: isFadingOut ? 'none' : 'auto',
                backgroundColor: 'transparent',
              }}
              aria-hidden
            />
            {/* Invisible reward hit target — only tappable control. */}
            {rewardTapViewport && !isFadingOut ? (
              <button
                type="button"
                className="absolute border-0 bg-transparent p-0 cursor-pointer"
                style={{
                  left: rewardTapViewport.left,
                  top: rewardTapViewport.top,
                  width: rewardTapViewport.width,
                  height: rewardTapViewport.height,
                  pointerEvents: 'auto',
                  backgroundColor: 'transparent',
                }}
                aria-label="View shelf reward"
                onClick={onConfirm}
              />
            ) : null}
          </>
        ) : (
          <div className="absolute inset-0" style={dimPanelStyle} aria-hidden />
        )}
      </div>

      {/* Textbox + finger in design space × appScale. */}
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
          className="absolute pointer-events-none"
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
        </div>

        {rewardFingerDesign && !isFadingOut ? (
          <div
            className="absolute pointer-events-none"
            style={{
              left:
                rewardFingerDesign.left +
                rewardFingerDesign.width / 2 -
                fingerSize / 2,
              top:
                rewardFingerDesign.top +
                rewardFingerDesign.height / 2 -
                fingerSize / 2 -
                POINT_AT_FINGER_OFFSET_UP_PX,
              width: fingerSize,
              height: fingerSize,
              transformOrigin: 'center center',
              animation: 'sdPostTrophyFingerAt 1.2s ease-in-out infinite',
              opacity,
              transition: `opacity ${FADE_IN_MS}ms ease`,
            }}
          >
            <style>{`
              @keyframes sdPostTrophyFingerAt {
                0%, 100% { transform: translateY(0) rotate(180deg); }
                50% { transform: translateY(${POINT_DOWN_TAP_PX}px) rotate(180deg); }
              }
            `}</style>
            <img
              src={assetPath('/assets/ui/ui_finger.png')}
              alt=""
              className="w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
              draggable={false}
            />
          </div>
        ) : null}
      </div>
    </>,
    document.body,
  );
};
