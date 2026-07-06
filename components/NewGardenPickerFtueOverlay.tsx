/**
 * New Garden FTUE 1 — finger on the View button inside the garden picker; blocks all other input.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import {
  NEW_GARDEN_FTUE_PICKER_BLOCKER_TINT,
  NEW_GARDEN_FTUE_VIEW_BUTTON_ID,
} from '../constants/newGardenFtue';
import { FTUE_VISUAL_SCALE } from '../ftue/ftueTextboxStyles';

const FADE_IN_MS = 400;
const FINGER_SIZE = 270 * FTUE_VISUAL_SCALE;
/** 45° tap stroke — up-right (rest) → down-left (press), 20px diagonal. */
const FINGER_TAP_DIAGONAL_PX = 20 * FTUE_VISUAL_SCALE;
const FINGER_TAP_UP_RIGHT_X = FINGER_TAP_DIAGONAL_PX / Math.SQRT2;
const FINGER_TAP_UP_RIGHT_Y = -FINGER_TAP_DIAGONAL_PX / Math.SQRT2;
const FINGER_TAP_DOWN_LEFT_X = -FINGER_TAP_UP_RIGHT_X;
const FINGER_TAP_DOWN_LEFT_Y = -FINGER_TAP_UP_RIGHT_Y;
const FINGER_SPRITE_ROTATE_DEG = 45;
const FINGER_POSITION_OFFSET_X_PX = 15;
const FINGER_POSITION_OFFSET_Y_PX = 20;
const HOLE_PADDING_PX = 6;

type ViewportRect = { left: number; top: number; width: number; height: number };

function expandRect(r: ViewportRect, padding: number): ViewportRect {
  return {
    left: r.left - padding,
    top: r.top - padding,
    width: r.width + padding * 2,
    height: r.height + padding * 2,
  };
}

export interface NewGardenPickerFtueOverlayProps {
  active: boolean;
}

export const NewGardenPickerFtueOverlay: React.FC<NewGardenPickerFtueOverlayProps> = ({ active }) => {
  const [opacity, setOpacity] = useState(0);
  const [hole, setHole] = useState<ViewportRect | null>(null);

  const measure = useCallback(() => {
    const el = document.getElementById(NEW_GARDEN_FTUE_VIEW_BUTTON_ID);
    if (!el) {
      setHole(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setHole({
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    });
  }, []);

  useEffect(() => {
    if (!active) {
      setOpacity(0);
      setHole(null);
      return;
    }
    setOpacity(0);
    measure();
    const t1 = window.setTimeout(measure, 80);
    const t2 = window.setTimeout(measure, 280);
    const tFade = window.setTimeout(() => setOpacity(1), 50);
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(tFade);
      window.removeEventListener('resize', measure);
    };
  }, [active, measure]);

  if (!active) return null;

  const h = hole ? expandRect(hole, HOLE_PADDING_PX) : null;
  const fingerSize = FINGER_SIZE;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 106,
        transition: `opacity ${FADE_IN_MS}ms ease-out`,
        opacity,
      }}
    >
      {h ? (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-0 top-0 right-0 pointer-events-auto"
            style={{ height: h.top, backgroundColor: NEW_GARDEN_FTUE_PICKER_BLOCKER_TINT }}
          />
          <div
            className="absolute left-0 pointer-events-auto"
            style={{ top: h.top, width: h.left, height: h.height, backgroundColor: NEW_GARDEN_FTUE_PICKER_BLOCKER_TINT }}
          />
          <div
            className="absolute top-0 bottom-0 pointer-events-auto"
            style={{ left: h.left + h.width, right: 0, backgroundColor: NEW_GARDEN_FTUE_PICKER_BLOCKER_TINT }}
          />
          <div
            className="absolute left-0 right-0 bottom-0 pointer-events-auto"
            style={{ top: h.top + h.height, backgroundColor: NEW_GARDEN_FTUE_PICKER_BLOCKER_TINT }}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0 pointer-events-auto"
          style={{ backgroundColor: NEW_GARDEN_FTUE_PICKER_BLOCKER_TINT }}
          aria-hidden
        />
      )}

      {h ? (
        <div
          className="absolute pointer-events-none"
          style={{
            left: h.left - fingerSize * 0.55 + FINGER_POSITION_OFFSET_X_PX,
            top: h.top + h.height / 2 - fingerSize / 2 - 12 * FTUE_VISUAL_SCALE + FINGER_POSITION_OFFSET_Y_PX,
            width: fingerSize,
            height: fingerSize,
            transformOrigin: 'center center',
            animation: 'newGardenPickerFtueFingerTap 1.2s ease-in-out infinite',
          }}
        >
          <style>{`
            @keyframes newGardenPickerFtueFingerTap {
              0%, 100% {
                transform: translate(${FINGER_TAP_UP_RIGHT_X}px, ${FINGER_TAP_UP_RIGHT_Y}px);
              }
              50% {
                transform: translate(${FINGER_TAP_DOWN_LEFT_X}px, ${FINGER_TAP_DOWN_LEFT_Y}px);
              }
            }
          `}</style>
          <img
            src={assetPath('/assets/ui/ui_finger.png')}
            alt=""
            className="h-full w-full object-contain"
            style={{
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
              transform: `rotate(${FINGER_SPRITE_ROTATE_DEG}deg)`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
};
