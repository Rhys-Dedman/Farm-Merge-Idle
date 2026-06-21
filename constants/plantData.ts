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
  16: { name: 'Snowy Gardenia', description: 'An elegant flower that always seems dressed for a formal occasion.' },
  17: { name: 'Golden Marigold', description: 'A golden flower that never seems to run short on enthusiasm.' },
  18: { name: 'Blue Bellflower', description: 'Soft blue blossoms that dance whenever the wind remembers them.' },
  19: { name: 'Crimson Poppy', description: 'A vibrant flower that believes blending in is a waste of good petals.' },
  20: { name: 'Tree Star', description: 'A rare leafy treat that has remained popular since the age of dinosaurs.' },
};

/** Garden 2 (Fruit Garden) — same early tiers as garden 1; top tiers are fruits and vegetables. */
const PLANT_DATA_GARDEN_2: Record<number, PlantInfo> = {
  ...PLANT_DATA_GARDEN_1,
  15: { name: 'Corn Cobb', description: 'Kernels lined up in perfect rows like they practiced beforehand.' },
  16: { name: 'Sweet Strawberry', description: 'Bright little berries that rarely survive long enough to be shared.' },
  17: { name: 'Crunchy Carrot', description: 'Bright orange and pointy, making it a popular choice with snowmen.' },
  18: { name: 'Glossy Eggplant', description: 'A polished fruit that looks like it expects compliments.' },
  19: { name: 'Juicy Tomato', description: 'Round fruits gathering together like they have important things to discuss.' },
  20: { name: 'Sour Lemon', description: 'Bright and beautiful on the outside with a surprisingly bitter attitude.' },
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
