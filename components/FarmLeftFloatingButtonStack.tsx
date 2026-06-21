import React, { useMemo } from 'react';
import { type GardenId } from '../constants/gardens';
import { FloatingButton } from './FloatingButton';
import { FloatingButtonStack } from './FloatingButtonStack';
import { FloatingButtonStarterPack } from './FloatingButtonStarterPack';
import { useStarterPackCountdown } from '../hooks/useStarterPackCountdown';
import { assetPath } from '../utils/assetPath';
import type { ActiveBoostData } from './ActiveBoostIndicator';
import {
  hasActiveDoubleCoinsBoost,
  hasActiveRemoveAdsBoost,
} from '../offers';

export interface FarmLeftFloatingButtonStackProps {
  activeBoosts: ActiveBoostData[];
  starterPackPurchased: boolean;
  starterPackUnlocked: boolean;
  starterPackCountdownRefreshKey?: number;
  onStarterPackClick: () => void;
  onNoAdsClick: () => void;
  onCoinBoostClick: () => void;
  gardenId?: GardenId;
  style?: React.CSSProperties;
}

export const FarmLeftFloatingButtonStack: React.FC<FarmLeftFloatingButtonStackProps> = ({
  activeBoosts,
  starterPackPurchased,
  starterPackUnlocked,
  starterPackCountdownRefreshKey = 0,
  onStarterPackClick,
  onNoAdsClick,
  onCoinBoostClick,
  gardenId,
  style,
}) => {
  const starterPackRemainingMs = useStarterPackCountdown(
    starterPackUnlocked,
    starterPackCountdownRefreshKey,
  );

  const showStarterPackFb =
    !starterPackPurchased && starterPackUnlocked && starterPackRemainingMs > 0;
  const showNoAdsFb = !hasActiveRemoveAdsBoost(activeBoosts);
  /** Coin Boost fills an empty offer slot (never stacks with an active double-coins boost). */
  const coinBoostFillerEligible = !hasActiveDoubleCoinsBoost(activeBoosts);

  const buttons = useMemo(() => {
    const items: React.ReactNode[] = [];
    const coinBoostButton = (
      <FloatingButton
        key="coin-boost"
        title="BOOST"
        iconSrc={assetPath('/assets/icons/coins/icon_coin_boost.png')}
        aria-label="Coin Boost"
        onClick={onCoinBoostClick}
        gardenId={gardenId}
      />
    );
    // Slot 1: Starter Pack, or Coin Boost when that slot has no primary offer.
    if (showStarterPackFb) {
      items.push(
        <FloatingButtonStarterPack
          key="starter-pack"
          starterPackUnlocked={starterPackUnlocked}
          starterPackCountdownRefreshKey={starterPackCountdownRefreshKey}
          onClick={onStarterPackClick}
          gardenId={gardenId}
        />,
      );
    } else if (coinBoostFillerEligible) {
      items.push(coinBoostButton);
    }
    // Slot 2: No Ads, or Coin Boost when No Ads is hidden (e.g. after purchase) and slot 1 is taken.
    if (showNoAdsFb) {
      items.push(
        <FloatingButton
          key="no-ads"
          title="NO ADS"
          iconSrc={assetPath('/assets/icons/floating_buttons/icon_fb_noads.png')}
          onClick={onNoAdsClick}
          gardenId={gardenId}
        />,
      );
    } else if (showStarterPackFb && coinBoostFillerEligible) {
      items.push(coinBoostButton);
    }
    return items;
  }, [
    showStarterPackFb,
    showNoAdsFb,
    coinBoostFillerEligible,
    starterPackRemainingMs,
    starterPackUnlocked,
    onStarterPackClick,
    onNoAdsClick,
    onCoinBoostClick,
    gardenId,
  ]);

  if (buttons.length === 0) return null;

  return (
    <FloatingButtonStack side="left" style={style}>
      {buttons}
    </FloatingButtonStack>
  );
};
