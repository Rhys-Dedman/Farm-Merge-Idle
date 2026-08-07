/**
 * Special delivery key particle: flies from the golden-pot (key) wallet to a lock.
 * Path: down-down-right trough, then swing up underneath the lock. Coin-style trail.
 */
import React, { useEffect, useRef, useState } from 'react';
import { SPECIAL_DELIVERY_KEY_FLIGHT_MS } from '../constants/specialDeliveries';
import { assetPath } from '../utils/assetPath';
import { getPerformanceMode } from '../utils/performanceMode';

const MAX_TRAIL_POINTS = 8;
const TRAIL_FADE_AFTER_HIT_MS = 180;
const PARTICLE_SIZE = 40;
const TRAIL_COLOR = '#dfbb38';
const TRAIL_STROKE_WIDTH = 28;
const KEY_HEAD_ICON = assetPath('/assets/icons/coins/icon_key.png');

export interface SpecialDeliveryKeyParticleData {
  id: string;
  doorIndex: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface Point {
  x: number;
  y: number;
}

interface SpecialDeliveryKeyParticleProps {
  data: SpecialDeliveryKeyParticleData;
  onImpact: (doorIndex: number) => void;
  onComplete: () => void;
}

function sampleKeyPath(tt: number, start: Point, end: Point): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  // Wide rightward trough (shallower), then swing back left/up under the lock.
  const troughY = Math.max(start.y, end.y) + Math.max(55, Math.abs(dy) * 0.32);
  const rightOut = Math.max(120, Math.abs(dx) * 0.55 + 80);
  const cp1: Point = {
    x: start.x + dx * 0.25 + rightOut * 0.55,
    y: start.y + Math.max(50, Math.abs(dy) * 0.22),
  };
  const cp2: Point = {
    x: end.x + rightOut,
    y: troughY,
  };
  return {
    x:
      Math.pow(1 - tt, 3) * start.x +
      3 * Math.pow(1 - tt, 2) * tt * cp1.x +
      3 * (1 - tt) * tt * tt * cp2.x +
      Math.pow(tt, 3) * end.x,
    y:
      Math.pow(1 - tt, 3) * start.y +
      3 * Math.pow(1 - tt, 2) * tt * cp1.y +
      3 * (1 - tt) * tt * tt * cp2.y +
      Math.pow(tt, 3) * end.y,
  };
}

/** Fast ease — mostly linear with a slight punch into the hit. */
function easeKeyFlight(t: number): number {
  return 1 - Math.pow(1 - t, 1.35);
}

