/**
 * Upgrade particle: flies from an upgrade purchase button to its target.
 * Trail-only (no head icon); path style varies by upgrade (seed loft / harvest arc / hex loft).
 */
import React, { useEffect, useRef, useState } from 'react';
import type { GardenId } from '../constants/gardens';
import { getPerformanceMode } from '../utils/performanceMode';

const MOVE_DURATION_MS_DEFAULT = 397; // 610ms seed pace × 0.65 (−35%)
const MOVE_DURATION_MS_HEX_LOFT = 480;
const MOVE_DURATION_MS_GOAL = Math.round(MOVE_DURATION_MS_DEFAULT * 0.75); // 25% faster to goals
/** Outer trail length. */
const MAX_TRAIL_POINTS = 24;
/** Inner overlay trail — half the outer length. */
const MAX_TRAIL_POINTS_INNER = Math.max(1, Math.round(MAX_TRAIL_POINTS * 0.5));
/** Trail stroke base size (was also the head icon size). */
const PARTICLE_SIZE = 21;
const SKIP_TRAIL_WHEN_ACTIVE_ABOVE = 6;

function lerpHex(hex1: string, hex2: string, t: number): string {
  const parse = (h: string) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
  };
  const [r1, g1, b1] = parse(hex1);
  const [r2, g2, b2] = parse(hex2);
  const u = Math.max(0, Math.min(1, t));
  const r = Math.round(r1 + (r2 - r1) * u);
  const g = Math.round(g1 + (g2 - g1) * u);
  const b = Math.round(b1 + (b2 - b1) * u);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Same ease as seed projectile — slow mid-flight at the peak, then down. */
function easePathProgress(t: number): number {
  const p = 0.7;
  return t < 0.5 ? 0.5 * Math.pow(t * 2, p) : 1 - 0.5 * Math.pow((1 - t) * 2, p);
}

/**
 * Goal path: fast launch (f'(0)≈1.7), moderated slam into impact (f'(1)≈1.85).
 */
function easeGoalPathProgress(t: number): number {
  const u = Math.max(0, Math.min(1, t));
  return 1.7 * u - 2.25 * u * u + 1.55 * u * u * u;
}

interface Point {
  x: number;
  y: number;
}

/** Seed loft (default), harvest LeftUp→UpRight→DownRight, high loft to a hex cell, or left→up into goals. */
export type UpgradeParticlePathStyle = 'seed' | 'harvest' | 'hexLoft' | 'goal';

/** What App should do when the particle hits its target. */
export type UpgradeParticleImpactKind =
  | 'seed'
  | 'harvest'
  | 'wildGrowthGlow'
  | 'plotUnlock'
  | 'goal'
  | 'goalLoading';

export interface UpgradeParticleData {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  /** Trail colors follow this garden's circle-button gradient. */
  gardenId?: GardenId;
  pathStyle?: UpgradeParticlePathStyle;
  impactKind?: UpgradeParticleImpactKind;
  /** Hex cell index for wildGrowthGlow / plotUnlock. */
  cellIdx?: number;
  /** Goal slot index for goal impact bounce. */
  goalSlotIdx?: number;
}

function buildControlPoints(
  start: Point,
  target: Point,
  pathStyle: UpgradeParticlePathStyle
): { cp1: Point; cp2: Point } {
  const dx = target.x - start.x;
  if (pathStyle === 'harvest') {
    // Strong LeftUp (higher + further left), then slam DownRight into harvest.
    const peakY = Math.max(24, Math.min(start.y, target.y) - 320);
    return {
      cp1: { x: start.x - 260, y: peakY },
      cp2: { x: target.x + 90, y: peakY },
    };
  }
  if (pathStyle === 'hexLoft') {
    // Same lean as seed loft, but higher so the arc clears the hex grid.
    const peakY = Math.max(16, Math.min(start.y, target.y) - 400);
    return {
      cp1: { x: start.x + dx * 0.06, y: peakY },
      cp2: { x: start.x + dx * 0.42, y: peakY },
    };
  }
  if (pathStyle === 'goal') {
    // Left-left-up → Up → impact (no loft overshoot above the goal).
    const rise = Math.max(0, start.y - target.y);
    return {
      cp1: { x: start.x - 240, y: start.y - rise * 0.45 },
      cp2: { x: target.x, y: target.y + Math.max(40, rise * 0.28) },
    };
  }
  // Seed: mostly vertical loft, then a late leftward bend into the seed button.
  const peakY = Math.max(36, Math.min(start.y, target.y) - 260);
  return {
    cp1: { x: start.x + dx * 0.06, y: peakY },
    cp2: { x: start.x + dx * 0.42, y: peakY },
  };
}

