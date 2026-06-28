import React, { useLayoutEffect, useRef, useState } from 'react';
import type { GardenId } from '../constants/gardens';
import { DEFAULT_GARDEN_ID, GARDEN_IDS } from '../constants/gardens';
import {
  GARDEN_PICKER_GOLDEN_POT_UNLOCK_REQUIRED,
  GARDEN_PICKER_PANEL_RENDER_HEIGHT_PX,
  GARDEN_PICKER_PANEL_RENDER_WIDTH_PX,
  GARDEN_PICKER_POTS_PILL_HEIGHT_PX,
  GARDEN_PICKER_POTS_PILL_RIGHT_PX,
  GARDEN_PICKER_POTS_PILL_WIDTH_PX,
  GARDEN_PICKER_PURCHASE_COIN_PRICE,
  GARDEN_PICKER_TEXT_LEFT_PX,
  scaleGardenPickerDesignX,
  scaleGardenPickerDesignY,
} from '../constants/gardenPicker';
import { assetPath } from '../utils/assetPath';
import { formatCompactNumber } from '../utils/formatCompactNumber';
import {
  getGardenCoinIconPath,
  getGardenPickerFullyLockedIconPath,
  getGardenPickerGardenIconPath,
  getGardenPickerGardenPotsIconPath,
  getGenericUiAssetPath,
} from '../utils/gardenAssets';

const GOLDEN_POT_ICON = assetPath('/assets/icons/collection/icon_goldenpot.png');

/** Matches DailyTaskRow green Claim button (TASK_ROW_SCALE 0.6 in prescale popup). */
const TASK_ROW_SCALE = 0.6;
const gpS = (px: number) => Math.round(px * TASK_ROW_SCALE);

const GREEN_CLAIM = {
  bg: '#b8d458',
  border: '#8fb33a',
  text: '#62863b',
  pressedBg: '#9fc044',
} as const;

/** Upgrade list — unaffordable purchase button (UpgradeList / DailyTaskRow). */
const CLAIM_DISABLED = {
  bg: '#e3c28c',
  border: '#c7a36e',
  text: '#a68e64',
  pressedBg: '#e3c28c',
} as const;

const CLAIM_BTN_W_PX = gpS(Math.round(200 * 1.2 * 1.1));
const CLAIM_BTN_H_PX = Math.round(gpS(Math.round(72 * 1.2 * 1.1)) * 1.12);
const CLAIM_BTN_BORDER_PX = 7 * TASK_ROW_SCALE - 0.5;
const CLAIM_BTN_BEVEL_DEPTH_PX = gpS(8);
const CLAIM_BTN_RADIUS_PX = gpS(26);
const CLAIM_BTN_LABEL_PX = Math.round(gpS(Math.round(28 * 1.2 * 1.08)) * 1.38);
const CLAIM_BTN_COIN_PX = Math.round(gpS(Math.round(32 * 1.2 * 1.1)) * 1.3 * 1.15 * 1.15);
/** 3px further left than prior (larger `right` inset). */
const CLAIM_BTN_RIGHT_PX = 25;

const POTS_ICON_NUDGE_LEFT_PX = -8;
/** Pots panel: nudge golden pot + count right inside the brown pill. */
const POTS_PILL_CONTENT_NUDGE_RIGHT_PX = 5;
/** Pots panel: nudge garden icon + title block right vs other states. */
const POTS_STATE_CONTENT_NUDGE_RIGHT_PX = 3;
/** Brown-square garden icon — 20% smaller than original 130px design size. */
const GARDEN_SQUARE_ICON_DESIGN_PX = 104;
const GARDEN_SQUARE_ICON_LEFT_PX = 34;
const GARDEN_TITLE_FONT_DESIGN_PX = 44;
const GARDEN_SUBTITLE_FONT_DESIGN_PX = 28;
const GARDEN_TITLE_MIN_FONT_PX = 10;

const ACTIVE_TITLE_COLOR = '#62863b';
const ACTIVE_SUBTITLE_COLOR = '#9eb643';
/** Selected-state description only — darker than owned/purchase green. */
const SELECTED_SUBTITLE_COLOR = '#7d9638';
const DEFAULT_TITLE_COLOR = '#765041';
const DEFAULT_SUBTITLE_COLOR = '#c2b280';
const LOCKED_TITLE_COLOR = '#c6b280';
const LOCKED_SUBTITLE_COLOR = '#e1d1a4';
const POTS_LABEL_COLOR = '#fcf0c7';

