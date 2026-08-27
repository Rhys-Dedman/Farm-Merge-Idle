/**
 * Match-3 animation: matching icons gather with scale 1→2→1.5 (far wind-up,
 * accelerate into center). On collide: yellow popup-style leaf burst + center
 * reveal 1.5→4.5→5→5→2.5→3.25→3 (Y bounce through 2.5) + gold coin-collect leaf burst,
 * then hold until
 * tap → fade out → board reset.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  SPECIAL_DELIVERY_MATCH3_CHROME_FADE_MS,
  SPECIAL_DELIVERY_MATCH3_COIN_ICON_FADE_MS,
  SPECIAL_DELIVERY_MATCH3_DISMISS_MS,
  SPECIAL_DELIVERY_MATCH3_DOOR_CLOSE_DELAY_MS,
  SPECIAL_DELIVERY_MATCH3_MS,
  SPECIAL_DELIVERY_MATCH3_OVERLAY_OPACITY,
  SPECIAL_DELIVERY_MATCH3_REVEAL_COPY_START_SCALE,
  SPECIAL_DELIVERY_MATCH3_REVEAL_FX_FADE_END_KEYFRAME,
  SPECIAL_DELIVERY_MATCH3_REVEAL_FX_FADE_START_KEYFRAME,
  SPECIAL_DELIVERY_MATCH3_REVEAL_MS,
  SPECIAL_DELIVERY_MATCH3_REVEAL_SCALE_END,
  SPECIAL_DELIVERY_MATCH3_REVEAL_SCALES,
  SPECIAL_DELIVERY_MATCH3_REVEAL_Y_END_KEYFRAME,
  SPECIAL_DELIVERY_MATCH3_REVEAL_Y_PX,
  SPECIAL_DELIVERY_MATCH3_SCALE_END,
  SPECIAL_DELIVERY_MATCH3_SCALE_PEAK,
  SPECIAL_DELIVERY_MATCH3_SCALE_START,
  SPECIAL_DELIVERY_REWARD_PIVOT_X,
  SPECIAL_DELIVERY_REWARD_PIVOT_Y,
} from '../constants/specialDeliveries';
import { GARDEN_1_ACTION_BUTTON_CHROME } from '../constants/gardenActionButtonTheme';
import { hapticSoft, hapticSuccess } from '../utils/haptics';
import { assetPath } from '../utils/assetPath';
import {
  getSpecialDeliveryRewardCopy,
  specialDeliveryRewardOverlayIconSrc,
  specialDeliveryRewardRevealIconSrc,
  type SpecialDeliveryClaimPresentation,
  type SpecialDeliveryReward,
} from '../utils/specialDeliveryRewards';
import { getPerformanceMode } from '../utils/performanceMode';
import { LeafBurst, LEAF_BURST_BASELINE_COUNT } from './LeafBurst';
import { RewardRevealGlow } from './RewardRevealGlow';

const REVEAL_PIVOT_X = 0.5;
const REVEAL_PIVOT_Y = 0.5;
/** Amount pill (seed/harvest recharge chrome). Sized so hold scale ≈ 112×38 screen px. */
const REVEAL_AMOUNT_PILL_WIDTH_PX = (300 * 0.5 * 0.75) / SPECIAL_DELIVERY_MATCH3_REVEAL_SCALE_END;
const REVEAL_AMOUNT_PILL_HEIGHT_PX = (100 * 0.5 * 0.75) / SPECIAL_DELIVERY_MATCH3_REVEAL_SCALE_END;
const REVEAL_AMOUNT_PILL_FONT_PX =
  ((13 * ((300 * 0.5 * 0.75) / 52)) / SPECIAL_DELIVERY_MATCH3_REVEAL_SCALE_END) * 0.85 * 0.75;
