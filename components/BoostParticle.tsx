/**
 * Yellow particle: flies from "Activate Reward" button (fake ad) to the active boost area in the top bar.
 */
import React, { useEffect, useRef, useState } from 'react';
import { getPerformanceMode } from '../utils/performanceMode';

const MOVE_DURATION_MS = 500;
const MAX_TRAIL_POINTS = 9;
const TRAIL_FADE_AFTER_HIT_MS = 200;
const PARTICLE_SIZE = 14;
const PARTICLE_COLOR = '#fdd176';
const TRAIL_COLOR = '#fcb215';
const BOOST_SLOT_WIDTH = 28;
const BOOST_CENTER_OFFSET = 13;
const BOOST_AREA_HALF_HEIGHT = 11;

interface Point {
  x: number;
  y: number;
}

export interface BoostParticleData {
  id: string;
  startX: number;
  startY: number;
  /** Slot index where the new boost will appear; particle targets this slot's center */
  targetSlotIndex?: number;
  /**
   * Explicit target in container-local px (e.g. garden-nav → boost bar on a fullscreen layer).
   * When set, overrides boostAreaRef slot math.
   */
  targetX?: number;
  targetY?: number;
  /** When particle impacts, add boost with this offer (duration + icon) */
  offerId?: string;
  durationMs?: number;
  icon?: string;
  /** When 'store', particle renders in Store's header; 'gardenNav' = fullscreen from Garden tab; else Farm header */
  sourceScreen?: 'farm' | 'store' | 'gardenNav';
}

interface BoostParticleProps {
  data: BoostParticleData;
  /** Container the particle is rendered inside (e.g. header left wrapper); positions are in container local px */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Boost area (sibling in same container); target = boostArea.offsetLeft + slot*28+13, offsetTop+11 */
  boostAreaRef: React.RefObject<HTMLElement | null>;
  onImpact?: (data: BoostParticleData) => void;
  onComplete: () => void;
}

