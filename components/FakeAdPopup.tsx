/**
 * Fake Ad Popup - loading plate under real ads (rewarded or ad break).
 * Constrained to the game area (same size as game) so it matches splash/game layout.
 */
import React, { useState, useEffect } from 'react';
import { assetPath } from '../utils/assetPath';
import { playSfx, setAdAudioSuspended, SFX_IDS } from '../utils/sfx';
import {
  AD_BREAK_LOADING_PROGRESS_MS,
  AD_BREAK_LOADING_UI_FADE_MS,
  type FakeAdVariant,
} from '../constants/adPresentation';

const GAME_DESIGN_WIDTH = 448;
const GAME_DESIGN_HEIGHT = 796;

interface FakeAdPopupProps {
  isVisible: boolean;
  variant?: FakeAdVariant;
  onComplete: () => void;
  /** Called with the complete button rect (screen coords) when user clicks it; use to spawn particle. */
  onActivateRewardClick?: (buttonRect: DOMRect) => void;
  /** Scale factor so ad matches game area size (same as app scale) */
  appScale?: number;
  /** Logical game width in design px (448 on phones; wider on tablets). */
  gameDesignWidth?: number;
  /** Logical game height in design px (796 on tablets; taller on phones). */
  gameDesignHeight?: number;
}

const FAKE_AD_THEMES: Record<
  FakeAdVariant,
  {
    buttonBg: string;
    buttonBorder: string;
    buttonTextColor: string;
    buttonPressedBg: string;
    buttonText: string;
  }
> = {
  rewarded: {
    buttonBg: '#ffd856',
    buttonBorder: '#f59d42',
    buttonTextColor: '#e6803a',
    buttonPressedBg: '#f0c840',
    buttonText: 'Claim Reward',
  },
  adBreak: {
    buttonBg: '#b8d458',
    buttonBorder: '#8fb33a',
    buttonTextColor: '#4a6b1e',
    buttonPressedBg: '#9fc044',
    buttonText: 'Return To Game',
  },
};

const AD_LOADING_LOADER_STYLE_ID = 'ad-loading-progress-keyframes';
const AD_LOADING_LOADER_SIZE = 52;
const AD_LOADING_LOADER_STROKE = 7;
const AD_LOADING_LOADER_RADIUS = (AD_LOADING_LOADER_SIZE - AD_LOADING_LOADER_STROKE) / 2;
const AD_LOADING_LOADER_CIRCUMFERENCE = 2 * Math.PI * AD_LOADING_LOADER_RADIUS;

function ensureAdLoadingLoaderKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(AD_LOADING_LOADER_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = AD_LOADING_LOADER_STYLE_ID;
  style.textContent = `
    @keyframes adLoadingProgress {
      from { stroke-dashoffset: ${AD_LOADING_LOADER_CIRCUMFERENCE}; }
      to { stroke-dashoffset: 0; }
    }
  `;
  document.head.appendChild(style);
}

