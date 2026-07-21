/**
 * Floating button for the garden-1 Starter Pack limited offer.
 * Field Pack (garden 2+) lives in `FloatingButtonFieldPack.tsx`.
 */
import React from 'react';
import { type GardenId } from '../constants/gardens';
import { FloatingButton } from './FloatingButton';
import { useStarterPackCountdown } from '../hooks/useStarterPackCountdown';
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
