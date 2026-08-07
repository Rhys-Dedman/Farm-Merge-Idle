import React, { useEffect, useState } from 'react';
import {
  SPECIAL_DELIVERY_LARGE_LOCK_ART_SIZE_PX,
  SPECIAL_DELIVERY_LARGE_LOCK_CENTER_ART_PX,
  SPECIAL_DELIVERY_LARGE_LOCK_NUDGE_DOWN_PX,
  SPECIAL_DELIVERY_LARGE_LOCK_SRC,
  SPECIAL_DELIVERY_LOCKED_FTUE_LOCK_ID,
  SPECIAL_DELIVERY_LOCK_PIVOT_X,
  SPECIAL_DELIVERY_LOCK_PIVOT_Y,
  SPECIAL_DELIVERY_LOCK_SWING_MS,
  SPECIAL_DELIVERY_PANEL_ART_HEIGHT_PX,
  SPECIAL_DELIVERY_PANEL_ART_WIDTH_PX,
} from '../constants/specialDeliveries';
import { assetPath } from '../utils/assetPath';

const ENTRY_SWING_DELAY_MS = 150;

interface SpecialDeliveryLockedPanelLockProps {
  /** True while Collection is the visible carousel screen. */
  active: boolean;
  /** Hide the resting lock (e.g. while knock-off is flying / FTUE unlocked). */
  visible?: boolean;
  /**
   * When true, tap requests FTUE unlock instead of the idle swing + Level 6 bounce.
   * Entry swing is also skipped so the finger teach stays clean.
   */
  ftueUnlockMode?: boolean;
  /** Fired only for a player tap, not the automatic entry swing. */
  onTap?: () => void;
}

/**
 * Large lock over the crossed vines. It reuses the door-lock pivot and swing exactly,
 * swinging once whenever Collection enters and whenever the lock is tapped (idle mode).
 */
export const SpecialDeliveryLockedPanelLock: React.FC<
  SpecialDeliveryLockedPanelLockProps
> = ({ active, visible = true, ftueUnlockMode = false, onTap }) => {
  const [swingGen, setSwingGen] = useState(0);

  useEffect(() => {
    if (!active || !visible || ftueUnlockMode) return;
    const timeout = window.setTimeout(() => {
      setSwingGen((gen) => gen + 1);
    }, ENTRY_SWING_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [active, visible, ftueUnlockMode]);

  if (!visible) return null;

  const [centerX, centerY] = SPECIAL_DELIVERY_LARGE_LOCK_CENTER_ART_PX;
  const lockWidthPercent =
    (SPECIAL_DELIVERY_LARGE_LOCK_ART_SIZE_PX / SPECIAL_DELIVERY_PANEL_ART_WIDTH_PX) * 100;

  return (
    <button
      id={SPECIAL_DELIVERY_LOCKED_FTUE_LOCK_ID}
      type="button"
      aria-label="Special Deliveries locked"
      onClick={() => {
        if (!ftueUnlockMode) {
          setSwingGen((gen) => gen + 1);
        }
        onTap?.();
      }}
      className="absolute border-0 bg-transparent p-0"
      style={{
        left: `${(centerX / SPECIAL_DELIVERY_PANEL_ART_WIDTH_PX) * 100}%`,
        top: `calc(${(centerY / SPECIAL_DELIVERY_PANEL_ART_HEIGHT_PX) * 100}% + ${SPECIAL_DELIVERY_LARGE_LOCK_NUDGE_DOWN_PX}px)`,
        width: `${lockWidthPercent}%`,
        aspectRatio: '1 / 1',
        transform: 'translate(-50%, -50%)',
        zIndex: 3,
        pointerEvents: active ? 'auto' : 'none',
        cursor: active ? 'pointer' : 'default',
      }}
    >
      <img
        key={`special-delivery-large-lock-${swingGen}`}
        src={assetPath(SPECIAL_DELIVERY_LARGE_LOCK_SRC)}
        alt=""
        className={`absolute inset-0 h-full w-full object-contain${
          !ftueUnlockMode && swingGen > 0 ? ' special-delivery-lock-swing' : ''
        }`}
        style={{
          transformOrigin: `${SPECIAL_DELIVERY_LOCK_PIVOT_X * 100}% ${
            SPECIAL_DELIVERY_LOCK_PIVOT_Y * 100
          }%`,
          ...(!ftueUnlockMode && swingGen > 0
            ? { animationDuration: `${SPECIAL_DELIVERY_LOCK_SWING_MS}ms` }
            : {}),
        }}
        draggable={false}
      />
    </button>
  );
};
