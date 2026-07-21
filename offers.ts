/**
 * Limited offers (watch-ad / boost) config.
 * Used for popup, upgrade panel, and auto-trigger rules.
 */
import type { TabType } from './types';
import { getRemoteConfig, isStoreIapEnabled } from './utils/remoteConfig';
export { isStoreIapEnabled } from './utils/remoteConfig';

export type LimitedOfferTriggerType =
  | 'garden_fill_max_50'   // Show when ≤50% of unlocked cells are filled
  | 'wallet_empty'        // Show when player wallet (money) is 0
  | 'anytime'             // Always eligible (random pool after 120s)
  | 'order_speed_not_maxed'  // Eligible if customer_speed upgrade not maxed
  | 'has_goal_available'  // Eligible if player has at least 1 goal slot active (green or loading)
  | string;

export interface LimitedOfferConfig {
  id: string;
  title: string;
  description: string;
  /** Asset path for header (popup + upgrade panel), e.g. '/assets/icons/upgrades/icon_seedproduction.png' */
  headerIcon: string;
  /** Duration in minutes when active; null = N/A (hide duration in popup) */
  durationMinutes: number | null;
  /** Duration in seconds when active (e.g. 90 for "90s"); shown in popup when set. Overrides durationMinutes for display when both present. */
  durationSeconds?: number | null;
  /** Which upgrade tab shows this offer if player declines */
  upgradeTab: TabType;
  /** Trigger type for auto-show; evaluated in App */
  trigger: LimitedOfferTriggerType;
}

/** Single IAP / boost-bar entry for all coin multiplier packs (time stacks). */
export const DOUBLE_COINS_OFFER_ID = 'double_coins';
export const DOUBLE_COINS_HEADER_ICON = '/assets/icons/store/icon_coinmultiplier_1.png';
/** Reward-strip coin for account-wide Double Coins (not garden-specific). */
export const DOUBLE_COINS_REWARD_ICON = '/assets/icons/coins/icon_coin_double.png';

/** Top boost-bar + saved boost entry icon for Double Coins (account-wide). */
export function getDoubleCoinsActiveBoostIcon(): string {
  return DOUBLE_COINS_REWARD_ICON;
}

export function isDoubleCoinsRewardLine(offerLineText: string): boolean {
  return offerLineText.trim().toLowerCase() === 'double coins';
}

/** Store IAP no-ads row — stacks on boost bar (timer only; ad removal is game feature TBD). */
export const REMOVE_ADS_OFFER_ID = 'remove_ads';
export const REMOVE_ADS_HEADER_ICON = '/assets/icons/store/icon_noads.png';
/** Store small-row id for Remove Ads IAP — also used by **`IapOfferPopup`** (“Remove Ads popup”). */
export const STORE_IAP_OFFER_REMOVE_ADS_ID = 'store_no_ads' as const;
/** Bundle row id for Starter Pack — also used by **`IapOfferPopup`** (“Starter Pack popup”). */
export const STORE_IAP_OFFER_STARTER_PACK_ID = 'store_bundle_starter_pack' as const;
/**
 * Field Pack — garden 2+ level-4 limited bundle.
 * Own rewards / price / 24h timer keys (independent of Starter Pack; edit freely).
 */
export const STORE_IAP_OFFER_FIELD_PACK_ID = 'store_bundle_field_pack' as const;
/** Bundle main-column art (top of stacked pair). */
export const STARTER_PACK_HEADER_ICON = '/assets/icons/store/icon_starterpack.png';
/** Field Pack header art (own asset so it can diverge from Starter Pack later). */
export const FIELD_PACK_HEADER_ICON = '/assets/icons/store/icon_fieldpack.png';
export const HARVESTER_PACK_HEADER_ICON = '/assets/icons/store/icon_farmerpack.png';
export const STORE_NO_ADS_ROW_BACKGROUND = '/assets/ui/ui_store_noads.png';

/** Old save / particle ids — treated as `double_coins` for stacking + UI. */
export const LEGACY_COIN_MULTIPLIER_OFFER_IDS = ['coin_multiplier_30m', 'coin_multiplier_2h', 'coin_multiplier_24h'] as const;

export function isLegacyCoinMultiplierOfferId(id: string): boolean {
  return (LEGACY_COIN_MULTIPLIER_OFFER_IDS as readonly string[]).includes(id);
}

export function isCoinMultiplierBoostId(id: string): boolean {
  return id === DOUBLE_COINS_OFFER_ID || isLegacyCoinMultiplierOfferId(id);
}

