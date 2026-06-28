import React from 'react';
import { type GardenId } from '../constants/gardens';
import {
  GARDEN_1_ACTION_BUTTON_CHROME,
  getGardenActionButtonChrome,
} from '../constants/gardenActionButtonTheme';
import { assetPath } from '../utils/assetPath';

const G1 = GARDEN_1_ACTION_BUTTON_CHROME;

export const FLOATING_BUTTON_PILL_GRADIENT_TOP = G1.pillGradientTop;
export const FLOATING_BUTTON_PILL_GRADIENT_BOTTOM = G1.pillGradientBottom;
export const FLOATING_BUTTON_PILL_LOCKED_GRADIENT_TOP = G1.pillLockedGradientTop;
export const FLOATING_BUTTON_PILL_LOCKED_GRADIENT_BOTTOM = G1.pillLockedGradientBottom;
export const FLOATING_BUTTON_PILL_OUTLINE_COLOR = G1.pillOutlineColor;
export const FLOATING_BUTTON_PILL_TEXT_COLOR = G1.pillTextColor;
export const FLOATING_BUTTON_PILL_OUTLINE_WIDTH_PX = 2;
export const FLOATING_BUTTON_PILL_FONT_SIZE_PX = 8;
export const FLOATING_BUTTON_PILL_HEIGHT_PX = 22;
export const FLOATING_BUTTON_PILL_HORIZONTAL_PADDING_PX = 8;
/** Fixed pill width so every floating button label matches the Gardens pill. */
export const FLOATING_BUTTON_PILL_WIDTH_PX = 60;
export const FLOATING_BUTTON_ICON_SIZE_PX = 65;
export const FLOATING_BUTTON_ICON_OFFSET_Y_PX = 8;

const FLOATING_BUTTON_LOCK_ICON = assetPath('/assets/icons/generic_buttons/icon_lock.png');

export interface FloatingButtonProps {
  title: string;
  iconSrc: string;
  pillLabel?: string;
  pillUppercase?: boolean;
  /** Locked preview: same pill chrome as unlocked, "LEVEL N" + lock icon. */
  locked?: boolean;
  /** Shown on the pill as "LEVEL N" when `locked` is true. */
  unlockLevel?: number;
  onClick?: () => void;
  /** 200ms 1→1.1→1 bounce on the button (e.g. tasks ready to claim). */
  readyBounceActive?: boolean;
  /** Active garden — pill gradient/outline swap per garden palette. */
  gardenId?: GardenId;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  title,
  iconSrc,
  pillLabel,
  pillUppercase = true,
  locked = false,
  unlockLevel,
  onClick,
  readyBounceActive = false,
  gardenId,
  className = '',
  style,
  'aria-label': ariaLabel,
}) => {
  const chrome = getGardenActionButtonChrome(gardenId);
  const pillLabelText = pillLabel ?? title;
  const pillGradientTop = locked ? chrome.pillLockedGradientTop : chrome.pillGradientTop;
  const pillGradientBottom = locked ? chrome.pillLockedGradientBottom : chrome.pillGradientBottom;
  const resolvedAriaLabel =
    ariaLabel ??
    (locked && unlockLevel != null
      ? `${title}, unlocks at level ${unlockLevel}`
      : title);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={resolvedAriaLabel}
      aria-disabled={locked || undefined}
      className={`relative inline-block overflow-visible border-0 bg-transparent p-0 outline-none select-none transition-transform duration-150 ${locked ? 'cursor-default' : 'active:scale-95'} ${readyBounceActive ? 'floating-button-ready-bounce' : ''} ${className}`}
      style={{
        width: FLOATING_BUTTON_ICON_SIZE_PX,
        height: FLOATING_BUTTON_ICON_SIZE_PX,
        ...style,
      }}
    >
      <span
        className="absolute inset-0 z-0 flex items-center justify-center"
        aria-hidden
        style={{ transform: `translateY(${FLOATING_BUTTON_ICON_OFFSET_Y_PX}px)` }}
      >
        <img
          src={iconSrc}
          alt=""
          draggable={false}
          className="h-full w-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
        />
      </span>
      <span
        className={`absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full font-black leading-none tracking-normal shadow-md${pillUppercase ? ' uppercase' : ''}`}
        style={{
          width: FLOATING_BUTTON_PILL_WIDTH_PX,
          height: FLOATING_BUTTON_PILL_HEIGHT_PX,
          boxSizing: 'border-box',
          paddingLeft: FLOATING_BUTTON_PILL_HORIZONTAL_PADDING_PX,
          paddingRight: FLOATING_BUTTON_PILL_HORIZONTAL_PADDING_PX,
          borderWidth: FLOATING_BUTTON_PILL_OUTLINE_WIDTH_PX,
          borderStyle: 'solid',
          borderColor: chrome.pillOutlineColor,
          backgroundImage: `linear-gradient(to bottom, ${pillGradientTop}, ${pillGradientBottom})`,
          color: chrome.pillTextColor,
          fontSize: FLOATING_BUTTON_PILL_FONT_SIZE_PX,
        }}
      >
        {locked && unlockLevel != null ? (
          <span className="flex items-center gap-px whitespace-nowrap">
            <span
              className="shrink-0"
              aria-hidden
              style={{
                width: 10,
                height: 10,
                backgroundColor: chrome.pillTextColor,
                maskImage: `url(${FLOATING_BUTTON_LOCK_ICON})`,
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: `url(${FLOATING_BUTTON_LOCK_ICON})`,
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
              }}
            />
            <span>{`LEVEL ${unlockLevel}`}</span>
          </span>
        ) : (
          <span className="whitespace-nowrap">{pillLabelText}</span>
        )}
      </span>
    </button>
  );
};
