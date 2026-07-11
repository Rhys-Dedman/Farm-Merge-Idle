import React from 'react';
import { type GardenId } from '../constants/gardens';
import { FloatingButton } from './FloatingButton';
import { useFieldPackCountdown, useStarterPackCountdown } from '../hooks/useStarterPackCountdown';
import { formatBundleLimitedCountdown } from '../utils/limitedOfferCountdown';
import { assetPath } from '../utils/assetPath';

export interface FloatingButtonStarterPackProps {
  starterPackUnlocked: boolean;
  starterPackCountdownRefreshKey?: number;
  onClick?: () => void;
  gardenId?: GardenId;
  className?: string;
  style?: React.CSSProperties;
}

export const FloatingButtonStarterPack: React.FC<FloatingButtonStarterPackProps> = ({
  starterPackUnlocked,
  starterPackCountdownRefreshKey = 0,
  onClick,
  gardenId,
  className,
  style,
}) => {
  const remainingMs = useStarterPackCountdown(starterPackUnlocked, starterPackCountdownRefreshKey);
  const pillLabel = formatBundleLimitedCountdown(remainingMs);

  return (
    <FloatingButton
      title="Starter Pack"
      pillLabel={pillLabel}
      pillUppercase={false}
      iconSrc={assetPath('/assets/icons/floating_buttons/icon_fb_starterpack.png')}
      aria-label={`Starter Pack, ${pillLabel} remaining`}
      onClick={onClick}
      gardenId={gardenId}
      className={className}
      style={style}
    />
  );
};

export interface FloatingButtonFieldPackProps {
  fieldPackUnlocked: boolean;
  fieldPackCountdownRefreshKey?: number;
  onClick?: () => void;
  gardenId?: GardenId;
  className?: string;
  style?: React.CSSProperties;
  /** Display title — keep in sync with `STORE_BUNDLE_OFFERS` Field Pack title. */
  title?: string;
}

export const FloatingButtonFieldPack: React.FC<FloatingButtonFieldPackProps> = ({
  fieldPackUnlocked,
  fieldPackCountdownRefreshKey = 0,
  onClick,
  gardenId,
  className,
  style,
  title = 'Field Pack',
}) => {
  const remainingMs = useFieldPackCountdown(fieldPackUnlocked, fieldPackCountdownRefreshKey);
  const pillLabel = formatBundleLimitedCountdown(remainingMs);

  return (
    <FloatingButton
      title={title}
      pillLabel={pillLabel}
      pillUppercase={false}
      iconSrc={assetPath('/assets/icons/floating_buttons/icon_fb_starterpack.png')}
      aria-label={`${title}, ${pillLabel} remaining`}
      onClick={onClick}
      gardenId={gardenId}
      className={className}
      style={style}
    />
  );
};
