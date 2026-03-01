/**
 * Offer particle: spawns above the tab and falls straight down with an orange trail.
 */
import React, { useEffect, useRef, useState } from 'react';

const MOVE_DURATION_MS = 350;
const MAX_TRAIL_POINTS = 7;
const TRAIL_FADE_AFTER_HIT_MS = 150;
const PARTICLE_SIZE = 14;
const PARTICLE_COLOR = '#ffd856';
const TRAIL_COLOR = '#f59d42';

interface Point {
  x: number;
  y: number;
}

export interface OfferParticleData {
  id: string;
  startX: number;
  startY: number;
}

interface OfferParticleProps {
  data: OfferParticleData;
  containerRef: React.RefObject<HTMLDivElement | null>;
  targetRef: React.RefObject<HTMLElement | null>;
  onImpact?: () => void;
  onComplete: () => void;
  appScale?: number;
}

export const OfferParticle: React.FC<OfferParticleProps> = ({
  data,
  containerRef,
  targetRef,
  onImpact,
  onComplete,
  appScale = 1,
}) => {
  const [phase, setPhase] = useState<'moving' | 'trailOnly'>('moving');
  const [pos, setPos] = useState<Point>({ x: data.startX, y: data.startY });
  const [trail, setTrail] = useState<Point[]>([]);
  const [trailOpacity, setTrailOpacity] = useState(1);
  const startTimeRef = useRef<number>(Date.now());
  const startPosRef = useRef<Point>({ x: data.startX, y: data.startY });
  const trailRef = useRef<Point[]>([]);
  const impactFiredRef = useRef(false);
  const trailOnlyStartRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
    startPosRef.current = { x: data.startX, y: data.startY };
    trailRef.current = [{ x: data.startX, y: data.startY }];
  }, [data.id, data.startX, data.startY]);

  useEffect(() => {
    const container = containerRef.current;
    const target = targetRef.current;
    if (!container || !target) return;

    const getTargetPos = (): Point => {
      const tr = target.getBoundingClientRect();
      const cr = container.getBoundingClientRect();
      return {
        x: (tr.left + tr.width / 2 - cr.left) / appScale,
        y: (tr.top + tr.height / 2 - cr.top) / appScale,
      };
    };

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;

      if (phase === 'moving') {
        const t = Math.min(elapsed / MOVE_DURATION_MS, 1);
        // Ease-in for accelerating fall (like gravity)
        const eased = t * t;
        
        const targetPos = getTargetPos();
        const start = startPosRef.current;
        
        // Simple straight line fall - X stays same, Y interpolates
        const x = start.x;
        const y = start.y + (targetPos.y - start.y) * eased;
        
        setPos({ x, y });

        trailRef.current = [{ x, y }, ...trailRef.current].slice(0, MAX_TRAIL_POINTS);
        setTrail([...trailRef.current]);

        if (t >= 1) {
          if (!impactFiredRef.current) {
            impactFiredRef.current = true;
            onImpact?.();
          }
          setPhase('trailOnly');
          trailOnlyStartRef.current = now;
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (phase === 'trailOnly') {
        const trailElapsed = now - trailOnlyStartRef.current;
        const fade = Math.max(0, 1 - trailElapsed / TRAIL_FADE_AFTER_HIT_MS);
        setTrailOpacity(fade);
        setTrail([...trailRef.current]);
        if (fade <= 0) {
          onComplete();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, data, containerRef, targetRef, onImpact, onComplete, appScale]);

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
                  key={`ot-${i}`}
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
