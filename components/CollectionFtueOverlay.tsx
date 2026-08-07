/**
 * Collection screen FTUE: dim + hole(s) (optional) + finger, in #game-container coordinates
 * (render inside coin panel portal like other FTUE overlays).
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import { COLLECTION_FTUE_BLOCKER_TINT } from '../constants/collectionFtue';
import { FTUE_VISUAL_SCALE } from '../ftue/ftueTextboxStyles';

export type CollectionFtueFingerStyle =
  | 'none'
  | 'seed'
  | 'point_down'
  | 'point_up'
  | 'point_right'
  | 'point_at'
  | 'point_30'
  | 'point_45';

const FADE_IN_MS = 200;
const FADE_OUT_MS = 200;
const FINGER_SIZE = 270 * FTUE_VISUAL_SCALE;
/** FTUE 7 seed-style */
const FINGER_TAP_RIGHT = 21 * FTUE_VISUAL_SCALE;
const FINGER_TAP_DOWN = 42 * FTUE_VISUAL_SCALE;
/** FTUE 10 garden-tab style */
const POINT_DOWN_TAP_PX = 18 * FTUE_VISUAL_SCALE;
/** Point-up tap (locked Special Deliveries vine lock). */
const POINT_UP_TAP_PX = 18 * FTUE_VISUAL_SCALE;
/** Point-right tap (bonus button) */
const POINT_RIGHT_TAP_PX = 18 * FTUE_VISUAL_SCALE;
/** 45° point tap (Daily Tasks claim). */
const POINT_45_TAP_PX = 16 * FTUE_VISUAL_SCALE;
/** 30° point tap (Special Delivery doors). */
const POINT_30_TAP_X_PX = 8 * FTUE_VISUAL_SCALE;
const POINT_30_TAP_Y_PX = 14 * FTUE_VISUAL_SCALE;
/** Nudge `point_at` finger up so the tip sits on the reward icon (not below it). */
const POINT_AT_FINGER_OFFSET_UP_PX = 52 * FTUE_VISUAL_SCALE;
/** Place `point_up` finger below the hole so the tip reaches the target. */
const POINT_UP_FINGER_OFFSET_DOWN_PX = 48 * FTUE_VISUAL_SCALE;
/** Place `point_45` finger so the tip lands on the green Claim button. */
const POINT_45_FINGER_OFFSET_X_PX = 36 * FTUE_VISUAL_SCALE;
const POINT_45_FINGER_OFFSET_Y_PX = 36 * FTUE_VISUAL_SCALE;
/** Same tip radius as point_45, rotated to 30°. */
const POINT_30_FINGER_OFFSET_X_PX = 25.5 * FTUE_VISUAL_SCALE;
const POINT_30_FINGER_OFFSET_Y_PX = 44 * FTUE_VISUAL_SCALE;

export type GameRect = { left: number; top: number; width: number; height: number };

function expandRect(r: GameRect, padding: number): GameRect {
  return {
    left: r.left - padding,
    top: r.top - padding,
    width: r.width + padding * 2,
    height: r.height + padding * 2,
  };
}

/** Blocker panels that leave rectangular holes clear for real pointer pass-through. */
function buildBlockerPanelsForHoles(
  containerW: number,
  containerH: number,
  holes: GameRect[],
): GameRect[] {
  if (containerW <= 0 || containerH <= 0) return [];
  if (holes.length === 0) {
    return [{ left: 0, top: 0, width: containerW, height: containerH }];
  }

  const panels: GameRect[] = [];
  const yBreaks = [0, containerH, ...holes.flatMap((h) => [h.top, h.top + h.height])];
  const sortedY = [...new Set(yBreaks)].sort((a, b) => a - b);

  for (let i = 0; i < sortedY.length - 1; i++) {
    const y0 = sortedY[i]!;
    const y1 = sortedY[i + 1]!;
    const stripH = y1 - y0;
    if (stripH <= 0) continue;
    const midY = (y0 + y1) / 2;

    const stripHoles = holes.filter((h) => midY >= h.top && midY < h.top + h.height);
    const xBreaks = [0, containerW, ...stripHoles.flatMap((h) => [h.left, h.left + h.width])];
    const sortedX = [...new Set(xBreaks)].sort((a, b) => a - b);

    for (let j = 0; j < sortedX.length - 1; j++) {
      const x0 = sortedX[j]!;
      const x1 = sortedX[j + 1]!;
      if (x1 <= x0) continue;
      const midX = (x0 + x1) / 2;
      const inHole = stripHoles.some((h) => midX >= h.left && midX < h.left + h.width);
      if (!inHole) {
        panels.push({ left: x0, top: y0, width: x1 - x0, height: stripH });
      }
    }
  }
  return panels;
}

