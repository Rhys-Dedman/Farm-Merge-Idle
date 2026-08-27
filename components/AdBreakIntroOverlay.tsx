import React, { useEffect, useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import {
  AD_BREAK_ICON_LEAF_BURST_COUNT,
  AD_BREAK_ICON_LEAF_BURST_RADIUS_MULTIPLIER,
  AD_BREAK_ICON_LEAF_PARTICLE_SIZE_SCALE_TABLET,
  AD_BREAK_ICON_PHONE_BREAKPOINT_PX,
  AD_BREAK_INTRO_BACKDROP_FADE_MS,
  AD_BREAK_INTRO_BLACK_FADE_MS,
  AD_BREAK_INTRO_ICON_BOUNCE_MS,
  AD_BREAK_INTRO_TOTAL_MS,
  AD_BREAK_OUTRO_FADE_MS,
  getAdBreakIconSizePx,
  POPUP_BACKDROP_RGBA,
} from '../constants/adPresentation';
import { LeafBurst, LEAF_BURST_CIRCLE_RADIUS_PX } from './LeafBurst';
import { getPerformanceMode } from '../utils/performanceMode';

interface AdBreakIntroOverlayProps {
  active: boolean;
  /** When true, fade the held black overlay out (after the fake ad closes). */
  fadeOut?: boolean;
  onIntroComplete: () => void;
  onFadeOutComplete: () => void;
}

type IntroPhase = 'idle' | 'icon' | 'black-fade' | 'black-hold' | 'outro';

interface AdBreakLeafBurst {
  startTime: number;
  burstScale: number;
}

const STYLE_ID = 'ad-break-intro-keyframes';

function readViewportWidth(): number {
  if (typeof window === 'undefined') return 448;
  return window.visualViewport?.width ?? window.innerWidth;
}

function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes adBreakBackdropFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes adBreakIconIntro {
      0% { transform: scale(0.75); opacity: 0; }
      20% { opacity: 1; }
      35% { transform: scale(1.2); opacity: 1; }
      60% { transform: scale(0.9); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes adBreakFinalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes adBreakFinalFadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Ad break intro: dim backdrop, icon bounce, black fades in above icon, then fake ad on black.
 */
export const AdBreakIntroOverlay: React.FC<AdBreakIntroOverlayProps> = ({
  active,
  fadeOut = false,
  onIntroComplete,
  onFadeOutComplete,
}) => {
  const [phase, setPhase] = useState<IntroPhase>('idle');
  const [leafBurst, setLeafBurst] = useState<AdBreakLeafBurst | null>(null);
  const [iconSizePx, setIconSizePx] = useState(() => getAdBreakIconSizePx(readViewportWidth()));
  const [isTabletViewport, setIsTabletViewport] = useState(
    () => readViewportWidth() >= AD_BREAK_ICON_PHONE_BREAKPOINT_PX,
  );
  const iconRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    ensureKeyframes();
  }, []);

  useEffect(() => {
    const sync = () => {
      const w = readViewportWidth();
      setIconSizePx(getAdBreakIconSizePx(w));
      setIsTabletViewport(w >= AD_BREAK_ICON_PHONE_BREAKPOINT_PX);
    };
    sync();
    window.addEventListener('resize', sync);
    const vv = window.visualViewport;
    if (vv) vv.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('resize', sync);
      if (vv) vv.removeEventListener('resize', sync);
    };
  }, []);

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      setLeafBurst(null);
      return;
    }

    setPhase('icon');
    const blackFadeTimer = window.setTimeout(() => setPhase('black-fade'), AD_BREAK_INTRO_ICON_BOUNCE_MS);
    const introDoneTimer = window.setTimeout(() => {
      setPhase('black-hold');
      onIntroComplete();
    }, AD_BREAK_INTRO_TOTAL_MS);

    return () => {
      window.clearTimeout(blackFadeTimer);
      window.clearTimeout(introDoneTimer);
    };
  }, [active, onIntroComplete]);

  useEffect(() => {
    if (phase !== 'icon') return;
    // LeafBurst already no-ops under perf mode; skip mounting state too.
    if (getPerformanceMode()) return;

    let cancelled = false;
    let r1 = 0;
    let r2 = 0;
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        if (cancelled) return;
        const icon = iconRef.current;
        if (!icon) return;
        const rect = icon.getBoundingClientRect();
        const iconRadius = Math.min(rect.width, rect.height) / 2;
        setLeafBurst({
          startTime: Date.now(),
          burstScale:
            (iconRadius / LEAF_BURST_CIRCLE_RADIUS_PX) * AD_BREAK_ICON_LEAF_BURST_RADIUS_MULTIPLIER,
        });
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [phase, iconSizePx]);

  useEffect(() => {
    if (!fadeOut || phase !== 'black-hold') return;
    setPhase('outro');
  }, [fadeOut, phase]);

  useEffect(() => {
    if (phase !== 'outro') return;
    const t = window.setTimeout(onFadeOutComplete, AD_BREAK_OUTRO_FADE_MS);
    return () => window.clearTimeout(t);
  }, [phase, onFadeOutComplete]);

  if (!active || phase === 'idle') return null;

  const showDimBackdrop = phase === 'icon' || phase === 'black-fade';
  const showIcon = phase === 'icon' || phase === 'black-fade';
  const blackVisible = phase === 'black-fade' || phase === 'black-hold' || phase === 'outro';

  return (
    <div
      className="fixed inset-0"
      style={{
        zIndex: 115,
        pointerEvents: phase === 'icon' || phase === 'black-fade' ? 'auto' : 'none',
      }}
    >
      {showDimBackdrop ? (
        <div
          className="absolute inset-0"
          style={{
            zIndex: 0,
            backgroundColor: POPUP_BACKDROP_RGBA,
            opacity: phase === 'black-fade' ? 1 : 0,
            animation:
              phase === 'icon'
                ? `adBreakBackdropFadeIn ${AD_BREAK_INTRO_BACKDROP_FADE_MS}ms ease forwards`
                : undefined,
          }}
          aria-hidden
        />
      ) : null}

      {showIcon ? (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
          {leafBurst ? (
            <div
              className="pointer-events-none absolute"
              style={{ left: '50%', top: '50%', zIndex: 0 }}
            >
              <LeafBurst
                x={0}
                y={0}
                startTime={leafBurst.startTime}
                particleCount={AD_BREAK_ICON_LEAF_BURST_COUNT}
                useCircle
                spawnOffsetUpPx={0}
                burstScale={leafBurst.burstScale}
                particleSizeScale={
                  isTabletViewport ? AD_BREAK_ICON_LEAF_PARTICLE_SIZE_SCALE_TABLET : 1
                }
                anchorPosition="absolute"
                zIndex={0}
                onComplete={() => setLeafBurst(null)}
              />
            </div>
          ) : null}
          <img
            ref={iconRef}
            src={assetPath('/assets/ui/generic/ui_adbreak.png')}
            alt=""
            className="relative object-contain select-none"
            style={{
              zIndex: 1,
              width: iconSizePx,
              height: iconSizePx,
              maxWidth: iconSizePx,
              maxHeight: iconSizePx,
              filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.35))',
              opacity: phase === 'black-fade' ? 1 : 0,
              transform: phase === 'black-fade' ? 'scale(1)' : 'scale(0.75)',
              animation:
                phase === 'icon'
                  ? `adBreakIconIntro ${AD_BREAK_INTRO_ICON_BOUNCE_MS}ms ease forwards`
                  : undefined,
            }}
          />
        </div>
      ) : null}

      {blackVisible ? (
        <div
          className="absolute inset-0"
          style={{
            zIndex: 2,
            backgroundColor: '#000',
            opacity: phase === 'black-hold' || phase === 'outro' ? 1 : 0,
            animation:
              phase === 'black-fade'
                ? `adBreakFinalFadeIn ${AD_BREAK_INTRO_BLACK_FADE_MS}ms ease forwards`
                : phase === 'outro'
                  ? `adBreakFinalFadeOut ${AD_BREAK_OUTRO_FADE_MS}ms ease forwards`
                  : undefined,
          }}
          aria-hidden
        />
      ) : null}
    </div>
  );
};
