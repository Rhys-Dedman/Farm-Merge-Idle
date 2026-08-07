/**
 * Daily Tasks popup — discovery-style green card, slightly wider than standard popups.
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import { popupCardSurfaceStyle, usePopupPreflightEnter, type PopupAnimWithPreflight, POPUP_ENTER_MS, popupEnterInteractionPointerEvents, isPopupEnterInteractionLocked } from '../hooks/usePopupPreflightEnter';
import { PopupVectorBackground } from './PopupVectorBackground';
import { PopupPrescaleFrame } from './PopupPrescaleFrame';
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
import { PopupRectLeafBurst } from './PopupRectLeafBurst';
import { DailyTaskRow, type DailyTaskClaimFx, type DailyTaskDefinition } from './DailyTaskRow';
import { DailyTasksTimerPanel } from './DailyTasksTimerPanel';
import { shouldPlayPopupLeafBurst } from '../utils/performanceMode';
import { CollectionFtueOverlay, type GameRect } from './CollectionFtueOverlay';
import { COLLECTION_FTUE_BLOCKER_TINT } from '../constants/collectionFtue';
import {
  getTasksFtueClaim2xButtonId,
  getTasksFtueClaimButtonId,
  TASKS_FTUE_CLAIM_2X_BUTTON_ID,
  TASKS_FTUE_CLAIM_BUTTON_ID,
} from '../constants/tasksFtue';

const POPUP_CLOSE_MS = 200;

/** Leaf spawn perimeter — matches wider shell. */
const POPUP_WIDTH = 300;
const POPUP_HEIGHT = 360;

/** Outer shell width (standard popups use 320px). */
const DAILY_TASKS_SHELL_WIDTH_PX = 400;
/** Prescale panel width (standard discovery uses 640px). */
const DAILY_TASKS_PRESCALE_WIDTH_PX = 720;

/** Visible card width after 0.5× prescale (used to align close X with card corner). */
const DAILY_TASKS_VISUAL_CARD_WIDTH_PX = DAILY_TASKS_PRESCALE_WIDTH_PX * 0.5;
/**
 * Same as Rate Us / Thank You (`top 56px`, `right 24px` on a 320px shell).
 * Wider shell: offset right by half the extra gutter so X stays on the card edge.
 */
