/**
 * Rectangular perimeter leaf burst — same physics as discovery / daily-tasks popup open VFX.
 * Leaves spawn on a rectangle edge and burst outward with gravity + drag.
 */
import React, { useEffect, useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import { shouldPlayPopupLeafBurst } from '../utils/performanceMode';

const LEAF_SPRITES = [
  assetPath('/assets/vfx/particle_leaf_green_1.png'),
  assetPath('/assets/vfx/particle_leaf_green_2.png'),
];

export const POPUP_RECT_LEAF_COUNT = 40;
export const POPUP_RECT_LEAF_MIN_LIFETIME_MS = 250;
export const POPUP_RECT_LEAF_MAX_LIFETIME_MS = 1000;

const GRAVITY_PX_PER_S = 60;
const DRAG = 0.92;

interface LeafParticle {
  id: number;
  sprite: string;
  angle: number;
  speed: number;
  rotationSpeed: number;
  initialRotation: number;
  size: number;
  delay: number;
  spawnX?: number;
  spawnY?: number;
  lifetime: number;
}

export function createRectPerimeterPopupLeaves(
  width: number,
  height: number,
  leafCount = POPUP_RECT_LEAF_COUNT,
  /** Pull top-edge spawns down so leaves erupt from lower on the top side. */
  topEdgeInsetPx = 0,
): LeafParticle[] {
  const halfW = width / 2;
  const halfH = height / 2;
  const topY = -halfH + Math.max(0, topEdgeInsetPx);
  const perimeter = 2 * (width + height);
  return Array.from({ length: leafCount }, (_, i) => {
    const pos = (i / leafCount) * perimeter + Math.random() * 40;

    let spawnX: number;
    let spawnY: number;
    let outwardAngle: number;

    if (pos < width) {
      spawnX = pos - halfW;
      spawnY = topY;
      outwardAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    } else if (pos < width + height) {
      spawnX = halfW;
      spawnY = pos - width - halfH;
      outwardAngle = (Math.random() - 0.5) * 0.8;
    } else if (pos < 2 * width + height) {
      spawnX = halfW - (pos - width - height);
      spawnY = halfH;
      outwardAngle = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    } else {
      spawnX = -halfW;
      spawnY = halfH - (pos - 2 * width - height);
      outwardAngle = Math.PI + (Math.random() - 0.5) * 0.8;
    }

    return {
      id: i,
      sprite: LEAF_SPRITES[i % LEAF_SPRITES.length],
      angle: outwardAngle,
      speed: Math.random() * 337.5,
      rotationSpeed: (Math.random() - 0.5) * 540,
      initialRotation: Math.random() * 360,
      size: 15 + Math.random() * 15,
      lifetime:
        POPUP_RECT_LEAF_MIN_LIFETIME_MS +
        Math.random() * (POPUP_RECT_LEAF_MAX_LIFETIME_MS - POPUP_RECT_LEAF_MIN_LIFETIME_MS),
      delay: 0,
      spawnX,
      spawnY,
    };
  });
}

export interface PopupRectLeafBurstProps {
  rectWidth: number;
  rectHeight: number;
  /** When set, burst is fixed at viewport center (e.g. task claim). Otherwise centered in parent. */
  centerX?: number;
  centerY?: number;
  /** Inset top-edge spawn line downward (px). Left/right/bottom unchanged. */
  topEdgeInsetPx?: number;
  zIndex?: number;
  onComplete?: () => void;
}

export const PopupRectLeafBurst: React.FC<PopupRectLeafBurstProps> = ({
  rectWidth,
  rectHeight,
  centerX,
  centerY,
  topEdgeInsetPx = 0,
  zIndex = 101,
  onComplete,
}) => {
  const skipBurst = !shouldPlayPopupLeafBurst();
  const [leaves, setLeaves] = useState<LeafParticle[]>(() =>
    skipBurst
      ? []
      : createRectPerimeterPopupLeaves(rectWidth, rectHeight, POPUP_RECT_LEAF_COUNT, topEdgeInsetPx),
  );
  const [leafPositions, setLeafPositions] = useState<
    { x: number; y: number; opacity: number; rotation: number; scale: number }[]
  >(() =>
    leaves.map((leaf) => ({
      x: leaf.spawnX ?? 0,
      y: leaf.spawnY ?? 0,
      opacity: 1,
      rotation: 0,
      scale: 1,
    })),
  );
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({});
  const leafRafRef = useRef<number>(0);
  const leafStartTimeRef = useRef(Date.now());
  const leafPosRef = useRef<
    {
      x: number;
      y: number;
      vx: number;
      vy: number;
      opacity: number;
      rotation: number;
      scale: number;
      started: boolean;
    }[]
  >(
    leaves.map((leaf) => ({
      x: leaf.spawnX ?? 0,
      y: leaf.spawnY ?? 0,
      vx: 0,
      vy: 0,
      opacity: 1,
      rotation: 0,
      scale: 1,
      started: false,
    })),
  );
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (skipBurst) {
      onCompleteRef.current?.();
      return;
    }
    if (leaves.length === 0) return;

    const tick = () => {
      const elapsed = Date.now() - leafStartTimeRef.current;
      const allDone = leaves.every((leaf) => {
        const leafElapsed = elapsed - leaf.delay;
        return leafElapsed > leaf.lifetime + 100;
      });

      if (allDone) {
        setLeaves([]);
        onCompleteRef.current?.();
        return;
      }

      leafPosRef.current.forEach((p, i) => {
        const leaf = leaves[i];
        if (!leaf) return;
        const leafElapsed = elapsed - leaf.delay;

        if (leafElapsed < 0) return;
        if (leafElapsed > leaf.lifetime) {
          p.opacity = 0;
          return;
        }

        if (!p.started) {
          p.started = true;
          p.vx = Math.cos(leaf.angle) * leaf.speed;
          p.vy = Math.sin(leaf.angle) * leaf.speed;
        }

        const dtSec = 1 / 60;
        p.vy += GRAVITY_PX_PER_S * dtSec;
        p.vx *= DRAG;
        p.vy *= DRAG;
        p.x += p.vx * dtSec;
        p.y += p.vy * dtSec;
        p.rotation = leaf.initialRotation + (leafElapsed / 1000) * leaf.rotationSpeed;

        const fadeStart = leaf.lifetime * 0.5;
        const fadeDuration = leaf.lifetime * 0.5;
        p.opacity =
          leafElapsed < fadeStart ? 1 : Math.max(0, 1 - (leafElapsed - fadeStart) / fadeDuration);
        p.scale = 1 - 0.2 * Math.min(1, leafElapsed / leaf.lifetime);
      });

      setLeafPositions(
        leafPosRef.current.map((p) => ({
          x: p.x,
          y: p.y,
          opacity: p.opacity,
          rotation: p.rotation,
          scale: p.scale,
        })),
      );
      leafRafRef.current = requestAnimationFrame(tick);
    };

    leafRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(leafRafRef.current);
  }, [leaves, skipBurst]);

  if (leaves.length === 0) return null;

  const useFixedCenter = centerX != null && centerY != null;

  return (
    <div
      className="pointer-events-none"
      style={
        useFixedCenter
          ? {
              position: 'fixed',
              left: centerX,
              top: centerY,
              width: 1,
              height: 1,
              transform: 'translate(-50%, -50%)',
              zIndex,
            }
          : {
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 1,
              height: 1,
              transform: 'translate(-50%, -50%)',
              zIndex,
            }
      }
    >
      {leaves.map((leaf, i) => (
        <div
          key={leaf.id}
          className="absolute"
          style={{
            left: leafPositions[i]?.x ?? 0,
            top: leafPositions[i]?.y ?? 0,
            width: leaf.size,
            height: leaf.size,
            transform: `translate(-50%, -50%) scale(${leafPositions[i]?.scale ?? 1}) rotate(${leafPositions[i]?.rotation ?? 0}deg)`,
            opacity: leafPositions[i]?.opacity ?? 0,
          }}
        >
          {imgFailed[i] ? (
            <div
              className="w-full h-full rounded-sm"
              style={{
                background: 'linear-gradient(135deg, #4a7c23 0%, #6b8e23 100%)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          ) : (
            <img
              src={leaf.sprite}
              alt=""
              className="w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
              onError={() => setImgFailed((prev) => ({ ...prev, [i]: true }))}
            />
          )}
        </div>
      ))}
    </div>
  );
};
