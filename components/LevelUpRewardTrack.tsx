/**
 * Horizontally scrollable level-up future-rewards track (masked inside the cream popup).
 * Authored for PopupPrescaleFrame 2× space (visual ≈ half of these px).
 *
 * Native overflow scroll is unreliable under CSS `scale()` on Android WebView, so we
 * drive scrollLeft with pointer drag, then settle smoothly onto the nearest node center
 * (predicted from release velocity — one continuous ease, no hard snap-back).
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import {
  getGardenLevelIconPath,
  getGenericUiAssetPath,
} from '../utils/gardenAssets';
import { DEFAULT_GARDEN_ID, type GardenId } from '../constants/gardens';
import { getGardenLevelRewardTrack, getLevelUpRewardTrack } from './UpgradeList';
import { playSfx, SFX_IDS } from '../utils/sfx';

const HEADER_PX = Math.round(120 * 1.15);
const ICON_PX = Math.round(74 * 1.15);
/** Current-level header/icon bump (1.15, then −10%, then −5%). */
const CURRENT_HEADER_SCALE = 1.15 * 0.9 * 0.95;
const HEADER_CURRENT_PX = Math.round(HEADER_PX * CURRENT_HEADER_SCALE);
const ICON_CURRENT_PX = Math.round(ICON_PX * CURRENT_HEADER_SCALE);
/** Nudge current header up so the larger sprite has room above the bar. */
const CURRENT_HEADER_LIFT_PX = 10;
/** Extra push down for the selected header/icon (5 visual px → 10 at 2×). */
const CURRENT_HEADER_DOWN_PX = 10;
/** Match PageHeader level pill sprite/number, bumped ~15% for track readability (×2 for prescale). */
const BADGE_SPRITE_PX = Math.round(60 * 1.15);
const BADGE_FONT_PX = Math.round(24 * 1.15);
const NODE_GAP_PX = 72;
/** 28 + 20 (= +10 visual px under 0.5 prescale). */
const BAR_HEIGHT_PX = 48;
/** Progress bar continues past the first/last node off-screen (2× prior overhang). */
const BAR_OVERHANG_PX = Math.round(HEADER_PX * 1.15 * 2);
/** Horizontal room so overhang stays inside content; scroll still clamps to node centers. */
const EDGE_PAD_PX = Math.round(BAR_OVERHANG_PX - HEADER_PX / 2 + 12);
const PAD_X_PX = EDGE_PAD_PX;
/**
 * Top mask room: selected header is larger + lifted + drop-shadow, plus extra
 * headroom that overlaps the description (pulled up via negative margin so the
 * progress row stays put).
 */
const MASK_TOP_BASE_PX =
  14 + CURRENT_HEADER_LIFT_PX + Math.ceil((HEADER_CURRENT_PX - HEADER_PX) / 2) + 12;
/** Extra clip room above icons (overlaps description; compensated by negative margin). */
const MASK_TOP_OVERLAP_PX = 44;
const MASK_TOP_PAD_PX = MASK_TOP_BASE_PX + MASK_TOP_OVERLAP_PX;
/**
 * Cream content padding is 40 (2×). Inner stroke was ~15 visual px (= 30 at 2×);
 * mask widened +5 visual px each side → inset 10 visual (= 20 at 2×).
 */
const CREAM_PAD_X_PX = 40;
const INNER_STROKE_INSET_2X_PX = 20;
const BLEED_X_PX = CREAM_PAD_X_PX - INNER_STROKE_INSET_2X_PX;
/** Match PageHeader level progress fill (vertical). */
const FILL_INNER = 'linear-gradient(180deg, #7fc8eb 0%, #559dcf 100%)';
/** Match PageHeader level progress outer gradient stroke (vertical). */
const FILL_STROKE = 'linear-gradient(180deg, #c2e3f6 0%, #2d77b5 100%)';
const TRACK_BROWN = '#6d4c41';
/** Same as PageHeader level number. */
const LEVEL_NUM_COLOR = '#c8e9eb';
/** 1px stroke at display → 2px in prescale space. */
const FILL_STROKE_PAD_PX = 2;

