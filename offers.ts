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
];

export function getOfferById(id: string): LimitedOfferConfig | undefined {
  return LIMITED_OFFERS.find((o) => o.id === id);
}
