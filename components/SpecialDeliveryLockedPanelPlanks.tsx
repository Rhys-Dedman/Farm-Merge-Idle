import React from 'react';
import {
  SPECIAL_DELIVERY_LOCKED_PLANK_CENTER_Y_ART_PX,
  SPECIAL_DELIVERY_LOCKED_PLANK_SRCS,
  SPECIAL_DELIVERY_PANEL_ART_HEIGHT_PX,
  SPECIAL_DELIVERY_PANEL_ART_WIDTH_PX,
  SPECIAL_DELIVERY_PLANK_ART_WIDTH_PX,
} from '../constants/specialDeliveries';
import { assetPath } from '../utils/assetPath';

interface SpecialDeliveryLockedPanelPlanksProps {
  /** Match the locked panel fade when the FTUE reveals doors underneath. */
  opacity: number;
  transition: string;
  transitionDelay?: string;
}

/**
 * Boarded-up planks over the locked Special Deliveries panel.
 * Sprites include baked rotation — only horizontal center + vertical art Y are applied.
 */
export const SpecialDeliveryLockedPanelPlanks: React.FC<
  SpecialDeliveryLockedPanelPlanksProps
> = ({ opacity, transition, transitionDelay = '0ms' }) => {
  const widthPercent =
    (SPECIAL_DELIVERY_PLANK_ART_WIDTH_PX / SPECIAL_DELIVERY_PANEL_ART_WIDTH_PX) * 100;

  return (
    <>
      {SPECIAL_DELIVERY_LOCKED_PLANK_SRCS.map((src, index) => {
        const centerY = SPECIAL_DELIVERY_LOCKED_PLANK_CENTER_Y_ART_PX[index]!;
        return (
          <img
            key={src}
            data-sd-locked-plank={index}
            src={assetPath(src)}
            alt=""
            className="absolute left-1/2 pointer-events-none"
            style={{
              top: `${(centerY / SPECIAL_DELIVERY_PANEL_ART_HEIGHT_PX) * 100}%`,
              width: `${widthPercent}%`,
              height: 'auto',
              maxWidth: 'none',
              display: 'block',
              transform: 'translate(-50%, -50%)',
              opacity,
              transition,
              transitionDelay,
              zIndex: 2,
            }}
            draggable={false}
            aria-hidden
          />
        );
      })}
    </>
  );
};
