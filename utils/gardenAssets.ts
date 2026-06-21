import { assetPath } from './assetPath';
import {
  DEFAULT_GARDEN_ID,
  type GardenId,
  isGardenId,
  SHIPPED_GARDEN_IDS,
} from '../constants/gardens';
import { MAX_PLANT_TIER } from '../constants/plants';

/** Gardens with farm background + plant + goal art in the build. */
export const GARDENS_WITH_FARM_ART: readonly GardenId[] = ['garden_1', 'garden_2'];

/** UI coin + level icons exist for these ids (garden_3 coins only until level art ships). */
const GARDENS_WITH_COIN_ICONS: readonly GardenId[] = ['garden_1', 'garden_2', 'garden_3'];
const GARDENS_WITH_LEVEL_ICONS: readonly GardenId[] = ['garden_1', 'garden_2'];

let activeGardenId: GardenId = DEFAULT_GARDEN_ID;

export function setActiveGardenAssetContext(gardenId: GardenId): void {
  activeGardenId = gardenId;
}

export function getActiveGardenAssetContext(): GardenId {
  return activeGardenId;
}

/** Farm sprites (bg/plants/goals): use garden_1 when art folder missing (e.g. garden_3). */
export function resolveFarmArtGardenId(gardenId: GardenId): GardenId {
  return GARDENS_WITH_FARM_ART.includes(gardenId) ? gardenId : DEFAULT_GARDEN_ID;
}

const GENERIC_UI_BASE = '/assets/ui/generic';

/** Shared UI chrome (popups, store, FTUE finger, etc.) — not garden-themed. */
export function getGenericUiAssetPath(filename: string): string {
  return assetPath(`${GENERIC_UI_BASE}/${filename}`);
}

/** Per-garden UI sprites (goal slots, etc.) — swaps with active garden. */
export function getGardenUiAssetPath(
  filename: string,
  gardenId: GardenId = activeGardenId,
): string {
  const folder = resolveFarmArtGardenId(gardenId);
  return assetPath(`/assets/ui/${folder}/${filename}`);
}

/** Hex cell sprites — per-garden folder (`/assets/hex/garden_N/`). */
export function resolveHexArtGardenId(gardenId: GardenId = activeGardenId): GardenId {
  return resolveFarmArtGardenId(gardenId);
}

/** Top bar sprites — shared in `generic/` until per-garden topui art ships. */
export function getTopUiAssetPath(
  filename: 'topui_bg.png' | 'topui_gradient.png',
  _gardenId?: GardenId,
): string {
  return getGenericUiAssetPath(filename);
}

export type HexCellSpriteName =
  | 'hexcell_normal'
  | 'hexcell_shadow'
  | 'hexcell_white'
  | 'hexcell_locked'
  | 'hexcell_fertile'
  | 'hexcell_highlight';

export function getHexCellAssetPath(
  name: HexCellSpriteName,
  gardenId: GardenId = activeGardenId,
): string {
  const folder = resolveHexArtGardenId(gardenId);
  return assetPath(`/assets/hex/${folder}/${name}.png`);
}

export function getGoalSlotUiPath(
  filename:
    | 'goal_shadow.png'
    | 'goal_loading.png'
    | 'goal_normal.png'
    | 'goal_yellow.png'
    | 'goal_undiscovered.png'
    | 'goal_cream.png'
    | 'goal_white.png',
  gardenId: GardenId = activeGardenId,
): string {
  return getGardenUiAssetPath(filename, gardenId);
}

function resolveCoinGardenId(gardenId: GardenId): GardenId {
  return GARDENS_WITH_COIN_ICONS.includes(gardenId) ? gardenId : DEFAULT_GARDEN_ID;
}

function resolveLevelGardenId(gardenId: GardenId): GardenId {
  return GARDENS_WITH_LEVEL_ICONS.includes(gardenId) ? gardenId : DEFAULT_GARDEN_ID;
}

function resolveAmbientLeafGardenId(gardenId: GardenId): GardenId {
  if (gardenId === 'garden_2') return 'garden_2';
  return 'garden_1';
}

export type GardenBackgroundPaths = {
  grass: string;
  bottom: string;
  left: string;
  right: string;
  center: string;
  centerTop: string;
  gradient: string;
};

export function getGardenBackgroundPaths(gardenId: GardenId = activeGardenId): GardenBackgroundPaths {
  const folder = resolveFarmArtGardenId(gardenId);
  const base = `/assets/background/${folder}`;
  return {
    grass: `${base}/background_grass.png`,
    bottom: `${base}/background_bottom.png`,
    left: `${base}/background_left.png`,
    right: `${base}/background_right.png`,
    center: `${base}/background_center.png`,
    centerTop: `${base}/background_centertop.png`,
    gradient: `${base}/background_gradient.png`,
  };
}

export function getGardenPlantSpritePath(
  level: number,
  gardenId: GardenId = activeGardenId,
): string {
  const spriteLevel = Math.min(Math.max(1, Math.floor(level)), MAX_PLANT_TIER);
  const folder = resolveFarmArtGardenId(gardenId);
  return assetPath(`/assets/plants/${folder}/plant_${spriteLevel}.png`);
}

export function getGoalIconPathForGarden(
  plantLevel: number,
  gardenId: GardenId = activeGardenId,
): string {
  const tier = Math.max(1, Math.min(MAX_PLANT_TIER, Math.floor(plantLevel)));
  const folder = resolveFarmArtGardenId(gardenId);
  return assetPath(`/assets/icons/goals/${folder}/icon_goal_${tier}.png`);
}

