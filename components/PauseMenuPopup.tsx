/**
 * Settings (Pause) Popup - Debugger menu. Title/divider/description match discovery popup style.
 */
import React, { useState, useEffect } from 'react';
import { assetPath } from '../utils/assetPath';
import { getPerformanceMode, setPerformanceMode } from '../utils/performanceMode';

interface PauseMenuPopupProps {
  isVisible: boolean;
  onClose: () => void;
  /** Rewarded Ad: same as gift – opens limited offer. Closes pause menu when tapped. */
  onRewardedAdClick: () => void;
  /** Level Up: same as + next to player level – 1 goal XP per tap. Does not close pause menu. */
  onLevelUpClick: () => void;
  /** Dev/cheat: unlock next plant in background; pause stays open. Discovery shows on pause close (latest only). */
  onUnlockPlantClick?: () => void;
  /** Dev/cheat: add coins (e.g. +100k). Does not close pause menu. */
  onAddMoney?: (amount: number) => void;
  /** When false, Unlock Plant button is disabled (all plants unlocked) */
  canUnlockPlant?: boolean;
  closeOnBackdropClick?: boolean;
  appScale?: number;
}

const titleColor = '#c2b280';
const buttonBgColor = '#b8d458';
const buttonBorderColor = '#8fb33a';
const buttonTextColor = '#4a6b1e';
const buttonPressedBg = '#9fc044';