export const FakeAdPopup: React.FC<FakeAdPopupProps> = ({
  isVisible,
  variant = 'rewarded',
  onComplete,
  onActivateRewardClick,
  appScale = 1,
  gameDesignWidth = GAME_DESIGN_WIDTH,
  gameDesignHeight = GAME_DESIGN_HEIGHT,
}) => {
  const [buttonPressed, setButtonPressed] = useState(false);
  const [escapeReady, setEscapeReady] = useState(false);
  const theme = FAKE_AD_THEMES[variant];

  useEffect(() => {
    ensureAdLoadingLoaderKeyframes();
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setEscapeReady(false);
      setButtonPressed(false);
      return;
    }
    setEscapeReady(false);
    const t = window.setTimeout(() => setEscapeReady(true), AD_BREAK_LOADING_PROGRESS_MS);
    return () => window.clearTimeout(t);
  }, [isVisible, variant]);

  if (!isVisible) return null;

  const gameWidth = gameDesignWidth * appScale;
  const gameHeight = gameDesignHeight * appScale;
  const buttonWidth = 'min(288px, 80%)';
  const buttonHeight = 45;
  const showLoading = !escapeReady;

  const handleCompleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setButtonPressed(false);
    // Unmute before confirm so the tap SFX can play; App re-syncs mute for fade-out plates.
    setAdAudioSuspended(false);
    playSfx(SFX_IDS.uiConfirmNormal);
    const rect = e.currentTarget.getBoundingClientRect();
    onActivateRewardClick?.(rect);
    onComplete();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 117,
        backgroundColor: 'transparent',
        opacity: 1,
        visibility: 'visible',
        pointerEvents: 'auto',
      }}
    >
      <div
        className="relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.9)]"
        style={{
          width: gameWidth,
          height: gameHeight,
          background: 'radial-gradient(circle at center, #2a2a2a 0%, #000000 70%)',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src={assetPath('/assets/icons/generic_buttons/icon_watchad_large.png')}
            alt=""
            className="object-contain select-none"
            style={{
              width: 'min(160px, 32%)',
              height: 'min(160px, 32%)',
              maxWidth: '144px',
              maxHeight: '144px',
              filter: 'grayscale(1) brightness(0.42) drop-shadow(0 4px 12px rgba(0,0,0,0.45))',
            }}
          />
        </div>

        <div
          className="absolute inset-x-0 bottom-0"
          style={{ paddingBottom: '6rem', height: 160 }}
        >
          <div
            className="absolute inset-x-0 bottom-0 flex justify-center px-4"
            style={{
              paddingBottom: '6rem',
              opacity: showLoading ? 1 : 0,
              transition: `opacity ${AD_BREAK_LOADING_UI_FADE_MS}ms ease`,
              pointerEvents: 'none',
            }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{ width: '100%', height: buttonHeight }}
            >
              <svg
                width={AD_LOADING_LOADER_SIZE}
                height={AD_LOADING_LOADER_SIZE}
                viewBox={`0 0 ${AD_LOADING_LOADER_SIZE} ${AD_LOADING_LOADER_SIZE}`}
                className="absolute"
                style={{ bottom: `calc(100% + 14px)` }}
                aria-hidden
              >
                <circle
                  cx={AD_LOADING_LOADER_SIZE / 2}
                  cy={AD_LOADING_LOADER_SIZE / 2}
                  r={AD_LOADING_LOADER_RADIUS}
                  fill="none"
                  stroke="#6b6b6b"
                  strokeWidth={AD_LOADING_LOADER_STROKE}
                />
                <circle
                  cx={AD_LOADING_LOADER_SIZE / 2}
                  cy={AD_LOADING_LOADER_SIZE / 2}
                  r={AD_LOADING_LOADER_RADIUS}
                  fill="none"
                  stroke="#b0b0b0"
                  strokeWidth={AD_LOADING_LOADER_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={AD_LOADING_LOADER_CIRCUMFERENCE}
                  strokeDashoffset={AD_LOADING_LOADER_CIRCUMFERENCE}
                  transform={`rotate(-90 ${AD_LOADING_LOADER_SIZE / 2} ${AD_LOADING_LOADER_SIZE / 2})`}
                  style={{
                    animation: showLoading
                      ? `adLoadingProgress ${AD_BREAK_LOADING_PROGRESS_MS}ms linear forwards`
                      : 'none',
                  }}
                />
              </svg>
              <p
                className="font-semibold text-center px-4"
                style={{
                  color: '#c8c8c8',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 'clamp(14px, 4vw, 18px)',
                  lineHeight: 1,
                }}
              >
                Ad Loading...
              </p>
            </div>
          </div>

          <div
            className="absolute inset-x-0 bottom-0 flex justify-center px-4"
            style={{
              paddingBottom: '6rem',
              opacity: escapeReady ? 1 : 0,
              transition: `opacity ${AD_BREAK_LOADING_UI_FADE_MS}ms ease`,
              pointerEvents: escapeReady ? 'auto' : 'none',
            }}
          >
            <button
              onMouseDown={() => setButtonPressed(true)}
              onMouseUp={() => setButtonPressed(false)}
              onMouseLeave={() => setButtonPressed(false)}
              onClick={handleCompleteClick}
              className="relative flex items-center justify-center rounded-xl transition-all"
              style={{
                width: buttonWidth,
                height: buttonHeight,
                backgroundColor: buttonPressed ? theme.buttonPressedBg : theme.buttonBg,
                border: `3px solid ${theme.buttonBorder}`,
                borderRadius: '12px',
                boxShadow: buttonPressed
                  ? 'inset 0 3px 6px rgba(0,0,0,0.15)'
                  : `0 6px 0 ${theme.buttonBorder}, 0 10px 20px rgba(0,0,0,0.25)`,
                transform: buttonPressed ? 'translateY(3px)' : 'translateY(0)',
              }}
            >
              <span
                className="font-bold tracking-tight"
                style={{
                  color: theme.buttonTextColor,
                  fontFamily: 'Inter, sans-serif',
                  textShadow: '0 1px 0 rgba(255,255,255,0.3)',
                  fontSize: '1.2rem',
                }}
              >
                {theme.buttonText}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
