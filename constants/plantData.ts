import { DEFAULT_GARDEN_ID, GARDEN_IDS, type GardenId } from './gardens';
import { getActiveGardenAssetContext } from '../utils/gardenAssets';

export type PlantInfo = { name: string; description: string };

/** Garden 1 plant names and descriptions (discovery popups, daily tasks, barn info, etc.). */
const PLANT_DATA_GARDEN_1: Record<number, PlantInfo> = {
  1: { name: 'Tiny Sprout', description: 'A tiny green shoot just starting out, doing its best to look important.' },
  2: { name: 'Young Sapling', description: 'A small tree in the making that already seems quite proud of itself.' },
  3: { name: 'Wild Fern', description: 'A cheerful tangle of leaves growing in whatever direction feels right today.' },
  4: { name: 'Rosette Succulent', description: 'A neat spiral of sturdy leaves best admired from a respectful distance.' },
  5: { name: 'Little Daisy', description: 'A simple little flower with an open face that\'s always happy to be included.' },
  6: { name: 'Spring Daffodil', description: 'Shows up early every year and behaves like it deserves the credit.' },
  7: { name: 'Fresh Lavender', description: 'Soft little flowers with a gentle scent that quietly spreads whether invited or not.' },
  8: { name: 'Pink Tulip', description: 'A tidy upright bloom that looks like it prefers things done properly.' },
  9: { name: 'Chrysanthemum', description: 'An impressive number of petals with no clear signs of stopping.' },
  10: { name: 'Thorny Rose', description: 'A beautiful bloom that encourages admiration at a sensible distance.' },
  11: { name: 'Cherry Blossom', description: 'Delicate petals that look ready to drift away the moment you get attached.' },
  12: { name: 'Blooming Iris', description: 'Wide elegant petals arranged like they know they turned out well.' },
  13: { name: 'Sacred Lotus', description: 'Perfect layered petals resting peacefully as if the rest of the garden can sort itself out.' },
  14: { name: 'Radiant Sunflower', description: 'A shining bloom that never seems to get tired of being in the spotlight.' },
  15: { name: 'Velvet Geranium', description: 'Clusters of colourful blooms that always seem eager to make an impression.' },
  16: { name: 'Snowy Gardenia', description: 'With a fragrance this strong, it never needs to introduce itself' },
  17: { name: 'Golden Marigold', description: 'A golden flower that never seems to run short on enthusiasm.' },
  18: { name: 'Blue Bellflower', description: 'Soft blue blossoms that dance whenever the wind remembers them.' },
  19: { name: 'Crimson Poppy', description: 'A vibrant flower that believes blending in is a waste of good petals.' },
  20: { name: 'Tree Star', description: 'A rare leafy treat that has remained popular since the age of dinosaurs.' },
};

/** Garden 2 (Fruit Garden) — fruit-themed names and descriptions. */
const PLANT_DATA_GARDEN_2: Record<number, PlantInfo> = {
  ...PLANT_DATA_GARDEN_1,
  1: { name: 'Berry Bush', description: 'A tidy mound of greenery that\'s beginning to discover its colourful side.' },
  2: { name: 'Twin Cherry', description: 'Two cheerful cherries that rarely wander far from one another' },
  3: { name: 'Blueberry', description: 'Tiny blue berries gathered together because adventures are always better in groups.' },
  4: { name: 'Fresh Kiwi', description: 'One of the few fruits that proves appearances can be wonderfully misleading.' },
  5: { name: 'Ruby Apple', description: 'Perfectly content hanging around until gravity offers a gentle suggestion' },
  6: { name: 'Juicy Cantaloupe', description: 'A hefty fruit that believes growing larger is always the correct decision' },
  7: { name: 'Ripe Passionfruit', description: 'A tropical fruit with far more personality than its size would suggest' },
  8: { name: 'Sweet Strawberry', description: 'Always seems to arrive just in time for picnics and sunny afternoons' },
  9: { name: 'Creamy Avocado', description: 'Spends months ripening, then expects everyone to make a decision immediately.' },
  10: { name: 'Royal Fig', description: 'Carries itself with the calm confidence of something that\'s seen countless seasons' },
  11: { name: 'Summer Peach', description: 'Always looks as though it\'s been lightly painted by the afternoon sun' },
  12: { name: 'Tropical Banana', description: 'A familiar favourite that\'s been brightening lunchboxes for generations' },
  13: { name: 'Spiky Rambutan', description: 'Looks like it lost an argument with a hairbrush, but tastes delightful' },
  14: { name: 'Zesty Lemon', description: 'Always seems just a little sour about something' },
  15: { name: 'Island Coconut', description: 'Keeps a tough shell around a surprisingly gentle heart.' },
  16: { name: 'Citrus Orange', description: 'Arrives in tidy little segments that always seem happy to share' },
  17: { name: 'Purple Grapes', description: 'A close-knit family of fruit that rarely leaves anyone behind.' },
  18: { name: 'Giant Watermelon', description: 'Patiently grows larger every day with absolutely no intention of stopping' },
  19: { name: 'Sunny Pineapple', description: 'A fruit that clearly understands the value of a memorable hairstyle' },
  20: { name: 'Dragon Fruit', description: 'Has all the flair of a mythical beast with none of the fire-breathing' },
};

function duplicatePlantData(source: Record<number, PlantInfo>): Record<number, PlantInfo> {
  return { ...source };
}

/** Per-garden plant copy (discovery popups, daily tasks, barn info, etc.). */
export const GARDEN_PLANT_DATA: Record<GardenId, Record<number, PlantInfo>> = {
  garden_1: PLANT_DATA_GARDEN_1,
  garden_2: PLANT_DATA_GARDEN_2,
  garden_3: duplicatePlantData(PLANT_DATA_GARDEN_1),
};

/** @deprecated Use `GARDEN_PLANT_DATA` or `getPlantData(level, gardenId)`. */
export const PLANT_DATA = GARDEN_PLANT_DATA[DEFAULT_GARDEN_ID];

function resolveGardenPlantData(gardenId: GardenId): Record<number, PlantInfo> {
  return GARDEN_PLANT_DATA[gardenId] ?? GARDEN_PLANT_DATA[DEFAULT_GARDEN_ID];
}

export function getPlantData(
  level: number,
  gardenId: GardenId = getActiveGardenAssetContext(),
): PlantInfo {
  const data = resolveGardenPlantData(gardenId);
  return data[level] ?? {
    name: `Plant Lv.${level}`,
    description: 'A mysterious new plant species.',
  };
}

export function getPlantDisplayName(
  level: number,
  gardenId: GardenId = getActiveGardenAssetContext(),
): string {
  return getPlantData(level, gardenId).name;
}

/** All garden ids that have plant copy tables (for tooling / future editors). */
export const GARDEN_PLANT_DATA_IDS: readonly GardenId[] = GARDEN_IDS;