function normalizeHoleRects(
  holeRect: GameRect | null | undefined,
  holeRects: GameRect[] | null | undefined,
): GameRect[] {
  if (holeRects != null && holeRects.length > 0) return holeRects;
  if (holeRect != null) return [holeRect];
  return [];
}

export interface CollectionFtueOverlayProps {
  /** Clear hole for the only tappable control; ignored when `holeRects` is set. */
  holeRect?: GameRect | null;
  /** Multiple clear holes (e.g. textbox CTA + progress-bar reward icon). */
  holeRects?: GameRect[] | null;
  fingerStyle?: CollectionFtueFingerStyle;
  /** Which hole the finger targets when using `point_at` (default: last hole). */
  fingerHoleIndex?: number;
  /** Block entire area (e.g. post-purchase reveal) */
  fullBlock?: boolean;
  active: boolean;
  /** Dim around hole / full block */
  blockerTint?: string;
  /** Extra padding around each hole (smaller = tighter blocker). */
  holePaddingPx?: number;
  /** Fade overlay out (e.g. after player opens bonuses). */
  isFadingOut?: boolean;
  /**
   * Fade fingers only (blockers stay). Used when a match locks in but Claim
   * Reward is not ready yet.
   */
  fingersFadingOut?: boolean;
  /** Optional fade-in duration override. */
  fadeInMs?: number;
  /** Stack above popups when needed (Daily Tasks claim FTUE). */
  zIndex?: number;
  /** Scale applied to finger artwork only (default 1). */
  fingerScale?: number;
  /**
   * Explicit finger target rects (popup-local coords). When set, fingers render here
   * instead of using `fingerHoleIndex` / hole centers.
   */
  fingerRects?: GameRect[] | null;
}

