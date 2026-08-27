/**
 * Unlock knock-off: launches immediately (no ease-in), pops up-left, hangs at apex,
 * then gravity accelerates the fall. Full clockwise 360° over the lifetime.
 * Scale stays 1 for first half, then 1 → 0.75; opacity stays full for first half, then fades out.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_GRAVITY,
  SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_MS,
  SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_VX,
  SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_VY0,
  SPECIAL_DELIVERY_UNLOCK_SRC,
} from '../constants/specialDeliveries';
import { assetPath } from '../utils/assetPath';
import { getPerformanceMode } from '../utils/performanceMode';

interface SpecialDeliveryUnlockKnockoffProps {
  id: string;
  x: number;
  y: number;
  sizePx: number;
  /** Defaults to the normal door unlock sprite. */
  iconSrc?: string;
  onComplete: () => void;
}

export function SpecialDeliveryUnlockKnockoff({
  id,
  x,
  y,
  sizePx,
  iconSrc = SPECIAL_DELIVERY_UNLOCK_SRC,
  onComplete,
}: SpecialDeliveryUnlockKnockoffProps) {
  const [frame, setFrame] = useState({
    x,
    y,
    rot: 0,
    scale: 1,
    opacity: 1,
  });
  const rafRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Performance mode: skip knockoff VFX; still complete so FTUE / unlock flow continues.
    if (getPerformanceMode()) {
      onCompleteRef.current();
      return;
    }
    const start = Date.now();
    // Immediate launch — speeds scaled so the arc matches the 1400ms path at 1.5× travel rate.
    const vx = SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_VX;
    const vy0 = SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_VY0;
    const gravity = SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_GRAVITY;

    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / SPECIAL_DELIVERY_UNLOCK_KNOCKOFF_MS);
      const sec = elapsed / 1000;
      const px = x + vx * sec;
      const py = y + vy0 * sec + 0.5 * gravity * sec * sec;
      // Clockwise 360° over full lifetime (CSS positive = clockwise).
      const rot = 360 * t;
      // Stay at 1 for first half, then 1 → 0.75 over second half.
      const scale = t <= 0.5 ? 1 : 1 - 0.25 * ((t - 0.5) / 0.5);
      // Full opacity for first half, then fade to 0.
      const opacity = t <= 0.5 ? 1 : Math.max(0, 1 - (t - 0.5) / 0.5);

      setFrame({ x: px, y: py, rot, scale, opacity });

      if (t >= 1) {
        onCompleteRef.current();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [id, x, y]);

  if (getPerformanceMode()) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: frame.x,
        top: frame.y,
        width: sizePx,
        height: sizePx,
        zIndex: 221,
        transform: `translate(-50%, -50%) rotate(${frame.rot}deg) scale(${frame.scale})`,
        transformOrigin: '50% 50%',
        opacity: frame.opacity,
        willChange: 'transform, opacity',
      }}
    >
      <img
        src={assetPath(iconSrc)}
        alt=""
        className="w-full h-full object-contain"
        draggable={false}
      />
    </div>
  );
}
