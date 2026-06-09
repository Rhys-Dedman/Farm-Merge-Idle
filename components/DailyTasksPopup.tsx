/**
 * Daily Tasks popup — discovery-style green card, slightly wider than standard popups.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import { popupCardSurfaceStyle, usePopupPreflightEnter, type PopupAnimWithPreflight } from '../hooks/usePopupPreflightEnter';
import { PopupVectorBackground } from './PopupVectorBackground';
import { PopupRectLeafBurst } from './PopupRectLeafBurst';
import { DailyTaskRow, type DailyTaskClaimFx, type DailyTaskDefinition } from './DailyTaskRow';
import { DailyTasksTimerPanel } from './DailyTasksTimerPanel';

const POPUP_CLOSE_MS = 200;

/** Leaf spawn perimeter — matches wider shell. */
const POPUP_WIDTH = 300;
const POPUP_HEIGHT = 360;

/** Outer shell width (standard popups use 320px). */
const DAILY_TASKS_SHELL_WIDTH_PX = 400;
const DAILY_TASKS_SHELL_MIN_HEIGHT_PX = 440;
/** Prescale panel width (standard discovery uses 640px). */
const DAILY_TASKS_PRESCALE_WIDTH_PX = 720;
const DAILY_TASKS_PRESCALE_MARGIN_BOTTOM_PX = -326;

/** Visible card width after 0.5× prescale (used to align close X with card corner). */
const DAILY_TASKS_VISUAL_CARD_WIDTH_PX = DAILY_TASKS_PRESCALE_WIDTH_PX * 0.5;
/**
 * Same as Rate Us / Thank You (`top 56px`, `right 24px` on a 320px shell).
 * Wider shell: offset right by half the extra gutter so X stays on the card edge.
 */
const DAILY_TASKS_CLOSE_TOP_PX = 56;
const DAILY_TASKS_CLOSE_RIGHT_PX =
  (DAILY_TASKS_SHELL_WIDTH_PX - DAILY_TASKS_VISUAL_CARD_WIDTH_PX) / 2 + 24;
/** Nudge popup toward true viewport center (header art sits above shell box). */
const DAILY_TASKS_POPUP_OFFSET_Y = 'clamp(48px, 7vh, 80px)';

const HEADER_ICON = assetPath('/assets/icons/floating_buttons/icon_tasks.png');
const HEADER_ICON_PX = Math.round(70 * 1.15);
const TITLE_TEXT = 'Daily Tasks';
const SETTINGS_TITLE_COLOR = '#5c4a32';
const DIVIDER_ROW_MIN_HEIGHT_PX = 40;

export interface DailyTasksPopupProps {
  isVisible: boolean;
  onClose: () => void;
  onUserDismiss?: () => void;
  closeOnBackdropClick?: boolean;
  appScale?: number;
  /** Task rows; defaults to preview template rows when omitted. */
  children?: React.ReactNode;
  tasks?: DailyTaskDefinition[];
  claimBounceTaskIds?: string[];
  onClaimTask?: (taskId: string, fx: DailyTaskClaimFx) => void;
  onClaim2xTask?: (taskId: string, fx: DailyTaskClaimFx) => void;
  /** When true, 24h reset timer runs (starts once at tasks unlock). */
  tasksUnlocked?: boolean;
  countdownRefreshKey?: number;
}

