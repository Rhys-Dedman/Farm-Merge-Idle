/**
 * Limited offers (watch-ad / boost) config.
 * Used for popup, upgrade panel, and auto-trigger rules.
 */
import type { TabType } from './types';

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
  /** Asset path for header (popup + upgrade panel), e.g. '/assets/icons/icon_seedproduction.png' */
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
export const DOUBLE_COINS_HEADER_ICON = '/assets/icons/icon_coinmultiplier_1.png';

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
    headerIcon: '/assets/icons/icon_seedstorm.png',
    durationMinutes: null,
    upgradeTab: 'SEEDS',
    trigger: 'garden_fill_max_50',
  },
  {
    id: 'rapid_seeds',
    title: 'Rapid Seeds',
    description: 'Super fast seed production speed',
    headerIcon: '/assets/icons/icon_seedproduction.png',
    durationMinutes: null,
    durationSeconds: 90,
    upgradeTab: 'SEEDS',
    trigger: 'wallet_empty',
  },
  {
    id: 'double_harvest',
    title: 'Double Harvest',
    description: 'Get 2x the crops every harvest',
    headerIcon: '/assets/icons/icon_cropvalue.png',
    durationMinutes: null,
    durationSeconds: 120,
    upgradeTab: 'CROPS',
    trigger: 'anytime',
  },
  {
    id: 'special_delivery',
    title: 'Special Delivery',
    description: 'Instantly generate a high level plant',
    headerIcon: '/assets/plants/plant_1.png',
    durationMinutes: null,
    upgradeTab: 'SEEDS',
    trigger: 'anytime',
  },
  {
    id: 'rapid_harvest',
    title: 'Rapid Harvest',
    description: 'Super fast harvest cycle speed',
    headerIcon: '/assets/icons/icon_harvestspeed.png',
    durationMinutes: null,
    durationSeconds: 60,
    upgradeTab: 'CROPS',
    trigger: 'anytime',
  },
  {
    id: 'rush_orders',
    title: 'Rush Orders',
    description: 'Instantly generate new orders',
    headerIcon: '/assets/icons/icon_customerspeed.png',
    durationMinutes: null,
    durationSeconds: 90,
    upgradeTab: 'HARVEST',
    trigger: 'order_speed_not_maxed',
  },
  {
    id: 'happiest_customers',
    title: 'Happiest Customers',
    description: 'All orders will now give 2x coins',
    headerIcon: '/assets/icons/icon_happycustomer.png',
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
];

export function getOfferById(id: string): LimitedOfferConfig | undefined {
  return LIMITED_OFFERS.find((o) => o.id === id);
}

export function hasActiveDoubleCoinsBoost(activeBoosts: ReadonlyArray<{ offerId?: string; endTime?: number }>): boolean {
  const now = Date.now();
  return activeBoosts.some(
    (b) => b.offerId && isCoinMultiplierBoostId(b.offerId) && (b.endTime ?? 0) > now
  );
}

/** Exclude Double Coins from auto / rewarded-ad offer rotation. */
export const LIMITED_OFFERS_AD_POOL = LIMITED_OFFERS.filter((o) => o.id !== DOUBLE_COINS_OFFER_ID);

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
  const pool = STORE_DURATION_FREE_OFFER_IDS.filter((oid) => !exclude.has(oid));
  if (pool.length === 0) return STORE_DURATION_FREE_OFFER_IDS[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Two different offers for the two store slots on first load. */
export function pickInitialStoreFreeOfferSlots(): [string, string] {
  const a = pickStoreDurationOfferId(new Set());
  const b = pickStoreDurationOfferId(new Set([a]));
  return [a, b];
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
  /** Always stacks into the single `double_coins` boost bar entry. */
  boostOfferId: typeof DOUBLE_COINS_OFFER_ID;
  /** Boost length in ms (Collect applies this duration). */
  durationMs: number;
}

export const STORE_COIN_OFFERS: StoreCoinOfferConfig[] = [
  {
    id: 'store_coin_boost',
    title: 'Coin Boost',
    headerIcon: '/assets/icons/icon_coinmultiplier_1.png',
    offerLineText: 'Double Coins',
    durationText: '30m',
    priceLabel: '$5.99',
    boostOfferId: DOUBLE_COINS_OFFER_ID,
    durationMs: 30 * 60 * 1000,
  },
  {
    id: 'store_coin_mega_boost',
    title: 'Coin Mega Boost',
    headerIcon: '/assets/icons/icon_coinmultiplier_2.png',
    offerLineText: 'Double Coins',
    durationText: '2hr',
    priceLabel: '$9.99',
    boostOfferId: DOUBLE_COINS_OFFER_ID,
    durationMs: 2 * 60 * 60 * 1000,
  },
  {
    id: 'store_coin_ultra_boost',
    title: 'Coin Ultra Boost',
    headerIcon: '/assets/icons/icon_coinmultiplier_3.png',
    offerLineText: 'Double Coins',
    durationText: '24hr',
    priceLabel: '$79.99',
    boostOfferId: DOUBLE_COINS_OFFER_ID,
    durationMs: 24 * 60 * 60 * 1000,
  },
];
