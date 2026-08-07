import React from 'react';
import {
  SPECIAL_DELIVERY_DOOR_ART_SIZE_PX,
  SPECIAL_DELIVERY_DOOR_CELL_CENTERS_ART_PX,
  SPECIAL_DELIVERY_DOOR_CLOSED_SRC,
  SPECIAL_DELIVERY_LOCK_ART_SIZE_PX,
  SPECIAL_DELIVERY_LOCK_PIVOT_X,
  SPECIAL_DELIVERY_LOCK_PIVOT_Y,
  SPECIAL_DELIVERY_LOCK_SRC,
  SPECIAL_DELIVERY_LOCK_SWING_MS,
  SPECIAL_DELIVERY_PANEL_ART_HEIGHT_PX,
  SPECIAL_DELIVERY_PANEL_ART_WIDTH_PX,
} from '../constants/specialDeliveries';
import { assetPath } from '../utils/assetPath';

interface SpecialDeliveryClosedDoorsPreviewProps {
  animateLocks?: boolean;
}

function artPercentX(artX: number): string {
  return `${(artX / SPECIAL_DELIVERY_PANEL_ART_WIDTH_PX) * 100}%`;
}

function artPercentY(artY: number): string {
  return `${(artY / SPECIAL_DELIVERY_PANEL_ART_HEIGHT_PX) * 100}%`;
}

/** Static closed-door preview used during the locked-panel FTUE reveal. */
export const SpecialDeliveryClosedDoorsPreview: React.FC<
  SpecialDeliveryClosedDoorsPreviewProps
> = ({ animateLocks = false }) => (
  <>
    {SPECIAL_DELIVERY_DOOR_CELL_CENTERS_ART_PX.map(([cx, cy], doorIndex) => (
      <div
        key={`sd-closed-preview-${doorIndex}`}
        className="absolute pointer-events-none"
        style={{
          left: artPercentX(cx - SPECIAL_DELIVERY_DOOR_ART_SIZE_PX / 2),
          top: artPercentY(cy - SPECIAL_DELIVERY_DOOR_ART_SIZE_PX / 2),
          width: artPercentX(SPECIAL_DELIVERY_DOOR_ART_SIZE_PX),
          aspectRatio: '1 / 1',
        }}
      >
        <img
          src={assetPath(SPECIAL_DELIVERY_DOOR_CLOSED_SRC)}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            width: `${
              (SPECIAL_DELIVERY_LOCK_ART_SIZE_PX / SPECIAL_DELIVERY_DOOR_ART_SIZE_PX) * 100
            }%`,
            aspectRatio: '1 / 1',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <img
            key={`sd-closed-preview-lock-${doorIndex}-${animateLocks ? 'shake' : 'idle'}`}
            src={assetPath(SPECIAL_DELIVERY_LOCK_SRC)}
            alt=""
            className={`absolute inset-0 h-full w-full object-contain${
              animateLocks ? ' special-delivery-lock-swing' : ''
            }`}
            style={{
              transformOrigin: `${SPECIAL_DELIVERY_LOCK_PIVOT_X * 100}% ${
                SPECIAL_DELIVERY_LOCK_PIVOT_Y * 100
              }%`,
              ...(animateLocks
                ? { animationDuration: `${SPECIAL_DELIVERY_LOCK_SWING_MS}ms` }
                : {}),
            }}
            draggable={false}
          />
        </div>
      </div>
    ))}
  </>
);
