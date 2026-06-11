import React, { useCallback, useEffect, useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import { GARDEN_IDS, getGardenDisplayLabel, type GardenId } from '../constants/gardens';
import { popupCardSurfaceStyle, usePopupPreflightEnter, type PopupAnimWithPreflight } from '../hooks/usePopupPreflightEnter';

interface GardenPickerPopupProps {
  isVisible: boolean;
  onClose: () => void;
  onUserDismiss?: () => void;
  activeGardenId: GardenId;
  /** Garden ids the player may switch to (always includes garden_1). */
  selectableGardenIds: GardenId[];
  onSelectGarden: (gardenId: GardenId) => void;
  closeOnBackdropClick?: boolean;
  appScale?: number;
}

const POPUP_CLOSE_MS = 200;
const BUTTON_HEIGHT_PX = 36;

const PALETTES = {
  green: {
    bg: '#b8d458',
    border: '#8fb33a',
    text: '#4a6b1e',
    pressedBg: '#9fc044',
    textShadow: '0 1px 0 rgba(255,255,255,0.3)',
  },
  disabled: {
    bg: '#b7a07a',
    border: '#8c7554',
    text: '#5f4b33',
    pressedBg: '#a58d68',
    textShadow: '0 1px 0 rgba(255,255,255,0.2)',
  },
} as const;

function btnStyle(
  p: (typeof PALETTES)['green'],
  pressed: boolean,
  active: boolean,
): React.CSSProperties {
  return {
    height: `${BUTTON_HEIGHT_PX}px`,
    backgroundColor: pressed ? p.pressedBg : p.bg,
    border: `3px solid ${active ? '#5a7a28' : p.border}`,
    borderRadius: '12px',
    boxShadow: pressed
      ? 'inset 0 2px 4px rgba(0,0,0,0.15)'
      : `0 4px 0 ${p.border}, 0 6px 12px rgba(0,0,0,0.15)`,
    transform: pressed ? 'translateY(2px)' : 'translateY(0)',
    opacity: active ? 1 : 0.92,
  };
}

function labelStyle(p: (typeof PALETTES)['green']): React.CSSProperties {
  return {
    color: p.text,
    fontFamily: 'Inter, sans-serif',
    textShadow: p.textShadow,
    fontSize: '0.875rem',
  };
}

export const GardenPickerPopup: React.FC<GardenPickerPopupProps> = ({
  isVisible,
  onClose,
  onUserDismiss,
  activeGardenId,
  selectableGardenIds,
  onSelectGarden,
  closeOnBackdropClick = true,
  appScale = 1,
}) => {
  const [animState, setAnimState] = useState<PopupAnimWithPreflight>('hidden');
  const [pressedId, setPressedId] = useState<GardenId | null>(null);
  const popupCardLayoutRef = useRef<HTMLDivElement>(null);

  const beginEnterAfterPreflight = useCallback(() => {
    setAnimState('entering');
    setTimeout(() => setAnimState('visible'), 250);
  }, []);

  usePopupPreflightEnter(animState, beginEnterAfterPreflight, popupCardLayoutRef);

  useEffect(() => {
    if (isVisible && animState === 'hidden') {
      setAnimState('preflight');
    } else if (!isVisible && (animState === 'visible' || animState === 'entering' || animState === 'preflight')) {
      setAnimState('leaving');
      setTimeout(() => {
        setAnimState('hidden');
        onClose();
      }, POPUP_CLOSE_MS);
    }
  }, [isVisible, animState, onClose]);

  const dismissToClose = () => {
    if (animState === 'leaving' || animState === 'hidden' || animState === 'preflight') return;
    onUserDismiss?.();
    setAnimState('leaving');
    setTimeout(() => {
      setAnimState('hidden');
      onClose();
    }, POPUP_CLOSE_MS);
  };

  if (animState === 'hidden') return null;

  const isPreflight = animState === 'preflight';
  const isEntering = animState === 'entering';
  const isLeaving = animState === 'leaving';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 100, overflow: 'hidden', pointerEvents: isPreflight ? 'none' : 'auto' }}
    >
      <div
        className="absolute transition-opacity duration-200"
        style={{
          top: '-10px',
          left: '-10px',
          right: '-10px',
          bottom: '-10px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          opacity: isLeaving || isPreflight ? 0 : 1,
        }}
        onClick={closeOnBackdropClick ? dismissToClose : undefined}
      />
      <div
        className="relative flex items-center justify-center"
        style={{ transform: `scale(${appScale})`, transformOrigin: 'center center' }}
      >
        <div
          ref={popupCardLayoutRef}
          className="relative flex flex-col items-center"
          style={{
            width: '260px',
            zIndex: 102,
            ...popupCardSurfaceStyle(
              animState,
              isEntering,
              isLeaving,
              'pausePopupEnter 250ms ease-out forwards',
              `pausePopupLeave ${POPUP_CLOSE_MS}ms ease-in forwards`,
            ),
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '260px',
              borderRadius: '24px',
              backgroundColor: '#fcf0c6',
              boxShadow: '0 1px 14px rgba(0,0,0,0.96), inset 0 0 0 1.5px #e9dcaf',
              border: '2px solid rgba(180, 165, 130, 0.4)',
              padding: '36px 20px 14px',
            }}
          >
            <div className="flex flex-col items-center">
              <h2
                className="font-black tracking-tight text-center"
                style={{ color: '#5c4a32', fontFamily: 'Inter, sans-serif', fontSize: '2rem' }}
              >
                Gardens
              </h2>
              <div className="w-full flex items-center justify-center" style={{ marginTop: '8px', marginBottom: '14px' }}>
                <img
                  src={assetPath('/assets/ui/popup_divider.png')}
                  alt=""
                  className="h-auto object-contain"
                  style={{ width: '100%', maxWidth: '220px' }}
                />
              </div>
              <div className="flex flex-col items-center gap-3 w-full" style={{ maxWidth: '200px' }}>
                {GARDEN_IDS.map((gardenId) => {
                  const selectable = selectableGardenIds.includes(gardenId);
                  const isActive = gardenId === activeGardenId;
                  const palette = selectable ? PALETTES.green : PALETTES.disabled;
                  return (
                    <button
                      key={gardenId}
                      type="button"
                      disabled={!selectable}
                      onMouseDown={() => selectable && setPressedId(gardenId)}
                      onMouseUp={() => setPressedId(null)}
                      onMouseLeave={() => setPressedId(null)}
                      onClick={() => {
                        if (!selectable) return;
                        onSelectGarden(gardenId);
                        dismissToClose();
                      }}
                      className="relative flex items-center justify-center rounded-lg transition-all w-full"
                      style={{
                        ...btnStyle(palette, pressedId === gardenId, isActive),
                        cursor: selectable ? 'pointer' : 'not-allowed',
                        opacity: selectable ? 1 : 0.5,
                      }}
                    >
                      <span className="font-bold tracking-tight" style={labelStyle(palette)}>
                        {getGardenDisplayLabel(gardenId)}
                        {isActive ? ' ✓' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissToClose}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ backgroundColor: 'transparent', border: 'none', color: '#c2b280', zIndex: 105 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M2 2L12 12M12 2L2 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
