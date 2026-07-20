/**
 * Flies from plant-info purchase button to the collection bar golden pot (or upward off-screen if target hidden).
 * Path, size, trail, and timing match `GoalCoinParticle` variant="popupReward".
 */
import React, { useEffect, useRef, useState } from 'react';
import { getPlantPotGoldPath } from '../utils/gardenAssets';
import { getPerformanceMode } from '../utils/performanceMode';

const MOVE_DURATION_MS = 350;
const DURATION_MUL = 0.75;
const MAX_TRAIL_POINTS = 8;
const TRAIL_FADE_AFTER_HIT_MS = 280;
const PARTICLE_SIZE = 40;
/** Warm gold from golden pot sprite */
const TRAIL_COLOR = '#d4a832';
const TRAIL_STROKE_WIDTH = 32;

export interface GoldenPotProgressParticleData {
  id: string;
  startX: number;
  startY: number;
}

interface Point {
  x: number;
  y: number;
}

function easePathProgressPopupReward(t: number): number {
  if (t <= 0.14) return (t / 0.14) * 0.1;
  const u = (t - 0.14) / 0.86;
  return 0.1 + 0.9 * Math.pow(u, 1.7);
}

function isVisibleInViewport(rect: DOMRect): boolean {
  return (
    rect.bottom > 0 &&
    rect.top < window.innerHeight &&
    rect.right > 0 &&
    rect.left < window.innerWidth
  );
}

function resolveTarget(
  start: Point,
  progressBarEl: HTMLElement | null,
  walletEl: HTMLElement | null,
): { point: Point; kind: 'progressBar' | 'wallet' } {
  if (progressBarEl) {
    const r = progressBarEl.getBoundingClientRect();
    if (isVisibleInViewport(r)) {
      return {
        point: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
        kind: 'progressBar',
      };
    }
  }
  if (walletEl) {
    const r = walletEl.getBoundingClientRect();
    return {
      point: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
      kind: 'wallet',
    };
  }
  return {
    point: { x: start.x, y: start.y - Math.min(420, window.innerHeight * 0.55) },
    kind: 'wallet',
  };
}

export type GoldenPotProgressImpactTarget = 'progressBar' | 'wallet';

interface GoldenPotProgressParticleProps {
  data: GoldenPotProgressParticleData;
  progressBarTargetRef?: React.RefObject<HTMLElement | null>;
  walletFallbackTargetRef: React.RefObject<HTMLElement | null>;
  onImpact: (target: GoldenPotProgressImpactTarget) => void;
  onComplete: () => void;
}

