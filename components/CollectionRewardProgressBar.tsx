import React from 'react';
import {
  COLLECTION_PROGRESS_BAR_BORDER_WIDTH_PX,
  COLLECTION_PROGRESS_BAR_BROWN_HEIGHT_PX,
  COLLECTION_PROGRESS_BAR_DISCOVERY_BROWN,
  COLLECTION_PROGRESS_BAR_FILL_LIGHT_OUTLINE_PX,
  COLLECTION_PROGRESS_BAR_INNER_PAD_PX,
  COLLECTION_PROGRESS_BAR_OUTER_HEIGHT_PX,
  COLLECTION_PROGRESS_BAR_TRACK_HEIGHT_PX,
  COLLECTION_SHELF_DISCOVERY_PROGRESS_BAR_OPACITY,
  COLLECTION_SHELF_DISCOVERY_PROGRESS_BAR_OUTER_HEIGHT_PX,
  COLLECTION_SHELF_DISCOVERY_PROGRESS_BAR_WIDTH_PX,
  COLLECTION_SHELF_PROGRESS_BAR_WIDTH_PX,
  COLLECTION_SHELF_UPGRADE_BUTTON_RING_COLOR,
} from '../constants/barnShelves';
import { getCollectionShelfGoldenPotIconPath } from '../utils/gardenAssets';

/** Layout footprint — discovery uses the same hidden icon placeholders so the track aligns with the progress variant. */
const SHELF_BAR_LEFT_ICON_SLOT_PX = 50;
const SHELF_BAR_LEFT_ICON_RENDER_PX = 40;
const SHELF_BAR_LEFT_ICON_MARGIN_RIGHT_PX = -10;
const SHELF_BAR_RIGHT_ICON_SLOT_PX = 44;
const SHELF_BAR_RIGHT_ICON_RENDER_PX = 40;
const SHELF_BAR_RIGHT_ICON_MARGIN_LEFT_PX = -10;
const SHELF_BAR_ROW_HEIGHT_PX = 50;

/**
 * Key-wallet geometry (PageHeader): pill height 22, diagonal left edge from x=15 (top) → x=1.5 (bottom),
 * key icon 30px at left -7px.
 */
const KEY_WALLET_REF_HEIGHT_PX = 22;
const KEY_WALLET_TOP_CUT_PX = 15;
const KEY_WALLET_BOTTOM_CUT_PX = 1.5;
const KEY_WALLET_ICON_PX = 30;
const KEY_WALLET_ICON_LEFT_PX = -7;

export interface CollectionRewardProgressBarProps {
  numerator: number;
  denominator: number;
  fillPct: number;
  /** Right reward icon. Omit with `showRightIcon={false}` for left-icon-only bars. */
  rewardIconSrc?: string;
  /** DOM id on the right reward icon button (FTUE hole target). */
  rewardIconId?: string;
  /** When false, the right icon slot is omitted (e.g. locked SD key progress). Default true. */
  showRightIcon?: boolean;
  /**
   * Match the Collection key wallet: angled left clip on the track + key overlapping that cut.
   * Centers the track (key overhangs left). Implies no flex left-icon slot.
   */
  keyWalletLeftEdge?: boolean;
  /** Multiplies track / fill heights (e.g. 1.5 for locked SD key progress). */
  heightScale?: number;
  /** Inner track width in px (default matches Plant Collection panel bar). */
  barWidth?: number;
  leftIconSrc?: string;
  id?: string;
  leftIconRef?: React.Ref<HTMLSpanElement>;
  leftIconBounceClassName?: string;
  /** Uniform scale (e.g. 0.8 = 20% smaller). */
  scale?: number;
  /** `discovery` — hidden icon placeholders, warm brown track at reduced opacity. */
  variant?: 'progress' | 'discovery';
  /** Overrides numerator/denominator label (used with `discovery`). */
  centerLabel?: string;
  /** Tap bar or icons to open bonuses (when not locked). */
  onBarClick?: () => void;
  /** Hide numerator/denominator on progress bars (e.g. locked shelf awaiting its turn). */
  showCenterLabel?: boolean;
}

