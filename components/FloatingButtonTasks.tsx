import React, { useEffect, useState } from 'react';
import { FloatingButton } from './FloatingButton';
import {
  getTasksFloatingButtonIconSrc,
  getTasksFloatingButtonVisual,
  type TasksFloatingButtonVisual,
} from '../utils/dailyTasksProgress';
import { TASKS_FLOATING_BUTTON_UNLOCK_LEVEL } from '../constants/playerLevelUnlocks';
import type { DailyTaskDefinition } from './DailyTaskRow';

export interface FloatingButtonTasksProps {
  tasksUnlocked: boolean;
  unlockLevel?: number;
  tasks: DailyTaskDefinition[];
  /** Increment to replay ready bounce (even if icon stays on "claim"). */
  readyBounceNonce?: number;
  /** FTUE: keep locked chrome until unlock bounce reveals the normal icon. */
  forceLockedVisual?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const FloatingButtonTasks: React.FC<FloatingButtonTasksProps> = ({
  tasksUnlocked,
  unlockLevel = TASKS_FLOATING_BUTTON_UNLOCK_LEVEL,
  tasks,
  readyBounceNonce = 0,
  forceLockedVisual = false,
  onClick,
  className,
  style,
}) => {
  const visual: TasksFloatingButtonVisual = forceLockedVisual
    ? 'locked'
    : getTasksFloatingButtonVisual(tasksUnlocked, tasks);
  const locked = visual === 'locked';
  const [readyBounceActive, setReadyBounceActive] = useState(false);

  useEffect(() => {
    if (readyBounceNonce <= 0) return;
    setReadyBounceActive(true);
    const t = window.setTimeout(() => setReadyBounceActive(false), 200);
    return () => window.clearTimeout(t);
  }, [readyBounceNonce]);

  return (
    <FloatingButton
      title="TASKS"
      locked={locked}
      unlockLevel={unlockLevel}
      iconSrc={getTasksFloatingButtonIconSrc(visual)}
      readyBounceActive={readyBounceActive}
      onClick={onClick}
      className={className}
      style={style}
    />
  );
};
