/** Garden picker list — matches Daily Tasks popup list spacing (prescale coordinates). */
import { getNewGardenUnlockCost } from '../utils/remoteConfig';

export const GARDEN_PICKER_LIST_GAP_PX = 18;
export const GARDEN_PICKER_LIST_HORIZONTAL_PAD_PX = 8;

/** Prescale card width — must match `GARDEN_PICKER_PRESCALE_WIDTH_PX` in GardenPickerPopup. */
export const GARDEN_PICKER_PRESCALE_WIDTH_PX = 720;
export const GARDEN_PICKER_CARD_HORIZONTAL_PAD_PX = 40;

/** Panel art (`ui_gardens_unlocked.png`) intrinsic size. */
export const GARDEN_PICKER_PANEL_WIDTH_PX = 710;
export const GARDEN_PICKER_PANEL_HEIGHT_PX = 175;

/** Width available for rows inside card + list padding (equal inset left/right). */
export const GARDEN_PICKER_LIST_INNER_WIDTH_PX =
  GARDEN_PICKER_PRESCALE_WIDTH_PX -
  GARDEN_PICKER_CARD_HORIZONTAL_PAD_PX * 2 -
  GARDEN_PICKER_LIST_HORIZONTAL_PAD_PX * 2;

/** Text block horizontal inset from design left (prescale). */
export const GARDEN_PICKER_TEXT_LEFT_PX = 168;

/** Coin price to purchase the next garden — from remote config. */
export function getGardenPickerPurchaseCoinPrice(): number {
  return getNewGardenUnlockCost();
}

/** @deprecated Prefer `getGardenPickerPurchaseCoinPrice()` — kept for call-site compatibility. */
export const GARDEN_PICKER_PURCHASE_COIN_PRICE = 250_000;

/** Pots progress pill overlay (710×175 design px). */
export const GARDEN_PICKER_POTS_PILL_RIGHT_PX = 48;
export const GARDEN_PICKER_POTS_PILL_WIDTH_PX = 155;
export const GARDEN_PICKER_POTS_PILL_HEIGHT_PX = 80;

/** Uniform scale so 710px art fits the list inner width without changing aspect ratio. */
export const GARDEN_PICKER_PANEL_SCALE =
  GARDEN_PICKER_LIST_INNER_WIDTH_PX / GARDEN_PICKER_PANEL_WIDTH_PX;

export const GARDEN_PICKER_PANEL_RENDER_WIDTH_PX = GARDEN_PICKER_LIST_INNER_WIDTH_PX;
export const GARDEN_PICKER_PANEL_RENDER_HEIGHT_PX =
  GARDEN_PICKER_PANEL_HEIGHT_PX * GARDEN_PICKER_PANEL_SCALE;

/** Scale a coordinate from 710×175 design space into render space. */
export function scaleGardenPickerDesignX(px: number): number {
  return px * GARDEN_PICKER_PANEL_SCALE;
}

export function scaleGardenPickerDesignY(px: number): number {
  return px * GARDEN_PICKER_PANEL_SCALE;
}