export const LIMITED_OFFERS: LimitedOfferConfig[] = [
  {
    id: 'seed_storm',
    title: 'Seed Storm',
    description: 'Instantly fill your empty cells with plants',
    headerIcon: '/assets/icons/upgrades/icon_seedstorm.png',
    durationMinutes: null,
    upgradeTab: 'SEEDS',
    trigger: 'garden_fill_max_50',
  },
  {
    id: 'rapid_seeds',
    title: 'Rapid Seeds',
    description: 'Super fast seed production speed',
    headerIcon: '/assets/icons/upgrades/icon_seedproduction.png',
    durationMinutes: null,
    durationSeconds: 90,
    upgradeTab: 'SEEDS',
    trigger: 'wallet_empty',
  },
  {
    id: 'double_harvest',
    title: 'Double Harvest',
    description: 'Get 2x the crops every harvest',
    headerIcon: '/assets/icons/upgrades/icon_cropvalue.png',
    durationMinutes: null,
    durationSeconds: 120,
    upgradeTab: 'CROPS',
    trigger: 'anytime',
  },
  {
    id: 'special_delivery',
    title: 'Special Delivery',
    description: 'Instantly generate a high level plant',
    /** Overridden at runtime via `getSpecialDeliveryPlantSpritePath` (active garden plant). */
    headerIcon: '/assets/icons/upgrades/icon_seedproduction.png',
    durationMinutes: null,
    upgradeTab: 'SEEDS',
    trigger: 'anytime',
  },
  {
    id: 'rapid_harvest',
    title: 'Rapid Harvest',
    description: 'Super fast harvest cycle speed',
    headerIcon: '/assets/icons/upgrades/icon_harvestspeed.png',
    durationMinutes: null,
    durationSeconds: 60,
    upgradeTab: 'CROPS',
    trigger: 'anytime',
  },
  {
    id: 'rush_orders',
    title: 'Rush Orders',
    description: 'Instantly generate new orders',
    headerIcon: '/assets/icons/upgrades/icon_customerspeed.png',
    durationMinutes: null,
    durationSeconds: 90,
    upgradeTab: 'HARVEST',
    trigger: 'order_speed_not_maxed',
  },
  {
    id: 'happiest_customers',
    title: 'Happiest Customers',
    description: 'All orders will now give 2x coins',
    headerIcon: '/assets/icons/upgrades/icon_happycustomer.png',
    durationMinutes: null,
    durationSeconds: 120,
    upgradeTab: 'HARVEST',
    trigger: 'has_goal_available',
  },
  /** IAP coin multiplier — one logical boost; store packs add time onto the same bar slot. */
  {
    id: DOUBLE_COINS_OFFER_ID,
    title: 'Double Coins',
    description: '2x all coins earned',
    headerIcon: DOUBLE_COINS_HEADER_ICON,
    durationMinutes: null,
    durationSeconds: null,
    upgradeTab: 'HARVEST',
    trigger: 'anytime',
  },
  /** Store IAP only — not in rewarded-ad rotation or auto limited-offer flow (`isStorePremiumOnlyOfferId`). */
  {
    id: REMOVE_ADS_OFFER_ID,
    title: 'Remove Ads',
    description: 'Remove all forced ads',
    headerIcon: REMOVE_ADS_HEADER_ICON,
    durationMinutes: null,
    durationSeconds: null,
    upgradeTab: 'HARVEST',
    trigger: 'anytime',
  },
];

export function getOfferById(id: string): LimitedOfferConfig | undefined {
  const base = LIMITED_OFFERS.find((o) => o.id === id);
  if (!base) return undefined;
  const secs = getRemoteConfig().boosts.specialOfferDurationSeconds[id];
  if (typeof secs !== 'number') return base;
  return { ...base, durationSeconds: secs, durationMinutes: null };
}

/** Display price from remote config (falls back to offer's baked-in label). */
export function resolveStorePriceLabel(offerId: string, fallback: string): string {
  return getRemoteConfig().monetization.prices[offerId] ?? fallback;
}

/** IAP / pack duration from remote config (ms). */
export function resolveIapDurationMs(key: string, fallback: number): number {
  const v = getRemoteConfig().boosts.iapDurationMs[key];
  return typeof v === 'number' ? v : fallback;
}

/**
 * Double Coins is active at a specific moment (for offline sim: `atTimeMs` = wall clock when a surplus fired).
 */
export function hasActiveDoubleCoinsBoostAt(
  activeBoosts: ReadonlyArray<{ offerId?: string; endTime?: number; icon?: string }>,
  atTimeMs: number
): boolean {
  const headerNorm = DOUBLE_COINS_HEADER_ICON.replace(/\\/g, '/').toLowerCase();
  const rewardNorm = DOUBLE_COINS_REWARD_ICON.replace(/\\/g, '/').toLowerCase();
  return activeBoosts.some((b) => {
    const endMs = typeof b.endTime === 'number' && Number.isFinite(b.endTime) ? b.endTime : Number(b.endTime);
    if (!Number.isFinite(endMs) || endMs <= atTimeMs) return false;

    const oid = String(b.offerId ?? '').trim();
    if (oid) {
      const oidLower = oid.toLowerCase();
      if (isCoinMultiplierBoostId(oid) || isCoinMultiplierBoostId(oidLower)) return true;
    }

    const icon = String(b.icon ?? '')
      .replace(/\\/g, '/')
      .toLowerCase();
    if (!icon) return false;
    return (
      icon.includes('coinmultiplier') ||
      icon.includes('coin_multiplier') ||
      icon === headerNorm ||
      icon === rewardNorm ||
      icon.endsWith('icon_coin_double.png') ||
      icon.endsWith('icon_coinmultiplier_1.png') ||
      icon.endsWith('icon_coinmultiplier_2.png') ||
      icon.endsWith('icon_coinmultiplier_3.png')
    );
  });
}

