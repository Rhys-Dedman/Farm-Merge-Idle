/**
 * Settings — discovery-style popup (header icon, title, divider, toggle rows + action buttons).
 */
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { assetPath } from '../utils/assetPath';
import { popupCardSurfaceStyle, usePopupPreflightEnter, type PopupAnimWithPreflight, POPUP_ENTER_MS, popupEnterInteractionPointerEvents, isPopupEnterInteractionLocked } from '../hooks/usePopupPreflightEnter';
import {
  POPUP_CLOSE_HIT_TARGET,
  POPUP_CLOSE_TOP_PX,
  POPUP_CREAM_DROP_SHADOW_FILTER,
  POPUP_CREAM_HIT_TARGET,
  POPUP_CREAM_STACK_MARGIN_TOP_PX,
  POPUP_HEADER_PASS_THROUGH,
  POPUP_HEADER_TOP_PX,
  POPUP_LAYOUT_PASS_THROUGH,
  popupAppScaleStyle,
  popupOverlayStyle,
} from '../constants/popupPointerEvents';
import { PopupVectorBackground } from './PopupVectorBackground';
import { PopupPrescaleFrame } from './PopupPrescaleFrame';
import { getPerformanceMode, setPerformanceMode } from '../utils/performanceMode';
import { APP_VERSION } from '../constants/appVersion';
import { openSupportContact } from '../constants/supportContact';
import { readRateUsPermanentlyDismissed } from '../utils/rateUsDismiss';

interface SettingsPopupProps {
  isVisible: boolean;
  onClose: () => void;
  /** Fired on tap when dismissing via X or backdrop (immediate), not when the close animation ends. */
  onUserDismiss?: () => void;
  onOpenDevTools: () => void;
  /** When true, Dev Tools pill is visible (unlocked via version taps). Default false. */
  showDevToolsButton?: boolean;
  /** Fired when version label is tapped 7× — unlock Dev Tools for this session. */
  onUnlockDevTools?: () => void;
  onAnyButtonClick?: () => void;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  onMusicEnabledChange: (enabled: boolean) => void;
  onSfxEnabledChange: (enabled: boolean) => void;
  /** Local “come back” notifications (default ON). */
  notificationsEnabled: boolean;
  onNotificationsEnabledChange: (enabled: boolean) => void;
  /** Opens Rate Us flow (caller should no-op if already rated — Settings handles toast). */
  onRateUs: () => void;
  /** Full hard reset (clear all saves + reload). Confirmed in-UI before calling. */
  onResetGame: () => void;
  closeOnBackdropClick?: boolean;
  appScale?: number;
}

const POPUP_CLOSE_MS = 200;
const HEADER_ICON = assetPath('/assets/icons/upgrades/icon_happycustomer.png');
const HEADER_ICON_PX = 80;
const ALREADY_RATED_TOAST_MS = 1150;
/** Secret unlock: tap version this many times (within the window). */
const DEV_TOOLS_VERSION_TAP_COUNT = 7;
const DEV_TOOLS_VERSION_TAP_WINDOW_MS = 2500;

const TITLE_COLOR = '#5c4a32';
const DESCRIPTION_COLOR = '#c2b280';

const TOGGLE_ROW = {
  bg: '#fcf0c7',
  /** Inner stroke (light) */
  outlineInner: '#fff6dc',
  /** Outer stroke (dark) */
  outlineOuter: '#dbc899',
  label: '#5c4a32',
} as const;

const PILL_ON = {
  bg: '#b8d458',
  border: '#8fb33a',
  text: '#4a6b1e',
  pressedBg: '#9fc044',
} as const;

/** Disabled toggle uses the same tan palette as Rate Us / Contact Us. */
const PILL_OFF = {
  bg: '#d4b896',
  border: '#a07850',
  text: '#5c4a32',
  pressedBg: '#c4a686',
} as const;

const ACTION_TAN = {
  bg: '#d4b896',
  border: '#a07850',
  text: '#5c4a32',
  pressedBg: '#c4a686',
} as const;