export const GoldenPotProgressParticle: React.FC<GoldenPotProgressParticleProps> = ({
  data,
  progressBarTargetRef,
  walletFallbackTargetRef,
  onImpact,
  onComplete,
}) => {
  const moveDurationMs = MOVE_DURATION_MS * DURATION_MUL;
  const trailFadeAfterHitMs = TRAIL_FADE_AFTER_HIT_MS * DURATION_MUL;
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
  const impactTargetKindRef = useRef<GoldenPotProgressImpactTarget>('progressBar');
  const onImpactRef = useRef(onImpact);
  const onCompleteRef = useRef(onComplete);
  onImpactRef.current = onImpact;
  onCompleteRef.current = onComplete;
  phaseRef.current = frame.phase;

  useEffect(() => {
    startTimeRef.current = Date.now();
    trailRef.current = [{ p: { x: data.startX, y: data.startY }, color: TRAIL_COLOR, t: 0 }];
  }, [data.id, data.startX, data.startY]);

  // Performance Mode: impact immediately (clears bar hold), skip flight.
  useEffect(() => {
    if (!getPerformanceMode()) return;
    const target = resolveTarget(
      { x: data.startX, y: data.startY },
      progressBarTargetRef?.current ?? null,
      walletFallbackTargetRef.current,
    );
    onImpactRef.current(target.kind);
    onCompleteRef.current();
  }, [data.id, data.startX, data.startY, progressBarTargetRef, walletFallbackTargetRef]);

  useEffect(() => {
    if (getPerformanceMode()) return;
    mountedRef.current = true;
    completeScheduledRef.current = false;
    const start = { x: data.startX, y: data.startY };

    const getTarget = () =>
      resolveTarget(start, progressBarTargetRef?.current ?? null, walletFallbackTargetRef.current);

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
      const elapsed = now - startTimeRef.current;

      if (phaseRef.current === 'moving') {
        const t = Math.min(elapsed / moveDurationMs, 1);
        const tt = easePathProgressPopupReward(t);
        const targetResult = getTarget();
        impactTargetKindRef.current = targetResult.kind;
        const target = targetResult.point;
        const dx = target.x - start.x;
        const dy = target.y - start.y;

        const cp1: Point = { x: start.x + dx * 0.45, y: start.y };
        const cp2: Point = { x: target.x - dx * 0.05, y: start.y + dy * 0.55 };

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

        const coinScale = t <= 0.5 ? 1 - (1 - 0.65) * (t / 0.5) : 0.65;
        if (useTrail) {
          trailRef.current = [{ p: { x, y }, color: TRAIL_COLOR, t }, ...trailRef.current].slice(
            0,
            MAX_TRAIL_POINTS,
          );
        }

        if (t >= 1) {
          if (!impactFiredRef.current) {
            impactFiredRef.current = true;
            onImpactRef.current(impactTargetKindRef.current);
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
        const fade = Math.max(0, 1 - trailElapsed / trailFadeAfterHitMs);
        if (trailElapsed >= trailFadeAfterHitMs || fade <= 0.001) {
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
  }, [data, progressBarTargetRef, walletFallbackTargetRef, useTrail, moveDurationMs, trailFadeAfterHitMs]);

  useEffect(() => {
    if (getPerformanceMode()) return;
    const timer = window.setTimeout(() => {
      if (!impactFiredRef.current) {
        impactFiredRef.current = true;
        onImpactRef.current(impactTargetKindRef.current);
      }
      if (!completeScheduledRef.current) {
        completeScheduledRef.current = true;
        onCompleteRef.current();
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [data.id]);

  if (getPerformanceMode()) return null;

  const { phase, pos, scale, trail, trailOpacity } = frame;

  return (
    <>
      {useTrail && trail.length > 1 && (
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
          <g>
            {trail.map((seg, i) => {
              if (i === 0) return null;
              const prev = trail[i - 1];
              const headT = prev.t;
              const baseWidthScale = headT <= 0.5 ? 1 - (1 - 0.65) * (headT / 0.5) : 0.65;
              const taperProgress = (i - 1) / Math.max(1, trail.length - 2);
              const widthScale = baseWidthScale * (1 - taperProgress);
              const opacityScale = 1.0 - taperProgress;
              const lineOpacity = Math.max(0, Math.min(1, opacityScale * trailOpacity));
              return (
                <line
                  key={`gpp-${data.id}-${i}`}
                  x1={prev.p.x}
                  y1={prev.p.y}
                  x2={seg.p.x}
                  y2={seg.p.y}
                  stroke={seg.color}
                  strokeWidth={TRAIL_STROKE_WIDTH * widthScale}
                  strokeLinecap="round"
                  strokeOpacity={lineOpacity}
                />
              );
            })}
          </g>
        </svg>
      )}
      {phase === 'moving' && (
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: pos.x,
            top: pos.y,
            width: PARTICLE_SIZE,
            height: PARTICLE_SIZE,
            transform: `translate(-50%, -50%) scale(${scale})`,
          }}
        >
          <img
            src={getPlantPotGoldPath()}
            alt=""
            className="w-full h-full object-contain"
            aria-hidden
            draggable={false}
          />
        </div>
      )}
    </>
  );
};
