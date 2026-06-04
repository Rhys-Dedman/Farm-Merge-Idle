/**
 * Single daily-task row — in-progress, complete (claimable), and claimed states.
 * Sized for the Daily Tasks popup prescale panel (0.5×); tweak TASK_ROW_SCALE to resize every row.
 */
import React, { useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import { REWARD_PILL_FILL_COLOR, REWARD_PILL_STROKE_COLOR } from './Reward';

export type DailyTaskRowState = 'in_progress' | 'complete' | 'claimed';

export interface DailyTaskClaimFx {
  rewardCenter: { x: number; y: number };
  rowCenter: { x: number; y: number };
  /** Task card size for popup-style rectangular leaf burst (viewport px). */
  rowWidth: number;
  rowHeight: number;
}

export interface DailyTaskRowProps {
  state: DailyTaskRowState;
  title: string;
  description: string;
  progressCurrent: number;
  progressTotal: number;
  rewardCoins: number;
  iconSrc?: string;
  claimBounceActive?: boolean;
  onClaim?: (fx: DailyTaskClaimFx) => void;
  onClaim2x?: (fx: DailyTaskClaimFx) => void;
}

export interface DailyTaskDefinition extends DailyTaskRowProps {
  id: string;
}

/** ~40% smaller than initial layout — change here to rescale all task rows. */
const TASK_ROW_SCALE = 0.6;
const s = (px: number) => Math.round(px * TASK_ROW_SCALE);

const CARD_OUTLINE_PX = s(7);
/** Outer task panel corner radius (all states). */
const CARD_BORDER_RADIUS_PX = s(60);
const ICON_BOX_BORDER_RADIUS_PX = s(40);
const BROWN_ACCENT = '#765041';
const PROGRESS_GREEN = '#62863b';

const PROGRESS_PILL = {
  bg: '#c5db6e',
  border: '#9eb643',
  iconCircleBorder: PROGRESS_GREEN,
  text: PROGRESS_GREEN,
  iconBg: '#4a6b1e',
} as const;

const IN_PROGRESS_THEME = {
  cardBorder: '#e9dcaf',
  cardFill: 'transparent',
  title: BROWN_ACCENT,
  description: '#c2b280',
  iconBg: BROWN_ACCENT,
  iconBorder: '#e9dcaf',
  progressFill: REWARD_PILL_FILL_COLOR,
  progressBorder: REWARD_PILL_STROKE_COLOR,
  progressText: BROWN_ACCENT,
  rewardFill: REWARD_PILL_FILL_COLOR,
  rewardBorder: REWARD_PILL_STROKE_COLOR,
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
  rewardFill: '#f4e6b9',
  rewardBorder: '#dbc899',
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
  bg: '#b8d458',
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

const ICON_COIN = assetPath('/assets/icons/coins/icon_coin_small.png');
const ICON_WATCH_AD = assetPath('/assets/icons/generic_buttons/icon_watchad.png');
const ICON_TICK = assetPath('/assets/ui/icon_tick.png');
const ICON_TICK_BROWN = assetPath('/assets/ui/icon_tick_brown.png');
const TASKS_COMPLETE_TICK = assetPath('/assets/ui/tasks_complete_tick.png');

const ICON_BOX_SCALE = 1.1 * 0.95;
const ICON_BOX_PX = s(Math.round(128 * ICON_BOX_SCALE));
const ICON_IMG_PX = s(Math.round(88 * ICON_BOX_SCALE * 1.2 * 0.9));

const BUTTON_W_PX = s(Math.round(200 * 1.2 * 1.1));
const BUTTON_H_PX = s(Math.round(72 * 1.2 * 1.1));
const BUTTON_GAP_PX = s(26);
const BUTTON_LABEL_PX = s(Math.round(28 * 1.2 * 1.08));
const WATCH_AD_ICON_PX = s(Math.round(32 * 1.2 * 1.5));
const BUTTON_BORDER_PX = 7 * TASK_ROW_SCALE - 0.5;
const BUTTON_BEVEL_DEPTH_PX = s(8);
const BUTTON_RADIUS_PX = s(26);

const PILL_MIN_H_PX = s(76);
const PILL_BORDER_PX = s(5);
const PILL_ICON_PX = s(44);
const REWARD_COIN_ICON_PX = s(Math.round(44 * 1.18));
const PILL_TICK_PX = s(Math.round(22 * 1.3 * 1.35 * 1.1));
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
      : `0 ${BUTTON_BEVEL_DEPTH_PX}px 0 ${palette.border}, 0 ${s(10)}px ${s(18)}px rgba(0,0,0,0.12)`,
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
  state,
  title,
  description,
  progressCurrent,
  progressTotal,
  rewardCoins,
  iconSrc,
  claimBounceActive = false,
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
  const canClaim = isComplete;
  const showCompleteProgressTick = isComplete || isClaimed;
  const displayCurrent = showCompleteProgressTick ? progressTotal : progressCurrent;
  const progressLabel = `${displayCurrent}/${progressTotal}`;

  const claimPalette = canClaim ? GREEN_CLAIM : CLAIM_DISABLED;
  const claim2xPalette = canClaim ? ORANGE_CLAIM_2X : CLAIM_DISABLED;

  const progressPillBg = theme.progressFill;
  const progressPillBorder = theme.progressBorder;
  const progressPillText = theme.progressText;

  const buttonColHeightPx = BUTTON_H_PX * 2 + BUTTON_GAP_PX;
  const rowMinHeightPx = Math.max(
    ICON_BOX_PX + PILL_MIN_H_PX + TOP_TO_PILLS_GAP_PX,
    buttonColHeightPx,
  ) + s(20) * 2;

  const cardPadPx = s(20);
  const contentRightPadPx = BUTTON_W_PX + TOP_ROW_GAP_PX;
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
      className={`relative flex w-full flex-col box-border ${claimBounceActive ? 'daily-task-claim-bounce' : ''} ${isClaimed ? 'pointer-events-none' : ''}`}
      style={{
        padding: `${cardPadPx}px`,
        borderRadius: `${CARD_BORDER_RADIUS_PX}px`,
        backgroundColor: theme.cardFill,
        border: `${CARD_OUTLINE_PX}px solid ${theme.cardBorder}`,
        minHeight: rowMinHeightPx,
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
              backgroundColor: theme.iconBg,
              border: `${s(3)}px solid ${theme.iconBorder}`,
              boxShadow: `inset 0 ${s(2)}px ${s(6)}px rgba(0,0,0,0.2)`,
            }}
          >
            {iconSrc ? (
              <img
                src={iconSrc}
                alt=""
                className="object-contain"
                draggable={false}
                style={{ width: ICON_IMG_PX, height: ICON_IMG_PX }}
              />
            ) : null}
          </div>

          <div className="flex flex-1 flex-col min-w-0 justify-start" style={{ gap: `${s(6)}px` }}>
            <h3
              className="font-black tracking-tight truncate"
              style={{
                color: theme.title,
                fontFamily: 'Inter, sans-serif',
                fontSize: `${s(48)}px`,
                lineHeight: 1.05,
              }}
            >
              {title}
            </h3>
            <p
              className="font-medium leading-snug"
              style={{
                color: theme.description,
                fontFamily: 'Inter, sans-serif',
                fontSize: `${s(32)}px`,
                lineHeight: 1.25,
              }}
            >
              {description}
            </p>
          </div>
        </div>

        {!isClaimed ? (
        <div
          className="flex flex-row items-stretch justify-start w-full shrink-0"
          style={{
            gap: `${PILL_ROW_GAP_PX}px`,
            marginTop: `${TOP_TO_PILLS_GAP_PX}px`,
          }}
        >
        <div
          style={{
            ...sharedPillStyle,
            backgroundColor: progressPillBg,
            border: `${PILL_BORDER_PX}px solid ${progressPillBorder}`,
          }}
        >
          {showCompleteProgressTick ? (
            <span
              className="inline-flex items-center justify-center rounded-full shrink-0"
              style={{
                width: PILL_ICON_PX,
                height: PILL_ICON_PX,
                backgroundColor: PROGRESS_PILL.iconBg,
                border: `${s(2)}px solid ${PROGRESS_PILL.iconCircleBorder}`,
              }}
              aria-hidden
            >
              <img
                src={ICON_TICK}
                alt=""
                className="object-contain"
                draggable={false}
                style={{ width: PILL_TICK_PX, height: PILL_TICK_PX }}
              />
            </span>
          ) : (
            <img
              src={ICON_TICK_BROWN}
              alt=""
              className="shrink-0 object-contain"
              draggable={false}
              aria-hidden
              style={{ width: PILL_ICON_PX, height: PILL_ICON_PX }}
            />
          )}
          <span className="font-black tabular-nums" style={labelStyle(progressPillText, PILL_FONT_PX)}>
            {progressLabel}
          </span>
        </div>

        <div
          ref={rewardPillRef}
          style={{
            ...sharedPillStyle,
            backgroundColor: theme.rewardFill,
            border: `${PILL_BORDER_PX}px solid ${theme.rewardBorder}`,
          }}
        >
          <img
            src={ICON_COIN}
            alt=""
            className="shrink-0 object-contain"
            style={{ width: REWARD_COIN_ICON_PX, height: REWARD_COIN_ICON_PX }}
          />
          <span className="font-black tabular-nums" style={labelStyle(theme.rewardText, PILL_FONT_PX)}>
            {rewardCoins.toLocaleString()}
          </span>
        </div>
        </div>
        ) : null}
      </div>

      <div
        className="absolute flex flex-col items-center justify-center pointer-events-none"
        style={{
          right: cardPadPx,
          top: '50%',
          transform: 'translateY(-50%)',
          width: BUTTON_W_PX,
          gap: `${BUTTON_GAP_PX}px`,
          height: buttonColHeightPx,
        }}
      >
        {isClaimed ? (
          <img
            src={TASKS_COMPLETE_TICK}
            alt=""
            className="object-contain shrink-0"
            draggable={false}
            aria-hidden
            style={{
              width: Math.round(BUTTON_W_PX * 0.8),
              height: Math.round(buttonColHeightPx * 0.8),
              maxHeight: '100%',
            }}
          />
        ) : (
          <>
            <button
              type="button"
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
                ...bevelButtonStyle(claim2xPalette, claim2xPressed && canClaim, BUTTON_W_PX, BUTTON_H_PX),
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
              disabled={!canClaim}
              onClick={fireClaim}
              aria-label="Claim reward"
              onMouseDown={() => canClaim && setClaimPressed(true)}
              onMouseUp={() => setClaimPressed(false)}
              onMouseLeave={() => setClaimPressed(false)}
              className={`relative flex items-center justify-center transition-all ${canClaim ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none cursor-default'}`}
              style={bevelButtonStyle(claimPalette, claimPressed && canClaim, BUTTON_W_PX, BUTTON_H_PX)}
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
    description: 'Collect 5 thorny rose crops in 1 round.',
    progressCurrent: 5,
    progressTotal: 5,
    rewardCoins: 1000,
    iconSrc: assetPath('/assets/icons/store/icon_starterpack.png'),
  },
  {
    id: 'preview-harvest-boost',
    state: 'complete',
    title: 'Harvest Boost',
    description: 'Harvest 10 crops from your garden.',
    progressCurrent: 10,
    progressTotal: 10,
    rewardCoins: 500,
    iconSrc: assetPath('/assets/icons/upgrades/icon_harvest.png'),
  },
  {
    id: 'preview-lucky-seed',
    state: 'in_progress',
    title: 'Lucky Seed',
    description: 'Merge 3 seeds in a single session.',
    progressCurrent: 1,
    progressTotal: 3,
    rewardCoins: 250,
    iconSrc: assetPath('/assets/icons/upgrades/icon_luckyseed.png'),
  },
];