const REVEAL_AMOUNT_PILL_BORDER_PX = 1;
const REVEAL_AMOUNT_PILL_BOTTOM_PCT = -4;
const REVEAL_AMOUNT_PILL = GARDEN_1_ACTION_BUTTON_CHROME;
/** Base sizes inside the scaled reveal wrapper (final on-screen ≈ × last reveal scale). */
/** Screen-space copy (not scaled with the reveal icon). */
const REVEAL_HEADLINE_FONT_PX = 36;
const REVEAL_SUBTITLE_FONT_PX = 24;
const REVEAL_DESC_FONT_PX = 16;
/** Extra lift for title + subtitle above the icon (screen px). */
const REVEAL_TITLE_BLOCK_GAP_PX = 48;
const REVEAL_TITLE_SUB_GAP_PX = 6;
/** Extra drop for description below the icon (screen px). */
const REVEAL_DESC_GAP_PX = 40;
const REVEAL_COPY_MAX_WIDTH_PX = 320;
const REVEAL_DESC_MAX_WIDTH_PX = 200;
const REVEAL_DIVIDER_WIDTH_PX = 180;
const REVEAL_HEADLINE_COLOR = '#ffd84a';
/** Bottom stop — sampled from yellow divider leaf particle. */
const REVEAL_HEADLINE_COLOR_BOTTOM = '#f69d42';
const REVEAL_SUBTITLE_COLOR = '#ffffff';
const REVEAL_SUBTITLE_COLOR_BOTTOM = '#e8e4dc';
/** Same as garden-upgrade headline top gradient stop. */
const REVEAL_DESC_COLOR = '#ffd84a';
const REVEAL_CLAIM_BG = '#b8d458';
const REVEAL_CLAIM_BORDER = '#8fb33a';
const REVEAL_CLAIM_TEXT = '#4a6b1e';
const REVEAL_CLAIM_PRESSED = '#9fc044';
const REVEAL_STAGGER_MS = 200;
const REVEAL_COPY_POP_MS = 300;
/** Large gold wash (yellow → transparent black). Local px; × hold scale ≈ prior screen size. */
const REVEAL_RADIAL_GOLD = '255, 236, 140';
const REVEAL_RADIAL_LARGE_SIZE_PX = (520 * 0.75 * 1.25) / SPECIAL_DELIVERY_MATCH3_REVEAL_SCALE_END;
const REVEAL_RADIAL_LARGE_OPACITY = 0.5 * 0.85;
/** Small / inner gold wash (yellow → transparent yellow); half large, then +25%, −25%. */
const REVEAL_RADIAL_SMALL_SIZE_PX = REVEAL_RADIAL_LARGE_SIZE_PX * 0.5 * 1.25 * 0.75;
const REVEAL_RADIAL_SMALL_OPACITY = 0.5;
/** Front wash (same color as small; size kept at pre-shrink small). */
const REVEAL_RADIAL_FRONT_SIZE_PX = REVEAL_RADIAL_LARGE_SIZE_PX * 0.5 * 1.25;

export interface SpecialDeliveryMatch3Item {
  doorIndex: number;
  iconSrc: string;
  overlayIconSrc?: string;
  startX: number;
  startY: number;
  sizePx: number;
}

interface Point {
  x: number;
  y: number;
}

interface TrailSeg {
  p: Point;
  t: number;
}

interface SpecialDeliveryMatch3Props {
  items: SpecialDeliveryMatch3Item[];
  /** Winning reward (drives reveal copy / amount pill). */
  reward: SpecialDeliveryReward;
  centerX: number;
  centerY: number;
  /**
   * Fired when the player claims (before dismiss fade). Viewport px for FX spawn.
   * May return a presentation that holds the icon / overlay while it plays.
   */
  onClaimReward?: (
    reward: SpecialDeliveryReward,
    startPoint: { x: number; y: number },
    meta?: { sizePx: number },
  ) => SpecialDeliveryClaimPresentation | void;
  /** Fired immediately on claim — clear non-winning hole rewards. */
  onClearLeftoverRewards?: () => void;
  /** Fired once the reveal settles and Claim Reward becomes tappable. */
  onClaimReady?: () => void;
  /** Fired when the player claims via the green button (start door closes). */
  onDismissStart?: () => void;
  onComplete: () => void;
}

const MAX_TRAIL_POINTS = 10;
const TRAIL_COLOR = '#ffffff';
const TRAIL_STROKE_WIDTH = 36;

type Phase = 'fly' | 'reveal' | 'hold' | 'dismiss';

function rotate2(x: number, y: number, rad: number): Point {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: x * c - y * s, y: x * s + y * c };
}

