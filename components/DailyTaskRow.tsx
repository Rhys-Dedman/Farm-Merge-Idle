/**
 * Single daily-task row — in-progress, complete (claimable), and claimed states.
 * Sized for the Daily Tasks popup prescale panel (0.5×); tweak TASK_ROW_SCALE to resize every row.
 */
import React, { useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import {
  getTasksFtueClaim2xButtonId,
  getTasksFtueClaimButtonId,
  TASKS_FTUE_CLAIM_2X_BUTTON_ID,
  TASKS_FTUE_CLAIM_BUTTON_ID,
} from '../constants/tasksFtue';
export type DailyTaskRowState = 'in_progress' | 'complete' | 'claimed';

export interface DailyTaskClaimFx {
  rewardCenter: { x: number; y: number };
  rowCenter: { x: number; y: number };
  /** Task card size for popup-style rectangular leaf burst (viewport px). */
  rowWidth: number;
  rowHeight: number;
}

export interface DailyTaskRowProps {
  id?: string;
  state: DailyTaskRowState;
  title: string;
  description: string;
  /** Placeholder values for `{n}` / `{s}` / `{p}` tokens — rendered green & bold. */
  descriptionValues?: Record<string, number | string>;
  progressCurrent: number;
  progressTotal: number;
  rewardKeys: number;
  iconSrc?: string;
  claimBounceActive?: boolean;
  /** When true, claim buttons get FTUE measurement ids. */
  ftueClaimTarget?: boolean;
  onClaim?: (fx: DailyTaskClaimFx) => void;
  onClaim2x?: (fx: DailyTaskClaimFx) => void;
}

export interface DailyTaskDefinition extends DailyTaskRowProps {
  id: string;
}

/** ~40% smaller than initial layout — change here to rescale all task rows. */
const TASK_ROW_SCALE = 0.6;
/** Uniform visual scale: approximately 10px wider at the popup's task-list width. */
const TASK_ROW_VISUAL_SCALE = 1.032;
const s = (px: number) => Math.round(px * TASK_ROW_SCALE);

const CARD_OUTLINE_PX = s(7);
/** Outer task panel corner radius (all states). */
const CARD_BORDER_RADIUS_PX = s(60);
const ICON_BOX_BORDER_RADIUS_PX = s(40);
const BROWN_ACCENT = '#765041';
const PROGRESS_GREEN = '#62863b';
const DESCRIPTION_HIGHLIGHT_GREEN = PROGRESS_GREEN;

function renderTaskDescription(
  template: string,
  values?: Record<string, number | string>,
): React.ReactNode {
  const segments = template.split(/(\{[a-z]+\})/g);
  return segments.map((segment, i) => {
    const match = segment.match(/^\{([a-z]+)\}$/);
    if (match && values && values[match[1]] != null) {
      return (
        <span key={i} style={{ color: DESCRIPTION_HIGHLIGHT_GREEN, fontWeight: 700 }}>
          {values[match[1]]}
        </span>
      );
    }
    return <React.Fragment key={i}>{segment}</React.Fragment>;
  });
}

const PROGRESS_PILL = {
  bg: '#c5db6e',
  border: '#9eb643',
  iconCircleBorder: PROGRESS_GREEN,
  text: PROGRESS_GREEN,
  iconBg: '#4a6b1e',
} as const;

const IN_PROGRESS_THEME = {
  cardBorder: '#e9dcaf',
  cardFill: '#f4e6b9',
  title: BROWN_ACCENT,
  description: '#c2b280',
  iconBg: BROWN_ACCENT,
  iconBorder: '#e9dcaf',
  progressFill: '#fcf0c7',
  progressBorder: '#e8dbae',
  progressText: BROWN_ACCENT,
  rewardFill: '#fcf0c7',
  rewardBorder: '#e8dbae',
  rewardText: BROWN_ACCENT,
} as const;

const COMPLETE_THEME = {
  cardBorder: '#c9dc62',
  cardFill: '#f2ecb3',
  title: '#4a6b1e',
  description: '#9eb643',
  iconBg: BROWN_ACCENT,
  iconBorder: '#c4d385',
  progressFill: '#c9dc62',
  progressBorder: '#9eb643',
  progressText: PROGRESS_GREEN,
  rewardFill: '#fcf0c7',
  rewardBorder: '#c9dc62',
  rewardText: BROWN_ACCENT,
} as const;

const CLAIMED_THEME = {
  cardBorder: '#9ab948',
  cardFill: '#d6e17b',
  title: '#4a6b1e',
  description: '#9eb643',
  iconBg: BROWN_ACCENT,
  iconBorder: '#9ab948',
  progressFill: '#d6e17b',
  progressBorder: '#9eb643',
  progressText: PROGRESS_GREEN,
  rewardFill: '#d6e17b',
  rewardBorder: '#9eb643',
  rewardText: PROGRESS_GREEN,
} as const;

function getRowTheme(state: DailyTaskRowState) {
  if (state === 'claimed') return CLAIMED_THEME;
  if (state === 'complete') return COMPLETE_THEME;
  return IN_PROGRESS_THEME;
}

const GREEN_CLAIM = {
  bg: '#c7dc61',
  border: '#8fb33a',
  text: PROGRESS_GREEN,
  pressedBg: '#9fc044',
} as const;

const ORANGE_CLAIM_2X = {
  bg: '#ffd856',
  border: '#f59d42',
  text: '#c76b28',
  pressedBg: '#f0c840',
} as const;

/** Upgrade list — unaffordable purchase button (UpgradeList.tsx). */
const CLAIM_DISABLED = {
  bg: '#e3c28c',
  border: '#c7a36e',
  text: '#a68e64',
  pressedBg: '#e3c28c',
} as const;

const ICON_WATCH_AD = assetPath('/assets/icons/generic_buttons/icon_watchad.png');
const ICON_KEY_SMALL = assetPath('/assets/icons/coins/icon_key_small.png');
const ICON_TICK = assetPath('/assets/ui/icon_tick.png');
const ICON_TICK_BROWN = assetPath('/assets/ui/icon_tick_brown.png');
const TASKS_COMPLETE_TICK = assetPath('/assets/ui/tasks_complete_tick.png');
const DAILY_TASK_IN_PROGRESS_BACKGROUND = assetPath(
  '/assets/ui/generic/dailytask_inprogress.png',
);
const DAILY_TASK_COMPLETE_BACKGROUND = assetPath('/assets/ui/generic/dailytask_complete.png');
const DAILY_TASK_CLAIMED_BACKGROUND = assetPath('/assets/ui/generic/dailytask_claimed.png');

const ICON_BOX_SCALE = 1.1 * 0.95 * 1.12;
const ICON_BOX_PX = s(Math.round(128 * ICON_BOX_SCALE));
const ICON_IMG_PX = s(Math.round(88 * ICON_BOX_SCALE * 1.2 * 0.9));

const BUTTON_W_PX = s(Math.round(200 * 1.2 * 1.1 * 1.15));
const BUTTON_H_PX = s(Math.round(72 * 1.2 * 1.1 * 1.06));
const BUTTON_GAP_PX = s(26);
const BUTTON_LABEL_PX = 26;
const WATCH_AD_ICON_PX = s(Math.round(32 * 1.2 * 1.5));
const BUTTON_BORDER_PX = 7 * TASK_ROW_SCALE - 0.5;
const BUTTON_BEVEL_DEPTH_PX = s(8);
const BUTTON_RADIUS_PX = s(26);

const PILL_MIN_H_PX = s(76);
const PILL_BORDER_PX = s(5);
const PILL_ICON_PX = s(44);
const REWARD_KEY_ICON_PX = s(Math.round(44 * 1.18));
const PILL_TICK_PX = s(Math.round(22 * 1.3 * 1.35 * 1.1));
/** Claimed-state large tick — 10% smaller than default slot, nudged right. */
const CLAIMED_TICK_SIZE_SCALE = 0.8 * 0.9;
const CLAIMED_TICK_NUDGE_X_PX = s(10);
const PILL_FONT_PX = s(40);
const PILL_PAD_X_LEFT_PX = s(12);
const PILL_PAD_X_RIGHT_PX = s(24);
const PILL_PAD_Y_PX = s(12);
const PILL_INNER_GAP_PX = s(10);
const PILL_ROW_GAP_PX = s(12);
const TOP_ROW_GAP_PX = s(16);
const TOP_TO_PILLS_GAP_PX = s(14);

const sharedPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  boxSizing: 'border-box',
  borderRadius: 9999,
  paddingLeft: PILL_PAD_X_LEFT_PX,
  paddingRight: PILL_PAD_X_RIGHT_PX,
  paddingTop: PILL_PAD_Y_PX,
  paddingBottom: PILL_PAD_Y_PX,
  gap: PILL_INNER_GAP_PX,
  minHeight: PILL_MIN_H_PX,
  height: PILL_MIN_H_PX,
};

