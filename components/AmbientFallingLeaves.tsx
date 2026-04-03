/**
 * Sparse ambient leaves: spawn on `spawnIntervalMs` cadence along the top; layered sine “wind”.
 * (similar to game VFX that combines gravity + horizontal noise / multiple frequencies).
 */
import React, { useEffect, useRef, useState } from 'react';
import { scheduleNextFrame } from '../utils/raf60';
import { getPerformanceMode } from '../utils/performanceMode';

/** Start slightly above the visible area */
const SPAWN_Y_PX = -20;
const BOTTOM_CULL_MARGIN_PX = 48;
const HORIZONTAL_INSET_PX = 8;

interface AmbientLeafSim {
  id: number;
  sprite: string;
  spawnX: number;
  size: number;
  spawnTime: number;
  vy: number;
  drift: number;
  swayA1: number;
  swayW1: number;
  swayP1: number;
  swayA2: number;
  swayW2: number;
  swayP2: number;
  rot0: number;
  rotSpeed: number;
  rotWobbleA: number;
  rotWobbleW: number;
  rotWobbleP: number;
}

interface AmbientLeafDraw {
  id: number;
  sprite: string;
  x: number;
  y: number;
  rotationRad: number;
  size: number;
}

function createLeaf(id: number, widthPx: number, spriteUrl: string, noiseStrength: number): AmbientLeafSim {
  const usable = Math.max(1, widthPx - 2 * HORIZONTAL_INSET_PX);
  const n = noiseStrength;
  return {
    id,
    sprite: spriteUrl,
    spawnX: HORIZONTAL_INSET_PX + Math.random() * usable,
    size: 20 + Math.random() * 10,
    spawnTime: performance.now(),
    vy: 34 + Math.random() * 16,
    drift: (Math.random() - 0.5) * 26 * n,
    swayA1: (24 + Math.random() * 32) * n,
    swayW1: 0.75 + Math.random() * 0.65,
    swayP1: Math.random() * Math.PI * 2,
    swayA2: (8 + Math.random() * 14) * n,
    swayW2: 2.0 + Math.random() * 2.8,
    swayP2: Math.random() * Math.PI * 2,
    rot0: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.28 + Math.random() * 0.5),
    rotWobbleA: (0.12 + Math.random() * 0.22) * n,
    rotWobbleW: 1.6 + Math.random() * 1.8,
    rotWobbleP: Math.random() * Math.PI * 2,
  };
}

/** Mid-fall leaves when garden becomes visible (per layer, per return visit). */
const PREWARM_LEAF_COUNT = 2;

function prewarmAmbientLeaves(
  out: AmbientLeafSim[],
  nextIdRef: { current: number },
  w: number,
  h: number,
  now: number,
  spriteUrl: string,
  noiseStrength: number
): void {
  const maxY = h + BOTTOM_CULL_MARGIN_PX;
  for (let i = 0; i < PREWARM_LEAF_COUNT; i++) {
    const leaf = createLeaf(nextIdRef.current++, w, spriteUrl, noiseStrength);
    const maxAgeSec = (maxY - SPAWN_Y_PX) / leaf.vy;
    const capSec = Math.max(0.05, maxAgeSec * 0.9);
    /** Stratify by slot so few prewarm leaves don’t land in the same vertical band. */
    const ageSec = Math.max(0.05, ((i + Math.random()) / PREWARM_LEAF_COUNT) * capSec);
    leaf.spawnTime = now - ageSec * 1000;
    out.push(leaf);
  }
}

function simToDraw(leaf: AmbientLeafSim, now: number): AmbientLeafDraw {
  const t = (now - leaf.spawnTime) / 1000;
  const y = SPAWN_Y_PX + leaf.vy * t;
  const x =
    leaf.spawnX +
    leaf.drift * t +
    leaf.swayA1 * Math.sin(leaf.swayW1 * t + leaf.swayP1) +
    leaf.swayA2 * Math.sin(leaf.swayW2 * t + leaf.swayP2);
  const rotationRad =
    leaf.rot0 + leaf.rotSpeed * t + leaf.rotWobbleA * Math.sin(leaf.rotWobbleW * t + leaf.rotWobbleP);
  return { id: leaf.id, sprite: leaf.sprite, x, y, rotationRad, size: leaf.size };
}