const DAILY_TASKS_CLOSE_TOP_PX = POPUP_CLOSE_TOP_PX;
const DAILY_TASKS_CLOSE_RIGHT_PX =
  (DAILY_TASKS_SHELL_WIDTH_PX - DAILY_TASKS_VISUAL_CARD_WIDTH_PX) / 2 + 24;

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
  /** Task id whose claim buttons are measured for the claim FTUE (L6 single-target). */
  ftueClaimTaskId?: string | null;
  /** Multi-row claim FTUE targets (L7 Special Delivery). Overrides `ftueClaimTaskId` when set. */
  ftueClaimTaskIds?: string[] | null;
  /** Subset of claim targets that still show a finger (others stay hole-only). */
  ftueFingerTaskIds?: string[] | null;
  /** Block dismiss (backdrop + close) during claim FTUE. */
  forceStayOpen?: boolean;
  /** Fade claim FTUE finger/blocker after a claim tap. */
  claimFtueFadingOut?: boolean;
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
  ftueClaimTaskId = null,
  ftueClaimTaskIds = null,
  ftueFingerTaskIds = null,
  forceStayOpen = false,
  claimFtueFadingOut = false,
}) => {
  const [animState, setAnimState] = useState<PopupAnimWithPreflight>('hidden');
  const [assetsReady, setAssetsReady] = useState(false);
  const [leafBurstKey, setLeafBurstKey] = useState(0);
  const [showLeafBurst, setShowLeafBurst] = useState(false);
  const [claimFtueHoles, setClaimFtueHoles] = useState<GameRect[] | null>(null);
  const [claimFtueFingerRects, setClaimFtueFingerRects] = useState<GameRect[] | null>(null);
  const popupCardLayoutRef = useRef<HTMLDivElement>(null);
  const overlayRootRef = useRef<HTMLDivElement>(null);

  const resolvedClaimTaskIds =
    ftueClaimTaskIds != null && ftueClaimTaskIds.length > 0
      ? ftueClaimTaskIds
      : ftueClaimTaskId != null
        ? [ftueClaimTaskId]
        : [];
  const resolvedFingerTaskIds =
    ftueFingerTaskIds != null
      ? ftueFingerTaskIds.filter((id) => resolvedClaimTaskIds.includes(id))
      : resolvedClaimTaskIds;
  const claimTargetIdSet = new Set(resolvedClaimTaskIds);

  useEffect(() => {
    if (!isVisible) setAssetsReady(false);
  }, [isVisible]);

  const beginEnterAfterPreflight = useCallback(() => {
    if (shouldPlayPopupLeafBurst()) {
      setLeafBurstKey((k) => k + 1);
      setShowLeafBurst(true);
    }
    setAnimState('entering');
    setTimeout(() => setAnimState('visible'), POPUP_ENTER_MS);
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

  const claimFtueActive =
    forceStayOpen &&
    resolvedClaimTaskIds.length > 0 &&
    (animState === 'visible' || animState === 'entering' || claimFtueFadingOut);

  useLayoutEffect(() => {
    if (!claimFtueActive) {
      setClaimFtueHoles(null);
      setClaimFtueFingerRects(null);
      return;
    }
    // Keep last hole positions while fading so the finger can animate out.
    if (claimFtueFadingOut) return;
    const measure = () => {
      const root = overlayRootRef.current;
      if (!root) {
        setClaimFtueHoles(null);
        setClaimFtueFingerRects(null);
        return;
      }
      // Overlay is design-space (pre-appScale); convert viewport rects like other FTUEs.
      const rootRect = root.getBoundingClientRect();
      const scale = appScale > 0 ? appScale : 1;
      const toLocal = (el: Element): GameRect => {
        const r = el.getBoundingClientRect();
        return {
          left: (r.left - rootRect.left) / scale,
          top: (r.top - rootRect.top) / scale,
          width: r.width / scale,
          height: r.height / scale,
        };
      };
      const holes: GameRect[] = [];
      const fingers: GameRect[] = [];
      for (const taskId of resolvedClaimTaskIds) {
        const claim2x =
          document.getElementById(getTasksFtueClaim2xButtonId(taskId)) ??
          (resolvedClaimTaskIds.length === 1
            ? document.getElementById(TASKS_FTUE_CLAIM_2X_BUTTON_ID)
            : null);
        const claim =
          document.getElementById(getTasksFtueClaimButtonId(taskId)) ??
          (resolvedClaimTaskIds.length === 1
            ? document.getElementById(TASKS_FTUE_CLAIM_BUTTON_ID)
            : null);
        if (!claim2x || !claim) continue;
        holes.push(toLocal(claim2x), toLocal(claim));
        if (resolvedFingerTaskIds.includes(taskId)) {
          fingers.push(toLocal(claim));
        }
      }
      setClaimFtueHoles(holes.length > 0 ? holes : null);
      setClaimFtueFingerRects(fingers.length > 0 ? fingers : null);
    };
    measure();
    const t1 = window.setTimeout(measure, 50);
    const t2 = window.setTimeout(measure, 200);
    const t3 = window.setTimeout(measure, 450);
    const t4 = window.setTimeout(measure, 700);
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
      window.removeEventListener('resize', measure);
    };
  }, [
    claimFtueActive,
    claimFtueFadingOut,
    resolvedClaimTaskIds.join('|'),
    resolvedFingerTaskIds.join('|'),
    animState,
    tasks,
    appScale,
  ]);

  const dismiss = () => {
    if (forceStayOpen) return;
    if (animState === 'leaving' || animState === 'hidden' || isPopupEnterInteractionLocked(animState)) return;
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
  const showClaimFtueOverlay =
    claimFtueActive && (claimFtueHoles?.length ?? 0) >= 2;

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
        onClick={closeOnBackdropClick && !forceStayOpen ? dismiss : undefined}
      />

      <div
        className="relative flex items-center justify-center"
        style={popupAppScaleStyle(appScale)}
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
            zIndex: 102,
            ...POPUP_LAYOUT_PASS_THROUGH,
            ...popupCardSurfaceStyle(
              animState,
              isEntering,
              isLeaving,
              `popupEnter ${POPUP_ENTER_MS}ms ease-out forwards`,
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
              top: `${POPUP_HEADER_TOP_PX}px`,
              zIndex: 104,
              ...POPUP_HEADER_PASS_THROUGH,
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

          <PopupPrescaleFrame
            creamHitTarget={false}
            prescaleWidthPx={DAILY_TASKS_PRESCALE_WIDTH_PX}
            style={{ marginTop: POPUP_CREAM_STACK_MARGIN_TOP_PX }}
          >
            <div
              style={{
                position: 'relative',
                padding: '150px 40px 60px 40px',
                ...POPUP_CREAM_HIT_TARGET,
              }}
            >
              <PopupVectorBackground style={{ filter: POPUP_CREAM_DROP_SHADOW_FILTER }} />
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

                <p
                  className="font-medium text-center italic"
                  style={{
                    color: '#c2b280',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '2rem',
                    lineHeight: 1.2,
                    marginTop: '-4px',
                    marginBottom: '18px',
                  }}
                >
                  Complete task to earn Keys
                </p>

                <DailyTasksTimerPanel
                  tasksUnlocked={tasksUnlocked}
                  countdownRefreshKey={countdownRefreshKey}
                />

                <div
                  className="w-full flex flex-col"
                  style={{
                    minHeight: '320px',
                    paddingLeft: '8px',
                    paddingRight: '8px',
                    gap: '12px',
                  }}
                  aria-label="Daily tasks list"
                >
                  {children ??
                    (tasks ?? []).map((task) => (
                      <DailyTaskRow
                        key={task.id}
                        {...task}
                        claimBounceActive={claimBounceTaskIds.includes(task.id)}
                        ftueClaimTarget={claimTargetIdSet.has(task.id)}
                        onClaim={(fx) => onClaimTask?.(task.id, fx)}
                        onClaim2x={(fx) => onClaim2xTask?.(task.id, fx)}
                      />
                    ))}
                </div>
              </div>
            </div>
          </PopupPrescaleFrame>

          {!forceStayOpen && (
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
              ...POPUP_CLOSE_HIT_TARGET,
            }}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M2 2L12 12M12 2L2 12" />
            </svg>
          </button>
          )}
        </div>
      </div>

      {/* Claim FTUE: design-space layer scaled by appScale (same rate as the popup card / other FTUEs). */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 200 }}>
        <div
          ref={overlayRootRef}
          className="absolute left-0 top-0 pointer-events-none"
          style={{
            width: appScale > 0 ? `${100 / appScale}%` : '100%',
            height: appScale > 0 ? `${100 / appScale}%` : '100%',
            transform: `scale(${appScale})`,
            transformOrigin: 'top left',
          }}
        >
          {claimFtueActive && !showClaimFtueOverlay && (
            <div
              className="absolute inset-0 pointer-events-auto"
              style={{ backgroundColor: COLLECTION_FTUE_BLOCKER_TINT }}
              aria-hidden
            />
          )}
          {showClaimFtueOverlay && (
            <CollectionFtueOverlay
              active
              holeRects={claimFtueHoles}
              fingerRects={claimFtueFingerRects}
              fingerStyle="point_45"
              blockerTint={COLLECTION_FTUE_BLOCKER_TINT}
              holePaddingPx={6}
              zIndex={1}
              isFadingOut={claimFtueFadingOut}
            />
          )}
        </div>
      </div>
    </div>
  );
};