export const BoostParticle: React.FC<BoostParticleProps> = ({
  data,
  containerRef,
  boostAreaRef,
  onImpact,
  onComplete,
}) => {
  const [frame, setFrame] = useState<{ phase: 'moving' | 'trailOnly'; pos: Point; trail: Point[]; trailOpacity: number }>({
    phase: 'moving',
    pos: { x: data.startX, y: data.startY },
    trail: [],
    trailOpacity: 1,
  });
  const startTimeRef = useRef<number>(Date.now());
  const startPosRef = useRef<Point>({ x: data.startX, y: data.startY });
  const trailRef = useRef<Point[]>([]);
  const impactFiredRef = useRef(false);
  const trailOnlyStartRef = useRef<number>(0);
  const phaseRef = useRef<'moving' | 'trailOnly'>('moving');
  const rafRef = useRef<number>(0);
  const completeScheduledRef = useRef(false);
  const onImpactRef = useRef(onImpact);
  const onCompleteRef = useRef(onComplete);
  onImpactRef.current = onImpact;
  onCompleteRef.current = onComplete;
  phaseRef.current = frame.phase;

  useEffect(() => {
    startTimeRef.current = Date.now();
    startPosRef.current = { x: data.startX, y: data.startY };
    trailRef.current = [{ x: data.startX, y: data.startY }];
  }, [data.id, data.startX, data.startY]);

  // Performance Mode: apply boost immediately, skip flight.
  useEffect(() => {
    if (!getPerformanceMode()) return;
    onImpactRef.current?.(data);
    onCompleteRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only once per particle id
  }, [data.id]);

  useEffect(() => {
    if (getPerformanceMode()) return;
    const container = containerRef.current;
    const boostArea = boostAreaRef.current;
    const hasExplicitTarget = data.targetX != null && data.targetY != null;
    if (!container || (!hasExplicitTarget && !boostArea)) return;

    const getTargetPos = (): Point => {
      if (data.targetX != null && data.targetY != null) {
        return { x: data.targetX, y: data.targetY };
      }
      const slotIndex = data.targetSlotIndex ?? 0;
      const targetX = boostArea!.offsetLeft + slotIndex * BOOST_SLOT_WIDTH + BOOST_CENTER_OFFSET;
      const targetY = boostArea!.offsetTop + BOOST_AREA_HALF_HEIGHT;
      return { x: targetX, y: targetY };
    };

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;

      if (phaseRef.current === 'moving') {
        const t = Math.min(elapsed / MOVE_DURATION_MS, 1);
        let eased: number;
        if (t < 0.5) {
          eased = 0.25 * Math.pow(t * 2, 2);
        } else {
          eased = 0.25 + 0.75 * (1 - Math.pow(1 - (t - 0.5) * 2, 5));
        }

        const target = getTargetPos();
        const start = startPosRef.current;

        const cp1x = start.x - 50;
        const cp1y = start.y - 200;
        const cp2x = target.x + 30;
        const cp2y = target.y + 50;

        const oneMinusT = 1 - eased;
        const x = oneMinusT * oneMinusT * oneMinusT * start.x +
                  3 * oneMinusT * oneMinusT * eased * cp1x +
                  3 * oneMinusT * eased * eased * cp2x +
                  eased * eased * eased * target.x;
        const y = oneMinusT * oneMinusT * oneMinusT * start.y +
                  3 * oneMinusT * oneMinusT * eased * cp1y +
                  3 * oneMinusT * eased * eased * cp2y +
                  eased * eased * eased * target.y;

        trailRef.current = [{ x, y }, ...trailRef.current].slice(0, MAX_TRAIL_POINTS);

        if (t >= 1) {
          if (!impactFiredRef.current) {
            impactFiredRef.current = true;
            onImpactRef.current?.(data);
          }
          phaseRef.current = 'trailOnly';
          trailOnlyStartRef.current = now;
          setFrame({ phase: 'trailOnly', pos: { x, y }, trail: [...trailRef.current], trailOpacity: 1 });
        } else {
          setFrame({ phase: 'moving', pos: { x, y }, trail: [...trailRef.current], trailOpacity: 1 });
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (phaseRef.current === 'trailOnly') {
        const trailElapsed = now - trailOnlyStartRef.current;
        const fade = Math.max(0, 1 - trailElapsed / TRAIL_FADE_AFTER_HIT_MS);
        if (fade <= 0) {
          if (!completeScheduledRef.current) {
            completeScheduledRef.current = true;
            onCompleteRef.current();
          }
          return;
        }
        setFrame((prev) => ({ ...prev, trailOpacity: fade, trail: [...trailRef.current] }));
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, containerRef, boostAreaRef]);

  // Safety net: force-complete if animation is stuck
  useEffect(() => {
    if (getPerformanceMode()) return;
    const timer = window.setTimeout(() => {
      if (!impactFiredRef.current) {
        impactFiredRef.current = true;
        onImpactRef.current?.(data);
      }
      if (!completeScheduledRef.current) {
        completeScheduledRef.current = true;
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
        onCompleteRef.current();
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [data.id]);

  if (getPerformanceMode()) return null;

  const { phase, pos, trail, trailOpacity } = frame;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 200 }}>
      {trail.length > 1 && (
        <svg className="absolute inset-0 w-full h-full overflow-visible" style={{ pointerEvents: 'none' }}>
          <g style={{ opacity: trailOpacity }}>
            {trail.map((point, i) => {
              if (i === 0) return null;
              const prev = trail[i - 1];
              const segmentCount = Math.max(1, trail.length - 1);
              const taperProgress = (i - 1) / Math.max(1, segmentCount - 1);
              const opacityScale = 1.0 - taperProgress;
              return (
                <line
                  key={`bp-${i}`}
                  x1={prev.x}
                  y1={prev.y}
                  x2={point.x}
                  y2={point.y}
                  stroke={TRAIL_COLOR}
                  strokeWidth={PARTICLE_SIZE}
                  strokeLinecap="round"
                  strokeOpacity={opacityScale}
                />
              );
            })}
          </g>
        </svg>
      )}

      {phase === 'moving' && (
        <div
          className="absolute"
          style={{
            left: pos.x,
            top: pos.y,
            width: PARTICLE_SIZE,
            height: PARTICLE_SIZE,
            transform: 'translate(-50%, -50%)',
            backgroundColor: PARTICLE_COLOR,
            borderRadius: '50%',
            border: `2px solid ${TRAIL_COLOR}`,
            boxShadow: `0 2px 4px rgba(0,0,0,0.2)`,
          }}
        />
      )}
    </div>
  );
};
