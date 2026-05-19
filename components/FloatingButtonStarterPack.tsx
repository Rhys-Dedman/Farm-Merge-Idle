import React from 'react';
import { FloatingButton } from './FloatingButton';
import { useStarterPackCountdown } from '../hooks/useStarterPackCountdown';
import { formatBundleLimitedCountdown } from '../utils/limitedOfferCountdown';
import { assetPath } from '../utils/assetPath';

export interface FloatingButtonStarterPackProps {
  starterPackUnlocked: boolean;
  starterPackCountdownRefreshKey?: number;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const FloatingButtonStarterPack: React.FC<FloatingButtonStarterPackProps> = ({
  starterPackUnlocked,
  starterPackCountdownRefreshKey = 0,
  onClick,
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
      iconSrc={assetPath('/assets/icons/icon_fb_starterpack.png')}
      aria-label={`Starter Pack, ${pillLabel} remaining`}
      onClick={onClick}
      className={className}
      style={style}
    />
  );
};
