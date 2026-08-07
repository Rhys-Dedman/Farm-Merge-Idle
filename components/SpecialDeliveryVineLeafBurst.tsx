import React, { useLayoutEffect, useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import { getPerformanceMode } from '../utils/performanceMode';
import { scheduleNextFrame } from '../utils/raf60';

const SPECIAL_DELIVERY_LEAF_SPRITES = [
  assetPath('/assets/vfx/particle_leaf_specialdeliveries_1.png'),
  assetPath('/assets/vfx/particle_leaf_specialdeliveries_2.png'),
];

function preloadSpecialDeliveryLeafSprites(): void {
  for (const src of SPECIAL_DELIVERY_LEAF_SPRITES) {
    const img = new Image();
    img.src = src;
    if (typeof img.decode === 'function') {
      void img.decode().catch(() => {});
    }
  }
}

/** Warm the vine-burst sprites so the first lock tap does not hitch on PNG decode. */
export function preloadSpecialDeliveryVineLeafBurst(): void {
  preloadSpecialDeliveryLeafSprites();
}

preloadSpecialDeliveryLeafSprites();

/** Source dimensions of `specialdelivery_panel_locked.png`. */
const PANEL_SOURCE_WIDTH = 850;
const PANEL_SOURCE_HEIGHT = 1024;

/**
 * Two long, narrow spawn rectangles following the crossed vines.
 * Endpoints are measured in locked-panel source pixels.
 */
const VINE_LINES = [
  { x1: 92, y1: 304, x2: 778, y2: 902 },
  { x1: 758, y1: 304, x2: 72, y2: 902 },
] as const;

const LEAVES_PER_VINE = 70;
const EMITTER_WIDTH_SOURCE_PX = 72;
const MIN_LIFETIME_MS = 500;
const MAX_LIFETIME_MS = 3000;
const GRAVITY_PX_PER_SECOND = 150;
/** Strong launch drag; leaves quickly lose outward speed, then drift down. */
const DRAG_PER_60HZ_FRAME = 0.92;

interface Particle {
  id: number;
  sprite: string;
  spawnX: number;
  spawnY: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  lifetime: number;
  delay: number;
}

interface ParticleFrame {
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  scale: number;
}

interface SpecialDeliveryVineLeafBurstProps {
  id: string;
  onComplete?: () => void;
}

function createParticles(width: number, height: number): Particle[] {
  const scaleX = width / PANEL_SOURCE_WIDTH;
  const scaleY = height / PANEL_SOURCE_HEIGHT;
  const emitterHalfWidth = (EMITTER_WIDTH_SOURCE_PX * ((scaleX + scaleY) / 2)) / 2;
  let id = 0;

  return VINE_LINES.flatMap((line) => {
    const x1 = line.x1 * scaleX;
    const y1 = line.y1 * scaleY;
    const x2 = line.x2 * scaleX;
    const y2 = line.y2 * scaleY;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy) || 1;
    const normalX = -dy / length;
    const normalY = dx / length;

    return Array.from({ length: LEAVES_PER_VINE }, (_, leafIndex) => {
      const along = Math.random();
      const across = (Math.random() * 2 - 1) * emitterHalfWidth;
      const launchAngle = Math.random() * Math.PI * 2;
      const launchSpeed = 70 + Math.random() * 360;
      const lifetime =
        MIN_LIFETIME_MS + Math.random() * (MAX_LIFETIME_MS - MIN_LIFETIME_MS);

      return {
        id: id++,
        sprite: SPECIAL_DELIVERY_LEAF_SPRITES[leafIndex % SPECIAL_DELIVERY_LEAF_SPRITES.length]!,
        spawnX: x1 + dx * along + normalX * across,
        spawnY: y1 + dy * along + normalY * across,
        vx: Math.cos(launchAngle) * launchSpeed,
        vy: Math.sin(launchAngle) * launchSpeed,
        rotation: Math.random() * 360,
        // Exactly one full turn over this leaf's complete lifetime.
        rotationSpeed: (Math.random() < 0.5 ? -1 : 1) * (360 / (lifetime / 1000)),
        // Floating-button-size leaves through popup-burst-size leaves.
        size: 11 + Math.random() * 23,
        lifetime,
        delay: Math.random() * 90,
      };
    });
  });
}