export const PauseMenuPopup: React.FC<PauseMenuPopupProps> = ({
  isVisible,
  onClose,
  onRewardedAdClick,
  onLevelUpClick,
  onUnlockPlantClick,
  onAddMoney,
  canUnlockPlant = true,
  closeOnBackdropClick = true,
  appScale = 1,
}) => {
  const [animState, setAnimState] = useState<'hidden' | 'entering' | 'visible' | 'leaving'>('hidden');
  const [rewardedPressed, setRewardedPressed] = useState(false);
  const [levelUpPressed, setLevelUpPressed] = useState(false);
  const [unlockPlantPressed, setUnlockPlantPressed] = useState(false);
  const [addCoinsPressed, setAddCoinsPressed] = useState(false);
  const [performanceMode, setPerformanceModeLocal] = useState(false);

  useEffect(() => {
    if (isVisible) setPerformanceModeLocal(getPerformanceMode());
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && animState === 'hidden') {
      setAnimState('entering');
      setTimeout(() => setAnimState('visible'), 250);
    } else if (!isVisible && (animState === 'visible' || animState === 'entering')) {
      setAnimState('leaving');
      setTimeout(() => {
        setAnimState('hidden');
        onClose();
      }, 150);
    }
  }, [isVisible, animState, onClose]);

  const handleRewardedAdClick = () => {
    onRewardedAdClick();
    setAnimState('leaving');
    setTimeout(() => {
      setAnimState('hidden');
      onClose();
    }, 150);
  };

  if (animState === 'hidden') return null;

  const isEntering = animState === 'entering';
  const isLeaving = animState === 'leaving';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-auto"
      style={{ zIndex: 100, overflow: 'hidden' }}
    >
      <div
        className="absolute transition-opacity duration-300"
        style={{
          top: '-10px',
          left: '-10px',
          right: '-10px',
          bottom: '-10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          opacity: isLeaving ? 0 : 1,
        }}
        onClick={closeOnBackdropClick ? onClose : undefined}
      />
      <div
        className="relative flex items-center justify-center"
        style={{
          transform: `scale(${appScale})`,
          transformOrigin: 'center center',
        }}
      >
        <div
          className="relative flex flex-col items-center"
          style={{
            width: '260px',
            zIndex: 102,
            animation: isEntering
              ? 'pausePopupEnter 250ms ease-out forwards'
              : isLeaving
                ? 'pausePopupLeave 150ms ease-in forwards'
                : 'none',
            transform: animState === 'visible' ? 'scale(1)' : undefined,
            opacity: animState === 'visible' ? 1 : undefined,
          }}
        >
          <style>{`
            @keyframes pausePopupEnter {
              0% { transform: scale(0.9); opacity: 0; }
              70% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes pausePopupLeave {
              0% { transform: scale(1); opacity: 1; }
              100% { transform: scale(0.9); opacity: 0; }
            }
          `}</style>
          <div
            style={{
              position: 'relative',
              width: '260px',
              borderRadius: '24px',
              backgroundColor: '#fcf0c6',
              boxShadow: '0 1px 14px rgba(0,0,0,0.96), inset 0 0 0 1.5px #e9dcaf',
              border: '2px solid rgba(180, 165, 130, 0.4)',
              padding: '36px 20px 32px',
            }}
          >
            <div className="flex flex-col items-center">
              {/* Title - same styling as Discovery "Wild Fern" subtitle: dark brown, extra bold */}
              <h2
                className="font-black tracking-tight text-center"
                style={{
                  color: '#5c4a32',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '2.25rem',
                }}
              >
                Settings
              </h2>

              {/* Green divider - same as discovery popup */}
              <div className="w-full flex items-center justify-center" style={{ marginTop: '8px', marginBottom: '12px' }}>
                <img
                  src={assetPath('/assets/popups/popup_divider.png')}
                  alt=""
                  className="h-auto object-contain"
                  style={{ width: '100%', maxWidth: '220px' }}
                />
              </div>

              {/* Description - same size/color/italics as discovery popup description */}
              <p
                className="font-medium text-center leading-relaxed italic w-full"
                style={{
                  color: '#c2b280',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.875rem',
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  marginBottom: '16px',
                }}
              >
                This is a debugger menu for Rhys only! Don&apos;t even think about using these cheats...
              </p>

              <div className="flex flex-col items-center gap-3 w-full" style={{ maxWidth: '200px' }}>
                {/* Performance Mode - green button, OFF by default, tap toggles ON */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !performanceMode;
                    setPerformanceModeLocal(next);
                    setPerformanceMode(next);
                  }}
                  className="relative flex items-center justify-center rounded-lg transition-all w-full"
                  style={{
                    height: '40px',
                    backgroundColor: buttonBgColor,
                    border: `3px solid ${buttonBorderColor}`,
                    borderRadius: '16px',
                    boxShadow: `0 6px 0 ${buttonBorderColor}, 0 8px 16px rgba(0,0,0,0.15)`,
                  }}
                >
                  <span
                    className="font-bold tracking-tight"
                    style={{
                      color: buttonTextColor,
                      fontFamily: 'Inter, sans-serif',
                      textShadow: '0 1px 0 rgba(255,255,255,0.3)',
                      fontSize: '0.875rem',
                    }}
                  >
                    Performance Mode {performanceMode ? 'ON' : 'OFF'}
                  </span>
                </button>
                <button
                  type="button"
                  onMouseDown={() => setRewardedPressed(true)}
                  onMouseUp={() => setRewardedPressed(false)}
                  onMouseLeave={() => setRewardedPressed(false)}
                  onClick={handleRewardedAdClick}
                  className="relative flex items-center justify-center rounded-lg transition-all w-full"
                  style={{
                    height: '40px',
                    backgroundColor: rewardedPressed ? buttonPressedBg : buttonBgColor,
                    border: `3px solid ${buttonBorderColor}`,
                    borderRadius: '16px',
                    boxShadow: rewardedPressed
                      ? 'inset 0 3px 6px rgba(0,0,0,0.15)'
                      : `0 6px 0 ${buttonBorderColor}, 0 8px 16px rgba(0,0,0,0.15)`,
                    transform: rewardedPressed ? 'translateY(3px)' : 'translateY(0)',
                  }}
                >
                  <span
                    className="font-bold tracking-tight"
                    style={{
                      color: buttonTextColor,
                      fontFamily: 'Inter, sans-serif',
                      textShadow: '0 1px 0 rgba(255,255,255,0.3)',
                      fontSize: '0.875rem',
                    }}
                  >
                    Rewarded Ad
                  </span>
                </button>
                <button
                  type="button"
                  onMouseDown={() => setLevelUpPressed(true)}
                  onMouseUp={() => setLevelUpPressed(false)}
                  onMouseLeave={() => setLevelUpPressed(false)}
                  onClick={onLevelUpClick}
                  className="relative flex items-center justify-center rounded-lg transition-all w-full"
                  style={{
                    height: '40px',
                    backgroundColor: levelUpPressed ? buttonPressedBg : buttonBgColor,
                    border: `3px solid ${buttonBorderColor}`,
                    borderRadius: '16px',
                    boxShadow: levelUpPressed
                      ? 'inset 0 3px 6px rgba(0,0,0,0.15)'
                      : `0 6px 0 ${buttonBorderColor}, 0 8px 16px rgba(0,0,0,0.15)`,
                    transform: levelUpPressed ? 'translateY(3px)' : 'translateY(0)',
                  }}
                >
                  <span
                    className="font-bold tracking-tight"
                    style={{
                      color: buttonTextColor,
                      fontFamily: 'Inter, sans-serif',
                      textShadow: '0 1px 0 rgba(255,255,255,0.3)',
                      fontSize: '0.875rem',
                    }}
                  >
                    Level Up
                  </span>
                </button>
                {onUnlockPlantClick ? (
                  <button
                    type="button"
                    disabled={!canUnlockPlant}
                    onMouseDown={() => canUnlockPlant && setUnlockPlantPressed(true)}
                    onMouseUp={() => setUnlockPlantPressed(false)}
                    onMouseLeave={() => setUnlockPlantPressed(false)}
                    onClick={() => {
                      if (!canUnlockPlant || !onUnlockPlantClick) return;
                      onUnlockPlantClick();
                    }}
                    className="relative flex items-center justify-center rounded-lg transition-all w-full"
                    style={{
                      height: '40px',
                      opacity: canUnlockPlant ? 1 : 0.45,
                      cursor: canUnlockPlant ? 'pointer' : 'not-allowed',
                      backgroundColor: unlockPlantPressed && canUnlockPlant ? buttonPressedBg : buttonBgColor,
                      border: `3px solid ${buttonBorderColor}`,
                      borderRadius: '16px',
                      boxShadow:
                        unlockPlantPressed && canUnlockPlant
                          ? 'inset 0 3px 6px rgba(0,0,0,0.15)'
                          : `0 6px 0 ${buttonBorderColor}, 0 8px 16px rgba(0,0,0,0.15)`,
                      transform: unlockPlantPressed && canUnlockPlant ? 'translateY(3px)' : 'translateY(0)',
                    }}
                  >
                    <span
                      className="font-bold tracking-tight"
                      style={{
                        color: buttonTextColor,
                        fontFamily: 'Inter, sans-serif',
                        textShadow: '0 1px 0 rgba(255,255,255,0.3)',
                        fontSize: '0.875rem',
                      }}
                    >
                      Unlock plant
                    </span>
                  </button>
                ) : null}
                {onAddMoney ? (
                  <button
                    type="button"
                    onMouseDown={() => setAddCoinsPressed(true)}
                    onMouseUp={() => setAddCoinsPressed(false)}
                    onMouseLeave={() => setAddCoinsPressed(false)}
                    onClick={() => onAddMoney(100000)}
                    className="relative flex items-center justify-center rounded-lg transition-all w-full"
                    style={{
                      height: '40px',
                      backgroundColor: addCoinsPressed ? buttonPressedBg : buttonBgColor,
                      border: `3px solid ${buttonBorderColor}`,
                      borderRadius: '16px',
                      boxShadow: addCoinsPressed
                        ? 'inset 0 3px 6px rgba(0,0,0,0.15)'
                        : `0 6px 0 ${buttonBorderColor}, 0 8px 16px rgba(0,0,0,0.15)`,
                      transform: addCoinsPressed ? 'translateY(3px)' : 'translateY(0)',
                    }}
                  >
                    <span
                      className="font-bold tracking-tight"
                      style={{
                        color: buttonTextColor,
                        fontFamily: 'Inter, sans-serif',
                        textShadow: '0 1px 0 rgba(255,255,255,0.3)',
                        fontSize: '0.875rem',
                      }}
                    >
                      +100k Coins
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#c2b280',
              zIndex: 105,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M2 2L12 12M12 2L2 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
