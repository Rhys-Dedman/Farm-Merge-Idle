/**
 * FTUE unlock: boarded planks drop from rest under gravity and rotate over their lifetime.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  SPECIAL_DELIVERY_PLANK_FALL_GRAVITY,
  SPECIAL_DELIVERY_PLANK_FALL_MS,
} from '../constants/specialDeliveries';
import { assetPath } from '../utils/assetPath';

export type SpecialDeliveryFallingPlank = {
  src: string;
  x: number;
  y: number;
  widthPx: number;
  heightPx: number;
  /** Total rotation over the lifetime (deg). Positive = clockwise. */
  rotEndDeg: number;
};

interface SpecialDeliveryPlankFallProps {
  id: string;
  planks: readonly SpecialDeliveryFallingPlank[];
  onComplete?: () => void;
}

type PlankFrame = {
  x: number;
  y: number;
  rot: number;
  opacity: number;
};

export function SpecialDeliveryPlankFall({
  id,
  planks,
  onComplete,
}: SpecialDeliveryPlankFallProps) {
  const [frames, setFrames] = useState<PlankFrame[]>(() =>
    planks.map((p) => ({ x: p.x, y: p.y, rot: 0, opacity: 1 })),
  );
  const rafRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const planksRef = useRef(planks);
  planksRef.current = planks;

  useEffect(() => {
    const start = Date.now();
    const gravity = SPECIAL_DELIVERY_PLANK_FALL_GRAVITY;
    const startPlanks = planksRef.current;

    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / SPECIAL_DELIVERY_PLANK_FALL_MS);
      const sec = elapsed / 1000;
      // Rest → gravity only: y = y0 + ½gt²
      const fall = 0.5 * gravity * sec * sec;
      // Full opacity for first half, then fade out.
      const opacity = t <= 0.5 ? 1 : Math.max(0, 1 - (t - 0.5) / 0.5);

      setFrames(
        startPlanks.map((p) => ({
          x: p.x,
          y: p.y + fall,
          rot: p.rotEndDeg * t,
          opacity,
        })),
      );

      if (t >= 1) {
        onCompleteRef.current?.();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [id]);

  return (
    <>
      {planks.map((plank, i) => {
        const frame = frames[i];
        if (!frame) return null;
        return (
          <div
            key={`${id}-${plank.src}`}
            className="absolute pointer-events-none"
            style={{
              left: frame.x,
              top: frame.y,
              width: plank.widthPx,
              height: plank.heightPx,
              zIndex: 220,
              transform: `translate(-50%, -50%) rotate(${frame.rot}deg)`,
              transformOrigin: '50% 50%',
              opacity: frame.opacity,
              willChange: 'transform, opacity',
            }}
          >
            <img
              src={assetPath(plank.src)}
              alt=""
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        );
      })}
    </>
  );
}