const SHELF_BAR_FILL_GRADIENTS = {
  completed: {
    outer: 'linear-gradient(180deg, #d4e674 0%, #97ad4f 100%)',
    inner: 'linear-gradient(180deg, #c9dc62 0%, #86a13f 100%)',
  },
  inProgress: {
    outer: 'linear-gradient(180deg, #fef0a0 0%, #fcc040 100%)',
    inner: 'linear-gradient(180deg, #fbea65 0%, #fbb116 100%)',
  },
} as const;

const ProgressBarTrack: React.FC<{
  barWidth: number;
  centerLabel: string;
  trackBrownColor: string;
  fillPct: number;
  showFill: boolean;
  showLabel?: boolean;
  labelFontSizePx?: number;
  labelColor?: string;
  /** Webkit text stroke width for the center label (e.g. `1.5px`). */
  labelStrokeWidthPx?: number;
  solidTrack?: boolean;
  outerHeightPx?: number;
  brownHeightPx?: number;
  trackHeightPx?: number;
  innerPadPx?: number;
  /** CSS clip-path for angled left edge (key wallet). */
  clipPath?: string;
  /** Extra brown/outline width on the right only; green fill stays on `barWidth`. */
  brownRightExtraPx?: number;
  onClick?: () => void;
  fillVariant?: 'completed' | 'inProgress';
}> = ({
  barWidth,
  centerLabel,
  trackBrownColor,
  fillPct,
  showFill,
  showLabel = true,
  labelFontSizePx = 12,
  labelColor = '#fcf0c7',
  labelStrokeWidthPx = 1,
  solidTrack = false,
  outerHeightPx = COLLECTION_PROGRESS_BAR_OUTER_HEIGHT_PX,
  brownHeightPx = COLLECTION_PROGRESS_BAR_BROWN_HEIGHT_PX,
  trackHeightPx = COLLECTION_PROGRESS_BAR_TRACK_HEIGHT_PX,
  innerPadPx = COLLECTION_PROGRESS_BAR_INNER_PAD_PX,
  clipPath,
  brownRightExtraPx = 0,
  onClick,
  fillVariant = 'inProgress',
}) => {
  const trackInteractive = onClick != null;
  const fillGradients = SHELF_BAR_FILL_GRADIENTS[fillVariant];
  const outerWidthPx = barWidth + Math.max(0, brownRightExtraPx);
  // Half-heights so each layer’s right tip is a true pill curve.
  const outerRightRadius = outerHeightPx / 2;
  const brownRightRadius = brownHeightPx / 2;
  const greenRightRadius = trackHeightPx / 2;
  const greenInnerRightRadius = Math.max(0, greenRightRadius - COLLECTION_PROGRESS_BAR_FILL_LIGHT_OUTLINE_PX);
  if (solidTrack) {
    return (
      <div className="relative shrink-0" style={{ width: barWidth, height: outerHeightPx }}>
        <button
          type="button"
          className="absolute inset-y-0 block p-0 border-0 bg-transparent"
          style={{
            left: -13,
            right: -13,
            height: outerHeightPx,
            cursor: trackInteractive ? 'pointer' : 'default',
            pointerEvents: trackInteractive ? 'auto' : 'none',
          }}
          onClick={onClick}
          aria-label={trackInteractive ? 'View shelf bonus' : undefined}
        >
          <div
            className="h-full w-full"
            style={{
              backgroundColor: trackBrownColor,
              borderWidth: COLLECTION_PROGRESS_BAR_BORDER_WIDTH_PX,
              borderStyle: 'solid',
              borderColor: COLLECTION_SHELF_UPGRADE_BUTTON_RING_COLOR,
              borderRadius: outerHeightPx / 2,
              boxSizing: 'border-box',
            }}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="relative shrink-0" style={{ width: outerWidthPx, height: outerHeightPx }}>
      <button
        type="button"
        className="absolute inset-y-0 inline-flex items-center overflow-hidden p-0 border-0 bg-transparent"
        style={{
          left: clipPath ? 0 : -13,
          right: clipPath ? 0 : -13,
          width: clipPath ? '100%' : undefined,
          height: outerHeightPx,
          cursor: trackInteractive ? 'pointer' : 'default',
          pointerEvents: trackInteractive ? 'auto' : 'none',
          clipPath,
          // Keep the right cap rounded when the left edge is the key-wallet diagonal.
          borderRadius: clipPath ? `0 ${outerRightRadius}px ${outerRightRadius}px 0` : undefined,
        }}
        onClick={onClick}
        aria-label={trackInteractive ? 'View shelf bonus' : undefined}
      >
        <div
          className="flex-1 w-full flex items-center justify-center relative border overflow-hidden"
          style={{
            height: outerHeightPx,
            backgroundColor: '#775041',
            borderWidth: COLLECTION_PROGRESS_BAR_BORDER_WIDTH_PX,
            borderColor: COLLECTION_SHELF_UPGRADE_BUTTON_RING_COLOR,
            borderRadius: clipPath
              ? `0 ${outerRightRadius}px ${outerRightRadius}px 0`
              : outerHeightPx / 2,
            boxSizing: 'border-box',
            padding: innerPadPx,
          }}
        >
          {showLabel && (
            <span
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none font-black leading-none z-10 text-center whitespace-nowrap"
              style={{
                color: labelColor,
                fontSize: labelFontSizePx,
                WebkitTextStroke:
                  labelColor === '#fcf0c7'
                    ? `${labelStrokeWidthPx}px rgba(0,0,0,0.5)`
                    : undefined,
                paintOrder: 'stroke fill',
              }}
            >
              {centerLabel}
            </span>
          )}
          <div
            className="relative w-full overflow-hidden"
            style={{
              height: brownHeightPx,
              backgroundColor: trackBrownColor,
              borderRadius: clipPath
                ? `0 ${brownRightRadius}px ${brownRightRadius}px 0`
                : brownRightRadius,
            }}
          >
            {/* Optional right brown overhang; green fill still measures against the original width. */}
            <div
              className="absolute left-0 top-0 bottom-0"
              style={{
                width:
                  brownRightExtraPx > 0
                    ? `calc(100% - ${brownRightExtraPx}px)`
                    : '100%',
              }}
            >
              {showFill && (
                <div
                  className="absolute left-0 overflow-hidden"
                  style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    height: trackHeightPx,
                    width: `${fillPct}%`,
                    minWidth: fillPct > 0 ? Math.max(20, trackHeightPx) : 0,
                    transition: 'width 250ms cubic-bezier(0.25, 1, 0.5, 1)',
                    borderRadius: `0 ${greenRightRadius}px ${greenRightRadius}px 0`,
                  }}
                >
                  <div
                    className="h-full w-full"
                    style={{
                      borderRadius: `0 ${greenRightRadius}px ${greenRightRadius}px 0`,
                      padding: COLLECTION_PROGRESS_BAR_FILL_LIGHT_OUTLINE_PX,
                      boxSizing: 'border-box',
                      background: fillGradients.outer,
                    }}
                  >
                    <div
                      className="h-full w-full"
                      style={{
                        borderRadius: `0 ${greenInnerRightRadius}px ${greenInnerRightRadius}px 0`,
                        background: fillGradients.inner,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

/** Golden-pot tally toward a bonus tier — matches Plant Collection panel styling. */
export const CollectionRewardProgressBar: React.FC<CollectionRewardProgressBarProps> = ({
  numerator,
  denominator,
  fillPct,
  rewardIconSrc,
  barWidth = COLLECTION_SHELF_PROGRESS_BAR_WIDTH_PX,
  leftIconSrc = getCollectionShelfGoldenPotIconPath(),
  id,
  leftIconRef,
  leftIconBounceClassName,
  scale = 1,
  variant = 'progress',
  centerLabel,
  onBarClick,
  showCenterLabel = true,
  showRightIcon = true,
  keyWalletLeftEdge = false,
  heightScale = 1,
  rewardIconId,
}) => {
  const isDiscovery = variant === 'discovery';
  const label = centerLabel ?? `${numerator}/${denominator}`;
  const hideIcons = isDiscovery;
  const renderRightIcon = showRightIcon && !isDiscovery && !!rewardIconSrc;
  const trackBarWidth = isDiscovery
    ? COLLECTION_SHELF_DISCOVERY_PROGRESS_BAR_WIDTH_PX
    : barWidth;
  const baseOuter = isDiscovery
    ? COLLECTION_SHELF_DISCOVERY_PROGRESS_BAR_OUTER_HEIGHT_PX
    : COLLECTION_PROGRESS_BAR_OUTER_HEIGHT_PX;
  // Key-wallet SD bar: keep green height, shrink brown + outline by 2px top & bottom.
  const keyWalletChromeInsetPx = keyWalletLeftEdge && !isDiscovery ? 2 : 0;
  const trackHeightPx = COLLECTION_PROGRESS_BAR_TRACK_HEIGHT_PX * heightScale;
  const trackOuterHeight = Math.max(
    trackHeightPx + COLLECTION_PROGRESS_BAR_BORDER_WIDTH_PX * 2,
    baseOuter * heightScale - keyWalletChromeInsetPx * 2,
  );
  const brownHeightPx = Math.min(
    COLLECTION_PROGRESS_BAR_BROWN_HEIGHT_PX * heightScale - keyWalletChromeInsetPx * 2,
    trackOuterHeight - COLLECTION_PROGRESS_BAR_BORDER_WIDTH_PX * 2,
  );
  const innerPadPx = Math.max(
    0,
    (trackOuterHeight -
      COLLECTION_PROGRESS_BAR_BORDER_WIDTH_PX * 2 -
      brownHeightPx) /
      2,
  );
  const labelFontSizePx = Math.round(12 * Math.min(1.35, heightScale));
  const isCompleted = !isDiscovery && numerator >= denominator;
  const openBonuses = onBarClick;

  const keyWalletClipPath = (() => {
    if (!keyWalletLeftEdge || isDiscovery) return undefined;
    const topCut =
      (KEY_WALLET_TOP_CUT_PX / KEY_WALLET_REF_HEIGHT_PX) * trackOuterHeight;
    const bottomCut =
      (KEY_WALLET_BOTTOM_CUT_PX / KEY_WALLET_REF_HEIGHT_PX) * trackOuterHeight;
    return `polygon(${topCut}px 0%, 100% 0%, 100% 100%, ${bottomCut}px 100%)`;
  })();

  const keyIconBaseSizePx =
    (KEY_WALLET_ICON_PX / KEY_WALLET_REF_HEIGHT_PX) * trackOuterHeight;
  const keyIconSizePx = keyIconBaseSizePx * 1.15;
  // Keep the icon center anchored when growing 15%.
  const keyIconLeftPx =
    (KEY_WALLET_ICON_LEFT_PX / KEY_WALLET_REF_HEIGHT_PX) * trackOuterHeight -
    (keyIconSizePx - keyIconBaseSizePx) / 2;

  if (keyWalletLeftEdge && !isDiscovery) {
    // Track is the layout box (horizontally centered by parent); key overhangs left.
    return (
      <div
        id={id}
        className="relative inline-block overflow-visible"
        style={{
          width: trackBarWidth + 2,
          height: trackOuterHeight,
          ...(scale !== 1
            ? { transform: `scale(${scale})`, transformOrigin: 'center center' }
            : undefined),
        }}
      >
        <ProgressBarTrack
          barWidth={trackBarWidth}
          centerLabel={label}
          trackBrownColor="#775041"
          fillPct={fillPct}
          showFill
          showLabel={showCenterLabel}
          labelFontSizePx={labelFontSizePx}
          labelStrokeWidthPx={1.5}
          outerHeightPx={trackOuterHeight}
          brownHeightPx={brownHeightPx}
          trackHeightPx={trackHeightPx}
          innerPadPx={innerPadPx}
          clipPath={keyWalletClipPath}
          brownRightExtraPx={2}
          onClick={openBonuses}
          fillVariant="completed"
        />
        <span
          ref={leftIconRef}
          className={`absolute top-1/2 z-20 flex items-center justify-center leading-none pointer-events-none ${leftIconBounceClassName ?? ''}`}
          style={{
            left: keyIconLeftPx,
            width: keyIconSizePx,
            height: keyIconSizePx,
            transform: 'translateY(calc(-50% - 0.5px))',
          }}
          aria-hidden
        >
          <img
            src={leftIconSrc}
            alt=""
            className="object-contain object-left outline-none border-0"
            style={{ width: keyIconSizePx, height: keyIconSizePx }}
            draggable={false}
          />
        </span>
      </div>
    );
  }

  return (
    <div
      id={id}
      className="inline-flex items-center justify-center"
      style={{
        minHeight: SHELF_BAR_ROW_HEIGHT_PX * heightScale,
        ...(scale !== 1
          ? { transform: `scale(${scale})`, transformOrigin: 'center center' }
          : undefined),
      }}
    >
      <span
        className="flex items-center justify-center leading-none shrink-0 relative z-20"
        style={{
          width: SHELF_BAR_LEFT_ICON_SLOT_PX,
          height: SHELF_BAR_ROW_HEIGHT_PX * heightScale,
          marginRight: SHELF_BAR_LEFT_ICON_MARGIN_RIGHT_PX,
        }}
        aria-hidden={hideIcons}
      >
        {openBonuses ? (
          <button
            type="button"
            ref={hideIcons ? undefined : leftIconRef}
            className={`flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer ${leftIconBounceClassName ?? ''}`}
            style={{
              width: SHELF_BAR_LEFT_ICON_SLOT_PX,
              height: SHELF_BAR_ROW_HEIGHT_PX * heightScale,
            }}
            onClick={openBonuses}
            aria-label="View shelf bonus"
          >
            <img
              src={leftIconSrc}
              alt=""
              className="object-contain pointer-events-none"
              style={{
                width: SHELF_BAR_LEFT_ICON_RENDER_PX,
                height: SHELF_BAR_LEFT_ICON_RENDER_PX,
                transform: 'translate(2px, -1px)',
              }}
              draggable={false}
            />
          </button>
        ) : (
          <span
            ref={hideIcons ? undefined : leftIconRef}
            className={`flex items-center justify-center ${hideIcons ? '' : (leftIconBounceClassName ?? '')}`}
            style={{
              width: SHELF_BAR_LEFT_ICON_SLOT_PX,
              height: SHELF_BAR_ROW_HEIGHT_PX * heightScale,
            }}
          >
            <img
              src={leftIconSrc}
              alt=""
              className="object-contain"
              style={{
                width: SHELF_BAR_LEFT_ICON_RENDER_PX,
                height: SHELF_BAR_LEFT_ICON_RENDER_PX,
                transform: 'translate(2px, -1px)',
                visibility: hideIcons ? 'hidden' : 'visible',
              }}
              draggable={false}
            />
          </span>
        )}
      </span>
      <div style={{ opacity: isDiscovery ? COLLECTION_SHELF_DISCOVERY_PROGRESS_BAR_OPACITY : 1 }}>
        <ProgressBarTrack
          barWidth={trackBarWidth}
          centerLabel={label}
          trackBrownColor={isDiscovery ? COLLECTION_PROGRESS_BAR_DISCOVERY_BROWN : '#775041'}
          fillPct={fillPct}
          showFill={!isDiscovery}
          showLabel={!isDiscovery && showCenterLabel}
          labelFontSizePx={labelFontSizePx}
          solidTrack={isDiscovery}
          outerHeightPx={trackOuterHeight}
          brownHeightPx={brownHeightPx}
          trackHeightPx={trackHeightPx}
          innerPadPx={innerPadPx}
          onClick={openBonuses}
          fillVariant={isCompleted ? 'completed' : 'inProgress'}
        />
      </div>
      {(renderRightIcon || hideIcons) && (
        <div
          className="shrink-0 relative z-20 flex items-center justify-center"
          style={{
            width: SHELF_BAR_RIGHT_ICON_SLOT_PX,
            height: SHELF_BAR_ROW_HEIGHT_PX * heightScale,
            marginLeft: SHELF_BAR_RIGHT_ICON_MARGIN_LEFT_PX,
          }}
          aria-hidden={hideIcons}
        >
          {hideIcons ? null : openBonuses ? (
            <button
              type="button"
              className="flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer"
              style={{
                width: SHELF_BAR_RIGHT_ICON_SLOT_PX,
                height: SHELF_BAR_ROW_HEIGHT_PX * heightScale,
              }}
              onClick={openBonuses}
              aria-label="View shelf bonus"
            >
              <img
                id={rewardIconId}
                src={rewardIconSrc}
                alt=""
                className="object-contain pointer-events-none"
                style={{
                  width: SHELF_BAR_RIGHT_ICON_RENDER_PX,
                  height: SHELF_BAR_RIGHT_ICON_RENDER_PX,
                }}
                draggable={false}
              />
            </button>
          ) : (
            <img
              src={rewardIconSrc}
              alt=""
              className="object-contain"
              style={{
                width: SHELF_BAR_RIGHT_ICON_RENDER_PX,
                height: SHELF_BAR_RIGHT_ICON_RENDER_PX,
              }}
              draggable={false}
            />
          )}
        </div>
      )}
    </div>
  );
};
