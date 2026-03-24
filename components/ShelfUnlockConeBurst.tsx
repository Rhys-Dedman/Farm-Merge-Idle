/**
 * Upward cone leaf burst for shed shelf unlock (not radial).
 * Leaves launch within a 45° arc (±22.5° from vertical), slow from drag, then fall with gravity.
 */
import React, { useEffect, useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';

const LEAF_SPRITES = [assetPath('/assets/vfx/particle_leaf_1.png'), assetPath('/assets/vfx/particle_leaf_2.png')];

/** Full cone aperture in degrees */
const CONE_DEG = 45;
const CONE_HALF_RAD = (CONE_DEG / 2) * (Math.PI / 180);

const PARTICLE_COUNT = 13;
const GRAVITY_PX_PER_S = 320;
const FADE_IN_MS = 80;

interface Particle {
  id: number;
  sprite: string;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  spin: number;
  lifetimeMs: number;
  fadeStartMs: number;
}

interface ShelfUnlockConeBurstProps {
  x: number;
  y: number;
  startTime: number;
  onComplete: () => void;
  /** Scales particle sizes (default 1). */
  scale?: number;
  /** Number of cone particles (default 13). */
  particleCount?: number;
}

function createParticles(particleCount: number): Particle[] {
  return Array.from({ length: particleCount }, (_, i) => {
    const angle = (Math.random() - 0.5) * 2 * CONE_HALF_RAD;
    const speedMult = 0.35 + Math.random() * 1.3;
    const baseSpeed = (420 + Math.random() * 280) * 2;
    const speed = baseSpeed * speedMult;
    const lifetimeMs = (650 + Math.random() * 1600) * 0.75 * 0.75;
    const fadeStartRatio = 0.28 + Math.random() * 0.52;
    return {
      id: i,
      sprite: LEAF_SPRITES[i % LEAF_SPRITES.length],
      vx: Math.sin(angle) * speed,
      vy: -Math.cos(angle) * speed,
      size: 14 + Math.random() * 12,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 8,
      lifetimeMs,
      fadeStartMs: lifetimeMs * fadeStartRatio,
    };
  });
}

export const ShelfUnlockConeBurst: React.FC<ShelfUnlockConeBurstProps> = ({
  x,
  y,
  startTime,
  onComplete,
  scale = 1,
  particleCount = PARTICLE_COUNT,
}) => {
  const particlesRef = useRef<Particle[] | null>(null);
  if (particlesRef.current === null) {
    particlesRef.current = createParticles(particleCount);
  }

  const posRef = useRef<{ px: number; py: number; opacity: number; rotation: number }[]>(
    particlesRef.current.map((p) => ({ px: 0, py: 0, opacity: 1, rotation: p.rot }))
  );
  const [positions, setPositions] = useState(() => posRef.current.map((pr) => ({ ...pr })));
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [imgFailed, setImgFailed] = useState<Record<number, boolean>>({});
  const rafRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    completedRef.current = false;
    frameRef.current = 0;
    const fresh = createParticles(particleCount);
    particlesRef.current = fresh;
    const maxLife = fresh.reduce((m, p) => Math.max(m, p.lifetimeMs), 0) + 120;
    posRef.current = fresh.map((p) => ({ px: 0, py: 0, opacity: 1, rotation: p.rot }));
    setPositions(posRef.current.map((pr) => ({ ...pr })));

    const tick = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= maxLife) {
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current();
        }
        return;
      }

      const dt = 1 / 60;
      const strongDrag = elapsed < 220 ? 0.972 ** 4 : 0.988 ** 4;
      const particlesLive = particlesRef.current!;
      const prs = posRef.current;

      particlesLive.forEach((p, i) => {
        const pr = prs[i];
        p.vx *= strongDrag;
        p.vy *= strongDrag;
        p.vy += GRAVITY_PX_PER_S * dt;
        pr.px += p.vx * dt;
        pr.py += p.vy * dt;
        pr.rotation += p.spin * dt;

        let op = 1;
        if (elapsed < FADE_IN_MS) {
          op = elapsed / FADE_IN_MS;
        } else if (elapsed >= p.lifetimeMs) {
          op = 0;
        } else if (elapsed >= p.fadeStartMs) {
          const fadeDur = Math.max(40, p.lifetimeMs - p.fadeStartMs);
          const t = (elapsed - p.fadeStartMs) / fadeDur;
          op = Math.max(0, 1 - t);
        }
        pr.opacity = op;
      });

      frameRef.current += 1;
      if (frameRef.current % 2 === 0) {
        setPositions(prs.map((pr) => ({ ...pr })));
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [startTime, particleCount]);

  const prList = particlesRef.current!;

  return (
    <div
      className="pointer-events-none"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        width: 1,
        height: 1,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: 'center center',
        zIndex: 101,
      }}
    >
      {prList.map((p, i) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: positions[i]?.px ?? 0,
            top: positions[i]?.py ?? 0,
            width: p.size,
            height: p.size,
            transform: `translate(-50%, -50%) rotate(${positions[i]?.rotation ?? 0}rad)`,
            opacity: positions[i]?.opacity ?? 0,
          }}
        >
          {imgFailed[i] ? (
            <div
              className="w-full h-full rounded-sm"
              style={{
                background: 'linear-gradient(135deg, #4a7c23 0%, #6b8e23 100%)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
          ) : (
            <img
              src={p.sprite}
              alt=""
              className="w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }}
              onError={() => setImgFailed((prev) => ({ ...prev, [i]: true }))}
            />
          )}
        </div>
      ))}
    </div>
  );
};
