import React from 'react';
import {
  FAKE_NOTCH_ISLAND_HEIGHT_PX,
  FAKE_NOTCH_ISLAND_TOP_PX,
  FAKE_NOTCH_ISLAND_WIDTH_PX,
  FAKE_SAFE_AREA_TOP_PX,
} from '../constants/debugSafeArea';

const ISLAND_FILL = '#1c1c1e';
const ISLAND_EDGE = 'rgba(0, 0, 0, 0.55)';
const CAMERA_LENS = '#0a0a0c';

export interface FakeNotchOverlayProps {
  /** When false, renders nothing. */
  visible: boolean;
}

/** Dev preview: centered Dynamic Island–style pill at the top of the viewport. */
export const FakeNotchOverlay: React.FC<FakeNotchOverlayProps> = ({ visible }) => {
  if (!visible) return null;

  const lensSize = Math.round(FAKE_NOTCH_ISLAND_HEIGHT_PX * 0.38);

  return (
    <div
      className="fixed left-0 right-0 top-0 pointer-events-none z-[10000]"
      style={{ height: FAKE_SAFE_AREA_TOP_PX }}
      aria-hidden
    >
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: FAKE_NOTCH_ISLAND_TOP_PX,
          width: FAKE_NOTCH_ISLAND_WIDTH_PX,
          height: FAKE_NOTCH_ISLAND_HEIGHT_PX,
          borderRadius: FAKE_NOTCH_ISLAND_HEIGHT_PX / 2,
          backgroundColor: ISLAND_FILL,
          boxShadow: `0 2px 8px rgba(0,0,0,0.45), inset 0 0 0 1px ${ISLAND_EDGE}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        {/* Camera / Face ID cluster (right side of island) */}
        <div
          className="absolute rounded-full"
          style={{
            right: Math.round(FAKE_NOTCH_ISLAND_WIDTH_PX * 0.14),
            top: '50%',
            width: lensSize,
            height: lensSize,
            transform: 'translateY(-50%)',
            background: `radial-gradient(circle at 35% 35%, #2a2a2e 0%, ${CAMERA_LENS} 55%, #000 100%)`,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
          }}
        />
      </div>
    </div>
  );
};
