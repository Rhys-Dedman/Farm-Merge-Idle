/** Player level at which barn Plant Collection UI unlocks (FTUE + shelves). */
export const PLANT_COLLECTION_UI_UNLOCK_LEVEL = 7;

/** Collection FTUE intro bar shows this level on the icon (one below collection unlock). */
export const PLANT_COLLECTION_FTUE_INTRO_DISPLAY_PLAYER_LEVEL =
  PLANT_COLLECTION_UI_UNLOCK_LEVEL - 1;

/** Farm floating buttons (left + right stacks) fade in when the level-up popup reaches this level. */
export const FLOATING_BUTTONS_UNLOCK_LEVEL = 2;

/** Farm floating button: Tasks (no popup yet). */
export const TASKS_FLOATING_BUTTON_UNLOCK_LEVEL = 5;

/** Farm floating button: Gardens (system TBD). */
export const GARDENS_FLOATING_BUTTON_UNLOCK_LEVEL = 10;

/** Set false to hide the Gardens FB in UI while backend unlock logic remains. */
export const GARDENS_FLOATING_BUTTON_UI_VISIBLE = false;

/** On reaching this level, show Starter Pack IAP instead of the level-up popup. */
export const STARTER_PACK_FORCE_POPUP_LEVEL = 4;

/** Wild Growth feature + upgrade row unlock (keep in sync with `CROPS_UNLOCK_LEVELS.wild_growth`). */
export const WILD_GROWTH_UNLOCK_PLAYER_LEVEL = 8;

/** Highest level with a scripted level-up unlock popup (excludes starter-pack level 4). */
export const MAX_LEVEL_WITH_CUSTOM_UNLOCK_POPUP = 12;