interface UpgradeParticleProps {
  data: UpgradeParticleData;
  onImpact: () => void;
  onComplete: () => void;
  activeCount?: number;
}

export const UpgradeParticle: React.FC<UpgradeParticleProps> = ({
  data,
  onImpact,
  onComplete,
  activeCount = 1,
}) => {
  const trailLimit = getPerformanceMode() ? 2 : SKIP_TRAIL_WHEN_ACTIVE_ABOVE;
  const useTrail = activeCount <= trailLimit;
  // Outer trail: cream near head → #cae060 at tip.
  const outerHeadColor = '#fcf0c6';
  const outerTipColor = '#cae060';
  // Inner trail: reverse of outer.
  const innerHeadColor = outerTipColor;
  const innerTipColor = outerHeadColor;
  const [frame, setFrame] = useState<{
    pos: Point;
    trail: Point[];
    isImpacted: boolean;
  }>({
    pos: { x: data.startX, y: data.startY },
    trail: [],
    isImpacted: false,
  });
  const startTimeRef = useRef(Date.now());
  const trailRef = useRef<Point[]>([]);
  const posRef = useRef<Point>({ x: data.startX, y: data.startY });
  const impactFiredRef = useRef(false);
  const isImpactedRef = useRef(false);
  const rafRef = useRef(0);
  const mountedRef = useRef(true);
  const completeScheduledRef = useRef(false);
  const onImpactRef = useRef(onImpact);
  const onCompleteRef = useRef(onComplete);
  onImpactRef.current = onImpact;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    startTimeRef.current = Date.now();
    trailRef.current = [];
    posRef.current = { x: data.startX, y: data.startY };
    impactFiredRef.current = false;
    isImpactedRef.current = false;
    completeScheduledRef.current = false;
  }, [data.id, data.startX, data.startY]);

  // Performance Mode: fire impact (unlock / bounce / etc.) immediately.
  useEffect(() => {
    if (!getPerformanceMode()) return;
    onImpactRef.current();
    onCompleteRef.current();
  }, [data.id]);

  useEffect(() => {
    if (getPerformanceMode()) return;
    mountedRef.current = true;
    completeScheduledRef.current = false;

    const finishAndDespawn = () => {
      if (completeScheduledRef.current) return;
      completeScheduledRef.current = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      trailRef.current = [];
      onCompleteRef.current();
    };

    const start = { x: data.startX, y: data.startY };
    const target = { x: data.endX, y: data.endY };
    const pathStyle = data.pathStyle ?? 'seed';
    const { cp1, cp2 } = buildControlPoints(start, target, pathStyle);
    const moveDuration =
      pathStyle === 'hexLoft'
        ? MOVE_DURATION_MS_HEX_LOFT
        : pathStyle === 'goal'
          ? MOVE_DURATION_MS_GOAL
          : MOVE_DURATION_MS_DEFAULT;

    const tick = () => {
      if (!mountedRef.current) return;
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const t = Math.min(elapsed / moveDuration, 1);
      const tt = pathStyle === 'goal' ? easeGoalPathProgress(t) : easePathProgress(t);

      let nextPos = posRef.current;
      let nextTrail = trailRef.current;

      if (t < 1) {
        const x =
          Math.pow(1 - tt, 3) * start.x +
          3 * Math.pow(1 - tt, 2) * tt * cp1.x +
          3 * (1 - tt) * tt * tt * cp2.x +
          Math.pow(tt, 3) * target.x;
        const y =
          Math.pow(1 - tt, 3) * start.y +
          3 * Math.pow(1 - tt, 2) * tt * cp1.y +
          3 * (1 - tt) * tt * tt * cp2.y +
          Math.pow(tt, 3) * target.y;
        nextPos = { x, y };
        if (useTrail) {
          nextTrail = [nextPos, ...trailRef.current].slice(0, MAX_TRAIL_POINTS);
        }
      } else if (!impactFiredRef.current) {
        impactFiredRef.current = true;
        isImpactedRef.current = true;
        onImpactRef.current();
      }

      // Seed-style trail fade: snip points each frame after impact until gone.
      if (t >= 1) {
        nextTrail = nextTrail.slice(0, Math.max(0, nextTrail.length - 3));
      }

      trailRef.current = nextTrail;
      posRef.current = nextPos;
      if (t >= 1) isImpactedRef.current = true;

      setFrame({
        pos: nextPos,
        trail: nextTrail,
        isImpacted: isImpactedRef.current,
      });

      if (t >= 1 && nextTrail.length === 0) {
        finishAndDespawn();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mountedRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      trailRef.current = [];
    };
  }, [data, useTrail]);

  useEffect(() => {
    if (getPerformanceMode()) return;
    const timer = window.setTimeout(() => {
      if (!impactFiredRef.current) {
        impactFiredRef.current = true;
        onImpactRef.current();
      }
      if (!completeScheduledRef.current) {
        completeScheduledRef.current = true;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        }
        onCompleteRef.current();
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [data.id]);

  if (getPerformanceMode()) return null;

  const { trail } = frame;
  const innerTrail = trail.slice(0, MAX_TRAIL_POINTS_INNER);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 200 }}>
      {useTrail && trail.length > 1 && (
        <svg className="absolute inset-0 w-full h-full overflow-visible" style={{ pointerEvents: 'none' }}>
          {/* Outer trail (under). */}
          <g>
            {trail.map((p, i) => {
              if (i === 0) return null;
              const prev = trail[i - 1];
              const taperProgress = i / MAX_TRAIL_POINTS;
              const widthScale = 1.0 - taperProgress * 0.5;
              const opacityScale = 1.0 - taperProgress;
              const stroke = lerpHex(outerHeadColor, outerTipColor, taperProgress);
              return (
                <line
                  key={`upg-outer-${data.id}-${i}`}
                  x1={prev.x}
                  y1={prev.y}
                  x2={p.x}
                  y2={p.y}
                  stroke={stroke}
                  strokeWidth={PARTICLE_SIZE * widthScale}
                  strokeLinecap="round"
                  strokeOpacity={opacityScale}
                />
              );
            })}
          </g>
          {/* Inner trail on top — reverse colors, 75% width & 50% length. */}
          <g>
            {innerTrail.map((p, i) => {
              if (i === 0) return null;
              const prev = innerTrail[i - 1];
              const taperProgress = i / MAX_TRAIL_POINTS_INNER;
              const widthScale = 1.0 - taperProgress * 0.5;
              const opacityScale = 1.0 - taperProgress;
              const stroke = lerpHex(innerHeadColor, innerTipColor, taperProgress);
              return (
                <line
                  key={`upg-inner-${data.id}-${i}`}
                  x1={prev.x}
                  y1={prev.y}
                  x2={p.x}
                  y2={p.y}
                  stroke={stroke}
                  strokeWidth={PARTICLE_SIZE * 0.75 * widthScale}
                  strokeLinecap="round"
                  strokeOpacity={opacityScale}
                />
              );
            })}
          </g>
        </svg>
      )}
    </div>
  );
};
