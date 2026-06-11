/**
 * FTUE 10: Manual – (1) Fade in panel closed, finger down at Orders tab, only Orders tappable.
 * (2) Tap Orders → finger fades out, panel opens, finger down at Seeds tab + textbox, only Seeds tappable.
 * (3) Tap Seeds → navigate to Seeds, finger at purchase button, flash green; only purchase tappable. Buy closes FTUE.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import { FTUE_BLOCKER_TINT, FTUE_TEXTBOX, FTUE_TEXTBOX_DIVIDER_MARGIN_BOTTOM, FTUE_TEXTBOX_TEXT, FTUE_VISUAL_SCALE } from '../ftue/ftueTextboxStyles';

const FADE_IN_MS = 400;
const FADE_OUT_MS = 400;
const TEXTBOX_FADE_IN_MS = 350;
/** Finger 2 + textbox: wait for panel open to finish (700ms) then fade in over this duration */
const FINGER2_FADE_MS = 700;
const PANEL_OPEN_MS = 700;
/** Wait for Orders→Garden tab slide to finish before showing finger 3 (slightly longer than content transition) */
const FINGER3_DELAY_MS = 850;
const FINGER_SIZE = 270 * FTUE_VISUAL_SCALE;
const FINGER_TAP_OFFSET_X = -14.14 * FTUE_VISUAL_SCALE;
const FINGER_TAP_OFFSET_Y = 14.14 * FTUE_VISUAL_SCALE;
const FINGER_TAP_DOWN_PX = 18 * FTUE_VISUAL_SCALE;
/** Expand hole so the tab/button is fully inside the tappable cutout (avoids blocking from rect drift). */
const HOLE_PADDING_PX = 12;
/** Finger 1: smaller hole (tighten width + height). */
const FINGER1_HOLE_SCALE_X = 0.75;
const FINGER1_HOLE_SCALE_Y = 0.75;
/** Extra-tight padding for finger 2 Garden-tab hole so the tappable area is smaller in both directions. */
const GARDEN_HOLE_PADDING_PX = 1;
/** Finger 2 blocker: shrink hole vertically (narrower Y). */
const GARDEN_HOLE_SCALE_Y = 0.68;
/** Debug: show blocker tint for finger 2 (Garden tab) */
const DEBUG_FINGER2_BLOCKER_VISIBLE = false;
/** Debug: show blocker tint for finger 3 (purchase button) */
const DEBUG_FINGER3_BLOCKER_VISIBLE = false;
/** Debug: show blocker tint for finger 1 (Seeds tab) */
const DEBUG_FINGER1_BLOCKER_VISIBLE = false;
const FTUE10_TAB_SEEDS_ID = 'ftue10-tab-seeds';
const FTUE10_TAB_ORDERS_ID = 'ftue10-tab-orders';
const FTUE10_TAB_GARDEN_ID = 'ftue10-tab-garden';
const FTUE10_PURCHASE_BUTTON_ID = 'ftue10-purchase-harvest_speed';
/** Garden tab content slide duration when panel is expanded (UpgradeList tab-content-container). */
const GARDEN_TAB_SLIDE_MS = 700;
/** Garden tab finger: extra nudge left (smaller `left` = further left) */
const GARDEN_FINGER_NUDGE_LEFT_PX = 18 * FTUE_VISUAL_SCALE;

type Rect = { left: number; top: number; width: number; height: number };
const rectRight = (r: Rect) => r.left + r.width;
const rectBottom = (r: Rect) => r.top + r.height;

function expandRect(r: Rect, padding: number): Rect {
  return {
    left: r.left - padding,
    top: r.top - padding,
    width: r.width + padding * 2,
    height: r.height + padding * 2,
  };
}

function scaleRectFromCenter(r: Rect, scaleX: number, scaleY: number): Rect {
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const w = Math.max(1, r.width * scaleX);
  const h = Math.max(1, r.height * scaleY);
  return { left: cx - w / 2, top: cy - h / 2, width: w, height: h };
}

export type Ftue10Phase = 'point_orders' | 'panel_open_orders' | 'finger';

export interface Ftue10OverlayProps {
  /** Harvest button rect in game-container coordinates (448×796 space). */
  harvestButtonRect: Rect | null;
  phase: Ftue10Phase | null;
  /** Purchase button rect in game-container coordinates (448×796 space). */
  purchaseButtonRect?: Rect | null;
  /** Current app scale (used to convert DOM rects to game-container coordinates). */
  appScale: number;
  isFadingOut?: boolean;
  onFadeOutComplete?: () => void;
}

