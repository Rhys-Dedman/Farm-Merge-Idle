/**
 * Dev Tools popup — scrollable cheat / debug actions.
 */
import React, { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { assetPath } from '../utils/assetPath';
import { popupCardSurfaceStyle, usePopupPreflightEnter, type PopupAnimWithPreflight } from '../hooks/usePopupPreflightEnter';
import {
  POPUP_CLOSE_HIT_TARGET,
  POPUP_CREAM_HIT_TARGET,
  POPUP_LAYOUT_PASS_THROUGH,
} from '../constants/popupPointerEvents';

interface PauseMenuPopupProps {
  isVisible: boolean;
  onClose: () => void;
  /** Fired on tap when dismissing via X or backdrop (immediate), not when the close animation ends. */
  onUserDismiss?: () => void;
  onAnyButtonClick?: () => void;
  /** Rewarded Ad: same as gift – opens limited offer. */
  onRewardedAdClick?: () => void;
  /** Level Up: same as + next to player level – 1 goal XP per tap. */
  onLevelUpClick?: () => void;
  /** Dev/cheat: unlock next plant in background; pause stays open. Discovery shows on pause close (latest only). */
  onUnlockPlantClick?: () => void;
  /** Dev/cheat: complete current golden pot progress segment instantly. */
  onGoldenPotClick?: () => void;
  /** Dev: preview ad break intro + interstitial fake ad. */
  onTestAdBreakClick?: () => void;
  /** Dev/cheat: add coins (e.g. +100k). Does not close pause menu. */
  onAddMoney?: (amount: number) => void;
  /** Dev/cheat: set wallet to 0 on every garden. */
  onClearCoins?: () => void;
  /** Reset economy + progression to post–FTUE 11, level 1 (no tutorial replay). */
  onClearProgress?: () => void;
  /** Reset daily task seed progress and claims for the current day. */
  onResetTasksClick?: () => void;
  /** Dev: complete slot 1, then 2, then 3 (one per tap). */
  onCompleteTaskClick?: () => void;
  /** Lock every shed shelf again (no collection unlocks). */
  onClearShed?: () => void;
  /** When false, Unlock Plant button is disabled (all plants unlocked) */
  canUnlockPlant?: boolean;
  /** Dev: preview Dynamic Island + top safe-area inset on farm/store/collection. */
  fakeNotchPreviewEnabled?: boolean;
  onFakeNotchToggle?: () => void;
  /** Shown during FTUE settings — same end state as Clear Progress. */
  onSkipTutorial?: () => void;
  activeGardenLabel?: string;
  onCycleGardenClick?: () => void;
  onClearBoosts?: () => void;
  onResetProgress?: () => void;
  /** Dev: preview CorruptSavePopup UI without corrupting a save. */
  onPreviewCorruptSavePopup?: () => void;
  /** Dev: clear local Rate Us dismiss / rated flags so the prompt can show again. */
  onClearRating?: () => void;
  /** Hide Dev Tools entry in Settings and close this menu. */
  onDisableDevTools?: () => void;
  closeOnBackdropClick?: boolean;
  appScale?: number;
}

const POPUP_CLOSE_MS = 200;
const SETTINGS_BUTTON_HEIGHT_PX = 28;
/** Visible height for ~6 buttons + gaps — rest scroll. */
const DEV_TOOLS_SCROLL_MAX_HEIGHT_PX = 220;

const SETTINGS_PALETTES = {
  green: {
    bg: '#b8d458',
    border: '#8fb33a',
    text: '#4a6b1e',
    pressedBg: '#9fc044',
    textShadow: '0 1px 0 rgba(255,255,255,0.3)',
  },
  blue: {
    bg: '#89c8e1',
    border: '#66a4c6',
    text: '#4580a8',
    pressedBg: '#7ab8d1',
    textShadow: '0 1px 0 rgba(255,255,255,0.3)',
  },
  yellow: {
    bg: '#ffd856',
    border: '#f59d42',
    text: '#e6803a',
    pressedBg: '#f0c840',
    textShadow: '0 1px 0 rgba(255,255,255,0.3)',
  },
  red: {
    bg: '#a84848',
    border: '#6b2a2a',
    text: '#fce8e8',
    pressedBg: '#8b4040',
    textShadow: '0 1px 0 rgba(0,0,0,0.25)',
  },
} as const;

type Palette = (typeof SETTINGS_PALETTES)[keyof typeof SETTINGS_PALETTES];

function settingsCheatButtonStyle(p: Palette, pressed: boolean): CSSProperties {
  return {
    height: `${SETTINGS_BUTTON_HEIGHT_PX}px`,
    backgroundColor: pressed ? p.pressedBg : p.bg,
    border: `3px solid ${p.border}`,
    borderRadius: '12px',
    boxShadow: pressed
      ? 'inset 0 2px 4px rgba(0,0,0,0.15)'
      : `0 4px 0 ${p.border}, 0 6px 12px rgba(0,0,0,0.15)`,
    transform: pressed ? 'translateY(2px)' : 'translateY(0)',
    flexShrink: 0,
  };
}

function settingsCheatLabelStyle(p: Palette): CSSProperties {
  return {
    color: p.text,
    fontFamily: 'Inter, sans-serif',
    textShadow: p.textShadow,
    fontSize: '0.875rem',
  };
}

export const PauseMenuPopup: React.FC<PauseMenuPopupProps> = ({
  isVisible,
  onClose,
  onUserDismiss,
  onAnyButtonClick,
  onRewardedAdClick,
  onLevelUpClick,
  onUnlockPlantClick,
  onGoldenPotClick,
  onTestAdBreakClick,
  onAddMoney,
  onClearCoins,
  onClearProgress,
  onResetTasksClick,
  onCompleteTaskClick,
  onClearShed,
  canUnlockPlant = true,
  fakeNotchPreviewEnabled = false,
  onFakeNotchToggle,
  onSkipTutorial,
  activeGardenLabel,
  onCycleGardenClick,
  onClearBoosts,
  onResetProgress,
  onPreviewCorruptSavePopup,
  onClearRating,
  onDisableDevTools,
  closeOnBackdropClick = true,
  appScale = 1,
}) => {
  const [animState, setAnimState] = useState<PopupAnimWithPreflight>('hidden');
  const [rewardedPressed, setRewardedPressed] = useState(false);
  const [levelUpPressed, setLevelUpPressed] = useState(false);
  const [unlockPlantPressed, setUnlockPlantPressed] = useState(false);
  const [goldenPotPressed, setGoldenPotPressed] = useState(false);
  const [adBreakPressed, setAdBreakPressed] = useState(false);
  const [addCoinsPressed, setAddCoinsPressed] = useState(false);
  const [clearCoinsPressed, setClearCoinsPressed] = useState(false);
  const [clearProgressPressed, setClearProgressPressed] = useState(false);
  const [resetTasksPressed, setResetTasksPressed] = useState(false);
  const [completeTaskPressed, setCompleteTaskPressed] = useState(false);
  const [clearShedPressed, setClearShedPressed] = useState(false);
  const [fakeNotchPressed, setFakeNotchPressed] = useState(false);
  const [skipTutorialPressed, setSkipTutorialPressed] = useState(false);
  const [clearBoostsPressed, setClearBoostsPressed] = useState(false);
  const [resetPressed, setResetPressed] = useState(false);
  const [corruptSavePreviewPressed, setCorruptSavePreviewPressed] = useState(false);
  const [clearRatingPressed, setClearRatingPressed] = useState(false);
  const [disableDevToolsPressed, setDisableDevToolsPressed] = useState(false);
  const popupCardLayoutRef = useRef<HTMLDivElement>(null);

  const beginEnterAfterPreflight = useCallback(() => {
    setAnimState('entering');
    setTimeout(() => setAnimState('visible'), 250);
  }, []);

  usePopupPreflightEnter(animState, beginEnterAfterPreflight, popupCardLayoutRef);

  useEffect(() => {
    if (isVisible && animState === 'hidden') {
      setAnimState('preflight');
    } else if (!isVisible && (animState === 'visible' || animState === 'entering' || animState === 'preflight')) {
      setAnimState('leaving');
      setTimeout(() => {
        setAnimState('hidden');
        onClose();
      }, POPUP_CLOSE_MS);
    }
  }, [isVisible, animState, onClose]);

  const dismissToClose = () => {
    if (animState === 'leaving' || animState === 'hidden' || animState === 'preflight') return;
    onUserDismiss?.();
    setAnimState('leaving');
    setTimeout(() => {
      setAnimState('hidden');
      onClose();
    }, POPUP_CLOSE_MS);
  };

  const handleRewardedAdClick = () => {
    if (animState === 'leaving' || animState === 'preflight') return;
    if (!onRewardedAdClick) return;
    onAnyButtonClick?.();
    onRewardedAdClick();
    setAnimState('leaving');
    setTimeout(() => {
      setAnimState('hidden');
      onClose();
    }, POPUP_CLOSE_MS);
  };

  if (animState === 'hidden') return null;

  const isPreflight = animState === 'preflight';
  const isEntering = animState === 'entering';
  const isLeaving = animState === 'leaving';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 100, overflow: 'hidden', pointerEvents: isPreflight ? 'none' : 'auto' }}
    >
      <div
        className="absolute transition-opacity duration-200"
        style={{
          top: '-10px',
          left: '-10px',
          right: '-10px',
          bottom: '-10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          opacity: isLeaving || isPreflight ? 0 : 1,
        }}
        onClick={closeOnBackdropClick ? dismissToClose : undefined}
      />
      <div
        className="relative flex items-center justify-center"
        style={{
          transform: `scale(${appScale})`,
          transformOrigin: 'center center',
          ...POPUP_LAYOUT_PASS_THROUGH,
        }}
      >
        <div
          ref={popupCardLayoutRef}
          className="relative flex flex-col items-center"
          style={{
            width: '260px',
            zIndex: 102,
            ...POPUP_CREAM_HIT_TARGET,
            ...popupCardSurfaceStyle(
              animState,
              isEntering,
              isLeaving,
              'pausePopupEnter 250ms ease-out forwards',
              `pausePopupLeave ${POPUP_CLOSE_MS}ms ease-in forwards`
            ),
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
            .dev-tools-scroll {
              max-height: ${DEV_TOOLS_SCROLL_MAX_HEIGHT_PX}px;
              overflow-y: auto;
              overflow-x: hidden;
              -webkit-overflow-scrolling: touch;
              overscroll-behavior: contain;
              padding-right: 4px;
              scrollbar-width: thin;
              scrollbar-color: #c2b280 transparent;
            }
            .dev-tools-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .dev-tools-scroll::-webkit-scrollbar-thumb {
              background: #c2b280;
              border-radius: 4px;
            }
            .dev-tools-scroll::-webkit-scrollbar-track {
              background: transparent;
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
              padding: '36px 20px 20px',
            }}
          >
            <div className="flex flex-col items-center">
              <h2
                className="font-black tracking-tight text-center"
                style={{
                  color: '#5c4a32',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '2.25rem',
                }}
              >
                Dev Tools
              </h2>

              <div className="w-full flex items-center justify-center" style={{ marginTop: '8px', marginBottom: '12px' }}>
                <img
                  src={assetPath('/assets/ui/popup_divider.png')}
                  alt=""
                  className="h-auto object-contain"
                  style={{ width: '100%', maxWidth: '220px' }}
                />
              </div>

              <p
                className="font-medium text-center leading-relaxed italic w-full"
                style={{
                  color: '#c2b280',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.875rem',
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  marginBottom: '12px',
                }}
              >
                This is a debugger menu for Rhys only! Don&apos;t even think about using these cheats...
              </p>

              <div className="dev-tools-scroll w-full" style={{ maxWidth: '200px' }}>
                <div className="flex flex-col items-center gap-3 w-full">
                  {onDisableDevTools ? (
                    <button
                      type="button"
                      onMouseDown={() => setDisableDevToolsPressed(true)}
                      onMouseUp={() => setDisableDevToolsPressed(false)}
                      onMouseLeave={() => setDisableDevToolsPressed(false)}
                      onClick={() => {
                        onAnyButtonClick?.();
                        onDisableDevTools();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.red, disableDevToolsPressed)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.red)}>
                        Disable Dev Tools
                      </span>
                    </button>
                  ) : null}

                  {onSkipTutorial ? (
                    <button
                      type="button"
                      onMouseDown={() => setSkipTutorialPressed(true)}
                      onMouseUp={() => setSkipTutorialPressed(false)}
                      onMouseLeave={() => setSkipTutorialPressed(false)}
                      onClick={() => {
                        onAnyButtonClick?.();
                        onSkipTutorial();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.red, skipTutorialPressed)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.red)}>
                        Skip Tutorial
                      </span>
                    </button>
                  ) : null}

                  {onCycleGardenClick && activeGardenLabel ? (
                    <button
                      type="button"
                      onClick={() => {
                        onAnyButtonClick?.();
                        onCycleGardenClick();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.blue, false)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.blue)}>
                        {activeGardenLabel}
                      </span>
                    </button>
                  ) : null}

                  {onPreviewCorruptSavePopup ? (
                    <button
                      type="button"
                      onMouseDown={() => setCorruptSavePreviewPressed(true)}
                      onMouseUp={() => setCorruptSavePreviewPressed(false)}
                      onMouseLeave={() => setCorruptSavePreviewPressed(false)}
                      onClick={() => {
                        onAnyButtonClick?.();
                        onPreviewCorruptSavePopup();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.yellow, corruptSavePreviewPressed)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.yellow)}>
                        Corrupt Save Popup
                      </span>
                    </button>
                  ) : null}

                  {onClearRating ? (
                    <button
                      type="button"
                      onMouseDown={() => setClearRatingPressed(true)}
                      onMouseUp={() => setClearRatingPressed(false)}
                      onMouseLeave={() => setClearRatingPressed(false)}
                      onClick={() => {
                        onAnyButtonClick?.();
                        onClearRating();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.yellow, clearRatingPressed)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.yellow)}>
                        Clear Rating
                      </span>
                    </button>
                  ) : null}

                  {onRewardedAdClick ? (
                    <button
                      type="button"
                      onMouseDown={() => setRewardedPressed(true)}
                      onMouseUp={() => setRewardedPressed(false)}
                      onMouseLeave={() => setRewardedPressed(false)}
                      onClick={handleRewardedAdClick}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.yellow, rewardedPressed)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.yellow)}>
                        Rewarded Ad
                      </span>
                    </button>
                  ) : null}

                  {onAddMoney ? (
                    <button
                      type="button"
                      onMouseDown={() => setAddCoinsPressed(true)}
                      onMouseUp={() => setAddCoinsPressed(false)}
                      onMouseLeave={() => setAddCoinsPressed(false)}
                      onClick={() => {
                        onAnyButtonClick?.();
                        onAddMoney(1000000);
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.blue, addCoinsPressed)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.blue)}>
                        +1Mil Coins
                      </span>
                    </button>
                  ) : null}

                  {onClearCoins ? (
                    <button
                      type="button"
                      onMouseDown={() => setClearCoinsPressed(true)}
                      onMouseUp={() => setClearCoinsPressed(false)}
                      onMouseLeave={() => setClearCoinsPressed(false)}
                      onClick={() => {
                        onAnyButtonClick?.();
                        onClearCoins();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.red, clearCoinsPressed)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.red)}>
                        Clear Coins
                      </span>
                    </button>
                  ) : null}

                  {onUnlockPlantClick ? (
                    <button
                      type="button"
                      disabled={!canUnlockPlant}
                      onMouseDown={() => canUnlockPlant && setUnlockPlantPressed(true)}
                      onMouseUp={() => setUnlockPlantPressed(false)}
                      onMouseLeave={() => setUnlockPlantPressed(false)}
                      onClick={() => {
                        if (!canUnlockPlant || !onUnlockPlantClick) return;
                        onAnyButtonClick?.();
                        onUnlockPlantClick();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={{
                        ...settingsCheatButtonStyle(SETTINGS_PALETTES.blue, unlockPlantPressed && canUnlockPlant),
                        opacity: canUnlockPlant ? 1 : 0.45,
                        cursor: canUnlockPlant ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.blue)}>
                        Unlock plant
                      </span>
                    </button>
                  ) : null}

                  {onGoldenPotClick ? (
                    <button
                      type="button"
                      onMouseDown={() => setGoldenPotPressed(true)}
                      onMouseUp={() => setGoldenPotPressed(false)}
                      onMouseLeave={() => setGoldenPotPressed(false)}
                      onClick={() => {
                        onAnyButtonClick?.();
                        onGoldenPotClick();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.blue, goldenPotPressed)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.blue)}>
                        Golden Pot
                      </span>
                    </button>
                  ) : null}

                  {onTestAdBreakClick ? (
                    <button
                      type="button"
                      onMouseDown={() => setAdBreakPressed(true)}
                      onMouseUp={() => setAdBreakPressed(false)}
                      onMouseLeave={() => setAdBreakPressed(false)}
                      onClick={() => {
                        onAnyButtonClick?.();
                        onTestAdBreakClick();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.yellow, adBreakPressed)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.yellow)}>
                        Test Ad Break
                      </span>
                    </button>
                  ) : null}

                  {onFakeNotchToggle ? (
                    <button
                      type="button"
                      onMouseDown={() => setFakeNotchPressed(true)}
                      onMouseUp={() => setFakeNotchPressed(false)}
                      onMouseLeave={() => setFakeNotchPressed(false)}
                      onClick={() => {
                        onAnyButtonClick?.();
                        onFakeNotchToggle();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(
                        fakeNotchPreviewEnabled ? SETTINGS_PALETTES.green : SETTINGS_PALETTES.blue,
                        fakeNotchPressed,
                      )}
                    >
                      <span
                        className="font-bold tracking-tight"
                        style={settingsCheatLabelStyle(
                          fakeNotchPreviewEnabled ? SETTINGS_PALETTES.green : SETTINGS_PALETTES.blue,
                        )}
                      >
                        Fake notch: {fakeNotchPreviewEnabled ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  ) : null}

                  {onLevelUpClick ? (
                    <button
                      type="button"
                      onMouseDown={() => setLevelUpPressed(true)}
                      onMouseUp={() => setLevelUpPressed(false)}
                      onMouseLeave={() => setLevelUpPressed(false)}
                      onClick={() => {
                        onAnyButtonClick?.();
                        onLevelUpClick();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.blue, levelUpPressed)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.blue)}>
                        Level Up
                      </span>
                    </button>
                  ) : null}

                  {onClearShed ? (
                    <button
                      type="button"
                      onMouseDown={() => setClearShedPressed(true)}
                      onMouseUp={() => setClearShedPressed(false)}
                      onMouseLeave={() => setClearShedPressed(false)}
                      onClick={() => {
                        onAnyButtonClick?.();
                        onClearShed();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.red, clearShedPressed)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.red)}>
                        Clear Shed
                      </span>
                    </button>
                  ) : null}

                  {onCompleteTaskClick ? (
                    <button
                      type="button"
                      onMouseDown={() => setCompleteTaskPressed(true)}
                      onMouseUp={() => setCompleteTaskPressed(false)}
                      onMouseLeave={() => setCompleteTaskPressed(false)}
                      onClick={() => {
                        onAnyButtonClick?.();
                        onCompleteTaskClick();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.blue, completeTaskPressed)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.blue)}>
                        Complete task
                      </span>
                    </button>
                  ) : null}

                  {onResetTasksClick ? (
                    <button
                      type="button"
                      onMouseDown={() => setResetTasksPressed(true)}
                      onMouseUp={() => setResetTasksPressed(false)}
                      onMouseLeave={() => setResetTasksPressed(false)}
                      onClick={() => {
                        onAnyButtonClick?.();
                        onResetTasksClick();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.blue, resetTasksPressed)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.blue)}>
                        Reset tasks
                      </span>
                    </button>
                  ) : null}

                  {onClearBoosts ? (
                    <button
                      type="button"
                      onMouseDown={() => setClearBoostsPressed(true)}
                      onMouseUp={() => setClearBoostsPressed(false)}
                      onMouseLeave={() => setClearBoostsPressed(false)}
                      onClick={() => {
                        onAnyButtonClick?.();
                        onClearBoosts();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.red, clearBoostsPressed)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.red)}>
                        Clear Boosts
                      </span>
                    </button>
                  ) : null}

                  {onClearProgress ? (
                    <button
                      type="button"
                      onMouseDown={() => setClearProgressPressed(true)}
                      onMouseUp={() => setClearProgressPressed(false)}
                      onMouseLeave={() => setClearProgressPressed(false)}
                      onClick={() => {
                        onAnyButtonClick?.();
                        onClearProgress();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.red, clearProgressPressed)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.red)}>
                        Clear Progress
                      </span>
                    </button>
                  ) : null}

                  {onResetProgress ? (
                    <button
                      type="button"
                      onMouseDown={() => setResetPressed(true)}
                      onMouseUp={() => setResetPressed(false)}
                      onMouseLeave={() => setResetPressed(false)}
                      onClick={() => {
                        onAnyButtonClick?.();
                        onResetProgress();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={settingsCheatButtonStyle(SETTINGS_PALETTES.red, resetPressed)}
                    >
                      <span className="font-bold tracking-tight" style={settingsCheatLabelStyle(SETTINGS_PALETTES.red)}>
                        Reset Game
                      </span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissToClose}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#c2b280',
              zIndex: 105,
              ...POPUP_CLOSE_HIT_TARGET,
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