/** Wallet / goal coin icon — `icon_coin_garden_N.png`. */
export function getGardenCoinIconPath(gardenId: GardenId = activeGardenId): string {
  const id = resolveCoinGardenId(gardenId);
  return assetPath(`/assets/icons/coins/icon_coin_${id}.png`);
}

/** Upgrade button / small coin rows — `icon_coin_small_garden_N.png`. */
export function getGardenCoinSmallIconPath(gardenId: GardenId = activeGardenId): string {
  const id = resolveCoinGardenId(gardenId);
  return assetPath(`/assets/icons/coins/icon_coin_small_${id}.png`);
}

/** Player level pill icon — `ui_level_garden_N.png`. */
export function getGardenLevelIconPath(gardenId: GardenId = activeGardenId): string {
  const id = resolveLevelGardenId(gardenId);
  return getGenericUiAssetPath(`ui_level_${id}.png`);
}

/** Farm ambient falling leaves — `particle_leaf_garden_N.png`. */
export function getGardenAmbientLeafSpritePath(gardenId: GardenId = activeGardenId): string {
  const id = resolveAmbientLeafGardenId(gardenId);
  return assetPath(`/assets/vfx/particle_leaf_${id}.png`);
}

export function getSpecialDeliveryPlantLevel(highestPlantEver?: number): number {
  if (highestPlantEver != null && highestPlantEver > 0) {
    return Math.max(1, Math.min(MAX_PLANT_TIER, highestPlantEver - 1));
  }
  return 1;
}

/** Special Delivery offer header — active garden plant at the delivered tier. */
export function getSpecialDeliveryPlantSpritePath(highestPlantEver?: number): string {
  return getGardenPlantSpritePath(getSpecialDeliveryPlantLevel(highestPlantEver));
}

export const PLANT_POT_NORMAL_PATH = '/assets/plants/pots/pot_normal.png';
export const PLANT_POT_GOLD_PATH = '/assets/plants/pots/pot_gold.png';

export function getPlantPotNormalPath(): string {
  return assetPath(PLANT_POT_NORMAL_PATH);
}

export function getPlantPotGoldPath(): string {
  return assetPath(PLANT_POT_GOLD_PATH);
}

export function getGoldenPotWalletIconPath(): string {
  return assetPath('/assets/icons/collection/icon_goldenpot.png');
}

/** Collection milestone reward icon — `icon_collection_<slug>.png`. */
export function getCollectionBonusIconPath(iconSlug: string): string {
  return assetPath(`/assets/icons/collection/icon_collection_${iconSlug}.png`);
}

/** Preload paths for collection bonus milestone icons. */
export function getCollectionBonusIconPreloadPaths(): string[] {
  return [
    'MoreCustomers',
    'DailyAllowance',
    'FruitGarden',
    'DailyRewards',
    'SeedStorage',
    'OfflineBoost',
    'HarvestStorage',
    'ExtraTasks',
    'SeedSpeed',
    'HarvestSpeed',
  ].map((slug) => `/assets/icons/collection/icon_collection_${slug}.png`);
}

export function getNextShippedGardenId(current: GardenId): GardenId {
  const shipped = SHIPPED_GARDEN_IDS.filter(isGardenId);
  const index = shipped.indexOf(current);
  if (index < 0) return shipped[0] ?? DEFAULT_GARDEN_ID;
  return shipped[(index + 1) % shipped.length];
}

/** Preload paths for splash (both shipped gardens + shared pots). */
export function getGardenPreloadAssetPaths(): string[] {
  const paths: string[] = [
    PLANT_POT_NORMAL_PATH,
    '/assets/plants/pots/pot_gold.png',
    '/assets/vfx/particle_leaf_background_shadow.png',
  ];
  for (const gardenId of SHIPPED_GARDEN_IDS) {
    const bg = getGardenBackgroundPaths(gardenId);
    paths.push(
      bg.grass,
      bg.bottom,
      bg.left,
      bg.right,
      bg.center,
      bg.centerTop,
      bg.gradient,
    );
    paths.push(getGardenAmbientLeafSpritePath(gardenId));
    paths.push(
      `/assets/icons/coins/icon_coin_${gardenId}.png`,
      `/assets/icons/coins/icon_coin_small_${gardenId}.png`,
      `${GENERIC_UI_BASE}/ui_level_${gardenId}.png`,
    );
    const artFolder = resolveFarmArtGardenId(gardenId);
    for (let i = 1; i <= MAX_PLANT_TIER; i++) {
      paths.push(`/assets/plants/${artFolder}/plant_${i}.png`);
      paths.push(`/assets/icons/goals/${artFolder}/icon_goal_${i}.png`);
    }
    const hexFolder = resolveHexArtGardenId(gardenId);
    for (const hex of [
      'hexcell_normal',
      'hexcell_shadow',
      'hexcell_white',
      'hexcell_locked',
      'hexcell_fertile',
      'hexcell_highlight',
    ] as const) {
      paths.push(`/assets/hex/${hexFolder}/${hex}.png`);
    }
    for (const goal of [
      'goal_shadow.png',
      'goal_loading.png',
      'goal_normal.png',
      'goal_yellow.png',
      'goal_undiscovered.png',
      'goal_cream.png',
      'goal_white.png',
    ] as const) {
      paths.push(`/assets/ui/${artFolder}/${goal}`);
    }
    paths.push(`${GENERIC_UI_BASE}/topui_bg.png`, `${GENERIC_UI_BASE}/topui_gradient.png`);
  }
  return paths;
}
