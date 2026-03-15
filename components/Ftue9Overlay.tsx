/**
 * FTUE 9: Finger tap on goal slot 1 (same as FTUE 6). Block everything except the 2 goals.
 * No textbox. Fade out after both goals have been tapped/collected (handled in App).
 */
import React, { useEffect, useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';

const FADE_IN_MS = 400;
const FADE_OUT_MS = 400;
const GOAL_SLOT_0_ID = 'goal-slot-0';
const GOAL_SLOT_1_ID = 'goal-slot-1';
const FINGER_SIZE = 270;
const FINGER_TAP_RIGHT = 21;
const FINGER_TAP_DOWN = 42;
const FINGER_OFFSET_UP_PX = 70;

export interface Ftue9OverlayProps {
  isActive: boolean;
  isFadingOut: boolean;
  onFadeOutComplete: () => void;
}

export const Ftue9Overlay: React.FC<Ftue9OverlayProps> = ({
  isActive,
  isFadingOut,
  onFadeOutComplete,
}) => {
  const [opacity, setOpacity] = useState(0);
  const [goalRect0, setGoalRect0] = useState<DOMRect | null>(null);
  const [goalRect1, setGoalRect1] = useState<DOMRect | null>(null);
  /** Frozen finger position so it doesn't snap when goal DOM updates on final collect */
  const fingerPositionRef = useRef<{ left: number; top: number } | null>(null);

  const measure = () => {
    const el0 = document.getElementById(GOAL_SLOT_0_ID);
    const el1 = document.getElementById(GOAL_SLOT_1_ID);
    if (el0) setGoalRect0(el0.getBoundingClientRect());
    if (el1) setGoalRect1(el1.getBoundingClientRect());
  };

  useEffect(() => {
    if (!isActive && !isFadingOut) {
      setOpacity(0);
      setGoalRect0(null);
      setGoalRect1(null);
      fingerPositionRef.current = null;
      return;
    }
    setOpacity(0);
    measure();
    const t = setTimeout(measure, 50);
    const resize = () => measure();
    window.addEventListener('resize', resize);
    const raf = requestAnimationFrame(measure);
    const fadeT = setTimeout(() => setOpacity(1), 50);
    return () => {
      clearTimeout(t);
      clearTimeout(fadeT);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [isActive, isFadingOut]);

  useEffect(() => {
    if (!isFadingOut) return;
    setOpacity(0);
    const t = setTimeout(onFadeOutComplete, FADE_OUT_MS);
    return () => clearTimeout(t);
  }, [isFadingOut, onFadeOutComplete]);

  if (!isActive && !isFadingOut) return null;

  const hasBothRects = goalRect0 != null && goalRect1 != null;
  const showContent = (isActive && hasBothRects && opacity > 0) || isFadingOut;
  const opacityValue = isFadingOut ? 0 : opacity;

  // Compute finger position; freeze it when fading out so finger doesn't snap
  const fingerLeft = goalRect0
    ? goalRect0.left + goalRect0.width / 2 - FINGER_SIZE / 2
    : fingerPositionRef.current?.left ?? 0;
  const fingerTop = goalRect0
    ? goalRect0.top + goalRect0.height / 2 - FINGER_SIZE / 2 - FINGER_OFFSET_UP_PX
    : fingerPositionRef.current?.top ?? 0;
  if (goalRect0 && isActive && !isFadingOut) {
    fingerPositionRef.current = { left: fingerLeft, top: fingerTop };
  }
  const useFrozenPosition = isFadingOut && fingerPositionRef.current != null;
  const displayLeft = useFrozenPosition ? fingerPositionRef.current!.left : fingerLeft;
  const displayTop = useFrozenPosition ? fingerPositionRef.current!.top : fingerTop;

  // Only compute layout when both rects are measured (avoids null .top access on first render)
  const minTop = hasBothRects ? Math.min(goalRect0!.top, goalRect1!.top) : 0;
  const maxBottom = hasBothRects ? Math.max(goalRect0!.bottom, goalRect1!.bottom) : 0;
  const minLeft = hasBothRects ? Math.min(goalRect0!.left, goalRect1!.left) : 0;
  const maxRight = hasBothRects ? Math.max(goalRect0!.right, goalRect1!.right) : 0;
  const blockHeight = maxBottom - minTop;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 99, transition: `opacity ${isFadingOut ? FADE_OUT_MS : FADE_IN_MS}ms ease-out`, opacity: opacityValue }}
    >
      {/* Blocking overlay: only goal slot 0 and slot 1 are tappable (two holes) */}
      {hasBothRects && isActive && !isFadingOut && (
        <div className="fixed inset-0 pointer-events-none" style={{ backgroundColor: 'transparent' }}>
          <div className="absolute pointer-events-auto" style={{ left: 0, top: 0, right: 0, height: minTop }} />
          <div className="absolute pointer-events-auto" style={{ left: 0, top: maxBottom, right: 0, bottom: 0 }} />
          <div className="absolute pointer-events-auto" style={{ left: 0, top: minTop, width: minLeft, height: blockHeight }} />
          <div className="absolute pointer-events-auto" style={{ left: maxRight, top: minTop, right: 0, height: blockHeight }} />
          {goalRect0!.right <= goalRect1!.left && (
            <div className="absolute pointer-events-auto" style={{ left: goalRect0!.right, top: minTop, width: goalRect1!.left - goalRect0!.right, height: blockHeight }} />
          )}
        </div>
      )}

      {/* Finger: same as FTUE 6 – point at first goal (slot 1 / goal-slot-0); frozen position when fading out */}
      {(goalRect0 || (isFadingOut && fingerPositionRef.current)) && showContent && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: displayLeft,
            top: displayTop,
            width: FINGER_SIZE,
            height: FINGER_SIZE,
            transformOrigin: 'center center',
            animation: 'ftue2FingerPoint 1.2s ease-in-out infinite',
          }}
        >
          <style>{`
            @keyframes ftue2FingerPoint {
              0%, 100% { transform: translate(0, 0) rotate(-30deg); }
              50% { transform: translate(${FINGER_TAP_RIGHT}px, ${FINGER_TAP_DOWN}px) rotate(-30deg); }
            }
          `}</style>
          <img
            src={assetPath('/assets/icons/icon_finger.png')}
            alt=""
            className="w-full h-full object-contain"
            style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
          />
        </div>
      )}
    </div>
  );
};
