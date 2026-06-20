/**
 * Select Garden — discovery-style popup for switching active garden.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import { getGardenDisplayLabel, SHIPPED_GARDEN_IDS, type GardenId } from '../constants/gardens';
import { getGoldenPotCountRequiredForGarden } from '../constants/goldenPotBonuses';
import { popupCardSurfaceStyle, usePopupPreflightEnter, type PopupAnimWithPreflight } from '../hooks/usePopupPreflightEnter';
import { PopupVectorBackground } from './PopupVectorBackground';

interface GardenPickerPopupProps {
  isVisible: boolean;
  onClose: () => void;
  onUserDismiss?: () => void;
  activeGardenId: GardenId;
  onSelectGarden: (gardenId: GardenId) => void;
  /** Gardens the player can switch to (garden 2 requires Fruit Garden golden pot bonus). */
  selectableGardenIds: GardenId[];
  closeOnBackdropClick?: boolean;
  appScale?: number;
}

const POPUP_CLOSE_MS = 200;
const HEADER_ICON = assetPath('/assets/icons/floating_buttons/icon_fb_gardens.png');
const GOLDEN_POT_ICON = assetPath('/assets/icons/collection/icon_goldenpot.png');
const GOLDEN_POT_REQUIREMENT_COLOR = '#915c22';

const GARDEN_BTN = {
  selected: {
    bg: '#b8d458',
    pressedBg: '#9fc044',
    border: '#8fb33a',
    text: '#4a6b1e',
  },
  unselected: {
    bg: '#89c8e1',
    pressedBg: '#7ab8d1',
    border: '#66a4c6',
    text: '#4580a8',
  },
  locked: {
    bg: '#d4c4a0',
    pressedBg: '#d4c4a0',
    border: '#b8a880',
    text: '#8a7355',
  },
} as const;

function gardenButtonStyle(
  selected: boolean,
  locked: boolean,
  pressed: boolean,
): React.CSSProperties {
  const p = locked ? GARDEN_BTN.locked : selected ? GARDEN_BTN.selected : GARDEN_BTN.unselected;
  return {
    width: '360px',
    height: '80px',
    backgroundColor: pressed && !locked ? p.pressedBg : p.bg,
    border: `4px solid ${p.border}`,
    borderRadius: '24px',
    boxShadow:
      locked || pressed
        ? 'inset 0 4px 8px rgba(0,0,0,0.12)'
        : `0 8px 0 ${p.border}, 0 12px 24px rgba(0,0,0,0.15)`,
    transform: pressed && !locked ? 'translateY(4px)' : 'translateY(0)',
    cursor: locked ? 'default' : 'pointer',
    opacity: locked ? 0.92 : 1,
  };
}

function gardenButtonLabelStyle(selected: boolean, locked: boolean): React.CSSProperties {
  const p = locked ? GARDEN_BTN.locked : selected ? GARDEN_BTN.selected : GARDEN_BTN.unselected;
  return {
    color: p.text,
    fontFamily: 'Inter, sans-serif',
    textShadow: '0 2px 0 rgba(255,255,255,0.3)',
    fontSize: '2rem',
  };
}

