/**
 * Locked preview for farm floating features (Daily Tasks, Your Gardens).
 * Same shell chrome as the unlocked popups — title, header icon, description, disabled unlock CTA.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import { popupCardSurfaceStyle, usePopupPreflightEnter, type PopupAnimWithPreflight } from '../hooks/usePopupPreflightEnter';
import { PopupVectorBackground } from './PopupVectorBackground';

const POPUP_CLOSE_MS = 200;

const SHELL_WIDTH_PX = 400;
const SHELL_MIN_HEIGHT_PX = 400;
const PRESCALE_WIDTH_PX = 720;
const PRESCALE_MARGIN_BOTTOM_PX = -140;
const VISUAL_CARD_WIDTH_PX = PRESCALE_WIDTH_PX * 0.5;
const CLOSE_TOP_PX = 56;
const CLOSE_RIGHT_PX = (SHELL_WIDTH_PX - VISUAL_CARD_WIDTH_PX) / 2 + 24;
const POPUP_OFFSET_Y = 'clamp(48px, 7vh, 80px)';

const SETTINGS_TITLE_COLOR = '#5c4a32';
const DIVIDER_ROW_MIN_HEIGHT_PX = 40;
/** Prescale rem — reads as 2rem on screen after 0.5× (matches Discovery / Golden Pot popups). */
const DESCRIPTION_FONT_SIZE_REM = '2rem';

/** Locked CTA — muted blues (untappable / level-gated). */
const DISABLED_CTA = {
  bg: '#9cccdb',
  border: '#6aa3b7',
  text: '#3d7493',
} as const;

const ICON_LOCK = '/assets/icons/generic_buttons/icon_lock.png';

export interface LockedFloatingFeaturePopupProps {
  isVisible: boolean;
  onClose: () => void;
  onUserDismiss?: () => void;
  closeOnBackdropClick?: boolean;
  appScale?: number;
  title: string;
  headerIconSrc: string;
  headerIconPx: number;
  description: string;
  unlockLevel: number;
}

export const LOCKED_DAILY_TASKS_POPUP_DESCRIPTION =
  'Complete task to earn coins! Tasks are refreshed daily.';

export const LOCKED_GARDENS_POPUP_DESCRIPTION =
  'Unlock new gardens and discover new plants!';