export const Ftue10Overlay: React.FC<Ftue10OverlayProps> = ({
  harvestButtonRect,
  phase,
  purchaseButtonRect: purchaseButtonRectProp = null,
  appScale,
  isFadingOut = false,
  onFadeOutComplete,
}) => {
  const fingerSize = FINGER_SIZE;
  const tapOffsetX = FINGER_TAP_OFFSET_X;
  const tapOffsetY = FINGER_TAP_OFFSET_Y;
  const tapDownPx = FINGER_TAP_DOWN_PX;
  const [opacity, setOpacity] = useState(0);
  const [fadeOutOpacity, setFadeOutOpacity] = useState(1);
  const [textboxOpacity, setTextboxOpacity] = useState(0);
  const [showPanelOpenContent, setShowPanelOpenContent] = useState(false);
  const [finger2Opacity, setFinger2Opacity] = useState(0);
  const [showFinger3, setShowFinger3] = useState(false);
  const [seedsTabRect, setSeedsTabRect] = useState<Rect | null>(null);
  const [ordersTabRect, setOrdersTabRect] = useState<Rect | null>(null);
  const [gardenTabRect, setGardenTabRect] = useState<Rect | null>(null);
  const [purchaseButtonRect, setPurchaseButtonRect] = useState<Rect | null>(null);
  const textboxShownRef = useRef(false);

  const measureElementInContainer = useCallback((el: HTMLElement, cr: DOMRect): Rect => {
    const r = el.getBoundingClientRect();
    return {
      left: (r.left - cr.left) / appScale,
      top: (r.top - cr.top) / appScale,
      width: r.width / appScale,
      height: r.height / appScale,
    };
  }, [appScale]);

  const measure = useCallback(() => {
    const container = document.getElementById('game-container');
    if (!container) return;
    const cr = container.getBoundingClientRect();
    const s = document.getElementById(FTUE10_TAB_SEEDS_ID);
    const o = document.getElementById(FTUE10_TAB_ORDERS_ID);
    const g = document.getElementById(FTUE10_TAB_GARDEN_ID);
    const purchase = document.getElementById(FTUE10_PURCHASE_BUTTON_ID);
    if (s) {
      setSeedsTabRect(measureElementInContainer(s, cr));
    } else setSeedsTabRect(null);
    if (o) {
      setOrdersTabRect(measureElementInContainer(o, cr));
    } else setOrdersTabRect(null);
    if (g) {
      setGardenTabRect(measureElementInContainer(g, cr));
    } else setGardenTabRect(null);
    if (purchase && phase === 'finger') {
      setPurchaseButtonRect(measureElementInContainer(purchase, cr));
    }
  }, [appScale, measureElementInContainer, phase]);

  useEffect(() => {
    setOpacity(0);
    const t = setTimeout(() => setOpacity(1), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!phase && !isFadingOut) return;
    measure();
    const t = setTimeout(measure, 100);
    const raf = requestAnimationFrame(measure);
    const resize = () => measure();
    window.addEventListener('resize', resize);
    // Re-measure after panel open so Seeds tab hole is correct (panel_open_orders)
    const t2 = phase === 'panel_open_orders' ? setTimeout(measure, 400) : undefined;
    const t3 = phase === 'panel_open_orders' ? setTimeout(measure, 680) : undefined;
    return () => {
      clearTimeout(t);
      if (t2) clearTimeout(t2);
      if (t3) clearTimeout(t3);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [phase, isFadingOut, measure]);

  useEffect(() => {
    if (!isFadingOut || !onFadeOutComplete) return;
    setFadeOutOpacity(0);
    const t = setTimeout(onFadeOutComplete, FADE_OUT_MS);
    return () => clearTimeout(t);
  }, [isFadingOut, onFadeOutComplete]);

  // Finger 2: show only after panel is fully open (700ms) so position is final, then fade in
  useEffect(() => {
    if (phase !== 'panel_open_orders') {
      setShowPanelOpenContent(false);
      setFinger2Opacity(0);
      return;
    }
    setShowPanelOpenContent(false);
    setFinger2Opacity(0);
    const t = setTimeout(() => {
      setShowPanelOpenContent(true);
      requestAnimationFrame(() => setFinger2Opacity(1));
    }, PANEL_OPEN_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Finger 3: wait for Garden tab slide to finish, then measure purchase button in final position
  useEffect(() => {
    if (phase !== 'finger') {
      setShowFinger3(false);
      setPurchaseButtonRect(null);
      return;
    }
    setShowFinger3(false);
    setPurchaseButtonRect(null);
    const tShow = setTimeout(() => setShowFinger3(true), FINGER3_DELAY_MS);
    return () => clearTimeout(tShow);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'finger') return;
    measure();
    const t1 = setTimeout(measure, GARDEN_TAB_SLIDE_MS);
    const t2 = setTimeout(measure, FINGER3_DELAY_MS);
    const t3 = setTimeout(measure, FINGER3_DELAY_MS + 80);
    const resize = () => measure();
    window.addEventListener('resize', resize);
    const purchase = document.getElementById(FTUE10_PURCHASE_BUTTON_ID);
    const ro = purchase ? new ResizeObserver(measure) : null;
    if (purchase && ro) ro.observe(purchase);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', resize);
      ro?.disconnect();
    };
  }, [phase, measure]);

  // Textbox: fade in once when finger 2 appears, stay visible through finger 3, fade only when overlay fades out
  useEffect(() => {
    const show = (phase === 'panel_open_orders' && showPanelOpenContent) || phase === 'finger';
    if (show && !textboxShownRef.current) {
      textboxShownRef.current = true;
      setTextboxOpacity(0);
      const t = setTimeout(() => setTextboxOpacity(1), 50);
      return () => clearTimeout(t);
    }
    if (!show) {
      textboxShownRef.current = false;
      setTextboxOpacity(0);
    }
  }, [phase, showPanelOpenContent]);

  const showTextbox = ((phase === 'panel_open_orders' && showPanelOpenContent) || phase === 'finger') && harvestButtonRect && opacity > 0 && fadeOutOpacity > 0;
  const effectiveOpacity = isFadingOut ? fadeOutOpacity : opacity;

  const isFingerPhase = phase === 'finger';
  const effectivePurchaseRect = purchaseButtonRect ?? purchaseButtonRectProp ?? null;
  const holeRect = phase === 'point_orders' ? seedsTabRect : phase === 'panel_open_orders' ? gardenTabRect : isFingerPhase ? effectivePurchaseRect : null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 99,
        transition: `opacity ${isFadingOut ? FADE_OUT_MS : FADE_IN_MS}ms ease-out`,
        opacity: effectiveOpacity,
      }}
    >
      {/* Blocking: point_orders → hole over Seeds; panel_open_orders → hole over Garden; finger → hole over purchase; holes slightly expanded so target stays tappable */}
      {!isFadingOut && phase && (
        phase === 'point_orders' && seedsTabRect ? (
          (() => {
            const h = scaleRectFromCenter(seedsTabRect, FINGER1_HOLE_SCALE_X, FINGER1_HOLE_SCALE_Y);
            const blockStyle = DEBUG_FINGER1_BLOCKER_VISIBLE ? { backgroundColor: FTUE_BLOCKER_TINT as const } : {};
            return (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-0 top-0 right-0 pointer-events-auto" style={{ height: h.top, ...blockStyle }} />
                <div className="absolute left-0 pointer-events-auto" style={{ top: h.top, width: h.left, height: h.height, ...blockStyle }} />
                <div className="absolute top-0 bottom-0 pointer-events-auto" style={{ left: rectRight(h), right: 0, ...blockStyle }} />
                <div className="absolute left-0 right-0 bottom-0 pointer-events-auto" style={{ top: rectBottom(h), ...blockStyle }} />
              </div>
            );
          })()
        ) : phase === 'panel_open_orders' && gardenTabRect ? (
          (() => {
            const h = scaleRectFromCenter(
              expandRect(gardenTabRect, GARDEN_HOLE_PADDING_PX),
              1,
              GARDEN_HOLE_SCALE_Y
            );
            const blockStyle = DEBUG_FINGER2_BLOCKER_VISIBLE ? { backgroundColor: FTUE_BLOCKER_TINT as const } : {};
            return (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-0 top-0 right-0 pointer-events-auto" style={{ height: h.top, ...blockStyle }} />
                <div className="absolute left-0 pointer-events-auto" style={{ top: h.top, width: h.left, height: h.height, ...blockStyle }} />
                <div className="absolute top-0 bottom-0 pointer-events-auto" style={{ left: rectRight(h), right: 0, ...blockStyle }} />
                <div className="absolute left-0 right-0 bottom-0 pointer-events-auto" style={{ top: rectBottom(h), ...blockStyle }} />
              </div>
            );
          })()
        ) : isFingerPhase && showFinger3 && effectivePurchaseRect ? (
          (() => {
            const h = expandRect(effectivePurchaseRect, HOLE_PADDING_PX);
            const blockStyle = DEBUG_FINGER3_BLOCKER_VISIBLE ? { backgroundColor: FTUE_BLOCKER_TINT as const } : {};
            return (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-0 top-0 right-0 pointer-events-auto" style={{ height: h.top, ...blockStyle }} />
                <div className="absolute left-0 pointer-events-auto" style={{ top: h.top, width: h.left, height: h.height, ...blockStyle }} />
                <div className="absolute top-0 bottom-0 pointer-events-auto" style={{ left: rectRight(h), right: 0, ...blockStyle }} />
                <div className="absolute left-0 right-0 bottom-0 pointer-events-auto" style={{ top: rectBottom(h), ...blockStyle }} />
              </div>
            );
          })()
        ) : (
          <div className="absolute inset-0 pointer-events-auto" aria-hidden />
        )
      )}

      {/* Finger at Seeds tab – rotated -150° */}
      {phase === 'point_orders' && seedsTabRect && opacity > 0 && !isFadingOut && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: seedsTabRect.left + seedsTabRect.width / 2 - fingerSize / 2 + 135 * FTUE_VISUAL_SCALE,
            top: seedsTabRect.top - fingerSize - 125 * FTUE_VISUAL_SCALE,
            width: fingerSize,
            height: fingerSize,
            transformOrigin: 'center bottom',
            animation: 'ftue10FingerDownOrders 1.2s ease-in-out infinite',
          }}
        >
          <style>{`
            @keyframes ftue10FingerDownOrders {
              0%, 100% { transform: translate(0, 0) rotate(-150deg); }
              50% { transform: translate(${-tapDownPx * 0.5}px, ${tapDownPx}px) rotate(-150deg); }
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

      {/* Finger pointing straight down at Garden tab (0s delay, fade in over FINGER2_FADE_MS) */}
      {phase === 'panel_open_orders' && showPanelOpenContent && gardenTabRect && opacity > 0 && !isFadingOut && (
        <div
          className="absolute pointer-events-none"
          style={{
            left:
              gardenTabRect.left +
              gardenTabRect.width / 2 -
              fingerSize / 2 -
              40 * FTUE_VISUAL_SCALE -
              GARDEN_FINGER_NUDGE_LEFT_PX,
            top: gardenTabRect.top - fingerSize - 135 * FTUE_VISUAL_SCALE,
            width: fingerSize,
            height: fingerSize,
            transformOrigin: 'center bottom',
            animation: 'ftue10FingerDown 1.2s ease-in-out infinite',
            opacity: finger2Opacity,
            transition: `opacity ${FINGER2_FADE_MS}ms ease-out`,
          }}
        >
          <style>{`
            @keyframes ftue10FingerDown {
              0%, 100% { transform: translateY(0) rotate(180deg); }
              50% { transform: translateY(${tapDownPx}px) rotate(180deg); }
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

      {/* Finger at purchase button (FTUE 5 style); show only after Seeds tab transition finished */}
      {isFingerPhase && showFinger3 && effectivePurchaseRect && opacity > 0 && !isFadingOut && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: effectivePurchaseRect.left + effectivePurchaseRect.width / 2 - fingerSize / 2,
            top: effectivePurchaseRect.top + effectivePurchaseRect.height / 2 - fingerSize / 2,
            width: fingerSize,
            height: fingerSize,
            transformOrigin: 'center center',
            animation: 'ftue5FingerPoint 1.2s ease-in-out infinite',
          }}
        >
          <style>{`
            @keyframes ftue5FingerPoint {
              0%, 100% { transform: translate(0, 0) scaleX(-1) rotate(-45deg); }
              50% { transform: translate(${tapOffsetX}px, ${tapOffsetY}px) scaleX(-1) rotate(-45deg); }
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

      {/* Textbox: center of screen (slightly high) for panel_open_orders and finger phase */}
      {harvestButtonRect && showTextbox && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '40%',
            transform: 'translateX(-50%)',
            ...FTUE_TEXTBOX,
            width: 360 * FTUE_VISUAL_SCALE,
            maxWidth: 'calc(100% - 40px)',
            opacity: textboxOpacity,
            transition: `opacity ${(phase === 'panel_open_orders' && showPanelOpenContent) ? FINGER2_FADE_MS : TEXTBOX_FADE_IN_MS}ms ease-out`,
          }}
        >
          <div className="w-full flex items-center justify-center" style={{ marginBottom: FTUE_TEXTBOX_DIVIDER_MARGIN_BOTTOM }}>
            <img
              src={assetPath('/assets/ui/popup_divider.png')}
              alt=""
              className="h-auto object-contain"
              style={{ width: '100%' }}
            />
          </div>
          <p className="text-right m-0 font-medium italic leading-snug" style={{ ...FTUE_TEXTBOX_TEXT, paddingLeft: '20px', paddingRight: '20px' }}>
            Use your coins to upgrade your garden
          </p>
        </div>
      )}
    </div>
  );
};