export const GardenPickerPopup: React.FC<GardenPickerPopupProps> = ({
  isVisible,
  onClose,
  onUserDismiss,
  activeGardenId,
  onSelectGarden,
  selectableGardenIds,
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
            width: '320px',
            zIndex: 102,
            ...popupCardSurfaceStyle(
              animState,
              isEntering,
              isLeaving,
              'gardenPickerEnter 250ms ease-out forwards',
              `gardenPickerLeave ${POPUP_CLOSE_MS}ms ease-in forwards`,
            ),
          }}
        >
          <style>{`
            @keyframes gardenPickerEnter {
              0% { transform: scale(0.9); opacity: 0; }
              70% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes gardenPickerLeave {
              0% { transform: scale(1); opacity: 1; }
              100% { transform: scale(0.9); opacity: 0; }
            }
          `}</style>

          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
            style={{ width: '120px', height: '120px', top: '-20px', zIndex: 104 }}
          >
            <img
              src={assetPath('/assets/ui/popup_header.png')}
              alt=""
              className="absolute inset-0 w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}
            />
            <img
              src={HEADER_ICON}
              alt=""
              className="relative object-contain"
              style={{
                width: '80px',
                height: '80px',
                marginTop: '-4px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}
            />
          </div>

          <div
            style={{
              position: 'relative',
              marginTop: '36px',
              width: '640px',
              transform: 'scale(0.5)',
              transformOrigin: 'top center',
              marginBottom: '-200px',
            }}
          >
            <div
              style={{
                position: 'relative',
                filter: 'drop-shadow(0 16px 48px rgba(0,0,0,0.3))',
                padding: '150px 40px 48px 40px',
              }}
            >
              <PopupVectorBackground />
              <div className="relative z-[2] flex flex-col items-center w-full">
                <h2
                  className="font-normal text-center"
                  style={{
                    color: '#c2b280',
                    fontFamily: 'Inter, sans-serif',
                    letterSpacing: '-0.02em',
                    fontSize: '2.25rem',
                  }}
                >
                  Select Garden
                </h2>

                <div className="w-full flex items-center justify-center" style={{ marginTop: '8px', marginBottom: '20px' }}>
                  <img
                    src={assetPath('/assets/ui/popup_divider.png')}
                    alt=""
                    className="h-auto object-contain"
                    style={{ width: '520px' }}
                  />
                </div>

                <p
                  className="font-medium text-center leading-relaxed italic w-full"
                  style={{
                    color: '#c2b280',
                    fontFamily: 'Inter, sans-serif',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    fontSize: '1.75rem',
                    marginBottom: '28px',
                  }}
                >
                  You can spend coins to unlock a new garden and discover new plants
                </p>

                <div className="flex flex-col items-center gap-4 w-full">
                  {SHIPPED_GARDEN_IDS.map((gardenId) => {
                    const selected = gardenId === activeGardenId;
                    const isSelectable = selectableGardenIds.includes(gardenId);
                    const goldenPotRequired = getGoldenPotCountRequiredForGarden(gardenId);
                    const locked = !isSelectable && goldenPotRequired != null;
                    return (
                      <button
                        key={gardenId}
                        type="button"
                        aria-disabled={locked || undefined}
                        aria-label={
                          locked && goldenPotRequired != null
                            ? `${getGardenDisplayLabel(gardenId)}, unlock at ${goldenPotRequired} golden pots`
                            : getGardenDisplayLabel(gardenId)
                        }
                        onMouseDown={() => {
                          if (!locked) setPressedId(gardenId);
                        }}
                        onMouseUp={() => setPressedId(null)}
                        onMouseLeave={() => setPressedId(null)}
                        onClick={() => {
                          if (locked) return;
                          onSelectGarden(gardenId);
                        }}
                        className="relative flex items-center justify-center rounded-xl transition-all"
                        style={gardenButtonStyle(selected, locked, pressedId === gardenId)}
                      >
                        <span className="font-bold tracking-tight" style={gardenButtonLabelStyle(selected, locked)}>
                          {getGardenDisplayLabel(gardenId)}
                        </span>
                        {locked && goldenPotRequired != null && (
                          <div
                            className="absolute flex items-center justify-center gap-2"
                            style={{ right: '20px', top: '50%', transform: 'translateY(-50%)' }}
                            aria-hidden
                          >
                            <img
                              src={GOLDEN_POT_ICON}
                              alt=""
                              className="object-contain shrink-0"
                              style={{ width: '36px', height: '36px' }}
                            />
                            <span
                              className="font-bold tabular-nums leading-none"
                              style={{
                                color: GOLDEN_POT_REQUIREMENT_COLOR,
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '1.75rem',
                                letterSpacing: '-0.04em',
                              }}
                            >
                              {goldenPotRequired}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissToClose}
            className="absolute top-[44px] right-3 w-8 h-8 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ backgroundColor: 'transparent', border: 'none', color: '#c2b280', zIndex: 105 }}
          >
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M2 2L12 12M12 2L2 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