export const DailyTasksPopup: React.FC<DailyTasksPopupProps> = ({
  isVisible,
  onClose,
  onUserDismiss,
  closeOnBackdropClick = true,
  appScale = 1,
  children,
  tasks,
  claimBounceTaskIds = [],
  onClaimTask,
  onClaim2xTask,
  tasksUnlocked = false,
  countdownRefreshKey = 0,
}) => {
  const [animState, setAnimState] = useState<PopupAnimWithPreflight>('hidden');
  const [assetsReady, setAssetsReady] = useState(false);
  const [leafBurstKey, setLeafBurstKey] = useState(0);
  const [showLeafBurst, setShowLeafBurst] = useState(false);
  const popupCardLayoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) setAssetsReady(false);
  }, [isVisible]);

  const beginEnterAfterPreflight = useCallback(() => {
    setLeafBurstKey((k) => k + 1);
    setShowLeafBurst(true);
    setAnimState('entering');
    setTimeout(() => setAnimState('visible'), 250);
  }, []);

  usePopupPreflightEnter(animState, beginEnterAfterPreflight, popupCardLayoutRef);

  useEffect(() => {
    if (isVisible && assetsReady && animState === 'hidden') {
      setAnimState('preflight');
    } else if (!isVisible && (animState === 'visible' || animState === 'entering' || animState === 'preflight')) {
      setAnimState('leaving');
      setTimeout(() => {
        setAnimState('hidden');
        onClose();
      }, POPUP_CLOSE_MS);
    }
  }, [isVisible, assetsReady, animState, onClose]);

  useEffect(() => {
    if (isVisible) setAssetsReady(true);
  }, [isVisible]);

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
          transform: `scale(${appScale}) translateY(${DAILY_TASKS_POPUP_OFFSET_Y})`,
          transformOrigin: 'center center',
        }}
      >
        {(isEntering || animState === 'visible') && showLeafBurst && (
          <PopupRectLeafBurst
            key={leafBurstKey}
            rectWidth={POPUP_WIDTH}
            rectHeight={POPUP_HEIGHT}
            zIndex={101}
            onComplete={() => setShowLeafBurst(false)}
          />
        )}

        <div
          ref={popupCardLayoutRef}
          className="relative flex flex-col items-center"
          style={{
            width: `${DAILY_TASKS_SHELL_WIDTH_PX}px`,
            minHeight: DAILY_TASKS_SHELL_MIN_HEIGHT_PX,
            zIndex: 102,
            ...popupCardSurfaceStyle(
              animState,
              isEntering,
              isLeaving,
              'popupEnter 250ms ease-out forwards',
              `popupLeave ${POPUP_CLOSE_MS}ms ease-in forwards`,
            ),
          }}
        >
          <style>{`
            @keyframes popupEnter {
              0% { transform: scale(0.9); opacity: 0; }
              70% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes popupLeave {
              0% { transform: scale(1); opacity: 1; }
              100% { transform: scale(0.9); opacity: 0; }
            }
          `}</style>

          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
            style={{
              width: '120px',
              height: '120px',
              top: '-20px',
              zIndex: 104,
            }}
          >
            <img
              src={assetPath('/assets/ui/popup_header.png')}
              alt=""
              decoding="sync"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}
            />
            <img
              src={HEADER_ICON}
              alt=""
              decoding="sync"
              className="relative object-contain"
              style={{
                width: `${HEADER_ICON_PX}px`,
                height: `${HEADER_ICON_PX}px`,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                marginTop: '-4px',
              }}
            />
          </div>

          <div
            style={{
              position: 'relative',
              marginTop: '36px',
              width: `${DAILY_TASKS_PRESCALE_WIDTH_PX}px`,
              transform: 'scale(0.5)',
              transformOrigin: 'top center',
              marginBottom: `${DAILY_TASKS_PRESCALE_MARGIN_BOTTOM_PX}px`,
            }}
          >
            <div
              style={{
                position: 'relative',
                filter: 'drop-shadow(0 16px 48px rgba(0,0,0,0.3))',
                padding: '150px 40px 60px 40px',
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
                  {TITLE_TEXT}
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
                    decoding="sync"
                    className="h-auto object-contain"
                    style={{ width: '580px', maxHeight: DIVIDER_ROW_MIN_HEIGHT_PX }}
                  />
                </div>

                <DailyTasksTimerPanel
                  tasksUnlocked={tasksUnlocked}
                  countdownRefreshKey={countdownRefreshKey}
                />

                <div
                  className="w-full flex flex-col"
                  style={{
                    minHeight: '240px',
                    paddingLeft: '8px',
                    paddingRight: '8px',
                    gap: '26px',
                  }}
                  aria-label="Daily tasks list"
                >
                  {children ??
                    (tasks ?? []).map((task) => (
                      <DailyTaskRow
                        key={task.id}
                        {...task}
                        claimBounceActive={claimBounceTaskIds.includes(task.id)}
                        onClaim={(fx) => onClaimTask?.(task.id, fx)}
                        onClaim2x={(fx) => onClaim2xTask?.(task.id, fx)}
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="absolute w-8 h-8 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              top: DAILY_TASKS_CLOSE_TOP_PX,
              right: DAILY_TASKS_CLOSE_RIGHT_PX,
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
