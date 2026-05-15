import React from 'react';
import { FloatingButton } from './FloatingButton';
import { useLimitedOfferCountdown } from '../hooks/useLimitedOfferCountdown';
import { formatBundleLimitedCountdown } from '../utils/limitedOfferCountdown';
import { assetPath } from '../utils/assetPath';
import { STORE_BUNDLE_OFFERS, STORE_IAP_OFFER_STARTER_PACK_ID } from '../offers';

const STARTER_PACK_OFFER = STORE_BUNDLE_OFFERS.find((offer) => offer.id === STORE_IAP_OFFER_STARTER_PACK_ID);

export interface FloatingButtonStarterPackProps {
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const FloatingButtonStarterPack: React.FC<FloatingButtonStarterPackProps> = ({
  onClick,
  className,
  style,
}) => {
  const remainingMs = useLimitedOfferCountdown(
    STARTER_PACK_OFFER?.limitedOfferCountdownStorageKey,
    STARTER_PACK_OFFER?.limitedOfferCountdownDurationMs,
  );
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