const ACTION_RED = {
  bg: '#a84848',
  border: '#6b2a2a',
  text: '#fce8e8',
  pressedBg: '#8b4040',
} as const;

const RESET_WARNING =
  'This will clear your save and start a new game. This cannot be undone.';

export const SettingsPopup: React.FC<SettingsPopupProps> = ({
  isVisible,
  onClose,
  onUserDismiss,
  onOpenDevTools,
  showDevToolsButton = false,
  onUnlockDevTools,
  onAnyButtonClick,
  musicEnabled,
  sfxEnabled,
  onMusicEnabledChange,
  onSfxEnabledChange,
  notificationsEnabled,
  onNotificationsEnabledChange,
  onRateUs,
  onResetGame,
  closeOnBackdropClick = true,
  appScale = 1,
}) => {
  const [animState, setAnimState] = useState<PopupAnimWithPreflight>('hidden');
  const [performanceMode, setPerformanceModeLocal] = useState(false);
  const [hasRatedUs, setHasRatedUs] = useState(() => readRateUsPermanentlyDismissed());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [alreadyRatedToastId, setAlreadyRatedToastId] = useState(0);
  const [rateUsPressed, setRateUsPressed] = useState(false);
  const [contactUsPressed, setContactUsPressed] = useState(false);
  const [resetPressed, setResetPressed] = useState(false);
  const [clearProgressPressed, setClearProgressPressed] = useState(false);
  const [noResetPressed, setNoResetPressed] = useState(false);
  const [devToolsPressed, setDevToolsPressed] = useState(false);
  const popupCardLayoutRef = useRef<HTMLDivElement>(null);
  const alreadyRatedToastTimeoutRef = useRef<number | null>(null);
  const versionTapCountRef = useRef(0);
  const versionTapWindowTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isVisible) {
      setPerformanceModeLocal(getPerformanceMode());
      setHasRatedUs(readRateUsPermanentlyDismissed());
      setShowResetConfirm(false);
      versionTapCountRef.current = 0;
    } else {
      setShowResetConfirm(false);
      setAlreadyRatedToastId(0);
      versionTapCountRef.current = 0;
      if (alreadyRatedToastTimeoutRef.current != null) {
        window.clearTimeout(alreadyRatedToastTimeoutRef.current);
        alreadyRatedToastTimeoutRef.current = null;
      }
      if (versionTapWindowTimeoutRef.current != null) {
        window.clearTimeout(versionTapWindowTimeoutRef.current);
        versionTapWindowTimeoutRef.current = null;
      }
    }
  }, [isVisible]);

  useEffect(
    () => () => {
      if (alreadyRatedToastTimeoutRef.current != null) {
        window.clearTimeout(alreadyRatedToastTimeoutRef.current);
      }
      if (versionTapWindowTimeoutRef.current != null) {
        window.clearTimeout(versionTapWindowTimeoutRef.current);
      }
    },
    [],
  );

  const beginEnterAfterPreflight = useCallback(() => {
    // No leaf burst on Settings — open already stresses Android WebView layers (popup flicker).
    setAnimState('entering');
    setTimeout(() => setAnimState('visible'), POPUP_ENTER_MS);
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

  const dismissToClose = (fromUserDismissGesture?: boolean) => {
    if (animState === 'leaving' || animState === 'hidden' || isPopupEnterInteractionLocked(animState)) return;
    if (fromUserDismissGesture) onUserDismiss?.();
    setAnimState('leaving');
    setTimeout(() => {
      setAnimState('hidden');
      onClose();
    }, POPUP_CLOSE_MS);
  };

  const showAlreadyRatedToast = () => {
    setAlreadyRatedToastId((n) => n + 1);
    if (alreadyRatedToastTimeoutRef.current != null) {
      window.clearTimeout(alreadyRatedToastTimeoutRef.current);
    }
    alreadyRatedToastTimeoutRef.current = window.setTimeout(() => {
      setAlreadyRatedToastId(0);
      alreadyRatedToastTimeoutRef.current = null;
    }, ALREADY_RATED_TOAST_MS);
  };

  const handleRateUsClick = () => {
    onAnyButtonClick?.();
    // Always read storage — Settings may stay open under Dev Tools while Clear Rating runs.
    const alreadyRated = readRateUsPermanentlyDismissed();
    setHasRatedUs(alreadyRated);
    if (alreadyRated) {
      showAlreadyRatedToast();
      return;
    }
    onRateUs();
  };

  const handleVersionTap = () => {
    if (showDevToolsButton) return;
    versionTapCountRef.current += 1;
    if (versionTapWindowTimeoutRef.current != null) {
      window.clearTimeout(versionTapWindowTimeoutRef.current);
    }
    versionTapWindowTimeoutRef.current = window.setTimeout(() => {
      versionTapCountRef.current = 0;
      versionTapWindowTimeoutRef.current = null;
    }, DEV_TOOLS_VERSION_TAP_WINDOW_MS);

    if (versionTapCountRef.current >= DEV_TOOLS_VERSION_TAP_COUNT) {
      versionTapCountRef.current = 0;
      if (versionTapWindowTimeoutRef.current != null) {
        window.clearTimeout(versionTapWindowTimeoutRef.current);
        versionTapWindowTimeoutRef.current = null;
      }
      onAnyButtonClick?.();
      onUnlockDevTools?.();
    }
  };

  if (animState === 'hidden') return null;
  const isPreflight = animState === 'preflight';
  const isEntering = animState === 'entering';
  const isLeaving = animState === 'leaving';

  const toggleRows: Array<{
    key: string;
    label: string;
    enabled: boolean;
    onToggle: () => void;
  }> = [
    {
      key: 'music',
      label: 'Music',
      enabled: musicEnabled,
      onToggle: () => {
        onAnyButtonClick?.();
        onMusicEnabledChange(!musicEnabled);
      },
    },
    {
      key: 'sound',
      label: 'Sound',
      enabled: sfxEnabled,
      onToggle: () => {
        onAnyButtonClick?.();
        onSfxEnabledChange(!sfxEnabled);
      },
    },
    {
      key: 'notifications',
      label: 'Notifications',
      enabled: notificationsEnabled,
      onToggle: () => {
        onAnyButtonClick?.();
        onNotificationsEnabledChange(!notificationsEnabled);
      },
    },
    {
      key: 'performance',
      label: 'Performance Mode',
      /** Reduces VFX / particles and caps animation FPS for low-end devices. */
      enabled: performanceMode,
      onToggle: () => {
        onAnyButtonClick?.();
        const next = !performanceMode;
        setPerformanceModeLocal(next);
        setPerformanceMode(next);
      },
    },
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={popupOverlayStyle({ pointerEvents: popupEnterInteractionPointerEvents(animState) })}
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
        onClick={closeOnBackdropClick ? () => dismissToClose(true) : undefined}
      />

      <div className="relative flex items-center justify-center" style={popupAppScaleStyle(appScale)}>
        <div
          ref={popupCardLayoutRef}
          className="relative flex flex-col items-center"
          style={{
            width: '320px',
            zIndex: 102,
            ...POPUP_LAYOUT_PASS_THROUGH,
            ...popupCardSurfaceStyle(
              animState,
              isEntering,
              isLeaving,
              `settingsPopupEnter ${POPUP_ENTER_MS}ms ease-out forwards`,
              `settingsPopupLeave ${POPUP_CLOSE_MS}ms ease-in forwards`,
            ),
          }}
        >
          <style>{`
            @keyframes settingsPopupEnter {
              0% { transform: scale(0.9); opacity: 0; }
              70% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes settingsPopupLeave {
              0% { transform: scale(1); opacity: 1; }
              100% { transform: scale(0.9); opacity: 0; }
            }
          `}</style>

          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
            style={{
              width: '120px',
              height: '120px',
              top: `${POPUP_HEADER_TOP_PX}px`,
              zIndex: 104,
              ...POPUP_HEADER_PASS_THROUGH,
            }}
          >
            <img
              src={assetPath('/assets/ui/popup_header.png')}
              alt=""
              className="absolute inset-0 w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}
            />
            <img
              src={HEADER_ICON}
              alt=""
              className="relative object-contain"
              style={{
                width: `${HEADER_ICON_PX}px`,
                height: `${HEADER_ICON_PX}px`,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                marginTop: '-4px',
              }}
            />
          </div>

          {showDevToolsButton ? (
            <button
              type="button"
              onMouseDown={() => setDevToolsPressed(true)}
              onMouseUp={() => setDevToolsPressed(false)}
              onMouseLeave={() => setDevToolsPressed(false)}
              onClick={() => {
                onAnyButtonClick?.();
                onOpenDevTools();
              }}
              className="absolute flex items-center justify-center transition-all"
              style={{
                top: `${POPUP_CLOSE_TOP_PX}px`,
                left: '18px',
                zIndex: 105,
                height: '28px',
                padding: '0 12px',
                backgroundColor: devToolsPressed ? ACTION_RED.pressedBg : ACTION_RED.bg,
                border: `2px solid ${ACTION_RED.border}`,
                borderRadius: '999px',
                boxShadow: devToolsPressed
                  ? 'inset 0 1px 3px rgba(0,0,0,0.2)'
                  : `0 2px 0 ${ACTION_RED.border}`,
                transform: devToolsPressed ? 'translateY(1px)' : 'translateY(0)',
                ...POPUP_CLOSE_HIT_TARGET,
              }}
            >
              <span
                className="font-bold tracking-tight whitespace-nowrap"
                style={{
                  color: ACTION_RED.text,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.7rem',
                  lineHeight: 1,
                }}
              >
                Dev Tools
              </span>
            </button>
          ) : null}

          <PopupPrescaleFrame
            creamHitTarget={false}
            prescaleWidthPx={640}
            style={{ marginTop: POPUP_CREAM_STACK_MARGIN_TOP_PX }}
          >
            <div
              style={{
                position: 'relative',
                padding: '150px 40px 32px 40px',
                ...POPUP_CREAM_HIT_TARGET,
              }}
            >
              <PopupVectorBackground style={{ filter: POPUP_CREAM_DROP_SHADOW_FILTER }} />
              <div className="relative z-[2] flex flex-col items-center w-full">
                <h3
                  className="font-black tracking-tight text-center whitespace-nowrap"
                  style={{
                    color: TITLE_COLOR,
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '4.5rem',
                  }}
                >
                  Settings
                </h3>

                <div className="w-full flex items-center justify-center" style={{ marginTop: '8px', marginBottom: '40px' }}>
                  <img
                    src={assetPath('/assets/ui/popup_divider.png')}
                    alt=""
                    className="h-auto object-contain"
                    style={{ width: '520px' }}
                  />
                </div>

                <div className="w-full flex flex-col" style={{ maxWidth: '520px', gap: '22px' }}>
                  {toggleRows.map((row) => {
                    const pill = row.enabled ? PILL_ON : PILL_OFF;
                    return (
                      <div
                        key={row.key}
                        className="flex items-center justify-between w-full"
                        style={{
                          minHeight: '92px',
                          padding: '8px 11px 8px 22px',
                          backgroundColor: TOGGLE_ROW.bg,
                          border: 'none',
                          borderRadius: '20px',
                          boxSizing: 'border-box',
                          // 2px visual (×2 for 0.5 scale): light inner stroke, dark outer stroke.
                          boxShadow: `inset 0 0 0 4px ${TOGGLE_ROW.outlineInner}, 0 0 0 4px ${TOGGLE_ROW.outlineOuter}`,
                        }}
                      >
                        <span
                          className="font-bold tracking-tight"
                          style={{
                            color: TOGGLE_ROW.label,
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '1.85rem',
                            paddingRight: '12px',
                          }}
                        >
                          {row.label}
                        </span>
                        <button
                          type="button"
                          onClick={row.onToggle}
                          className="relative flex items-center justify-center shrink-0 transition-all"
                          style={{
                            minWidth: '172px',
                            height: '68px',
                            padding: '0 20px',
                            marginLeft: '3px',
                            transform: 'translateY(-1px)',
                            backgroundColor: pill.bg,
                            border: `4px solid ${pill.border}`,
                            borderRadius: '18px',
                            boxShadow: `0 6px 0 ${pill.border}`,
                          }}
                        >
                          <span
                            className="font-bold tracking-tight"
                            style={{
                              color: pill.text,
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '1.8rem',
                              textShadow: row.enabled ? '0 1px 0 rgba(255,255,255,0.25)' : 'none',
                            }}
                          >
                            {row.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="w-full flex" style={{ maxWidth: '520px', marginTop: '56px', gap: '16px' }}>
                  <div className="relative flex-1">
                    {alreadyRatedToastId > 0 ? (
                      <div
                        className="absolute bottom-full left-1/2 z-[60] mb-1 min-w-[180px] -translate-x-1/2 pointer-events-none px-2 text-center"
                        role="status"
                        aria-live="polite"
                      >
                        <span
                          key={alreadyRatedToastId}
                          className="side-action-toast-text font-extrabold leading-snug tracking-tight"
                          style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.625rem' }}
                        >
                          Already Rated
                        </span>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onMouseDown={() => setRateUsPressed(true)}
                      onMouseUp={() => setRateUsPressed(false)}
                      onMouseLeave={() => setRateUsPressed(false)}
                      onClick={handleRateUsClick}
                      className="relative flex items-center justify-center w-full transition-all"
                      style={{
                        height: '78px',
                        backgroundColor: rateUsPressed ? ACTION_TAN.pressedBg : ACTION_TAN.bg,
                        border: `4px solid ${ACTION_TAN.border}`,
                        borderRadius: '18px',
                        boxShadow: rateUsPressed
                          ? 'inset 0 3px 6px rgba(0,0,0,0.15)'
                          : `0 6px 0 ${ACTION_TAN.border}`,
                        transform: rateUsPressed ? 'translateY(3px)' : 'translateY(0)',
                      }}
                    >
                      <span
                        className="font-bold tracking-tight"
                        style={{
                          color: ACTION_TAN.text,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '1.85rem',
                        }}
                      >
                        Rate Us
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onMouseDown={() => setContactUsPressed(true)}
                    onMouseUp={() => setContactUsPressed(false)}
                    onMouseLeave={() => setContactUsPressed(false)}
                    onClick={() => {
                      onAnyButtonClick?.();
                      openSupportContact();
                    }}
                    className="relative flex items-center justify-center flex-1 transition-all"
                    style={{
                      height: '78px',
                      backgroundColor: contactUsPressed ? ACTION_TAN.pressedBg : ACTION_TAN.bg,
                      border: `4px solid ${ACTION_TAN.border}`,
                      borderRadius: '18px',
                      boxShadow: contactUsPressed
                        ? 'inset 0 3px 6px rgba(0,0,0,0.15)'
                        : `0 6px 0 ${ACTION_TAN.border}`,
                      transform: contactUsPressed ? 'translateY(3px)' : 'translateY(0)',
                    }}
                  >
                    <span
                      className="font-bold tracking-tight"
                      style={{
                        color: ACTION_TAN.text,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '1.85rem',
                      }}
                    >
                      Contact Us
                    </span>
                  </button>
                </div>

                <div className="w-full relative" style={{ maxWidth: '520px', marginTop: '20px' }}>
                  {showResetConfirm ? (
                    <div
                      className="w-full flex flex-col items-center"
                      style={{
                        marginBottom: '14px',
                        padding: '18px 16px 16px',
                        backgroundColor: '#f7ebd0',
                        border: `3px solid ${TOGGLE_ROW.outlineOuter}`,
                        borderRadius: '20px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <p
                        className="font-medium text-center leading-snug w-full"
                        style={{
                          color: DESCRIPTION_COLOR,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '1.55rem',
                          fontStyle: 'italic',
                          marginBottom: '16px',
                        }}
                      >
                        {RESET_WARNING}
                      </p>
                      <div className="w-full flex gap-3">
                        <button
                          type="button"
                          onMouseDown={() => setClearProgressPressed(true)}
                          onMouseUp={() => setClearProgressPressed(false)}
                          onMouseLeave={() => setClearProgressPressed(false)}
                          onClick={() => {
                            onAnyButtonClick?.();
                            setShowResetConfirm(false);
                            onResetGame();
                          }}
                          className="relative flex items-center justify-center flex-1 transition-all"
                          style={{
                            height: '64px',
                            backgroundColor: clearProgressPressed ? ACTION_RED.pressedBg : ACTION_RED.bg,
                            border: `4px solid ${ACTION_RED.border}`,
                            borderRadius: '16px',
                            boxShadow: clearProgressPressed
                              ? 'inset 0 3px 6px rgba(0,0,0,0.2)'
                              : `0 5px 0 ${ACTION_RED.border}`,
                            transform: clearProgressPressed ? 'translateY(3px)' : 'translateY(0)',
                          }}
                        >
                          <span
                            className="font-bold tracking-tight"
                            style={{
                              color: ACTION_RED.text,
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '1.5rem',
                            }}
                          >
                            Clear Progress
                          </span>
                        </button>
                        <button
                          type="button"
                          onMouseDown={() => setNoResetPressed(true)}
                          onMouseUp={() => setNoResetPressed(false)}
                          onMouseLeave={() => setNoResetPressed(false)}
                          onClick={() => {
                            onAnyButtonClick?.();
                            setShowResetConfirm(false);
                          }}
                          className="relative flex items-center justify-center flex-1 transition-all"
                          style={{
                            height: '64px',
                            backgroundColor: noResetPressed ? ACTION_TAN.pressedBg : ACTION_TAN.bg,
                            border: `4px solid ${ACTION_TAN.border}`,
                            borderRadius: '16px',
                            boxShadow: noResetPressed
                              ? 'inset 0 3px 6px rgba(0,0,0,0.15)'
                              : `0 5px 0 ${ACTION_TAN.border}`,
                            transform: noResetPressed ? 'translateY(3px)' : 'translateY(0)',
                          }}
                        >
                          <span
                            className="font-bold tracking-tight"
                            style={{
                              color: ACTION_TAN.text,
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '1.5rem',
                            }}
                          >
                            No
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onMouseDown={() => setResetPressed(true)}
                    onMouseUp={() => setResetPressed(false)}
                    onMouseLeave={() => setResetPressed(false)}
                    onClick={() => {
                      onAnyButtonClick?.();
                      setShowResetConfirm(true);
                    }}
                    className="relative flex items-center justify-center w-full transition-all"
                    style={{
                      height: '78px',
                      backgroundColor: resetPressed ? ACTION_RED.pressedBg : ACTION_RED.bg,
                      border: `4px solid ${ACTION_RED.border}`,
                      borderRadius: '18px',
                      boxShadow: resetPressed
                        ? 'inset 0 3px 6px rgba(0,0,0,0.2)'
                        : `0 6px 0 ${ACTION_RED.border}`,
                      transform: resetPressed ? 'translateY(3px)' : 'translateY(0)',
                    }}
                  >
                    <span
                      className="font-bold tracking-tight"
                      style={{
                        color: ACTION_RED.text,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '1.85rem',
                      }}
                    >
                      Reset Game
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleVersionTap}
                  className="text-center"
                  style={{
                    marginTop: '18px',
                    color: '#8d7c5d',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    letterSpacing: '0.01em',
                    background: 'transparent',
                    border: 'none',
                    padding: '4px 16px 0',
                    cursor: showDevToolsButton ? 'default' : 'pointer',
                  }}
                  aria-label={`App version v${APP_VERSION}`}
                >
                  {`v${APP_VERSION}`}
                </button>
              </div>
            </div>
          </PopupPrescaleFrame>

          <button
            type="button"
            onClick={() => dismissToClose(true)}
            className="absolute w-7 h-7 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              top: `${POPUP_CLOSE_TOP_PX}px`,
              right: '24px',
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
