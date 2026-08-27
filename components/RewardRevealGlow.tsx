/**
 * Looping gold reveal VFX behind a claimed reward icon:
 * soft halo + rotating sunburst + sparkling stars (until dismiss).
 */
import React, { useMemo } from 'react';
import { assetPath } from '../utils/assetPath';
import { getPerformanceMode } from '../utils/performanceMode';

const GLOW_SRC = '/assets/vfx/reward_reveal_glow.png';
const SUNBURST_SRC = '/assets/vfx/reward_reveal_sunburst.png';
const SUNBURST_THICK_SRC = '/assets/vfx/reward_reveal_sunburst_thick.png';
const SPARKLE_SRC = '/assets/vfx/reward_reveal_sparkle.png';

/** Big sunburst size (340% → −25% → −50% → +25% → +15% → +25%). */
const SUNBURST_BIG_SIZE_PCT = 340 * 0.75 * 0.5 * 1.25 * 1.15 * 1.25;
/** Small sunburst (… −15%, +15%). */
const SUNBURST_SMALL_SIZE_PCT = 340 * 0.75 * 0.5 * 0.5 * 1.25 * 1.5 * 1.5 * 0.75 * 1.15 * 0.85 * 1.15;
const SUNBURST_BIG_OPACITY = 0.25 * 0.7 * 0.7 * 0.7 * 0.7;
const SUNBURST_SMALL_OPACITY = 0.45;

const SPARKLE_COUNT = 10;

interface SparkleSpec {
  angleDeg: number;
  radiusPct: number;
  sizePct: number;
  delayS: number;
  durationS: number;
  driftPct: number;
}

function buildSparkles(count: number): SparkleSpec[] {
  const out: SparkleSpec[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    out.push({
      angleDeg: t * 360 + (i % 3) * 11,
      // Tighter ring around the icon
      radiusPct: (28 + (i % 5) * 7 + (i % 2) * 3) * 0.85 * 1.25,
      sizePct: (20 + (i % 4) * 7) * 0.5,
      delayS: (i * 0.41) % 2.6,
      durationS: 1.7 + (i % 4) * 0.28,
      driftPct: 6 + (i % 3) * 2,
    });
  }
  return out;
}

interface RewardRevealGlowProps {
  /** Fade with parent reveal / dismiss. */
  opacity?: number;
  /** `behind` = sunbursts/glow; `sparkles` = stars only (draw above icon). */
  layer?: 'behind' | 'sparkles';
}

export function RewardRevealGlow({ opacity = 1, layer = 'behind' }: RewardRevealGlowProps) {
  const sparkles = useMemo(() => buildSparkles(SPARKLE_COUNT), []);

  // Cosmetic sunburst / sparkles only — skip in performance mode (claim UI still works).
  if (getPerformanceMode()) return null;

  if (layer === 'sparkles') {
    return (
      <div
        className="absolute inset-0 pointer-events-none overflow-visible"
        style={{ zIndex: 5, opacity }}
        aria-hidden
      >
        {sparkles.map((s, i) => {
          const rad = (s.angleDeg * Math.PI) / 180;
          const x = 50 + Math.cos(rad) * s.radiusPct;
          const y = 50 + Math.sin(rad) * s.radiusPct;
          const ox = Math.cos(rad) * s.driftPct;
          const oy = Math.sin(rad) * s.driftPct;
          return (
            <img
              key={`rr-sparkle-${i}`}
              src={assetPath(SPARKLE_SRC)}
              alt=""
              className="reward-reveal-sparkle absolute"
              style={
                {
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${s.sizePct}%`,
                  height: `${s.sizePct}%`,
                  maxWidth: 'none',
                  mixBlendMode: 'plus-lighter',
                  '--rr-ox': `${ox}%`,
                  '--rr-oy': `${oy}%`,
                  animationDuration: `${s.durationS}s`,
                  animationDelay: `${s.delayS}s`,
                } as React.CSSProperties
              }
              draggable={false}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: 0, opacity }}
      aria-hidden
    >
      <img
        src={assetPath(SUNBURST_SRC)}
        alt=""
        className="reward-reveal-sunburst-slow absolute left-1/2 top-1/2"
        style={{
          width: `${SUNBURST_BIG_SIZE_PCT}%`,
          height: `${SUNBURST_BIG_SIZE_PCT}%`,
          maxWidth: 'none',
          opacity: SUNBURST_BIG_OPACITY,
          mixBlendMode: 'screen',
          filter: 'brightness(1.35) saturate(0.72)',
          zIndex: 1,
        }}
        draggable={false}
      />
      <img
        src={assetPath(SUNBURST_THICK_SRC)}
        alt=""
        className="reward-reveal-sunburst absolute left-1/2 top-1/2"
        style={{
          width: `${SUNBURST_SMALL_SIZE_PCT}%`,
          height: `${SUNBURST_SMALL_SIZE_PCT}%`,
          maxWidth: 'none',
          opacity: SUNBURST_SMALL_OPACITY,
          mixBlendMode: 'screen',
          zIndex: 2,
        }}
        draggable={false}
      />
      <img
        src={assetPath(GLOW_SRC)}
        alt=""
        className="reward-reveal-glow absolute left-1/2 top-1/2"
        style={{
          width: '220%',
          height: '220%',
          maxWidth: 'none',
          mixBlendMode: 'screen',
          zIndex: 3,
        }}
        draggable={false}
      />
    </div>
  );
}
