/**
 * Claimed reward flight: cubic-bezier arc (same easing as UpgradeParticle)
 * — up → upright → downright → downleft into the target; light-yellow tapering trail.
 *
 * Two callers: upgrades / boosters arc into the Garden nav button (scale pulse 3→2→1→0.75→1),
 * and trophies arc into their collection shelf slot (flat scale, explicit target point).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  SPECIAL_DELIVERY_MATCH3_FLY_SCALES,
  SPECIAL_DELIVERY_MATCH3_FLY_SPEED_MUL,
  SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_GRAVITY,
  SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_MS,
  SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_VX,
  SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_VY0,
} from '../constants/specialDeliveries';
import { assetPath } from '../utils/assetPath';
import { getPerformanceMode } from '../utils/performanceMode';

const MAX_TRAIL_POINTS = 20;
const TRAIL_COLOR = '#ffe88a';
const TRAIL_FADE_AFTER_HIT_MS = 180;
const TRAIL_WIDTH_OF_ICON = 0.5;
const TRAIL_HEAD_OPACITY = 0.25;
const TRAIL_TAIL_OPACITY = 0;
/** Launch lateral offset at full `launchBias`, as a fraction of the arc's rise (≈31° from vertical). */
const LAUNCH_LATERAL_OF_RISE = 0.6;
/** How far the descending control point sits toward the target (keeps the fall smooth). */
const LAUNCH_FALL_BLEND = 0.65;

interface Point {
  x: number;
  y: number;
}

interface TrailSeg {
  x: number;
  y: number;
  scale: number;
}

export interface SpecialDeliveryRewardFlyData {
  id: string;
  iconSrc: string;
  /** Optional front layer that follows the base icon at identical size/position/scale. */
  overlayIconSrc?: string;
  startX: number;
  startY: number;
  sizePx: number;
  /** Layer-local target. When omitted the flight aims at `targetRef`'s center. */
  targetX?: number;
  targetY?: number;
  /** Scale keyframes at equal timing. Defaults to the Garden-nav pulse. */
  scales?: readonly number[];
  /** Flight duration. Defaults to the Garden-nav flight. */
  durationMs?: number;
  /** Multiplies the arc height (1 = Garden-nav lob). */
  peakRiseScale?: number;
  /**
   * Launch direction, −1 (up-left) → 0 (straight up) → 1 (up-right). Omitted keeps the
   * Garden-nav shape: straight up, then a fixed rightward bulge into the tab.
   */
  launchBias?: number;
}

