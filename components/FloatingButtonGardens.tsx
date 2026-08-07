import React, { useEffect, useState } from 'react';
import { type GardenId } from '../constants/gardens';
import { FloatingButton } from './FloatingButton';
import {
  getGardensFloatingButtonIconSrc,
  getGardensFloatingButtonVisual,
  shouldShowGardensFloatingButtonNotification,
} from '../utils/gardenPickerFloatingButton';
import type { GardenState } from '../types/gardenState';

export interface FloatingButtonGardensProps {
  garden1PlayerLevel: number;
  unlockLevel: number;
  gardensStarted: readonly GardenId[];
  activeGardenId: GardenId;
  activeMoney: number;
  gardens?: Partial<Record<GardenId, GardenState>>;
  /** Increment to replay ready bounce + particles when a garden update becomes available. */
  readyBounceNonce?: number;
  /** FTUE: keep locked chrome until unlock bounce reveals the normal icon. */
  forceLockedVisual?: boolean;
  /** Force the notification dot (e.g. other-garden Special Delivery claim pending). */
  forceShowNotificationDot?: boolean;
  gardenId?: GardenId;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const FloatingButtonGardens: React.FC<FloatingButtonGardensProps> = ({
  garden1PlayerLevel,
  unlockLevel,
  gardensStarted,
  activeGardenId,
  activeMoney,
  gardens,
  readyBounceNonce = 0,
  forceLockedVisual = false,
  forceShowNotificationDot = false,
  gardenId,
  onClick,
  className,
  style,
}) => {
  const visual = getGardensFloatingButtonVisual(
    garden1PlayerLevel,
    unlockLevel,
    gardensStarted,
    activeGardenId,
    activeMoney,
    gardens,
    forceLockedVisual,
  );
  const showNotificationDot =
    forceShowNotificationDot ||
    shouldShowGardensFloatingButtonNotification(
      garden1PlayerLevel,
      unlockLevel,
      gardensStarted,
      activeGardenId,
      activeMoney,
      gardens,
      forceLockedVisual,
    );
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
      title="Gardens"
      locked={locked}
      unlockLevel={unlockLevel}
      iconSrc={getGardensFloatingButtonIconSrc(visual)}
      showNotificationDot={showNotificationDot}
      readyBounceActive={readyBounceActive}
      gardenId={gardenId}
      onClick={onClick}
      className={className}
      style={style}
    />
  );
};