const sx = scaleGardenPickerDesignX;
const sy = scaleGardenPickerDesignY;

const PANEL_BG: Record<GardenPickerPanelState, string> = {
  selected: getGenericUiAssetPath('ui_gardens_selected.png'),
  owned: getGenericUiAssetPath('ui_gardens_owned.png'),
  pots: getGenericUiAssetPath('ui_gardens_pots.png'),
  purchase: getGenericUiAssetPath('ui_gardens_unlocked.png'),
  locked: getGenericUiAssetPath('ui_gardens_locked.png'),
  coming_soon: getGenericUiAssetPath('ui_gardens_locked.png'),
};

export type GardenPickerPanelState =
  | 'selected'
  | 'owned'
  | 'pots'
  | 'purchase'
  | 'locked'
  | 'coming_soon';

export interface GardenPickerPurchaseFx {
  rowCenter: { x: number; y: number };
  rowWidth: number;
  rowHeight: number;
}

export interface GardenPickerRowProps {
  gardenId: GardenId;
  state: GardenPickerPanelState;
  gardenDisplayName: string;
  globalGoldenPotCount?: number;
  goldenPotRequired?: number;
  purchaseCoinPrice?: number;
  playerMoney?: number;
  claimBounceActive?: boolean;
  onView?: () => void;
  onPurchase?: (fx: GardenPickerPurchaseFx) => void;
}

function getPreviousGardenId(gardenId: GardenId): GardenId {
  const index = GARDEN_IDS.indexOf(gardenId);
  if (index <= 0) return DEFAULT_GARDEN_ID;
  return GARDEN_IDS[index - 1] ?? DEFAULT_GARDEN_ID;
}

function getGardenIconPath(gardenId: GardenId, state: GardenPickerPanelState): string {
  if (state === 'locked') return getGardenPickerFullyLockedIconPath();
  if (state === 'pots' || state === 'coming_soon') return getGardenPickerGardenPotsIconPath(gardenId);
  return getGardenPickerGardenIconPath(gardenId);
}

function claimButtonLabelStyle(fontPx: number, textColor: string): React.CSSProperties {
  return {
    color: textColor,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 800,
    fontSize: `${fontPx}px`,
    lineHeight: 1,
    textShadow: '0 1px 0 rgba(255,255,255,0.25)',
  };
}

function claimBevelButtonStyle(
  pressed: boolean,
  palette: { bg: string; border: string; pressedBg: string },
): React.CSSProperties {
  return {
    width: CLAIM_BTN_W_PX,
    height: CLAIM_BTN_H_PX,
    backgroundColor: pressed ? palette.pressedBg : palette.bg,
    border: `${CLAIM_BTN_BORDER_PX}px solid ${palette.border}`,
    borderRadius: `${CLAIM_BTN_RADIUS_PX}px`,
    boxShadow: pressed
      ? `inset 0 ${gpS(5)}px ${gpS(10)}px rgba(0,0,0,0.15)`
      : `0 ${CLAIM_BTN_BEVEL_DEPTH_PX}px 0 ${palette.border}, 0 ${gpS(10)}px ${gpS(18)}px rgba(0,0,0,0.12)`,
    transform: pressed ? `translateY(${CLAIM_BTN_BEVEL_DEPTH_PX}px)` : 'translateY(0)',
  };
}

function getTitleMaxWidthPx(state: GardenPickerPanelState): number {
  const panelW = GARDEN_PICKER_PANEL_RENDER_WIDTH_PX;
  const textLeft = sx(GARDEN_PICKER_TEXT_LEFT_PX);
  const rightPad = 8;

  if (state === 'owned' || state === 'purchase') {
    return panelW - textLeft - CLAIM_BTN_RIGHT_PX - CLAIM_BTN_W_PX - rightPad;
  }
  if (state === 'pots') {
    return (
      panelW -
      textLeft -
      sx(GARDEN_PICKER_POTS_PILL_RIGHT_PX) -
      sx(GARDEN_PICKER_POTS_PILL_WIDTH_PX) -
      rightPad
    );
  }
  return panelW - textLeft - rightPad;
}

