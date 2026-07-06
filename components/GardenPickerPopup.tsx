/**
 * Select Garden — discovery-style popup for switching active garden.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { assetPath } from '../utils/assetPath';
import {
  DEFAULT_GARDEN_ID,
  GARDEN_IDS,
  getCollectionGardenDisplayName,
  isShippedGardenId,
  type GardenId,
} from '../constants/gardens';
import {
  GARDEN_PICKER_CARD_HORIZONTAL_PAD_PX,
  GARDEN_PICKER_LIST_GAP_PX,
  GARDEN_PICKER_LIST_HORIZONTAL_PAD_PX,
  GARDEN_PICKER_PRESCALE_WIDTH_PX,
  GARDEN_PICKER_PURCHASE_COIN_PRICE,
} from '../constants/gardenPicker';
import { popupCardSurfaceStyle, usePopupPreflightEnter, type PopupAnimWithPreflight } from '../hooks/usePopupPreflightEnter';
import { PopupVectorBackground } from './PopupVectorBackground';
import { PopupRectLeafBurst } from './PopupRectLeafBurst';
import {
  GardenPickerRow,
  type GardenPickerPanelState,
  type GardenPickerPurchaseFx,
} from './GardenPickerRow';
import { NewGardenPickerFtueOverlay } from './NewGardenPickerFtueOverlay';
import { NEW_GARDEN_FTUE_VIEW_BUTTON_ID } from '../constants/newGardenFtue';

interface GardenPickerPopupProps {
  isVisible: boolean;
  onClose: () => void;
  onUserDismiss?: () => void;
  activeGardenId: GardenId;
  onSelectGarden: (gardenId: GardenId) => void;
  onPurchaseGarden?: (gardenId: GardenId) => void;
  onPurchaseSound?: () => void;
  /** Gardens the player has started / owns. */
  gardensStarted?: GardenId[];
  /** Active garden coin balance (garden 1 coins pay for garden 2, etc.). */
  playerMoney?: number;
  closeOnBackdropClick?: boolean;
  appScale?: number;
  /** New Garden FTUE 1: finger on View for this garden; blocks close and other rows. */
  newGardenFtueViewGardenId?: GardenId | null;
}

const POPUP_CLOSE_MS = 200;
const HEADER_ICON = assetPath('/assets/icons/floating_buttons/icon_fb_gardens.png');
/** Ring art is fixed; scale icon only so it is not capped by the inner aperture. */
const HEADER_RING_PX = 120;
const HEADER_RING_TOP_PX = -20;
const HEADER_ICON_BASE_PX = 80;
const HEADER_ICON_SCALE = 1.15;
const HEADER_ICON_PX = Math.round(HEADER_ICON_BASE_PX * HEADER_ICON_SCALE);

/** Match Daily Tasks popup shell / prescale layout. */
const GARDEN_PICKER_SHELL_WIDTH_PX = 400;
const GARDEN_PICKER_SHELL_MIN_HEIGHT_PX = 520;
const GARDEN_PICKER_PRESCALE_MARGIN_BOTTOM_PX = -300;
const GARDEN_PICKER_VISUAL_CARD_WIDTH_PX = GARDEN_PICKER_PRESCALE_WIDTH_PX * 0.5;
const GARDEN_PICKER_CLOSE_TOP_PX = 56;
const GARDEN_PICKER_CLOSE_RIGHT_PX =
  (GARDEN_PICKER_SHELL_WIDTH_PX - GARDEN_PICKER_VISUAL_CARD_WIDTH_PX) / 2 + 24;
const GARDEN_PICKER_POPUP_OFFSET_Y = 'clamp(48px, 7vh, 80px)';

const SETTINGS_TITLE_COLOR = '#5c4a32';
const DIVIDER_ROW_MIN_HEIGHT_PX = 40;
const POPUP_TITLE_TEXT = 'Your Gardens';
const POPUP_DESCRIPTION_TEXT = 'Unlock new gardens and discover new plants!';
/** Prescale rem — reads as 2rem on screen after 0.5× (matches Discovery / Golden Pot popups). */
const POPUP_DESCRIPTION_FONT_SIZE_REM = '2rem';

interface GardenPickerLeafBurst {
  id: string;
  x: number;
  y: number;
  rectWidth: number;
  rectHeight: number;
}

function gardenIndex(gardenId: GardenId): number {
  return GARDEN_IDS.indexOf(gardenId);
}

function isPreviousGardenOwned(gardenId: GardenId, gardensStarted: Set<GardenId>): boolean {
  const index = gardenIndex(gardenId);
  if (index <= 0) return true;
  return gardensStarted.has(GARDEN_IDS[index - 1]!);
}