/** Screen-px → scrollLeft (content is CSS-scaled 0.5). */
const POINTER_TO_SCROLL = 2;
const MOMENTUM_FRICTION = 0.92;
const MOMENTUM_MIN_VX = 0.06;
const SNAP_MS_MIN = 420;
const SNAP_MS_MAX = 780;
/** Visual 14px under 0.5 popup prescale → 28 in authored space. */
const TOAST_FONT_PX = 28;
const TOAST_MS = 1200;
/** Deep blue stroke matching level-up header chrome. */
const TOAST_STROKE = '#143552';

function progressFillRatio(
  currentLevel: number,
  levels: number[],
  /** 0–1 progress within the current level toward the next (top-bar goals). */
  levelProgressFraction = 0,
): number {
  if (levels.length === 0) return 0;
  const levelValue = currentLevel + Math.max(0, Math.min(1, levelProgressFraction));
  if (levels.length === 1) return levelValue >= levels[0]! ? 1 : 0;
  if (levelValue <= levels[0]!) return 0;
  if (levelValue >= levels[levels.length - 1]!) return 1;
  for (let i = 0; i < levels.length - 1; i++) {
    const a = levels[i]!;
    const b = levels[i + 1]!;
    if (levelValue >= a && levelValue <= b) {
      const t = (levelValue - a) / Math.max(1e-6, b - a);
      return (i + t) / (levels.length - 1);
    }
  }
  return 1;
}

/** Softer settle than cubic — less abrupt when reversing into a stop. */
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

/** Garden-level intro: very slow start, accelerates, gentler ease-out than the start. */
function easeIntroRevealScroll(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  if (x < 0.55) {
    const u = x / 0.55;
    return 0.55 * Math.pow(u, 3.6);
  }
  const u = (x - 0.55) / 0.45;
  return 0.55 + 0.45 * (1 - Math.pow(1 - u, 2.1));
}

const INTRO_REVEAL_DELAY_MS = 250;
const INTRO_REVEAL_SCROLL_MS = 3000;
const INTRO_BOUNCE_MS = 320;
/** After selected bounce finishes, wait before enabling/bouncing Lets go. */
export const INTRO_BUTTON_DELAY_MS = 250;

export interface LevelUpRewardTrackProps {
  currentLevel: number;
  gardenId?: GardenId;
  /**
   * Fraction of goals completed toward the next player level (0–1).
   * Drives the blue fill between the current unlock and the next track node.
   */
  levelProgressFraction?: number;
  /**
   * Garden Level popup: extend generic coin nodes through currentLevel+1.
   * Level-up popup keeps the short track (one peek coin after last major).
   */
  variant?: 'levelUp' | 'gardenLevel';
  /**
   * Garden 1 level-2 FTUE: keep the track scrolled to the right end from first layout
   * (no visible snap). Scroll-back animation waits for `introRevealPlay`.
   */
  introReveal?: boolean;
  /** When true, start the delayed scroll-back + selected bounce (popup fully visible). */
  introRevealPlay?: boolean;
  /** Fired after the intro scroll + selected bounce finish. */
  onIntroRevealComplete?: () => void;
  /** Increment to instantly finish the intro reveal (dev Shift+T). */
  introSkipNonce?: number;
}

