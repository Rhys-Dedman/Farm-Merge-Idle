/**

 * Canonical daily-task template library.

 * Quantities (X) are chosen at roll time — not defined here.

 * Titles are max two words; descriptions match upgrade-popup tone.

 */



export type DailyTaskCatalogCategory =

  | 'seeds'

  | 'merging'

  | 'plants'

  | 'harvest'

  | 'orders'

  | 'upgrades'

  | 'gameplay'

  | 'boosters';



export interface DailyTaskCatalogEntry {

  id: string;

  category: DailyTaskCatalogCategory;

  /** Player-facing title (max two words). */

  title: string;

  /** Short description; use {n} where a quantity is inserted at roll time. */

  description: string;

  /**

   * Pool eligibility notes (not shown to player).

   * luck — needs favorable orders/board state.

   * gate — only if feature unlocked and not maxed.

   */

  notes?: string;

}



/** Official daily-task list — everything else is discarded. */

export const DAILY_TASK_CATALOG: DailyTaskCatalogEntry[] = [

  // Seeds

  {

    id: 'plant_seeds',

    category: 'seeds',

    title: 'Plant Seeds',

    description: 'Produce seeds into the garden.',

  },

  {

    id: 'fill_garden_seeds',

    category: 'seeds',

    title: 'Fill Garden',

    description: 'Plant seeds until every plot you have unlocked has a plant.',

    notes: 'target = unlocked garden cell count at roll time (not a fixed {n})',

  },

  {

    id: 'seed_rush',

    category: 'seeds',

    title: 'Seed Rush',

    description: 'Plant {n} seeds within 5 seconds.',

  },

  // Merging

  {

    id: 'merge_plants',

    category: 'merging',

    title: 'Merge Plants',

    description: 'Merge plants in your garden.',

  },

  {

    id: 'merge_specific_plant',

    category: 'merging',

    title: 'Plant Merge',

    description: 'Merge a specific plant {n} times.',

    notes: 'gate — eligible plant picked at roll; goal icon shown',

  },

  {

    id: 'merge_coins',

    category: 'merging',

    title: 'Merge Coins',

    description: 'Earn {n} coins from merging plants.',

    notes: 'coin target by slot: 150 / 300 / 750',

  },



  // Plants

  {

    id: 'create_specific_plant',

    category: 'plants',

    title: 'Grow Plants',

    description: 'Produce {n} unique {x} plants.',

    notes: 'targets 2/3/5; plant seed+1…highest−1; never same plant twice in a row; skip roll if no alternative',

  },



  // Harvest

  {

    id: 'harvest_crops',

    category: 'harvest',

    title: 'Harvest Crops',

    description: 'Harvest {n} crops from your garden.',

    notes: 'base 10 / 20 / 40 × Crop Yield per harvest at roll',

  },

  {

    id: 'harvest_from_merge',

    category: 'harvest',

    title: 'Merge Harvest',

    description: 'Harvest {n} crops from merging.',

    notes: 'slot targets 5 / 10 / 15; 1 crop per merge-harvest proc',

  },

  {

    id: 'harvest_three_cells',

    category: 'harvest',

    title: 'Multi Harvest',

    description: 'Harvest from 3 different garden cells at once.',

  },

  // Orders

  {

    id: 'complete_orders',

    category: 'orders',

    title: 'Fill Orders',

    description: 'Complete customer orders.',

  },

  {

    id: 'order_rush',

    category: 'orders',

    title: 'Order Rush',

    description: 'Complete 3 orders in under 30 seconds.',

    notes: 'slot 2 only; fixed 3-in-30s target',

  },

  {

    id: 'merge_only_order',

    category: 'orders',

    title: 'Merge Order',

    description: 'Complete orders using only merged plants.',

    notes: 'target = slot (1/2/3 orders); merge-sourced crops only',

  },

  {

    id: 'coin_order',

    category: 'orders',

    title: 'Coin Order',

    description: 'Collect the coin order reward.',

    notes: 'slot 1 only',

  },



  // Upgrades

  {

    id: 'expand_garden_slot',

    category: 'upgrades',

    title: 'Expand Garden',

    description: 'Unlock one more garden plot.',

    notes: 'gate — slot 2 only; locked plots remain',

  },

  {

    id: 'purchase_upgrade',

    category: 'upgrades',

    title: 'Buy Upgrade',

    description: 'Purchase {n} upgrades from any upgrade tab.',

    notes: 'gate — enough unpurchased upgrades remain for slot target',

  },

  {

    id: 'upgrade_harvest_tab',

    category: 'upgrades',

    title: 'Market Upgrade',

    description: 'Buy upgrades in the Market tab.',

    notes: 'gate — enough Market-tab upgrades remain for slot target',

  },

  {

    id: 'upgrade_crops_tab',

    category: 'upgrades',

    title: 'Garden Upgrade',

    description: 'Buy upgrades in the Garden tab.',

    notes: 'gate — enough Garden-tab upgrades remain for slot target',

  },

  {

    id: 'upgrade_seeds_tab',

    category: 'upgrades',

    title: 'Seeds Upgrade',

    description: 'Buy upgrades in the Seeds tab.',

    notes: 'gate — enough Seeds-tab upgrades remain for slot target',

  },



  // Gameplay

  {

    id: 'level_up',

    category: 'gameplay',

    title: 'Level Up',

    description: 'Level up your garden level.',

    notes: 'slot by progress at roll: <35% slot 3, 35–70% slot 2, 70%+ slot 1',

  },

  {

    id: 'playtime_minutes',

    category: 'gameplay',

    title: 'Play Today',

    description: 'Play for {n} minutes today.',

  },

  {

    id: 'collection_upgrade',

    category: 'gameplay',

    title: 'Golden Pot',

    description: 'Upgrade {n} plant in the collection screen to unlock a golden pot.',

    notes: 'gate — slot 3 only; collection unlocked; golden pot purchase available',

  },

  {

    id: 'discover_plant',

    category: 'gameplay',

    title: 'Discover Plant',

    description: 'Discover a new plant in your garden.',

    notes: 'gate — slot 2 only; undiscovered plants remain',

  },



  // Boosters

  {

    id: 'activate_any_booster',

    category: 'boosters',

    title: 'Use Booster',

    description: 'Activate any booster.',

    notes: 'slot 1 only',

  },

  {

    id: 'claim_free_store_offer',

    category: 'boosters',

    title: 'Free Offer',

    description: 'Claim a {free} store offer.',

    notes: 'slot 1 only',

  },

];