export const LockedFloatingFeaturePopup: React.FC<LockedFloatingFeaturePopupProps> = ({
  isVisible,
  onClose,
  onUserDismiss,
  closeOnBackdropClick = true,
  appScale = 1,
  title,
  headerIconSrc,
  headerIconPx,
  description,
  unlockLevel,
}) => {
  const [animState, setAnimState] = useState<PopupAnimWithPreflight>('hidden');
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

  const dismiss = () => {
    if (animState === 'leaving' || animState === 'hidden' || animState === 'preflight') return;
    onUserDismiss?.();
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
  const unlockLabel = `Unlocked lvl ${unlockLevel}`;

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
        onClick={closeOnBackdropClick ? dismiss : undefined}
      />

      <div
        className="relative flex items-center justify-center"
        style={{
          transform: `scale(${appScale}) translateY(${POPUP_OFFSET_Y})`,
          transformOrigin: 'center center',
        }}
      >
        <div
          ref={popupCardLayoutRef}
          className="relative flex flex-col items-center overflow-visible"
          style={{
            width: `${SHELL_WIDTH_PX}px`,
            minHeight: SHELL_MIN_HEIGHT_PX,
            zIndex: 102,
            overflow: 'visible',
            ...popupCardSurfaceStyle(
              animState,
              isEntering,
              isLeaving,
              'lockedFeatureEnter 250ms ease-out forwards',
              `lockedFeatureLeave ${POPUP_CLOSE_MS}ms ease-in forwards`,
            ),
          }}
        >
          <style>{`
            @keyframes lockedFeatureEnter {
              0% { transform: scale(0.9); opacity: 0; }
              70% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes lockedFeatureLeave {
              0% { transform: scale(1); opacity: 1; }
              100% { transform: scale(0.9); opacity: 0; }
            }
          `}</style>

          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
            style={{ width: '120px', height: '120px', top: '-20px', zIndex: 104 }}
          >
            <img
              src={assetPath('/assets/ui/popup_header.png')}
              alt=""
              className="absolute inset-0 h-full w-full object-contain"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}
            />
            <img
              src={headerIconSrc}
              alt=""
              className="relative object-contain"
              style={{
                width: `${headerIconPx}px`,
                height: `${headerIconPx}px`,
                marginTop: '-4px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}
            />
          </div>

          <div
            style={{
              position: 'relative',
              marginTop: '36px',
              width: `${PRESCALE_WIDTH_PX}px`,
              transform: 'scale(0.5)',
              transformOrigin: 'top center',
              marginBottom: `${PRESCALE_MARGIN_BOTTOM_PX}px`,
            }}
          >
            <div
              style={{
                position: 'relative',
                filter: 'drop-shadow(0 16px 48px rgba(0,0,0,0.3))',
                padding: '150px 40px 72px 40px',
              }}
            >
              <PopupVectorBackground />
              <div className="relative z-[2] flex flex-col items-center w-full">
                <h2
                  className="font-black tracking-tight text-center"
                  style={{
                    color: SETTINGS_TITLE_COLOR,
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '4.5rem',
                    lineHeight: 1.1,
                  }}
                >
                  {title}
                </h2>

                <div
                  className="w-full flex items-center justify-center"
                  style={{
                    marginTop: '8px',
                    marginBottom: '20px',
                    minHeight: DIVIDER_ROW_MIN_HEIGHT_PX,
                  }}
                >
                  <img
                    src={assetPath('/assets/ui/popup_divider.png')}
                    alt=""
                    className="h-auto object-contain"
                    style={{ width: '580px', maxHeight: DIVIDER_ROW_MIN_HEIGHT_PX }}
                  />
                </div>

                <p
                  className="font-medium text-center leading-relaxed italic w-full"
                  style={{
                    color: '#c2b280',
                    fontFamily: 'Inter, sans-serif',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    fontSize: DESCRIPTION_FONT_SIZE_REM,
                    marginBottom: '48px',
                  }}
                >
                  {description}
                </p>

                <button
                  type="button"
                  disabled
                  aria-disabled
                  className="relative flex select-none items-center justify-center gap-3 rounded-xl font-bold tracking-tight"
                  style={{
                    width: '360px',
                    height: '88px',
                    boxSizing: 'border-box',
                    backgroundColor: DISABLED_CTA.bg,
                    border: `4px solid ${DISABLED_CTA.border}`,
                    borderRadius: '24px',
                    boxShadow: `0 8px 0 ${DISABLED_CTA.border}, 0 12px 24px rgba(0,0,0,0.15)`,
                    color: DISABLED_CTA.text,
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '2rem',
                    lineHeight: 1.1,
                    textShadow: '0 2px 0 rgba(255,255,255,0.3)',
                    cursor: 'default',
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 32,
                      height: 32,
                      flexShrink: 0,
                      backgroundColor: DISABLED_CTA.text,
                      maskImage: `url(${assetPath(ICON_LOCK)})`,
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskImage: `url(${assetPath(ICON_LOCK)})`,
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      transform: 'translateY(-1px)',
                    }}
                  />
                  <span
                    className="font-bold tracking-tight"
                    style={{
                      color: DISABLED_CTA.text,
                      fontFamily: 'Inter, sans-serif',
                      textShadow: '0 2px 0 rgba(255,255,255,0.3)',
                      fontSize: '2rem',
                    }}
                  >
                    {unlockLabel}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="absolute w-8 h-8 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              top: CLOSE_TOP_PX,
              right: CLOSE_RIGHT_PX,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#c2b280',
              zIndex: 105,
            }}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M2 2L12 12M12 2L2 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
