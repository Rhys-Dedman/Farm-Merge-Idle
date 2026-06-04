/**
 * Placeholder full-screen store review flow (same shell as FakeAdPopup).
 * TODO: navigate to real store review URL when available.
 */
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { assetPath } from '../utils/assetPath';
import { playSfx, SFX_IDS } from '../utils/sfx';
import { POPUP_PREFLIGHT_MIN_MS } from '../hooks/usePopupPreflightEnter';

const GAME_DESIGN_WIDTH = 448;
const GAME_DESIGN_HEIGHT = 796;
const STAR_COUNT = 5;
const STAR_ICON_GOLD = assetPath('/assets/icons/rateus/icon_star_gold.png');

const GRADIENT_TOP = '#d4ec7a';
const GRADIENT_BOTTOM = '#7cb342';
const BUTTON_BG = '#b8d458';
const BUTTON_BORDER = '#8fb33a';
const BUTTON_TEXT_COLOR = '#4a6b1e';
const BUTTON_PRESSED_BG = '#9fc044';

interface FakeReviewPopupProps {
  isVisible: boolean;
  onComplete: () => void;
  appScale?: number;
}

export const FakeReviewPopup: React.FC<FakeReviewPopupProps> = ({
  isVisible,
  onComplete,
  appScale = 1,
}) => {
  const [buttonPressed, setButtonPressed] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);

  useEffect(() => {
    if (!isVisible) setLayoutReady(false);
  }, [isVisible]);

  useLayoutEffect(() => {
    if (!isVisible) return;
    setLayoutReady(false);
    let cancelled = false;
    const t0 = Date.now();
    let r1 = 0;
    let r2 = 0;
    let to = 0;
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        if (cancelled) return;
        const rest = Math.max(0, POPUP_PREFLIGHT_MIN_MS - (Date.now() - t0));
        to = window.setTimeout(() => {
          if (!cancelled) setLayoutReady(true);
        }, rest);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
      clearTimeout(to);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const gameWidth = GAME_DESIGN_WIDTH * appScale;
  const gameHeight = GAME_DESIGN_HEIGHT * appScale;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 110,
        backgroundColor: '#050608',
        opacity: layoutReady ? 1 : 0,
        visibility: layoutReady ? 'visible' : 'hidden',
        pointerEvents: layoutReady ? 'auto' : 'none',
      }}
    >
      <div
        className="flex flex-col items-center justify-between overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.9)]"
        style={{
          width: gameWidth,
          height: gameHeight,
          background: `linear-gradient(to bottom, ${GRADIENT_TOP} 0%, ${GRADIENT_BOTTOM} 100%)`,
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0">
          <div
            className="flex flex-row items-center justify-center"
            style={{ gap: 'clamp(8px, 3vw, 20px)' }}
            aria-hidden
          >
            {Array.from({ length: STAR_COUNT }, (_, i) => (
              <img
                key={i}
                src={STAR_ICON_GOLD}
                alt=""
                className="object-contain select-none"
                style={{
                  width: 'clamp(48px, 14vw, 72px)',
                  height: 'clamp(48px, 14vw, 72px)',
                  filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))',
                }}
              />
            ))}
          </div>
          <p
            className="font-semibold text-center mt-8 px-6"
            style={{
              color: '#4a6b1e',
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(14px, 4vw, 20px)',
            }}
          >
            Thanks for rating Pocket Garden!
          </p>
        </div>

        <div className="w-full flex justify-center px-4 flex-shrink-0" style={{ paddingBottom: '6rem' }}>
          <button
            type="button"
            onMouseDown={() => setButtonPressed(true)}
            onMouseUp={() => setButtonPressed(false)}
            onMouseLeave={() => setButtonPressed(false)}
            onClick={() => {
              setButtonPressed(false);
              playSfx(SFX_IDS.uiConfirmNormal);
              onComplete();
            }}
            className="relative flex items-center justify-center rounded-xl transition-all"
            style={{
              width: 'min(360px, 100%)',
              height: '56px',
              backgroundColor: buttonPressed ? BUTTON_PRESSED_BG : BUTTON_BG,
              border: `4px solid ${BUTTON_BORDER}`,
              borderRadius: '24px',
              boxShadow: buttonPressed
                ? 'inset 0 4px 8px rgba(0,0,0,0.15)'
                : `0 8px 0 ${BUTTON_BORDER}, 0 12px 24px rgba(0,0,0,0.15)`,
              transform: buttonPressed ? 'translateY(4px)' : 'translateY(0)',
            }}
          >
            <span
              className="font-bold tracking-tight"
              style={{
                color: BUTTON_TEXT_COLOR,
                fontFamily: 'Inter, sans-serif',
                textShadow: '0 2px 0 rgba(255,255,255,0.3)',
                fontSize: '1.25rem',
              }}
            >
              Rate Now
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