function cubic(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Gather flight: 1 → 2 → 1.5. */
function flightScale(t: number): number {
  if (t <= 0.55) {
    return lerp(SPECIAL_DELIVERY_MATCH3_SCALE_START, SPECIAL_DELIVERY_MATCH3_SCALE_PEAK, t / 0.55);
  }
  return lerp(
    SPECIAL_DELIVERY_MATCH3_SCALE_PEAK,
    SPECIAL_DELIVERY_MATCH3_SCALE_END,
    (t - 0.55) / 0.45,
  );
}

/** Center reveal: equal-time keyframes through SPECIAL_DELIVERY_MATCH3_REVEAL_SCALES. */
function revealScale(t: number): number {
  const scales = SPECIAL_DELIVERY_MATCH3_REVEAL_SCALES;
  const segs = scales.length - 1;
  if (segs <= 0) return scales[0] ?? 1;
  const clamped = Math.min(1, Math.max(0, t));
  const f = clamped * segs;
  const i = Math.min(segs - 1, Math.floor(f));
  const local = f - i;
  return lerp(scales[i]!, scales[i + 1]!, local);
}

/** Normalized progress of the Y bounce window (0 at start, 1 at the 2.5 keyframe). */
function revealYProgress(t: number): number {
  const segs = SPECIAL_DELIVERY_MATCH3_REVEAL_SCALES.length - 1;
  if (segs <= 0) return 1;
  const endT = SPECIAL_DELIVERY_MATCH3_REVEAL_Y_END_KEYFRAME / segs;
  if (endT <= 0) return 1;
  return Math.min(1, Math.max(0, t / endT));
}

/** FX fade 0→1 from the 2.5 scale keyframe through the final 3. */
function revealFxFade(t: number): number {
  const segs = SPECIAL_DELIVERY_MATCH3_REVEAL_SCALES.length - 1;
  if (segs <= 0) return 1;
  const startT = SPECIAL_DELIVERY_MATCH3_REVEAL_FX_FADE_START_KEYFRAME / segs;
  const endT = SPECIAL_DELIVERY_MATCH3_REVEAL_FX_FADE_END_KEYFRAME / segs;
  if (endT <= startT) return t >= endT ? 1 : 0;
  if (t <= startT) return 0;
  if (t >= endT) return 1;
  return (t - startT) / (endT - startT);
}

/**
 * Normalized t when slam-down (5 → 2.5) first hits {@link SPECIAL_DELIVERY_MATCH3_REVEAL_COPY_START_SCALE}.
 * Falls back to the 2.5 keyframe if that scale isn't on that segment.
 */
function revealCopyStartT(): number {
  const scales = SPECIAL_DELIVERY_MATCH3_REVEAL_SCALES;
  const segs = scales.length - 1;
  if (segs <= 0) return 0;
  const target = SPECIAL_DELIVERY_MATCH3_REVEAL_COPY_START_SCALE;
  const fromIdx = SPECIAL_DELIVERY_MATCH3_REVEAL_FX_FADE_START_KEYFRAME - 1;
  const toIdx = SPECIAL_DELIVERY_MATCH3_REVEAL_FX_FADE_START_KEYFRAME;
  const from = scales[fromIdx];
  const to = scales[toIdx];
  if (from == null || to == null || from === to) {
    return SPECIAL_DELIVERY_MATCH3_REVEAL_FX_FADE_START_KEYFRAME / segs;
  }
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  if (target < lo || target > hi) {
    return SPECIAL_DELIVERY_MATCH3_REVEAL_FX_FADE_START_KEYFRAME / segs;
  }
  const u = (from - target) / (from - to);
  return (fromIdx + Math.min(1, Math.max(0, u))) / segs;
}

function revealCopyReady(t: number): boolean {
  return t >= revealCopyStartT();
}

/**
 * Y bounce 0 → peak → 0: full speed leaving 0, ease into/out of the extreme,
 * full speed arriving back at 0 (no soft landing).
 * `peakPx` > 0 moves up; `peakPx` < 0 moves down.
 */
function bounceOffsetY(t: number, peakPx: number): number {
  if (t <= 0.5) {
    const u = t / 0.5;
    const e = 1 - Math.pow(1 - u, 2.4);
    return -peakPx * e;
  }
  const u = (t - 0.5) / 0.5;
  const e = Math.pow(u, 2.4);
  return -peakPx * (1 - e);
}

function easeMatch3(t: number): number {
  if (t <= 0.28) return (t / 0.28) * 0.22;
  const u = (t - 0.28) / 0.72;
  return 0.22 + 0.78 * Math.pow(u, 1.35);
}

function buildPath(start: Point, center: Point): { cp1: Point; cp2: Point } {
  let dx = start.x - center.x;
  let dy = start.y - center.y;
  let len = Math.hypot(dx, dy);
  if (len < 4) {
    const a = Math.random() * Math.PI * 2;
    dx = Math.cos(a);
    dy = Math.sin(a);
    len = 1;
  }
  let awayX = dx / len;
  let awayY = dy / len;
  const twist = (Math.random() - 0.5) * 1.1;
  const twisted = rotate2(awayX, awayY, twist);
  awayX = twisted.x;
  awayY = twisted.y;
  const windup = 110 + Math.random() * 100;
  const cp1 = {
    x: start.x + awayX * windup,
    y: start.y + awayY * windup,
  };
  const side = (Math.random() - 0.5) * 2 * (40 + Math.random() * 70);
  const below = 70 + Math.random() * 55;
  const cp2 = {
    x: center.x + side,
    y: center.y + below,
  };
  return { cp1, cp2 };
}

export function SpecialDeliveryMatch3({
  items,
  reward,
  centerX,
  centerY,
  onClaimReward,
  onClearLeftoverRewards,
  onClaimReady,
  onDismissStart,
  onComplete,
}: SpecialDeliveryMatch3Props) {
  const useTrail = !getPerformanceMode();
  const center = { x: centerX, y: centerY };
  const iconSrc = specialDeliveryRewardRevealIconSrc(reward) || items[0]?.iconSrc || '';
  const revealOverlayIconSrc = specialDeliveryRewardOverlayIconSrc(reward);
  const sizePx = items[0]?.sizePx ?? 112;
  const revealIconRef = useRef<HTMLDivElement | null>(null);
  const pathsRef = useRef(
    items.map((it) => {
      const start = { x: it.startX, y: it.startY };
      const { cp1, cp2 } = buildPath(start, center);
      return {
        start,
        cp1,
        cp2,
        end: center,
        iconSrc: it.iconSrc,
        overlayIconSrc: it.overlayIconSrc,
        sizePx: it.sizePx,
      };
    }),
  );
  const trailsRef = useRef<TrailSeg[][]>(
    pathsRef.current.map((p) => [{ p: { ...p.start }, t: 0 }]),
  );
  const [frames, setFrames] = useState(() =>
    pathsRef.current.map((p) => ({
      x: p.start.x,
      y: p.start.y,
      scale: SPECIAL_DELIVERY_MATCH3_SCALE_START,
      shine: 0,
      opacity: 1,
      pivotX: SPECIAL_DELIVERY_REWARD_PIVOT_X,
      pivotY: SPECIAL_DELIVERY_REWARD_PIVOT_Y,
      trail: [] as TrailSeg[],
    })),
  );
  const [reveal, setReveal] = useState<{
    scale: number;
    opacity: number;
    white: number;
    offsetY: number;
    /** Gradients / beams / sparkles / title / desc fade (0 at 2.5 → 1 at 3). */
    fxOpacity: number;
  } | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  /** Title / subtitle / desc / claim / glow — fades fast on claim. */
  const [chromeOpacity, setChromeOpacity] = useState(1);
  const [phase, setPhase] = useState<Phase>('fly');
  const [impactBurst, setImpactBurst] = useState<{ id: string; startTime: number } | null>(null);
  /** Arms staggered title → subtitle → description → claim fades. */
  const [copyStaggerOn, setCopyStaggerOn] = useState(false);
  const [claimPressed, setClaimPressed] = useState(false);
  const rafRef = useRef(0);
  const impactFiredRef = useRef(false);
  const dismissStartRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const onDismissStartRef = useRef(onDismissStart);
  const onClaimRewardRef = useRef(onClaimReward);
  const onClearLeftoverRewardsRef = useRef(onClearLeftoverRewards);
  const onClaimReadyRef = useRef(onClaimReady);
  const claimReadyFiredRef = useRef(false);
  const doorCloseDelayTimeoutRef = useRef<number | null>(null);
  /** Door close must run exactly once per claim, whichever comes first: delay or overlay end. */
  const doorCloseFiredRef = useRef(false);
  onCompleteRef.current = onComplete;
  onDismissStartRef.current = onDismissStart;
  onClaimRewardRef.current = onClaimReward;
  onClearLeftoverRewardsRef.current = onClearLeftoverRewards;
  onClaimReadyRef.current = onClaimReady;
  const phaseRef = useRef<Phase>('fly');
  phaseRef.current = phase;

  const fireDoorClose = () => {
    if (doorCloseDelayTimeoutRef.current != null) {
      window.clearTimeout(doorCloseDelayTimeoutRef.current);
      doorCloseDelayTimeoutRef.current = null;
    }
    if (doorCloseFiredRef.current) return;
    doorCloseFiredRef.current = true;
    onDismissStartRef.current?.();
  };

  useEffect(() => {
    return () => {
      if (doorCloseDelayTimeoutRef.current != null) {
        window.clearTimeout(doorCloseDelayTimeoutRef.current);
        doorCloseDelayTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const startMs = Date.now();
    const tick = () => {
      if (phaseRef.current === 'hold' || phaseRef.current === 'dismiss') return;

      const elapsed = Date.now() - startMs;

      if (elapsed < SPECIAL_DELIVERY_MATCH3_MS) {
        const t = Math.min(1, elapsed / SPECIAL_DELIVERY_MATCH3_MS);
        const tt = easeMatch3(t);
        const scale = flightScale(t);
        const shine = t;
        // Pivot eases from reward rest (0.5/0.8) → collide (0.5/0.5) over fly time.
        const pivotX = lerp(SPECIAL_DELIVERY_REWARD_PIVOT_X, REVEAL_PIVOT_X, t);
        const pivotY = lerp(SPECIAL_DELIVERY_REWARD_PIVOT_Y, REVEAL_PIVOT_Y, t);
        // Dim fully by impact so reveal starts on a finished overlay.
        setOverlayOpacity(SPECIAL_DELIVERY_MATCH3_OVERLAY_OPACITY * t);

        setFrames(
          pathsRef.current.map((p, i) => {
            const pos = cubic(p.start, p.cp1, p.cp2, p.end, tt);
            if (useTrail) {
              const prev = trailsRef.current[i] ?? [];
              trailsRef.current[i] = [{ p: { x: pos.x, y: pos.y }, t }, ...prev].slice(
                0,
                MAX_TRAIL_POINTS,
              );
            }
            return {
              x: pos.x,
              y: pos.y,
              scale,
              shine,
              opacity: 1,
              pivotX,
              pivotY,
              trail: useTrail ? [...(trailsRef.current[i] ?? [])] : [],
            };
          }),
        );
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!impactFiredRef.current) {
        impactFiredRef.current = true;
        hapticSoft();
        setPhase('reveal');
        setOverlayOpacity(SPECIAL_DELIVERY_MATCH3_OVERLAY_OPACITY);
        if (!getPerformanceMode()) {
          setImpactBurst({ id: `sd-m3-lb-${Date.now()}`, startTime: Date.now() });
        }
        setFrames(
          pathsRef.current.map((p) => ({
            x: p.end.x,
            y: p.end.y,
            scale: SPECIAL_DELIVERY_MATCH3_SCALE_END,
            shine: 1,
            opacity: 0,
            pivotX: REVEAL_PIVOT_X,
            pivotY: REVEAL_PIVOT_Y,
            trail: [],
          })),
        );
      }

      const revealElapsed = elapsed - SPECIAL_DELIVERY_MATCH3_MS;

      if (revealElapsed < SPECIAL_DELIVERY_MATCH3_REVEAL_MS) {
        const rt = Math.min(1, revealElapsed / SPECIAL_DELIVERY_MATCH3_REVEAL_MS);
        setOverlayOpacity(SPECIAL_DELIVERY_MATCH3_OVERLAY_OPACITY);
        setReveal({
          scale: revealScale(rt),
          opacity: 1,
          white: 1 - rt,
          offsetY: bounceOffsetY(revealYProgress(rt), SPECIAL_DELIVERY_MATCH3_REVEAL_Y_PX),
          fxOpacity: revealFxFade(rt),
        });
        if (revealCopyReady(rt)) {
          setCopyStaggerOn(true);
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      setOverlayOpacity(SPECIAL_DELIVERY_MATCH3_OVERLAY_OPACITY);
      setReveal({
        scale: SPECIAL_DELIVERY_MATCH3_REVEAL_SCALE_END,
        opacity: 1,
        white: 0,
        offsetY: 0,
        fxOpacity: 1,
      });
      setCopyStaggerOn(true);
      phaseRef.current = 'hold';
      setPhase('hold');
      if (!claimReadyFiredRef.current) {
        claimReadyFiredRef.current = true;
        onClaimReadyRef.current?.();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [useTrail]);

  const beginDismiss = () => {
    if (phaseRef.current !== 'hold') return;
    phaseRef.current = 'dismiss';
    setPhase('dismiss');
    // Immediate claim feel (trophy SFX is deferred until flight starts).
    hapticSuccess();

    const iconEl = revealIconRef.current;
    let startPoint = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let claimSizePx = sizePx;
    if (iconEl) {
      const r = iconEl.getBoundingClientRect();
      startPoint = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      // Rect is already × reveal hold scale — undo so flight can apply FLY_SCALES from base.
      claimSizePx = Math.max(r.width, r.height) / SPECIAL_DELIVERY_MATCH3_REVEAL_SCALE_END;
    } else {
      const gameEl = document.getElementById('game-container');
      if (gameEl) {
        const cr = gameEl.getBoundingClientRect();
        const sx = cr.width / (gameEl.clientWidth || cr.width || 1);
        startPoint = {
          x: cr.left + centerX * sx,
          y: cr.top + centerY * sx,
        };
      }
    }
    const presentation =
      onClaimRewardRef.current?.(reward, startPoint, { sizePx: claimSizePx }) || null;
    // Remove non-winning hole rewards immediately; doors still wait before closing.
    onClearLeftoverRewardsRef.current?.();

    // Delay door close so claim FX can play over the open board.
    if (doorCloseDelayTimeoutRef.current != null) {
      window.clearTimeout(doorCloseDelayTimeoutRef.current);
    }
    doorCloseFiredRef.current = false;
    doorCloseDelayTimeoutRef.current = window.setTimeout(() => {
      doorCloseDelayTimeoutRef.current = null;
      fireDoorClose();
    }, SPECIAL_DELIVERY_MATCH3_DOOR_CLOSE_DELAY_MS);

    dismissStartRef.current = Date.now();
    const isCoins = reward.kind === 'coins' || reward.kind === 'keys';
    const isFlyToGarden = reward.kind === 'upgrade' || reward.kind === 'booster';
    // Coins/keys: fade overlay immediately over DISMISS_MS (no hold) unless presentation overrides.
    const overlayHoldMs = presentation?.overlayHoldMs ?? 0;
    const overlayFadeMs = presentation?.overlayFadeMs ?? SPECIAL_DELIVERY_MATCH3_DISMISS_MS;
    const holdUntilReleased = presentation?.holdOverlayUntilReleased === true;
    const overlayReleaseRef = { released: !holdUntilReleased, releasedAt: 0 };
    if (holdUntilReleased) {
      presentation?.attachOverlayRelease?.(() => {
        if (overlayReleaseRef.released) return;
        overlayReleaseRef.released = true;
        overlayReleaseRef.releasedAt = Date.now();
      });
    }
    const tick = () => {
      const now = Date.now();
      const dt = now - dismissStartRef.current;
      const chromeT = Math.min(1, dt / SPECIAL_DELIVERY_MATCH3_CHROME_FADE_MS);
      const overlayT = holdUntilReleased
        ? overlayReleaseRef.released
          ? Math.min(1, Math.max(0, (now - overlayReleaseRef.releasedAt) / overlayFadeMs))
          : 0
        : Math.min(1, Math.max(0, (dt - overlayHoldMs) / overlayFadeMs));
      const iconT = presentation
        ? // Icon stays put until the presentation's flying copy takes over.
          dt >= presentation.iconHoldMs
          ? 1
          : 0
        : isFlyToGarden
          ? 1 // flying particle takes over immediately
          : isCoins
            ? Math.min(1, dt / SPECIAL_DELIVERY_MATCH3_COIN_ICON_FADE_MS)
            : overlayT;
      setChromeOpacity(1 - chromeT);
      setOverlayOpacity(SPECIAL_DELIVERY_MATCH3_OVERLAY_OPACITY * (1 - overlayT));
      setReveal((prev) =>
        prev
          ? {
              ...prev,
              opacity: 1 - iconT,
              offsetY: 0,
              white: 0,
              scale: SPECIAL_DELIVERY_MATCH3_REVEAL_SCALE_END,
              // Beams / sparkles leave with chrome.
              fxOpacity: 1 - chromeT,
            }
          : null,
      );
      if (overlayT >= 1) {
        // A short overlay fade can finish before the door-close delay elapses; unmounting
        // without firing it would leave the winning doors open.
        fireDoorClose();
        onCompleteRef.current();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const src = assetPath(iconSrc);
  const rewardCopy = getSpecialDeliveryRewardCopy(reward);
  const canTap = phase === 'hold';
  const revealIconHalfPx = sizePx * SPECIAL_DELIVERY_MATCH3_REVEAL_SCALE_END * 0.5;
  const revealAnchorY = reveal ? centerY + reveal.offsetY : centerY;

  return (
    <div
      className="absolute inset-0 overflow-visible"
      style={{ zIndex: 520, pointerEvents: canTap || phase === 'dismiss' ? 'auto' : 'none' }}
    >
      <div
        className="absolute"
        style={{
          top: -10,
          left: -10,
          right: -10,
          bottom: -10,
          backgroundColor: 'rgba(0, 0, 0, 1)',
          opacity: overlayOpacity,
          zIndex: 0,
          // Block board taps; claim is green button only.
          pointerEvents: canTap || phase === 'dismiss' ? 'auto' : 'none',
        }}
        aria-hidden
      />

      {useTrail && (
        <svg
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
          style={{ zIndex: 1 }}
        >
          {frames.map((f, fi) =>
            f.trail.map((seg, i) => {
              if (i === 0) return null;
              const prev = f.trail[i - 1];
              if (!prev) return null;
              const headT = prev.t;
              const baseWidthScale = headT <= 0.5 ? 1 - (1 - 0.65) * (headT / 0.5) : 0.65;
              const taperProgress = (i - 1) / Math.max(1, f.trail.length - 2);
              const widthScale = baseWidthScale * (1 - taperProgress);
              const opacityScale = 1.0 - taperProgress;
              return (
                <line
                  key={`sd-m3-trail-${fi}-${i}`}
                  x1={prev.p.x}
                  y1={prev.p.y}
                  x2={seg.p.x}
                  y2={seg.p.y}
                  stroke={TRAIL_COLOR}
                  strokeWidth={TRAIL_STROKE_WIDTH * widthScale}
                  strokeLinecap="round"
                  strokeOpacity={Math.max(0, Math.min(1, opacityScale))}
                />
              );
            }),
          )}
        </svg>
      )}

      {frames.map((f, i) => {
        const path = pathsRef.current[i];
        if (!path || f.opacity <= 0) return null;
        const particleSrc = assetPath(path.iconSrc);
        return (
          <div
            key={`sd-m3-${i}`}
            className="absolute pointer-events-none"
            style={{
              left: f.x,
              top: f.y,
              width: path.sizePx,
              height: path.sizePx,
              opacity: f.opacity,
              transform: `translate(-${f.pivotX * 100}%, -${f.pivotY * 100}%) scale(${f.scale})`,
              transformOrigin: `${f.pivotX * 100}% ${f.pivotY * 100}%`,
              zIndex: 1,
            }}
          >
            <img
              src={particleSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-contain"
              draggable={false}
            />
            {path.overlayIconSrc && (
              <img
                src={assetPath(path.overlayIconSrc)}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                draggable={false}
              />
            )}
            <img
              src={particleSrc}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{
                opacity: f.shine,
                mixBlendMode: 'plus-lighter',
                filter: 'brightness(0) invert(1)',
              }}
              draggable={false}
            />
            {path.overlayIconSrc && (
              <img
                src={assetPath(path.overlayIconSrc)}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{
                  opacity: f.shine,
                  mixBlendMode: 'plus-lighter',
                  filter: 'brightness(0) invert(1)',
                }}
                draggable={false}
              />
            )}
          </div>
        );
      })}

      {impactBurst && (
        <LeafBurst
          key={impactBurst.id}
          x={centerX}
          y={centerY}
          startTime={impactBurst.startTime}
          particleCount={LEAF_BURST_BASELINE_COUNT}
          spriteVariant="gold"
          burstScale={3.4}
          particleSizeScale={0.56}
          speedScale={2}
          appScale={1}
          zIndex={2}
          anchorPosition="absolute"
          spawnOffsetUpPx={0}
          onComplete={() => setImpactBurst(null)}
        />
      )}

      {reveal && (
        <div
          ref={revealIconRef}
          className="absolute pointer-events-none"
          style={{
            left: centerX,
            top: centerY + reveal.offsetY,
            width: sizePx,
            height: sizePx,
            opacity: reveal.opacity,
            transform: `translate(-${REVEAL_PIVOT_X * 100}%, -${REVEAL_PIVOT_Y * 100}%) scale(${reveal.scale})`,
            transformOrigin: `${REVEAL_PIVOT_X * 100}% ${REVEAL_PIVOT_Y * 100}%`,
            zIndex: 3,
          }}
        >
          {/* Gradients / beams / sparkles — scale with icon; fade 2.5→3 */}
          {reveal.fxOpacity > 0 && (
            <>
              <div
                className="absolute left-1/2 top-1/2 pointer-events-none"
                style={{
                  width: REVEAL_RADIAL_LARGE_SIZE_PX,
                  height: REVEAL_RADIAL_LARGE_SIZE_PX,
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle, rgba(${REVEAL_RADIAL_GOLD}, 1) 0%, rgba(0, 0, 0, 0) 70%)`,
                  opacity: reveal.fxOpacity * REVEAL_RADIAL_LARGE_OPACITY,
                  zIndex: 0,
                }}
                aria-hidden
              />
              <div
                className="absolute left-1/2 top-1/2 pointer-events-none"
                style={{
                  width: REVEAL_RADIAL_SMALL_SIZE_PX,
                  height: REVEAL_RADIAL_SMALL_SIZE_PX,
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle, rgba(${REVEAL_RADIAL_GOLD}, 1) 0%, rgba(${REVEAL_RADIAL_GOLD}, 0) 70%)`,
                  opacity: reveal.fxOpacity * REVEAL_RADIAL_SMALL_OPACITY,
                  zIndex: 0,
                }}
                aria-hidden
              />
              <RewardRevealGlow layer="behind" opacity={reveal.fxOpacity} />
              <div
                className="absolute left-1/2 top-1/2 pointer-events-none"
                style={{
                  width: REVEAL_RADIAL_FRONT_SIZE_PX,
                  height: REVEAL_RADIAL_FRONT_SIZE_PX,
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle, rgba(${REVEAL_RADIAL_GOLD}, 1) 0%, rgba(${REVEAL_RADIAL_GOLD}, 0) 70%)`,
                  opacity: reveal.fxOpacity * REVEAL_RADIAL_SMALL_OPACITY,
                  zIndex: 1,
                }}
                aria-hidden
              />
            </>
          )}
          <img
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
            style={{ zIndex: 2 }}
            draggable={false}
          />
          {revealOverlayIconSrc && (
            <img
              src={assetPath(revealOverlayIconSrc)}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ zIndex: 3 }}
              draggable={false}
            />
          )}
          <img
            src={src}
            alt=""
            aria-hidden
            className={`absolute inset-0 w-full h-full object-contain pointer-events-none${
              phase === 'hold' || phase === 'dismiss' ? ' reward-reveal-icon-blink' : ''
            }`}
            style={{
              ...(phase === 'hold' || phase === 'dismiss' ? {} : { opacity: reveal.white }),
              mixBlendMode: 'plus-lighter',
              filter: 'brightness(0) invert(1)',
              zIndex: 2,
            }}
            draggable={false}
          />
          {revealOverlayIconSrc && (
            <img
              src={assetPath(revealOverlayIconSrc)}
              alt=""
              aria-hidden
              className={`absolute inset-0 w-full h-full object-contain pointer-events-none${
                phase === 'hold' || phase === 'dismiss' ? ' reward-reveal-icon-blink' : ''
              }`}
              style={{
                ...(phase === 'hold' || phase === 'dismiss' ? {} : { opacity: reveal.white }),
                mixBlendMode: 'plus-lighter',
                filter: 'brightness(0) invert(1)',
                zIndex: 3,
              }}
              draggable={false}
            />
          )}
          {/* Amount pill — same chrome as seed/harvest 5/5; rides icon scale, leaves with the copy */}
          <div
            className="absolute left-1/2 z-40"
            style={{
              opacity: chromeOpacity,
              bottom: `${REVEAL_AMOUNT_PILL_BOTTOM_PCT}%`,
              width: REVEAL_AMOUNT_PILL_WIDTH_PX,
              height: REVEAL_AMOUNT_PILL_HEIGHT_PX,
              transform: 'translateX(-50%)',
              boxSizing: 'border-box',
              borderRadius: 9999,
              border: 'none',
              // box-shadow spread renders fractional widths; outline-width snaps to whole px
              boxShadow: `0 0 0 ${REVEAL_AMOUNT_PILL_BORDER_PX}px ${REVEAL_AMOUNT_PILL.pillOutlineColor}, 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)`,
              backgroundImage: `linear-gradient(to bottom, ${REVEAL_AMOUNT_PILL.pillGradientTop}, ${REVEAL_AMOUNT_PILL.pillGradientBottom})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              className="font-black tabular-nums whitespace-nowrap"
              style={{
                color: REVEAL_AMOUNT_PILL.pillTextColor,
                fontSize: REVEAL_AMOUNT_PILL_FONT_PX,
                lineHeight: 1,
                display: 'block',
                textAlign: 'center',
                // Bold caps sit high optically — nudge down to true visual center.
                transform: 'translateY(0.12em)',
              }}
            >
              {rewardCopy.amountLabel}
            </span>
          </div>
          {reveal.fxOpacity > 0 && (
            <RewardRevealGlow layer="sparkles" opacity={reveal.fxOpacity} />
          )}
        </div>
      )}

      {/* Screen-space copy + claim — not scaled with the icon.
          Stagger starts at icon scale 3 (slam-down): title+divider → subtitle → description. */}
      {reveal && copyStaggerOn && (
        <>
          <div
            className="absolute text-center pointer-events-none"
            style={{
              left: centerX,
              top: revealAnchorY - revealIconHalfPx - REVEAL_TITLE_BLOCK_GAP_PX,
              transform: 'translate(-50%, -100%)',
              width: REVEAL_COPY_MAX_WIDTH_PX,
              opacity: chromeOpacity,
              zIndex: 6,
            }}
          >
            <div
              className="reward-reveal-copy-fade"
              style={{
                animationDelay: '0ms',
                animationDuration: `${REVEAL_COPY_POP_MS}ms`,
              }}
            >
              <div
                className="font-black tracking-tight"
                style={{
                  backgroundImage: `linear-gradient(180deg, ${REVEAL_HEADLINE_COLOR} 0%, ${REVEAL_HEADLINE_COLOR_BOTTOM} 100%)`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: REVEAL_HEADLINE_FONT_PX,
                  lineHeight: 1.05,
                }}
              >
                {rewardCopy.headline}
              </div>
              <img
                src={assetPath('/assets/ui/popup_divider_yellow.png')}
                alt=""
                className="mx-auto object-contain"
                style={{
                  width: REVEAL_DIVIDER_WIDTH_PX,
                  height: 'auto',
                  marginTop: REVEAL_TITLE_SUB_GAP_PX,
                  marginBottom: REVEAL_TITLE_SUB_GAP_PX,
                }}
                draggable={false}
              />
            </div>
            <div
              className="font-bold tracking-tight reward-reveal-copy-fade"
              style={{
                backgroundImage: `linear-gradient(180deg, ${REVEAL_SUBTITLE_COLOR} 0%, ${REVEAL_SUBTITLE_COLOR_BOTTOM} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent',
                fontFamily: 'Inter, sans-serif',
                fontSize: REVEAL_SUBTITLE_FONT_PX,
                lineHeight: 1.15,
                animationDelay: `${REVEAL_STAGGER_MS}ms`,
                animationDuration: `${REVEAL_COPY_POP_MS}ms`,
              }}
            >
              {rewardCopy.title}
            </div>
          </div>
          <div
            className="absolute pointer-events-none"
            style={{
              left: centerX,
              top: revealAnchorY + revealIconHalfPx + REVEAL_DESC_GAP_PX,
              transform: 'translateX(-50%)',
              width: REVEAL_DESC_MAX_WIDTH_PX,
              opacity: chromeOpacity,
              zIndex: 6,
            }}
          >
            <p
              className="font-medium text-center italic reward-reveal-copy-fade"
              style={{
                color: REVEAL_DESC_COLOR,
                fontFamily: 'Inter, sans-serif',
                fontSize: REVEAL_DESC_FONT_PX,
                lineHeight: 1.2,
                margin: 0,
                animationDelay: `${REVEAL_STAGGER_MS * 2}ms`,
                animationDuration: `${REVEAL_COPY_POP_MS}ms`,
              }}
            >
              {rewardCopy.description}
            </p>
          </div>
          <div
            className="absolute left-1/2"
            style={{
              bottom: 100,
              transform: 'translateX(-50%)',
              zIndex: 10,
              opacity: chromeOpacity,
              pointerEvents: canTap ? 'auto' : 'none',
            }}
          >
            <button
              type="button"
              className="reward-reveal-copy-fade font-black uppercase tracking-wide"
              style={{
                minWidth: 200,
                height: 40,
                paddingLeft: 28,
                paddingRight: 28,
                borderRadius: 12,
                border: `2px solid ${REVEAL_CLAIM_BORDER}`,
                backgroundColor: claimPressed ? REVEAL_CLAIM_PRESSED : REVEAL_CLAIM_BG,
                color: REVEAL_CLAIM_TEXT,
                fontFamily: 'Inter, sans-serif',
                fontSize: 15,
                boxShadow: claimPressed
                  ? '0 1px 0 rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)'
                  : '0 5px 0 rgba(74, 107, 30, 0.55), 0 8px 14px rgba(0,0,0,0.35)',
                transform: claimPressed ? 'translateY(3px)' : undefined,
                animationDelay: `${REVEAL_STAGGER_MS * 3}ms`,
                animationDuration: `${REVEAL_COPY_POP_MS}ms`,
              }}
              onPointerDown={() => setClaimPressed(true)}
              onPointerUp={() => setClaimPressed(false)}
              onPointerLeave={() => setClaimPressed(false)}
              onClick={beginDismiss}
            >
              Claim Reward
            </button>
          </div>
        </>
      )}
    </div>
  );
}
