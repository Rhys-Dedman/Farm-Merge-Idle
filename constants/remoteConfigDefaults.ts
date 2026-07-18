/**
 * Local remote-config defaults (Firebase-ready).
 *
 * Edit numbers here to fine-tune. Game code reads via `getRemoteConfig()`.
 * Later: fetch overrides from Firebase Remote Config and merge on top of these defaults.
 *
 * Units: times are milliseconds unless a field name says otherwise (hours, seconds, price labels).
 */

export interface RemoteConfig {
  ads: {
    /** Master kill switch — when false, no interstitial or rewarded ad flows. */
    enabled: boolean;
    interstitialMinPlayerLevel: number;
    interstitialMinActivePlaytimeMs: number;
    interstitialCooldownMs: number;
    interstitialCooldownAfterRewardedMs: number;
    interstitialMaxIntervalMs: number;
    interstitialGracePeriodMs: number;
    specialOffer: {
      minGapMs: number;
      anytimeFallbackMs: number;
      quietAfterCloseMs: number;
      storeFreeOfferCooldownMs: number;
    };
  };
  monetization: {
    prices: Record<string, string>;
    /**
     * Per-store IAP kill switches (`true` = shown / purchasable).
     * Keys match store offer ids in `offers.ts`.
     */
    iapEnabled: Record<string, boolean>;
  };
  boosts: {
    specialOfferDurationSeconds: Record<string, number>;
    iapDurationMs: Record<string, number>;
  };
  currency: {
    upgradeCosts: {
      initialCostBase: number;
      unlockLevelMultiplier: number;
      minUnlockFactor: number;
      scaleByUpgradeId: Record<string, number>;
      plotExpansionInitialCost: number;
      plotExpansionScale: number;
    };
    goldenPotUnlockCostByPlant: Record<number, number>;
    newGardenUnlockCost: number;
    maxOfflineEarningsHours: number;
  };
}

export const REMOTE_CONFIG_DEFAULTS: RemoteConfig = {
  ads: {
    enabled: true,
    interstitialMinPlayerLevel: 5,
    interstitialMinActivePlaytimeMs: 8 * 60 * 1000,
    interstitialCooldownMs: 3 * 60 * 1000,
    interstitialCooldownAfterRewardedMs: 2 * 60 * 1000,
    interstitialMaxIntervalMs: 6 * 60 * 1000,
    interstitialGracePeriodMs: 60 * 1000,
    specialOffer: {
      minGapMs: 90 * 1000,
      anytimeFallbackMs: 120 * 1000,
      quietAfterCloseMs: 10 * 1000,
      storeFreeOfferCooldownMs: 15 * 60 * 1000,
    },
  },

  monetization: {
    prices: {
      store_coin_boost: '$5.99',
      store_coin_mega_boost: '$9.99',
      store_coin_ultra_boost: '$79.99',
      store_no_ads: '$5.99',
      store_bundle_starter_pack: '$9.99',
      store_bundle_starter_pack_original: '$49.99',
      store_bundle_field_pack: '$9.99',
      store_bundle_field_pack_original: '$49.99',
      store_bundle_harvesters_pack: '$29.99',
      store_bundle_harvesters_pack_original: '$99.99',
    },
    /** Set any to `false` to hide that IAP from store + related floating buttons / popups. */
    iapEnabled: {
      store_coin_boost: true,
      store_coin_mega_boost: true,
      store_coin_ultra_boost: true,
      store_no_ads: true,
      store_bundle_starter_pack: true,
      store_bundle_field_pack: true,
      store_bundle_harvesters_pack: true,
    },
  },

  boosts: {
    specialOfferDurationSeconds: {
      rapid_seeds: 90,
      double_harvest: 120,
      rapid_harvest: 60,
      rush_orders: 90,
      happiest_customers: 120,
    },
    iapDurationMs: {
      store_coin_boost: 30 * 60 * 1000,
      store_coin_mega_boost: 2 * 60 * 60 * 1000,
      store_coin_ultra_boost: 24 * 60 * 60 * 1000,
      store_iap_remove_ads: 7 * 24 * 60 * 60 * 1000,
      starter_pack_remove_ads: 24 * 60 * 60 * 1000,
      starter_pack_double_coins: 2 * 60 * 60 * 1000,
      starter_pack_rapid_harvest: 30 * 60 * 1000,
      field_pack_remove_ads: 24 * 60 * 60 * 1000,
      field_pack_double_coins: 2 * 60 * 60 * 1000,
      field_pack_rapid_harvest: 30 * 60 * 1000,
      farmers_pack_remove_ads: 7 * 24 * 60 * 60 * 1000,
      farmers_pack_double_coins: 24 * 60 * 60 * 1000,
      farmers_pack_rapid_seeds: 2 * 60 * 60 * 1000,
      starter_pack_countdown: 24 * 60 * 60 * 1000,
      field_pack_countdown: 24 * 60 * 60 * 1000,
    },
  },

  currency: {
    upgradeCosts: {
      initialCostBase: 150,
      unlockLevelMultiplier: 0.7,
      minUnlockFactor: 1,
      scaleByUpgradeId: {
        seed_production: 1.8,
        seed_storage: 1.8,
        harvest_speed: 1.8,
        customer_speed: 1.8,
        double_seeds: 1.8,
        bonus_seeds: 1.8,
        wild_growth: 1.8,
        seed_surplus: 1.8,
        merge_harvest: 1.8,
        surplus_sales: 1.8,
        premium_orders: 1.8,
        fertile_soil: 1.8,
        crop_value: 1.8,
        happy_customer: 1.8,
        market_value: 1.8,
        plot_expansion: 1.8,
      },
      plotExpansionInitialCost: 1000,
      plotExpansionScale: 1.3,
    },
    goldenPotUnlockCostByPlant: {
      1: 0,
      2: 5_000,
      3: 6_500,
      4: 8_000,
      5: 10_500,
      6: 13_000,
      7: 16_500,
      8: 21_000,
      9: 26_500,
      10: 34_000,
      11: 43_000,
      12: 55_000,
      13: 70_000,
      14: 90_000,
      15: 115_000,
      16: 140_000,
      17: 180_000,
      18: 230_000,
      19: 290_000,
      20: 360_000,
    },
    newGardenUnlockCost: 250_000,
    maxOfflineEarningsHours: 3,
  },
};