function GardenPickerRowTitle({
  text,
  color,
  maxWidthPx,
  maxFontPx,
}: {
  text: string;
  color: string;
  maxWidthPx: number;
  maxFontPx: number;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [fontPx, setFontPx] = useState(maxFontPx);

  useLayoutEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    let size = maxFontPx;
    el.style.fontSize = `${size}px`;
    while (size > GARDEN_TITLE_MIN_FONT_PX && el.scrollWidth > maxWidthPx) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }
    setFontPx(size);
  }, [text, maxFontPx, maxWidthPx]);

  return (
    <span
      ref={spanRef}
      className="block font-extrabold tracking-tight leading-none"
      style={{
        color,
        fontFamily: 'Inter, sans-serif',
        fontSize: fontPx,
        whiteSpace: 'nowrap',
        maxWidth: maxWidthPx,
      }}
    >
      {text}
    </span>
  );
}

function getRowCopy(
  state: GardenPickerPanelState,
  gardenDisplayName: string,
): { title: string; subtitle: string; titleColor: string; subtitleColor: string } {
  switch (state) {
    case 'selected':
      return {
        title: gardenDisplayName,
        subtitle: 'Garden Selected',
        titleColor: ACTIVE_TITLE_COLOR,
        subtitleColor: SELECTED_SUBTITLE_COLOR,
      };
    case 'owned':
      return {
        title: gardenDisplayName,
        subtitle: 'Switch garden',
        titleColor: ACTIVE_TITLE_COLOR,
        subtitleColor: ACTIVE_SUBTITLE_COLOR,
      };
    case 'purchase':
      return {
        title: gardenDisplayName,
        subtitle: 'Unlock Now',
        titleColor: DEFAULT_TITLE_COLOR,
        subtitleColor: DEFAULT_SUBTITLE_COLOR,
      };
    case 'locked':
      return {
        title: 'Locked Garden',
        subtitle: 'Undiscovered',
        titleColor: LOCKED_TITLE_COLOR,
        subtitleColor: LOCKED_SUBTITLE_COLOR,
      };
    case 'coming_soon':
      return {
        title: 'Vegetable Garden',
        subtitle: 'Coming Soon',
        titleColor: LOCKED_TITLE_COLOR,
        subtitleColor: LOCKED_SUBTITLE_COLOR,
      };
    case 'pots':
    default:
      return {
        title: gardenDisplayName,
        subtitle: 'Golden Pots Required',
        titleColor: DEFAULT_TITLE_COLOR,
        subtitleColor: DEFAULT_SUBTITLE_COLOR,
      };
  }
}

