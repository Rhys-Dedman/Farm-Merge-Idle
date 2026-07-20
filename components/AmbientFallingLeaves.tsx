/**
 * Sparse ambient leaves: spawn on `spawnIntervalMs` cadence along the top; layered sine “wind”.
 * Transforms are written to the DOM (no React setState per frame) to keep farm idle cheap.
 */
import React, { useEffect, useRef, useState } from 'react';
import { scheduleNextFrame } from '../utils/raf60';
import { getPerformanceMode, subscribePerformanceMode } from '../utils/performanceMode';

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
  el: HTMLDivElement | null;
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
    el: null,
  };
}

function applyLeafTransform(leaf: AmbientLeafSim, now: number): { x: number; y: number } {
  const t = (now - leaf.spawnTime) / 1000;
  const y = SPAWN_Y_PX + leaf.vy * t;
  const x =
    leaf.spawnX +
    leaf.drift * t +
    leaf.swayA1 * Math.sin(leaf.swayW1 * t + leaf.swayP1) +
    leaf.swayA2 * Math.sin(leaf.swayW2 * t + leaf.swayP2);
  const rotationRad =
    leaf.rot0 + leaf.rotSpeed * t + leaf.rotWobbleA * Math.sin(leaf.rotWobbleW * t + leaf.rotWobbleP);
  const el = leaf.el;
  if (el) {
    el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotationRad}rad)`;
  }
  return { x, y };
}

function mountLeafEl(root: HTMLDivElement, leaf: AmbientLeafSim): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.style.cssText =
    'position:absolute;left:0;top:0;pointer-events:none';
  wrap.style.width = `${leaf.size}px`;
  wrap.style.height = `${leaf.size}px`;
  const img = document.createElement('img');
  img.src = leaf.sprite;
  img.alt = '';
  img.draggable = false;
  img.className = 'h-full w-full object-contain pointer-events-none';
  img.style.pointerEvents = 'none';
  img.addEventListener('error', () => {
    img.remove();
    const fallback = document.createElement('div');
    fallback.className = 'pointer-events-none h-full w-full rounded-sm opacity-80';
    fallback.style.background = 'linear-gradient(135deg, #4a7c23 0%, #6b8e23 100%)';
    fallback.style.boxShadow = '0 1px 2px rgba(0,0,0,0.25)';
    wrap.appendChild(fallback);
  });
  wrap.appendChild(img);
  root.appendChild(wrap);
  leaf.el = wrap;
  return wrap;
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
  /** Fade-in when re-enabled (e.g. after upgrade panel open/close). Default 450ms. */
  fadeInMs?: number;
}

/** Instant hide when disabled; ease back in when enabled again. */
const DEFAULT_FADE_IN_MS = 2000;

export const AmbientFallingLeaves: React.FC<AmbientFallingLeavesProps> = ({
  enabled,
  spriteUrl,
  zIndex,
  spawnIntervalMs,
  noiseStrength = 1,
  fadeInMs = DEFAULT_FADE_IN_MS,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 448, h: 796 });
  const leavesRef = useRef<AmbientLeafSim[]>([]);
  const nextIdRef = useRef(0);
  const nextSpawnAtRef = useRef(0);
  const rafRef = useRef(0);
  const spriteUrlRef = useRef(spriteUrl);
  spriteUrlRef.current = spriteUrl;
  const spawnIntervalMsRef = useRef(spawnIntervalMs);
  spawnIntervalMsRef.current = spawnIntervalMs;
  const noiseStrengthRef = useRef(noiseStrength);
  noiseStrengthRef.current = noiseStrength;
  const prewarmPendingRef = useRef(true);
  const [layerOpacity, setLayerOpacity] = useState(0);
  /** Bumps when Performance Mode toggles so the sim effect restarts. */
  const [perfEpoch, setPerfEpoch] = useState(0);

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

  useEffect(() => subscribePerformanceMode(() => setPerfEpoch((n) => n + 1)), []);

  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) {
      setLayerOpacity(0);
      for (const leaf of leavesRef.current) {
        leaf.el?.remove();
      }
      leavesRef.current = [];
      nextSpawnAtRef.current = 0;
      prewarmPendingRef.current = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      return;
    }

    // Performance mode: no ambient leaves at all (no spawn, no rAF).
    if (getPerformanceMode()) {
      setLayerOpacity(0);
      for (const leaf of leavesRef.current) {
        leaf.el?.remove();
      }
      leavesRef.current = [];
      return;
    }

    // Re-enable: start invisible, then fade in after paint.
    setLayerOpacity(0);
    let cancelled = false;
    const fadeRaf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setLayerOpacity(1);
      });
    });

    const clearLeaves = () => {
      for (const leaf of leavesRef.current) {
        leaf.el?.remove();
      }
      leavesRef.current = [];
    };

    const tick = (now: number) => {
      if (cancelled) return;

      // Perf mode toggled mid-run: stop entirely.
      if (getPerformanceMode()) {
        clearLeaves();
        rafRef.current = 0;
        return;
      }

      const { w, h } = sizeRef.current;
      const maxY = h + BOTTOM_CULL_MARGIN_PX;

      if (w > 8 && prewarmPendingRef.current) {
        prewarmPendingRef.current = false;
        prewarmAmbientLeaves(
          leavesRef.current,
          nextIdRef,
          w,
          h,
          now,
          spriteUrlRef.current,
          noiseStrengthRef.current
        );
        for (const leaf of leavesRef.current) {
          if (!leaf.el) mountLeafEl(root, leaf);
          applyLeafTransform(leaf, now);
        }
      }

      if (w > 8) {
        const interval = spawnIntervalMsRef.current;
        if (nextSpawnAtRef.current === 0) {
          nextSpawnAtRef.current = now + interval;
        }
        if (now >= nextSpawnAtRef.current) {
          const leaf = createLeaf(nextIdRef.current++, w, spriteUrlRef.current, noiseStrengthRef.current);
          leavesRef.current.push(leaf);
          mountLeafEl(root, leaf);
          applyLeafTransform(leaf, now);
          nextSpawnAtRef.current = now + interval;
        }
      }

      const next: AmbientLeafSim[] = [];
      for (const leaf of leavesRef.current) {
        const { y } = applyLeafTransform(leaf, now);
        if (y < maxY) {
          next.push(leaf);
        } else {
          leaf.el?.remove();
          leaf.el = null;
        }
      }
      leavesRef.current = next;

      // No leaves and next spawn is in the future: still need the loop for spawn cadence,
      // but scheduleNextFrame already caps cost in perf mode (which we exit above).
      rafRef.current = scheduleNextFrame(tick);
    };

    rafRef.current = scheduleNextFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(fadeRaf);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      clearLeaves();
    };
  }, [enabled, spriteUrl, spawnIntervalMs, noiseStrength, perfEpoch]);

  if (!enabled) return null;

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden"
      style={{
        zIndex,
        pointerEvents: 'none',
        opacity: layerOpacity,
        transition: layerOpacity > 0 ? `opacity ${fadeInMs}ms ease-out` : undefined,
      }}
      aria-hidden
    />
  );
};