export interface AmbientFallingLeavesProps {
  enabled: boolean;
  /** Single leaf texture for this emitter (e.g. particle_leaf_7 only). */
  spriteUrl: string;
  /** Stacking vs other ambient layers (higher = on top). */
  zIndex: number;
  /** Ms between spawns (first spawn after one interval from enable). */
  spawnIntervalMs: number;
  /** Multiplier for wind/sway + rotation wobble (1 = default). */
  noiseStrength?: number;
}

export const AmbientFallingLeaves: React.FC<AmbientFallingLeavesProps> = ({
  enabled,
  spriteUrl,
  zIndex,
  spawnIntervalMs,
  noiseStrength = 1,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 448, h: 796 });
  const leavesRef = useRef<AmbientLeafSim[]>([]);
  const nextIdRef = useRef(0);
  const nextSpawnAtRef = useRef(0);
  const rafRef = useRef(0);
  const frameCountRef = useRef(0);
  const spriteUrlRef = useRef(spriteUrl);
  spriteUrlRef.current = spriteUrl;
  const spawnIntervalMsRef = useRef(spawnIntervalMs);
  spawnIntervalMsRef.current = spawnIntervalMs;
  const noiseStrengthRef = useRef(noiseStrength);
  noiseStrengthRef.current = noiseStrength;
  const prewarmPendingRef = useRef(true);
  const [drawList, setDrawList] = useState<AmbientLeafDraw[]>([]);
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      sizeRef.current = { w: el.clientWidth || 448, h: el.clientHeight || 796 };
    });
    ro.observe(el);
    sizeRef.current = { w: el.clientWidth || 448, h: el.clientHeight || 796 };
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!enabled) {
      leavesRef.current = [];
      setDrawList([]);
      nextSpawnAtRef.current = 0;
      prewarmPendingRef.current = true;
      return;
    }

    const tick = (now: number) => {
      if (!enabled) return;

      const perf = getPerformanceMode();
      const { w, h } = sizeRef.current;
      const maxY = h + BOTTOM_CULL_MARGIN_PX;

      if (w > 8 && prewarmPendingRef.current) {
        prewarmPendingRef.current = false;
        if (!perf) {
          prewarmAmbientLeaves(
            leavesRef.current,
            nextIdRef,
            w,
            h,
            now,
            spriteUrlRef.current,
            noiseStrengthRef.current
          );
          setDrawList(leavesRef.current.map((l) => simToDraw(l, now)));
        }
      }

      if (!perf && w > 8) {
        const interval = spawnIntervalMsRef.current;
        if (nextSpawnAtRef.current === 0) {
          nextSpawnAtRef.current = now + interval;
        }
        if (now >= nextSpawnAtRef.current) {
          leavesRef.current.push(
            createLeaf(nextIdRef.current++, w, spriteUrlRef.current, noiseStrengthRef.current)
          );
          nextSpawnAtRef.current = now + interval;
        }
      }

      leavesRef.current = leavesRef.current.filter((leaf) => {
        const t = (now - leaf.spawnTime) / 1000;
        const y = SPAWN_Y_PX + leaf.vy * t;
        return y < maxY;
      });

      frameCountRef.current += 1;
      if (frameCountRef.current % 2 === 0) {
        setDrawList(leavesRef.current.map((l) => simToDraw(l, now)));
      }

      rafRef.current = scheduleNextFrame(tick);
    };

    rafRef.current = scheduleNextFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, spriteUrl, spawnIntervalMs, noiseStrength]);

  if (!enabled) return null;

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex, pointerEvents: 'none' }}
      aria-hidden
    >
      {drawList.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute"
          style={{
            left: leaf.x,
            top: leaf.y,
            width: leaf.size,
            height: leaf.size,
            transform: `translate(-50%, -50%) rotate(${leaf.rotationRad}rad)`,
            willChange: 'transform',
            pointerEvents: 'none',
          }}
        >
          {imgFailed[leaf.id] ? (
            <div
              className="pointer-events-none h-full w-full rounded-sm opacity-80"
              style={{
                background: 'linear-gradient(135deg, #4a7c23 0%, #6b8e23 100%)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
              }}
            />
          ) : (
            <img
              src={leaf.sprite}
              alt=""
              draggable={false}
              className="h-full w-full object-contain pointer-events-none"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))', pointerEvents: 'none' }}
              onError={() => setImgFailed((prev) => ({ ...prev, [leaf.id]: true }))}
            />
          )}
        </div>
      ))}
    </div>
  );
};
