import { DEFAULT_GARDEN_ID, type GardenId } from './gardens';

export type GardenActionButtonChromeTheme = {
  pillGradientTop: string;
  pillGradientBottom: string;
  pillLockedGradientTop: string;
  pillLockedGradientBottom: string;
  pillOutlineColor: string;
  pillTextColor: string;
  /** Circular progress ring fill (recharging). */
  progressRingColor: string;
  /** Progress ring when seed/harvest is ready (flashing state). */
  progressRingFlashColor: string;
  /** Alternate progress ring (white flash variant). */
  progressRingLightColor: string;
  /** Inner circle when recharging (out of charges). Omit to use pill gradient on inner body. */
  bodyGradientTop?: string;
  bodyGradientBottom?: string;
};

/** Garden 1 — locked reference palette for floating buttons + seed/harvest chrome. */
export const GARDEN_1_ACTION_BUTTON_CHROME: GardenActionButtonChromeTheme = {
  pillGradientTop: '#efe5ba',
  pillGradientBottom: '#c1cd67',
  pillLockedGradientTop: '#d9e6c0',
  pillLockedGradientBottom: '#94bf79',
  pillOutlineColor: '#38482f',
  pillTextColor: '#38482f',
  progressRingColor: '#7a9f20',
  progressRingFlashColor: '#87a62f',
  progressRingLightColor: '#9db546',
  bodyGradientTop: '#577641',
  bodyGradientBottom: '#39502e',
};

/** Garden 2 — warm cream/gold gradient with brown outline + label text. */
export const GARDEN_2_ACTION_BUTTON_CHROME: GardenActionButtonChromeTheme = {
  pillGradientTop: '#f9e8b9',
  pillGradientBottom: '#e0c282',
  pillLockedGradientTop: '#f9e8b9',
  pillLockedGradientBottom: '#e0c282',
  pillOutlineColor: '#714f32',
  pillTextColor: '#714f32',
  progressRingColor: '#eaa927',
  progressRingFlashColor: '#eaa927',
  progressRingLightColor: '#eaa927',
  bodyGradientTop: '#aa834b',
  bodyGradientBottom: '#7f5b40',
};

export function getGardenActionButtonChrome(
  gardenId: GardenId = DEFAULT_GARDEN_ID,
): GardenActionButtonChromeTheme {
  return gardenId === 'garden_2' ? GARDEN_2_ACTION_BUTTON_CHROME : GARDEN_1_ACTION_BUTTON_CHROME;
}
