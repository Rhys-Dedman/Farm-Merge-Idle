import React, { useMemo } from 'react';
import { type GardenId } from '../constants/gardens';
import { FloatingButton } from './FloatingButton';
import { FloatingButtonStack } from './FloatingButtonStack';
import {
  FloatingButtonFieldPack,
  FloatingButtonStarterPack,
} from './FloatingButtonStarterPack';
import {
  useFieldPackCountdown,
  useStarterPackCountdown,
} from '../hooks/useStarterPackCountdown';
import { assetPath } from '../utils/assetPath';
import type { ActiveBoostData } from './ActiveBoostIndicator';
import {
  hasActiveDoubleCoinsBoost,
  hasActiveRemoveAdsBoost,
  STORE_IAP_OFFER_FIELD_PACK_ID,
  STORE_IAP_OFFER_REMOVE_ADS_ID,
  STORE_IAP_OFFER_STARTER_PACK_ID,
} from '../offers';
import { isAnyStoreCoinBoostIapEnabled, isStoreIapEnabled } from '../utils/remoteConfig';

export interface FarmLeftFloatingButtonStackProps {
  activeBoosts: ActiveBoostData[];
  starterPackPurchased: boolean;
  starterPackUnlocked: boolean;
  starterPackCountdownRefreshKey?: number;
  onStarterPackClick: () => void;
  fieldPackPurchased?: boolean;
  fieldPackUnlocked?: boolean;
  fieldPackCountdownRefreshKey?: number;
  onFieldPackClick?: () => void;
  onNoAdsClick: () => void;
  onCoinBoostClick: () => void;
  gardenId?: GardenId;
  style?: React.CSSProperties;
  /** Design-space top offset; defaults to header + goals (pass safe-top inset on notched devices). */
  topPx?: number;
}

export const FarmLeftFloatingButtonStack: React.FC<FarmLeftFloatingButtonStackProps> = ({
  activeBoosts,
  starterPackPurchased,
  starterPackUnlocked,
  starterPackCountdownRefreshKey = 0,
  onStarterPackClick,
  fieldPackPurchased = false,
  fieldPackUnlocked = false,
  fieldPackCountdownRefreshKey = 0,
  onFieldPackClick,
  onNoAdsClick,
  onCoinBoostClick,
  gardenId,
  style,
  topPx,
}) => {
  const starterPackRemainingMs = useStarterPackCountdown(
    starterPackUnlocked,
    starterPackCountdownRefreshKey,
  );
  const fieldPackRemainingMs = useFieldPackCountdown(
    fieldPackUnlocked,
    fieldPackCountdownRefreshKey,
  );

  const showStarterPackFb =
    isStoreIapEnabled(STORE_IAP_OFFER_STARTER_PACK_ID) &&
    !starterPackPurchased &&
    starterPackUnlocked &&
    starterPackRemainingMs > 0;
  const showFieldPackFb =
    !showStarterPackFb &&
    isStoreIapEnabled(STORE_IAP_OFFER_FIELD_PACK_ID) &&
    !fieldPackPurchased &&
    fieldPackUnlocked &&
    fieldPackRemainingMs > 0;
  const showLimitedBundleFb = showStarterPackFb || showFieldPackFb;
  const showNoAdsFb =
    isStoreIapEnabled(STORE_IAP_OFFER_REMOVE_ADS_ID) && !hasActiveRemoveAdsBoost(activeBoosts);
  /** Coin Boost fills an empty offer slot (never stacks with an active double-coins boost). */
  const coinBoostFillerEligible =
    isAnyStoreCoinBoostIapEnabled() && !hasActiveDoubleCoinsBoost(activeBoosts);

  const buttons = useMemo(() => {
    const items: React.ReactNode[] = [];
    const coinBoostButton = (
      <FloatingButton
        key="coin-boost"
        title="BOOST"
        iconSrc={assetPath('/assets/icons/floating_buttons/icon_fb_coin_boost.png')}
        aria-label="Coin Boost"
        onClick={onCoinBoostClick}
        gardenId={gardenId}
      />
    );
    // Slot 1: Starter / Field Pack, or Coin Boost when that slot has no primary offer.
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
    } else if (showFieldPackFb) {
      items.push(
        <FloatingButtonFieldPack
          key="field-pack"
          fieldPackUnlocked={fieldPackUnlocked}
          fieldPackCountdownRefreshKey={fieldPackCountdownRefreshKey}
          onClick={onFieldPackClick}
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
    } else if (showLimitedBundleFb && coinBoostFillerEligible) {
      items.push(coinBoostButton);
    }
    return items;
  }, [
    showStarterPackFb,
    showFieldPackFb,
    showLimitedBundleFb,
    showNoAdsFb,
    coinBoostFillerEligible,
    starterPackRemainingMs,
    starterPackUnlocked,
    fieldPackRemainingMs,
    fieldPackUnlocked,
    onStarterPackClick,
    onFieldPackClick,
    onNoAdsClick,
    onCoinBoostClick,
    gardenId,
    starterPackCountdownRefreshKey,
    fieldPackCountdownRefreshKey,
  ]);

  if (buttons.length === 0) return null;

  return (
    <FloatingButtonStack side="left" style={style} topPx={topPx}>
      {buttons}
    </FloatingButtonStack>
  );
};