export function resolveGardenPickerPanelState(
  gardenId: GardenId,
  activeGardenId: GardenId,
  options: {
    gardensStarted: Set<GardenId>;
  },
): GardenPickerPanelState {
  if (!isPreviousGardenOwned(gardenId, options.gardensStarted)) {
    return 'locked';
  }

  if (!isShippedGardenId(gardenId)) {
    return 'coming_soon';
  }

  const started = options.gardensStarted.has(gardenId);

  if (started) {
    return gardenId === activeGardenId ? 'selected' : 'owned';
  }

  // Level 10 gates the gardens button; unpurchased gardens show coin unlock only.
  if (gardenId !== DEFAULT_GARDEN_ID) {
    return 'purchase';
  }

  return gardenId === activeGardenId ? 'selected' : 'owned';
}

export const GardenPickerPopup: React.FC<GardenPickerPopupProps> = ({
  isVisible,
  onClose,
  onUserDismiss,
  activeGardenId,
  onSelectGarden,
  onPurchaseGarden,
  onPurchaseSound,
  gardensStarted = [DEFAULT_GARDEN_ID],
  playerMoney = 0,
  closeOnBackdropClick = true,
  appScale = 1,
  newGardenFtueViewGardenId = null,
}) => {
  const newGardenFtueActive = newGardenFtueViewGardenId != null;
  const pickerCloseOnBackdrop = closeOnBackdropClick && !newGardenFtueActive;
  const [animState, setAnimState] = useState<PopupAnimWithPreflight>('hidden');
  const [bounceRowKeys, setBounceRowKeys] = useState<string[]>([]);
  const [leafBursts, setLeafBursts] = useState<GardenPickerLeafBurst[]>([]);
  const popupCardLayoutRef = useRef<HTMLDivElement>(null);

  const gardensStartedSet = useMemo(() => new Set(gardensStarted), [gardensStarted]);

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

  useEffect(() => {
    if (!isVisible) {
      setBounceRowKeys([]);
      setLeafBursts([]);
    }
  }, [isVisible]);

  const dismissToClose = () => {
    if (animState === 'leaving' || animState === 'hidden' || animState === 'preflight') return;
    onUserDismiss?.();
    setAnimState('leaving');
    setTimeout(() => {
      setAnimState('hidden');
      onClose();
    }, POPUP_CLOSE_MS);
  };

  const triggerPurchasePresentation = useCallback((rowKey: string, fx: GardenPickerPurchaseFx) => {
    setBounceRowKeys((prev) => (prev.includes(rowKey) ? prev : [...prev, rowKey]));
    setLeafBursts((prev) => [
      ...prev,
      {
        id: `garden-purchase-${rowKey}-${Date.now()}`,
        x: fx.rowCenter.x,
        y: fx.rowCenter.y,
        rectWidth: fx.rowWidth,
        rectHeight: fx.rowHeight,
      },
    ]);
    window.setTimeout(() => {
      setBounceRowKeys((prev) => prev.filter((k) => k !== rowKey));
    }, 220);
  }, []);

  const handlePurchase = useCallback(
    (rowKey: string, gardenId: GardenId, fx: GardenPickerPurchaseFx) => {
      if (playerMoney < GARDEN_PICKER_PURCHASE_COIN_PRICE) return;
      onPurchaseSound?.();
      triggerPurchasePresentation(rowKey, fx);
      window.setTimeout(() => {
        onPurchaseGarden?.(gardenId);
      }, 200);
    },
    [onPurchaseGarden, onPurchaseSound, playerMoney, triggerPurchasePresentation],
  );

  if (animState === 'hidden') return null;

  const isPreflight = animState === 'preflight';
  const isEntering = animState === 'entering';
  const isLeaving = animState === 'leaving';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 100, overflow: 'hidden', pointerEvents: isPreflight ? 'none' : 'auto' }}
    >
      {leafBursts.map((burst) => (
        <PopupRectLeafBurst
          key={burst.id}
          centerX={burst.x}
          centerY={burst.y}
          rectWidth={burst.rectWidth}
          rectHeight={burst.rectHeight}
          zIndex={110}
          onComplete={() => setLeafBursts((prev) => prev.filter((b) => b.id !== burst.id))}
        />
      ))}

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
        onClick={pickerCloseOnBackdrop ? dismissToClose : undefined}
      />

      <NewGardenPickerFtueOverlay active={newGardenFtueActive} />

      <div
        className="relative flex items-center justify-center"
        style={{
          transform: `scale(${appScale}) translateY(${GARDEN_PICKER_POPUP_OFFSET_Y})`,
          transformOrigin: 'center center',
        }}
      >
        <div
          ref={popupCardLayoutRef}
          className="relative flex flex-col items-center overflow-visible"
          style={{
            width: `${GARDEN_PICKER_SHELL_WIDTH_PX}px`,
            minHeight: GARDEN_PICKER_SHELL_MIN_HEIGHT_PX,
            zIndex: 102,
            overflow: 'visible',
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
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center overflow-visible"
            style={{
              width: `${HEADER_RING_PX}px`,
              height: `${HEADER_RING_PX}px`,
              top: `${HEADER_RING_TOP_PX}px`,
              zIndex: 104,
            }}
          >
            <img
              src={assetPath('/assets/ui/popup_header.png')}
              alt=""
              className="absolute inset-0 h-full w-full object-contain"
              style={{
                maxWidth: 'none',
                maxHeight: 'none',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
              }}
            />
            <div
              className="relative flex shrink-0 items-center justify-center overflow-visible"
              style={{
                width: `${HEADER_ICON_PX}px`,
                height: `${HEADER_ICON_PX}px`,
                marginTop: '-4px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}
            >
              <img
                src={HEADER_ICON}
                alt=""
                className="h-full w-full object-contain"
                style={{ maxWidth: 'none', maxHeight: 'none' }}
                draggable={false}
              />
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              marginTop: '36px',
              width: `${GARDEN_PICKER_PRESCALE_WIDTH_PX}px`,
              transform: 'scale(0.5)',
              transformOrigin: 'top center',
              marginBottom: `${GARDEN_PICKER_PRESCALE_MARGIN_BOTTOM_PX}px`,
            }}
          >
            <div
              style={{
                position: 'relative',
                filter: 'drop-shadow(0 16px 48px rgba(0,0,0,0.3))',
                padding: `150px ${GARDEN_PICKER_CARD_HORIZONTAL_PAD_PX}px 60px ${GARDEN_PICKER_CARD_HORIZONTAL_PAD_PX}px`,
              }}
            >
              <PopupVectorBackground />
              <div className="relative z-[2] flex flex-col items-center w-full">
                <h2
                  className="font-black tracking-tight text-center"
                  style={{
                    color: SETTINGS_TITLE_COLOR,
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '4.5rem',
                    lineHeight: 1.1,
                  }}
                >
                  {POPUP_TITLE_TEXT}
                </h2>

                <div
                  className="w-full flex items-center justify-center"
                  style={{
                    marginTop: '8px',
                    marginBottom: '20px',
                    minHeight: DIVIDER_ROW_MIN_HEIGHT_PX,
                  }}
                >
                  <img
                    src={assetPath('/assets/ui/popup_divider.png')}
                    alt=""
                    className="h-auto object-contain"
                    style={{ width: '580px', maxHeight: DIVIDER_ROW_MIN_HEIGHT_PX }}
                  />
                </div>

                <p
                  className="font-medium text-center leading-relaxed italic w-full"
                  style={{
                    color: '#c2b280',
                    fontFamily: 'Inter, sans-serif',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    fontSize: POPUP_DESCRIPTION_FONT_SIZE_REM,
                    marginBottom: '28px',
                  }}
                >
                  {POPUP_DESCRIPTION_TEXT}
                </p>

                <div
                  className="w-full flex flex-col items-stretch"
                  style={{
                    paddingLeft: GARDEN_PICKER_LIST_HORIZONTAL_PAD_PX,
                    paddingRight: GARDEN_PICKER_LIST_HORIZONTAL_PAD_PX,
                    gap: GARDEN_PICKER_LIST_GAP_PX,
                  }}
                  aria-label="Garden list"
                >
                  {GARDEN_IDS.map((gardenId) => {
                    const state = resolveGardenPickerPanelState(gardenId, activeGardenId, {
                      gardensStarted: gardensStartedSet,
                    });
                    return (
                      <GardenPickerRow
                        key={gardenId}
                        gardenId={gardenId}
                        state={state}
                        gardenDisplayName={getCollectionGardenDisplayName(gardenId)}
                        purchaseCoinPrice={GARDEN_PICKER_PURCHASE_COIN_PRICE}
                        playerMoney={playerMoney}
                        claimBounceActive={bounceRowKeys.includes(gardenId)}
                        viewButtonDomId={
                          newGardenFtueViewGardenId === gardenId && state === 'owned'
                            ? NEW_GARDEN_FTUE_VIEW_BUTTON_ID
                            : undefined
                        }
                        ftueViewOnlyGardenId={newGardenFtueViewGardenId}
                        onView={() => onSelectGarden(gardenId)}
                        onPurchase={(fx) => handlePurchase(gardenId, gardenId, fx)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={newGardenFtueActive ? undefined : dismissToClose}
            className="absolute w-8 h-8 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              top: GARDEN_PICKER_CLOSE_TOP_PX,
              right: GARDEN_PICKER_CLOSE_RIGHT_PX,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#c2b280',
              zIndex: 105,
              opacity: newGardenFtueActive ? 0.35 : 1,
              pointerEvents: newGardenFtueActive ? 'none' : 'auto',
            }}
            aria-label="Close"
            disabled={newGardenFtueActive}
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