interface SpecialDeliveryRewardFlyProps {
  data: SpecialDeliveryRewardFlyData;
  containerRef: React.RefObject<HTMLElement | null>;
  /** Element to aim at; ignored when `data.targetX` / `data.targetY` are set. */
  targetRef?: React.RefObject<HTMLElement | null>;
  onImpact?: () => void;
  onComplete: () => void;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Same ease as UpgradeParticle / seed projectile — slow mid-flight at the peak. */
function easePathProgress(t: number): number {
  const p = 0.7;
  return t < 0.5 ? 0.5 * Math.pow(t * 2, p) : 1 - 0.5 * Math.pow((1 - t) * 2, p);
}

function keyframeScale(scales: readonly number[], t: number): number {
  const segs = scales.length - 1;
  if (segs <= 0) return scales[0] ?? 1;
  const f = Math.min(1, Math.max(0, t)) * segs;
  const i = Math.min(segs - 1, Math.floor(f));
  return lerp(scales[i]!, scales[i + 1]!, f - i);
}

function cubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

/**
 * Control points shaped like UpgradeParticle harvest arcs, mirrored for up → upright → downright → downleft.
 * Peak height from unlock-knockoff ballistic.
 */
function buildControlPoints(
  start: Point,
  target: Point,
  peakRiseScale: number,
  launchBias?: number,
): { cp1: Point; cp2: Point } {
  const speed = SPECIAL_DELIVERY_MATCH3_FLY_SPEED_MUL;
  const vx = Math.abs(SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_VX) * speed;
  const vy0 = SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_VY0 * speed;
  const gravity = SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_GRAVITY * speed * speed;
  const tApex = Math.max(0.01, -vy0 / gravity);
  const rise = -(vy0 * tApex + 0.5 * gravity * tApex * tApex) * peakRiseScale;
  const rightReach = vx * tApex;

  const peakY = Math.min(start.y, target.y) - rise;
  if (launchBias == null) {
    // cp1 pulls straight up first (near start X), cp2 sits up-right at the peak —
    // cubic then falls down-right / down-left into the target.
    return {
      cp1: { x: start.x + rightReach * 0.08, y: peakY },
      cp2: { x: start.x + rightReach * 1.05, y: peakY },
    };
  }
  // Launch angled off vertical (cp1 sets the departure tangent), then lean toward the target.
  const lateral = rise * LAUNCH_LATERAL_OF_RISE * Math.max(-1, Math.min(1, launchBias));
  const launchX = start.x + lateral;
  return {
    cp1: { x: launchX, y: peakY },
    cp2: { x: lerp(launchX, target.x, LAUNCH_FALL_BLEND), y: peakY },
  };
}

type Phase = 'flying' | 'trailOnly';

export function SpecialDeliveryRewardFly({
  data,
  containerRef,
  targetRef,
  onImpact,
  onComplete,
}: SpecialDeliveryRewardFlyProps) {
  const useTrail = !getPerformanceMode();
  const scales = data.scales ?? SPECIAL_DELIVERY_MATCH3_FLY_SCALES;
  const [frame, setFrame] = useState({
    x: data.startX,
    y: data.startY,
    scale: scales[0] ?? 3,
    opacity: 1,
    trail: [] as TrailSeg[],
    trailOpacity: 1,
    phase: 'flying' as Phase,
  });
  const rafRef = useRef(0);
  const trailRef = useRef<TrailSeg[]>([
    { x: data.startX, y: data.startY, scale: scales[0] ?? 3 },
  ]);
  const phaseRef = useRef<Phase>('flying');
  const trailOnlyStartRef = useRef(0);
  const onImpactRef = useRef(onImpact);
  const onCompleteRef = useRef(onComplete);
  const scalesRef = useRef(scales);
  onImpactRef.current = onImpact;
  onCompleteRef.current = onComplete;
  scalesRef.current = scales;

  // Performance mode: skip flight VFX; still fire impact/complete so rewards/UI continue.
  useEffect(() => {
    if (!getPerformanceMode()) return;
    onImpactRef.current?.();
    onCompleteRef.current();
  }, [data.id]);

  useEffect(() => {
    if (getPerformanceMode()) return;
    phaseRef.current = 'flying';
    const startScale = scalesRef.current[0] ?? 3;
    trailRef.current = [{ x: data.startX, y: data.startY, scale: startScale }];
    const startMs = Date.now();
    const totalMs =
      data.durationMs ??
      SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_MS / SPECIAL_DELIVERY_MATCH3_FLY_SPEED_MUL;

    const start: Point = { x: data.startX, y: data.startY };
    // Lock target once — per-frame getBoundingClientRect caused path jitter.
    let target: Point = { x: data.startX, y: data.startY + 400 };
    if (data.targetX != null && data.targetY != null) {
      target = { x: data.targetX, y: data.targetY };
    } else {
      const targetEl = targetRef?.current;
      const container = containerRef.current;
      if (targetEl && container) {
        const tr = targetEl.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        target = {
          x: tr.left + tr.width / 2 - cr.left,
          y: tr.top + tr.height / 2 - cr.top,
        };
      }
    }
    const { cp1, cp2 } = buildControlPoints(
      start,
      target,
      data.peakRiseScale ?? 1,
      data.launchBias,
    );

    const tick = () => {
      const now = Date.now();

      if (phaseRef.current === 'flying') {
        const elapsed = now - startMs;
        const t = Math.min(1, elapsed / totalMs);
        const tt = easePathProgress(t);
        const scale = keyframeScale(scalesRef.current, t);
        const { x, y } = cubicBezier(start, cp1, cp2, target, tt);

        if (useTrail) {
          trailRef.current = [{ x, y, scale }, ...trailRef.current].slice(0, MAX_TRAIL_POINTS);
        }

        if (t >= 1) {
          phaseRef.current = 'trailOnly';
          trailOnlyStartRef.current = now;
          onImpactRef.current?.();
          setFrame({
            x,
            y,
            scale: keyframeScale(scalesRef.current, 1),
            opacity: 0,
            trail: [...trailRef.current],
            trailOpacity: 1,
            phase: 'trailOnly',
          });
          if (!useTrail) {
            onCompleteRef.current();
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        setFrame({
          x,
          y,
          scale,
          opacity: 1,
          trail: useTrail ? [...trailRef.current] : [],
          trailOpacity: 1,
          phase: 'flying',
        });
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const trailElapsed = now - trailOnlyStartRef.current;
      const fade = Math.max(0, 1 - trailElapsed / TRAIL_FADE_AFTER_HIT_MS);
      if (fade <= 0.001) {
        onCompleteRef.current();
        return;
      }
      setFrame((prev) => ({
        ...prev,
        opacity: 0,
        trailOpacity: fade,
        trail: [...trailRef.current],
        phase: 'trailOnly',
      }));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    data.id,
    data.startX,
    data.startY,
    data.sizePx,
    data.targetX,
    data.targetY,
    data.durationMs,
    data.peakRiseScale,
    data.launchBias,
    containerRef,
    targetRef,
    useTrail,
  ]);

  if (getPerformanceMode()) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 10 }}>
      {useTrail && frame.trail.length > 1 && (
        <svg
          className="absolute inset-0 w-full h-full overflow-visible"
          style={{ pointerEvents: 'none', opacity: frame.trailOpacity }}
        >
          {frame.trail.map((point, i) => {
            if (i === 0) return null;
            const prev = frame.trail[i - 1];
            if (!prev) return null;
            const taperProgress = (i - 1) / Math.max(1, frame.trail.length - 2);
            const opacity =
              TRAIL_HEAD_OPACITY +
              (TRAIL_TAIL_OPACITY - TRAIL_HEAD_OPACITY) * taperProgress;
            const segScale = (prev.scale + point.scale) * 0.5;
            const widthTaper = 1 - taperProgress;
            const strokeWidth =
              data.sizePx * segScale * TRAIL_WIDTH_OF_ICON * widthTaper;
            return (
              <line
                key={`sd-fly-trail-${i}`}
                x1={prev.x}
                y1={prev.y}
                x2={point.x}
                y2={point.y}
                stroke={TRAIL_COLOR}
                strokeWidth={Math.max(0.5, strokeWidth)}
                strokeLinecap="round"
                strokeOpacity={Math.max(0, Math.min(1, opacity))}
              />
            );
          })}
        </svg>
      )}
      {frame.phase === 'flying' && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: frame.x,
            top: frame.y,
            width: data.sizePx,
            height: data.sizePx,
            transform: `translate(-50%, -50%) scale(${frame.scale})`,
            transformOrigin: '50% 50%',
            opacity: frame.opacity,
            willChange: 'transform, opacity',
          }}
        >
          <img
            src={assetPath(data.iconSrc)}
            alt=""
            className="w-full h-full object-contain"
            draggable={false}
          />
          {data.overlayIconSrc && (
            <img
              src={assetPath(data.overlayIconSrc)}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              draggable={false}
            />
          )}
        </div>
      )}
    </div>
  );
}