/**
 * Double Coins is active if a non-expired boost matches by `offerId` **or** by coin-multiplier art
 * (some paths historically stored the row without `offerId`, so wallet multipliers never ran).
 */
export function hasActiveDoubleCoinsBoost(
  activeBoosts: ReadonlyArray<{ offerId?: string; endTime?: number; icon?: string }>
): boolean {
  return hasActiveDoubleCoinsBoostAt(activeBoosts, Date.now());
}

/** Remove Ads is active at a specific moment (IAP / bundle / starter pack). */
export function hasActiveRemoveAdsBoostAt(
  activeBoosts: ReadonlyArray<{ offerId?: string; endTime?: number; icon?: string }>,
  atTimeMs: number,
): boolean {
  const headerNorm = REMOVE_ADS_HEADER_ICON.replace(/\\/g, '/').toLowerCase();
  return activeBoosts.some((b) => {
    const endMs = typeof b.endTime === 'number' && Number.isFinite(b.endTime) ? b.endTime : Number(b.endTime);
    if (!Number.isFinite(endMs) || endMs <= atTimeMs) return false;

    const oid = String(b.offerId ?? '').trim().toLowerCase();
    if (oid === REMOVE_ADS_OFFER_ID) return true;

    const icon = String(b.icon ?? '')
      .replace(/\\/g, '/')
      .toLowerCase();
    if (!icon) return false;
    return (
      icon.includes('noads') ||
      icon.includes('no_ads') ||
      icon === headerNorm ||
      icon.endsWith('icon_noads.png')
    );
  });
}

export function hasActiveRemoveAdsBoost(
  activeBoosts: ReadonlyArray<{ offerId?: string; endTime?: number; icon?: string }>,
): boolean {
  return hasActiveRemoveAdsBoostAt(activeBoosts, Date.now());
}

/** Wallet / payout multiplier while Double Coins boost is active (IAP / ad-granted bar). */
export function getDoubleCoinsPayoutMultiplier(
  activeBoosts: ReadonlyArray<{ offerId?: string; endTime?: number; icon?: string }>
): 1 | 2 {
  return hasActiveDoubleCoinsBoost(activeBoosts) ? 2 : 1;
}

/**
 * Use for **displayed** coin amounts and flying-coin `value` so players see 2× while Double Coins is on.
 * Wallet impact should add this number as-is (no second multiply).
 */
export function applyDoubleCoinsVisualAmount(
  baseCoins: number,
  activeBoosts: ReadonlyArray<{ offerId?: string; endTime?: number; icon?: string }>
): number {
  const m = getDoubleCoinsPayoutMultiplier(activeBoosts);
  if (m === 1 || !Number.isFinite(baseCoins)) return baseCoins;
  return Math.round(baseCoins * m);
}

/** Exclude IAP-only rows from rewarded-ad offer rotation. */
export const LIMITED_OFFERS_AD_POOL = LIMITED_OFFERS.filter(
  (o) => o.id !== DOUBLE_COINS_OFFER_ID && o.id !== REMOVE_ADS_OFFER_ID
);

const STORE_PREMIUM_ONLY_OFFER_IDS: ReadonlySet<string> = new Set([REMOVE_ADS_OFFER_ID]);

/** Store-only IAP — never auto limited popup, upgrade “decline” rewarded row, or free store rotation. */
export function isStorePremiumOnlyOfferId(id: string): boolean {
  return STORE_PREMIUM_ONLY_OFFER_IDS.has(id);
}

/** Store slot-0 daily allowance (not in duration pool; shown when bonus unlocked + unclaimed today). */
export const STORE_DAILY_ALLOWANCE_OFFER_ID = 'daily_allowance' as const;

/** Store free-offer pool: only rewarded ads with a timed boost (durationSeconds or durationMinutes). */
export const STORE_DURATION_FREE_OFFER_IDS = [
  'rapid_seeds',
  'double_harvest',
  'rapid_harvest',
  'rush_orders',
  'happiest_customers',
] as const;

export type StoreDurationFreeOfferId = (typeof STORE_DURATION_FREE_OFFER_IDS)[number];

export function isStoreDurationFreeOfferId(id: string): id is StoreDurationFreeOfferId {
  return (STORE_DURATION_FREE_OFFER_IDS as readonly string[]).includes(id);
}