export const LevelUpRewardTrack: React.FC<LevelUpRewardTrackProps> = ({
  currentLevel,
  gardenId = DEFAULT_GARDEN_ID,
  levelProgressFraction = 0,
  variant = 'levelUp',
  introReveal = false,
  introRevealPlay = false,
  onIntroRevealComplete,
  introSkipNonce = 0,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animRafRef = useRef(0);
  const velocityRef = useRef(0); // scrollLeft units per ms
  const lastSampleRef = useRef<{ x: number; t: number } | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startScroll: number;
    moved: boolean;
  } | null>(null);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    left: number;
    top: number;
  } | null>(null);
  const toastIdRef = useRef(0);
  const toastTimeoutRef = useRef(0);
  const [introLockInput, setIntroLockInput] = useState(introReveal);
  const [selectedBounce, setSelectedBounce] = useState(false);
  const introScrollActiveRef = useRef(false);
  const onIntroRevealCompleteRef = useRef(onIntroRevealComplete);
  onIntroRevealCompleteRef.current = onIntroRevealComplete;

  const items = useMemo(
    () =>
      variant === 'gardenLevel'
        ? getGardenLevelRewardTrack(gardenId, currentLevel)
        : getLevelUpRewardTrack(gardenId),
    [gardenId, currentLevel, variant],
  );
  const levels = useMemo(() => items.map((i) => i.level), [items]);
  const fillRatio = progressFillRatio(currentLevel, levels, levelProgressFraction);
  const levelBadgeSrc = getGardenLevelIconPath(gardenId);
  const levelCompleteBadgeSrc = getGenericUiAssetPath('ui_level_complete.png');
  const headerBlueSrc = assetPath('/assets/ui/popup_header_blue.png');
  const headerSelectedSrc = getGenericUiAssetPath('popup_header_selected.png');

  /**
   * Snap targets are always one in from each extreme (garden start / trailing peek
   * stay visible but are not lock points).
   */
  const lockMinIndex = items.length > 2 ? 1 : 0;
  const lockMaxIndex = items.length > 2 ? items.length - 2 : Math.max(0, items.length - 1);

  const focusIndex = useMemo(() => {
    if (items.length === 0) return 0;
    let best = 0;
    for (let i = 0; i < items.length; i++) {
      if (items[i]!.level <= currentLevel) best = i;
      else break;
    }
    if (items[best]!.level < currentLevel && best < items.length - 1) {
      best = best + 1;
    }
    return Math.max(lockMinIndex, Math.min(lockMaxIndex, best));
  }, [items, currentLevel, lockMinIndex, lockMaxIndex]);

  const stopAnim = () => {
    if (animRafRef.current) {
      cancelAnimationFrame(animRafRef.current);
      animRafRef.current = 0;
    }
  };

  /** Scroll range: first lockable node centered … last lockable node centered. */
  const getScrollBounds = (scroller: HTMLDivElement) => {
    const first = nodeRefs.current[lockMinIndex];
    const last = nodeRefs.current[lockMaxIndex];
    if (!first || !last) {
      const max = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
      return { min: 0, max };
    }
    const min = first.offsetLeft + first.offsetWidth / 2 - scroller.clientWidth / 2;
    const max = last.offsetLeft + last.offsetWidth / 2 - scroller.clientWidth / 2;
    return { min: Math.max(0, min), max: Math.max(Math.max(0, min), max) };
  };

  const clampScroll = (scroller: HTMLDivElement, value: number) => {
    const { min, max } = getScrollBounds(scroller);
    return Math.max(min, Math.min(max, value));
  };

  const scrollLeftToCenterNode = (index: number) => {
    const scroller = scrollRef.current;
    if (!scroller) return 0;
    const clampedIndex = Math.max(lockMinIndex, Math.min(lockMaxIndex, index));
    const node = nodeRefs.current[clampedIndex];
    // Prefer measured nodes; fall back to layout constants so intro can start at the
    // far right before refs/layout settle (avoids a visible snap on open).
    const center = node
      ? node.offsetLeft + node.offsetWidth / 2
      : PAD_X_PX + clampedIndex * (HEADER_PX + NODE_GAP_PX) + HEADER_PX / 2;
    const first = nodeRefs.current[lockMinIndex];
    const last = nodeRefs.current[lockMaxIndex];
    const firstCenter = first
      ? first.offsetLeft + first.offsetWidth / 2
      : PAD_X_PX + lockMinIndex * (HEADER_PX + NODE_GAP_PX) + HEADER_PX / 2;
    const lastCenter = last
      ? last.offsetLeft + last.offsetWidth / 2
      : PAD_X_PX + lockMaxIndex * (HEADER_PX + NODE_GAP_PX) + HEADER_PX / 2;
    const half = scroller.clientWidth / 2;
    const min = Math.max(0, firstCenter - half);
    const max = Math.max(min, lastCenter - half);
    return Math.max(min, Math.min(max, center - half));
  };

  const nearestNodeIndex = (scrollLeft: number) => {
    const scroller = scrollRef.current;
    if (!scroller || items.length === 0) return lockMinIndex;
    const centerX = scrollLeft + scroller.clientWidth / 2;
    let best = lockMinIndex;
    let bestDist = Infinity;
    for (let i = lockMinIndex; i <= lockMaxIndex; i++) {
      const node = nodeRefs.current[i];
      if (!node) continue;
      const nodeCenter = node.offsetLeft + node.offsetWidth / 2;
      const d = Math.abs(nodeCenter - centerX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  };

  const animateScrollTo = (target: number, durationMs: number) => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    stopAnim();
    const start = scroller.scrollLeft;
    const delta = target - start;
    if (Math.abs(delta) < 0.5) {
      scroller.scrollLeft = target;
      return;
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / durationMs);
      scroller.scrollLeft = start + delta * easeOutQuint(u);
      if (u < 1) {
        animRafRef.current = requestAnimationFrame(tick);
      } else {
        animRafRef.current = 0;
        scroller.scrollLeft = target;
      }
    };
    animRafRef.current = requestAnimationFrame(tick);
  };

  /** Predict coast stop from velocity, then ease once onto that node (no coast→jerk→snap). */
  const settleFromRelease = (vx: number) => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    stopAnim();

    let estimate = scroller.scrollLeft;
    let v = vx;
    for (let i = 0; i < 160 && Math.abs(v) > MOMENTUM_MIN_VX; i++) {
      estimate = clampScroll(scroller, estimate + v * 16);
      v *= MOMENTUM_FRICTION;
      const { min, max } = getScrollBounds(scroller);
      if (estimate <= min || estimate >= max) {
        v = 0;
      }
    }

    const idx = nearestNodeIndex(estimate);
    const target = scrollLeftToCenterNode(idx);
    const dist = Math.abs(target - scroller.scrollLeft);
    const duration = Math.min(
      SNAP_MS_MAX,
      Math.max(SNAP_MS_MIN, 360 + dist * 0.7 + Math.abs(vx) * 90),
    );
    animateScrollTo(target, duration);
  };

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    if (introReveal) {
      // Don't snap back to the end once the intro scroll-back has started.
      if (introScrollActiveRef.current) return;
      scroller.scrollLeft = scrollLeftToCenterNode(lockMaxIndex);
      return;
    }
    const node = nodeRefs.current[focusIndex];
    if (!node) return;
    scroller.scrollLeft = scrollLeftToCenterNode(focusIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial center only
  }, [focusIndex, items.length, introReveal, lockMaxIndex]);

  // Re-assert end scroll after the scroller gets a real width (preflight → enter).
  useLayoutEffect(() => {
    if (!introReveal || introScrollActiveRef.current || introSkipNonce > 0) return;
    const scroller = scrollRef.current;
    if (!scroller || scroller.clientWidth <= 0) return;
    scroller.scrollLeft = scrollLeftToCenterNode(lockMaxIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introReveal, introRevealPlay, lockMaxIndex, introSkipNonce]);

  useEffect(() => {
    if (!introReveal || !introRevealPlay) return;
    // Dev skip already finished this intro — don't restart the scroll.
    if (introSkipNonce > 0) return;
    let cancelled = false;
    let bounceTimer = 0;
    let completeTimer = 0;
    let rafId = 0;
    setIntroLockInput(true);
    // Keep at end until the delayed scroll-back starts (already set in layout).
    introScrollActiveRef.current = false;

    const finishWithBounce = () => {
      if (cancelled) return;
      // Same SFX as collection FTUE plants 1–4 bounce.
      playSfx(SFX_IDS.uiConfirmNormal);
      setSelectedBounce(true);
      bounceTimer = window.setTimeout(() => {
        if (cancelled) return;
        setSelectedBounce(false);
        setIntroLockInput(false);
        onIntroRevealCompleteRef.current?.();
      }, INTRO_BOUNCE_MS);
    };

    const delayTimer = window.setTimeout(() => {
      if (cancelled) return;
      const scroller = scrollRef.current;
      if (!scroller) {
        setIntroLockInput(false);
        onIntroRevealCompleteRef.current?.();
        return;
      }
      // Ensure we're at the far-right lock before scrolling back (refs/layout ready).
      const startAtEnd = scrollLeftToCenterNode(lockMaxIndex);
      scroller.scrollLeft = startAtEnd;
      const target = scrollLeftToCenterNode(focusIndex);
      const start = startAtEnd;
      const delta = target - start;
      introScrollActiveRef.current = true;

      if (Math.abs(delta) < 1) {
        finishWithBounce();
        return;
      }

      const t0 = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const sc = scrollRef.current;
        if (!sc) return;
        const u = Math.min(1, (now - t0) / INTRO_REVEAL_SCROLL_MS);
        sc.scrollLeft = start + delta * easeIntroRevealScroll(u);
        if (u < 1) {
          rafId = requestAnimationFrame(tick);
          animRafRef.current = rafId;
        } else {
          animRafRef.current = 0;
          sc.scrollLeft = target;
          // Bounce only after the scroll has fully settled.
          finishWithBounce();
        }
      };
      rafId = requestAnimationFrame(tick);
      animRafRef.current = rafId;
    }, INTRO_REVEAL_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(delayTimer);
      if (bounceTimer) window.clearTimeout(bounceTimer);
      if (completeTimer) window.clearTimeout(completeTimer);
      if (rafId) cancelAnimationFrame(rafId);
      stopAnim();
      introScrollActiveRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart when intro play arms
  }, [introReveal, introRevealPlay, focusIndex, lockMaxIndex, introSkipNonce]);

  useEffect(() => {
    if (!introReveal || introSkipNonce <= 0) return;
    stopAnim();
    introScrollActiveRef.current = true;
    const scroller = scrollRef.current;
    if (scroller) {
      scroller.scrollLeft = scrollLeftToCenterNode(focusIndex);
    }
    setSelectedBounce(false);
    setIntroLockInput(false);
    // Parent handles enabling Lets go (immediate) via introSkipNonce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introSkipNonce]);

  useEffect(() => {
    nodeRefs.current = nodeRefs.current.slice(0, items.length);
  }, [items.length]);

  useEffect(
    () => () => {
      stopAnim();
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    },
    [],
  );

  const showNodeToast = (index: number) => {
    const item = items[index];
    const node = nodeRefs.current[index];
    if (!item || !node) return;
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    const id = ++toastIdRef.current;
    setToast({
      id,
      message: item.title,
      left: node.offsetLeft + node.offsetWidth / 2,
      top: MASK_TOP_PAD_PX - 2,
    });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
      toastTimeoutRef.current = 0;
    }, TOAST_MS);
  };

  const findTapNodeIndex = (clientX: number) => {
    const scroller = scrollRef.current;
    if (!scroller || items.length === 0) return -1;
    const rect = scroller.getBoundingClientRect();
    // PopupPrescaleFrame scales 0.5; pointer is screen px → layout/scroll coords ×2.
    const xInContent =
      (clientX - rect.left) * POINTER_TO_SCROLL + scroller.scrollLeft;
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < items.length; i++) {
      const node = nodeRefs.current[i];
      if (!node) continue;
      const cx = node.offsetLeft + node.offsetWidth / 2;
      const d = Math.abs(cx - xInContent);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    // Only count as a tap if near a node center (half header width).
    if (best < 0 || bestDist > HEADER_PX * 0.55) return -1;
    return best;
  };

  if (items.length === 0) return null;

  const contentWidth =
    PAD_X_PX * 2 + items.length * HEADER_PX + (items.length - 1) * NODE_GAP_PX;
  const firstNodeCenter = PAD_X_PX + HEADER_PX / 2;
  const lastNodeCenter =
    PAD_X_PX + (items.length - 1) * (HEADER_PX + NODE_GAP_PX) + HEADER_PX / 2;
  const nodeSpan = Math.max(0, lastNodeCenter - firstNodeCenter);
  const barLeft = firstNodeCenter - BAR_OVERHANG_PX;
  const barWidth = nodeSpan + BAR_OVERHANG_PX * 2;
  // Left overhang fills once at/ past garden start (level 1 is already reached);
  // node span follows milestone + in-level progress beyond that.
  const levelValue =
    currentLevel + Math.max(0, Math.min(1, levelProgressFraction));
  const fillWidth =
    levelValue < levels[0]!
      ? 0
      : BAR_OVERHANG_PX + nodeSpan * fillRatio;
  const badgeTop = MASK_TOP_PAD_PX + HEADER_PX + 8;
  const contentHeight = badgeTop + BADGE_SPRITE_PX;
  const barTop = badgeTop + BADGE_SPRITE_PX / 2 - BAR_HEIGHT_PX / 2;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (introLockInput) return;
    const scroller = scrollRef.current;
    if (!scroller) return;
    stopAnim();
    velocityRef.current = 0;
    const t = performance.now();
    lastSampleRef.current = { x: e.clientX, t };
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: scroller.scrollLeft,
      moved: false,
    };
    scroller.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const scroller = scrollRef.current;
    if (!drag || !scroller || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 2) drag.moved = true;
    scroller.scrollLeft = clampScroll(
      scroller,
      drag.startScroll - dx * POINTER_TO_SCROLL,
    );

    const t = performance.now();
    const prev = lastSampleRef.current;
    if (prev && t > prev.t) {
      const screenVx = (e.clientX - prev.x) / (t - prev.t);
      velocityRef.current = -screenVx * POINTER_TO_SCROLL;
    }
    lastSampleRef.current = { x: e.clientX, t };
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const scroller = scrollRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const wasTap = !drag.moved;
    dragRef.current = null;
    lastSampleRef.current = null;
    try {
      scroller?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (wasTap) {
      const idx = findTapNodeIndex(e.clientX);
      if (idx >= 0) showNodeToast(idx);
    }
    settleFromRelease(velocityRef.current);
  };

  return (
    <div
      className="w-full"
      style={{
        // Negative overlap pulls the taller mask up over the description without
        // shifting where the progress icons sit relative to the text above.
        marginTop: 2 - MASK_TOP_OVERLAP_PX,
        marginBottom: variant === 'gardenLevel' ? 36 : 8,
        marginLeft: -BLEED_X_PX,
        marginRight: -BLEED_X_PX,
        width: `calc(100% + ${BLEED_X_PX * 2}px)`,
        pointerEvents: introLockInput ? 'none' : 'auto',
        touchAction: introLockInput ? 'none' : 'pan-x',
        position: 'relative',
        zIndex: 6,
      }}
    >
      <div
        ref={scrollRef}
        className="w-full no-scrollbar"
        style={{
          overflowX: introLockInput ? 'hidden' : 'auto',
          overflowY: 'hidden',
          touchAction: 'none',
          WebkitOverflowScrolling: 'touch',
          cursor: introLockInput ? 'default' : 'grab',
          pointerEvents: introLockInput ? 'none' : 'auto',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <div
          className="relative"
          style={{
            width: contentWidth,
            height: contentHeight,
            paddingLeft: PAD_X_PX,
            paddingRight: PAD_X_PX,
          }}
        >
          {/* Track bar — overhangs past first/last nodes; scroll stops at node centers */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: barLeft,
              top: barTop,
              width: barWidth,
              height: BAR_HEIGHT_PX,
              borderRadius: BAR_HEIGHT_PX,
              backgroundColor: TRACK_BROWN,
              overflow: 'hidden',
            }}
          >
            <div
              className="relative overflow-hidden"
              style={{
                width: Math.min(barWidth, Math.max(0, fillWidth)),
                height: BAR_HEIGHT_PX - 4,
                marginTop: 2,
                borderRadius: BAR_HEIGHT_PX,
              }}
            >
              <div
                className="w-full h-full overflow-hidden relative"
                style={{
                  padding: FILL_STROKE_PAD_PX,
                  background: FILL_STROKE,
                  borderRadius: BAR_HEIGHT_PX,
                  boxSizing: 'border-box',
                }}
              >
                <div
                  className="w-full h-full"
                  style={{
                    background: FILL_INNER,
                    borderRadius: BAR_HEIGHT_PX,
                  }}
                />
              </div>
            </div>
          </div>

          {items.map((item, i) => {
            const left = PAD_X_PX + i * (HEADER_PX + NODE_GAP_PX);
            const isPast = item.level < currentLevel;
            const isCurrent = item.level === currentLevel;
            const headerPx = isCurrent ? HEADER_CURRENT_PX : HEADER_PX;
            const iconPx = isCurrent ? ICON_CURRENT_PX : ICON_PX;
            const headerSrc = isCurrent ? headerSelectedSrc : headerBlueSrc;
            // Center in the normal header slot, then lift so the larger sprite clears the mask.
            const headerTop = isCurrent
              ? (HEADER_PX - HEADER_CURRENT_PX) / 2 -
                CURRENT_HEADER_LIFT_PX +
                CURRENT_HEADER_DOWN_PX
              : 0;
            return (
              <div
                key={`track-${item.level}-${item.title}`}
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
                className="absolute flex flex-col items-center pointer-events-none"
                style={{
                  left,
                  top: MASK_TOP_PAD_PX,
                  width: HEADER_PX,
                  zIndex: isCurrent ? 3 : 1,
                }}
              >
                <div
                  className="relative flex items-center justify-center shrink-0"
                  style={{
                    width: HEADER_PX,
                    height: HEADER_PX,
                  }}
                >
                  <div
                    className="absolute flex items-center justify-center"
                    style={{
                      left: '50%',
                      top: headerTop,
                      width: headerPx,
                      height: headerPx,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <div
                      className={`relative flex items-center justify-center w-full h-full${
                        isCurrent && selectedBounce ? ' level-up-track-selected-bounce' : ''
                      }`}
                    >
                    <img
                      src={headerSrc}
                      alt=""
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{
                        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))',
                        opacity: isPast || isCurrent ? 1 : 0.92,
                      }}
                    />
                    <img
                      src={item.icon}
                      alt=""
                      className="relative object-contain"
                      style={{
                        width: iconPx,
                        height: iconPx,
                        marginTop: -4,
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                      }}
                      draggable={false}
                    />
                    </div>
                  </div>
                </div>

                <div
                  className="relative flex items-center justify-center shrink-0"
                  style={{
                    width: BADGE_SPRITE_PX,
                    height: BADGE_SPRITE_PX,
                    marginTop: 8,
                    zIndex: 2,
                  }}
                >
                  <img
                    src={isPast ? levelCompleteBadgeSrc : levelBadgeSrc}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain"
                    draggable={false}
                  />
                  {!isPast && (
                    <span
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center font-black leading-none"
                      style={{
                        color: LEVEL_NUM_COLOR,
                        fontSize: BADGE_FONT_PX,
                        WebkitTextStroke: '2px rgba(0,0,0,0.5)',
                        paintOrder: 'stroke fill',
                      }}
                    >
                      {item.level}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {toast && (
            <div
              className="absolute pointer-events-none z-20"
              style={{
                left: toast.left,
                top: toast.top,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <span
                key={toast.id}
                className="reward-track-toast-text font-extrabold leading-snug tracking-tight"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: TOAST_FONT_PX,
                  whiteSpace: 'nowrap',
                  color: '#fcf0c7',
                  WebkitTextStroke: `2.5px ${TOAST_STROKE}`,
                  paintOrder: 'stroke fill',
                  textShadow: `0 2px 4px rgba(20, 53, 82, 0.55)`,
                }}
              >
                {toast.message}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