/** Dense green-leaf burst emitted from two narrow rectangles matching the vine X. */
export const SpecialDeliveryVineLeafBurst: React.FC<
  SpecialDeliveryVineLeafBurstProps
> = ({ id, onComplete }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [frames, setFrames] = useState<ParticleFrame[]>([]);
  const physicsRef = useRef<
    Array<ParticleFrame & { vx: number; vy: number; started: boolean }>
  >([]);
  const rafRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useLayoutEffect(() => {
    if (getPerformanceMode()) {
      onCompleteRef.current?.();
      return;
    }
    const root = rootRef.current;
    if (!root) return;
    const nextParticles = createParticles(root.clientWidth, root.clientHeight);
    setParticles(nextParticles);
    const initial = nextParticles.map((particle) => ({
      x: particle.spawnX,
      y: particle.spawnY,
      vx: particle.vx,
      vy: particle.vy,
      rotation: particle.rotation,
      opacity: 1,
      scale: 1,
      started: false,
    }));
    physicsRef.current = initial;
    setFrames(initial);

    const start = performance.now();
    let previous = start;
    let renderedFrame = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const dt = Math.min(0.033, Math.max(0.001, (now - previous) / 1000));
      previous = now;
      let allFinished = true;

      physicsRef.current.forEach((frame, index) => {
        const particle = nextParticles[index];
        if (!particle) return;
        const age = elapsed - particle.delay;
        if (age < 0) {
          allFinished = false;
          frame.opacity = 0;
          return;
        }
        if (age >= particle.lifetime) {
          frame.opacity = 0;
          return;
        }

        allFinished = false;
        frame.started = true;
        const drag = Math.pow(DRAG_PER_60HZ_FRAME, dt * 60);
        frame.vx *= drag;
        frame.vy *= drag;
        frame.vy += GRAVITY_PX_PER_SECOND * dt;
        frame.x += frame.vx * dt;
        frame.y += frame.vy * dt;
        frame.rotation += particle.rotationSpeed * dt;

        const lifeProgress = age / particle.lifetime;
        const fadeProgress = Math.max(0, (lifeProgress - 0.65) / 0.35);
        frame.opacity = 1 - fadeProgress;
        frame.scale = 1 - lifeProgress * 0.22;
      });

      if (allFinished) {
        onCompleteRef.current?.();
        return;
      }

      // Keep physics smooth while limiting React DOM updates to roughly 30fps.
      renderedFrame += 1;
      if (renderedFrame % 2 === 0) {
        setFrames(
          physicsRef.current.map((frame) => ({
            x: frame.x,
            y: frame.y,
            rotation: frame.rotation,
            opacity: frame.opacity,
            scale: frame.scale,
          })),
        );
      }
      rafRef.current = scheduleNextFrame(tick);
    };

    rafRef.current = scheduleNextFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [id]);

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-visible pointer-events-none"
      style={{ zIndex: 5 }}
      aria-hidden
    >
      {particles.map((particle, index) => {
        const frame = frames[index];
        return (
          <img
            key={particle.id}
            src={particle.sprite}
            alt=""
            className="absolute object-contain"
            style={{
              left: frame?.x ?? particle.spawnX,
              top: frame?.y ?? particle.spawnY,
              width: particle.size,
              height: particle.size,
              opacity: frame?.opacity ?? 0,
              transform: `translate(-50%, -50%) rotate(${
                frame?.rotation ?? particle.rotation
              }deg) scale(${frame?.scale ?? 1})`,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              willChange: 'transform, opacity',
            }}
            draggable={false}
          />
        );
      })}
    </div>
  );
};