/** Random pick from pool, excluding any id in `exclude` (e.g. this slot’s last offer + other slot’s current). */
export function pickStoreDurationOfferId(exclude: ReadonlySet<string>): string {
  const pool = STORE_DURATION_FREE_OFFER_IDS.filter((oid) => !exclude.has(oid) && !isStorePremiumOnlyOfferId(oid));
  if (pool.length === 0) return STORE_DURATION_FREE_OFFER_IDS[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Two different offers for the two store slots on first load. */
export function pickInitialStoreFreeOfferSlots(): [string, string] {
  const a = pickStoreDurationOfferId(new Set());
  const b = pickStoreDurationOfferId(new Set([a]));
  return [a, b];
}

/** Drop expired cooldown timestamps when hydrating per-garden store slot state. */
export function normalizeStoreSlotCooldownEnds(
  ends?: [number, number],
  atTimeMs = Date.now(),
): [number, number] {
  const a = ends?.[0] ?? 0;
  const b = ends?.[1] ?? 0;
  return [a > atTimeMs ? a : 0, b > atTimeMs ? b : 0];
}

/** Header icon size (px) on store free (medium) cards. */
export const STORE_FREE_OFFER_HEADER_ICON_PX = 102.6;

/** Coin-offer main art: exactly half of free-offer header icon (draw size). */
export const STORE_COIN_OFFER_HEADER_ICON_PX = STORE_FREE_OFFER_HEADER_ICON_PX * 0.5;

/** Real-money coin boost rows (small store ui). Each row is independent; reorder this list to shuffle. */
export interface StoreCoinOfferConfig {
  id: string;
  title: string;
  /** Product art (same role as free-offer headerIcon), displayed at 50% of free-offer icon size. */
  headerIcon: string;
  /** Reward strip label (e.g. boost effect). */
  offerLineText: string;
  /** Duration shown on reward strip (e.g. `30m`, `2hr`). */
  durationText: string;
  /** e.g. "$9.99" */
  priceLabel: string;
  /** Stacks into one boost-bar slot per logical offer id (e.g. `double_coins`, `remove_ads`). */
  boostOfferId: typeof DOUBLE_COINS_OFFER_ID | typeof REMOVE_ADS_OFFER_ID;
  /** Boost length in ms (Collect applies this duration). */
  durationMs: number;
  /** Row chrome; default `ui_store_small`. */
  rowBackgroundAsset?: string;
  /** Reward strip icon (left of pill); default coin. */
  rewardStripIconPath?: string;
  /** Optional title color (default green from layout constants). */
  titleColor?: string;
}

export const STORE_COIN_OFFERS: StoreCoinOfferConfig[] = [
  {
    id: 'store_coin_boost',
    title: 'Coin Boost',
    headerIcon: '/assets/icons/store/icon_coinmultiplier_1.png',
    offerLineText: 'Double Coins',
    durationText: '30m',
    priceLabel: '$5.99',
    boostOfferId: DOUBLE_COINS_OFFER_ID,
    durationMs: 30 * 60 * 1000,
    rewardStripIconPath: DOUBLE_COINS_REWARD_ICON,
  },
  {
    id: 'store_coin_mega_boost',
    title: 'Coin Mega Boost',
    headerIcon: '/assets/icons/store/icon_coinmultiplier_2.png',
    offerLineText: 'Double Coins',
    durationText: '2hr',
    priceLabel: '$9.99',
    boostOfferId: DOUBLE_COINS_OFFER_ID,
    durationMs: 2 * 60 * 60 * 1000,
    rewardStripIconPath: DOUBLE_COINS_REWARD_ICON,
  },
  {
    id: 'store_coin_ultra_boost',
    title: 'Coin Ultra Boost',
    headerIcon: '/assets/icons/store/icon_coinmultiplier_3.png',
    offerLineText: 'Double Coins',
    durationText: '24hr',
    priceLabel: '$79.99',
    boostOfferId: DOUBLE_COINS_OFFER_ID,
    durationMs: 24 * 60 * 60 * 1000,
    rewardStripIconPath: DOUBLE_COINS_REWARD_ICON,
  },
  {
    id: STORE_IAP_OFFER_REMOVE_ADS_ID,
    title: 'Remove Ads',
    titleColor: '#bc2b44',
    headerIcon: REMOVE_ADS_HEADER_ICON,
    offerLineText: 'Remove Ads',
    durationText: '7d',
    priceLabel: '$5.99',
    boostOfferId: REMOVE_ADS_OFFER_ID,
    durationMs: 7 * 24 * 60 * 60 * 1000,
    rowBackgroundAsset: STORE_NO_ADS_ROW_BACKGROUND,
    rewardStripIconPath: REMOVE_ADS_HEADER_ICON,
  },
];

/** Bundle cards (`ui_store_large`): coin row fields + optional extra reward lines below the primary strip. */
export interface StoreBundleExtraRewardRow {
  offerLineText: string;
  durationText: string;
  /** Reward strip icon; omit for default coin (e.g. Double Coins). */
  coinIconPath?: string;
  /** Optional scale for strip icon only (e.g. 0.95). */
  coinIconScale?: number;
}

/** One boost bar grant from a bundle IAP — each entry spawns its own Collect → boost particle. */
export interface StoreBundleIapBoostGrant {
  offerId: string;
  durationMs: number;
  icon: string;
}

export interface StoreBundleOfferConfig extends StoreCoinOfferConfig {
  /**
   * When set (top, bottom), main column shows two vertically stacked icons.
   * Keep `headerIcon` equal to `[0]` so purchase success and other `headerIcon` reads stay correct.
   */
  headerIconStack?: readonly [string, string];
  extraRewardRows?: ReadonlyArray<StoreBundleExtraRewardRow>;
  /** When set, overrides single `boostOfferId` for Collect: one particle + stack per grant (order = display rows). */
  iapBoostGrants?: readonly StoreBundleIapBoostGrant[];
  /** Optional “was” price above the purchase button (strikethrough, same typography as button). */
  originalPriceLabel?: string;
  /** Short label above the price stack (e.g. “Best Value”), right-aligned vs. centered prices. */
  valueCalloutText?: string;
  /**
   * With `limitedOfferCountdownDurationMs`, shows a wall-clock countdown **instead of** `originalPriceLabel`.
   * Deadline persisted in `localStorage` under this key; at 0 the line is removed (card + price stay).
   */
  limitedOfferCountdownStorageKey?: string;
  limitedOfferCountdownDurationMs?: number;
}

/** Collect → boost particles: one entry per grant (bundle uses `iapBoostGrants`, else single coin-row boost). */
export function getStorePurchaseBoostGrants(config: StoreCoinOfferConfig): { offerId: string; durationMs: number; icon: string }[] {
  const bundle = config as StoreBundleOfferConfig;
  const cfg = getRemoteConfig().boosts.iapDurationMs;

  if (bundle.id === STORE_IAP_OFFER_STARTER_PACK_ID && bundle.iapBoostGrants?.length) {
    return [
      { offerId: REMOVE_ADS_OFFER_ID, durationMs: cfg.starter_pack_remove_ads ?? bundle.iapBoostGrants[0].durationMs, icon: REMOVE_ADS_HEADER_ICON },
      { offerId: DOUBLE_COINS_OFFER_ID, durationMs: cfg.starter_pack_double_coins ?? bundle.iapBoostGrants[1].durationMs, icon: DOUBLE_COINS_REWARD_ICON },
      {
        offerId: 'rapid_harvest',
        durationMs: cfg.starter_pack_rapid_harvest ?? bundle.iapBoostGrants[2].durationMs,
        icon: '/assets/icons/upgrades/icon_harvestspeed.png',
      },
    ];
  }
  if (bundle.id === STORE_IAP_OFFER_FIELD_PACK_ID && bundle.iapBoostGrants?.length) {
    return [
      { offerId: REMOVE_ADS_OFFER_ID, durationMs: cfg.field_pack_remove_ads ?? bundle.iapBoostGrants[0].durationMs, icon: REMOVE_ADS_HEADER_ICON },
      { offerId: DOUBLE_COINS_OFFER_ID, durationMs: cfg.field_pack_double_coins ?? bundle.iapBoostGrants[1].durationMs, icon: DOUBLE_COINS_REWARD_ICON },
      {
        offerId: 'rapid_harvest',
        durationMs: cfg.field_pack_rapid_harvest ?? bundle.iapBoostGrants[2].durationMs,
        icon: '/assets/icons/upgrades/icon_harvestspeed.png',
      },
    ];
  }
  if (bundle.id === 'store_bundle_harvesters_pack' && bundle.iapBoostGrants?.length) {
    return [
      { offerId: REMOVE_ADS_OFFER_ID, durationMs: cfg.farmers_pack_remove_ads ?? bundle.iapBoostGrants[0].durationMs, icon: REMOVE_ADS_HEADER_ICON },
      { offerId: DOUBLE_COINS_OFFER_ID, durationMs: cfg.farmers_pack_double_coins ?? bundle.iapBoostGrants[1].durationMs, icon: DOUBLE_COINS_REWARD_ICON },
      {
        offerId: 'rapid_seeds',
        durationMs: cfg.farmers_pack_rapid_seeds ?? bundle.iapBoostGrants[2].durationMs,
        icon: '/assets/icons/upgrades/icon_seedproduction.png',
      },
    ];
  }

  if (bundle.iapBoostGrants?.length) {
    return bundle.iapBoostGrants.map((g) => ({
      offerId: g.offerId,
      durationMs: g.durationMs,
      icon: g.icon,
    }));
  }

  const durationMs = resolveIapDurationMs(config.id, config.durationMs);
  return [{ offerId: config.boostOfferId, durationMs, icon: config.headerIcon }];
}

/** localStorage end timestamp for starter-pack 24h UI; removed in `clearGameSave` so reset / fresh FTUE restarts the timer */
export const STORE_STARTER_PACK_COUNTDOWN_END_MS_KEY = 'store_bundle_starter_pack_countdown_end_ms';
/** Set when the level-4 Starter Pack unlock popup has been shown; starts the 24h countdown. */
export const STORE_STARTER_PACK_UNLOCKED_KEY = 'store_bundle_starter_pack_unlocked';
/** Set when starter pack IAP succeeds; removed in `clearGameSave` with the countdown key. */
export const STORE_STARTER_PACK_PURCHASED_KEY = 'store_bundle_starter_pack_purchased';

/** Field Pack (garden 2+ level 4) — own 24h limited-offer keys (independent of Starter Pack). */
export const STORE_FIELD_PACK_COUNTDOWN_END_MS_KEY = 'store_bundle_field_pack_countdown_end_ms';
export const STORE_FIELD_PACK_UNLOCKED_KEY = 'store_bundle_field_pack_unlocked';
export const STORE_FIELD_PACK_PURCHASED_KEY = 'store_bundle_field_pack_purchased';

export const STORE_BUNDLE_OFFERS: StoreBundleOfferConfig[] = [
  {
    ...STORE_COIN_OFFERS[0],
    id: STORE_IAP_OFFER_STARTER_PACK_ID,
    title: 'Starter Pack',
    headerIcon: STARTER_PACK_HEADER_ICON,
    headerIconStack: [STARTER_PACK_HEADER_ICON, REMOVE_ADS_HEADER_ICON],
    offerLineText: 'Remove Ads',
    durationText: '24hr',
    rewardStripIconPath: REMOVE_ADS_HEADER_ICON,
    extraRewardRows: [
      { offerLineText: 'Double Coins', durationText: '2hr', coinIconPath: DOUBLE_COINS_REWARD_ICON },
      {
        offerLineText: 'Rapid Harvest',
        durationText: '30m',
        coinIconPath: '/assets/icons/upgrades/icon_harvestspeed.png',
        coinIconScale: 0.95,
      },
    ],
    iapBoostGrants: [
      { offerId: REMOVE_ADS_OFFER_ID, durationMs: 24 * 60 * 60 * 1000, icon: REMOVE_ADS_HEADER_ICON },
      { offerId: DOUBLE_COINS_OFFER_ID, durationMs: 2 * 60 * 60 * 1000, icon: DOUBLE_COINS_REWARD_ICON },
      {
        offerId: 'rapid_harvest',
        durationMs: 30 * 60 * 1000,
        icon: '/assets/icons/upgrades/icon_harvestspeed.png',
      },
    ],
    priceLabel: '$9.99',
    originalPriceLabel: '$49.99',
    valueCalloutText: 'Limited Offer',
    limitedOfferCountdownStorageKey: STORE_STARTER_PACK_COUNTDOWN_END_MS_KEY,
    limitedOfferCountdownDurationMs: 24 * 60 * 60 * 1000,
  },
  {
    // Field Pack — duplicate of Starter Pack values today; edit this block independently later.
    ...STORE_COIN_OFFERS[0],
    id: STORE_IAP_OFFER_FIELD_PACK_ID,
    title: 'Field Pack',
    headerIcon: FIELD_PACK_HEADER_ICON,
    headerIconStack: [FIELD_PACK_HEADER_ICON, REMOVE_ADS_HEADER_ICON],
    offerLineText: 'Remove Ads',
    durationText: '24hr',
    rewardStripIconPath: REMOVE_ADS_HEADER_ICON,
    extraRewardRows: [
      { offerLineText: 'Double Coins', durationText: '2hr', coinIconPath: DOUBLE_COINS_REWARD_ICON },
      {
        offerLineText: 'Rapid Harvest',
        durationText: '30m',
        coinIconPath: '/assets/icons/upgrades/icon_harvestspeed.png',
        coinIconScale: 0.95,
      },
    ],
    iapBoostGrants: [
      { offerId: REMOVE_ADS_OFFER_ID, durationMs: 24 * 60 * 60 * 1000, icon: REMOVE_ADS_HEADER_ICON },
      { offerId: DOUBLE_COINS_OFFER_ID, durationMs: 2 * 60 * 60 * 1000, icon: DOUBLE_COINS_REWARD_ICON },
      {
        offerId: 'rapid_harvest',
        durationMs: 30 * 60 * 1000,
        icon: '/assets/icons/upgrades/icon_harvestspeed.png',
      },
    ],
    priceLabel: '$9.99',
    originalPriceLabel: '$49.99',
    valueCalloutText: 'Limited Offer',
    limitedOfferCountdownStorageKey: STORE_FIELD_PACK_COUNTDOWN_END_MS_KEY,
    limitedOfferCountdownDurationMs: 24 * 60 * 60 * 1000,
  },
  {
    ...STORE_COIN_OFFERS[1],
    id: 'store_bundle_harvesters_pack',
    title: "Farmer's Pack",
    headerIcon: HARVESTER_PACK_HEADER_ICON,
    headerIconStack: [HARVESTER_PACK_HEADER_ICON, REMOVE_ADS_HEADER_ICON],
    offerLineText: 'Remove Ads',
    durationText: '7d',
    rewardStripIconPath: REMOVE_ADS_HEADER_ICON,
    extraRewardRows: [
      { offerLineText: 'Double Coins', durationText: '24hr', coinIconPath: DOUBLE_COINS_REWARD_ICON },
      {
        offerLineText: 'Rapid Seeds',
        durationText: '2hr',
        coinIconPath: '/assets/icons/upgrades/icon_seedproduction.png',
        coinIconScale: 0.95,
      },
    ],
    iapBoostGrants: [
      { offerId: REMOVE_ADS_OFFER_ID, durationMs: 7 * 24 * 60 * 60 * 1000, icon: REMOVE_ADS_HEADER_ICON },
      { offerId: DOUBLE_COINS_OFFER_ID, durationMs: 24 * 60 * 60 * 1000, icon: DOUBLE_COINS_REWARD_ICON },
      {
        offerId: 'rapid_seeds',
        durationMs: 2 * 60 * 60 * 1000,
        icon: '/assets/icons/upgrades/icon_seedproduction.png',
      },
    ],
    priceLabel: '$29.99',
    originalPriceLabel: '$99.99',
    valueCalloutText: 'Best Value',
  },
];

export function readStarterPackPurchased(): boolean {
  try {
    return localStorage.getItem(STORE_STARTER_PACK_PURCHASED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markStarterPackPurchased(): void {
  try {
    localStorage.setItem(STORE_STARTER_PACK_PURCHASED_KEY, '1');
  } catch {
    /* ignore */
  }
}

const STARTER_PACK_BUNDLE = STORE_BUNDLE_OFFERS.find((o) => o.id === STORE_IAP_OFFER_STARTER_PACK_ID);
const FIELD_PACK_BUNDLE = STORE_BUNDLE_OFFERS.find((o) => o.id === STORE_IAP_OFFER_FIELD_PACK_ID);

export function readStarterPackCountdownEndMs(): number | null {
  if (!STARTER_PACK_BUNDLE?.limitedOfferCountdownStorageKey) return null;
  try {
    const raw = localStorage.getItem(STARTER_PACK_BUNDLE.limitedOfferCountdownStorageKey);
    if (raw == null) return null;
    const endMs = parseInt(raw, 10);
    return Number.isFinite(endMs) ? endMs : null;
  } catch {
    return null;
  }
}

/** True after the level-4 unlock popup has been shown (or legacy save already had a countdown). */
export function readStarterPackUnlocked(): boolean {
  try {
    if (localStorage.getItem(STORE_STARTER_PACK_UNLOCKED_KEY) === '1') return true;
  } catch {
    /* ignore */
  }
  return readStarterPackCountdownEndMs() != null;
}

/** Call when the Starter Pack unlock IAP popup is shown; starts the 24h timer once. */
export function markStarterPackUnlocked(): void {
  try {
    localStorage.setItem(STORE_STARTER_PACK_UNLOCKED_KEY, '1');
  } catch {
    /* ignore */
  }
  if (readStarterPackCountdownEndMs() == null) {
    startStarterPackCountdown();
  }
}

export function startStarterPackCountdown(atTimeMs = Date.now()): number {
  const durationMs = resolveIapDurationMs(
    'starter_pack_countdown',
    STARTER_PACK_BUNDLE?.limitedOfferCountdownDurationMs ?? 24 * 60 * 60 * 1000,
  );
  const key = STARTER_PACK_BUNDLE?.limitedOfferCountdownStorageKey ?? STORE_STARTER_PACK_COUNTDOWN_END_MS_KEY;
  const endMs = atTimeMs + durationMs;
  try {
    localStorage.setItem(key, String(endMs));
  } catch {
    /* ignore */
  }
  return endMs;
}

/**
 * Settings → Clear Boosts: bring back Starter Pack in store + farm FB when already unlocked
 * (restarts 24h timer; clears purchased flag so expired/purchased offers can return).
 */
export function restoreStarterPackOfferAfterClearBoosts(): boolean {
  if (!readStarterPackUnlocked()) return false;
  try {
    localStorage.removeItem(STORE_STARTER_PACK_PURCHASED_KEY);
    localStorage.setItem(STORE_STARTER_PACK_UNLOCKED_KEY, '1');
  } catch {
    /* ignore */
  }
  startStarterPackCountdown();
  return true;
}

export function getStarterPackCountdownRemainingMs(atTimeMs = Date.now()): number {
  if (!readStarterPackUnlocked()) return 0;
  const endMs = readStarterPackCountdownEndMs();
  if (endMs == null) return 0;
  return Math.max(0, endMs - atTimeMs);
}

/** Starter pack row in the store (same window as the farm floating button). */
export function isStarterPackStoreRowVisible(atTimeMs = Date.now()): boolean {
  return isStarterPackFloatingButtonVisible(atTimeMs);
}

/** Farm floating button: unlocked, not purchased, countdown still running. */
export function isStarterPackFloatingButtonVisible(atTimeMs = Date.now()): boolean {
  if (!isStoreIapEnabled(STORE_IAP_OFFER_STARTER_PACK_ID)) return false;
  if (readStarterPackPurchased()) return false;
  if (!readStarterPackUnlocked()) return false;
  return getStarterPackCountdownRemainingMs(atTimeMs) > 0;
}

/** @deprecated Use `isStarterPackStoreRowVisible` / `isStarterPackFloatingButtonVisible`. */
export function isStarterPackOfferAvailable(atTimeMs = Date.now()): boolean {
  return isStarterPackFloatingButtonVisible(atTimeMs);
}

export function readFieldPackPurchased(): boolean {
  try {
    return localStorage.getItem(STORE_FIELD_PACK_PURCHASED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markFieldPackPurchased(): void {
  try {
    localStorage.setItem(STORE_FIELD_PACK_PURCHASED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function readFieldPackCountdownEndMs(): number | null {
  if (!FIELD_PACK_BUNDLE?.limitedOfferCountdownStorageKey) return null;
  try {
    const raw = localStorage.getItem(FIELD_PACK_BUNDLE.limitedOfferCountdownStorageKey);
    if (raw == null) return null;
    const endMs = parseInt(raw, 10);
    return Number.isFinite(endMs) ? endMs : null;
  } catch {
    return null;
  }
}

export function readFieldPackUnlocked(): boolean {
  try {
    if (localStorage.getItem(STORE_FIELD_PACK_UNLOCKED_KEY) === '1') return true;
  } catch {
    /* ignore */
  }
  return readFieldPackCountdownEndMs() != null;
}

/** Call when the Field Pack unlock IAP popup is shown; starts its own 24h timer once. */
export function markFieldPackUnlocked(): void {
  try {
    localStorage.setItem(STORE_FIELD_PACK_UNLOCKED_KEY, '1');
  } catch {
    /* ignore */
  }
  if (readFieldPackCountdownEndMs() == null) {
    startFieldPackCountdown();
  }
}

export function startFieldPackCountdown(atTimeMs = Date.now()): number {
  const durationMs = resolveIapDurationMs(
    'field_pack_countdown',
    FIELD_PACK_BUNDLE?.limitedOfferCountdownDurationMs ?? 24 * 60 * 60 * 1000,
  );
  const key = FIELD_PACK_BUNDLE?.limitedOfferCountdownStorageKey ?? STORE_FIELD_PACK_COUNTDOWN_END_MS_KEY;
  const endMs = atTimeMs + durationMs;
  try {
    localStorage.setItem(key, String(endMs));
  } catch {
    /* ignore */
  }
  return endMs;
}

export function restoreFieldPackOfferAfterClearBoosts(): boolean {
  if (!readFieldPackUnlocked()) return false;
  try {
    localStorage.removeItem(STORE_FIELD_PACK_PURCHASED_KEY);
    localStorage.setItem(STORE_FIELD_PACK_UNLOCKED_KEY, '1');
  } catch {
    /* ignore */
  }
  startFieldPackCountdown();
  return true;
}

export function getFieldPackCountdownRemainingMs(atTimeMs = Date.now()): number {
  if (!readFieldPackUnlocked()) return 0;
  const endMs = readFieldPackCountdownEndMs();
  if (endMs == null) return 0;
  return Math.max(0, endMs - atTimeMs);
}

export function isFieldPackStoreRowVisible(atTimeMs = Date.now()): boolean {
  return isFieldPackFloatingButtonVisible(atTimeMs);
}

/** Farm floating button: unlocked, not purchased, Field Pack countdown still running. */
export function isFieldPackFloatingButtonVisible(atTimeMs = Date.now()): boolean {
  if (!isStoreIapEnabled(STORE_IAP_OFFER_FIELD_PACK_ID)) return false;
  if (readFieldPackPurchased()) return false;
  if (!readFieldPackUnlocked()) return false;
  return getFieldPackCountdownRemainingMs(atTimeMs) > 0;
}

/** True for Starter Pack or Field Pack IAP popup chrome (purple limited-offer shell). */
export function isLimitedStarterStyleBundleOfferId(offerId: string): boolean {
  return offerId === STORE_IAP_OFFER_STARTER_PACK_ID || offerId === STORE_IAP_OFFER_FIELD_PACK_ID;
}

export function getVisibleStoreBundleOffers(): StoreBundleOfferConfig[] {
  return STORE_BUNDLE_OFFERS.filter((o) => {
    if (!isStoreIapEnabled(o.id)) return false;
    if (o.id === STORE_IAP_OFFER_STARTER_PACK_ID) return isStarterPackStoreRowVisible();
    if (o.id === STORE_IAP_OFFER_FIELD_PACK_ID) return isFieldPackStoreRowVisible();
    return true;
  });
}

/** Store coin / Remove Ads rows that pass the IAP kill switch. */
export function getVisibleStoreCoinOffers(): StoreCoinOfferConfig[] {
  return STORE_COIN_OFFERS.filter((o) => isStoreIapEnabled(o.id));
}