export const GardenPickerRow: React.FC<GardenPickerRowProps> = ({
  gardenId,
  state,
  gardenDisplayName,
  globalGoldenPotCount = 0,
  goldenPotRequired = GARDEN_PICKER_GOLDEN_POT_UNLOCK_REQUIRED,
  purchaseCoinPrice = GARDEN_PICKER_PURCHASE_COIN_PRICE,
  playerMoney = 0,
  claimBounceActive = false,
  onView,
  onPurchase,
}) => {
  const [actionPressed, setActionPressed] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const copy = getRowCopy(state, gardenDisplayName);
  const coinGardenId = getPreviousGardenId(gardenId);
  const potsLabel = `${Math.min(globalGoldenPotCount, goldenPotRequired)}/${goldenPotRequired}`;
  const potsContentNudgePx = state === 'pots' ? POTS_STATE_CONTENT_NUDGE_RIGHT_PX : 0;
  const canAffordPurchase = playerMoney >= purchaseCoinPrice;
  const purchaseButtonPalette = canAffordPurchase ? GREEN_CLAIM : CLAIM_DISABLED;
  const titleMaxFontPx = sx(GARDEN_TITLE_FONT_DESIGN_PX);
  const titleMaxWidthPx = getTitleMaxWidthPx(state) - potsContentNudgePx;

  const buildPurchaseFx = (): GardenPickerPurchaseFx | null => {
    const el = rowRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      rowCenter: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      rowWidth: rect.width,
      rowHeight: rect.height,
    };
  };

  const claimButtonShellStyle: React.CSSProperties = {
    position: 'absolute',
    right: CLAIM_BTN_RIGHT_PX,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 2,
  };

  return (
    <div
      ref={rowRef}
      className={`relative ${claimBounceActive ? 'daily-task-claim-bounce' : ''}`}
      style={{
        width: GARDEN_PICKER_PANEL_RENDER_WIDTH_PX,
        height: GARDEN_PICKER_PANEL_RENDER_HEIGHT_PX,
      }}
    >
      <img
        src={PANEL_BG[state]}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ objectFit: 'fill' }}
        draggable={false}
      />

      <img
        src={getGardenIconPath(gardenId, state)}
        alt=""
        className="pointer-events-none absolute object-contain"
        style={{
          left: sx(GARDEN_SQUARE_ICON_LEFT_PX) + potsContentNudgePx,
          top: '50%',
          width: sx(GARDEN_SQUARE_ICON_DESIGN_PX),
          height: sx(GARDEN_SQUARE_ICON_DESIGN_PX),
          transform: 'translateY(-50%)',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
        }}
        draggable={false}
      />

      <div
        className="pointer-events-none absolute flex flex-col items-start text-left"
        style={{
          left: sx(GARDEN_PICKER_TEXT_LEFT_PX) + potsContentNudgePx,
          top: '50%',
          transform: 'translateY(-50%)',
          gap: sy(6),
          maxWidth: titleMaxWidthPx,
        }}
      >
        <GardenPickerRowTitle
          text={copy.title}
          color={copy.titleColor}
          maxWidthPx={titleMaxWidthPx}
          maxFontPx={titleMaxFontPx}
        />
        <span
          className="font-semibold leading-none"
          style={{
            color: copy.subtitleColor,
            fontFamily: 'Inter, sans-serif',
            fontSize: sx(GARDEN_SUBTITLE_FONT_DESIGN_PX),
          }}
        >
          {copy.subtitle}
        </span>
      </div>

      {state === 'owned' && (
        <div style={claimButtonShellStyle}>
          <button
            type="button"
            aria-label="View garden"
            onClick={() => onView?.()}
            onMouseDown={() => setActionPressed(true)}
            onMouseUp={() => setActionPressed(false)}
            onMouseLeave={() => setActionPressed(false)}
            className="relative flex items-center justify-center transition-all cursor-pointer"
            style={claimBevelButtonStyle(actionPressed, GREEN_CLAIM)}
          >
            <span style={claimButtonLabelStyle(CLAIM_BTN_LABEL_PX, GREEN_CLAIM.text)}>View</span>
          </button>
        </div>
      )}

      {state === 'purchase' && (
        <div style={claimButtonShellStyle}>
          <button
            type="button"
            aria-label={`Unlock for ${formatCompactNumber(purchaseCoinPrice)} coins`}
            onClick={() => {
              if (!canAffordPurchase) return;
              const fx = buildPurchaseFx();
              if (fx) onPurchase?.(fx);
            }}
            onMouseDown={() => canAffordPurchase && setActionPressed(true)}
            onMouseUp={() => setActionPressed(false)}
            onMouseLeave={() => setActionPressed(false)}
            className="relative flex items-center justify-center transition-all"
            style={{
              ...claimBevelButtonStyle(actionPressed && canAffordPurchase, purchaseButtonPalette),
              gap: gpS(8),
              cursor: canAffordPurchase ? 'pointer' : 'default',
            }}
          >
            <img
              src={getGardenCoinIconPath(coinGardenId)}
              alt=""
              className="object-contain shrink-0"
              style={{ width: CLAIM_BTN_COIN_PX, height: CLAIM_BTN_COIN_PX }}
              draggable={false}
            />
            <span
              className="tabular-nums leading-none"
              style={claimButtonLabelStyle(CLAIM_BTN_LABEL_PX, purchaseButtonPalette.text)}
            >
              {formatCompactNumber(purchaseCoinPrice)}
            </span>
          </button>
        </div>
      )}

      {state === 'pots' && (
        <div
          className="pointer-events-none absolute flex items-center justify-center"
          style={{
            right: sx(GARDEN_PICKER_POTS_PILL_RIGHT_PX),
            top: '50%',
            width: sx(GARDEN_PICKER_POTS_PILL_WIDTH_PX),
            height: sx(GARDEN_PICKER_POTS_PILL_HEIGHT_PX),
            transform: `translateY(-50%) translateX(${POTS_PILL_CONTENT_NUDGE_RIGHT_PX}px)`,
            gap: sx(6),
          }}
          aria-hidden
        >
          <img
            src={GOLDEN_POT_ICON}
            alt=""
            className="object-contain shrink-0"
            style={{
              width: sx(44),
              height: sx(44),
              transform: `translateX(${POTS_ICON_NUDGE_LEFT_PX}px)`,
            }}
            draggable={false}
          />
          <span
            className="font-black tracking-tight leading-none"
            style={{
              color: POTS_LABEL_COLOR,
              fontFamily: 'Inter, sans-serif',
              fontSize: sx(32),
              letterSpacing: '-0.02em',
              textShadow: '0 1px 0 rgba(0,0,0,0.15)',
              transform: 'translateX(2px)',
            }}
          >
            {potsLabel}
          </span>
        </div>
      )}
    </div>
  );
};