/**

 * Core pool — wire first. Same action early/late; only {n} changes per slot.

 * No unlock gates, luck picks, coin targets, or economy-speed skew.

 */

export const DAILY_TASK_CORE_POOL_IDS = [

  'plant_seeds',

  'fill_garden_seeds',

  'seed_rush',

  'merge_plants',

  'complete_orders',

  'playtime_minutes',

  'harvest_three_cells',

] as const;



export const DAILY_TASK_DISCOVERY_POOL_IDS = ['discover_plant'] as const;



export const DAILY_TASK_ORDERS_EXTRA_POOL_IDS = [

  'order_rush',

  'merge_only_order',

  'coin_order',

] as const;



export const DAILY_TASK_MERGING_EXTRA_POOL_IDS = [

  'merge_specific_plant',

  'merge_coins',

] as const;



export const DAILY_TASK_PLANTS_EXTRA_POOL_IDS = ['create_specific_plant'] as const;



export const DAILY_TASK_HARVEST_EXTRA_POOL_IDS = ['harvest_crops', 'harvest_from_merge'] as const;



export const DAILY_TASK_UPGRADE_POOL_IDS = [

  'purchase_upgrade',

  'expand_garden_slot',

  'upgrade_harvest_tab',

  'upgrade_crops_tab',

  'upgrade_seeds_tab',

] as const;



export const DAILY_TASK_GAMEPLAY_EXTRA_POOL_IDS = ['level_up', 'collection_upgrade'] as const;



export const DAILY_TASK_BOOSTER_POOL_IDS = [

  'activate_any_booster',

  'claim_free_store_offer',

] as const;



export type DailyTaskCorePoolId = (typeof DAILY_TASK_CORE_POOL_IDS)[number];

export type DailyTaskDiscoveryPoolId = (typeof DAILY_TASK_DISCOVERY_POOL_IDS)[number];

export type DailyTaskOrdersExtraPoolId = (typeof DAILY_TASK_ORDERS_EXTRA_POOL_IDS)[number];

export type DailyTaskMergingExtraPoolId = (typeof DAILY_TASK_MERGING_EXTRA_POOL_IDS)[number];

export type DailyTaskPlantsExtraPoolId = (typeof DAILY_TASK_PLANTS_EXTRA_POOL_IDS)[number];

export type DailyTaskHarvestExtraPoolId = (typeof DAILY_TASK_HARVEST_EXTRA_POOL_IDS)[number];

export type DailyTaskUpgradePoolId = (typeof DAILY_TASK_UPGRADE_POOL_IDS)[number];

export type DailyTaskGameplayExtraPoolId = (typeof DAILY_TASK_GAMEPLAY_EXTRA_POOL_IDS)[number];

export type DailyTaskBoosterPoolId = (typeof DAILY_TASK_BOOSTER_POOL_IDS)[number];

export type DailyTaskPoolId =

  | DailyTaskCorePoolId

  | DailyTaskDiscoveryPoolId

  | DailyTaskOrdersExtraPoolId

  | DailyTaskMergingExtraPoolId

  | DailyTaskPlantsExtraPoolId

  | DailyTaskHarvestExtraPoolId

  | DailyTaskUpgradePoolId

  | DailyTaskGameplayExtraPoolId

  | DailyTaskBoosterPoolId;



export const DAILY_TASK_ROLL_POOL_IDS: DailyTaskPoolId[] = [

  ...DAILY_TASK_CORE_POOL_IDS,

  ...DAILY_TASK_DISCOVERY_POOL_IDS,

  ...DAILY_TASK_ORDERS_EXTRA_POOL_IDS,

  ...DAILY_TASK_MERGING_EXTRA_POOL_IDS,

  ...DAILY_TASK_PLANTS_EXTRA_POOL_IDS,

  ...DAILY_TASK_HARVEST_EXTRA_POOL_IDS,

  ...DAILY_TASK_UPGRADE_POOL_IDS,

  ...DAILY_TASK_GAMEPLAY_EXTRA_POOL_IDS,

  ...DAILY_TASK_BOOSTER_POOL_IDS,

];



export const DAILY_TASK_CORE_POOL = DAILY_TASK_CORE_POOL_IDS.map(

  (id) => DAILY_TASK_CATALOG.find((e) => e.id === id)!,

);



export const DAILY_TASK_CATALOG_BY_CATEGORY = Object.groupBy

  ? (Object.groupBy(DAILY_TASK_CATALOG, (e) => e.category) as Record<

      DailyTaskCatalogCategory,

      DailyTaskCatalogEntry[]

    >)

  : DAILY_TASK_CATALOG.reduce(

      (acc, entry) => {

        (acc[entry.category] ??= []).push(entry);

        return acc;

      },

      {} as Record<DailyTaskCatalogCategory, DailyTaskCatalogEntry[]>,

    );


