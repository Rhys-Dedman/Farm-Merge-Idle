/**
 * Daily Tasks popup — 24h countdown strip styled like the store Reward pill row.
 */
import React from 'react';
import { assetPath } from '../utils/assetPath';
import { formatDailyTasksCountdown } from '../utils/dailyTasksCountdown';
import { useDailyTasksCountdown } from '../hooks/useDailyTasksCountdown';
import {
  REWARD_PILL_FILL_COLOR,
  REWARD_PILL_STROKE_COLOR,
  REWARD_PILL_STROKE_WIDTH_PX,
} from './Reward';

const ICON_TIMER = assetPath('/assets/icons/generic_buttons/icon_timer.png');
const TIMER_COLOR = '#795c51';

/** Prescale panel coords (0.5× shell); scaled vs initial timer strip. */
const TIMER_SCALE = 0.7;
const t = (px: number) => Math.round(px * TIMER_SCALE);

const PILL_PAD_LEFT_PX = Math.round(28 * TIMER_SCALE * 0.65);
const PILL_PAD_RIGHT_PX = Math.round(28 * TIMER_SCALE * 0.88);
const PILL_PAD_Y_PX = t(16);
const ICON_PX = t(58);
const ICON_GAP_PX = t(12);
const TIMER_FONT_PX = t(40);
const PILL_STROKE_PX = Math.max(2, Math.round(REWARD_PILL_STROKE_WIDTH_PX * 2 * TIMER_SCALE)) + 1;
const SECTION_MARGIN_BOTTOM_PX = t(30);

export interface DailyTasksTimerPanelProps {
  tasksUnlocked: boolean;
  countdownRefreshKey?: number;
}

export const DailyTasksTimerPanel: React.FC<DailyTasksTimerPanelProps> = ({
  tasksUnlocked,
  countdownRefreshKey = 0,
}) => {
  const remainingMs = useDailyTasksCountdown(tasksUnlocked, countdownRefreshKey);
  const timerLabel = formatDailyTasksCountdown(remainingMs);

  return (
    <div
      className="w-full flex items-center justify-center shrink-0"
      style={{ marginBottom: `${SECTION_MARGIN_BOTTOM_PX}px` }}
      aria-label="Daily tasks reset timer"
    >
      <div
        className="inline-flex items-center box-border rounded-full w-fit max-w-full"
        style={{
          paddingLeft: PILL_PAD_LEFT_PX,
          paddingRight: PILL_PAD_RIGHT_PX,
          paddingTop: PILL_PAD_Y_PX,
          paddingBottom: PILL_PAD_Y_PX,
          gap: ICON_GAP_PX,
          backgroundColor: REWARD_PILL_FILL_COLOR,
          border: `${PILL_STROKE_PX}px solid ${REWARD_PILL_STROKE_COLOR}`,
        }}
      >
        <span
          className="shrink-0"
          aria-hidden
          style={{
            width: ICON_PX,
            height: ICON_PX,
            backgroundColor: TIMER_COLOR,
            maskImage: `url(${ICON_TIMER})`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskImage: `url(${ICON_TIMER})`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
          }}
        />
        <span
          className="font-black tabular-nums whitespace-nowrap"
          style={{
            color: TIMER_COLOR,
            fontFamily: 'Inter, sans-serif',
            fontSize: `${TIMER_FONT_PX}px`,
            lineHeight: 1,
          }}
        >
          {timerLabel}
        </span>
      </div>
    </div>
  );
};
