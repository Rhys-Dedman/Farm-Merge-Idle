/**
 * Soft post-FTUE helper: non-blocking finger pointing down at the harvest button.
 * Mount inside the harvest button wrapper so it tracks panel open/close movement.
 */
import React, { useEffect, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import { FTUE_VISUAL_SCALE } from '../ftue/ftueTextboxStyles';

const FADE_MS = 400;
const FINGER_SIZE = 270 * FTUE_VISUAL_SCALE;
const TAP_DOWN_PX = 18 * FTUE_VISUAL_SCALE;

export interface SoftHarvestNudgeOverlayProps {
  visible: boolean;
}

export const SoftHarvestNudgeOverlay: React.FC<SoftHarvestNudgeOverlayProps> = ({ visible }) => {
  const [opacity, setOpacity] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setOpacity(0);
      const t = window.setTimeout(() => setOpacity(1), 50);
      return () => clearTimeout(t);
    }
    setOpacity(0);
    const t = window.setTimeout(() => setMounted(false), FADE_MS);
    return () => clearTimeout(t);
  }, [visible]);

  if (!mounted) return null;

  const fingerSize = FINGER_SIZE;

  return (
    <div
      className="absolute pointer-events-none overflow-visible"
      style={{
        left: '50%',
        top: -fingerSize - 120 * FTUE_VISUAL_SCALE,
        transform: 'translateX(-50%)',
        width: fingerSize,
        height: fingerSize,
        zIndex: 70,
        opacity,
        transition: `opacity ${FADE_MS}ms ease-out`,
      }}
      aria-hidden
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transformOrigin: 'center bottom',
          animation: 'softHarvestNudgeFinger 1.2s ease-in-out infinite',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <style>{`
          @keyframes softHarvestNudgeFinger {
            0%, 100% { transform: translateY(0) rotate(180deg); }
            50% { transform: translateY(${TAP_DOWN_PX}px) rotate(180deg); }
          }
        `}</style>
        <img
          src={assetPath('/assets/ui/ui_finger.png')}
          alt=""
          className="w-full h-full object-contain"
          draggable={false}
          style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
        />
      </div>
    </div>
  );
};
