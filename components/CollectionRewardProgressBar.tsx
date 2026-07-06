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

export interface CollectionRewardProgressBarProps {
  numerator: number;
  denominator: number;
  fillPct: number;
  rewardIconSrc: string;
  /** DOM id on the right reward icon button (FTUE hole target). */
  rewardIconId?: string;
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
  solidTrack?: boolean;
  outerHeightPx?: number;
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
  solidTrack = false,
  outerHeightPx = COLLECTION_PROGRESS_BAR_OUTER_HEIGHT_PX,
  onClick,
  fillVariant = 'inProgress',
}) => {
  const trackInteractive = onClick != null;
  const fillGradients = SHELF_BAR_FILL_GRADIENTS[fillVariant];
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
    <div className="relative shrink-0" style={{ width: barWidth, height: outerHeightPx }}>
      <button
        type="button"
        className="absolute inset-y-0 inline-flex items-center overflow-hidden p-0 border-0 bg-transparent"
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
          className="flex-1 w-full flex items-center justify-center relative border overflow-hidden"
          style={{
            height: outerHeightPx,
            backgroundColor: '#775041',
            borderWidth: COLLECTION_PROGRESS_BAR_BORDER_WIDTH_PX,
            borderColor: COLLECTION_SHELF_UPGRADE_BUTTON_RING_COLOR,
            borderRadius: outerHeightPx / 2,
            boxSizing: 'border-box',
            padding: COLLECTION_PROGRESS_BAR_INNER_PAD_PX,
          }}
        >
          {showLabel && (
            <span
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none font-black leading-none z-10 text-center whitespace-nowrap"
              style={{
                color: labelColor,
                fontSize: labelFontSizePx,
                WebkitTextStroke: labelColor === '#fcf0c7' ? '1px rgba(0,0,0,0.5)' : undefined,
                paintOrder: 'stroke fill',
              }}
            >
              {centerLabel}
            </span>
          )}
          <div
            className="relative w-full overflow-hidden"
            style={{
              height: COLLECTION_PROGRESS_BAR_BROWN_HEIGHT_PX,
              backgroundColor: trackBrownColor,
              borderRadius: 10,
            }}
          >
            {showFill && (
              <div
                className="absolute left-0 overflow-hidden"
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
                  height: COLLECTION_PROGRESS_BAR_TRACK_HEIGHT_PX,
                  width: `${fillPct}%`,
                  minWidth: fillPct > 0 ? 20 : 0,
                  transition: 'width 250ms cubic-bezier(0.25, 1, 0.5, 1)',
                  borderRadius: '0 10px 10px 0',
                }}
              >
                <div
                  className="h-full w-full"
                  style={{
                    borderRadius: '0 10px 10px 0',
                    padding: COLLECTION_PROGRESS_BAR_FILL_LIGHT_OUTLINE_PX,
                    boxSizing: 'border-box',
                    background: fillGradients.outer,
                  }}
                >
                  <div
                    className="h-full w-full"
                    style={{
                      borderRadius: '0 9px 9px 0',
                      background: fillGradients.inner,
                    }}
                  />
                </div>
              </div>
            )}
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
  rewardIconId,
}) => {
  const isDiscovery = variant === 'discovery';
  const label = centerLabel ?? `${numerator}/${denominator}`;
  const hideIcons = isDiscovery;
  const trackBarWidth = isDiscovery
    ? COLLECTION_SHELF_DISCOVERY_PROGRESS_BAR_WIDTH_PX
    : barWidth;
  const trackOuterHeight = isDiscovery
    ? COLLECTION_SHELF_DISCOVERY_PROGRESS_BAR_OUTER_HEIGHT_PX
    : COLLECTION_PROGRESS_BAR_OUTER_HEIGHT_PX;
  const isCompleted = !isDiscovery && numerator >= denominator;
  const openBonuses = onBarClick;

  return (
    <div
      id={id}
      className="inline-flex items-center justify-center"
      style={{
        minHeight: SHELF_BAR_ROW_HEIGHT_PX,
        ...(scale !== 1
          ? { transform: `scale(${scale})`, transformOrigin: 'center center' }
          : undefined),
      }}
    >
      <span
        className="flex items-center justify-center leading-none shrink-0 relative z-20"
        style={{
          width: SHELF_BAR_LEFT_ICON_SLOT_PX,
          height: SHELF_BAR_ROW_HEIGHT_PX,
          marginRight: SHELF_BAR_LEFT_ICON_MARGIN_RIGHT_PX,
        }}
        aria-hidden={hideIcons}
      >
        {openBonuses ? (
          <button
            type="button"
            ref={hideIcons ? undefined : leftIconRef}
            className={`flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer ${leftIconBounceClassName ?? ''}`}
            style={{ width: SHELF_BAR_LEFT_ICON_SLOT_PX, height: SHELF_BAR_ROW_HEIGHT_PX }}
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
            style={{ width: SHELF_BAR_LEFT_ICON_SLOT_PX, height: SHELF_BAR_ROW_HEIGHT_PX }}
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
          solidTrack={isDiscovery}
          outerHeightPx={trackOuterHeight}
          onClick={openBonuses}
          fillVariant={isCompleted ? 'completed' : 'inProgress'}
        />
      </div>
      <div
        className="shrink-0 relative z-20 flex items-center justify-center"
        style={{
          width: SHELF_BAR_RIGHT_ICON_SLOT_PX,
          height: SHELF_BAR_ROW_HEIGHT_PX,
          marginLeft: SHELF_BAR_RIGHT_ICON_MARGIN_LEFT_PX,
        }}
        aria-hidden={hideIcons}
      >
        {openBonuses ? (
          <button
            type="button"
            className="flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer"
            style={{ width: SHELF_BAR_RIGHT_ICON_SLOT_PX, height: SHELF_BAR_ROW_HEIGHT_PX }}
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
              visibility: hideIcons ? 'hidden' : 'visible',
            }}
            draggable={false}
          />
        )}
      </div>
    </div>
  );
};