function bevelButtonStyle(
  palette: { bg: string; border: string; pressedBg: string },
  pressed: boolean,
  widthPx: number,
  heightPx: number,
): React.CSSProperties {
  return {
    width: widthPx,
    height: heightPx,
    backgroundColor: pressed ? palette.pressedBg : palette.bg,
    border: `${BUTTON_BORDER_PX}px solid ${palette.border}`,
    borderRadius: `${BUTTON_RADIUS_PX}px`,
    boxShadow: pressed
      ? `inset 0 ${s(5)}px ${s(10)}px rgba(0,0,0,0.15)`
      : `0 ${BUTTON_BEVEL_DEPTH_PX}px 0 ${palette.border}`,
    transform: pressed ? `translateY(${BUTTON_BEVEL_DEPTH_PX}px)` : 'translateY(0)',
  };
}

function labelStyle(color: string, fontPx: number): React.CSSProperties {
  return {
    color,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 800,
    fontSize: `${fontPx}px`,
    lineHeight: 1,
    textShadow: '0 1px 0 rgba(255,255,255,0.25)',
  };
}

export const DailyTaskRow: React.FC<DailyTaskRowProps> = ({
  id,
  state,
  title,
  description,
  descriptionValues,
  progressCurrent,
  progressTotal,
  rewardKeys,
  iconSrc,
  claimBounceActive = false,
  ftueClaimTarget = false,
  onClaim,
  onClaim2x,
}) => {
  const [claim2xPressed, setClaim2xPressed] = useState(false);
  const [claimPressed, setClaimPressed] = useState(false);
  const rowRef = useRef<HTMLElement>(null);
  const rewardPillRef = useRef<HTMLDivElement>(null);

  const theme = getRowTheme(state);
  const isClaimed = state === 'claimed';
  const isComplete = state === 'complete';
  const isInProgress = state === 'in_progress';
  const canClaim = isComplete;
  const taskBackground =
    state === 'claimed'
      ? DAILY_TASK_CLAIMED_BACKGROUND
      : state === 'complete'
        ? DAILY_TASK_COMPLETE_BACKGROUND
        : DAILY_TASK_IN_PROGRESS_BACKGROUND;
  const showCompleteProgressTick = isComplete || isClaimed;
  const displayCurrent = showCompleteProgressTick ? progressTotal : progressCurrent;
  const progressLabel = `${displayCurrent}/${progressTotal}`;
  const progressPercent =
    progressTotal > 0 ? Math.max(0, Math.min(100, (displayCurrent / progressTotal) * 100)) : 0;

  const claimPalette = canClaim ? GREEN_CLAIM : CLAIM_DISABLED;
  const claim2xPalette = canClaim ? ORANGE_CLAIM_2X : CLAIM_DISABLED;
  const completeClaimButtonHeightPx = Math.round(BUTTON_H_PX * 1.08);

  const buttonColHeightPx = BUTTON_H_PX * 2 + BUTTON_GAP_PX;
  const rowMinHeightPx = Math.max(
    ICON_BOX_PX + PILL_MIN_H_PX + TOP_TO_PILLS_GAP_PX,
    buttonColHeightPx,
  ) + s(20) * 2;

  const cardPadPx = s(20);
  const contentRightPadPx =
    isInProgress || isClaimed ? s(160) : BUTTON_W_PX + TOP_ROW_GAP_PX;
  const contentBodyMinHeightPx = rowMinHeightPx - cardPadPx * 2;

  const buildClaimFx = (): DailyTaskClaimFx | null => {
    const rewardEl = rewardPillRef.current;
    const rowEl = rowRef.current;
    if (!rewardEl || !rowEl) return null;
    const rewardRect = rewardEl.getBoundingClientRect();
    const rowRect = rowEl.getBoundingClientRect();
    return {
      rewardCenter: {
        x: rewardRect.left + rewardRect.width / 2,
        y: rewardRect.top + rewardRect.height / 2,
      },
      rowCenter: {
        x: rowRect.left + rowRect.width / 2,
        y: rowRect.top + rowRect.height / 2,
      },
      rowWidth: rowRect.width,
      rowHeight: rowRect.height,
    };
  };

  const fireClaim = () => {
    if (!canClaim || !onClaim) return;
    const fx = buildClaimFx();
    if (fx) onClaim(fx);
  };

  return (
    <article
      ref={rowRef}
      data-daily-task-id={id}
      className={`relative flex w-full flex-col box-border ${claimBounceActive ? 'daily-task-claim-bounce' : ''} ${isClaimed ? 'pointer-events-none' : ''}`}
      style={{
        padding: `${cardPadPx}px`,
        borderRadius: `${CARD_BORDER_RADIUS_PX}px`,
        backgroundColor: 'transparent',
        backgroundImage: `url(${taskBackground})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% auto',
        border: 'none',
        minHeight: rowMinHeightPx,
        transform: `scale(${TASK_ROW_VISUAL_SCALE})`,
        transformOrigin: 'center',
      }}
    >
      <div
        className="flex flex-col w-full box-border shrink-0"
        style={{
          paddingRight: contentRightPadPx,
          minHeight: contentBodyMinHeightPx,
          justifyContent: isClaimed ? 'center' : 'flex-start',
        }}
      >
        <div
          className={`flex flex-row w-full min-w-0 ${isClaimed ? 'items-center' : 'items-start'}`}
          style={{ gap: `${TOP_ROW_GAP_PX}px` }}
        >
          <div
            className="flex items-center justify-center overflow-hidden shrink-0"
            style={{
              width: ICON_BOX_PX,
              height: ICON_BOX_PX,
              borderRadius: `${ICON_BOX_BORDER_RADIUS_PX}px`,
              backgroundColor: 'transparent',
              border: 'none',
              boxShadow: 'none',
            }}
          >
            {iconSrc ? (
              <img
                src={iconSrc}
                alt=""
                className="object-contain"
                draggable={false}
                style={{
                  width: Math.round(ICON_IMG_PX * 0.9),
                  height: Math.round(ICON_IMG_PX * 0.9),
                  transform: `translate(1px, ${isClaimed ? 2 : 7}px)`,
                }}
              />
            ) : null}
          </div>

          {!isComplete ? (
            <div
              className="flex flex-1 flex-col min-w-0 justify-start"
              style={{ transform: `translateY(${isClaimed ? 0 : 15}px)` }}
            >
              <h3
                className="font-black tracking-tight truncate"
                style={{
                  color: theme.title,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '34px',
                  lineHeight: 1.05,
                  transform: 'translate(-4px, 2px)',
                }}
              >
                {title}
              </h3>
              <p
                className="font-semibold tracking-tight leading-[1.1] truncate"
                style={{
                  color: isClaimed ? '#7f9b3f' : theme.description,
                  fontSize: '24px',
                  marginTop: 8,
                  maxWidth: '94%',
                  whiteSpace: 'nowrap',
                  transform: 'translateX(-3px)',
                }}
              >
                {renderTaskDescription(description, descriptionValues)}
              </p>
            </div>
          ) : null}
        </div>

      </div>

      {!isClaimed ? (
        <>
          {/* Sprite-matched progress track. */}
          <div
            className="absolute overflow-hidden"
            style={{
              left: 'calc(4.1% - 4px)',
              top: '70.6%',
              width: 'calc(75% + 6px)',
              height: '18%',
              borderRadius: 9999,
              border: isComplete ? '3.5px solid #9eb643' : 'none',
              boxShadow: isComplete
                ? '0 0 0 4px #f8f1c8'
                : '0 0 0 4px #fff6dc, inset 0 0 0 3.5px rgba(118, 80, 65, 0.3)',
              backgroundColor: '#c6b280',
              boxSizing: 'border-box',
              transform: 'translate(-2px, -6px)',
            }}
            aria-label={`${progressLabel} complete`}
          >
            <div
              className="absolute inset-y-0 left-0"
              style={{
                top: 0,
                bottom: 0,
                left: 0,
                width: `${progressPercent}%`,
                backgroundColor: '#c7dc61',
                border:
                  !isComplete && progressPercent > 0 ? '3.5px solid #9eb643' : 'none',
                borderRadius: 9999,
                boxSizing: 'border-box',
                boxShadow: 'none',
                zIndex: 1,
              }}
            />
            <span
              className="absolute inset-0 flex items-center justify-center font-black tabular-nums"
              style={{
                color: isComplete ? PROGRESS_GREEN : BROWN_ACCENT,
                fontFamily: 'Inter, sans-serif',
                fontSize: '20px',
                lineHeight: 1,
                zIndex: 2,
              }}
            >
              {progressLabel}
            </span>
          </div>

          {/* Dynamic reward laid directly over the guide art's right-hand reward section. */}
          <div
            ref={rewardPillRef}
            data-daily-task-reward
            className="absolute flex flex-col items-center pointer-events-none"
            style={{
              right: '3.3%',
              top: '17%',
              width: '15.5%',
              height: '70%',
            }}
          >
            <img
              src={assetPath('/assets/icons/coins/icon_key_dailytask.png')}
              alt=""
              className="absolute object-contain"
              draggable={false}
              style={{
                top: 1,
                width: '79.2%',
                height: '68.2%',
                transform: 'rotate(0deg)',
              }}
            />
            <span
              className="absolute flex items-center justify-center font-black tabular-nums"
              style={{
                left: '10%',
                right: '10%',
                bottom: 4,
                height: '34%',
                color: '#fff6dc',
                fontFamily: 'Inter, sans-serif',
                fontSize: '26px',
                lineHeight: 1,
                WebkitTextStroke: '2px #9f895d',
                paintOrder: 'stroke fill',
                textShadow:
                  '1px 0 #9f895d, -1px 0 #9f895d, 0 1px #9f895d, 0 -1px #9f895d',
              }}
            >
              {rewardKeys.toLocaleString()}
            </span>
          </div>
        </>
      ) : null}

      <div
        className="absolute flex items-center justify-center pointer-events-none"
        style={{
          left: isComplete ? '17%' : undefined,
          right: isComplete ? undefined : cardPadPx,
          top: isComplete ? '17%' : '50%',
          transform: isComplete ? 'none' : 'translateY(calc(-50% - 1px))',
          width: isComplete ? '62%' : BUTTON_W_PX,
          flexDirection: isComplete ? 'row' : 'column',
          gap: `${BUTTON_GAP_PX}px`,
          height: isComplete ? completeClaimButtonHeightPx : buttonColHeightPx,
        }}
      >
        {isInProgress || isClaimed ? null : (
          <>
            <button
              type="button"
              id={
                ftueClaimTarget
                  ? id
                    ? getTasksFtueClaim2xButtonId(id)
                    : TASKS_FTUE_CLAIM_2X_BUTTON_ID
                  : undefined
              }
              disabled={!canClaim}
              onClick={() => {
                if (!canClaim || !onClaim2x) return;
                const fx = buildClaimFx();
                if (fx) onClaim2x(fx);
              }}
              aria-label="Claim 2x reward"
              onMouseDown={() => canClaim && setClaim2xPressed(true)}
              onMouseUp={() => setClaim2xPressed(false)}
              onMouseLeave={() => setClaim2xPressed(false)}
              className={`relative flex items-center justify-center transition-all ${canClaim ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none cursor-default'}`}
              style={{
                ...bevelButtonStyle(
                  claim2xPalette,
                  claim2xPressed && canClaim,
                  BUTTON_W_PX,
                  completeClaimButtonHeightPx,
                ),
                gap: `${s(8)}px`,
              }}
              aria-disabled={!canClaim}
            >
              <span
                className="shrink-0"
                aria-hidden
                style={{
                  width: WATCH_AD_ICON_PX,
                  height: WATCH_AD_ICON_PX,
                  backgroundColor: claim2xPalette.text,
                  maskImage: `url(${ICON_WATCH_AD})`,
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskImage: `url(${ICON_WATCH_AD})`,
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                }}
              />
              <span style={labelStyle(claim2xPalette.text, BUTTON_LABEL_PX)}>Claim 2x</span>
            </button>
            <button
              type="button"
              id={
                ftueClaimTarget
                  ? id
                    ? getTasksFtueClaimButtonId(id)
                    : TASKS_FTUE_CLAIM_BUTTON_ID
                  : undefined
              }
              disabled={!canClaim}
              onClick={fireClaim}
              aria-label="Claim reward"
              onMouseDown={() => canClaim && setClaimPressed(true)}
              onMouseUp={() => setClaimPressed(false)}
              onMouseLeave={() => setClaimPressed(false)}
              className={`relative flex items-center justify-center transition-all ${canClaim ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none cursor-default'}`}
              style={bevelButtonStyle(
                claimPalette,
                claimPressed && canClaim,
                BUTTON_W_PX,
                completeClaimButtonHeightPx,
              )}
              aria-disabled={!canClaim}
            >
              <span style={labelStyle(claimPalette.text, BUTTON_LABEL_PX)}>Claim</span>
            </button>
          </>
        )}
      </div>
    </article>
  );
};

/** Preview rows for layout tuning (Storybook / popup default). */
export const DAILY_TASK_ROW_PREVIEW: DailyTaskDefinition[] = [
  {
    id: 'preview-starter-pack',
    state: 'claimed',
    title: 'Starter Pack',
    description: 'Collect thorny rose crops in 1 round.',
    progressCurrent: 5,
    progressTotal: 5,
    rewardKeys: 5,
    iconSrc: assetPath('/assets/icons/store/icon_starterpack.png'),
  },
  {
    id: 'preview-harvest-boost',
    state: 'complete',
    title: 'Harvest Boost',
    description: 'Harvest crops from your garden.',
    progressCurrent: 10,
    progressTotal: 10,
    rewardKeys: 10,
    iconSrc: assetPath('/assets/icons/upgrades/icon_harvest.png'),
  },
  {
    id: 'preview-lucky-seed',
    state: 'in_progress',
    title: 'Lucky Seed',
    description: 'Merge seeds in a single session.',
    progressCurrent: 1,
    progressTotal: 3,
    rewardKeys: 15,
    iconSrc: assetPath('/assets/icons/upgrades/icon_luckyseed.png'),
  },
];