export const SpecialDeliveryKeyParticle: React.FC<SpecialDeliveryKeyParticleProps> = ({
  data,
  onImpact,
  onComplete,
}) => {
  const useTrail = !getPerformanceMode();
  const [frame, setFrame] = useState<{
    phase: 'moving' | 'trailOnly';
    pos: Point;
    scale: number;
    trail: { p: Point; color: string; t: number }[];
    trailOpacity: number;
  }>({
    phase: 'moving',
    pos: { x: data.startX, y: data.startY },
    scale: 1,
    trail: [],
    trailOpacity: 1,
  });

  const startTimeRef = useRef(Date.now());
  const trailRef = useRef<{ p: Point; color: string; t: number }[]>([]);
  const impactFiredRef = useRef(false);
  const trailOnlyStartRef = useRef(0);
  const phaseRef = useRef<'moving' | 'trailOnly'>('moving');
  const rafRef = useRef(0);
  const mountedRef = useRef(true);
  const completeScheduledRef = useRef(false);
  const onImpactRef = useRef(onImpact);
  const onCompleteRef = useRef(onComplete);
  onImpactRef.current = onImpact;
  onCompleteRef.current = onComplete;
  phaseRef.current = frame.phase;

  useEffect(() => {
    startTimeRef.current = Date.now();
    trailRef.current = [{ p: { x: data.startX, y: data.startY }, color: TRAIL_COLOR, t: 0 }];
  }, [data.id, data.startX, data.startY]);

  useEffect(() => {
    if (!getPerformanceMode()) return;
    onImpactRef.current(data.doorIndex);
    onCompleteRef.current();
  }, [data.id, data.doorIndex]);

  useEffect(() => {
    if (getPerformanceMode()) return;
    mountedRef.current = true;
    completeScheduledRef.current = false;
    impactFiredRef.current = false;
    phaseRef.current = 'moving';
    const start = { x: data.startX, y: data.startY };
    const end = { x: data.endX, y: data.endY };

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

    const tick = () => {
      if (!mountedRef.current) return;
      const now = Date.now();

      if (phaseRef.current === 'moving') {
        const elapsed = now - startTimeRef.current;
        const t = Math.min(elapsed / SPECIAL_DELIVERY_KEY_FLIGHT_MS, 1);
        const tt = easeKeyFlight(t);
        const { x, y } = sampleKeyPath(tt, start, end);
        const coinScale = t <= 0.5 ? 1 - (1 - 0.7) * (t / 0.5) : 0.7;
        if (useTrail) {
          trailRef.current = [{ p: { x, y }, color: TRAIL_COLOR, t }, ...trailRef.current].slice(
            0,
            MAX_TRAIL_POINTS,
          );
        }

        if (t >= 1) {
          if (!impactFiredRef.current) {
            impactFiredRef.current = true;
            onImpactRef.current(data.doorIndex);
          }
          if (useTrail) {
            trailOnlyStartRef.current = now;
            phaseRef.current = 'trailOnly';
            setFrame({
              phase: 'trailOnly',
              pos: { x, y },
              scale: coinScale,
              trail: [...trailRef.current],
              trailOpacity: 1,
            });
          } else {
            finishAndDespawn();
            return;
          }
        } else {
          setFrame({
            phase: 'moving',
            pos: { x, y },
            scale: coinScale,
            trail: useTrail ? [...trailRef.current] : [],
            trailOpacity: 1,
          });
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (phaseRef.current === 'trailOnly') {
        const trailElapsed = now - trailOnlyStartRef.current;
        const fade = Math.max(0, 1 - trailElapsed / TRAIL_FADE_AFTER_HIT_MS);
        if (trailElapsed >= TRAIL_FADE_AFTER_HIT_MS || fade <= 0.001) {
          finishAndDespawn();
          return;
        }
        setFrame((prev) => ({ ...prev, trailOpacity: fade, trail: [...trailRef.current] }));
        rafRef.current = requestAnimationFrame(tick);
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
  }, [data.id, data.doorIndex, data.startX, data.startY, data.endX, data.endY, useTrail]);

  if (getPerformanceMode()) return null;

  const { phase, pos, scale, trail, trailOpacity } = frame;
  const showParticle = phase !== 'trailOnly';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 220 }}>
      {useTrail && trail.length > 1 && (
        <svg className="absolute inset-0 w-full h-full overflow-visible" style={{ pointerEvents: 'none' }}>
          <g>
            {trail.map((seg, i) => {
              if (i === 0) return null;
              const prev = trail[i - 1];
              const curr = seg;
              const headT = prev.t;
              const baseWidthScale = headT <= 0.5 ? 1 - (1 - 0.65) * (headT / 0.5) : 0.65;
              const taperProgress = (i - 1) / Math.max(1, trail.length - 2);
              const widthScale = baseWidthScale * (1 - taperProgress);
              const opacityScale = 1.0 - taperProgress;
              const lineOpacity = Math.max(0, Math.min(1, opacityScale * trailOpacity));
              return (
                <line
                  key={`sdk-${data.id}-${i}`}
                  x1={prev.p.x}
                  y1={prev.p.y}
                  x2={curr.p.x}
                  y2={curr.p.y}
                  stroke={curr.color}
                  strokeWidth={TRAIL_STROKE_WIDTH * widthScale}
                  strokeLinecap="round"
                  strokeOpacity={lineOpacity}
                />
              );
            })}
          </g>
        </svg>
      )}

      {showParticle && (
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: pos.x,
            top: pos.y,
            width: PARTICLE_SIZE,
            height: PARTICLE_SIZE,
            transform: `translate(-50%, -50%) scale(${scale})`,
            zIndex: 2,
          }}
        >
          <img
            src={KEY_HEAD_ICON}
            alt=""
            className="w-full h-full object-contain"
            aria-hidden
            draggable={false}
          />
        </div>
      )}
    </div>
  );
};