export const CollectionFtueOverlay: React.FC<CollectionFtueOverlayProps> = ({
  holeRect = null,
  holeRects = null,
  fingerStyle = 'seed',
  fingerHoleIndex,
  fullBlock = false,
  active,
  blockerTint = COLLECTION_FTUE_BLOCKER_TINT,
  holePaddingPx = 8,
  isFadingOut = false,
  fingersFadingOut = false,
  fadeInMs = FADE_IN_MS,
  zIndex = 99,
  fingerScale = 1,
  fingerRects = null,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [opacity, setOpacity] = useState(0);
  const [fingerOpacity, setFingerOpacity] = useState(1);

  const holes = normalizeHoleRects(holeRect, holeRects).map((r) =>
    expandRect(r, Math.max(0, holePaddingPx)),
  );
  const fingerTargets: GameRect[] =
    fingerRects != null && fingerRects.length > 0
      ? fingerRects
      : holes.length > 0
        ? [holes[Math.min(fingerHoleIndex ?? holes.length - 1, holes.length - 1)]!]
        : [];
  const fingerTarget = fingerTargets[0] ?? null;

  useLayoutEffect(() => {
    if (!active) return;
    const measure = () => {
      const el = overlayRef.current;
      if (!el) return;
      setContainerSize({ width: el.clientWidth, height: el.clientHeight });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [active, holes.length]);

  useEffect(() => {
    if (!active) {
      setOpacity(0);
      return;
    }
    if (isFadingOut) {
      setOpacity(0);
      return;
    }
    // Fade in once when becoming active / ending fade-out — don't flash when holes shrink mid-FTUE.
    setOpacity((prev) => (prev > 0 ? prev : 0));
    const t = setTimeout(() => setOpacity(1), 50);
    return () => clearTimeout(t);
  }, [active, isFadingOut]);

  useEffect(() => {
    if (!active || isFadingOut) {
      setFingerOpacity(0);
      return;
    }
    if (fingersFadingOut) {
      const raf = requestAnimationFrame(() => setFingerOpacity(0));
      return () => cancelAnimationFrame(raf);
    }
    setFingerOpacity(1);
  }, [active, isFadingOut, fingersFadingOut]);

  if (!active) return null;

  const resolvedFingerScale = Math.max(0, fingerScale);
  const fingerSize = FINGER_SIZE * resolvedFingerScale;
  const overlayOpacity = isFadingOut ? 0 : opacity;
  const fingerFadeMs = fingersFadingOut ? FADE_OUT_MS : FADE_IN_MS;
  const angledFingerIs30 = fingerStyle === 'point_30';
  const angledFingerOffsetX = angledFingerIs30
    ? POINT_30_FINGER_OFFSET_X_PX
    : POINT_45_FINGER_OFFSET_X_PX;
  const angledFingerOffsetY = angledFingerIs30
    ? POINT_30_FINGER_OFFSET_Y_PX
    : POINT_45_FINGER_OFFSET_Y_PX;
  const angledFingerAnimation = angledFingerIs30
    ? 'collectionFtueFinger30'
    : 'collectionFtueFinger45';
  // Tap travel must shrink/grow with fingerScale (door guide uses 0.525).
  const seedTapRight = FINGER_TAP_RIGHT * resolvedFingerScale;
  const seedTapDown = FINGER_TAP_DOWN * resolvedFingerScale;
  const pointDownTap = POINT_DOWN_TAP_PX * resolvedFingerScale;
  const pointUpTap = POINT_UP_TAP_PX * resolvedFingerScale;
  const pointRightTap = POINT_RIGHT_TAP_PX * resolvedFingerScale;
  const point30TapX = POINT_30_TAP_X_PX * resolvedFingerScale;
  const point30TapY = POINT_30_TAP_Y_PX * resolvedFingerScale;
  const point45Tap = POINT_45_TAP_PX * resolvedFingerScale;
  const fingerLayerStyle: React.CSSProperties = {
    opacity: isFadingOut ? 0 : fingerOpacity,
    transition: `opacity ${fingerFadeMs}ms ease-out`,
    pointerEvents: 'none',
  };
  const blockerPanels =
    !fullBlock && holes.length > 0
      ? buildBlockerPanelsForHoles(containerSize.width, containerSize.height, holes)
      : [];

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex,
        transition: `opacity ${isFadingOut ? FADE_OUT_MS : fadeInMs}ms ease-out`,
        opacity: overlayOpacity,
      }}
    >
      {fullBlock ? (
        <div className="absolute inset-0 pointer-events-auto" style={{ backgroundColor: blockerTint }} aria-hidden />
      ) : holes.length > 0 ? (
        <div className="absolute inset-0 pointer-events-none">
          {blockerPanels.map((panel, i) => (
            <div
              key={i}
              className="absolute pointer-events-auto"
              style={{
                left: panel.left,
                top: panel.top,
                width: panel.width,
                height: panel.height,
                backgroundColor: blockerTint,
              }}
              aria-hidden
            />
          ))}
        </div>
      ) : (
        <div className="absolute inset-0 pointer-events-auto" style={{ backgroundColor: blockerTint }} aria-hidden />
      )}

      {!fullBlock && fingerTarget && fingerStyle === 'seed' && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: fingerTarget.left + fingerTarget.width / 2 - fingerSize / 2,
            top: fingerTarget.top + fingerTarget.height / 2 - fingerSize / 2,
            width: fingerSize,
            height: fingerSize,
            transformOrigin: 'center center',
            animation: 'collectionFtueFingerSeed 1.2s ease-in-out infinite',
          }}
        >
          <style>{`
            @keyframes collectionFtueFingerSeed {
              0%, 100% { transform: translate(0, 0) rotate(-30deg); }
              50% { transform: translate(${seedTapRight}px, ${seedTapDown}px) rotate(-30deg); }
            }
          `}</style>
          <img
            src={assetPath('/assets/ui/ui_finger.png')}
            alt=""
            className="w-full h-full object-contain"
            style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
          />
        </div>
      )}

      {!fullBlock && fingerTarget && fingerStyle === 'point_down' && (
        <div
          className="absolute pointer-events-none"
          style={{
            left:
              fingerTarget.left +
              fingerTarget.width / 2 -
              fingerSize / 2 -
              40 * FTUE_VISUAL_SCALE +
              20,
            top: fingerTarget.top - fingerSize - 135 * FTUE_VISUAL_SCALE,
            width: fingerSize,
            height: fingerSize,
            transformOrigin: 'center bottom',
            animation: 'collectionFtueFingerDown 1.2s ease-in-out infinite',
          }}
        >
          <style>{`
            @keyframes collectionFtueFingerDown {
              0%, 100% { transform: translateY(0) rotate(180deg); }
              50% { transform: translateY(${pointDownTap}px) rotate(180deg); }
            }
          `}</style>
          <img
            src={assetPath('/assets/ui/ui_finger.png')}
            alt=""
            className="w-full h-full object-contain"
            style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
          />
        </div>
      )}

      {!fullBlock && fingerTarget && fingerStyle === 'point_up' && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: fingerTarget.left + fingerTarget.width / 2 - fingerSize / 2,
            top:
              fingerTarget.top +
              fingerTarget.height / 2 -
              fingerSize / 2 +
              POINT_UP_FINGER_OFFSET_DOWN_PX,
            width: fingerSize,
            height: fingerSize,
            transformOrigin: 'center top',
            animation: 'collectionFtueFingerUp 1.2s ease-in-out infinite',
          }}
        >
          <style>{`
            @keyframes collectionFtueFingerUp {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              50% { transform: translateY(-${pointUpTap}px) rotate(0deg); }
            }
          `}</style>
          <img
            src={assetPath('/assets/ui/ui_finger.png')}
            alt=""
            className="w-full h-full object-contain"
            style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
          />
        </div>
      )}

      {!fullBlock && fingerTarget && fingerStyle === 'point_right' && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: fingerTarget.left - fingerSize / 2,
            top: fingerTarget.top + fingerTarget.height / 2 - fingerSize / 2,
            width: fingerSize,
            height: fingerSize,
            transformOrigin: 'center center',
            animation: 'collectionFtueFingerRight 1.2s ease-in-out infinite',
          }}
        >
          <style>{`
            @keyframes collectionFtueFingerRight {
              0%, 100% { transform: translateX(0) rotate(90deg); }
              50% { transform: translateX(${pointRightTap}px) rotate(90deg); }
            }
          `}</style>
          <img
            src={assetPath('/assets/ui/ui_finger.png')}
            alt=""
            className="w-full h-full object-contain"
            style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
          />
        </div>
      )}

      {!fullBlock && fingerTarget && fingerStyle === 'point_at' && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: fingerTarget.left + fingerTarget.width / 2 - fingerSize / 2,
            top:
              fingerTarget.top +
              fingerTarget.height / 2 -
              fingerSize / 2 -
              POINT_AT_FINGER_OFFSET_UP_PX,
            width: fingerSize,
            height: fingerSize,
            transformOrigin: 'center center',
            animation: 'collectionFtueFingerAt 1.2s ease-in-out infinite',
          }}
        >
          <style>{`
            @keyframes collectionFtueFingerAt {
              0%, 100% { transform: translateY(0) rotate(180deg); }
              50% { transform: translateY(${POINT_DOWN_TAP_PX}px) rotate(180deg); }
            }
          `}</style>
          <img
            src={assetPath('/assets/ui/ui_finger.png')}
            alt=""
            className="w-full h-full object-contain"
            style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
          />
        </div>
      )}

      {fingerTargets.length > 0 &&
        (fingerStyle === 'point_30' || fingerStyle === 'point_45') && (
        <div className="absolute inset-0" style={fingerLayerStyle}>
          <style>{`
            @keyframes collectionFtueFinger30 {
              0%, 100% { transform: translate(0, 0) rotate(-30deg); }
              50% { transform: translate(-${point30TapX}px, -${point30TapY}px) rotate(-30deg); }
            }
            @keyframes collectionFtueFinger45 {
              0%, 100% { transform: translate(0, 0) rotate(-45deg); }
              50% { transform: translate(-${point45Tap}px, -${point45Tap}px) rotate(-45deg); }
            }
          `}</style>
          {fingerTargets.map((target, index) => (
            <div
              key={`finger-45-${index}`}
              className="absolute pointer-events-none"
              style={{
                left:
                  target.left +
                  target.width / 2 -
                  fingerSize / 2 +
                  angledFingerOffsetX * resolvedFingerScale,
                top:
                  target.top +
                  target.height / 2 -
                  fingerSize / 2 +
                  angledFingerOffsetY * resolvedFingerScale,
                width: fingerSize,
                height: fingerSize,
                transformOrigin: 'center center',
                animation: `${angledFingerAnimation} 1.2s ease-in-out infinite`,
              }}
            >
              <img
                src={assetPath('/assets/ui/ui_finger.png')}
                alt=""
                className="w-full h-full object-contain"
                style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
